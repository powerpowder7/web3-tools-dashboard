import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, Transaction, VersionedTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import analytics from '@/services/analytics';

// Types
export interface TokenAccount {
  mint: string;
  balance: number;
  decimals: number;
  symbol?: string;
  name?: string;
  logoURI?: string;
}

export interface TransactionHistory {
  signature: string;
  timestamp: number;
  status: 'confirmed' | 'finalized' | 'failed' | 'pending';
  type: 'transfer' | 'token_transfer' | 'program_instruction' | 'unknown';
  amount?: number;
  fee: number;
  description: string;
}

export interface NetworkHealth {
  rpcEndpoint: string;
  status: 'healthy' | 'slow' | 'error';
  latency: number;
  lastChecked: number;
  blockHeight?: number;
}

interface SolanaWalletContextType {
  // Wallet connection info
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  network: 'mainnet-beta' | 'devnet';
  
  // Balance and tokens
  balance: number | null;
  tokenAccounts: TokenAccount[];
  isLoadingBalance: boolean;
  isLoadingTokens: boolean;
  
  // Transaction history
  transactionHistory: TransactionHistory[];
  isLoadingTransactions: boolean;
  
  // Network health
  networkHealth: NetworkHealth | null;
  connection: any; // From @solana/wallet-adapter-react
  
  // Actions
  refreshBalance: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  refreshTransactionHistory: () => Promise<void>;
  sendTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>;
  switchNetwork: (network: 'mainnet-beta' | 'devnet') => Promise<void>;
  
  // Utils
  formatBalance: (balance: number, decimals?: number) => string;
  getExplorerUrl: (signature?: string, address?: string) => string;
}

const SolanaWalletContext = createContext<SolanaWalletContextType | undefined>(undefined);

export const SolanaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { publicKey, connected, connecting, sendTransaction: walletSendTransaction } = useWallet();
  const { connection } = useConnection();
  
  // State
  const [network, setNetwork] = useState<'mainnet-beta' | 'devnet'>('devnet'); // Default to devnet for safety
  const [balance, setBalance] = useState<number | null>(null);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [networkHealth, setNetworkHealth] = useState<NetworkHealth | null>(null);
  
  // Loading states
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
  // Refs for intervals
  const balanceInterval = useRef<NodeJS.Timeout>();
  const healthInterval = useRef<NodeJS.Timeout>();
  
  // Network switching
  const switchNetwork = useCallback(async (newNetwork: 'mainnet-beta' | 'devnet') => {
    try {
      setNetwork(newNetwork);
      
      analytics.trackEvent('network_switched', {
        from: network,
        to: newNetwork,
        wallet_connected: connected.toString()
      });
      
      // Clear existing data when switching networks
      setBalance(null);
      setTokenAccounts([]);
      setTransactionHistory([]);
      setNetworkHealth(null);
      
      // Refresh data after network switch if wallet is connected
      if (connected && publicKey) {
        setTimeout(() => {
          refreshBalance();
          refreshTokens();
          refreshTransactionHistory();
          checkNetworkHealth();
        }, 1000);
      }
    } catch (error) {
      console.error('Network switch failed:', error);
      analytics.trackError(error as Error, {
        context: 'network_switch',
        from_network: network,
        to_network: newNetwork
      });
      throw error;
    }
  }, [network, connected, publicKey]);
  
  // Network health check
  const checkNetworkHealth = useCallback(async () => {
    const startTime = Date.now();
    try {
      const blockHeight = await connection.getBlockHeight();
      const latency = Date.now() - startTime;
      
      const health: NetworkHealth = {
        rpcEndpoint: connection.rpcEndpoint,
        status: latency < 1000 ? 'healthy' : latency < 3000 ? 'slow' : 'error',
        latency,
        lastChecked: Date.now(),
        blockHeight,
      };
      
      setNetworkHealth(health);
      
      analytics.performanceMetric('rpc_latency', {
        latency: latency.toString(),
        endpoint: connection.rpcEndpoint,
        status: health.status,
      });
      
    } catch (error) {
      setNetworkHealth({
        rpcEndpoint: connection.rpcEndpoint,
        status: 'error',
        latency: Date.now() - startTime,
        lastChecked: Date.now(),
      });
      
      analytics.trackError(error as Error, {
        context: 'network_health_check',
        endpoint: connection.rpcEndpoint,
      });
    }
  }, [connection]);
  
  // Refresh SOL balance
  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(null);
      return;
    }
    
    setIsLoadingBalance(true);
    try {
      const lamports = await connection.getBalance(publicKey);
      const solBalance = lamports / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      
      analytics.performanceMetric('balance_fetch', {
        balance: solBalance.toString(),
        address: publicKey.toString(),
        network
      });
      
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      analytics.trackError(error as Error, {
        context: 'balance_fetch',
        address: publicKey.toString(),
        network
      });
    } finally {
      setIsLoadingBalance(false);
    }
  }, [publicKey, connected, connection, network]);
  
  // Refresh token accounts
  const refreshTokens = useCallback(async () => {
    if (!publicKey || !connected) {
      setTokenAccounts([]);
      return;
    }
    
    setIsLoadingTokens(true);
    try {
      const tokenAccountsResponse = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );
      
      const tokens: TokenAccount[] = tokenAccountsResponse.value
        .map(({ account }) => {
          const parsed = account.data.parsed;
          if (parsed?.type === 'account') {
            return {
              mint: parsed.info.mint,
              balance: parsed.info.tokenAmount.uiAmount || 0,
              decimals: parsed.info.tokenAmount.decimals,
            };
          }
          return null;
        })
        .filter((token): token is TokenAccount => token !== null && token.balance > 0);
      
      setTokenAccounts(tokens);
      
      analytics.performanceMetric('tokens_fetch', {
        tokenCount: tokens.length.toString(),
        address: publicKey.toString(),
        network
      });
      
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      analytics.trackError(error as Error, {
        context: 'tokens_fetch',
        address: publicKey.toString(),
        network
      });
    } finally {
      setIsLoadingTokens(false);
    }
  }, [publicKey, connected, connection, network]);
  
  // Refresh transaction history
  const refreshTransactionHistory = useCallback(async () => {
    if (!publicKey || !connected) {
      setTransactionHistory([]);
      return;
    }
    
    setIsLoadingTransactions(true);
    try {
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        { limit: 20 }
      );
      
      const txHistory: TransactionHistory[] = signatures.map(sig => ({
        signature: sig.signature,
        timestamp: sig.blockTime || Date.now() / 1000,
        status: sig.err ? 'failed' : 'confirmed',
        type: 'unknown', // We'll enhance this later with transaction parsing
        fee: sig.fee ? sig.fee / LAMPORTS_PER_SOL : 0,
        description: sig.err ? 'Transaction Failed' : 'Transaction Successful'
      }));
      
      setTransactionHistory(txHistory);
      
      analytics.performanceMetric('transactions_fetch', {
        transactionCount: txHistory.length.toString(),
        address: publicKey.toString(),
        network
      });
      
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      analytics.trackError(error as Error, {
        context: 'transactions_fetch',
        address: publicKey.toString(),
        network
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [publicKey, connected, connection, network]);
  
  // Send transaction with analytics
  const sendTransaction = useCallback(async (transaction: Transaction | VersionedTransaction): Promise<string> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }
    
    const startTime = Date.now();
    
    try {
      analytics.transactionInitiated('custom', network, {
        wallet: publicKey.toString(),
      });
      
      const signature = await walletSendTransaction(transaction, connection);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      const duration = Date.now() - startTime;
      
      if (confirmation.value.err) {
        analytics.transactionFailed('custom', network, signature, confirmation.value.err.toString());
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      analytics.transactionConfirmed('custom', network, signature, {
        duration: duration.toString(),
        wallet: publicKey.toString()
      });
      
      // Refresh data after successful transaction
      setTimeout(() => {
        refreshBalance();
        refreshTokens();
        refreshTransactionHistory();
      }, 2000);
      
      return signature;
      
    } catch (error) {
      analytics.transactionFailed('custom', network, '', (error as Error).message);
      throw error;
    }
  }, [publicKey, walletSendTransaction, connection, network, refreshBalance, refreshTokens, refreshTransactionHistory]);
  
  // Utility functions
  const formatBalance = useCallback((balance: number, decimals: number = 4): string => {
    if (balance === 0) return '0';
    if (balance < 0.0001) return '< 0.0001';
    return balance.toFixed(decimals);
  }, []);
  
  const getExplorerUrl = useCallback((signature?: string, address?: string): string => {
    const baseUrl = 'https://explorer.solana.com';
    const cluster = network === 'devnet' ? '?cluster=devnet' : '';
    
    if (signature) {
      return `${baseUrl}/tx/${signature}${cluster}`;
    }
    if (address) {
      return `${baseUrl}/address/${address}${cluster}`;
    }
    return baseUrl;
  }, [network]);
  
  // Effects
  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance();
      refreshTokens();
      refreshTransactionHistory();
      checkNetworkHealth();
      
      // Set up intervals
      balanceInterval.current = setInterval(refreshBalance, 30000); // Every 30 seconds
      healthInterval.current = setInterval(checkNetworkHealth, 60000); // Every minute
      
    } else {
      setBalance(null);
      setTokenAccounts([]);
      setTransactionHistory([]);
      
      // Clear intervals
      if (balanceInterval.current) clearInterval(balanceInterval.current);
      if (healthInterval.current) clearInterval(healthInterval.current);
    }
    
    return () => {
      if (balanceInterval.current) clearInterval(balanceInterval.current);
      if (healthInterval.current) clearInterval(healthInterval.current);
    };
  }, [connected, publicKey, refreshBalance, refreshTokens, refreshTransactionHistory, checkNetworkHealth]);
  
  const value: SolanaWalletContextType = {
    // Wallet connection info
    publicKey,
    connected,
    connecting,
    network,
    connection,
    
    // Balance and tokens
    balance,
    tokenAccounts,
    isLoadingBalance,
    isLoadingTokens,
    
    // Transaction history
    transactionHistory,
    isLoadingTransactions,
    
    // Network health
    networkHealth,
    
    // Actions
    refreshBalance,
    refreshTokens,
    refreshTransactionHistory,
    sendTransaction,
    switchNetwork,
    
    // Utils
    formatBalance,
    getExplorerUrl,
  };
  
  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
};

export const useSolanaWallet = (): SolanaWalletContextType => {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within SolanaWalletProvider');
  }
  return context;
};