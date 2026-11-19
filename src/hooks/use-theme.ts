/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

export function useTheme() {
  const { isDark, colors } = useAppTheme();
  const base = Colors[isDark ? 'dark' : 'light'];

  return {
    ...base,
    background: colors.background,
    card: colors.surface,
    backgroundElement: colors.surface,
    border: colors.border,
    text: colors.text,
    textSecondary: colors.textSecondary,
    textMuted: colors.textMuted,
  };
}
