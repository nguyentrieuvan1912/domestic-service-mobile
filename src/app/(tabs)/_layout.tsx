import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandColors } from '@/constants/theme';
import { TabImageIcon } from '@/components/common/TabImageIcon';
import { CenterAIMascotTabButton } from '@/components/common/CenterAIMascotTabButton';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { currentRole } = useAuth();
  const isStaff = currentRole === 'STAFF';

  // Compact, lowered padding for mobile screens
  const tabBottomPadding = Platform.select({
    ios: Math.min(insets.bottom, 16),
    web: 8,
    default: Math.min(insets.bottom, 8),
  });

  // Sleek tab height with comfortable breathing room
  const tabHeight = Platform.select({
    ios: 58 + tabBottomPadding,
    web: 64,
    default: 58 + tabBottomPadding,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: BrandColors.gray500,
        tabBarStyle: {
          backgroundColor: BrandColors.white,
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          height: tabHeight,
          paddingTop: 4,
          paddingBottom: tabBottomPadding,
          overflow: 'visible', // Allows center mascot to sit snugly above the bar
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          lineHeight: 12,
          marginTop: 1,
          marginBottom: 1,
        },
      }}>
      {/* 1. Trang chủ */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused }) => (
            <TabImageIcon name="home" focused={focused} size={22} />
          ),
        }}
      />

      {/* 2. Cộng đồng */}
      <Tabs.Screen
        name="services"
        options={{
          title: 'Cộng đồng',
          tabBarIcon: ({ focused }) => (
            <TabImageIcon name="services" focused={focused} size={22} />
          ),
        }}
      />

      {/* 3. Đơn hàng */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ focused }) => (
            <TabImageIcon name="bookings" focused={focused} size={22} />
          ),
        }}
      />

      {/* 4. Tin nhắn */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Tin nhắn',
          tabBarIcon: ({ focused }) => (
            <TabImageIcon name="chat" focused={focused} size={22} />
          ),
        }}
      />

      {/* 5. Tài khoản */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ focused }) => (
            <TabImageIcon name="profile" focused={focused} size={22} />
          ),
        }}
      />

      {/* Ẩn route AI khỏi tab bar (được kích hoạt từ nút nổi Trang chủ và thanh nhanh) */}
      <Tabs.Screen
        name="ai"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
