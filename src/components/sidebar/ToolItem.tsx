import React from 'react'
import { NavLink } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'

interface Tool {
  name: string
  path: string
  icon: string
  description: string
}

interface ToolItemProps {
  tool: Tool
  networkColor: 'solana' | 'ethereum' | 'polygon' | 'bsc'
  onClick?: () => void
}

export default function ToolItem({ tool, networkColor, onClick }: ToolItemProps) {
  const getActiveClasses = () => {
    switch (networkColor) {
      case 'solana':
        return 'bg-solana/10 border-solana/30 text-solana'
      case 'ethereum':
        return 'bg-ethereum/10 border-ethereum/30 text-ethereum'
      case 'polygon':
        return 'bg-polygon/10 border-polygon/30 text-polygon'
      case 'bsc':
        return 'bg-bsc/10 border-bsc/30 text-bsc'
      default:
        return 'bg-primary/10 border-primary/30 text-primary'
    }
  }

  return (
    <NavLink
      to={tool.path}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-accent/50 hover:border-accent-foreground/20 ${
          isActive 
            ? getActiveClasses()
            : 'border-transparent hover:border-border'
        }`
      }
    >
      <div className="flex items-center space-x-3 min-w-0">
        <span className="text-base flex-shrink-0">{tool.icon}</span>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{tool.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {tool.description}
          </div>
        </div>
      </div>

      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
    </NavLink>
  )
}