import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useAnalytics } from '@/contexts/AnalyticsProvider';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

const WalletButton = () => {
  const { publicKey, wallet, disconnect, connecting, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { balance } = useSolanaWallet();
  const { trackEvent } = useAnalytics();
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [connectionStartTime, setConnectionStartTime] = useState<number | null>(null);

  // Track wallet connection events
  useEffect(() => {
    if (connecting && !connectionStartTime) {
      setConnectionStartTime(Date.now());
      trackEvent.buttonClicked('connect_wallet', 'header', {
        walletName: wallet?.adapter?.name || 'unknown',
      });
    }

    if (connected && publicKey && wallet && connectionStartTime) {
      const connectionTime = Date.now() - connectionStartTime;
      
      trackEvent.walletConnected({
        wallet: wallet.adapter.name,
        network: 'solana',
        address: publicKey.toString(),
        balance: balance || 0,
        connectionTime: Math.floor(connectionTime / 1000),
      });

      setConnectionStartTime(null);
    }
  }, [connecting, connected, publicKey, wallet, balance, connectionStartTime, trackEvent]);

  const handleConnect = () => {
    try {
      setVisible(true);
      trackEvent.buttonClicked('wallet_modal_open', 'header', {
        currentPage: window.location.pathname,
      });
    } catch (error) {
      trackEvent.error(error as Error, {
        context: 'wallet_connection',
        action: 'open_modal',
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      if (wallet && publicKey) {
        trackEvent.walletDisconnected({
          wallet: wallet.adapter.name,
          network: 'solana',
          address: publicKey.toString(),
          sessionDuration: 0, // Could track actual session duration
        });
      }

      await disconnect();
      
      trackEvent.buttonClicked('disconnect_wallet', 'header', {
        walletName: wallet?.adapter?.name || 'unknown',
      });
    } catch (error) {
      trackEvent.error(error as Error, {
        context: 'wallet_disconnection',
        walletName: wallet?.adapter?.name || 'unknown',
      });
    }
  };

  const handleCopyAddress = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toString());
        trackEvent.buttonClicked('copy_address', 'wallet_button', {
          walletName: wallet?.adapter?.name || 'unknown',
          address: publicKey.toString(),
        });
      } catch (error) {
        trackEvent.error(error as Error, {
          context: 'copy_address',
          walletName: wallet?.adapter?.name || 'unknown',
        });
      }
    }
  };

  const handleViewExplorer = () => {
    if (publicKey) {
      const url = `https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`;
      window.open(url, '_blank');
      
      trackEvent.buttonClicked('view_explorer', 'wallet_button', {
        walletName: wallet?.adapter?.name || 'unknown',
        address: publicKey.toString(),
        explorer: 'solana_explorer',
      });
    }
  };

  const formatAddress = (address: string) => {
    if (showFullAddress) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number | null) => {
    if (balance === null) return '0';
    return balance.toFixed(4);
  };

  if (connecting) {
    return (
      <Button disabled className="gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        Connecting...
      </Button>
    );
  }

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-2">
        {/* Balance display */}
        <Badge variant="secondary" className="hidden sm:flex">
          {formatBalance(balance)} SOL
        </Badge>

        {/* Address display */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullAddress(!showFullAddress)}
            className="font-mono text-sm"
          >
            {formatAddress(publicKey.toString())}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyAddress}
            className="h-8 w-8 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewExplorer}
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {/* Wallet info and disconnect */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Wallet className="h-3 w-3" />
            {wallet?.adapter?.name}
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Disconnect</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={handleConnect} className="gap-2">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
};

export default WalletButton;