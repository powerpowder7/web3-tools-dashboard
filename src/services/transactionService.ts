// src/services/transactionService.ts - Real Solana Transaction Execution
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  SendTransactionError,
  VersionedTransaction
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  TOKEN_PROGRAM_ID,
  getAccount
} from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';
import analytics from './analytics';

export interface TransactionRecipient {
  address: string;
  amount: number;
  tokenMint?: string; // For SPL token transfers
}

export interface BatchTransactionOptions {
  connection: Connection;
  wallet: WalletContextState;
  recipients: TransactionRecipient[];
  network: 'mainnet-beta' | 'devnet';
  onProgress?: (completed: number, total: number, signature?: string) => void;
  onError?: (error: Error, recipientIndex: number) => void;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  recipientAddress: string;
  amount: number;
}

class TransactionService {
  
  /**
   * Execute batch SOL transfers
   */
  async executeBatchSOLTransfer(options: BatchTransactionOptions): Promise<TransactionResult[]> {
    const { connection, wallet, recipients, network, onProgress, onError } = options;
    const results: TransactionResult[] = [];
    
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected or does not support signing');
    }

    analytics.transactionInitiated('batch_sol_transfer', {
      recipients: recipients.length,
      total_amount: recipients.reduce((sum, r) => sum + r.amount, 0),
      network
    });

    // Process in smaller batches for better success rates
    const batchSize = this.getOptimalBatchSize(recipients.length);
    const chunks = this.chunkArray(recipients, batchSize);
    
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      
      try {
        // Create transaction for this chunk
        const transaction = new Transaction();
        
        // Add transfer instructions
        chunk.forEach(recipient => {
          const instruction = SystemProgram.transfer({
            fromPubkey: wallet.publicKey!,
            toPubkey: new PublicKey(recipient.address),
            lamports: Math.floor(recipient.amount * LAMPORTS_PER_SOL)
          });
          transaction.add(instruction);
        });
        
        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;
        
        // Sign transaction
        const signedTransaction = await wallet.signTransaction(transaction);
        
        // Send transaction with confirmation
        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }
        
        // Mark all recipients in this chunk as successful
        chunk.forEach(recipient => {
          results.push({
            success: true,
            signature,
            recipientAddress: recipient.address,
            amount: recipient.amount
          });
        });
        
        // Track success
        analytics.transactionConfirmed(signature, {
          batch_size: chunk.length,
          total_amount: chunk.reduce((sum, r) => sum + r.amount, 0),
          network
        });
        
        // Update progress
        const completed = (chunkIndex + 1) * batchSize;
        onProgress?.(Math.min(completed, recipients.length), recipients.length, signature);
        
        // Add delay between batches to avoid rate limits
        if (chunkIndex < chunks.length - 1) {
          await this.delay(1000);
        }
        
      } catch (error) {
        console.error(`Batch ${chunkIndex} failed:`, error);
        
        // Mark all recipients in this chunk as failed
        chunk.forEach((recipient, recipientIndex) => {
          const globalIndex = chunkIndex * batchSize + recipientIndex;
          results.push({
            success: false,
            error: (error as Error).message,
            recipientAddress: recipient.address,
            amount: recipient.amount
          });
          
          onError?.(error as Error, globalIndex);
        });
        
        analytics.captureError(error as Error, {
          context: 'batch_sol_transfer',
          batch_index: chunkIndex,
          recipients_in_batch: chunk.length
        });
      }
    }
    
    return results;
  }
  
  /**
   * Execute batch SPL token transfers
   */
  async executeBatchTokenTransfer(
    options: BatchTransactionOptions & { tokenMint: string }
  ): Promise<TransactionResult[]> {
    const { connection, wallet, recipients, tokenMint, network, onProgress, onError } = options;
    const results: TransactionResult[] = [];
    
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected or does not support signing');
    }

    const mintPublicKey = new PublicKey(tokenMint);
    
    analytics.transactionInitiated('batch_token_transfer', {
      recipients: recipients.length,
      token_mint: tokenMint,
      network
    });

    // Get token account for sender
    const senderTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      wallet.publicKey
    );
    
    // Verify sender has sufficient tokens
    try {
      const tokenAccount = await getAccount(connection, senderTokenAccount);
      const totalRequired = recipients.reduce((sum, r) => sum + r.amount, 0);
      
      if (Number(tokenAccount.amount) < totalRequired) {
        throw new Error('Insufficient token balance');
      }
    } catch (error) {
      throw new Error('Token account not found or insufficient balance');
    }
    
    const batchSize = this.getOptimalBatchSize(recipients.length);
    const chunks = this.chunkArray(recipients, batchSize);
    
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      
      try {
        const transaction = new Transaction();
        
        // Add token transfer instructions
        for (const recipient of chunk) {
          const recipientTokenAccount = await getAssociatedTokenAddress(
            mintPublicKey,
            new PublicKey(recipient.address)
          );
          
          const instruction = createTransferInstruction(
            senderTokenAccount,
            recipientTokenAccount,
            wallet.publicKey,
            Math.floor(recipient.amount * Math.pow(10, 9)), // Assuming 9 decimals
            [],
            TOKEN_PROGRAM_ID
          );
          
          transaction.add(instruction);
        }
        
        // Set transaction properties
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = wallet.publicKey;
        
        // Sign and send
        const signedTransaction = await wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
        
        // Confirm transaction
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Token transfer failed: ${confirmation.value.err}`);
        }
        
        // Mark successful
        chunk.forEach(recipient => {
          results.push({
            success: true,
            signature,
            recipientAddress: recipient.address,
            amount: recipient.amount
          });
        });
        
        analytics.transactionConfirmed(signature, {
          batch_size: chunk.length,
          token_mint: tokenMint,
          network
        });
        
        const completed = (chunkIndex + 1) * batchSize;
        onProgress?.(Math.min(completed, recipients.length), recipients.length, signature);
        
        if (chunkIndex < chunks.length - 1) {
          await this.delay(1500); // Longer delay for token transfers
        }
        
      } catch (error) {
        chunk.forEach((recipient, recipientIndex) => {
          const globalIndex = chunkIndex * batchSize + recipientIndex;
          results.push({
            success: false,
            error: (error as Error).message,
            recipientAddress: recipient.address,
            amount: recipient.amount
          });
          
          onError?.(error as Error, globalIndex);
        });
        
        analytics.captureError(error as Error, {
          context: 'batch_token_transfer',
          token_mint: tokenMint,
          batch_index: chunkIndex
        });
      }
    }
    
    return results;
  }
  
  /**
   * Simulate transaction without executing
   */
  async simulateTransaction(
    connection: Connection,
    transaction: Transaction
  ): Promise<{ success: boolean; fee: number; error?: string }> {
    try {
      // Simulate the transaction
      const simulation = await connection.simulateTransaction(transaction);
      
      if (simulation.value.err) {
        return {
          success: false,
          fee: 0,
          error: `Simulation failed: ${simulation.value.err}`
        };
      }
      
      // Calculate actual fee
      const fee = await this.calculateTransactionFee(connection, transaction);
      
      return {
        success: true,
        fee
      };
      
    } catch (error) {
      return {
        success: false,
        fee: 0,
        error: (error as Error).message
      };
    }
  }
  
  /**
   * Calculate accurate transaction fee
   */
  async calculateTransactionFee(connection: Connection, transaction: Transaction): Promise<number> {
    try {
      const fee = await connection.getFeeForMessage(transaction.compileMessage());
      return fee.value ? fee.value / LAMPORTS_PER_SOL : 0.000005;
    } catch {
      return 0.000005; // Fallback fee
    }
  }
  
  /**
   * Get optimal batch size based on network conditions
   */
  private getOptimalBatchSize(recipientCount: number): number {
    // Conservative batch sizes for better success rates
    if (recipientCount <= 5) return recipientCount;
    if (recipientCount <= 20) return 5;
    if (recipientCount <= 50) return 8;
    return 10; // Max batch size
  }
  
  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Check if address exists on blockchain
   */
  async validateAddressExists(connection: Connection, address: string): Promise<boolean> {
    try {
      const publicKey = new PublicKey(address);
      const accountInfo = await connection.getAccountInfo(publicKey);
      return accountInfo !== null;
    } catch {
      return false;
    }
  }
  
  /**
   * Get current network priority fee recommendations
   */
  async getPriorityFeeRecommendation(connection: Connection): Promise<{
    slow: number;
    normal: number;
    fast: number;
  }> {
    try {
      // This would integrate with priority fee APIs like Helius
      // For now, return static recommendations
      return {
        slow: 0.000001,    // 1000 lamports
        normal: 0.000005,  // 5000 lamports  
        fast: 0.00001      // 10000 lamports
      };
    } catch {
      return {
        slow: 0.000001,
        normal: 0.000005,
        fast: 0.00001
      };
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService();

// Export types for use in components
export type { TransactionResult, BatchTransactionOptions, TransactionRecipient };