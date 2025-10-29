# Security Suite Quick Start Guide

## 🚀 Quick Implementation Guide for Developers

This guide shows you how to use the new security features in your token creation flow.

---

## 1. Basic Usage - Security Scan

```typescript
import { TokenService } from './services/tokenService';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

function MyComponent() {
  const { connection } = useConnection();
  const wallet = useWallet();

  // Create token service
  const tokenService = new TokenService(connection, wallet);

  // Token configuration
  const params = {
    name: 'My Token',
    symbol: 'MTK',
    decimals: 9,
    initialSupply: 1000000,
    mintAuthority: 'permanent',
    freezeAuthority: false,
    protocol: 'spl',
    enableSecurityScan: true // ✅ Enable security scan
  };

  // Create token (security scan runs automatically)
  const result = await tokenService.createToken(params);

  // Check security data
  if (result.securityScore) {
    console.log('Security Score:', result.securityScore.overall);
    console.log('Grade:', result.securityScore.grade);
    console.log('Recommendations:', result.securityScore.recommendations);
  }

  if (result.riskAssessment) {
    console.log('Risk Level:', result.riskAssessment.riskLevel);
    console.log('Warnings:', result.riskAssessment.warnings);
  }
}
```

---

## 2. Enable JITO MEV Protection

```typescript
const params = {
  // ... basic token params ...
  jitoProtection: true, // ✅ Enable JITO bundles
  jitoTipAmount: 0.005, // Optional: custom tip (default: 0.001 SOL)
};

const result = await tokenService.createToken(params);

// Check if bundle was successful
if (result.bundleId) {
  console.log('JITO Bundle ID:', result.bundleId);
  console.log('MEV Protection: Active ✅');
}
```

**Cost Impact:**
- Adds 0.001-0.01 SOL tip (configurable)
- Protects against front-running
- Guarantees atomic execution

---

## 3. Enable Anti-Snipe Protection

```typescript
const params = {
  // ... basic token params ...
  antiSnipeLevel: 'standard', // Options: 'none', 'basic', 'standard', 'advanced'
};

const result = await tokenService.createToken(params);

console.log('Token will launch with 15-minute delay');
console.log('Max wallet size: 3%');
console.log('Bot protection: Active ✅');
```

**Protection Levels:**
- `none`: No protection (instant launch)
- `basic`: 5 min delay + 5% max wallet
- `standard`: 15 min delay + 3% max wallet + bot blacklist
- `advanced`: 30 min delay + 2% max wallet + whitelist + extended monitoring

---

## 4. Complete Example with All Features

```typescript
const params = {
  // Basic token info
  name: 'Secure Token',
  symbol: 'STKN',
  decimals: 9,
  initialSupply: 10000000,
  description: 'A secure token with MEV protection',

  // Image and metadata
  image: myImageFile, // File object
  website: 'https://mytoken.com',
  twitter: 'https://twitter.com/mytoken',
  telegram: 'https://t.me/mytoken',

  // Authorities
  mintAuthority: 'permanent', // Locked supply
  freezeAuthority: false, // Cannot freeze accounts
  updateAuthority: false, // Immutable metadata

  // Protocol
  protocol: 'spl',

  // 🛡️ SECURITY FEATURES
  jitoProtection: true, // MEV protection
  jitoTipAmount: 0.001, // 0.001 SOL tip
  antiSnipeLevel: 'standard', // 15 min delay + limits
  enableSecurityScan: true, // Pre-creation scan
};

// Create token with full security suite
const result = await tokenService.createToken(params);

// Handle result
if (result.success) {
  console.log('✅ Token Created:', result.mintAddress);
  console.log('📦 Bundle ID:', result.bundleId);
  console.log('🎯 Security Score:', result.securityScore?.overall, '/100');
  console.log('⚠️ Risk Level:', result.riskAssessment?.riskLevel);
  console.log('💡 Recommendations:', result.securityScore?.recommendations);
} else {
  console.error('❌ Creation Failed:', result.error);
}
```

---

## 5. Using SecurityDashboard Component

```typescript
import { SecurityDashboard } from './components/security/SecurityDashboard';

function TokenCreatorStep4() {
  const [formData, setFormData] = useState({
    name: 'My Token',
    symbol: 'MTK',
    // ... other fields ...
    enableSecurityScan: true
  });

  const [securityScore, setSecurityScore] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);

  return (
    <div>
      {/* Your form fields */}

      {/* Security Dashboard */}
      {formData.enableSecurityScan && (
        <SecurityDashboard
          tokenConfig={formData}
          onScoreUpdate={(score) => {
            setSecurityScore(score);
            // You can block creation if score is too low
            if (score.overall < 40) {
              alert('Warning: Security score is below minimum!');
            }
          }}
          onRiskUpdate={(risks) => {
            setRiskAssessment(risks);
            // Block if critical risks found
            if (risks.riskLevel === 'critical') {
              alert('Critical security issues detected!');
            }
          }}
        />
      )}

      {/* Display security status */}
      {securityScore && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <p>Security Score: {securityScore.overall}/100 ({securityScore.grade})</p>
          <p>Status: {riskAssessment?.riskLevel} risk</p>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Cost Estimation with Security Features

```typescript
// Get cost estimate before creation
const estimate = await tokenService.estimateCreationCost({
  name: 'Test',
  symbol: 'TST',
  decimals: 9,
  initialSupply: 1000000,
  mintAuthority: 'permanent',
  freezeAuthority: false,
  protocol: 'spl',

  // Security features
  jitoProtection: true,
  jitoTipAmount: 0.005,
  antiSnipeLevel: 'advanced',
  enableSecurityScan: true
});

console.log('Total Cost:', estimate.total, 'SOL');
console.log('Breakdown:');
Object.entries(estimate.breakdown).forEach(([item, cost]) => {
  console.log(`  ${item}: ${cost} SOL`);
});

/*
Example Output:
Total Cost: 0.01215 SOL
Breakdown:
  Mint Account Rent: 0.00144 SOL
  Transaction Fees: 0.00001 SOL
  Metadata Account: 0.00561 SOL
  IPFS Storage: 0.001 SOL
  JITO MEV Protection: 0.005 SOL
  Anti-Snipe Protection: 0.00006 SOL
  Security Scan: 0 SOL (FREE)
*/
```

---

## 7. Manual Security Analysis

If you want to run security checks without creating a token:

```typescript
import { createSecurityService } from './services/securityService';

const securityService = createSecurityService(connection);

// Analyze existing token
const analysis = await securityService.analyzeTokenSecurity(
  'TokenMintAddressHere...'
);

console.log('Quality Score:', analysis.qualityScore.overall);
console.log('Is Verified:', analysis.isVerified);
console.log('Can Trade:', analysis.canTrade);
console.log('Honeypot Risk:', analysis.honeypotCheck.isHoneypot);
console.log('Rug Pull Score:', analysis.rugPullIndicators.riskScore);

// Analyze token config before creation
const tokenConfig = {
  name: 'Test Token',
  symbol: 'TST',
  decimals: 9,
  supply: 1000000,
  mintAuthority: 'revocable',
  freezeAuthority: true,
  updateAuthority: false,
  protocol: 'spl'
};

const qualityScore = await securityService.calculateQualityScore(tokenConfig);
const riskAssessment = await securityService.scanForRisks(tokenConfig);

console.log('Pre-creation Score:', qualityScore.overall);
console.log('Risks Found:', riskAssessment.risks.length);
console.log('Recommendations:', qualityScore.recommendations);
```

---

## 8. Anti-Snipe Advanced Configuration

```typescript
import { createAntiSnipeService } from './services/antiSnipeService';

const antiSnipeService = createAntiSnipeService(connection);

// Create custom anti-snipe config
const customConfig = antiSnipeService.createConfig('advanced', {
  launchDelay: 60, // 1 hour delay
  maxWalletPercentage: 1, // 1% max
  whitelistEnabled: true,
  whitelist: [
    'WhitelistedWallet1...',
    'WhitelistedWallet2...',
    // ... more addresses
  ],
  blacklistEnabled: true,
  blacklist: [
    'KnownBotAddress1...',
    'KnownBotAddress2...',
    // ... more addresses
  ],
  honeypotPeriod: 30 // 30 min monitoring
});

// Use in token creation
const result = await tokenService.createToken({
  // ... other params ...
  antiSnipeLevel: 'advanced',
  antiSnipeConfig: customConfig
});

// Check launch status
const launchStatus = antiSnipeService.getLaunchStatus(result.mintAddress);
console.log('Launch scheduled for:', new Date(launchStatus.scheduledTime));
console.log('Whitelist phase ends:', new Date(launchStatus.whitelistPhaseEnd));
console.log('Public phase starts:', new Date(launchStatus.publicPhaseStart));
```

---

## 9. JITO Advanced Usage

```typescript
import { createJITOService } from './services/jitoService';

const jitoService = createJITOService(connection, {
  bundleTip: 0.01, // Custom default tip
  maxRetries: 5, // More retries
  retryDelay: 3000 // 3 second delay
});

// Get recommended tip based on network congestion
const recommendedTip = await jitoService.getRecommendedTip();
console.log('Recommended tip:', recommendedTip / 1_000_000_000, 'SOL');

// Estimate bundle cost
const cost = await jitoService.estimateBundleCost(2); // 2 transactions
console.log('Bundle cost:', cost, 'SOL');

// Check if JITO is available
if (jitoService.isAvailable()) {
  console.log('JITO is available on this network');
}

// Get current config
const config = jitoService.getConfig();
console.log('JITO Config:', config);

// Update config
jitoService.updateConfig({
  bundleTip: 0.005,
  maxRetries: 3
});
```

---

## 10. Error Handling Best Practices

```typescript
async function createSecureToken(params) {
  try {
    // Always enable security scan
    params.enableSecurityScan = true;

    // Create token
    const result = await tokenService.createToken(params);

    // Check for critical security issues
    if (result.riskAssessment?.riskLevel === 'critical') {
      throw new Error(
        `Critical security issues: ${result.riskAssessment.criticalIssues.join(', ')}`
      );
    }

    // Warn on low security score
    if (result.securityScore && result.securityScore.overall < 50) {
      console.warn('⚠️ Low security score:', result.securityScore.overall);
      console.warn('Recommendations:', result.securityScore.recommendations);

      // Ask user to confirm
      const confirmed = confirm(
        `Security score is ${result.securityScore.overall}/100. Continue anyway?`
      );
      if (!confirmed) {
        throw new Error('Token creation cancelled due to low security score');
      }
    }

    // Check if JITO bundle failed (fell back to standard tx)
    if (params.jitoProtection && !result.bundleId) {
      console.warn('⚠️ JITO bundle failed, used standard transaction');
      console.warn('MEV protection may be limited');
    }

    // Success!
    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('Token creation failed:', error);

    // Handle specific errors
    if (error.message.includes('Wallet not connected')) {
      return { success: false, error: 'Please connect your wallet' };
    }

    if (error.message.includes('JITO bundle failed')) {
      return { success: false, error: 'MEV protection failed, please try again' };
    }

    if (error.message.includes('Critical security issues')) {
      return { success: false, error: error.message };
    }

    // Generic error
    return { success: false, error: 'Token creation failed, please try again' };
  }
}
```

---

## 📊 Security Score Interpretation

| Score | Grade | Risk Level | Recommendation |
|-------|-------|-----------|----------------|
| 95-100 | A+ | Low | ✅ Ready to launch |
| 85-94 | A | Low | ✅ Good to go |
| 70-84 | B | Medium | ⚠️ Review recommendations |
| 55-69 | C | Medium-High | ⚠️ Improvements advised |
| 40-54 | D | High | 🚫 Changes required |
| 0-39 | F | Critical | 🚫 Do not launch |

---

## 🎯 Common Patterns

### Pattern 1: Maximum Security
```typescript
{
  mintAuthority: 'permanent', // Locked supply
  freezeAuthority: false, // Cannot freeze
  updateAuthority: false, // Immutable
  jitoProtection: true, // MEV protected
  antiSnipeLevel: 'advanced', // Maximum protection
  enableSecurityScan: true // Pre-check
}
// Expected Score: 85-95 (A/A+)
```

### Pattern 2: Community Token
```typescript
{
  mintAuthority: 'revocable', // Can mint more
  freezeAuthority: false, // No freezing
  updateAuthority: true, // Can update
  jitoProtection: false, // Save costs
  antiSnipeLevel: 'basic', // Basic protection
  enableSecurityScan: true // Always scan
}
// Expected Score: 60-75 (C/B)
```

### Pattern 3: Utility Token
```typescript
{
  mintAuthority: 'revocable', // Flexible supply
  freezeAuthority: true, // Can freeze bad actors
  updateAuthority: true, // Can update metadata
  jitoProtection: true, // Protect launch
  antiSnipeLevel: 'standard', // Fair launch
  enableSecurityScan: true // Check config
}
// Expected Score: 65-80 (C/B)
```

---

## 🔧 Troubleshooting

### JITO Bundle Fails
```typescript
// Check if JITO is available
if (!jitoService.isAvailable()) {
  console.log('JITO not available, using standard transaction');
  params.jitoProtection = false;
}

// Increase tip on high congestion
const recommendedTip = await jitoService.getRecommendedTip();
if (recommendedTip > 0.001 * 1_000_000_000) {
  params.jitoTipAmount = recommendedTip / 1_000_000_000;
}
```

### Low Security Score
```typescript
// Get specific recommendations
const { score, risks } = await tokenService.performSecurityScan(params);

console.log('Improving your score:');
score.recommendations.forEach(rec => {
  console.log('  -', rec);
});

// Fix common issues
if (score.components.authorities < 70) {
  params.mintAuthority = 'permanent'; // +30 points
  params.freezeAuthority = false; // +15 points
}

if (score.components.metadata < 70) {
  // Add description, image, social links
}
```

### Anti-Snipe Not Working
```typescript
// Verify setup
const launchStatus = antiSnipeService.getLaunchStatus(mintAddress);
if (!launchStatus) {
  console.error('Anti-snipe not configured');
}

// Check if launch is active
if (launchStatus.status === 'scheduled') {
  const timeUntilLaunch = launchStatus.scheduledTime - Date.now();
  console.log('Launch in:', timeUntilLaunch / 1000 / 60, 'minutes');
}
```

---

## 📚 Additional Resources

- [Full Implementation Guide](./SECURITY_SUITE_IMPLEMENTATION.md)
- [API Documentation](./docs/api/)
- [Security Best Practices](./docs/security/)
- [JITO Documentation](https://docs.jito.wtf/)

---

**Questions?** Check the main implementation doc or create an issue on GitHub.
