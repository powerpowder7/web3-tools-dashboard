// src/services/securityService.ts - Comprehensive Token Security Analysis
import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

/**
 * Token Configuration for Security Analysis
 */
export interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  supply?: number;
  mintAuthority: 'permanent' | 'revocable' | 'none';
  freezeAuthority: boolean;
  updateAuthority: boolean;
  description?: string;
  website?: string;
  telegram?: string;
  twitter?: string;
  image?: File | string;
  useExtensions?: boolean;
  transferFees?: number;
  nonTransferable?: boolean;
  hasLiquidity?: boolean;
  liquidityLocked?: boolean;
  protocol?: 'spl' | 'token2022';
}

/**
 * Security Score Components (0-100 scale)
 */
export interface QualityScore {
  overall: number; // 0-100
  components: {
    authorities: number; // Authority configuration score
    metadata: number; // Metadata completeness score
    tokenomics: number; // Supply and distribution score
    liquidity: number; // Liquidity availability score
    verification: number; // Social verification score
  };
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

/**
 * Risk Assessment Categories
 */
export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: Risk[];
  warnings: string[];
  criticalIssues: string[];
  safetyScore: number; // 0-100, higher is safer
}

/**
 * Individual Risk Item
 */
export interface Risk {
  category: 'authority' | 'liquidity' | 'metadata' | 'tokenomics' | 'social';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
}

/**
 * Complete Security Analysis
 */
export interface SecurityAnalysis {
  tokenMint: string;
  timestamp: number;
  qualityScore: QualityScore;
  riskAssessment: RiskAssessment;
  honeypotCheck: HoneypotAnalysis;
  rugPullIndicators: RugPullIndicators;
  isVerified: boolean;
  canTrade: boolean;
}

/**
 * Honeypot Detection Result
 */
export interface HoneypotAnalysis {
  isHoneypot: boolean;
  confidence: number; // 0-100
  indicators: string[];
  canBuy: boolean;
  canSell: boolean;
  buyTax?: number;
  sellTax?: number;
}

/**
 * Rug Pull Indicators
 */
export interface RugPullIndicators {
  riskScore: number; // 0-100, higher = more risk
  indicators: {
    name: string;
    present: boolean;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
  liquidityLocked: boolean;
  ownershipRenounced: boolean;
  largeHolders: boolean;
}

/**
 * Token Data for On-Chain Analysis
 */
export interface TokenData {
  mintAddress: string;
  decimals: number;
  supply: number;
  mintAuthority: PublicKey | null;
  freezeAuthority: PublicKey | null;
  holders?: number;
  topHolders?: Array<{
    address: string;
    balance: number;
    percentage: number;
  }>;
}

/**
 * Security Service for Token Analysis
 */
export class SecurityService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Comprehensive token security analysis
   */
  async analyzeTokenSecurity(tokenMint: string): Promise<SecurityAnalysis> {
    try {
      console.log('[Security] Analyzing token:', tokenMint);

      const mintPubkey = new PublicKey(tokenMint);
      const tokenData = await this.fetchTokenData(mintPubkey);

      // Run parallel analysis
      const [qualityScore, riskAssessment, honeypotCheck, rugPullIndicators] = await Promise.all([
        this.calculateQualityScoreFromChain(tokenData),
        this.scanForRisksFromChain(tokenData),
        this.checkHoneypot(tokenData),
        this.detectRugPullIndicators(tokenData)
      ]);

      const isVerified = qualityScore.overall >= 70 && riskAssessment.riskLevel !== 'critical';
      const canTrade = !honeypotCheck.isHoneypot && riskAssessment.riskLevel !== 'critical';

      return {
        tokenMint,
        timestamp: Date.now(),
        qualityScore,
        riskAssessment,
        honeypotCheck,
        rugPullIndicators,
        isVerified,
        canTrade
      };

    } catch (error: any) {
      console.error('[Security] Analysis failed:', error);
      throw new Error(`Security analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate quality score from token configuration (pre-creation)
   */
  async calculateQualityScore(config: TokenConfig): Promise<QualityScore> {
    const components = {
      authorities: this.scoreAuthorities(config),
      metadata: this.scoreMetadata(config),
      tokenomics: this.scoreTokenomics(config),
      liquidity: this.scoreLiquidity(config),
      verification: this.scoreVerification(config)
    };

    // Weighted average
    const weights = {
      authorities: 0.25,
      metadata: 0.20,
      tokenomics: 0.25,
      liquidity: 0.20,
      verification: 0.10
    };

    const overall = Object.entries(components).reduce(
      (sum, [key, score]) => sum + score * weights[key as keyof typeof weights],
      0
    );

    const grade = this.calculateGrade(overall);
    const recommendations = this.generateRecommendations(components, config);

    return {
      overall: Math.round(overall),
      components,
      grade,
      recommendations
    };
  }

  /**
   * Score authority configuration
   */
  private scoreAuthorities(config: TokenConfig): number {
    let score = 50; // Base score

    // Mint authority scoring
    if (config.mintAuthority === 'permanent') {
      score += 30; // Best practice - permanent supply
    } else if (config.mintAuthority === 'none') {
      score += 25; // No minting capability
    } else {
      score += 10; // Revocable authority
    }

    // Freeze authority scoring
    if (!config.freezeAuthority) {
      score += 15; // Cannot freeze accounts (good)
    } else {
      score -= 5; // Can freeze (potential red flag)
    }

    // Update authority scoring
    if (!config.updateAuthority) {
      score += 5; // Immutable metadata
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Score metadata completeness
   */
  private scoreMetadata(config: TokenConfig): number {
    let score = 0;

    // Required fields
    if (config.name?.trim()) score += 20;
    if (config.symbol?.trim()) score += 20;

    // Optional but important fields
    if (config.description?.trim() && config.description.length >= 20) score += 15;
    if (config.image) score += 15;

    // Social links
    if (config.website?.trim()) score += 10;
    if (config.twitter?.trim()) score += 10;
    if (config.telegram?.trim()) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Score tokenomics
   */
  private scoreTokenomics(config: TokenConfig): number {
    let score = 50;

    // Supply scoring
    if (config.supply && config.supply > 0) {
      score += 20;

      // Reasonable supply ranges
      if (config.supply >= 1000000 && config.supply <= 1000000000) {
        score += 10; // Reasonable supply
      } else if (config.supply > 1000000000000) {
        score -= 10; // Suspiciously large supply
      }
    } else {
      score -= 10; // No initial supply
    }

    // Decimals scoring
    if (config.decimals >= 6 && config.decimals <= 9) {
      score += 10; // Standard decimals
    }

    // Transfer fees (if applicable)
    if (config.protocol === 'token2022' && config.transferFees !== undefined) {
      if (config.transferFees > 0 && config.transferFees <= 5) {
        score += 5; // Reasonable fee
      } else if (config.transferFees > 10) {
        score -= 15; // High fees - potential honeypot
      }
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Score liquidity setup
   */
  private scoreLiquidity(config: TokenConfig): number {
    let score = 30; // Base score (no liquidity)

    if (config.hasLiquidity) {
      score += 40; // Has liquidity pool

      if (config.liquidityLocked) {
        score += 30; // Liquidity is locked (best practice)
      } else {
        score += 10; // Unlocked liquidity (potential risk)
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Score social verification
   */
  private scoreVerification(config: TokenConfig): number {
    let score = 0;

    // Social presence
    const hasSocialLinks = !!(config.website || config.twitter || config.telegram);
    if (hasSocialLinks) score += 40;

    // Multiple social links
    const socialCount = [config.website, config.twitter, config.telegram].filter(Boolean).length;
    score += socialCount * 20;

    return Math.min(score, 100);
  }

  /**
   * Calculate letter grade from score
   */
  private calculateGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Generate recommendations based on scores
   */
  private generateRecommendations(
    components: QualityScore['components'],
    config: TokenConfig
  ): string[] {
    const recommendations: string[] = [];

    if (components.authorities < 70) {
      if (config.mintAuthority !== 'permanent') {
        recommendations.push('Consider setting permanent supply by revoking mint authority');
      }
      if (config.freezeAuthority) {
        recommendations.push('Revoke freeze authority to build trust with holders');
      }
    }

    if (components.metadata < 70) {
      if (!config.description || config.description.length < 20) {
        recommendations.push('Add a detailed description explaining your token\'s purpose');
      }
      if (!config.image) {
        recommendations.push('Upload a professional logo/image for your token');
      }
      if (!config.website) {
        recommendations.push('Add a website URL to establish legitimacy');
      }
    }

    if (components.tokenomics < 60) {
      if (!config.supply || config.supply === 0) {
        recommendations.push('Set an initial supply to bootstrap your token');
      }
      if (config.transferFees && config.transferFees > 5) {
        recommendations.push('Consider reducing transfer fees (current: ' + config.transferFees + '%) to avoid honeypot flags');
      }
    }

    if (components.liquidity < 50) {
      recommendations.push('Add liquidity after token creation to enable trading');
      recommendations.push('Consider locking liquidity to prevent rug pulls');
    }

    if (components.verification < 50) {
      recommendations.push('Add social media links (Twitter, Telegram, Website) to verify legitimacy');
    }

    return recommendations;
  }

  /**
   * Scan for security risks (pre-creation)
   */
  async scanForRisks(config: TokenConfig): Promise<RiskAssessment> {
    const risks: Risk[] = [];
    const warnings: string[] = [];
    const criticalIssues: string[] = [];

    // Authority risks
    if (config.mintAuthority === 'revocable') {
      risks.push({
        category: 'authority',
        severity: 'medium',
        title: 'Revocable Mint Authority',
        description: 'Token creator can mint unlimited supply',
        recommendation: 'Set permanent supply or revoke mint authority after creation'
      });
      warnings.push('Unlimited minting capability - supply can be diluted');
    }

    if (config.freezeAuthority) {
      risks.push({
        category: 'authority',
        severity: 'high',
        title: 'Freeze Authority Enabled',
        description: 'Token creator can freeze any holder\'s tokens',
        recommendation: 'Revoke freeze authority to build trust'
      });
      warnings.push('Token accounts can be frozen by creator');
    }

    // Tokenomics risks
    if (config.supply && config.supply > 1000000000000) {
      risks.push({
        category: 'tokenomics',
        severity: 'medium',
        title: 'Extremely Large Supply',
        description: 'Supply exceeds 1 trillion tokens',
        recommendation: 'Consider reducing supply to reasonable amount'
      });
    }

    if (config.transferFees && config.transferFees > 10) {
      risks.push({
        category: 'tokenomics',
        severity: 'critical',
        title: 'High Transfer Fees',
        description: `Transfer fee of ${config.transferFees}% may indicate honeypot`,
        recommendation: 'Reduce transfer fees to 5% or below'
      });
      criticalIssues.push('Transfer fees above 10% - potential honeypot');
    }

    // Metadata risks
    if (!config.description || config.description.length < 10) {
      risks.push({
        category: 'metadata',
        severity: 'low',
        title: 'Missing Description',
        description: 'No detailed token description provided',
        recommendation: 'Add comprehensive description'
      });
    }

    if (!config.website && !config.twitter && !config.telegram) {
      risks.push({
        category: 'social',
        severity: 'high',
        title: 'No Social Verification',
        description: 'No social media links provided',
        recommendation: 'Add website and social media links'
      });
      warnings.push('No social verification - difficult to verify legitimacy');
    }

    // Liquidity risks
    if (!config.hasLiquidity) {
      risks.push({
        category: 'liquidity',
        severity: 'medium',
        title: 'No Liquidity',
        description: 'Token will not be tradeable without liquidity',
        recommendation: 'Add liquidity pool after creation'
      });
    } else if (!config.liquidityLocked) {
      risks.push({
        category: 'liquidity',
        severity: 'high',
        title: 'Unlocked Liquidity',
        description: 'Liquidity can be removed at any time (rug pull risk)',
        recommendation: 'Lock liquidity using a trusted locker'
      });
      warnings.push('Liquidity not locked - high rug pull risk');
    }

    // Calculate risk level
    const criticalCount = risks.filter(r => r.severity === 'critical').length;
    const highCount = risks.filter(r => r.severity === 'high').length;

    let riskLevel: RiskAssessment['riskLevel'];
    if (criticalCount > 0 || criticalIssues.length > 0) {
      riskLevel = 'critical';
    } else if (highCount >= 2) {
      riskLevel = 'high';
    } else if (highCount === 1 || risks.length >= 3) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Calculate safety score (inverse of risk)
    const safetyScore = Math.max(0, 100 - (criticalCount * 40 + highCount * 20 + risks.length * 5));

    return {
      riskLevel,
      risks,
      warnings,
      criticalIssues,
      safetyScore
    };
  }

  /**
   * Fetch token data from blockchain
   */
  private async fetchTokenData(mintPubkey: PublicKey): Promise<TokenData> {
    const mintInfo = await getMint(this.connection, mintPubkey);

    return {
      mintAddress: mintPubkey.toString(),
      decimals: mintInfo.decimals,
      supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
      mintAuthority: mintInfo.mintAuthority,
      freezeAuthority: mintInfo.freezeAuthority
    };
  }

  /**
   * Calculate quality score from on-chain data
   */
  private async calculateQualityScoreFromChain(tokenData: TokenData): Promise<QualityScore> {
    // Convert on-chain data to config format for scoring
    const config: TokenConfig = {
      name: '',
      symbol: '',
      decimals: tokenData.decimals,
      supply: tokenData.supply,
      mintAuthority: tokenData.mintAuthority ? 'revocable' : 'none',
      freezeAuthority: !!tokenData.freezeAuthority,
      updateAuthority: false
    };

    return this.calculateQualityScore(config);
  }

  /**
   * Scan for risks from on-chain data
   */
  private async scanForRisksFromChain(tokenData: TokenData): Promise<RiskAssessment> {
    const config: TokenConfig = {
      name: '',
      symbol: '',
      decimals: tokenData.decimals,
      supply: tokenData.supply,
      mintAuthority: tokenData.mintAuthority ? 'revocable' : 'none',
      freezeAuthority: !!tokenData.freezeAuthority,
      updateAuthority: false
    };

    return this.scanForRisks(config);
  }

  /**
   * Check for honeypot characteristics
   */
  private async checkHoneypot(tokenData: TokenData): Promise<HoneypotAnalysis> {
    // Basic honeypot detection logic
    const indicators: string[] = [];
    let confidence = 0;

    // Check for suspicious authority settings
    if (tokenData.freezeAuthority) {
      indicators.push('Freeze authority enabled');
      confidence += 30;
    }

    // Placeholder for actual honeypot simulation
    // In production, this would attempt buy/sell transactions on devnet

    return {
      isHoneypot: confidence > 70,
      confidence,
      indicators,
      canBuy: true,
      canSell: true,
      buyTax: 0,
      sellTax: 0
    };
  }

  /**
   * Detect rug pull indicators
   */
  private async detectRugPullIndicators(tokenData: TokenData): Promise<RugPullIndicators> {
    const indicators: RugPullIndicators['indicators'] = [];
    let riskScore = 0;

    // Check mint authority
    if (tokenData.mintAuthority) {
      indicators.push({
        name: 'Active Mint Authority',
        present: true,
        severity: 'medium',
        description: 'Creator can mint unlimited tokens, potentially diluting holders'
      });
      riskScore += 20;
    }

    // Check freeze authority
    if (tokenData.freezeAuthority) {
      indicators.push({
        name: 'Active Freeze Authority',
        present: true,
        severity: 'high',
        description: 'Creator can freeze any holder\'s tokens'
      });
      riskScore += 30;
    }

    return {
      riskScore: Math.min(riskScore, 100),
      indicators,
      liquidityLocked: false, // Would check on-chain liquidity locks
      ownershipRenounced: !tokenData.mintAuthority,
      largeHolders: false // Would check holder distribution
    };
  }
}

/**
 * Factory function to create security service
 */
export function createSecurityService(connection: Connection): SecurityService {
  return new SecurityService(connection);
}

export default SecurityService;
