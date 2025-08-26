// src/components/common/RPCHealthMonitor.tsx - ARGUMENT TYPE ERROR FIXED
import React from 'react';
import { RefreshCw, Wifi, WifiOff, AlertCircle, Activity, Globe, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import analytics from '@/services/analytics';

const RPCHealthMonitor: React.FC = () => {
  const { 
    rpcHealth, 
    checkRPCHealth,
    network
  } = useSolanaWallet();

  // Check if we have health data
  const endpoints = rpcHealth || [];
  const isChecking = false; // Remove this if not in your context

  const handleRefreshHealth = () => {
    checkRPCHealth();
    analytics.trackEvent('rpc_health_check_manual', { network });
  };

  // Get status display configuration
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          icon: <Wifi className="w-3 h-3 text-green-600" />,
          badge: <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Healthy</Badge>,
          color: 'text-green-600'
        };
      case 'slow':
        return {
          icon: <AlertCircle className="w-3 h-3 text-yellow-600" />,
          badge: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">Slow</Badge>,
          color: 'text-yellow-600'
        };
      case 'error':
      case 'down':
        return {
          icon: <WifiOff className="w-3 h-3 text-red-600" />,
          badge: <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">Error</Badge>,
          color: 'text-red-600'
        };
      case 'checking':
        return {
          icon: <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />,
          badge: <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">Checking</Badge>,
          color: 'text-blue-600'
        };
      default:
        return {
          icon: <Activity className="w-3 h-3 text-gray-600" />,
          badge: <Badge variant="outline" className="text-xs">Unknown</Badge>,
          color: 'text-gray-600'
        };
    }
  };

  // Format latency for display
  const formatLatency = (latency: number): string => {
    if (latency < 0) return 'N/A';
    return `${latency}ms`;
  };

  // Format last checked time
  const formatLastChecked = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get overall health summary
  const getHealthSummary = () => {
    if (endpoints.length === 0) return { status: 'unknown', count: 0 };
    
    const healthyCount = endpoints.filter(e => e.status === 'healthy').length;
    const totalCount = endpoints.length;
    
    if (healthyCount === totalCount) return { status: 'healthy', count: healthyCount };
    if (healthyCount > totalCount / 2) return { status: 'partial', count: healthyCount };
    return { status: 'poor', count: healthyCount };
  };

  const healthSummary = getHealthSummary();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">RPC Health</span>
          <Badge 
            variant={healthSummary.status === 'healthy' || healthSummary.status === 'partial' ? 'default' : 'destructive'}
            className="text-xs capitalize"
          >
            {healthSummary.count}/{endpoints.length} Healthy
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshHealth}
          disabled={isChecking}
          className="p-2 h-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Network Info */}
      <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium">
          Current Network: {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
        </span>
      </div>

      {/* RPC Endpoints */}
      <div className="space-y-2">
        {endpoints.length === 0 ? (
          <div className="text-center py-4">
            <AlertCircle className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <div className="text-sm text-gray-500 mb-1">No RPC data available</div>
            <div className="text-xs text-gray-400">Click refresh to check endpoint health</div>
          </div>
        ) : (
          endpoints.map((endpoint, index) => {
            const statusDisplay = getStatusDisplay(endpoint.status);
            
            return (
              <div key={`${endpoint.endpoint}-${index}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                {/* Status Icon */}
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                  {statusDisplay.icon}
                </div>

                {/* Endpoint Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{endpoint.endpoint}</span>
                    {statusDisplay.badge}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last checked: {formatLastChecked(endpoint.lastChecked)}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="text-right flex-shrink-0">
                  <div className={`font-medium text-sm ${statusDisplay.color}`}>
                    {formatLatency(endpoint.latency)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Performance Tips */}
      {endpoints.some(e => e.status === 'slow' || e.status === 'error') && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700">
              <p className="font-medium mb-1">Performance Issues Detected</p>
              <p>Some RPC endpoints are experiencing slowdowns. This may affect transaction speed.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RPCHealthMonitor;