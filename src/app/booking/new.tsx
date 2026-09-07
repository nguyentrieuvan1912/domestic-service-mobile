import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { Header } from '@/components/common/Header';
import { HorizontalStepper } from '@/components/common/StepIndicator';
import { Badge, formatVND } from '@/components/common/Badge';
import { RatingStars } from '@/components/common/RatingStars';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import {
  getServiceById,
  getPackagesByServiceId,
  getAddOnsByServiceId,
  getAddressesByCustomerId,
  getAvailableStaffs,
} from '@/data';
import { mockPromotions } from '@/data/promotions';
import { BookingMode } from '@/types/booking';
import { PaymentMethod } from '@/types/payment';

// Steps: 1. Địa chỉ & Hình thức -> 2. Gói & Add-on -> 3. Ngày & Giờ (08:00 - 20:00) -> 4. Xác nhận & Thanh toán
const STEPS = ['Địa chỉ & Chế độ', 'Gói & Phụ trợ', 'Ngày & Giờ', 'Xác nhận'];

const WEEK_DAYS = [
  { dayName: 'Hôm nay', dateStr: '10/06', fullDate: '2024-06-10' },
  { dayName: 'T3', dateStr: '11/06', fullDate: '2024-06-11' },
  { dayName: 'T4', dateStr: '12/06', fullDate: '2024-06-12' },
  { dayName: 'T5', dateStr: '13/06', fullDate: '2024-06-13' },
  { dayName: 'T6', dateStr: '14/06', fullDate: '2024-06-14' },
  { dayName: 'T7', dateStr: '15/06', fullDate: '2024-06-15' },
  { dayName: 'CN', dateStr: '16/06', fullDate: '2024-06-16' },
];

export default function NewBookingScreen() {
  const router = useRouter();
  const { currentCustomer } = useAuth();
  const params = useLocalSearchParams<{ serviceId?: string; packageId?: string; mode?: BookingMode }>();

  // Only 3 core services per Section 5: srv-001 (Ca lẻ), srv-002 (Định kỳ), srv-003 (Tổng vệ sinh)
  const service =
    getServiceById(params.serviceId || 'srv-001') || getServiceById('srv-001')!;
  const packages = getPackagesByServiceId(service.id);
  const addOns = getAddOnsByServiceId(service.id);
  const addresses = getAddressesByCustomerId(currentCustomer?.id || 'cust-001');

  // Mode A only allowed for 'srv-001' (Dọn vệ sinh theo ca lẻ) per Section 6
  const isModeAAllowed = service.id === 'srv-001';

  const [currentStep, setCurrentStep] = useState(0);

  // Step 0: Address & Mode
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses[0]?.id || 'addr-001'
  );
  const [bookingMode, setBookingMode] = useState<BookingMode>(
    params.mode === 'MODE_B'
      ? 'MODE_B'
      : params.mode === 'MODE_A' && isModeAAllowed
      ? 'MODE_A'
      : isModeAAllowed
      ? 'MODE_A'
      : 'MODE_B'
  );
  const [selectedStaffId, setSelectedStaffId] = useState('staff-001');
  const [requiredStaffCount, setRequiredStaffCount] = useState<number>(1);

  // Step 1: Package & Add-ons
  const [selectedPackageId, setSelectedPackageId] = useState(
    params.packageId || packages[0]?.id || ''
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  // Step 2: Date & Time (on the SAME screen per Section 11)
  const [selectedDayIndex, setSelectedDayIndex] = useState(1);
  const [timeSelectionType, setTimeSelectionType] = useState<'SUGGESTED' | 'CUSTOM'>('SUGGESTED');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('08:30');

  // Step 3: Payment & Promotion
  const [selectedPromoCode, setSelectedPromoCode] = useState<string>('SUMMER20');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VNPAY');

  // Lookup selections
  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses[0];
  const selectedPackage =
    packages.find((p) => p.id === selectedPackageId) || packages[0];
  const selectedStaff =
    getAvailableStaffs().find((s) => s.id === selectedStaffId) ||
    getAvailableStaffs()[0];

  // Duration & Pricing Calculations
  const packageHours = selectedPackage?.durationHours || 3;
  const addOnsTotalMinutes = addOns
    .filter((a) => selectedAddOnIds.includes(a.id))
    .reduce((sum, a) => sum + a.durationMinutes, 0);
  const totalDurationHours = packageHours + addOnsTotalMinutes / 60;

  const packagePrice = selectedPackage?.price || 0;
  const addOnsTotal = addOns
    .filter((a) => selectedAddOnIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  const subtotal = packagePrice + addOnsTotal;

  // Promotion calculation (Section 24: Single promotion type applied to total booking)
  const promo = mockPromotions.find(
    (p) => p.code === selectedPromoCode && p.isActive
  );
  let discountAmount = 0;
  if (promo && subtotal >= promo.minimumBookingAmount) {
    if (promo.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * promo.discountValue) / 100;
      if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
        discountAmount = promo.maxDiscountAmount;
      }
    } else {
      discountAmount = promo.discountValue;
    }
  }
  const totalAmount = Math.max(0, subtotal - discountAmount);

  // Section 10 & 11: Operating hours 08:00 - 20:00. End time cannot exceed 20:00!
  // Calculate max allowed start time (in minutes from 00:00)
  const maxEndMinute = 20 * 60; // 20:00 = 1200 mins
  const totalDurationMinutes = Math.round(totalDurationHours * 60);
  const maxStartMinute = maxEndMinute - totalDurationMinutes;

  // Generate Suggested slots
  const suggestedSlots = useMemo(() => {
    const slots = ['08:00', '09:00', '13:00', '14:00', '15:00', '16:00'];
    return slots.filter((timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      const startMin = h * 60 + m;
      return startMin <= maxStartMinute;
    });
  }, [maxStartMinute]);

  // Generate 10-minute interval slots (Section 11: 08:00, 08:10, 08:20...)
  const customSlots = useMemo(() => {
    const slots: string[] = [];
    const startMin = 8 * 60; // 08:00
    for (let min = startMin; min <= maxStartMinute; min += 10) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      slots.push(`${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`);
    }
    return slots;
  }, [maxStartMinute]);

  // Calculate projected end time
  const calculateEndTime = (startTimeStr: string) => {
    const [h, m] = startTimeStr.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + totalDurationMinutes;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;
    return `${endH < 10 ? '0' : ''}${endH}:${endM < 10 ? '0' : ''}${endM}`;
  };

  const currentEndTime = calculateEndTime(selectedTimeSlot);

  // Filter staff for Mode A by district (Section 6 & 13)
  const suitableStaffs = useMemo(() => {
    const allStaff = getAvailableStaffs();
    if (!selectedAddress?.district) return allStaff.slice(0, 4);
    const matched = allStaff.filter((s) =>
      s.operatingDistricts.some((d) =>
        d.toLowerCase().includes(selectedAddress.district.toLowerCase())
      )
    );
    return matched.length > 0 ? matched : allStaff.slice(0, 4);
  }, [selectedAddress]);

  const toggleAddOn = (addonId: string) => {
    if (selectedAddOnIds.includes(addonId)) {
      setSelectedAddOnIds(selectedAddOnIds.filter((id) => id !== addonId));
    } else {
      setSelectedAddOnIds([...selectedAddOnIds, addonId]);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete booking!
      if (bookingMode === 'MODE_A') {
        Alert.alert(
          'Tạo yêu cầu dịch vụ thành công!',
          `Đơn hàng đã được gửi tới nhân viên ${selectedStaff?.fullName}. Nhân viên sẽ xác nhận trong ít phút. Nếu nhân viên từ chối, bạn có thể chọn nhân viên khác.`,
          [
            {
              text: 'Theo dõi đơn',
              onPress: () => router.replace('/booking/bk-023'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Đăng đơn dịch vụ thành công!',
          'Đơn đang được treo trên hệ thống. Nhân viên phù hợp trong khu vực sẽ nhận đơn. Đơn sẽ tự động hủy và hoàn tiền 100% nếu trước 1 giờ thực hiện chưa có nhân viên nhận.',
          [
            {
              text: 'Xem chi tiết',
              onPress: () => router.replace('/booking/bk-023'),
            },
          ]
        );
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title={`Đặt dịch vụ - ${STEPS[currentStep]}`}
        onBack={handleBack}
      />

      {/* Stepper Indicator */}
      <HorizontalStepper steps={STEPS} currentStep={currentStep} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* ================= STEP 0: ĐỊA CHỈ & HÌNH THỨC (MODE A / MODE B) ================= */}
        {currentStep === 0 && (
          <View>
            <Text style={styles.stepHeading}>1. Chọn địa chỉ thực hiện</Text>
            <Text style={styles.stepSubtitle}>
              Khách hàng phải chọn địa chỉ trước để hệ thống đề xuất nhân viên theo khu vực
            </Text>

            <View style={styles.addressList}>
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <Pressable
                    key={addr.id}
                    style={[
                      styles.addressCard,
                      isSelected && styles.addressCardSelected,
                    ]}
                    onPress={() => setSelectedAddressId(addr.id)}>
                    <View style={styles.addressRadio}>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleActive,
                        ]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.addressTitleRow}>
                        <Text style={styles.addressTitle}>{addr.title}</Text>
                        <Badge
                          label={addr.district}
                          variant="info"
                          size="sm"
                          style={{ marginLeft: 6 }}
                        />
                        {addr.isDefault && (
                          <Badge label="Mặc định" variant="neutral" size="sm" />
                        )}
                      </View>
                      <Text style={styles.addressDetail}>{addr.fullAddress}</Text>
                      {addr.note ? (
                        <Text style={styles.addressNote}>Ghi chú: {addr.note}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Mode Selection Tabs (Section 6 & 7) */}
            <Text style={[styles.stepHeading, { marginTop: Spacing.four }]}>
              2. Chế độ đặt dịch vụ
            </Text>

            <View style={styles.modeTabs}>
              <Pressable
                style={[
                  styles.modeTab,
                  bookingMode === 'MODE_A' && styles.modeTabActive,
                  !isModeAAllowed && styles.modeTabDisabled,
                ]}
                onPress={() => {
                  if (isModeAAllowed) {
                    setBookingMode('MODE_A');
                  } else {
                    Alert.alert(
                      'Thông báo nghiệp vụ',
                      'Chế độ Mode A (Chọn nhân viên) chỉ áp dụng cho dịch vụ "Dọn vệ sinh theo ca lẻ". Các dịch vụ khác sử dụng Mode B.'
                    );
                  }
                }}>
                <Text
                  style={[
                    styles.modeTabText,
                    bookingMode === 'MODE_A' && styles.modeTabTextActive,
                    !isModeAAllowed && styles.modeTabTextDisabled,
                  ]}>
                  Mode A: Chọn nhân viên
                </Text>
                {!isModeAAllowed && (
                  <Text style={styles.modeAOnlyNotice}>Chỉ áp dụng ca lẻ</Text>
                )}
              </Pressable>

              <Pressable
                style={[
                  styles.modeTab,
                  bookingMode === 'MODE_B' && styles.modeTabActive,
                ]}
                onPress={() => setBookingMode('MODE_B')}>
                <Text
                  style={[
                    styles.modeTabText,
                    bookingMode === 'MODE_B' && styles.modeTabTextActive,
                  ]}>
                  Mode B: Hệ thống treo đơn
                </Text>
              </Pressable>
            </View>

            {/* Mode A: Staff proposals (Section 6) */}
            {bookingMode === 'MODE_A' && (
              <View style={styles.modeSection}>
                <View style={styles.infoAlert}>
                  <IconSymbol name="shield" size={16} color={BrandColors.primary} />
                  <Text style={styles.infoAlertText}>
                    Hệ thống đề xuất nhân viên theo khu vực {selectedAddress?.district || 'hoạt động'}. Thông tin liên hệ cá nhân (SĐT/Email) được ẩn để bảo mật giao dịch.
                  </Text>
                </View>

                <View style={styles.staffSelectionList}>
                  {suitableStaffs.map((staff) => {
                    const isSelected = selectedStaffId === staff.id;
                    const birthYear = parseInt(staff.dateOfBirth?.split('-')[0] || '1995', 10);
                    const age = new Date().getFullYear() - birthYear;

                    return (
                      <Pressable
                        key={staff.id}
                        style={[
                          styles.staffCard,
                          isSelected && styles.staffCardSelected,
                        ]}
                        onPress={() => setSelectedStaffId(staff.id)}>
                        <Image source={{ uri: staff.avatar }} style={styles.staffAvatar} />
                        <View style={styles.staffInfo}>
                          <View style={styles.staffNameRow}>
                            <Text style={styles.staffName}>{staff.fullName}</Text>
                            <Badge label={`${age} tuổi`} variant="neutral" size="sm" />
                          </View>
                          <Text style={styles.staffMeta}>
                            Đối tác tự do • {staff.experienceYears} năm KN • {staff.completionRate}% hoàn thành
                          </Text>
                          <RatingStars
                            rating={staff.rating}
                            reviewCount={staff.reviewCount}
                            size={11}
                          />
                          <Text style={styles.staffDistricts}>
                            Khu vực: {staff.operatingDistricts.slice(0, 3).join(', ')}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.staffSelectBtn,
                            isSelected && styles.staffSelectBtnActive,
                          ]}>
                          <Text
                            style={[
                              styles.staffSelectText,
                              isSelected && styles.staffSelectTextActive,
                            ]}>
                            {isSelected ? 'Đã chọn' : 'Chọn'}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Mode B: Open market matching (Section 7) */}
            {bookingMode === 'MODE_B' && (
              <View style={styles.modeSection}>
                <View style={styles.modeBInfoBox}>
                  <Text style={{ fontSize: 28, marginBottom: 4 }}>⚡</Text>
                  <Text style={styles.modeBTitle}>Đơn treo tự do cho nhân viên nhận</Text>
                  <Text style={styles.modeBDesc}>
                    Đơn hàng sẽ được hiển thị cho các nhân viên có khu vực hoạt động tại {selectedAddress?.district || 'khu vực của bạn'}. Nhân viên nào gửi yêu cầu nhận đơn trước sẽ được nhận (first-come first-served).
                  </Text>
                </View>

                {/* Staff count selection */}
                <Text style={[styles.stepHeading, { marginTop: Spacing.three }]}>
                  Số lượng nhân viên cần:
                </Text>
                <View style={styles.staffCountRow}>
                  {[1, 2].map((count) => (
                    <Pressable
                      key={count}
                      style={[
                        styles.staffCountPill,
                        requiredStaffCount === count && styles.staffCountPillActive,
                      ]}
                      onPress={() => setRequiredStaffCount(count)}>
                      <Text
                        style={[
                          styles.staffCountText,
                          requiredStaffCount === count && styles.staffCountTextActive,
                        ]}>
                        {count} nhân viên {count === 2 ? '(Nhà lớn / Vệ sinh nhanh)' : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ================= STEP 1: CHỌN GÓI & ADD-ON ================= */}
        {currentStep === 1 && (
          <View>
            <Text style={styles.stepHeading}>Chọn gói dịch vụ</Text>
            <Text style={styles.stepSubtitle}>
              {service.name} • Giới hạn diện tích cố định theo đặc tả (Section 8)
            </Text>

            <View style={styles.packageList}>
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <Pressable
                    key={pkg.id}
                    style={[
                      styles.pkgCard,
                      isSelected && styles.pkgCardSelected,
                    ]}
                    onPress={() => setSelectedPackageId(pkg.id)}>
                    <View style={styles.pkgHeader}>
                      <View style={styles.pkgRadioRow}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleActive,
                          ]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.pkgName}>{pkg.name}</Text>
                      </View>
                      <Text style={styles.pkgPrice}>{formatVND(pkg.price)}</Text>
                    </View>
                    <Text style={styles.pkgDesc}>{pkg.description}</Text>
                    <View style={styles.pkgLimitsRow}>
                      <Badge
                        label={`⏱️ ${pkg.durationHours} giờ`}
                        variant="info"
                        size="sm"
                      />
                      <Badge
                        label={`📐 ${pkg.maxArea}`}
                        variant="primary"
                        size="sm"
                      />
                      <Badge
                        label={pkg.recommendedFor}
                        variant="neutral"
                        size="sm"
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Add-on selection (Section 9) */}
            {addOns.length > 0 && (
              <View style={styles.addonSection}>
                <Text style={styles.stepHeading}>Dịch vụ bổ sung (Add-on)</Text>
                <Text style={styles.stepSubtitle}>
                  Công việc bổ sung kèm dịch vụ chính • Tăng thêm chi phí & thời gian
                </Text>

                <View style={styles.addonList}>
                  {addOns.map((addon) => {
                    const isChecked = selectedAddOnIds.includes(addon.id);
                    return (
                      <Pressable
                        key={addon.id}
                        style={[
                          styles.addonCard,
                          isChecked && styles.addonCardChecked,
                        ]}
                        onPress={() => toggleAddOn(addon.id)}>
                        <View
                          style={[
                            styles.checkbox,
                            isChecked && styles.checkboxChecked,
                          ]}>
                          {isChecked && <Text style={styles.checkText}>✓</Text>}
                        </View>
                        <Image source={{ uri: addon.image }} style={styles.addonThumb} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.addonTitle}>{addon.name}</Text>
                          <Text style={styles.addonDesc}>{addon.description}</Text>
                          <Text style={styles.addonMeta}>
                            +{addon.durationMinutes} phút • Dự kiến chuẩn hóa
                          </Text>
                        </View>
                        <Text style={styles.addonPrice}>+{formatVND(addon.price)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ================= STEP 2: NGÀY & GIỜ (CÙNG 1 MÀN HÌNH) ================= */}
        {currentStep === 2 && (
          <View>
            {/* Advance Booking Policy Notice (Section 10) */}
            <View style={styles.policyBanner}>
              <IconSymbol name="clock" size={16} color={BrandColors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.policyTitle}>Quy định thời gian đặt (08:00 – 20:00)</Text>
                <Text style={styles.policyDesc}>
                  {bookingMode === 'MODE_A'
                    ? 'Mode A: Đặt trước tối thiểu 1 giờ nếu chọn lịch rảnh của nhân viên, hoặc tối thiểu 2 giờ nếu chọn giờ tùy chỉnh.'
                    : 'Mode B: Đặt trước tối thiểu 2 giờ. Nếu trước giờ làm 1 giờ chưa có nhân viên nhận, đơn sẽ tự hủy và hoàn 100% tiền.'}
                </Text>
              </View>
            </View>

            {/* Date Selection */}
            <Text style={styles.stepHeading}>Chọn ngày dịch vụ</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScroll}>
              {WEEK_DAYS.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                return (
                  <Pressable
                    key={day.fullDate}
                    style={[
                      styles.dayCard,
                      isSelected && styles.dayCardSelected,
                    ]}
                    onPress={() => setSelectedDayIndex(idx)}>
                    <Text
                      style={[
                        styles.dayNameText,
                        isSelected && styles.dayTextSelected,
                      ]}>
                      {day.dayName}
                    </Text>
                    <Text
                      style={[
                        styles.dateNumberText,
                        isSelected && styles.dayTextSelected,
                      ]}>
                      {day.dateStr}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Time Slot Selection Type Tabs */}
            <Text style={[styles.stepHeading, { marginTop: Spacing.four }]}>
              Chọn thời gian bắt đầu
            </Text>
            <View style={styles.timeModeTabs}>
              <Pressable
                style={[
                  styles.timeModeTab,
                  timeSelectionType === 'SUGGESTED' && styles.timeModeTabActive,
                ]}
                onPress={() => setTimeSelectionType('SUGGESTED')}>
                <Text
                  style={[
                    styles.timeModeTabText,
                    timeSelectionType === 'SUGGESTED' && styles.timeModeTabTextActive,
                  ]}>
                  Khung giờ gợi ý
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.timeModeTab,
                  timeSelectionType === 'CUSTOM' && styles.timeModeTabActive,
                ]}
                onPress={() => setTimeSelectionType('CUSTOM')}>
                <Text
                  style={[
                    styles.timeModeTabText,
                    timeSelectionType === 'CUSTOM' && styles.timeModeTabTextActive,
                  ]}>
                  Khung giờ tùy chỉnh (mốc 10p)
                </Text>
              </Pressable>
            </View>

            {/* Time Slots Grid */}
            <View style={styles.timeSlotsGrid}>
              {(timeSelectionType === 'SUGGESTED' ? suggestedSlots : customSlots).map((time) => {
                const isSelected = selectedTimeSlot === time;
                return (
                  <Pressable
                    key={time}
                    style={[
                      styles.timeSlotPill,
                      isSelected && styles.timeSlotPillSelected,
                    ]}
                    onPress={() => setSelectedTimeSlot(time)}>
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextSelected,
                      ]}>
                      {time}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Calculated Completion Card (Section 11: End time <= 20:00) */}
            <View style={styles.durationSummaryCard}>
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Thời lượng dịch vụ:</Text>
                <Text style={styles.durationValue}>
                  {totalDurationHours} giờ ({packageHours}h gói chính + {addOnsTotalMinutes}p phụ trợ)
                </Text>
              </View>
              <View style={styles.durationRow}>
                <Text style={styles.durationLabel}>Khung giờ thực tế:</Text>
                <Text style={[styles.durationValue, { color: BrandColors.primary, fontWeight: '800' }]}>
                  {selectedTimeSlot} ➔ {currentEndTime}
                </Text>
              </View>
              <Text style={styles.durationNote}>
                ✓ Đảm bảo kết thúc trước 20:00 theo quy định vận hành của hệ thống
              </Text>
            </View>
          </View>
        )}

        {/* ================= STEP 3: XÁC NHẬN & THANH TOÁN ================= */}
        {currentStep === 3 && (
          <View>
            <Text style={styles.stepHeading}>Xác nhận thông tin đặt đơn</Text>

            {/* Order Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Dịch vụ</Text>
                <Text style={styles.summaryValue}>
                  {service.name} — {selectedPackage?.name}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Phạm vi / Diện tích</Text>
                <Text style={styles.summaryValue}>{selectedPackage?.maxArea}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Thời gian</Text>
                <Text style={styles.summaryValue}>
                  {selectedTimeSlot} – {currentEndTime} ({WEEK_DAYS[selectedDayIndex].dayName} {WEEK_DAYS[selectedDayIndex].dateStr})
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Địa chỉ thực hiện</Text>
                <Text style={styles.summaryValue}>{selectedAddress?.fullAddress}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Hình thức điều phối</Text>
                <Text style={styles.summaryValue}>
                  {bookingMode === 'MODE_A'
                    ? `Chỉ định nhân viên: ${selectedStaff?.fullName}`
                    : `Hệ thống treo đơn (${requiredStaffCount} nhân viên)`}
                </Text>
              </View>

              {selectedAddOnIds.length > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Add-on kèm theo</Text>
                  <Text style={styles.summaryValue}>
                    {selectedAddOnIds.length} hạng mục (+{formatVND(addOnsTotal)})
                  </Text>
                </View>
              )}
            </View>

            {/* Promotion Section (Section 24) */}
            <Text style={[styles.stepHeading, { marginTop: Spacing.three }]}>
              Mã khuyến mãi áp dụng
            </Text>
            <View style={styles.voucherBox}>
              <IconSymbol name="receipt" size={18} color={BrandColors.primary} />
              <Text style={styles.voucherCode}>{selectedPromoCode}</Text>
              <Badge label="Giảm vào tổng đơn" variant="success" size="sm" />
            </View>

            {/* Financial Breakdown (Section 29: Giá đóng băng tại thời điểm tạo) */}
            <View style={styles.financialCard}>
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Gói dịch vụ chính:</Text>
                <Text style={styles.finValue}>{formatVND(packagePrice)}</Text>
              </View>
              {addOnsTotal > 0 && (
                <View style={styles.finRow}>
                  <Text style={styles.finLabel}>Dịch vụ phụ trợ (Add-on):</Text>
                  <Text style={styles.finValue}>+{formatVND(addOnsTotal)}</Text>
                </View>
              )}
              {discountAmount > 0 && (
                <View style={styles.finRow}>
                  <Text style={[styles.finLabel, { color: BrandColors.primary }]}>
                    Khuyến mãi ({selectedPromoCode}):
                  </Text>
                  <Text style={[styles.finValue, { color: BrandColors.primary }]}>
                    -{formatVND(discountAmount)}
                  </Text>
                </View>
              )}
              <View style={[styles.finRow, styles.finTotalRow]}>
                <Text style={styles.finTotalLabel}>Tổng thanh toán:</Text>
                <Text style={styles.finTotalValue}>{formatVND(totalAmount)}</Text>
              </View>
            </View>

            {/* Payment Method Selection (Section 18) */}
            <Text style={[styles.stepHeading, { marginTop: Spacing.three }]}>
              Phương thức thanh toán
            </Text>
            <View style={styles.paymentMethods}>
              <Pressable
                style={[
                  styles.paymentOption,
                  paymentMethod === 'VNPAY' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('VNPAY')}>
                <View
                  style={[
                    styles.radioCircle,
                    paymentMethod === 'VNPAY' && styles.radioCircleActive,
                  ]}>
                  {paymentMethod === 'VNPAY' && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentOptionTitle}>Thanh toán online (VNPAY / QR Ngân hàng)</Text>
                  <Text style={styles.paymentOptionSubtitle}>
                    Thanh toán ngay • Hoàn lại 100% nếu hệ thống hủy đơn
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[
                  styles.paymentOption,
                  paymentMethod === 'CASH' && styles.paymentOptionActive,
                ]}
                onPress={() => setPaymentMethod('CASH')}>
                <View
                  style={[
                    styles.radioCircle,
                    paymentMethod === 'CASH' && styles.radioCircleActive,
                  ]}>
                  {paymentMethod === 'CASH' && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentOptionTitle}>Thanh toán tiền mặt cho nhân viên</Text>
                  <Text style={styles.paymentOptionSubtitle}>
                    Khách trả 100% cho nhân viên sau khi hoàn thành đơn
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.footerBar}>
        <View>
          <Text style={styles.footerLabel}>Tổng thanh toán</Text>
          <Text style={styles.footerTotal}>{formatVND(totalAmount)}</Text>
        </View>

        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentStep === 3 ? 'Xác nhận đặt đơn' : 'Tiếp tục'}
          </Text>
          <IconSymbol name="chevronRight" size={16} color={BrandColors.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.white,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 110,
  },
  stepHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginBottom: Spacing.three,
    lineHeight: 16,
  },

  // Address List
  addressList: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BrandColors.gray200,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    backgroundColor: BrandColors.white,
  },
  addressCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  addressRadio: {
    marginRight: Spacing.two,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  addressDetail: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 16,
  },
  addressNote: {
    fontSize: 11,
    color: BrandColors.gray400,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Mode Selection
  modeTabs: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: BrandColors.gray200,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
  },
  modeTabActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  modeTabDisabled: {
    backgroundColor: BrandColors.gray100,
    borderColor: BrandColors.gray200,
    opacity: 0.6,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  modeTabTextActive: {
    color: BrandColors.primary,
  },
  modeTabTextDisabled: {
    color: BrandColors.gray400,
  },
  modeAOnlyNotice: {
    fontSize: 10,
    color: BrandColors.danger,
    marginTop: 2,
  },
  modeSection: {
    marginTop: Spacing.one,
  },
  infoAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: Spacing.two,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.three,
  },
  infoAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 15,
  },

  // Staff Cards
  staffSelectionList: {
    gap: Spacing.two,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.white,
  },
  staffCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  staffAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: Spacing.two,
  },
  staffInfo: {
    flex: 1,
  },
  staffNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  staffMeta: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 1,
  },
  staffDistricts: {
    fontSize: 11,
    color: BrandColors.primary,
    marginTop: 2,
  },
  staffSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.gray100,
  },
  staffSelectBtnActive: {
    backgroundColor: BrandColors.primary,
  },
  staffSelectText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  staffSelectTextActive: {
    color: BrandColors.white,
  },

  // Mode B
  modeBContainer: {
    paddingTop: Spacing.two,
  },
  modeBInfoBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  modeBTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.primaryDark,
    marginBottom: 4,
  },
  modeBDesc: {
    fontSize: 12,
    color: BrandColors.gray600,
    textAlign: 'center',
    lineHeight: 16,
  },
  staffCountRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  staffCountPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: BrandColors.gray200,
    alignItems: 'center',
    backgroundColor: BrandColors.white,
  },
  staffCountPillActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  staffCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  staffCountTextActive: {
    color: BrandColors.primary,
  },

  // Package List (Step 1)
  packageList: {
    gap: Spacing.two,
  },
  pkgCard: {
    borderWidth: 1.5,
    borderColor: BrandColors.gray200,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    backgroundColor: BrandColors.white,
  },
  pkgCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  pkgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pkgRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pkgName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  pkgPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  pkgDesc: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginVertical: 4,
  },
  pkgLimitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  // Add-on Section
  addonSection: {
    marginTop: Spacing.four,
  },
  addonList: {
    gap: Spacing.two,
  },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    backgroundColor: BrandColors.white,
    gap: Spacing.two,
  },
  addonCardChecked: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  addonThumb: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.gray100,
  },
  addonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  addonDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 1,
  },
  addonMeta: {
    fontSize: 10,
    color: BrandColors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  addonPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BrandColors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  checkText: {
    color: BrandColors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Date & Time (Step 2)
  policyBanner: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: '#FEF3C7',
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.three,
    alignItems: 'flex-start',
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  policyDesc: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15,
  },
  daysScroll: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  dayCard: {
    width: 68,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: BrandColors.gray200,
    alignItems: 'center',
    backgroundColor: BrandColors.white,
  },
  dayCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primary,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray600,
    marginBottom: 2,
  },
  dateNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  dayTextSelected: {
    color: BrandColors.white,
  },

  timeModeTabs: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  timeModeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.gray100,
    alignItems: 'center',
  },
  timeModeTabActive: {
    backgroundColor: BrandColors.primary,
  },
  timeModeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray600,
  },
  timeModeTabTextActive: {
    color: BrandColors.white,
  },

  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    backgroundColor: BrandColors.white,
  },
  timeSlotPillSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primary,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray800,
  },
  timeSlotTextSelected: {
    color: BrandColors.white,
  },

  durationSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    marginTop: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  durationLabel: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  durationValue: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  durationNote: {
    fontSize: 11,
    color: BrandColors.success,
    marginTop: 4,
    fontWeight: '600',
  },

  // Summary & Financial (Step 3)
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    gap: Spacing.two,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray900,
    maxWidth: '65%',
    textAlign: 'right',
  },

  voucherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.white,
    padding: Spacing.two,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.primary,
    borderStyle: 'dashed',
    marginBottom: Spacing.two,
  },
  voucherCode: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },

  financialCard: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    gap: 6,
    marginBottom: Spacing.two,
  },
  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  finLabel: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  finValue: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  finTotalRow: {
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
    paddingTop: 8,
    marginTop: 4,
  },
  finTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  finTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.primary,
  },

  // Payment Methods
  paymentMethods: {
    gap: Spacing.two,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: BrandColors.gray200,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.white,
    gap: Spacing.two,
  },
  paymentOptionActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  paymentOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  paymentOptionSubtitle: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 1,
  },

  // Radios
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: BrandColors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: BrandColors.primary,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: BrandColors.primary,
  },

  // Bottom Floating Bar
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: BrandColors.white,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
  },
  footerLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  nextBtnText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
