import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { Badge, formatVND } from '@/components/common/Badge';
import { RatingStars } from '@/components/common/RatingStars';
import { useAuth } from '@/context/AuthContext';
import {
  mockServices,
  getServiceById,
  getPackagesByServiceId,
  getAddOnsByServiceId,
  getAddressesByCustomerId,
  getAvailableStaffs,
  getStaffById,
  getRelatedServices,
} from '@/data';
import { mockPromotions } from '@/data/promotions';
import { BookingMode } from '@/types/booking';
import { PaymentMethod } from '@/types/payment';

// Calendar days data
const CALENDAR_DAYS = [
  { dayName: 'T2', dateNum: 28, isCurrentMonth: false },
  { dayName: 'T3', dateNum: 29, isCurrentMonth: false },
  { dayName: 'T4', dateNum: 30, isCurrentMonth: false },
  { dayName: 'T5', dateNum: 1, isCurrentMonth: true },
  { dayName: 'T6', dateNum: 2, isCurrentMonth: true },
  { dayName: 'T7', dateNum: 3, isCurrentMonth: true },
  { dayName: 'CN', dateNum: 4, isCurrentMonth: true },
  { dayName: 'T2', dateNum: 5, isCurrentMonth: true },
  { dayName: 'T3', dateNum: 6, isCurrentMonth: true },
  { dayName: 'T4', dateNum: 7, isCurrentMonth: true, isSelected: true },
  { dayName: 'T5', dateNum: 8, isCurrentMonth: true },
  { dayName: 'T6', dateNum: 9, isCurrentMonth: true },
  { dayName: 'T7', dateNum: 10, isCurrentMonth: true },
  { dayName: 'CN', dateNum: 11, isCurrentMonth: true },
];

const TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

// Cleaning duration options with area annotations (2h, 3h, 4h)
const CLEANING_DURATIONS = [
  {
    hours: 2,
    title: 'Gói 2 tiếng',
    area: 'Dưới 55m²',
    unitType: 'Căn hộ Studio, 1 Phòng ngủ',
    desc: 'Dọn phòng khách, 1 phòng ngủ & 1 phòng vệ sinh',
  },
  {
    hours: 3,
    title: 'Gói 3 tiếng',
    area: '55m² – 85m²',
    unitType: 'Căn hộ 2 Phòng ngủ',
    desc: 'Dọn kĩ phòng khách, bếp, 2 phòng ngủ & 2 WC',
    isPopular: true,
  },
  {
    hours: 4,
    title: 'Gói 4 tiếng',
    area: 'Trên 85m²',
    unitType: 'Căn hộ 3 PN hoặc Nhà tầng',
    desc: 'Vệ sinh sâu toàn bộ phòng ngủ, phòng khách, bếp & nhiều WC',
  },
];

// Helper to calculate staff age from dob YYYY-MM-DD
const getStaffAge = (dob: string) => {
  if (!dob) return 35;
  const birthYear = parseInt(dob.split('-')[0], 10);
  return isNaN(birthYear) ? 35 : 2026 - birthYear;
};

export default function NewBookingScreen() {
  const router = useRouter();
  const { currentCustomer } = useAuth();
  const params = useLocalSearchParams<{
    serviceId?: string;
    packageId?: string;
    mode?: BookingMode;
    staffId?: string;
    addressId?: string;
    rebook?: string;
  }>();

  // Mode selection: null = FLOW 0, otherwise MODE_A or MODE_B
  const [selectedMode, setSelectedMode] = useState<BookingMode | null>(
    params.mode === 'MODE_A'
      ? 'MODE_A'
      : params.mode === 'MODE_B'
      ? 'MODE_B'
      : params.staffId
      ? 'MODE_A'
      : null
  );

  // Step index
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Smooth step transition animation
  const stepFadeAnim = useRef(new Animated.Value(1)).current;
  const stepTranslateY = useRef(new Animated.Value(0)).current;

  const triggerStepTransition = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(stepFadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(stepTranslateY, {
        toValue: 8,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStep);
      Animated.parallel([
        Animated.timing(stepFadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // ================= Form States =================
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    params.serviceId || 'srv-001'
  );
  const service = getServiceById(selectedServiceId) || mockServices[0];
  const packages = getPackagesByServiceId(service.id);
  const serviceAddOns = getAddOnsByServiceId(service.id);
  const addOns = serviceAddOns.length > 0 ? serviceAddOns : getAddOnsByServiceId('srv-001');
  const addresses = getAddressesByCustomerId(currentCustomer?.id || 'cust-001');
  const availableStaffs = getAvailableStaffs();

  // Address
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    params.addressId || addresses[0]?.id || 'addr-001'
  );
  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  // Date & Time (chosen right after address in Mode A)
  const [selectedDateStr, setSelectedDateStr] = useState<string>('Thứ Tư, 07/10/2026');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:00');

  // Duration in hours (2h, 3h, 4h)
  const [selectedDurationHours, setSelectedDurationHours] = useState<number>(3);

  // Staff Filters (Star rating & Age filters)
  const [starFilter, setStarFilter] = useState<'ALL' | '4.8' | '4.9' | '5.0'>('ALL');
  const [ageFilter, setAgeFilter] = useState<'ALL' | 'UNDER_30' | '31_45' | 'OVER_45'>('ALL');

  // Selected Staff
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    params.staffId || 'staff-001'
  );
  const selectedStaff =
    availableStaffs.find((s) => s.id === selectedStaffId) || availableStaffs[0];

  // Service Package & Staff count (Mode B)
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    params.packageId || packages[0]?.id || 'pkg-001'
  );
  const selectedPackage =
    packages.find((p) => p.id === selectedPackageId) || packages[0];
  const [requiredStaffCount, setRequiredStaffCount] = useState<number>(1);

  // Add-ons (default empty so customer can pick or not pick)
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  // AI Related Services (Cross-sell)
  const relatedServices = getRelatedServices(service.id);
  const [selectedRelatedServiceIds, setSelectedRelatedServiceIds] = useState<string[]>([]);

  const toggleRelatedService = (relServiceId: string) => {
    if (selectedRelatedServiceIds.includes(relServiceId)) {
      setSelectedRelatedServiceIds(selectedRelatedServiceIds.filter((id) => id !== relServiceId));
    } else {
      setSelectedRelatedServiceIds([...selectedRelatedServiceIds, relServiceId]);
    }
  };

  // Promotion / Voucher (integrated directly in Order Summary)
  const [promoInput, setPromoInput] = useState<string>('');
  const [selectedPromoCode, setSelectedPromoCode] = useState<string>('FLASH50K');

  // Customer Notes
  const [customerNote, setCustomerNote] = useState<string>('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('VNPAY');

  // Copy order code feedback
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Animated effects: Radar, clock, bounce
  const radarWave1 = useRef(new Animated.Value(0.2)).current;
  const radarWave2 = useRef(new Animated.Value(0.2)).current;
  const radarWave3 = useRef(new Animated.Value(0.2)).current;
  const radarOpacity1 = useRef(new Animated.Value(1)).current;
  const radarOpacity2 = useRef(new Animated.Value(1)).current;
  const radarOpacity3 = useRef(new Animated.Value(1)).current;
  const clockSpinAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.3)).current;

  const [radarStatusText, setRadarStatusText] = useState('Đang quét nhân viên trong bán kính 3km...');
  // Mode B stays in MATCHING until a staff member accepts it in the staff flow.
  // The local flag only exposes that state in this prototype preview.
  const [isModeBStaffAccepted, setIsModeBStaffAccepted] = useState(false);
  const modeBMatchedStaff = getStaffById('staff-001');

  useEffect(() => {
    // Mode A Step 7: Waiting for staff response
    if (selectedMode === 'MODE_A' && currentStep === 7) {
      Animated.loop(
        Animated.timing(clockSpinAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      const timer = setTimeout(() => {
        triggerStepTransition(8);
      }, 3800);
      return () => clearTimeout(timer);
    }

    // Mode B Step 7: Searching radar
    if (selectedMode === 'MODE_B' && currentStep === 7 && !isModeBStaffAccepted) {
      const loop1 = Animated.loop(
        Animated.parallel([
          Animated.timing(radarWave1, {
            toValue: 2.4,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(radarOpacity1, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      const loop2 = Animated.loop(
        Animated.sequence([
          Animated.delay(500),
          Animated.parallel([
            Animated.timing(radarWave2, {
              toValue: 2.4,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(radarOpacity2, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      const loop3 = Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.parallel([
            Animated.timing(radarWave3, {
              toValue: 2.4,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(radarOpacity3, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      loop1.start();
      loop2.start();
      loop3.start();

      const statusTimer1 = setTimeout(() => {
        setRadarStatusText('Tìm thấy 3 nhân viên xuất sắc 4.9★ gần bạn...');
      }, 1500);

      const statusTimer2 = setTimeout(() => {
        setRadarStatusText('Đơn đã được gửi tới các nhân viên phù hợp và đang chờ nhận.');
      }, 2800);

      return () => {
        loop1.stop();
        loop2.stop();
        loop3.stop();
        clearTimeout(statusTimer1);
        clearTimeout(statusTimer2);
      };
    }

    // Success Screen Bounce (Step 8 in both modes)
    if (
      (selectedMode === 'MODE_A' && currentStep === 8) ||
      (selectedMode === 'MODE_B' && currentStep === 8)
    ) {
      Animated.spring(successScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedMode, currentStep]);

  // Pricing Calculations
  const basePrice =
    selectedMode === 'MODE_A'
      ? 120000 * selectedDurationHours
      : (selectedPackage?.price || 200000) + (requiredStaffCount - 1) * 150000;

  const addOnsTotal = addOns
    .filter((a) => selectedAddOnIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const relatedServicesTotal = relatedServices
    .filter((r) => selectedRelatedServiceIds.includes(r.service.id))
    .reduce((sum, r) => sum + r.discountedPrice, 0);

  const subtotal = basePrice + addOnsTotal + relatedServicesTotal;

  const promo = mockPromotions.find(
    (p) => p.code === selectedPromoCode && p.isActive
  );
  let discountAmount = 0;
  if (promo) {
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

  // Toggle add-on selection
  const toggleAddOn = (addonId: string) => {
    if (selectedAddOnIds.includes(addonId)) {
      setSelectedAddOnIds(selectedAddOnIds.filter((id) => id !== addonId));
    } else {
      setSelectedAddOnIds([...selectedAddOnIds, addonId]);
    }
  };

  // Back navigation
  const handleBack = () => {
    if (selectedMode === null) {
      router.back();
      return;
    }
    if (currentStep > 0) {
      triggerStepTransition(currentStep - 1);
    } else {
      if (!params.mode) {
        setSelectedMode(null);
      } else {
        router.back();
      }
    }
  };

  // Copy booking code
  const handleCopyCode = (code: string) => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    Alert.alert('Đã sao chép', `Mã đơn hàng ${code} đã được sao chép.`);
  };

  // Filter staff list according to user preferences
  const filteredStaffs = availableStaffs.filter((s) => {
    // Star filter
    if (starFilter === '4.8' && s.rating < 4.8) return false;
    if (starFilter === '4.9' && s.rating < 4.9) return false;
    if (starFilter === '5.0' && s.rating < 5.0) return false;

    // Age filter
    const age = getStaffAge(s.dateOfBirth);
    if (ageFilter === 'UNDER_30' && age > 30) return false;
    if (ageFilter === '31_45' && (age < 31 || age > 45)) return false;
    if (ageFilter === 'OVER_45' && age <= 45) return false;

    return true;
  });

  // Header with visual step progress bar
  const renderHeader = (title: string, stepCurrent: number, stepTotal: number) => {
    const progressPercent = `${Math.round(((stepCurrent + 1) / stepTotal) * 100)}%`;
    return (
      <View style={styles.headerWrapper}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={handleBack} hitSlop={8}>
            <IconSymbol name="arrowBack" size={20} color={BrandColors.gray900} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.headerStepBadge}>
              Bước {stepCurrent + 1} / {stepTotal}
            </Text>
          </View>
          <Pressable
            style={styles.bellButton}
            onPress={() => Alert.alert('Hỗ trợ', 'Tổng đài chăm sóc khách hàng 24/7: 1900 6868')}
            hitSlop={8}>
            <IconSymbol name="bell" size={18} color={BrandColors.gray700} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>

        {/* Dynamic Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: progressPercent as any }]} />
        </View>
      </View>
    );
  };

  // Wrapper for animated step transitions
  const renderAnimatedStep = (content: React.ReactNode) => (
    <Animated.View
      style={{
        flex: 1,
        opacity: stepFadeAnim,
        transform: [{ translateY: stepTranslateY }],
      }}>
      {content}
    </Animated.View>
  );

  // Common Voucher Selector inside Order Summary
  const renderVoucherSectionInSummary = () => (
    <View style={styles.summaryVoucherSection}>
      <View style={styles.summaryVoucherHeader}>
        <IconSymbol name="ticket" size={18} color={BrandColors.primary} />
        <Text style={styles.summaryVoucherHeading}>Ưu đãi / Mã giảm giá</Text>
      </View>

      {/* Input Code Row */}
      <View style={styles.promoInputRow}>
        <TextInput
          style={styles.promoInput}
          placeholder="Nhập mã ưu đãi..."
          placeholderTextColor="#9CA3AF"
          value={promoInput}
          onChangeText={setPromoInput}
          autoCapitalize="characters"
        />
        <Pressable
          style={styles.promoApplyBtn}
          onPress={() => {
            if (promoInput.trim()) {
              const code = promoInput.trim().toUpperCase();
              setSelectedPromoCode(code);
              Alert.alert('Thành công', `Đã áp dụng mã ${code}`);
            }
          }}>
          <Text style={styles.promoApplyText}>Áp dụng</Text>
        </Pressable>
      </View>

      {/* Quick Select Voucher Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.voucherHorizontalList}>
        {mockPromotions.map((p) => {
          const isSelected = selectedPromoCode === p.code;
          return (
            <Pressable
              key={p.id}
              style={[styles.miniVoucherCard, isSelected && styles.miniVoucherCardSelected]}
              onPress={() => {
                if (isSelected) {
                  setSelectedPromoCode('');
                } else {
                  setSelectedPromoCode(p.code);
                }
              }}>
              <View style={styles.miniVoucherTopRow}>
                <Text style={[styles.miniVoucherCode, isSelected && styles.miniVoucherCodeSelected]}>
                  {p.code}
                </Text>
                <View style={[styles.miniVoucherBadge, isSelected && styles.miniVoucherBadgeSelected]}>
                  <Text style={[styles.miniVoucherBadgeText, isSelected && styles.miniVoucherBadgeTextSelected]}>
                    {p.discountType === 'PERCENTAGE'
                      ? `-${p.discountValue}%`
                      : `-${formatVND(p.discountValue)}`}
                  </Text>
                </View>
              </View>
              <Text style={styles.miniVoucherDesc} numberOfLines={1}>
                {p.description}
              </Text>
              <Text style={[styles.miniVoucherAction, isSelected && styles.miniVoucherActionSelected]}>
                {isSelected ? 'Đang áp dụng ✓' : 'Chọn mã'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  // =========================================================================
  // FLOW 0: Screen Chọn cách bắt đầu (Mode A vs Mode B)
  // =========================================================================
  if (selectedMode === null) {
    return (
      <LinearGradient
        colors={BrandColors.softBgGradient}
        locations={BrandColors.softBgGradientLocations}
        style={styles.gradientContainer}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Top Header */}
          <View style={styles.entryHeader}>
            <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
              <IconSymbol name="arrowBack" size={20} color={BrandColors.gray900} />
            </Pressable>
            <View style={styles.brandBadge}>
              <View style={styles.brandDot} />
              <Text style={styles.brandTitle}>CleanMaster</Text>
            </View>
            <Pressable
              style={styles.giftBadgeBtn}
              onPress={() => Alert.alert('Ưu đãi bạn mới', 'Mã FLASH50K: Giảm ngay 50.000đ cho đơn đầu tiên!')}>
              <IconSymbol name="gift" size={16} color={BrandColors.primary} />
              <Text style={styles.giftBadgeText}>Ưu đãi</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.entryContent} showsVerticalScrollIndicator={false}>
            {/* Banner with Linear Gradient */}
            <View style={styles.entryBanner}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
                }}
                style={styles.entryBannerImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.75)']}
                style={styles.entryBannerOverlay}>
                <View style={styles.bannerTagPill}>
                  <Text style={styles.bannerTagText}>⚡ ĐẶT NHANH 60 GIÂY</Text>
                </View>
                <Text style={styles.entryBannerHeading}>Nhà Sạch Mát Lành</Text>
                <Text style={styles.entryBannerSubtitle}>
                  Dịch vụ dọn dẹp chuyên nghiệp, minh bạch & tận tâm
                </Text>
              </LinearGradient>
            </View>

            {/* Prompt Section */}
            <Text style={styles.entryQuestion}>Bạn muốn bắt đầu như thế nào?</Text>

            {/* Option 1: Chọn nhân viên (MODE A) */}
            <Pressable
              style={[styles.modeCard, styles.modeCardActive]}
              onPress={() => {
                setSelectedMode('MODE_A');
                setCurrentStep(0);
              }}>
              <LinearGradient
                colors={BrandColors.primaryGradient}
                style={styles.modeIconCircleTeal}>
                <IconSymbol name="user" size={24} color={BrandColors.white} />
              </LinearGradient>
              <View style={styles.modeTextContainer}>
                <View style={styles.modeTitleRow}>
                  <Text style={styles.modeCardTitle}>Chọn nhân viên</Text>
                  <View style={styles.modeBadgeModeA}>
                    <Text style={styles.modeBadgeTextA}>Mode A</Text>
                  </View>
                </View>
                <Text style={styles.modeCardSubtitle}>
                  Chọn vị trí và ngày giờ, hệ thống lọc người giúp việc phù hợp gần bạn.
                </Text>
              </View>
              <IconSymbol name="chevronRight" size={18} color={BrandColors.primary} />
            </Pressable>

            {/* Option 2: Chọn dịch vụ (MODE B) */}
            <Pressable
              style={styles.modeCard}
              onPress={() => {
                setSelectedMode('MODE_B');
                setCurrentStep(0);
              }}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.modeIconCircleTeal}>
                <IconSymbol name="sparkles" size={24} color={BrandColors.white} />
              </LinearGradient>
              <View style={styles.modeTextContainer}>
                <View style={styles.modeTitleRow}>
                  <Text style={styles.modeCardTitle}>Chọn dịch vụ</Text>
                  <View style={styles.modeBadgeModeB}>
                    <Text style={styles.modeBadgeTextB}>Mode B</Text>
                  </View>
                </View>
                <Text style={styles.modeCardSubtitle}>
                  Chọn gói công việc cần làm, hệ thống tự động ghép nhân viên phù hợp.
                </Text>
              </View>
              <IconSymbol name="chevronRight" size={18} color={BrandColors.gray400} />
            </Pressable>

            {/* Trust points card */}
            <View style={styles.trustBox}>
              <View style={styles.trustItem}>
                <IconSymbol name="shield" size={18} color={BrandColors.primary} />
                <Text style={styles.trustText}>Xác minh CCCD 100%</Text>
              </View>
              <View style={styles.trustItem}>
                <IconSymbol name="clock" size={18} color={BrandColors.primary} />
                <Text style={styles.trustText}>Đúng giờ cam kết</Text>
              </View>
              <View style={styles.trustItem}>
                <IconSymbol name="star" size={18} color={BrandColors.accent} />
                <Text style={styles.trustText}>Đánh giá 4.9★</Text>
              </View>
              <View style={styles.trustItem}>
                <IconSymbol name="award" size={18} color={BrandColors.primary} />
                <Text style={styles.trustText}>Bảo hành hoàn tiền</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // =========================================================================
  // ===================== LUỒNG MODE A: CHỌN NHÂN VIÊN =======================
  // =========================================================================
  if (selectedMode === 'MODE_A') {
    // ---------------- STEP 0: CHỌN ĐỊA CHỈ (Mode A) ----------------
    if (currentStep === 0) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Chọn địa chỉ làm việc', 0, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionHeaderTitle}>Địa chỉ đã lưu</Text>

                  {addresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId;
                    const isHome = addr.title.toLowerCase().includes('nhà');
                    const isOffice =
                      addr.title.toLowerCase().includes('việc') || addr.title.toLowerCase().includes('ty');
                    return (
                      <Pressable
                        key={addr.id}
                        style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                        onPress={() => setSelectedAddressId(addr.id)}>
                        <View
                          style={[styles.addressIconCircle, isSelected && styles.addressIconCircleSelected]}>
                          <IconSymbol
                            name={isHome ? 'home' : isOffice ? 'office' : 'location'}
                            size={22}
                            color={isSelected ? BrandColors.primary : BrandColors.gray600}
                          />
                        </View>
                        <View style={styles.addressInfo}>
                          <View style={styles.addressTitleRow}>
                            <Text style={styles.addressTitle}>{addr.title}</Text>
                            {addr.isDefault && (
                              <View style={styles.defaultPill}>
                                <Text style={styles.defaultPillText}>Mặc định</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.addressDetail}>{addr.fullAddress}</Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={styles.addAddressDashedBtn}
                    onPress={() =>
                      Alert.alert(
                        'Thêm địa chỉ mới',
                        'Chức năng thêm nhanh địa chỉ mới đã sẵn sàng lưu cho các lần đặt sau.'
                      )
                    }>
                    <IconSymbol name="plus" size={16} color={BrandColors.primary} />
                    <Text style={styles.addAddressDashedText}>Thêm địa chỉ mới</Text>
                  </Pressable>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(1)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Chọn ngày & giờ)</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 1: CHỌN NGÀY & GIỜ (Mode A) ----------------
    if (currentStep === 1) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Chọn ngày & giờ', 1, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Calendar Box */}
                  <View style={styles.calendarCard}>
                    <View style={styles.calendarHeader}>
                      <View style={styles.calendarMonthWrapper}>
                        <IconSymbol name="calendar" size={18} color={BrandColors.primary} />
                        <Text style={styles.calendarMonthText}>Tháng 10, 2026</Text>
                      </View>
                      <View style={styles.calendarArrows}>
                        <Pressable style={styles.arrowBtn} hitSlop={6}>
                          <Text style={styles.arrowText}>‹</Text>
                        </Pressable>
                        <Pressable style={styles.arrowBtn} hitSlop={6}>
                          <Text style={styles.arrowText}>›</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.calendarGrid}>
                      {CALENDAR_DAYS.map((day, idx) => {
                        const isSelected = day.isSelected;
                        return (
                          <Pressable
                            key={idx}
                            style={[styles.calendarDayCell, isSelected && styles.calendarDaySelected]}
                            onPress={() => setSelectedDateStr(`Thứ Tư, 07/10/2026`)}>
                            <Text
                              style={[
                                styles.calendarDayName,
                                isSelected && styles.calendarDayTextSelected,
                              ]}>
                              {day.dayName}
                            </Text>
                            <Text
                              style={[
                                styles.calendarDayNum,
                                !day.isCurrentMonth && styles.calendarDayNumMuted,
                                isSelected && styles.calendarDayTextSelected,
                              ]}>
                              {day.dateNum}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Time Slots */}
                  <Text style={styles.sectionHeaderTitle}>Giờ bắt đầu làm việc</Text>
                  <View style={styles.timeSlotGrid}>
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = slot === selectedTimeSlot;
                      return (
                        <Pressable
                          key={slot}
                          style={[styles.timeSlotPill, isSelected && styles.timeSlotPillSelected]}
                          onPress={() => setSelectedTimeSlot(slot)}>
                          <IconSymbol
                            name="clock"
                            size={14}
                            color={isSelected ? BrandColors.white : BrandColors.gray500}
                          />
                          <Text
                            style={[
                              styles.timeSlotText,
                              isSelected && styles.timeSlotTextSelected,
                            ]}>
                            {slot}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Matching Note */}
                  <View style={styles.matchingNoticeBox}>
                    <IconSymbol name="info" size={18} color={BrandColors.primary} />
                    <Text style={styles.matchingNoticeText}>
                      Hệ thống sẽ tự động lọc danh sách người giúp việc có lịch trống lúc{' '}
                      <Text style={{ fontWeight: '700', color: BrandColors.primaryDark }}>
                        {selectedTimeSlot}
                      </Text>{' '}
                      gần khu vực{' '}
                      <Text style={{ fontWeight: '700', color: BrandColors.primaryDark }}>
                        {selectedAddress.title}
                      </Text>
                      .
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(2)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Xác nhận & Tìm nhân viên phù hợp</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 2: DANH SÁCH NHÂN VIÊN PHÙ HỢP (Mode A) ----------------
    if (currentStep === 2) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Nhân viên khả dụng', 2, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                {/* Auto Filter Banner */}
                <View style={styles.autoFilterBanner}>
                  <IconSymbol name="sparkles" size={16} color={BrandColors.primary} />
                  <Text style={styles.autoFilterText} numberOfLines={1}>
                    Đã lọc người giúp việc rảnh lúc {selectedTimeSlot} tại {selectedAddress.title}
                  </Text>
                </View>

                {/* Star & Age Filter Bar */}
                <View style={styles.filterSectionWrapper}>
                  {/* Star Rating Filters */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipScrollRow}>
                    <Text style={styles.filterCategoryLabel}>Số sao:</Text>
                    <Pressable
                      style={[styles.filterChip, starFilter === 'ALL' && styles.filterChipActive]}
                      onPress={() => setStarFilter('ALL')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          starFilter === 'ALL' && styles.filterChipTextActive,
                        ]}>
                        Tất cả sao
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, starFilter === '4.8' && styles.filterChipActive]}
                      onPress={() => setStarFilter('4.8')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          starFilter === '4.8' && styles.filterChipTextActive,
                        ]}>
                        ⭐ 4.8★+
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, starFilter === '4.9' && styles.filterChipActive]}
                      onPress={() => setStarFilter('4.9')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          starFilter === '4.9' && styles.filterChipTextActive,
                        ]}>
                        ⭐ 4.9★+
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, starFilter === '5.0' && styles.filterChipActive]}
                      onPress={() => setStarFilter('5.0')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          starFilter === '5.0' && styles.filterChipTextActive,
                        ]}>
                        ⭐ 5.0★
                      </Text>
                    </Pressable>
                  </ScrollView>

                  {/* Age Filters */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipScrollRow}>
                    <Text style={styles.filterCategoryLabel}>Độ tuổi:</Text>
                    <Pressable
                      style={[styles.filterChip, ageFilter === 'ALL' && styles.filterChipActive]}
                      onPress={() => setAgeFilter('ALL')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          ageFilter === 'ALL' && styles.filterChipTextActive,
                        ]}>
                        Tất cả tuổi
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, ageFilter === 'UNDER_30' && styles.filterChipActive]}
                      onPress={() => setAgeFilter('UNDER_30')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          ageFilter === 'UNDER_30' && styles.filterChipTextActive,
                        ]}>
                        20 – 30 tuổi
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, ageFilter === '31_45' && styles.filterChipActive]}
                      onPress={() => setAgeFilter('31_45')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          ageFilter === '31_45' && styles.filterChipTextActive,
                        ]}>
                        31 – 45 tuổi
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.filterChip, ageFilter === 'OVER_45' && styles.filterChipActive]}
                      onPress={() => setAgeFilter('OVER_45')}>
                      <Text
                        style={[
                          styles.filterChipText,
                          ageFilter === 'OVER_45' && styles.filterChipTextActive,
                        ]}>
                        Trên 45 tuổi
                      </Text>
                    </Pressable>
                  </ScrollView>
                </View>

                {/* Staff Cards */}
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {filteredStaffs.length === 0 ? (
                    <View style={styles.emptyFilterBox}>
                      <IconSymbol name="warning" size={32} color={BrandColors.gray400} />
                      <Text style={styles.emptyFilterText}>Không có nhân viên phù hợp với bộ lọc</Text>
                      <Pressable
                        style={styles.resetFilterBtn}
                        onPress={() => {
                          setStarFilter('ALL');
                          setAgeFilter('ALL');
                        }}>
                        <Text style={styles.resetFilterBtnText}>Đặt lại bộ lọc</Text>
                      </Pressable>
                    </View>
                  ) : (
                    filteredStaffs.map((staff) => {
                      const age = getStaffAge(staff.dateOfBirth);
                      const isSelected = selectedStaffId === staff.id;
                      return (
                        <Pressable
                          key={staff.id}
                          style={[styles.cleanStaffCard, isSelected && styles.cleanStaffCardSelected]}
                          onPress={() => {
                            setSelectedStaffId(staff.id);
                            triggerStepTransition(3);
                          }}>
                          {/* 1. Avatar */}
                          <View style={styles.cleanAvatarBox}>
                            <Image source={{ uri: staff.avatar }} style={styles.cleanAvatarImg} />
                            <View style={styles.cleanOnlineDot} />
                          </View>

                          {/* 2. Tên & 3. Tuổi */}
                          <View style={styles.cleanStaffInfo}>
                            <View style={styles.cleanNameRow}>
                              <Text style={styles.cleanFullName}>{staff.fullName}</Text>
                              <Text style={styles.cleanAgeText}>• {age} tuổi</Text>
                            </View>

                            {/* 4. Giờ làm */}
                            <View style={styles.cleanWorkHoursRow}>
                              <IconSymbol name="clock" size={13} color={BrandColors.primary} />
                              <Text style={styles.cleanWorkHoursText}>
                                Giờ làm: 08:00 – 17:00 (Nhận ca {selectedTimeSlot})
                              </Text>
                            </View>

                            {/* Rating snippet */}
                            <View style={styles.cleanRatingSnippet}>
                              <IconSymbol name="star" size={12} color={BrandColors.accent} />
                              <Text style={styles.cleanRatingText}>{staff.rating}★</Text>
                              <Text style={styles.cleanReviewCount}>({staff.reviewCount} đánh giá)</Text>
                            </View>
                          </View>

                          {/* 5. Giá tiền & Action to view profile */}
                          <View style={styles.cleanPriceColumn}>
                            <Text style={styles.cleanPriceNumber}>120.000đ</Text>
                            <Text style={styles.cleanPriceUnit}>/ giờ</Text>
                            <View style={styles.viewProfilePill}>
                              <Text style={styles.viewProfilePillText}>Xem kĩ hồ sơ ›</Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 3: XEM KĨ PROFILE NHÂN VIÊN (Mode A) ----------------
    if (currentStep === 3) {
      const age = getStaffAge(selectedStaff.dateOfBirth);
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Hồ sơ nhân viên', 3, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Profile Avatar & Name */}
                  <View style={styles.detailProfileHeader}>
                    <View style={styles.detailLargeAvatarWrapper}>
                      <Image source={{ uri: selectedStaff.avatar }} style={styles.detailLargeAvatar} />
                      <View style={styles.verifiedBadgeCircle}>
                        <IconSymbol name="check" size={14} color="#FFFFFF" />
                      </View>
                    </View>
                    <Text style={styles.detailFullName}>
                      {selectedStaff.fullName}{' '}
                      <Text style={styles.detailAge}>{age} tuổi</Text>
                    </Text>
                    <View style={styles.detailTagRow}>
                      <View style={styles.proBadge}>
                        <IconSymbol name="shield" size={10} color={BrandColors.primary} />
                        <Text style={styles.proBadgeText}>CCCD Đã xác minh</Text>
                      </View>
                      <Text style={styles.detailExpText}>• {selectedStaff.experienceYears} năm kinh nghiệm</Text>
                    </View>
                  </View>

                  {/* 4 Metric Cards */}
                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <IconSymbol name="star" size={16} color={BrandColors.accent} />
                      <Text style={styles.statValue}>{selectedStaff.rating}★</Text>
                      <Text style={styles.statLabel}>Đánh giá</Text>
                    </View>
                    <View style={styles.statCard}>
                      <IconSymbol name="clock" size={16} color={BrandColors.primary} />
                      <Text style={styles.statValue}>99%</Text>
                      <Text style={styles.statLabel}>Đúng giờ</Text>
                    </View>
                    <View style={styles.statCard}>
                      <IconSymbol name="award" size={16} color={BrandColors.primary} />
                      <Text style={styles.statValue}>{selectedStaff.reviewCount * 2}+</Text>
                      <Text style={styles.statLabel}>Đơn hàng</Text>
                    </View>
                    <View style={styles.statCard}>
                      <IconSymbol name="shield" size={16} color={BrandColors.primary} />
                      <Text style={styles.statValue}>100%</Text>
                      <Text style={styles.statLabel}>Xác thực</Text>
                    </View>
                  </View>

                  {/* Bio Section */}
                  <View style={styles.bioCard}>
                    <View style={styles.bioHeaderRow}>
                      <IconSymbol name="clean" size={16} color={BrandColors.primary} />
                      <Text style={styles.bioHeading}>Giới thiệu bản thân</Text>
                    </View>
                    <Text style={styles.bioContent}>
                      {selectedStaff.bio ||
                        'Tôi là người cẩn thận, chăm chỉ và luôn chu đáo hoàn thành tốt nhất công việc được giao. Có kinh nghiệm giặt giũ đồ len dạ và ủi các loại sơ mi cao cấp.'}
                    </Text>
                  </View>

                  {/* Skills Pills */}
                  <View style={styles.bioCard}>
                    <View style={styles.bioHeaderRow}>
                      <IconSymbol name="sparkles" size={16} color={BrandColors.primary} />
                      <Text style={styles.bioHeading}>Kỹ năng chuyên môn</Text>
                    </View>
                    <View style={styles.skillWrap}>
                      {['Ủi đồ cao cấp', 'Vệ sinh bếp sâu', 'Sử dụng máy hút bụi', 'Thân thiện thú cưng', 'Nấu ăn gia đình'].map(
                        (skill, i) => (
                          <View key={i} style={styles.skillPillLarge}>
                            <IconSymbol name="check" size={12} color={BrandColors.primary} />
                            <Text style={styles.skillPillLargeText}>{skill}</Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>

                  {/* Recent Customer Reviews */}
                  <View style={styles.bioCard}>
                    <View style={styles.bioHeaderRow}>
                      <IconSymbol name="chat" size={16} color={BrandColors.primary} />
                      <Text style={styles.bioHeading}>Đánh giá từ khách hàng gần đây</Text>
                    </View>
                    <View style={styles.reviewSnippet}>
                      <View style={styles.reviewAuthorRow}>
                        <Text style={styles.reviewAuthor}>Chị Hoàng Mai (Bình Thạnh)</Text>
                        <RatingStars rating={5} size={12} />
                      </View>
                      <Text style={styles.reviewSnippetText}>
                        "Chị làm rất cẩn thận, từng góc kệ bếp đều lau sạch bóng. Đến đúng giờ và thái độ vui vẻ, lịch sự."
                      </Text>
                    </View>
                  </View>

                  {/* Security Guarantee Pill */}
                  <View style={styles.securityNoticeCard}>
                    <IconSymbol name="shield" size={20} color={BrandColors.success} />
                    <Text style={styles.securityNoticeText}>
                      Nhân viên đã được xác minh CCCD, kiểm tra lý lịch tư pháp và đạt chứng chỉ vệ sinh tiêu chuẩn.
                    </Text>
                  </View>
                </ScrollView>

                {/* Continue to Add-on step */}
                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(4)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>
                        Chọn {selectedStaff.fullName} & Chọn giờ làm / Add-on
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 4: CHỌN THỜI LƯỢNG 2,3,4 TIẾNG & DỊCH VỤ BỔ TRỢ (Mode A) ----------------
    // YÊU CẦU:
    // 1. Thêm phần chọn thời gian dọn dẹp 2, 3, 4 tiếng phù hợp với từng mét vuông diện tích, chú thích đi cùng
    // 2. Thêm ô "Không chọn" để khách có thể không chọn add-on
    // 3. Dưới nút tiếp theo có hiển thị số tiền ước tính luôn cập nhật khi thêm bớt addon
    if (currentStep === 4) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Thời lượng & Dịch vụ bổ trợ', 4, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* USER REQUIREMENT 1: PHẦN CHỌN THỜI GIAN DỌN DẸP 2, 3, 4 TIẾNG VÀ DIỆN TÍCH */}
                  <Text style={styles.sectionHeaderTitle}>Thời gian dọn dẹp & Diện tích</Text>
                  <Text style={styles.stepSubtitleNote}>
                    Chọn số giờ làm việc phù hợp với diện tích căn hộ của bạn
                  </Text>

                  <View style={styles.durationCardsContainer}>
                    {CLEANING_DURATIONS.map((dur) => {
                      const isSelected = selectedDurationHours === dur.hours;
                      return (
                        <Pressable
                          key={dur.hours}
                          style={[styles.durationCard, isSelected && styles.durationCardSelected]}
                          onPress={() => setSelectedDurationHours(dur.hours)}>
                          <View style={styles.durationCardHeader}>
                            <View style={styles.durationTitleGroup}>
                              <Text
                                style={[
                                  styles.durationHoursText,
                                  isSelected && styles.durationHoursTextSelected,
                                ]}>
                                {dur.title}
                              </Text>
                              <View style={[styles.areaBadge, isSelected && styles.areaBadgeSelected]}>
                                <Text
                                  style={[
                                    styles.areaBadgeText,
                                    isSelected && styles.areaBadgeTextSelected,
                                  ]}>
                                  {dur.area}
                                </Text>
                              </View>
                            </View>
                            {dur.isPopular && (
                              <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>Phổ biến nhất</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.durationUnitType}>{dur.unitType}</Text>
                          <Text style={styles.durationDesc}>{dur.desc}</Text>

                          <View style={styles.durationCardFooter}>
                            <Text
                              style={[
                                styles.durationPriceText,
                                isSelected && styles.durationPriceTextSelected,
                              ]}>
                              {formatVND(120000 * dur.hours)}
                            </Text>
                            <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                              {isSelected && <View style={styles.radioInnerDot} />}
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* USER REQUIREMENT 2: DỊCH VỤ BỔ TRỢ (ADD-ON) */}
                  <Text style={[styles.sectionHeaderTitle, { marginTop: Spacing.four }]}>
                    Dịch vụ bổ sung (Add-on)
                  </Text>
                  <Text style={styles.stepSubtitleNote}>
                    Chọn thêm dịch vụ vệ sinh chuyên sâu đi kèm (Tùy chọn)
                  </Text>

                  {addOns.map((addon) => {
                    const isSelected = selectedAddOnIds.includes(addon.id);
                    return (
                      <Pressable
                        key={addon.id}
                        style={[styles.addonCard, isSelected && styles.addonCardSelected]}
                        onPress={() => toggleAddOn(addon.id)}>
                        <Image source={{ uri: addon.image }} style={styles.addonImage} />
                        <View style={styles.addonInfo}>
                          <Text style={styles.addonName}>{addon.name}</Text>
                          <Text style={styles.addonDuration}>+ {addon.durationMinutes} phút làm việc</Text>
                          <Text style={styles.addonPriceBadge}>+{formatVND(addon.price)}</Text>
                        </View>
                        <View style={[styles.checkboxCircle, isSelected && styles.checkboxCircleSelected]}>
                          {isSelected && <Text style={styles.checkmarkIcon}>✓</Text>}
                        </View>
                      </Pressable>
                    );
                  })}

                  {/* USER REQUIREMENT 3: Ô "KHÔNG CHỌN" ĐỂ KHÁCH CÓ THỂ KHÔNG CHỌN ADD-ON */}
                  <Pressable
                    style={[
                      styles.noAddonCard,
                      selectedAddOnIds.length === 0 && styles.noAddonCardSelected,
                    ]}
                    onPress={() => setSelectedAddOnIds([])}>
                    <View
                      style={[
                        styles.noAddonIconCircle,
                        selectedAddOnIds.length === 0 && styles.noAddonIconCircleSelected,
                      ]}>
                      <IconSymbol
                        name={selectedAddOnIds.length === 0 ? 'check' : 'clean'}
                        size={18}
                        color={selectedAddOnIds.length === 0 ? BrandColors.primary : BrandColors.gray500}
                      />
                    </View>
                    <View style={styles.noAddonInfo}>
                      <Text style={styles.noAddonTitle}>Không chọn dịch vụ bổ sung</Text>
                      <Text style={styles.noAddonSubtitle}>
                        Chỉ dọn dẹp nhà tiêu chuẩn trong {selectedDurationHours} giờ đã chọn
                      </Text>
                    </View>
                    <View style={[styles.radioCircle, selectedAddOnIds.length === 0 && styles.radioCircleSelected]}>
                      {selectedAddOnIds.length === 0 && <View style={styles.radioInnerDot} />}
                    </View>
                  </Pressable>

                  {/* AI GỢI Ý KẾT HỢP DỊCH VỤ LIÊN QUAN */}
                  {relatedServices.length > 0 && (
                    <View style={{ marginTop: Spacing.four, marginBottom: Spacing.two }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={{ fontSize: 16 }}>💡</Text>
                        <Text style={styles.sectionHeaderTitle}>Gợi ý kết hợp thông minh (AI Combo)</Text>
                      </View>
                      <Text style={styles.stepSubtitleNote}>
                        Khách đặt {service.name} thường chọn thêm các dịch vụ bổ trợ để tiết kiệm chi phí
                      </Text>

                      {relatedServices.map((rel) => {
                        const isRelSelected = selectedRelatedServiceIds.includes(rel.service.id);
                        return (
                          <Pressable
                            key={rel.service.id}
                            style={[
                              styles.addonCard,
                              { borderColor: isRelSelected ? BrandColors.primary : '#E2E8F0' },
                              isRelSelected && { backgroundColor: '#F0FDF4' },
                            ]}
                            onPress={() => toggleRelatedService(rel.service.id)}>
                            <Image source={{ uri: rel.service.image }} style={styles.addonImage} />
                            <View style={styles.addonInfo}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.addonName}>{rel.service.name}</Text>
                                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#D97706' }}>AI Gợi ý</Text>
                                </View>
                              </View>
                              <Text numberOfLines={2} style={{ fontSize: 11, color: BrandColors.gray600, marginVertical: 2 }}>
                                {rel.reason}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.addonPriceBadge}>+{formatVND(rel.discountedPrice)}</Text>
                                <Text style={{ fontSize: 10, color: BrandColors.gray400, textDecorationLine: 'line-through' }}>
                                  {formatVND(rel.service.basePrice)}
                                </Text>
                                <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700' }}>
                                  {rel.discountOffer}
                                </Text>
                              </View>
                            </View>
                            <View style={[styles.checkboxCircle, isRelSelected && styles.checkboxCircleSelected]}>
                              {isRelSelected && <Text style={styles.checkmarkIcon}>✓</Text>}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </ScrollView>

                {/* USER REQUIREMENT 4: DƯỚI NÚT TIẾP THEO CÓ HIỂN THỊ SỐ TIỀN ƯỚC TÍNH LUÔN CẬP NHẬT KHI THÊM BỚT ADDON */}
                <View style={styles.bottomBarWithEstimate}>
                  <View style={styles.estimateCol}>
                    <Text style={styles.estimateLabel}>Tạm tính ước tính:</Text>
                    <Text style={styles.estimateAmountVal}>{formatVND(subtotal)}</Text>
                    <Text style={styles.estimateNoteText}>
                      {selectedDurationHours}h dọn ({formatVND(basePrice)})
                      {addOnsTotal > 0 ? ` + ${selectedAddOnIds.length} Add-on` : ' • Không Add-on'}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.ctaEstimateBtn}
                    onPress={() => triggerStepTransition(5)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Tóm tắt) ›</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 5: TÓM TẮT ĐƠN HÀNG & MÃ GIẢM GIÁ (Mode A) ----------------
    if (currentStep === 5) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Tóm tắt đơn hàng', 5, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Selected Staff Card */}
                  <View style={styles.summaryStaffCard}>
                    <Image source={{ uri: selectedStaff.avatar }} style={styles.summaryStaffAvatar} />
                    <View style={styles.summaryStaffMeta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.summaryStaffName}>{selectedStaff.fullName}</Text>
                        <Badge label="Mode A" variant="primary" size="sm" />
                      </View>
                      <Text style={styles.summaryStaffSub}>
                        {getStaffAge(selectedStaff.dateOfBirth)} tuổi • 4.9★ • 120.000đ/giờ
                      </Text>
                    </View>
                  </View>

                  {/* Schedule & Address Info */}
                  <View style={styles.summaryDetailCard}>
                    <View style={styles.summaryInfoRow}>
                      <IconSymbol name="calendar" size={18} color={BrandColors.primary} />
                      <Text style={styles.summaryInfoText}>
                        {selectedDateStr} lúc {selectedTimeSlot} ({selectedDurationHours} giờ dọn dẹp)
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryInfoRow}>
                      <IconSymbol name="location" size={18} color={BrandColors.primary} />
                      <Text style={styles.summaryInfoText}>{selectedAddress.fullAddress}</Text>
                    </View>
                  </View>

                  {/* Integrated Voucher Section */}
                  {renderVoucherSectionInSummary()}

                  {/* Price Breakdown with realtime discount */}
                  <View style={styles.priceBreakdownCard}>
                    <Text style={styles.priceBreakdownTitle}>Chi tiết thanh toán</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceKey}>Dọn dẹp ca lẻ ({selectedDurationHours} giờ)</Text>
                      <Text style={styles.priceVal}>{formatVND(basePrice)}</Text>
                    </View>
                    {addOnsTotal > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKey}>Dịch vụ bổ trợ ({selectedAddOnIds.length})</Text>
                        <Text style={styles.priceVal}>+{formatVND(addOnsTotal)}</Text>
                      </View>
                    )}
                    {relatedServicesTotal > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKey}>Dịch vụ kết hợp thông minh ({selectedRelatedServiceIds.length})</Text>
                        <Text style={styles.priceVal}>+{formatVND(relatedServicesTotal)}</Text>
                      </View>
                    )}
                    {discountAmount > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKeyDiscount}>
                          Ưu đãi giảm giá ({selectedPromoCode})
                        </Text>
                        <Text style={styles.priceValDiscount}>-{formatVND(discountAmount)}</Text>
                      </View>
                    )}
                    <View style={styles.priceRow}>
                      <Text style={styles.priceKey}>VAT & Phí dịch vụ</Text>
                      <Text style={styles.priceVal}>Đã bao gồm</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceTotalRow}>
                      <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                      <Text style={styles.totalAmount}>{formatVND(totalAmount)}</Text>
                    </View>
                  </View>

                  {/* Customer Notes Field */}
                  <View style={styles.noteInputCard}>
                    <Text style={styles.noteInputLabel}>Ghi chú cho nhân viên (Tùy chọn)</Text>
                    <TextInput
                      style={styles.noteTextInput}
                      placeholder="Ví dụ: Căn hộ tầng 8, nhà có mèo, vui lòng gọi trước 10 phút..."
                      placeholderTextColor="#9CA3AF"
                      value={customerNote}
                      onChangeText={setCustomerNote}
                      multiline
                    />
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(6)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiến hành thanh toán</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 6: PHƯƠNG THỨC THANH TOÁN (Mode A) ----------------
    if (currentStep === 6) {
      const paymentMethods: { id: PaymentMethod; name: string; desc: string; icon: string }[] = [
        {
          id: 'VNPAY',
          name: 'VNPay (Quét mã QR)',
          desc: 'Thanh toán trực tiếp qua ứng dụng ngân hàng',
          icon: 'creditCard',
        },
        {
          id: 'MOMO',
          name: 'Ví MoMo',
          desc: 'Liên kết ví điện tử MoMo siêu tốc',
          icon: 'wallet',
        },
        {
          id: 'ZALOPAY',
          name: 'Ví ZaloPay',
          desc: 'Thanh toán an toàn qua ZaloPay',
          icon: 'wallet',
        },
        {
          id: 'CASH',
          name: 'Tiền mặt',
          desc: 'Thanh toán cho nhân viên sau khi hoàn thành',
          icon: 'cash',
        },
      ];

      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Phương thức thanh toán', 6, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionHeaderTitle}>Chọn cổng thanh toán</Text>

                  {paymentMethods.map((pm) => {
                    const isSelected = pm.id === paymentMethod;
                    return (
                      <Pressable
                        key={pm.id}
                        style={[
                          styles.paymentMethodCard,
                          isSelected && styles.paymentMethodCardSelected,
                        ]}
                        onPress={() => setPaymentMethod(pm.id)}>
                        <View
                          style={[
                            styles.paymentIconBox,
                            isSelected && styles.paymentIconBoxSelected,
                          ]}>
                          <IconSymbol
                            name={pm.icon}
                            size={22}
                            color={isSelected ? BrandColors.primary : BrandColors.gray700}
                          />
                        </View>
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentName}>{pm.name}</Text>
                          <Text style={styles.paymentDesc}>{pm.desc}</Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </Pressable>
                    );
                  })}

                  {/* Guarantee banner */}
                  <View style={styles.guaranteeBox}>
                    <IconSymbol name="shield" size={24} color={BrandColors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guaranteeTitle}>Cam kết hoàn tiền 100%</Text>
                      <Text style={styles.guaranteeDesc}>
                        Nếu bạn không hài lòng về chất lượng phục vụ hoặc nhân viên không có mặt đúng giờ, bạn sẽ được hoàn tiền đầy đủ ngay lập tức.
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(7)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Xác nhận & Đặt ca ({formatVND(totalAmount)})</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 7: CHỜ XÁC NHẬN TỪ NHÂN VIÊN (Mode A) ----------------
    if (currentStep === 7) {
      const spin = clockSpinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });

      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.waitingContainer}>
              {/* Rotating radar aura with staff avatar */}
              <View style={styles.clockAnimBox}>
                <Animated.View style={[styles.clockCircleBorder, { transform: [{ rotate: spin }] }]} />
                <Image source={{ uri: selectedStaff.avatar }} style={styles.waitingAvatar} />
              </View>

              <Text style={styles.waitingTitle}>Đang chờ {selectedStaff.fullName} xác nhận...</Text>
              <Text style={styles.waitingSubtitle}>
                Yêu cầu đã được gửi trực tiếp đến nhân viên. Thời gian phản hồi thông thường dưới 3 phút.
              </Text>

              <View style={styles.countdownBadge}>
                <IconSymbol name="clock" size={16} color={BrandColors.primary} />
                <Text style={styles.countdownText}>Thời gian chờ tối đa: 02:45</Text>
              </View>

              <View style={styles.policyNoticeBox}>
                <IconSymbol name="info" size={18} color={BrandColors.primary} />
                <Text style={styles.policyNoticeText}>
                  Nếu nhân viên bận không thể nhận ca, hệ thống sẽ tự động thông báo và gợi ý đổi sang nhân viên tương đương mà không phát sinh chi phí.
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 8: ĐẶT LỊCH THÀNH CÔNG (Mode A) ----------------
    if (currentStep === 8) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
              {/* Animated Success Checkmark */}
              <Animated.View style={[styles.successCheckCircle, { transform: [{ scale: successScaleAnim }] }]}>
                <IconSymbol name="check" size={48} color="#FFFFFF" />
              </Animated.View>

              <Text style={styles.successHeading}>ĐẶT LỊCH THÀNH CÔNG!</Text>
              <Text style={styles.successSubheading}>
                {selectedStaff.fullName} đã tiếp nhận đơn và sẽ có mặt đúng giờ hẹn.
              </Text>

              {/* Order Code Box */}
              <View style={styles.orderCodeBox}>
                <View>
                  <Text style={styles.orderCodeLabel}>MÃ ĐƠN HÀNG</Text>
                  <Text style={styles.orderCodeVal}>#HC-202610-A982</Text>
                </View>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => handleCopyCode('#HC-202610-A982')}>
                  <IconSymbol name="copy" size={16} color={BrandColors.primary} />
                  <Text style={styles.copyBtnText}>{isCopied ? 'Đã chép ✓' : 'Sao chép'}</Text>
                </Pressable>
              </View>

              {/* Summary Card */}
              <View style={styles.successDetailCard}>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Nhân viên</Text>
                  <Text style={styles.successValBold}>{selectedStaff.fullName}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Thời gian</Text>
                  <Text style={styles.successVal}>
                    {selectedDateStr} • {selectedTimeSlot} ({selectedDurationHours} giờ)
                  </Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Địa chỉ</Text>
                  <Text style={styles.successVal}>{selectedAddress.fullAddress}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Tổng thanh toán</Text>
                  <Text style={styles.successTotal}>{formatVND(totalAmount)}</Text>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.successBtnColumn}>
                <Pressable
                  style={styles.ctaPrimaryBtn}
                  onPress={() => router.push('/booking/bk-001')}>
                  <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                    <Text style={styles.ctaPrimaryText}>Theo dõi ca làm việc</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.ctaSecondaryBtn}
                  onPress={() => router.replace('/(tabs)')}>
                  <Text style={styles.ctaSecondaryText}>Về trang chủ</Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      );
    }
  }

  // =========================================================================
  // ===================== LUỒNG MODE B: CHỌN DỊCH VỤ =========================
  // =========================================================================
  if (selectedMode === 'MODE_B') {
    // ---------------- STEP 0: CHỌN DỊCH VỤ (Mode B) ----------------
    if (currentStep === 0) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Chọn dịch vụ', 0, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.stepSubtitleNote}>Chọn loại hình dịch vụ phù hợp với nhu cầu của bạn</Text>

                  {mockServices.map((srv) => {
                    const isSelected = srv.id === selectedServiceId;
                    return (
                      <Pressable
                        key={srv.id}
                        style={[styles.serviceCardWithImg, isSelected && styles.serviceCardSelected]}
                        onPress={() => setSelectedServiceId(srv.id)}>
                        <Image source={{ uri: srv.image }} style={styles.serviceImgThumb} />
                        <View style={styles.serviceBody}>
                          <View style={styles.serviceTitleRow}>
                            <Text style={styles.serviceTitleText}>{srv.name}</Text>
                            <Badge label={srv.highlightBadges[0] || 'Phổ biến'} variant="primary" size="sm" />
                          </View>
                          <Text style={styles.serviceDescText} numberOfLines={2}>
                            {srv.description}
                          </Text>
                          <View style={styles.serviceFooterRow}>
                            <Text style={styles.servicePriceVal}>{formatVND(srv.basePrice)}</Text>
                            <Text style={styles.serviceUnitText}>/ {srv.unit}</Text>
                          </View>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(1)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 1: GÓI DIỆN TÍCH & SỐ LƯỢNG NHÂN VIÊN (Mode B) ----------------
    if (currentStep === 1) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Gói diện tích & Số lượng', 1, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionHeaderTitle}>Chọn gói diện tích</Text>
                  {packages.map((pkg) => {
                    const isSelected = pkg.id === selectedPackageId;
                    return (
                      <Pressable
                        key={pkg.id}
                        style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                        onPress={() => setSelectedPackageId(pkg.id)}>
                        <View style={styles.packageCardLeft}>
                          <Text style={styles.packageName}>{pkg.name}</Text>
                          <Text style={styles.packageDuration}>
                            Thời lượng: {pkg.durationHours} giờ ({pkg.maxArea || 'Tiêu chuẩn'})
                          </Text>
                        </View>
                        <View style={styles.packageCardRight}>
                          <Text style={styles.packagePrice}>{formatVND(pkg.price)}</Text>
                          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                            {isSelected && <View style={styles.radioInnerDot} />}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}

                  {/* Staff count stepper */}
                  <Text style={[styles.sectionHeaderTitle, { marginTop: Spacing.four }]}>Số lượng nhân viên</Text>
                  <View style={styles.stepperCard}>
                    <View style={styles.stepperHeaderBadge}>
                      <IconSymbol name="users" size={18} color={BrandColors.primary} />
                      <Text style={styles.stepperLabel}>Số người thực hiện</Text>
                    </View>
                    <View style={styles.stepperControlRow}>
                      <Pressable
                        style={[styles.stepperBtn, requiredStaffCount <= 1 && styles.stepperBtnDisabled]}
                        onPress={() => setRequiredStaffCount(Math.max(1, requiredStaffCount - 1))}
                        hitSlop={8}>
                        <IconSymbol name="minus" size={18} color={BrandColors.primary} />
                      </Pressable>
                      <Text style={styles.stepperValue}>{requiredStaffCount} người</Text>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => setRequiredStaffCount(requiredStaffCount + 1)}
                        hitSlop={8}>
                        <IconSymbol name="plus" size={18} color={BrandColors.primary} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationText}>
                      💡 1 nhân viên phù hợp tối ưu với căn hộ dưới 55m². Thêm nhân viên giúp hoàn thành ca nhanh gấp đôi.
                    </Text>
                  </View>
                </ScrollView>

                {/* USER CONSTRAINT: Step 2 is Add-on, right after package & staff count */}
                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(2)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Chọn Add-on)</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 2: DỊCH VỤ BỔ SUNG (ADD-ON) (Mode B) ----------------
    // Đã đẩy lên ngay sau diện tích theo yêu cầu user
    // Thêm ô "Không chọn" và thanh bottom bar ước tính giá cập nhật real-time
    if (currentStep === 2) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Dịch vụ bổ sung (Add-on)', 2, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.stepSubtitleNote}>
                    Thêm các dịch vụ vệ sinh chuyên sâu đi kèm gói chính
                  </Text>

                  {addOns.map((addon) => {
                    const isSelected = selectedAddOnIds.includes(addon.id);
                    return (
                      <Pressable
                        key={addon.id}
                        style={[styles.addonCard, isSelected && styles.addonCardSelected]}
                        onPress={() => toggleAddOn(addon.id)}>
                        <Image source={{ uri: addon.image }} style={styles.addonImage} />
                        <View style={styles.addonInfo}>
                          <Text style={styles.addonName}>{addon.name}</Text>
                          <Text style={styles.addonDuration}>+ {addon.durationMinutes} phút làm việc</Text>
                          <Text style={styles.addonPriceBadge}>+{formatVND(addon.price)}</Text>
                        </View>
                        <View style={[styles.checkboxCircle, isSelected && styles.checkboxCircleSelected]}>
                          {isSelected && <Text style={styles.checkmarkIcon}>✓</Text>}
                        </View>
                      </Pressable>
                    );
                  })}

                  {/* USER REQUIREMENT: Ô "Không chọn" để khách có thể không chọn add-on */}
                  <Pressable
                    style={[
                      styles.noAddonCard,
                      selectedAddOnIds.length === 0 && styles.noAddonCardSelected,
                    ]}
                    onPress={() => setSelectedAddOnIds([])}>
                    <View
                      style={[
                        styles.noAddonIconCircle,
                        selectedAddOnIds.length === 0 && styles.noAddonIconCircleSelected,
                      ]}>
                      <IconSymbol
                        name={selectedAddOnIds.length === 0 ? 'check' : 'clean'}
                        size={18}
                        color={selectedAddOnIds.length === 0 ? BrandColors.primary : BrandColors.gray500}
                      />
                    </View>
                    <View style={styles.noAddonInfo}>
                      <Text style={styles.noAddonTitle}>Không chọn dịch vụ bổ sung</Text>
                      <Text style={styles.noAddonSubtitle}>
                        Chỉ sử dụng gói {selectedPackage.name}, không thêm dịch vụ phát sinh
                      </Text>
                    </View>
                    <View style={[styles.radioCircle, selectedAddOnIds.length === 0 && styles.radioCircleSelected]}>
                      {selectedAddOnIds.length === 0 && <View style={styles.radioInnerDot} />}
                    </View>
                  </Pressable>

                  {/* AI GỢI Ý KẾT HỢP DỊCH VỤ LIÊN QUAN */}
                  {relatedServices.length > 0 && (
                    <View style={{ marginTop: Spacing.four, marginBottom: Spacing.two }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={{ fontSize: 16 }}>💡</Text>
                        <Text style={styles.sectionHeaderTitle}>Gợi ý kết hợp thông minh (AI Combo)</Text>
                      </View>
                      <Text style={styles.stepSubtitleNote}>
                        Gợi ý dịch vụ cùng chuyên môn kỹ thuật giúp tiết kiệm đến 20% chi phí
                      </Text>

                      {relatedServices.map((rel) => {
                        const isRelSelected = selectedRelatedServiceIds.includes(rel.service.id);
                        return (
                          <Pressable
                            key={rel.service.id}
                            style={[
                              styles.addonCard,
                              { borderColor: isRelSelected ? BrandColors.primary : '#E2E8F0' },
                              isRelSelected && { backgroundColor: '#F0FDF4' },
                            ]}
                            onPress={() => toggleRelatedService(rel.service.id)}>
                            <Image source={{ uri: rel.service.image }} style={styles.addonImage} />
                            <View style={styles.addonInfo}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.addonName}>{rel.service.name}</Text>
                                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#D97706' }}>AI Gợi ý</Text>
                                </View>
                              </View>
                              <Text numberOfLines={2} style={{ fontSize: 11, color: BrandColors.gray600, marginVertical: 2 }}>
                                {rel.reason}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.addonPriceBadge}>+{formatVND(rel.discountedPrice)}</Text>
                                <Text style={{ fontSize: 10, color: BrandColors.gray400, textDecorationLine: 'line-through' }}>
                                  {formatVND(rel.service.basePrice)}
                                </Text>
                                <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700' }}>
                                  {rel.discountOffer}
                                </Text>
                              </View>
                            </View>
                            <View style={[styles.checkboxCircle, isRelSelected && styles.checkboxCircleSelected]}>
                              {isRelSelected && <Text style={styles.checkmarkIcon}>✓</Text>}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </ScrollView>

                {/* USER REQUIREMENT: Hiển thị số tiền ước tính cập nhật real-time */}
                <View style={styles.bottomBarWithEstimate}>
                  <View style={styles.estimateCol}>
                    <Text style={styles.estimateLabel}>Tạm tính ước tính:</Text>
                    <Text style={styles.estimateAmountVal}>{formatVND(subtotal)}</Text>
                    <Text style={styles.estimateNoteText}>
                      Gói {selectedPackage.name}
                      {addOnsTotal > 0 ? ` + ${selectedAddOnIds.length} Add-on` : ' • Không Add-on'}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.ctaEstimateBtn}
                    onPress={() => triggerStepTransition(3)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Địa chỉ) ›</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 3: CHỌN ĐỊA CHỈ (Mode B) ----------------
    if (currentStep === 3) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Địa chỉ làm việc', 3, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionHeaderTitle}>Địa chỉ đã lưu</Text>

                  {addresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId;
                    const isHome = addr.title.toLowerCase().includes('nhà');
                    const isOffice =
                      addr.title.toLowerCase().includes('việc') || addr.title.toLowerCase().includes('ty');
                    return (
                      <Pressable
                        key={addr.id}
                        style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                        onPress={() => setSelectedAddressId(addr.id)}>
                        <View
                          style={[styles.addressIconCircle, isSelected && styles.addressIconCircleSelected]}>
                          <IconSymbol
                            name={isHome ? 'home' : isOffice ? 'office' : 'location'}
                            size={22}
                            color={isSelected ? BrandColors.primary : BrandColors.gray600}
                          />
                        </View>
                        <View style={styles.addressInfo}>
                          <View style={styles.addressTitleRow}>
                            <Text style={styles.addressTitle}>{addr.title}</Text>
                            {addr.isDefault && (
                              <View style={styles.defaultPill}>
                                <Text style={styles.defaultPillText}>Mặc định</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.addressDetail}>{addr.fullAddress}</Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    style={styles.addAddressDashedBtn}
                    onPress={() => Alert.alert('Thêm địa chỉ', 'Chức năng thêm nhanh địa chỉ mới.')}>
                    <IconSymbol name="plus" size={16} color={BrandColors.primary} />
                    <Text style={styles.addAddressDashedText}>Thêm địa chỉ mới</Text>
                  </Pressable>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(4)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Chọn ngày & giờ)</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 4: CHỌN NGÀY & GIỜ (Mode B) ----------------
    if (currentStep === 4) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Chọn ngày & giờ', 4, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Calendar */}
                  <View style={styles.calendarCard}>
                    <View style={styles.calendarHeader}>
                      <View style={styles.calendarMonthWrapper}>
                        <IconSymbol name="calendar" size={18} color={BrandColors.primary} />
                        <Text style={styles.calendarMonthText}>Tháng 10, 2026</Text>
                      </View>
                      <View style={styles.calendarArrows}>
                        <Pressable style={styles.arrowBtn} hitSlop={6}>
                          <Text style={styles.arrowText}>‹</Text>
                        </Pressable>
                        <Pressable style={styles.arrowBtn} hitSlop={6}>
                          <Text style={styles.arrowText}>›</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.calendarGrid}>
                      {CALENDAR_DAYS.map((day, idx) => {
                        const isSelected = day.isSelected;
                        return (
                          <Pressable
                            key={idx}
                            style={[styles.calendarDayCell, isSelected && styles.calendarDaySelected]}
                            onPress={() => setSelectedDateStr(`Thứ Tư, 07/10/2026`)}>
                            <Text
                              style={[
                                styles.calendarDayName,
                                isSelected && styles.calendarDayTextSelected,
                              ]}>
                              {day.dayName}
                            </Text>
                            <Text
                              style={[
                                styles.calendarDayNum,
                                !day.isCurrentMonth && styles.calendarDayNumMuted,
                                isSelected && styles.calendarDayTextSelected,
                              ]}>
                              {day.dateNum}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <Text style={styles.sectionHeaderTitle}>Giờ bắt đầu làm việc</Text>
                  <View style={styles.timeSlotGrid}>
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = slot === selectedTimeSlot;
                      return (
                        <Pressable
                          key={slot}
                          style={[styles.timeSlotPill, isSelected && styles.timeSlotPillSelected]}
                          onPress={() => setSelectedTimeSlot(slot)}>
                          <IconSymbol
                            name="clock"
                            size={14}
                            color={isSelected ? BrandColors.white : BrandColors.gray500}
                          />
                          <Text
                            style={[
                              styles.timeSlotText,
                              isSelected && styles.timeSlotTextSelected,
                            ]}>
                            {slot}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.timeEstCard}>
                    <IconSymbol name="clock" size={18} color={BrandColors.primary} />
                    <Text style={styles.timeEstText}>
                      Thời lượng ước tính: {selectedPackage.durationHours} giờ
                    </Text>
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(5)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiếp tục (Xem tóm tắt)</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 5: TÓM TẮT ĐƠN HÀNG & MÃ GIẢM GIÁ (Mode B) ----------------
    if (currentStep === 5) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Tóm tắt đơn hàng', 5, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  {/* Service Card */}
                  <View style={styles.summaryStaffCard}>
                    <Image source={{ uri: service.image }} style={styles.summaryStaffAvatar} />
                    <View style={styles.summaryStaffMeta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.summaryStaffName}>{service.name}</Text>
                        <Badge label="Mode B: Nhận nhanh" variant="primary" size="sm" />
                      </View>
                      <Text style={styles.summaryStaffSub}>
                        {selectedPackage.name} • {requiredStaffCount} nhân viên
                      </Text>
                    </View>
                  </View>

                  {/* Schedule & Address */}
                  <View style={styles.summaryDetailCard}>
                    <View style={styles.summaryInfoRow}>
                      <IconSymbol name="calendar" size={18} color={BrandColors.primary} />
                      <Text style={styles.summaryInfoText}>
                        {selectedDateStr} lúc {selectedTimeSlot} ({selectedPackage.durationHours} giờ)
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryInfoRow}>
                      <IconSymbol name="location" size={18} color={BrandColors.primary} />
                      <Text style={styles.summaryInfoText}>{selectedAddress.fullAddress}</Text>
                    </View>
                  </View>

                  {/* Integrated Voucher Section */}
                  {renderVoucherSectionInSummary()}

                  {/* Price Breakdown */}
                  <View style={styles.priceBreakdownCard}>
                    <Text style={styles.priceBreakdownTitle}>Chi tiết thanh toán</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceKey}>Gói {selectedPackage.name}</Text>
                      <Text style={styles.priceVal}>{formatVND(selectedPackage.price)}</Text>
                    </View>
                    {requiredStaffCount > 1 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKey}>Thêm nhân viên (+{requiredStaffCount - 1} người)</Text>
                        <Text style={styles.priceVal}>+{formatVND((requiredStaffCount - 1) * 150000)}</Text>
                      </View>
                    )}
                    {addOnsTotal > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKey}>Dịch vụ bổ sung ({selectedAddOnIds.length})</Text>
                        <Text style={styles.priceVal}>+{formatVND(addOnsTotal)}</Text>
                      </View>
                    )}
                    {relatedServicesTotal > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKey}>Dịch vụ kết hợp thông minh ({selectedRelatedServiceIds.length})</Text>
                        <Text style={styles.priceVal}>+{formatVND(relatedServicesTotal)}</Text>
                      </View>
                    )}
                    {discountAmount > 0 && (
                      <View style={styles.priceRow}>
                        <Text style={styles.priceKeyDiscount}>
                          Ưu đãi giảm giá ({selectedPromoCode})
                        </Text>
                        <Text style={styles.priceValDiscount}>-{formatVND(discountAmount)}</Text>
                      </View>
                    )}
                    <View style={styles.priceRow}>
                      <Text style={styles.priceKey}>VAT & Phí dịch vụ</Text>
                      <Text style={styles.priceVal}>Đã bao gồm</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceTotalRow}>
                      <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                      <Text style={styles.totalAmount}>{formatVND(totalAmount)}</Text>
                    </View>
                  </View>

                  {/* Customer Notes */}
                  <View style={styles.noteInputCard}>
                    <Text style={styles.noteInputLabel}>Ghi chú cho người giúp việc (Tùy chọn)</Text>
                    <TextInput
                      style={styles.noteTextInput}
                      placeholder="Ví dụ: Vui lòng mang thêm găng tay cao su, nhà có trẻ nhỏ..."
                      placeholderTextColor="#9CA3AF"
                      value={customerNote}
                      onChangeText={setCustomerNote}
                      multiline
                    />
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(6)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>Tiến hành thanh toán</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 6: PHƯƠNG THỨC THANH TOÁN (Mode B) ----------------
    if (currentStep === 6) {
      const paymentMethods: { id: PaymentMethod; name: string; desc: string; icon: string }[] = [
        {
          id: 'VNPAY',
          name: 'VNPay (Quét mã QR)',
          desc: 'Thanh toán trực tiếp qua ứng dụng ngân hàng',
          icon: 'creditCard',
        },
        {
          id: 'MOMO',
          name: 'Ví MoMo',
          desc: 'Liên kết ví điện tử MoMo siêu tốc',
          icon: 'wallet',
        },
        {
          id: 'ZALOPAY',
          name: 'Ví ZaloPay',
          desc: 'Thanh toán an toàn qua ZaloPay',
          icon: 'wallet',
        },
        {
          id: 'CASH',
          name: 'Tiền mặt',
          desc: 'Thanh toán cho nhân viên sau khi hoàn thành',
          icon: 'cash',
        },
      ];

      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader('Phương thức thanh toán', 6, 9)}
            {renderAnimatedStep(
              <View style={styles.stepContainer}>
                <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionHeaderTitle}>Chọn cổng thanh toán</Text>

                  {paymentMethods.map((pm) => {
                    const isSelected = pm.id === paymentMethod;
                    return (
                      <Pressable
                        key={pm.id}
                        style={[
                          styles.paymentMethodCard,
                          isSelected && styles.paymentMethodCardSelected,
                        ]}
                        onPress={() => setPaymentMethod(pm.id)}>
                        <View
                          style={[
                            styles.paymentIconBox,
                            isSelected && styles.paymentIconBoxSelected,
                          ]}>
                          <IconSymbol
                            name={pm.icon}
                            size={22}
                            color={isSelected ? BrandColors.primary : BrandColors.gray700}
                          />
                        </View>
                        <View style={styles.paymentInfo}>
                          <Text style={styles.paymentName}>{pm.name}</Text>
                          <Text style={styles.paymentDesc}>{pm.desc}</Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </Pressable>
                    );
                  })}

                  <View style={styles.guaranteeBox}>
                    <IconSymbol name="shield" size={24} color={BrandColors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.guaranteeTitle}>Cam kết dịch vụ hoàn hảo</Text>
                      <Text style={styles.guaranteeDesc}>
                        Được nghiệm thu chất lượng vệ sinh trước khi thanh toán. Cam kết hoàn tiền 100% nếu bạn không hài lòng.
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.bottomBar}>
                  <Pressable
                    style={styles.ctaPrimaryBtn}
                    onPress={() => triggerStepTransition(7)}>
                    <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                      <Text style={styles.ctaPrimaryText}>
                        Xác nhận & Tìm nhân viên ({formatVND(totalAmount)})
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 7: RADAR TÌM KIẾM NHÂN VIÊN (Mode B) ----------------
    if (currentStep === 7) {
      if (isModeBStaffAccepted && modeBMatchedStaff) {
        return (
          <LinearGradient
            colors={BrandColors.softBgGradient}
            locations={BrandColors.softBgGradientLocations}
            style={styles.gradientContainer}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
              <ScrollView contentContainerStyle={styles.matchAcceptedContent} showsVerticalScrollIndicator={false}>
                <View style={styles.matchAcceptedIcon}>
                  <IconSymbol name="check" size={34} color={BrandColors.white} />
                </View>
                <Text style={styles.matchAcceptedTitle}>ĐÃ CÓ NHÂN VIÊN NHẬN ĐƠN</Text>
                <Text style={styles.matchAcceptedSubtitle}>
                  Đơn của bạn đã được xác nhận. Nhân viên sẽ có mặt đúng khung giờ đã đặt.
                </Text>

                <View style={styles.matchedStaffCard}>
                  <View style={styles.matchedStaffCardHeader}>
                    <Text style={styles.matchedStaffLabel}>NHÂN VIÊN THỰC HIỆN</Text>
                    <View style={styles.matchedStaffVerified}>
                      <IconSymbol name="shield" size={12} color={BrandColors.primaryDark} />
                      <Text style={styles.matchedStaffVerifiedText}>Đã xác minh</Text>
                    </View>
                  </View>
                  <View style={styles.matchedStaffProfile}>
                    <Image source={{ uri: modeBMatchedStaff.avatar }} style={styles.matchedStaffAvatar} />
                    <View style={styles.matchedStaffInfo}>
                      <Text style={styles.matchedStaffName}>{modeBMatchedStaff.fullName}</Text>
                      <Text style={styles.matchedStaffMeta}>
                        {modeBMatchedStaff.rating.toFixed(1)}★ • {modeBMatchedStaff.reviewCount} lượt đánh giá
                      </Text>
                      <Text style={styles.matchedStaffMeta}>
                        Hoàn thành {modeBMatchedStaff.completionRate}% đơn hàng
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.matchBookingCard}>
                  <Text style={styles.matchBookingCardTitle}>Thông tin ca làm</Text>
                  <View style={styles.matchBookingRow}>
                    <IconSymbol name="clean" size={16} color={BrandColors.primary} />
                    <Text style={styles.matchBookingText}>{service.name} • {selectedPackage.name}</Text>
                  </View>
                  <View style={styles.matchBookingRow}>
                    <IconSymbol name="calendar" size={16} color={BrandColors.primary} />
                    <Text style={styles.matchBookingText}>{selectedDateStr} lúc {selectedTimeSlot}</Text>
                  </View>
                  <View style={styles.matchBookingRow}>
                    <IconSymbol name="location" size={16} color={BrandColors.primary} />
                    <Text style={styles.matchBookingText} numberOfLines={2}>{selectedAddress.fullAddress}</Text>
                  </View>
                </View>

                <View style={styles.matchAcceptedNotice}>
                  <IconSymbol name="info" size={16} color="#1E40AF" />
                  <Text style={styles.matchAcceptedNoticeText}>
                    Bạn có thể nhắn tin hoặc gọi trong ứng dụng khi ca làm chuyển sang trạng thái đã xác nhận.
                  </Text>
                </View>

                <Pressable style={styles.matchHomeButton} onPress={() => router.replace('/')}>
                  <Text style={styles.matchHomeButtonText}>Về trang chủ</Text>
                </Pressable>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        );
      }

      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.radarContainer}>
              {/* Multi-Wave Animated Radar */}
              <View style={styles.radarCenterArea}>
                <Animated.View
                  style={[
                    styles.radarWaveCircle,
                    { transform: [{ scale: radarWave1 }], opacity: radarOpacity1 },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.radarWaveCircle,
                    { transform: [{ scale: radarWave2 }], opacity: radarOpacity2 },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.radarWaveCircle,
                    { transform: [{ scale: radarWave3 }], opacity: radarOpacity3 },
                  ]}
                />

                <LinearGradient
                  colors={BrandColors.primaryGradient}
                  style={styles.radarCenterBeacon}>
                  <IconSymbol name="sparkles" size={32} color={BrandColors.white} />
                </LinearGradient>
              </View>

              <Text style={styles.radarTitle}>ĐANG TÌM KIẾM NHÂN VIÊN</Text>
              <Text style={styles.radarStatusText}>{radarStatusText}</Text>

              <View style={styles.radarInfoBox}>
                <View style={styles.radarInfoRow}>
                  <IconSymbol name="clean" size={16} color={BrandColors.primary} />
                  <Text style={styles.radarInfoRowText}>
                    {service.name} • {selectedPackage.name}
                  </Text>
                </View>
                <View style={styles.radarInfoRow}>
                  <IconSymbol name="location" size={16} color={BrandColors.primary} />
                  <Text style={styles.radarInfoRowText} numberOfLines={1}>
                    {selectedAddress.fullAddress}
                  </Text>
                </View>
              </View>

              <View style={styles.radarNoteBadge}>
                <Text style={styles.radarNoteText}>
                  Đơn đang chờ nhân viên phù hợp nhận trong luồng ứng dụng dành cho nhân viên.
                </Text>
              </View>

              {__DEV__ && (
                <Pressable
                  style={styles.matchPreviewButton}
                  onPress={() => setIsModeBStaffAccepted(true)}>
                  <Text style={styles.matchPreviewButtonText}>Xem trước khi nhân viên nhận đơn</Text>
                </Pressable>
              )}
            </View>
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // ---------------- STEP 8: ĐẶT LỊCH THÀNH CÔNG (Mode B) ----------------
    if (currentStep === 8) {
      return (
        <LinearGradient
          colors={BrandColors.softBgGradient}
          locations={BrandColors.softBgGradientLocations}
          style={styles.gradientContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
              <Animated.View style={[styles.successCheckCircle, { transform: [{ scale: successScaleAnim }] }]}>
                <IconSymbol name="check" size={48} color="#FFFFFF" />
              </Animated.View>

              <Text style={styles.successHeading}>ĐẶT LỊCH THÀNH CÔNG!</Text>
              <Text style={styles.successSubheading}>
                Đơn hàng đã được kết nối thành công với đối tác uy tín của CleanMaster.
              </Text>

              {/* Order Code Box */}
              <View style={styles.orderCodeBox}>
                <View>
                  <Text style={styles.orderCodeLabel}>MÃ ĐƠN HÀNG</Text>
                  <Text style={styles.orderCodeVal}>#HC-202610-B419</Text>
                </View>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => handleCopyCode('#HC-202610-B419')}>
                  <IconSymbol name="copy" size={16} color={BrandColors.primary} />
                  <Text style={styles.copyBtnText}>{isCopied ? 'Đã chép ✓' : 'Sao chép'}</Text>
                </Pressable>
              </View>

              {/* Summary Card */}
              <View style={styles.successDetailCard}>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Dịch vụ</Text>
                  <Text style={styles.successValBold}>{service.name}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Gói diện tích</Text>
                  <Text style={styles.successVal}>
                    {selectedPackage.name} ({requiredStaffCount} người)
                  </Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Thời gian</Text>
                  <Text style={styles.successVal}>
                    {selectedDateStr} • {selectedTimeSlot}
                  </Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Địa chỉ</Text>
                  <Text style={styles.successVal}>{selectedAddress.fullAddress}</Text>
                </View>
                <View style={styles.successRow}>
                  <Text style={styles.successKey}>Tổng thanh toán</Text>
                  <Text style={styles.successTotal}>{formatVND(totalAmount)}</Text>
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.successBtnColumn}>
                <Pressable
                  style={styles.ctaPrimaryBtn}
                  onPress={() => router.push('/booking/bk-002')}>
                  <LinearGradient colors={BrandColors.primaryGradient} style={styles.gradientBtn}>
                    <Text style={styles.ctaPrimaryText}>Theo dõi tiến độ đơn</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.ctaSecondaryBtn}
                  onPress={() => router.replace('/(tabs)')}>
                  <Text style={styles.ctaSecondaryText}>Về trang chủ</Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      );
    }
  }

  return null;
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Header styles
  headerWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.two,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  headerStepBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.primaryDark,
    marginTop: 2,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BrandColors.danger,
  },
  progressBarTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: 'rgba(0, 176, 116, 0.12)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: BrandColors.primary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },

  stepContainer: {
    flex: 1,
  },
  stepContent: {
    padding: Spacing.three,
    paddingBottom: 110,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: Spacing.two,
  },
  stepSubtitleNote: {
    fontSize: 13,
    color: BrandColors.gray600,
    marginBottom: Spacing.three,
  },

  // Flow 0: Entry screen
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.primary,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  giftBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  giftBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  entryContent: {
    padding: Spacing.three,
    paddingBottom: 40,
  },
  entryBanner: {
    height: 180,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  entryBannerImage: {
    width: '100%',
    height: '100%',
  },
  entryBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: Spacing.three,
  },
  bannerTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
  },
  bannerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.white,
    letterSpacing: 0.5,
  },
  entryBannerHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: BrandColors.white,
    marginBottom: 4,
  },
  entryBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  entryQuestion: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: Spacing.three,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeCardActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#FFFFFF',
  },
  modeIconCircleTeal: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  modeBadgeModeA: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  modeBadgeTextA: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  modeBadgeModeB: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  modeBadgeTextB: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  modeCardSubtitle: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 16,
  },
  trustBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: Spacing.two,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    paddingVertical: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray700,
  },

  // Address Step
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.two,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  addressCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  addressIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  addressIconCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  addressInfo: {
    flex: 1,
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
  defaultPill: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  defaultPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  addressDetail: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
  },
  radioCircleSelected: {
    borderColor: BrandColors.primary,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.primary,
  },
  addAddressDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BrandColors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing.two,
  },
  addAddressDashedText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },

  // Notice & Auto Filter Banners
  matchingNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: BrandColors.primaryLight,
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: Spacing.three,
  },
  matchingNoticeText: {
    flex: 1,
    fontSize: 12,
    color: BrandColors.primaryDark,
    lineHeight: 18,
  },
  autoFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  autoFilterText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.primaryDark,
  },

  // Filter Section on top of Staff List
  filterSectionWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterChipScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
  },
  filterCategoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray500,
    marginRight: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.gray700,
  },
  filterChipTextActive: {
    color: BrandColors.white,
  },

  // Staff card
  cleanStaffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.two,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cleanStaffCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  cleanAvatarBox: {
    position: 'relative',
    marginRight: Spacing.two,
  },
  cleanAvatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E5E7EB',
  },
  cleanOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BrandColors.success,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cleanStaffInfo: {
    flex: 1,
  },
  cleanNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 2,
  },
  cleanFullName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  cleanAgeText: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  cleanWorkHoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cleanWorkHoursText: {
    fontSize: 11,
    color: BrandColors.gray600,
  },
  cleanRatingSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  cleanRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray800,
  },
  cleanReviewCount: {
    fontSize: 10,
    color: BrandColors.gray500,
  },
  cleanPriceColumn: {
    alignItems: 'flex-end',
    marginLeft: Spacing.two,
  },
  cleanPriceNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  cleanPriceUnit: {
    fontSize: 10,
    color: BrandColors.gray500,
  },
  viewProfilePill: {
    marginTop: 6,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  viewProfilePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },

  emptyFilterBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyFilterText: {
    fontSize: 13,
    color: BrandColors.gray500,
    marginTop: 8,
    marginBottom: 12,
  },
  resetFilterBtn: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resetFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },

  // Staff Detail (Mode A Step 3)
  detailProfileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailLargeAvatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.two,
  },
  detailLargeAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: BrandColors.primary,
  },
  verifiedBadgeCircle: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  detailFullName: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 4,
  },
  detailAge: {
    fontSize: 14,
    fontWeight: '400',
    color: BrandColors.gray500,
  },
  detailTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  detailExpText: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: BrandColors.gray500,
  },
  bioCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  bioHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  bioContent: {
    fontSize: 13,
    color: BrandColors.gray600,
    lineHeight: 18,
  },
  skillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPillLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  skillPillLargeText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.primaryDark,
  },
  reviewSnippet: {
    backgroundColor: '#F9FAFB',
    padding: Spacing.two,
    borderRadius: BorderRadius.md,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  reviewSnippetText: {
    fontSize: 12,
    color: BrandColors.gray600,
    fontStyle: 'italic',
  },
  securityNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: Spacing.three,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 16,
  },

  // Calendar & Time
  calendarCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  calendarMonthWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarMonthText: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  calendarArrows: {
    flexDirection: 'row',
    gap: 6,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 16,
    color: BrandColors.gray700,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayCell: {
    width: '13.5%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    marginBottom: 6,
  },
  calendarDaySelected: {
    backgroundColor: BrandColors.primary,
  },
  calendarDayName: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginBottom: 2,
  },
  calendarDayNum: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  calendarDayNumMuted: {
    color: '#D1D5DB',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  timeSlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '31%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  timeSlotPillSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.gray800,
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeEstCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.primaryLight,
    padding: Spacing.two,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: Spacing.three,
  },
  timeEstText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.primaryDark,
  },

  // USER REQUIREMENT 1: Cards for 2h, 3h, 4h Cleaning Durations
  durationCardsContainer: {
    marginBottom: Spacing.two,
    gap: 8,
  },
  durationCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  durationCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  durationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  durationTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationHoursText: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  durationHoursTextSelected: {
    color: BrandColors.primaryDark,
  },
  areaBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  areaBadgeSelected: {
    backgroundColor: '#A7F3D0',
  },
  areaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  areaBadgeTextSelected: {
    color: BrandColors.primaryDark,
  },
  popularBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  durationUnitType: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray800,
    marginBottom: 2,
  },
  durationDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginBottom: 8,
  },
  durationCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 6,
  },
  durationPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  durationPriceTextSelected: {
    color: BrandColors.primary,
  },

  // Add-ons
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.two,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  addonCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  addonImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.three,
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  addonDuration: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginBottom: 4,
  },
  addonPriceBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.two,
  },
  checkboxCircleSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // USER REQUIREMENT 2: Ô "Không chọn" dịch vụ bổ sung
  noAddonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  noAddonCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  noAddonIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  noAddonIconCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  noAddonInfo: {
    flex: 1,
  },
  noAddonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  noAddonSubtitle: {
    fontSize: 11,
    color: BrandColors.gray500,
    lineHeight: 15,
  },

  // USER REQUIREMENT 3: Thanh bottom bar có hiển thị số tiền ước tính cập nhật real-time
  bottomBarWithEstimate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.85)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  estimateCol: {
    flex: 1,
    marginRight: Spacing.two,
  },
  estimateLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
    fontWeight: '500',
  },
  estimateAmountVal: {
    fontSize: 19,
    fontWeight: '900',
    color: BrandColors.primary,
    letterSpacing: -0.5,
  },
  estimateNoteText: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginTop: 1,
  },
  ctaEstimateBtn: {
    minWidth: 165,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  // Voucher Section Integrated into Order Summary
  summaryVoucherSection: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  summaryVoucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.two,
  },
  summaryVoucherHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.two,
  },
  promoInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
    color: BrandColors.gray900,
  },
  promoApplyBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  promoApplyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voucherHorizontalList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  miniVoucherCard: {
    width: 145,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniVoucherCardSelected: {
    backgroundColor: BrandColors.primaryLight,
    borderColor: BrandColors.primary,
  },
  miniVoucherTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniVoucherCode: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.gray800,
  },
  miniVoucherCodeSelected: {
    color: BrandColors.primaryDark,
  },
  miniVoucherBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  miniVoucherBadgeSelected: {
    backgroundColor: BrandColors.primary,
  },
  miniVoucherBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  miniVoucherBadgeTextSelected: {
    color: '#FFFFFF',
  },
  miniVoucherDesc: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginBottom: 6,
  },
  miniVoucherAction: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.gray600,
  },
  miniVoucherActionSelected: {
    color: BrandColors.primaryDark,
  },

  // Summary
  summaryStaffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  summaryStaffAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: Spacing.two,
  },
  summaryStaffMeta: {
    flex: 1,
  },
  summaryStaffName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  summaryStaffSub: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  summaryDetailCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  summaryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  summaryInfoText: {
    flex: 1,
    fontSize: 13,
    color: BrandColors.gray800,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
  },
  priceBreakdownCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  priceBreakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: Spacing.two,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceKey: {
    fontSize: 13,
    color: BrandColors.gray600,
  },
  priceVal: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.gray800,
  },
  priceKeyDiscount: {
    fontSize: 13,
    color: BrandColors.success,
  },
  priceValDiscount: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.success,
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: Spacing.two,
  },
  priceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  noteInputCard: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  noteInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.gray800,
    marginBottom: 6,
  },
  noteTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    fontSize: 12,
    color: BrandColors.gray900,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  // Payment
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.two,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  paymentMethodCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  paymentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  paymentIconBoxSelected: {
    backgroundColor: '#FFFFFF',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  paymentDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  guaranteeBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F0FDF4',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: Spacing.two,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 2,
  },
  guaranteeDesc: {
    fontSize: 11,
    color: '#15803D',
    lineHeight: 16,
  },

  // Mode A Waiting Screen
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  clockAnimBox: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: Spacing.four,
  },
  clockCircleBorder: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: BrandColors.primary,
  },
  waitingAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  waitingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.gray900,
    textAlign: 'center',
    marginBottom: 6,
  },
  waitingSubtitle: {
    fontSize: 13,
    color: BrandColors.gray600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.four,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  policyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  policyNoticeText: {
    flex: 1,
    fontSize: 11,
    color: BrandColors.gray600,
    lineHeight: 16,
  },

  // Mode B: Service Cards with Image
  serviceCardWithImg: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  serviceCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  serviceImgThumb: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.three,
  },
  serviceBody: {
    flex: 1,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  serviceTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  serviceDescText: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 16,
    marginBottom: 4,
  },
  serviceFooterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  servicePriceVal: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  serviceUnitText: {
    fontSize: 11,
    color: BrandColors.gray500,
  },

  // Package Card (Mode B)
  packageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.two,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  packageCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  packageCardLeft: {
    flex: 1,
  },
  packageName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  packageDuration: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  packageCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  stepperCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.two,
  },
  stepperHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  stepperControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
    minWidth: 50,
    textAlign: 'center',
  },
  recommendationBox: {
    backgroundColor: '#EFF6FF',
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: Spacing.two,
  },
  recommendationText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },

  // Radar Screen (Mode B)
  radarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  radarCenterArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: Spacing.four,
  },
  radarWaveCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 176, 116, 0.15)',
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
  },
  radarCenterBeacon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  radarTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BrandColors.gray900,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  radarStatusText: {
    fontSize: 13,
    color: BrandColors.gray600,
    marginBottom: Spacing.four,
    textAlign: 'center',
  },
  radarInfoBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  radarInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  radarInfoRowText: {
    flex: 1,
    fontSize: 12,
    color: BrandColors.gray800,
  },
  radarNoteBadge: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  radarNoteText: {
    fontSize: 11,
    color: BrandColors.primaryDark,
    textAlign: 'center',
  },
  matchPreviewButton: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  matchPreviewButtonText: {
    fontSize: 12,
    color: BrandColors.gray500,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  matchAcceptedContent: {
    alignItems: 'center',
    padding: Spacing.four,
    paddingBottom: 48,
  },
  matchAcceptedIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  matchAcceptedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BrandColors.gray900,
    textAlign: 'center',
  },
  matchAcceptedSubtitle: {
    fontSize: 13,
    color: BrandColors.gray600,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: Spacing.four,
  },
  matchedStaffCard: {
    width: '100%',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  matchedStaffCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchedStaffLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.gray500,
    letterSpacing: 0.6,
  },
  matchedStaffVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchedStaffVerifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  matchedStaffProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchedStaffAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BrandColors.gray100,
  },
  matchedStaffInfo: {
    flex: 1,
    marginLeft: 12,
  },
  matchedStaffName: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 3,
  },
  matchedStaffMeta: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 18,
  },
  matchBookingCard: {
    width: '100%',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    padding: Spacing.three,
  },
  matchBookingCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 8,
  },
  matchBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  matchBookingText: {
    flex: 1,
    fontSize: 12,
    color: BrandColors.gray700,
    lineHeight: 17,
  },
  matchAcceptedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    marginTop: Spacing.three,
  },
  matchAcceptedNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
  },
  matchHomeButton: {
    width: '100%',
    backgroundColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  matchHomeButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.white,
  },

  // Success Screen
  successContent: {
    alignItems: 'center',
    padding: Spacing.four,
    paddingBottom: 50,
  },
  successCheckCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: BrandColors.gray900,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubheading: {
    fontSize: 13,
    color: BrandColors.gray600,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.four,
  },
  orderCodeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BrandColors.primary,
    marginBottom: Spacing.three,
  },
  orderCodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.gray500,
    letterSpacing: 0.5,
  },
  orderCodeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  successDetailCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.four,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  successKey: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  successVal: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray800,
    maxWidth: '65%',
    textAlign: 'right',
  },
  successValBold: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  successTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  successBtnColumn: {
    width: '100%',
    gap: 10,
  },
  ctaSecondaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray700,
  },

  // Bottom action bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  ctaPrimaryBtn: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  gradientBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
