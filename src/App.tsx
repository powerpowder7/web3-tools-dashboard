import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from './contexts/WalletProvider'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'

// Solana Pages
import MultiSender from './pages/solana/MultiSender'
import WalletCreator from './pages/solana/WalletCreator'
import VanityAddress from './pages/solana/VanityAddress'
import TokenCreator from './pages/solana/TokenCreator'
import TokenBurner from './pages/solana/TokenBurner'

// Analytics
import { analytics } from './services/analytics'

function App() {
  React.useEffect(() => {
    // Initialize analytics
    analytics.init()
    
    // Track page views
    analytics.track('app_loaded', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })
  }, [])

  return (
    <WalletProvider>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Solana Routes */}
            <Route path="solana/multi-sender" element={<MultiSender />} />
            <Route path="solana/wallet-creator" element={<WalletCreator />} />
            <Route path="solana/vanity" element={<VanityAddress />} />
            <Route path="solana/token-creator" element={<TokenCreator />} />
            <Route path="solana/token-burner" element={<TokenBurner />} />
            
            {/* EVM Routes - Coming in Phase 2 */}
            <Route path="ethereum/*" element={<ComingSoon network="Ethereum" />} />
            <Route path="polygon/*" element={<ComingSoon network="Polygon" />} />
            <Route path="bsc/*" element={<ComingSoon network="BSC" />} />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </div>
    </WalletProvider>
  )
}

// Coming Soon component for future networks
function ComingSoon({ network }: { network: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h2 className="text-2xl font-bold mb-2">{network} Tools Coming Soon</h2>
      <p className="text-muted-foreground mb-4">
        We're working hard to bring you {network} tools in Phase 2
      </p>
      <div className="text-sm text-muted-foreground">
        Currently focusing on Solana tools in Phase 1
      </div>
    </div>
  )
}

export default App