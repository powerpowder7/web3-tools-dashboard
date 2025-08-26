// src/components/sidebar/NetworkSection.tsx - FIXED
import React from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import ToolItem from './ToolItem';

// Updated Tool interface to support LucideIcon components
interface Tool {
  name: string;
  path: string;
  icon: LucideIcon; // Changed from string to LucideIcon
  description: string;
  badge: string | null;
}

interface NetworkSectionProps {
  title: string;
  network: string;
  tools: Tool[];
  onNavigate: (path: string, toolName: string) => void;
}

const NetworkSection: React.FC<NetworkSectionProps> = ({
  title,
  network,
  tools,
  onNavigate
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'solana':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'ethereum':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="mb-6">
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${getNetworkColor(network)}`}
      >
        <span className="font-medium text-sm">{title}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Tools List */}
      {isExpanded && (
        <div className="mt-2 space-y-1">
          {tools.map((tool) => (
            <ToolItem
              key={tool.name}
              name={tool.name}
              path={tool.path}
              icon={tool.icon} // Now passes the LucideIcon component
              description={tool.description}
              badge={tool.badge}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkSection;