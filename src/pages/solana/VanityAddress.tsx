import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Zap, Clock, AlertTriangle, Info } from 'lucide-react';

const VanityGenerator: React.FC = () => {
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
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <Search className="w-4 h-4 mr-1" />
          Solana Network
        </Badge>
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
                Generating vanity addresses can be computationally intensive. 
                Longer patterns may take significant time to find.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pattern Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Pattern Settings
            </CardTitle>
            <CardDescription>
              Define the pattern for your vanity address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prefix Pattern
              </label>
              <Input 
                placeholder="e.g., ABC, 123, Sol"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Case-sensitive. Valid characters: A-Z, a-z, 1-9
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suffix Pattern (Optional)
              </label>
              <Input 
                placeholder="e.g., XYZ, 999"
                className="font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to search prefix only
              </p>
            </div>

            <div className="space-y-2">
              <Button className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Start Generation
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Zap className="w-4 h-4 mr-2" />
                Stop Generation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generation Status */}
        <Card>
          <CardHeader>
            <CardTitle>Generation Status</CardTitle>
            <CardDescription>Real-time generation progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Ready to generate</p>
              <p className="text-sm mt-1">Enter a pattern and click "Start Generation"</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Addresses</CardTitle>
          <CardDescription>
            Addresses matching your pattern will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No addresses generated yet</p>
            <p className="text-sm mt-1">Matching addresses will be displayed here when found</p>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Estimator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-medium">3-4 Characters</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ~1-30 seconds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-medium">5-6 Characters</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ~30 seconds - 30 minutes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-medium">7+ Characters</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hours to days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Generation Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Faster Generation:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Use shorter patterns (3-4 characters)</li>
                <li>• Avoid uncommon characters (0, O, I, l)</li>
                <li>• Use prefix only (no suffix)</li>
                <li>• Consider case flexibility</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 dark:text-white">Valid Characters:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Numbers: 1, 2, 3, 4, 5, 6, 7, 8, 9</li>
                <li>• Uppercase: A-Z (except O, I)</li>
                <li>• Lowercase: a-z (except o, i, l)</li>
                <li>• Case-sensitive matching</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VanityGenerator;