import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStaffActor } from '@/hooks/use-staff-actor';
import { StaffAvailabilityRepository, availabilityDraft } from '@/data/connectedStaffRepository';
import { useAdministrativeUnits } from '@/hooks/use-administrative-units';
import { administrativeSearchKey } from '@/api/administrative-units';
import { addCalendarDays, displayDate, displayTime, localDate } from '@/data/staffAvailabilityRules';
import { selectedSlots, setDaySlots, slotLocked, weekDates, weekStart, WEEK_SLOTS, WORK_SHIFTS, toggleShift } from '@/data/weeklyAvailability';
import type { AvailabilityActor, AvailabilityDay, AvailabilityDraft, AvailabilitySnapshot } from '@/types/staff-availability';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { EmptyState } from '@/components/common/EmptyState';
import { StaffBottomNav } from './StaffBottomNav';

export function StaffAvailabilityScreen() {
  const router = useRouter();
  const actor = useStaffActor();
  if (!actor) return <SafeAreaView style={s.root}><EmptyState icon="shield" title="Vui lòng đăng nhập nhân viên" actionText="Đăng nhập" onAction={() => router.replace('/auth/login')} /></SafeAreaView>;
  return <AvailabilityEditor key={actor.userId} actor={actor} />;
}
const presets = WORK_SHIFTS;
const clone = (value: AvailabilitySnapshot, start: string): AvailabilityDraft => ({ ...availabilityDraft(value), weekStart: start, confirmedDates: value.saved.registeredWeekStarts?.includes(start) ? weekDates(start) : [], days: weekDates(start).map(date => value.saved.days.find(day => day.date === date) ?? { date, intervals: [] }) });
const presetSlots = (start: string, end: string) => WEEK_SLOTS.filter(time => time >= start && time < end);
function AvailabilityEditor({ actor }: { actor: AvailabilityActor }) {
  const router = useRouter(), navigation = useNavigation(), administrative = useAdministrativeUnits();
  const [loaded, setLoaded] = useState<AvailabilitySnapshot>(), [draft, setDraft] = useState<AvailabilityDraft>();
  const [week, setWeek] = useState(() => weekStart()), [now, setNow] = useState(Date.now());
  const [editingFrom, setEditingFrom] = useState<number | null>(null), [modalDate, setModalDate] = useState('');
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [search, setSearch] = useState('');
  const [leave, setLeave] = useState<(() => void) | null>(null), [allowLeave, setAllowLeave] = useState(false);
  const editing = editingFrom !== null;
  const dirty = !!draft && !!loaded && JSON.stringify(draft) !== JSON.stringify(clone(loaded, week));
  const registered = loaded?.saved.registeredWeekStarts?.includes(week) ?? false;
  const dates = weekDates(week), lockedNow = Math.max(now, editingFrom ?? now);
  const modalDay = draft?.days.find(day => day.date === modalDate);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true);
    void StaffAvailabilityRepository.load(actor, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setLoaded(result); setDraft(clone(result, week)); setEditingFrom(null); setError(''); setLoading(false);
    }).catch(cause => { if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : 'Chưa tải được lịch.'); setLoading(false); } });
    return () => controller.abort();
  }, [actor, attempt]);
  usePreventRemove((dirty || saving) && !allowLeave, ({ data }) => setLeave(() => () => navigation.dispatch(data.action)));
  useEffect(() => {
    if (Platform.OS !== 'web' || !dirty) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  useEffect(() => { if (allowLeave && leave) { const timer = setTimeout(leave, 0); return () => clearTimeout(timer); } }, [allowLeave, leave]);
  const updateDay = (day: AvailabilityDay, slots: readonly string[]) => {
    if (!editing || saving) return;
    setDraft(value => value ? { ...value, confirmedDates: [...new Set([...(value.confirmedDates ?? []), day.date])], days: value.days.map(item => item.date === day.date ? setDaySlots(item, slots, Date.now()) : item) } : value); setError(''); setNotice('');
  };
  const save = async () => {
    if (!draft || !loaded || saving) return;
    const missing=draft.days.filter(day=>day.date>=localDate()&&!draft.confirmedDates?.includes(day.date));
    if(missing.length){setError('Chưa chọn ca làm hoặc Nghỉ: '+missing.map(day=>displayDate(day.date)).join(', '));return;}
    const validIds = administrative.units.map(unit => `hcm-${unit.id}`), areas = draft.areaIds.filter(id => validIds.includes(id));
    if (!areas.length) { setError('Chọn ít nhất một phường/xã nhận việc.'); return; }
    if (week !== weekStart() && week !== addCalendarDays(weekStart(), 7)) { setError('Tuần đã kết thúc. Hãy tải lại lịch.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await StaffAvailabilityRepository.save(actor, { ...draft, areaIds: areas }, loaded.saved.revision);
      setLoaded(result); setDraft(clone(result, week)); setSearch(''); setEditingFrom(null); setModalDate(''); setNotice('Đã xác nhận và cập nhật lịch cả tuần.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa lưu được lịch. Bản nháp vẫn được giữ.'); }
    finally { setSaving(false); }
  };
  const switchWeek = (start: string) => {
    if (!loaded || editing || saving) return;
    setWeek(start); setDraft(clone(loaded, start)); setNotice(''); setError('');
  };
  return <View style={s.root}><SafeAreaView edges={['top']} style={s.screen}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace('/staff')}><IconSymbol name="back" size={24} color={BrandColors.gray800} /></Pressable><Text style={s.title}>Đăng ký lịch tuần</Text><View style={{ width: 24 }} /></View>
    {loading ? <View style={s.center}><ActivityIndicator color={BrandColors.primary} /><Text>Đang tải lịch đã lưu…</Text></View> : !draft || !loaded ? <EmptyState icon="warning" title="Chưa tải được lịch" description={error} actionText="Thử lại" onAction={() => setAttempt(value => value + 1)} /> : <>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.row}>{[weekStart(now), addCalendarDays(weekStart(now), 7)].map((start, i) => <Pressable key={start} disabled={editing || saving} accessibilityRole="button" accessibilityState={{ selected: week === start }} style={[s.week, week === start && s.selected]} onPress={() => switchWeek(start)}><Text style={week === start ? s.white : s.link}>{i === 0 ? 'Tuần này' : 'Tuần kế tiếp'}</Text></Pressable>)}</View>
        <View style={s.card}><Text style={s.title}>{displayDate(dates[0])} – {displayDate(dates[6])}</Text><Text style={s.body}>Thứ Hai đến Chủ nhật • Giờ Việt Nam</Text><Text style={s.status}>{registered ? '✓ Đã đăng ký cả tuần' : 'Chưa xác nhận lịch tuần này'}</Text><Text style={s.body}>{editing ? `Đang sửa từ ${new Date(editingFrom!).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}. Khung giờ đã bắt đầu được khóa.` : 'Xem đủ 7 ngày bên dưới. Bấm thay đổi lịch để chỉnh các khung giờ chưa bắt đầu.'}</Text>
          {editing && <><Text style={s.heading}>Chọn ca cho cả tuần (có thể chọn nhiều ca)</Text><View style={s.wrap}>{[...presets, { title: 'Cả ngày', start: '08:00', end: '20:00' }, { title: 'Nghỉ', start: '08:00', end: '08:00' }].map(preset => <Pressable key={preset.title} disabled={saving} style={s.chip} onPress={() => { setDraft(value => value ? { ...value, confirmedDates: weekDates(week), days: value.days.map(day => preset.title === 'Cả ngày' || preset.title === 'Nghỉ' ? setDaySlots(day, presetSlots(preset.start, preset.end), Date.now()) : toggleShift(day, preset.start, preset.end, Date.now())) } : value); setError(''); }}><Text style={s.link}>{preset.title}</Text></Pressable>)}</View><Text style={s.sub}>Áp dụng cho các giờ còn lại; giữ nguyên thời gian đã qua.</Text></>}
        </View>
        {draft.days.map(day => {
          const expired = !WEEK_SLOTS.some(time => !slotLocked(day.date, time, lockedNow));
          const bookings = loaded.bookings.filter(item => localDate(item.startsAt) === day.date && !['CANCELLED', 'REFUNDED'].includes(item.status));
          return <View key={day.date} style={[s.card, expired && s.past]}><View style={s.row}><Text style={[s.heading, s.grow]}>{displayDate(day.date)}{day.date === localDate(now) ? ' • Hôm nay' : ''}</Text><Text style={s.sub}>{expired ? '🔒 Đã qua' : !draft.confirmedDates?.includes(day.date) ? 'Chưa đăng ký' : day.intervals.length ? 'Có lịch làm' : 'Nghỉ'}</Text></View>
            <View style={s.wrap}>{day.intervals.length ? day.intervals.map(period => <View key={period.startsAt} style={s.period}><Text style={s.status}>{displayTime(period.startsAt)}–{displayTime(period.endsAt)}</Text></View>) : <Text style={s.body}>{draft.confirmedDates?.includes(day.date) ? 'Đã xác nhận nghỉ trong ngày này.' : 'Chưa có khung giờ làm việc.'}</Text>}</View>
            {editing && (!expired || day.date === localDate(now)) && <><View style={s.wrap}>{presets.map(preset => { const slots=presetSlots(preset.start,preset.end).filter(time=>!slotLocked(day.date,time,lockedNow)), checked=slots.length>0&&slots.every(time=>selectedSlots(day).includes(time)); return <Pressable key={preset.title} disabled={saving || !slots.length} accessibilityRole="checkbox" accessibilityState={{checked,disabled:saving||!slots.length}} style={[s.chip,checked&&s.selected,!slots.length&&s.disabled]} onPress={() => updateDay(day,selectedSlots(toggleShift(day,preset.start,preset.end,Date.now())))}><Text style={checked?s.white:s.link}>{checked?'✓ ':''}{preset.title} {preset.start}–{preset.end}</Text></Pressable>; })}<Pressable disabled={saving} style={[s.chip, WEEK_SLOTS.filter(time=>!slotLocked(day.date,time,lockedNow)).every(time=>selectedSlots(day).includes(time))&&s.selected]} onPress={()=>updateDay(day,WEEK_SLOTS)}><Text style={WEEK_SLOTS.filter(time=>!slotLocked(day.date,time,lockedNow)).every(time=>selectedSlots(day).includes(time))?s.white:s.link}>Cả ngày 08:00–20:00</Text></Pressable></View><View style={s.row}><Pressable disabled={saving} style={[s.chip, s.grow]} onPress={() => setModalDate(day.date)}><Text style={s.link}>Chọn giờ chi tiết</Text></Pressable><Pressable disabled={saving} style={s.chip} onPress={() => updateDay(day, [])}><Text style={s.link}>Nghỉ</Text></Pressable></View></>}
            {bookings.map(booking => <Text key={booking.id} style={s.sub}>Ca {booking.bookingCode} • {displayTime(booking.startsAt)}–{displayTime(booking.endsAt)}{booking.district ? ` • ${booking.district}` : ''}</Text>)}
          </View>;
        })}
        <View style={s.card}><Text style={s.heading}>Phường/xã nhận việc • {draft.areaIds.length} đã chọn</Text><Text style={s.body}>Danh mục đơn vị hành chính mới của TP. Hồ Chí Minh.</Text>
          {administrative.loading && <ActivityIndicator color={BrandColors.primary} />}{!!administrative.error && <Pressable onPress={administrative.retry}><Text style={s.error}>{administrative.error} Bấm để tải lại.</Text></Pressable>}
          <TextInput editable={editing && !saving} accessibilityLabel="Tìm phường/xã" placeholder="Tìm phường/xã có hoặc không dấu" value={search} onChangeText={setSearch} style={s.input} />
          <View style={s.wrap}>{administrative.units.filter(unit => draft.areaIds.includes(`hcm-${unit.id}`)).map(unit => <View style={s.period} key={unit.id}><Text style={s.status}>✓ {unit.name}</Text></View>)}</View>
          {editing && <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}><View style={s.wrap}>{administrative.units.filter(unit => administrativeSearchKey(unit.name).includes(administrativeSearchKey(search))).map(unit => { const id = `hcm-${unit.id}`, selected = draft.areaIds.includes(id); return <Pressable key={id} disabled={saving} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} style={[s.chip, selected && s.selected]} onPress={() => { setDraft(value => value ? { ...value, areaIds: selected ? value.areaIds.filter(item => item !== id) : [...value.areaIds, id] } : value); setError(''); }}><Text style={selected ? s.white : s.link}>{selected ? '✓ ' : '+ '}{unit.name}</Text></Pressable>; })}</View></ScrollView>}
          {!draft.areaIds.length && <Text style={s.sub}>Chưa chọn phường/xã. Chọn khu vực trước khi xác nhận lịch.</Text>}
        </View>
        <View style={[s.card, s.row]}><View style={s.grow}><Text style={s.heading}>Thông báo việc phù hợp</Text><Text style={s.sub}>Theo lịch và phường/xã đã xác nhận.</Text></View><Switch disabled={!editing || saving} value={draft.matchNotifications} onValueChange={value => setDraft(current => current ? { ...current, matchNotifications: value } : current)} /></View>
        <Pressable disabled={saving} style={s.chip} onPress={() => dirty ? setError('Hãy xác nhận hoặc hủy thay đổi trước khi tải lại.') : setAttempt(value => value + 1)}><Text style={s.link}>Tải lại lịch đã lưu</Text></Pressable>
      </ScrollView>
      <View style={s.footer}>{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}{!!notice && <Text accessibilityLiveRegion="polite" style={s.status}>{notice}</Text>}{editing ? <><Text style={s.sub}>Bản nháp chưa áp dụng. Xác nhận để lưu cả tuần.</Text><View style={s.row}><Pressable disabled={saving} style={s.chip} onPress={() => { setDraft(clone(loaded, week)); setEditingFrom(null); setError(''); }}><Text style={s.link}>Hủy thay đổi</Text></Pressable><Pressable disabled={saving || administrative.loading || !!administrative.error} style={[s.primary, s.grow, saving && s.disabled]} onPress={() => { void save(); }}><Text style={s.white}>{saving ? 'Đang lưu…' : 'Xác nhận'}</Text></Pressable></View></> : <Pressable style={s.primary} onPress={() => { const timestamp = Date.now(); setNow(timestamp); setEditingFrom(timestamp); setNotice(''); setError(''); }}><Text style={s.white}>{registered ? 'Thay đổi lịch' : 'Đăng ký cả tuần'}</Text></Pressable>}</View>
    </>}
  </SafeAreaView><StaffBottomNav activeTab="profile" />
    <Modal visible={!!modalDay} transparent animationType="slide" onRequestClose={() => setModalDate('')}><View style={s.scrim}><SafeAreaView edges={['bottom']} style={s.modal}><Text style={s.title}>{modalDay ? displayDate(modalDay.date) : ''} • Chọn khung 30 phút</Text><Text style={s.sub}>Khung giờ đã bắt đầu bị khóa. Bấm Xác nhận ở màn hình tuần để lưu.</Text><ScrollView><View style={s.wrap}>{modalDay && WEEK_SLOTS.map(time => { const selected = selectedSlots(modalDay).includes(time), locked = slotLocked(modalDay.date, time, lockedNow); return <Pressable key={time} disabled={locked || saving} accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled: locked }} style={[s.slot, selected && s.selected, locked && s.disabled]} onPress={() => { const before = selectedSlots(modalDay); updateDay(modalDay, selected ? before.filter(item => item !== time) : [...before, time]); }}><Text style={selected ? s.white : s.link}>{locked ? '🔒 ' : ''}{time}</Text></Pressable>; })}</View></ScrollView><Pressable style={s.primary} onPress={() => setModalDate('')}><Text style={s.white}>Xong</Text></Pressable></SafeAreaView></View></Modal>
    <Modal visible={!!leave && !allowLeave} transparent onRequestClose={() => setLeave(null)}><View style={s.scrim}><SafeAreaView edges={['bottom']} style={s.modal}><Text style={s.title}>Lịch chưa được xác nhận</Text><Text style={s.body}>Tiếp tục chỉnh sửa hoặc bỏ bản nháp để rời màn hình.</Text><Pressable disabled={saving} style={s.primary} onPress={() => setLeave(null)}><Text style={s.white}>Tiếp tục chỉnh sửa</Text></Pressable><Pressable disabled={saving} style={s.chip} onPress={() => setAllowLeave(true)}><Text style={s.link}>Bỏ thay đổi và rời màn hình</Text></Pressable></SafeAreaView></View></Modal>
  </View>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BrandColors.gray50 }, screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: BrandColors.gray900 }, heading: { fontSize: 15, fontWeight: '700', color: BrandColors.gray900 }, body: { fontSize: 14, lineHeight: 21, color: BrandColors.gray700 }, sub: { fontSize: 12, lineHeight: 19, color: BrandColors.gray500 },
  content: { padding: 12, gap: 12 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 10 }, row: { flexDirection: 'row', gap: 8, alignItems: 'center' }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, grow: { flex: 1 },
  chip: { padding: 10, borderWidth: 1, borderColor: BrandColors.gray200, borderRadius: 10, backgroundColor: '#fff' }, week: { flex: 1, padding: 12, borderWidth: 1, borderColor: BrandColors.gray200, borderRadius: 12, backgroundColor: '#fff' }, selected: { backgroundColor: BrandColors.primary, borderColor: BrandColors.primary },
  period: { backgroundColor: BrandColors.primaryLight, borderRadius: 8, padding: 8 }, status: { color: BrandColors.primaryDark, fontWeight: '600', fontSize: 13 }, link: { color: BrandColors.primaryDark, fontWeight: '600', textAlign: 'center', fontSize: 13 }, white: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 14 },
  primary: { backgroundColor: BrandColors.primary, padding: 14, borderRadius: 12 }, footer: { backgroundColor: '#fff', padding: 12, gap: 8 }, input: { padding: 10, borderWidth: 1, borderColor: BrandColors.gray200, borderRadius: 10 }, error: { color: BrandColors.danger, lineHeight: 20 }, past: { backgroundColor: BrandColors.gray100 }, disabled: { opacity: 0.45 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, scrim: { flex: 1, backgroundColor: '#0007', justifyContent: 'flex-end' }, modal: { backgroundColor: '#fff', padding: 16, gap: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' }, slot: { width: '30%', padding: 12, borderWidth: 1, borderColor: BrandColors.gray200, borderRadius: 10 },
});
