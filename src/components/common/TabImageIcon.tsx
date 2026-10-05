import React from 'react';
import { View } from 'react-native';
import { IconSymbol } from './IconSymbol';

interface TabImageIconProps {
  name: 'home' | 'services' | 'bookings' | 'profile' | 'chat';
  focused: boolean;
  size?: number;
}

export const TabImageIcon: React.FC<TabImageIconProps> = ({ name, focused, size = 22 }) => (
  <View style={{ width: size + 4, height: size + 4, alignItems: 'center', justifyContent: 'center', opacity: focused ? 1 : 0.55, transform: [{ scale: focused ? 1.08 : 0.94 }] }}>
    <IconSymbol name={name} size={size} color="#28594F" />
  </View>
);
