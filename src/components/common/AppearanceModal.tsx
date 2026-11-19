import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/common/IconSymbol';
import {
  BACKGROUND_PRESETS,
  type ThemeMode,
  useAppTheme,
} from '@/context/ThemeContext';

interface AppearanceModalProps {
  visible: boolean;
  onClose: () => void;
}

const MODE_OPTIONS: { key: ThemeMode; label: string; desc: string; badge: string }[] = [
  { key: 'light', label: 'Sáng', desc: 'Tươi sáng, rõ nét', badge: '☀️' },
  { key: 'dark', label: 'Tối', desc: 'Dịu mắt ban đêm', badge: '🌙' },
  { key: 'system', label: 'Hệ thống', desc: 'Theo thiết bị', badge: '⚙️' },
];

export const AppearanceModal: React.FC<AppearanceModalProps> = ({ visible, onClose }) => {
  const { mode, bgPreset, isDark, colors, setMode, setBgPreset, resetAppearance } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropDismiss} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: colors.text }]}>Giao diện & Màu nền</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Thay đổi được áp dụng và lưu tự động trên thiết bị
              </Text>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: colors.surfaceMuted }]}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
            >
              <IconSymbol name="close" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {/* Mode Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                CHẾ ĐỘ HIỂN THỊ
              </Text>
              <View style={styles.modeGrid}>
                {MODE_OPTIONS.map(option => {
                  const active = mode === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.modeCard,
                        {
                          backgroundColor: active ? colors.accentBg : colors.surfaceElevated,
                          borderColor: active ? colors.primaryDark : colors.border,
                        },
                      ]}
                      onPress={() => setMode(option.key)}
                    >
                      <Text style={styles.modeEmoji}>{option.badge}</Text>
                      <Text
                        style={[
                          styles.modeLabel,
                          { color: active ? colors.accentText : colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[styles.modeDesc, { color: colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {option.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Background Preset Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                MÀU SẮC NỀN
              </Text>
              <View style={styles.presetGrid}>
                {BACKGROUND_PRESETS.map(item => {
                  const active = bgPreset === item.id;
                  const previewGradient = isDark ? item.darkGradient : item.lightGradient;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.presetCard,
                        {
                          backgroundColor: active ? colors.accentBg : colors.surfaceElevated,
                          borderColor: active ? colors.primaryDark : colors.border,
                        },
                      ]}
                      onPress={() => setBgPreset(item.id)}
                    >
                      <LinearGradient
                        colors={previewGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.presetPreview, { borderColor: colors.border }]}
                      >
                        <View style={[styles.swatchDot, { backgroundColor: item.swatch }]} />
                        {active && (
                          <View style={[styles.checkBadge, { backgroundColor: colors.primaryDark }]}>
                            <IconSymbol name="check" size={11} color="#FFFFFF" />
                          </View>
                        )}
                      </LinearGradient>
                      <Text
                        style={[
                          styles.presetLabel,
                          { color: active ? colors.accentText : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <Pressable
              accessibilityRole="button"
              style={[styles.resetBtn, { backgroundColor: colors.surfaceMuted }]}
              onPress={resetAppearance}
            >
              <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>Mặc định</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[styles.doneBtn, { backgroundColor: colors.primaryDark }]}
              onPress={onClose}
            >
              <Text style={styles.doneBtnText}>Hoàn tất</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '84%',
    paddingTop: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    gap: 12,
  },
  headerCopy: { flex: 1 },
  title: { fontSize: 17, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    gap: 18,
  },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  modeEmoji: { fontSize: 20 },
  modeLabel: { fontSize: 13, fontWeight: '800' },
  modeDesc: { fontSize: 10, textAlign: 'center' },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetCard: {
    width: '31%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 8,
    alignItems: 'center',
    gap: 7,
  },
  presetPreview: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  checkBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
  },
  resetBtn: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: { fontSize: 14, fontWeight: '800' },
  doneBtn: {
    flex: 2,
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
