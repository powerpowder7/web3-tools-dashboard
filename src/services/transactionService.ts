import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  TransactionSignature,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';
import { 
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import analytics from '@/services/analytics';

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}

export interface Recipient {
  address: string;
  amount: number;
  isValid: boolean;
}

export interface BatchTransactionOptions {
  recipients: Recipient[];
  tokenMint?: string;
  simulate?: boolean;
  priorityFee?: number;
}

// Transaction service class
export class TransactionService {
  private connection: Connection;
  private wallet: any;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.wallet = wallet;
  }

  // Validate Solana address
  static validateAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  // Get transaction fee estimate
  async getTransactionFee(transaction: Transaction): Promise<number> {
    try {
      const { value } = await this.connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );
      return value || 5000; // Default fallback
    } catch (error) {
      console.error('Error getting transaction fee:', error);
      return 5000; // Fallback fee
    }
  }

  // Send SOL to multiple recipients
  async sendSolBatch(recipients: Recipient[]): Promise<TransactionResult[]> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const results: TransactionResult[] = [];
    
    for (const recipient of recipients) {
      try {
        analytics.track('transaction_initiated', {
          type: 'sol_transfer',
          amount: recipient.amount,
          recipient: recipient.address.slice(0, 8)
        });

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: this.wallet.publicKey,
            toPubkey: new PublicKey(recipient.address),
            lamports: recipient.amount * LAMPORTS_PER_SOL,
          })
        );

        const signature = await this.wallet.sendTransaction(
          transaction, 
          this.connection
        );

        // Wait for confirmation
        await this.connection.confirmTransaction(signature, 'confirmed');

        results.push({
          signature,
          success: true
        });

        analytics.track('transaction_completed', {
          type: 'sol_transfer',
          signature,
          amount: recipient.amount
        });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        results.push({
          signature: '',
          success: false,
          error: errorMsg
        });

        analytics.track('transaction_failed', {
          type: 'sol_transfer',
          error: errorMsg,
          recipient: recipient.address.slice(0, 8)
        });
      }
    }

    return results;
  }

  // Send SPL tokens to multiple recipients
  async sendTokenBatch(recipients: Recipient[], tokenMint: string): Promise<TransactionResult[]> {
    if (!this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const results: TransactionResult[] = [];
    const mintPubkey = new PublicKey(tokenMint);

    for (const recipient of recipients) {
      try {
        analytics.track('transaction_initiated', {
          type: 'token_transfer',
          token_mint: tokenMint,
          amount: recipient.amount,
          recipient: recipient.address.slice(0, 8)
        });

        const recipientPubkey = new PublicKey(recipient.address);
        
        // Get sender token account
        const senderTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          this.wallet.publicKey
        );

        // Get or create recipient token account
        const recipientTokenAccount = await getAssociatedTokenAddress(
          mintPubkey,
          recipientPubkey
        );

        const transaction = new Transaction();

        // Check if recipient token account exists
        try {
          await getAccount(this.connection, recipientTokenAccount);
        } catch (error) {
          // Create token account if it doesn't exist
          transaction.add(
            createAssociatedTokenAccountInstruction(
              this.wallet.publicKey,
              recipientTokenAccount,
              recipientPubkey,
              mintPubkey,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }

        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            senderTokenAccount,
            recipientTokenAccount,
            this.wallet.publicKey,
            recipient.amount,
            [],
            TOKEN_PROGRAM_ID
          )
        );

        const signature = await this.wallet.sendTransaction(
          transaction, 
          this.connection
        );

        // Wait for confirmation
        await this.connection.confirmTransaction(signature, 'confirmed');

        results.push({
          signature,
          success: true
        });

        analytics.track('transaction_completed', {
          type: 'token_transfer',
          signature,
          token_mint: tokenMint,
          amount: recipient.amount
        });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        results.push({
          signature: '',
          success: false,
          error: errorMsg
        });

        analytics.track('transaction_failed', {
          type: 'token_transfer',
          error: errorMsg,
          token_mint: tokenMint,
          recipient: recipient.address.slice(0, 8)
        });
      }
    }

    return results;
  }

  // Simulate transaction
  async simulateTransaction(recipients: Recipient[], tokenMint?: string): Promise<{
    success: boolean;
    totalFee: number;
    estimatedCost: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let totalFee = 0;

    // Validate all addresses
    for (const recipient of recipients) {
      if (!TransactionService.validateAddress(recipient.address)) {
        errors.push(`Invalid address: ${recipient.address}`);
      }
    }

    // Calculate estimated fees
    try {
      if (tokenMint) {
        // Token transfer fees (higher due to account creation possibility)
        totalFee = recipients.length * 10000; // 0.01 SOL per transfer
      } else {
        // SOL transfer fees
        totalFee = recipients.length * 5000; // 0.005 SOL per transfer
      }
    } catch (error) {
      errors.push('Failed to estimate transaction fees');
    }

    const estimatedCost = tokenMint 
      ? totalFee 
      : totalFee + recipients.reduce((sum, r) => sum + (r.amount * LAMPORTS_PER_SOL), 0);

    return {
      success: errors.length === 0,
      totalFee: totalFee / LAMPORTS_PER_SOL,
      estimatedCost: estimatedCost / LAMPORTS_PER_SOL,
      errors
    };
  }

  // Get account balance
  async getBalance(address?: string): Promise<number> {
    const pubkey = address ? new PublicKey(address) : this.wallet.publicKey;
    if (!pubkey) return 0;

    try {
      const balance = await this.connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }
}

// Hook to use transaction service
export function useTransactionService() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const transactionService = new TransactionService(connection, wallet);

  return {
    transactionService,
    validateAddress: TransactionService.validateAddress,
    sendSolBatch: (recipients: Recipient[]) => transactionService.sendSolBatch(recipients),
    sendTokenBatch: (recipients: Recipient[], tokenMint: string) => 
      transactionService.sendTokenBatch(recipients, tokenMint),
    simulateTransaction: (recipients: Recipient[], tokenMint?: string) =>
      transactionService.simulateTransaction(recipients, tokenMint),
    getBalance: (address?: string) => transactionService.getBalance(address)
  };
}