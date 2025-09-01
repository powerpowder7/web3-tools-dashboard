// src/utils/realWalletGeneration.ts
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// Types for real wallet generation
export interface RealGeneratedWallet {
  index: number;
  address: string;
  privateKey: string;
  publicKey: string;
  derivationPath?: string;
  keypair: Keypair;
}

export interface RealGeneratedBatch {
  wallets: RealGeneratedWallet[];
  mnemonic?: string;
  seedPhrase?: string[];
}

export type WalletGenerationType = 'hd' | 'standard';

// Generate cryptographically secure HD wallets from mnemonic
export const generateHDWallets = async (
  count: number, 
  wordCount: 12 | 24 = 12
): Promise<RealGeneratedBatch> => {
  try {
    // Generate secure mnemonic
    const strength = wordCount === 12 ? 128 : 256; // 128 bits = 12 words, 256 bits = 24 words
    const mnemonic = bip39.generateMnemonic(strength);
    const seedPhrase = mnemonic.split(' ');
    
    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Generated mnemonic is invalid');
    }

    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    const wallets: RealGeneratedWallet[] = [];
    
    // Generate wallets from HD path
    for (let i = 0; i < count; i++) {
      // Standard Solana HD path: m/44'/501'/0'/0'/{account}
      const derivationPath = `m/44'/501'/${i}'/0'`;
      
      // Derive key from path
      const derivedSeed = derivePath(derivationPath, seed.toString('hex')).key;
      
      // Create Solana keypair from derived seed
      const keypair = Keypair.fromSeed(derivedSeed);
      
      // Get addresses
      const publicKey = keypair.publicKey.toBase58();
      const privateKey = bs58.encode(keypair.secretKey);
      
      wallets.push({
        index: i,
        address: publicKey,
        privateKey: privateKey,
        publicKey: publicKey,
        derivationPath: derivationPath,
        keypair: keypair
      });
    }

    return {
      wallets,
      mnemonic,
      seedPhrase
    };
  } catch (error) {
    console.error('HD Wallet generation failed:', error);
    throw new Error(`HD wallet generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Generate independent standard keypairs
export const generateStandardKeypairs = async (count: number): Promise<RealGeneratedBatch> => {
  try {
    const wallets: RealGeneratedWallet[] = [];
    
    // Generate independent keypairs
    for (let i = 0; i < count; i++) {
      // Generate cryptographically secure keypair
      const keypair = Keypair.generate();
      
      // Get addresses
      const publicKey = keypair.publicKey.toBase58();
      const privateKey = bs58.encode(keypair.secretKey);
      
      wallets.push({
        index: i,
        address: publicKey,
        privateKey: privateKey,
        publicKey: publicKey,
        keypair: keypair
        // No derivationPath for standard keypairs
      });
    }

    return {
      wallets
      // No mnemonic for standard keypairs
    };
  } catch (error) {
    console.error('Standard keypair generation failed:', error);
    throw new Error(`Standard keypair generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Main wallet generation function
export const generateRealWallets = async (
  count: number, 
  type: WalletGenerationType,
  wordCount: 12 | 24 = 12
): Promise<RealGeneratedBatch> => {
  // Validate inputs
  if (count < 1 || count > 100) {
    throw new Error('Wallet count must be between 1 and 100');
  }

  if (type === 'hd') {
    return await generateHDWallets(count, wordCount);
  } else {
    return await generateStandardKeypairs(count);
  }
};

// Utility function to validate a Solana address
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    // Solana addresses are base58 encoded and should be 32-44 characters
    if (address.length < 32 || address.length > 44) {
      return false;
    }
    
    // Try to decode as base58
    const decoded = bs58.decode(address);
    
    // Solana public keys should be exactly 32 bytes
    return decoded.length === 32;
  } catch {
    return false;
  }
};

// Utility function to get keypair from private key
export const getKeypairFromPrivateKey = (privateKeyBase58: string): Keypair => {
  try {
    const privateKeyBytes = bs58.decode(privateKeyBase58);
    return Keypair.fromSecretKey(privateKeyBytes);
  } catch (error) {
    throw new Error(`Invalid private key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Security validation for production
export const validateGenerationSecurity = (): { isSecure: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  // Check if we're in a secure context (HTTPS or localhost)
  if (typeof window !== 'undefined') {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      warnings.push('Not running in secure context (HTTPS required for production)');
    }
    
    // Check for development environment indicators
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      warnings.push('Running in development environment');
    }
  }
  
  // Check if crypto APIs are available
  if (typeof window !== 'undefined' && !window.crypto) {
    warnings.push('Web Crypto API not available - insecure random generation');
  }
  
  return {
    isSecure: warnings.length === 0,
    warnings
  };
};

// Export all functions
export default {
  generateRealWallets,
  generateHDWallets,
  generateStandardKeypairs,
  isValidSolanaAddress,
  getKeypairFromPrivateKey,
  validateGenerationSecurity
};