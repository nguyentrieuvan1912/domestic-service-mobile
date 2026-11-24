import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/theme';

const DECOR_SPARKLES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" fill="none">
  <circle cx="95" cy="18" r="26" fill="#FFFFFF" fill-opacity="0.08"/>
  <path d="M22 14l1.8 4.8 4.8 1.8-4.8 1.8-1.8 4.8-1.8-4.8-4.8-1.8 4.8-1.8 1.8-4.8z" fill="#FDE68A" fill-opacity="0.7"/>
  <path d="M104 54l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3 1.3-3.4z" fill="#FFFFFF" fill-opacity="0.45"/>
</svg>`;

interface StaffSpotlightCardProps {
  onPress: () => void;
}

export const StaffSpotlightCard: React.FC<StaffSpotlightCardProps> = ({ onPress }) => {
  const sheen = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const arrowNudge = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sheenLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(sheen, {
          toValue: 1,
          duration: 1250,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(1800),
      ]),
    );

    const haloLoop = Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 2100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );

    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowNudge, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arrowNudge, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    sheenLoop.start();
    haloLoop.start();
    arrowLoop.start();

    return () => {
      sheenLoop.stop();
      haloLoop.stop();
      arrowLoop.stop();
    };
  }, [sheen, halo, arrowNudge]);

  const sheenX = sheen.interpolate({ inputRange: [0, 1], outputRange: [-160, 420] });
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.55] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.55, 0.3, 0] });
  const arrowX = arrowNudge.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.975, friction: 7, tension: 120, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.outerWrap, { transform: [{ scale: pressScale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Chọn nhân viên theo nhu cầu của riêng bạn"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <LinearGradient
          colors={['#065F46', '#0D9488', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Decorative sparkles */}
          <View pointerEvents="none" style={styles.decorRight}>
            <SvgXml xml={DECOR_SPARKLES} width={120} height={80} />
          </View>

          {/* Animated diagonal light sheen */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sheenBeam,
              { transform: [{ translateX: sheenX }, { rotate: '22deg' }] },
            ]}
          />

          {/* Left: Pulsing Staff Icon + 5★ Mini Badge */}
          <View style={styles.iconStage}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.haloRing,
                { opacity: haloOpacity, transform: [{ scale: haloScale }] },
              ]}
            />
            <View style={styles.iconCircle}>
              <IconSymbol name="users" size={21} color="#065F46" />
            </View>
            <View style={styles.starMiniBadge}>
              <Text style={styles.starMiniText}>5★</Text>
            </View>
          </View>

          {/* Middle: Eyebrow pill + Title + Subtitle */}
          <View style={styles.textCol}>
            <View style={styles.pillRow}>
              <View style={styles.featuredPill}>
                <Text style={styles.featuredPillText}>✦ CHỌN THỢ ĐÍCH DANH</Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={1}>
              Chọn nhân viên theo nhu cầu riêng
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Duyệt hồ sơ CCCD, xem đánh giá 5★ & chọn ngay
            </Text>
          </View>

          {/* Right: Animated CTA button */}
          <View style={styles.ctaCircle}>
            <Animated.View style={{ transform: [{ translateX: arrowX }] }}>
              <IconSymbol name="chevronRight" size={16} color="#065F46" />
            </Animated.View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    marginHorizontal: Spacing.three,
  },
  card: {
    borderRadius: BorderRadius.xl + 2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 243, 208, 0.55)',
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  decorRight: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheenBeam: {
    position: 'absolute',
    top: -30,
    bottom: -30,
    width: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  iconStage: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloRing: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  starMiniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -3,
    backgroundColor: '#F59E0B',
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#065F46',
  },
  starMiniText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredPill: {
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  featuredPillText: {
    color: '#92400E',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 11,
    color: '#D1FAE5',
    fontWeight: '600',
  },
  ctaCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
});
