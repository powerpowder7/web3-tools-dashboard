import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Coins, Upload, AlertTriangle, Info, DollarSign } from 'lucide-react';

const TokenCreator: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Token Creator</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create custom SPL tokens on Solana blockchain
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <Coins className="w-4 h-4 mr-1" />
          Solana Network
        </Badge>
      </div>

      {/* Cost Warning */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-200">
                Transaction Costs
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Creating a token requires ~0.01 SOL for mint account creation and metadata. 
                Test on Devnet first to avoid unnecessary costs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coins className="w-5 h-5 mr-2" />
              Token Information
            </CardTitle>
            <CardDescription>
              Basic details about your new token
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token Name
              </label>
              <Input placeholder="e.g., My Custom Token" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Token Symbol
              </label>
              <Input placeholder="e.g., MCT" className="uppercase" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Usually 3-5 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Decimals
              </label>
              <Input type="number" placeholder="9" min="0" max="18" defaultValue="9" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Standard is 9 decimals for Solana tokens
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Supply
              </label>
              <Input type="number" placeholder="1000000" min="0" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to create without minting
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Token Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Token Metadata
            </CardTitle>
            <CardDescription>
              Additional information and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                rows={3}
                placeholder="Brief description of your token..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image/Logo URL (Optional)
              </label>
              <Input placeholder="https://example.com/token-logo.png" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PNG, JPG, or SVG format recommended
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website URL (Optional)
              </label>
              <Input placeholder="https://yourproject.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Social Media (Optional)
              </label>
              <Input placeholder="@yourproject" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Twitter handle or other social link
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Options</CardTitle>
          <CardDescription>
            Configure token authorities and special features
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Authority Settings</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm">Mint Authority</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Allow minting additional tokens later
              </p>
              
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm">Freeze Authority</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Allow freezing token accounts
              </p>
              
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Update Authority</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Allow updating token metadata
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Token Features</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Revokable</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Allow revoking tokens from accounts
              </p>
              
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Non-transferable</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                Tokens cannot be transferred between accounts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
          <CardDescription>Review costs and create your token</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Estimated Costs:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Mint Account Creation:</span>
                  <span>~0.00144 SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Metadata Account:</span>
                  <span>~0.0057 SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Token Account:</span>
                  <span>~0.00204 SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction Fees:</span>
                  <span>~0.00015 SOL</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between font-medium">
                  <span>Total Estimated Cost:</span>
                  <span>~0.00933 SOL</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button className="w-full" size="lg">
                <Coins className="w-5 h-5 mr-2" />
                Create Token
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Transaction will be submitted to the blockchain after confirmation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <Info className="w-5 h-5 mr-2" />
              What is an SPL Token?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SPL (Solana Program Library) tokens are the standard for creating fungible and 
              non-fungible tokens on the Solana blockchain. They're similar to ERC-20 tokens 
              on Ethereum but with faster transaction speeds and lower fees.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Test on Devnet before creating on Mainnet</li>
              <li>• Token creation is permanent and cannot be undone</li>
              <li>• Keep your mint authority secure</li>
              <li>• Consider tokenomics before setting supply</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TokenCreator;