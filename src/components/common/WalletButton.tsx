// src/components/common/WalletButton.tsx - COLLAPSIBLE WALLET DETAILS
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, ChevronDown, ChevronUp, Copy, ExternalLink, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import analytics from '@/services/analytics';

const WalletButton = () => {
  const { connected, connecting, publicKey, disconnect, wallet } = useWallet();
  const { balance, network } = useSolanaWallet();
  const [isExpanded, setIsExpanded] = useState(false); // Default collapsed

  const handleCopyAddress = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toBase58());
        analytics.trackEvent('wallet_address_copied', { 
          network,
          source: 'wallet_button'
        });
        
        // Simple success feedback
        alert('Address copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy address:', error);
        analytics.captureError(error as Error, { context: 'copy_address' });
      }
    }
  };

  const handleViewExplorer = () => {
    if (publicKey) {
      const explorerUrl = network === 'devnet' 
        ? `https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=devnet`
        : `https://explorer.solana.com/address/${publicKey.toBase58()}`;
      
      window.open(explorerUrl, '_blank');
      analytics.trackEvent('explorer_viewed', { 
        network,
        source: 'wallet_button',
        address_type: 'wallet'
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      analytics.trackEvent('wallet_disconnect_initiated', { 
        wallet_name: wallet?.adapter?.name,
        network
      });
      
      await disconnect();
      
      analytics.trackEvent('wallet_disconnected', { 
        wallet_name: wallet?.adapter?.name,
        network
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      analytics.captureError(error as Error, { context: 'wallet_disconnect' });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Show connecting state
  if (connecting) {
    return (
      <div className="w-full">
        <Button
          disabled
          className="w-full justify-center"
          variant="outline"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Connecting...
        </Button>
      </div>
    );
  }

  // Show connected state with collapsible details
  if (connected && publicKey) {
    return (
      <div className="w-full space-y-2">
        {/* Collapsible wallet header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-success/10 border border-success/20 rounded-lg p-3 hover:bg-success/15 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <Wallet className="w-4 h-4 text-success" />
              <span className="font-medium text-success text-sm">
                {formatAddress(publicKey.toBase58())}
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-success" />
            ) : (
              <ChevronDown className="w-4 h-4 text-success" />
            )}
          </div>

          {/* Network indicator - always visible */}
          <div className="flex items-center justify-start mt-2">
            <Badge
              variant={network === 'devnet' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {network === 'devnet' ? 'Devnet' : 'Mainnet'}
            </Badge>
          </div>
        </button>

        {/* Expandable wallet details */}
        {isExpanded && (
          <div className="bg-card border border-border rounded-lg p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Wallet Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Wallet</span>
                <span className="font-medium text-foreground">{wallet?.adapter?.name || 'Unknown'}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-medium text-foreground">
                  {typeof balance === 'number' ? `${balance.toFixed(4)} SOL` : 'Loading...'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="text-xs p-2 hover:bg-accent"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewExplorer}
                className="text-xs p-2 hover:bg-accent"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Explorer
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="text-xs p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-3 h-3 mr-1" />
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show connect button (default state)
  return (
    <div className="w-full">
      <WalletMultiButton
        style={{
          backgroundColor: '#3b82f6',
          height: '40px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          width: '100%',
          justifyContent: 'center',
        }}
      />
    </div>
  );
};

export default WalletButton;