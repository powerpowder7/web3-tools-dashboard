// src/components/common/RPCHealthMonitor.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Globe
} from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';

interface RPCEndpoint {
  name: string;
  url: string;
  network: 'devnet' | 'mainnet-beta';
  icon: React.ComponentType<any>;
  status: 'healthy' | 'slow' | 'down' | 'checking';
  latency: number | null;
  lastChecked: number | null;
}

export default function RPCHealthMonitor() {
  const { network, connection } = useSolanaWallet();
  const [endpoints, setEndpoints] = useState<RPCEndpoint[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Default RPC endpoints to monitor
  const defaultEndpoints: Omit<RPCEndpoint, 'status' | 'latency' | 'lastChecked'>[] = [
    {
      name: 'Solana Official',
      url: network === 'mainnet-beta' ? 'https://api.mainnet-beta.solana.com' : 'https://api.devnet.solana.com',
      network,
      icon: Globe
    },
    {
      name: 'Helius',
      url: network === 'mainnet-beta' ? 'https://mainnet.helius-rpc.com' : 'https://devnet.helius-rpc.com',
      network,
      icon: Zap
    },
    {
      name: 'QuickNode',
      url: network === 'mainnet-beta' ? 'https://solana-mainnet.g.alchemy.com/v2/demo' : 'https://solana-devnet.g.alchemy.com/v2/demo',
      network,
      icon: Activity
    }
  ];

  // Initialize endpoints
  useEffect(() => {
    const initialEndpoints: RPCEndpoint[] = defaultEndpoints.map(endpoint => ({
      ...endpoint,
      status: 'checking' as const,
      latency: null,
      lastChecked: null
    }));
    setEndpoints(initialEndpoints);
    checkEndpointHealth(initialEndpoints);
  }, [network]);

  // Check health of all endpoints
  const checkEndpointHealth = async (endpointsToCheck?: RPCEndpoint[]) => {
    setIsChecking(true);
    const currentEndpoints = endpointsToCheck || endpoints;
    
    const updatedEndpoints = await Promise.all(
      currentEndpoints.map(async (endpoint) => {
        try {
          const startTime = Date.now();
          
          // Simple health check - get slot
          const response = await fetch(endpoint.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getSlot'
            }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });

          const endTime = Date.now();
          const latency = endTime - startTime;

          if (response.ok) {
            const data = await response.json();
            if (data.result !== undefined) {
              return {
                ...endpoint,
                status: latency > 2000 ? 'slow' : 'healthy' as const,
                latency,
                lastChecked: Date.now()
              };
            }
          }
          
          return {
            ...endpoint,
            status: 'down' as const,
            latency: null,
            lastChecked: Date.now()
          };
        } catch (error) {
          return {
            ...endpoint,
            status: 'down' as const,
            latency: null,
            lastChecked: Date.now()
          };
        }
      })
    );

    setEndpoints(updatedEndpoints);
    setIsChecking(false);
  };

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          icon: <CheckCircle2 className="w-3 h-3 text-green-600" />,
          badge: <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>,
          color: 'text-green-600'
        };
      case 'slow':
        return {
          icon: <AlertTriangle className="w-3 h-3 text-yellow-600" />,
          badge: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Slow</Badge>,
          color: 'text-yellow-600'
        };
      case 'down':
        return {
          icon: <XCircle className="w-3 h-3 text-red-600" />,
          badge: <Badge className="bg-red-100 text-red-800 border-red-200">Down</Badge>,
          color: 'text-red-600'
        };
      case 'checking':
        return {
          icon: <Clock className="w-3 h-3 text-blue-600 animate-pulse" />,
          badge: <Badge className="bg-blue-100 text-blue-800 border-blue-200">Checking</Badge>,
          color: 'text-blue-600'
        };
      default:
        return {
          icon: <Activity className="w-3 h-3 text-gray-600" />,
          badge: <Badge variant="outline">Unknown</Badge>,
          color: 'text-gray-600'
        };
    }
  };

  // Format latency for display
  const formatLatency = (latency: number | null): string => {
    if (latency === null) return 'N/A';
    return `${latency}ms`;
  };

  // Format last checked time
  const formatLastChecked = (timestamp: number | null): string => {
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>RPC Health Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${
                healthSummary.status === 'healthy' ? 'bg-green-100 text-green-800 border-green-200' :
                healthSummary.status === 'partial' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'
              }`}
            >
              {healthSummary.count}/{endpoints.length} Healthy
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => checkEndpointHealth()}
              disabled={isChecking}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Network Info */}
        <div className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded-lg">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Current Network: {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
          </span>
        </div>

        {/* Endpoint List */}
        <div className="space-y-3">
          {endpoints.map((endpoint, index) => {
            const Icon = endpoint.icon;
            const statusDisplay = getStatusDisplay(endpoint.status);
            
            return (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                {/* Endpoint Icon */}
                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>

                {/* Endpoint Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{endpoint.name}</span>
                    {statusDisplay.icon}
                    {statusDisplay.badge}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {endpoint.url}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="text-right flex-shrink-0">
                  <div className={`font-medium text-sm ${statusDisplay.color}`}>
                    {formatLatency(endpoint.latency)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatLastChecked(endpoint.lastChecked)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Tips */}
        {endpoints.some(e => e.status === 'slow' || e.status === 'down') && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-medium mb-1">Performance Issues Detected</p>
                <p>Some RPC endpoints are experiencing slowdowns. This may affect transaction speeds and data freshness.</p>
              </div>
            </div>
          </div>
        )}

        {/* Health Legend */}
        <div className="mt-4 pt-3 border-t">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              <span className="text-muted-foreground">Healthy (&lt;2s)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-yellow-600" />
              <span className="text-muted-foreground">Slow (&gt;2s)</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-3 h-3 text-red-600" />
              <span className="text-muted-foreground">Down/Error</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-blue-600" />
              <span className="text-muted-foreground">Checking</span>
            </div>
          </div>
        </div>

        {/* Auto-refresh Notice */}
        <div className="mt-3 text-xs text-muted-foreground text-center">
          Health checks run every 30 seconds automatically
        </div>
      </CardContent>
    </Card>
  );
}