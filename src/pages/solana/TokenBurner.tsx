// src/pages/solana/TokenBurner.tsx
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function TokenBurner() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <span className="text-2xl">🔥</span>
          <h1 className="text-2xl font-bold">Token Burner</h1>
          <Badge variant="solana">Solana</Badge>
        </div>
        <p className="text-muted-foreground">
          Permanently remove SPL tokens from circulation
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>🚧 Coming in Step 5</CardTitle>
          <CardDescription>Token burning utility</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-4xl mb-4">🔥</div>
          <h3 className="text-lg font-semibold mb-2">Token Burner</h3>
          <p className="text-muted-foreground mb-4">
            Permanently burn SPL tokens to reduce total supply
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