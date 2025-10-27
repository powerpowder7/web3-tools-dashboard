// src/services/blockchainService.ts - Production Blockchain Interactions (FIXED - Multi-RPC)
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  createSetAuthorityInstruction,
  AuthorityType,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  MintLayout,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';

// Multi-RPC Configuration - Alchemy for reliable CORS support in browsers
const RPC_ENDPOINTS = {
  devnet: [
    typeof import.meta.env.VITE_SOLANA_RPC_DEVNET !== 'undefined' ? import.meta.env.VITE_SOLANA_RPC_DEVNET : 'https://solana-devnet.g.alchemy.com/v2/demo',
    'https://rpc.ankr.com/solana_devnet',
    'https://api.devnet.solana.com'
  ],
  mainnet: [
    typeof import.meta.env.VITE_SOLANA_RPC_MAINNET !== 'undefined' ? import.meta.env.VITE_SOLANA_RPC_MAINNET : 'https://solana-mainnet.g.alchemy.com/v2/demo',
    'https://rpc.ankr.com/solana',
    'https://api.mainnet-beta.solana.com'
  ]
};

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
export class BlockchainError extends Error {
  constructor(message: string, public code?: string, public logs?: string[]) {
    super(message);
    this.name = 'BlockchainError';
  }
}

export class BlockchainService {
  private connection: Connection;
  private config: TransactionConfig;
  private currentRpcIndex: number = 0;
  private isDevnet: boolean;

  constructor(connection: Connection, config?: Partial<TransactionConfig>) {
    this.connection = connection;
    this.isDevnet = connection.rpcEndpoint.includes('devnet');
    this.config = {
      maxRetries: 3,
      confirmationTimeout: 60000,
      priorityFee: 1000,
      computeUnitLimit: 200000,
      ...config
    };
  }

  /**
   * Get a working RPC connection with automatic fallback
   */
  private async getWorkingConnection(): Promise<Connection> {
    const endpoints = this.isDevnet ? RPC_ENDPOINTS.devnet : RPC_ENDPOINTS.mainnet;

    for (let i = 0; i < endpoints.length; i++) {
      const index = (this.currentRpcIndex + i) % endpoints.length;
      const endpoint = endpoints[index];

      try {
        console.log(`[RPC] Testing endpoint ${index + 1}/${endpoints.length}: ${endpoint}`);
        const testConnection = new Connection(endpoint, 'confirmed');

        // Quick health check
        await testConnection.getSlot();

        console.log(`[RPC] ✓ Connected successfully to: ${endpoint}`);
        this.currentRpcIndex = index;
        this.connection = testConnection;
        return testConnection;
      } catch (error) {
        console.warn(`[RPC] ✗ Failed to connect to ${endpoint}:`, error);
        continue;
      }
    }

    // If all fail, return original connection and let it fail with proper error
    console.error('[RPC] All endpoints failed, using original connection');
    return this.connection;
  }

  /**
   * Create SPL token with all necessary instructions - FIXED
   */
  async createSPLToken(
    payer: PublicKey,
    mintKeypair: Keypair,
    decimals: number,
    mintAuthority: PublicKey | null,
    freezeAuthority: PublicKey | null,
    initialSupply?: number
  ): Promise<TransactionResult> {
    try {
      console.log('[Token Creation] Starting SPL token creation...');
      console.log('[Token Creation] Payer:', payer.toString());
      console.log('[Token Creation] Mint:', mintKeypair.publicKey.toString());
      console.log('[Token Creation] Decimals:', decimals);
      console.log('[Token Creation] Initial Supply:', initialSupply);

      // Get working connection
      const connection = await this.getWorkingConnection();

      const transaction = new Transaction();

      // Get minimum balance for rent exemption
      console.log('[Token Creation] Fetching rent exemption amount...');
      const mintRent = await getMinimumBalanceForRentExemptMint(connection);
      console.log('[Token Creation] Rent exemption:', mintRent / LAMPORTS_PER_SOL, 'SOL');

      // Create mint account
      console.log('[Token Creation] Adding create account instruction...');
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: mintKeypair.publicKey,
          space: MintLayout.span,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Initialize mint - FIXED: Proper null handling
      console.log('[Token Creation] Adding initialize mint instruction...');
      const actualMintAuthority = mintAuthority !== null ? mintAuthority : payer;
      const actualFreezeAuthority = freezeAuthority; // Can be null

      transaction.add(
        createInitializeMintInstruction(
          mintKeypair.publicKey,
          decimals,
          actualMintAuthority,
          actualFreezeAuthority,
          TOKEN_PROGRAM_ID
        )
      );

      // Create associated token account and mint initial supply if needed
      if (initialSupply && initialSupply > 0) {
        console.log('[Token Creation] Adding initial supply minting...');

        // Get associated token address
        const ataAddress = await getAssociatedTokenAddress(
          mintKeypair.publicKey,
          payer,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        console.log('[Token Creation] ATA address:', ataAddress.toString());

        // Create ATA instruction
        transaction.add(
          createAssociatedTokenAccountInstruction(
            payer,
            ataAddress,
            payer,
            mintKeypair.publicKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        // Mint initial supply
        const mintAmount = BigInt(Math.floor(initialSupply * Math.pow(10, decimals)));
        console.log('[Token Creation] Minting amount (lamports):', mintAmount.toString());

        transaction.add(
          createMintToInstruction(
            mintKeypair.publicKey,
            ataAddress,
            actualMintAuthority,
            mintAmount,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }

      // Get recent blockhash
      console.log('[Token Creation] Getting recent blockhash...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;

      // Partial sign with mint keypair
      console.log('[Token Creation] Signing transaction with mint keypair...');
      transaction.partialSign(mintKeypair);

      console.log('[Token Creation] Transaction prepared, ready to send');
      console.log('[Token Creation] Transaction size:', transaction.serialize({ requireAllSignatures: false }).length, 'bytes');

      // Return transaction data - the wallet will sign and send
      return {
        signature: '', // Will be filled by caller after wallet signs
        confirmationStatus: 'processed',
        slot: 0,
        err: null,
        cost: mintRent / LAMPORTS_PER_SOL,
        transaction, // Include transaction for wallet signing
        blockhash,
        lastValidBlockHeight
      } as any;

    } catch (error: any) {
      console.error('[Token Creation] Failed:', error);
      console.error('[Token Creation] Error stack:', error.stack);

      let errorMessage = 'Failed to create SPL token';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }

      throw new BlockchainError(errorMessage, error.code, error.logs);
    }
  }

  /**
   * Send and confirm transaction with retries
   */
  async sendAndConfirmTransaction(
    transaction: Transaction,
    signers: Keypair[],
    sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>
  ): Promise<TransactionResult> {
    const connection = await this.getWorkingConnection();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`[Transaction] Attempt ${attempt}/${this.config.maxRetries}`);

        // Get fresh blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;

        // Sign with provided signers
        if (signers.length > 0) {
          transaction.partialSign(...signers);
        }

        // Send transaction
        const signature = await sendTransaction(transaction, connection);
        console.log('[Transaction] Sent with signature:', signature);

        // Confirm transaction
        console.log('[Transaction] Waiting for confirmation...');
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight
          },
          'confirmed'
        );

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log('[Transaction] ✓ Confirmed successfully');

        return {
          signature,
          confirmationStatus: 'confirmed',
          slot: confirmation.context.slot,
          err: null,
          cost: 0.000005 // Approximate transaction fee
        };

      } catch (error: any) {
        console.error(`[Transaction] Attempt ${attempt} failed:`, error);
        lastError = error;

        if (attempt < this.config.maxRetries) {
          console.log(`[Transaction] Retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    throw new BlockchainError(
      `Transaction failed after ${this.config.maxRetries} attempts: ${lastError?.message}`,
      'TRANSACTION_FAILED'
    );
  }

  /**
   * Revoke mint authority
   */
  async revokeMintAuthority(
    mint: PublicKey,
    currentAuthority: PublicKey,
    payer: PublicKey
  ): Promise<string> {
    try {
      console.log('[Revoke Authority] Revoking mint authority...');
      const connection = await this.getWorkingConnection();

      const transaction = new Transaction().add(
        createSetAuthorityInstruction(
          mint,
          currentAuthority,
          AuthorityType.MintTokens,
          null, // Set to null to revoke
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payer;

      return 'revoke_prepared'; // Return indicator that instruction is ready

    } catch (error: any) {
      console.error('[Revoke Authority] Failed:', error);
      throw new BlockchainError(`Failed to revoke mint authority: ${error.message}`);
    }
  }

  /**
   * Check network health
   */
  async checkNetworkHealth(): Promise<NetworkHealth> {
    try {
      const connection = await this.getWorkingConnection();
      const startTime = Date.now();

      const slot = await connection.getSlot();

      const latency = Date.now() - startTime;

      return {
        rpcEndpoint: connection.rpcEndpoint,
        latency,
        blockHeight: slot,
        tps: 0, // Would need additional calculation
        healthy: latency < 2000
      };

    } catch (error) {
      console.error('[Network Health] Check failed:', error);
      return {
        rpcEndpoint: this.connection.rpcEndpoint,
        latency: -1,
        blockHeight: 0,
        tps: 0,
        healthy: false
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(signature: string): Promise<any> {
    try {
      const connection = await this.getWorkingConnection();
      const status = await connection.getSignatureStatus(signature);
      return status.value;
    } catch (error) {
      console.error('[Transaction Status] Failed:', error);
      return null;
    }
  }

  /**
   * Get account balance with multi-RPC fallback
   */
  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const connection = await this.getWorkingConnection();
      const lamports = await connection.getBalance(publicKey);
      return lamports / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('[Balance] Failed to get balance:', error);
      throw new BlockchainError('Failed to fetch account balance');
    }
  }
}

export { BlockchainService as default };
