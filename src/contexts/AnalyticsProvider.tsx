import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import * as analytics from '@/services/analytics';

interface AnalyticsContextType {
  trackEvent: typeof analytics;
  isInitialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const isInitialized = useRef(false);
  const sessionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (isInitialized.current) return;

    // Initialize analytics services
    const initializeAnalytics = async () => {
      try {
        // Track session start
        analytics.sessionStarted();
        
        // Track initial page view
        analytics.pageView(window.location.pathname, {
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });

        // Set up session tracking
        const handleBeforeUnload = () => {
          const sessionDuration = Date.now() - sessionStartTime.current;
          analytics.sessionEnded(Math.floor(sessionDuration / 1000));
        };

        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            const sessionDuration = Date.now() - sessionStartTime.current;
            analytics.timeSpentOnTool('dashboard', 'general', Math.floor(sessionDuration / 1000));
          }
        };

        // Set up event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Track performance metrics
        if ('performance' in window && 'getEntriesByType' in window.performance) {
          setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigation) {
              analytics.performanceMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart, {
                page: window.location.pathname,
              });
            }
          }, 1000);
        }

        isInitialized.current = true;

        if (import.meta.env.DEV) {
          console.log('🎯 Analytics Provider initialized successfully');
        }

        // Cleanup function
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } catch (error) {
        console.warn('Failed to initialize analytics:', error);
        analytics.error(error as Error, { context: 'analytics_initialization' });
      }
    };

    initializeAnalytics();
  }, []);

  const contextValue: AnalyticsContextType = {
    trackEvent: analytics,
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