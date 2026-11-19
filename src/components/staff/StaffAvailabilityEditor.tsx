import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStaffActor } from '@/hooks/use-staff-actor';
import { StaffAvailabilityRepository, availabilityDraft } from '@/data/connectedStaffRepository';
import { addCalendarDays, displayDate, displayTime, localDate } from '@/data/staffAvailabilityRules';
import { selectedSlots, setDaySlots, slotLocked, weekDates, weekStart, hourSlots, HOUR_STARTS, WEEK_SLOTS, WORK_SHIFTS, toggleShift } from '@/data/weeklyAvailability';
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

function DayButton({ label, time, checked, rest, disabled, onPress }: {
  label: string; time?: string; checked?: boolean; rest?: boolean; disabled: boolean; onPress: () => void;
}) {
  const filled = checked ? (rest ? s.restSelected : s.workSelected) : undefined;
  return <Pressable
    accessibilityRole={checked === undefined ? 'button' : 'checkbox'}
    accessibilityLabel={time ? label + ', ' + time : label}
    accessibilityState={{ checked, disabled }}
    disabled={disabled}
    style={({ pressed }) => [s.dayButton, filled, (pressed || disabled) && s.disabled]}
    onPress={onPress}>
    <Text style={[s.dayButtonLabel, checked && s.buttonWhite]}>{checked ? '✓ ' : ''}{label}</Text>
    {!!time && <Text style={[s.dayButtonTime, checked && s.buttonWhite]}>{time}</Text>}
  </Pressable>;
}

function AvailabilityEditor({ actor }: { actor: AvailabilityActor }) {
  const router = useRouter(), navigation = useNavigation();
  const [loaded, setLoaded] = useState<AvailabilitySnapshot>(), [draft, setDraft] = useState<AvailabilityDraft>();
  const [week, setWeek] = useState(() => weekStart()), [now, setNow] = useState(Date.now());
  const [editingFrom, setEditingFrom] = useState<number | null>(null), [modalDate, setModalDate] = useState('');
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [leave, setLeave] = useState<(() => void) | null>(null), [allowLeave, setAllowLeave] = useState(false);
  const editing = editingFrom !== null;
  const dirty = !!draft && !!loaded && JSON.stringify(draft) !== JSON.stringify(clone(loaded, week));
  const registered = loaded?.saved.registeredWeekStarts?.includes(week) ?? false;
  const dates = weekDates(week), lockedNow = Math.max(now, editingFrom ?? now);
  const today = localDate(now);
  const modalDay = draft?.days.find(day => day.date === modalDate);
  const modalSlots = modalDay ? selectedSlots(modalDay) : [];
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
    if (week !== weekStart() && week !== addCalendarDays(weekStart(), 7)) { setError('Tuần đã kết thúc. Hãy tải lại lịch.'); return; }
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await StaffAvailabilityRepository.save(actor, draft, loaded.saved.revision);
      setLoaded(result); setDraft(clone(result, week)); setEditingFrom(null); setModalDate(''); setNotice('Đã xác nhận và cập nhật lịch cả tuần.');
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
          {editing && <>
            <Text style={s.heading}>Chọn ca cho cả tuần (có thể chọn nhiều ca)</Text>
            <View style={s.buttonRow}>
              {[...presets, { title: 'Cả ngày', start: '08:00', end: '20:00' }, { title: 'Nghỉ', start: '08:00', end: '08:00' }].map(preset =>
                <DayButton key={preset.title} label={preset.title} disabled={saving} onPress={() => {
                  const timestamp = Date.now();
                  setDraft(value => value ? {
                    ...value,
                    confirmedDates: weekDates(week),
                    days: value.days.map(day => preset.title === 'Cả ngày' || preset.title === 'Nghỉ'
                      ? setDaySlots(day, presetSlots(preset.start, preset.end), timestamp)
                      : toggleShift(day, preset.start, preset.end, timestamp)),
                  } : value);
                  setError(''); setNotice('');
                }} />)}
            </View>
            <Text style={s.sub}>Áp dụng cho các giờ còn lại; giữ nguyên thời gian đã qua.</Text>
          </>}
        </View>
        {draft.days.map(day => {
          const editableSlots = WEEK_SLOTS.filter(time => !slotLocked(day.date, time, lockedNow));
          const expired = editableSlots.length === 0;
          const confirmed = draft.confirmedDates?.includes(day.date);
          const resting = !!confirmed && day.intervals.length === 0;
          const daySlots = selectedSlots(day);
          const allDay = !expired && editableSlots.every(time => daySlots.includes(time));
          const dayStatus = resting ? 'Nghỉ' : expired ? 'Đã qua' : confirmed ? 'Có lịch làm' : 'Chưa đăng ký';
          const bookings = loaded.bookings.filter(item => localDate(item.startsAt) === day.date && !['CANCELLED', 'REFUNDED'].includes(item.status));
          const showDayButtons = editing && (!expired || day.date === today);
          const shiftButtons = showDayButtons ? presets.map(preset => {
            const slots = editableSlots.filter(time => time >= preset.start && time < preset.end);
            return <DayButton key={preset.title} label={preset.title} time={preset.start + '–' + preset.end}
              checked={slots.length > 0 && slots.every(time => daySlots.includes(time))} disabled={saving || !slots.length}
              onPress={() => updateDay(day, selectedSlots(toggleShift(day, preset.start, preset.end, Date.now())))} />;
          }) : [];
          return <View key={day.date} style={[s.card, s.dayCard, expired && s.past, !confirmed && s.unregisteredCard, resting && s.restCard]}>
            <View style={s.row}>
              <Text style={[s.heading, s.grow]}>{displayDate(day.date)}{day.date === today ? ' • Hôm nay' : ''}</Text>
              <View style={[s.dayStatus, resting ? s.restStatus : confirmed && !expired && s.workStatus]}>
                <Text style={[s.dayStatusText, resting ? s.restStatusText : confirmed && !expired && s.status]}>{dayStatus}</Text>
              </View>
            </View>
            <View style={s.wrap}>
              {day.intervals.length ? day.intervals.map(period => <View key={period.startsAt} style={s.period}>
                <Text style={s.status}>{displayTime(period.startsAt)}–{displayTime(period.endsAt)}</Text>
              </View>) : <Text style={s.body}>{resting
                ? (editing ? 'Đã chọn nghỉ ngày này.' : 'Đã xác nhận nghỉ trong ngày này.')
                : 'Chưa có khung giờ làm việc.'}</Text>}
            </View>
            {showDayButtons && <>
              <View style={s.buttonRow}>{shiftButtons.slice(0, 2)}</View>
              <View style={s.buttonRow}>
                {shiftButtons[2]}
                <DayButton label="Cả ngày" time="08:00–20:00" checked={allDay} disabled={saving} onPress={() => updateDay(day, WEEK_SLOTS)} />
              </View>
              <View style={s.buttonRow}>
                <DayButton label="Chọn giờ chi tiết" disabled={saving} onPress={() => setModalDate(day.date)} />
                <DayButton label="Nghỉ" checked={resting} rest disabled={saving} onPress={() => updateDay(day, [])} />
              </View>
            </>}
            {bookings.map(booking => <Text key={booking.id} style={s.sub}>Ca {booking.bookingCode} • {displayTime(booking.startsAt)}–{displayTime(booking.endsAt)}{booking.district ? ` • ${booking.district}` : ''}</Text>)}
          </View>;
        })}
        <View style={[s.card, s.row]}><View style={s.grow}><Text style={s.heading}>Thông báo việc phù hợp</Text><Text style={s.sub}>Theo lịch và phường/xã đã xác nhận.</Text></View><Switch disabled={!editing || saving} value={draft.matchNotifications} onValueChange={value => setDraft(current => current ? { ...current, matchNotifications: value } : current)} /></View>
        <Pressable disabled={saving} style={s.chip} onPress={() => dirty ? setError('Hãy xác nhận hoặc hủy thay đổi trước khi tải lại.') : setAttempt(value => value + 1)}><Text style={s.link}>Tải lại lịch đã lưu</Text></Pressable>
      </ScrollView>
      <View style={s.footer}>
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
        {!!notice && <Text accessibilityLiveRegion="polite" style={s.status}>{notice}</Text>}
        {editing ? <>
          <Text style={s.sub}>Bản nháp chưa áp dụng. Xác nhận để lưu cả tuần.</Text>
          <View style={s.buttonRow}>
            <DayButton label="Hủy thay đổi" disabled={saving} onPress={() => {
              setDraft(clone(loaded, week)); setEditingFrom(null); setError('');
            }} />
            <Pressable accessibilityRole="button" disabled={saving}
              style={[s.dayButton, s.workSelected, saving && s.disabled]} onPress={() => void save()}>
              <Text style={[s.dayButtonLabel, s.buttonWhite]}>{saving ? 'Đang lưu…' : 'Xác nhận'}</Text>
            </Pressable>
          </View>
        </> : <Pressable style={s.primary} onPress={() => {
          const timestamp = Date.now(); setNow(timestamp); setEditingFrom(timestamp); setNotice(''); setError('');
        }}><Text style={s.white}>{registered ? 'Thay đổi lịch' : 'Đăng ký cả tuần'}</Text></Pressable>}
      </View>
    </>}
  </SafeAreaView><StaffBottomNav activeTab="profile" />
    <Modal visible={!!modalDay} transparent animationType="slide" onRequestClose={() => setModalDate('')}>
      <View style={s.scrim}>
        <SafeAreaView edges={['bottom']} style={s.modal}>
          <Text style={s.title}>{modalDay ? displayDate(modalDay.date) : ''} • Chọn ca ít nhất 1 tiếng</Text>
          <Text style={s.sub}>Mỗi ô chọn một giờ làm việc. Ca đã bắt đầu được khóa. Bấm Xác nhận ở màn hình tuần để lưu.</Text>
          {modalDay && <ScrollView>
            <View style={s.wrap}>
              {HOUR_STARTS.map(time => {
                const block = hourSlots(time);
                const selected = block.every(item => modalSlots.includes(item));
                const locked = slotLocked(modalDay.date, time, lockedNow);
                const end = String(Number(time.slice(0, 2)) + 1).padStart(2, '0') + time.slice(2);
                return <Pressable key={time} disabled={locked || saving} accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled: locked || saving }}
                  accessibilityLabel={time + ' đến ' + end}
                  style={[s.slot, selected && s.selected, locked && s.disabled]}
                  onPress={() => updateDay(modalDay, selected ? modalSlots.filter(item => !block.includes(item)) : [...modalSlots, ...block])}>
                  <Text style={selected ? s.white : s.link}>{locked ? '🔒 ' : ''}{time}–{end}</Text>
                </Pressable>;
              })}
            </View>
          </ScrollView>}
          <Pressable style={s.primary} onPress={() => setModalDate('')}><Text style={s.white}>Xong</Text></Pressable>
        </SafeAreaView>
      </View>
    </Modal>
    <Modal visible={!!leave && !allowLeave} transparent onRequestClose={() => setLeave(null)}><View style={s.scrim}><SafeAreaView edges={['bottom']} style={s.modal}><Text style={s.title}>Lịch chưa được xác nhận</Text><Text style={s.body}>Tiếp tục chỉnh sửa hoặc bỏ bản nháp để rời màn hình.</Text><Pressable disabled={saving} style={s.primary} onPress={() => setLeave(null)}><Text style={s.white}>Tiếp tục chỉnh sửa</Text></Pressable><Pressable disabled={saving} style={s.chip} onPress={() => setAllowLeave(true)}><Text style={s.link}>Bỏ thay đổi và rời màn hình</Text></Pressable></SafeAreaView></View></Modal>
  </View>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F6F4' }, screen: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: BrandColors.gray900 }, heading: { fontSize: 15, fontWeight: '700', color: BrandColors.gray900 }, body: { fontSize: 14, lineHeight: 21, color: BrandColors.gray700 }, sub: { fontSize: 12, lineHeight: 19, color: BrandColors.gray500 },
  content: { padding: 12, gap: 14 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 10 }, row: { flexDirection: 'row', gap: 8, alignItems: 'center' }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, grow: { flex: 1 },
  dayCard: { borderWidth: 1, borderColor: BrandColors.gray300 },
  unregisteredCard: { borderColor: BrandColors.gray900 },
  dayStatus: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: BrandColors.gray100 },
  dayStatusText: { color: BrandColors.gray700, fontSize: 12, fontWeight: '600' },
  workStatus: { backgroundColor: BrandColors.primaryLight },
  restCard: { backgroundColor: '#FFF7F7' },
  restStatus: { backgroundColor: '#FBDCDC' }, restStatusText: { color: '#991B1B' },
  buttonRow: { flexDirection: 'row', gap: 8 },
  dayButton: { flex: 1, minWidth: 0, minHeight: 50, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: BrandColors.gray300, borderRadius: 10, backgroundColor: '#fff' },
  dayButtonLabel: { color: '#075F45', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  dayButtonTime: { color: '#48665C', fontSize: 11, textAlign: 'center' },
  workSelected: { backgroundColor: '#087653', borderColor: '#087653' },
  restSelected: { backgroundColor: '#B91C1C', borderColor: '#B91C1C' },
  buttonWhite: { color: '#fff' },
  chip: { padding: 10, borderWidth: 1, borderColor: BrandColors.gray200, borderRadius: 10, backgroundColor: '#fff' }, week: { flex: 1, padding: 12, borderWidth: 1, borderColor: BrandColors.gray200, borderRadius: 12, backgroundColor: '#fff' }, selected: { backgroundColor: BrandColors.primary, borderColor: BrandColors.primary },
  period: { backgroundColor: BrandColors.primaryLight, borderRadius: 8, padding: 8 }, status: { color: BrandColors.primaryDark, fontWeight: '600', fontSize: 13 }, link: { color: BrandColors.primaryDark, fontWeight: '600', textAlign: 'center', fontSize: 13 }, white: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 14 },
  primary: { backgroundColor: BrandColors.primary, padding: 14, borderRadius: 12 }, footer: { backgroundColor: '#fff', padding: 12, gap: 8 }, error: { color: BrandColors.danger, lineHeight: 20 }, past: { backgroundColor: BrandColors.gray100 }, disabled: { opacity: 0.45 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, scrim: { flex: 1, backgroundColor: '#0007', justifyContent: 'flex-end' }, modal: { backgroundColor: '#fff', padding: 16, gap: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' }, slot: { width: '30%', padding: 12, borderWidth: 1, borderColor: BrandColors.gray200, borderRadius: 10 },
});
