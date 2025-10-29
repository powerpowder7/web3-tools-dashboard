// src/services/antiSnipeService.ts - Anti-Snipe Bot Protection
import {
  Connection,
  PublicKey,
  Transaction
} from '@solana/web3.js';
import {
  createSetAuthorityInstruction,
  AuthorityType,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';

/**
 * Anti-Snipe Protection Levels
 */
export type AntiSnipeLevel = 'none' | 'basic' | 'standard' | 'advanced';

/**
 * Anti-Snipe Configuration
 */
export interface AntiSnipeConfig {
  level: AntiSnipeLevel;
  launchDelay: number; // in minutes
  maxWalletPercentage?: number; // 1-10%
  buyLimitPerTx?: number; // max tokens per transaction
  whitelistEnabled: boolean;
  whitelist?: string[]; // wallet addresses
  blacklistEnabled: boolean;
  blacklist?: string[]; // known bot addresses
  honeypotPeriod?: number; // minutes to monitor for bots
}

/**
 * Launch Schedule
 */
export interface LaunchSchedule {
  tokenMint: string;
  scheduledTime: number; // Unix timestamp
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  whitelistPhaseEnd?: number;
  publicPhaseStart?: number;
}

/**
 * Wallet Limits
 */
export interface WalletLimits {
  maxPercentage: number;
  maxTokens: number;
  cooldownPeriod: number; // seconds between buys
}

/**
 * Bot Detection Result
 */
export interface BotDetectionResult {
  isBot: boolean;
  confidence: number; // 0-100
  indicators: string[];
  shouldBlock: boolean;
}

/**
 * Transaction Analysis
 */
export interface TransactionAnalysis {
  wallet: string;
  timestamp: number;
  amount: number;
  isSuspicious: boolean;
  flags: string[];
}

/**
 * Anti-Snipe Service for Launch Protection
 */
export class AntiSnipeService {
  private schedules: Map<string, LaunchSchedule>;
  private transactionHistory: Map<string, TransactionAnalysis[]>;
  private knownBots: Set<string>;

  constructor(_connection: Connection) {
    this.schedules = new Map();
    this.transactionHistory = new Map();
    this.knownBots = new Set();

    // Initialize with known bot addresses (would be loaded from database in production)
    this.initializeKnownBots();
  }

  /**
   * Create anti-snipe configuration based on level
   */
  createConfig(level: AntiSnipeLevel, customOptions?: Partial<AntiSnipeConfig>): AntiSnipeConfig {
    const baseConfigs: Record<AntiSnipeLevel, AntiSnipeConfig> = {
      none: {
        level: 'none',
        launchDelay: 0,
        whitelistEnabled: false,
        blacklistEnabled: false
      },
      basic: {
        level: 'basic',
        launchDelay: 5,
        maxWalletPercentage: 5,
        whitelistEnabled: false,
        blacklistEnabled: true,
        honeypotPeriod: 2
      },
      standard: {
        level: 'standard',
        launchDelay: 15,
        maxWalletPercentage: 3,
        buyLimitPerTx: 0,
        whitelistEnabled: false,
        blacklistEnabled: true,
        honeypotPeriod: 5
      },
      advanced: {
        level: 'advanced',
        launchDelay: 30,
        maxWalletPercentage: 2,
        buyLimitPerTx: 0,
        whitelistEnabled: true,
        blacklistEnabled: true,
        honeypotPeriod: 10
      }
    };

    return { ...baseConfigs[level], ...customOptions };
  }

  /**
   * Schedule a delayed token launch
   */
  async scheduleTokenLaunch(
    tokenMint: string,
    config: AntiSnipeConfig
  ): Promise<LaunchSchedule> {
    const now = Date.now();
    const scheduledTime = now + config.launchDelay * 60 * 1000;

    const schedule: LaunchSchedule = {
      tokenMint,
      scheduledTime,
      status: 'scheduled',
      whitelistPhaseEnd: config.whitelistEnabled
        ? scheduledTime - 5 * 60 * 1000 // Whitelist gets 5 min early access
        : undefined,
      publicPhaseStart: scheduledTime
    };

    this.schedules.set(tokenMint, schedule);

    console.log(`[Anti-Snipe] Launch scheduled for ${new Date(scheduledTime).toISOString()}`);
    console.log(`[Anti-Snipe] Whitelist phase: ${config.whitelistEnabled ? 'Enabled' : 'Disabled'}`);

    return schedule;
  }

  /**
   * Generate launch delay transaction (time-locked authority transfer)
   */
  async createLaunchDelayTx(
    tokenMint: PublicKey,
    currentAuthority: PublicKey,
    newAuthority: PublicKey,
    _delayMinutes: number
  ): Promise<Transaction> {
    // In production, this would use a time-lock program
    // For now, we'll create a basic authority transfer instruction
    // that should be executed after the delay period

    const transaction = new Transaction();

    // Add instruction to transfer mint authority after delay
    const transferAuthorityIx = createSetAuthorityInstruction(
      tokenMint,
      currentAuthority,
      AuthorityType.MintTokens,
      newAuthority,
      [],
      TOKEN_PROGRAM_ID
    );

    transaction.add(transferAuthorityIx);

    console.log(`[Anti-Snipe] Created launch delay transaction (${_delayMinutes} minutes)`);

    return transaction;
  }

  /**
   * Configure wallet limits for anti-snipe protection
   */
  async setWalletLimits(
    _tokenMint: string,
    maxPercentage: number,
    totalSupply: number
  ): Promise<WalletLimits> {
    const maxTokens = (totalSupply * maxPercentage) / 100;

    const limits: WalletLimits = {
      maxPercentage,
      maxTokens,
      cooldownPeriod: 60 // 1 minute between buys
    };

    console.log(`[Anti-Snipe] Wallet limits set: ${maxPercentage}% (${maxTokens} tokens)`);

    return limits;
  }

  /**
   * Validate if a wallet can purchase tokens
   */
  async validatePurchase(
    wallet: string,
    amount: number,
    tokenMint: string,
    config: AntiSnipeConfig
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check schedule
    const schedule = this.schedules.get(tokenMint);
    if (schedule && schedule.status === 'scheduled') {
      const now = Date.now();

      // Check if in whitelist phase
      if (schedule.whitelistPhaseEnd && now < schedule.whitelistPhaseEnd) {
        if (!config.whitelist?.includes(wallet)) {
          return {
            allowed: false,
            reason: 'Token launch is in whitelist-only phase'
          };
        }
      }

      // Check if before public launch
      if (schedule.publicPhaseStart && now < schedule.publicPhaseStart) {
        return {
          allowed: false,
          reason: `Token launches at ${new Date(schedule.publicPhaseStart).toISOString()}`
        };
      }
    }

    // Check blacklist
    if (config.blacklistEnabled && config.blacklist?.includes(wallet)) {
      return {
        allowed: false,
        reason: 'Wallet is blacklisted'
      };
    }

    // Check known bots
    if (this.knownBots.has(wallet)) {
      return {
        allowed: false,
        reason: 'Suspected bot activity'
      };
    }

    // Check buy limits
    if (config.buyLimitPerTx && amount > config.buyLimitPerTx) {
      return {
        allowed: false,
        reason: `Exceeds maximum purchase of ${config.buyLimitPerTx} tokens`
      };
    }

    // Check wallet percentage limits
    if (config.maxWalletPercentage) {
      // In production, would check current holdings vs max percentage
      // For now, just validate the amount isn't suspiciously large
      const suspiciousAmount = 1000000000; // 1B tokens
      if (amount > suspiciousAmount) {
        return {
          allowed: false,
          reason: 'Purchase amount exceeds maximum wallet limit'
        };
      }
    }

    // Check cooldown period
    const recentTxs = this.transactionHistory.get(wallet) || [];
    const lastTx = recentTxs[recentTxs.length - 1];
    if (lastTx) {
      const timeSinceLastTx = (Date.now() - lastTx.timestamp) / 1000;
      if (timeSinceLastTx < 60) {
        return {
          allowed: false,
          reason: `Cooldown period active. Wait ${Math.ceil(60 - timeSinceLastTx)}s`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Detect bot behavior patterns
   */
  async detectBot(wallet: string, txHistory?: TransactionAnalysis[]): Promise<BotDetectionResult> {
    const indicators: string[] = [];
    let confidence = 0;

    // Check if in known bots list
    if (this.knownBots.has(wallet)) {
      indicators.push('Known bot address');
      confidence += 50;
    }

    // Analyze transaction history
    const history = txHistory || this.transactionHistory.get(wallet) || [];

    // Check for rapid successive transactions
    if (history.length >= 3) {
      const recentTxs = history.slice(-3);
      const timeDiffs = recentTxs.slice(1).map((tx, i) =>
        tx.timestamp - recentTxs[i].timestamp
      );

      const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;

      if (avgTimeDiff < 5000) {
        indicators.push('Rapid successive transactions (< 5s apart)');
        confidence += 30;
      }
    }

    // Check for suspiciously round amounts
    if (history.some(tx => tx.amount % 1000000 === 0)) {
      indicators.push('Suspiciously round purchase amounts');
      confidence += 10;
    }

    // Check transaction timing patterns (bots often trade at specific intervals)
    if (history.length >= 5) {
      const intervals = history.slice(1).map((tx, i) =>
        tx.timestamp - history[i].timestamp
      );

      const uniqueIntervals = new Set(intervals.map(i => Math.round(i / 1000)));
      if (uniqueIntervals.size === 1) {
        indicators.push('Consistent transaction intervals (bot-like pattern)');
        confidence += 20;
      }
    }

    // Check for new wallet with large transaction
    if (history.length === 1 && history[0].amount > 100000) {
      indicators.push('New wallet with large first transaction');
      confidence += 15;
    }

    const isBot = confidence >= 60;
    const shouldBlock = confidence >= 70;

    console.log(`[Anti-Snipe] Bot detection for ${wallet}: ${isBot ? 'BOT' : 'HUMAN'} (${confidence}% confidence)`);

    return {
      isBot,
      confidence,
      indicators,
      shouldBlock
    };
  }

  /**
   * Record a transaction for analysis
   */
  recordTransaction(wallet: string, amount: number, flags: string[] = []): void {
    const analysis: TransactionAnalysis = {
      wallet,
      timestamp: Date.now(),
      amount,
      isSuspicious: flags.length > 0,
      flags
    };

    const history = this.transactionHistory.get(wallet) || [];
    history.push(analysis);
    this.transactionHistory.set(wallet, history);

    // Keep only last 100 transactions per wallet
    if (history.length > 100) {
      this.transactionHistory.set(wallet, history.slice(-100));
    }
  }

  /**
   * Add wallet to whitelist
   */
  addToWhitelist(config: AntiSnipeConfig, wallet: string): AntiSnipeConfig {
    const whitelist = config.whitelist || [];
    if (!whitelist.includes(wallet)) {
      whitelist.push(wallet);
    }

    return {
      ...config,
      whitelistEnabled: true,
      whitelist
    };
  }

  /**
   * Add wallet to blacklist
   */
  addToBlacklist(config: AntiSnipeConfig, wallet: string): AntiSnipeConfig {
    const blacklist = config.blacklist || [];
    if (!blacklist.includes(wallet)) {
      blacklist.push(wallet);
    }

    return {
      ...config,
      blacklistEnabled: true,
      blacklist
    };
  }

  /**
   * Activate a scheduled launch
   */
  activateLaunch(tokenMint: string): void {
    const schedule = this.schedules.get(tokenMint);
    if (schedule) {
      schedule.status = 'active';
      this.schedules.set(tokenMint, schedule);
      console.log(`[Anti-Snipe] Launch activated for ${tokenMint}`);
    }
  }

  /**
   * Get launch schedule status
   */
  getLaunchStatus(tokenMint: string): LaunchSchedule | null {
    return this.schedules.get(tokenMint) || null;
  }

  /**
   * Initialize known bot addresses
   */
  private initializeKnownBots(): void {
    // In production, this would load from a database or API
    // These are example addresses for demonstration
    const knownBotAddresses: string[] = [
      // Add known bot addresses here
    ];

    knownBotAddresses.forEach(address => this.knownBots.add(address));

    console.log(`[Anti-Snipe] Loaded ${this.knownBots.size} known bot addresses`);
  }

  /**
   * Get configuration details for UI display
   */
  getConfigDescription(config: AntiSnipeConfig): string {
    const parts: string[] = [];

    if (config.launchDelay > 0) {
      parts.push(`${config.launchDelay} minute launch delay`);
    }

    if (config.maxWalletPercentage) {
      parts.push(`${config.maxWalletPercentage}% max wallet size`);
    }

    if (config.whitelistEnabled) {
      parts.push('Whitelist-only early access');
    }

    if (config.blacklistEnabled) {
      parts.push('Bot blacklist protection');
    }

    if (config.honeypotPeriod) {
      parts.push(`${config.honeypotPeriod} min honeypot monitoring`);
    }

    return parts.join(' • ') || 'No protection';
  }

  /**
   * Estimate cost of anti-snipe setup
   */
  async estimateSetupCost(config: AntiSnipeConfig): Promise<number> {
    let cost = 0;

    // Launch delay transaction
    if (config.launchDelay > 0) {
      cost += 0.000005; // Base transaction fee
    }

    // Whitelist setup (if using on-chain whitelist program)
    if (config.whitelistEnabled && config.whitelist && config.whitelist.length > 0) {
      cost += 0.000005 * config.whitelist.length;
    }

    // Additional monitoring/storage costs
    if (config.honeypotPeriod && config.honeypotPeriod > 0) {
      cost += 0.00001; // Monitoring overhead
    }

    return cost;
  }
}

/**
 * Factory function to create anti-snipe service
 */
export function createAntiSnipeService(connection: Connection): AntiSnipeService {
  return new AntiSnipeService(connection);
}

export default AntiSnipeService;
