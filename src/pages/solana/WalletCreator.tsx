// src/pages/solana/WalletCreator.tsx
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function WalletCreator() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-2xl">👛</span>
          <h1 className="text-2xl font-bold">Wallet Creator</h1>
          <Badge variant="solana">Solana</Badge>
        </div>
        <p className="text-muted-foreground">
          Generate multiple Solana wallets with secure private key export
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>🚧 Coming in Step 5</CardTitle>
          <CardDescription>Bulk wallet generation tool</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-4xl mb-4">👛</div>
          <h3 className="text-lg font-semibold mb-2">Wallet Creator Tool</h3>
          <p className="text-muted-foreground mb-4">
            Generate multiple Solana wallets with secure export options
          </p>
          <Button variant="outline" asChild>
            <a href="/dashboard">
              <ArrowRight className="mr-2 h-4 w-4" />
              Back to Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

