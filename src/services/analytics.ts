// src/services/analytics.ts - Complete & TypeScript Error Fixed
import posthog from 'posthog-js'
import { track } from '@vercel/analytics/react'
import * as Sentry from '@sentry/react'

// Initialize PostHog
if (typeof window !== 'undefined') {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY || '', {
    api_host: 'https://app.posthog.com',
    disable_session_recording: !import.meta.env.VITE_ENABLE_ANALYTICS,
    loaded: (posthog) => {
      if (import.meta.env.DEV) posthog.debug()
    }
  })
}

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
})

// Type-safe analytics properties (fixes TypeScript error)
type AnalyticsProperties = Record<string, string | number | boolean>

// Safe conversion for Vercel Analytics (fixes the TypeScript error)
const safeTrack = (event: string, properties?: Record<string, any>) => {
  if (!properties) {
    track(event)
    return
  }
  
  // Convert all values to Vercel Analytics compatible types
  const safeProperties: AnalyticsProperties = {}
  Object.entries(properties).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      safeProperties[key] = 'undefined'
    } else if (typeof value === 'object') {
      safeProperties[key] = JSON.stringify(value)
    } else {
      safeProperties[key] = value
    }
  })
  
  track(event, safeProperties)
}

interface PerformanceMetric {
  name: string
  value: number
  unit?: string
  metadata?: Record<string, any>
}

interface TransactionEvent {
  type: string
  amount?: number
  signature?: string
  error?: string
  network?: string
}

interface BatchOperation {
  operation: string
  totalItems: number
  completed: number
  failed: number
  duration?: number
}

class AnalyticsService {
  private sessionStartTime: number = Date.now()
  
  // Core tracking method
  track(event: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined') return
    
    try {
      // PostHog tracking
      if (posthog) {
        posthog.capture(event, properties)
      }
      
      // Vercel Analytics (with type safety)
      safeTrack(event, properties)
      
      // Development logging
      if (import.meta.env.DEV) {
        console.log('🎯 Analytics Event:', { event, properties })
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
      this.captureError(error as Error, { context: 'analytics_tracking' })
    }
  }

  // Performance metrics
  performanceMetric(metric: PerformanceMetric) {
    this.track('performance_metric', {
      metric_name: metric.name,
      metric_value: metric.value.toString(), // Convert to string for Vercel Analytics
      metric_unit: metric.unit || 'ms',
      ...metric.metadata
    })
  }

  // User identification
  identify(userId: string, traits?: Record<string, any>) {
    if (typeof window === 'undefined') return
    
    try {
      posthog?.identify(userId, traits)
      Sentry.setUser({ id: userId, ...traits })
      
      this.track('user_identified', {
        user_id: userId,
        traits_count: traits ? Object.keys(traits).length.toString() : '0'
      })
    } catch (error) {
      this.captureError(error as Error, { context: 'user_identification' })
    }
  }

  // Page tracking
  pageView(page: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page,
      timestamp: new Date().toISOString(),
      session_duration: ((Date.now() - this.sessionStartTime) / 1000).toString(),
      ...properties
    })
  }

  // Wallet Events
  walletConnected(walletName: string, publicKey: string, network: string = 'solana') {
    this.track('wallet_connected', {
      wallet_name: walletName,
      public_key_prefix: publicKey.slice(0, 8),
      network,
      timestamp: new Date().toISOString()
    })
  }

  walletDisconnected(walletName?: string) {
    this.track('wallet_disconnected', {
      wallet_name: walletName || 'unknown',
      session_duration: ((Date.now() - this.sessionStartTime) / 1000).toString()
    })
  }

  walletSwitched(fromWallet: string, toWallet: string) {
    this.track('wallet_switched', {
      from_wallet: fromWallet,
      to_wallet: toWallet,
      timestamp: new Date().toISOString()
    })
  }

  // Transaction Events (Fixed TypeScript errors)
  transactionInitiated(event: TransactionEvent) {
    this.track('transaction_initiated', {
      transaction_type: event.type,
      amount: event.amount?.toString() || '0', // Convert to string
      network: event.network || 'solana',
      timestamp: new Date().toISOString()
    })
  }

  transactionConfirmed(event: TransactionEvent) {
    this.track('transaction_confirmed', {
      transaction_type: event.type,
      amount: event.amount?.toString() || '0', // Convert to string
      signature_prefix: event.signature?.slice(0, 8) || '',
      network: event.network || 'solana'
    })
  }

  transactionFailed(event: TransactionEvent) {
    this.track('transaction_failed', {
      transaction_type: event.type,
      amount: event.amount?.toString() || '0', // Convert to string
      error_message: event.error || 'unknown',
      network: event.network || 'solana'
    })
    
    // Also send to Sentry for error tracking
    this.captureError(new Error(`Transaction failed: ${event.error}`), {
      transaction_type: event.type,
      amount: event.amount,
      network: event.network
    })
  }

  // Network Events
  networkSwitched(from: string, to: string) {
    this.track('network_switched', {
      from_network: from,
      to_network: to,
      timestamp: new Date().toISOString()
    })
  }

  // Tool Usage Events
  toolUsed(toolName: string, network: string, action: string, metadata?: Record<string, any>) {
    this.track('tool_used', {
      tool_name: toolName,
      network,
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    })
  }

  toolSession(toolName: string, duration: number, actions: number) {
    this.track('tool_session_completed', {
      tool_name: toolName,
      session_duration: duration.toString(),
      actions_performed: actions.toString(),
      timestamp: new Date().toISOString()
    })
  }

  // Batch Operations (for Multi-Sender tool)
  batchOperationStarted(operation: BatchOperation) {
    this.track('batch_operation_started', {
      operation_type: operation.operation,
      total_items: operation.totalItems.toString(),
      timestamp: new Date().toISOString()
    })
  }

  batchOperationCompleted(operation: BatchOperation) {
    this.track('batch_operation_completed', {
      operation_type: operation.operation,
      total_items: operation.totalItems.toString(),
      completed_items: operation.completed.toString(),
      failed_items: operation.failed.toString(),
      success_rate: ((operation.completed / operation.totalItems) * 100).toString(),
      duration: operation.duration?.toString() || '0'
    })
  }

  batchOperationProgress(operation: string, completed: number, total: number) {
    this.track('batch_operation_progress', {
      operation_type: operation,
      completed_items: completed.toString(),
      total_items: total.toString(),
      progress_percentage: ((completed / total) * 100).toString()
    })
  }

  // CSV Operations
  csvUploaded(fileName: string, rowCount: number, toolName: string) {
    this.track('csv_uploaded', {
      file_name: fileName,
      row_count: rowCount.toString(),
      tool_name: toolName,
      file_size_category: rowCount > 1000 ? 'large' : rowCount > 100 ? 'medium' : 'small'
    })
  }

  csvProcessed(fileName: string, validRows: number, invalidRows: number, toolName: string) {
    this.track('csv_processed', {
      file_name: fileName,
      valid_rows: validRows.toString(),
      invalid_rows: invalidRows.toString(),
      tool_name: toolName,
      validation_success_rate: ((validRows / (validRows + invalidRows)) * 100).toString()
    })
  }

  // Error Handling
  captureError(error: Error, context?: Record<string, any>) {
    // Sentry integration
    Sentry.captureException(error, { 
      extra: context,
      tags: {
        component: context?.component || 'unknown',
        action: context?.action || 'unknown'
      }
    })
    
    // PostHog error tracking
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack?.slice(0, 200) || '',
      error_name: error.name,
      ...context
    })
  }

  // Feature Usage & A/B Testing
  featureUsed(feature: string, variant?: string, metadata?: Record<string, any>) {
    this.track('feature_used', {
      feature_name: feature,
      variant: variant || 'default',
      timestamp: new Date().toISOString(),
      ...metadata
    })
  }

  featureFlagEvaluated(flag: string, value: boolean, userId?: string) {
    this.track('feature_flag_evaluated', {
      flag_name: flag,
      flag_value: value.toString(),
      user_id: userId || 'anonymous'
    })
  }

  // User Engagement
  timeSpentOnTool(toolName: string, seconds: number) {
    this.track('time_spent_on_tool', {
      tool_name: toolName,
      duration_seconds: seconds.toString(),
      duration_category: seconds > 300 ? 'long' : seconds > 60 ? 'medium' : 'short'
    })
  }

  searchPerformed(query: string, results: number, context: string) {
    this.track('search_performed', {
      search_query: query.toLowerCase(),
      results_count: results.toString(),
      search_context: context,
      query_length: query.length.toString()
    })
  }

  helpRequested(section: string, toolName?: string) {
    this.track('help_requested', {
      help_section: section,
      tool_name: toolName || 'general',
      timestamp: new Date().toISOString()
    })
  }

  // User Properties
  setUserProperties(properties: Record<string, any>) {
    if (typeof window === 'undefined') return
    
    try {
      posthog?.setPersonProperties(properties)
      Sentry.setUser(properties)
    } catch (error) {
      this.captureError(error as Error, { context: 'set_user_properties' })
    }
  }

  // Session Management
  sessionStarted() {
    this.sessionStartTime = Date.now()
    this.track('session_started', {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  }

  sessionEnded() {
    const duration = Date.now() - this.sessionStartTime
    this.track('session_ended', {
      session_duration: (duration / 1000).toString(),
      timestamp: new Date().toISOString()
    })
  }

  // Debug utilities
  debug() {
    if (import.meta.env.DEV) {
      console.log('🔍 Analytics Service Status:', {
        posthogEnabled: !!import.meta.env.VITE_POSTHOG_KEY,
        sentryEnabled: !!import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        sessionDuration: (Date.now() - this.sessionStartTime) / 1000
      })
    }
  }

  // Health check
  isHealthy(): boolean {
    return typeof window !== 'undefined' && 
           (!!import.meta.env.VITE_POSTHOG_KEY || !!import.meta.env.VITE_SENTRY_DSN)
  }
}

// Create singleton instance
const analytics = new AnalyticsService()

// Initialize session tracking
if (typeof window !== 'undefined') {
  analytics.sessionStarted()
  
  // Track page unload
  window.addEventListener('beforeunload', () => {
    analytics.sessionEnded()
  })
}

// Named exports for backward compatibility
export { analytics }

// Default export for easier importing
export default analytics