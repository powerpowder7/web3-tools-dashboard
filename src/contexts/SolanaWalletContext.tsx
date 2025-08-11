import React, { useMemo } from 'react'
import { clusterApiUrl } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { analytics } from '../services/analytics'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

interface SolanaWalletProviderProps {
  children: React.ReactNode
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  // Network configuration
  const network = WalletAdapterNetwork.Devnet
  
  // RPC endpoint with fallback
  const endpoint = useMemo(() => {
    // Use Helius if available, fallback to default
    const heliusKey = import.meta.env.VITE_HELIUS_API_KEY
    if (heliusKey) {
      return `https://devnet.helius-rpc.com/?api-key=${heliusKey}`
    }
    
    // Fallback to default devnet
    return clusterApiUrl(network)
  }, [network])

  // Wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
    ],
    [network]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect
        onError={(error) => {
          console.error('Wallet error:', error)
          analytics.error('wallet_error', error.message)
        }}
      >
        <WalletModalProvider>
          <WalletConnectionTracker>
            {children}
          </WalletConnectionTracker>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

// Component to track wallet connection events
function WalletConnectionTracker({ children }: { children: React.ReactNode }) {
  const { publicKey, wallet, connected, connecting } = useWallet()
  const { connection } = useConnection()

  React.useEffect(() => {
    if (connected && wallet && publicKey) {
      analytics.walletConnected(wallet.adapter.name, 'solana')
    }
  }, [connected, wallet, publicKey])

  React.useEffect(() => {
    if (!connected && wallet) {
      analytics.walletDisconnected(wallet.adapter.name, 'solana')
    }
  }, [connected, wallet])

  return <>{children}</>
}

// Export hooks for convenience
export { useConnection, useWallet as useSolanaWallet }