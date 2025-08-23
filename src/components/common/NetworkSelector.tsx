// src/components/common/NetworkSelector.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, AlertTriangle, Zap, Wifi } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

export default function NetworkSelector() {
  const { network, switchNetwork, connected } = useSolanaWallet();

  const networks = [
    {
      id: 'devnet' as const,
      name: 'Devnet',
      description: 'Safe testing environment',
      icon: Zap,
      badgeVariant: 'secondary' as const,
      badgeClass: 'bg-green-100 text-green-800 border-green-200',
      recommended: true,
      rpcUrl: 'https://api.devnet.solana.com'
    },
    {
      id: 'mainnet-beta' as const,
      name: 'Mainnet',
      description: 'Live production network',
      icon: Globe,
      badgeVariant: 'destructive' as const,
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
      recommended: false,
      rpcUrl: 'https://api.mainnet-beta.solana.com'
    }
  ];

  const currentNetwork = networks.find(net => net.id === network) || networks[0];

  const handleNetworkSwitch = async (networkId: 'devnet' | 'mainnet-beta') => {
    if (networkId === network) return;

    // Show warning for mainnet
    if (networkId === 'mainnet-beta') {
      const confirmed = window.confirm(
        '⚠️ WARNING: You are switching to Mainnet!\n\n' +
        'This uses real SOL and tokens. Make sure you know what you\'re doing.\n\n' +
        'For testing, we recommend staying on Devnet.\n\n' +
        'Continue to Mainnet?'
      );
      
      if (!confirmed) return;
    }

    try {
      await switchNetwork(networkId);
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Network</h3>
          </div>
          <Badge 
            variant={currentNetwork.badgeVariant}
            className={currentNetwork.badgeClass}
          >
            {network === 'mainnet-beta' ? 'LIVE' : 'TEST'}
          </Badge>
        </div>

        {/* Current Network Display */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 mb-3">
          <currentNetwork.icon className="w-5 h-5" />
          <div className="flex-1">
            <div className="font-medium text-sm">{currentNetwork.name}</div>
            <div className="text-xs text-muted-foreground">{currentNetwork.description}</div>
          </div>
          {connected && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Network Options */}
        <div className="space-y-2">
          {networks.map((net) => {
            const Icon = net.icon;
            const isActive = net.id === network;
            const isMainnet = net.id === 'mainnet-beta';
            
            return (
              <Button
                key={net.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`w-full justify-start h-auto p-3 ${
                  isActive ? 'ring-2 ring-primary/20' : ''
                } ${isMainnet ? 'border-red-200 hover:border-red-300' : ''}`}
                onClick={() => handleNetworkSwitch(net.id)}
                disabled={isActive}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={`w-4 h-4 ${isMainnet ? 'text-red-600' : 'text-green-600'}`} />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {net.name}
                      {net.recommended && (
                        <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                          Recommended
                        </Badge>
                      )}
                      {isMainnet && (
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{net.description}</div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Mainnet Warning */}
        {network === 'mainnet-beta' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-700">
                <p className="font-medium mb-1">Mainnet Active</p>
                <p>You're using real SOL and tokens. Exercise extreme caution with all transactions.</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Network Info */}
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>RPC Endpoint:</span>
            <span className="font-mono text-xs">
              {currentNetwork.rpcUrl.split('//')[1]}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`flex items-center gap-1 ${
              connected ? 'text-green-600' : 'text-gray-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                connected ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}