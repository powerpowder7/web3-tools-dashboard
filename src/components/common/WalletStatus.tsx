// src/components/common/WalletStatus.tsx (Fixed)
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  Coins
} from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

export default function WalletStatus() {
  const { 
    connected, 
    publicKey, 
    balance, 
    tokens = [], // Default to empty array
    network,
    refreshBalance,
    isLoading
  } = useSolanaWallet();

  // Format balance for display
  const formatBalance = (lamports: number | null): string => {
    if (lamports === null || lamports === undefined) return '0.0000';
    return (lamports / 1000000000).toFixed(4); // Convert lamports to SOL
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toString());
      // You could add a toast notification here
      console.log('Address copied to clipboard');
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Open in Solana Explorer
  const openInExplorer = () => {
    if (!publicKey) return;
    const baseUrl = network === 'mainnet-beta' 
      ? 'https://explorer.solana.com' 
      : 'https://explorer.solana.com?cluster=devnet';
    window.open(`${baseUrl}/address/${publicKey.toString()}`, '_blank');
  };

  // Refresh wallet data
  const handleRefresh = async () => {
    if (!connected) return;
    try {
      await refreshBalance();
    } catch (error) {
      console.error('Failed to refresh wallet data:', error);
    }
  };

  if (!connected) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-sm mb-2">Wallet Not Connected</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Connect your wallet to see balance and transaction history
            </p>
            <Button size="sm" variant="outline" disabled>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
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
            <Wallet className="w-4 h-4" />
            <span>Wallet Status</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
              Connected
            </Badge>
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
      
      <CardContent className="pt-0 space-y-4">
        {/* Address Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Address</span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={copyAddress}
                className="h-6 px-2"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={openInExplorer}
                className="h-6 px-2"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="font-mono text-xs bg-muted/50 p-2 rounded border break-all">
            {publicKey?.toString() || 'Not available'}
          </div>
        </div>

        {/* Balance Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">SOL Balance</span>
            <Badge variant="outline" className="text-xs">
              {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatBalance(balance)}
            </div>
            <div className="text-sm text-muted-foreground">SOL</div>
            {balance !== null && balance > 0 && (
              <TrendingUp className="w-4 h-4 text-green-500" />
            )}
          </div>
          {(balance === 0 || balance === null) && network === 'devnet' && (
            <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <AlertCircle className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-blue-700">
                <p className="font-medium">Need Devnet SOL?</p>
                <p>Visit the Solana faucet to get free devnet tokens for testing.</p>
              </div>
            </div>
          )}
        </div>

        {/* Token Holdings Section */}
        {tokens && tokens.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Token Holdings</span>
              <Badge variant="secondary" className="text-xs">{tokens.length}</Badge>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tokens.slice(0, 5).map((token, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {token.symbol || 'Unknown Token'}
                    </div>
                    <div className="text-muted-foreground font-mono text-xs truncate">
                      {token.mint?.slice(0, 8)}...{token.mint?.slice(-4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {token.balance || '0.00'}
                    </div>
                  </div>
                </div>
              ))}
              {tokens.length > 5 && (
                <div className="text-center text-xs text-muted-foreground py-1">
                  +{tokens.length - 5} more tokens
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex-1"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={openInExplorer}
            className="flex-1"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Explorer
          </Button>
        </div>

        {/* Network Warning */}
        {network === 'mainnet-beta' && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-red-700">
              <p className="font-medium">Mainnet Warning</p>
              <p>You're viewing a live wallet. All transactions use real SOL.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}