import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { Badge } from '../ui/badge'
import ToolItem from './ToolItem'

interface Tool {
  name: string
  path: string
  icon: string
  description: string
}

interface NetworkSectionProps {
  name: string
  icon: string
  color: 'solana' | 'ethereum' | 'polygon' | 'bsc'
  tools: Tool[]
  defaultOpen?: boolean
  comingSoon?: boolean
  onItemClick?: () => void
}

export default function NetworkSection({
  name,
  icon,
  color,
  tools,
  defaultOpen = false,
  comingSoon = false,
  onItemClick
}: NetworkSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const getColorClasses = () => {
    switch (color) {
      case 'solana':
        return 'text-solana border-solana/20 bg-solana/5'
      case 'ethereum':
        return 'text-ethereum border-ethereum/20 bg-ethereum/5'
      case 'polygon':
        return 'text-polygon border-polygon/20 bg-polygon/5'
      case 'bsc':
        return 'text-bsc border-bsc/20 bg-bsc/5'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent/50 ${getColorClasses()}`}
        disabled={comingSoon}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{icon}</span>
          <div className="text-left">
            <div className="font-medium">{name}</div>
            <div className="text-xs opacity-75">
              {comingSoon ? 'Phase 2' : `${tools.length} tools`}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {comingSoon && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Soon
            </Badge>
          )}
          
          {tools.length > 0 && (
            <>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </div>
      </button>

      {/* Tools List */}
      {isOpen && tools.length > 0 && (
        <div className="space-y-1 pl-4">
          {tools.map((tool) => (
            <ToolItem
              key={tool.path}
              tool={tool}
              networkColor={color}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}

      {/* Coming Soon Message */}
      {isOpen && comingSoon && (
        <div className="pl-4">
          <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Coming Soon</span>
            </div>
            <div className="text-xs">
              {name} tools will be available in Phase 2 of development.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}