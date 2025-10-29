// src/services/jitoService.ts - JITO Bundle Integration for MEV Protection
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  TransactionMessage,
} from '@solana/web3.js';

/**
 * JITO Bundle Configuration
 */
export interface JITOConfig {
  endpoint: string;
  bundleTip: number; // in SOL
  maxRetries: number;
  retryDelay: number; // in milliseconds
}

/**
 * Bundle Launch Parameters
 */
export interface BundledLaunchParams {
  tokenCreationTx: Transaction;
  liquidityTx?: Transaction;
  additionalTxs?: Transaction[];
  tipAmount: number; // in lamports
  signers: Keypair[];
}

/**
 * Bundle Result
 */
export interface BundleResult {
  bundleId: string;
  success: boolean;
  signatures: string[];
  landedSlot?: number;
  error?: string;
}

/**
 * Bundle Status
 */
export interface BundleStatus {
  bundleId: string;
  status: 'pending' | 'landed' | 'failed' | 'invalid';
  landedSlot?: number;
  transactions?: {
    signature: string;
    status: string;
  }[];
  error?: string;
}

/**
 * JITO Tip Account addresses for different networks
 */
const JITO_TIP_ACCOUNTS = {
  mainnet: [
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh'
  ],
  devnet: [
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY' // Use same for devnet testing
  ]
};

/**
 * JITO Bundle Endpoints
 */
const JITO_ENDPOINTS = {
  mainnet: 'https://mainnet.block-engine.jito.wtf/api/v1',
  devnet: 'https://dallas.testnet.block-engine.jito.wtf/api/v1'
};

/**
 * JITO Service for MEV Protection via Transaction Bundles
 */
export class JITOService {
  private connection: Connection;
  private config: JITOConfig;
  private isMainnet: boolean;

  constructor(connection: Connection, customConfig?: Partial<JITOConfig>) {
    this.connection = connection;
    this.isMainnet = !connection.rpcEndpoint.includes('devnet');

    // Default configuration
    this.config = {
      endpoint: this.isMainnet ? JITO_ENDPOINTS.mainnet : JITO_ENDPOINTS.devnet,
      bundleTip: 0.001, // Default 0.001 SOL tip
      maxRetries: 3,
      retryDelay: 2000,
      ...customConfig
    };

    console.log(`[JITO Service] Initialized for ${this.isMainnet ? 'mainnet' : 'devnet'}`);
  }

  /**
   * Create a bundled token launch with MEV protection
   * Atomically executes token creation + optional liquidity addition
   */
  async createBundledTokenLaunch(params: BundledLaunchParams): Promise<BundleResult> {
    try {
      console.log('[JITO] Creating bundled token launch...');

      // 1. Build bundle array
      const transactions: Transaction[] = [params.tokenCreationTx];

      if (params.liquidityTx) {
        transactions.push(params.liquidityTx);
      }

      if (params.additionalTxs) {
        transactions.push(...params.additionalTxs);
      }

      // 2. Add tip transaction to the bundle
      const tipTx = await this.createTipTransaction(params.tipAmount, params.signers[0].publicKey);
      transactions.push(tipTx);

      // 3. Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('finalized');

      // 4. Sign all transactions
      for (const tx of transactions) {
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = params.signers[0].publicKey;

        // Sign with all required signers
        for (const signer of params.signers) {
          if (tx.signatures.some(sig => sig.publicKey.equals(signer.publicKey))) {
            tx.partialSign(signer);
          }
        }
      }

      // 5. Serialize transactions
      const serializedTxs = transactions.map(tx =>
        Buffer.from(tx.serialize()).toString('base64')
      );

      // 6. Send bundle to JITO
      console.log('[JITO] Sending bundle with', serializedTxs.length, 'transactions...');
      const bundleId = await this.sendBundle(serializedTxs);

      // 7. Monitor bundle status
      console.log('[JITO] Bundle sent, ID:', bundleId);
      const status = await this.monitorBundleStatus(bundleId);

      if (status.status === 'landed') {
        console.log('[JITO] Bundle landed successfully in slot:', status.landedSlot);
        return {
          bundleId,
          success: true,
          signatures: status.transactions?.map(tx => tx.signature) || [],
          landedSlot: status.landedSlot
        };
      } else {
        throw new Error(`Bundle failed with status: ${status.status}`);
      }

    } catch (error: any) {
      console.error('[JITO] Bundle creation failed:', error);
      return {
        bundleId: '',
        success: false,
        signatures: [],
        error: error.message || 'Bundle creation failed'
      };
    }
  }

  /**
   * Create a tip transaction to incentivize JITO validators
   */
  private async createTipTransaction(tipAmount: number, payer: PublicKey): Promise<Transaction> {
    // Select random tip account
    const tipAccounts = this.isMainnet ? JITO_TIP_ACCOUNTS.mainnet : JITO_TIP_ACCOUNTS.devnet;
    const randomTipAccount = new PublicKey(
      tipAccounts[Math.floor(Math.random() * tipAccounts.length)]
    );

    const tipInstruction = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: randomTipAccount,
      lamports: tipAmount
    });

    const transaction = new Transaction().add(tipInstruction);

    return transaction;
  }

  /**
   * Send bundle to JITO block engine
   */
  private async sendBundle(serializedTransactions: string[]): Promise<string> {
    try {
      const response = await fetch(`${this.config.endpoint}/bundles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sendBundle',
          params: [serializedTransactions]
        })
      });

      if (!response.ok) {
        throw new Error(`JITO API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`JITO bundle error: ${data.error.message}`);
      }

      return data.result;
    } catch (error: any) {
      console.error('[JITO] Failed to send bundle:', error);
      throw new Error(`Failed to send bundle: ${error.message}`);
    }
  }

  /**
   * Monitor bundle status with retries
   */
  async monitorBundleStatus(bundleId: string): Promise<BundleStatus> {
    let retries = 0;

    while (retries < this.config.maxRetries) {
      try {
        const response = await fetch(`${this.config.endpoint}/bundles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getBundleStatuses',
            params: [[bundleId]]
          })
        });

        if (!response.ok) {
          throw new Error(`JITO API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        const bundleStatus = data.result?.value?.[0];

        if (bundleStatus) {
          // Check if bundle has landed
          if (bundleStatus.confirmation_status === 'confirmed' ||
              bundleStatus.confirmation_status === 'finalized') {
            return {
              bundleId,
              status: 'landed',
              landedSlot: bundleStatus.slot,
              transactions: bundleStatus.transactions?.map((tx: any) => ({
                signature: tx.signature,
                status: tx.confirmation_status
              }))
            };
          }

          // Check for errors
          if (bundleStatus.err) {
            return {
              bundleId,
              status: 'failed',
              error: JSON.stringify(bundleStatus.err)
            };
          }
        }

        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        retries++;

      } catch (error: any) {
        console.error(`[JITO] Bundle status check failed (attempt ${retries + 1}):`, error);
        retries++;

        if (retries >= this.config.maxRetries) {
          return {
            bundleId,
            status: 'failed',
            error: error.message
          };
        }

        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    return {
      bundleId,
      status: 'pending',
      error: 'Bundle status unknown after max retries'
    };
  }

  /**
   * Estimate bundle cost including tips
   */
  async estimateBundleCost(transactionCount: number, tipAmount?: number): Promise<number> {
    try {
      // Get base transaction fee
      const recentBlockhash = await this.connection.getLatestBlockhash();
      const lamportsPerSignature = await this.connection.getFeeForMessage(
        new TransactionMessage({
          payerKey: Keypair.generate().publicKey,
          recentBlockhash: recentBlockhash.blockhash,
          instructions: []
        }).compileToV0Message()
      );

      const baseFee = lamportsPerSignature.value || 5000;
      const transactionFees = baseFee * transactionCount;
      const tip = tipAmount || (this.config.bundleTip * 1_000_000_000); // Convert SOL to lamports

      return (transactionFees + tip) / 1_000_000_000; // Convert back to SOL
    } catch (error) {
      console.error('[JITO] Cost estimation failed:', error);
      // Return conservative estimate
      return 0.001 + (transactionCount * 0.000005);
    }
  }

  /**
   * Get recommended tip amount based on network congestion
   */
  async getRecommendedTip(): Promise<number> {
    try {
      // Get recent performance samples to gauge network congestion
      const perfSamples = await this.connection.getRecentPerformanceSamples(10);

      if (perfSamples.length === 0) {
        return this.config.bundleTip * 1_000_000_000;
      }

      // Calculate average transaction rate
      const avgTps = perfSamples.reduce((sum, sample) =>
        sum + sample.numTransactions / sample.samplePeriodSecs, 0
      ) / perfSamples.length;

      // Adjust tip based on TPS (higher TPS = more congestion = higher tip)
      let tipMultiplier = 1.0;

      if (avgTps > 3000) {
        tipMultiplier = 2.0; // High congestion
      } else if (avgTps > 2000) {
        tipMultiplier = 1.5; // Medium congestion
      }

      const recommendedTip = this.config.bundleTip * tipMultiplier * 1_000_000_000;

      console.log(`[JITO] Network TPS: ${avgTps.toFixed(0)}, Recommended tip: ${recommendedTip / 1_000_000_000} SOL`);

      return recommendedTip;

    } catch (error) {
      console.error('[JITO] Failed to get recommended tip:', error);
      return this.config.bundleTip * 1_000_000_000;
    }
  }

  /**
   * Check if JITO is available for current network
   */
  isAvailable(): boolean {
    // JITO is primarily available on mainnet
    // Devnet support is limited but available for testing
    return true;
  }

  /**
   * Get JITO service configuration
   */
  getConfig(): JITOConfig {
    return { ...this.config };
  }

  /**
   * Update JITO configuration
   */
  updateConfig(newConfig: Partial<JITOConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[JITO] Configuration updated:', this.config);
  }
}

/**
 * Factory function to create JITO service instance
 */
export function createJITOService(
  connection: Connection,
  config?: Partial<JITOConfig>
): JITOService {
  return new JITOService(connection, config);
}

export default JITOService;
