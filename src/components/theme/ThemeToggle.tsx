/**
 * Theme Toggle Component
 * Beautiful animated toggle switch for light/dark mode
 */

import React, { useState } from 'react';
import { Sun, Moon, Monitor, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemePreference } from '@/types/theme';

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'dropdown';
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  showLabel = false,
  className,
}) => {
  const { preference, setPreference, effectiveTheme, isTransitioning } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const getIcon = (theme: ThemePreference) => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getLabel = (theme: ThemePreference) => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
    }
  };

  // Simple icon button variant
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const next: ThemePreference =
            preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light';
          setPreference(next);
        }}
        className={cn(
          'relative',
          isTransitioning && 'pointer-events-none',
          className
        )}
        aria-label="Toggle theme"
      >
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-all duration-300',
            effectiveTheme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
          )}
        >
          <Sun className="h-5 w-5" />
        </div>
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-all duration-300',
            effectiveTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          )}
        >
          <Moon className="h-5 w-5" />
        </div>
      </Button>
    );
  }

  // Button with label variant
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        onClick={() => {
          const next: ThemePreference =
            preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light';
          setPreference(next);
        }}
        className={cn('w-full gap-2 justify-start', className)}
        disabled={isTransitioning}
      >
        {getIcon(preference)}
        {showLabel && <span className="flex-1 text-left">{getLabel(preference)} Mode</span>}
        <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
      </Button>
    );
  }

  // Dropdown variant with all options
  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOptions(!showOptions)}
          className={cn('gap-2', className)}
        >
          {getIcon(preference)}
          {showLabel && <span>{getLabel(preference)}</span>}
        </Button>

        {showOptions && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowOptions(false)}
            />

            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 z-50 min-w-[140px] rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
              <button
                onClick={() => {
                  setPreference('light');
                  setShowOptions(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                  preference === 'light'
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Sun className="h-4 w-4" />
                <span>Light</span>
                {preference === 'light' && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>

              <button
                onClick={() => {
                  setPreference('dark');
                  setShowOptions(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                  preference === 'dark'
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Moon className="h-4 w-4" />
                <span>Dark</span>
                {preference === 'dark' && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>

              <button
                onClick={() => {
                  setPreference('system');
                  setShowOptions(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                  preference === 'system'
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Monitor className="h-4 w-4" />
                <span>System</span>
                {preference === 'system' && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

// ============================================================================
// ANIMATED SWITCH VARIANT
// ============================================================================

export const ThemeSwitch: React.FC<{ className?: string }> = ({ className }) => {
  const { setPreference, effectiveTheme } = useTheme();

  const isDark = effectiveTheme === 'dark';

  return (
    <button
      onClick={() => setPreference(isDark ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isDark ? 'bg-primary' : 'bg-muted',
        className
      )}
      aria-label="Toggle theme"
      role="switch"
      aria-checked={isDark}
    >
      {/* Sliding circle */}
      <span
        className={cn(
          'inline-flex h-4 w-4 transform items-center justify-center rounded-full bg-background shadow-md transition-transform',
          isDark ? 'translate-x-6' : 'translate-x-1'
        )}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-primary" />
        ) : (
          <Sun className="h-3 w-3 text-primary" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
