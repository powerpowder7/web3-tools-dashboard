// src/services/tokenIntegrationService.ts - Production Implementation
import { PublicKey } from '@solana/web3.js';

// Integration interfaces
export interface ImportFromWalletCreatorOptions {
  count: number;
  walletType: 'standard' | 'vanity';
  suggestedAmount?: number;
}

export interface GenerateVanityAddressOptions {
  pattern: string;
  count: number;
  position: 'prefix' | 'suffix' | 'anywhere';
  caseSensitive: boolean;
}

export interface VanityResult {
  address: string;
  privateKey: string;
  pattern: string;
  attempts: number;
}

export interface ExportToMultiSenderOptions {
  tokenData: {
    mintAddress: string;
    tokenName: string;
    tokenSymbol: string;
    decimals: number;
    totalSupply?: number;
    createdAt: Date;
  };
  recipientAddresses: string[];
  defaultAmount: number;
  includeTokenInfo: boolean;
}

export interface WalletData {
  address: string;
  privateKey?: string;
  derivationPath?: string;
  index?: number;
}

// Local storage keys
const STORAGE_KEYS = {
  CREATED_TOKENS: 'web3tools_created_tokens',
  WALLET_DATA: 'web3tools_wallet_data',
  VANITY_ADDRESSES: 'web3tools_vanity_addresses',
  MULTISENDER_DATA: 'web3tools_multisender_data'
};

export class TokenIntegrationService {
  /**
   * Import wallet addresses from Wallet Creator tool
   */
  static async importFromWalletCreator(options: ImportFromWalletCreatorOptions): Promise<string[]> {
    try {
      console.log('Importing wallets from Wallet Creator:', options);

      // Get wallet data from localStorage (created by Wallet Creator tool)
      const walletDataJson = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
      
      if (!walletDataJson) {
        throw new Error('No wallet data found. Please generate wallets first using the Wallet Creator tool.');
      }

      const walletData: WalletData[] = JSON.parse(walletDataJson);
      
      if (walletData.length === 0) {
        throw new Error('No wallets available. Please generate wallets first.');
      }

      // Filter by wallet type if specified
      let filteredWallets = walletData;
      if (options.walletType === 'vanity') {
        // Get vanity addresses if specifically requested
        const vanityData = localStorage.getItem(STORAGE_KEYS.VANITY_ADDRESSES);
        if (vanityData) {
          const vanityAddresses: VanityResult[] = JSON.parse(vanityData);
          filteredWallets = vanityAddresses.map(v => ({ address: v.address, privateKey: v.privateKey }));
        }
      }

      // Limit to requested count
      const selectedWallets = filteredWallets.slice(0, options.count);
      const addresses = selectedWallets.map(wallet => wallet.address);

      console.log(`Imported ${addresses.length} wallet addresses`);
      
      // Store suggestion for Multi-Sender if amount provided
      if (options.suggestedAmount) {
        const suggestionData = {
          addresses,
          suggestedAmount: options.suggestedAmount,
          timestamp: new Date().toISOString(),
          source: 'token_creator'
        };
        localStorage.setItem('web3tools_multisender_suggestion', JSON.stringify(suggestionData));
      }

      return addresses;

    } catch (error) {
      console.error('Failed to import from Wallet Creator:', error);
      throw error;
    }
  }

  /**
   * Generate vanity addresses with specific patterns
   */
  static async generateVanityAddresses(options: GenerateVanityAddressOptions): Promise<VanityResult[]> {
    try {
      console.log('Generating vanity addresses:', options);

      const results: VanityResult[] = [];
      const maxAttempts = 1000000; // Prevent infinite loops

      for (let i = 0; i < options.count; i++) {
        let attempts = 0;
        let found = false;

        while (!found && attempts < maxAttempts) {
          attempts++;

          // Generate a new keypair
          const { address, privateKey } = this.generateKeypair();

          // Check if address matches pattern
          if (this.matchesPattern(address, options.pattern, options.position, options.caseSensitive)) {
            results.push({
              address,
              privateKey,
              pattern: options.pattern,
              attempts
            });
            found = true;
          }
        }

        if (!found) {
          console.warn(`Could not find vanity address with pattern "${options.pattern}" after ${maxAttempts} attempts`);
        }
      }

      // Store generated vanity addresses
      const existingVanity = localStorage.getItem(STORAGE_KEYS.VANITY_ADDRESSES);
      const existingData: VanityResult[] = existingVanity ? JSON.parse(existingVanity) : [];
      const updatedData = [...existingData, ...results];
      localStorage.setItem(STORAGE_KEYS.VANITY_ADDRESSES, JSON.stringify(updatedData));

      console.log(`Generated ${results.length} vanity addresses`);
      return results;

    } catch (error) {
      console.error('Vanity address generation failed:', error);
      throw error;
    }
  }

  /**
   * Export token data to Multi-Sender tool
   */
  static async exportToMultiSender(options: ExportToMultiSenderOptions): Promise<void> {
    try {
      console.log('Exporting to Multi-Sender:', options);

      // Validate addresses
      const validAddresses = options.recipientAddresses.filter(addr => {
        try {
          new PublicKey(addr);
          return true;
        } catch {
          return false;
        }
      });

      if (validAddresses.length === 0) {
        throw new Error('No valid recipient addresses provided');
      }

      // Create Multi-Sender format data
      const multiSenderData = {
        tokenInfo: options.includeTokenInfo ? {
          mintAddress: options.tokenData.mintAddress,
          name: options.tokenData.tokenName,
          symbol: options.tokenData.tokenSymbol,
          decimals: options.tokenData.decimals,
          totalSupply: options.tokenData.totalSupply,
          createdAt: options.tokenData.createdAt.toISOString()
        } : null,
        recipients: validAddresses.map(address => ({
          address,
          amount: options.defaultAmount
        })),
        totalRecipients: validAddresses.length,
        totalAmount: options.defaultAmount * validAddresses.length,
        exportedAt: new Date().toISOString(),
        source: 'token_creator'
      };

      // Store for Multi-Sender tool to pick up
      localStorage.setItem(STORAGE_KEYS.MULTISENDER_DATA, JSON.stringify(multiSenderData));

      // Also store in created tokens history
      const existingTokens = localStorage.getItem(STORAGE_KEYS.CREATED_TOKENS);
      const tokenHistory = existingTokens ? JSON.parse(existingTokens) : [];
      
      const tokenRecord = {
        ...options.tokenData,
        createdAt: options.tokenData.createdAt.toISOString(),
        recipientCount: validAddresses.length,
        exported: true,
        exportedAt: new Date().toISOString()
      };

      tokenHistory.push(tokenRecord);
      localStorage.setItem(STORAGE_KEYS.CREATED_TOKENS, JSON.stringify(tokenHistory));

      console.log(`Exported token data with ${validAddresses.length} recipients to Multi-Sender`);

    } catch (error) {
      console.error('Export to Multi-Sender failed:', error);
      throw error;
    }
  }

  /**
   * Get token creation history
   */
  static getTokenHistory(): any[] {
    try {
      const historyJson = localStorage.getItem(STORAGE_KEYS.CREATED_TOKENS);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Failed to get token history:', error);
      return [];
    }
  }

  /**
   * Clear integration data
   */
  static clearIntegrationData(type?: 'tokens' | 'wallets' | 'vanity' | 'multisender'): void {
    try {
      if (!type) {
        // Clear all
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        localStorage.removeItem('web3tools_multisender_suggestion');
      } else {
        switch (type) {
          case 'tokens':
            localStorage.removeItem(STORAGE_KEYS.CREATED_TOKENS);
            break;
          case 'wallets':
            localStorage.removeItem(STORAGE_KEYS.WALLET_DATA);
            break;
          case 'vanity':
            localStorage.removeItem(STORAGE_KEYS.VANITY_ADDRESSES);
            break;
          case 'multisender':
            localStorage.removeItem(STORAGE_KEYS.MULTISENDER_DATA);
            localStorage.removeItem('web3tools_multisender_suggestion');
            break;
        }
      }
      console.log(`Cleared ${type || 'all'} integration data`);
    } catch (error) {
      console.error('Failed to clear integration data:', error);
    }
  }

  /**
   * Get integration status
   */
  static getIntegrationStatus(): {
    hasWallets: boolean;
    walletCount: number;
    hasVanityAddresses: boolean;
    vanityCount: number;
    hasTokenHistory: boolean;
    tokenCount: number;
  } {
    try {
      const walletData = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
      const vanityData = localStorage.getItem(STORAGE_KEYS.VANITY_ADDRESSES);
      const tokenData = localStorage.getItem(STORAGE_KEYS.CREATED_TOKENS);

      const wallets = walletData ? JSON.parse(walletData) : [];
      const vanityAddresses = vanityData ? JSON.parse(vanityData) : [];
      const tokens = tokenData ? JSON.parse(tokenData) : [];

      return {
        hasWallets: wallets.length > 0,
        walletCount: wallets.length,
        hasVanityAddresses: vanityAddresses.length > 0,
        vanityCount: vanityAddresses.length,
        hasTokenHistory: tokens.length > 0,
        tokenCount: tokens.length
      };
    } catch (error) {
      console.error('Failed to get integration status:', error);
      return {
        hasWallets: false,
        walletCount: 0,
        hasVanityAddresses: false,
        vanityCount: 0,
        hasTokenHistory: false,
        tokenCount: 0
      };
    }
  }

  /**
   * Generate a new Solana keypair
   */
  private static generateKeypair(): { address: string; privateKey: string } {
    // Import Solana web3.js dynamically to avoid bundling issues
    const { Keypair } = require('@solana/web3.js');
    
    const keypair = Keypair.generate();
    const address = keypair.publicKey.toString();
    const privateKey = Buffer.from(keypair.secretKey).toString('base64');

    return { address, privateKey };
  }

  /**
   * Check if address matches vanity pattern
   */
  private static matchesPattern(
    address: string,
    pattern: string,
    position: 'prefix' | 'suffix' | 'anywhere',
    caseSensitive: boolean
  ): boolean {
    const searchAddress = caseSensitive ? address : address.toLowerCase();
    const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

    switch (position) {
      case 'prefix':
        return searchAddress.startsWith(searchPattern);
      case 'suffix':
        return searchAddress.endsWith(searchPattern);
      case 'anywhere':
        return searchAddress.includes(searchPattern);
      default:
        return false;
    }
  }

  /**
   * Validate Solana address format
   */
  static isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Export data as CSV for external use
   */
  static exportAsCSV(data: any[], filename: string): void {
    try {
      if (data.length === 0) {
        throw new Error('No data to export');
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape values containing commas or quotes
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Exported ${data.length} records as ${filename}.csv`);

    } catch (error) {
      console.error('CSV export failed:', error);
      throw error;
    }
  }
}

export default TokenIntegrationService;