import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Platform,
  Image,
} from 'react-native';
import { BrandColors } from '@/constants/theme';

interface CenterAIMascotTabButtonProps {
  onPress?: (e: any) => void;
  accessibilityState?: { selected?: boolean };
  children?: React.ReactNode;
}

export const CenterAIMascotTabButton: React.FC<CenterAIMascotTabButtonProps> = ({
  onPress,
  accessibilityState,
}) => {
  const isSelected = accessibilityState?.selected ?? false;

  // Animation drivers
  const floatAnim = useRef(new Animated.Value(0)).current; // -1 to 1
  const tiltAnim = useRef(new Animated.Value(0)).current; // -1 to 1
  const breathAnim = useRef(new Animated.Value(0)).current; // 0 to 1
  const glowAnim = useRef(new Animated.Value(0)).current; // 0 to 1
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Gentle vertical floating oscillation
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: -1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Playful head tilt
    const tiltLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: -1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Gentle breathing pulse
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // 4. Subtle glowing aura pulse ring
    const glowLoop = Animated.loop(
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );

    floatLoop.start();
    tiltLoop.start();
    breathLoop.start();
    glowLoop.start();

    return () => {
      floatLoop.stop();
      tiltLoop.stop();
      breathLoop.stop();
      glowLoop.stop();
    };
  }, [floatAnim, tiltAnim, breathAnim, glowAnim]);

  // Interpolations (gentle, subtle scale & amplitude)
  const translateY = floatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-2, 1.5],
  });

  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2.5deg', '2.5deg'],
  });

  const scaleBreath = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.25],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.35, 0.18, 0],
  });

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 10,
    }).start();
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Lowered, slim cradle notch */}
      <View style={styles.cradleNotch}>
        {/* Animated Glow Aura Ring */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
              backgroundColor: isSelected
                ? BrandColors.primary
                : 'rgba(0, 176, 116, 0.3)',
            },
          ]}
        />

        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.touchable}
          accessibilityRole="button"
          accessibilityLabel="Trợ lý AI HomeCare">
          <Animated.View
            style={[
              styles.floatingMascotWrapper,
              {
                transform: [
                  { translateY },
                  { rotate },
                  { scale: Animated.multiply(pressScale, scaleBreath) },
                ],
              },
            ]}>
            {/* Mascot Avatar Container */}
            <View
              style={[
                styles.mascotCircle,
                isSelected && styles.mascotCircleActive,
              ]}>
              <Image
                source={require('@/assets/images/ai-mascot.png')}
                style={styles.mascotImage}
                resizeMode="cover"
              />
            </View>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cradleNotch: {
    position: 'absolute',
    top: -14, // Lowered down into the tab bar for a sleek, compact profile
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E6F8F1',
    ...Platform.select({
      ios: {
        shadowColor: '#00B074',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 -2px 10px rgba(0, 176, 116, 0.14)',
      } as any,
    }),
  },
  glowRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  touchable: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingMascotWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mascotCircleActive: {
    borderColor: BrandColors.primary,
    borderWidth: 2,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
});
