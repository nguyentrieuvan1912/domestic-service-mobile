import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { EmptyState } from '@/components/common/EmptyState';
import { StaffMatchingRepository } from '@/data/staffMatchingRepository';
import { matchingEmptyKind, selectMatchingItems, STAFF_MATCHING_POLICY } from '@/data/staffMatchingRules';
import { displayDate, displayTime, localDate, bookingWorkMinutes } from '@/data/staffAvailabilityRules';
import type { MatchingFilter, MatchingOpportunity, MatchingSort } from '@/types/staff-matching';
import type { AcceptedAssignment } from '@/data/staffRepository';
import type { useStaffMatching } from '@/hooks/use-staff-matching';

type MatchingState = ReturnType<typeof useStaffMatching>;
export const DEFAULT_MATCH_FILTER: MatchingFilter = { query: '', district: 'Tất cả', sort: STAFF_MATCHING_POLICY.defaultSort };
export function MatchingSortPicker({ value, onChange }: { value: MatchingSort; onChange: (value: MatchingSort) => void }) {
  return <View style={styles.row}><Text style={styles.sub}>Sắp xếp:</Text>{(['START_TIME', 'INCOME'] as const).map(sort => <Pressable key={sort} accessibilityRole="button" accessibilityState={{ selected: value === sort }} onPress={() => onChange(sort)} style={[styles.chip, value === sort && styles.selected]}><Text style={value === sort ? styles.light : styles.link}>{sort === 'START_TIME' ? 'Giờ bắt đầu' : 'Thu nhập'}</Text></Pressable>)}</View>;
}
export function opportunityTime(job: MatchingOpportunity): string {
  if (!Number.isFinite(Date.parse(job.startsAt)) || !Number.isFinite(Date.parse(job.endsAt))) return 'Chưa có giờ hợp lệ';
  return `${displayDate(localDate(job.startsAt))} • ${displayTime(job.startsAt)}–${displayTime(job.endsAt)} • ${(bookingWorkMinutes(job) / 60).toLocaleString('vi-VN')} giờ`;
}
export function StaffMatchingList({ matching, filter = DEFAULT_MATCH_FILTER, limit, onResetFilters, onClaimed }: {
  matching: MatchingState; filter?: MatchingFilter; limit?: number; onResetFilters?: () => void; onClaimed?: (assignment: AcceptedAssignment) => void;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>();
  const { actor, status, data, retry } = matching;
  if (!actor) return <EmptyState icon="shield" title="Vui lòng đăng nhập nhân viên" actionText="Đăng nhập" onAction={() => router.replace('/auth/login')} />;
  if (status === 'LOADING') return <View style={styles.card}><ActivityIndicator color={BrandColors.primary} /><Text style={styles.body}>Đang kiểm tra việc phù hợp…</Text></View>;
  if (status === 'ERROR' || !data) return <EmptyState icon="warning" title="Chưa tải được việc phù hợp" description={matching.error} actionText="Thử lại" onAction={retry} />;
  const items = selectMatchingItems(data, filter);
  const kind = matchingEmptyKind(data, !!filter.query || filter.district !== 'Tất cả');
  const empty = {
    INACTIVE: ['Tài khoản chưa được nhận việc', 'Liên hệ người phụ trách hồ sơ để kiểm tra trạng thái.', 'Xem hồ sơ'],
    OFFLINE: ['Bạn đang tạm nghỉ', 'Bật nhận việc để xem ca phù hợp. Ca đã nhận vẫn có trong tab Sắp tới.', 'Bật nhận việc'],
    RESTRICTED: ['Đang hạn chế nhận việc', 'Xem điều kiện và lý do trong Năng lực được xác nhận.', 'Xem điều kiện'],
    NO_CAPABILITY: ['Chưa có năng lực còn hiệu lực', 'Năng lực cần được Admin xác nhận trước khi nhận dịch vụ.', 'Xem năng lực'],
    NO_SCHEDULE: ['Chưa đăng ký lịch rảnh', 'Lưu lịch rảnh và khu vực trong 7 ngày để kiểm tra việc phù hợp.', 'Đăng ký lịch'],
    NO_JOBS: ['Chưa có ca mở', 'Hiện chưa có vị trí mở để nhận. Bạn có thể tải lại sau.', 'Tải lại'],
    NO_MATCH: ['Chưa có ca phù hợp', 'Các ca hiện tại chưa đáp ứng năng lực, khu vực hoặc lịch đã lưu của bạn.', 'Xem lịch và khu vực'],
    FILTERED: ['Không có ca theo bộ lọc', 'Thử quận khác hoặc xóa từ khóa để xem các ca đủ điều kiện.', 'Xóa bộ lọc'],
  }[kind];
  const emptyAction = () => {
    if (kind === 'OFFLINE') StaffMatchingRepository.setOnline(actor, true);
    else if (kind === 'NO_JOBS') retry();
    else if (kind === 'FILTERED') onResetFilters?.();
    else router.push(kind === 'NO_SCHEDULE' || kind === 'NO_MATCH' ? '/staff/availability' : { pathname: '/staff/account-details', params: { section: 'skills' } });
  };
  return <View style={styles.list}>
    {items.length === 0 ? <EmptyState icon="calendar" title={empty[0]} description={empty[1]} actionText={empty[2]} onAction={emptyAction} /> : <>
      <Text style={styles.sub}>{items.length} ca phù hợp{limit && items.length > limit ? ` • Hiển thị ${limit} ca đầu` : ''}. Thu nhập là ước tính cho một vị trí.</Text>
      {items.slice(0, limit ?? items.length).map(({ opportunity: job }) => <View key={job.id} style={styles.card}>
        <View style={styles.row}><IconSymbol name={job.serviceIcon ?? 'clean'} size={20} color={BrandColors.primaryDark} /><Text style={[styles.heading, styles.grow]}>{job.serviceName}</Text></View>
        <Text style={styles.heading}>{job.packageTitle}</Text><Text style={styles.body}>{opportunityTime(job)}</Text>
        <Text style={styles.body}>{job.district} • TP. Hồ Chí Minh</Text>
        <Text style={styles.sub}>{job.mode === 'B' ? 'Nhận vị trí trống' : 'Khách chọn bạn'} • Còn {job.positionsRemaining}/{job.positionsRequired} vị trí</Text>
        <Text style={styles.income}>{job.incomePendingPolicy ? 'Thu nhập chờ quyết toán' : 'Ước tính ' + job.netIncome.toLocaleString('vi-VN') + 'đ / nhân viên'}</Text>
        {job.distance && <Text style={styles.sub}>{job.distance.km} km • {job.distance.source}</Text>}
        <View style={styles.row}><Pressable accessibilityRole="button" style={[styles.secondary, styles.grow]} onPress={() => router.push({ pathname: '/staff/job-detail', params: { id: job.id } })}><Text style={styles.link}>Chi tiết</Text></Pressable><Pressable accessibilityRole="button" style={[styles.primary, styles.grow]} onPress={() => setSelectedId(job.id)}><Text style={styles.light}>Vì sao phù hợp</Text></Pressable></View>
      </View>)}
    </>}
    <Pressable accessibilityRole="button" style={styles.secondary} onPress={retry}><Text style={styles.link}>Tải lại việc phù hợp</Text></Pressable>
    {selectedId && <StaffMatchExplanation matching={matching} opportunityId={selectedId} onClose={() => setSelectedId(undefined)} onClaimed={onClaimed ?? (job => router.push({ pathname: '/staff/job-detail', params: { id: job.id } }))} />}
  </View>;
}
export function StaffMatchExplanation({ matching, opportunityId, onClose, onClaimed }: {
  matching: MatchingState; opportunityId: string; onClose: () => void; onClaimed: (assignment: AcceptedAssignment) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  // Read fresh even when a position disappears from the filtered list while the sheet is open.
  const item = matching.actor && matching.data ? StaffMatchingRepository.detail(matching.actor, opportunityId) : undefined;
  const available = matching.status === 'READY' && !!item?.eligibility.allowed;
  const claim = async () => {
    if (!matching.actor || busy || controller.current) return;
    const abort = new AbortController(); controller.current = abort; setBusy(true); setError('');
    try {
      const result = await StaffMatchingRepository.claim(matching.actor, opportunityId, abort.signal);
      if (abort.signal.aborted) return;
      if (result.success) { onClose(); onClaimed(result.assignment); }
      else setError(result.reason);
    } catch (reason: unknown) { if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : 'Chưa nhận được ca.'); }
    finally { if (!abort.signal.aborted) { controller.current = null; setBusy(false); } }
  };
  return <Modal visible transparent animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}><View style={styles.scrim}><SafeAreaView edges={['bottom']} style={styles.sheet}>
    <View style={styles.row}><Text style={[styles.title, styles.grow]}>{available ? 'Vì sao phù hợp' : 'Điều kiện nhận ca'}</Text><Pressable disabled={busy} accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} style={styles.close}><IconSymbol name="close" size={22} color={BrandColors.gray700} /></Pressable></View>
    <ScrollView contentContainerStyle={styles.sheetContent}>
      {item ? <><Text style={styles.heading}>{item.opportunity.serviceName}</Text><Text style={styles.body}>{opportunityTime(item.opportunity)}</Text><Text style={styles.body}>{item.opportunity.district} • {item.opportunity.incomePendingPolicy ? 'Thu nhập chờ quyết toán' : item.opportunity.netIncome.toLocaleString('vi-VN') + 'đ / nhân viên'}</Text>
        <Text style={styles.body}>{item.opportunity.mode === 'B' ? 'Nhận vị trí trống' : 'Khách chọn bạn'} • Còn {item.opportunity.positionsRemaining}/{item.opportunity.positionsRequired} vị trí. Bạn sẽ nhận một vị trí.</Text>
        {item.eligibility.checks.map((check, index) => <View style={styles.check} key={`${check.code}-${index}`}><Text style={[styles.heading, !check.passed && styles.error]}>{check.passed ? '✓' : '!'} {check.label}</Text><Text style={styles.body}>{check.detail}</Text></View>)}
      </> : <Text style={styles.error}>{matching.status === 'LOADING' ? 'Đang kiểm tra lại điều kiện…' : 'Ca không còn khả dụng. Tải lại danh sách để xem ca khác.'}</Text>}
      <Text style={styles.sub}>Thông tin liên hệ và địa chỉ cụ thể được mở sau khi bạn nhận ca. Vị trí còn trống và điều kiện được kiểm tra lại khi xác nhận.</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </ScrollView>
    {!available && item?.eligibility.reasons[0] && <Text accessibilityRole="alert" style={styles.error}>{item.eligibility.reasons[0].message}</Text>}
    <Pressable accessibilityRole="button" disabled={!available || busy} style={[styles.primary, (!available || busy) && styles.disabled]} onPress={() => { void claim(); }}><Text style={styles.light}>{busy ? 'Đang kiểm tra và nhận…' : available ? 'Xác nhận nhận một vị trí' : 'Chưa thể nhận ca'}</Text></Pressable>
  </SafeAreaView></View></Modal>;
}
const styles = StyleSheet.create({
  list: { gap: Spacing.three }, card: { backgroundColor: BrandColors.white, borderRadius: BorderRadius.lg, padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: BrandColors.gray200 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, grow: { flex: 1 }, title: { color: BrandColors.gray900, fontSize: 18, fontWeight: '700' }, heading: { color: BrandColors.gray900, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  body: { color: BrandColors.gray700, fontSize: 14, lineHeight: 21 }, sub: { color: BrandColors.gray500, fontSize: 12, lineHeight: 19 }, income: { color: BrandColors.primaryDark, fontSize: 16, fontWeight: '700' },
  primary: { padding: Spacing.three, borderRadius: BorderRadius.md, backgroundColor: BrandColors.primary }, secondary: { padding: Spacing.three, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: BrandColors.gray300 },
  link: { color: BrandColors.primaryDark, fontWeight: '600', textAlign: 'center' }, light: { color: BrandColors.white, fontWeight: '700', textAlign: 'center' }, chip: { padding: Spacing.two, borderRadius: BorderRadius.md, backgroundColor: BrandColors.gray100 }, selected: { backgroundColor: BrandColors.primary },
  scrim: { flex: 1, backgroundColor: '#0007', justifyContent: 'flex-end' }, sheet: { maxHeight: '90%', backgroundColor: BrandColors.white, padding: Spacing.three, gap: Spacing.two, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg }, sheetContent: { gap: Spacing.two, paddingBottom: Spacing.three }, check: { padding: Spacing.two, backgroundColor: BrandColors.gray50, borderRadius: BorderRadius.md, gap: Spacing.one }, close: { padding: Spacing.two }, error: { color: BrandColors.danger, fontSize: 13, lineHeight: 20 }, disabled: { opacity: 0.45 },
});
