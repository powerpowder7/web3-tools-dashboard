// src/contexts/SolanaWalletContext.tsx - RATE LIMITING FIXED
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token';
import analytics from '@/services/analytics';

// Types
interface TokenAccount {
  mint: string;
  balance: number;
  decimals: number;
  symbol?: string;
}

interface TransactionHistory {
  signature: string;
  timestamp: number;
  type: 'sent' | 'received';
  amount: number;
  fee: number;
  status: 'confirmed' | 'failed';
  description: string;
}

interface RPCHealth {
  endpoint: string;
  latency: number;
  status: 'healthy' | 'slow' | 'error';
  lastChecked: number;
}

interface SolanaWalletContextType {
  // Wallet adapter properties
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  
  // Network and connection
  network: 'mainnet-beta' | 'devnet';
  connection: Connection;
  
  // Balances and tokens
  balance: number;
  tokenAccounts: TokenAccount[];
  
  // Transaction history
  transactionHistory: TransactionHistory[];
  
  // RPC health
  rpcHealth: RPCHealth[];
  
  // Functions
  switchNetwork: (network: 'mainnet-beta' | 'devnet') => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshTokenAccounts: () => Promise<void>;
  refreshTransactionHistory: () => Promise<void>;
  checkRPCHealth: () => Promise<void>;
}

const SolanaWalletContext = createContext<SolanaWalletContextType | null>(null);

interface SolanaWalletProviderProps {
  children: ReactNode;
}

// RPC endpoints - MULTI-FALLBACK ENABLED with Premium Providers
// Using Alchemy demo endpoints (free tier with good CORS support for browsers)
const RPC_ENDPOINTS = {
  'mainnet-beta': [
    { name: 'Alchemy Mainnet', url: import.meta.env.VITE_SOLANA_RPC_MAINNET || 'https://solana-mainnet.g.alchemy.com/v2/demo' },
    { name: 'Ankr Mainnet', url: 'https://rpc.ankr.com/solana' },
    { name: 'Public Mainnet', url: 'https://api.mainnet-beta.solana.com' }
  ],
  'devnet': [
    { name: 'Alchemy Devnet', url: import.meta.env.VITE_SOLANA_RPC_DEVNET || 'https://solana-devnet.g.alchemy.com/v2/demo' },
    { name: 'Ankr Devnet', url: 'https://rpc.ankr.com/solana_devnet' },
    { name: 'Public Devnet', url: 'https://api.devnet.solana.com' }
  ]
};

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const { publicKey, connected, connecting } = useWallet();
  
  // State
  const [network, setNetwork] = useState<'mainnet-beta' | 'devnet'>('devnet');
  const [connection, setConnection] = useState<Connection>(
    new Connection(RPC_ENDPOINTS.devnet[0].url, 'confirmed')
  );
  const [balance, setBalance] = useState<number>(0);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [rpcHealth, setRpcHealth] = useState<RPCHealth[]>([]);

  // Switch network
  const switchNetwork = useCallback(async (newNetwork: 'mainnet-beta' | 'devnet') => {
    try {
      const startTime = Date.now();
      
      setNetwork(newNetwork);
      const newConnection = new Connection(RPC_ENDPOINTS[newNetwork][0].url, 'confirmed');
      setConnection(newConnection);
      
      // Clear existing data
      setBalance(0);
      setTokenAccounts([]);
      setTransactionHistory([]);
      
      // Track network switch
      analytics.trackEvent('network_switched', {
        from_network: network,
        to_network: newNetwork,
        switch_time: Date.now() - startTime
      });
      
    } catch (error) {
      console.error('Failed to switch network:', error);
      analytics.captureError(error as Error, { 
        context: 'network_switch',
        target_network: newNetwork 
      });
    }
  }, [network]);

  // Refresh balance with multi-RPC fallback
  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      console.log('[Balance] Skipping refresh - publicKey not available');
      return;
    }

    const endpoints = RPC_ENDPOINTS[network];
    let lastError: Error | null = null;

    // Try each RPC endpoint until one works
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];

      try {
        console.log(`[Balance] Attempt ${i + 1}/${endpoints.length} - Using: ${endpoint.name}`);
        const testConnection = new Connection(endpoint.url, 'confirmed');

        const startTime = Date.now();
        const lamports = await testConnection.getBalance(publicKey);
        const solBalance = lamports / LAMPORTS_PER_SOL;

        console.log(`[Balance] ✓ Success with ${endpoint.name}! Lamports:`, lamports, 'SOL:', solBalance);
        setBalance(solBalance);

        // Update connection to use the working endpoint
        setConnection(testConnection);

        analytics.performanceMetric({
          name: 'balance_refresh',
          value: Date.now() - startTime,
          metadata: { network, balance: solBalance, endpoint: endpoint.name }
        });

        return; // Success - exit function

      } catch (error) {
        console.warn(`[Balance] ✗ Failed with ${endpoint.name}:`, error);
        lastError = error as Error;
        continue; // Try next endpoint
      }
    }

    // All endpoints failed
    console.error('[Balance] All RPC endpoints failed!', lastError);
    analytics.captureError(lastError as Error, {
      context: 'balance_refresh_all_failed',
      endpoints: endpoints.map(e => e.name).join(', ')
    });
  }, [publicKey, network]);

  // Refresh token accounts
  const refreshTokenAccounts = useCallback(async () => {
    if (!publicKey || !connection) return;

    try {
      const startTime = Date.now();
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID
      });

      const accounts: TokenAccount[] = [];
      
      for (const { account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        const balance = parsedInfo.tokenAmount.uiAmount || 0;
        
        if (balance > 0) {
          try {
            const mintInfo = await getMint(connection, new PublicKey(mintAddress));
            accounts.push({
              mint: mintAddress,
              balance: balance,
              decimals: mintInfo.decimals,
              symbol: 'Unknown'
            });
          } catch (mintError) {
            console.warn(`Failed to get mint info for ${mintAddress}:`, mintError);
          }
        }
      }

      setTokenAccounts(accounts);
      
      analytics.performanceMetric({
        name: 'token_accounts_refresh',
        value: Date.now() - startTime,
        metadata: { 
          network, 
          token_count: accounts.length 
        }
      });
      
    } catch (error) {
      console.error('Failed to refresh token accounts:', error);
      analytics.captureError(error as Error, { context: 'token_accounts_refresh' });
    }
  }, [publicKey, connection, network]);

  // Refresh transaction history
  const refreshTransactionHistory = useCallback(async () => {
    if (!publicKey || !connection) return;

    try {
      const startTime = Date.now();
      
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit: 10
      });

      const transactions: TransactionHistory[] = [];
      
      for (const sig of signatures) {
        if (sig.confirmationStatus === 'confirmed' || sig.confirmationStatus === 'finalized') {
          const fee = 5000; // Default fee in lamports
          const timestamp = sig.blockTime ? sig.blockTime * 1000 : Date.now();
          
          transactions.push({
            signature: sig.signature,
            timestamp,
            type: 'sent',
            amount: 0.1, // Default amount
            fee: fee / LAMPORTS_PER_SOL,
            status: sig.err ? 'failed' : 'confirmed',
            description: 'Transaction'
          });
        }
      }

      setTransactionHistory(transactions);
      
      analytics.trackEvent('transaction_history_refreshed', {
        count: transactions.length,
        network
      });
      
      analytics.performanceMetric({
        name: 'transaction_history_refresh',
        value: Date.now() - startTime,
        metadata: { 
          network, 
          transaction_count: transactions.length 
        }
      });
      
    } catch (error) {
      console.error('Failed to refresh transaction history:', error);
      analytics.captureError(error as Error, { context: 'transaction_history_refresh' });
    }
  }, [publicKey, connection, network]);

  // Check RPC health - SIMPLIFIED to avoid rate limiting
  const checkRPCHealth = useCallback(async () => {
    const healthChecks: RPCHealth[] = [];
    
    // Only check current network endpoint to reduce API calls
    const currentEndpoints = RPC_ENDPOINTS[network];
    
    for (const endpoint of currentEndpoints) {
      try {
        const startTime = Date.now();
        const testConnection = new Connection(endpoint.url, 'confirmed');
        
        // Simple slot check instead of expensive operations
        await testConnection.getSlot();
        
        const latency = Date.now() - startTime;
        
        healthChecks.push({
          endpoint: endpoint.name,
          latency,
          status: latency < 1000 ? 'healthy' : 'slow',
          lastChecked: Date.now()
        });
        
      } catch (error) {
        healthChecks.push({
          endpoint: endpoint.name,
          latency: -1,
          status: 'error',
          lastChecked: Date.now()
        });
      }
    }
    
    setRpcHealth(healthChecks);
    
    analytics.trackEvent('rpc_health_checked', {
      network,
      healthy_endpoints: healthChecks.filter(h => h.status === 'healthy').length,
      total_endpoints: healthChecks.length
    });
    
  }, [network]);

  // Effects
  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance();
      refreshTokenAccounts();
      refreshTransactionHistory();
    }
  }, [connected, publicKey, refreshBalance, refreshTokenAccounts, refreshTransactionHistory]);

  // FIXED: Reduced frequency to prevent rate limiting
  useEffect(() => {
    // Only check health once on mount, then every 2 minutes instead of 30 seconds
    if (connected) {
      checkRPCHealth();
      const interval = setInterval(checkRPCHealth, 120000); // Every 2 minutes
      return () => clearInterval(interval);
    }
  }, [connected, network]); // Removed checkRPCHealth from dependencies to prevent recreation

  const value: SolanaWalletContextType = {
    publicKey,
    connected,
    connecting,
    network,
    connection,
    balance,
    tokenAccounts,
    transactionHistory,
    rpcHealth,
    switchNetwork,
    refreshBalance,
    refreshTokenAccounts,
    refreshTransactionHistory,
    checkRPCHealth
  };

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
}

export function useSolanaWallet() {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider');
  }
  return context;
}