// src/pages/solana/WalletCreator.tsx
import React, { useState, useCallback, useEffect } from 'react';
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
  RefreshCw,
  Info
} from 'lucide-react';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import analytics from '@/services/analytics';
import { 
  generateRealWallets, 
  validateGenerationSecurity,
  type RealGeneratedBatch,
  type WalletGenerationType 
} from '@/utils/realWalletGeneration';

// Simple progress bar component (if not available in UI library)
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-muted rounded-full h-2 ${className}`}>
    <div
      className="bg-primary h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

// Types
type GenerationStep = 'config' | 'generating' | 'results';

interface GenerationProgress {
  current: number;
  total: number;
  step: string;
}

const WalletCreator: React.FC = () => {
  const { network } = useSolanaWallet();
  const [currentStep, setCurrentStep] = useState<GenerationStep>('config');
  const [walletType, setWalletType] = useState<WalletGenerationType>('hd');
  const [walletCount, setWalletCount] = useState<number>(5);
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [suggestedAmount, setSuggestedAmount] = useState<number>(0.1);
  const [generatedBatch, setGeneratedBatch] = useState<RealGeneratedBatch | null>(null);
  const [progress, setProgress] = useState<GenerationProgress>({ current: 0, total: 0, step: '' });
  const [showPrivateKeys, setShowPrivateKeys] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  // Check security on component mount
  useEffect(() => {
    const { warnings } = validateGenerationSecurity();
    setSecurityWarnings(warnings);
  }, []);

  // Handle wallet generation with real cryptography
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
          network: network,
          real_generation: true
        }
      });

      // Progress simulation with realistic steps
      const steps = [
        'Initializing cryptographically secure random generator...',
        walletType === 'hd' ? 'Generating BIP39 mnemonic seed phrase...' : 'Generating Ed25519 keypairs...',
        walletType === 'hd' ? 'Deriving HD wallet keys from seed...' : 'Creating independent keypairs...',
        'Generating Solana addresses...',
        'Validating generated wallets...',
        'Finalizing wallet data...'
      ];

      for (let i = 0; i < steps.length - 1; i++) {
        setProgress({
          current: i + 1,
          total: steps.length,
          step: steps[i]
        });
        
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));
      }

      // Final step - actual generation
      setProgress({
        current: steps.length - 1,
        total: steps.length,
        step: steps[steps.length - 1]
      });

      // Generate real wallets using cryptographic functions
      const batch = await generateRealWallets(walletCount, walletType, wordCount);
      
      setProgress({
        current: steps.length,
        total: steps.length,
        step: 'Generation complete!'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      setGeneratedBatch(batch);
      setCurrentStep('results');

      analytics.toolUsed({
        tool_name: 'wallet_creator',
        action: 'generation_completed',
        success: true,
        metadata: {
          type: walletType,
          generated_count: batch.wallets.length,
          network: network,
          real_generation: true,
          has_mnemonic: !!batch.mnemonic
        }
      });

    } catch (error) {
      console.error('Real wallet generation failed:', error);
      
      analytics.captureError(error as Error, {
        context: 'real_wallet_generation',
        wallet_type: walletType,
        wallet_count: walletCount
      });
      
      // Show user-friendly error message
      alert(`Wallet generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCurrentStep('config');
    } finally {
      setIsGenerating(false);
    }
  }, [walletType, walletCount, wordCount, network]);

  // Handle export (updated to work with real wallet data)
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
            cryptographicallyGenerated: true,
            ...(walletType === 'hd' && generatedBatch.mnemonic && {
              mnemonic: generatedBatch.mnemonic,
              seedPhrase: generatedBatch.seedPhrase,
              wordCount: generatedBatch.seedPhrase?.length || wordCount
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
          lines.push('='.repeat(70));
          lines.push(`SOLANA WALLET BATCH EXPORT - CRYPTOGRAPHICALLY GENERATED`);
          lines.push(`Generated: ${new Date().toISOString()}`);
          lines.push(`Type: ${walletType === 'hd' ? 'HD Wallets (BIP39/BIP44)' : 'Standard Ed25519 Keypairs'}`);
          lines.push(`Network: ${network}`);
          lines.push(`Total Wallets: ${generatedBatch.wallets.length}`);
          lines.push('='.repeat(70));
          lines.push('');

          if (walletType === 'hd' && generatedBatch.mnemonic) {
            lines.push('RECOVERY SEED PHRASE (KEEP SECURE):');
            lines.push(generatedBatch.mnemonic);
            lines.push('');
            lines.push('This seed phrase can recover ALL wallets below!');
            lines.push('');
          }

          lines.push('WALLET DETAILS:');
          lines.push('');
          generatedBatch.wallets.forEach((wallet, index) => {
            lines.push(`Wallet #${index + 1}:`);
            lines.push(`  Address: ${wallet.address}`);
            if (wallet.derivationPath) {
              lines.push(`  Path: ${wallet.derivationPath}`);
            }
            if (showPrivateKeys) {
              lines.push(`  Private Key: ${wallet.privateKey}`);
            }
            lines.push(`  Suggested Amount: ${suggestedAmount} SOL`);
            lines.push('');
          });

          lines.push('SECURITY REMINDERS:');
          lines.push('• Private keys give FULL control over wallets');
          lines.push('• Never share private keys or seed phrases');
          lines.push('• Store backups securely offline');
          lines.push('• Consider hardware wallets for large amounts');

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
          filename: filename,
          include_private_keys: showPrivateKeys,
          wallet_count: generatedBatch.wallets.length
        }
      });

    } catch (error) {
      console.error('Export failed:', error);
      analytics.captureError(error as Error, {
        context: 'wallet_export'
      });
      alert('Export failed. Please try again.');
    }
  }, [generatedBatch, showPrivateKeys, suggestedAmount, walletType, walletCount, network, wordCount]);

  // Handle Multi-Sender integration
  const handleSendToMultiSender = useCallback(async () => {
    if (!generatedBatch) return;

    try {
      const recipients = generatedBatch.wallets.map((wallet) => ({
        address: wallet.address,
        amount: suggestedAmount,
        source: 'wallet-generator',
        isValid: true
      }));

      // Store in localStorage for Multi-Sender integration
      localStorage.setItem('web3tools_shared_multi_sender', JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'wallet_creator',
        target: 'multi_sender',
        recipients: recipients,
        metadata: {
          wallet_type: walletType,
          generated_count: generatedBatch.wallets.length,
          cryptographically_generated: true
        }
      }));

      analytics.toolUsed({
        tool_name: 'wallet_creator',
        action: 'send_to_multisender',
        success: true,
        metadata: {
          wallet_count: generatedBatch.wallets.length,
          suggested_amount: suggestedAmount,
          wallet_type: walletType
        }
      });
      
      alert(`Successfully sent ${generatedBatch.wallets.length} wallets to Multi-Sender tool!`);
    } catch (error) {
      console.error('Multi-Sender integration failed:', error);
      alert('Failed to send wallets to Multi-Sender. Please try exporting manually.');
    }
  }, [generatedBatch, suggestedAmount, walletType]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      analytics.trackEvent('wallet_creator_copy', { type, length: text.length });
      
      // Visual feedback could be added here
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
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
      <div className="wallet-creator-container max-w-full overflow-hidden space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Wallet Creator</h1>
          <p className="text-muted-foreground">
            Generate cryptographically secure Solana wallets for development and production use
          </p>
        </div>

        {/* Security Warning */}
        {securityWarnings.length > 0 && (
          <Card className="border-warning bg-warning/10 dark:border-warning/30 dark:bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning dark:text-warning">
                <Info className="h-5 w-5" />
                Environment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-warning/80 dark:text-warning/70 space-y-1">
                {securityWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
              {network === 'mainnet-beta' && securityWarnings.length > 0 && (
                <p className="mt-2 text-sm font-medium text-warning dark:text-warning">
                  For production mainnet wallets, consider using a hardware wallet or offline generation.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Wallet Type Selection */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className={`cursor-pointer transition-all duration-200 ${
              walletType === 'hd'
                ? 'ring-2 ring-primary bg-primary/10'
                : 'hover:shadow-md'
            }`}
            onClick={() => setWalletType('hd')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">HD Wallets</CardTitle>
                  <Badge variant="secondary" className="bg-success/20 text-success dark:bg-success/10 dark:text-success">
                    Recommended
                  </Badge>
                </div>
                {walletType === 'hd' && <CheckCircle className="h-5 w-5 text-primary" />}
              </div>
              <CardDescription>
                Generate wallets from a single BIP39 seed phrase. More secure and easier to backup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Single seed phrase recovers all wallets</li>
                <li>• Industry standard (BIP39/BIP44)</li>
                <li>• Hierarchical derivation paths</li>
                <li>• Cryptographically secure generation</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 ${
              walletType === 'standard'
                ? 'ring-2 ring-secondary bg-secondary/10'
                : 'hover:shadow-md'
            }`}
            onClick={() => setWalletType('standard')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-secondary" />
                  <CardTitle className="text-lg">Standard Keypairs</CardTitle>
                </div>
                {walletType === 'standard' && <CheckCircle className="h-5 w-5 text-secondary" />}
              </div>
              <CardDescription>
                Generate independent Ed25519 keypairs. Each wallet has unique private key.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Independent Ed25519 private keys</li>
                <li>• No relationship between wallets</li>
                <li>• Direct cryptographic generation</li>
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
                  <p className="text-xs text-muted-foreground">24 words = maximum security</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Suggested Amount (SOL)</label>
                <Input
                  type="number"
                  step="0.001"
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
                ? 'bg-destructive/10 text-destructive border border-destructive/30'
                : 'bg-primary/10 text-primary border border-primary/30'
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {network === 'mainnet-beta'
                  ? 'Production mode: Generated wallets will be on Solana Mainnet - USE WITH CAUTION'
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
            Generate {walletCount} Real {walletType === 'hd' ? 'HD' : 'Standard'} Wallet{walletCount > 1 ? 's' : ''}
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
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              Generating Real Wallets
            </CardTitle>
            <CardDescription>
              Creating cryptographically secure {walletType === 'hd' ? 'HD wallets from BIP39 seed' : 'Ed25519 keypairs'}
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
      <div className="wallet-creator-container max-w-full overflow-hidden space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Real Wallet Generation Complete</h1>
            <p className="text-muted-foreground">
              Successfully generated {generatedBatch.wallets.length} cryptographically secure {walletType} wallets
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
              <CheckCircle className="h-5 w-5 text-success" />
              Generation Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-success">{generatedBatch.wallets.length}</div>
                <div className="text-sm text-muted-foreground">Real Wallets Generated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">{walletType.toUpperCase()}</div>
                <div className="text-sm text-muted-foreground">
                  {walletType === 'hd' ? 'BIP39/BIP44' : 'Ed25519'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">{network}</div>
                <div className="text-sm text-muted-foreground">Network</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HD Wallet Mnemonic Display */}
        {isHD && generatedBatch.mnemonic && generatedBatch.seedPhrase && (
          <Card className="border-warning bg-warning/10 dark:border-warning/30 dark:bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning dark:text-warning">
                <Shield className="h-5 w-5" />
                Master Seed Phrase - REAL RECOVERY PHRASE
                <Badge variant="destructive" className="ml-2">KEEP SECURE</Badge>
              </CardTitle>
              <CardDescription className="text-warning/80 dark:text-warning/70">
                This BIP39 seed phrase can recover ALL {generatedBatch.wallets.length} wallets below.
                Store it securely offline and never share it with anyone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-card p-4 rounded-lg border-2 border-dashed border-warning/30">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-sm font-mono">
                  {generatedBatch.seedPhrase.map((word, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-accent rounded">
                      <span className="text-muted-foreground w-6 text-center">{index + 1}.</span>
                      <span className="font-medium text-foreground">{word}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedBatch.mnemonic!, 'mnemonic')}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Seed Phrase
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('txt')}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Backup to File
                </Button>
              </div>
              <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/30">
                <p className="text-destructive dark:text-destructive text-sm font-medium">
                  SECURITY WARNING: Anyone with this seed phrase has FULL CONTROL over all generated wallets!
                </p>
              </div>
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
              Export real wallets or send directly to other tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
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
            <CardTitle>Generated Real Wallets</CardTitle>
            <CardDescription>
              {generatedBatch.wallets.length} cryptographically secure wallets ready for use on {network}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedBatch.wallets.map((wallet, index) => (
                <div key={index} className="p-4 border rounded-lg bg-accent hover:bg-accent/80 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      {wallet.derivationPath && (
                        <Badge variant="secondary" className="text-xs">
                          {wallet.derivationPath}
                        </Badge>
                      )}
                      <Badge variant="default" className="text-xs bg-success">
                        REAL
                      </Badge>
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
                      <span className="font-medium text-muted-foreground">Address:</span>
                      <div className="font-mono text-sm bg-card p-2 rounded border mt-1">
                        {wallet.address}
                      </div>
                    </div>
                    
                    {showPrivateKeys && (
                      <div>
                        <span className="font-medium text-destructive">Private Key:</span>
                        <div className="font-mono text-sm bg-destructive/10 p-2 rounded border border-destructive/30 mt-1 text-destructive">
                          {wallet.privateKey}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Suggested Amount: {suggestedAmount} SOL</span>
                      <span>Cryptographically Generated: ✅</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-destructive/30 bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Critical Security Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-destructive dark:text-destructive text-sm space-y-2">
            <div className="bg-card p-3 rounded border">
              <p className="font-medium mb-2">THESE ARE REAL, FUNCTIONAL WALLETS:</p>
              <ul className="space-y-1">
                <li>• Private keys give FULL control over wallets and any funds sent to them</li>
                <li>• {isHD ? 'The seed phrase above can recover ALL wallets in this batch' : 'Back up each private key separately and securely'}</li>
                <li>• Never share private keys or seed phrases with anyone</li>
                <li>• Store backups securely offline for production use</li>
                <li>• Consider hardware wallets for storing significant amounts</li>
                <li>• Test with small amounts first before using for production</li>
              </ul>
            </div>
            {network === 'mainnet-beta' && (
              <div className="bg-destructive/10 p-3 rounded border border-destructive/30">
                <p className="font-bold text-destructive">
                  MAINNET WARNING: These wallets are on Solana Mainnet. Any SOL or tokens sent to these addresses are REAL VALUE!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default fallback (should never reach here)
  return null;
};

export default WalletCreator;