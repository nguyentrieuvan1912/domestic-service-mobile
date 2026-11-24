import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { FloatingTabSurface, TabImageIcon, useBottomTabSpacing } from '@/components/common/TabImageIcon';

export type StaffTabKey = 'home' | 'jobs' | 'community' | 'wallet' | 'profile';

interface StaffBottomNavProps {
  activeTab: StaffTabKey;
}

export const STAFF_TABS = [
  { name: 'index', key: 'home', label: 'Trang chủ', icon: 'home', route: '/staff' },
  { name: 'jobs', key: 'jobs', label: 'Ca làm việc', icon: 'calendar', route: '/staff/jobs' },
  { name: 'community', key: 'community', label: 'Cộng đồng', icon: 'users', route: '/staff/community' },
  { name: 'wallet', key: 'wallet', label: 'Thu nhập', icon: 'wallet', route: '/staff/wallet' },
  { name: 'profile', key: 'profile', label: 'Tài khoản', icon: 'user', route: '/staff/profile' },
] as const;

export const StaffBottomNav: React.FC<StaffBottomNavProps> = ({ activeTab }) => {
  const router = useRouter();
  const spacing = useBottomTabSpacing();

  const handleTabPress = (tab: (typeof STAFF_TABS)[number]) => {
    if (tab.key === activeTab) return;
    router.replace(tab.route);
  };

  return (
    <View pointerEvents="box-none" style={[styles.container, spacing]}>
      <FloatingTabSurface inset={spacing.paddingHorizontal} bottom={spacing.paddingBottom} />
      <View style={styles.tabBar}>
        {STAFF_TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              onPress={() => handleTabPress(tab)}
              style={styles.tabItem}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.14)' }}
            >
              <TabImageIcon name={tab.icon} focused={isActive} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5 },
  tabBar: {
    flexDirection: 'row',
    flex: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },
});
