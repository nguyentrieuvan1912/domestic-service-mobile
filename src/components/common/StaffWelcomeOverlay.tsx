import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import { BrandLogo } from '@/components/common/BrandLogo';

const STAFF_SCOOTER = require('../../../assets/images/staff-welcome/cleanmaster-staff-scooter.png');

/** A premium, staff-only transition shown after a successful staff sign-in. */
export function StaffWelcomeOverlay({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(true);
  const riderOpacity = useSharedValue(0);
  const riderX = useSharedValue(-430);
  const riderY = useSharedValue(12);
  const trailOpacity = useSharedValue(0);
  const sceneWash = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.78);
  const copyOpacity = useSharedValue(0);
  const copyY = useSharedValue(14);

  useEffect(() => {
    riderOpacity.value = withSequence(withTiming(1, { duration: 220 }), withDelay(1540, withTiming(0, { duration: 360 })));
    riderX.value = withDelay(150, withTiming(28, { duration: 1540, easing: Easing.inOut(Easing.cubic) }));
    riderY.value = withDelay(120, withSequence(
      withTiming(-4, { duration: 285 }),
      withTiming(4, { duration: 285 }),
      withTiming(-2, { duration: 285 }),
      withTiming(2, { duration: 285 }),
    ));
    trailOpacity.value = withDelay(350, withSequence(withTiming(0.95, { duration: 280 }), withDelay(790, withTiming(0, { duration: 340 }))));
    sceneWash.value = withDelay(1900, withTiming(0.9, { duration: 520, easing: Easing.inOut(Easing.quad) }));
    cardOpacity.value = withDelay(2110, withTiming(1, { duration: 280 }));
    cardScale.value = withDelay(2110, withSequence(
      withTiming(1.05, { duration: 300, easing: Easing.out(Easing.back(1.55)) }),
      withTiming(1, { duration: 160 }),
    ));
    copyOpacity.value = withDelay(2310, withTiming(1, { duration: 280 }));
    copyY.value = withDelay(2310, withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }));

    const timeout = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 3500);
    return () => clearTimeout(timeout);
  }, [cardOpacity, cardScale, copyOpacity, copyY, onComplete, riderOpacity, riderX, riderY, sceneWash, trailOpacity]);

  const riderStyle = useAnimatedStyle(() => ({
    opacity: riderOpacity.value,
    transform: [{ translateX: riderX.value }, { translateY: riderY.value }],
  }));
  const trailStyle = useAnimatedStyle(() => ({ opacity: trailOpacity.value }));
  const washStyle = useAnimatedStyle(() => ({ opacity: sceneWash.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value, transform: [{ scale: cardScale.value }] }));
  const copyStyle = useAnimatedStyle(() => ({ opacity: copyOpacity.value, transform: [{ translateY: copyY.value }] }));

  if (!visible) return null;

  return <View pointerEvents="none" style={styles.overlay}>
    <View style={styles.softWaveOne} /><View style={styles.softWaveTwo} />
    <View style={styles.road}>
      <View style={styles.laneMark} /><View style={styles.laneMark} /><View style={styles.laneMark} />
    </View>
    <Animated.View style={[styles.motionTrails, trailStyle]}>
      <View style={[styles.trail, styles.trailLong]} /><View style={[styles.trail, styles.trailMid]} /><View style={[styles.trail, styles.trailShort]} />
    </Animated.View>
    <Animated.View style={[styles.rider, riderStyle]}>
      <Image source={STAFF_SCOOTER} style={styles.riderImage} contentFit="contain" accessibilityLabel="Nhân viên CleanMaster đang đi xe máy" />
    </Animated.View>
    <Animated.View style={[styles.wash, washStyle]} />
    <View style={styles.brandArea}>
      <Animated.View style={[styles.profileCard, cardStyle]}>
        <View style={styles.avatar}><BrandLogo size={68} /></View>
        <View style={styles.cardLines}><View style={styles.lineStrong} /><View style={styles.lineSoft} /><View style={styles.lineSoftShort} /></View>
        <View style={styles.cardTools}><Text>🧹</Text><Text>🧴</Text><Text>✦</Text></View>
      </Animated.View>
      <Animated.View style={copyStyle}>
        <Text style={styles.brandName}>CleanMaster</Text>
        <Text style={styles.tagline}>Nhân viên sẵn sàng nhận ca</Text>
      </Animated.View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 99, elevation: 99, overflow: 'hidden', backgroundColor: '#F6FFFC' },
  softWaveOne: { position: 'absolute', width: 520, height: 340, borderRadius: 260, backgroundColor: '#E1F8F0', bottom: -155, left: -120, transform: [{ rotate: '-11deg' }] },
  softWaveTwo: { position: 'absolute', width: 460, height: 260, borderRadius: 230, borderWidth: 26, borderColor: '#ECFDF5', bottom: -125, right: -170, transform: [{ rotate: '17deg' }] },
  road: { position: 'absolute', top: '65%', width: '115%', height: 88, backgroundColor: '#185A5A', transform: [{ rotate: '-2deg' }], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 18 },
  laneMark: { width: 48, height: 4, borderRadius: 3, backgroundColor: '#B8FFF0', opacity: 0.92 },
  motionTrails: { position: 'absolute', top: '61%', left: 0, right: 0, height: 94, justifyContent: 'center', gap: 9 },
  trail: { height: 3, borderRadius: 3, backgroundColor: '#B8FFF0', marginLeft: 6, shadowColor: '#2DD4BF', shadowOpacity: 0.68, shadowRadius: 9 },
  trailLong: { width: 252 }, trailMid: { width: 182, marginLeft: 24 }, trailShort: { width: 116, marginLeft: 68 },
  rider: { position: 'absolute', top: '48%', left: 0, width: 390, height: 290 },
  riderImage: { width: '100%', height: '100%' },
  wash: { ...StyleSheet.absoluteFill, backgroundColor: '#ECFFF9' },
  brandArea: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingTop: 92 },
  profileCard: { width: 164, borderRadius: 28, backgroundColor: '#FFFFFF', padding: 14, shadowColor: '#065F52', shadowOpacity: 0.16, shadowRadius: 20, elevation: 8 },
  avatar: { width: 74, height: 74, borderRadius: 24, backgroundColor: '#E8FFF7', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  cardLines: { gap: 6, marginTop: 12 },
  lineStrong: { height: 8, width: 82, borderRadius: 8, backgroundColor: '#9AEBD8' },
  lineSoft: { height: 6, width: 116, borderRadius: 7, backgroundColor: '#D8F6EE' },
  lineSoftShort: { height: 6, width: 74, borderRadius: 7, backgroundColor: '#D8F6EE' },
  cardTools: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#D9F5EE' },
  brandName: { color: '#087C6F', fontSize: 28, fontWeight: '900', textAlign: 'center', marginTop: 13, letterSpacing: -0.5 },
  tagline: { color: '#54756F', fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 5 },
});
