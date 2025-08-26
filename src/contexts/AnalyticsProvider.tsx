// src/contexts/AnalyticsProvider.tsx - COMPLETE FIX
import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import analytics from '@/services/analytics';

// Context type definition
interface AnalyticsContextType {
  trackEvent: typeof analytics.trackEvent;
  pageView: typeof analytics.pageView;
  walletConnected: typeof analytics.walletConnected;
  walletDisconnected: typeof analytics.walletDisconnected;
  transactionInitiated: typeof analytics.transactionInitiated;
  transactionConfirmed: typeof analytics.transactionConfirmed;
  transactionFailed: typeof analytics.transactionFailed;
  toolUsed: typeof analytics.toolUsed;
  csvUploaded: typeof analytics.csvUploaded;
  performanceMetric: typeof analytics.performanceMetric;
  captureError: typeof analytics.captureError;
  isInitialized: boolean;
}

// Create context
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// Provider props interface
interface AnalyticsProviderProps {
  children: ReactNode;
}

// Analytics Provider Component
export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const isInitialized = useRef<boolean>(false);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    const initializeAnalytics = async () => {
      if (isInitialized.current) return;

      try {
        // Track session start
        const sessionStartTime = Date.now();
        
        // Track page load performance
        if (typeof window !== 'undefined') {
          const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigationTiming) {
            analytics.performanceMetric({
              name: 'page_load_complete',
              value: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
              unit: 'ms',
              metadata: {
                session_start: sessionStartTime
              }
            });
          }
        }

        // Track initial page view
        if (typeof window !== 'undefined') {
          analytics.pageView(window.location.pathname, document.title);
        }

        // Session management
        const handleBeforeUnload = () => {
          const sessionDuration = Date.now() - startTime.current;
          analytics.performanceMetric({
            name: 'session_duration',
            value: sessionDuration,
            unit: 'ms',
            metadata: {
              page_path: window.location.pathname,
              session_end: Date.now()
            }
          });
        };

        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            const sessionDuration = Date.now() - startTime.current;
            analytics.performanceMetric({
              name: 'page_visibility_hidden',
              value: sessionDuration,
              unit: 'ms',
              metadata: {
                page_path: window.location.pathname
              }
            });
          } else if (document.visibilityState === 'visible') {
            analytics.trackEvent('page_visibility_visible', {
              page_path: window.location.pathname,
              timestamp: Date.now()
            });
          }
        };

        // Add event listeners
        if (typeof window !== 'undefined') {
          window.addEventListener('beforeunload', handleBeforeUnload);
          document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        // Mark as initialized
        isInitialized.current = true;

        if (import.meta.env.DEV) {
          console.log('🎯 Analytics Provider initialized successfully');
        }

        // Cleanup function
        return () => {
          if (typeof window !== 'undefined') {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          }
        };
      } catch (error) {
        console.warn('Failed to initialize analytics:', error);
        analytics.captureError(error as Error, { context: 'analytics_initialization' });
      }
    };

    initializeAnalytics();
  }, []);

  // Context value with all analytics methods
  const contextValue: AnalyticsContextType = {
    trackEvent: analytics.trackEvent.bind(analytics),
    pageView: analytics.pageView.bind(analytics),
    walletConnected: analytics.walletConnected.bind(analytics),
    walletDisconnected: analytics.walletDisconnected.bind(analytics),
    transactionInitiated: analytics.transactionInitiated.bind(analytics),
    transactionConfirmed: analytics.transactionConfirmed.bind(analytics),
    transactionFailed: analytics.transactionFailed.bind(analytics),
    toolUsed: analytics.toolUsed.bind(analytics),
    csvUploaded: analytics.csvUploaded.bind(analytics),
    performanceMetric: analytics.performanceMetric.bind(analytics),
    captureError: analytics.captureError.bind(analytics),
    isInitialized: isInitialized.current,
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
      <Analytics />
    </AnalyticsContext.Provider>
  );
};

// Custom hook to use analytics
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export default AnalyticsProvider;