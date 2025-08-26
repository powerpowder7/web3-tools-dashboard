// src/contexts/WalletProvider.tsx - REMOVE INVALID PROPS
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo, ReactNode, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import analytics from '../services/analytics';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletProviderProps {
  children: ReactNode;
}

// Analytics wrapper component
function WalletAnalytics({ children }: { children: ReactNode }) {
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      analytics.walletConnected({
        wallet_type: 'unknown',
        network: 'devnet',
        address: publicKey.toBase58(),
      });
    } else if (!connected) {
      analytics.walletDisconnected('unknown');
    }
  }, [connected, publicKey]);

  return <>{children}</>;
}

export default function CustomWalletProvider({ children }: WalletProviderProps) {
  // Network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // RPC endpoint
  const endpoint = useMemo(() => {
    if (network === WalletAdapterNetwork.Devnet) {
      return import.meta.env.VITE_HELIUS_RPC_URL_DEVNET || clusterApiUrl(network);
    }
    return import.meta.env.VITE_HELIUS_RPC_URL_MAINNET || clusterApiUrl(network);
  }, [network]);

  // Wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}
      >
        <WalletModalProvider>
          <WalletAnalytics>
            {children}
          </WalletAnalytics>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}