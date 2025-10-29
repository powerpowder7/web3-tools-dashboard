/**
 * Theme System Type Definitions
 * Comprehensive type system for light/dark mode theming
 */

// ============================================================================
// CORE THEME TYPES
// ============================================================================

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Base colors
  background: string;
  foreground: string;

  // UI element colors
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;

  // State colors
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  destructive: string;
  destructiveForeground: string;
  info: string;
  infoForeground: string;

  // Interactive elements
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;

  // Borders and separators
  border: string;
  input: string;
  ring: string;

  // Cards and surfaces
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;

  // Web3-specific colors
  blockchain: string; // For blockchain status indicators
  transaction: string; // For transaction states
  wallet: string; // For wallet connection status
  token: string; // For token-related elements
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeGradients {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  accent: string;
}

export interface Theme {
  id: ThemeMode;
  name: string;
  colors: ThemeColors;
  shadows: ThemeShadows;
  gradients: ThemeGradients;
}

// ============================================================================
// THEME CONTEXT TYPES
// ============================================================================

export interface ThemeContextType {
  theme: ThemeMode;
  preference: ThemePreference;
  setTheme: (theme: ThemeMode) => void;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
  systemTheme: ThemeMode;
  effectiveTheme: ThemeMode;
  isTransitioning: boolean;
}

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

export const LIGHT_THEME: Theme = {
  id: 'light',
  name: 'Light',
  colors: {
    // Clean, professional light mode
    background: '0 0% 100%', // Pure white
    foreground: '222.2 84% 4.9%', // Deep navy text

    primary: '262.1 83.3% 57.8%', // Rich purple (Web3 feel)
    primaryForeground: '210 40% 98%', // Off-white text

    secondary: '210 40% 96.1%', // Light gray
    secondaryForeground: '222.2 47.4% 11.2%', // Dark gray text

    success: '142.1 76.2% 36.3%', // Forest green
    successForeground: '355.7 100% 97.3%', // Light text

    warning: '38.4 92.1% 50.2%', // Amber warning
    warningForeground: '48 96% 89%', // Light amber text

    destructive: '0 84.2% 60.2%', // Red for danger
    destructiveForeground: '210 40% 98%', // White text

    info: '221.2 83.2% 53.3%', // Blue for info
    infoForeground: '210 40% 98%', // White text

    muted: '210 40% 96.1%', // Subtle backgrounds
    mutedForeground: '215.4 16.3% 46.9%', // Muted text

    accent: '210 40% 96.1%', // Hover states
    accentForeground: '222.2 47.4% 11.2%', // Accent text

    border: '214.3 31.8% 91.4%', // Subtle borders
    input: '214.3 31.8% 91.4%', // Input borders
    ring: '262.1 83.3% 57.8%', // Focus rings

    card: '0 0% 100%', // Card backgrounds
    cardForeground: '222.2 84% 4.9%', // Card text

    popover: '0 0% 100%', // Dropdown backgrounds
    popoverForeground: '222.2 84% 4.9%', // Dropdown text

    // Web3-specific colors
    blockchain: '142.1 76.2% 36.3%', // Green for connected
    transaction: '221.2 83.2% 53.3%', // Blue for transactions
    wallet: '262.1 83.3% 57.8%', // Purple for wallet
    token: '38.4 92.1% 50.2%', // Gold for tokens
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  gradients: {
    primary:
      'linear-gradient(135deg, hsl(262.1 83.3% 57.8%) 0%, hsl(221.2 83.2% 53.3%) 100%)',
    secondary:
      'linear-gradient(135deg, hsl(210 40% 96.1%) 0%, hsl(214.3 31.8% 91.4%) 100%)',
    success:
      'linear-gradient(135deg, hsl(142.1 76.2% 36.3%) 0%, hsl(134.1 76.2% 46.3%) 100%)',
    warning:
      'linear-gradient(135deg, hsl(38.4 92.1% 50.2%) 0%, hsl(32.4 92.1% 60.2%) 100%)',
    accent: 'linear-gradient(135deg, hsl(210 40% 96.1%) 0%, hsl(220 40% 94%) 100%)',
  },
};

export const DARK_THEME: Theme = {
  id: 'dark',
  name: 'Dark',
  colors: {
    // Premium dark mode - rich, not harsh
    background: '222.2 84% 4.9%', // Deep navy background
    foreground: '210 40% 98%', // Off-white text

    primary: '263.4 70% 50.4%', // Vibrant purple
    primaryForeground: '210 40% 98%', // White text

    secondary: '217.2 32.6% 17.5%', // Dark gray cards
    secondaryForeground: '210 40% 98%', // Light text

    success: '142.1 70.6% 45.3%', // Bright green
    successForeground: '144.9 80.4% 10%', // Dark green text

    warning: '38.4 92.1% 50.2%', // Bright amber
    warningForeground: '48 96% 89%', // Light amber text

    destructive: '0 62.8% 30.6%', // Dark red
    destructiveForeground: '210 40% 98%', // White text

    info: '217.2 91.2% 59.8%', // Light blue for info
    infoForeground: '210 40% 98%', // White text

    muted: '217.2 32.6% 17.5%', // Subtle dark backgrounds
    mutedForeground: '215 20.2% 65.1%', // Muted light text

    accent: '217.2 32.6% 17.5%', // Hover states
    accentForeground: '210 40% 98%', // Accent text

    border: '217.2 32.6% 17.5%', // Subtle borders
    input: '217.2 32.6% 17.5%', // Input borders
    ring: '263.4 70% 50.4%', // Focus rings

    card: '222.2 47.4% 11.2%', // Card backgrounds (slightly lighter than bg)
    cardForeground: '210 40% 98%', // Card text

    popover: '222.2 84% 4.9%', // Dropdown backgrounds
    popoverForeground: '210 40% 98%', // Dropdown text

    // Web3-specific dark colors
    blockchain: '142.1 70.6% 45.3%', // Bright green for connected
    transaction: '217.2 91.2% 59.8%', // Light blue for transactions
    wallet: '263.4 70% 50.4%', // Purple for wallet
    token: '48 96% 76.9%', // Gold for tokens
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.5)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.75)',
  },
  gradients: {
    primary:
      'linear-gradient(135deg, hsl(263.4 70% 50.4%) 0%, hsl(217.2 91.2% 59.8%) 100%)',
    secondary:
      'linear-gradient(135deg, hsl(217.2 32.6% 17.5%) 0%, hsl(217.2 32.6% 27.5%) 100%)',
    success:
      'linear-gradient(135deg, hsl(142.1 70.6% 45.3%) 0%, hsl(134.1 70.6% 55.3%) 100%)',
    warning:
      'linear-gradient(135deg, hsl(38.4 92.1% 50.2%) 0%, hsl(48 96% 76.9%) 100%)',
    accent:
      'linear-gradient(135deg, hsl(217.2 32.6% 17.5%) 0%, hsl(217.2 32.6% 25%) 100%)',
  },
};

// ============================================================================
// THEME UTILITIES
// ============================================================================

export const THEMES: Record<ThemeMode, Theme> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
};

export const THEME_STORAGE_KEY = 'web3tools-theme-preference';
export const THEME_TRANSITION_DURATION = 300; // milliseconds

// ============================================================================
// COLOR CONTRAST UTILITIES
// ============================================================================

export interface ContrastRequirements {
  normalText: number; // 4.5:1 for AA
  largeText: number; // 3:1 for AA (18pt+)
  uiComponents: number; // 3:1 for form controls
  graphicalObjects: number; // 3:1 for charts
}

export const WCAG_AA_CONTRAST: ContrastRequirements = {
  normalText: 4.5,
  largeText: 3.0,
  uiComponents: 3.0,
  graphicalObjects: 3.0,
};

// Helper function to convert HSL to RGB for contrast calculations
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// Calculate relative luminance
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Calculate contrast ratio
export function getContrastRatio(color1: string, color2: string): number {
  // Parse HSL strings (format: "h s% l%")
  const parseHsl = (hsl: string): [number, number, number] => {
    const parts = hsl.split(' ');
    return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])];
  };

  const [h1, s1, l1] = parseHsl(color1);
  const [h2, s2, l2] = parseHsl(color2);

  const [r1, g1, b1] = hslToRgb(h1, s1, l1);
  const [r2, g2, b2] = hslToRgb(h2, s2, l2);

  const lum1 = getRelativeLuminance(r1, g1, b1);
  const lum2 = getRelativeLuminance(r2, g2, b2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Check if contrast meets WCAG standards
export function meetsContrastStandard(
  foreground: string,
  background: string,
  level: keyof ContrastRequirements = 'normalText'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= WCAG_AA_CONTRAST[level];
}
