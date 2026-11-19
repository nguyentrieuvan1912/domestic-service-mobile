import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { AppThemeColors } from '@/context/ThemeContext';

export function AppBackground({ children, gradient }: PropsWithChildren<{ gradient: AppThemeColors['backgroundGradient'] }>) {
  return <LinearGradient colors={gradient} style={styles.background}>
    {children}
  </LinearGradient>;
}

const styles = StyleSheet.create({
  background: { flex: 1 },
});
