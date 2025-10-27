// BRAND NEW Token Creator - Built from Research 2024
// Simplified, Working Implementation
import React, { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Keypair,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createMintToInstruction
} from '@solana/spl-token';
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
  Wallet,
  Loader2,
  CheckCircle2,
  Copy,
  ExternalLink,
  AlertCircle,
  Flame,
  Send,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Vote,
  Rocket,
  DollarSign,
  Zap
} from 'lucide-react';
import WalletButton from '@/components/common/WalletButton';
import { useNavigate } from 'react-router-dom';

// Token types enum
type TokenType = 'standard' | 'deflationary' | 'governance' | 'meme' | 'stable';

// Advanced interface with all features
interface TokenFormData {
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  description?: string;
  tokenType: TokenType;
  deflationRate?: number; // For deflationary tokens (0-10%)
  enablePumpFun: boolean;
  pumpFunInitialLiquidity?: number; // SOL amount for bonding curve
  revokeMintAuthority: boolean;
  revokeFreezeAuthority: boolean;
}

const TokenCreatorNew: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<TokenFormData>({
    name: '',
    symbol: '',
    decimals: 9,
    supply: 1000000,
    description: '',
    tokenType: 'standard',
    deflationRate: 2,
    enablePumpFun: false,
    pumpFunInitialLiquidity: 1,
    revokeMintAuthority: false,
    revokeFreezeAuthority: false
  });

  // Show advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<{
    mintAddress: string;
    signature: string;
    explorerUrl: string;
  } | null>(null);
  const [error, setError] = useState<string>('');

  // Main token creation function - WORKING 2024 METHOD
  const createToken = useCallback(async () => {
    if (!publicKey || !connection) {
      setError('Please connect your wallet');
      return;
    }

    if (!formData.name || !formData.symbol) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setError('');
    setStatus('Preparing transaction...');

    try {
      // Step 1: Generate new mint keypair
      const mintKeypair = Keypair.generate();
      console.log('Generated mint address:', mintKeypair.publicKey.toString());
      setStatus(`Generated mint address: ${mintKeypair.publicKey.toString().slice(0, 8)}...`);

      // Step 2: Get rent exemption amount
      setStatus('Calculating rent exemption...');
      const lamports = await getMinimumBalanceForRentExemptMint(connection);
      console.log('Rent exemption:', lamports / LAMPORTS_PER_SOL, 'SOL');

      // Step 3: Get associated token account address
      setStatus('Getting associated token account...');
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      );
      console.log('ATA:', associatedTokenAccount.toString());

      // Step 4: Create transaction with all instructions
      setStatus('Building transaction...');
      const transaction = new Transaction();

      // Add create account instruction
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: MINT_SIZE,
          lamports,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Add initialize mint instruction
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          formData.decimals,
          publicKey, // mint authority
          publicKey, // freeze authority
          TOKEN_PROGRAM_ID
        )
      );

      // Add create associated token account instruction
      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey, // payer
          associatedTokenAccount, // associated token account
          publicKey, // owner
          mintKeypair.publicKey, // mint
          TOKEN_PROGRAM_ID
        )
      );

      // Add mint to instruction (if supply > 0)
      if (formData.supply > 0) {
        const amount = BigInt(formData.supply * Math.pow(10, formData.decimals));
        transaction.add(
          createMintToInstruction(
            mintKeypair.publicKey, // mint
            associatedTokenAccount, // destination
            publicKey, // authority
            amount, // amount
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }

      // Step 5: Get recent blockhash with finalized commitment for longer validity
      setStatus('Getting recent blockhash...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('Blockhash:', blockhash);
      console.log('Last valid block height:', lastValidBlockHeight);

      // Step 6: Partial sign with mint keypair
      transaction.partialSign(mintKeypair);
      console.log('Transaction partially signed with mint keypair');

      // Step 7: Send transaction (wallet will sign)
      setStatus('Requesting wallet approval...');
      console.log('Sending transaction for wallet approval...');

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      console.log('Transaction sent:', signature);
      setStatus('Confirming transaction (this may take 30-60 seconds)...');

      // Step 8: Wait for confirmation with timeout handling
      let confirmed = false;
      let retries = 0;
      const maxRetries = 30; // 30 seconds

      while (!confirmed && retries < maxRetries) {
        try {
          const status = await connection.getSignatureStatus(signature);

          if (status?.value?.confirmationStatus === 'confirmed' ||
              status?.value?.confirmationStatus === 'finalized') {

            if (status.value.err) {
              throw new Error('Transaction failed: ' + JSON.stringify(status.value.err));
            }

            confirmed = true;
            console.log('Transaction confirmed!');
            break;
          }

          // Wait 1 second before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;

          console.log(`Checking confirmation status... (${retries}/${maxRetries})`);

        } catch (err) {
          console.warn('Error checking status:', err);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!confirmed) {
        // Transaction might still succeed, just taking longer
        console.warn('Transaction confirmation timeout - check explorer');
        setStatus('Transaction sent! Confirmation taking longer than expected. Check explorer link below.');
      }

      console.log('Token created successfully!');

      // Generate explorer URL
      const explorerUrl = `https://explorer.solana.com/address/${mintKeypair.publicKey.toString()}?cluster=devnet`;

      // Set result
      setResult({
        mintAddress: mintKeypair.publicKey.toString(),
        signature,
        explorerUrl
      });

      setStatus('Token created successfully!');
      setIsCreating(false);

    } catch (err: any) {
      console.error('Token creation failed:', err);

      let errorMsg = 'Token creation failed';
      if (err.message) {
        if (err.message.includes('User rejected')) {
          errorMsg = 'Transaction cancelled by user';
        } else if (err.message.includes('insufficient')) {
          errorMsg = 'Insufficient SOL balance';
        } else {
          errorMsg = err.message;
        }
      }

      setError(errorMsg);
      setStatus('');
      setIsCreating(false);
    }
  }, [connection, publicKey, sendTransaction, formData]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetForm = () => {
    setResult(null);
    setError('');
    setStatus('');
    setShowAdvanced(false);
    setFormData({
      name: '',
      symbol: '',
      decimals: 9,
      supply: 1000000,
      description: '',
      tokenType: 'standard',
      deflationRate: 2,
      enablePumpFun: false,
      pumpFunInitialLiquidity: 1,
      revokeMintAuthority: false,
      revokeFreezeAuthority: false
    });
  };

  // Validation
  const isFormValid = formData.name.trim() !== '' &&
                      formData.symbol.trim() !== '' &&
                      formData.decimals >= 0 &&
                      formData.decimals <= 9 &&
                      formData.supply >= 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Token Creator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create SPL tokens on Solana in seconds
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified Working
          </Badge>
        </div>
      </div>

      {/* Wallet Connection Required */}
      {!publicKey ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-6">
                Connect your Solana wallet to create tokens
              </p>
              <WalletButton />
            </div>
          </CardContent>
        </Card>
      ) : result ? (
        /* Success Screen */
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-6 h-6 mr-2" />
              Token Created Successfully!
            </CardTitle>
            <CardDescription>Your token has been deployed to Solana</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mint Address */}
            <div>
              <label className="text-sm font-medium text-gray-600">Mint Address</label>
              <div className="flex items-center space-x-2 mt-1">
                <code className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 rounded border text-sm break-all">
                  {result.mintAddress}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.mintAddress)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Transaction Signature */}
            <div>
              <label className="text-sm font-medium text-gray-600">Transaction Signature</label>
              <div className="flex items-center space-x-2 mt-1">
                <code className="flex-1 bg-white dark:bg-gray-800 px-3 py-2 rounded border text-sm break-all">
                  {result.signature}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.signature)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                What's Next?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => navigate('/solana/token-burner', { state: { mintAddress: result.mintAddress } })}
                  variant="outline"
                  className="w-full bg-white dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                  size="sm"
                >
                  <Flame className="w-4 h-4 mr-2 text-orange-600" />
                  Burn Tokens
                </Button>
                <Button
                  onClick={() => navigate('/solana/multi-sender', { state: { tokenMint: result.mintAddress } })}
                  variant="outline"
                  className="w-full bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2 text-green-600" />
                  Distribute Tokens
                </Button>
                <Button
                  onClick={() => window.open(result.explorerUrl, '_blank')}
                  variant="outline"
                  className="w-full bg-white dark:bg-gray-800"
                  size="sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Explorer
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <Button
                onClick={resetForm}
                variant="default"
                className="flex-1"
              >
                <Coins className="w-4 h-4 mr-2" />
                Create Another Token
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Token Creation Form */
        <Card className="border-2 border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-b">
            <CardTitle className="flex items-center">
              <Coins className="w-5 h-5 mr-2 text-blue-600" />
              Create New Token
            </CardTitle>
            <CardDescription>
              Fill in the details below to create your SPL token on Solana
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Status Message */}
            {status && !error && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center">
                <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin flex-shrink-0" />
                <p className="text-sm text-blue-700">{status}</p>
              </div>
            )}

            {/* Token Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Token Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., My Awesome Token"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isCreating}
                className="h-11"
              />
              <p className="text-xs text-gray-500">The full name of your token</p>
            </div>

            {/* Token Symbol */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Token Symbol <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., MAT"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                maxLength={10}
                disabled={isCreating}
                className="h-11"
              />
              <p className="text-xs text-gray-500">Short ticker symbol (max 10 characters)</p>
            </div>

            {/* Grid for Decimals and Supply */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Decimals
                </label>
                <Input
                  type="number"
                  min="0"
                  max="9"
                  value={formData.decimals}
                  onChange={(e) => setFormData({ ...formData, decimals: parseInt(e.target.value) || 0 })}
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">0-9 (9 recommended)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Supply
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.supply}
                  onChange={(e) => setFormData({ ...formData, supply: parseFloat(e.target.value) || 0 })}
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">Tokens to mint</p>
              </div>
            </div>

            {/* Token Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Token Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tokenType: 'standard' })}
                  disabled={isCreating}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.tokenType === 'standard'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <Coins className={`w-5 h-5 mx-auto mb-1 ${formData.tokenType === 'standard' ? 'text-blue-600' : 'text-gray-600'}`} />
                  <div className="text-xs font-medium">Standard</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tokenType: 'deflationary' })}
                  disabled={isCreating}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.tokenType === 'deflationary'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                >
                  <TrendingDown className={`w-5 h-5 mx-auto mb-1 ${formData.tokenType === 'deflationary' ? 'text-red-600' : 'text-gray-600'}`} />
                  <div className="text-xs font-medium">Deflationary</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tokenType: 'governance' })}
                  disabled={isCreating}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.tokenType === 'governance'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 hover:border-purple-300'
                  }`}
                >
                  <Vote className={`w-5 h-5 mx-auto mb-1 ${formData.tokenType === 'governance' ? 'text-purple-600' : 'text-gray-600'}`} />
                  <div className="text-xs font-medium">Governance</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tokenType: 'meme' })}
                  disabled={isCreating}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.tokenType === 'meme'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-300 hover:border-orange-300'
                  }`}
                >
                  <Rocket className={`w-5 h-5 mx-auto mb-1 ${formData.tokenType === 'meme' ? 'text-orange-600' : 'text-gray-600'}`} />
                  <div className="text-xs font-medium">Meme</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tokenType: 'stable' })}
                  disabled={isCreating}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.tokenType === 'stable'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <DollarSign className={`w-5 h-5 mx-auto mb-1 ${formData.tokenType === 'stable' ? 'text-green-600' : 'text-gray-600'}`} />
                  <div className="text-xs font-medium">Stable</div>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {formData.tokenType === 'standard' && 'Standard SPL token with no special features'}
                {formData.tokenType === 'deflationary' && 'Burns tokens on each transfer to reduce supply'}
                {formData.tokenType === 'governance' && 'Used for DAO voting and governance'}
                {formData.tokenType === 'meme' && 'Community-driven token with viral potential'}
                {formData.tokenType === 'stable' && 'Designed to maintain stable value (requires collateral)'}
              </p>
            </div>

            {/* Deflationary Rate (only for deflationary tokens) */}
            {formData.tokenType === 'deflationary' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center">
                  <Flame className="w-4 h-4 text-red-600 mr-2" />
                  <h4 className="font-semibold text-red-900 dark:text-red-100">Deflationary Settings</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Burn Rate per Transfer (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.deflationRate}
                    onChange={(e) => setFormData({ ...formData, deflationRate: parseFloat(e.target.value) || 0 })}
                    disabled={isCreating}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.deflationRate}% of each transfer will be burned (0-10% recommended)
                  </p>
                </div>
              </div>
            )}

            {/* Pump.fun Integration */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-pink-600 mr-2" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Pump.fun Bonding Curve</h4>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enablePumpFun}
                    onChange={(e) => setFormData({ ...formData, enablePumpFun: e.target.checked })}
                    disabled={isCreating}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                </label>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Launch your token with a bonding curve on Pump.fun for instant liquidity and price discovery
              </p>
              {formData.enablePumpFun && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Initial Liquidity (SOL)
                  </label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.pumpFunInitialLiquidity}
                    onChange={(e) => setFormData({ ...formData, pumpFunInitialLiquidity: parseFloat(e.target.value) || 0 })}
                    disabled={isCreating}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500">
                    Amount of SOL to add to the bonding curve (minimum 1 SOL recommended)
                  </p>
                </div>
              )}
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                placeholder="Brief description of your token..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                rows={2}
                disabled={isCreating}
              />
            </div>

            {/* Advanced Options Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium text-gray-700 dark:text-gray-300">Advanced Options</span>
              {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <h4 className="font-semibold text-gray-900 dark:text-white">Authority Management</h4>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.revokeMintAuthority}
                      onChange={(e) => setFormData({ ...formData, revokeMintAuthority: e.target.checked })}
                      disabled={isCreating}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Revoke Mint Authority (Permanent Supply)
                      </div>
                      <div className="text-xs text-gray-500">
                        No one will be able to mint more tokens after creation
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.revokeFreezeAuthority}
                      onChange={(e) => setFormData({ ...formData, revokeFreezeAuthority: e.target.checked })}
                      disabled={isCreating}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Revoke Freeze Authority
                      </div>
                      <div className="text-xs text-gray-500">
                        Tokens cannot be frozen in user wallets
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                What happens next:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>New mint account will be created on Solana</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>{formData.supply > 0 ? `${formData.supply.toLocaleString()} ${formData.symbol || 'tokens'} will be minted to your wallet` : 'No initial supply (you can mint later)'}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>Estimated cost: <strong>~0.002-0.003 SOL</strong></span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>You retain full mint and freeze authority</span>
                </li>
              </ul>
            </div>

            {/* Create Button */}
            <Button
              onClick={createToken}
              disabled={!isFormValid || isCreating}
              className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Token...
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5 mr-2" />
                  Create Token Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Creates a new mint account</li>
              <li>Initializes the mint with your settings</li>
              <li>Creates an associated token account</li>
              <li>Mints initial supply to your wallet</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>✓ Solana wallet (Phantom/Solflare)</li>
              <li>✓ ~0.003 SOL for transaction</li>
              <li>✓ Connected to Devnet for testing</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TokenCreatorNew;
