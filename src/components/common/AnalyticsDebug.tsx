import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/contexts/AnalyticsProvider';
import { Bug, Activity, Zap, AlertTriangle } from 'lucide-react';

// Only show in development
const AnalyticsDebug = () => {
  const { trackEvent, isInitialized } = useAnalytics();
  const [testResults, setTestResults] = useState<string[]>([]);

  // Only render in development
  if (import.meta.env.NODE_ENV !== 'development') {
    return null;
  }

  const addTestResult = (message: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 4)]);
  };

  const testPageView = () => {
    trackEvent.pageView('/analytics-test', { 
      source: 'debug_panel',
      timestamp: new Date().toISOString() 
    });
    addTestResult('📊 Page view event sent');
  };

  const testWalletEvent = () => {
    trackEvent.walletConnected({
      wallet: 'Test Wallet',
      network: 'solana',
      address: 'test123...test456',
      balance: 1.5,
    });
    addTestResult('🔗 Wallet connected event sent');
  };

  const testButtonClick = () => {
    trackEvent.buttonClicked('debug_test_button', 'analytics_debug', {
      testNumber: Math.floor(Math.random() * 100),
    });
    addTestResult('🎲 Button click event sent');
  };

  const testError = () => {
    trackEvent.error(new Error('Test error from debug panel'), {
      context: 'analytics_debug',
      severity: 'low',
      isTest: true,
    });
    addTestResult('⚠️ Error event sent');
  };

  const testToolUsage = () => {
    trackEvent.toolUsed({
      tool: 'debug-panel',
      network: 'solana',
      action: 'test_usage',
      duration: 42,
      itemsProcessed: 10,
    });
    addTestResult('🛠️ Tool usage event sent');
  };

  const testTransaction = () => {
    trackEvent.transactionInitiated({
      type: 'test_transaction',
      network: 'solana',
      amount: '1.5',
      token: 'SOL',
      recipient: 'test_recipient',
    });
    addTestResult('💸 Transaction event sent');
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-orange-600" />
          <CardTitle className="text-sm text-orange-900">Analytics Debug</CardTitle>
          <Badge variant={isInitialized ? "default" : "destructive"} className="text-xs">
            {isInitialized ? "Active" : "Inactive"}
          </Badge>
        </div>
        <CardDescription className="text-xs text-orange-700">
          Development testing panel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={testPageView} className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Page View
          </Button>
          <Button size="sm" onClick={testWalletEvent} className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Wallet
          </Button>
          <Button size="sm" onClick={testButtonClick} className="text-xs">
            <Bug className="h-3 w-3 mr-1" />
            Button
          </Button>
          <Button size="sm" onClick={testError} variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Button>
          <Button size="sm" onClick={testToolUsage} className="text-xs">
            Tool
          </Button>
          <Button size="sm" onClick={testTransaction} className="text-xs">
            TX
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="border border-orange-200 rounded p-2 bg-white">
            <div className="text-xs font-medium text-orange-900 mb-1">Recent Events:</div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-xs text-orange-700 font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clear Results */}
        {testResults.length > 0 && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setTestResults([])}
            className="w-full text-xs"
          >
            Clear Results
          </Button>
        )}

        {/* Instructions */}
        <div className="text-xs text-orange-600 border border-orange-200 rounded p-2 bg-orange-25">
          <div className="font-medium mb-1">Check Browser Console:</div>
          <div>• Open DevTools → Console</div>
          <div>• Look for PostHog/Sentry events</div>
          <div>• Verify network requests</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsDebug;