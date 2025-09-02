import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  ChevronDown, 
  Zap, 
  Activity, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  TrendingUp,
  Coins,
  Network,
  HelpCircle,
  X,
  Lightbulb,
  ArrowUpRight
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

// Types for the dashboard
type RpcStatus = 'healthy' | 'slow' | 'error';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

interface WelcomeBannerProps {
  onDismiss: () => void;
  isNewUser: boolean;
}

// Helper functions
const getStatusIcon = (status: RpcStatus) => {
  switch (status) {
    case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'slow': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
    default: return <Activity className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusColor = (status: RpcStatus) => {
  switch (status) {
    case 'healthy': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
    case 'slow': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
    case 'error': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
    default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
  }
};

// Format time helper
const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

// Get SOL price from a free API
const getSOLPriceUSD = async () => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    return data.solana?.usd || 0;
  } catch (error) {
    console.error('Failed to fetch SOL price:', error);
    return 0;
  }
};

// Tooltip component
const Tooltip: React.FC<TooltipProps> = ({ children, content, className = "" }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className={`cursor-help ${className}`}
      >
        {children}
      </div>
      {show && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-black dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black dark:border-t-gray-700"></div>
        </div>
      )}
    </div>
  );
};

// Welcome Banner component
const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onDismiss, isNewUser }) => {
  if (!isNewUser) return null;
  
  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 mb-6">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                Welcome to Web3Tools! 🎉
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Your wallet is connected. Here's what you can do:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Use Multi-Sender to send SOL/tokens to multiple addresses</li>
                <li>• Generate custom vanity addresses with specific patterns</li>
                <li>• Create new wallets in bulk for your projects</li>
              </ul>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component using REAL data from your SolanaWalletContext
const AwardWinningDashboard: React.FC = () => {
  const { connected, publicKey, connecting } = useWallet();
  
  // Get REAL data from your SolanaWalletContext
  const {
    network,
    balance,
    tokenAccounts,
    transactionHistory,
    rpcHealth,
    switchNetwork,
    refreshBalance,
    refreshTokenAccounts,
    refreshTransactionHistory
  } = useSolanaWallet();
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [showRpcDetails, setShowRpcDetails] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [solPriceUSD, setSolPriceUSD] = useState(0);

  // Fetch real SOL price
  useEffect(() => {
    getSOLPriceUSD().then(setSolPriceUSD);
  }, []);

  // New user detection using REAL data
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      const hasVisited = localStorage.getItem(`visited_${walletAddress}`);
      const isEmpty = balance === 0 && tokenAccounts.length === 0;
      const noActivity = transactionHistory.length === 0;
      
      const isNewUser = !hasVisited || (isEmpty && noActivity);
      
      if (isNewUser) {
        setShowWelcome(true);
        localStorage.setItem(`visited_${walletAddress}`, 'true');
      }
    }
  }, [connected, publicKey, balance, tokenAccounts, transactionHistory]);

  const copyAddress = async () => {
    if (!publicKey) return;
    
    try {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleNetworkChange = async (newNetwork: 'mainnet-beta' | 'devnet') => {
    try {
      await switchNetwork(newNetwork);
      // Refresh all data after network switch
      setTimeout(async () => {
        await Promise.all([
          refreshBalance(),
          refreshTokenAccounts(),
          refreshTransactionHistory()
        ]);
      }, 1000);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  // Calculate total USD value using real balance and current price
  const totalUSDValue = balance * solPriceUSD;

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Not connected state
  if (!connected && !connecting) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Web3Tools
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your wallet to access powerful Solana tools
          </p>
          <div className="max-w-md mx-auto bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Available Tools:</h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 text-left">
              <li>• Multi-Sender - Batch SOL/token transfers</li>
              <li>• Wallet Creator - Generate multiple wallets</li>
              <li>• Vanity Address - Custom address patterns</li>
              <li>• Token Creator - Deploy SPL tokens</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Connecting state
  if (connecting) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connecting Wallet...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please check your wallet and approve the connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome to your Web3Tools control center</p>
        </div>
        
        {/* Network Selector - Using REAL network data */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Network:</span>
            <div className="relative">
              <select 
                value={network}
                onChange={(e) => handleNetworkChange(e.target.value as 'mainnet-beta' | 'devnet')}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="devnet">Devnet (Recommended)</option>
                <option value="mainnet-beta">Mainnet</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {network === "mainnet-beta" && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Live Network
            </Badge>
          )}
        </div>
      </div>

      {/* Welcome Banner */}
      <WelcomeBanner isNewUser={showWelcome} onDismiss={() => setShowWelcome(false)} />

      {/* Hero Wallet Section - Using REAL balance data */}
      <Card className="border-2 border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* REAL Balance from your context */}
            <div className="lg:col-span-1">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-2 mb-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Balance</span>
                  <Tooltip content="This shows your actual SOL balance from the blockchain">
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </Tooltip>
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {balance.toFixed(4)} SOL
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400">
                  {solPriceUSD > 0 ? `≈ $${totalUSDValue.toFixed(2)} USD` : 'Loading price...'}
                </div>
              </div>
            </div>

            {/* REAL Wallet Address */}
            <div className="lg:col-span-1">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Wallet Address</div>
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <code className="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border">
                    {publicKey ? formatAddress(publicKey.toString()) : 'Not connected'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAddress}
                    className="h-8"
                    disabled={!publicKey}
                  >
                    {copiedAddress ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {publicKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const explorerUrl = network === 'mainnet-beta' 
                        ? `https://explorer.solana.com/address/${publicKey.toString()}`
                        : `https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`;
                      window.open(explorerUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in Explorer
                  </Button>
                )}
              </div>
            </div>

            {/* Connection Status */}
            <div className="lg:col-span-1">
              <div className="text-center lg:text-right">
                <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Connected</span>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Network: {network === "mainnet-beta" ? "Mainnet" : "Devnet"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* REAL Token Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5" />
                <span>Token Accounts</span>
                <Badge variant="secondary">{tokenAccounts.length + 1}</Badge>
                <Tooltip content="Shows all tokens in your wallet including SOL and SPL tokens from the blockchain">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </Tooltip>
              </div>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </CardTitle>
            <CardDescription>Your SOL and token balances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* SOL Balance (always first) */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">SOL</div>
                    <div className="text-xs text-gray-500">Solana</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {balance.toFixed(4)} SOL
                  </div>
                  <div className="text-xs text-gray-500">
                    {solPriceUSD > 0 ? `$${totalUSDValue.toFixed(2)}` : 'Loading...'}
                  </div>
                </div>
              </div>

              {/* REAL SPL Tokens from your context */}
              {tokenAccounts.map((token, index) => (
                <div key={`${token.mint}-${index}`} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {token.symbol ? token.symbol.charAt(0) : '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {token.symbol || 'Unknown Token'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {token.mint.slice(0, 8)}...{token.mint.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {token.balance.toFixed(Math.min(token.decimals, 6))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {token.symbol || 'SPL Token'}
                    </div>
                  </div>
                </div>
              ))}

              {tokenAccounts.length === 0 && balance === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tokens found</p>
                  <p className="text-sm mt-1">Your token balances will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* REAL RPC Health Monitor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Network className="w-5 h-5" />
                <span>RPC Health Monitor</span>
                <Tooltip content="Shows the status of your connection to Solana network endpoints">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                </Tooltip>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRpcDetails(!showRpcDetails)}
              >
                {showRpcDetails ? 'Hide Details' : 'Show Details'}
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showRpcDetails ? 'rotate-180' : ''}`} />
              </Button>
            </CardTitle>
            <CardDescription>Network connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Current Network Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Current Network</span>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                  {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
                </Badge>
              </div>

              {/* REAL RPC Endpoints from your context */}
              <div className="space-y-2">
                {rpcHealth.map((endpoint, index) => (
                  <div key={`${endpoint.endpoint}-${index}`} className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(endpoint.status)}`}>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(endpoint.status)}
                      <div>
                        <div className="font-medium">{endpoint.endpoint}</div>
                        {showRpcDetails && (
                          <div className="text-xs opacity-75">
                            Last checked: {formatTimeAgo(endpoint.lastChecked)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">
                        {endpoint.latency > 0 ? `${endpoint.latency}ms` : 'N/A'}
                      </div>
                      {showRpcDetails && endpoint.status === 'healthy' && (
                        <div className="text-xs opacity-75">Active</div>
                      )}
                      {showRpcDetails && endpoint.status === 'error' && (
                        <div className="text-xs opacity-75">Connection failed</div>
                      )}
                    </div>
                  </div>
                ))}

                {rpcHealth.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Network className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Checking network status...</p>
                  </div>
                )}
              </div>

              {/* Performance Notice */}
              {rpcHealth.length > 0 && rpcHealth.some(e => e.status !== 'healthy') && (
                <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">Performance Issues Detected</div>
                    <div className="text-yellow-700 dark:text-yellow-300">Some RPC endpoints are experiencing slowdowns. This may affect transaction speed.</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REAL Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Recent Transactions</span>
              <Badge variant="secondary">{transactionHistory.length}</Badge>
              <Tooltip content="Your latest blockchain activity from the Solana network">
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </Tooltip>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (publicKey) {
                  const explorerUrl = network === 'mainnet-beta' 
                    ? `https://explorer.solana.com/address/${publicKey.toString()}`
                    : `https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`;
                  window.open(explorerUrl, '_blank');
                }
              }}
              disabled={!publicKey}
            >
              <Eye className="w-4 h-4 mr-2" />
              View All Transactions
            </Button>
          </CardTitle>
          <CardDescription>Your latest blockchain activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactionHistory.slice(0, 5).map((tx, index) => (
              <div key={`${tx.signature}-${index}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                   onClick={() => {
                     const explorerUrl = network === 'mainnet-beta' 
                       ? `https://explorer.solana.com/tx/${tx.signature}`
                       : `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`;
                     window.open(explorerUrl, '_blank');
                   }}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'received' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    <ArrowUpRight className={`w-4 h-4 ${tx.type === 'received' ? 'rotate-180' : ''}`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white capitalize">{tx.type}</div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(tx.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    tx.type === 'received' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'received' ? '+' : '-'}{tx.amount.toFixed(4)} SOL
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                      {tx.status}
                    </Badge>
                    {tx.fee > 0 && (
                      <span className="text-xs text-gray-500">
                        Fee: {tx.fee.toFixed(6)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {transactionHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent transactions</p>
                <p className="text-sm mt-1">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Educational Hint Card */}
      <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                💡 Pro Tip
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Try the <strong>Multi-Sender</strong> tool to send SOL or tokens to multiple addresses at once. 
                Perfect for airdrops, payments, or team distributions!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AwardWinningDashboard;