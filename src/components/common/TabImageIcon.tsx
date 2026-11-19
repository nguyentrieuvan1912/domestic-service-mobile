import React from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { IconSymbol } from './IconSymbol';

const TAB_TOP_GAP = 4;
const TAB_BOTTOM_GAP = 8;
const TAB_SIDE_GAP = 12;
const TAB_ACTIVE_COLOR = '#AEF5D5';
const TAB_IDLE_COLOR = '#F2F7F5';

export function useBottomTabSpacing() {
  const insets = useSafeAreaInsets();
  const { fontScale, width } = useWindowDimensions();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'web' ? 6 : 4) + TAB_BOTTOM_GAP;
  const paddingHorizontal = Math.max(insets.left, insets.right) + TAB_SIDE_GAP;
  const extraLabelSpace = fontScale > 1.15 ? 18 : width < 360 ? 12 : 0;
  const height = 62 + TAB_TOP_GAP + paddingBottom + extraLabelSpace;
  return { height, paddingTop: TAB_TOP_GAP, paddingBottom, paddingHorizontal };
}

export function FloatingTabSurface({ inset, bottom }: { inset: number; bottom: number }) {
  const { isDark } = useAppTheme();
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[styles.surface, { left: inset, right: inset, bottom }]}>
      <LinearGradient
        colors={isDark ? ['rgba(31, 54, 50, 0.73)', 'rgba(10, 20, 20, 0.80)']
          : ['rgba(36, 64, 55, 0.62)', 'rgba(12, 32, 29, 0.76)']}
        style={styles.glass}
      />
    </View>
  </View>;
}

export function TabImageIcon({ name, focused }: { name: string; focused: boolean }) {
  return <View style={[styles.icon, focused && styles.activeIcon]}>
    <IconSymbol name={name} size={22} color={focused ? TAB_ACTIVE_COLOR : TAB_IDLE_COLOR} />
  </View>;
}

export function BottomTabLabel({ label, focused }: { label: string; focused: boolean }) {
  return <Text numberOfLines={2} maxFontSizeMultiplier={1.5}
    style={[styles.label, focused && styles.selected]}>
    {label}
  </Text>;
}

const styles = StyleSheet.create({
  surface: {
    position: 'absolute',
    top: TAB_TOP_GAP,
    borderRadius: 32,
    shadowColor: '#0A251D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 11,
  },
  glass: {
    flex: 1,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.52)',
  },
  icon: { width: 42, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: 'rgba(172, 245, 211, 0.17)' },
  label: { color: TAB_IDLE_COLOR, fontSize: 11, lineHeight: 15, textAlign: 'center', marginTop: 2, fontWeight: '600' },
  selected: { color: TAB_ACTIVE_COLOR, fontWeight: '800' },
});
