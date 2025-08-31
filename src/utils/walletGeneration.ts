// src/utils/walletGeneration.ts
import { Keypair, PublicKey } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import nacl from 'tweetnacl';

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  publicKey: string;
  derivationPath?: string;
  index?: number;
}

export interface HDWalletBatch {
  mnemonic: string;
  wallets: GeneratedWallet[];
  seedPhrase: string[];
}

export interface StandardWalletBatch {
  wallets: GeneratedWallet[];
}

export type WalletBatch = HDWalletBatch | StandardWalletBatch;

export interface GenerationConfig {
  type: 'hd' | 'standard';
  count: number;
  wordCount: 12 | 24;
  network: 'devnet' | 'mainnet';
  suggestedAmount: number;
}

export class WalletGenerator {
  // Generate HD wallets from a single mnemonic
  static generateHDWallets(count: number, wordCount: 12 | 24 = 12): HDWalletBatch {
    // Generate mnemonic
    const strength = wordCount === 12 ? 128 : 256;
    const mnemonic = bip39.generateMnemonic(strength);
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const seedPhrase = mnemonic.split(' ');

    const wallets: GeneratedWallet[] = [];

    for (let i = 0; i < count; i++) {
      // Standard Solana derivation path: m/44'/501'/0'/0'
      const derivationPath = `m/44'/501'/${i}'/0'`;
      
      try {
        const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
        const keypair = nacl.sign.keyPair.fromSeed(derivedSeed);
        
        const solanaKeypair = Keypair.fromSecretKey(
          new Uint8Array([...keypair.secretKey])
        );

        wallets.push({
          address: solanaKeypair.publicKey.toString(),
          privateKey: Buffer.from(solanaKeypair.secretKey).toString('base64'),
          publicKey: solanaKeypair.publicKey.toString(),
          derivationPath,
          index: i
        });
      } catch (error) {
        console.error(`Failed to generate wallet ${i}:`, error);
        // Skip failed wallet generation
        continue;
      }
    }

    return {
      mnemonic,
      seedPhrase,
      wallets
    };
  }

  // Generate standard independent keypairs
  static generateStandardWallets(count: number): StandardWalletBatch {
    const wallets: GeneratedWallet[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const keypair = Keypair.generate();

        wallets.push({
          address: keypair.publicKey.toString(),
          privateKey: Buffer.from(keypair.secretKey).toString('base64'),
          publicKey: keypair.publicKey.toString(),
          index: i
        });
      } catch (error) {
        console.error(`Failed to generate wallet ${i}:`, error);
        continue;
      }
    }

    return { wallets };
  }

  // Main generation method
  static generate(config: GenerationConfig): WalletBatch {
    if (config.type === 'hd') {
      return this.generateHDWallets(config.count, config.wordCount);
    } else {
      return this.generateStandardWallets(config.count);
    }
  }

  // Validate Solana address
  static isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  // Generate wallet statistics
  static generateStats(wallets: GeneratedWallet[]) {
    const validWallets = wallets.filter(w => this.isValidAddress(w.address));
    
    return {
      totalGenerated: wallets.length,
      validWallets: validWallets.length,
      successRate: ((validWallets.length / wallets.length) * 100).toFixed(1),
      averageAddressLength: validWallets.length > 0 
        ? Math.round(validWallets.reduce((sum, w) => sum + w.address.length, 0) / validWallets.length)
        : 0
    };
  }

  // Format address for display
  static formatAddress(address: string, length: number = 8): string {
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  }

  // Generate QR code data for wallet import
  static generateQRData(wallet: GeneratedWallet): string {
    return JSON.stringify({
      address: wallet.address,
      privateKey: wallet.privateKey,
      network: 'solana'
    });
  }
}