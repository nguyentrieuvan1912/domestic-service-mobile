import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { BrandLogo } from '@/components/common/BrandLogo';

const PARTICLES = [
  { left: 78, top: 360, delay: 520, x: -22, y: -44, size: 7 },
  { left: 122, top: 410, delay: 560, x: 18, y: -58, size: 5 },
  { left: 184, top: 350, delay: 600, x: 40, y: -34, size: 8 },
  { left: 236, top: 400, delay: 640, x: 55, y: -55, size: 5 },
  { left: 272, top: 336, delay: 680, x: 34, y: -72, size: 6 },
];

function Sparkle({ left, top, delay, x, y, size }: typeof PARTICLES[number]) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(withTiming(1, { duration: 140 }), withDelay(260, withTiming(0, { duration: 220 }))));
    scale.value = withDelay(delay, withSequence(withTiming(1, { duration: 170, easing: Easing.out(Easing.quad) }), withTiming(0.5, { duration: 450 })));
    translateX.value = withDelay(delay, withTiming(x, { duration: 520, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withTiming(y, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [delay, opacity, scale, translateX, translateY, x, y]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }] }));
  return <Animated.View style={[styles.sparkle, { left, top, width: size, height: size, borderRadius: size / 2 }, animatedStyle]} />;
}

export function WelcomeSweepOverlay({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(true);
  const broomOpacity = useSharedValue(0);
  const broomX = useSharedValue(-118);
  const broomY = useSharedValue(26);
  const broomRotation = useSharedValue(-20);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.7);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(12);

  useEffect(() => {
    broomOpacity.value = withTiming(1, { duration: 180 });
    broomX.value = withDelay(170, withSequence(
      withTiming(-36, { duration: 220, easing: Easing.out(Easing.quad) }),
      withTiming(106, { duration: 510, easing: Easing.inOut(Easing.cubic) }),
    ));
    broomY.value = withDelay(170, withSequence(withTiming(4, { duration: 240 }), withTiming(-18, { duration: 300 }), withTiming(2, { duration: 190 })));
    broomRotation.value = withDelay(170, withSequence(withTiming(-7, { duration: 250 }), withTiming(17, { duration: 510, easing: Easing.inOut(Easing.cubic) }), withTiming(5, { duration: 180 })));
    logoOpacity.value = withDelay(940, withTiming(1, { duration: 220 }));
    logoScale.value = withDelay(940, withSequence(withTiming(1.08, { duration: 250, easing: Easing.out(Easing.back(1.8)) }), withTiming(1, { duration: 160 })));
    titleOpacity.value = withDelay(1110, withTiming(1, { duration: 260 }));
    titleY.value = withDelay(1110, withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }));
    const timeout = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1680);
    return () => clearTimeout(timeout);
  }, [broomOpacity, broomRotation, broomX, broomY, logoOpacity, logoScale, onComplete, titleOpacity, titleY]);

  const broomStyle = useAnimatedStyle(() => ({ opacity: broomOpacity.value, transform: [{ translateX: broomX.value }, { translateY: broomY.value }, { rotate: `${broomRotation.value}deg` }] }));
  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleY.value }] }));

  if (!visible) return null;
  return <View pointerEvents="none" style={styles.overlay}>
    <View style={styles.softWaveOne} /><View style={styles.softWaveTwo} />
    {PARTICLES.map((particle, index) => <Sparkle key={index} {...particle} />)}
    <Animated.Text style={[styles.broom, broomStyle]}>🧹</Animated.Text>
    <View style={styles.brandArea}>
      <Animated.View style={[styles.logo, logoStyle]}><BrandLogo size={68} /></Animated.View>
      <Animated.View style={titleStyle}><Text style={styles.brandName}>CleanMaster</Text><Text style={styles.tagline}>Nhà sạch, cuộc sống nhẹ nhàng</Text></Animated.View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 99, elevation: 99, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6FFFC' },
  softWaveOne: { position: 'absolute', width: 520, height: 340, borderRadius: 260, backgroundColor: '#E1F8F0', bottom: -155, left: -120, transform: [{ rotate: '-11deg' }] },
  softWaveTwo: { position: 'absolute', width: 460, height: 260, borderRadius: 230, borderWidth: 26, borderColor: '#ECFDF5', bottom: -125, right: -170, transform: [{ rotate: '17deg' }] },
  broom: { position: 'absolute', top: '47%', fontSize: 78, shadowColor: '#047857', shadowOpacity: 0.16, shadowRadius: 12, elevation: 5 },
  sparkle: { position: 'absolute', backgroundColor: '#34D399', shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 6 },
  brandArea: { alignItems: 'center', marginTop: 132 }, logo: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#E8FFF7', alignItems: 'center', justifyContent: 'center', shadowColor: '#047857', shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  brandName: { color: '#123B35', fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 12, letterSpacing: -0.4 }, tagline: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 4 },
});
