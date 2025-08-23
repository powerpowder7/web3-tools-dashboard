import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import { ExternalLink, RefreshCw, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import analytics from '@/services/analytics';

interface Transaction {
  signature: string;
  timestamp: number;
  type: 'transfer' | 'token_transfer' | 'program_instruction' | 'unknown';
  status: 'confirmed' | 'finalized' | 'failed' | 'pending';
  amount?: number;
  fee: number;
  description: string;
}

const TransactionHistory: React.FC = () => {
  const { publicKey, network, transactionHistory, refreshTransactionHistory } = useSolanaWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!publicKey || isRefreshing) return;

    setIsRefreshing(true);
    analytics.trackEvent('transaction_history_refresh', {
      wallet: publicKey.toString(),
      network
    });

    try {
      await refreshTransactionHistory();
      analytics.trackEvent('transaction_history_refresh_success', {
        wallet: publicKey.toString(),
        network
      });
    } catch (error) {
      console.error('Failed to refresh transaction history:', error);
      analytics.trackError(error as Error, {
        context: 'transaction_history_refresh',
        wallet: publicKey.toString(),
        network
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '';
    return amount > 0.001 ? `${amount.toFixed(4)} SOL` : `${(amount * 1e9).toFixed(0)} lamports`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
      case 'finalized':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
      case 'finalized':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getExplorerUrl = (signature: string) => {
    const baseUrl = network === 'mainnet-beta' 
      ? 'https://explorer.solana.com' 
      : 'https://explorer.solana.com';
    return `${baseUrl}/tx/${signature}${network === 'devnet' ? '?cluster=devnet' : ''}`;
  };

  const handleTransactionClick = (signature: string) => {
    analytics.trackEvent('transaction_explorer_opened', {
      signature,
      network,
      wallet: publicKey?.toString()
    });
    window.open(getExplorerUrl(signature), '_blank', 'noopener,noreferrer');
  };

  if (!publicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Connect your wallet to view transaction history
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Transaction History
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!transactionHistory || transactionHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your recent transactions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactionHistory.map((tx) => (
              <div
                key={tx.signature}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleTransactionClick(tx.signature)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(tx.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {tx.description}
                      </p>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{formatTimestamp(tx.timestamp)}</span>
                      <span>Fee: {formatAmount(tx.fee)}</span>
                      {tx.amount && (
                        <span className="font-mono">{formatAmount(tx.amount)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;