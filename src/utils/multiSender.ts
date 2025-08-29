import { PublicKey } from '@solana/web3.js';
import Papa from 'papaparse';

// Types for Multi-Sender utilities
export interface Recipient {
  id: string;
  address: string;
  amount: number;
  isValid: boolean;
}

export interface CSVRow {
  address: string;
  amount: string | number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Multi-Sender utility functions
export class MultiSenderUtils {
  // Validate Solana address
  static validateAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  // Generate unique ID for recipient
  static generateId(): string {
    return `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create new recipient
  static createRecipient(address: string = '', amount: number = 0): Recipient {
    return {
      id: this.generateId(),
      address,
      amount,
      isValid: this.validateAddress(address)
    };
  }

  // Validate recipient data
  static validateRecipient(recipient: Recipient): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate address
    if (!recipient.address) {
      errors.push('Address is required');
    } else if (!this.validateAddress(recipient.address)) {
      errors.push('Invalid Solana address format');
    }

    // Validate amount
    if (recipient.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (recipient.amount > 1000000) {
      warnings.push('Large amount detected - please verify');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate entire recipient list
  static validateRecipients(recipients: Recipient[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (recipients.length === 0) {
      errors.push('At least one recipient is required');
      return { isValid: false, errors, warnings };
    }

    // Check for duplicates
    const addressSet = new Set<string>();
    const duplicates: string[] = [];

    recipients.forEach((recipient, index) => {
      const validation = this.validateRecipient(recipient);
      
      // Add individual errors with index
      validation.errors.forEach(error => {
        errors.push(`Recipient ${index + 1}: ${error}`);
      });

      validation.warnings.forEach(warning => {
        warnings.push(`Recipient ${index + 1}: ${warning}`);
      });

      // Check for duplicates
      if (recipient.address && addressSet.has(recipient.address)) {
        duplicates.push(recipient.address);
      } else if (recipient.address) {
        addressSet.add(recipient.address);
      }
    });

    // Add duplicate warnings
    if (duplicates.length > 0) {
      warnings.push(`Duplicate addresses found: ${duplicates.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Parse CSV data
static parseCSV(csvContent: string): Promise<Recipient[]> {
  return new Promise((resolve, reject) => {
    try {
      // Simple CSV parsing without Papa Parse for better type safety
      const lines = csvContent.trim().split('\n');
      
      if (lines.length < 2) {
        reject(new Error('CSV must contain at least a header and one data row'));
        return;
      }

      // Parse header
      const header = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Find address and amount column indices
      const addressIndex = header.findIndex(h => 
        h.includes('address') || h.includes('wallet') || h.includes('pubkey')
      );
      const amountIndex = header.findIndex(h => 
        h.includes('amount') || h.includes('value') || h.includes('sol') || h.includes('token')
      );

      if (addressIndex === -1 || amountIndex === -1) {
        reject(new Error('CSV must contain both address and amount columns'));
        return;
      }

      // Parse data rows
      const recipients: Recipient[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(cell => cell.trim());
        
        if (row.length > addressIndex && row.length > amountIndex) {
          const address = row[addressIndex];
          const amountStr = row[amountIndex];
          const amount = parseFloat(amountStr) || 0;
          
          if (address) {
            recipients.push(this.createRecipient(address, amount));
          }
        }
      }

      if (recipients.length === 0) {
        reject(new Error('No valid recipients found in CSV'));
        return;
      }

      resolve(recipients);
      
    } catch (error) {
      reject(new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

  // Generate CSV template
  static generateCSVTemplate(): string {
    const template = [
      { address: 'RecipientAddress1', amount: '0.1' },
      { address: 'RecipientAddress2', amount: '0.2' },
      { address: 'RecipientAddress3', amount: '0.3' }
    ];

    return Papa.unparse(template, {
      header: true,
      columns: ['address', 'amount']
    });
  }

  // Export recipients to CSV
  static exportToCSV(recipients: Recipient[]): string {
    const csvData = recipients.map(recipient => ({
      address: recipient.address,
      amount: recipient.amount
    }));

    return Papa.unparse(csvData, {
      header: true,
      columns: ['address', 'amount']
    });
  }

  // Calculate total amount
  static calculateTotal(recipients: Recipient[]): number {
    return recipients.reduce((sum, recipient) => sum + (recipient.amount || 0), 0);
  }

  // Calculate statistics
  static calculateStats(recipients: Recipient[]) {
    const validRecipients = recipients.filter(r => r.isValid && r.amount > 0);
    const amounts = validRecipients.map(r => r.amount);
    
    if (amounts.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        count: 0,
        validCount: 0
      };
    }

    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    const average = total / amounts.length;
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);

    return {
      total,
      average,
      min,
      max,
      count: recipients.length,
      validCount: validRecipients.length
    };
  }

  // Equal distribution helper
  static distributeEqually(recipients: Recipient[], totalAmount: number): Recipient[] {
    if (recipients.length === 0 || totalAmount <= 0) {
      return recipients;
    }

    const amountPerRecipient = totalAmount / recipients.length;
    
    return recipients.map(recipient => ({
      ...recipient,
      amount: amountPerRecipient
    }));
  }

  // Batch recipients for processing
  static batchRecipients(recipients: Recipient[], batchSize: number = 10): Recipient[][] {
    const batches: Recipient[][] = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }
    
    return batches;
  }

  // Download file helper
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Format Solana address for display
  static formatAddress(address: string, length: number = 8): string {
    if (!address || address.length < length * 2) {
      return address;
    }
    
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  }

  // Format amount for display
  static formatAmount(amount: number, decimals: number = 6): string {
    return amount.toFixed(decimals);
  }

  // Generate random test data
  static generateTestData(count: number = 5): Recipient[] {
    const recipients: Recipient[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate mock addresses (using PublicKey.unique() for valid addresses)
      const mockAddress = PublicKey.unique().toString();
      const randomAmount = Math.random() * 10; // 0-10 SOL
      
      recipients.push(this.createRecipient(mockAddress, randomAmount));
    }
    
    return recipients;
  }
}