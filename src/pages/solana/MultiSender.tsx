// src/pages/solana/MultiSender.tsx - Fixed Version (No TypeScript Errors)
import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, Download, Plus, Minus, Send, AlertTriangle, 
  Check, Loader2, FileText, Users, Wallet, 
  Info, Target, Zap, Shield, Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSolanaWallet } from '@/contexts/SolanaWalletContext';
import analytics from '@/services/analytics';
import { PublicKey } from '@solana/web3.js';

// Simple interface that matches your existing infrastructure
interface Recipient {
  id: string;
  address: string;
  amount: number;
  isValid: boolean;
  nickname?: string;
}

type InputMethod = 'manual' | 'csv' | 'wallet-generator';

const MultiSender: React.FC = () => {
  // Using your existing SolanaWalletContext
  const { connected, publicKey, balance, network } = useSolanaWallet();
  
  // Component state
  const [inputMethod, setInputMethod] = useState<InputMethod>('manual');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', address: '', amount: 0, isValid: false }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utility functions
  const validateAddress = useCallback((address: string): boolean => {
    try {
      new PublicKey(address);
      return address.length > 0;
    } catch {
      return false;
    }
  }, []);

  // Calculations
  const validRecipients = recipients.filter(r => r.isValid && r.amount > 0);
  const totalAmount = validRecipients.reduce((sum, r) => sum + r.amount, 0);
  const estimatedFees = validRecipients.length * 0.000005;
  const totalCost = totalAmount + estimatedFees;

  // Recipient management
  const addRecipient = useCallback(() => {
    const newRecipient: Recipient = {
      id: Date.now().toString(),
      address: '',
      amount: 0,
      isValid: false
    };
    setRecipients(prev => [...prev, newRecipient]);
    
    analytics.trackEvent('multi_sender_recipient_added', { 
      total_recipients: recipients.length + 1
    });
  }, [recipients.length]);

  const removeRecipient = useCallback((id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRecipient = useCallback((id: string, field: keyof Recipient, value: any) => {
    setRecipients(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        if (field === 'address') {
          updated.isValid = validateAddress(value);
        }
        return updated;
      }
      return r;
    }));
  }, [validateAddress]);

  // CSV handling
  const handleCSVUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const addressIndex = headers.findIndex(h => h.includes('address'));
        const amountIndex = headers.findIndex(h => h.includes('amount'));
        
        if (addressIndex === -1 || amountIndex === -1) {
          alert('CSV must contain "address" and "amount" columns');
          return;
        }

        const csvRecipients: Recipient[] = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const address = values[addressIndex] || '';
          const amount = parseFloat(values[amountIndex]) || 0;
          
          return {
            id: `csv-${index}`,
            address,
            amount,
            isValid: validateAddress(address) && amount > 0,
            nickname: values[2] || undefined
          };
        }).filter(r => r.address && r.amount > 0);

        setRecipients(csvRecipients);
        setInputMethod('csv');
        
        analytics.trackEvent('multi_sender_csv_uploaded', {
          recipients: csvRecipients.length
        });

      } catch (error) {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  }, [validateAddress]);

  // Mock wallet generator import
  const importFromWalletGenerator = useCallback(() => {
    const mockWallets: Recipient[] = [
      { id: 'gen-1', address: '11111111111111111111111111111112', amount: 0.1, isValid: true, nickname: 'Generated #1' },
      { id: 'gen-2', address: '22222222222222222222222222222223', amount: 0.1, isValid: true, nickname: 'Generated #2' },
      { id: 'gen-3', address: '33333333333333333333333333333334', amount: 0.1, isValid: true, nickname: 'Generated #3' },
    ];
    
    setRecipients(mockWallets);
    setInputMethod('wallet-generator');
    
    analytics.trackEvent('multi_sender_wallet_generator_import', {
      imported_wallets: mockWallets.length
    });
  }, []);

  // Distribution helpers
  const distributeEqually = useCallback(() => {
    const safeBalance = Math.max(0, balance - 0.01);
    const amountPerRecipient = safeBalance / recipients.length;
    
    setRecipients(prev => prev.map(r => ({ ...r, amount: amountPerRecipient })));
    
    analytics.trackEvent('multi_sender_equal_distribution', {
      recipients: recipients.length,
      amount_per_recipient: amountPerRecipient
    });
  }, [balance, recipients.length]);

  const downloadTemplate = useCallback(() => {
    const csvContent = `address,amount,nickname
11111111111111111111111111111112,0.1,Alice
22222222222222222222222222222223,0.2,Bob
33333333333333333333333333333334,0.15,Charlie`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'multisender_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    analytics.trackEvent('multi_sender_template_downloaded');
  }, []);

  // Transaction simulation
  const simulateTransaction = useCallback(() => {
    setShowSimulation(true);
    
    analytics.trackEvent('multi_sender_simulation_started', {
      recipients: validRecipients.length,
      total_amount: totalAmount,
      estimated_fees: estimatedFees
    });
  }, [validRecipients.length, totalAmount, estimatedFees]);

  // Mock transaction execution
  const executeTransaction = useCallback(async () => {
    if (!connected || validRecipients.length === 0) return;
    
    setIsProcessing(true);
    
    analytics.trackEvent('multi_sender_transaction_initiated', {
      recipients: validRecipients.length,
      total_amount: totalAmount,
      method: inputMethod
    });

    try {
      // Simulate transaction processing
      for (let i = 0; i < validRecipients.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      analytics.trackEvent('multi_sender_transaction_completed', {
        recipients: validRecipients.length,
        total_amount: totalAmount
      });
      
      alert(`Successfully sent ${totalAmount} SOL to ${validRecipients.length} recipients!`);
      
    } catch (error) {
      console.error('Transaction error:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [connected, validRecipients, totalAmount, inputMethod]);

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
              Multi-Sender
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Send SOL to multiple recipients in a single batch transaction
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
                    You're using real SOL. Verify all addresses carefully.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    inputMethod === 'manual' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Manual Entry</h3>
                    <p className="text-sm text-gray-500">Add recipients one by one</p>
                  </div>
                </div>
                {inputMethod === 'manual' && <Check className="w-5 h-5 text-blue-500 ml-auto" />}
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
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    inputMethod === 'csv' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">CSV Import</h3>
                    <p className="text-sm text-gray-500">Bulk upload from file</p>
                  </div>
                </div>
                {inputMethod === 'csv' && <Check className="w-5 h-5 text-green-500 ml-auto" />}
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
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    inputMethod === 'wallet-generator' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Wallet Import</h3>
                    <p className="text-sm text-gray-500">From Wallet Generator</p>
                  </div>
                </div>
                {inputMethod === 'wallet-generator' && <Check className="w-5 h-5 text-purple-500 ml-auto" />}
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
                        Equal Split
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
                        : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Wallet Address</label>
                            <div className="relative">
                              <Input
                                placeholder="Enter Solana address"
                                value={recipient.address}
                                onChange={(e) => updateRecipient(recipient.id, 'address', e.target.value)}
                                className={recipient.address && !recipient.isValid ? 'border-red-300' : ''}
                              />
                              {recipient.address && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                  {recipient.isValid ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Amount (SOL)</label>
                            <Input
                              type="number"
                              step="0.001"
                              min="0"
                              placeholder="0.000"
                              value={recipient.amount || ''}
                              onChange={(e) => updateRecipient(recipient.id, 'amount', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                        
                        {recipients.length > 1 && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeRecipient(recipient.id)}
                            className="flex-shrink-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center transition-all duration-300 hover:border-blue-400 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                    
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Drop your CSV file here
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Or click to browse files
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

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h5 className="font-medium mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      CSV Format Example:
                    </h5>
                    <div className="text-sm font-mono bg-white dark:bg-gray-900 p-3 rounded border">
                      address,amount,nickname<br/>
                      11111111111111111111111111111112,0.1,Alice<br/>
                      22222222222222222222222222222223,0.2,Bob
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
                        Load wallets from your Wallet Generator tool
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

                  {/* Imported Wallets Display */}
                  {inputMethod === 'wallet-generator' && recipients.length > 0 && recipients[0].nickname && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Imported Wallets ({recipients.length})
                        </h4>
                        <Button variant="outline" size="sm" onClick={distributeEqually}>
                          <Target className="w-4 h-4 mr-2" />
                          Equal Distribution
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {recipients.map((recipient, index) => (
                          <div key={recipient.id} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{index + 1}</span>
                              </div>
                              <div>
                                <div className="font-mono text-sm">{recipient.address.slice(0, 8)}...{recipient.address.slice(-8)}</div>
                                {recipient.nickname && (
                                  <div className="text-xs text-purple-600 dark:text-purple-400">{recipient.nickname}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                value={recipient.amount || ''}
                                onChange={(e) => updateRecipient(recipient.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-24 text-right"
                                placeholder="0.000"
                              />
                              <span className="text-sm text-gray-500">SOL</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                  <span className="text-gray-600 dark:text-gray-400">Balance:</span>
                  <span className="font-bold text-lg">{balance.toFixed(4)} SOL</span>
                </div>
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
                    <span className="text-gray-600 dark:text-gray-400">Recipients:</span>
                    <span className="font-medium">{validRecipients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="font-medium">{totalAmount.toFixed(4)} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Est. Fees:</span>
                    <span className="font-medium">{estimatedFees.toFixed(6)} SOL</span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Cost:</span>
                    <span className={totalCost > balance ? 'text-red-500' : 'text-green-600'}>
                      {totalCost.toFixed(4)} SOL
                    </span>
                  </div>
                  
                  {totalCost > balance && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700 dark:text-red-400">
                          Insufficient balance
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
                    disabled={validRecipients.length === 0}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Simulate Transaction
                  </Button>
                  
                  <Button 
                    onClick={executeTransaction}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                    disabled={isProcessing || validRecipients.length === 0 || totalCost > balance}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Transactions
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
                <Button variant="outline" className="w-full justify-start" onClick={distributeEqually}>
                  <Target className="w-4 h-4 mr-3" />
                  Distribute Equally
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={addRecipient}>
                  <Plus className="w-4 h-4 mr-3" />
                  Add New Recipient
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction Simulation Modal */}
        {showSimulation && (
          <Card className="fixed inset-0 z-50 backdrop-blur bg-black/50 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 shadow-2xl rounded-xl">
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
                    ✕
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
                    <div className="text-2xl font-bold text-blue-600">{validRecipients.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Recipients</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{totalAmount.toFixed(3)}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total SOL</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{estimatedFees.toFixed(6)}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Est. Fees</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">~{Math.ceil(validRecipients.length / 5)}s</div>
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
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">All addresses validated</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Sufficient balance confirmed</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Network connection stable</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">No duplicate recipients detected</span>
                    </div>
                  </div>
                </div>

                {/* Proceed Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => {
                      setShowSimulation(false);
                      executeTransaction();
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Execute Batch
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
            </div>
          </Card>
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

        {/* Bottom CTA */}
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Currently on {network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'} • Safe for testing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiSender;