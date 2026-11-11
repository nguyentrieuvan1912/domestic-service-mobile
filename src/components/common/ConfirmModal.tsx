import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { BrandColors, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const accentColor = isDestructive ? BrandColors.danger : BrandColors.primaryDark;
  const iconBg = isDestructive ? '#FEF2F2' : '#ECFDF5';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropTap} onPress={onCancel} />
        <View style={styles.contentBox} accessibilityViewIsModal>
          <View style={[styles.topAccentBar, { backgroundColor: accentColor }]} />

          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
              <IconSymbol
                name={isDestructive ? 'warning' : 'info'}
                size={18}
                color={accentColor}
              />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onCancel} hitSlop={8} style={styles.closeBtn}>
              <IconSymbol name="close" size={16} color={BrandColors.gray500} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmButton,
                isDestructive && styles.destructiveButton,
              ]}
              onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  backdropTap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  contentBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  topAccentBar: {
    height: 3,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  message: {
    fontSize: 14,
    color: BrandColors.gray700,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: BrandColors.gray700,
  },
  confirmButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveButton: {
    backgroundColor: BrandColors.danger,
  },
  confirmText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFF',
  },
});
