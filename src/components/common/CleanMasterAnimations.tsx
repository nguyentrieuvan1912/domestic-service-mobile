import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BrandColors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

const SPARKLE_SVG = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"/></svg>`;

const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>`;

const STAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21 7 14.2 2 9.3l6.9-1L12 2z"/></svg>`;

const WALLET_CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M16 12.5h.01"/><path d="M7 11l2 2 4-4"/></svg>`;

// ============================================================================
// 1. CleanMasterLoader — Soap Bubbles + Sparkle Theme Loader
// ============================================================================
interface CleanMasterLoaderProps {
  label?: string;
  sublabel?: string;
  compact?: boolean;
  style?: ViewStyle;
}

export const CleanMasterLoader: React.FC<CleanMasterLoaderProps> = ({
  label,
  sublabel,
  compact = false,
  style,
}) => {
  const { colors } = useAppTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const makeBubble = (val: Animated.Value, delay: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const b1 = makeBubble(bubble1, 0, 1400);
    const b2 = makeBubble(bubble2, 420, 1500);
    const b3 = makeBubble(bubble3, 820, 1350);

    spinLoop.start();
    pulseLoop.start();
    b1.start();
    b2.start();
    b3.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
      b1.stop();
      b2.stop();
      b3.stop();
    };
  }, [spin, pulse, bubble1, bubble2, bubble3]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const orbScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });

  const renderBubble = (val: Animated.Value, left: number, size: number) => {
    const translateY = val.interpolate({ inputRange: [0, 1], outputRange: [12, -26] });
    const opacity = val.interpolate({ inputRange: [0, 0.25, 0.8, 1], outputRange: [0, 0.85, 0.65, 0] });
    const scale = val.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.15] });
    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          {
            left,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: BrandColors.primary,
            backgroundColor: colors.accentBg,
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      />
    );
  };

  const orbSize = compact ? 42 : 58;

  return (
    <View style={[styles.loaderWrap, compact && styles.loaderWrapCompact, style]}>
      <View style={[styles.loaderStage, { width: orbSize + 28, height: orbSize + 20 }]}>
        {renderBubble(bubble1, compact ? 4 : 6, compact ? 9 : 11)}
        {renderBubble(bubble2, compact ? orbSize + 8 : orbSize + 10, compact ? 11 : 14)}
        {renderBubble(bubble3, compact ? orbSize / 2 + 10 : orbSize / 2 + 12, compact ? 7 : 9)}

        <Animated.View
          style={[
            styles.loaderOrb,
            {
              width: orbSize,
              height: orbSize,
              borderRadius: orbSize / 2,
              backgroundColor: colors.accentBg,
              borderColor: colors.accentBorder,
              transform: [{ scale: orbScale }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <SvgXml xml={SPARKLE_SVG(BrandColors.primary)} width={compact ? 22 : 28} height={compact ? 22 : 28} />
          </Animated.View>
        </Animated.View>
      </View>

      {!!label && (
        <Text style={[styles.loaderLabel, { color: colors.text }]}>{label}</Text>
      )}
      {!!sublabel && (
        <Text style={[styles.loaderSublabel, { color: colors.textMuted }]}>{sublabel}</Text>
      )}
    </View>
  );
};

// ============================================================================
// 2. RadarPulseAura — Concentric Emerald Pulse Rings
// ============================================================================
interface RadarPulseAuraProps {
  active?: boolean;
  size?: number;
  color?: string;
  children: React.ReactNode;
}

export const RadarPulseAura: React.FC<RadarPulseAuraProps> = ({
  active = true,
  size = 128,
  color = BrandColors.primary,
  children,
}) => {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      ring1.setValue(0);
      ring2.setValue(0);
      return;
    }
    const loop1 = Animated.loop(
      Animated.timing(ring1, {
        toValue: 1,
        duration: 2100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(950),
        Animated.timing(ring2, {
          toValue: 1,
          duration: 2100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ring2, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop1.start();
    loop2.start();
    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [active, ring1, ring2]);

  const makeRingStyle = (val: Animated.Value) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    borderColor: color,
    opacity: val.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.55, 0.4, 0] }),
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.75] }) }],
  });

  return (
    <View style={[styles.radarWrap, { width: size * 1.45, height: size * 1.45 }]}>
      {active && (
        <>
          <Animated.View pointerEvents="none" style={[styles.radarRing, makeRingStyle(ring1)]} />
          <Animated.View pointerEvents="none" style={[styles.radarRing, makeRingStyle(ring2)]} />
        </>
      )}
      {children}
    </View>
  );
};

// ============================================================================
// 3. LivePulseDot — Subtle Breathing Status Beacon (Staff Online)
// ============================================================================
export const LivePulseDot: React.FC<{ active: boolean; size?: number }> = ({
  active,
  size = 10,
}) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  return (
    <View style={{ width: size * 2, height: size * 2, alignItems: 'center', justifyContent: 'center' }}>
      {active && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#4ADE80',
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
          }}
        />
      )}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? '#4ADE80' : '#94A3B8',
        }}
      />
    </View>
  );
};

// ============================================================================
// 4. SparkleTypingDots — CleanMaster AI Thinking Wave
// ============================================================================
export const SparkleTypingDots: React.FC<{ label?: string }> = ({
  label = 'CleanMaster AI đang trả lời…',
}) => {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 340, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 340, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(240),
        ]),
      );
    const a1 = bounce(d1, 0);
    const a2 = bounce(d2, 140);
    const a3 = bounce(d3, 280);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [d1, d2, d3]);

  const dotStyle = (val: Animated.Value) => ({
    transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
  });

  return (
    <View style={styles.typingWrap}>
      <View style={styles.typingDotsRow}>
        <Animated.View style={[styles.typingDot, dotStyle(d1)]} />
        <Animated.View style={[styles.typingDot, dotStyle(d2)]} />
        <Animated.View style={[styles.typingDot, dotStyle(d3)]} />
      </View>
      <Text style={styles.typingLabel}>{label}</Text>
    </View>
  );
};

// ============================================================================
// 5. ShimmerSkeleton — Clean Card Placeholder Loader
// ============================================================================
export const ShimmerSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const { colors } = useAppTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] });

  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }, (_, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.skeletonCard,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity },
          ]}
        >
          <View style={[styles.skeletonAvatar, { backgroundColor: colors.surfaceMuted }]} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLineLg, { backgroundColor: colors.surfaceMuted }]} />
            <View style={[styles.skeletonLineSm, { backgroundColor: colors.surfaceMuted }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// ============================================================================
// 6. CelebrationOverlay — CleanMaster Sparkle & Bubble Success Modal
// ============================================================================
export type CelebrationVariant = 'booking' | 'payment' | 'review' | 'complete';

interface CelebrationOverlayProps {
  visible: boolean;
  variant?: CelebrationVariant;
  title: string;
  subtitle?: string;
  badgeText?: string;
  actionLabel?: string;
  autoDismissMs?: number;
  onDone: () => void;
}

const PARTICLES = [
  { angle: -80, dist: 64, size: 12, color: '#10B981', kind: 'sparkle' },
  { angle: -35, dist: 72, size: 10, color: '#34D399', kind: 'bubble' },
  { angle: 15, dist: 68, size: 13, color: '#F59E0B', kind: 'sparkle' },
  { angle: 65, dist: 60, size: 9, color: '#059669', kind: 'bubble' },
  { angle: 125, dist: 66, size: 12, color: '#10B981', kind: 'sparkle' },
  { angle: 165, dist: 70, size: 10, color: '#38BDF8', kind: 'bubble' },
  { angle: 215, dist: 64, size: 12, color: '#F59E0B', kind: 'sparkle' },
  { angle: 255, dist: 58, size: 8, color: '#6EE7B7', kind: 'bubble' },
] as const;

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  visible,
  variant = 'booking',
  title,
  subtitle,
  badgeText,
  actionLabel = 'Tiếp tục',
  autoDismissMs,
  onDone,
}) => {
  const { colors } = useAppTheme();
  const cardScale = useRef(new Animated.Value(0.84)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.3)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!visible) return;
    cardScale.setValue(0.84);
    cardOpacity.setValue(0);
    iconScale.setValue(0.3);
    burst.setValue(0);

    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(90),
        Animated.spring(iconScale, { toValue: 1, friction: 5, tension: 95, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(140),
        Animated.timing(burst, { toValue: 1, duration: 760, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    if (!autoDismissMs) return;
    const timer = setTimeout(() => doneRef.current(), autoDismissMs);
    return () => clearTimeout(timer);
  }, [visible, autoDismissMs, cardScale, cardOpacity, iconScale, burst]);

  const badgeBg = variant === 'review' ? '#F59E0B' : '#059669';
  const iconXml =
    variant === 'review'
      ? STAR_SVG
      : variant === 'payment'
        ? WALLET_CHECK_SVG
        : CHECK_SVG;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDone}>
      <View style={styles.celebBackdrop}>
        <Animated.View
          style={[
            styles.celebCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Burst Stage */}
          <View style={styles.celebStage}>
            {PARTICLES.map((p, i) => {
              const rad = (p.angle * Math.PI) / 180;
              const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(rad) * p.dist] });
              const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(rad) * p.dist] });
              const opacity = burst.interpolate({ inputRange: [0, 0.25, 0.85, 1], outputRange: [0, 1, 0.9, 0] });
              const scale = burst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.3, 1.15, 0.7] });
              return (
                <Animated.View
                  key={i}
                  pointerEvents="none"
                  style={[styles.particle, { opacity, transform: [{ translateX: tx }, { translateY: ty }, { scale }] }]}
                >
                  {p.kind === 'sparkle' ? (
                    <SvgXml xml={SPARKLE_SVG(p.color)} width={p.size} height={p.size} />
                  ) : (
                    <View
                      style={{
                        width: p.size,
                        height: p.size,
                        borderRadius: p.size / 2,
                        borderWidth: 1.5,
                        borderColor: p.color,
                        backgroundColor: `${p.color}22`,
                      }}
                    />
                  )}
                </Animated.View>
              );
            })}

            <Animated.View
              style={[
                styles.celebIconCircle,
                { backgroundColor: badgeBg, transform: [{ scale: iconScale }] },
              ]}
            >
              <SvgXml xml={iconXml} width={36} height={36} />
            </Animated.View>
          </View>

          <Text style={[styles.celebTitle, { color: colors.text }]}>{title}</Text>
          {!!subtitle && (
            <Text style={[styles.celebSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          )}
          {!!badgeText && (
            <View style={[styles.celebPill, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
              <Text style={[styles.celebPillText, { color: colors.accentText }]}>{badgeText}</Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            style={[styles.celebButton, { backgroundColor: colors.primaryDark }]}
            onPress={onDone}
          >
            <Text style={styles.celebButtonText}>{actionLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ============================================================================
// 7. AnimatedNoticeBanner — Spring Slide-in Success Banner
// ============================================================================
export const AnimatedNoticeBanner: React.FC<{ message: string }> = ({ message }) => {
  const { colors } = useAppTheme();
  const translateY = useRef(new Animated.Value(-10)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    translateY.setValue(-10);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 7, tension: 90, useNativeDriver: true }),
    ]).start();
  }, [message, translateY, opacity]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: colors.accentBg,
          borderColor: colors.accentBorder,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.bannerCheck}>
        <SvgXml xml={CHECK_SVG} width={12} height={12} />
      </View>
      <Text accessibilityLiveRegion="polite" style={[styles.bannerText, { color: colors.accentText }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  loaderWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 6 },
  loaderWrapCompact: { paddingVertical: 8, gap: 4 },
  loaderStage: { alignItems: 'center', justifyContent: 'center' },
  loaderOrb: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  bubble: { position: 'absolute', bottom: 8, borderWidth: 1.5 },
  loaderLabel: { fontSize: 14, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  loaderSublabel: { fontSize: 12, textAlign: 'center', lineHeight: 17 },

  radarWrap: { alignItems: 'center', justifyContent: 'center' },
  radarRing: { position: 'absolute', borderWidth: 2 },

  typingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 6,
  },
  typingDotsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#059669' },
  typingLabel: { fontSize: 12, fontWeight: '700', color: '#047857' },

  skeletonList: { padding: 16, gap: 12 },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  skeletonAvatar: { width: 42, height: 42, borderRadius: 12 },
  skeletonLines: { flex: 1, gap: 8 },
  skeletonLineLg: { height: 13, width: '68%', borderRadius: 6 },
  skeletonLineSm: { height: 10, width: '44%', borderRadius: 5 },

  celebBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  celebCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  celebStage: {
    width: 140,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  particle: { position: 'absolute' },
  celebIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  celebTitle: { fontSize: 19, fontWeight: '900', textAlign: 'center' },
  celebSubtitle: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  celebPill: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  celebPillText: { fontSize: 12, fontWeight: '800' },
  celebButton: {
    alignSelf: 'stretch',
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  celebButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 17 },
});
