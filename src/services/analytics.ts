// src/services/analytics.ts - FINAL VERSION WITH ALL FIXES
import { track } from '@vercel/analytics';
import * as Sentry from '@sentry/react';

// PostHog configuration
let posthog: any = null;

if (typeof window !== 'undefined') {
  import('posthog-js').then((posthogModule) => {
    posthog = posthogModule.default;
    posthog.init(import.meta.env.VITE_POSTHOG_KEY || 'phc_test', {
      api_host: 'https://app.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false,
    });
  }).catch(console.error);
}

// Type definitions
interface PerformanceMetric {
  name: string;
  value: number;
  unit?: string;
  metadata?: Record<string, any>;
}

interface WalletConnectedEvent {
  wallet_type: string;
  network: string;
  address: string;
  connection_time?: number;
}

interface TransactionEvent {
  type: 'sent' | 'received' | 'swap' | 'stake';
  network: string;
  amount?: number;
  token?: string;
  from_address?: string;
  to_address?: string;
  signature?: string;
  fee?: number;
  status: 'initiated' | 'pending' | 'confirmed' | 'failed';
}

interface ToolUsageEvent {
  tool_name: string;
  action: string;
  network?: string;
  success?: boolean;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface BatchOperationEvent {
  operation_type: 'multi_send' | 'wallet_creation' | 'token_creation';
  batch_size: number;
  success_count: number;
  failure_count: number;
  total_amount?: number;
  duration: number;
  network: string;
}

interface CSVEvent {
  filename: string;
  rows: number;
  columns: string[];
  file_size: number;
  processing_time?: number;
}

// Analytics service class
class AnalyticsService {
  private isEnabled = false;

  constructor() {
    this.isEnabled = import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  }

  // Core tracking method with proper Vercel Analytics type safety
  private safeTrack(event: string, properties: Record<string, any> = {}) {
    if (!this.isEnabled) return;

    try {
      // Convert all values to Vercel Analytics compatible types
      const safeProperties: Record<string, string | number | boolean> = {};
      for (const [key, value] of Object.entries(properties)) {
        if (value !== undefined && value !== null) {
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            safeProperties[key] = value;
          } else {
            safeProperties[key] = String(value);
          }
        }
      }

      // Track with Vercel Analytics
      track(event, safeProperties);

      // Track with PostHog
      if (posthog?.capture) {
        posthog.capture(event, properties);
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Main tracking method
  track(event: string, properties?: Record<string, any>) {
    this.safeTrack(event, {
      timestamp: Date.now(),
      ...properties
    });
  }

  // Track events (alias for track)
  trackEvent(event: string, properties?: Record<string, any>) {
    this.track(event, properties);
  }

  // Performance metrics
  performanceMetric(metric: PerformanceMetric) {
    this.safeTrack('performance_metric', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_unit: metric.unit || 'ms',
      ...metric.metadata
    });
  }

  // Page views
  pageView(path: string, title?: string) {
    this.safeTrack('page_view', {
      page_path: path,
      page_title: title || (typeof document !== 'undefined' ? document.title : ''),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now()
    });
  }

  // Wallet events
  walletConnected(event: WalletConnectedEvent) {
    this.safeTrack('wallet_connected', {
      wallet_type: event.wallet_type,
      network: event.network,
      address_hash: event.address.slice(0, 6) + '...' + event.address.slice(-4),
      connection_time: event.connection_time?.toString()
    });
  }

  walletDisconnected(wallet_type: string) {
    this.safeTrack('wallet_disconnected', {
      wallet_type
    });
  }

  // Transaction tracking
  transactionInitiated(transaction: TransactionEvent) {
    this.safeTrack('transaction_initiated', {
      tx_type: transaction.type,
      network: transaction.network,
      amount: transaction.amount?.toString(),
      token: transaction.token,
      signature: transaction.signature
    });
  }

  transactionConfirmed(signature: string, network: string) {
    this.safeTrack('transaction_confirmed', {
      signature,
      network
    });
  }

  transactionFailed(error: string, signature?: string) {
    this.safeTrack('transaction_failed', {
      error_message: error,
      signature
    });
  }

  // Tool usage
  toolUsed(event: ToolUsageEvent) {
    this.safeTrack('tool_used', {
      tool_name: event.tool_name,
      action: event.action,
      network: event.network,
      success: event.success,
      duration: event.duration?.toString(),
      error_message: event.error,
      ...event.metadata
    });
  }

  // Batch operations
  batchOperationCompleted(event: BatchOperationEvent) {
    this.safeTrack('batch_operation_completed', {
      operation_type: event.operation_type,
      batch_size: event.batch_size.toString(),
      success_count: event.success_count.toString(),
      failure_count: event.failure_count.toString(),
      total_amount: event.total_amount?.toString(),
      duration: event.duration.toString(),
      network: event.network,
      success_rate: ((event.success_count / event.batch_size) * 100).toFixed(1)
    });
  }

  // CSV operations
  csvUploaded(event: CSVEvent) {
    this.safeTrack('csv_uploaded', {
      filename: event.filename,
      row_count: event.rows.toString(),
      column_count: event.columns.length.toString(),
      columns: event.columns.join(','),
      file_size: event.file_size.toString(),
      processing_time: event.processing_time?.toString()
    });
  }

  csvProcessed(rows: number, valid: number, invalid: number) {
    this.safeTrack('csv_processed', {
      total_rows: rows.toString(),
      valid_rows: valid.toString(),
      invalid_rows: invalid.toString(),
      validation_rate: ((valid / rows) * 100).toFixed(1)
    });
  }

  // Search and discovery
  searchPerformed(query: string, results: number, tool?: string) {
    this.safeTrack('search_performed', {
      query_length: query.length.toString(),
      result_count: results.toString(),
      tool_context: tool
    });
  }

  helpAccessed(section: string, tool: string) {
    this.safeTrack('help_accessed', {
      help_section: section,
      tool_name: tool
    });
  }

  // User engagement
  timeSpentOnTool(tool: string, duration: number) {
    this.safeTrack('tool_time_spent', {
      tool_name: tool,
      duration: duration.toString(),
      engagement_level: duration > 300000 ? 'high' : duration > 60000 ? 'medium' : 'low'
    });
  }

  featureUsed(feature: string, tool: string, context?: Record<string, any>) {
    this.safeTrack('feature_used', {
      feature_name: feature,
      tool_name: tool,
      ...context
    });
  }

  // Error tracking
  captureError(error: Error, context?: Record<string, any>) {
    if (this.isEnabled) {
      // Send to Sentry
      Sentry.captureException(error, {
        extra: context
      });
      
      // Track in analytics
      this.safeTrack('error_occurred', {
        error_message: error.message,
        error_stack: error.stack?.substring(0, 200),
        error_name: error.name,
        ...context
      });
    }
  }

  // User identification
  identify(userId: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    try {
      if (posthog?.identify) {
        posthog.identify(userId, properties);
      }
    } catch (error) {
      console.warn('User identification failed:', error);
    }
  }

  // Feature flags
  isFeatureEnabled(flag: string): boolean {
    if (!this.isEnabled) return false;
    
    try {
      if (posthog?.isFeatureEnabled) {
        return posthog.isFeatureEnabled(flag);
      }
    } catch (error) {
      console.warn('Feature flag check failed:', error);
    }
    
    return false;
  }

  // A/B testing
  getFeatureFlag(flag: string): string | boolean | undefined {
    if (!this.isEnabled) return undefined;
    
    try {
      if (posthog?.getFeatureFlag) {
        return posthog.getFeatureFlag(flag);
      }
    } catch (error) {
      console.warn('Feature flag retrieval failed:', error);
    }
    
    return undefined;
  }
}

// Create and export default instance
const analytics = new AnalyticsService();
export default analytics;

// Also export named exports for backwards compatibility
export const trackEvent = analytics.trackEvent.bind(analytics);
export const performanceMetric = analytics.performanceMetric.bind(analytics);
export const pageView = analytics.pageView.bind(analytics);
export const walletConnected = analytics.walletConnected.bind(analytics);
export const walletDisconnected = analytics.walletDisconnected.bind(analytics);
export const transactionInitiated = analytics.transactionInitiated.bind(analytics);
export const transactionConfirmed = analytics.transactionConfirmed.bind(analytics);
export const transactionFailed = analytics.transactionFailed.bind(analytics);
export const toolUsed = analytics.toolUsed.bind(analytics);
export const batchOperationCompleted = analytics.batchOperationCompleted.bind(analytics);
export const csvUploaded = analytics.csvUploaded.bind(analytics);
export const csvProcessed = analytics.csvProcessed.bind(analytics);
export const captureError = analytics.captureError.bind(analytics);
export const identify = analytics.identify.bind(analytics);
export const isFeatureEnabled = analytics.isFeatureEnabled.bind(analytics);