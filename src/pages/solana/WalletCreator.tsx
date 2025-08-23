import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Wallet, Download, AlertTriangle, Shield, Eye, EyeOff } from 'lucide-react';

const WalletCreator: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wallet Creator</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate new Solana wallet addresses with private keys
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <Wallet className="w-4 h-4 mr-1" />
          Solana Network
        </Badge>
      </div>

      {/* Security Warning */}
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">
                Security Warning
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Never share your private keys with anyone. Store them securely offline. 
                This tool is for testnet use only. Always verify on Devnet before Mainnet usage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Generate Wallets
            </CardTitle>
            <CardDescription>
              Create new Solana wallet addresses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Wallets
              </label>
              <Input 
                type="number" 
                placeholder="Enter number (1-100)"
                min="1"
                max="100"
                defaultValue="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum 100 wallets per batch
              </p>
            </div>

            <div className="space-y-2">
              <Button className="w-full">
                <Wallet className="w-4 h-4 mr-2" />
                Generate Wallets
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Download className="w-4 h-4 mr-2" />
                Download as CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Wallets Display */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Wallets</CardTitle>
            <CardDescription>Newly created wallet addresses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No wallets generated yet</p>
              <p className="text-sm mt-1">Click "Generate Wallets" to create new addresses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet List (when generated) */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Details</CardTitle>
          <CardDescription>
            Generated wallet addresses and private keys (hidden by default)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Wallet details will appear here after generation</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">✅ Do:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Store private keys offline securely</li>
                <li>• Test on Devnet first</li>
                <li>• Use hardware wallets for large amounts</li>
                <li>• Backup your seed phrases</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">❌ Don't:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Share private keys with anyone</li>
                <li>• Store keys in plain text</li>
                <li>• Use generated wallets for large amounts</li>
                <li>• Screenshot or copy private keys</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletCreator;