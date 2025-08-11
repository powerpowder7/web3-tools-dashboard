import React, { createContext, useContext, useEffect } from 'react'
import { SolanaWalletProvider } from './SolanaWalletContext'
import { analytics } from '../services/analytics'

interface WalletContextType {
  // Will be expanded as we add more networks
  currentNetwork: 'solana' | 'ethereum' | 'polygon' | 'bsc'
  switchNetwork: (network: 'solana' | 'ethereum' | 'polygon' | 'bsc') => void
}

const WalletContext = createContext<WalletContextType>({
  currentNetwork: 'solana',
  switchNetwork: () => {}
})

export function useWallet() {
  return useContext(WalletContext)
}

interface WalletProviderProps {
  children: React.ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [currentNetwork, setCurrentNetwork] = React.useState<'solana' | 'ethereum' | 'polygon' | 'bsc'>('solana')

  const switchNetwork = (network: 'solana' | 'ethereum' | 'polygon' | 'bsc') => {
    setCurrentNetwork(network)
    analytics.track('network_switched', { 
      from: currentNetwork, 
      to: network 
    })
  }

  useEffect(() => {
    // Track initial network
    analytics.track('wallet_provider_initialized', {
      network: currentNetwork
    })
  }, [])

  const contextValue: WalletContextType = {
    currentNetwork,
    switchNetwork
  }

  // For Phase 1, we only wrap with Solana provider
  // In Phase 2, we'll add conditional rendering based on currentNetwork
  return (
    <WalletContext.Provider value={contextValue}>
      <SolanaWalletProvider>
        {children}
      </SolanaWalletProvider>
    </WalletContext.Provider>
  )
}