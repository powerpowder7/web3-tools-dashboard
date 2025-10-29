// src/components/sidebar/Sidebar.tsx - FIXED TYPES
import React from 'react';
import { X, Home, Send, Wallet, Hash, Coins, BarChart3, Flame, BookOpen, LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import NetworkSection from './NetworkSection';
import WalletButton from '@/components/common/WalletButton';
import { ThemeToggle } from '../theme/ThemeToggle';
import analytics from '@/services/analytics';

// Fixed Props Interface
interface SidebarProps {
  onClose?: () => void;
}

// Updated Tool interface to match what NetworkSection expects
interface Tool {
  name: string;
  path: string;
  icon: LucideIcon; // Use LucideIcon type instead of string
  description: string;
  badge: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();

  const handleNavigation = (path: string, toolName: string) => {
    analytics.trackEvent('navigation', {
      from: location.pathname,
      to: path,
      tool_name: toolName
    });
    
    // Close mobile sidebar if onClose is provided
    if (onClose) {
      onClose();
    }
  };

  const solanaTools: Tool[] = [
    {
      name: 'Multi-Sender',
      path: '/solana/multi-sender',
      icon: Send,
      description: 'Batch send SOL & tokens',
      badge: 'Popular'
    },
    {
      name: 'Wallet Creator',
      path: '/solana/wallet-creator',
      icon: Wallet,
      description: 'Generate new wallets',
      badge: null
    },
    {
      name: 'Vanity Address',
      path: '/solana/vanity-address',
      icon: Hash,
      description: 'Custom address generator',
      badge: null
    },
    {
      name: 'Token Creator',
      path: '/solana/token-creator',
      icon: Coins,
      description: 'Create SPL tokens',
      badge: 'Popular'
    },
    {
      name: 'Token Burner',
      path: '/solana/token-burner',
      icon: Flame,
      description: 'Burn SPL tokens',
      badge: null
    },
    {
      name: 'Tutorials',
      path: '/tutorials',
      icon: BookOpen,
      description: 'Interactive learning guides',
      badge: 'New'
    }
  ];

  const evmTools: Tool[] = [
    {
      name: 'Coming Soon',
      path: '#',
      icon: BarChart3,
      description: 'EVM tools in development',
      badge: 'Soon'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W3</span>
            </div>
            <span className="font-semibold text-foreground">Web3Tools</span>
          </div>
          {/* Close button - only show if onClose is provided (mobile) */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-accent lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="p-4 border-b border-border">
        <WalletButton />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Dashboard */}
          <Link
            to="/"
            onClick={() => handleNavigation('/', 'dashboard')}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors mb-4 ${
              location.pathname === '/'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-foreground hover:bg-accent'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>

          {/* Solana Section */}
          <NetworkSection
            title="Solana Tools"
            network="solana"
            tools={solanaTools}
            onNavigate={handleNavigation}
          />

          {/* EVM Section */}
          <NetworkSection
            title="EVM Tools"
            network="ethereum"
            tools={evmTools}
            onNavigate={handleNavigation}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground px-1">Theme</span>
          <ThemeToggle variant="button" showLabel />
        </div>
        <div className="text-xs text-muted-foreground text-center pt-2">
          <div>Web3Tools v1.0</div>
          <div className="mt-1">Built with ❤️ for Web3</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;