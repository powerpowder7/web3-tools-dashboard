import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from './sidebar/Sidebar';
import WalletButton from './common/WalletButton';
import { useAnalytics } from '@/contexts/AnalyticsProvider';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastPageView, setLastPageView] = useState<string>('');
  const [pageStartTime, setPageStartTime] = useState<number>(Date.now());
  const location = useLocation();
  const { trackEvent } = useAnalytics();

  // Track page views and time spent
  useEffect(() => {
    const currentPath = location.pathname;
    const now = Date.now();

    // Track time spent on previous page
    if (lastPageView && lastPageView !== currentPath) {
      const timeSpent = Math.floor((now - pageStartTime) / 1000);
      trackEvent.timeSpentOnTool(
        getToolNameFromPath(lastPageView),
        'solana',
        timeSpent
      );
    }

    // Track new page view
    trackEvent.pageView(currentPath, {
      previousPage: lastPageView || 'none',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    setLastPageView(currentPath);
    setPageStartTime(now);
  }, [location.pathname, trackEvent, lastPageView, pageStartTime]);

  // Track sidebar interactions
  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    
    trackEvent.buttonClicked('sidebar_toggle', 'layout', {
      action: newState ? 'open' : 'close',
      currentPage: location.pathname,
    });
  };

  // Helper function to extract tool name from path
  const getToolNameFromPath = (path: string): string => {
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length >= 2) {
      return pathSegments[1]; // e.g., /solana/multi-sender -> multi-sender
    }
    return pathSegments[0] || 'dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={handleSidebarToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={handleSidebarToggle}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-2">
                <h1 className="text-xl font-semibold text-gray-900">
                  Web3Tools
                </h1>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  Testnet
                </span>
              </div>
            </div>

            <div className="flex flex-1 justify-end">
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <WalletButton />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;