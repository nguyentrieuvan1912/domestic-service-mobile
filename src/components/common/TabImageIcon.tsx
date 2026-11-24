import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { IconSymbol } from './IconSymbol';

const TAB_TOP_GAP = 4;
const TAB_BOTTOM_GAP = 8;
const TAB_SIDE_GAP = 12;
const TAB_SURFACE_HEIGHT = 52;
const TAB_ACTIVE_COLOR = '#AEF5D5';
const TAB_IDLE_COLOR = '#F2F7F5';

export function useBottomTabSpacing() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'web' ? 6 : 4) + TAB_BOTTOM_GAP;
  const paddingHorizontal = Math.max(insets.left, insets.right) + TAB_SIDE_GAP;
  const height = TAB_SURFACE_HEIGHT + TAB_TOP_GAP + paddingBottom;
  return { height, paddingTop: TAB_TOP_GAP, paddingBottom, paddingHorizontal };
}

export function useFloatingTabOptions() {
  const spacing = useBottomTabSpacing();
  return {
    headerShown: false,
    animation: 'none',
    sceneStyle: { backgroundColor: 'transparent' },
    tabBarShowLabel: false,
    tabBarHideOnKeyboard: true,
    tabBarIconStyle: { width: 42, height: 32 },
    tabBarBackground: () => <FloatingTabSurface inset={spacing.paddingHorizontal} bottom={spacing.paddingBottom} />,
    tabBarStyle: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      ...spacing,
      elevation: 0,
      shadowOpacity: 0,
    },
  } as const;
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
  icon: { width: 42, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: 'rgba(172, 245, 211, 0.17)' },
});
