import React, { useEffect, useState } from 'react';
import {
  Alert,
  type AlertButton,
  type AlertOptions,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';

interface AlertPayload {
  id: number;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

interface PopupThemeConfig {
  iconName: string;
  accentColor: string;
  iconBg: string;
}

function resolvePopupTheme(title: string, message = '', buttons?: AlertButton[]): PopupThemeConfig {
  const lower = `${title} ${message}`.toLowerCase();
  const hasDestructive = buttons?.some(b => b.style === 'destructive');

  if (title.includes('Tổng đài hỗ trợ') || lower.includes('hotline') || lower.includes('liên hệ khách hàng')) {
    return {
      iconName: 'phone',
      accentColor: BrandColors.primaryDark,
      iconBg: '#ECFDF5',
    };
  }

  if (
    title.includes('Điều khoản') ||
    title.includes('Bảo mật') ||
    title.includes('Hồ sơ pháp lý') ||
    title.includes('Quy định đối soát')
  ) {
    return {
      iconName: 'shield',
      accentColor: BrandColors.primaryDark,
      iconBg: '#ECFDF5',
    };
  }

  if (
    hasDestructive ||
    title.startsWith('Lỗi') ||
    title.startsWith('Chưa ') ||
    title.startsWith('Không thể') ||
    title.includes('Hủy ') ||
    title.includes('Xóa ') ||
    title.includes('Đăng xuất')
  ) {
    return {
      iconName: 'warning',
      accentColor: '#DC2626',
      iconBg: '#FEF2F2',
    };
  }

  if (
    title.includes('Báo cáo sự cố') ||
    title.includes('Thiếu thông tin') ||
    title.includes('Hoàn tất nhu cầu') ||
    title.includes('Chọn địa chỉ') ||
    title.includes('Chọn phường/xã')
  ) {
    return {
      iconName: title.includes('Báo cáo') ? 'flag' : 'info',
      accentColor: '#D97706',
      iconBg: '#FFFBEB',
    };
  }

  if (
    title.includes('Thành công') ||
    title.includes('Đã lưu') ||
    title.includes('Đã cập nhật') ||
    title.includes('Đã gửi') ||
    title.includes('Đã hủy') ||
    title.includes('Cảm ơn') ||
    title.includes('Chúc mừng')
  ) {
    return {
      iconName: 'check',
      accentColor: BrandColors.primaryDark,
      iconBg: '#ECFDF5',
    };
  }

  return {
    iconName: 'info',
    accentColor: BrandColors.primaryDark,
    iconBg: '#ECFDF5',
  };
}

let alertListener: ((payload: AlertPayload) => void) | null = null;
let nextAlertId = 1;
let isPatched = false;

function patchNativeAlert() {
  if (isPatched) return;
  isPatched = true;
  const originalAlert = Alert.alert.bind(Alert);

  Alert.alert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions
  ) => {
    if (alertListener) {
      alertListener({
        id: nextAlertId++,
        title: title || 'Thông báo',
        message,
        buttons,
        options,
      });
    } else {
      originalAlert(title, message, buttons, options);
    }
  };
}

patchNativeAlert();

export function SystemAlertHost() {
  const [queue, setQueue] = useState<AlertPayload[]>([]);

  useEffect(() => {
    patchNativeAlert();
    alertListener = payload => {
      setQueue(prev => [...prev, payload]);
    };
    return () => {
      alertListener = null;
    };
  }, []);

  const current = queue[0];
  if (!current) return null;

  const dismissCurrent = (callback?: AlertButton['onPress']) => {
    setQueue(prev => prev.slice(1));
    if (typeof callback === 'function') {
      setTimeout(() => {
        callback();
      }, 40);
    }
  };

  const handleBackdropDismiss = () => {
    if (current.options?.cancelable === false) return;
    const cancelBtn = current.buttons?.find(b => b.style === 'cancel');
    dismissCurrent(() => {
      cancelBtn?.onPress?.();
      current.options?.onDismiss?.();
    });
  };

  const theme = resolvePopupTheme(current.title, current.message, current.buttons);
  const buttons: AlertButton[] =
    current.buttons && current.buttons.length > 0
      ? current.buttons
      : [{ text: 'Đóng', style: 'default' }];

  const isMultiChoiceList = buttons.length >= 3;
  const cancelBtn = buttons.find(b => b.style === 'cancel');
  const actionButtons = isMultiChoiceList ? buttons.filter(b => b.style !== 'cancel') : buttons;

  const renderBodyContent = () => {
    // 1. Tổng đài hỗ trợ CleanMaster
    if (current.title.includes('Tổng đài hỗ trợ CleanMaster')) {
      return (
        <View style={styles.sectionList}>
          <Pressable
            style={styles.infoRow}
            onPress={() => void Linking.openURL('tel:19006868').catch(() => undefined)}>
            <View style={styles.rowIconWrap}>
              <IconSymbol name="phone" size={18} color={BrandColors.primaryDark} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Hotline miễn phí (08:00 – 21:00)</Text>
              <Text style={styles.rowValuePrimary}>1900 6868</Text>
            </View>
            <View style={styles.actionTag}>
              <Text style={styles.actionTagText}>Gọi</Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.infoRow}
            onPress={() => void Linking.openURL('mailto:cskh@homecare.vn').catch(() => undefined)}>
            <View style={styles.rowIconWrap}>
              <IconSymbol name="mail" size={18} color={BrandColors.primaryDark} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Email hỗ trợ khách hàng</Text>
              <Text style={styles.rowValue}>cskh@homecare.vn</Text>
            </View>
            <View style={styles.actionTag}>
              <Text style={styles.actionTagText}>Gửi mail</Text>
            </View>
          </Pressable>
        </View>
      );
    }

    // 2. Điều khoản sử dụng & Bảo mật
    if (current.title.includes('Điều khoản sử dụng & Bảo mật')) {
      return (
        <View style={styles.sectionList}>
          <View style={styles.infoRow}>
            <View style={styles.rowIconWrap}>
              <IconSymbol name="lock" size={18} color={BrandColors.primaryDark} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Bảo mật dữ liệu cá nhân</Text>
              <Text style={styles.rowDesc}>
                Thông tin liên hệ và địa chỉ của khách hàng được bảo mật, chỉ cung cấp cho nhân viên phụ trách ca làm.
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.rowIconWrap}>
              <IconSymbol name="shield" size={18} color={BrandColors.primaryDark} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Nhân viên đã xác minh</Text>
              <Text style={styles.rowDesc}>
                Toàn bộ đối tác cung cấp dịch vụ đều được xác minh danh tính, kiểm tra lý lịch tư pháp và đào tạo nghiệp vụ.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // 3. Hồ sơ pháp lý & Chứng nhận
    if (current.title.includes('Hồ sơ pháp lý & Chứng nhận')) {
      return (
        <View style={styles.sectionList}>
          <View style={styles.infoRow}>
            <View style={styles.rowIconWrap}>
              <IconSymbol name="shield" size={18} color={BrandColors.primaryDark} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Trạng thái hồ sơ</Text>
              <Text style={styles.rowDesc}>
                {current.message ||
                  'Chưa có thông tin chứng nhận pháp lý chi tiết được cấp quyền xem. Liên hệ người phụ trách hồ sơ qua kênh công ty đã cấp để được hỗ trợ.'}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // 4. Mã đơn hàng
    if (current.title === 'Mã đơn hàng' && current.message) {
      return (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Mã đơn dịch vụ</Text>
          <Text style={styles.codeValue}>{current.message}</Text>
        </View>
      );
    }

    if (!current.message) return null;

    const lines = current.message
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length > 1) {
      return (
        <View style={styles.sectionList}>
          {lines.map((line, index) => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0 && colonIndex < 32) {
              const label = line.slice(0, colonIndex).trim();
              const val = line.slice(colonIndex + 1).trim();
              return (
                <View key={index} style={styles.infoRow}>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>{label}</Text>
                    <Text style={styles.rowValue}>{val}</Text>
                  </View>
                </View>
              );
            }
            return (
              <View key={index} style={styles.infoRow}>
                <Text style={styles.messageText}>{line}</Text>
              </View>
            );
          })}
        </View>
      );
    }

    return <Text style={styles.messageText}>{current.message}</Text>;
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleBackdropDismiss}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdropTap} onPress={handleBackdropDismiss} />

        <View style={styles.dialogCard} accessibilityViewIsModal>
          <View style={[styles.topAccentBar, { backgroundColor: theme.accentColor }]} />

          {/* Clean Header */}
          <View style={styles.header}>
            <View style={[styles.headerIconBox, { backgroundColor: theme.iconBg }]}>
              <IconSymbol name={theme.iconName} size={18} color={theme.accentColor} />
            </View>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {current.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng hộp thoại"
              hitSlop={8}
              onPress={handleBackdropDismiss}
              style={styles.closeBtn}>
              <IconSymbol name="close" size={16} color={BrandColors.gray500} />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            {renderBodyContent()}

            {isMultiChoiceList && (
              <View style={styles.choiceList}>
                {actionButtons.map((btn, idx) => {
                  const isDestructive = btn.style === 'destructive';
                  return (
                    <Pressable
                      key={idx}
                      accessibilityRole="button"
                      onPress={() => dismissCurrent(btn.onPress)}
                      style={({ pressed }) => [
                        styles.choiceItem,
                        isDestructive && styles.choiceItemDestructive,
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          styles.choiceItemText,
                          isDestructive && { color: '#DC2626' },
                        ]}>
                        {btn.text || 'Tùy chọn'}
                      </Text>
                      <IconSymbol
                        name="chevronRight"
                        size={16}
                        color={isDestructive ? '#DC2626' : BrandColors.gray400}
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {isMultiChoiceList ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => dismissCurrent(cancelBtn?.onPress)}
                style={({ pressed }) => [styles.secondaryButton, { flex: 1 }, pressed && styles.pressed]}>
                <Text style={styles.secondaryButtonText}>{cancelBtn?.text || 'Đóng'}</Text>
              </Pressable>
            ) : (
              actionButtons.map((btn, idx) => {
                const isCancel =
                  btn.style === 'cancel' ||
                  (actionButtons.length > 1 && idx === 0 && btn.style !== 'destructive');
                const isDestructive = btn.style === 'destructive';

                if (isCancel) {
                  return (
                    <Pressable
                      key={idx}
                      accessibilityRole="button"
                      onPress={() => dismissCurrent(btn.onPress)}
                      style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                      <Text style={styles.secondaryButtonText}>{btn.text || 'Hủy'}</Text>
                    </Pressable>
                  );
                }

                return (
                  <Pressable
                    key={idx}
                    accessibilityRole="button"
                    onPress={() => dismissCurrent(btn.onPress)}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      isDestructive && styles.destructiveButton,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.primaryButtonText}>{btn.text || 'Đồng ý'}</Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropTap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 390,
    maxHeight: '84%',
    backgroundColor: '#FFFFFF',
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
  headerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  sectionList: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  rowValuePrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
  },
  actionTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  codeBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    gap: 4,
  },
  codeLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  choiceList: {
    gap: 8,
    marginTop: 4,
  },
  choiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  choiceItemDestructive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  choiceItemText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
  },
  primaryButton: {
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
    backgroundColor: '#DC2626',
  },
  primaryButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
  },
});
