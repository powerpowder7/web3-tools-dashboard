// src/components/common/TransactionHistory.tsx - PROPERTY FIXES ONLY
import React from 'react';
import { ExternalLink, RefreshCw, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import analytics from '@/services/analytics';

const TransactionHistory: React.FC = () => {
  const { 
    transactionHistory, 
    refreshTransactionHistory,
    network,
    connected,
    // Remove 'isLoading' - not in your context interface
  } = useSolanaWallet();

  const handleRefreshHistory = () => {
    refreshTransactionHistory();
    analytics.trackEvent('transaction_history_refresh_manual', { network });
  };

  const handleViewTransaction = (signature: string) => {
    const explorerUrl = network === 'devnet'
      ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
      : `https://explorer.solana.com/tx/${signature}`;
    
    window.open(explorerUrl, '_blank');
    analytics.trackEvent('transaction_explorer_viewed', { 
      network,
      signature: signature.slice(0, 8)
    });
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'received':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Confirmed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-500 text-sm mb-2">Wallet not connected</div>
        <div className="text-xs text-gray-400">Connect your wallet to view transaction history</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">Recent Transactions</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshHistory}
          className="p-2 h-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {!transactionHistory || transactionHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <div className="text-sm text-gray-500 mb-1">No transactions found</div>
            <div className="text-xs text-gray-400">
              Transactions will appear here after you make some
            </div>
          </div>
        ) : (
          transactionHistory.slice(0, 5).map((transaction) => (
            <div
              key={transaction.signature}
              className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Transaction Icon */}
                <div className="shrink-0">
                  {getTransactionIcon(transaction.type)}
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {transaction.type === 'sent' ? 'Sent' : 
                       transaction.type === 'received' ? 'Received' : 'Transaction'}
                    </span>
                    {getStatusBadge(transaction.status)}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate mr-2">
                      {transaction.signature.slice(0, 8)}...{transaction.signature.slice(-8)}
                    </span>
                    <span className="shrink-0">
                      {formatTimestamp(transaction.timestamp)}
                    </span>
                  </div>
                  
                  {transaction.description && (
                    <div className="text-xs text-gray-400 mt-1 truncate">
                      {transaction.description}
                    </div>
                  )}
                </div>

                {/* Amount & Fee */}
                <div className="text-right shrink-0">
                  <div className={`text-sm font-medium ${
                    transaction.type === 'sent' ? 'text-red-600' : 
                    transaction.type === 'received' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {transaction.type === 'sent' && '-'}
                    {transaction.type === 'received' && '+'}
                    {transaction.amount.toFixed(4)} SOL
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    Fee: {transaction.fee.toFixed(6)} SOL
                  </div>
                </div>
              </div>

              {/* Explorer Link */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewTransaction(transaction.signature)}
                className="ml-2 p-1 h-auto shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Show More Link */}
      {transactionHistory && transactionHistory.length > 5 && (
        <div className="text-center pt-2">
          <Button
            variant="link"
            size="sm"
            onClick={() => analytics.trackEvent('view_all_transactions_clicked', { network })}
            className="text-xs text-blue-600"
          >
            View all {transactionHistory.length} transactions
          </Button>
        </div>
      )}

      {/* Network Info */}
      <div className="text-xs text-gray-400 text-center pt-2 border-t">
        Showing recent transactions on {network === 'devnet' ? 'Devnet' : 'Mainnet'}
      </div>
    </div>
  );
};

export default TransactionHistory;