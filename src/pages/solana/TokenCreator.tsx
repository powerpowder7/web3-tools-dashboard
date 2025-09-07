// src/pages/solana/TokenCreator.tsx - Complete Production Implementation
import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Coins,
  Upload,
  Settings,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Download,
  Send,
  Wallet,
  Sparkles,
  Info,
  Shield,
  Zap,
  Globe,
  Users,
  Loader2,
  Network
} from 'lucide-react';
import { 
  TokenService, 
  TokenCreationParams, 
  TokenCreationResult, 
  TokenCostEstimate 
} from '@/services/tokenService';
import { 
  TokenIntegrationService,
  ImportFromWalletCreatorOptions,
  GenerateVanityAddressOptions 
} from '@/services/tokenIntegrationService';
import { BlockchainService } from '@/services/blockchainService';
import WalletButton from '@/components/common/WalletButton';
import analytics from '@/services/analytics';

interface FormData extends TokenCreationParams {
  imageFile?: File;
}

const TokenCreator: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    symbol: '',
    decimals: 9,
    initialSupply: undefined,
    description: '',
    website: '',
    telegram: '',
    twitter: '',
    mintAuthority: 'revocable',
    freezeAuthority: false,
    updateAuthority: true,
    useExtensions: false,
    transferFees: 0,
    nonTransferable: false,
    pumpFunIntegration: false,
    createRaydiumPool: false,
    protocol: 'spl'
  });

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState<TokenCreationResult | null>(null);
  const [costEstimate, setCostEstimate] = useState<TokenCostEstimate | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [availability, setAvailability] = useState<{
    nameAvailable: boolean;
    symbolAvailable: boolean;
    suggestions?: string[];
  } | null>(null);

  // Integration state
  const [importedWallets, setImportedWallets] = useState<string[]>([]);
  const [vanityAddresses, setVanityAddresses] = useState<string[]>([]);
  const [showIntegrations, setShowIntegrations] = useState(false);
  
  // Production blockchain state
  const [networkHealth, setNetworkHealth] = useState<any>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string>('');

  // Initialize production services
  const tokenService = new TokenService(connection, { publicKey, sendTransaction });
  const blockchainService = new BlockchainService(connection);

  // Check network health on mount
  useEffect(() => {
    const checkNetwork = async () => {
      if (connected) {
        try {
          const health = await blockchainService.checkNetworkHealth();
          setNetworkHealth(health);
        } catch (error) {
          console.error('Network health check failed:', error);
        }
      }
    };
    
    checkNetwork();
  }, [connected, blockchainService]);

  // Real-time cost estimation with blockchain data
  const updateCostEstimate = useCallback(async () => {
    if (!connected || !formData.name || !formData.symbol) return;
    
    try {
      const estimate = await tokenService.estimateCreationCost(formData);
      setCostEstimate(estimate);
    } catch (error) {
      console.error('Real-time cost estimation failed:', error);
    }
  }, [connected, formData, tokenService]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateCostEstimate();
    }, 500); // Debounce cost estimation

    return () => clearTimeout(timer);
  }, [updateCostEstimate]);

  // Real-time form validation
  useEffect(() => {
    const validation = tokenService.validateParams(formData);
    setValidationErrors(validation.errors);
  }, [formData, tokenService]);

  // Production blockchain availability check
  const checkAvailability = useCallback(async () => {
    if (!formData.name || !formData.symbol) return;
    
    setIsCheckingAvailability(true);
    try {
      const result = await tokenService.checkAvailability(formData.name, formData.symbol);
      setAvailability(result);
    } catch (error) {
      console.error('Blockchain availability check failed:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [formData.name, formData.symbol, tokenService]);

  const handleInputChange = (field: keyof FormData, value: string | number | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear availability when name/symbol changes
    if (field === 'name' || field === 'symbol') {
      setAvailability(null);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Enhanced validation for production
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Image must be less than 10MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)');
        return;
      }
      
      setFormData(prev => ({ ...prev, imageFile: file, image: file }));
    }
  };

  // Production token creation with real blockchain integration - FIXED
  const createToken = async () => {
    if (!connected || validationErrors.length > 0) return;

    setIsCreating(true);
    setTransactionStatus('Preparing transaction...');
    
    try {
      analytics.track('token_creation_started', {
        protocol: formData.protocol,
        use_extensions: formData.useExtensions,
        pump_fun: formData.pumpFunIntegration,
        initial_supply: formData.initialSupply || 0
      });

      setTransactionStatus('Creating token on blockchain...');
      
      // Create TokenService instance for this operation
      const tokenService = new TokenService(connection, { publicKey, sendTransaction });
      const result = await tokenService.createToken(formData);

      if (result.success) {
        setCreationResult(result);
        setTransactionStatus('Token created successfully!');
        
        analytics.track('token_creation_completed', {
          mint_address: result.mintAddress,
          total_cost: result.totalCost,
          metadata_uri: result.metadataUri,
          explorer_url: result.explorerUrl
        });
        
        setCurrentStep(6); // Success step
      } else {
        throw new Error(result.error || 'Token creation failed');
      }
    } catch (error: any) {
      console.error('Production token creation failed:', error);
      
      let errorMessage = 'Token creation failed';
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance. Please add more SOL to your wallet.';
      } else if (error.message?.includes('Transaction failed')) {
        errorMessage = 'Transaction failed. Please try again.';
      } else if (error.message?.includes('rate limited')) {
        errorMessage = 'Rate limited. Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      setTransactionStatus('');
      
      analytics.track('token_creation_failed', {
        error: errorMessage,
        step: 'blockchain_creation'
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Production wallet import with real integration
  const handleWalletImport = async () => {
    try {
      const options: ImportFromWalletCreatorOptions = {
        count: 50,
        walletType: 'standard',
        suggestedAmount: formData.initialSupply ? formData.initialSupply / 50 : 100
      };

      const addresses = await TokenIntegrationService.importFromWalletCreator(options);
      setImportedWallets(addresses);
      
      alert(`Successfully imported ${addresses.length} wallet addresses from Wallet Creator`);
      
      analytics.track('wallets_imported', {
        count: addresses.length,
        source: 'wallet_creator'
      });
    } catch (error: any) {
      console.error('Wallet import failed:', error);
      alert(error.message || 'Failed to import wallets. Please ensure you have generated wallets first.');
    }
  };

  // Production vanity address generation
  const handleVanityGeneration = async () => {
    try {
      const options: GenerateVanityAddressOptions = {
        pattern: formData.symbol.toLowerCase(),
        count: 5,
        position: 'prefix',
        caseSensitive: false
      };

      const results = await TokenIntegrationService.generateVanityAddresses(options);
      const addresses = results.map(r => r.address);
      setVanityAddresses(addresses);
      
      alert(`Generated ${addresses.length} vanity addresses with pattern "${formData.symbol}"`);
      
      analytics.track('vanity_addresses_generated', {
        count: addresses.length,
        pattern: formData.symbol
      });
    } catch (error: any) {
      console.error('Vanity generation failed:', error);
      alert(error.message || 'Failed to generate vanity addresses.');
    }
  };

  // Production export to Multi-Sender
  const exportToMultiSender = async () => {
    if (!creationResult?.success) return;

    try {
      const allAddresses = [...importedWallets, ...vanityAddresses];
      
      if (allAddresses.length === 0) {
        alert('No addresses available. Import wallets or generate vanity addresses first.');
        return;
      }

      await TokenIntegrationService.exportToMultiSender({
        tokenData: {
          mintAddress: creationResult.mintAddress,
          tokenName: formData.name,
          tokenSymbol: formData.symbol,
          decimals: formData.decimals,
          totalSupply: formData.initialSupply,
          createdAt: new Date()
        },
        recipientAddresses: allAddresses,
        defaultAmount: formData.initialSupply ? formData.initialSupply / allAddresses.length : 100,
        includeTokenInfo: true
      });

      alert(`Successfully exported token and ${allAddresses.length} addresses to Multi-Sender!`);
      
      analytics.track('token_exported_multisender', {
        token_mint: creationResult.mintAddress,
        recipient_count: allAddresses.length
      });
    } catch (error: any) {
      console.error('Export to Multi-Sender failed:', error);
      alert(error.message || 'Failed to export to Multi-Sender');
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.symbol && validationErrors.length === 0;
      case 2:
        return true; // Metadata is optional
      case 3:
        return true; // Authority settings have defaults
      case 4:
        return true; // Advanced features are optional
      case 5:
        return validationErrors.length === 0 && connected;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Coins className="w-5 h-5 mr-2" />
                Token Information
              </CardTitle>
              <CardDescription>
                Basic information about your token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Token Name *
                  </label>
                  <Input
                    placeholder="My Awesome Token"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Token Symbol *
                  </label>
                  <Input
                    placeholder="MAT"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                  {availability && !availability.symbolAvailable && (
                    <p className="text-sm text-red-600 mt-1">
                      Symbol not available. Try: {availability.suggestions?.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Decimals
                  </label>
                  <select 
                    value={formData.decimals.toString()} 
                    onChange={(e) => handleInputChange('decimals', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                      <option key={d} value={d.toString()}>
                        {d} decimals {d === 9 && '(recommended)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Initial Supply (Optional)
                  </label>
                  <Input
                    type="number"
                    placeholder="1000000"
                    value={formData.initialSupply || ''}
                    onChange={(e) => handleInputChange('initialSupply', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave empty to create without initial minting
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of your token..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={checkAvailability} 
                  variant="outline" 
                  size="sm"
                  disabled={!formData.name || !formData.symbol || isCheckingAvailability}
                >
                  {isCheckingAvailability ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  )}
                  {isCheckingAvailability ? 'Checking...' : 'Check Availability'}
                </Button>
                
                {availability && (
                  <Badge variant={availability.symbolAvailable ? "default" : "destructive"}>
                    {availability.symbolAvailable ? 'Available' : 'Not Available'}
                  </Badge>
                )}
                
                {/* Network Health Indicator */}
                {networkHealth && (
                  <Badge variant={networkHealth.healthy ? "default" : "destructive"}>
                    <Network className="w-3 h-3 mr-1" />
                    {networkHealth.healthy ? `Network OK (${networkHealth.latency}ms)` : 'Network Issues'}
                  </Badge>
                )}
              </div>

              {/* Live Cost Estimation Display */}
              {costEstimate && formData.name && formData.symbol && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Estimated Cost:</span>
                    <span className="text-lg font-bold text-green-600">
                      {costEstimate.total.toFixed(6)} SOL
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Live estimate based on current network fees
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Metadata & Branding
              </CardTitle>
              <CardDescription>
                Upload your token logo and add social links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Logo
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </Button>
                  {formData.imageFile && (
                    <span className="text-sm text-gray-600">
                      {formData.imageFile.name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  PNG, JPG, GIF, WebP, or SVG format. Max 10MB.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Website
                  </label>
                  <Input
                    placeholder="https://mytoken.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <ExternalLink className="w-4 h-4 inline mr-1" />
                    Twitter
                  </label>
                  <Input
                    placeholder="https://twitter.com/mytoken"
                    value={formData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Send className="w-4 h-4 inline mr-1" />
                    Telegram
                  </label>
                  <Input
                    placeholder="https://t.me/mytoken"
                    value={formData.telegram}
                    onChange={(e) => handleInputChange('telegram', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Authority & Protocol Configuration
              </CardTitle>
              <CardDescription>
                Configure token authorities and choose protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Protocol Selection
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className={`p-4 border rounded-lg text-left ${
                      formData.protocol === 'spl' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => handleInputChange('protocol', 'spl')}
                  >
                    <h4 className="font-medium">Standard SPL</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Compatible with all wallets and exchanges
                    </p>
                  </button>
                  
                  <button
                    className={`p-4 border rounded-lg text-left ${
                      formData.protocol === 'token2022' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
                    }`}
                    onClick={() => handleInputChange('protocol', 'token2022')}
                  >
                    <h4 className="font-medium">Token-2022</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Advanced features like transfer fees and compliance
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mint Authority
                </label>
                <select 
                  value={formData.mintAuthority} 
                  onChange={(e) => handleInputChange('mintAuthority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="permanent">Permanent Supply - Cannot mint more tokens</option>
                  <option value="revocable">Revocable Mint Authority - Can mint now, revoke later</option>
                  <option value="none">No Mint Authority - Cannot mint any tokens</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Freeze Authority
                  </label>
                  <p className="text-sm text-gray-500">Ability to freeze token accounts</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.freezeAuthority}
                  onChange={(e) => handleInputChange('freezeAuthority', e.target.checked)}
                  className="h-4 w-4 text-blue-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Update Authority
                  </label>
                  <p className="text-sm text-gray-500">Ability to update token metadata</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.updateAuthority}
                  onChange={(e) => handleInputChange('updateAuthority', e.target.checked)}
                  className="h-4 w-4 text-blue-600"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Advanced Features
              </CardTitle>
              <CardDescription>
                Token Extensions and integrations (Token-2022 only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Token Extensions
                  </label>
                  <p className="text-sm text-gray-500">
                    {formData.protocol === 'spl' ? 'Only available with Token-2022' : 'Advanced token features'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.useExtensions}
                  onChange={(e) => handleInputChange('useExtensions', e.target.checked)}
                  disabled={formData.protocol === 'spl'}
                  className="h-4 w-4 text-blue-600"
                />
              </div>

              {formData.useExtensions && formData.protocol === 'token2022' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium">Transfer Fees</label>
                      <span className="text-sm text-gray-500">
                        {formData.transferFees || 0} basis points ({((formData.transferFees || 0) / 100).toFixed(2)}%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="10"
                      value={formData.transferFees || 0}
                      onChange={(e) => handleInputChange('transferFees', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Fee collected on each transfer (0-10%)
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium">Non-Transferable</label>
                      <p className="text-sm text-gray-500">Soulbound tokens</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.nonTransferable}
                      onChange={(e) => handleInputChange('nonTransferable', e.target.checked)}
                      className="h-4 w-4 text-blue-600"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Platform Integrations
                </label>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Pump.fun Integration
                    </label>
                    <p className="text-sm text-gray-500">Launch on Pump.fun with bonding curve</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.pumpFunIntegration}
                    onChange={(e) => handleInputChange('pumpFunIntegration', e.target.checked)}
                    className="h-4 w-4 text-blue-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Tool Integration & Review
              </CardTitle>
              <CardDescription>
                Integrate with other tools and review your token configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Production Transaction Status */}
              {isCreating && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
                    <div>
                      <h4 className="font-medium text-blue-800">Creating Token</h4>
                      <p className="text-sm text-blue-700">{transactionStatus}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Balance Check */}
              {connected && publicKey && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Wallet Balance:</span>
                    <WalletBalanceDisplay publicKey={publicKey} />
                  </div>
                </div>
              )}

              {/* Tool Integration Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tool Integration
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowIntegrations(!showIntegrations)}
                  >
                    {showIntegrations ? 'Hide' : 'Show'} Integration Options
                  </Button>
                </div>

                {showIntegrations && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Button 
                          onClick={handleWalletImport}
                          variant="outline"
                          className="w-full"
                          disabled={!connected}
                        >
                          <Wallet className="w-4 h-4 mr-2" />
                          Import from Wallet Creator
                        </Button>
                        {importedWallets.length > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ {importedWallets.length} wallets imported
                          </p>
                        )}
                      </div>

                      <div>
                        <Button 
                          onClick={handleVanityGeneration}
                          variant="outline"
                          className="w-full"
                          disabled={!connected || !formData.symbol}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Vanity Addresses
                        </Button>
                        {vanityAddresses.length > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ {vanityAddresses.length} vanity addresses generated
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Token Configuration Review */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Token Configuration Review
                </label>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Symbol</label>
                      <p className="font-medium">{formData.symbol}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Protocol</label>
                      <Badge variant={formData.protocol === 'token2022' ? 'default' : 'secondary'}>
                        {formData.protocol === 'token2022' ? 'Token-2022' : 'Standard SPL'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Initial Supply</label>
                      <p className="font-medium">
                        {formData.initialSupply ? formData.initialSupply.toLocaleString() : 'None'}
                      </p>
                    </div>
                  </div>

                  {formData.pumpFunIntegration && (
                    <div>
                      <Badge variant="default" className="bg-purple-600">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Pump.fun Integration Enabled
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Breakdown */}
              {costEstimate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Cost Breakdown
                  </label>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      {Object.entries(costEstimate.breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">~{value.toFixed(6)} SOL</span>
                        </div>
                      ))}
                      <hr className="border-gray-200" />
                      <div className="flex justify-between font-medium text-base">
                        <span>Total Estimated Cost:</span>
                        <span className="text-green-600">~{costEstimate.total.toFixed(6)} SOL</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-red-800">Please fix the following issues:</h4>
                      <ul className="text-sm text-red-700 mt-1 space-y-1 list-disc list-inside">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* IPFS Configuration Status */}
              <IPFSStatusIndicator />
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Token Created Successfully!
              </CardTitle>
              <CardDescription>
                Your token has been deployed to the Solana blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {creationResult && (
                <>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Token Mint Address</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1">
                            {creationResult.mintAddress}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigator.clipboard.writeText(creationResult.mintAddress)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Transaction Signature</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1">
                            {creationResult.signature}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigator.clipboard.writeText(creationResult.signature)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {creationResult.explorerUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(creationResult.explorerUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Production Cost Display */}
                      <div>
                        <label className="text-sm font-medium text-gray-600">Total Cost</label>
                        <p className="font-medium text-lg text-green-600">
                          {creationResult.totalCost.toFixed(6)} SOL
                        </p>
                      </div>

                      {/* Metadata & Image URLs */}
                      {creationResult.metadataUri && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Metadata URI</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1">
                              {creationResult.metadataUri}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(creationResult.metadataUri, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {creationResult.imageUri && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Image URI</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-1">
                              {creationResult.imageUri}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(creationResult.imageUri, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Export Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Export & Integration Options
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        onClick={exportToMultiSender}
                        variant="default"
                        className="w-full"
                        disabled={importedWallets.length === 0 && vanityAddresses.length === 0}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Export to Multi-Sender
                        {(importedWallets.length > 0 || vanityAddresses.length > 0) && (
                          <Badge variant="secondary" className="ml-2">
                            {importedWallets.length + vanityAddresses.length}
                          </Badge>
                        )}
                      </Button>

                      <Button 
                        onClick={() => {
                          const data = {
                            mintAddress: creationResult.mintAddress,
                            name: formData.name,
                            symbol: formData.symbol,
                            signature: creationResult.signature,
                            totalCost: creationResult.totalCost,
                            metadataUri: creationResult.metadataUri,
                            imageUri: creationResult.imageUri,
                            explorerUrl: creationResult.explorerUrl,
                            createdAt: new Date().toISOString()
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${formData.symbol}_token_info.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Token Info
                      </Button>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Next Steps</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Add your token to wallet by importing the mint address</li>
                      <li>• Create liquidity pools on Raydium or Orca</li>
                      <li>• List your token on CoinGecko and CoinMarketCap</li>
                      <li>• Use Multi-Sender to distribute tokens to holders</li>
                      {formData.pumpFunIntegration && (
                        <li>• Your token will be available on Pump.fun shortly</li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Token Creator</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create SPL and Token-2022 tokens with advanced features
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Coins className="w-4 h-4 mr-1" />
            SPL & Token-2022
          </Badge>
          {!connected ? (
            <WalletButton />
          ) : (
            <Badge variant="outline">
              Connected: {publicKey?.toString().slice(0, 8)}...
            </Badge>
          )}
        </div>
      </div>

      {!connected ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-6">
                Connect your Solana wallet to start creating tokens
              </p>
              <WalletButton />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { step: 1, title: 'Token Info', icon: Coins },
                { step: 2, title: 'Metadata', icon: Upload },
                { step: 3, title: 'Authority', icon: Settings },
                { step: 4, title: 'Advanced', icon: Zap },
                { step: 5, title: 'Review', icon: Users },
                { step: 6, title: 'Success', icon: CheckCircle2 }
              ].map(({ step, title, icon: Icon }) => (
                <div
                  key={step}
                  className={`flex flex-col items-center ${
                    step === currentStep ? 'text-blue-600' : 
                    step < currentStep ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2
                    ${step === currentStep ? 'border-blue-600 bg-blue-50' : 
                      step < currentStep ? 'border-green-600 bg-green-50' : 'border-gray-300'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1 || currentStep === 6}
            >
              Previous
            </Button>

            <div className="flex space-x-4">
              {currentStep < 5 ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
                  disabled={!canProceedToNextStep()}
                >
                  Next
                </Button>
              ) : currentStep === 5 ? (
                <Button
                  onClick={createToken}
                  disabled={!canProceedToNextStep() || isCreating || !connected}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Token...
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 mr-2" />
                      Create Token (~{costEstimate?.total.toFixed(4)} SOL)
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setCurrentStep(1);
                    setCreationResult(null);
                    setTransactionStatus('');
                    setFormData({
                      name: '',
                      symbol: '',
                      decimals: 9,
                      initialSupply: undefined,
                      description: '',
                      website: '',
                      telegram: '',
                      twitter: '',
                      mintAuthority: 'revocable',
                      freezeAuthority: false,
                      updateAuthority: true,
                      useExtensions: false,
                      transferFees: 0,
                      nonTransferable: false,
                      pumpFunIntegration: false,
                      createRaydiumPool: false,
                      protocol: 'spl'
                    });
                  }}
                  variant="outline"
                >
                  Create Another Token
                </Button>
              )}
            </div>
          </div>

          {/* Information Cards */}
          {currentStep === 1 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <Info className="w-5 h-5 mr-2" />
                    SPL vs Token-2022
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Standard SPL:</strong> Compatible with all wallets and exchanges. 
                    Perfect for most tokens.
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Token-2022:</strong> Advanced features like transfer fees, 
                    non-transferable tokens, and compliance tools.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <Shield className="w-5 h-5 mr-2" />
                    Security Notice
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Your private keys never leave your device. Token creation happens 
                    entirely on-chain through your connected wallet.
                  </p>
                  <p className="text-sm text-gray-600">
                    Always test on Devnet first before creating on Mainnet.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Production Helper Components - FIXED VERSIONS
const WalletBalanceDisplay: React.FC<{ publicKey: any }> = ({ publicKey }) => {
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getBalance = async () => {
      if (!publicKey) return;
      
      setIsLoading(true);
      try {
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / 1e9); // Convert lamports to SOL
      } catch (error) {
        console.error('Failed to get balance:', error);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    getBalance();
  }, [connection, publicKey]);

  if (isLoading) {
    return <span className="text-sm text-gray-500">Loading...</span>;
  }

  return (
    <span className={`text-sm font-medium ${balance && balance < 0.01 ? 'text-red-600' : 'text-green-600'}`}>
      {balance ? balance.toFixed(4) : '0.0000'} SOL
    </span>
  );
};

const IPFSStatusIndicator: React.FC = () => {
  const [ipfsStatus, setIpfsStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    const checkIPFS = () => {
      // FIX: Use import.meta.env instead of process.env for Vite
      const hasIPFSKey = import.meta.env.VITE_IPFS_API_KEY;
      setIpfsStatus(hasIPFSKey ? 'available' : 'unavailable');
    };

    checkIPFS();
  }, []);

  return (
    <div className={`p-3 rounded-lg border ${
      ipfsStatus === 'available' 
        ? 'bg-green-50 border-green-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${
          ipfsStatus === 'available' ? 'bg-green-500' : 'bg-yellow-500'
        }`} />
        <span className="text-sm font-medium">
          IPFS Storage: {ipfsStatus === 'available' ? 'Configured' : 'Not Configured'}
        </span>
      </div>
      {ipfsStatus === 'unavailable' && (
        <p className="text-xs text-yellow-700 mt-1">
          Add VITE_IPFS_API_KEY to environment for metadata storage
        </p>
      )}
    </div>
  );
};

export default TokenCreator;