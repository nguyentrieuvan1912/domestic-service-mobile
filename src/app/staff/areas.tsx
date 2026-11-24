import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { administrativeSearchKey, type AdministrativeUnit } from '@/api/administrative-units';
import { IconSymbol } from '@/components/common/IconSymbol';
import { AnimatedNoticeBanner, CleanMasterLoader, ShimmerSkeleton } from '@/components/common/CleanMasterAnimations';
import { BrandColors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { StaffAvailabilityRepository } from '@/data/connectedStaffRepository';
import { useAdministrativeUnits } from '@/hooks/use-administrative-units';
import { useStaffActor } from '@/hooks/use-staff-actor';
import type { AvailabilityActor, SavedAvailability } from '@/types/staff-availability';

const MAX_AREAS = 30;

type AreaFilter = 'ALL' | 'SELECTED' | 'WARD' | 'COMMUNE';

function unitTypeLabel(type?: AdministrativeUnit['type']): string {
  if (type === 'WARD') return 'Phường • TP. Hồ Chí Minh';
  if (type === 'COMMUNE') return 'Xã • TP. Hồ Chí Minh';
  if (type === 'SPECIAL_ZONE') return 'Đặc khu • TP. Hồ Chí Minh';
  return 'Khu vực hoạt động';
}

function sameAreaSelection(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every(item => setA.has(item));
}

export default function StaffAreas() {
  const actor = useStaffActor();
  return actor ? <AreaEditor key={actor.userId} actor={actor} /> : <Redirect href="/auth/login" />;
}

function AreaEditor({ actor }: { actor: AvailabilityActor }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const directory = useAdministrativeUnits();
  const [saved, setSaved] = useState<SavedAvailability>();
  const [draft, setDraft] = useState<string[] | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AreaFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setLoading(true);
      setError('');
      void StaffAvailabilityRepository.load(actor, controller.signal)
        .then(result => {
          if (!controller.signal.aborted) {
            setSaved(result.saved);
            setDraft(null);
          }
        })
        .catch(cause => {
          if (!controller.signal.aborted) {
            setError(cause instanceof Error ? cause.message : 'Chưa tải được khu vực.');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
    }, [actor, attempt]),
  );

  const unitMap = useMemo(() => {
    const map = new Map<string, AdministrativeUnit>();
    directory.units.forEach(unit => map.set(`hcm-${unit.id}`, unit));
    return map;
  }, [directory.units]);

  const savedAreas = saved?.areaIds ?? [];
  const areas = draft ?? savedAreas;
  const hasChanges = draft !== null && !sameAreaSelection(draft, savedAreas);

  const getUnitName = (id: string) => unitMap.get(id)?.name ?? id;
  const getUnitType = (id: string) => unitMap.get(id)?.type;

  const filteredUnits = useMemo(() => {
    const keyword = administrativeSearchKey(search);
    return directory.units.filter(unit => {
      const id = `hcm-${unit.id}`;
      if (filter === 'SELECTED' && !areas.includes(id)) return false;
      if (filter === 'WARD' && unit.type !== 'WARD') return false;
      if (filter === 'COMMUNE' && unit.type !== 'COMMUNE' && unit.type !== 'SPECIAL_ZONE') return false;
      if (keyword && !administrativeSearchKey(unit.name).includes(keyword)) return false;
      return true;
    });
  }, [directory.units, search, filter, areas]);

  const toggleArea = (id: string) => {
    const checked = areas.includes(id);
    if (!checked && areas.length >= MAX_AREAS) return;
    const next = checked ? areas.filter(area => area !== id) : [...areas, id];
    setDraft(next);
    setNotice('');
    setError('');
  };

  const handleBack = () => {
    if (saving) return;
    if (choosing) {
      setChoosing(false);
      if (draft && sameAreaSelection(draft, savedAreas)) setDraft(null);
      return;
    }
    if (hasChanges) {
      setDraft(null);
      setError('');
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/staff/profile');
  };

  const save = async () => {
    if (!saved || !draft || saving) return;
    setSaving(true);
    setError('');
    try {
      const result = await StaffAvailabilityRepository.saveAreas(actor, draft, saved.revision);
      setSaved(result.saved);
      setDraft(null);
      setNotice('Đã cập nhật khu vực hoạt động.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa lưu được khu vực hoạt động.');
    } finally {
      setSaving(false);
    }
  };

  const openChooser = () => {
    setDraft([...areas]);
    setSearch('');
    setFilter('ALL');
    setNotice('');
    setError('');
    setChoosing(true);
  };

  const closeChooser = () => {
    setChoosing(false);
    if (draft && sameAreaSelection(draft, savedAreas)) setDraft(null);
  };

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          style={[s.backButton, { backgroundColor: colors.surfaceMuted }]}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          disabled={saving}
          onPress={handleBack}
        >
          <IconSymbol name="back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {choosing ? 'Chọn khu vực hoạt động' : 'Quản lý khu vực hoạt động'}
        </Text>
        <View style={s.headerSpacer} />
      </View>

      {loading ? (
        <View style={{ flex: 1 }}>
          <CleanMasterLoader label="Đang tải khu vực hoạt động…" sublabel="Đang đồng bộ danh mục hành chính TP.HCM" />
          <ShimmerSkeleton count={3} />
        </View>
      ) : !saved ? (
        <View style={s.content}>
          <View style={s.errorCard}>
            <View style={s.errorIconWrap}>
              <IconSymbol name="warning" size={24} color={BrandColors.danger} />
            </View>
            <Text style={s.errorCardTitle}>Không thể tải dữ liệu</Text>
            <Text accessibilityRole="alert" style={s.errorCardDesc}>
              {error || 'Chưa tải được danh sách khu vực hoạt động.'}
            </Text>
            <Pressable style={s.retryButton} onPress={() => setAttempt(value => value + 1)}>
              <Text style={s.retryButtonText}>Tải lại</Text>
            </Pressable>
          </View>
        </View>
      ) : choosing ? (
        <>
          {/* Search & Filter Header */}
          <View style={[s.searchSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={[s.searchRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <IconSymbol name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={[s.searchInput, { color: colors.text }]}
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm phường, xã hoặc đặc khu…"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Tìm khu vực"
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable
                  style={[s.clearButton, { backgroundColor: colors.surfaceMuted }]}
                  accessibilityRole="button"
                  accessibilityLabel="Xóa từ khóa"
                  onPress={() => setSearch('')}
                >
                  <IconSymbol name="close" size={14} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filterRow}
            >
              {(
                [
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'SELECTED', label: `Đã chọn (${areas.length})` },
                  { key: 'WARD', label: 'Phường' },
                  { key: 'COMMUNE', label: 'Xã / Đặc khu' },
                ] as const
              ).map(chip => {
                const active = filter === chip.key;
                return (
                  <Pressable
                    key={chip.key}
                    style={[
                      s.filterChip,
                      { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                      active && { backgroundColor: colors.accentBg, borderColor: colors.primaryDark },
                    ]}
                    onPress={() => setFilter(chip.key)}
                  >
                    <Text
                      style={[
                        s.filterChipText,
                        { color: colors.textSecondary },
                        active && { color: colors.accentText },
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={s.quotaBar}>
              <Text style={[s.quotaText, { color: colors.textMuted }]}>
                Đã chọn <Text style={[s.quotaStrong, { color: colors.accentText }]}>{areas.length}/{MAX_AREAS}</Text> khu vực
              </Text>
              {areas.length >= MAX_AREAS && (
                <Text style={[s.quotaLimitText, { color: colors.warningText }]}>Đã đạt giới hạn tối đa</Text>
              )}
            </View>
          </View>

          {/* Directory List */}
          {directory.loading ? (
            <View style={s.centerState}>
              <ActivityIndicator size="large" color={colors.primaryDark} />
              <Text style={[s.centerStateText, { color: colors.textMuted }]}>Đang tải danh sách phường, xã…</Text>
            </View>
          ) : directory.error ? (
            <View style={s.content}>
              <View style={[s.errorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.errorCardDesc, { color: colors.textMuted }]}>{directory.error}</Text>
                <Pressable style={s.retryButton} onPress={directory.retry}>
                  <Text style={s.retryButtonText}>Tải lại danh sách</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <FlatList
              data={filteredUnits}
              keyExtractor={unit => String(unit.id)}
              contentContainerStyle={s.chooserList}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={[s.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[s.emptyIconWrap, { backgroundColor: colors.surfaceMuted }]}>
                    <IconSymbol name="search" size={22} color={colors.textMuted} />
                  </View>
                  <Text style={[s.emptyTitle, { color: colors.text }]}>Không tìm thấy khu vực phù hợp</Text>
                  <Text style={[s.emptyDesc, { color: colors.textMuted }]}>Thử nhập tên phường, xã khác hoặc đổi bộ lọc.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const id = `hcm-${item.id}`;
                const checked = areas.includes(id);
                const disabled = !checked && areas.length >= MAX_AREAS;
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked, disabled }}
                    disabled={disabled}
                    style={[
                      s.chooserRow,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      checked && { backgroundColor: colors.accentBg, borderColor: colors.accentBorder },
                      disabled && s.chooserRowDisabled,
                    ]}
                    onPress={() => toggleArea(id)}
                  >
                    <View
                      style={[
                        s.pinIconWrap,
                        { backgroundColor: colors.surfaceMuted },
                        checked && { backgroundColor: colors.isDark ? '#047857' : '#DCFCE7' },
                      ]}
                    >
                      <IconSymbol
                        name="location"
                        size={16}
                        color={checked ? (colors.isDark ? '#ECFDF5' : '#047857') : colors.textMuted}
                      />
                    </View>
                    <View style={s.rowCopy}>
                      <Text
                        style={[
                          s.rowTitle,
                          { color: colors.text },
                          checked && { color: colors.accentText, fontWeight: '800' },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={[s.rowSub, { color: colors.textMuted }]}>{unitTypeLabel(item.type)}</Text>
                    </View>
                    <View
                      style={[
                        s.checkbox,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        checked && s.checkboxChecked,
                      ]}
                    >
                      {checked && <IconSymbol name="check" size={14} color="#FFFFFF" />}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          {/* Chooser Footer */}
          <View style={[s.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <Pressable
              accessibilityRole="button"
              style={s.primaryButton}
              onPress={closeChooser}
            >
              <Text style={s.primaryButtonText}>Xem {areas.length} khu vực đã chọn</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[s.content, hasChanges && s.contentWithFooter]}
          >
            {/* Summary Overview Card */}
            <View style={[s.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[s.heroIconWrap, { backgroundColor: colors.accentBg }]}>
                <IconSymbol name="location" size={22} color={colors.accentText} />
              </View>
              <View style={s.heroCopy}>
                <Text style={[s.heroTitle, { color: colors.text }]}>Phạm vi nhận việc</Text>
                <Text style={[s.heroDesc, { color: colors.textMuted }]}>
                  Hệ thống ưu tiên ghép các đơn dịch vụ gần bạn thuộc khu vực đã đăng ký.
                </Text>
              </View>
              <View style={[s.countBadge, { backgroundColor: colors.accentBg, borderColor: colors.accentBorder }]}>
                <Text style={[s.countBadgeValue, { color: colors.accentText }]}>{areas.length}</Text>
                <Text style={[s.countBadgeMax, { color: colors.accentText }]}>/{MAX_AREAS}</Text>
              </View>
            </View>

            {/* Alerts */}
            {!!error && (
              <View style={[s.alertError, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}>
                <IconSymbol name="warning" size={16} color={colors.dangerText} />
                <Text accessibilityRole="alert" style={[s.alertErrorText, { color: colors.dangerText }]}>
                  {error}
                </Text>
              </View>
            )}
            {!!notice && <AnimatedNoticeBanner message={notice} />}

            {/* Current / Selected Areas Card */}
            <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={s.cardHeader}>
                <View style={s.cardHeaderLeft}>
                  <Text style={[s.sectionTitle, { color: colors.text }]}>
                    {hasChanges ? 'Khu vực đã chọn' : 'Khu vực hiện tại'}
                  </Text>
                  <Text style={[s.sectionHint, { color: colors.textMuted }]}>
                    {areas.length > 0
                      ? `Đang bật nhận việc tại ${areas.length} khu vực`
                      : 'Chưa đăng ký khu vực nào'}
                  </Text>
                </View>
                {hasChanges && (
                  <View style={[s.draftPill, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
                    <Text style={[s.draftPillText, { color: colors.warningText }]}>Chưa lưu</Text>
                  </View>
                )}
              </View>

              {areas.length === 0 ? (
                <View style={s.emptyInline}>
                  <View style={[s.emptyIconWrap, { backgroundColor: colors.surfaceMuted }]}>
                    <IconSymbol name="location" size={22} color={colors.textMuted} />
                  </View>
                  <Text style={[s.emptyTitle, { color: colors.text }]}>Chưa có khu vực hoạt động</Text>
                  <Text style={[s.emptyDesc, { color: colors.textMuted }]}>
                    Thêm ít nhất một phường, xã để nhận thông báo việc làm phù hợp.
                  </Text>
                </View>
              ) : (
                <View style={[s.areaList, { borderTopColor: colors.divider }]}>
                  {areas.map((id, index) => {
                    const label = getUnitName(id);
                    return (
                      <View
                        key={id}
                        style={[
                          s.areaRow,
                          { borderBottomColor: colors.divider },
                          index === areas.length - 1 && s.areaRowLast,
                        ]}
                      >
                        <View style={[s.areaPinWrap, { backgroundColor: colors.accentBg }]}>
                          <IconSymbol name="location" size={16} color={colors.accentText} />
                        </View>
                        <View style={s.rowCopy}>
                          <Text style={[s.areaName, { color: colors.text }]}>{label}</Text>
                          <Text style={[s.areaMeta, { color: colors.textMuted }]}>{unitTypeLabel(getUnitType(id))}</Text>
                        </View>
                        <Pressable
                          disabled={saving}
                          style={[s.removeButton, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}
                          accessibilityRole="button"
                          accessibilityLabel={`Bỏ ${label}`}
                          onPress={() => {
                            setDraft(areas.filter(area => area !== id));
                            setNotice('');
                            setError('');
                          }}
                        >
                          <IconSymbol name="close" size={13} color={colors.dangerText} />
                          <Text style={[s.removeButtonText, { color: colors.dangerText }]}>Bỏ</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}

              <Pressable
                disabled={saving || areas.length >= MAX_AREAS}
                style={[
                  s.addButton,
                  { backgroundColor: colors.accentBg, borderColor: colors.accentBorder },
                  (saving || areas.length >= MAX_AREAS) && { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                ]}
                accessibilityRole="button"
                onPress={openChooser}
              >
                <IconSymbol
                  name="plus"
                  size={16}
                  color={areas.length >= MAX_AREAS ? colors.textMuted : colors.accentText}
                />
                <Text
                  style={[
                    s.addButtonText,
                    { color: areas.length >= MAX_AREAS ? colors.textMuted : colors.accentText },
                  ]}
                >
                  {areas.length >= MAX_AREAS ? 'Đã đạt tối đa 30 khu vực' : 'Thêm khu vực'}
                </Text>
              </Pressable>
            </View>

            {/* Info Notice */}
            <View style={[s.infoNotice, { backgroundColor: colors.infoBg, borderColor: colors.infoBorder }]}>
              <IconSymbol name="info" size={16} color={colors.infoText} />
              <Text style={[s.infoNoticeText, { color: colors.infoText }]}>
                Bạn có thể chọn tối đa {MAX_AREAS} phường, xã hoặc đặc khu tại TP. Hồ Chí Minh. Thay
                đổi chỉ áp dụng sau khi bấm xác nhận lưu.
              </Text>
            </View>
          </ScrollView>

          {/* Sticky Save Footer */}
          {hasChanges && (
            <View style={[s.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <Pressable
                disabled={saving}
                accessibilityRole="button"
                style={[s.primaryButton, saving && s.primaryButtonDisabled]}
                onPress={() => void save()}
              >
                {saving ? (
                  <View style={s.savingRow}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={s.primaryButtonText}>Đang lưu…</Text>
                  </View>
                ) : (
                  <Text style={s.primaryButtonText}>Xác nhận lưu khu vực</Text>
                )}
              </Pressable>
              <Pressable
                disabled={saving}
                accessibilityRole="button"
                style={[s.secondaryButton, { backgroundColor: colors.surfaceMuted }]}
                onPress={() => {
                  setDraft(null);
                  setError('');
                }}
              >
                <Text style={[s.secondaryButtonText, { color: colors.textSecondary }]}>Hủy thay đổi</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '900',
    color: BrandColors.gray900,
    paddingHorizontal: 8,
  },
  headerSpacer: { width: 36 },

  content: { padding: 16, gap: 14, paddingBottom: 28 },
  contentWithFooter: { paddingBottom: 140 },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  centerStateText: { fontSize: 13, color: BrandColors.gray500, fontWeight: '600' },

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1 },
  heroTitle: { fontSize: 14, fontWeight: '900', color: BrandColors.gray900 },
  heroDesc: { fontSize: 12, color: BrandColors.gray500, lineHeight: 17, marginTop: 2 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countBadgeValue: { fontSize: 16, fontWeight: '900', color: '#047857' },
  countBadgeMax: { fontSize: 11, fontWeight: '700', color: '#059669' },

  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  alertErrorText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#B91C1C', lineHeight: 17 },
  alertSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  alertSuccessText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#047857', lineHeight: 17 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardHeaderLeft: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: BrandColors.gray900 },
  sectionHint: { fontSize: 12, color: BrandColors.gray500, marginTop: 2 },
  draftPill: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  draftPillText: { fontSize: 11, fontWeight: '800', color: '#B45309' },

  areaList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  areaRowLast: { borderBottomWidth: 0, paddingBottom: 4 },
  areaPinWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1 },
  areaName: { fontSize: 14, fontWeight: '800', color: BrandColors.gray900 },
  areaMeta: { fontSize: 11, color: BrandColors.gray500, marginTop: 2 },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeButtonText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 2,
  },
  addButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  addButtonText: { fontSize: 14, fontWeight: '800', color: '#047857' },
  addButtonTextDisabled: { color: BrandColors.gray400 },

  emptyInline: { alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12, gap: 6 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: BrandColors.gray800, textAlign: 'center' },
  emptyDesc: { fontSize: 12, color: BrandColors.gray500, textAlign: 'center', lineHeight: 17 },

  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 13,
    padding: 12,
  },
  infoNoticeText: { flex: 1, color: '#075985', fontSize: 11, lineHeight: 16 },

  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCardTitle: { fontSize: 15, fontWeight: '900', color: BrandColors.gray900 },
  errorCardDesc: { fontSize: 13, color: BrandColors.gray500, textAlign: 'center', lineHeight: 18 },
  retryButton: {
    marginTop: 6,
    backgroundColor: '#047857',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  /* Chooser View */
  searchSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  searchRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E3E8',
    backgroundColor: '#F8FAFC',
  },
  searchInput: { flex: 1, fontSize: 14, color: BrandColors.gray900, paddingVertical: 8 },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#047857',
  },
  filterChipText: { fontSize: 12, fontWeight: '700', color: BrandColors.gray600 },
  filterChipTextActive: { color: '#047857' },
  quotaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quotaText: { fontSize: 12, color: BrandColors.gray500 },
  quotaStrong: { fontWeight: '800', color: '#047857' },
  quotaLimitText: { fontSize: 11, fontWeight: '700', color: '#B45309' },

  chooserList: { padding: 16, gap: 8, paddingBottom: 24 },
  chooserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  chooserRowSelected: {
    backgroundColor: '#F0FDF9',
    borderColor: '#6EE7B7',
  },
  chooserRowDisabled: { opacity: 0.45 },
  pinIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIconWrapSelected: { backgroundColor: '#DCFCE7' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: BrandColors.gray800 },
  rowTitleSelected: { color: '#065F46', fontWeight: '800' },
  rowSub: { fontSize: 11, color: BrandColors.gray500, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },

  /* Bottom Bar */
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  primaryButton: {
    backgroundColor: '#047857',
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: BrandColors.gray700, fontSize: 14, fontWeight: '700' },
});
