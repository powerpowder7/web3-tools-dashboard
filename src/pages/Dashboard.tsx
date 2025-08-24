// src/pages/Dashboard.tsx (Fixed)
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Send, 
  PlusCircle, 
  Search, 
  Coins, 
  Flame,
  Wallet,
  Activity,
  TrendingUp,
  Users
} from 'lucide-react';

// Import Step 3 Components
import NetworkSelector from '@/components/common/NetworkSelector';
import WalletStatus from '@/components/common/WalletStatus';
import TransactionHistory from '@/components/common/TransactionHistory';
import RPCHealthMonitor from '@/components/common/RPCHealthMonitor';

import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

export default function Dashboard() {
  const { connected, network, balance, isLoading } = useSolanaWallet();

  // Dashboard stats
  const stats = [
    {
      title: 'Wallet Status',
      value: connected ? 'Connected' : 'Not Connected',
      icon: Wallet,
      color: connected ? 'text-green-600' : 'text-gray-500',
      bgColor: connected ? 'bg-green-100' : 'bg-gray-100'
    },
    {
      title: 'Network',
      value: network === 'mainnet-beta' ? 'Mainnet' : 'Devnet',
      icon: Activity,
      color: network === 'mainnet-beta' ? 'text-red-600' : 'text-green-600',
      bgColor: network === 'mainnet-beta' ? 'bg-red-100' : 'bg-green-100'
    },
    {
      title: 'SOL Balance',
      value: connected ? (isLoading ? '...' : `${((balance || 0) / 1000000000).toFixed(4)} SOL`) : '0.00 SOL',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Tools Available',
      value: '5 Tools',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  // Available tools
  const tools = [
    {
      name: 'Multi-Sender',
      description: 'Send SOL or tokens to multiple addresses at once',
      icon: Send,
      path: '/solana/multi-sender',
      badge: 'Step 4',
      color: 'border-blue-200 hover:border-blue-300',
      available: false
    },
    {
      name: 'Wallet Creator',
      description: 'Generate multiple Solana wallets for testing',
      icon: PlusCircle,
      path: '/solana/wallet-creator',
      badge: 'Step 5',
      color: 'border-green-200 hover:border-green-300',
      available: false
    },
    {
      name: 'Vanity Generator',
      description: 'Create custom addresses with specific patterns',
      icon: Search,
      path: '/solana/vanity-generator',
      badge: 'Step 5',
      color: 'border-purple-200 hover:border-purple-300',
      available: false
    },
    {
      name: 'Token Creator',
      description: 'Deploy custom SPL tokens on Solana',
      icon: Coins,
      path: '/solana/token-creator',
      badge: 'Step 5',
      color: 'border-orange-200 hover:border-orange-300',
      available: false
    },
    {
      name: 'Token Burner',
      description: 'Permanently destroy tokens from circulation',
      icon: Flame,
      path: '/solana/token-burner',
      badge: 'Step 5',
      color: 'border-red-200 hover:border-red-300',
      available: false
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to Web3Tools - Your comprehensive Solana toolkit
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Step 3: Enhanced Wallet Features
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Step 3: Enhanced Wallet Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Network Selector */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Network Management</h2>
            <NetworkSelector />
          </div>

          {/* Wallet Status */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Wallet Overview</h2>
            <WalletStatus />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Transaction History */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
            <TransactionHistory />
          </div>

          {/* RPC Health Monitor */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Network Health</h2>
            <RPCHealthMonitor />
          </div>
        </div>
      </div>

      {/* Available Tools Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Available Tools</h2>
          <Badge variant="secondary">
            Phase 1: Solana Tools
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Card key={index} className={`transition-colors ${tool.color} ${!tool.available ? 'opacity-75' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className="w-6 h-6" />
                    <Badge 
                      variant={tool.available ? "default" : "outline"}
                      className={tool.available ? "" : "bg-gray-100 text-gray-600"}
                    >
                      {tool.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    variant={tool.available ? "default" : "outline"} 
                    className="w-full"
                    disabled={!tool.available}
                  >
                    {tool.available ? 'Launch Tool' : 'Coming Soon'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Development Status */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Activity className="w-5 h-5 mr-2" />
            Development Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">✅ Step 1: Project Foundation</span>
              <Badge className="bg-green-100 text-green-800">Complete</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">✅ Step 2: Analytics Integration</span>
              <Badge className="bg-green-100 text-green-800">Complete</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">🚀 Step 3: Enhanced Wallet Features</span>
              <Badge className="bg-blue-100 text-blue-800">Current</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">⏳ Step 4: Multi-Sender Tool</span>
              <Badge className="bg-gray-100 text-gray-600">Next</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">⏳ Step 5: Advanced Tools</span>
              <Badge className="bg-gray-100 text-gray-600">Planned</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {connected && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" className="justify-start" disabled>
                <Send className="w-4 h-4 mr-2" />
                Send Transaction
              </Button>
              <Button variant="outline" className="justify-start" disabled>
                <Coins className="w-4 h-4 mr-2" />
                Check Token Balance
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <a href={`https://explorer.solana.com${network === 'devnet' ? '?cluster=devnet' : ''}`} target="_blank" rel="noopener noreferrer">
                  <Activity className="w-4 h-4 mr-2" />
                  View on Explorer
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}