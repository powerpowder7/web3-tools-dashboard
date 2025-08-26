// src/components/common/AnalyticsDebug.tsx - CSV METHOD FIXED
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug, Activity, Zap, AlertTriangle } from 'lucide-react';
import analytics from '@/services/analytics';

const AnalyticsDebug = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isInitialized] = useState(true);

  if (import.meta.env.NODE_ENV !== 'development') {
    return null;
  }

  const addTestResult = (message: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 4)]);
  };

  const testPageView = () => {
    analytics.pageView('/analytics-test', 'Analytics Test Page');
    addTestResult('📊 Page view event sent');
  };

  const testWalletEvent = () => {
    analytics.walletConnected({
      wallet_type: 'Test Wallet',
      network: 'devnet',
      address: 'test123...test456',
      connection_time: 1500
    });
    addTestResult('🔗 Wallet connected event sent');
  };

  const testButtonClick = () => {
    analytics.trackEvent('debug_test_button_clicked', {
      context: 'analytics_debug',
      testNumber: Math.floor(Math.random() * 100),
    });
    addTestResult('🎲 Button click event sent');
  };

  const testError = () => {
    analytics.captureError(new Error('Test error from debug panel'), {
      context: 'analytics_debug',
      severity: 'low',
      isTest: true,
    });
    addTestResult('⚠️ Error event sent');
  };

  const testToolUsage = () => {
    analytics.toolUsed({
      tool_name: 'debug-panel',
      action: 'test_usage',
      network: 'devnet',
      success: true,
      duration: 42,
      metadata: {
        itemsProcessed: 10
      }
    });
    addTestResult('🛠️ Tool usage event sent');
  };

  const testTransaction = () => {
    analytics.transactionInitiated({
      type: 'sent',
      network: 'devnet',
      amount: 1.5,
      token: 'SOL',
      to_address: 'test_recipient',
      status: 'initiated'
    });
    addTestResult('💸 Transaction event sent');
  };

  const testPerformanceMetric = () => {
    analytics.performanceMetric({
      name: 'debug_test_performance',
      value: Math.random() * 1000,
      unit: 'ms',
      metadata: {
        testType: 'debug'
      }
    });
    addTestResult('📈 Performance metric sent');
  };

  const testCSVUpload = () => {
    // Method signature: csvUploaded(p0: string, p1: number, event: CSVEvent)
    analytics.csvUploaded('test_file.csv', 100, {
      filename: 'test_file.csv',
      rows: 100,
      columns: ['address', 'amount', 'token'],
      file_size: 2048
    });
    addTestResult('📄 CSV upload event sent');
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-orange-600" />
          <CardTitle className="text-sm text-orange-900">Analytics Debug</CardTitle>
          <Badge variant={isInitialized ? "default" : "destructive"} className="text-xs">
            {isInitialized ? 'Ready' : 'Not Ready'}
          </Badge>
        </div>
        <CardDescription className="text-xs text-orange-700">
          Development analytics testing panel
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={testPageView} variant="outline" size="sm" className="text-xs p-2 h-8">
            <Activity className="w-3 h-3 mr-1" />
            Page View
          </Button>
          
          <Button onClick={testWalletEvent} variant="outline" size="sm" className="text-xs p-2 h-8">
            🔗 Wallet
          </Button>
          
          <Button onClick={testButtonClick} variant="outline" size="sm" className="text-xs p-2 h-8">
            <Zap className="w-3 h-3 mr-1" />
            Click
          </Button>
          
          <Button onClick={testError} variant="outline" size="sm" className="text-xs p-2 h-8">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Error
          </Button>
          
          <Button onClick={testToolUsage} variant="outline" size="sm" className="text-xs p-2 h-8">
            🛠️ Tool
          </Button>
          
          <Button onClick={testTransaction} variant="outline" size="sm" className="text-xs p-2 h-8">
            💸 TX
          </Button>
          
          <Button onClick={testPerformanceMetric} variant="outline" size="sm" className="text-xs p-2 h-8">
            📈 Perf
          </Button>
          
          <Button onClick={testCSVUpload} variant="outline" size="sm" className="text-xs p-2 h-8">
            📄 CSV
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-orange-900">Recent Tests:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-xs text-orange-800 bg-white/50 p-1 rounded border">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {testResults.length > 0 && (
          <Button onClick={() => setTestResults([])} variant="ghost" size="sm" className="w-full text-xs h-6">
            Clear Results
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsDebug;