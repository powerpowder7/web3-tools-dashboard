import React, { useState, useCallback, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useLocation } from 'react-router-dom';
import {
  getAccount,
  getAssociatedTokenAddress,
  createBurnInstruction,
  TOKEN_PROGRAM_ID,
  getMint
} from '@solana/spl-token';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Flame,
  AlertTriangle,
  Info,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  CheckCheck
} from 'lucide-react';

// Types
interface TokenInfo {
  mintAddress: string;
  name?: string;
  symbol?: string;
  decimals: number;
  supply: number;
  userBalance: number;
  isLoaded: boolean;
}

interface BurnStatus {
  status: 'idle' | 'loading' | 'confirming' | 'success' | 'error';
  message?: string;
  signature?: string;
  explorerUrl?: string;
}

const TokenBurner: React.FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const location = useLocation();

  // State management
  const [mintAddress, setMintAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    mintAddress: '',
    decimals: 0,
    supply: 0,
    userBalance: 0,
    isLoaded: false
  });
  const [burnAmount, setBurnAmount] = useState('');
  const [burnStatus, setBurnStatus] = useState<BurnStatus>({ status: 'idle' });
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [confirmations, setConfirmations] = useState({
    permanent: false,
    verified: false,
    tested: false
  });
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedSignature, setCopiedSignature] = useState(false);

  // Network detection
  const network = connection.rpcEndpoint.includes('devnet') ? 'Devnet' : 'Mainnet';
  const isMainnet = network === 'Mainnet';

  // Load token information
  const loadTokenInfo = useCallback(async () => {
    if (!mintAddress.trim() || !connected || !publicKey) {
      return;
    }

    setIsLoadingToken(true);

    try {
      // Validate mint address
      const mintPubkey = new PublicKey(mintAddress);

      // Get mint info
      const mintInfo = await getMint(connection, mintPubkey);

      // Get user's token account
      const userTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );

      // Get account info
      let balance = 0;
      try {
        const accountInfo = await getAccount(connection, userTokenAccount);
        balance = Number(accountInfo.amount) / Math.pow(10, mintInfo.decimals);
      } catch (error) {
        console.log('User has no token account for this mint');
      }

      const totalSupply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);

      setTokenInfo({
        mintAddress: mintPubkey.toString(),
        decimals: mintInfo.decimals,
        supply: totalSupply,
        userBalance: balance,
        isLoaded: true
      });

      setBurnStatus({
        status: 'idle',
        message: balance > 0 ? 'Token loaded successfully' : 'You have no balance of this token'
      });

    } catch (error: any) {
      console.error('Failed to load token:', error);
      setBurnStatus({
        status: 'error',
        message: error.message || 'Invalid token address or token does not exist'
      });
      setTokenInfo({
        mintAddress: '',
        decimals: 0,
        supply: 0,
        userBalance: 0,
        isLoaded: false
      });
    } finally {
      setIsLoadingToken(false);
    }
  }, [mintAddress, connected, publicKey, connection]);

  // Auto-load mint address from navigation state (from Token Creator)
  useEffect(() => {
    const state = location.state as { mintAddress?: string } | null;
    if (state?.mintAddress) {
      setMintAddress(state.mintAddress);
      // Auto-load token info after a short delay to ensure wallet is connected
      if (connected && publicKey) {
        setTimeout(() => {
          loadTokenInfo();
        }, 1000);
      }
    }
  }, [location.state, connected, publicKey]);

  // Execute burn transaction
  const executeBurn = async () => {
    if (!publicKey || !connected) {
      setBurnStatus({ status: 'error', message: 'Please connect your wallet' });
      return;
    }

    if (!tokenInfo.isLoaded) {
      setBurnStatus({ status: 'error', message: 'Please load token information first' });
      return;
    }

    if (!burnAmount || parseFloat(burnAmount) <= 0) {
      setBurnStatus({ status: 'error', message: 'Please enter a valid burn amount' });
      return;
    }

    const burnAmountNum = parseFloat(burnAmount);
    if (burnAmountNum > tokenInfo.userBalance) {
      setBurnStatus({ status: 'error', message: 'Insufficient token balance' });
      return;
    }

    if (!confirmations.permanent || !confirmations.verified || !confirmations.tested) {
      setBurnStatus({ status: 'error', message: 'Please confirm all safety checks' });
      return;
    }

    setBurnStatus({ status: 'loading', message: 'Preparing burn transaction...' });

    try {
      const mintPubkey = new PublicKey(tokenInfo.mintAddress);

      // Get user's token account
      const userTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );

      // Calculate burn amount with decimals
      const burnAmountLamports = BigInt(
        Math.floor(burnAmountNum * Math.pow(10, tokenInfo.decimals))
      );

      // Create burn instruction
      const burnInstruction = createBurnInstruction(
        userTokenAccount,
        mintPubkey,
        publicKey,
        burnAmountLamports,
        [],
        TOKEN_PROGRAM_ID
      );

      // Create transaction
      const transaction = new Transaction().add(burnInstruction);

      // Get recent blockhash with finalized commitment for longer validity
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('Burn transaction prepared');
      console.log('Blockhash:', blockhash);
      console.log('Last valid block height:', lastValidBlockHeight);

      setBurnStatus({ status: 'confirming', message: 'Awaiting wallet confirmation...' });

      // Send transaction
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      console.log('Burn transaction sent:', signature);

      setBurnStatus({
        status: 'confirming',
        message: `Burning ${burnAmountNum.toLocaleString()} tokens (this may take 30-60 seconds)...`
      });

      // Wait for confirmation with polling (same as Token Creator)
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
            console.log('Burn transaction confirmed!');
            break;
          }

          // Wait 1 second before checking again
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;

          console.log(`Checking burn confirmation... (${retries}/${maxRetries})`);

        } catch (err) {
          console.warn('Error checking burn status:', err);
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!confirmed) {
        console.warn('Burn confirmation timeout - check explorer');
        setBurnStatus({
          status: 'confirming',
          message: 'Transaction sent! Confirmation taking longer than expected. Check explorer link below.',
          signature,
          explorerUrl: getExplorerUrl(signature, 'tx')
        });
        return;
      }

      const explorerUrl = getExplorerUrl(signature, 'tx');

      setBurnStatus({
        status: 'success',
        message: `Successfully burned ${burnAmountNum.toLocaleString()} tokens`,
        signature,
        explorerUrl
      });

      // Reset form
      setBurnAmount('');
      setConfirmations({ permanent: false, verified: false, tested: false });

      // Reload token info to update balance
      setTimeout(() => {
        loadTokenInfo();
      }, 2000);

    } catch (error: any) {
      console.error('Burn transaction failed:', error);
      setBurnStatus({
        status: 'error',
        message: error.message || 'Failed to burn tokens. Please try again.'
      });
    }
  };

  // Utility functions
  const getExplorerUrl = (identifier: string, type: 'address' | 'tx' = 'address'): string => {
    const cluster = network === 'Devnet' ? '?cluster=devnet' : '';
    return `https://solscan.io/${type}/${identifier}${cluster}`;
  };

  const copyToClipboard = async (text: string, type: 'address' | 'signature') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedSignature(true);
        setTimeout(() => setCopiedSignature(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const canBurn = connected &&
    tokenInfo.isLoaded &&
    tokenInfo.userBalance > 0 &&
    parseFloat(burnAmount || '0') > 0 &&
    parseFloat(burnAmount || '0') <= tokenInfo.userBalance &&
    confirmations.permanent &&
    confirmations.verified &&
    confirmations.tested &&
    burnStatus.status !== 'loading' &&
    burnStatus.status !== 'confirming';

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
        <Badge
          variant="secondary"
          className={isMainnet ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"}
        >
          <Flame className="w-4 h-4 mr-1" />
          {network}
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

      {/* Wallet Connection Warning */}
      {!connected && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Wallet Connection Required
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Please connect your Solana wallet to use the Token Burner.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter token mint address..."
                  className="font-mono text-sm"
                  value={mintAddress}
                  onChange={(e) => setMintAddress(e.target.value)}
                  disabled={isLoadingToken || burnStatus.status === 'loading' || burnStatus.status === 'confirming'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadTokenInfo();
                    }
                  }}
                />
                {tokenInfo.isLoaded && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(tokenInfo.mintAddress, 'address')}
                  >
                    {copiedAddress ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The mint address of the SPL token you want to burn
              </p>
            </div>

            <div>
              <Button
                variant="outline"
                className="w-full"
                onClick={loadTokenInfo}
                disabled={!mintAddress.trim() || !connected || isLoadingToken}
              >
                {isLoadingToken ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Load Token Info
                  </>
                )}
              </Button>
            </div>

            {/* Token Info Display */}
            {tokenInfo.isLoaded ? (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Token Address:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono">{formatAddress(tokenInfo.mintAddress)}</span>
                    <a
                      href={getExplorerUrl(tokenInfo.mintAddress, 'address')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Decimals:</span>
                  <span className="text-sm">{tokenInfo.decimals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Supply:</span>
                  <span className="text-sm">{tokenInfo.supply.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium">Your Balance:</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {tokenInfo.userBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Token information will appear here after entering a valid mint address
                </p>
              </div>
            )}
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
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                disabled={!tokenInfo.isLoaded || tokenInfo.userBalance === 0 || burnStatus.status === 'loading' || burnStatus.status === 'confirming'}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter the exact amount of tokens to permanently destroy
                </p>
                {tokenInfo.isLoaded && tokenInfo.userBalance > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setBurnAmount(tokenInfo.userBalance.toString())}
                  >
                    Max
                  </Button>
                )}
              </div>
            </div>

            <div className={`${tokenInfo.userBalance > 0 ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'} border p-3 rounded-lg`}>
              <h4 className={`font-medium ${tokenInfo.userBalance > 0 ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'} mb-1`}>
                Current Balance
              </h4>
              <p className={`text-sm ${tokenInfo.userBalance > 0 ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                Available: {tokenInfo.isLoaded ? tokenInfo.userBalance.toLocaleString() : '0'} tokens
              </p>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={!canBurn}
                onClick={executeBurn}
              >
                {burnStatus.status === 'loading' || burnStatus.status === 'confirming' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {burnStatus.message}
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 mr-2" />
                    Burn Tokens
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Status */}
      {burnStatus.message && (
        <Card className={
          burnStatus.status === 'success' ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' :
          burnStatus.status === 'error' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' :
          'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
        }>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              {burnStatus.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />}
              {burnStatus.status === 'error' && <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />}
              {(burnStatus.status === 'loading' || burnStatus.status === 'confirming') && <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />}
              {burnStatus.status === 'idle' && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />}

              <div className="flex-1">
                <h3 className={`font-medium ${
                  burnStatus.status === 'success' ? 'text-green-800 dark:text-green-200' :
                  burnStatus.status === 'error' ? 'text-red-800 dark:text-red-200' :
                  'text-blue-800 dark:text-blue-200'
                }`}>
                  {burnStatus.status === 'success' ? '✓ Success!' :
                   burnStatus.status === 'error' ? '✗ Error' :
                   burnStatus.status === 'loading' ? 'Processing...' :
                   burnStatus.status === 'confirming' ? 'Confirming...' :
                   'Status'}
                </h3>
                <p className={`text-sm mt-1 ${
                  burnStatus.status === 'success' ? 'text-green-700 dark:text-green-300' :
                  burnStatus.status === 'error' ? 'text-red-700 dark:text-red-300' :
                  'text-blue-700 dark:text-blue-300'
                }`}>
                  {burnStatus.message}
                </p>

                {burnStatus.signature && burnStatus.explorerUrl && (
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded">
                      {formatAddress(burnStatus.signature)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(burnStatus.signature!, 'signature')}
                    >
                      {copiedSignature ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <a
                      href={burnStatus.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View on Explorer
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <span>{tokenInfo.isLoaded ? formatAddress(tokenInfo.mintAddress) : 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount to Burn:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {burnAmount || '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                  <span>
                    {tokenInfo.isLoaded && burnAmount
                      ? (tokenInfo.userBalance - parseFloat(burnAmount || '0')).toLocaleString()
                      : '-'}
                  </span>
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
                <label className="flex items-start space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={confirmations.permanent}
                    onChange={(e) => setConfirmations({ ...confirmations, permanent: e.target.checked })}
                    disabled={burnStatus.status === 'loading' || burnStatus.status === 'confirming'}
                  />
                  <span className="text-red-700 dark:text-red-300">
                    I understand this action is permanent and irreversible
                  </span>
                </label>
                <label className="flex items-start space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={confirmations.verified}
                    onChange={(e) => setConfirmations({ ...confirmations, verified: e.target.checked })}
                    disabled={burnStatus.status === 'loading' || burnStatus.status === 'confirming'}
                  />
                  <span className="text-red-700 dark:text-red-300">
                    I have verified the token address and amount
                  </span>
                </label>
                <label className="flex items-start space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={confirmations.tested}
                    onChange={(e) => setConfirmations({ ...confirmations, tested: e.target.checked })}
                    disabled={burnStatus.status === 'loading' || burnStatus.status === 'confirming'}
                  />
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
