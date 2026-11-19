import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomTabLabel, FloatingTabSurface, TabImageIcon, useBottomTabSpacing } from '@/components/common/TabImageIcon';

export type StaffTabKey = 'home' | 'jobs' | 'community' | 'wallet' | 'profile';

interface StaffBottomNavProps {
  activeTab: StaffTabKey;
}

const TABS: { key: StaffTabKey; label: string; icon: string; route: string }[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home', route: '/staff' },
  { key: 'jobs', label: 'Ca làm việc', icon: 'calendar', route: '/staff/jobs' },
  { key: 'community', label: 'Cộng đồng', icon: 'users', route: '/staff/community' },
  { key: 'wallet', label: 'Thu nhập', icon: 'wallet', route: '/staff/wallet' },
  { key: 'profile', label: 'Tài khoản', icon: 'user', route: '/staff/profile' },
];

export const StaffBottomNav: React.FC<StaffBottomNavProps> = ({ activeTab }) => {
  const router = useRouter();
  const spacing = useBottomTabSpacing();

  const handleTabPress = (tab: (typeof TABS)[0]) => {
    if (tab.key === activeTab) return;
    router.replace(tab.route as never);
  };

  return (
    <View pointerEvents="box-none" style={[styles.container, spacing]}>
      <FloatingTabSurface inset={spacing.paddingHorizontal} bottom={spacing.paddingBottom} />
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
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
              <BottomTabLabel label={tab.label} focused={isActive} />
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
    padding: 5,
    borderRadius: 24,
    overflow: 'hidden',
  },
});
