import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';

export function FavouriteDurationPopup({ visible, fullPackage, packageName, shorterName, keep, lower }: {
  visible: boolean; fullPackage: boolean; packageName: string; shorterName?: string; keep: () => void; lower: () => void;
}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={keep}>
    <View style={styles.scrim}><View style={styles.card} accessibilityViewIsModal>
      <IconSymbol name="clock" size={30} color={BrandColors.primary} />
      <Text style={styles.title}>{fullPackage ? 'Gói 4 giờ không thể thêm addon' : 'Tổng thời gian tối đa là 4 giờ'}</Text>
      <Text style={styles.body}>{fullPackage ? 'Gói 4 giờ đã dùng hết thời gian làm việc tối đa của nhân viên yêu thích. Bạn cần hạ gói chính nếu muốn chọn thêm dịch vụ bổ sung.' : 'Gói chính cộng các dịch vụ bổ sung đang vượt quá 4 giờ làm việc của nhân viên yêu thích. Vui lòng giữ lựa chọn hiện tại hoặc hạ gói để thêm dịch vụ.'}</Text>
      <Text style={styles.body}>{shorterName ? `Có thể đổi sang ${shorterName.toLowerCase()} để thêm dịch vụ vừa chọn mà không vượt thời gian cho phép.` : 'Hiện không có gói thấp hơn đủ thời gian cho các dịch vụ thêm này. Vui lòng giữ gói chính và bỏ bớt dịch vụ thêm.'}</Text>
      <Pressable accessibilityRole="button" onPress={keep} style={styles.primary}><Text style={styles.white}>{fullPackage ? 'Giữ gói 4 giờ' : `Giữ ${packageName.toLowerCase()}`}</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={!shorterName} onPress={lower} style={[styles.secondary, !shorterName && { opacity: 0.45 }]}><Text style={styles.link}>Hạ gói để chọn thêm addon</Text></Pressable>
    </View></View>
  </Modal>;
}
const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: '#0007', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 20, gap: 16, maxWidth: 440, width: '100%', alignSelf: 'center' },
  title: { color: BrandColors.gray900, fontSize: 20, fontWeight: '800' },
  body: { color: BrandColors.gray700, fontSize: 15, lineHeight: 23 },
  primary: { backgroundColor: BrandColors.primary, borderRadius: 12, padding: 15, alignItems: 'center' },
  white: { color: '#fff', fontWeight: '700' },
  secondary: { padding: 12, alignItems: 'center' }, link: { color: BrandColors.primaryDark, fontWeight: '700' },
});
