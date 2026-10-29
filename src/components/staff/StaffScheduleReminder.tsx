import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useStaffActor } from '@/hooks/use-staff-actor';
import { StaffRepository } from '@/data/connectedStaffRepository';
import { missingRegistrationDates, weekStart } from '@/data/weeklyAvailability';
import { displayDate } from '@/data/staffAvailabilityRules';
import { BrandColors } from '@/constants/theme';
import type { AvailabilityActor } from '@/types/staff-availability';

export function StaffScheduleReminder() {
  const actor = useStaffActor();
  return actor ? <Reminder key={actor.staffId} actor={actor} /> : null;
}
export function StaffScheduleNotice() {
  const actor = useStaffActor();
  const router = useRouter();
  useSyncExternalStore(StaffRepository.subscribe, StaffRepository.getStoreRevision, StaffRepository.getStoreRevision);
  if (!actor) return null;
  const { loaded, error } = StaffRepository.getScheduleLoadState();
  const missing = loaded ? missingRegistrationDates(StaffRepository.getScheduleSnapshot(actor.staffId).saved.registeredWeekStarts ?? []) : [];
  if (missing.length === 0 && (loaded || !error)) return null;
  return <Pressable accessibilityRole="button" style={styles.notice} onPress={() => router.push('/staff/availability')}>
    <Text style={styles.noticeTitle}>{loaded ? `Còn ${missing.length} ngày chưa đăng ký lịch tuần này` : 'Chưa kiểm tra được lịch làm việc'}</Text>
    <Text style={styles.body}>{loaded ? 'Đăng ký lịch để được xét nhận đơn. Nhấn để đăng ký ngay.' : 'Nhấn để mở lịch làm việc và thử lại.'}</Text>
  </Pressable>;
}
function Reminder({ actor }: { actor: AvailabilityActor }) {
  const router = useRouter(), path = usePathname();
  const revision = useSyncExternalStore(StaffRepository.subscribe, StaffRepository.getStoreRevision, StaffRepository.getStoreRevision);
  const [now, setNow] = useState(Date.now), [dismissed, setDismissed] = useState('');
  useEffect(() => {
    const refresh = () => { setNow(Date.now()); void StaffRepository.loadSchedule().catch(() => undefined); };
    refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') { setDismissed(''); refresh(); } });
    const timer = setInterval(refresh, 60000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [actor]);
  const missing = useMemo(() => missingRegistrationDates(StaffRepository.getScheduleSnapshot(actor.staffId).saved.registeredWeekStarts ?? [], now), [actor.staffId, revision, now]);
  const key = weekStart(now), { loaded: ready, error } = StaffRepository.getScheduleLoadState();
  const visible = (ready ? missing.length > 0 : !!error) && dismissed !== key && path.startsWith('/staff') && path !== '/staff/availability';
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setDismissed(key)}><View style={styles.scrim}><View style={styles.card}>
    <Text style={styles.title}>{ready ? 'Đăng ký lịch làm việc tuần này' : 'Chưa kiểm tra được lịch làm việc'}</Text>
    <Text style={styles.body}>{ready ? `Bạn còn ${missing.length} ngày chưa đăng ký: ${missing.map(displayDate).join(', ')}.` : error}</Text>
    {ready && <Text style={styles.body}>Chọn ca làm hoặc Nghỉ cho từng ngày rồi xác nhận. Đăng ký đủ lịch tuần là điều kiện đầu tiên để được xét nhận đơn.</Text>}
    <Pressable accessibilityRole="button" style={styles.primary} onPress={() => { if (!ready) { void StaffRepository.loadSchedule().catch(() => undefined); return; } setDismissed(key); router.push('/staff/availability'); }}><Text style={styles.white}>{ready ? 'Đăng ký ngay' : 'Thử lại'}</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => setDismissed(key)} style={styles.later}><Text style={styles.link}>Để sau</Text></Pressable>
  </View></View></Modal>;
}
const styles = StyleSheet.create({
  notice: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D', borderWidth: 1, borderRadius: 14, padding: 16, gap: 8, marginBottom: 16 },
  noticeTitle: { color: '#92400E', fontWeight: '700', fontSize: 15 },
  scrim: { flex: 1, backgroundColor: '#0007', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', padding: 22, borderRadius: 20, gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: BrandColors.gray900 },
  body: { fontSize: 14, lineHeight: 22, color: BrandColors.gray700 },
  primary: { backgroundColor: BrandColors.primary, borderRadius: 12, padding: 14 },
  white: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  later: { padding: 10 }, link: { color: BrandColors.primaryDark, textAlign: 'center', fontWeight: '600' },
});
