import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { 
  Search, 
  Clock, 
  Info, 
  Copy, 
  Download,
  Play,
  Square,
  Eye,
  EyeOff,
  Cpu,
  Target,
  ArrowRight
} from 'lucide-react';
import { Keypair } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import analytics from '@/services/analytics';

// Progress component (inline since it may not exist in your UI library)
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);

// Types
interface VanityResult {
  publicKey: string;
  secretKey: string;
  iterations: number;
  pattern: string;
  matchType: 'prefix' | 'suffix' | 'both';
  timeElapsed: number;
}

interface GenerationStats {
  totalAttempts: number;
  attemptsPerSecond: number;
  timeElapsed: number;
  isRunning: boolean;
}

// Difficulty estimation based on pattern length and type
const estimateDifficulty = (pattern: string, type: 'prefix' | 'suffix' | 'both'): number => {
  if (!pattern) return 0;
  
  // Base58 alphabet has 58 characters, but Solana addresses use base58 with restrictions
  const base = 44; // Effective character set size for Solana addresses
  const patternLength = pattern.length;
  
  let attempts = Math.pow(base, patternLength);
  if (type === 'both') attempts *= 2; // More complex for both prefix and suffix
  
  return attempts;
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const VanityGenerator: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [prefixPattern, setPrefixPattern] = useState('');
  const [suffixPattern, setSuffixPattern] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1000000);
  const [results, setResults] = useState<VanityResult[]>([]);
  const [stats, setStats] = useState<GenerationStats>({
    totalAttempts: 0,
    attemptsPerSecond: 0,
    timeElapsed: 0,
    isRunning: false
  });
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Validate pattern - only valid base58 characters
  const validatePattern = (pattern: string): boolean => {
    const validChars = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return validChars.test(pattern);
  };

  const getDifficultyColor = (attempts: number) => {
    if (attempts < 1000) return 'text-green-600';
    if (attempts < 100000) return 'text-yellow-600';
    if (attempts < 10000000) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDifficultyText = (attempts: number) => {
    if (attempts < 100) return 'Very Easy';
    if (attempts < 1000) return 'Easy';
    if (attempts < 100000) return 'Moderate';
    if (attempts < 1000000) return 'Hard';
    if (attempts < 10000000) return 'Very Hard';
    return 'Extremely Hard';
  };

  // Generate vanity address
  const generateVanityAddress = async () => {
    if (!prefixPattern && !suffixPattern) {
      alert('Please enter at least a prefix or suffix pattern');
      return;
    }

    const prefix = caseSensitive ? prefixPattern : prefixPattern.toLowerCase();
    const suffix = caseSensitive ? suffixPattern : suffixPattern.toLowerCase();

    if ((prefix && !validatePattern(prefix)) || (suffix && !validatePattern(suffix))) {
      alert('Pattern contains invalid characters. Use only valid base58 characters (1-9, A-H, J-N, P-Z, a-k, m-z)');
      return;
    }

    analytics.track('vanity_generation_started', {
      prefix: prefix,
      suffix: suffix,
      caseSensitive,
      maxAttempts
    });

    setStats(prev => ({ ...prev, isRunning: true, totalAttempts: 0, timeElapsed: 0 }));
    startTimeRef.current = Date.now();

    // Update stats every 100ms
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setStats(prev => ({
        ...prev,
        timeElapsed: elapsed,
        attemptsPerSecond: prev.totalAttempts / elapsed
      }));
    }, 100);

    try {
      let found = false;
      let attempts = 0;

      while (!found && attempts < maxAttempts) {
        const keypair = Keypair.generate();
        const address = keypair.publicKey.toString();
        const checkAddress = caseSensitive ? address : address.toLowerCase();
        
        attempts++;
        setStats(prev => ({ ...prev, totalAttempts: attempts }));

        let matches = false;
        let matchType: 'prefix' | 'suffix' | 'both' = 'prefix';

        if (prefix && suffix) {
          if (checkAddress.startsWith(prefix) && checkAddress.endsWith(suffix)) {
            matches = true;
            matchType = 'both';
          }
        } else if (prefix && checkAddress.startsWith(prefix)) {
          matches = true;
          matchType = 'prefix';
        } else if (suffix && checkAddress.endsWith(suffix)) {
          matches = true;
          matchType = 'suffix';
        }

        if (matches) {
          const result: VanityResult = {
            publicKey: address,
            secretKey: Array.from(keypair.secretKey).join(','),
            iterations: attempts,
            pattern: prefix + (suffix ? '...' + suffix : ''),
            matchType,
            timeElapsed: (Date.now() - startTimeRef.current) / 1000
          };

          setResults(prev => [result, ...prev]);
          found = true;

          analytics.track('vanity_generation_completed', {
            iterations: attempts,
            timeElapsed: result.timeElapsed,
            pattern: result.pattern,
            matchType: result.matchType
          });
        }

        // Yield control every 1000 iterations to keep UI responsive
        if (attempts % 1000 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      if (!found) {
        analytics.track('vanity_generation_timeout', {
          maxAttempts,
          timeElapsed: (Date.now() - startTimeRef.current) / 1000
        });
        alert(`No matching address found after ${maxAttempts.toLocaleString()} attempts. Try a shorter pattern or increase max attempts.`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      analytics.track('vanity_generation_error', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      stopGeneration();
    }
  };

  const stopGeneration = () => {
    setStats(prev => ({ ...prev, isRunning: false }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    analytics.track('vanity_address_copied', { type });
  };

  const exportResults = () => {
    if (results.length === 0) return;

    const exportData = results.map(result => ({
      address: result.publicKey,
      privateKey: showPrivateKeys ? result.secretKey : '[HIDDEN]',
      iterations: result.iterations,
      pattern: result.pattern,
      timeElapsed: result.timeElapsed
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vanity-addresses-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    analytics.track('vanity_results_exported', { count: results.length });
  };

  const sendToMultiSender = () => {
    if (results.length === 0) return;

    const recipients = results.map(result => ({
      address: result.publicKey,
      amount: 0.1, // Default amount
      isValid: true,
      source: 'vanity'
    }));

    localStorage.setItem('multiSenderRecipients', JSON.stringify(recipients));
    analytics.track('vanity_addresses_sent_to_multisender', { count: results.length });
    alert(`${results.length} addresses sent to Multi-Sender tool!`);
  };

  const prefixDifficulty = estimateDifficulty(prefixPattern, 'prefix');
  const suffixDifficulty = estimateDifficulty(suffixPattern, 'suffix');
  const totalDifficulty = prefixPattern && suffixPattern 
    ? estimateDifficulty(prefixPattern + suffixPattern, 'both')
    : Math.max(prefixDifficulty, suffixDifficulty);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vanity Address Generator</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate custom Solana addresses with specific patterns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <Target className="w-4 h-4 mr-1" />
            Pattern Matching
          </Badge>
          {connected && (
            <Badge variant="outline">
              Connected: {publicKey?.toString().slice(0, 8)}...
            </Badge>
          )}
        </div>
      </div>

      {/* Performance Warning */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                Performance Notice
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Generating vanity addresses is computationally intensive. Longer patterns may take significant time. 
                Consider using shorter patterns or running this in a dedicated tab.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-4">
          {/* Pattern Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Pattern Configuration
              </CardTitle>
              <CardDescription>
                Define the patterns for your vanity address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prefix Pattern
                </label>
                <Input 
                  placeholder="e.g., ABC, 123, Sol"
                  value={prefixPattern}
                  onChange={(e) => setPrefixPattern(e.target.value)}
                  className="font-mono"
                  maxLength={8}
                />
                {prefixPattern && (
                  <div className="flex items-center justify-between text-xs">
                    <span className={getDifficultyColor(prefixDifficulty)}>
                      {getDifficultyText(prefixDifficulty)} (~{prefixDifficulty.toLocaleString()} attempts)
                    </span>
                    <span className="text-gray-500">
                      Valid: {validatePattern(prefixPattern) ? '✓' : '✗'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Suffix Pattern (Optional)
                </label>
                <Input 
                  placeholder="e.g., XYZ, 999"
                  value={suffixPattern}
                  onChange={(e) => setSuffixPattern(e.target.value)}
                  className="font-mono"
                  maxLength={8}
                />
                {suffixPattern && (
                  <div className="flex items-center justify-between text-xs">
                    <span className={getDifficultyColor(suffixDifficulty)}>
                      {getDifficultyText(suffixDifficulty)} (~{suffixDifficulty.toLocaleString()} attempts)
                    </span>
                    <span className="text-gray-500">
                      Valid: {validatePattern(suffixPattern) ? '✓' : '✗'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="caseSensitive"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="caseSensitive" className="text-sm text-gray-700 dark:text-gray-300">
                  Case sensitive matching
                </label>
              </div>

              <NumberInput
                label="Max Attempts"
                description="Maximum number of wallet generation attempts"
                value={maxAttempts}
                onChange={(val) => setMaxAttempts(val ?? 1000000)}
                min={1000}
                max={100000000}
                step={1000}
                allowDecimal={false}
                allowEmpty={false}
              />

              {(prefixPattern || suffixPattern) && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Combined Difficulty:</span>
                      <span className={`font-bold ${getDifficultyColor(totalDifficulty)}`}>
                        {getDifficultyText(totalDifficulty)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Expected attempts: ~{totalDifficulty.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generation Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  onClick={generateVanityAddress} 
                  disabled={stats.isRunning || (!prefixPattern && !suffixPattern)}
                  className="flex-1"
                >
                  {stats.isRunning ? (
                    <>
                      <Cpu className="w-4 h-4 mr-2 animate-pulse" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Generation
                    </>
                  )}
                </Button>
                {stats.isRunning && (
                  <Button variant="destructive" onClick={stopGeneration}>
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>

              {stats.isRunning && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Attempts: {stats.totalAttempts.toLocaleString()}</span>
                    <span>{stats.attemptsPerSecond.toFixed(0)}/sec</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Time: {formatTime(stats.timeElapsed)}</span>
                    <span>ETA: {totalDifficulty > 0 ? formatTime((totalDifficulty - stats.totalAttempts) / Math.max(stats.attemptsPerSecond, 1)) : 'Unknown'}</span>
                  </div>
                  <Progress 
                    value={Math.min((stats.totalAttempts / Math.max(totalDifficulty, 1)) * 100, 99)} 
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Addresses ({results.length})</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                >
                  {showPrivateKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                {results.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={exportResults}>
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                    <Button size="sm" onClick={sendToMultiSender}>
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Multi-Sender
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Addresses matching your pattern will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No addresses generated yet</p>
                <p className="text-sm mt-1">Start generation to see results here</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {result.matchType === 'both' ? 'Prefix + Suffix' : 
                           result.matchType === 'prefix' ? 'Prefix Match' : 'Suffix Match'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {result.iterations.toLocaleString()} attempts • {formatTime(result.timeElapsed)}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Address:</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.publicKey, 'address')}
                            className="h-6 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <code className="text-xs font-mono break-all bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                          {result.publicKey}
                        </code>
                      </div>

                      {showPrivateKeys && (
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Private Key:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(result.secretKey, 'privateKey')}
                              className="h-6 px-2"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <code className="text-xs font-mono break-all bg-red-50 dark:bg-red-950 p-2 rounded block border border-red-200 dark:border-red-800">
                            [{result.secretKey}]
                          </code>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips & Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Generation Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">For Faster Generation:</h4>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>• Use shorter patterns (3-4 characters)</li>
                  <li>• Avoid uncommon characters (0, O, I, l)</li>
                  <li>• Use prefix only (faster than suffix)</li>
                  <li>• Run in a dedicated browser tab</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Character Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Valid Characters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">Base58 Characters:</h4>
                <div className="text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>Numbers:</strong> 1, 2, 3, 4, 5, 6, 7, 8, 9</p>
                  <p><strong>Uppercase:</strong> A-H, J-N, P-Z</p>
                  <p><strong>Lowercase:</strong> a-k, m-z</p>
                  <p className="text-red-600"><strong>Excluded:</strong> 0, O, I, l (ambiguous)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VanityGenerator;