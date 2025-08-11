import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format numbers for display
export function formatNumber(num: number, decimals = 2): string {
  if (num === 0) return '0'
  
  if (num < 0.01) {
    return num.toFixed(6)
  }
  
  if (num < 1) {
    return num.toFixed(4)
  }
  
  if (num < 1000) {
    return num.toFixed(decimals)
  }
  
  if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  
  return `${(num / 1000000).toFixed(1)}M`
}

// Format SOL amount
export function formatSol(lamports: number): string {
  const sol = lamports / 1_000_000_000
  return formatNumber(sol, 4)
}

// Truncate address for display
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return ''
  if (address.length <= chars * 2 + 3) return address
  
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

// Validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Basic validation - Solana addresses are base58 encoded and 32-44 chars
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
    return base58Regex.test(address) && address.length >= 32 && address.length <= 44
  } catch {
    return false
  }
}

// Sleep utility for delays
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  }
}

// Generate random string
export function generateRandomString(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Format date for display
export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), wait)
    }
  }
}

// Local storage helpers with error handling
export const localStorage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  
  remove: (key: string): boolean => {
    try {
      window.localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
}

// URL helpers
export function getExplorerUrl(signature: string, network: 'mainnet' | 'devnet' = 'devnet'): string {
  const cluster = network === 'mainnet' ? '' : `?cluster=${network}`
  return `https://explorer.solana.com/tx/${signature}${cluster}`
}

export function getAddressExplorerUrl(address: string, network: 'mainnet' | 'devnet' = 'devnet'): string {
  const cluster = network === 'mainnet' ? '' : `?cluster=${network}`
  return `https://explorer.solana.com/address/${address}${cluster}`
}