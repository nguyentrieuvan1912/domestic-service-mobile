import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { Badge, formatVND } from '@/components/common/Badge';
import { RatingStars } from '@/components/common/RatingStars';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { mockServices } from '@/data/services';
import { mockAddOns } from '@/data/addOns';
import { ServiceCategory } from '@/types/service';

const CATEGORIES: { label: string; value: 'ALL' | ServiceCategory }[] = [
  { label: 'Tất cả (3 dịch vụ)', value: 'ALL' },
  { label: 'Dọn theo ca lẻ', value: 'HOURLY' },
  { label: 'Dọn định kỳ', value: 'PERIODIC' },
  { label: 'Tổng vệ sinh nhà/căn hộ', value: 'DEEP_CLEAN' },
];

const HANOI_DISTRICTS = [
  'Cầu Giấy',
  'Nam Từ Liêm',
  'Bắc Từ Liêm',
  'Đống Đa',
  'Ba Đình',
  'Thanh Xuân',
  'Tây Hồ',
  'Hai Bà Trưng',
  'Hoàn Kiếm',
  'Long Biên',
  'Hà Đông',
  'Hoàng Mai',
];

const WEEK_DAYS = [
  { day: 'T2', date: '10/06' },
  { day: 'T3', date: '11/06' },
  { day: 'T4', date: '12/06' },
  { day: 'T5', date: '13/06' },
  { day: 'T6', date: '14/06' },
  { day: 'T7', date: '15/06' },
  { day: 'CN', date: '16/06' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const { currentRole, currentStaff } = useAuth();
  const isStaff = currentRole === 'STAFF';

  // Customer states
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ServiceCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Staff states (Section 12 & 13)
  const [activeDistricts, setActiveDistricts] = useState<string[]>(
    currentStaff?.operatingDistricts || ['Cầu Giấy', 'Nam Từ Liêm', 'Đống Đa', 'Thanh Xuân']
  );
  const [selectedDayIdx, setSelectedDayIdx] = useState(1);
  const [availableSlots, setAvailableSlots] = useState<{ [key: string]: boolean }>({
    '1-morning': true,
    '1-afternoon': true,
    '1-evening': false,
    '2-morning': true,
    '2-afternoon': false,
    '2-evening': true,
    '3-morning': true,
    '3-afternoon': true,
    '3-evening': false,
  });

  const toggleDistrict = (district: string) => {
    if (activeDistricts.includes(district)) {
      if (activeDistricts.length <= 1) {
        Alert.alert('Lưu ý', 'Bạn phải giữ tối thiểu 1 khu vực hoạt động để nhận đơn.');
        return;
      }
      setActiveDistricts(activeDistricts.filter((d) => d !== district));
    } else {
      setActiveDistricts([...activeDistricts, district]);
    }
  };

  const toggleSlot = (slotKey: string) => {
    setAvailableSlots({
      ...availableSlots,
      [slotKey]: !availableSlots[slotKey],
    });
  };

  const filteredServices = mockServices.filter((service) => {
    const matchesCategory =
      selectedCategory === 'ALL' || service.category === selectedCategory;
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isStaff ? 'Khu vực & Lịch rảnh nhân viên' : 'Dịch vụ & Add-on'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isStaff
              ? 'Quản lý quận nhận đơn (không cần GPS) & lịch rảnh 7 ngày tới'
              : '3 dịch vụ chính & các hạng mục bổ sung chuẩn hóa'}
          </Text>
        </View>

        {/* ========================================================= */}
        {/* ==================== STAFF VIEW ========================= */}
        {/* ========================================================= */}
        {isStaff ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.staffContent}>

            {/* District Manager (Section 13) */}
            <View style={styles.staffCard}>
              <View style={styles.staffCardTitleRow}>
                <Text style={styles.staffCardTitle}>1. Khu vực hoạt động (Quận/Huyện)</Text>
                <Badge label={`${activeDistricts.length} quận`} variant="primary" size="sm" />
              </View>

              <View style={styles.noticeAlert}>
                <IconSymbol name="shield" size={14} color={BrandColors.primary} />
                <Text style={styles.noticeAlertText}>
                  Không cần định vị GPS theo thời gian thực. Hệ thống dựa vào quận đăng ký để đề xuất đơn Mode B và gợi ý thợ Mode A.
                </Text>
              </View>

              <View style={styles.districtChipsGrid}>
                {HANOI_DISTRICTS.map((d) => {
                  const isChecked = activeDistricts.includes(d);
                  return (
                    <Pressable
                      key={d}
                      style={[
                        styles.districtChip,
                        isChecked && styles.districtChipActive,
                      ]}
                      onPress={() => toggleDistrict(d)}>
                      <Text
                        style={[
                          styles.districtChipText,
                          isChecked && styles.districtChipTextActive,
                        ]}>
                        {isChecked ? `✓ ${d}` : `+ ${d}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Availability Manager (Section 12) */}
            <View style={[styles.staffCard, { marginTop: Spacing.three }]}>
              <View style={styles.staffCardTitleRow}>
                <Text style={styles.staffCardTitle}>2. Đăng ký lịch rảnh (Tối đa 7 ngày)</Text>
                <Badge label="Khung giờ 08:00 - 20:00" variant="success" size="sm" />
              </View>

              <View style={styles.noticeAlert}>
                <IconSymbol name="clock" size={14} color={BrandColors.primary} />
                <Text style={styles.noticeAlertText}>
                  Lịch rảnh giúp khách Mode A đặt trước 1 giờ. Không đăng ký lịch trùng với đơn đã nhận. Có thể đăng ký trước tối đa 1 tuần.
                </Text>
              </View>

              {/* Weekly Days Bar */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.weekScroll}>
                {WEEK_DAYS.map((day, idx) => {
                  const isSelected = selectedDayIdx === idx;
                  return (
                    <Pressable
                      key={day.date}
                      style={[
                        styles.dayPill,
                        isSelected && styles.dayPillActive,
                      ]}
                      onPress={() => setSelectedDayIdx(idx)}>
                      <Text
                        style={[
                          styles.dayPillText,
                          isSelected && styles.dayPillTextActive,
                        ]}>
                        {day.day}
                      </Text>
                      <Text
                        style={[
                          styles.datePillText,
                          isSelected && styles.dayPillTextActive,
                        ]}>
                        {day.date}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Shift Toggles */}
              <View style={styles.shiftList}>
                {[
                  { key: 'morning', label: 'Ca Sáng', time: '08:00 – 12:00', icon: '☀️' },
                  { key: 'afternoon', label: 'Ca Chiều', time: '13:00 – 17:00', icon: '🌤️' },
                  { key: 'evening', label: 'Ca Tối', time: '17:00 – 20:00', icon: '🌙' },
                ].map((shift) => {
                  const slotKey = `${selectedDayIdx}-${shift.key}`;
                  const isAvailable = !!availableSlots[slotKey];

                  return (
                    <Pressable
                      key={shift.key}
                      style={[
                        styles.shiftRow,
                        isAvailable && styles.shiftRowActive,
                      ]}
                      onPress={() => toggleSlot(slotKey)}>
                      <Text style={{ fontSize: 20 }}>{shift.icon}</Text>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.shiftLabel}>{shift.label}</Text>
                        <Text style={styles.shiftTime}>{shift.time}</Text>
                      </View>
                      <Badge
                        label={isAvailable ? 'Sẵn sàng nhận việc' : 'Nghỉ ca'}
                        variant={isAvailable ? 'success' : 'neutral'}
                        size="sm"
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* ========================================================= */
          /* =================== CUSTOMER VIEW ======================= */
          /* ========================================================= */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.customerContent}>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <IconSymbol name="search" size={18} color={BrandColors.gray400} />
                <TextInput
                  placeholder="Tìm kiếm dịch vụ chính..."
                  placeholderTextColor={BrandColors.gray400}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <IconSymbol name="close" size={14} color={BrandColors.gray400} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Category Chips Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.value;
                return (
                  <Pressable
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat.value)}>
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Core Services Section (Section 5) */}
            <Text style={styles.sectionHeading}>3 Dịch vụ chính</Text>
            <View style={styles.serviceList}>
              {filteredServices.map((service) => (
                <Pressable
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => router.push(`/service/${service.id}`)}>
                  <Image source={{ uri: service.image }} style={styles.serviceImage} />

                  <View style={styles.serviceCardBody}>
                    <View style={styles.serviceCardTopRow}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      {service.id === 'srv-001' ? (
                        <Badge label="Mode A & B" variant="primary" size="sm" />
                      ) : (
                        <Badge label="Mode B" variant="info" size="sm" />
                      )}
                    </View>

                    <Text style={styles.serviceDesc} numberOfLines={2}>
                      {service.shortDescription}
                    </Text>

                    <View style={styles.serviceCardBottomRow}>
                      <Text style={styles.servicePrice}>
                        từ {formatVND(service.basePrice)}
                        <Text style={styles.serviceUnit}>/{service.unit}</Text>
                      </Text>
                      <RatingStars
                        rating={service.rating}
                        reviewCount={service.reviewCount}
                        size={11}
                      />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Add-on Catalog Section (Section 5 & 9: Supplementary tasks) */}
            <View style={styles.addonSectionHeader}>
              <Text style={styles.sectionHeading}>Hạng mục phụ trợ (Add-on)</Text>
              <Text style={styles.sectionSubHeading}>
                Công việc bổ sung kèm dịch vụ chính • Giá và thời lượng chuẩn hóa
              </Text>
            </View>

            <View style={styles.addonGrid}>
              {mockAddOns.map((addon) => (
                <View key={addon.id} style={styles.addonItemCard}>
                  <Image source={{ uri: addon.image }} style={styles.addonItemImg} />
                  <View style={styles.addonItemContent}>
                    <View style={styles.addonItemHeader}>
                      <Text style={styles.addonItemName}>{addon.name}</Text>
                      <Text style={styles.addonItemPrice}>+{formatVND(addon.price)}</Text>
                    </View>
                    <Text style={styles.addonItemDesc} numberOfLines={2}>
                      {addon.description}
                    </Text>
                    <View style={styles.addonItemFooter}>
                      <Badge label={`+${addon.durationMinutes} phút`} variant="info" size="sm" />
                      <Text style={styles.addonSelectNote}>Tùy chọn tại bước đặt</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginTop: 2,
  },

  // Staff View Styles
  staffContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  staffCard: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  staffCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  staffCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  noticeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: Spacing.two,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.two,
  },
  noticeAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 15,
  },
  districtChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  districtChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: BrandColors.gray300,
    backgroundColor: BrandColors.white,
  },
  districtChipActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  districtChipText: {
    fontSize: 12,
    color: BrandColors.gray700,
    fontWeight: '600',
  },
  districtChipTextActive: {
    color: BrandColors.primaryDark,
    fontWeight: '700',
  },

  weekScroll: {
    gap: 8,
    marginBottom: Spacing.two,
  },
  dayPill: {
    width: 60,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.gray300,
    alignItems: 'center',
    backgroundColor: BrandColors.white,
  },
  dayPillActive: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primary,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray700,
  },
  datePillText: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  dayPillTextActive: {
    color: BrandColors.white,
  },

  shiftList: {
    gap: 8,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    backgroundColor: BrandColors.white,
  },
  shiftRowActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  shiftLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  shiftTime: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 1,
  },

  // Customer View Styles
  customerContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  searchContainer: {
    marginBottom: Spacing.two,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: BrandColors.gray900,
  },
  categoryScroll: {
    gap: 8,
    marginBottom: Spacing.three,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  categoryChipSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray700,
  },
  categoryChipTextSelected: {
    color: BrandColors.white,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: Spacing.two,
  },
  serviceList: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.two,
  },
  serviceCardBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  serviceCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    flex: 1,
  },
  serviceDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginVertical: 2,
  },
  serviceCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  serviceUnit: {
    fontSize: 11,
    fontWeight: 'normal',
    color: BrandColors.gray500,
  },

  // Add-on Catalog
  addonSectionHeader: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  sectionSubHeading: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: -4,
  },
  addonGrid: {
    gap: Spacing.two,
  },
  addonItemCard: {
    flexDirection: 'row',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    gap: Spacing.two,
    alignItems: 'center',
  },
  addonItemImg: {
    width: 76,
    height: 76,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.gray100,
  },
  addonItemContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  addonItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addonItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  addonItemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  addonItemDesc: {
    fontSize: 11,
    color: BrandColors.gray600,
    marginVertical: 3,
    lineHeight: 15,
  },
  addonItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  addonSelectNote: {
    fontSize: 10,
    color: BrandColors.gray400,
    fontStyle: 'italic',
  },
});
