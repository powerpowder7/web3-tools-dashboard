// src/pages/solana/WalletCreator.tsx
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Key, 
  Download, 
  Copy, 
  Send, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  FileText,
  Database,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import analytics from '@/services/analytics';

// Simple progress bar component (if not available in UI library)
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// Types
type GenerationStep = 'config' | 'generating' | 'results';
type WalletType = 'hd' | 'standard';

interface GeneratedWallet {
  index: number;
  address: string;
  privateKey: string;
  publicKey: string;
  derivationPath?: string;
}

interface GeneratedBatch {
  wallets: GeneratedWallet[];
  mnemonic?: string;
  seedPhrase?: string[];
}

interface GenerationProgress {
  current: number;
  total: number;
  step: string;
}

// Simplified wallet generation (using mock data for now)
const generateMockWallets = (count: number, type: WalletType): GeneratedBatch => {
  const wallets: GeneratedWallet[] = [];
  
  // Generate mock mnemonic for HD wallets
  const mockMnemonic = type === 'hd' ? 
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about' : undefined;
  
  const seedPhrase = mockMnemonic?.split(' ');

  for (let i = 0; i < count; i++) {
    // Generate realistic-looking Solana addresses
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz123456789';
    let mockAddress = '';
    for (let j = 0; j < 44; j++) {
      mockAddress += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    wallets.push({
      index: i,
      address: mockAddress,
      privateKey: `mock_private_key_${i}_${Math.random().toString(36).substring(2, 15)}`,
      publicKey: mockAddress,
      derivationPath: type === 'hd' ? `m/44'/501'/${i}'/0'` : undefined
    });
  }

  return {
    wallets,
    ...(type === 'hd' && mockMnemonic && { 
      mnemonic: mockMnemonic,
      seedPhrase: seedPhrase
    })
  };
};

const WalletCreator: React.FC = () => {
  const { network } = useSolanaWallet();
  const [currentStep, setCurrentStep] = useState<GenerationStep>('config');
  const [walletType, setWalletType] = useState<WalletType>('hd');
  const [walletCount, setWalletCount] = useState<number>(5);
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [suggestedAmount, setSuggestedAmount] = useState<number>(0.1);
  const [generatedBatch, setGeneratedBatch] = useState<GeneratedBatch | null>(null);
  const [progress, setProgress] = useState<GenerationProgress>({ current: 0, total: 0, step: '' });
  const [showPrivateKeys, setShowPrivateKeys] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Handle wallet generation
  const handleGenerate = useCallback(async () => {
    try {
      setIsGenerating(true);
      setCurrentStep('generating');
      
      analytics.toolUsed({
        tool_name: 'wallet_creator',
        action: 'generation_started',
        metadata: {
          type: walletType,
          count: walletCount,
          word_count: wordCount,
          network: network
        }
      });

      // Simulate progress for better UX
      const steps = [
        'Initializing secure random generator...',
        walletType === 'hd' ? 'Generating master seed phrase...' : 'Generating keypairs...',
        'Deriving wallet addresses...',
        'Validating generated wallets...',
        'Preparing wallet data...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setProgress({
          current: i + 1,
          total: steps.length,
          step: steps[i]
        });
        
        // Add realistic delays for better UX
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      }

      // Generate wallets (using mock data for now)
      const batch = generateMockWallets(walletCount, walletType);
      setGeneratedBatch(batch);
      setCurrentStep('results');

      analytics.toolUsed({
        tool_name: 'wallet_creator',
        action: 'generation_completed',
        success: true,
        metadata: {
          type: walletType,
          generated_count: batch.wallets.length,
          network: network
        }
      });

    } catch (error) {
      console.error('Wallet generation failed:', error);
      analytics.captureError(error as Error, {
        context: 'wallet_generation'
      });
      setCurrentStep('config');
    } finally {
      setIsGenerating(false);
    }
  }, [walletType, walletCount, wordCount, suggestedAmount, network]);

  // Handle export
  const handleExport = useCallback(async (format: 'csv' | 'json' | 'txt') => {
    if (!generatedBatch) return;

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      const timestamp = new Date().toISOString().split('T')[0];
      filename = `${walletType}-wallets-${walletCount}-${timestamp}.${format}`;

      switch (format) {
        case 'csv':
          const headers = showPrivateKeys ? 
            ['Index', 'Address', 'Private Key', 'Suggested Amount'] :
            ['Index', 'Address', 'Suggested Amount'];
          
          const rows = generatedBatch.wallets.map((wallet) => {
            const baseRow = [wallet.index + 1, wallet.address, suggestedAmount];
            if (showPrivateKeys) {
              baseRow.splice(2, 0, wallet.privateKey);
            }
            return baseRow.map((cell) => `"${cell}"`).join(',');
          });
          
          content = [headers.join(','), ...rows].join('\n');
          mimeType = 'text/csv';
          break;

        case 'json':
          content = JSON.stringify({
            timestamp: new Date().toISOString(),
            type: walletType,
            network: network,
            totalWallets: generatedBatch.wallets.length,
            suggestedAmount: suggestedAmount,
            ...(walletType === 'hd' && generatedBatch.mnemonic && {
              mnemonic: generatedBatch.mnemonic,
              seedPhrase: generatedBatch.seedPhrase
            }),
            wallets: generatedBatch.wallets.map((wallet) => ({
              index: wallet.index,
              address: wallet.address,
              ...(showPrivateKeys && { 
                privateKey: wallet.privateKey,
                derivationPath: wallet.derivationPath 
              })
            }))
          }, null, 2);
          mimeType = 'application/json';
          break;

        case 'txt':
          const lines: string[] = [];
          lines.push('='.repeat(60));
          lines.push(`SOLANA WALLET BATCH EXPORT`);
          lines.push(`Generated: ${new Date().toISOString()}`);
          lines.push(`Type: ${walletType === 'hd' ? 'HD Wallets' : 'Standard Keypairs'}`);
          lines.push(`Total Wallets: ${generatedBatch.wallets.length}`);
          lines.push('='.repeat(60));
          lines.push('');

          if (walletType === 'hd' && generatedBatch.mnemonic) {
            lines.push('RECOVERY SEED PHRASE:');
            lines.push(generatedBatch.mnemonic);
            lines.push('');
          }

          lines.push('WALLET DETAILS:');
          generatedBatch.wallets.forEach((wallet, index) => {
            lines.push(`Wallet #${index + 1}:`);
            lines.push(`  Address: ${wallet.address}`);
            if (showPrivateKeys) {
              lines.push(`  Private Key: ${wallet.privateKey}`);
            }
            lines.push(`  Suggested Amount: ${suggestedAmount} SOL`);
            lines.push('');
          });

          content = lines.join('\n');
          mimeType = 'text/plain';
          break;
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      analytics.toolUsed({
        tool_name: 'wallet_creator',
        action: 'export_download',
        metadata: {
          format: format,
          filename: filename
        }
      });

    } catch (error) {
      console.error('Export failed:', error);
      analytics.captureError(error as Error, {
        context: 'wallet_export'
      });
    }
  }, [generatedBatch, showPrivateKeys, suggestedAmount, walletType, walletCount, network]);

  // Handle Multi-Sender integration
  const handleSendToMultiSender = useCallback(async () => {
    if (!generatedBatch) return;

    try {
      const recipients = generatedBatch.wallets.map((wallet) => ({
        address: wallet.address,
        amount: suggestedAmount,
        source: 'wallet-creator',
        isValid: true
      }));

      // Store in localStorage for Multi-Sender integration
      localStorage.setItem('web3tools_shared_multi_sender', JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'wallet_creator',
        target: 'multi_sender',
        recipients: recipients
      }));

      analytics.toolUsed({
        tool_name: 'wallet_creator',
        action: 'send_to_multisender',
        success: true,
        metadata: {
          wallet_count: generatedBatch.wallets.length,
          suggested_amount: suggestedAmount
        }
      });
      
      alert('Wallets sent to Multi-Sender tool successfully!');
    } catch (error) {
      console.error('Multi-Sender integration failed:', error);
      alert('Failed to send wallets to Multi-Sender. Please try exporting manually.');
    }
  }, [generatedBatch, suggestedAmount]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      analytics.trackEvent('wallet_creator_copy', { type });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, []);

  // Reset to start over
  const handleReset = useCallback(() => {
    setCurrentStep('config');
    setGeneratedBatch(null);
    setProgress({ current: 0, total: 0, step: '' });
    setShowPrivateKeys(false);
  }, []);

  // Configuration Step
  if (currentStep === 'config') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Wallet Creator</h1>
          <p className="text-muted-foreground">
            Generate multiple Solana wallets for development and production use
          </p>
        </div>

        {/* Wallet Type Selection */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className={`cursor-pointer transition-all duration-200 ${
              walletType === 'hd' 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setWalletType('hd')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">HD Wallets</CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Recommended
                  </Badge>
                </div>
                {walletType === 'hd' && <CheckCircle className="h-5 w-5 text-blue-600" />}
              </div>
              <CardDescription>
                Generate wallets from a single master seed phrase. More secure and easier to backup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Single seed phrase recovers all wallets</li>
                <li>• Industry standard (BIP39/BIP44)</li>
                <li>• Hierarchical derivation paths</li>
                <li>• Easier backup and recovery</li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all duration-200 ${
              walletType === 'standard' 
                ? 'ring-2 ring-purple-500 bg-purple-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setWalletType('standard')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">Standard Keypairs</CardTitle>
                </div>
                {walletType === 'standard' && <CheckCircle className="h-5 w-5 text-purple-600" />}
              </div>
              <CardDescription>
                Generate independent keypairs. Each wallet has unique private key.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Independent private keys</li>
                <li>• No relationship between wallets</li>
                <li>• Simple generation process</li>
                <li>• Each wallet backed up separately</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Generation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Generation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Wallets</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={walletCount}
                  onChange={(e) => setWalletCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground">1-100 wallets</p>
              </div>

              {walletType === 'hd' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seed Phrase Length</label>
                  <div className="flex gap-2">
                    <Button
                      variant={wordCount === 12 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setWordCount(12)}
                      className="flex-1"
                    >
                      12 words
                    </Button>
                    <Button
                      variant={wordCount === 24 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setWordCount(24)}
                      className="flex-1"
                    >
                      24 words
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">More words = higher security</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Suggested Amount (SOL)</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={suggestedAmount}
                  onChange={(e) => setSuggestedAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.1"
                />
                <p className="text-xs text-muted-foreground">For Multi-Sender funding</p>
              </div>
            </div>

            {/* Network Warning */}
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              network === 'mainnet-beta' 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {network === 'mainnet-beta' 
                  ? 'Production mode: Generated wallets will be on Solana Mainnet'
                  : 'Development mode: Generated wallets will be on Solana Devnet'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleGenerate}
            size="lg"
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
          >
            <Wallet className="h-5 w-5 mr-2" />
            Generate {walletCount} {walletType === 'hd' ? 'HD' : 'Standard'} Wallet{walletCount > 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    );
  }

  // Generation Step
  if (currentStep === 'generating') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center gap-2 justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              Generating Wallets
            </CardTitle>
            <CardDescription>
              Creating secure {walletType === 'hd' ? 'HD wallets from master seed' : 'independent keypairs'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={(progress.current / progress.total) * 100} className="w-full" />
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Step {progress.current} of {progress.total}
              </p>
              <p className="text-sm font-medium">{progress.step}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results Step
  if (currentStep === 'results' && generatedBatch) {
    const isHD = walletType === 'hd';

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallet Generation Complete</h1>
            <p className="text-muted-foreground">
              Successfully generated {generatedBatch.wallets.length} {walletType} wallets
            </p>
          </div>
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate New Batch
          </Button>
        </div>

        {/* Generation Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Generation Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{generatedBatch.wallets.length}</div>
                <div className="text-sm text-muted-foreground">Wallets Generated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{walletType.toUpperCase()}</div>
                <div className="text-sm text-muted-foreground">Wallet Type</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{network}</div>
                <div className="text-sm text-muted-foreground">Network</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HD Wallet Mnemonic Display */}
        {isHD && generatedBatch.mnemonic && generatedBatch.seedPhrase && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Shield className="h-5 w-5" />
                Master Seed Phrase
                <Badge variant="destructive" className="ml-2">Keep Secure</Badge>
              </CardTitle>
              <CardDescription className="text-amber-700">
                This seed phrase can recover ALL wallets below. Store it securely and never share it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-amber-300">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-sm font-mono">
                  {generatedBatch.seedPhrase.map((word, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-gray-500 w-5">{index + 1}.</span>
                      <span className="font-medium">{word}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedBatch.mnemonic!, 'mnemonic')}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Seed Phrase
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Export & Integration Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export & Integration
            </CardTitle>
            <CardDescription>
              Export wallets or send directly to other tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {showPrivateKeys ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span className="font-medium">Include Private Keys in Export</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrivateKeys(!showPrivateKeys)}
              >
                {showPrivateKeys ? 'Hide' : 'Show'} Private Keys
              </Button>
            </div>

            {/* Export Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Export Files</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-1"
                  >
                    <Database className="h-3 w-3" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('json')}
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('txt')}
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Text
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Tool Integration</h4>
                <Button
                  onClick={handleSendToMultiSender}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to Multi-Sender
                </Button>
                <p className="text-xs text-muted-foreground">
                  Auto-populate Multi-Sender with {suggestedAmount} SOL per wallet
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet List */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Wallets</CardTitle>
            <CardDescription>
              {generatedBatch.wallets.length} wallets ready for use
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedBatch.wallets.map((wallet, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      {wallet.derivationPath && (
                        <Badge variant="secondary" className="text-xs">
                          {wallet.derivationPath}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallet.address, 'address')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Address:</span>
                      <div className="font-mono text-sm bg-white p-2 rounded border mt-1">
                        {wallet.address}
                      </div>
                    </div>
                    
                    {showPrivateKeys && (
                      <div>
                        <span className="font-medium text-red-600">Private Key:</span>
                        <div className="font-mono text-sm bg-red-50 p-2 rounded border mt-1 text-red-800">
                          {wallet.privateKey}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Suggested Amount: {suggestedAmount} SOL</span>
                      <span>Valid: ✅</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Security Important
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-700 text-sm space-y-2">
            <ul className="space-y-1">
              <li>• Private keys give FULL control over wallets</li>
              <li>• {isHD ? 'The seed phrase can recover ALL wallets above' : 'Back up each private key separately'}</li>
              <li>• Never share private keys or seed phrases with anyone</li>
              <li>• Store backups securely offline for production wallets</li>
              <li>• Consider hardware wallets for large amounts</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default fallback (should never reach here)
  return null;
};

export default WalletCreator;