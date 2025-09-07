// src/services/blockchainService.ts - Production Blockchain Interactions (Fixed)
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SendTransactionError
} from '@solana/web3.js';
import {
  createSetAuthorityInstruction,
  AuthorityType,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  MintLayout,
  createMintToInstruction
} from '@solana/spl-token';

// Transaction configuration
interface TransactionConfig {
  maxRetries: number;
  confirmationTimeout: number;
  priorityFee: number;
  computeUnitLimit: number;
}

// Transaction result
interface TransactionResult {
  signature: string;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
  slot: number;
  err: any;
  cost: number;
}

// Network health status
interface NetworkHealth {
  rpcEndpoint: string;
  latency: number;
  blockHeight: number;
  tps: number;
  healthy: boolean;
}

// Error types
class BlockchainError extends Error {
  constructor(message: string, public code?: string, public logs?: string[]) {
    super(message);
    this.name = 'BlockchainError';
  }
}

export class BlockchainService {
  private connection: Connection;
  private config: TransactionConfig;

  constructor(connection: Connection, config?: Partial<TransactionConfig>) {
    this.connection = connection;
    this.config = {
      maxRetries: 3,
      confirmationTimeout: 60000,
      priorityFee: 1000,
      computeUnitLimit: 200000,
      ...config
    };
  }

  /**
   * Create SPL token with all necessary instructions
   */
  async createSPLToken(
    payer: PublicKey,
    mintKeypair: Keypair,
    decimals: number,
    mintAuthority: PublicKey | null,
    freezeAuthority: PublicKey | null,
    initialSupply?: number,
    metadataUri?: string
  ): Promise<TransactionResult> {
    try {
      const transaction = new Transaction();

      // Get minimum balance for rent exemption
      const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);

      // Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: mintKeypair.publicKey,
          space: MintLayout.span,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Initialize mint - handle null mint authority properly
      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimals,
          mintAuthority || payer, // Use payer as fallback if null
          freezeAuthority,
          TOKEN_PROGRAM_ID
        )
      );

      // Create metadata if URI provided and mint authority exists
      if (metadataUri && mintAuthority) {
        const metadataInstruction = await this.createMetadataInstruction(
          mintKeypair.publicKey,
          mintAuthority,
          payer,
          metadataUri
        );
        if (metadataInstruction) {
          transaction.add(metadataInstruction);
        }
      }

      // Create associated token account and mint initial supply
      if (initialSupply && initialSupply > 0 && mintAuthority) {
        // Get or create associated token account
        const ataAddress = await this.getAssociatedTokenAddress(
          mintKeypair.publicKey,
          payer
        );

        transaction.add(
          createAssociatedTokenAccountInstruction(
            payer,
            ataAddress,
            payer,
            mintKeypair.publicKey
          )
        );

        // Mint initial supply
        transaction.add(
          createMintToInstruction(
            mintKeypair.publicKey,
            ataAddress,
            mintAuthority,
            initialSupply * Math.pow(10, decimals)
          )
        );
      }

      // Execute transaction
      const result = await this.sendAndConfirmTransaction(transaction, [mintKeypair], payer);
      
      return result;

    } catch (error) {
      console.error('SPL token creation failed:', error);
      throw new BlockchainError(
        `Failed to create SPL token: ${error}`,
        'TOKEN_CREATION_FAILED'
      );
    }
  }

  /**
   * Create metadata instruction for token (simplified for now)
   */
  private async createMetadataInstruction(
    mint: PublicKey,
    mintAuthority: PublicKey,
    payer: PublicKey,
    uri: string
  ): Promise<any | null> {
    try {
      // For now, return null - metadata creation will be handled by the TokenService
      // This avoids the complex Metaplex imports until they're properly configured
      console.log('Metadata creation will be handled by TokenService for:', mint.toString());
      console.log('Metadata URI:', uri);
      console.log('Mint Authority:', mintAuthority.toString());
      console.log('Payer:', payer.toString());
      return null;
    } catch (error) {
      console.error('Metadata instruction creation failed:', error);
      return null;
    }
  }

  /**
   * Send and confirm transaction with retries
   */
  async sendAndConfirmTransaction(
    transaction: Transaction,
    signers: Keypair[],
    payer: PublicKey
  ): Promise<TransactionResult> {
    let lastError: Error = new Error('Transaction failed - no attempts made');
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`Transaction attempt ${attempt}/${this.config.maxRetries}`);

        // Get fresh blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
        
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = payer;

        // Sign transaction
        transaction.partialSign(...signers);

        // Calculate transaction cost before sending
        const fee = await this.connection.getFeeForMessage(transaction.compileMessage());
        const totalCost = fee?.value || 5000;

        // Send transaction
        const rawTransaction = transaction.serialize();
        const signature = await this.connection.sendRawTransaction(rawTransaction, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 0
        });

        console.log('Transaction sent:', signature);

        // Confirm transaction
        const confirmation = await this.connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });

        if (confirmation.value.err) {
          throw new BlockchainError(
            `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
            'TRANSACTION_FAILED',
            []
          );
        }

        console.log('Transaction confirmed:', signature);

        return {
          signature,
          confirmationStatus: 'confirmed',
          slot: confirmation.context.slot,
          err: confirmation.value.err,
          cost: totalCost / LAMPORTS_PER_SOL
        };

      } catch (error: any) {
        lastError = error;
        console.error(`Transaction attempt ${attempt} failed:`, error);

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new BlockchainError(
      `Transaction failed after ${this.config.maxRetries} attempts: ${lastError.message}`,
      'MAX_RETRIES_EXCEEDED'
    );
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error: any): boolean {
    if (error instanceof SendTransactionError) {
      // Don't retry if insufficient funds or invalid transaction
      const message = error.message.toLowerCase();
      return message.includes('insufficient funds') ||
             message.includes('invalid') ||
             message.includes('already processed');
    }
    return false;
  }

  /**
   * Get associated token address
   */
  private async getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    const [address] = PublicKey.findProgramAddressSync(
      [
        owner.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    return address;
  }

  /**
   * Revoke mint authority
   */
  async revokeMintAuthority(
    mint: PublicKey,
    currentAuthority: PublicKey,
    payer: PublicKey
  ): Promise<TransactionResult> {
    try {
      const transaction = new Transaction().add(
        createSetAuthorityInstruction(
          mint,
          currentAuthority,
          AuthorityType.MintTokens,
          null
        )
      );

      return await this.sendAndConfirmTransaction(transaction, [], payer);

    } catch (error) {
      throw new BlockchainError(
        `Failed to revoke mint authority: ${error}`,
        'AUTHORITY_REVOKE_FAILED'
      );
    }
  }

  /**
   * Check network health
   */
  async checkNetworkHealth(): Promise<NetworkHealth> {
    try {
      const startTime = Date.now();
      
      // Get current block height
      const blockHeight = await this.connection.getBlockHeight();
      
      const latency = Date.now() - startTime;

      // Estimate TPS (simplified)
      const tps = await this.estimateCurrentTPS();

      return {
        rpcEndpoint: this.connection.rpcEndpoint,
        latency,
        blockHeight,
        tps,
        healthy: latency < 2000 && tps > 0
      };

    } catch (error) {
      console.error('Network health check failed:', error);
      return {
        rpcEndpoint: this.connection.rpcEndpoint,
        latency: -1,
        blockHeight: -1,
        tps: -1,
        healthy: false
      };
    }
  }

  /**
   * Estimate current network TPS
   */
  private async estimateCurrentTPS(): Promise<number> {
    try {
      const samples = await this.connection.getRecentPerformanceSamples(1);
      if (samples.length > 0) {
        const sample = samples[0];
        return sample.numTransactions / sample.samplePeriodSecs;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(signature: string): Promise<any> {
    try {
      const status = await this.connection.getSignatureStatus(signature, {
        searchTransactionHistory: true
      });
      
      return {
        signature,
        confirmationStatus: status.value?.confirmationStatus,
        err: status.value?.err,
        slot: status.value?.slot
      };

    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return null;
    }
  }

  /**
   * Estimate transaction cost
   */
  async estimateTransactionCost(transaction: Transaction): Promise<number> {
    try {
      const fee = await this.connection.getFeeForMessage(transaction.compileMessage());
      return (fee?.value || 5000) / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Cost estimation failed:', error);
      return 0.005; // Fallback estimate
    }
  }

  /**
   * Get account balance
   */
  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  /**
   * Airdrop SOL for testing (devnet only)
   */
  async airdrop(publicKey: PublicKey, amount: number): Promise<string> {
    try {
      const signature = await this.connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );

      await this.connection.confirmTransaction(signature);
      return signature;

    } catch (error) {
      throw new BlockchainError(
        `Airdrop failed: ${error}`,
        'AIRDROP_FAILED'
      );
    }
  }
}

// Helper function to create associated token account instruction
function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey
) {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedToken, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return {
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.alloc(0),
  };
}

export { BlockchainError };
export default BlockchainService;