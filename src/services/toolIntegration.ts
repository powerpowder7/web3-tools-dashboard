// src/services/toolIntegration.ts - Inter-Tool Collaboration Service

export interface GeneratedWallet {
  publicKey: string;
  privateKey?: string; // Only for display, never stored
  nickname?: string;
  index: number;
  createdAt: Date;
}

export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply?: number;
  createdAt?: Date;
}

export interface SavedRecipient {
  address: string;
  nickname: string;
  lastUsed: Date;
  totalSent: number;
  transactionCount: number;
}

class ToolIntegrationService {
  
  /**
   * Import wallets from Wallet Generator tool
   * This would read from localStorage or shared state where generated wallets are stored
   */
  getGeneratedWallets(): GeneratedWallet[] {
    try {
      // In a real app, this would read from your Wallet Generator tool's storage
      // For now, we'll return mock data that simulates the integration
      const mockWallets: GeneratedWallet[] = [
        {
          publicKey: '11111111111111111111111111111112',
          nickname: 'Generated Wallet #1',
          index: 0,
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          publicKey: '22222222222222222222222222222223', 
          nickname: 'Generated Wallet #2',
          index: 1,
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          publicKey: '33333333333333333333333333333334',
          nickname: 'Generated Wallet #3', 
          index: 2,
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          publicKey: '44444444444444444444444444444445',
          nickname: 'Generated Wallet #4',
          index: 3,
          createdAt: new Date(Date.now() - 3600000)
        }
      ];
      
      return mockWallets;
      
      // Real implementation would be:
      // const stored = localStorage.getItem('web3tools_generated_wallets');
      // return stored ? JSON.parse(stored) : [];
      
    } catch (error) {
      console.error('Failed to load generated wallets:', error);
      return [];
    }
  }
  
  /**
   * Get created tokens from Token Creator tool
   */
  getCreatedTokens(): TokenInfo[] {
    try {
      // Mock data for tool integration
      const mockTokens: TokenInfo[] = [
        {
          mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
          name: 'My Custom Token',
          symbol: 'MCT',
          decimals: 9,
          supply: 1000000,
          createdAt: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          mint: '5KJwLmYvE1hpGFRP7v8MUBwNen6K2XcLpYs2xfxGzw9k',
          name: 'Test Token',
          symbol: 'TEST', 
          decimals: 6,
          supply: 500000,
          createdAt: new Date(Date.now() - 172800000) // 2 days ago
        }
      ];
      
      return mockTokens;
      
      // Real implementation:
      // const stored = localStorage.getItem('web3tools_created_tokens');
      // return stored ? JSON.parse(stored) : [];
      
    } catch (error) {
      console.error('Failed to load created tokens:', error);
      return [];
    }
  }
  
  /**
   * Save recipient to address book for future use
   */
  saveRecipient(address: string, nickname: string, amount: number): void {
    try {
      const savedRecipients = this.getSavedRecipients();
      const existingIndex = savedRecipients.findIndex(r => r.address === address);
      
      if (existingIndex !== -1) {
        // Update existing recipient
        savedRecipients[existingIndex] = {
          ...savedRecipients[existingIndex],
          nickname,
          lastUsed: new Date(),
          totalSent: savedRecipients[existingIndex].totalSent + amount,
          transactionCount: savedRecipients[existingIndex].transactionCount + 1
        };
      } else {
        // Add new recipient
        savedRecipients.push({
          address,
          nickname,
          lastUsed: new Date(),
          totalSent: amount,
          transactionCount: 1
        });
      }
      
      // In real app, save to localStorage
      // localStorage.setItem('web3tools_saved_recipients', JSON.stringify(savedRecipients));
      
    } catch (error) {
      console.error('Failed to save recipient:', error);
    }
  }
  
  /**
   * Get saved recipients from address book
   */
  getSavedRecipients(): SavedRecipient[] {
    try {
      // Mock data for demonstration
      const mockRecipients: SavedRecipient[] = [
        {
          address: '11111111111111111111111111111112',
          nickname: 'Alice (Team)',
          lastUsed: new Date(Date.now() - 86400000),
          totalSent: 5.5,
          transactionCount: 3
        },
        {
          address: '22222222222222222222222222222223',
          nickname: 'Bob (Contractor)', 
          lastUsed: new Date(Date.now() - 172800000),
          totalSent: 2.1,
          transactionCount: 2
        },
        {
          address: '33333333333333333333333333333334',
          nickname: 'Marketing Fund',
          lastUsed: new Date(Date.now() - 604800000),
          totalSent: 12.8,
          transactionCount: 5
        }
      ];
      
      return mockRecipients;
      
      // Real implementation:
      // const stored = localStorage.getItem('web3tools_saved_recipients');
      // return stored ? JSON.parse(stored) : [];
      
    } catch (error) {
      console.error('Failed to load saved recipients:', error);
      return [];
    }
  }
  
  /**
   * Export transaction results as CSV
   */
  exportTransactionResults(results: Array<{
    signature: string;
    recipientAddress: string;
    amount: number;
    status: 'success' | 'failed';
    timestamp: Date;
    error?: string;
  }>): void {
    try {
      const headers = ['Timestamp', 'Recipient Address', 'Amount (SOL)', 'Status', 'Transaction Signature', 'Error'];
      
      const csvContent = [
        headers.join(','),
        ...results.map(result => [
          result.timestamp.toISOString(),
          result.recipientAddress,
          result.amount.toString(),
          result.status,
          result.signature || 'N/A',
          result.error || 'N/A'
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `multisender_results_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export results:', error);
    }
  }
  
  /**
   * Generate distribution templates
   */
  generateDistributionTemplates(totalAmount: number, recipientCount: number) {
    return {
      equal: {
        name: 'Equal Distribution',
        description: 'Same amount to each recipient',
        amounts: Array(recipientCount).fill(totalAmount / recipientCount)
      },
      
      decreasing: {
        name: 'Decreasing Distribution',
        description: 'Higher amounts to earlier recipients',
        amounts: Array.from({ length: recipientCount }, (_, i) => {
          const factor = (recipientCount - i) / recipientCount;
          return (totalAmount * factor * 2) / recipientCount;
        })
      },
      
      random: {
        name: 'Random Distribution',
        description: 'Random amounts within limits',
        amounts: Array.from({ length: recipientCount }, () => {
          const min = totalAmount * 0.1 / recipientCount;
          const max = totalAmount * 0.3 / recipientCount;
          return min + Math.random() * (max - min);
        })
      },
      
      custom: {
        name: 'Custom Ratios',
        description: 'Define custom percentage for each recipient',
        amounts: [] // User-defined
      }
    };
  }
  
  /**
   * Validate wallet integration data
   */
  validateImportedWallets(wallets: GeneratedWallet[]): {
    valid: GeneratedWallet[];
    invalid: { wallet: GeneratedWallet; reason: string }[];
  } {
    const valid: GeneratedWallet[] = [];
    const invalid: { wallet: GeneratedWallet; reason: string }[] = [];
    
    wallets.forEach(wallet => {
      try {
        new PublicKey(wallet.publicKey);
        valid.push(wallet);
      } catch {
        invalid.push({
          wallet,
          reason: 'Invalid public key format'
        });
      }
    });
    
    return { valid, invalid };
  }
  
  /**
   * Check tool availability and versions
   */
  checkToolCompatibility(): {
    walletGenerator: boolean;
    tokenCreator: boolean;
    addressBook: boolean;
    version: string;
  } {
    return {
      walletGenerator: true, // Would check if Wallet Generator is available
      tokenCreator: true,    // Would check if Token Creator is available  
      addressBook: true,     // Would check if Address Book feature is enabled
      version: '1.0.0'       // Current tool integration version
    };
  }
}

// Export singleton instance
export const toolIntegration = new ToolIntegrationService();

// Export types
export type { GeneratedWallet, TokenInfo, SavedRecipient };
  publicKey: string;
  privateKey?: string; // Only for display, never stored
  nickname?: string;
  index: number;
  createdAt: Date;
}

export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply?: number;
  createdAt?: Date;
}

export interface SavedRecipient {
  address: string;
  nickname: string;
  lastUsed: Date;
  totalSent: number;
  transactionCount: number;
}

class ToolIntegrationService {
  
  /**
   * Import wallets from Wallet Generator tool
   * This would read from localStorage or shared state where generated wallets are stored
   */
  getGeneratedWallets(): GeneratedWallet[] {
    try {
      // In a real app, this would read from your Wallet Generator tool's storage
      // For now, we'll return mock data that simulates the integration
      const mockWallets: GeneratedWallet[] = [
        {
          publicKey: '11111111111111111111111111111112',
          nickname: 'Generated Wallet #1',
          index: 0,
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          publicKey: '22222222222222222222222222222223', 
          nickname: 'Generated Wallet #2',
          index: 1,
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          publicKey: '33333333333333333333333333333334',
          nickname: 'Generated Wallet #3', 
          index: 2,
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          publicKey: '44444444444444444444444444444445',
          nickname: 'Generated Wallet #4',
          index: 3,
          createdAt: new Date(Date.now() - 3600000)
        }
      ];
      
      return mockWallets;
      
      // Real implementation would be:
      // const stored = localStorage.getItem('web3tools_generated_wallets');
      // return stored ? JSON.parse(stored) : [];
      
    } catch (error) {
      console.error('Failed to load generated wallets:', error);
      return [];
    }
  }
  
  /**
   * Get created tokens from Token Creator tool
   */
  getCreatedTokens(): TokenInfo[] {
    try {
      // Mock data for tool integration
      const mockTokens: TokenInfo[] = [
        {
          mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
          name: 'My Custom Token',
          symbol: 'MCT',
          decimals: 9,
          supply: 1000000,
          createdAt: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          mint: '5KJwLmYvE1hpGFRP7v8MUBwNen6K2XcLpYs2xfxGzw9k',
          name: 'Test Token',
          symbol: 'TEST', 
          decimals: 6,
          supply: 500000,
          createdAt: new Date(Date.now() - 172800000) // 2 days ago
        }
      ];
      
      return mockTokens;
      
      // Real implementation:
      // const stored = localStorage.getItem('web3tools_created_tokens');
      // return stored ? JSON.parse(stored) : [];
      
    } catch (error) {
      console.error('Failed to load created tokens:', error);
      return [];
    }
  }
  
  /**
   * Save recipient to address book for future use
   */
  saveRecipient(address: string, nickname: string, amount: number): void {
    try {
      const savedRecipients = this.getSavedRecipients();
      const existingIndex = savedRecipients.findIndex(r => r.address === address);
      
      if (existingIndex !== -1) {
        // Update existing recipient
        savedRecipients[existingIndex] = {
          ...savedRecipients[existingIndex],
          nickname,
          lastUsed: new Date(),
          totalSent: savedRecipients[existingIndex].totalSent + amount,
          transactionCount: savedRecipients[existingIndex].transactionCount + 1
        };
      } else {
        // Add new recipient
        savedRecipients.push({
          address,
          nickname,
          lastUsed: new Date(),
          totalSent: amount,
          transactionCount: 1
        });
      }
      
      // In real app, save to localStorage
      // localStorage.setItem('web3tools_saved_recipients', JSON.stringify(savedRecipients));
      
    } catch (error) {
      console.error('Failed to save recipient:', error);
    }
  }
  
  /**
   * Get saved recipients from address book
   */
  getSavedRecipients(): SavedRecipient[] {
    try {
      // Mock data for demonstration
      const mockRecipients: SavedRecipient[] = [
        {
          address: '11111111111111111111111111111112',
          nickname: 'Alice (Team)',
          lastUsed: new Date(Date.now() - 86400000),
          totalSent: 5.5,
          transactionCount: 3
        },
        {
          address: '22222222222222222222222222222223',
          nickname: 'Bob (Contractor)', 
          lastUsed: new Date(Date.now() - 172800000),
          totalSent: 2.1,
          transactionCount: 2
        },
        {
          address: '33333333333333333333333333333334',
          nickname: 'Marketing Fund',
          lastUsed: new Date(Date.now() - 604800000),
          totalSent: 12.8,
          transactionCount: 5
        }
      ];
      
      return mockRecipients;
      
      // Real implementation:
      // const stored = localStorage.getItem('web3tools_saved_recipients');
      // return stored ? JSON.parse(stored) : [];
      
    } catch (error) {
      console.error('Failed to load saved recipients:', error);
      return [];
    }
  }
  
  /**
   * Export transaction results as CSV
   */
  exportTransactionResults(results: Array<{
    signature: string;
    recipientAddress: string;
    amount: number;
    status: 'success' | 'failed';
    timestamp: Date;
    error?: string;
  }>): void {
    try {
      const headers = ['Timestamp', 'Recipient Address', 'Amount (SOL)', 'Status', 'Transaction Signature', 'Error'];
      
      const csvContent = [
        headers.join(','),
        ...results.map(result => [
          result.timestamp.toISOString(),
          result.recipientAddress,
          result.amount.toString(),
          result.status,
          result.signature || 'N/A',
          result.error || 'N/A'
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `multisender_results_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to export results:', error);
    }
  }
  
  /**
   * Generate distribution templates
   */
  generateDistributionTemplates(totalAmount: number, recipientCount: number) {
    return {
      equal: {
        name: 'Equal Distribution',
        description: 'Same amount to each recipient',
        amounts: Array(recipientCount).fill(totalAmount / recipientCount)
      },
      
      decreasing: {
        name: 'Decreasing Distribution',
        description: 'Higher amounts to earlier recipients',
        amounts: Array.from({ length: recipientCount }, (_, i) => {
          const factor = (recipientCount - i) / recipientCount;
          return (totalAmount * factor * 2) / recipientCount;
        })
      },
      
      random: {
        name: 'Random Distribution',
        description: 'Random amounts within limits',
        amounts: Array.from({ length: recipientCount }, () => {
          const min = totalAmount * 0.1 / recipientCount;
          const max = totalAmount * 0.3 / recipientCount;
          return min + Math.random() * (max - min);
        })
      },
      
      custom: {
        name: 'Custom Ratios',
        description: 'Define custom percentage for each recipient',
        amounts: [] // User-defined
      }
    };
  }
  
  /**
   * Validate wallet integration data
   */
  validateImportedWallets(wallets: GeneratedWallet[]): {
    valid: GeneratedWallet[];
    invalid: { wallet: GeneratedWallet; reason: string }[];
  } {
    const valid: GeneratedWallet[] = [];
    const invalid: { wallet: GeneratedWallet; reason: string }[] = [];
    
    wallets.forEach(wallet => {
      try {
        new PublicKey(wallet.publicKey);
        valid.push(wallet);
      } catch {
        invalid.push({
          wallet,
          reason: 'Invalid public key format'
        });
      }
    });
    
    return { valid, invalid };
  }
  
  /**
   * Check tool availability and versions
   */
  checkToolCompatibility(): {
    walletGenerator: boolean;
    tokenCreator: boolean;
    addressBook: boolean;
    version: string;
  } {
    return {
      walletGenerator: true, // Would check if Wallet Generator is available
      tokenCreator: true,    // Would check if Token Creator is available  
      addressBook: true,     // Would check if Address Book feature is enabled
      version: '1.0.0'       // Current tool integration version
    };
  }
}

// Export singleton instance
export const toolIntegration = new ToolIntegrationService();

// Export types
export type { GeneratedWallet, TokenInfo, SavedRecipient };