import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Upload, Download, AlertTriangle, Info } from 'lucide-react';

const MultiSender: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Multi Sender</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Send SOL or SPL tokens to multiple addresses at once
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <Send className="w-4 h-4 mr-1" />
          Solana Network
        </Badge>
      </div>

      {/* Warning Alert */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                Testnet Recommended
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Always test your batch transactions on Devnet before using Mainnet. 
                Double-check all recipient addresses to avoid irreversible losses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CSV Upload Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              CSV Upload
            </CardTitle>
            <CardDescription>
              Upload a CSV file with recipient addresses and amounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Or click to browse files
              </p>
              <Button variant="outline">
                Choose File
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                CSV Format Example:
              </h4>
              <code className="text-sm text-gray-700 dark:text-gray-300 block bg-white dark:bg-gray-900 p-2 rounded border">
                address,amount<br/>
                11111111111111111111111111111112,0.1<br/>
                22222222222222222222222222222223,0.2
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
            <CardDescription>Review before sending</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Recipients:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                <span className="font-medium">0 SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Est. Fees:</span>
                <span className="font-medium">~0.005 SOL</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Cost:</span>
                <span>0.005 SOL</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button className="w-full" disabled>
                <Send className="w-4 h-4 mr-2" />
                Send Transactions
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium">Batch Processing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Send to up to 100 addresses per batch
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium">CSV Import</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Easy bulk import via CSV files
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium">Real-time Tracking</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Monitor transaction progress live
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MultiSender;