import React from 'react'
import NetworkSection from './NetworkSection'

interface SidebarProps {
  onItemClick?: () => void
}

export default function Sidebar({ onItemClick }: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-card border-r">
      {/* Header */}
      <div className="flex h-16 items-center justify-center border-b px-4">
        <div className="flex items-center space-x-2">
          <div className="text-xl">🛠️</div>
          <span className="font-semibold">Web3Tools</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto custom-scrollbar p-4">
        <div className="space-y-4">
          {/* Solana Section - Active in Phase 1 */}
          <NetworkSection
            name="Solana"
            icon="🟣"
            color="solana"
            defaultOpen={true}
            tools={[
              { 
                name: 'Multi-Sender', 
                path: '/solana/multi-sender', 
                icon: '↗️',
                description: 'Batch send SOL & tokens'
              },
              { 
                name: 'Wallet Creator', 
                path: '/solana/wallet-creator', 
                icon: '👛',
                description: 'Generate multiple wallets'
              },
              { 
                name: 'Vanity Address', 
                path: '/solana/vanity', 
                icon: '🔍',
                description: 'Custom pattern addresses'
              },
              { 
                name: 'Token Creator', 
                path: '/solana/token-creator', 
                icon: '🪙',
                description: 'Deploy SPL tokens'
              },
              { 
                name: 'Token Burner', 
                path: '/solana/token-burner', 
                icon: '🔥',
                description: 'Permanently remove tokens'
              }
            ]}
            onItemClick={onItemClick}
          />

          {/* EVM Networks - Coming in Phase 2 */}
          <NetworkSection
            name="Ethereum"
            icon="🔶"
            color="ethereum"
            defaultOpen={false}
            tools={[]}
            onItemClick={onItemClick}
            comingSoon={true}
          />

          <NetworkSection
            name="Polygon"
            icon="🟣"
            color="polygon"
            defaultOpen={false}
            tools={[]}
            onItemClick={onItemClick}
            comingSoon={true}
          />

          <NetworkSection
            name="BSC"
            icon="🟡"
            color="bsc"
            defaultOpen={false}
            tools={[]}
            onItemClick={onItemClick}
            comingSoon={true}
          />
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-2">
            Phase 1: Solana Tools
          </div>
          <div className="text-xs text-muted-foreground">
            v1.0.0 • Testnet Only
          </div>
        </div>
      </div>
    </div>
  )
}