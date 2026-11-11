import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import type { BookingTimingNotice } from '@/utils/booking-timing-notice';

export function BookingTimingPopup({
  notice,
  close,
  adjust,
  changeTime,
}: {
  notice: BookingTimingNotice | null;
  close: () => void;
  adjust: () => void;
  changeTime: () => void;
}) {
  return (
    <Modal visible={!!notice} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.topAccentBar} />
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <IconSymbol name="clock" size={18} color={BrandColors.primaryDark} />
            </View>
            <Text style={styles.title}>{notice?.title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng thông báo thời gian"
              onPress={close}
              hitSlop={10}>
              <IconSymbol name="close" size={18} color={BrandColors.gray500} />
            </Pressable>
          </View>

          <View style={styles.bodyWrap}>
            <Text style={styles.body}>{notice?.message}</Text>
          </View>

          <View style={styles.footer}>
            {(notice?.kind === 'EXTRAS' || notice?.kind === 'PACKAGE') && (
              <Pressable accessibilityRole="button" style={styles.secondary} onPress={changeTime}>
                <Text style={styles.link}>Đổi ngày/giờ</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              style={styles.primary}
              onPress={
                notice?.kind === 'DATE' || notice?.kind === 'TIME'
                  ? changeTime
                  : notice?.kind === 'STATUS'
                    ? close
                    : adjust
              }>
              <Text style={styles.white}>
                {notice?.kind === 'EXTRAS'
                  ? 'Bỏ bớt dịch vụ thêm'
                  : notice?.kind === 'PACKAGE'
                    ? 'Chọn gói ngắn hơn'
                    : notice?.kind === 'STATUS'
                      ? 'Đã hiểu'
                      : 'Chọn lại ngày giờ'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  topAccentBar: {
    height: 3,
    backgroundColor: BrandColors.primary,
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
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  bodyWrap: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: BrandColors.gray700,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primary: {
    flex: 1,
    backgroundColor: BrandColors.primary,
    borderRadius: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  white: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13.5,
  },
  secondary: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    color: BrandColors.gray700,
    fontWeight: '600',
    fontSize: 13.5,
  },
});
