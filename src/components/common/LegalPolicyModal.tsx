import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BrandColors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';

export type LegalPolicyTab = 'terms' | 'privacy';

interface PolicySection {
  heading: string;
  body: string;
}

const POLICY_CONTENT: Record<
  LegalPolicyTab,
  { title: string; updatedAt: string; intro: string; sections: PolicySection[] }
> = {
  terms: {
    title: 'Điều khoản sử dụng CleanMaster',
    updatedAt: 'Cập nhật: 23/11/2026',
    intro:
      'Khi tạo tài khoản và sử dụng ứng dụng CleanMaster, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ các điều khoản dưới đây.',
    sections: [
      {
        heading: '1. Phạm vi dịch vụ & Vai trò các bên',
        body: 'CleanMaster là nền tảng kết nối Khách hàng với đội ngũ Đối tác Nhân viên đã được xác minh CCCD và đào tạo quy trình chuẩn cho các dịch vụ dọn dẹp theo ca, dọn dẹp định kỳ, tổng vệ sinh và dịch vụ bổ sung (Sofa, Rèm, Nệm, Thảm…). Khách hàng chủ động cung cấp địa chỉ, thời gian và yêu cầu công việc chính xác trước khi xác nhận đặt đơn.',
      },
      {
        heading: '2. Đặt lịch, Xác nhận 5 phút & Hủy đơn',
        body: 'Khi chọn nhân viên đích danh (bao gồm Đặt lại nhanh), nhân viên có tối đa 5 phút để xác nhận nhận lịch. Hết thời gian, bạn có thể gia hạn chờ, chọn nhân viên khác hoặc chuyển sang chế độ hệ thống tự động ghép. Phí hủy (nếu có) phụ thuộc vào thời điểm hủy và trạng thái đơn, luôn được hiển thị rõ trước khi bạn xác nhận.',
      },
      {
        heading: '3. Giá dịch vụ, Mã khuyến mãi & Thanh toán',
        body: 'Giá dịch vụ được tính minh bạch theo bảng giá hiện hành trên hệ thống, cộng dồn dịch vụ bổ sung và trừ giảm giá từ mã khuyến mãi hợp lệ. CleanMaster hỗ trợ thanh toán Tiền mặt sau khi hoàn thành, Ví CleanMaster và Chuyển khoản QR qua payOS. Với đơn đủ điều kiện hoàn tiền, số tiền được hoàn tự động về Ví CleanMaster.',
      },
      {
        heading: '4. Trợ lý AI 24/7 & Quy tắc Cộng đồng',
        body: 'Trợ lý AI CleanMaster (Chat & Giọng nói) hỗ trợ tư vấn gói theo diện tích, ước lượng chi phí và giải đáp chính sách. AI không tự ý đặt đơn, trừ tiền hay thay đổi quyết định của bạn. Khi tham gia mục Cộng đồng, vui lòng giữ thái độ văn minh, không đăng spam, nội dung xúc phạm hoặc thông tin sai sự thật.',
      },
      {
        heading: '5. Khiếu nại & Bảo đảm chất lượng',
        body: 'Mọi góp ý về chất lượng phục vụ hoặc sự cố hư hại tài sản vui lòng gửi trong chi tiết đơn hàng hoặc gọi Hotline 1900 6868 (08:00 – 21:00 hàng ngày) trong vòng 24 giờ kể từ khi hoàn tất ca làm để CleanMaster kiểm tra ảnh minh chứng và hỗ trợ kịp thời.',
      },
    ],
  },
  privacy: {
    title: 'Chính sách bảo mật CleanMaster',
    updatedAt: 'Cập nhật: 23/11/2026',
    intro:
      'CleanMaster cam kết tôn trọng và bảo vệ tuyệt đối dữ liệu cá nhân của khách hàng trong suốt quá trình sử dụng dịch vụ.',
    sections: [
      {
        heading: '1. Thông tin chúng tôi thu thập',
        body: 'Chúng tôi chỉ thu thập thông tin cần thiết để cung cấp dịch vụ gồm: Họ tên, Email (Gmail xác thực), Số điện thoại, Sổ địa chỉ phục vụ, lịch sử đơn hàng, giao dịch ví và nội dung bạn chủ động chia sẻ trên mục Cộng đồng hoặc đánh giá dịch vụ.',
      },
      {
        heading: '2. Quyền Vị trí (GPS), Micro & Camera',
        body: '• Vị trí GPS: chỉ dùng khi bạn chủ động bấm định vị để điền nhanh địa chỉ phục vụ.\n• Micro & Camera: chỉ kích hoạt khi bạn sử dụng Trợ lý AI giọng nói hoặc tham gia cuộc gọi thoại/video trong đơn hàng.\nCleanMaster không bao giờ ghi âm hay theo dõi ngầm khi bạn không sử dụng các tính năng này.',
      },
      {
        heading: '3. Bảo mật giao tiếp Chat & Gọi Video',
        body: 'Tin nhắn và cuộc gọi thoại/video giữa Khách hàng và Nhân viên được thực hiện trực tiếp trong phiên đơn hàng trên ứng dụng (nền tảng WebRTC/LiveKit), giúp bảo vệ sự riêng tư và hạn chế chia sẻ số điện thoại cá nhân ra bên ngoài.',
      },
      {
        heading: '4. Lưu trữ an toàn & Không chia sẻ trái phép',
        body: 'Mật khẩu, phiên đăng nhập và thông tin cá nhân được mã hóa truyền tải và bảo vệ bằng cơ chế lưu trữ bảo mật trên thiết bị. CleanMaster cam kết không bán, cho thuê hoặc chia sẻ dữ liệu cá nhân của bạn cho bên thứ ba ngoài phạm vi vận hành dịch vụ và thanh toán payOS.',
      },
      {
        heading: '5. Quyền kiểm soát & Liên hệ bảo mật',
        body: 'Bạn có toàn quyền xem, chỉnh sửa thông tin cá nhân, xóa địa chỉ đã lưu hoặc gửi yêu cầu hỗ trợ về quyền riêng tư bất cứ lúc nào qua email hello@cleanmaster.vn hoặc Hotline 1900 6868.',
      },
    ],
  },
};

interface LegalPolicyModalProps {
  visible: boolean;
  initialTab?: LegalPolicyTab;
  showAgreeButton?: boolean;
  onClose: () => void;
  onAgree?: () => void;
}

export const LegalPolicyModal: React.FC<LegalPolicyModalProps> = ({
  visible,
  initialTab = 'terms',
  showAgreeButton = false,
  onClose,
  onAgree,
}) => {
  const { colors } = useAppTheme();
  const [tab, setTab] = useState<LegalPolicyTab>(initialTab);

  useEffect(() => {
    if (visible) setTab(initialTab);
  }, [visible, initialTab]);

  const doc = POLICY_CONTENT[tab];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleWrap}>
            <View style={[styles.headerIcon, { backgroundColor: colors.accentBg }]}>
              <IconSymbol name="shield" size={18} color={colors.accentText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                Pháp lý & Bảo mật
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>{doc.updatedAt}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            style={[styles.closeBtn, { backgroundColor: colors.surfaceMuted }]}
            onPress={onClose}
          >
            <IconSymbol name="close" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {(
            [
              { key: 'terms', label: 'Điều khoản sử dụng' },
              { key: 'privacy', label: 'Chính sách bảo mật' },
            ] as const
          ).map(item => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[
                  styles.tabItem,
                  { backgroundColor: colors.surfaceMuted },
                  active && { backgroundColor: colors.primaryDark },
                ]}
                onPress={() => setTab(item.key)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: colors.textSecondary },
                    active && styles.tabLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Document Body */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={[styles.introCard, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
            <Text style={[styles.docTitle, { color: colors.accentText }]}>{doc.title}</Text>
            <Text style={[styles.introText, { color: colors.text }]}>{doc.intro}</Text>
          </View>

          {doc.sections.map(section => (
            <View
              key={section.heading}
              style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.sectionHeading, { color: colors.text }]}>{section.heading}</Text>
              <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            style={[styles.primaryBtn, { backgroundColor: colors.primaryDark }]}
            onPress={() => {
              if (showAgreeButton && onAgree) onAgree();
              onClose();
            }}
          >
            <Text style={styles.primaryBtnText}>
              {showAgreeButton ? 'Đã đọc và đồng ý' : 'Đóng'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '900' },
  headerSub: { fontSize: 11, marginTop: 1 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  tabLabelActive: { color: '#FFFFFF', fontWeight: '800' },
  content: { padding: 16, gap: 12, paddingBottom: 28 },
  introCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  docTitle: { fontSize: 16, fontWeight: '900' },
  introText: { fontSize: 13, lineHeight: 20 },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
    gap: 6,
  },
  sectionHeading: { fontSize: 14, fontWeight: '800' },
  sectionBody: { fontSize: 13, lineHeight: 21 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
