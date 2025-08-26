// src/components/common/NetworkSelector.tsx - COMPLETE FILE
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import analytics from '@/services/analytics';

const NetworkSelector = () => {
  const { network, switchNetwork } = useSolanaWallet();

  const handleNetworkSwitch = async (newNetwork: 'mainnet-beta' | 'devnet') => {
    if (network === newNetwork) return;
    
    analytics.trackEvent('network_switch_requested', {
      from: network,
      to: newNetwork
    });
    
    try {
      await switchNetwork(newNetwork);
    } catch (error) {
      console.error('Failed to switch network:', error);
      analytics.captureError(error as Error, { context: 'network_switch' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Select Network</span>
        <Badge variant={network === 'devnet' ? 'default' : 'destructive'} className="text-xs">
          {network === 'devnet' ? 'Testnet' : 'Mainnet'}
        </Badge>
      </div>

      <div className="space-y-2">
        {/* Devnet Option */}
        <Button
          onClick={() => handleNetworkSwitch('devnet')}
          variant={network === 'devnet' ? 'default' : 'outline'}
          className="w-full justify-start h-auto p-4"
        >
          <div className="flex items-center space-x-3">
            <Wifi className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Devnet</div>
              <div className="text-xs text-gray-500">Test network - Safe for development</div>
            </div>
          </div>
        </Button>

        {/* Mainnet Option */}
        <Button
          onClick={() => handleNetworkSwitch('mainnet-beta')}
          variant={network === 'mainnet-beta' ? 'default' : 'outline'}
          className="w-full justify-start h-auto p-4"
        >
          <div className="flex items-center space-x-3">
            <WifiOff className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Mainnet</div>
              <div className="text-xs text-gray-500">Live network - Real SOL transactions</div>
            </div>
          </div>
        </Button>
      </div>

      {/* Warning for Mainnet */}
      {network === 'mainnet-beta' && (
        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-700">
              <p className="font-medium mb-1">Mainnet Active</p>
              <p>You're connected to Mainnet. Real SOL will be used for transactions.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkSelector;