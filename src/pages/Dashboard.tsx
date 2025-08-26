// src/pages/Dashboard.tsx - FIXED
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import NetworkSelector from '@/components/common/NetworkSelector';
import WalletStatus from '@/components/common/WalletStatus';
import TransactionHistory from '@/components/common/TransactionHistory';
import RPCHealthMonitor from '@/components/common/RPCHealthMonitor';
import analytics from '@/services/analytics';

export default function Dashboard() {
  const { 
    connected, 
    connecting, 
    publicKey, 
    balance, 
    network, 
    tokenAccounts,
    transactionHistory 
  } = useSolanaWallet();

  const [pageLoadTime, setPageLoadTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    
    // Track page view
    analytics.pageView('/dashboard', 'Web3Tools Dashboard');
    
    // Track page load time
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    setPageLoadTime(loadTime);
    
    analytics.performanceMetric({
      name: 'dashboard_load_time',
      value: loadTime,
      unit: 'ms',
      metadata: {
        connected,
        network,
        wallet_address: publicKey?.toBase58().slice(0, 8)
      }
    });
  }, [connected, network, publicKey]);

  // Show connecting state
  if (connecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to wallet...</p>
        </div>
      </div>
    );
  }

  // Show disconnected state
  if (!connected) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Web3Tools Dashboard</h1>
            <p className="text-gray-600">Connect your wallet to start using Web3 tools</p>
          </div>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Welcome to Web3Tools</CardTitle>
              <CardDescription className="text-center">
                Your comprehensive toolkit for Solana blockchain operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <strong>Available Tools:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Multi-Sender (Batch SOL & Token transfers)</li>
                    <li>Wallet Creator & Manager</li>
                    <li>Vanity Address Generator</li>
                    <li>Token Creator & Manager</li>
                    <li>Transaction Analytics</li>
                  </ul>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-center text-sm text-gray-500">
                    Click the wallet button in the sidebar to get started
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Connected dashboard
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to your Web3Tools control center
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Connected
          </Badge>
          <Badge variant="secondary">
            {network === 'devnet' ? 'Devnet' : 'Mainnet'}
          </Badge>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Wallet & Network */}
        <div className="space-y-6">
          {/* Network Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Network</CardTitle>
              <CardDescription>
                Switch between Solana networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkSelector />
            </CardContent>
          </Card>

          {/* Wallet Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wallet Status</CardTitle>
              <CardDescription>
                Your current wallet information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletStatus />
            </CardContent>
          </Card>

          {/* RPC Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">RPC Health</CardTitle>
              <CardDescription>
                Network connection status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RPCHealthMonitor />
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Overview Stats */}
        <div className="space-y-6">
          {/* Balance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Balance Overview</CardTitle>
              <CardDescription>
                Your SOL and token balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SOL Balance</span>
                  <span className="font-semibold">{balance.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Token Accounts</span>
                  <span className="font-semibold">{tokenAccounts.length}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    Network: {network}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>
                Common Web3 operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="p-3 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  onClick={() => analytics.trackEvent('quick_action_clicked', { action: 'multi_sender' })}
                >
                  Multi-Sender
                </button>
                <button 
                  className="p-3 text-sm bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                  onClick={() => analytics.trackEvent('quick_action_clicked', { action: 'create_wallet' })}
                >
                  Create Wallet
                </button>
                <button 
                  className="p-3 text-sm bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                  onClick={() => analytics.trackEvent('quick_action_clicked', { action: 'create_token' })}
                >
                  Create Token
                </button>
                <button 
                  className="p-3 text-sm bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                  onClick={() => analytics.trackEvent('quick_action_clicked', { action: 'vanity_address' })}
                >
                  Vanity Address
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
              <CardDescription>
                Dashboard metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Page Load</span>
                  <span className="font-mono">{pageLoadTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Network</span>
                  <span className="font-mono">{network}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Transaction History */}
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <CardDescription>
                Your latest blockchain activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionHistory />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{balance.toFixed(4)}</div>
              <div>SOL Balance</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{tokenAccounts.length}</div>
              <div>Token Accounts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{transactionHistory.length}</div>
              <div>Recent Transactions</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
              </div>
              <div>Wallet Address</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}