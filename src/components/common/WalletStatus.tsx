// src/components/common/WalletStatus.tsx - PROPERTY FIXES ONLY
import React from 'react';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import analytics from '@/services/analytics';

const WalletStatus: React.FC = () => {
  const { 
    connected, 
    publicKey, 
    balance, 
    network, 
    refreshBalance,
    tokenAccounts, // Change from 'tokens' to 'tokenAccounts'
    // Remove 'isLoading' - not in your context interface
  } = useSolanaWallet();

  const handleCopyAddress = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toBase58());
        analytics.trackEvent('wallet_address_copied', { network });
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  const handleRefreshBalance = () => {
    refreshBalance();
    analytics.trackEvent('balance_refresh_manual', { network });
  };

  const handleViewExplorer = () => {
    if (publicKey) {
      const explorerUrl = network === 'devnet' 
        ? `https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`
        : `https://explorer.solana.com/address/${publicKey.toBase58()}`;
      
      window.open(explorerUrl, '_blank');
      analytics.trackEvent('explorer_viewed', { 
        network,
        address_type: 'wallet'
      });
    }
  };

  if (!connected || !publicKey) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-500 text-sm mb-2">Wallet not connected</div>
        <div className="text-xs text-gray-400">Connect your wallet to view status</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Address */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Wallet Address</label>
          <Badge variant={network === 'devnet' ? 'default' : 'destructive'} className="text-xs">
            {network === 'devnet' ? 'Devnet' : 'Mainnet'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm font-mono text-gray-600 truncate">
            {publicKey.toBase58()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAddress}
            className="shrink-0"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Balance Information */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">SOL Balance</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshBalance}
            className="p-1 h-auto"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {balance !== null ? balance.toFixed(4) : '-.----'}
                <span className="text-lg font-medium text-gray-600 ml-1">SOL</span>
              </div>
              {balance !== null && (
                <div className="text-xs text-gray-500 mt-1">
                  ≈ ${(balance * 20).toFixed(2)} USD
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Network</div>
              <div className="text-sm font-medium text-gray-700 capitalize">
                {network}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token Accounts */}
      {tokenAccounts && tokenAccounts.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Token Accounts</label>
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="text-sm text-gray-600">
              {tokenAccounts.length} token account{tokenAccounts.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="pt-3 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewExplorer}
            className="flex-1 text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Explorer
          </Button>
        </div>
      </div>

      {/* Network Warning for Mainnet */}
      {network === 'mainnet-beta' && (
        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
          <div className="text-xs font-medium text-orange-800 mb-1">⚠️ Mainnet Warning</div>
          <div className="text-xs text-orange-700">
            You're connected to Mainnet. Real SOL will be used for transactions.
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletStatus;