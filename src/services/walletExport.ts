// src/services/walletExport.ts
import { GeneratedWallet, WalletBatch, HDWalletBatch } from '@/utils/walletGeneration';
import { ToolIntegrationService } from '@/services/toolIntegration';
import analytics from '@/services/analytics';

export interface ExportConfig {
  includePrivateKeys: boolean;
  suggestedAmount: number;
  format: 'csv' | 'json' | 'txt';
  filename?: string;
}

export interface MultiSenderExport {
  address: string;
  amount: number;
  source: 'wallet-generator';
  isValid: boolean;
}

export class WalletExportService {
  // Export for Multi-Sender tool integration
  static exportForMultiSender(wallets: GeneratedWallet[], suggestedAmount: number = 0.1): MultiSenderExport[] {
    return wallets.map(wallet => ({
      address: wallet.address,
      amount: suggestedAmount,
      source: 'wallet-generator' as const,
      isValid: true
    }));
  }

  // Export to CSV format
  static exportToCSV(wallets: GeneratedWallet[], config: ExportConfig): string {
    const headers = config.includePrivateKeys 
      ? ['Index', 'Address', 'Private Key', 'Suggested Amount']
      : ['Index', 'Address', 'Suggested Amount'];

    const rows = wallets.map(wallet => {
      const baseRow = [
        (wallet.index || 0) + 1,
        wallet.address,
        config.suggestedAmount
      ];

      if (config.includePrivateKeys) {
        baseRow.splice(2, 0, wallet.privateKey);
      }

      return baseRow;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // Export to JSON format
  static exportToJSON(batch: WalletBatch, config: ExportConfig): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      type: 'mnemonic' in batch ? 'hd' : 'standard',
      network: 'solana',
      totalWallets: batch.wallets.length,
      suggestedAmount: config.suggestedAmount,
      ...(('mnemonic' in batch) && {
        mnemonic: batch.mnemonic,
        seedPhrase: batch.seedPhrase,
        derivationPath: 'm/44\'/501\'/*/0\''
      }),
      wallets: batch.wallets.map(wallet => ({
        index: wallet.index || 0,
        address: wallet.address,
        publicKey: wallet.publicKey,
        ...(config.includePrivateKeys && { 
          privateKey: wallet.privateKey,
          derivationPath: wallet.derivationPath 
        })
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Export to readable text format
  static exportToText(batch: WalletBatch, config: ExportConfig): string {
    const isHD = 'mnemonic' in batch;
    const lines: string[] = [];

    // Header
    lines.push('='.repeat(60));
    lines.push(`SOLANA WALLET BATCH EXPORT`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Type: ${isHD ? 'HD Wallets' : 'Standard Keypairs'}`);
    lines.push(`Total Wallets: ${batch.wallets.length}`);
    lines.push(`Suggested Amount: ${config.suggestedAmount} SOL`);
    lines.push('='.repeat(60));
    lines.push('');

    // Mnemonic section for HD wallets
    if (isHD) {
      const hdBatch = batch as HDWalletBatch;
      lines.push('RECOVERY SEED PHRASE (KEEP SECURE):');
      lines.push('-'.repeat(40));
      lines.push(hdBatch.mnemonic);
      lines.push('');
      lines.push('NUMBERED SEED WORDS:');
      hdBatch.seedPhrase.forEach((word, index) => {
        lines.push(`${(index + 1).toString().padStart(2)}: ${word}`);
      });
      lines.push('');
      lines.push('⚠️  IMPORTANT: This seed phrase can recover ALL wallets below!');
      lines.push('   Store it securely and never share it with anyone.');
      lines.push('');
      lines.push('='.repeat(60));
      lines.push('');
    }

    // Wallet details
    lines.push('WALLET DETAILS:');
    lines.push('-'.repeat(40));

    batch.wallets.forEach((wallet, index) => {
      lines.push(`Wallet #${index + 1}:`);
      lines.push(`  Address: ${wallet.address}`);
      
      if (config.includePrivateKeys) {
        lines.push(`  Private Key: ${wallet.privateKey}`);
        if (wallet.derivationPath) {
          lines.push(`  Derivation: ${wallet.derivationPath}`);
        }
      }
      
      lines.push(`  Suggested Amount: ${config.suggestedAmount} SOL`);
      lines.push('');
    });

    // Security notice
    if (config.includePrivateKeys) {
      lines.push('='.repeat(60));
      lines.push('SECURITY WARNING:');
      lines.push('• Private keys give FULL control over wallets');
      lines.push('• Never share private keys or seed phrases');
      lines.push('• Store this file securely and delete when done');
      lines.push('• Consider using hardware wallets for production');
      lines.push('='.repeat(60));
    }

    return lines.join('\n');
  }

  // Download file helper
  static downloadFile(content: string, filename: string, mimeType: string): void {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // Analytics tracking
      analytics.toolUsed({
        tool_name: 'wallet_creator',
        action: 'export_download',
        metadata: {
          format: filename.split('.').pop(),
          filename: filename
        }
      });

    } catch (error) {
      analytics.captureError(error as Error, {
        context: 'wallet_export_download',
        filename
      });
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  // Generate appropriate filename
  static generateFilename(type: 'csv' | 'json' | 'txt', walletType: 'hd' | 'standard', count: number): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const typePrefix = walletType === 'hd' ? 'hd-wallets' : 'wallets';
    return `${typePrefix}-${count}-${timestamp}.${type}`;
  }

  // Send to Multi-Sender tool
  static async sendToMultiSender(wallets: GeneratedWallet[], suggestedAmount: number): Promise<void> {
    try {
      const recipients = this.exportForMultiSender(wallets, suggestedAmount);
      
      // Use tool integration service
      await ToolIntegrationService.shareRecipientList(
        recipients.map(r => ({
          address: r.address,
          amount: r.amount,
          isValid: r.isValid,
          source: r.source
        })),
        'multi_sender'
      );

      analytics.toolUsed({
        tool_name: 'wallet_creator',
        action: 'send_to_multisender',
        success: true,
        metadata: {
          wallet_count: wallets.length,
          suggested_amount: suggestedAmount
        }
      });

    } catch (error) {
      analytics.captureError(error as Error, {
        context: 'wallet_creator_multisender_integration'
      });
      throw error;
    }
  }

  // Get export statistics
  static getExportStats(wallets: GeneratedWallet[]) {
    return {
      totalWallets: wallets.length,
      totalAddresses: wallets.filter(w => w.address).length,
      averageKeySize: wallets.length > 0 
        ? Math.round(wallets.reduce((sum, w) => sum + w.privateKey.length, 0) / wallets.length)
        : 0,
      estimatedFileSize: {
        csv: this.estimateFileSize('csv', wallets.length),
        json: this.estimateFileSize('json', wallets.length),
        txt: this.estimateFileSize('txt', wallets.length)
      }
    };
  }

  // Estimate file size for different formats
  private static estimateFileSize(format: 'csv' | 'json' | 'txt', walletCount: number): string {
    const avgWalletSize = {
      csv: 150,  // bytes per wallet in CSV
      json: 250, // bytes per wallet in JSON
      txt: 300   // bytes per wallet in text
    };

    const sizeInBytes = walletCount * avgWalletSize[format];
    
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}