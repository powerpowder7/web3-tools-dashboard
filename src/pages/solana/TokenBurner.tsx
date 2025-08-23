import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Flame, AlertTriangle, Info, Trash2, Search } from 'lucide-react';

const TokenBurner: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Token Burner</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Permanently destroy SPL tokens from circulation
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <Flame className="w-4 h-4 mr-1" />
          Solana Network
        </Badge>
      </div>

      {/* Danger Warning */}
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">
                ⚠️ Irreversible Action Warning
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Token burning is a permanent and irreversible action. Burned tokens are completely 
                removed from circulation and cannot be recovered. Always double-check amounts and 
                test on Devnet first.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Select Token to Burn
            </CardTitle>
            <CardDescription>
              Choose the SPL token you want to burn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token Mint Address
              </label>
              <Input 
                placeholder="Enter token mint address..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The mint address of the SPL token you want to burn
              </p>
            </div>

            <div>
              <Button variant="outline" className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Load Token Info
              </Button>
            </div>

            {/* Token Info Display (when loaded) */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Token information will appear here after entering a valid mint address
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Burn Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flame className="w-5 h-5 mr-2" />
              Burn Configuration
            </CardTitle>
            <CardDescription>
              Set the amount of tokens to burn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount to Burn
              </label>
              <Input 
                type="number"
                placeholder="Enter amount to burn..."
                min="0"
                step="any"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter the exact amount of tokens to permanently destroy
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Current Balance
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Available: 0 tokens
              </p>
            </div>

            <div className="space-y-2">
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" disabled>
                <Flame className="w-4 h-4 mr-2" />
                Burn Tokens
              </Button>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Preview</CardTitle>
          <CardDescription>
            Review the burn transaction details before execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Burn Summary:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Token:</span>
                  <span>Not selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount to Burn:</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Remaining Supply:</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction Fee:</span>
                  <span>~0.000005 SOL</span>
                </div>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-lg">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Confirm Understanding
              </h4>
              <div className="space-y-2">
                <label className="flex items-start space-x-2 text-sm">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-red-700 dark:text-red-300">
                    I understand this action is permanent and irreversible
                  </span>
                </label>
                <label className="flex items-start space-x-2 text-sm">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-red-700 dark:text-red-300">
                    I have verified the token address and amount
                  </span>
                </label>
                <label className="flex items-start space-x-2 text-sm">
                  <input type="checkbox" className="mt-1" />
                  <span className="text-red-700 dark:text-red-300">
                    I have tested this on Devnet first
                  </span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                <Flame className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-medium">Token Burning</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permanently removes tokens from circulation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-medium">Irreversible</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Burned tokens cannot be recovered
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium">Deflationary</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Reduces total supply permanently
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Common Use Cases for Token Burning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Deflationary Mechanisms:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Reduce circulating supply to increase scarcity</li>
                <li>• Implement deflationary tokenomics</li>
                <li>• Remove excess tokens from circulation</li>
                <li>• Create upward price pressure</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Operational Purposes:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Remove mistakenly minted tokens</li>
                <li>• Implement buyback and burn programs</li>
                <li>• Destroy unsold tokens after events</li>
                <li>• Clean up token supply management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenBurner;