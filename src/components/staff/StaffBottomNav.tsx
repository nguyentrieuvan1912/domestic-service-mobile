import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BrandColors } from '@/constants/theme';

export type StaffTabKey = 'home' | 'jobs' | 'availability' | 'wallet' | 'profile';

interface StaffBottomNavProps {
  activeTab: StaffTabKey;
}

const TABS: { key: StaffTabKey; label: string; icon: string; route: string }[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home', route: '/staff' },
  { key: 'jobs', label: 'Ca làm việc', icon: 'calendar', route: '/staff/jobs' },
  { key: 'availability', label: 'Đăng ký lịch', icon: 'clock', route: '/staff/availability' },
  { key: 'wallet', label: 'Thu nhập', icon: 'wallet', route: '/staff/wallet' },
  { key: 'profile', label: 'Tài khoản', icon: 'user', route: '/staff/profile' },
];

export const StaffBottomNav: React.FC<StaffBottomNavProps> = ({ activeTab }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tabBottomPadding = Platform.select({
    ios: Math.min(insets.bottom, 16),
    web: 6,
    default: Math.min(insets.bottom, 6),
  });

  const handleTabPress = (tab: (typeof TABS)[0]) => {
    if (tab.key === activeTab) return;
    router.replace(tab.route as never);
  };

  return (
    <View style={[styles.container, { paddingBottom: tabBottomPadding }]}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(tab)}
              style={styles.tabItem}
              android_ripple={{ color: '#E2E8F0', borderless: true }}
            >
              <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                <IconSymbol
                  name={tab.icon}
                  size={20}
                  color={isActive ? '#047857' : BrandColors.gray400}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 12,
  },
  iconWrapperActive: {
    backgroundColor: '#ECFDF5',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: BrandColors.gray500,
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#047857',
    fontWeight: '700',
  },
});
