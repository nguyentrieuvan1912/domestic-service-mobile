import { Platform } from 'react-native';

export const BrandColors = {
  primary: '#00B074', // Emerald Green brand
  primaryDark: '#008C5C',
  primaryLight: '#E6F8F1',
  primaryGradient: ['#00B074', '#009663'] as const,
  secondary: '#1F2937',
  accent: '#FFB800', // Gold/Amber for Stars & Ratings
  accentLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  success: '#10B981',
  successLight: '#D1FAE5',
  white: '#FFFFFF',
  black: '#111827',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  cardShadow: 'rgba(0, 0, 0, 0.04)',
  softBgGradient: ['#B8EED4', '#D8F4E8', '#EEF8F3'] as const,
  softBgGradientLocations: [0, 0.35, 0.9] as const,
};

export const Colors = {
  light: {
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6F8F1',
    border: '#E2E8F0',
    primary: BrandColors.primary,
    card: '#FFFFFF',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    background: '#0F172A',
    backgroundElement: '#1E293B',
    backgroundSelected: '#064E3B',
    border: '#334155',
    primary: BrandColors.primary,
    card: '#1E293B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, serif',
    rounded: 'system-ui, sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 14,
  full: 9999,
};

export const Typography = {
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 600;
