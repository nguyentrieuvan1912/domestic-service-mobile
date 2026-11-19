import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabLabel, FloatingTabSurface, TabImageIcon, useBottomTabSpacing } from '@/components/common/TabImageIcon';
import { useChatInbox } from '@/hooks/use-chat-inbox';

export default function TabLayout() {
  const spacing = useBottomTabSpacing();
  const { unreadCount } = useChatInbox();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: true,
        tabBarLabel: ({ children, focused }) => <BottomTabLabel label={children} focused={focused} />,
        tabBarIconStyle: { width: 42, height: 28 },
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
      }}>
      {/* 1. Trang chủ */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused }) => (
            <TabImageIcon name="home" focused={focused} />
          ),
        }}
      />

      {/* 2. Cộng đồng */}
      <Tabs.Screen
        name="services"
        options={{
          title: 'Cộng đồng',
          tabBarIcon: ({ focused }) => (
            <TabImageIcon name="services" focused={focused} />
          ),
        }}
      />

      {/* 3. Đơn hàng */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ focused }) => (
            <TabImageIcon name="bookings" focused={focused} />
          ),
        }}
      />

      {/* 4. Tin nhắn */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Tin nhắn',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarAccessibilityLabel: `Tin nhắn, ${unreadCount} tin chưa đọc`,
          tabBarIcon: ({ focused }) => (
            <TabImageIcon name="chat" focused={focused} />
          ),
        }}
      />

      {/* 5. Tài khoản */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ focused }) => (
            <TabImageIcon name="profile" focused={focused} />
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
