// src/utils/multiSender.ts - Multi-Sender Utility Functions
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface Recipient {
  id: string;
  address: string;
  amount: number;
  isValid: boolean;
  nickname?: string;
}

export interface BatchTransactionResult {
  signature: string;
  recipients: string[];
  status: 'success' | 'failed';
  error?: string;
}

// Validate Solana address
export const validateSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return address.length >= 32;
  } catch {
    return false;
  }
};

// Check for duplicate addresses
export const findDuplicates = (recipients: Recipient[]): string[] => {
  const addresses = recipients.map(r => r.address.toLowerCase());
  const duplicates: string[] = [];
  
  addresses.forEach((address, index) => {
    if (addresses.indexOf(address) !== index && !duplicates.includes(address)) {
      duplicates.push(address);
    }
  });
  
  return duplicates;
};

// Calculate total cost including fees
export const calculateTotalCost = (recipients: Recipient[], feePerTransaction: number = 0.000005): number => {
  const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
  const totalFees = recipients.length * feePerTransaction;
  return totalAmount + totalFees;
};

// Parse CSV file to recipients
export const parseCSV = async (file: File): Promise<Recipient[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file must contain at least header and one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const addressIndex = headers.findIndex(h => h.includes('address') || h.includes('wallet'));
        const amountIndex = headers.findIndex(h => h.includes('amount') || h.includes('sol'));
        const nicknameIndex = headers.findIndex(h => h.includes('nickname') || h.includes('name') || h.includes('label'));
        
        if (addressIndex === -1) {
          throw new Error('CSV must contain an "address" column');
        }
        if (amountIndex === -1) {
          throw new Error('CSV must contain an "amount" column');
        }

        const recipients: Recipient[] = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const address = values[addressIndex] || '';
          const amount = parseFloat(values[amountIndex]) || 0;
          const nickname = nicknameIndex !== -1 ? values[nicknameIndex] : undefined;
          
          return {
            id: `csv-${index}`,
            address,
            amount,
            isValid: validateSolanaAddress(address) && amount > 0,
            nickname
          };
        }).filter(r => r.address && r.amount > 0);

        resolve(recipients);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Generate CSV template
export const generateCSVTemplate = (): string => {
  return `address,amount,nickname
11111111111111111111111111111112,0.1,Alice Wallet
22222222222222222222222222222223,0.2,Bob Wallet
33333333333333333333333333333334,0.15,Charlie Wallet
44444444444444444444444444444445,0.05,David Wallet`;
};

// Create SOL transfer transaction
export const createSOLTransferTransaction = async (
  connection: Connection,
  fromPubkey: PublicKey,
  recipients: Recipient[]
): Promise<Transaction> => {
  const transaction = new Transaction();
  
  // Add transfer instructions for each recipient
  recipients.forEach(recipient => {
    const instruction = SystemProgram.transfer({
      fromPubkey,
      toPubkey: new PublicKey(recipient.address),
      lamports: recipient.amount * LAMPORTS_PER_SOL,
    });
    transaction.add(instruction);
  });
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;
  
  return transaction;
};

// Estimate transaction fees
export const estimateTransactionFees = async (
  connection: Connection,
  transaction: Transaction
): Promise<number> => {
  try {
    const fee = await connection.getFeeForMessage(transaction.compileMessage());
    return fee.value ? fee.value / LAMPORTS_PER_SOL : 0.000005 * transaction.instructions.length;
  } catch {
    // Fallback fee estimation
    return 0.000005 * transaction.instructions.length;
  }
};

// Split large batches into smaller chunks
export const chunkRecipients = (recipients: Recipient[], chunkSize: number = 10): Recipient[][] => {
  const chunks: Recipient[][] = [];
  for (let i = 0; i < recipients.length; i += chunkSize) {
    chunks.push(recipients.slice(i, i + chunkSize));
  }
  return chunks;
};

// Format transaction signature for display
export const formatSignature = (signature: string): string => {
  if (signature.length < 16) return signature;
  return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
};

// Generate Solana Explorer URL
export const getExplorerUrl = (signature: string, network: 'mainnet-beta' | 'devnet'): string => {
  const clusterParam = network === 'devnet' ? '?cluster=devnet' : '';
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
};

// Validate recipient data before transaction
export const validateRecipients = (recipients: Recipient[]): { 
  valid: boolean; 
  errors: string[]; 
  warnings: string[] 
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (recipients.length === 0) {
    errors.push('At least one recipient is required');
  }
  
  if (recipients.length > 100) {
    errors.push('Maximum 100 recipients per batch');
  }
  
  const duplicates = findDuplicates(recipients);
  if (duplicates.length > 0) {
    warnings.push(`Duplicate addresses detected: ${duplicates.length} duplicates`);
  }
  
  const invalidAddresses = recipients.filter(r => !r.isValid);
  if (invalidAddresses.length > 0) {
    errors.push(`${invalidAddresses.length} invalid addresses found`);
  }
  
  const zeroAmounts = recipients.filter(r => r.amount <= 0);
  if (zeroAmounts.length > 0) {
    errors.push(`${zeroAmounts.length} recipients have zero or negative amounts`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// Calculate optimal batch size based on network conditions
export const calculateOptimalBatchSize = (networkLatency: number): number => {
  if (networkLatency < 100) return 15; // Fast network
  if (networkLatency < 300) return 10; // Normal network  
  if (networkLatency < 500) return 8;  // Slow network
  return 5; // Very slow network
};

// Format amount for display
export const formatAmount = (amount: number, decimals: number = 4): string => {
  return amount.toFixed(decimals);
};

// Generate distribution presets
export const generateDistributionPresets = (totalAmount: number, recipientCount: number) => {
  return {
    equal: totalAmount / recipientCount,
    pyramid: {
      // Decreasing amounts: 40%, 30%, 20%, 10% for 4 recipients
      ratios: [0.4, 0.3, 0.2, 0.1].slice(0, recipientCount),
      amounts: [0.4, 0.3, 0.2, 0.1].slice(0, recipientCount).map(ratio => totalAmount * ratio)
    },
    random: Array.from({ length: recipientCount }, () => 
      Math.random() * (totalAmount / recipientCount) * 2
    ).map(amount => Math.min(amount, totalAmount))
  };
};