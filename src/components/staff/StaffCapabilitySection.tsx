import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { EmptyState } from '@/components/common/EmptyState';
import { useStaffCapabilities } from '@/hooks/use-staff-capabilities';
import { formatCapabilityDate } from '@/data/staffCapabilityAdapter';
import type { CapabilityRestrictionView, StaffCapabilityView } from '@/types/staff-capability';

export function CapabilityRestrictionSummary({ restrictions }: { restrictions: readonly CapabilityRestrictionView[] }) {
  return <View style={styles.panel}>
    <Text style={styles.heading}>Hạn chế ảnh hưởng đến nhận việc</Text>
    {restrictions.length === 0 ? <Text style={styles.body}>Chưa có hạn chế trong hồ sơ.</Text> : restrictions.map((item) => <View key={item.id} style={styles.restriction}>
      <Text style={styles.label}>{item.statusLabel}{item.blocksReceiving ? ' • Tạm dừng nhận việc' : ''}</Text>
      <Text style={styles.body}>{item.reason}</Text>
      <Text style={styles.sub}>{formatCapabilityDate(item.startsAt)} → {item.endsAt ? formatCapabilityDate(item.endsAt) : 'Chưa có ngày kết thúc'}</Text>
      <Text style={styles.sub}>{item.serviceId ? 'Chỉ ảnh hưởng dịch vụ liên quan.' : 'Phạm vi: hồ sơ nhân viên.'} {!item.isActive ? 'Hiện không ngăn nhận việc.' : item.type === 'WARNING' ? 'Cảnh báo này không khóa năng lực.' : ''}</Text>
    </View>)}
  </View>;
}

function CapabilityStateBadge({ item }: { item: StaffCapabilityView }) {
  return <View style={[styles.badge, item.canReceive ? styles.validBadge : styles.otherBadge]}>
    <IconSymbol name={item.canReceive ? 'success' : item.state === 'SUSPENDED' ? 'shield' : 'info'} size={16} color={item.canReceive ? BrandColors.primary : BrandColors.gray700} />
    <Text style={[styles.badgeText, { color: item.canReceive ? BrandColors.primary : BrandColors.gray700 }]}>{item.stateLabel}</Text>
  </View>;
}

export function StaffCapabilitySection({ capabilityId }: { capabilityId?: string }) {
  const router = useRouter();
  const { actor, status, data, error, retry } = useStaffCapabilities();
  const [showGuidance, setShowGuidance] = useState(false);
  if (!actor) return <EmptyState icon="shield" title="Vui lòng đăng nhập tài khoản nhân viên" description="Chỉ nhân viên có hồ sơ hợp lệ được xem năng lực của mình." actionText="Đăng nhập" onAction={() => router.push('/auth/login')} />;
  if (status === 'LOADING') return <View style={styles.loading}><ActivityIndicator color={BrandColors.primary} /><Text style={styles.body}>Đang tải năng lực…</Text></View>;
  if (status === 'ERROR' || !data) return <EmptyState icon="warning" title="Chưa tải được năng lực" description={error} actionText="Thử lại" onAction={retry} />;
  const selected = capabilityId ? data.capabilities.find((item) => item.id === capabilityId) : undefined;
  if (capabilityId && !selected) return <EmptyState icon="shield" title="Không tìm thấy năng lực" description="Năng lực không tồn tại hoặc không thuộc hồ sơ của bạn." actionText="Về danh sách năng lực"
    onAction={() => router.replace({ pathname: '/staff/account-details', params: { section: 'skills' } })} />;
  return <View style={styles.layout}>
    {selected ? <View style={styles.panel}>
      <Text style={styles.title}>{selected.serviceName}</Text>
      <CapabilityStateBadge item={selected} />
      <Text style={styles.body}>{selected.approvalLabel}</Text>
      <Text style={styles.body}>Kinh nghiệm liên quan: {selected.experienceYears.toLocaleString('vi-VN')} năm</Text>
      <Text style={styles.heading}>Phạm vi công việc</Text>
      {selected.scope.map((line) => <Text key={line} style={styles.body}>• {line}</Text>)}
      <Text style={styles.heading}>Hiệu lực xác nhận</Text>
      <Text style={styles.body}>Từ: {formatCapabilityDate(selected.validFrom)}</Text>
      <Text style={styles.body}>{selected.validUntil ? 'Đến trước: ' + formatCapabilityDate(selected.validUntil) : 'Chưa ghi nhận ngày hết hiệu lực'}</Text>
      <Text style={styles.heading}>Thông tin xác nhận được phép xem</Text>
      {selected.approvedAt ? <Text style={styles.body}>Ngày xác nhận: {formatCapabilityDate(selected.approvedAt)}</Text> : <Text style={styles.sub}>Ngày xác nhận chưa có hoặc chưa được cấp quyền xem.</Text>}
      {selected.approvedByName && <Text style={styles.body}>Người/bộ phận xác nhận: {selected.approvedByName}</Text>}
      {selected.note ? <Text style={styles.body}>{selected.note}</Text> : <Text style={styles.sub}>Chưa có ghi chú được cấp quyền xem.</Text>}
      <View style={styles.reason}><Text style={styles.label}>{selected.canReceive ? 'Đủ điều kiện về năng lực' : 'Chưa được nhận dịch vụ này'}</Text>
        <Text style={styles.body}>{selected.reason ?? 'Khi nhận ca, bạn vẫn cần đáp ứng lịch làm việc và các điều kiện khác của ca.'}</Text></View>
    </View> : <>
      <View style={styles.panel}><Text style={styles.heading}>{data.eligibleCount} / {data.capabilities.length} năng lực còn hiệu lực để nhận dịch vụ</Text>
        <Text style={styles.body}>Năng lực do Admin xác nhận. Bạn có thể xem phạm vi và điều kiện nhận việc của từng dịch vụ.</Text></View>
      {data.capabilities.length === 0 ? <EmptyState icon="shield" title="Chưa có năng lực được xác nhận" description="Hãy liên hệ người phụ trách hồ sơ để được hướng dẫn xác minh trước khi nhận dịch vụ." /> :
        data.capabilities.map((item) => <Pressable key={item.id} style={styles.panel} accessibilityRole="button"
          accessibilityLabel={`${item.serviceName}. ${item.stateLabel}. Xem chi tiết năng lực`}
          onPress={() => router.push({ pathname: '/staff/account-details', params: { section: 'skills', capabilityId: item.id } })}>
          <View style={styles.row}><Text style={[styles.heading, styles.grow]}>{item.serviceName}</Text><IconSymbol name="chevronRight" size={18} color={BrandColors.gray500} /></View>
          <CapabilityStateBadge item={item} />
          <Text style={styles.body}>Kinh nghiệm liên quan: {item.experienceYears.toLocaleString('vi-VN')} năm</Text>
          <Text style={styles.sub}>{item.approvalLabel}</Text>
          {!!item.reason && <Text style={styles.body}>{item.reason}</Text>}
        </Pressable>)}
    </>}
    <CapabilityRestrictionSummary restrictions={selected ? selected.restrictions : data.restrictions} />
    {(!selected || !selected.canReceive) && <View style={styles.panel}>
      <Pressable style={styles.helpButton} accessibilityRole="button" accessibilityState={{ expanded: showGuidance }}
        onPress={() => setShowGuidance((value) => !value)}><Text style={styles.helpText}>{showGuidance ? 'Thu gọn hướng dẫn xác minh' : 'Hướng dẫn xác minh với người phụ trách'}</Text></Pressable>
      {showGuidance && <View style={styles.layout}>
        <Text style={styles.body}>1. Liên hệ người phụ trách hồ sơ qua kênh công ty đã cấp cho bạn.</Text>
        <Text style={styles.body}>2. Chuẩn bị thông tin kinh nghiệm và giấy tờ liên quan đến dịch vụ cần xác minh.</Text>
        <Text style={styles.body}>3. Chờ Admin kiểm tra và xác nhận phạm vi được phép thực hiện.</Text>
        <Text style={styles.sub}>Chưa hỗ trợ gửi hồ sơ xác minh trực tiếp trong ứng dụng.</Text>
      </View>}
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  layout: { gap: Spacing.three }, loading: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  panel: { backgroundColor: BrandColors.white, borderRadius: BorderRadius.lg, padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: BrandColors.gray200 },
  title: { fontSize: 19, lineHeight: 27, fontWeight: '700', color: BrandColors.gray900 }, heading: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: BrandColors.gray900 },
  label: { fontSize: 14, lineHeight: 21, fontWeight: '600', color: BrandColors.gray800 }, body: { fontSize: 14, lineHeight: 22, color: BrandColors.gray700 }, sub: { fontSize: 12, lineHeight: 19, color: BrandColors.gray500 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: Spacing.one, padding: Spacing.one, borderRadius: BorderRadius.md },
  validBadge: { backgroundColor: BrandColors.primaryLight }, otherBadge: { backgroundColor: BrandColors.gray100 }, badgeText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, grow: { flex: 1 },
  restriction: { gap: Spacing.one, borderTopWidth: 1, borderTopColor: BrandColors.gray100, paddingTop: Spacing.two },
  reason: { backgroundColor: BrandColors.gray50, padding: Spacing.two, borderRadius: BorderRadius.md, gap: Spacing.one },
  helpButton: { padding: Spacing.two, borderRadius: BorderRadius.md, backgroundColor: BrandColors.primary }, helpText: { color: BrandColors.white, fontSize: 14, lineHeight: 22, textAlign: 'center', fontWeight: '600' },
});
