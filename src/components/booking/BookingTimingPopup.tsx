import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import type { BookingTimingNotice } from '@/utils/booking-timing-notice';

export function BookingTimingPopup({ notice, close, adjust, changeTime }: { notice: BookingTimingNotice | null; close: () => void; adjust: () => void; changeTime: () => void }) {
  return <Modal visible={!!notice} transparent animationType="fade" onRequestClose={close}>
    <View style={styles.scrim}><View style={styles.card} accessibilityViewIsModal>
      <View style={styles.header}><IconSymbol name="clock" size={26} color={BrandColors.primary} /><Pressable accessibilityRole="button" accessibilityLabel="Đóng thông báo thời gian" onPress={close} hitSlop={10}><IconSymbol name="close" size={20} /></Pressable></View>
      <Text style={styles.title}>{notice?.title}</Text>
      <Text style={styles.body}>{notice?.message}</Text>
      <Pressable accessibilityRole="button" style={styles.primary} onPress={notice?.kind === 'DATE' || notice?.kind === 'TIME' ? changeTime : notice?.kind === 'STATUS' ? close : adjust}><Text style={styles.white}>{notice?.kind === 'EXTRAS' ? 'Bỏ bớt dịch vụ thêm' : notice?.kind === 'PACKAGE' ? 'Chọn gói ngắn hơn' : notice?.kind === 'STATUS' ? 'Đã hiểu' : 'Chọn lại ngày giờ'}</Text></Pressable>
      {(notice?.kind === 'EXTRAS' || notice?.kind === 'PACKAGE') && <Pressable accessibilityRole="button" style={styles.secondary} onPress={changeTime}><Text style={styles.link}>Chọn ngày/giờ khác</Text></Pressable>}
    </View></View>
  </Modal>;
}
const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: '#0007', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 22, gap: 16, width: '100%', maxWidth: 440, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700', color: BrandColors.gray900 },
  body: { fontSize: 15, lineHeight: 23, color: BrandColors.gray700 },
  primary: { backgroundColor: BrandColors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  white: { color: '#fff', fontWeight: '700' },
  secondary: { padding: 10, alignItems: 'center' }, link: { color: BrandColors.primaryDark, fontWeight: '600' },
});
