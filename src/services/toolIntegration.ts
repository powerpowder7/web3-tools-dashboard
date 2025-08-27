import { PublicKey } from '@solana/web3.js';
import { analytics } from '@/services/analytics';

// Types for tool integration
export interface GeneratedWallet {
  publicKey: string;
  secretKey: string;
  mnemonic?: string;
}

export interface VanityResult {
  publicKey: string;
  secretKey: string;
  iterations: number;
  pattern: string;
}

export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
}

export interface RecipientData {
  address: string;
  amount: number;
  isValid: boolean;
  source?: 'manual' | 'csv' | 'wallet-generator' | 'vanity';
}

// Tool Integration Service
export class ToolIntegrationService {
  // Import addresses from Wallet Creator tool
  static async importFromWalletCreator(count: number = 1): Promise<RecipientData[]> {
    try {
      analytics.track('tool_integration_started', {
        source: 'wallet_creator',
        target: 'multi_sender',
        count
      });

      // Mock wallet generation (replace with actual wallet creator logic)
      const recipients: RecipientData[] = [];
      
      for (let i = 0; i < count; i++) {
        // Generate a random wallet address (mock)
        const mockWallet = PublicKey.unique();
        
        recipients.push({
          address: mockWallet.toString(),
          amount: 0,
          isValid: true,
          source: 'wallet-generator'
        });
      }

      analytics.track('tool_integration_completed', {
        source: 'wallet_creator',
        target: 'multi_sender',
        imported_count: recipients.length
      });

      return recipients;
    } catch (error) {
      analytics.track('tool_integration_failed', {
        source: 'wallet_creator',
        target: 'multi_sender',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new Error(`Failed to import from Wallet Creator: ${error}`);
    }
  }

  // Import addresses from Vanity Generator tool
  static async importFromVanityGenerator(pattern: string, count: number = 1): Promise<RecipientData[]> {
    try {
      analytics.track('tool_integration_started', {
        source: 'vanity_generator',
        target: 'multi_sender',
        pattern,
        count
      });

      const recipients: RecipientData[] = [];

      for (let i = 0; i < count; i++) {
        // Mock vanity address generation
        let address: string;
        let iterations = 0;
        
        do {
          const mockWallet = PublicKey.unique();
          address = mockWallet.toString();
          iterations++;
          
          // Simple mock pattern matching
          if (address.toLowerCase().includes(pattern.toLowerCase()) || iterations > 1000) {
            break;
          }
        } while (true);

        recipients.push({
          address,
          amount: 0,
          isValid: true,
          source: 'vanity'
        });
      }

      analytics.track('tool_integration_completed', {
        source: 'vanity_generator',
        target: 'multi_sender',
        pattern,
        imported_count: recipients.length
      });

      return recipients;
    } catch (error) {
      analytics.track('tool_integration_failed', {
        source: 'vanity_generator',
        target: 'multi_sender',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new Error(`Failed to import from Vanity Generator: ${error}`);
    }
  }

  // Export transaction results to other tools
  static async exportToReporting(transactions: any[]): Promise<string> {
    try {
      analytics.track('export_started', {
        type: 'transaction_report',
        count: transactions.length
      });

      const reportData = {
        timestamp: new Date().toISOString(),
        totalTransactions: transactions.length,
        successfulTransactions: transactions.filter(t => t.success).length,
        failedTransactions: transactions.filter(t => !t.success).length,
        transactions: transactions.map(t => ({
          signature: t.signature,
          success: t.success,
          error: t.error,
          timestamp: new Date().toISOString()
        }))
      };

      const reportContent = JSON.stringify(reportData, null, 2);
      
      // Create downloadable blob
      const blob = new Blob([reportContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      analytics.track('export_completed', {
        type: 'transaction_report',
        format: 'json'
      });

      return url;
    } catch (error) {
      analytics.track('export_failed', {
        type: 'transaction_report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new Error(`Failed to export report: ${error}`);
    }
  }

  // Share recipient list with other tools
  static async shareRecipientList(recipients: RecipientData[], targetTool: string): Promise<void> {
    try {
      analytics.track('sharing_started', {
        source: 'multi_sender',
        target: targetTool,
        count: recipients.length
      });

      // Store in localStorage for cross-tool sharing
      const shareData = {
        timestamp: new Date().toISOString(),
        source: 'multi_sender',
        target: targetTool,
        recipients: recipients.map(r => ({
          address: r.address,
          amount: r.amount,
          isValid: r.isValid,
          source: r.source
        }))
      };

      localStorage.setItem(`web3tools_shared_${targetTool}`, JSON.stringify(shareData));

      analytics.track('sharing_completed', {
        source: 'multi_sender',
        target: targetTool,
        shared_count: recipients.length
      });

    } catch (error) {
      analytics.track('sharing_failed', {
        source: 'multi_sender',
        target: targetTool,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw new Error(`Failed to share with ${targetTool}: ${error}`);
    }
  }

  // Get shared data from other tools
  static getSharedData(sourceTool: string): RecipientData[] | null {
    try {
      const shareKey = `web3tools_shared_multi_sender`;
      const sharedDataString = localStorage.getItem(shareKey);
      
      if (!sharedDataString) {
        return null;
      }

      const sharedData = JSON.parse(sharedDataString);
      
      // Check if data is from the expected source and not too old (1 hour)
      const dataAge = Date.now() - new Date(sharedData.timestamp).getTime();
      const oneHour = 60 * 60 * 1000;
      
      if (sharedData.source !== sourceTool || dataAge > oneHour) {
        localStorage.removeItem(shareKey);
        return null;
      }

      analytics.track('shared_data_retrieved', {
        source: sourceTool,
        target: 'multi_sender',
        count: sharedData.recipients?.length || 0
      });

      return sharedData.recipients || [];
    } catch (error) {
      console.error('Error retrieving shared data:', error);
      return null;
    }
  }

  // Clear shared data
  static clearSharedData(targetTool?: string): void {
    try {
      if (targetTool) {
        localStorage.removeItem(`web3tools_shared_${targetTool}`);
      } else {
        // Clear all shared data
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith('web3tools_shared_')
        );
        keys.forEach(key => localStorage.removeItem(key));
      }

      analytics.track('shared_data_cleared', {
        target: targetTool || 'all'
      });
    } catch (error) {
      console.error('Error clearing shared data:', error);
    }
  }

  // Template management
  static saveTemplate(name: string, recipients: RecipientData[]): void {
    try {
      const templates = this.getTemplates();
      
      templates[name] = {
        timestamp: new Date().toISOString(),
        recipients: recipients.map(r => ({
          address: r.address,
          amount: r.amount,
          isValid: r.isValid,
          source: r.source
        }))
      };

      localStorage.setItem('web3tools_templates', JSON.stringify(templates));

      analytics.track('template_saved', {
        name,
        recipient_count: recipients.length
      });
    } catch (error) {
      console.error('Error saving template:', error);
      throw new Error(`Failed to save template: ${error}`);
    }
  }

  static getTemplates(): Record<string, any> {
    try {
      const templatesString = localStorage.getItem('web3tools_templates');
      return templatesString ? JSON.parse(templatesString) : {};
    } catch (error) {
      console.error('Error getting templates:', error);
      return {};
    }
  }

  static loadTemplate(name: string): RecipientData[] | null {
    try {
      const templates = this.getTemplates();
      const template = templates[name];
      
      if (!template) {
        return null;
      }

      analytics.track('template_loaded', {
        name,
        recipient_count: template.recipients?.length || 0
      });

      return template.recipients || [];
    } catch (error) {
      console.error('Error loading template:', error);
      return null;
    }
  }

  static deleteTemplate(name: string): void {
    try {
      const templates = this.getTemplates();
      delete templates[name];
      
      localStorage.setItem('web3tools_templates', JSON.stringify(templates));

      analytics.track('template_deleted', { name });
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error(`Failed to delete template: ${error}`);
    }
  }
}

// Hook for using tool integration
export function useToolIntegration() {
  return {
    importFromWalletCreator: ToolIntegrationService.importFromWalletCreator,
    importFromVanityGenerator: ToolIntegrationService.importFromVanityGenerator,
    exportToReporting: ToolIntegrationService.exportToReporting,
    shareRecipientList: ToolIntegrationService.shareRecipientList,
    getSharedData: ToolIntegrationService.getSharedData,
    clearSharedData: ToolIntegrationService.clearSharedData,
    saveTemplate: ToolIntegrationService.saveTemplate,
    getTemplates: ToolIntegrationService.getTemplates,
    loadTemplate: ToolIntegrationService.loadTemplate,
    deleteTemplate: ToolIntegrationService.deleteTemplate
  };
}