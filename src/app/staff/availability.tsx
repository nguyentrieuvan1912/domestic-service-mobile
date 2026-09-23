import React, { useState, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { StaffService, StaffAvailabilitySlot } from '@/data/staffService';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';

export default function StaffAvailabilityScreen() {
  const router = useRouter();

  const [availability, setAvailability] = useState(StaffService.getAvailability());
  const [autoAccept, setAutoAccept] = useState(availability.areas.autoAccept);
  const [maxDistance, setMaxDistance] = useState(availability.areas.maxDistanceKm);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    availability.areas.selectedDistricts
  );

  useEffect(() => {
    const update = () => {
      setAvailability(StaffService.getAvailability());
    };
    const unsubscribe = StaffService.subscribe(update);
    return unsubscribe;
  }, []);

  const allDistricts = [
    'Bình Thạnh',
    'Quận 1',
    'Quận 2',
    'Quận 3',
    'Quận 7',
    'Phú Nhuận',
    'Gò Vấp',
    'Tân Bình',
    'TP. Thủ Đức',
  ];

  const distances = [3, 5, 10, 15];

  const toggleDistrict = (dist: string) => {
    if (selectedDistricts.includes(dist)) {
      if (selectedDistricts.length === 1) {
        Alert.alert('Lưu ý', 'Bạn phải chọn ít nhất 1 quận hoạt động.');
        return;
      }
      setSelectedDistricts(selectedDistricts.filter((d) => d !== dist));
    } else {
      setSelectedDistricts([...selectedDistricts, dist]);
    }
  };

  const toggleScheduleSlot = (slotId: string) => {
    StaffService.toggleShiftSlot(slotId);
    // Update immediately as well, so the selected state is visible on the same tap.
    setAvailability(StaffService.getAvailability());
  };

  const handleSave = () => {
    StaffService.updateOperatingAreas({
      autoAccept,
      maxDistanceKm: maxDistance,
      selectedDistricts,
    });
    Alert.alert(
      'Đã lưu cài đặt! ✓',
      'Hệ thống sẽ cập nhật thuật toán gửi thông báo ca làm việc mới theo lịch rảnh và khu vực bạn vừa chọn.'
    );
  };

  // Group slots by day
  const daysMap = [
    { dayOfWeek: 1, name: 'Thứ 2' },
    { dayOfWeek: 2, name: 'Thứ 3' },
    { dayOfWeek: 3, name: 'Thứ 4' },
    { dayOfWeek: 4, name: 'Thứ 5' },
    { dayOfWeek: 5, name: 'Thứ 6' },
    { dayOfWeek: 6, name: 'Thứ 7' },
    { dayOfWeek: 0, name: 'Chủ nhật' },
  ];

  return (
    <View style={styles.root}>
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconCircle} onPress={() => router.back()}>
          <IconSymbol name="back" size={22} color={BrandColors.gray800} />
        </Pressable>
        <Text style={styles.topBarTitle}>Đăng ký lịch làm</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Auto Dispatch Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Thiết lập nhận ca</Text>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Tự động nhận ca phù hợp</Text>
              <Text style={styles.switchDesc}>
                Hệ thống sẽ ghép ca cho bạn khi có khách đặt trùng với lịch rảnh và khu vực bạn chọn.
              </Text>
            </View>
            <Switch
              value={autoAccept}
              onValueChange={setAutoAccept}
              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.subLabel}>Bán kính nhận ca tối đa:</Text>
          <View style={styles.distanceChips}>
            {distances.map((km) => {
              const active = maxDistance === km;
              return (
                <Pressable
                  key={km}
                  style={[styles.distChip, active && styles.distChipActive]}
                  onPress={() => setMaxDistance(km)}
                >
                  <Text style={[styles.distChipText, active && styles.distChipTextActive]}>
                    {km} km
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Operating Districts Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Khu vực nhận việc (Quận/Huyện)</Text>
          <Text style={styles.cardSectionDesc}>
            Chọn các khu vực bạn thuận tiện di chuyển nhất ({selectedDistricts.length} đã chọn):
          </Text>

          <View style={styles.districtWrap}>
            {allDistricts.map((dist) => {
              const isSelected = selectedDistricts.includes(dist);
              return (
                <Pressable
                  key={dist}
                  style={[styles.districtChip, isSelected && styles.districtChipActive]}
                  onPress={() => toggleDistrict(dist)}
                >
                  <Text
                    style={[
                      styles.districtChipText,
                      isSelected && styles.districtChipTextActive,
                    ]}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {dist}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Weekly Availability Schedule */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Đăng ký lịch làm trong tuần</Text>
          <Text style={styles.cardSectionDesc}>
            Bật/tắt các khung giờ bạn có thể nhận ca từ Thứ 2 đến Chủ nhật:
          </Text>

          <View style={styles.scheduleList}>
            {daysMap.map((d) => {
              const daySlots = availability.slots.filter(
                (s) => s.dayOfWeek === d.dayOfWeek
              );
              return (
                <View key={d.dayOfWeek} style={styles.dayBlock}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{d.name}</Text>
                    <Text style={styles.dayCountActive}>
                      {daySlots.filter((s) => s.enabled).length}/{daySlots.length} ca rảnh
                    </Text>
                  </View>

                  <View style={styles.slotGrid}>
                    {daySlots.map((slot) => {
                      return (
                        <Pressable
                          key={slot.id}
                          style={[styles.slotItem, slot.enabled && styles.slotItemActive]}
                          onPress={() => toggleScheduleSlot(slot.id)}
                        >
                          <View style={styles.slotTopRow}>
                            <Text
                              style={[
                                styles.slotName,
                                slot.enabled && styles.slotNameActive,
                              ]}
                            >
                              {slot.shiftName}
                            </Text>
                            <View
                              style={[
                                styles.slotCheckCircle,
                                slot.enabled && styles.slotCheckCircleActive,
                              ]}
                            >
                              {slot.enabled && (
                                <Text style={styles.slotCheckCircleIcon}>✓</Text>
                              )}
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.slotTime,
                              slot.enabled && styles.slotTimeActive,
                            ]}
                          >
                            {slot.timeRange}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Lưu đăng ký lịch làm</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
    <StaffBottomNav activeTab="availability" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: { fontSize: 17, fontWeight: '900', color: BrandColors.gray900 },

  content: { padding: 16, gap: 14, paddingBottom: 30 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardSectionTitle: { fontSize: 15, fontWeight: '900', color: BrandColors.gray900 },
  cardSectionDesc: { fontSize: 12, color: BrandColors.gray500, lineHeight: 16 },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchTitle: { fontSize: 13, fontWeight: '800', color: BrandColors.gray900 },
  switchDesc: { fontSize: 11, color: BrandColors.gray500, marginTop: 2, lineHeight: 16 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 },

  subLabel: { fontSize: 12, fontWeight: '800', color: BrandColors.gray700 },
  distanceChips: { flexDirection: 'row', gap: 8 },
  distChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  distChipActive: { backgroundColor: '#047857' },
  distChipText: { fontSize: 12, fontWeight: '700', color: BrandColors.gray700 },
  distChipTextActive: { color: '#FFFFFF', fontWeight: '900' },

  districtWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  districtChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  districtChipActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  districtChipText: { fontSize: 12, fontWeight: '600', color: BrandColors.gray700 },
  districtChipTextActive: { color: '#047857', fontWeight: '800' },

  scheduleList: { gap: 14, marginTop: 6 },
  dayBlock: { gap: 6 },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 2,
  },
  dayTitle: { fontSize: 13, fontWeight: '900', color: BrandColors.gray900 },
  dayCountActive: { fontSize: 11, fontWeight: '700', color: '#047857' },
  slotGrid: { flexDirection: 'row', gap: 6 },
  slotItem: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotItemActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotName: { fontSize: 11, fontWeight: '800', color: BrandColors.gray700 },
  slotNameActive: { color: '#047857' },
  slotCheckCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCheckCircleActive: { backgroundColor: '#047857', borderColor: '#047857' },
  slotCheckCircleIcon: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  slotTime: { fontSize: 9, color: BrandColors.gray500, marginTop: 4 },
  slotTimeActive: { color: '#065F46', fontWeight: '700' },

  saveBtn: {
    backgroundColor: '#047857',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#047857',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
