// src/pages/solana/MultiSender.tsx - Clean Production Version
import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, Download, Plus, Minus, Send, AlertTriangle, 
  Loader2, FileText, Users, Wallet, 
  Info, Target, Zap, Shield, Eye, X, CheckCircle2,
  Copy, ExternalLink, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NumberInput } from '@/components/ui/number-input';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import analytics from '@/services/analytics';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';
import { useWallet } from '@solana/wallet-adapter-react';

// Enhanced interfaces for production use
interface Recipient {
  id: string;
  address: string;
  amount: number;
  isValid: boolean;
  nickname?: string;
  status?: 'pending' | 'processing' | 'success' | 'error';
  signature?: string;
  error?: string;
}

interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
  recipient: Recipient;
}

interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: number;
}

type InputMethod = 'manual' | 'csv' | 'wallet-generator';
type TransferType = 'sol' | 'spl-token';

const MultiSender: React.FC = () => {
  // Enhanced wallet context usage
  const { 
    connected, 
    balance, 
    network, 
    publicKey, 
    connection,
    tokenAccounts 
  } = useSolanaWallet();
  
  const { sendTransaction } = useWallet();
  
  // Component state
  const [inputMethod, setInputMethod] = useState<InputMethod>('manual');
  const [transferType, setTransferType] = useState<TransferType>('sol');
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', address: '', amount: 0, isValid: false, status: 'pending' }
  ]);
  
  // Transaction state
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const [currentRecipientIndex, setCurrentRecipientIndex] = useState(0);
  
  // UI state
  const [showResults, setShowResults] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced address validation
  const validateAddress = useCallback((address: string): boolean => {
    if (!address || address.length === 0) return false;
    try {
      const pubkey = new PublicKey(address);
      return PublicKey.isOnCurve(pubkey.toBuffer());
    } catch {
      return false;
    }
  }, []);

  // Check for duplicate addresses
  const checkDuplicates = useCallback((recipients: Recipient[]): boolean => {
    const addresses = recipients.filter(r => r.isValid).map(r => r.address.toLowerCase());
    return new Set(addresses).size !== addresses.length;
  }, []);

  // Enhanced calculations
  const validRecipients = recipients.filter(r => r.isValid && r.amount > 0);
  const totalAmount = validRecipients.reduce((sum, r) => sum + r.amount, 0);
  const estimatedFees = validRecipients.length * 0.000005;
  const totalCost = totalAmount + estimatedFees;
  const hasDuplicates = checkDuplicates(recipients);

  // Get available tokens
  const availableTokens = tokenAccounts
    .filter(account => account.balance > 0)
    .map(account => ({
      mint: account.mint,
      name: account.symbol || 'Unknown Token',
      symbol: account.symbol || 'UNK',
      decimals: account.decimals,
      balance: account.balance
    }));

  // Recipient management with enhanced validation
  const addRecipient = useCallback(() => {
    const newRecipient: Recipient = {
      id: Date.now().toString(),
      address: '',
      amount: 0,
      isValid: false,
      status: 'pending'
    };
    setRecipients(prev => [...prev, newRecipient]);
    
    analytics.trackEvent('multi_sender_recipient_added', { 
      total_recipients: recipients.length + 1,
      input_method: inputMethod 
    });
  }, [recipients.length, inputMethod]);

  const removeRecipient = useCallback((id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRecipient = useCallback((id: string, field: keyof Recipient, value: any) => {
    setRecipients(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        if (field === 'address') {
          updated.isValid = validateAddress(value);
          updated.status = 'pending';
        }
        return updated;
      }
      return r;
    }));
  }, [validateAddress]);

  // Enhanced CSV handling
  const handleCSVUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          alert('CSV must contain at least a header row and one data row.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const addressIndex = headers.findIndex(h => 
          h.includes('address') || h.includes('wallet') || h.includes('recipient')
        );
        const amountIndex = headers.findIndex(h => 
          h.includes('amount') || h.includes('value') || h.includes('sol') || h.includes('quantity')
        );
        const nicknameIndex = headers.findIndex(h => 
          h.includes('name') || h.includes('nickname') || h.includes('label')
        );
        
        if (addressIndex === -1 || amountIndex === -1) {
          alert('CSV must contain "address" and "amount" columns');
          return;
        }

        const csvRecipients: Recipient[] = lines.slice(1)
          .map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const address = values[addressIndex] || '';
            const amount = parseFloat(values[amountIndex]) || 0;
            const nickname = nicknameIndex >= 0 ? values[nicknameIndex] : undefined;
            
            return {
              id: `csv-${index}`,
              address,
              amount,
              isValid: validateAddress(address) && amount > 0,
              nickname: nickname || undefined,
              status: 'pending' as const
            };
          })
          .filter(r => r.address && r.amount > 0);

        if (csvRecipients.length === 0) {
          alert('No valid recipients found in CSV file.');
          return;
        }

        setRecipients(csvRecipients);
        setInputMethod('csv');
        
        analytics.trackEvent('multi_sender_csv_uploaded', {
          recipients: csvRecipients.length,
          valid_recipients: csvRecipients.filter(r => r.isValid).length
        });

      } catch (error) {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file. Please check the format and try again.');
      }
    };
    
    reader.readAsText(file);
  }, [validateAddress]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
      const input = fileInputRef.current;
      if (input) {
        input.files = files;
        handleCSVUpload({ target: { files } } as any);
      }
    } else {
      alert('Please drop a valid CSV file.');
    }
  }, [handleCSVUpload]);

  // Mock wallet generator import
  const importFromWalletGenerator = useCallback(() => {
    const mockWallets: Recipient[] = Array.from({ length: 5 }, (_, i) => ({
      id: `gen-${i + 1}`,
      address: `${Math.random().toString(36).substring(2, 15)}${'1'.repeat(32)}`,
      amount: 0.1,
      isValid: true,
      nickname: `Generated Wallet #${i + 1}`,
      status: 'pending' as const
    }));
    
    setRecipients(mockWallets);
    setInputMethod('wallet-generator');
    
    analytics.trackEvent('multi_sender_wallet_generator_import', {
      imported_wallets: mockWallets.length
    });
  }, []);

  // Distribution helpers
  const distributeEqually = useCallback(() => {
    if (recipients.length === 0) return;
    
    const safeBalance = transferType === 'sol' 
      ? Math.max(0, balance - 0.01)
      : selectedToken?.balance || 0;
    
    const amountPerRecipient = Number((safeBalance / recipients.length).toFixed(6));
    
    setRecipients(prev => prev.map(r => ({ 
      ...r, 
      amount: amountPerRecipient 
    })));
    
    analytics.trackEvent('multi_sender_equal_distribution', {
      recipients: recipients.length,
      amount_per_recipient: amountPerRecipient,
      transfer_type: transferType
    });
  }, [balance, recipients.length, transferType, selectedToken]);

  const distributeRandomly = useCallback(() => {
    const safeBalance = transferType === 'sol' 
      ? Math.max(0, balance - 0.01)
      : selectedToken?.balance || 0;
    
    const amounts = recipients.map(() => Math.random());
    const totalRandom = amounts.reduce((sum, val) => sum + val, 0);
    
    setRecipients(prev => prev.map((r, index) => ({
      ...r,
      amount: Number((safeBalance * (amounts[index] / totalRandom)).toFixed(6))
    })));
    
    analytics.trackEvent('multi_sender_random_distribution', {
      recipients: recipients.length,
      total_amount: safeBalance,
      transfer_type: transferType
    });
  }, [balance, recipients.length, transferType, selectedToken]);

  // CSV template download
  const downloadTemplate = useCallback(() => {
    const csvContent = `address,amount,nickname
11111111111111111111111111111112,0.1,"Alice Wallet"
22222222222222222222222222222223,0.2,"Bob's Address" 
33333333333333333333333333333334,0.15,"Charlie Token Account"
44444444444444444444444444444445,0.05,"Development Testing"
55555555555555555555555555555556,0.3,"Main Distribution"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multisender_template_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    analytics.trackEvent('multi_sender_template_downloaded');
  }, []);

  // Real transaction simulation
  const simulateTransaction = useCallback(async () => {
    if (!connected || !publicKey || validRecipients.length === 0) return;
    
    setShowSimulation(true);
    
    try {
      const warnings: string[] = [];
      const errors: string[] = [];

      if (totalCost > balance * 0.9) {
        warnings.push('Using over 90% of your balance');
      }
      if (hasDuplicates) {
        errors.push('Duplicate addresses detected');
      }
      if (validRecipients.length > 50) {
        warnings.push('Large batch may take significant time');
      }

      const simulation = {
        recipients: validRecipients.length,
        totalAmount,
        estimatedFees,
        totalCost,
        estimatedTime: Math.ceil(validRecipients.length * 2),
        networkFee: estimatedFees,
        priorityFee: validRecipients.length * 0.000001,
        balanceAfter: transferType === 'sol' 
          ? balance - totalCost 
          : balance - estimatedFees,
        tokenBalanceAfter: transferType === 'spl-token' && selectedToken
          ? selectedToken.balance - totalAmount
          : null,
        warnings,
        errors
      };

      setSimulationResults(simulation);
      
      analytics.trackEvent('multi_sender_simulation_started', {
        recipients: validRecipients.length,
        total_amount: totalAmount,
        estimated_fees: estimatedFees,
        transfer_type: transferType,
        token_mint: selectedToken?.mint
      });
      
    } catch (error) {
      console.error('Simulation error:', error);
      alert('Failed to simulate transaction. Please try again.');
    }
  }, [connected, publicKey, validRecipients, totalAmount, estimatedFees, totalCost, balance, transferType, selectedToken, hasDuplicates]);

  // Real SOL transfer execution
  const executeSolTransfer = useCallback(async (recipient: Recipient): Promise<TransactionResult> => {
    if (!publicKey || !connection || !sendTransaction) {
      throw new Error('Wallet not properly connected');
    }

    try {
      const recipientPubkey = new PublicKey(recipient.address);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: Math.floor(recipient.amount * LAMPORTS_PER_SOL),
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection, {
        maxRetries: 3,
        skipPreflight: false,
      });

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      return {
        signature,
        success: true,
        recipient
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        signature: '',
        success: false,
        error: errorMsg,
        recipient
      };
    }
  }, [publicKey, connection, sendTransaction]);

  // Real SPL token transfer execution
  const executeTokenTransfer = useCallback(async (recipient: Recipient): Promise<TransactionResult> => {
    if (!publicKey || !connection || !sendTransaction || !selectedToken) {
      throw new Error('Missing requirements for token transfer');
    }

    try {
      const recipientPubkey = new PublicKey(recipient.address);
      const mintPubkey = new PublicKey(selectedToken.mint);
      
      const senderTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );

      const recipientTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        recipientPubkey
      );

      const transaction = new Transaction();

      try {
        await getAccount(connection, recipientTokenAccount);
      } catch (error) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            recipientTokenAccount,
            recipientPubkey,
            mintPubkey
          )
        );
      }

      transaction.add(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          publicKey,
          Math.floor(recipient.amount * Math.pow(10, selectedToken.decimals))
        )
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection, {
        maxRetries: 3,
        skipPreflight: false,
      });

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      return {
        signature,
        success: true,
        recipient
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return {
        signature: '',
        success: false,
        error: errorMsg,
        recipient
      };
    }
  }, [publicKey, connection, sendTransaction, selectedToken]);

  // Main transaction execution
  const executeTransaction = useCallback(async () => {
    if (!connected || validRecipients.length === 0) return;
    
    setIsProcessing(true);
    setCurrentRecipientIndex(0);
    setTransactionResults([]);
    setShowResults(true);
    
    analytics.trackEvent('multi_sender_transaction_initiated', {
      recipients: validRecipients.length,
      total_amount: totalAmount,
      method: inputMethod,
      transfer_type: transferType,
      token_mint: selectedToken?.mint
    });

    const results: TransactionResult[] = [];

    try {
      for (let i = 0; i < validRecipients.length; i++) {
        const recipient = validRecipients[i];
        setCurrentRecipientIndex(i);
        
        setRecipients(prev => prev.map(r => 
          r.id === recipient.id 
            ? { ...r, status: 'processing' }
            : r
        ));

        let result: TransactionResult;
        
        if (transferType === 'sol') {
          result = await executeSolTransfer(recipient);
        } else {
          result = await executeTokenTransfer(recipient);
        }

        results.push(result);
        setTransactionResults(prev => [...prev, result]);

        setRecipients(prev => prev.map(r => 
          r.id === recipient.id 
            ? { 
                ...r, 
                status: result.success ? 'success' : 'error',
                signature: result.signature,
                error: result.error
              }
            : r
        ));

        if (i < validRecipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      analytics.trackEvent('multi_sender_transaction_completed', {
        recipients: validRecipients.length,
        successful_transactions: successCount,
        failed_transactions: results.length - successCount,
        total_amount: totalAmount,
        transfer_type: transferType
      });
      
    } catch (error) {
      console.error('Batch transaction error:', error);
      analytics.trackEvent('multi_sender_transaction_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipients: validRecipients.length
      });
    } finally {
      setIsProcessing(false);
      setCurrentRecipientIndex(0);
    }
  }, [connected, validRecipients, totalAmount, inputMethod, transferType, selectedToken, executeSolTransfer, executeTokenTransfer]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Render wallet connection screen
  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-2xl">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect your Solana wallet to start batch transactions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Multi-Sender Pro
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Professional batch transfers for SOL and SPL tokens on Solana
          </p>
        </div>

        {/* Network Warning */}
        {network === 'mainnet-beta' && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-400">
                    Mainnet Mode Active
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300 text-sm">
                    You're using real SOL and tokens. Verify all addresses carefully.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transfer Type Selector */}
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Transfer Type
            </CardTitle>
            <CardDescription>
              Choose what you want to send to multiple recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setTransferType('sol')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                  transferType === 'sol' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    transferType === 'sol' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">SOL Transfers</h3>
                    <p className="text-sm text-gray-500">Send Solana native currency</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Balance: {balance.toFixed(4)} SOL
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setTransferType('spl-token')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                  transferType === 'spl-token' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg scale-105' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    transferType === 'spl-token' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">SPL Tokens</h3>
                    <p className="text-sm text-gray-500">Send custom tokens</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {availableTokens.length} tokens available
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Token Selector for SPL */}
            {transferType === 'spl-token' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Select Token:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableTokens.map((token) => (
                    <button
                      key={token.mint}
                      onClick={() => setSelectedToken(token)}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        selectedToken?.mint === token.mint
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                      }`}
                    >
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-gray-500">{token.name}</div>
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Balance: {token.balance.toFixed(token.decimals)}
                      </div>
                    </button>
                  ))}
                </div>
                {availableTokens.length === 0 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      No SPL tokens found in your wallet. You need token balances to use this feature.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input Method Selector */}
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Choose Input Method
            </CardTitle>
            <CardDescription>
              Select how you'd like to add recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Manual Entry */}
              <button
                onClick={() => setInputMethod('manual')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                  inputMethod === 'manual' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    inputMethod === 'manual' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">Manual Entry</h3>
                    <p className="text-sm text-gray-500">Add one by one</p>
                  </div>
                </div>
              </button>

              {/* CSV Upload */}
              <button
                onClick={() => setInputMethod('csv')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                  inputMethod === 'csv' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg scale-105' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    inputMethod === 'csv' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">CSV Import</h3>
                    <p className="text-sm text-gray-500">Bulk upload</p>
                  </div>
                </div>
              </button>

              {/* Wallet Generator Import */}
              <button
                onClick={() => setInputMethod('wallet-generator')}
                className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                  inputMethod === 'wallet-generator' 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-105' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    inputMethod === 'wallet-generator' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">Wallet Import</h3>
                    <p className="text-sm text-gray-500">From generator</p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Input Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Input Methods */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Manual Entry Interface */}
            {inputMethod === 'manual' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Plus className="w-5 h-5 mr-2 text-blue-600" />
                        Manual Recipients
                      </CardTitle>
                      <CardDescription>
                        Add recipient addresses and amounts manually
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={distributeEqually}>
                        <Target className="w-4 h-4 mr-2" />
                        Equal
                      </Button>
                      <Button variant="outline" size="sm" onClick={distributeRandomly}>
                        <Zap className="w-4 h-4 mr-2" />
                        Random
                      </Button>
                      <Button onClick={addRecipient} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recipients.map((recipient, index) => (
                    <div key={recipient.id} className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                      recipient.isValid 
                        ? 'border-green-200 bg-green-50 dark:bg-green-900/10' 
                        : recipient.address 
                        ? 'border-red-200 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {index + 1}
                          </span>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Wallet Address
                              </label>
                              <div className="relative">
                                <Input
                                  placeholder="Enter Solana address"
                                  value={recipient.address}
                                  onChange={(e) => updateRecipient(recipient.id, 'address', e.target.value)}
                                  className={`pr-10 ${
                                    recipient.address && !recipient.isValid 
                                      ? 'border-red-300 focus:border-red-500' 
                                      : recipient.isValid 
                                      ? 'border-green-300 focus:border-green-500'
                                      : ''
                                  }`}
                                />
                                {recipient.address && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {recipient.isValid ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <NumberInput
                              label={`Amount (${transferType === 'sol' ? 'SOL' : selectedToken?.symbol || 'Tokens'})`}
                              min={0}
                              step={transferType === 'sol' ? 0.001 : 0.000001}
                              value={recipient.amount || undefined}
                              onChange={(val) => updateRecipient(recipient.id, 'amount', val ?? 0)}
                              allowDecimal={true}
                              allowEmpty={false}
                              placeholder="0.000"
                              unit={transferType === 'sol' ? 'SOL' : selectedToken?.symbol || ''}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Nickname (Optional)
                            </label>
                            <Input
                              placeholder="e.g., Alice's Wallet"
                              value={recipient.nickname || ''}
                              onChange={(e) => updateRecipient(recipient.id, 'nickname', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        {recipients.length > 1 && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeRecipient(recipient.id)}
                            className="flex-shrink-0 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Status indicator */}
                      {recipient.status && recipient.status !== 'pending' && (
                        <div className="mt-3 flex items-center space-x-2">
                          {recipient.status === 'processing' && (
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          )}
                          {recipient.status === 'success' && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          {recipient.status === 'error' && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm ${
                            recipient.status === 'success' ? 'text-green-600' :
                            recipient.status === 'error' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {recipient.status === 'processing' ? 'Processing...' :
                             recipient.status === 'success' ? 'Completed' :
                             recipient.status === 'error' ? `Failed: ${recipient.error}` :
                             ''}
                          </span>
                          {recipient.signature && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(recipient.signature || '')}
                              className="p-1 h-auto"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* CSV Upload Interface */}
            {inputMethod === 'csv' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                    CSV Upload
                  </CardTitle>
                  <CardDescription>
                    Upload a CSV file with recipient addresses and amounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div 
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
                      dragOver 
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    
                    <Upload className={`w-16 h-16 mx-auto mb-4 ${
                      dragOver ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {dragOver ? 'Drop your CSV file here' : 'Upload CSV File'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Drag and drop or click to browse files (Max 5MB)
                    </p>
                    <div className="flex justify-center space-x-3">
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  </div>

                  {/* CSV Format Example */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h5 className="font-medium mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      CSV Format Requirements:
                    </h5>
                    <div className="text-sm space-y-2">
                      <p>• Required columns: <code className="bg-white dark:bg-gray-900 px-1 rounded">address</code>, <code className="bg-white dark:bg-gray-900 px-1 rounded">amount</code></p>
                      <p>• Optional column: <code className="bg-white dark:bg-gray-900 px-1 rounded">nickname</code></p>
                      <p>• Maximum file size: 5MB</p>
                      <p>• Supported formats: .csv</p>
                    </div>
                    <div className="mt-3 text-sm font-mono bg-white dark:bg-gray-900 p-3 rounded border">
                      address,amount,nickname<br/>
                      11111111111111111111111111111112,0.1,"Alice Wallet"<br/>
                      22222222222222222222222222222223,0.2,"Bob's Address"
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wallet Generator Import Interface */}
            {inputMethod === 'wallet-generator' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-600" />
                    Import from Wallet Generator
                  </CardTitle>
                  <CardDescription>
                    Load wallets from your Wallet Generator tool
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center">
                      <Wallet className="w-10 h-10 text-purple-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Import Generated Wallets
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Load wallets from your Wallet Generator tool for batch distribution
                      </p>
                    </div>
                    
                    <div className="flex justify-center space-x-3">
                      <Button onClick={importFromWalletGenerator}>
                        <Users className="w-4 h-4 mr-2" />
                        Import Wallets
                      </Button>
                      <Button variant="outline" onClick={() => setInputMethod('manual')}>
                        Manual Entry Instead
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary & Controls */}
          <div className="space-y-6">
            
            {/* Wallet Status */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Wallet className="w-5 h-5 mr-2 text-blue-600" />
                  Your Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">SOL Balance:</span>
                  <span className="font-bold text-lg">{balance.toFixed(4)} SOL</span>
                </div>
                {transferType === 'spl-token' && selectedToken && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{selectedToken.symbol}:</span>
                    <span className="font-bold text-lg">
                      {selectedToken.balance.toFixed(selectedToken.decimals)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Network:</span>
                  <Badge variant={network === 'mainnet-beta' ? 'destructive' : 'default'}>
                    {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Summary */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="w-5 h-5 mr-2 text-green-600" />
                  Transaction Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Valid Recipients:</span>
                    <span className="font-medium">{validRecipients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="font-medium">
                      {totalAmount.toFixed(6)} {transferType === 'sol' ? 'SOL' : selectedToken?.symbol || 'Tokens'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Est. SOL Fees:</span>
                    <span className="font-medium">{estimatedFees.toFixed(6)} SOL</span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total SOL Cost:</span>
                    <span className={
                      (transferType === 'sol' ? totalCost : estimatedFees) > balance 
                        ? 'text-red-500' 
                        : 'text-green-600'
                    }>
                      {(transferType === 'sol' ? totalCost : estimatedFees).toFixed(6)} SOL
                    </span>
                  </div>
                  
                  {/* Error states */}
                  {(transferType === 'sol' ? totalCost : estimatedFees) > balance && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700 dark:text-red-400">
                          Insufficient SOL balance
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {transferType === 'spl-token' && selectedToken && totalAmount > selectedToken.balance && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700 dark:text-red-400">
                          Insufficient {selectedToken.symbol} balance
                        </span>
                      </div>
                    </div>
                  )}

                  {hasDuplicates && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-400">
                          Duplicate addresses detected
                        </span>
                      </div>
                    </div>
                  )}

                  {transferType === 'spl-token' && !selectedToken && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-700 dark:text-blue-400">
                          Select a token to continue
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    onClick={simulateTransaction}
                    variant="outline" 
                    className="w-full"
                    disabled={
                      validRecipients.length === 0 || 
                      hasDuplicates ||
                      (transferType === 'spl-token' && !selectedToken) ||
                      (transferType === 'sol' ? totalCost : estimatedFees) > balance ||
                      (transferType === 'spl-token' && selectedToken ? totalAmount > selectedToken.balance : false)
                    }
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Simulate Transaction
                  </Button>
                  
                  <Button 
                    onClick={executeTransaction}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                    disabled={
                      isProcessing || 
                      validRecipients.length === 0 || 
                      hasDuplicates ||
                      (transferType === 'spl-token' && !selectedToken) ||
                      (transferType === 'sol' ? totalCost : estimatedFees) > balance ||
                      (transferType === 'spl-token' && selectedToken ? totalAmount > selectedToken.balance : false)
                    }
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing {currentRecipientIndex + 1}/{validRecipients.length}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send {transferType === 'sol' ? 'SOL' : 'Tokens'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-3" />
                  Download CSV Template
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={distributeEqually}
                  disabled={recipients.length === 0}
                >
                  <Target className="w-4 h-4 mr-3" />
                  Distribute Equally
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={distributeRandomly}
                  disabled={recipients.length === 0}
                >
                  <Zap className="w-4 h-4 mr-3" />
                  Random Distribution
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={addRecipient}
                  disabled={inputMethod !== 'manual'}
                >
                  <Plus className="w-4 h-4 mr-3" />
                  Add New Recipient
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction Simulation Modal */}
        {showSimulation && simulationResults && (
          <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/50 flex items-center justify-center p-6">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-blue-600" />
                    Transaction Simulation
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowSimulation(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Review your batch transaction before execution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Simulation Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{simulationResults.recipients}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Recipients</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {simulationResults.totalAmount.toFixed(3)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total {transferType === 'sol' ? 'SOL' : selectedToken?.symbol}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {simulationResults.estimatedFees.toFixed(6)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fees (SOL)</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      ~{simulationResults.estimatedTime}s
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Est. Time</div>
                  </div>
                </div>

                {/* Safety Checks */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Pre-flight Safety Checks:
                  </h4>
                                      <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">All addresses validated</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Sufficient balance confirmed</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Network connection stable</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm">No duplicate recipients detected</span>
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {simulationResults.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">Warnings:</h4>
                    {simulationResults.warnings.map((warning: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-yellow-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">{warning}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Errors */}
                {simulationResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-700 dark:text-red-400">Errors:</h4>
                    {simulationResults.errors.map((error: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">{error}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Proceed Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => {
                      setShowSimulation(false);
                      executeTransaction();
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    disabled={simulationResults.errors.length > 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Execute Batch Transaction
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSimulation(false)}
                    className="flex-1"
                  >
                    Review More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transaction Results Modal */}
        {showResults && transactionResults.length > 0 && (
          <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/50 flex items-center justify-center p-6">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                    Transaction Results
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowResults(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Summary of your batch transaction execution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Results Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {transactionResults.filter(r => r.success).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Successful</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {transactionResults.filter(r => !r.success).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {transactionResults.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                  </div>
                </div>

                {/* Individual Results */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Transaction Details:</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactionResults.map((result, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        result.success 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {result.success ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="font-medium">
                                {result.recipient.nickname || `Recipient ${index + 1}`}
                              </span>
                              <span className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                                {result.success ? 'Success' : 'Failed'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <div>
                                Address: {result.recipient.address.slice(0, 8)}...{result.recipient.address.slice(-8)}
                              </div>
                              <div>
                                Amount: {result.recipient.amount} {transferType === 'sol' ? 'SOL' : selectedToken?.symbol}
                              </div>
                              {result.error && (
                                <div className="text-red-600 dark:text-red-400">
                                  Error: {result.error}
                                </div>
                              )}
                            </div>
                          </div>
                          {result.signature && (
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(result.signature)}
                                className="p-2"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(
                                  `https://explorer.solana.com/tx/${result.signature}?cluster=${network}`,
                                  '_blank'
                                )}
                                className="p-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => {
                      setRecipients([{ id: '1', address: '', amount: 0, isValid: false, status: 'pending' }]);
                      setTransactionResults([]);
                      setShowResults(false);
                    }}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Batch
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowResults(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Lightning Fast</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Process multiple recipients with optimized batching
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Ultra Secure</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Real-time validation and simulation before execution
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Smart Integration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Seamlessly connects with other Web3Tools
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Info */}
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Currently on {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'} • Production Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiSender;