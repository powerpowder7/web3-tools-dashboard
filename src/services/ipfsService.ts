// src/services/ipfsService.ts - Real IPFS Integration with Pinata
import { TokenCreationParams } from './tokenService';

// IPFS Service Configuration
interface IPFSConfig {
  provider: 'pinata' | 'nft.storage' | 'web3.storage';
  apiKey: string;
  apiSecret?: string;
  endpoint?: string;
}

// Token Metadata Standard (Metaplex)
interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    category: 'fungible';
    creators: Array<{
      address: string;
      share: number;
      verified: boolean;
    }>;
    files?: Array<{
      uri: string;
      type: string;
    }>;
    links?: {
      website?: string;
      twitter?: string;
      telegram?: string;
      discord?: string;
    };
  };
  collection?: {
    name: string;
    family: string;
  };
}

export class IPFSService {
  private config: IPFSConfig;

  constructor(config: IPFSConfig) {
    this.config = config;
  }

  /**
   * Upload token image to IPFS
   */
  async uploadImage(imageFile: File): Promise<string> {
    try {
      console.log('Uploading image to IPFS:', imageFile.name);

      // Validate image file
      this.validateImageFile(imageFile);

      switch (this.config.provider) {
        case 'pinata':
          return await this.uploadToPinata(imageFile);
        case 'nft.storage':
          return await this.uploadToNFTStorage(imageFile);
        case 'web3.storage':
          return await this.uploadToWeb3Storage(imageFile);
        default:
          throw new Error(`Unsupported IPFS provider: ${this.config.provider}`);
      }

    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error(`Failed to upload image: ${error}`);
    }
  }

  /**
   * Upload token metadata to IPFS
   */
  async uploadMetadata(params: TokenCreationParams, imageUri?: string): Promise<string> {
    try {
      console.log('Uploading metadata to IPFS for token:', params.symbol);

      // Create metadata object
      const metadata: TokenMetadata = {
        name: params.name,
        symbol: params.symbol,
        description: params.description || `${params.name} (${params.symbol}) token created with Web3Tools`,
        image: imageUri || '',
        attributes: [
          {
            trait_type: 'Protocol',
            value: params.protocol === 'token2022' ? 'Token-2022' : 'SPL Token'
          },
          {
            trait_type: 'Decimals',
            value: params.decimals
          },
          {
            trait_type: 'Initial Supply',
            value: params.initialSupply || 0
          }
        ],
        properties: {
          category: 'fungible',
          creators: []
        }
      };

      // Add external links if provided
      if (params.website || params.twitter || params.telegram) {
        metadata.properties.links = {
          ...(params.website && { website: params.website }),
          ...(params.twitter && { twitter: params.twitter }),
          ...(params.telegram && { telegram: params.telegram })
        };
      }

      // Add Token-2022 specific attributes
      if (params.protocol === 'token2022' && params.useExtensions) {
        if (params.transferFees && params.transferFees > 0) {
          metadata.attributes.push({
            trait_type: 'Transfer Fee',
            value: `${params.transferFees / 100}%`
          });
        }

        if (params.nonTransferable) {
          metadata.attributes.push({
            trait_type: 'Type',
            value: 'Soulbound'
          });
        }
      }

      // Convert metadata to JSON
      const metadataJson = JSON.stringify(metadata, null, 2);
      const metadataBlob = new Blob([metadataJson], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], `${params.symbol}-metadata.json`, {
        type: 'application/json'
      });

      // Upload to IPFS
      const metadataUri = await this.uploadFile(metadataFile);

      console.log('Metadata uploaded successfully:', metadataUri);
      return metadataUri;

    } catch (error) {
      console.error('Metadata upload failed:', error);
      throw new Error(`Failed to upload metadata: ${error}`);
    }
  }

  /**
   * Upload file to IPFS using configured provider
   */
  private async uploadFile(file: File): Promise<string> {
    switch (this.config.provider) {
      case 'pinata':
        return await this.uploadToPinata(file);
      case 'nft.storage':
        return await this.uploadToNFTStorage(file);
      case 'web3.storage':
        return await this.uploadToWeb3Storage(file);
      default:
        throw new Error(`Unsupported IPFS provider: ${this.config.provider}`);
    }
  }

  /**
   * Upload to Pinata IPFS
   */
  private async uploadToPinata(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const pinataMetadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          uploader: 'web3tools',
          timestamp: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 1,
      });
      formData.append('pinataOptions', pinataOptions);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.config.apiKey,
          'pinata_secret_api_key': this.config.apiSecret!,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata upload failed: ${error}`);
      }

      const result = await response.json();
      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

    } catch (error) {
      console.error('Pinata upload error:', error);
      throw error;
    }
  }

  /**
   * Upload to NFT.Storage
   */
  private async uploadToNFTStorage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://api.nft.storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`NFT.Storage upload failed: ${error}`);
      }

      const result = await response.json();
      return `https://nftstorage.link/ipfs/${result.value.cid}`;

    } catch (error) {
      console.error('NFT.Storage upload error:', error);
      throw error;
    }
  }

  /**
   * Upload to Web3.Storage
   */
  private async uploadToWeb3Storage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://api.web3.storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Web3.Storage upload failed: ${error}`);
      }

      const result = await response.json();
      return `https://w3s.link/ipfs/${result.cid}`;

    } catch (error) {
      console.error('Web3.Storage upload error:', error);
      throw error;
    }
  }

  /**
   * Validate image file before upload
   */
  private validateImageFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

    if (file.size > maxSize) {
      throw new Error('Image file must be smaller than 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Image must be JPEG, PNG, GIF, WebP, or SVG format');
    }
  }
}

// Factory function to create IPFS service with environment config
export function createIPFSService(): IPFSService {
  // Configuration from environment variables
  const provider = (import.meta.env.VITE_IPFS_PROVIDER || 'pinata') as 'pinata' | 'nft.storage' | 'web3.storage';
  
  const config: IPFSConfig = {
    provider,
    apiKey: import.meta.env.VITE_IPFS_API_KEY || '',
    apiSecret: import.meta.env.VITE_IPFS_API_SECRET || '',
  };

  // Validate configuration
  if (!config.apiKey) {
    throw new Error('IPFS API key not configured. Please set VITE_IPFS_API_KEY environment variable.');
  }

  if (provider === 'pinata' && !config.apiSecret) {
    throw new Error('Pinata API secret not configured. Please set VITE_IPFS_API_SECRET environment variable.');
  }

  console.log('IPFS Service configured with provider:', provider);
  return new IPFSService(config);
}

export default IPFSService;