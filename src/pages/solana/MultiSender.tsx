import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { useSolanaWallet } from '../../contexts/SolanaWalletContext'
import { ArrowRight, Upload, Download, Send } from 'lucide-react'

export default function MultiSender() {
  const { connected } = useSolanaWallet()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-2xl">↗️</span>
          <h1 className="text-2xl font-bold">Multi-Sender</h1>
          <Badge variant="solana">Solana</Badge>
        </div>
        <p className="text-muted-foreground">
          Send SOL and SPL tokens to multiple recipients in batch transactions
        </p>
      </div>

      {/* Connection Required */}
      {!connected ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Wallet Connection Required
            </h3>
            <p className="text-yellow-700 mb-4">
              Please connect your Solana wallet to use the Multi-Sender tool
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center py-6">
                <Send className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <CardTitle className="text-base">Send SOL</CardTitle>
                <CardDescription className="text-sm">
                  Batch send native SOL tokens
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center py-6">
                <Upload className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <CardTitle className="text-base">Import CSV</CardTitle>
                <CardDescription className="text-sm">
                  Upload recipient list from file
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="text-center py-6">
                <Download className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <CardTitle className="text-base">Export Results</CardTitle>
                <CardDescription className="text-sm">
                  Download transaction results
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Main Tool Interface */}
          <Card>
            <CardHeader>
              <CardTitle>🚧 Tool Under Development</CardTitle>
              <CardDescription>
                The Multi-Sender tool is being implemented in Step 4 of our development process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold mb-2">Coming Very Soon!</h3>
                <p className="text-muted-foreground mb-6">
                  We're currently working on implementing the complete Multi-Sender functionality 
                  with CSV import, batch processing, and transaction tracking.
                </p>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Wallet connection system - Complete</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>UI framework and routing - Complete</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span>Multi-sender logic - In Progress</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span>Transaction batching - Next</span>
                  </div>
                </div>

                <Button className="mt-6" variant="outline" asChild>
                  <a href="/dashboard">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}