/**
 * Tutorial Content Data
 * Complete tutorial content for all tools
 */

import { Tutorial, Achievement, HelpContent, LEARNING_PATHS } from '@/types/tutorial';

// ============================================================================
// TUTORIALS
// ============================================================================

export const TUTORIALS: Tutorial[] = [
  // Token Creator Tutorial - Comprehensive
  {
    id: 'token-creator-basics',
    title: 'Token Creator Basics',
    description: 'Learn how to create your first SPL token on Solana with step-by-step guidance',
    category: 'token-tools',
    difficulty: 'beginner',
    estimatedDuration: 600, // 10 minutes
    icon: 'Coins',
    tags: ['token', 'spl', 'beginner', 'creation'],
    targetPage: '/solana/token-creator',
    steps: [
      {
        id: 'step-1-welcome',
        title: 'Welcome to Token Creator',
        description:
          'This tutorial will guide you through creating your first SPL token on Solana. You\'ll learn about token standards, metadata, and security best practices.',
        position: 'center',
        hints: [
          'SPL tokens are the standard for fungible tokens on Solana',
          'Creating a token typically costs 0.01-0.02 SOL',
          'Always start on devnet when learning',
        ],
        estimatedTime: 30,
        skipAllowed: true,
      },
      {
        id: 'step-2-connect-wallet',
        title: 'Connect Your Wallet',
        description:
          'First, connect your Solana wallet. Make sure you have some SOL for transaction fees. We recommend starting on devnet for practice.',
        targetElement: '[data-tutorial="wallet-connect-button"]',
        position: 'bottom',
        validation: {
          type: 'custom',
          customValidator: 'isWalletConnected',
        },
        hints: [
          'If you don\'t have a wallet, install Phantom or Solflare from their official websites',
          'Make sure you\'re on the correct network (devnet for testing)',
          'You can get devnet SOL from faucets like solfaucet.com',
        ],
        estimatedTime: 60,
        skipAllowed: false,
      },
      {
        id: 'step-3-select-token-type',
        title: 'Choose Token Type',
        description:
          'Select the type of token you want to create. Each type has different use cases:\n\n• Standard: Basic fungible token\n• Deflationary: Burns tokens on transfers\n• Governance: Designed for DAO voting\n• Utility: For platform functionality',
        targetElement: '[data-tutorial="token-type-select"]',
        position: 'right',
        hints: [
          'Standard tokens are best for most use cases',
          'Deflationary tokens can create scarcity over time',
          'Governance tokens typically have voting capabilities',
        ],
        estimatedTime: 45,
        skipAllowed: true,
      },
      {
        id: 'step-4-basic-info',
        title: 'Enter Token Information',
        description:
          'Provide the basic details for your token. This information will be stored on-chain and cannot be changed later for the name and symbol.',
        targetElement: '[data-tutorial="token-basic-info"]',
        position: 'right',
        hints: [
          'Token name: Full name (e.g., "My Project Token")',
          'Symbol: 2-8 uppercase characters (e.g., "MPT")',
          'Decimals: Usually 9 for Solana tokens, 6 for stablecoins',
        ],
        estimatedTime: 90,
        skipAllowed: false,
        codeExample: {
          language: 'typescript',
          code: `const tokenInfo = {
  name: "My Project Token",
  symbol: "MPT",
  decimals: 9
};`,
          explanation: 'Example of typical token configuration',
        },
      },
      {
        id: 'step-5-supply-config',
        title: 'Configure Token Supply',
        description:
          'Set the total supply of your token. Consider your tokenomics carefully:\n\n• Total Supply: Maximum tokens that will exist\n• Initial Mint: Tokens created immediately\n• Mint Authority: Who can create more tokens later',
        targetElement: '[data-tutorial="supply-configuration"]',
        position: 'right',
        hints: [
          'Popular supplies: 1M, 10M, 100M, 1B tokens',
          'You can revoke mint authority to make supply fixed',
          'Consider future distribution when setting supply',
        ],
        estimatedTime: 90,
        skipAllowed: false,
      },
      {
        id: 'step-6-metadata',
        title: 'Add Token Metadata',
        description:
          'Upload metadata including logo, description, and social links. This helps your token appear correctly in wallets and explorers.',
        targetElement: '[data-tutorial="metadata-section"]',
        position: 'right',
        hints: [
          'Logo should be square (e.g., 512x512px)',
          'Use IPFS or Arweave for permanent storage',
          'Good metadata improves trust and visibility',
        ],
        estimatedTime: 120,
        skipAllowed: true,
      },
      {
        id: 'step-7-security',
        title: 'Security Features',
        description:
          'Configure security settings to protect your token and holders:\n\n• Anti-Snipe: Prevent bot attacks at launch\n• Jito Protection: MEV protection\n• Transfer Restrictions: Control who can transfer',
        targetElement: '[data-tutorial="security-settings"]',
        position: 'right',
        hints: [
          'Anti-snipe is recommended for public launches',
          'You can always remove restrictions later',
          'Higher security levels cost more in fees',
        ],
        estimatedTime: 90,
        skipAllowed: true,
      },
      {
        id: 'step-8-review',
        title: 'Review Configuration',
        description:
          'Review all your settings carefully before creating the token. Once created, most settings cannot be changed.',
        targetElement: '[data-tutorial="review-section"]',
        position: 'center',
        hints: [
          'Double-check token name and symbol',
          'Verify supply and decimal places',
          'Ensure you have enough SOL for fees',
        ],
        estimatedTime: 60,
        skipAllowed: false,
      },
      {
        id: 'step-9-create',
        title: 'Create Your Token',
        description:
          'Click "Create Token" and approve the transaction in your wallet. This will create your token on the Solana blockchain.',
        targetElement: '[data-tutorial="create-token-button"]',
        position: 'top',
        validation: {
          type: 'custom',
          customValidator: 'isTokenCreated',
        },
        hints: [
          'The transaction may take 10-30 seconds to confirm',
          'Don\'t close the window during creation',
          'Save your token mint address after creation',
        ],
        estimatedTime: 45,
        skipAllowed: false,
      },
      {
        id: 'step-10-success',
        title: 'Token Created Successfully!',
        description:
          'Congratulations! Your token has been created. Next steps:\n\n• Add liquidity on a DEX\n• Distribute to holders\n• List on tracking platforms\n• Build your community',
        position: 'center',
        hints: [
          'Save your token mint address somewhere safe',
          'Consider creating a liquidity pool on Raydium or Orca',
          'Submit to token tracking sites like DexScreener',
        ],
        estimatedTime: 30,
        skipAllowed: true,
      },
    ],
    rewards: [
      {
        id: 'achievement-first-token',
        title: 'Token Creator',
        description: 'Created your first SPL token',
        category: 'completion',
        icon: 'Coins',
        rarity: 'common',
        requirements: {
          type: 'complete_tutorial',
          value: 1,
          tutorialIds: ['token-creator-basics'],
        },
      },
    ],
    nextRecommended: ['token-creator-advanced', 'multi-sender-basics'],
  },

  // Multi-Sender Tutorial
  {
    id: 'multi-sender-basics',
    title: 'Multi-Sender Basics',
    description: 'Learn how to send tokens or SOL to multiple recipients efficiently',
    category: 'token-tools',
    difficulty: 'beginner',
    estimatedDuration: 480, // 8 minutes
    icon: 'Send',
    tags: ['multisend', 'airdrop', 'batch', 'beginner'],
    targetPage: '/solana/multi-sender',
    steps: [
      {
        id: 'step-1-welcome-multisender',
        title: 'Welcome to Multi-Sender',
        description:
          'Multi-Sender allows you to send tokens or SOL to hundreds of recipients in a single transaction. Perfect for airdrops, team distributions, and rewards.',
        position: 'center',
        hints: [
          'Save gas fees by batching transactions',
          'Support both SOL and SPL tokens',
          'Process up to 200 recipients per batch',
        ],
        estimatedTime: 30,
        skipAllowed: true,
      },
      {
        id: 'step-2-choose-asset',
        title: 'Select Asset Type',
        description:
          'Choose whether you want to send SOL or an SPL token. If sending a token, you\'ll need to select it from your wallet.',
        targetElement: '[data-tutorial="asset-type-select"]',
        position: 'bottom',
        hints: [
          'SOL: Native Solana currency',
          'SPL Token: Any token in your wallet',
          'Make sure you have enough balance',
        ],
        estimatedTime: 30,
        skipAllowed: false,
      },
      {
        id: 'step-3-add-recipients',
        title: 'Add Recipients',
        description:
          'Add recipient addresses and amounts. You can:\n\n• Enter manually\n• Import from CSV\n• Load from previous airdrops',
        targetElement: '[data-tutorial="recipients-input"]',
        position: 'right',
        hints: [
          'CSV format: address,amount',
          'Validate addresses before sending',
          'You can save recipient lists for later',
        ],
        estimatedTime: 120,
        skipAllowed: false,
        codeExample: {
          language: 'csv',
          code: `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,100
8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsV,50
9xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsW,75`,
          explanation: 'CSV format: one recipient per line with address and amount',
        },
      },
      {
        id: 'step-4-review-send',
        title: 'Review and Send',
        description:
          'Review all recipients and amounts. Check the total amount and estimated fees. Then click Send to process all transfers.',
        targetElement: '[data-tutorial="review-and-send"]',
        position: 'center',
        hints: [
          'Double-check all addresses',
          'Verify you have enough balance for total + fees',
          'Transactions are sent in optimal batches',
        ],
        estimatedTime: 60,
        skipAllowed: false,
      },
      {
        id: 'step-5-success-multisender',
        title: 'Transfers Complete!',
        description:
          'All transfers have been processed successfully. You can view transaction signatures and download a report.',
        position: 'center',
        hints: [
          'Save transaction signatures for records',
          'Download CSV report for your records',
          'Check failed transfers (if any) and retry',
        ],
        estimatedTime: 30,
        skipAllowed: true,
      },
    ],
    rewards: [
      {
        id: 'achievement-first-airdrop',
        title: 'Airdrop Master',
        description: 'Completed your first multi-send',
        category: 'completion',
        icon: 'Send',
        rarity: 'common',
        requirements: {
          type: 'complete_tutorial',
          value: 1,
          tutorialIds: ['multi-sender-basics'],
        },
      },
    ],
    nextRecommended: ['multi-sender-advanced', 'csv-operations'],
    prerequisites: ['token-creator-basics'],
  },

  // Wallet Creator Tutorial
  {
    id: 'wallet-creator-basics',
    title: 'Wallet Creator Basics',
    description: 'Learn to generate secure Solana wallets in bulk with HD derivation',
    category: 'wallet-tools',
    difficulty: 'beginner',
    estimatedDuration: 360, // 6 minutes
    icon: 'Wallet',
    tags: ['wallet', 'keypair', 'security', 'beginner'],
    targetPage: '/solana/wallet-creator',
    steps: [
      {
        id: 'step-1-wallet-intro',
        title: 'Understanding Wallet Creation',
        description:
          'This tool generates cryptographically secure wallets using industry-standard BIP39 mnemonic phrases. Each wallet is unique and secure.',
        position: 'center',
        hints: [
          'Never share your private keys or seed phrases',
          'Always back up your wallets securely',
          'Use hardware wallets for large amounts',
        ],
        estimatedTime: 45,
        skipAllowed: true,
      },
      {
        id: 'step-2-wallet-count',
        title: 'Select Number of Wallets',
        description:
          'Choose how many wallets you want to create. You can generate up to 100 wallets at once.',
        targetElement: '[data-tutorial="wallet-count-input"]',
        position: 'bottom',
        hints: [
          'Common use: Create wallets for team members',
          'Generate multiple for testing purposes',
          'Each wallet is completely independent',
        ],
        estimatedTime: 30,
        skipAllowed: false,
      },
      {
        id: 'step-3-mnemonic-length',
        title: 'Choose Mnemonic Length',
        description:
          'Select between 12 or 24-word seed phrases:\n\n• 12 words: Easier to remember and backup\n• 24 words: Higher security for large holdings',
        targetElement: '[data-tutorial="mnemonic-length-select"]',
        position: 'bottom',
        hints: [
          '12 words provide 128-bit security',
          '24 words provide 256-bit security',
          'Both are considered cryptographically secure',
        ],
        estimatedTime: 30,
        skipAllowed: true,
      },
      {
        id: 'step-4-generate-wallets',
        title: 'Generate Wallets',
        description:
          'Click "Generate Wallets" to create your new wallets. Each will have a unique public and private key pair.',
        targetElement: '[data-tutorial="generate-wallets-button"]',
        position: 'top',
        hints: [
          'Generation happens instantly in your browser',
          'Keys never leave your device',
          'Make sure to save the output securely',
        ],
        estimatedTime: 30,
        skipAllowed: false,
      },
      {
        id: 'step-5-export-wallets',
        title: 'Export and Secure Your Wallets',
        description:
          'Download your wallet information as JSON or CSV. Store this file securely - treat it like cash!',
        targetElement: '[data-tutorial="export-wallets-section"]',
        position: 'top',
        hints: [
          'Store backups in multiple secure locations',
          'Consider encrypting the export file',
          'Never share or upload private keys online',
        ],
        estimatedTime: 60,
        skipAllowed: false,
      },
    ],
    rewards: [
      {
        id: 'achievement-wallet-generator',
        title: 'Wallet Generator',
        description: 'Created your first batch of wallets',
        category: 'completion',
        icon: 'Wallet',
        rarity: 'common',
        requirements: {
          type: 'complete_tutorial',
          value: 1,
          tutorialIds: ['wallet-creator-basics'],
        },
      },
    ],
    nextRecommended: ['wallet-security', 'multi-sender-basics'],
  },

  // Vanity Address Tutorial
  {
    id: 'vanity-address-basics',
    title: 'Vanity Address Generator',
    description: 'Create custom Solana addresses with your desired prefix or suffix',
    category: 'wallet-tools',
    difficulty: 'intermediate',
    estimatedDuration: 420, // 7 minutes
    icon: 'Sparkles',
    tags: ['vanity', 'custom', 'address', 'intermediate'],
    targetPage: '/solana/vanity-address',
    steps: [
      {
        id: 'step-1-vanity-intro',
        title: 'What are Vanity Addresses?',
        description:
          'Vanity addresses are public keys that contain specific patterns, making them easier to recognize and remember. Example: 7xSoLxyz... or ...CoolABC',
        position: 'center',
        hints: [
          'Vanity addresses are just as secure as random ones',
          'Longer patterns take exponentially more time',
          'Generated locally for maximum security',
        ],
        estimatedTime: 45,
        skipAllowed: true,
      },
      {
        id: 'step-2-choose-pattern',
        title: 'Choose Your Pattern',
        description:
          'Enter the text pattern you want in your address. You can choose:\n\n• Prefix: Pattern at the start\n• Suffix: Pattern at the end\n• Case-sensitive or insensitive',
        targetElement: '[data-tutorial="pattern-input"]',
        position: 'bottom',
        hints: [
          'Use 4-6 characters for reasonable generation time',
          'Avoid common words to increase uniqueness',
          'Case-insensitive is much faster to generate',
        ],
        estimatedTime: 60,
        skipAllowed: false,
      },
      {
        id: 'step-3-difficulty-estimate',
        title: 'Understanding Difficulty',
        description:
          'The tool shows estimated time based on your pattern. Each additional character multiplies difficulty by ~32.',
        targetElement: '[data-tutorial="difficulty-display"]',
        position: 'bottom',
        hints: [
          '4 chars: ~seconds',
          '5 chars: ~minutes',
          '6 chars: ~hours',
          '7+ chars: days or more',
        ],
        estimatedTime: 45,
        skipAllowed: true,
      },
      {
        id: 'step-4-start-generation',
        title: 'Start Generating',
        description:
          'Click "Start Generation" and wait. The tool will try millions of combinations until it finds a match.',
        targetElement: '[data-tutorial="start-generation-button"]',
        position: 'top',
        hints: [
          'Generation runs in your browser',
          'You can pause and resume anytime',
          'Progress is saved automatically',
        ],
        estimatedTime: 30,
        skipAllowed: false,
      },
      {
        id: 'step-5-vanity-success',
        title: 'Vanity Address Found!',
        description:
          'Congratulations! Your custom address has been generated. Save the private key securely - you\'ll need it to access this wallet.',
        position: 'center',
        hints: [
          'Back up the private key immediately',
          'Test with a small amount first',
          'Never share your private key',
        ],
        estimatedTime: 30,
        skipAllowed: true,
      },
    ],
    rewards: [
      {
        id: 'achievement-vanity-master',
        title: 'Vanity Master',
        description: 'Generated your first vanity address',
        category: 'completion',
        icon: 'Sparkles',
        rarity: 'rare',
        requirements: {
          type: 'complete_tutorial',
          value: 1,
          tutorialIds: ['vanity-address-basics'],
        },
      },
    ],
    nextRecommended: ['wallet-security', 'token-creator-basics'],
  },

  // Token Burner Tutorial - Comprehensive and Educational
  {
    id: 'token-burner-basics',
    title: 'Token Burner Mastery',
    description: 'Learn how to permanently burn SPL tokens, reduce supply, and understand deflationary tokenomics',
    category: 'token-tools',
    difficulty: 'beginner',
    estimatedDuration: 540, // 9 minutes
    icon: 'Flame',
    tags: ['burn', 'token', 'deflationary', 'supply', 'beginner'],
    targetPage: '/solana/token-burner',
    steps: [
      {
        id: 'step-1-burner-welcome',
        title: 'Welcome to Token Burning',
        description:
          'Token burning is the process of permanently removing tokens from circulation. This tutorial will teach you:\n\n• What token burning means\n• Why projects burn tokens\n• How to safely burn tokens\n• Impact on token economics',
        position: 'center',
        hints: [
          'Burning tokens is PERMANENT and irreversible',
          'Burning reduces total supply, potentially increasing value',
          'Always double-check the amount before burning',
          'Common use cases: deflationary tokenomics, fee burning, excess supply removal',
        ],
        estimatedTime: 60,
        skipAllowed: true,
      },
      {
        id: 'step-2-understand-burning',
        title: 'Understanding Token Burning',
        description:
          '🔥 What Happens When You Burn?\n\nWhen tokens are burned, they are sent to a null address that no one can access. This means:\n\n✅ Total supply decreases\n✅ Your tokens are permanently destroyed\n✅ The blockchain records this forever\n✅ Cannot be undone or reversed\n\n💡 Why Burn Tokens?\n\n• Create scarcity (deflationary model)\n• Remove excess tokens from failed sales\n• Implement fee-burning mechanisms\n• Increase value for remaining holders\n• Demonstrate commitment to tokenomics',
        position: 'center',
        hints: [
          'Burning is different from transferring - tokens are destroyed, not moved',
          'Check token supply before and after to verify the burn',
          'Some projects burn tokens regularly (quarterly, monthly)',
          'Proof of burn can boost community confidence',
        ],
        estimatedTime: 90,
        skipAllowed: true,
      },
      {
        id: 'step-3-connect-wallet-burner',
        title: 'Connect Your Wallet',
        description:
          'First, connect your Solana wallet that contains the tokens you want to burn. Make sure:\n\n• You have the tokens in this wallet\n• You have enough SOL for transaction fees (~0.000005 SOL)\n• You\'re on the correct network (devnet/mainnet)',
        targetElement: '[data-tutorial="wallet-connect-button"]',
        position: 'bottom',
        validation: {
          type: 'custom',
          customValidator: 'isWalletConnected',
        },
        hints: [
          'Use devnet for practice - never risk mainnet tokens while learning',
          'Transaction fees for burning are very low',
          'Your wallet must own the tokens to burn them',
        ],
        estimatedTime: 45,
        skipAllowed: false,
      },
      {
        id: 'step-4-select-token',
        title: 'Select Token to Burn',
        description:
          'Choose which token you want to burn from your wallet. The tool will show:\n\n📊 Token Details:\n• Token name and symbol\n• Current balance\n• Token mint address\n• Decimals\n\n⚠️ Important: Make sure you\'re selecting the correct token. This action cannot be undone!',
        targetElement: '[data-tutorial="token-select"]',
        position: 'right',
        hints: [
          'Verify the token address matches what you expect',
          'Check the balance is correct',
          'If you don\'t see your token, try refreshing',
          'Never burn tokens you might need later',
        ],
        estimatedTime: 60,
        skipAllowed: false,
      },
      {
        id: 'step-5-enter-amount',
        title: 'Enter Burn Amount',
        description:
          'Specify how many tokens you want to burn. You can:\n\n• Enter a specific amount\n• Use percentage buttons (25%, 50%, 75%, 100%)\n• Click "MAX" to burn all tokens\n\n💡 Best Practices:\n\n• Start with a small test burn on devnet\n• Calculate the percentage of total supply\n• Consider keeping some for future operations\n• Document the burn for your community',
        targetElement: '[data-tutorial="burn-amount-input"]',
        position: 'right',
        validation: {
          type: 'input',
          selector: '[data-tutorial="burn-amount-input"]',
        },
        hints: [
          'Burning 1-5% of supply can have significant impact',
          'Some projects do scheduled burns (quarterly/annually)',
          'Always keep some tokens for liquidity if needed',
          'Double-check you\'re not burning ALL your tokens by accident',
        ],
        estimatedTime: 90,
        skipAllowed: false,
      },
      {
        id: 'step-6-review-burn',
        title: 'Review Burn Transaction',
        description:
          '⚠️ FINAL REVIEW - This Cannot Be Undone!\n\nPlease verify these details:\n\n✓ Token: [Token Name]\n✓ Amount: [X tokens]\n✓ Percentage of your balance: [Y%]\n✓ Estimated fee: ~0.000005 SOL\n\n📈 Impact on Supply:\n• Current total supply: [Total]\n• After burn: [Total - X]\n• Reduction: [Percentage]\n\nOnce you burn, these tokens are gone forever. Are you absolutely sure?',
        targetElement: '[data-tutorial="review-section"]',
        position: 'center',
        hints: [
          'This is your last chance to cancel',
          'Screenshot the review for your records',
          'Make sure you have enough SOL for the transaction fee',
          'The transaction will be recorded on-chain permanently',
        ],
        estimatedTime: 60,
        skipAllowed: false,
      },
      {
        id: 'step-7-execute-burn',
        title: 'Execute the Burn',
        description:
          '🔥 Ready to Burn!\n\nClick "Burn Tokens" to execute. Here\'s what happens:\n\n1️⃣ Your wallet will prompt for approval\n2️⃣ Transaction is sent to Solana network\n3️⃣ Tokens are permanently destroyed\n4️⃣ You receive a transaction signature\n5️⃣ Updated balance reflects immediately\n\n⏱️ This usually takes 1-3 seconds on Solana.\n\n💾 Save the transaction signature as proof of burn!',
        targetElement: '[data-tutorial="burn-button"]',
        position: 'top',
        validation: {
          type: 'click',
          selector: '[data-tutorial="burn-button"]',
        },
        hints: [
          'Approve the transaction in your wallet',
          'Don\'t close the browser until it completes',
          'The transaction signature is your proof',
          'You can view the burn on Solana Explorer',
        ],
        estimatedTime: 45,
        skipAllowed: false,
      },
      {
        id: 'step-8-burn-success',
        title: 'Burn Complete! 🎉',
        description:
          '✅ Tokens Successfully Burned!\n\nYour tokens have been permanently removed from circulation. Here\'s what you accomplished:\n\n📊 Burn Summary:\n• Tokens burned: [X tokens]\n• Transaction: [signature]\n• Network: [devnet/mainnet]\n• Timestamp: [time]\n\n🎯 Next Steps:\n\n1. Save the transaction signature\n2. Verify on Solana Explorer\n3. Update your community (if applicable)\n4. Monitor the impact on token metrics\n\n💡 Pro Tips:\n• Announce burns to build community trust\n• Regular burns can create scarcity value\n• Use burn events for marketing\n• Track burn history for transparency',
        position: 'center',
        hints: [
          'View the transaction on Solana Explorer for proof',
          'Your wallet balance should update immediately',
          'The burn is now part of the permanent blockchain record',
          'Consider sharing proof of burn with your community',
        ],
        estimatedTime: 60,
        skipAllowed: true,
      },
    ],
    rewards: [
      {
        id: 'achievement-token-burner',
        title: 'Token Burner',
        description: 'Successfully burned tokens and reduced supply',
        category: 'completion',
        icon: 'Flame',
        rarity: 'rare',
        requirements: {
          type: 'complete_tutorial',
          value: 1,
          tutorialIds: ['token-burner-basics'],
        },
      },
    ],
    nextRecommended: ['token-creator-basics', 'multi-sender-basics'],
  },
];

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'achievement-first-token',
    title: 'Token Creator',
    description: 'Created your first SPL token',
    category: 'completion',
    icon: 'Coins',
    rarity: 'common',
    requirements: {
      type: 'complete_tutorial',
      value: 1,
      tutorialIds: ['token-creator-basics'],
    },
  },
  {
    id: 'achievement-first-airdrop',
    title: 'Airdrop Master',
    description: 'Completed your first multi-send',
    category: 'completion',
    icon: 'Send',
    rarity: 'common',
    requirements: {
      type: 'complete_tutorial',
      value: 1,
      tutorialIds: ['multi-sender-basics'],
    },
  },
  {
    id: 'achievement-wallet-generator',
    title: 'Wallet Generator',
    description: 'Created your first batch of wallets',
    category: 'completion',
    icon: 'Wallet',
    rarity: 'common',
    requirements: {
      type: 'complete_tutorial',
      value: 1,
      tutorialIds: ['wallet-creator-basics'],
    },
  },
  {
    id: 'achievement-vanity-master',
    title: 'Vanity Master',
    description: 'Generated your first vanity address',
    category: 'completion',
    icon: 'Sparkles',
    rarity: 'rare',
    requirements: {
      type: 'complete_tutorial',
      value: 1,
      tutorialIds: ['vanity-address-basics'],
    },
  },
  {
    id: 'achievement-tutorial-completionist',
    title: 'Tutorial Completionist',
    description: 'Completed all beginner tutorials',
    category: 'mastery',
    icon: 'Trophy',
    rarity: 'epic',
    requirements: {
      type: 'complete_all_tutorials',
      value: 4,
    },
  },
  {
    id: 'achievement-power-user',
    title: 'Power User',
    description: 'Used all tools in the platform',
    category: 'mastery',
    icon: 'Zap',
    rarity: 'epic',
    requirements: {
      type: 'use_tool',
      value: 5,
      toolIds: ['token-creator', 'multi-sender', 'wallet-creator', 'vanity-address', 'token-burner'],
    },
  },
  {
    id: 'achievement-week-streak',
    title: '7-Day Streak',
    description: 'Logged in for 7 consecutive days',
    category: 'streak',
    icon: 'Flame',
    rarity: 'rare',
    requirements: {
      type: 'streak',
      value: 7,
    },
  },
  {
    id: 'achievement-security-conscious',
    title: 'Security Conscious',
    description: 'Completed the security best practices tutorial',
    category: 'special',
    icon: 'Shield',
    rarity: 'epic',
    requirements: {
      type: 'complete_tutorial',
      value: 1,
      tutorialIds: ['wallet-security'],
    },
  },
];

// ============================================================================
// HELP CONTENT
// ============================================================================

export const HELP_CONTENT: HelpContent[] = [
  {
    id: 'help-token-name',
    elementId: 'token-name',
    title: 'Token Name',
    basic: 'The full name of your token as it will appear in wallets and explorers. This can be descriptive and include spaces.',
    advanced:
      'Token names are stored in the metadata account associated with your mint. They can be up to 32 characters and are case-sensitive. While they can technically be changed by updating metadata, it\'s not recommended as it can confuse holders.',
    examples: ['Solana USD', 'My Project Token', 'Community Rewards'],
    tags: ['token', 'metadata', 'naming'],
    glossaryTerms: [
      {
        term: 'Metadata',
        definition:
          'Additional information about a token stored on-chain, including name, symbol, and logo URI',
        relatedTerms: ['Token', 'SPL'],
      },
    ],
  },
  {
    id: 'help-token-symbol',
    elementId: 'token-symbol',
    title: 'Token Symbol',
    basic: 'A short abbreviation for your token, typically 2-8 uppercase letters. This appears in trading pairs and charts.',
    advanced:
      'Symbols follow the convention of traditional ticker symbols. While Solana doesn\'t enforce uniqueness, using an existing symbol can cause confusion. Common patterns: 3-4 characters for serious projects, longer for meme tokens.',
    risks: [
      'Using an existing popular symbol can confuse users',
      'Symbols cannot be changed once set in metadata',
    ],
    examples: ['SOL', 'USDC', 'RAY', 'ORCA'],
    tags: ['token', 'symbol', 'ticker'],
  },
  {
    id: 'help-token-decimals',
    elementId: 'token-decimals',
    title: 'Token Decimals',
    basic: 'The number of decimal places your token can be divided into. Most tokens use 9 decimals (like SOL), stablecoins typically use 6.',
    advanced:
      'Decimals determine the smallest unit of your token. With 9 decimals, the smallest unit is 0.000000001 (10^-9). This affects how amounts are stored on-chain (as integers) and displayed (with decimal points). Cannot be changed after creation.',
    risks: [
      'Setting decimals too low limits divisibility',
      'Decimals cannot be changed after token creation',
      'Inconsistent decimals can confuse exchanges',
    ],
    examples: [
      'SOL uses 9 decimals',
      'USDC uses 6 decimals',
      'Most NFTs use 0 decimals',
    ],
    tags: ['token', 'decimals', 'precision'],
    glossaryTerms: [
      {
        term: 'Lamport',
        definition: 'The smallest unit of SOL, equal to 0.000000001 SOL (10^-9)',
        relatedTerms: ['SOL', 'Decimals'],
      },
    ],
  },
  {
    id: 'help-total-supply',
    elementId: 'total-supply',
    title: 'Total Supply',
    basic: 'The maximum number of tokens that will ever exist. Consider your tokenomics and distribution plan carefully.',
    advanced:
      'Total supply is minted to the token creator initially, then can be distributed. With mint authority enabled, more can be minted later. Without mint authority (frozen), supply becomes permanently fixed. Popular supplies are often round numbers (1M, 100M, 1B) for psychological reasons.',
    risks: [
      'Too low supply can limit adoption',
      'Too high supply can make token seem less valuable',
      'Consider inflation/deflation mechanisms',
    ],
    examples: [
      'Bitcoin: 21 million (fixed)',
      'Ethereum: Unlimited (inflationary)',
      'Many projects: 1 billion',
    ],
    tags: ['token', 'supply', 'tokenomics'],
    relatedConcepts: ['Mint Authority', 'Token Burns'],
  },
  {
    id: 'help-mint-authority',
    elementId: 'mint-authority',
    title: 'Mint Authority',
    basic: 'The ability to create more tokens after initial creation. You can revoke this to make supply permanently fixed.',
    advanced:
      'Mint authority is a Solana account (usually yours) that can call mint_to instructions. Revoking mint authority is irreversible - it sets the authority to None. Many projects revoke mint authority to prove no more tokens can be created, increasing trust.',
    risks: [
      'Keeping mint authority allows unlimited inflation',
      'Revoking is permanent - cannot be undone',
      'Some DAOs may want to keep it for governance',
    ],
    examples: [
      'USDC: Circle retains mint authority',
      'Most meme coins: Revoked for trust',
    ],
    tags: ['token', 'authority', 'security'],
    articleUrl: 'https://docs.solana.com/developing/programming-model/tokens#authority-delegation',
  },
];

export { LEARNING_PATHS };
