import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';

export function FavouriteDurationPopup({
  visible,
  fullPackage,
  packageName,
  shorterName,
  keep,
  lower,
}: {
  visible: boolean;
  fullPackage: boolean;
  packageName: string;
  shorterName?: string;
  keep: () => void;
  lower: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={keep}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={keep} />
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.topAccentBar} />
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <IconSymbol name="clock" size={18} color={BrandColors.primaryDark} />
            </View>
            <Text style={styles.title}>
              {fullPackage ? 'Gói 4 giờ không thể thêm addon' : 'Tổng thời gian tối đa là 4 giờ'}
            </Text>
            <Pressable onPress={keep} hitSlop={10}>
              <IconSymbol name="close" size={18} color={BrandColors.gray500} />
            </Pressable>
          </View>

          <View style={styles.bodyWrap}>
            <Text style={styles.body}>
              {fullPackage
                ? 'Gói 4 giờ đã dùng hết thời gian làm việc tối đa của nhân viên yêu thích. Bạn cần hạ gói chính nếu muốn chọn thêm dịch vụ bổ sung.'
                : 'Gói chính cộng các dịch vụ bổ sung đang vượt quá 4 giờ làm việc của nhân viên yêu thích. Vui lòng giữ lựa chọn hiện tại hoặc hạ gói để thêm dịch vụ.'}
            </Text>
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                {shorterName
                  ? `Có thể đổi sang ${shorterName.toLowerCase()} để thêm dịch vụ vừa chọn mà không vượt thời gian cho phép.`
                  : 'Hiện không có gói thấp hơn đủ thời gian cho các dịch vụ thêm này. Vui lòng giữ gói chính và bỏ bớt dịch vụ thêm.'}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              disabled={!shorterName}
              onPress={lower}
              style={[styles.secondary, !shorterName && { opacity: 0.45 }]}>
              <Text style={styles.link}>Hạ gói</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={keep} style={styles.primary}>
              <Text style={styles.white}>
                {fullPackage ? 'Giữ gói 4 giờ' : `Giữ ${packageName.toLowerCase()}`}
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
    maxWidth: 400,
    width: '100%',
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
    color: BrandColors.gray900,
    fontSize: 16,
    fontWeight: '700',
  },
  bodyWrap: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  body: {
    color: BrandColors.gray700,
    fontSize: 14,
    lineHeight: 20,
  },
  noteBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noteText: {
    color: BrandColors.gray700,
    fontSize: 13,
    lineHeight: 19,
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
    flex: 1.2,
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
