import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import { mockPromotions } from '@/data/promotions';
import { mockBookings } from '@/data/bookings';
import { mockConversations } from '@/data/conversations';
import { getStaffById } from '@/data';

// 4 banners strictly reflecting the 3 core cleaning services + Add-ons per Section 5
const HERO_BANNERS = [
  {
    id: 'banner-1',
    badge: 'Chất lượng 5★',
    badgeVariant: 'success' as const,
    title: 'Dọn dẹp theo ca lẻ',
    highlight: 'Linh hoạt từ 2 - 4 giờ',
    description: 'Chủ động chọn nhân viên ưng ý (Mode A) hoặc treo đơn nhận nhanh (Mode B)',
    buttonText: 'Đặt ca lẻ ngay',
    serviceId: 'srv-001',
    bgGradient: ['#0F766E', '#115E59'] as [string, string],
    imageUri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'banner-2',
    badge: 'Tiết kiệm 15%',
    badgeVariant: 'warning' as const,
    title: 'Dọn dẹp định kỳ',
    highlight: 'Gia đình luôn ngăn nắp',
    description: 'Lịch cố định hàng tuần • Nhân viên chuyên nghiệp cố định • Nhà luôn tinh tươm',
    buttonText: 'Đăng ký định kỳ',
    serviceId: 'srv-002',
    bgGradient: ['#047857', '#064E3B'] as [string, string],
    imageUri: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'banner-3',
    badge: 'Toàn diện',
    badgeVariant: 'primary' as const,
    title: 'Tổng vệ sinh nhà/căn hộ',
    highlight: 'Sạch sâu từng góc nhỏ',
    description: 'Gói diện tích chuẩn hóa từ 55m² đến 105m² • Trang thiết bị vệ sinh chuyên dụng',
    buttonText: 'Đặt tổng vệ sinh',
    serviceId: 'srv-003',
    bgGradient: ['#0E7490', '#155E75'] as [string, string],
    imageUri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'banner-4',
    badge: 'Add-on tiện ích',
    badgeVariant: 'danger' as const,
    title: 'Vệ sinh chuyên sâu',
    highlight: 'Sofa, Thảm, Nệm & Rèm',
    description: 'Chọn kèm dịch vụ chính với giá và thời lượng chuẩn hóa rõ ràng',
    buttonText: 'Xem Add-on',
    serviceId: 'srv-001',
    bgGradient: ['#1E3A8A', '#1E40AF'] as [string, string],
    imageUri: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { currentCustomer, currentStaff, currentRole } = useAuth();
  const isStaff = currentRole === 'STAFF';

  const { width: windowWidth } = useWindowDimensions();
  const bannerWidth = Math.min(windowWidth - Spacing.three * 2, 600);

  const [selectedCity, setSelectedCity] = useState('Hà Nội');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Staff states
  const [isStaffOnline, setIsStaffOnline] = useState(true);
  const [guaranteedBalance, setGuaranteedBalance] = useState(450000); // Min 200,000 VND
  const [staffBookings, setStaffBookings] = useState(mockBookings);

  const bannerScrollRef = useRef<ScrollView>(null);
  const isInteracting = useRef(false);

  // Auto-slide carousel every 4.5 seconds for Customer view
  useEffect(() => {
    if (isStaff) return;
    const timer = setInterval(() => {
      if (!isInteracting.current && bannerScrollRef.current) {
        const nextIndex = (activeBannerIndex + 1) % HERO_BANNERS.length;
        bannerScrollRef.current.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });
        setActiveBannerIndex(nextIndex);
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [activeBannerIndex, bannerWidth, isStaff]);

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / bannerWidth);
    if (index >= 0 && index < HERO_BANNERS.length && index !== activeBannerIndex) {
      setActiveBannerIndex(index);
    }
  };

  const unreadMessagesCount = mockConversations.reduce(
    (sum, c) => sum + (c.unreadCountCustomer || 0),
    0
  );

  // Active in-progress booking
  const activeBooking = staffBookings.find((b) => b.status === 'IN_PROGRESS');
  const activeStaff = activeBooking ? getStaffById('staff-001') : null;

  // Masked Support Consultant Hotline (Section 17: No raw personal contacts)
  const handleSupportConsultantPress = () => {
    Alert.alert(
      'Tư vấn viên HomeCare 24/7',
      'Bạn muốn kết nối với Tư vấn viên hỗ trợ hoặc nhận tư vấn dịch vụ?',
      [
        {
          text: 'Trò chuyện cùng AI tư vấn',
          onPress: () => router.push('/ai'),
        },
        {
          text: 'Gọi tổng đài miễn cước (1900 6868)',
          onPress: () => {
            Alert.alert('Đang kết nối', 'Tổng đài chăm sóc khách hàng HomeCare 1900 6868.');
          },
        },
        { text: 'Đóng', style: 'cancel' },
      ]
    );
  };

  // Staff actions
  const handleAcceptModeAOrder = (bookingId: string) => {
    Alert.alert('Xác nhận nhận đơn', 'Bạn đồng ý nhận đơn ca này theo chỉ định của khách hàng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đồng ý nhận',
        onPress: () => {
          setStaffBookings((prev) =>
            prev.map((b) => (b.id === bookingId ? { ...b, status: 'ACCEPTED' } : b))
          );
          Alert.alert('Thành công', 'Bạn đã nhận đơn. Vui lòng có mặt đúng giờ.');
        },
      },
    ]);
  };

  const handleRejectModeAOrder = (bookingId: string) => {
    Alert.alert(
      'Từ chối đơn hàng',
      'Nếu từ chối, hệ thống sẽ thông báo khách hàng chọn nhân viên khác. Lưu ý: Thường xuyên hủy/từ chối có thể ảnh hưởng đến chỉ số tài khoản (Section 22).',
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Xác nhận từ chối',
          style: 'destructive',
          onPress: () => {
            setStaffBookings((prev) =>
              prev.map((b) =>
                b.id === bookingId
                  ? {
                      ...b,
                      status: 'REJECTED',
                      cancelledBy: 'STAFF',
                      cancellationReason: 'Nhân viên bận ca đột xuất',
                    }
                  : b
              )
            );
            Alert.alert('Đã từ chối đơn', 'Hệ thống đã thông báo cho khách hàng chọn nhân viên khác.');
          },
        },
      ]
    );
  };

  const handleGrabModeBOrder = (bookingId: string) => {
    Alert.alert(
      'Nhận đơn nhanh (Mode B)',
      'Đơn được phân phối theo cơ chế nhân viên gửi yêu cầu trước sẽ nhận (First-come first-served). Nhận đơn này?',
      [
        { text: 'Bỏ qua', style: 'cancel' },
        {
          text: 'Nhận đơn ngay',
          onPress: () => {
            setStaffBookings((prev) =>
              prev.map((b) => (b.id === bookingId ? { ...b, status: 'ACCEPTED' } : b))
            );
            Alert.alert('Nhận đơn thành công!', 'Bạn là người nhận đơn đầu tiên. Đơn đã được chuyển vào lịch làm việc.');
          },
        },
      ]
    );
  };

  // Filtered lists for Staff
  const pendingModeAOrders = staffBookings.filter(
    (b) => b.mode === 'MODE_A' && ['PENDING', 'ASSIGNED'].includes(b.status)
  );
  const openModeBOrders = staffBookings.filter(
    (b) => b.mode === 'MODE_B' && ['PENDING', 'MATCHING'].includes(b.status)
  );

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <IconSymbol name="location" size={18} color={BrandColors.primary} />
            <View style={styles.locationTextWrapper}>
              <Text style={styles.locationLabel}>
                {isStaff ? 'Khu vực hoạt động' : 'Vị trí hiện tại'}
              </Text>
              <Pressable style={styles.cityDropdown}>
                <Text style={styles.cityName}>
                  {isStaff
                    ? currentStaff?.operatingDistricts?.slice(0, 2).join(', ') || 'Cầu Giấy, Nam Từ Liêm'
                    : selectedCity}
                </Text>
                <IconSymbol name="chevronDown" size={12} color={BrandColors.gray600} />
              </Pressable>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            {/* Consultant / Support Bot Button */}
            <Pressable
              style={styles.supportConsultantBtn}
              onPress={handleSupportConsultantPress}
              hitSlop={6}>
              <Image
                source={require('@/assets/images/support-consultant.png')}
                style={styles.supportConsultantImg}
                resizeMode="contain"
              />
              <View style={styles.onlineDot} />
            </Pressable>

            {/* Chat button */}
            <Pressable
              style={styles.headerActionBtn}
              onPress={() => router.push('/chat')}
              hitSlop={6}>
              <IconSymbol name="chat" size={18} color={BrandColors.primary} />
              {unreadMessagesCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>

          {/* ========================================================= */}
          {/* ==================== STAFF WORKSPACE ==================== */}
          {/* ========================================================= */}
          {isStaff ? (
            <View>
              {/* Staff Profile Card */}
              <View style={styles.staffHeaderCard}>
                <Image
                  source={{
                    uri:
                      currentStaff?.avatar ||
                      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
                  }}
                  style={styles.staffAvatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.staffFullName}>
                      {currentStaff?.fullName || 'Nguyễn Văn An'}
                    </Text>
                    <Badge label="Đối tác tự do" variant="success" size="sm" />
                  </View>
                  <Text style={styles.staffSubInfo}>
                    CCCD: Đã xác thực • 4.8★ (128 lượt) • 98% Hoàn thành
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.onlineToggleBtn,
                    isStaffOnline ? styles.onlineToggleActive : styles.onlineToggleInactive,
                  ]}
                  onPress={() => setIsStaffOnline(!isStaffOnline)}>
                  <Text style={styles.onlineToggleText}>
                    {isStaffOnline ? '🟢 Sẵn sàng' : '⚪ Nghỉ ca'}
                  </Text>
                </Pressable>
              </View>

              {/* Financial Balance & Wallet Summary (Section 18, 19, 20) */}
              <View style={styles.balanceCard}>
                <View style={styles.balanceTopRow}>
                  <View>
                    <Text style={styles.balanceLabel}>Số dư đảm bảo (Ký quỹ nhận việc)</Text>
                    <Text style={styles.balanceAmount}>{formatVND(guaranteedBalance)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.balanceLabel}>Thu nhập hôm nay (80%)</Text>
                    <Text style={styles.incomeAmount}>{formatVND(680000)}</Text>
                  </View>
                </View>

                {/* Minimum Balance Warning (Section 18: Min 200.000 VND) */}
                {guaranteedBalance < 200000 ? (
                  <View style={styles.balanceWarningAlert}>
                    <IconSymbol name="warning" size={14} color={BrandColors.danger} />
                    <Text style={styles.balanceWarningText}>
                      Số dư dưới mức tối thiểu 200.000đ! Vui lòng nạp thêm để tiếp tục nhận đơn thu tiền mặt.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.balanceGoodAlert}>
                    <IconSymbol name="shield" size={14} color={BrandColors.success} />
                    <Text style={styles.balanceGoodText}>
                      Số dư an toàn (Tối thiểu 200.000đ) • Phí nền tảng 20% trừ tự động khi thu tiền mặt
                    </Text>
                  </View>
                )}

                {/* Daily Bonus Tracker (Section 23: Doanh thu >= 800k -> 100k) */}
                <View style={styles.bonusTrackerRow}>
                  <Text style={styles.bonusTrackerTitle}>Đua thưởng doanh thu ngày:</Text>
                  <Text style={styles.bonusTrackerValue}>
                    680.000đ / 800.000đ (Thiếu 120k để đạt thưởng 100.000đ)
                  </Text>
                </View>
              </View>

              {/* In-Progress Job Section (Section 16, 20) */}
              {activeBooking && (
                <View style={styles.activeJobCard}>
                  <View style={styles.activeJobHeader}>
                    <View style={styles.pulseDotRow}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.activeJobTitle}>Đang trong ca làm việc</Text>
                    </View>
                    <Text style={styles.jobCode}>{activeBooking.bookingCode}</Text>
                  </View>

                  <Text style={styles.jobServiceTitle}>Dọn vệ sinh theo ca lẻ (Gói 3 giờ)</Text>
                  <Text style={styles.jobAddress}>
                    📍 123 Nguyễn Văn Cừ, Long Biên, Hà Nội
                  </Text>
                  <Text style={styles.jobTime}>
                    ⏰ {activeBooking.startTime} – {activeBooking.endTime} • Thu nhập ca: {formatVND(activeBooking.totalAmount * 0.8)} (80%)
                  </Text>

                  <View style={styles.jobActionButtons}>
                    <Pressable
                      style={styles.jobDetailBtn}
                      onPress={() => router.push(`/booking/${activeBooking.id}`)}>
                      <Text style={styles.jobDetailBtnText}>Mở chi tiết ca làm</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Mode A: Direct Assigned Requests (Section 6: Customer chose you) */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Đơn chỉ định trực tiếp (Mode A)
                  {pendingModeAOrders.length > 0 ? ` (${pendingModeAOrders.length})` : ''}
                </Text>
              </View>

              {pendingModeAOrders.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>Chưa có đơn khách chỉ định đang chờ duyệt</Text>
                </View>
              ) : (
                pendingModeAOrders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <Badge label="Mode A: Khách chọn bạn" variant="primary" size="sm" />
                      <Text style={styles.orderTime}>{order.startTime} {order.bookingDate}</Text>
                    </View>
                    <Text style={styles.orderServiceName}>Dọn dẹp theo ca lẻ</Text>
                    <Text style={styles.orderLocation}>Khu vực: Cầu Giấy, Hà Nội</Text>
                    <Text style={styles.orderIncome}>
                      Thu nhập nhận: <Text style={{ fontWeight: '800', color: BrandColors.primary }}>{formatVND(order.totalAmount * 0.8)}</Text> (80%)
                    </Text>

                    <View style={styles.orderBtnRow}>
                      <Pressable
                        style={styles.rejectBtn}
                        onPress={() => handleRejectModeAOrder(order.id)}>
                        <Text style={styles.rejectBtnText}>Từ chối</Text>
                      </Pressable>
                      <Pressable
                        style={styles.acceptBtn}
                        onPress={() => handleAcceptModeAOrder(order.id)}>
                        <Text style={styles.acceptBtnText}>Xác nhận nhận đơn</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}

              {/* Mode B: Open Orders waiting to be grabbed (Section 7) */}
              <View style={[styles.sectionHeader, { marginTop: Spacing.four }]}>
                <Text style={styles.sectionTitle}>
                  Đơn treo tại khu vực của bạn (Mode B)
                </Text>
                <Text style={styles.sectionSubtitle}>Ai nhận trước sẽ được đơn</Text>
              </View>

              {openModeBOrders.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>Hiện không có đơn mới đang treo tại khu vực</Text>
                </View>
              ) : (
                openModeBOrders.slice(0, 3).map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <Badge label="Mode B: Đơn treo tự do" variant="warning" size="sm" />
                      <Text style={styles.orderTime}>{order.startTime} {order.bookingDate}</Text>
                    </View>
                    <Text style={styles.orderServiceName}>Dọn vệ sinh gia đình</Text>
                    <Text style={styles.orderLocation}>Khu vực: Nam Từ Liêm, Hà Nội</Text>
                    <Text style={styles.orderIncome}>
                      Thu nhập nhận: <Text style={{ fontWeight: '800', color: BrandColors.primary }}>{formatVND(order.totalAmount * 0.8)}</Text>
                    </Text>

                    <Pressable
                      style={styles.grabBtn}
                      onPress={() => handleGrabModeBOrder(order.id)}>
                      <Text style={styles.grabBtnText}>⚡ Nhận đơn ngay</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          ) : (
            /* ============================================================ */
            /* ==================== CUSTOMER WORKSPACE ==================== */
            /* ============================================================ */
            <View>
              {/* Search Bar */}
              <View style={styles.searchBox}>
                <IconSymbol name="search" size={18} color={BrandColors.gray400} />
                <TextInput
                  placeholder="Tìm kiếm 3 dịch vụ chính & Add-on..."
                  placeholderTextColor={BrandColors.gray400}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                />
              </View>

              {/* Hero Banner Carousel (3 Services + Add-ons) */}
              <View style={[styles.carouselWrapper, { width: bannerWidth }]}>
                <ScrollView
                  ref={bannerScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleBannerScroll}
                  scrollEventThrottle={16}
                  decelerationRate="fast"
                  snapToInterval={bannerWidth}
                  snapToAlignment="start"
                  onScrollBeginDrag={() => {
                    isInteracting.current = true;
                  }}
                  onScrollEndDrag={() => {
                    isInteracting.current = false;
                  }}
                  style={{ width: bannerWidth }}
                  contentContainerStyle={styles.heroCarouselContent}>
                  {HERO_BANNERS.map((banner) => (
                    <View key={banner.id} style={{ width: bannerWidth }}>
                      <LinearGradient
                        colors={banner.bgGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroBanner}>
                        <View style={styles.heroTextContent}>
                          <Badge label={banner.badge} variant={banner.badgeVariant} size="sm" />
                          <Text style={styles.heroTitle}>{banner.title}</Text>
                          <Text style={styles.heroHighlight}>{banner.highlight}</Text>
                          <Text style={styles.heroDescription} numberOfLines={2}>
                            {banner.description}
                          </Text>
                          <Pressable
                            style={styles.heroButton}
                            onPress={() => router.push(`/service/${banner.serviceId}`)}>
                            <Text style={styles.heroButtonText}>{banner.buttonText}</Text>
                            <IconSymbol name="chevronRight" size={14} color={BrandColors.white} />
                          </Pressable>
                        </View>
                        <Image
                          source={{ uri: banner.imageUri }}
                          style={styles.heroImage}
                          resizeMode="cover"
                        />
                      </LinearGradient>
                    </View>
                  ))}
                </ScrollView>

                {/* Carousel Pagination Dots */}
                <View style={styles.carouselPagination}>
                  {HERO_BANNERS.map((_, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        bannerScrollRef.current?.scrollTo({
                          x: idx * bannerWidth,
                          animated: true,
                        });
                        setActiveBannerIndex(idx);
                      }}
                      hitSlop={6}
                      style={[
                        styles.paginationDot,
                        activeBannerIndex === idx && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Active Order Tracking Card (If available) */}
              {activeBooking && (
                <View style={styles.activeOrderCard}>
                  <View style={styles.activeOrderHeader}>
                    <View style={styles.activePulseBadge}>
                      <View style={styles.activePulseDot} />
                      <Text style={styles.activePulseText}>Đang thực hiện</Text>
                    </View>
                    <Text style={styles.activeOrderCode}>{activeBooking.bookingCode}</Text>
                  </View>

                  <View style={styles.activeOrderBody}>
                    <Image
                      source={{
                        uri:
                          activeStaff?.avatar ||
                          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
                      }}
                      style={styles.activeStaffAvatar}
                    />
                    <View style={styles.activeOrderInfo}>
                      <Text style={styles.activeServiceName}>Vệ sinh gia đình (Gói 3h)</Text>
                      <Text style={styles.activeStaffName}>
                        Nhân viên: {activeStaff?.fullName || 'Nguyễn Văn An'}
                      </Text>
                      <Text style={styles.activeTimeSlot}>
                        {activeBooking.startTime} – {activeBooking.endTime} • Đang làm việc
                      </Text>
                    </View>
                  </View>

                  <View style={styles.activeOrderFooter}>
                    <Pressable
                      style={styles.trackingButton}
                      onPress={() => router.push(`/booking/${activeBooking.id}`)}>
                      <Text style={styles.trackingButtonText}>Theo dõi tiến độ đơn</Text>
                      <IconSymbol name="chevronRight" size={14} color={BrandColors.white} />
                    </Pressable>
                  </View>
                </View>
              )}

              {/* 2 Flow Mode Selector (Mode A vs Mode B) */}
              <View style={styles.startModeSection}>
                <Text style={styles.startModeHeading}>Bạn muốn bắt đầu như thế nào?</Text>

                {/* Card 1: Chọn nhân viên (Mode A) */}
                <Pressable
                  style={styles.startCardModeA}
                  onPress={() =>
                    router.push({
                      pathname: '/booking/new',
                      params: { serviceId: 'srv-001', mode: 'MODE_A' },
                    })
                  }>
                  <View style={styles.iconCircleModeA}>
                    <View style={styles.userIconWrapper}>
                      <View style={styles.userHead} />
                      <View style={styles.userShoulders} />
                    </View>
                  </View>

                  <View style={styles.startCardContent}>
                    <Text style={styles.startCardTitle}>Chọn nhân viên</Text>
                    <Text style={styles.startCardSubtitle}>
                      Chọn người giúp việc ưng ý trước rồi chọn thời gian cụ thể.
                    </Text>
                  </View>

                  <Text style={styles.startCardChevronGreen}>›</Text>
                </Pressable>

                {/* Card 2: Chọn dịch vụ (Mode B) */}
                <Pressable
                  style={styles.startCardModeB}
                  onPress={() => router.push('/services')}>
                  <View style={styles.iconCircleModeB}>
                    <View style={styles.sparkleIconWrapper}>
                      <Text style={styles.sparkleStarText}>✦</Text>
                      <View style={styles.sparkleDot} />
                    </View>
                  </View>

                  <View style={styles.startCardContent}>
                    <Text style={styles.startCardTitle}>Chọn dịch vụ</Text>
                    <Text style={styles.startCardSubtitle}>
                      Chọn gói công việc cần làm, hệ thống tự động ghép nhân viên phù hợp.
                    </Text>
                  </View>

                  <Text style={styles.startCardChevronGray}>›</Text>
                </Pressable>
              </View>

              {/* Section: Add-ons (Section 5 & 9: Supplementary tasks) */}
              <View style={[styles.sectionHeader, { marginTop: Spacing.four }]}>
                <Text style={styles.sectionTitle}>Dịch vụ phụ trợ (Add-on)</Text>
                <Text style={styles.sectionSubtitle}>Chọn kèm dịch vụ chính</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.addonScrollList}>
                {mockAddOns.map((addon) => (
                  <Pressable
                    key={addon.id}
                    style={styles.addonHomeCard}
                    onPress={() =>
                      router.push({
                        pathname: '/booking/new',
                        params: { serviceId: 'srv-001' },
                      })
                    }>
                    <Image source={{ uri: addon.image }} style={styles.addonHomeImg} />
                    <View style={styles.addonHomeBody}>
                      <Text style={styles.addonHomeTitle} numberOfLines={1}>
                        {addon.name}
                      </Text>
                      <Text style={styles.addonHomeDesc} numberOfLines={2}>
                        {addon.description}
                      </Text>
                      <View style={styles.addonHomeFooter}>
                        <Text style={styles.addonHomePrice}>+{formatVND(addon.price)}</Text>
                        <Badge label={`+${addon.durationMinutes}p`} variant="info" size="sm" />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Promotions Showcase (Section 24) */}
              <View style={[styles.sectionHeader, { marginTop: Spacing.four }]}>
                <Text style={styles.sectionTitle}>Ưu đãi áp dụng trên tổng đơn</Text>
              </View>
              {mockPromotions.slice(0, 2).map((promo) => (
                <View key={promo.id} style={styles.promoCard}>
                  <View style={styles.promoIconBox}>
                    <IconSymbol name="receipt" size={20} color={BrandColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.promoCode}>{promo.code}</Text>
                    <Text style={styles.promoDesc}>{promo.description}</Text>
                  </View>
                  <Badge label="Đang áp dụng" variant="success" size="sm" />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationTextWrapper: {
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  cityDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supportConsultantBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportConsultantImg: {
    width: 24,
    height: 24,
  },
  onlineDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: BrandColors.success,
    borderWidth: 1.5,
    borderColor: BrandColors.white,
  },
  headerActionBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: BrandColors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    color: BrandColors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },

  // Staff Workspace
  staffHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    marginBottom: Spacing.three,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.two,
  },
  staffFullName: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  staffSubInfo: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  onlineToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  onlineToggleActive: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: BrandColors.success,
  },
  onlineToggleInactive: {
    backgroundColor: BrandColors.gray100,
  },
  onlineToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray700,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    marginBottom: Spacing.three,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  balanceLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.primaryDark,
    marginTop: 2,
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.primary,
    marginTop: 2,
  },
  balanceWarningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: Spacing.two,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.two,
  },
  balanceWarningText: {
    flex: 1,
    fontSize: 11,
    color: BrandColors.danger,
    lineHeight: 15,
  },
  balanceGoodAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: Spacing.two,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.two,
  },
  balanceGoodText: {
    flex: 1,
    fontSize: 11,
    color: BrandColors.primaryDark,
    lineHeight: 14,
  },
  bonusTrackerRow: {
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray100,
    paddingTop: 8,
  },
  bonusTrackerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  bonusTrackerValue: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },

  // Active Job
  activeJobCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  activeJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pulseDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.primary,
  },
  activeJobTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  jobCode: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray600,
  },
  jobServiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginTop: 2,
  },
  jobAddress: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginTop: 2,
  },
  jobTime: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  jobActionButtons: {
    marginTop: Spacing.two,
  },
  jobDetailBtn: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  jobDetailBtnText: {
    color: BrandColors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Orders
  orderCard: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    marginBottom: Spacing.two,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  orderServiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  orderLocation: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginTop: 2,
  },
  orderIncome: {
    fontSize: 12,
    color: BrandColors.gray700,
    marginTop: 4,
  },
  orderBtnRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: BrandColors.gray300,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.white,
  },
  grabBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 9,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  grabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.white,
  },
  emptyCard: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  emptyCardText: {
    fontSize: 12,
    color: BrandColors.gray500,
  },

  // Customer View
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    marginBottom: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: BrandColors.gray900,
  },
  carouselWrapper: {
    marginBottom: Spacing.three,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  heroCarouselContent: {
    flexDirection: 'row',
  },
  heroBanner: {
    width: '100%',
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    overflow: 'hidden',
    height: 160,
  },
  heroTextContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: Spacing.two,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.white,
    marginTop: 2,
  },
  heroHighlight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A7F3D0',
  },
  heroDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 14,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: BrandColors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  heroImage: {
    width: 100,
    height: 140,
    borderRadius: BorderRadius.md,
  },
  carouselPagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.two,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.gray300,
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: BrandColors.primary,
  },

  // Active Order Tracking
  activeOrderCard: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    marginBottom: Spacing.three,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  activePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.primary,
  },
  activePulseText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  activeOrderCode: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  activeOrderBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeStaffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.two,
  },
  activeOrderInfo: {
    flex: 1,
  },
  activeServiceName: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  activeStaffName: {
    fontSize: 11,
    color: BrandColors.gray600,
  },
  activeTimeSlot: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  activeOrderFooter: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray100,
  },
  trackingButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BrandColors.primary,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  trackingButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.white,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },

  // 2 Flow Mode Selector (Matching Screenshot)
  startModeSection: {
    marginBottom: Spacing.four,
  },
  startModeHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: Spacing.three,
  },
  startCardModeA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF9',
    borderWidth: 1.5,
    borderColor: '#00B074',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#00B074',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  startCardModeB: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  iconCircleModeA: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.2,
    borderColor: '#008C5C',
  },
  userShoulders: {
    width: 22,
    height: 11,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderWidth: 2.2,
    borderBottomWidth: 0,
    borderColor: '#008C5C',
    marginTop: 2,
  },
  iconCircleModeB: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleStarText: {
    fontSize: 26,
    color: '#374151',
    lineHeight: 28,
  },
  sparkleDot: {
    position: 'absolute',
    bottom: -2,
    left: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#374151',
  },
  startCardContent: {
    flex: 1,
    marginHorizontal: 14,
  },
  startCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  startCardSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  startCardChevronGreen: {
    fontSize: 26,
    fontWeight: '700',
    color: '#008C5C',
    lineHeight: 28,
  },
  startCardChevronGray: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4B5563',
    lineHeight: 28,
  },

  // Addons Home List
  addonScrollList: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  addonHomeCard: {
    width: 190,
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    overflow: 'hidden',
  },
  addonHomeImg: {
    width: '100%',
    height: 105,
    backgroundColor: BrandColors.gray100,
  },
  addonHomeBody: {
    padding: Spacing.two,
    justifyContent: 'space-between',
    minHeight: 95,
  },
  addonHomeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  addonHomeDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginVertical: 4,
    lineHeight: 15,
  },
  addonHomeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  addonHomePrice: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },

  // Promotions
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  promoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCode: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  promoDesc: {
    fontSize: 11,
    color: BrandColors.gray600,
  },
});
