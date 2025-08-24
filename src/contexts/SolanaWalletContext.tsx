// src/contexts/SolanaWalletContext.tsx (Complete with All Required Methods)
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, Transaction, VersionedTransaction, SendOptions } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import analytics from '@/services/analytics';

interface TokenInfo {
  mint: string;
  symbol?: string;
  balance: string;
}

interface TransactionHistoryItem {
  signature: string;
  timestamp: number;
  type: 'sent' | 'received' | 'unknown';
  amount: number;
  fee: number;
  status: 'confirmed' | 'failed' | 'pending';
  description?: string;
}

interface SolanaWalletContextType {
  // Wallet adapter properties
  connected: boolean;
  publicKey: PublicKey | null;
  connecting: boolean;
  
  // Network management
  network: 'devnet' | 'mainnet-beta';
  switchNetwork: (network: 'devnet' | 'mainnet-beta') => Promise<void>;
  
  // Balance and tokens
  balance: number | null;
  tokens: TokenInfo[];
  refreshBalance: () => Promise<void>;
  
  // Transaction history
  transactionHistory: TransactionHistoryItem[];
  refreshTransactionHistory: () => Promise<void>;
  
  // Connection and loading states
  connection: any;
  isLoading: boolean;
  
  // Transaction methods
  sendTransaction: (transaction: Transaction | VersionedTransaction, options?: SendOptions) => Promise<string>;
}

const SolanaWalletContext = createContext<SolanaWalletContextType | null>(null);

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  // Wallet adapter hooks
  const { connection } = useConnection();
  const { publicKey, connected, connecting, sendTransaction: walletSendTransaction } = useWallet();
  
  // State management
  const [network, setNetwork] = useState<'devnet' | 'mainnet-beta'>('devnet');
  const [balance, setBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for intervals
  const balanceIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const historyIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Switch network function
  const switchNetwork = async (newNetwork: 'devnet' | 'mainnet-beta') => {
    try {
      setIsLoading(true);
      
      // Clear existing data
      setBalance(null);
      setTokens([]);
      setTransactionHistory([]);
      
      // Update network
      setNetwork(newNetwork);
      
      // Track network switch
      analytics.networkSwitched(network, newNetwork);
      
      // Refresh data for new network
      if (connected && publicKey) {
        await Promise.all([
          refreshBalance(),
          refreshTransactionHistory()
        ]);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      analytics.captureError(error as Error, { context: 'network_switch' });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh balance and tokens
  const refreshBalance = async () => {
    if (!connected || !publicKey || !connection) return;
    
    try {
      setIsLoading(true);
      
      // Get SOL balance
      const solBalance = await connection.getBalance(publicKey);
      setBalance(solBalance);
      
      // Get SPL token accounts
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID
        });
        
        const tokenInfos: TokenInfo[] = tokenAccounts.value.map(account => {
          const accountData = account.account.data;
          if ('parsed' in accountData) {
            const parsed = accountData.parsed;
            const info = parsed.info;
            return {
              mint: info.mint,
              balance: info.tokenAmount.uiAmountString || '0',
              symbol: undefined // You could fetch this from a token registry
            };
          }
          return {
            mint: 'unknown',
            balance: '0'
          };
        });
        
        setTokens(tokenInfos.filter(token => parseFloat(token.balance) > 0));
      } catch (tokenError) {
        console.warn('Failed to fetch token accounts:', tokenError);
        setTokens([]);
      }
      
      // Track balance refresh
      analytics.performanceMetric({
        name: 'balance_refresh',
        value: Date.now(),
        metadata: { network, publicKey: publicKey.toString().slice(0, 8) }
      });
      
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      analytics.captureError(error as Error, { context: 'balance_refresh' });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh transaction history
  const refreshTransactionHistory = async () => {
    if (!connected || !publicKey || !connection) return;
    
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
      
      const historyItems: TransactionHistoryItem[] = signatures.map(signatureInfo => {
        return {
          signature: signatureInfo.signature,
          timestamp: signatureInfo.blockTime || Date.now() / 1000,
          type: 'unknown' as const,
          amount: 0,
          fee: signatureInfo.fee || 0,
          status: signatureInfo.confirmationStatus === 'confirmed' ? 'confirmed' : 'pending' as const,
          description: signatureInfo.memo || undefined
        };
      });
      
      setTransactionHistory(historyItems);
      
      // Track history refresh
      analytics.track('transaction_history_refreshed', {
        count: historyItems.length,
        network
      });
      
    } catch (error) {
      console.error('Failed to refresh transaction history:', error);
      analytics.captureError(error as Error, { context: 'transaction_history_refresh' });
    }
  };

  // Send transaction wrapper
  const sendTransaction = async (transaction: Transaction | VersionedTransaction, options?: SendOptions): Promise<string> => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      analytics.track('transaction_initiated', { network });
      
      let signature: string;
      
      if (transaction instanceof VersionedTransaction) {
        // Handle versioned transaction
        signature = await walletSendTransaction(transaction, connection, options);
      } else {
        // Handle legacy transaction
        signature = await walletSendTransaction(transaction, connection, options);
      }
      
      analytics.track('transaction_confirmed', { 
        signature: signature.slice(0, 8), 
        network 
      });
      
      return signature;
      
    } catch (error) {
      analytics.track('transaction_failed', { 
        error: (error as Error).message, 
        network 
      });
      throw error;
    }
  };

  // Setup intervals for auto-refresh
  useEffect(() => {
    if (connected && publicKey) {
      // Initial load
      refreshBalance();
      refreshTransactionHistory();
      
      // Setup intervals
      balanceIntervalRef.current = setInterval(refreshBalance, 30000); // Every 30 seconds
      historyIntervalRef.current = setInterval(refreshTransactionHistory, 60000); // Every minute
      
      // Track wallet connection
      analytics.walletConnected('solana', publicKey.toString(), network);
    } else {
      // Clear intervals when disconnected
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
        balanceIntervalRef.current = undefined;
      }
      if (historyIntervalRef.current) {
        clearInterval(historyIntervalRef.current);
        historyIntervalRef.current = undefined;
      }
      
      // Clear state
      setBalance(null);
      setTokens([]);
      setTransactionHistory([]);
      
      if (!connected) {
        analytics.walletDisconnected();
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
      }
      if (historyIntervalRef.current) {
        clearInterval(historyIntervalRef.current);
      }
    };
  }, [connected, publicKey, network]);

  // Context value
  const contextValue: SolanaWalletContextType = {
    connected,
    publicKey,
    connecting,
    network,
    switchNetwork,
    balance,
    tokens,
    refreshBalance,
    transactionHistory,
    refreshTransactionHistory,
    connection,
    isLoading,
    sendTransaction
  };

  return (
    <SolanaWalletContext.Provider value={contextValue}>
      {children}
    </SolanaWalletContext.Provider>
  );
}

// Custom hook to use the Solana wallet context
export const useSolanaWallet = () => {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider');
  }
  return context;
};