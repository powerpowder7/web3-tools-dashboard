import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './sidebar/Sidebar'
import { Button } from './ui/button'
import WalletButton from './common/WalletButton'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed left-0 top-0 h-full w-64">
          <Sidebar onItemClick={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo and title */}
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🛠️</div>
              <div>
                <h1 className="text-lg font-semibold">Web3Tools</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Professional Blockchain Development Suite
                </p>
              </div>
            </div>
          </div>

          {/* Header actions */}
          <div className="flex items-center space-x-4">
            {/* Network indicator */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-solana rounded-full animate-pulse"></div>
              <span>Solana Devnet</span>
            </div>

            {/* Wallet button */}
            <WalletButton />
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}