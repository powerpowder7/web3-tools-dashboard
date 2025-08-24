// src/components/common/WalletButton.tsx (Fixed)
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, Copy } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

export default function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { network, balance } = useSolanaWallet();

  // Format balance for display
  const formatBalance = (lamports: number | null): string => {
    if (lamports === null || lamports === undefined) return '0.0000';
    return (lamports / 1000000000).toFixed(4);
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toString());
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Disconnect wallet
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  if (!connected || !publicKey) {
    return (
      <div className="wallet-adapter-button-trigger">
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Network Badge */}
      <Badge 
        variant="outline" 
        className={`hidden sm:inline-flex ${
          network === 'mainnet-beta' 
            ? 'bg-red-100 text-red-800 border-red-200' 
            : 'bg-green-100 text-green-800 border-green-200'
        }`}
      >
        {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
      </Badge>

      {/* Balance Display */}
      <div className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-md text-sm">
        <span className="font-medium">{formatBalance(balance)} SOL</span>
      </div>

      {/* Wallet Info Dropdown */}
      <div className="relative group">
        <Button variant="outline" className="flex items-center gap-2 max-w-[200px]">
          <Wallet className="w-4 h-4" />
          <span className="truncate">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </span>
        </Button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="p-3 space-y-3">
            {/* Full Address */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Wallet Address</label>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs bg-slate-50 p-2 rounded flex-1 truncate">
                  {publicKey.toString()}
                </div>
                <Button size="sm" variant="ghost" onClick={copyAddress} className="h-8 w-8 p-0">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Balance */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Balance</label>
              <div className="text-lg font-semibold">
                {formatBalance(balance)} SOL
              </div>
            </div>

            {/* Network */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Network</label>
              <Badge 
                variant="outline" 
                className={`w-fit ${
                  network === 'mainnet-beta' 
                    ? 'bg-red-100 text-red-800 border-red-200' 
                    : 'bg-green-100 text-green-800 border-green-200'
                }`}
              >
                {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
              </Badge>
            </div>

            {/* Disconnect Button */}
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}