// src/components/common/TransactionHistory.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History, 
  ExternalLink, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface TransactionItem {
  signature: string;
  timestamp: number;
  type: 'sent' | 'received' | 'unknown';
  amount: number;
  fee: number;
  status: 'confirmed' | 'failed' | 'pending';
  description?: string;
}

export default function TransactionHistory() {
  const { 
    connected, 
    transactionHistory, 
    network,
    refreshTransactionHistory,
    isLoading
  } = useSolanaWallet();

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Format SOL amount
  const formatAmount = (lamports: number): string => {
    return (lamports / 1000000000).toFixed(4);
  };

  // Open transaction in explorer
  const openTransaction = (signature: string) => {
    const baseUrl = network === 'mainnet-beta' 
      ? 'https://explorer.solana.com' 
      : 'https://explorer.solana.com?cluster=devnet';
    window.open(`${baseUrl}/tx/${signature}`, '_blank');
  };

  // Refresh transaction history
  const handleRefresh = async () => {
    if (!connected) return;
    try {
      await refreshTransactionHistory();
    } catch (error) {
      console.error('Failed to refresh transaction history:', error);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-600" />;
      case 'pending':
        return <Clock className="w-3 h-3 text-yellow-600 animate-pulse" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-600" />;
    }
  };

  // Get transaction type icon and color
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight className="w-3 h-3 text-red-600" />;
      case 'received':
        return <ArrowDownLeft className="w-3 h-3 text-green-600" />;
      default:
        return <ArrowUpRight className="w-3 h-3 text-gray-600" />;
    }
  };

  if (!connected) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <History className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-sm mb-2">No Transaction History</h3>
            <p className="text-xs text-muted-foreground">
              Connect your wallet to view recent transactions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>Recent Transactions</span>
          </div>
          <div className="flex items-center gap-2">
            {transactionHistory && transactionHistory.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {transactionHistory.length}
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
                <div className="w-16 h-3 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : !transactionHistory || transactionHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <History className="w-8 h-8 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-sm mb-2">No Recent Transactions</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Your transaction history will appear here once you start using the wallet
            </p>
            {network === 'devnet' && (
              <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
                <p>💡 <strong>Tip:</strong> Try getting some devnet SOL from the faucet to start transacting!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {transactionHistory.map((tx) => (
              <div key={tx.signature} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                {/* Transaction Icon */}
                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                  {getTransactionIcon(tx.type)}
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm capitalize">
                      {tx.type === 'sent' ? 'Sent' : tx.type === 'received' ? 'Received' : 'Transaction'}
                    </span>
                    {getStatusIcon(tx.status)}
                    <Badge 
                      variant={tx.status === 'confirmed' ? 'secondary' : tx.status === 'failed' ? 'destructive' : 'outline'}
                      className="text-xs px-1 py-0 h-4"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(tx.timestamp)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {tx.signature.slice(0, 8)}...{tx.signature.slice(-4)}
                    </span>
                  </div>
                  {tx.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {tx.description}
                    </div>
                  )}
                </div>

                {/* Amount and Actions */}
                <div className="text-right flex-shrink-0">
                  <div className={`font-medium text-sm ${
                    tx.type === 'sent' ? 'text-red-600' : tx.type === 'received' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {tx.type === 'sent' ? '-' : tx.type === 'received' ? '+' : ''}
                    {formatAmount(tx.amount)} SOL
                  </div>
                  {tx.fee > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Fee: {formatAmount(tx.fee)} SOL
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openTransaction(tx.signature)}
                    className="h-6 w-6 p-0 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        {transactionHistory && transactionHistory.length > 0 && (
          <div className="pt-3 border-t mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                const baseUrl = network === 'mainnet-beta' 
                  ? 'https://explorer.solana.com' 
                  : 'https://explorer.solana.com?cluster=devnet';
                window.open(`${baseUrl}/address/${connected}`, '_blank');
              }}
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              View All Transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}