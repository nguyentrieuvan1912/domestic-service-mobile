import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const TAB_IMAGES = {
  home: require('@/assets/images/tabIcons/home-3d.png'),
  services: require('@/assets/images/tabIcons/services-3d.png'),
  bookings: require('@/assets/images/tabIcons/orders-3d.png'),
  profile: require('@/assets/images/tabIcons/profile-3d.png'),
};

interface TabImageIconProps {
  name: 'home' | 'services' | 'bookings' | 'profile' | 'chat';
  focused: boolean;
  size?: number;
}

export const TabImageIcon: React.FC<TabImageIconProps> = ({
  name,
  focused,
  size = 22,
}) => {
  if (name === 'chat') {
    return (
      <View style={[styles.container, { width: size + 4, height: size + 4 }]}>
        <View
          style={[
            styles.image,
            { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
            focused ? styles.imageFocused : styles.imageUnfocused,
          ]}>
          <Text style={{ fontSize: size - 4 }}>💬</Text>
        </View>
      </View>
    );
  }

  const source = TAB_IMAGES[name];

  return (
    <View style={[styles.container, { width: size + 4, height: size + 4 }]}>
      <Image
        source={source}
        style={[
          styles.image,
          { width: size, height: size },
          focused ? styles.imageFocused : styles.imageUnfocused,
        ]}
        resizeMode="contain"
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 6,
  },
  imageFocused: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  imageUnfocused: {
    opacity: 0.55,
    transform: [{ scale: 0.94 }],
  },
});
