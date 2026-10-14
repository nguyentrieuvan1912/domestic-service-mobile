import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { getCapabilityActor } from '@/data/staffCapabilityAdapter';
import { StaffAvailabilityRepository, availabilityDraft } from '@/data/connectedStaffRepository';
import { StaffRepository } from '@/data/connectedStaffRepository';
import { STAFF_AREA_OPTIONS } from '@/data/staffAreas';
import { bookingBuffer, bookingWorkMinutes, displayDate, displayTime, intervalFor, localDate, normalizeDraft, scheduleDates, SCHEDULE_TIME_OPTIONS } from '@/data/staffAvailabilityRules';
import type { AvailabilityActor, AvailabilityDraft, AvailabilitySnapshot } from '@/types/staff-availability';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { EmptyState } from '@/components/common/EmptyState';
import { StaffBottomNav } from './StaffBottomNav';

export function StaffAvailabilityScreen() {
  const router = useRouter();
  const { currentUser, currentStaff } = useAuth();
  const actor = useMemo(() => getCapabilityActor(currentUser, currentStaff), [currentUser, currentStaff]);
  if (!actor) return <SafeAreaView style={styles.root}>
    <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" style={styles.header} onPress={() => router.canGoBack() ? router.back() : router.replace('/auth/login')}><IconSymbol name="back" size={24} color={BrandColors.gray800} /><Text style={styles.link}>Quay lại</Text></Pressable>
    <EmptyState icon="shield" title="Vui lòng đăng nhập nhân viên" description="Bạn chỉ có thể đăng ký lịch cho hồ sơ của mình." actionText="Đăng nhập" onAction={() => router.replace('/auth/login')} />
  </SafeAreaView>;
  return <AvailabilityEditor key={actor.userId} actor={actor} />;
}
function AvailabilityEditor({ actor }: { actor: AvailabilityActor }) {
  const router = useRouter();
  const navigation = useNavigation();
  const revision = useSyncExternalStore(StaffRepository.subscribe, StaffRepository.getStoreRevision, StaffRepository.getStoreRevision);
  const [loaded, setLoaded] = useState<AvailabilitySnapshot>();
  const [draft, setDraft] = useState<AvailabilityDraft>();
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => scheduleDates()[0]);
  const [editor, setEditor] = useState<{ index?: number; start: string; end: string }>();
  const [editorError, setEditorError] = useState('');
  const [copyDates, setCopyDates] = useState<string[] | null>(null);
  const [leaveAction, setLeaveAction] = useState<(() => void) | null>(null);
  const [allowLeave, setAllowLeave] = useState(false);
  const saveController = useRef<AbortController | null>(null);
  const dirty = !!draft && !!loaded && JSON.stringify(draft) !== JSON.stringify(availabilityDraft(loaded));
  const snapshot = useMemo(() => ({ ...StaffRepository.getScheduleSnapshot(actor.staffId), storeRevision: revision }), [actor.staffId, revision]);
  const dates = draft?.days.map(day => day.date) ?? scheduleDates();
  const day = draft?.days.find(item => item.date === selectedDate);
  const bookings = snapshot.bookings.filter(booking => localDate(booking.startsAt) === selectedDate && booking.status !== 'CANCELLED');
  useEffect(() => {
    const controller = new AbortController();
    void StaffAvailabilityRepository.load(actor, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setLoaded(result); setDraft(availabilityDraft(result)); setSelectedDate(result.saved.days[0].date); setLoading(false); setError('');
    }).catch((reason: unknown) => { if (!controller.signal.aborted) { setLoading(false); setError(reason instanceof Error ? reason.message : 'Chưa tải được lịch.'); } });
    return () => controller.abort();
  }, [actor, attempt]);
  useEffect(() => () => saveController.current?.abort(), []);
  usePreventRemove((dirty || saving) && !allowLeave, ({ data }) => { setLeaveAction(() => () => navigation.dispatch(data.action)); });
  useEffect(() => {
    if (!allowLeave || !leaveAction) return;
    // Dispatch after the navigator has committed the updated removal guard.
    const timer = setTimeout(() => { setLeaveAction(null); setAllowLeave(false); leaveAction(); }, 0);
    return () => clearTimeout(timer);
  }, [allowLeave, leaveAction]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty) return;
    const preventClose = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', preventClose);
    return () => window.removeEventListener('beforeunload', preventClose);
  }, [dirty]);
  const freshValidation = (next: AvailabilityDraft) => {
    if (snapshot.unknownBookingCodes.length) return { error: 'Cần xác minh giờ ca đã nhận trước khi thay đổi lịch.' };
    return normalizeDraft(next, snapshot.bookings);
  };
  const changeDraft = (next: AvailabilityDraft): boolean => {
    const result = freshValidation(next);
    if (!result.draft) { setError(result.error ?? 'Lịch chưa hợp lệ.'); return false; }
    setDraft(result.draft); setError(''); setNotice(''); return true;
  };
  const reload = () => { setLoading(true); setAttempt(value => value + 1); setNotice(''); };
  const requestReload = () => dirty ? setLeaveAction(() => reload) : reload();
  const save = async (): Promise<boolean> => {
    if (!draft || !loaded || saving) return false;
    const checked = freshValidation(draft);
    if (!checked.draft) { setError(checked.error ?? 'Lịch chưa hợp lệ.'); return false; }
    const controller = new AbortController(); saveController.current = controller;
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await StaffAvailabilityRepository.save(actor, checked.draft, loaded.saved.revision, controller.signal);
      if (controller.signal.aborted) return false;
      setLoaded(result); setDraft(availabilityDraft(result)); setNotice('Đã lưu lịch rảnh và khu vực nhận việc.'); return true;
    } catch (reason: unknown) {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Chưa lưu được lịch. Bản nháp vẫn được giữ.');
      return false;
    } finally { if (!controller.signal.aborted) setSaving(false); }
  };
  const applyInterval = () => {
    if (!draft || !day || !editor) return;
    const intervals = [...day.intervals];
    const interval = intervalFor(selectedDate, editor.start, editor.end);
    if (editor.index === undefined) intervals.push(interval); else intervals[editor.index] = interval;
    const next = { ...draft, days: draft.days.map(item => item.date === selectedDate ? { ...day, intervals } : item) };
    const checked = freshValidation(next);
    if (!checked.draft) { setEditorError(checked.error ?? 'Khoảng rảnh chưa hợp lệ.'); return; }
    changeDraft(checked.draft); setEditor(undefined);
  };
  const applyCopy = () => {
    if (!draft || !day || !copyDates?.length) return;
    const next = { ...draft, days: draft.days.map(item => copyDates.includes(item.date) ? { ...item, intervals: day.intervals.map(interval => intervalFor(item.date, displayTime(interval.startsAt), displayTime(interval.endsAt))) } : item) };
    if (changeDraft(next)) { setCopyDates(null); setNotice('Đã sao chép vào bản nháp. Bấm lưu để áp dụng.'); }
  };
  return <View style={styles.root}>
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace('/staff')} style={styles.icon}><IconSymbol name="back" size={24} color={BrandColors.gray800} /></Pressable><Text style={styles.title}>Đăng ký lịch rảnh</Text><View style={styles.icon} /></View>
      {loading ? <View style={styles.loading}><ActivityIndicator color={BrandColors.primary} /><Text>Đang tải lịch…</Text></View> : !draft || !loaded ? <EmptyState title="Chưa tải được lịch" description={error} icon="warning" actionText="Thử lại" onAction={reload} /> : <>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.body}>Hôm nay và 6 ngày tiếp theo • Giờ Việt Nam</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {dates.map(date => <Pressable accessibilityRole="button" accessibilityState={{ selected: date === selectedDate }} key={date} style={[styles.chip, date === selectedDate && styles.selectedChip]} onPress={() => { setSelectedDate(date); setError(''); }}><Text style={date === selectedDate ? styles.light : styles.label}>{date === localDate() ? 'Hôm nay\n' : ''}{displayDate(date)}</Text></Pressable>)}
          </ScrollView>
          <View style={styles.card}><Text style={styles.heading}>Khoảng rảnh • {displayDate(selectedDate)}</Text><Text style={styles.body}>08:00–20:00, mỗi bước 30 phút. Các khoảng chạm nhau được hợp nhất; ca phải nằm trọn trong khoảng rảnh.</Text>
            {!day?.intervals.length && <Text style={styles.body}>Chưa đăng ký khoảng rảnh cho ngày này.</Text>}
            {day?.intervals.map((interval, index) => <View key={interval.startsAt} style={styles.interval}>
              <Text style={[styles.heading, styles.grow]}>{displayTime(interval.startsAt)}–{displayTime(interval.endsAt)}</Text>
              <Pressable disabled={saving} accessibilityRole="button" accessibilityLabel={`Sửa khoảng ${displayTime(interval.startsAt)}`} onPress={() => { setEditorError(''); setEditor({ index, start: displayTime(interval.startsAt), end: displayTime(interval.endsAt) }); }} style={styles.smallButton}><Text style={styles.link}>Sửa</Text></Pressable>
              <Pressable disabled={saving} accessibilityRole="button" accessibilityLabel={`Xóa khoảng ${displayTime(interval.startsAt)}`} onPress={() => changeDraft({ ...draft, days: draft.days.map(item => item.date === selectedDate ? { ...item, intervals: item.intervals.filter((_, position) => position !== index) } : item) })} style={styles.smallButton}><Text style={styles.link}>Xóa</Text></Pressable>
            </View>)}
            <Pressable disabled={saving} accessibilityRole="button" style={styles.secondary} onPress={() => { setEditorError(''); setEditor({ start: '08:00', end: '12:00' }); }}><Text style={styles.link}>+ Thêm khoảng rảnh</Text></Pressable>
            <Pressable disabled={saving || !day?.intervals.length} accessibilityRole="button" style={[styles.secondary, !day?.intervals.length && styles.disabled]} onPress={() => setCopyDates([])}><Text style={styles.link}>Sao chép sang ngày khác</Text></Pressable>
            {!day?.intervals.length && <Text style={styles.sub}>Thêm khoảng rảnh trước khi sao chép.</Text>}
          </View>
          <View style={styles.card}><Text style={styles.heading}>Ca đã nhận và vùng đệm</Text><Text style={styles.body}>Đệm tối thiểu 60 phút giữa hai ca, không tính vào giờ công. Giữ lịch rảnh và khu vực bao trọn ca đã nhận.</Text>
            {!bookings.length && <Text style={styles.body}>Chưa có ca đã nhận trong ngày này.</Text>}
            {bookings.map(booking => { const buffer = bookingBuffer(booking); return <View key={booking.id} style={styles.booking}><Text style={styles.heading}>{booking.bookingCode} • {displayTime(booking.startsAt)}–{displayTime(booking.endsAt)}</Text><Text style={styles.body}>{booking.district} • {(bookingWorkMinutes(booking) / 60).toLocaleString('vi-VN')} giờ công</Text><Text style={styles.sub}>Vùng đệm: {displayTime(buffer.startsAt)}–{displayTime(booking.startsAt)} và {displayTime(booking.endsAt)}–{displayTime(buffer.endsAt)}. Không nhận ca khác trong vùng này.</Text></View>; })}
            {!!snapshot.unknownBookingCodes.length && <Text style={styles.error}>Chưa có giờ hợp lệ: {snapshot.unknownBookingCodes.join(', ')}. Cần xác minh trước khi lưu hoặc nhận thêm.</Text>}
          </View>
          <View style={styles.card}><Text style={styles.heading}>Khu vực nhận việc • {draft.areaIds.length} đã chọn</Text><Text style={styles.body}>Chọn ít nhất một khu vực. Khu vực có ca đã nhận cần được giữ lại.</Text><View style={styles.wrap}>
            {STAFF_AREA_OPTIONS.map(area => { const selected = draft.areaIds.includes(area.id); return <Pressable disabled={saving} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} key={area.id} style={[styles.chip, selected && styles.selectedChip]} onPress={() => changeDraft({ ...draft, areaIds: selected ? draft.areaIds.filter(id => id !== area.id) : [...draft.areaIds, area.id] })}><Text style={selected ? styles.light : styles.label}>{selected ? '✓ ' : '+ '}{area.name}</Text></Pressable>; })}
          </View><Text style={styles.sub}>Chưa có vị trí làm mốc để chọn bán kính. Việc phù hợp được kiểm tra theo khu vực đã lưu.</Text></View>
          <View style={styles.card}><View style={styles.row}><View style={styles.grow}><Text style={styles.heading}>Nhận thông báo việc phù hợp</Text><Text style={styles.body}>Bạn vẫn cần xác nhận khi nhận ca. Tùy chọn này không tự nhận việc.</Text></View><Switch disabled={saving} value={draft.matchNotifications} onValueChange={value => { changeDraft({ ...draft, matchNotifications: value }); }} trackColor={{ true: BrandColors.primary, false: BrandColors.gray300 }} /></View></View>
          {!!notice && <Text accessibilityLiveRegion="polite" style={styles.success}>{notice}</Text>}
          <Pressable disabled={saving} accessibilityRole="button" onPress={requestReload} style={styles.secondary}><Text style={styles.link}>Tải lại lịch đã lưu</Text></Pressable>
        </ScrollView>
        <View style={styles.footer}>{!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}<Text accessibilityLiveRegion="polite" style={styles.sub}>{saving ? 'Đang lưu…' : dirty ? 'Có thay đổi chưa lưu' : notice || 'Lịch đã lưu • không có thay đổi mới'}</Text><Pressable accessibilityRole="button" disabled={!dirty || saving} style={[styles.primary, (!dirty || saving) && styles.disabled]} onPress={() => { void save(); }}><Text style={styles.light}>{saving ? 'Đang lưu lịch…' : 'Lưu lịch rảnh và khu vực'}</Text></Pressable></View>
      </>}
    </SafeAreaView>
    <StaffBottomNav activeTab="availability" />
    <Modal visible={!!editor} transparent animationType="slide" onRequestClose={() => setEditor(undefined)}><View style={styles.scrim}><SafeAreaView style={styles.modal} edges={['bottom']}><Text style={styles.title}>{editor?.index === undefined ? 'Thêm' : 'Sửa'} khoảng rảnh</Text><Text style={styles.body}>{displayDate(selectedDate)} • Chọn giờ theo bước 30 phút</Text><View style={[styles.row, styles.picker]}>
      {(['start', 'end'] as const).map(field => <View key={field} style={styles.grow}><Text style={styles.heading}>{field === 'start' ? 'Bắt đầu' : 'Kết thúc'}: {editor?.[field]}</Text><ScrollView>{SCHEDULE_TIME_OPTIONS.map(time => <Pressable accessibilityRole="button" accessibilityState={{ selected: editor?.[field] === time }} key={time} style={[styles.time, editor?.[field] === time && styles.selectedChip]} onPress={() => { setEditorError(''); setEditor(value => value ? { ...value, [field]: time } : value); }}><Text style={editor?.[field] === time ? styles.light : styles.label}>{time}</Text></Pressable>)}</ScrollView></View>)}
    </View>{!!editorError && <Text accessibilityRole="alert" style={styles.error}>{editorError}</Text>}<Pressable style={styles.primary} accessibilityRole="button" onPress={applyInterval}><Text style={styles.light}>Áp dụng vào bản nháp</Text></Pressable><Pressable style={styles.secondary} accessibilityRole="button" onPress={() => setEditor(undefined)}><Text style={styles.link}>Hủy</Text></Pressable></SafeAreaView></View></Modal>
    <Modal visible={copyDates !== null} transparent animationType="slide" onRequestClose={() => setCopyDates(null)}><View style={styles.scrim}><SafeAreaView style={styles.modal} edges={['bottom']}><Text style={styles.title}>Sao chép lịch {displayDate(selectedDate)}</Text><Text style={styles.body}>Thay các khoảng rảnh ở ngày đã chọn. Thao tác chỉ cập nhật bản nháp.</Text><View style={styles.wrap}>{dates.filter(date => date !== selectedDate).map(date => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: copyDates?.includes(date) }} key={date} style={[styles.chip, copyDates?.includes(date) && styles.selectedChip]} onPress={() => setCopyDates(value => value?.includes(date) ? value.filter(item => item !== date) : [...(value ?? []), date])}><Text style={copyDates?.includes(date) ? styles.light : styles.label}>{displayDate(date)}</Text></Pressable>)}</View>{!!error && <Text style={styles.error}>{error}</Text>}<Pressable disabled={!copyDates?.length} accessibilityRole="button" style={[styles.primary, !copyDates?.length && styles.disabled]} onPress={applyCopy}><Text style={styles.light}>Sao chép vào bản nháp</Text></Pressable>{!copyDates?.length && <Text style={styles.sub}>Chọn ít nhất một ngày để sao chép.</Text>}<Pressable accessibilityRole="button" style={styles.secondary} onPress={() => setCopyDates(null)}><Text style={styles.link}>Hủy</Text></Pressable></SafeAreaView></View></Modal>
    <Modal visible={!!leaveAction && !allowLeave} transparent animationType="fade" onRequestClose={() => { if (!saving) setLeaveAction(null); }}><View style={styles.scrim}><SafeAreaView style={styles.modal} edges={['bottom']}><Text style={styles.title}>Lịch có thay đổi chưa lưu</Text><Text style={styles.body}>Lưu trước khi rời màn hình hoặc bỏ bản nháp. Lịch đã lưu vẫn được dùng để kiểm tra việc phù hợp.</Text>{!!error && <Text style={styles.error}>{error}</Text>}<Pressable disabled={saving} style={styles.primary} accessibilityRole="button" onPress={() => { void save().then(success => { if (success) setAllowLeave(true); }); }}><Text style={styles.light}>{saving ? 'Đang lưu…' : 'Lưu rồi rời màn hình'}</Text></Pressable><Pressable disabled={saving} style={styles.secondary} accessibilityRole="button" onPress={() => { if (loaded) setDraft(availabilityDraft(loaded)); setAllowLeave(true); }}><Text style={styles.link}>Bỏ thay đổi</Text></Pressable><Pressable disabled={saving} style={styles.secondary} accessibilityRole="button" onPress={() => setLeaveAction(null)}><Text style={styles.link}>Tiếp tục chỉnh sửa</Text></Pressable></SafeAreaView></View></Modal>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BrandColors.gray50 }, screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.three, backgroundColor: BrandColors.white },
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, title: { color: BrandColors.gray900, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.four }, card: { backgroundColor: BrandColors.white, padding: Spacing.three, borderRadius: BorderRadius.lg, gap: Spacing.two },
  heading: { color: BrandColors.gray900, fontSize: 15, fontWeight: '700', lineHeight: 22 }, body: { color: BrandColors.gray700, fontSize: 14, lineHeight: 21 }, sub: { color: BrandColors.gray500, fontSize: 12, lineHeight: 19 },
  label: { color: BrandColors.gray700, fontSize: 14, fontWeight: '600', textAlign: 'center' }, light: { color: BrandColors.white, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }, grow: { flex: 1 },
  chip: { padding: Spacing.two, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: BrandColors.gray200, backgroundColor: BrandColors.white }, selectedChip: { backgroundColor: BrandColors.primary, borderColor: BrandColors.primary },
  interval: { flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.primaryLight, borderRadius: BorderRadius.md, padding: Spacing.two }, smallButton: { padding: Spacing.two }, link: { color: BrandColors.primaryDark, textAlign: 'center', fontWeight: '700', fontSize: 14 },
  secondary: { padding: Spacing.two, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: BrandColors.gray300 }, primary: { padding: Spacing.three, backgroundColor: BrandColors.primary, borderRadius: BorderRadius.md }, disabled: { opacity: 0.45 },
  booking: { padding: Spacing.two, borderRadius: BorderRadius.md, backgroundColor: BrandColors.gray100, gap: Spacing.one }, error: { color: BrandColors.danger, lineHeight: 21, fontSize: 14 }, success: { color: BrandColors.primaryDark, lineHeight: 21, fontSize: 14 },
  loading: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: Spacing.two }, footer: { backgroundColor: BrandColors.white, padding: Spacing.three, gap: Spacing.two },
  scrim: { flex: 1, backgroundColor: '#0007', justifyContent: 'flex-end' }, modal: { backgroundColor: BrandColors.white, padding: Spacing.three, gap: Spacing.two, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, maxHeight: '90%' }, picker: { height: 290, flexShrink: 1, alignItems: 'stretch' }, time: { padding: Spacing.two, borderRadius: BorderRadius.md, marginVertical: Spacing.one },
});
