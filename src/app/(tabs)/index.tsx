import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  Alert,
  LayoutAnimation,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { Badge, formatVND } from '@/components/common/Badge';
import { RatingStars } from '@/components/common/RatingStars';
import { SearchBar } from '@/components/common/SearchBar';
import { ServiceCategoryCard } from '@/components/common/ServiceCategoryCard';
import { BookingStatusBadge } from '@/components/common/BookingStatusBadge';
import { PromotionCard } from '@/components/common/PromotionCard';
import { useAuth } from '@/context/AuthContext';
import {
  SERVICE_CATEGORIES,
  mockServices,
} from '@/data/services';
import { mockBookings } from '@/data/bookings';
import { mockPromotions } from '@/data/promotions';
import {
  getAddressesByCustomerId,
  getRecentCompletedBookings,
  getServiceById,
  getStaffById,
  mockServiceBundles,
  ServiceBundle,
} from '@/data';

// Hero banners showcasing diverse family services
const HERO_BANNERS = [
  {
    id: 'banner-ac',
    badge: 'Mùa nóng giảm 20%',
    badgeColor: '#EF4444',
    title: 'Vệ sinh máy lạnh 5★',
    subtitle: 'Xịt rửa áp lực cao • Bảo hành 30 ngày',
    desc: 'Làm lạnh sâu tức thì, tiết kiệm 20% điện năng cho cả nhà.',
    serviceId: 'srv-004',
    btnText: 'Đặt thợ ngay',
    gradient: ['#0284C7', '#0369A1'] as [string, string],
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'banner-clean',
    badge: 'Được tin cậy nhất',
    badgeColor: '#10B981',
    title: 'Giúp việc nhà theo giờ',
    subtitle: 'Nhân viên lý lịch chuẩn • Tự chọn thợ',
    desc: 'Linh hoạt 2 - 4 tiếng. Nhà sạch tinh tươm, mẹ an tâm nghỉ ngơi.',
    serviceId: 'srv-001',
    btnText: 'Đặt ca lẻ',
    gradient: ['#0D9488', '#115E59'] as [string, string],
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'banner-child',
    badge: 'Yêu trẻ tận tâm',
    badgeColor: '#F59E0B',
    title: 'Bảo mẫu chăm sóc bé',
    subtitle: 'Chứng chỉ mầm non • Camera giám sát',
    desc: 'Đồng hành cùng bé vui chơi, ăn ngủ đúng giờ khi ba mẹ bận.',
    serviceId: 'srv-009',
    btnText: 'Tìm bảo mẫu',
    gradient: ['#7C3AED', '#6D28D9'] as [string, string],
    image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'banner-deep',
    badge: 'Toàn diện',
    badgeColor: '#3B82F6',
    title: 'Tổng vệ sinh nhà ở',
    subtitle: 'Máy móc công nghiệp • Sạch bóng mọi ngóc ngách',
    desc: 'Tẩy ố kính, chà sàn công nghiệp, dọn về nhà mới trọn gói.',
    serviceId: 'srv-002',
    btnText: 'Khám phá ngay',
    gradient: ['#1E3A8A', '#1E40AF'] as [string, string],
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=80',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { currentCustomer } = useAuth();
  const { width: windowWidth } = useWindowDimensions();
  const bannerGap = 12;
  const bannerSidePadding = 16;
  const bannerWidth = Math.min(windowWidth - bannerSidePadding * 2, 400);
  const horizontalPadding = Math.max(bannerSidePadding, (windowWidth - bannerWidth) / 2);
  const snapInterval = bannerWidth + bannerGap;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);

  const handleToggleCategories = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCategoriesExpanded((prev) => !prev);
  };
  const bannerScrollRef = useRef<ScrollView>(null);
  const activeIndexRef = useRef(0);
  const isInteractingRef = useRef(false);

  // Sync activeIndexRef
  useEffect(() => {
    activeIndexRef.current = activeBannerIndex;
  }, [activeBannerIndex]);

  // Auto-scroll carousel: Tự chuyển đổi qua lại mượt mà mỗi 3.8s
  useEffect(() => {
    const timer = setInterval(() => {
      if (isInteractingRef.current) return;
      const nextIndex = (activeIndexRef.current + 1) % HERO_BANNERS.length;
      bannerScrollRef.current?.scrollTo({
        x: nextIndex * snapInterval,
        animated: true,
      });
      setActiveBannerIndex(nextIndex);
    }, 3800);

    return () => clearInterval(timer);
  }, [snapInterval]);

  // Address
  const addresses = currentCustomer ? getAddressesByCustomerId(currentCustomer.id) : [];
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  // Upcoming active booking
  const upcomingBooking = mockBookings.find(
    (b) =>
      b.customerId === (currentCustomer?.id || 'cust-001') &&
      ['CONFIRMED', 'STAFF_ASSIGNED', 'IN_PROGRESS', 'MATCHING'].includes(b.status)
  );

  // Popular and Recommended Services
  const popularServices = mockServices.filter((s) => s.isPopular).slice(0, 6);
  const recommendedServices = mockServices.filter((s) => !s.isPopular).slice(0, 4);

  // Recent completed bookings for quick re-booking
  const recentCompletedBookings = getRecentCompletedBookings(currentCustomer?.id || 'cust-001');

  // Quick Rebook Modal state
  const [rebookModalVisible, setRebookModalVisible] = useState(false);
  const [selectedRebookBooking, setSelectedRebookBooking] = useState<any>(null);
  const [rebookSlot, setRebookSlot] = useState('09:00');
  const [rebookDayText, setRebookDayText] = useState('Sáng mai (08:30 - 11:30)');
  const [rebookKeepStaff, setRebookKeepStaff] = useState(true);

  // Bundle Modal state
  const [selectedBundle, setSelectedBundle] = useState<ServiceBundle | null>(null);

  const handleOpenRebook = (b: any) => {
    setSelectedRebookBooking(b);
    setRebookModalVisible(true);
  };

  const handleConfirmQuickRebook = () => {
    if (!selectedRebookBooking) return;
    setRebookModalVisible(false);
    router.push({
      pathname: '/booking/new',
      params: {
        rebook: 'true',
        serviceId: selectedRebookBooking.serviceId,
        packageId: selectedRebookBooking.packageId,
        staffId: rebookKeepStaff ? selectedRebookBooking.staffId : undefined,
        mode: rebookKeepStaff && selectedRebookBooking.staffId ? 'MODE_A' : 'MODE_B',
        addressId: selectedRebookBooking.addressId,
      },
    });
  };

  const handleBookBundle = (bundle: ServiceBundle) => {
    setSelectedBundle(null);
    router.push({
      pathname: '/booking/new',
      params: {
        serviceId: bundle.primaryServiceId,
        mode: 'MODE_B',
      },
    });
  };

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    if (index >= 0 && index < HERO_BANNERS.length && index !== activeBannerIndex) {
      setActiveBannerIndex(index);
    }
  };

  const handleScrollToBanner = (index: number) => {
    bannerScrollRef.current?.scrollTo({
      x: index * snapInterval,
      animated: true,
    });
    setActiveBannerIndex(index);
  };

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* TOP HEADER: User Greeting, Address, Notifications */}
        <View style={styles.topHeader}>
          <Pressable
            style={styles.profileRow}
            onPress={() => router.push('/(tabs)/profile')}>
            <Image
              source={{
                uri:
                  currentCustomer?.avatar ||
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
              }}
              style={styles.userAvatar}
            />
            <View style={styles.userMeta}>
              <Text style={styles.greetingText}>Xin chào bạn,</Text>
              <Text style={styles.userName}>{currentCustomer?.fullName || 'Khách hàng'}</Text>
            </View>
          </Pressable>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.notifBtn}
              onPress={() => router.push('/notifications' as any)}>
              <IconSymbol name="bell" size={22} color={BrandColors.gray800} />
              <View style={styles.notifBadge} />
            </Pressable>

          </View>
        </View>

        {/* Address Selector Pill */}
        <Pressable
          style={styles.addressBar}
          onPress={() => router.push('/account/addresses')}>
          <IconSymbol name="location" size={16} color={BrandColors.primary} />
          <Text numberOfLines={1} style={styles.addressText}>
            {defaultAddress
              ? `${defaultAddress.title}: ${defaultAddress.streetAddress}, ${defaultAddress.district}`
              : 'Chọn địa chỉ phục vụ của bạn...'}
          </Text>
          <IconSymbol name="chevronRight" size={14} color={BrandColors.gray400} />
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {/* SEARCH BAR */}
          <View style={styles.searchSection}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm máy lạnh, dọn nhà, bảo mẫu, nấu ăn..."
              onSubmit={() => {
                if (searchQuery.trim()) {
                  router.push({
                    pathname: '/(tabs)/services',
                    params: { q: searchQuery.trim() },
                  });
                }
              }}
            />
          </View>

          {/* ACTIVE BOOKING PREVIEW (If exists) */}
          {upcomingBooking && (
            <Pressable
              style={styles.upcomingBox}
              onPress={() => router.push(`/booking/${upcomingBooking.id}`)}>
              <View style={styles.upcomingHeader}>
                <View style={styles.upcomingDotRow}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.upcomingTitle}>Đơn dịch vụ sắp tới</Text>
                </View>
                <BookingStatusBadge status={upcomingBooking.status} size="sm" />
              </View>

              <Text style={styles.upcomingServiceName}>
                {mockServices.find((s) => s.id === upcomingBooking.serviceId)?.name ||
                  'Dịch vụ gia đình'}
              </Text>
              <Text style={styles.upcomingTime}>
                📅 {upcomingBooking.bookingDate} • {upcomingBooking.startTime} - {upcomingBooking.endTime}
              </Text>
            </Pressable>
          )}

          {/* QUICK RE-BOOK SECTION (For Returning Customers) */}
          {recentCompletedBookings.length > 0 && (
            <View style={styles.rebookSection}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.sectionTitle}>Đặt lại dịch vụ đã dùng</Text>
                    <View style={styles.rebookPill}>
                      <Text style={styles.rebookPillText}>⚡ 1-chạm</Text>
                    </View>
                  </View>
                  <Text style={styles.sectionSubtitle}>Dành cho bạn • Nhân viên quen thuộc • Tiết kiệm thời gian</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: 12 }}>
                {recentCompletedBookings.slice(0, 3).map((b) => {
                  const srv = getServiceById(b.serviceId);
                  const staff = b.staffId ? getStaffById(b.staffId) : undefined;
                  const bAddr = addresses.find((a) => a.id === b.addressId) || defaultAddress;
                  return (
                    <View key={b.id} style={styles.rebookCard}>
                      <View style={styles.rebookCardHeader}>
                        <View style={styles.rebookTagRow}>
                          <Text style={styles.rebookBadge}>⭐ Đã hoàn thành 5.0★</Text>
                          {staff && <Text style={styles.rebookStaffTag}>Thợ quen</Text>}
                        </View>
                        <Text style={styles.rebookPrice}>{formatVND(b.totalAmount)}</Text>
                      </View>

                      <View style={styles.rebookMainRow}>
                        {srv?.image ? (
                          <Image source={{ uri: srv.image }} style={styles.rebookThumb} />
                        ) : (
                          <View style={styles.rebookThumbPlaceholder}>
                            <Text style={{ fontSize: 18 }}>🧹</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={styles.rebookServiceName}>
                            {srv?.name || 'Dịch vụ gia đình'}
                          </Text>
                          {staff && (
                            <View style={styles.rebookStaffRow}>
                              <Image source={{ uri: staff.avatar }} style={styles.rebookStaffAvatar} />
                              <Text style={styles.rebookStaffName} numberOfLines={1}>
                                {staff.fullName} ({staff.rating}★)
                              </Text>
                            </View>
                          )}
                          <Text numberOfLines={1} style={styles.rebookAddrText}>
                            📍 {bAddr?.fullAddress?.split(',')[0] || 'TP. Hồ Chí Minh'}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={styles.rebookActionBtn}
                        onPress={() => handleOpenRebook(b)}>
                        <Text style={styles.rebookActionBtnText}>⚡ Đặt lại ngay (1-chạm)</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* HERO BANNERS CAROUSEL */}
          <View style={styles.bannerContainer}>
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={snapInterval}
              snapToAlignment="start"
              onScroll={handleBannerScroll}
              scrollEventThrottle={16}
              onScrollBeginDrag={() => {
                isInteractingRef.current = true;
              }}
              onScrollEndDrag={() => {
                setTimeout(() => {
                  isInteractingRef.current = false;
                }, 3000);
              }}
              onMomentumScrollEnd={(e) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / snapInterval);
                const safeIndex = Math.max(0, Math.min(index, HERO_BANNERS.length - 1));
                setActiveBannerIndex(safeIndex);
                setTimeout(() => {
                  isInteractingRef.current = false;
                }, 2000);
              }}
              contentContainerStyle={{
                paddingHorizontal: horizontalPadding,
                gap: bannerGap,
              }}>
              {HERO_BANNERS.map((banner) => (
                <Pressable
                  key={banner.id}
                  style={[styles.bannerCard, { width: bannerWidth }]}
                  onPress={() =>
                    router.push({
                      pathname: '/service/[id]',
                      params: { id: banner.serviceId },
                    })
                  }>
                  <LinearGradient colors={banner.gradient} style={styles.bannerGradient}>
                    <View style={styles.bannerContentCol}>
                      <View
                        style={[
                          styles.bannerBadge,
                          { backgroundColor: banner.badgeColor },
                        ]}>
                        <Text style={styles.bannerBadgeText}>{banner.badge}</Text>
                      </View>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                      <Text numberOfLines={2} style={styles.bannerDesc}>
                        {banner.desc}
                      </Text>
                      <Pressable
                        style={styles.bannerCtaBtn}
                        onPress={() =>
                          router.push({
                            pathname: '/service/[id]',
                            params: { id: banner.serviceId },
                          })
                        }>
                        <Text style={styles.bannerCtaText}>{banner.btnText} →</Text>
                      </Pressable>
                    </View>

                    <Image source={{ uri: banner.image }} style={styles.bannerImage} />
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>

            {/* Pagination dots (clickable & smooth) */}
            <View style={styles.paginationRow}>
              {HERO_BANNERS.map((_, i) => (
                <Pressable
                  key={i}
                  hitSlop={8}
                  onPress={() => handleScrollToBanner(i)}
                  style={[
                    styles.paginationDot,
                    activeBannerIndex === i && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* SERVICE CATEGORIES GRID (2 rows default, expandable) */}
          <View style={styles.categorySectionCard}>
            <View style={styles.categorySectionHeader}>
              <Text style={styles.categorySectionTitle}>Danh mục dịch vụ</Text>
              <Pressable onPress={handleToggleCategories}>
                <Text style={styles.categorySectionSeeAll}>
                  {isCategoriesExpanded ? 'Thu gọn danh mục ↑' : 'Xem tất cả 16 nhóm →'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.categoriesGrid}>
              {(isCategoriesExpanded ? SERVICE_CATEGORIES : SERVICE_CATEGORIES.slice(0, 8)).map((cat) => (
                <ServiceCategoryCard
                  key={cat.id}
                  category={cat}
                  onPress={() => {
                    const service = mockServices.find((item) => item.categoryId === cat.id);
                    if (service) {
                      router.push(`/service/${service.id}`);
                    }
                  }}
                />
              ))}
            </View>

            {/* Expand / Collapse Button with arrow */}
            <Pressable
              style={styles.expandCategoriesButton}
              onPress={handleToggleCategories}
              hitSlop={8}>
              <Text style={styles.expandCategoriesText}>
                {isCategoriesExpanded ? 'Thu gọn danh mục' : 'Xem thêm 8 nhóm dịch vụ'}
              </Text>
              <View style={styles.expandCategoriesArrowBox}>
                <Text style={styles.expandCategoriesArrow}>
                  {isCategoriesExpanded ? '▲' : '▼'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* POPULAR SERVICES SECTION */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Dịch vụ phổ biến</Text>
              <Text style={styles.sectionSubtitle}>Khách hàng tin tưởng đặt nhiều nhất</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/services')}>
              <Text style={styles.seeAllText}>Xem thêm</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: 12 }}>
            {popularServices.map((service) => (
              <Pressable
                key={service.id}
                style={styles.popularCard}
                onPress={() =>
                  router.push({
                    pathname: '/service/[id]',
                    params: { id: service.id },
                  })
                }>
                <Image source={{ uri: service.image }} style={styles.popularImage} />
                <View style={styles.popularBody}>
                  <Text numberOfLines={1} style={styles.popularTitle}>
                    {service.name}
                  </Text>
                  <RatingStars
                    rating={service.rating}
                    size={11}
                    reviewCount={service.reviewCount}
                  />
                  <View style={styles.popularFooter}>
                    <Text style={styles.popularPrice}>
                      {formatVND(service.basePrice)}
                      <Text style={styles.popularUnit}>/{service.unit}</Text>
                    </Text>
                    <Pressable
                      style={styles.miniBookBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({
                          pathname: '/booking/new',
                          params: { serviceId: service.id },
                        });
                      }}>
                      <Text style={styles.miniBookText}>Đặt</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* SMART AI SERVICE BUNDLES SECTION */}
          <View style={[styles.sectionHeaderRow, { marginTop: Spacing.four }]}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>💡</Text>
                <Text style={styles.sectionTitle}>Combo Gợi ý thông minh (AI Bundle)</Text>
              </View>
              <Text style={styles.sectionSubtitle}>Kết hợp dịch vụ liên quan • Tiết kiệm đến 20% chi phí</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: 12 }}>
            {mockServiceBundles.map((bundle) => (
              <Pressable
                key={bundle.id}
                style={styles.bundleCard}
                onPress={() => setSelectedBundle(bundle)}>
                <Image source={{ uri: bundle.bannerImage }} style={styles.bundleImage} />
                <View style={styles.bundleBadgeFloat}>
                  <Text style={styles.bundleBadgeFloatText}>{bundle.badgeText}</Text>
                </View>
                <View style={styles.bundleBody}>
                  <View style={styles.bundleTagRow}>
                    <View style={styles.bundleTagPill}>
                      <Text style={styles.bundleTagText}>{bundle.tag}</Text>
                    </View>
                    <Text style={styles.bundleSaveText}>Tiết kiệm {formatVND(bundle.discountAmount)}</Text>
                  </View>
                  <Text style={styles.bundleTitle} numberOfLines={1}>
                    {bundle.title}
                  </Text>
                  <Text style={styles.bundleSubtitle} numberOfLines={1}>
                    {bundle.subtitle}
                  </Text>
                  <Text style={styles.bundleReason} numberOfLines={2}>
                    🤖 {bundle.aiReason}
                  </Text>
                  <View style={styles.bundleFooter}>
                    <View>
                      <Text style={styles.bundleOldPrice}>{formatVND(bundle.originalPrice)}</Text>
                      <Text style={styles.bundlePrice}>{formatVND(bundle.bundlePrice)}</Text>
                    </View>
                    <Pressable
                      style={styles.bundleBookBtn}
                      onPress={() => setSelectedBundle(bundle)}>
                      <Text style={styles.bundleBookBtnText}>Xem & Đặt</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* RECOMMENDED SERVICES FOR HOME */}
          <View style={[styles.sectionHeaderRow, { marginTop: Spacing.four }]}>
            <View>
              <Text style={styles.sectionTitle}>Gợi ý cho gia đình bạn</Text>
              <Text style={styles.sectionSubtitle}>Dịch vụ tiện ích nâng tầm chất lượng sống</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: Spacing.three }}>
            {recommendedServices.map((service) => (
              <Pressable
                key={service.id}
                style={styles.recItem}
                onPress={() =>
                  router.push({
                    pathname: '/service/[id]',
                    params: { id: service.id },
                  })
                }>
                <Image source={{ uri: service.image }} style={styles.recThumb} />
                <View style={styles.recContent}>
                  <Text numberOfLines={1} style={styles.recTitle}>
                    {service.name}
                  </Text>
                  <Text numberOfLines={2} style={styles.recDesc}>
                    {service.shortDescription || service.description}
                  </Text>
                  <View style={styles.recFooter}>
                    <Text style={styles.recPrice}>
                      {formatVND(service.basePrice)}
                      <Text style={styles.popularUnit}>/{service.unit}</Text>
                    </Text>
                    <RatingStars rating={service.rating} size={11} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* PROMOTIONS & VOUCHERS */}
          <View style={[styles.sectionHeaderRow, { marginTop: Spacing.four }]}>
            <View>
              <Text style={styles.sectionTitle}>Mã giảm giá hấp dẫn</Text>
              <Text style={styles.sectionSubtitle}>Áp dụng ngay khi thanh toán đơn hàng</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: Spacing.three }}>
            {mockPromotions.slice(0, 2).map((promo) => (
              <PromotionCard
                key={promo.id}
                promotion={promo}
                onApply={() => {
                  router.push({
                    pathname: '/(tabs)/services',
                  });
                }}
              />
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FLOATING AI ASSISTANT BUTTON */}
        <Pressable
          style={styles.floatingAIBtn}
          onPress={() => router.push('/ai')}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.floatingAIGradient}>
            <Image
              source={require('@/assets/images/ai-mascot.png')}
              style={styles.aiMascotImg}
            />
            <View style={styles.aiBtnTextCol}>
              <Text style={styles.aiBtnTitle}>Trợ lý AI</Text>
              <Text style={styles.aiBtnSub}>Hỏi dịch vụ 24/7</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* MODAL 1: QUICK RE-BOOK FOR RETURNING CUSTOMERS */}
        <Modal
          visible={rebookModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setRebookModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.rebookModalContent}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>⚡ Đặt lại nhanh (1-Chạm)</Text>
                  <Text style={styles.modalSubtitle}>Xác nhận nhanh không cần nhập lại thông tin</Text>
                </View>
                <Pressable onPress={() => setRebookModalVisible(false)} hitSlop={8}>
                  <IconSymbol name="close" size={22} color={BrandColors.gray600} />
                </Pressable>
              </View>

              {selectedRebookBooking && (() => {
                const srv = getServiceById(selectedRebookBooking.serviceId);
                const staff = selectedRebookBooking.staffId ? getStaffById(selectedRebookBooking.staffId) : undefined;
                return (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                    {/* Service Info Box */}
                    <View style={styles.modalServiceBox}>
                      {srv?.image && <Image source={{ uri: srv.image }} style={styles.modalServiceThumb} />}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalServiceName}>{srv?.name}</Text>
                        <Text style={styles.modalServiceSub}>
                          {selectedRebookBooking.mode === 'MODE_A' ? 'Tự chọn nhân viên' : 'Hệ thống điều phối'}
                        </Text>
                        <Text style={styles.modalServicePrice}>{formatVND(selectedRebookBooking.totalAmount)}</Text>
                      </View>
                    </View>

                    {/* Staff Option */}
                    {staff && (
                      <View style={styles.modalOptionCard}>
                        <Text style={styles.modalOptionHeading}>Nhân viên thực hiện</Text>
                        <Pressable
                          style={[styles.staffOptionRow, rebookKeepStaff && styles.staffOptionRowActive]}
                          onPress={() => setRebookKeepStaff(!rebookKeepStaff)}>
                          <Image source={{ uri: staff.avatar }} style={styles.staffOptionAvatar} />
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.staffOptionName}>{staff.fullName}</Text>
                              <View style={styles.familiarStaffPill}>
                                <Text style={styles.familiarStaffText}>Thợ quen</Text>
                              </View>
                            </View>
                            <Text style={styles.staffOptionMeta}>⭐ {staff.rating} • Đã phục vụ bạn trước đây</Text>
                          </View>
                          <View style={[styles.modalRadio, rebookKeepStaff && styles.modalRadioActive]}>
                            {rebookKeepStaff && <View style={styles.modalRadioDot} />}
                          </View>
                        </Pressable>
                        {!rebookKeepStaff && (
                          <Text style={styles.autoMatchHint}>
                            ⚡ Hệ thống sẽ tự động tìm nhân viên 5★ gần bạn nhất tại thời điểm đặt ca.
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Quick Time Options */}
                    <View style={styles.modalOptionCard}>
                      <Text style={styles.modalOptionHeading}>Chọn thời gian làm việc mới</Text>
                      <View style={styles.modalTimeSlotsCol}>
                        {[
                          { id: '1', title: 'Sáng mai (08:30 - 11:30)', time: '08:30' },
                          { id: '2', title: 'Chiều mai (14:00 - 17:00)', time: '14:00' },
                          { id: '3', title: 'Thứ Bảy cuối tuần (09:00 - 12:00)', time: '09:00' },
                        ].map((slot) => {
                          const isPicked = rebookDayText === slot.title;
                          return (
                            <Pressable
                              key={slot.id}
                              style={[styles.modalTimeSlotBtn, isPicked && styles.modalTimeSlotBtnActive]}
                              onPress={() => {
                                setRebookDayText(slot.title);
                                setRebookSlot(slot.time);
                              }}>
                              <Text style={[styles.modalTimeSlotText, isPicked && styles.modalTimeSlotTextActive]}>
                                🕒 {slot.title}
                              </Text>
                              {isPicked && <Text style={{ color: BrandColors.primary, fontWeight: '800' }}>✓</Text>}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {/* Address Box */}
                    <View style={styles.modalOptionCard}>
                      <Text style={styles.modalOptionHeading}>Địa chỉ thực hiện</Text>
                      <View style={styles.modalAddrRow}>
                        <IconSymbol name="location" size={18} color={BrandColors.primary} />
                        <Text numberOfLines={2} style={styles.modalAddrText}>
                          {(addresses.find((a) => a.id === selectedRebookBooking.addressId) || defaultAddress)?.fullAddress || 'Địa chỉ mặc định của bạn'}
                        </Text>
                      </View>
                    </View>
                  </ScrollView>
                );
              })()}

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={styles.modalCustomizeBtn}
                  onPress={() => {
                    setRebookModalVisible(false);
                    if (selectedRebookBooking) {
                      router.push({
                        pathname: '/booking/new',
                        params: {
                          rebook: 'true',
                          serviceId: selectedRebookBooking.serviceId,
                          packageId: selectedRebookBooking.packageId,
                          staffId: selectedRebookBooking.staffId,
                          mode: selectedRebookBooking.mode,
                          addressId: selectedRebookBooking.addressId,
                        },
                      });
                    }
                  }}>
                  <Text style={styles.modalCustomizeText}>Tùy chỉnh thêm</Text>
                </Pressable>

                <Pressable
                  style={styles.modalConfirmBtn}
                  onPress={handleConfirmQuickRebook}>
                  <Text style={styles.modalConfirmText}>⚡ Xác nhận đặt lại</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: SMART SERVICE BUNDLE DETAIL */}
        <Modal
          visible={!!selectedBundle}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedBundle(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.rebookModalContent}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.modalTitle}>💡 {selectedBundle?.title}</Text>
                  <Text style={styles.modalSubtitle}>{selectedBundle?.subtitle}</Text>
                </View>
                <Pressable onPress={() => setSelectedBundle(null)} hitSlop={8}>
                  <IconSymbol name="close" size={22} color={BrandColors.gray600} />
                </Pressable>
              </View>

              {selectedBundle && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  <Image source={{ uri: selectedBundle.bannerImage }} style={styles.modalBundleHero} />

                  <View style={styles.modalAiBox}>
                    <Text style={styles.modalAiHeading}>🤖 Phân tích thông minh của AI:</Text>
                    <Text style={styles.modalAiDesc}>{selectedBundle.aiReason}</Text>
                  </View>

                  <Text style={styles.modalSectionTitle}>Dịch vụ bao gồm trong combo:</Text>
                  {selectedBundle.includedServiceIds.map((sid, idx) => {
                    const s = getServiceById(sid);
                    return (
                      <View key={idx} style={styles.modalBundleItem}>
                        <Text style={styles.modalBundleItemIcon}>✓</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modalBundleItemName}>{s?.name || sid}</Text>
                          <Text style={styles.modalBundleItemPrice}>{formatVND(s?.basePrice || 150000)}</Text>
                        </View>
                      </View>
                    );
                  })}

                  <View style={styles.modalPriceSummaryBox}>
                    <View style={styles.modalPriceRow}>
                      <Text style={styles.modalPriceLabel}>Giá gốc các dịch vụ:</Text>
                      <Text style={styles.modalPriceOld}>{formatVND(selectedBundle.originalPrice)}</Text>
                    </View>
                    <View style={styles.modalPriceRow}>
                      <Text style={styles.modalPriceLabel}>Tiết kiệm ưu đãi Combo:</Text>
                      <Text style={styles.modalPriceSave}>-{formatVND(selectedBundle.discountAmount)}</Text>
                    </View>
                    <View style={styles.modalPriceDivider} />
                    <View style={styles.modalPriceRow}>
                      <Text style={styles.modalPriceFinalLabel}>Giá trọn gói Combo:</Text>
                      <Text style={styles.modalPriceFinalVal}>{formatVND(selectedBundle.bundlePrice)}</Text>
                    </View>
                  </View>
                </ScrollView>
              )}

              <View style={styles.modalBtnRow}>
                <Pressable
                  style={[styles.modalConfirmBtn, { flex: 1 }]}
                  onPress={() => selectedBundle && handleBookBundle(selectedBundle)}>
                  <Text style={styles.modalConfirmText}>
                    Đặt Combo Ngay (Tiết kiệm {selectedBundle ? formatVND(selectedBundle.discountAmount) : ''}) →
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  scrollContent: {
    paddingBottom: 24,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: 8,
    paddingBottom: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: BrandColors.primary,
  },
  userMeta: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.danger,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: Spacing.three,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: BrandColors.gray700,
    fontWeight: '500',
  },
  searchSection: {
    paddingHorizontal: Spacing.three,
    marginVertical: Spacing.two,
  },
  upcomingBox: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  upcomingDotRow: {
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
  upcomingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
    textTransform: 'uppercase',
  },
  upcomingServiceName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  upcomingTime: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginTop: 4,
  },
  bannerContainer: {
    marginBottom: Spacing.three,
  },
  bannerCard: {
    height: 160,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  bannerGradient: {
    flex: 1,
    flexDirection: 'row',
    padding: Spacing.three,
  },
  bannerContentCol: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  bannerBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  bannerDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 15,
  },
  bannerCtaBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  bannerCtaText: {
    fontSize: 11,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  bannerImage: {
    width: 110,
    height: '100%',
    borderRadius: BorderRadius.lg,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  paginationDotActive: {
    width: 22,
    height: 7,
    borderRadius: 4,
    backgroundColor: BrandColors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  categorySectionCard: {
    marginHorizontal: Spacing.three,
    backgroundColor: '#DEF2E9',
    borderRadius: 24,
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 10,
    marginBottom: Spacing.three,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  categorySectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#133E2B',
    letterSpacing: -0.3,
  },
  categorySectionSeeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  expandCategoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    marginTop: 4,
    marginBottom: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: '#CBE7DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expandCategoriesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  expandCategoriesArrowBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandCategoriesArrow: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  popularCard: {
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  popularImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E2E8F0',
  },
  popularBody: {
    padding: 10,
  },
  popularTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 4,
  },
  popularFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  popularPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  popularUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: BrandColors.gray500,
  },
  miniBookBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  miniBookText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  recItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: 10,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  recThumb: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#E2E8F0',
  },
  recContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  recDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
    lineHeight: 15,
  },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  floatingAIBtn: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    borderRadius: BorderRadius.full,
    elevation: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingAIGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    gap: 8,
  },
  aiMascotImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  aiBtnTextCol: {
    justifyContent: 'center',
  },
  aiBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  aiBtnSub: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  // Rebook Section & Cards
  rebookSection: {
    marginBottom: Spacing.two,
  },
  rebookPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  rebookPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  rebookCard: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  rebookCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rebookTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rebookBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.primary,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rebookStaffTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rebookPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  rebookMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  rebookThumb: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
  },
  rebookThumbPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebookServiceName: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  rebookStaffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  rebookStaffAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  rebookStaffName: {
    fontSize: 11,
    color: BrandColors.gray700,
    fontWeight: '600',
  },
  rebookAddrText: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  rebookActionBtn: {
    backgroundColor: BrandColors.primaryLight,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  rebookActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },

  // Smart Bundle Cards
  bundleCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bundleImage: {
    width: '100%',
    height: 120,
  },
  bundleBadgeFloat: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  bundleBadgeFloatText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  bundleBody: {
    padding: 12,
  },
  bundleTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bundleTagPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bundleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  bundleSaveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  bundleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  bundleSubtitle: {
    fontSize: 11,
    color: BrandColors.gray600,
    marginBottom: 6,
  },
  bundleReason: {
    fontSize: 10,
    color: BrandColors.gray500,
    lineHeight: 14,
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
    marginBottom: 10,
  },
  bundleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  bundleOldPrice: {
    fontSize: 11,
    color: BrandColors.gray400,
    textDecorationLine: 'line-through',
  },
  bundlePrice: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  bundleBookBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  bundleBookBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Modal Common Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  rebookModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  modalSubtitle: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  modalServiceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: BorderRadius.lg,
    marginBottom: 12,
  },
  modalServiceThumb: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  modalServiceName: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  modalServiceSub: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginVertical: 2,
  },
  modalServicePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  modalOptionCard: {
    marginBottom: 12,
  },
  modalOptionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray800,
    marginBottom: 6,
  },
  staffOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.lg,
    gap: 10,
  },
  staffOptionRowActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  staffOptionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  staffOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  familiarStaffPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  familiarStaffText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  staffOptionMeta: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  modalRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRadioActive: {
    borderColor: BrandColors.primary,
  },
  modalRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.primary,
  },
  autoMatchHint: {
    fontSize: 11,
    color: BrandColors.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalTimeSlotsCol: {
    gap: 6,
  },
  modalTimeSlotBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTimeSlotBtnActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#ECFDF5',
  },
  modalTimeSlotText: {
    fontSize: 12,
    color: BrandColors.gray700,
    fontWeight: '600',
  },
  modalTimeSlotTextActive: {
    color: BrandColors.primaryDark,
    fontWeight: '800',
  },
  modalAddrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  modalAddrText: {
    fontSize: 12,
    color: BrandColors.gray700,
    flex: 1,
    lineHeight: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalCustomizeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  modalCustomizeText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray700,
  },
  modalConfirmBtn: {
    flex: 1.5,
    backgroundColor: BrandColors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },

  // Bundle Modal Details
  modalBundleHero: {
    width: '100%',
    height: 140,
    borderRadius: BorderRadius.lg,
    marginBottom: 10,
  },
  modalAiBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginBottom: 12,
  },
  modalAiHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.primaryDark,
    marginBottom: 2,
  },
  modalAiDesc: {
    fontSize: 11,
    color: BrandColors.gray700,
    lineHeight: 16,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 8,
  },
  modalBundleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalBundleItemIcon: {
    color: BrandColors.primary,
    fontWeight: '800',
  },
  modalBundleItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray800,
  },
  modalBundleItemPrice: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  modalPriceSummaryBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: BorderRadius.md,
    marginTop: 12,
    gap: 4,
  },
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalPriceLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  modalPriceOld: {
    fontSize: 11,
    color: BrandColors.gray400,
    textDecorationLine: 'line-through',
  },
  modalPriceSave: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  modalPriceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  modalPriceFinalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  modalPriceFinalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primary,
  },
});
