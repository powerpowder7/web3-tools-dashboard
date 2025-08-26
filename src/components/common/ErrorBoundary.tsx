// src/components/common/ErrorBoundary.tsx - BUTTONCLICKED PROPERTY FIXED
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import analytics from '@/services/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Track error with analytics - FIXED: using captureError instead of error
    analytics.captureError(error, {
      context: this.props.context || 'error_boundary',
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Log to console in development
    if (import.meta.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    // FIXED: using trackEvent instead of buttonClicked
    analytics.trackEvent('error_boundary_retry', {
      context: this.props.context || 'error_boundary',
      errorMessage: this.state.error?.message || 'unknown',
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    // FIXED: using trackEvent instead of buttonClicked
    analytics.trackEvent('error_boundary_reload', {
      context: this.props.context || 'error_boundary',
      errorMessage: this.state.error?.message || 'unknown',
    });

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. You can try refreshing the page or going back.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error details in development */}
              {import.meta.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="text-xs font-mono text-gray-600 break-all">
                    <div className="font-semibold mb-1">Error:</div>
                    {this.state.error.message}
                    {this.state.error.stack && (
                      <>
                        <div className="font-semibold mt-2 mb-1">Stack:</div>
                        <pre className="whitespace-pre-wrap text-xs">
                          {this.state.error.stack.slice(0, 500)}
                          {this.state.error.stack.length > 500 ? '...' : ''}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>

              {/* Help text */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  If this problem persists, please refresh the page or contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;