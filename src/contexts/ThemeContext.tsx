/**
 * Theme Context Provider
 * Manages theme state, persistence, and system preference detection
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ThemeMode,
  ThemePreference,
  ThemeContextType,
  THEMES,
  THEME_STORAGE_KEY,
  THEME_TRANSITION_DURATION,
} from '@/types/theme';

// ============================================================================
// CONTEXT DEFINITION
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// THEME PROVIDER COMPONENT
// ============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ThemeMode>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Calculate effective theme based on preference and system theme
  const effectiveTheme: ThemeMode =
    preference === 'system' ? systemTheme : (preference as ThemeMode);

  // ============================================================================
  // SYSTEM THEME DETECTION
  // ============================================================================

  useEffect(() => {
    // Detect system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);
    };

    // Set initial system theme
    updateSystemTheme(mediaQuery);

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateSystemTheme);
      return () => mediaQuery.removeEventListener('change', updateSystemTheme);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(updateSystemTheme);
      return () => mediaQuery.removeListener(updateSystemTheme);
    }
  }, []);

  // ============================================================================
  // THEME PERSISTENCE
  // ============================================================================

  // Load theme preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setPreferenceState(stored as ThemePreference);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  }, []);

  // Save theme preference to localStorage
  const savePreference = useCallback((newPreference: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newPreference);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  // ============================================================================
  // THEME APPLICATION
  // ============================================================================

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Add transitioning class
    setIsTransitioning(true);

    // Remove opposite theme class
    const oppositeTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    root.classList.remove(oppositeTheme);

    // Add current theme class
    root.classList.add(effectiveTheme);

    // Apply CSS custom properties
    const theme = THEMES[effectiveTheme];

    // Apply colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Apply shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Apply gradients
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--gradient-${key}`, value);
    });

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const bgColor =
        effectiveTheme === 'dark'
          ? 'hsl(222.2, 84%, 4.9%)'
          : 'hsl(0, 0%, 100%)';
      metaThemeColor.setAttribute('content', bgColor);
    }

    // Remove transitioning class after animation
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, THEME_TRANSITION_DURATION);

    return () => clearTimeout(timer);
  }, [effectiveTheme]);

  // ============================================================================
  // THEME CONTROL METHODS
  // ============================================================================

  const setTheme = useCallback(
    (theme: ThemeMode) => {
      setPreferenceState(theme);
      savePreference(theme);

      // Track theme change in analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'theme_changed', {
          theme_mode: theme,
        });
      }
    },
    [savePreference]
  );

  const setPreference = useCallback(
    (newPreference: ThemePreference) => {
      setPreferenceState(newPreference);
      savePreference(newPreference);

      // Track preference change in analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'theme_preference_changed', {
          preference: newPreference,
        });
      }
    },
    [savePreference]
  );

  const toggleTheme = useCallback(() => {
    const newTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [effectiveTheme, setTheme]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: ThemeContextType = {
    theme: effectiveTheme,
    preference,
    setTheme,
    setPreference,
    toggleTheme,
    systemTheme,
    effectiveTheme,
    isTransitioning,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
