import { useBottomTabSpacing } from '@/components/common/TabImageIcon';
import { StaffResponseDecision } from '@/components/booking/StaffResponseWaiting';
import { needsStaffResponse } from '@/utils/staff-response';
import { remoteImageSource } from '@/utils/image-source';
import { staffView } from '@/hooks/use-booking-detail';
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
  type LayoutChangeEvent,
  Modal,
  Alert,
  AppState,
  LayoutAnimation,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { formatVND } from '@/components/common/Badge';
import { RatingStars } from '@/components/common/RatingStars';
import { ServiceCategoryCard } from '@/components/common/ServiceCategoryCard';
import { BookingStatusBadge } from '@/components/common/BookingStatusBadge';
import { PromotionCard } from '@/components/common/PromotionCard';
import { HomeBlogRow } from '@/components/blog/HomeBlogRow';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { NotificationBadge } from '@/components/common/NotificationBadge';
import { useNotifications } from '@/hooks/use-notifications';
import { SERVICE_CATEGORIES } from '@/data/services';
import { useCustomerBookings } from '@/hooks/use-customer-bookings';
import { useBookingCatalog } from '@/hooks/use-booking-catalog';
import { bookingServiceView } from '@/data/connectedBookings';
import type { ServiceBundle } from '@/data/serviceBundles';
import { useCatalogResource } from '@/hooks/use-catalog-resource';
import { useCustomerAddresses } from '@/hooks/use-customer-addresses';
import type { Promotion } from '@/types/service';
import type { CatalogHomeBanner } from '@/api/catalog-types';
import { useBookingResume } from '@/hooks/use-booking-resume';


const bannerThemes: Record<CatalogHomeBanner['theme'], { gradient: [string, string]; badge: string }> = {
  BLUE: { gradient: ['#0284C7', '#0369A1'], badge: '#B91C1C' },
  GREEN: { gradient: ['#0D9488', '#115E59'], badge: '#047857' },
  ORANGE: { gradient: ['#C2410C', '#9A3412'], badge: '#7C2D12' },
  NAVY: { gradient: ['#1E3A8A', '#1E40AF'], badge: '#1D4ED8' },
};

export default function HomeScreen() {
  const { height: bottomTabHeight } = useBottomTabSpacing();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { active: isFocused, revision: catalogRevision } = useBookingResume();
  const { currentCustomer } = useAuth();
  const bookingResource = useCustomerBookings(); const catalog = useBookingCatalog(catalogRevision);
  const bannerResource = useCatalogResource<CatalogHomeBanner[]>('/home-banners', catalogRevision);
  const banners = bannerResource.data ?? [];
  const bannerOrder = banners.map(banner => banner.id).join(',');
  const services = catalog.services;
  const getServiceById = (id: string) => services.find(s=>s.id===id) || (bookingResource.bookings.find(b=>b.serviceId===id) ? bookingServiceView(bookingResource.bookings.find(b=>b.serviceId===id)!) : undefined);
  const serviceBundles: ServiceBundle[] = catalog.packages.slice(0,4).map(p=>{ const service=services.find(s=>s.id===p.serviceId);return {id:p.id,title:p.name,subtitle:p.description,badgeText:'Gói dịch vụ',discountPercent:0,discountAmount:0,originalPrice:p.price,bundlePrice:p.price,primaryServiceId:p.serviceId,includedServiceIds:[p.serviceId],bannerImage:service?.image || '',aiReason:p.recommendedFor || '',tag:service?.name || ''}; });
  const { unreadCount } = useNotifications();
  const { width: windowWidth } = useWindowDimensions();
  const bannerGap = 12;
  const bannerSidePadding = 16;
  const bannerWidth = Math.min(windowWidth - bannerSidePadding * 2, 400);
  const horizontalPadding = Math.max(bannerSidePadding, (windowWidth - bannerWidth) / 2);
  const snapInterval = bannerWidth + bannerGap;

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const [showFloatingAI, setShowFloatingAI] = useState(true);
  const floatingAIHeight = useRef(48);
  const [blogVisible, setBlogVisible] = useState(false);
  const blogViewport = useRef({ top: 0, height: 0, rowTop: 0, rowHeight: 0, visible: false });

  const updateBlogVisibility = () => {
    const viewport = blogViewport.current;
    const overlap = Math.min(viewport.top + viewport.height, viewport.rowTop + viewport.rowHeight)
      - Math.max(viewport.top, viewport.rowTop);
    const visible = viewport.rowHeight > 0 && overlap >= Math.min(96, viewport.rowHeight);
    if (visible !== viewport.visible) {
      viewport.visible = visible;
      setBlogVisible(visible);
    }
  };
  const handleBlogLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    blogViewport.current.rowTop = layout.y;
    blogViewport.current.rowHeight = layout.height;
    updateBlogVisibility();
  };

  const handleToggleCategories = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCategoriesExpanded((prev) => !prev);
  };
  const bannerScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const activeIndexRef = useRef(0);
  const isInteractingRef = useRef(false);

  useEffect(() => {
    activeIndexRef.current = 0;
    setActiveBannerIndex(0);
    bannerScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [bannerOrder, snapInterval]);

  // Sync activeIndexRef
  useEffect(() => {
    activeIndexRef.current = activeBannerIndex;
  }, [activeBannerIndex]);

  // Auto-scroll carousel: Tự chuyển đổi qua lại mượt mà mỗi 3.8s
  useEffect(() => {
    if (!isFocused || banners.length < 2) return;
    const timer = setInterval(() => {
      if (isInteractingRef.current || AppState.currentState !== 'active') return;
      const nextIndex = (activeIndexRef.current + 1) % banners.length;
      bannerScrollRef.current?.scrollTo({
        x: nextIndex * snapInterval,
        animated: true,
      });
      setActiveBannerIndex(nextIndex);
    }, 3800);

    return () => clearInterval(timer);
  }, [snapInterval, isFocused, banners.length]);

  // Address
  const { addresses } = useCustomerAddresses();
  const promotionResult = useCatalogResource<(Omit<Promotion, 'id' | 'maxDiscountAmount' | 'usageLimit'> & { id: number; maxDiscountAmount: number | null; usageLimit: number | null })[]>('/promotions');
  const promotions: Promotion[] = (promotionResult.data || []).map(item => ({ ...item, id: String(item.id), maxDiscountAmount: item.maxDiscountAmount ?? undefined, usageLimit: item.usageLimit ?? 0 }));
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

  const waitingBookings = bookingResource.bookings.filter(needsStaffResponse);
  const expiredBooking = waitingBookings.find(booking => booking.staffWaitState === 'EXPIRED');

  // Upcoming active booking
  const upcomingBooking = bookingResource.bookings.find(
    (b) =>
      b.customerId === currentCustomer?.id && !needsStaffResponse(b) &&
      ['CONFIRMED', 'STAFF_ASSIGNED', 'IN_PROGRESS', 'MATCHING'].includes(b.status)
  );

  const popularServices = services.slice(0, 6);

  // Recent completed bookings for quick re-booking
  const recentCompletedBookings = bookingResource.bookings.filter(b=>b.status==='COMPLETED').slice(0,5);

  const [selectedBundle, setSelectedBundle] = useState<ServiceBundle | null>(null);
  const handleOpenRebook = (booking: { id: string }) => router.push({ pathname: '/booking/rebook', params: { sourceId: booking.id } });

  const handleBookBundle = (bundle: ServiceBundle) => {
    setSelectedBundle(null);
    router.push({
      pathname: '/booking/new',
      params: {
        serviceId: bundle.primaryServiceId,
        packageId: bundle.id,
        mode: 'MODE_B',
      },
    });
  };

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    if (index >= 0 && index < banners.length && index !== activeBannerIndex) {
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
    <View style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={64}
          onLayout={({ nativeEvent }) => {
            blogViewport.current.height = nativeEvent.layout.height;
            updateBlogVisibility();
          }}
          onScroll={({ nativeEvent: { contentOffset, contentSize, layoutMeasurement } }) => {
            blogViewport.current.top = contentOffset.y;
            updateBlogVisibility();
            const visibleBottom = contentOffset.y + layoutMeasurement.height;
            setShowFloatingAI(contentSize.height - visibleBottom > floatingAIHeight.current + floatingAIBottom);
          }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: styles.scrollContent.paddingBottom + bottomTabHeight }]}>
          {/* TOP HEADER: User Greeting, Address, Notifications */}
          <View style={styles.topHeader}>
            <Pressable
              style={styles.profileRow}
              onPress={() => router.push('/(tabs)/profile')}>
              <Image
                source={remoteImageSource(currentCustomer?.avatar ||
                    'https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?w=250&auto=format&fit=crop&q=80')}
                style={styles.userAvatar}
              />
              <View style={styles.userMeta}>
                <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Xin chào bạn,</Text>
                <Text style={[styles.userName, { color: colors.text }]}>{currentCustomer?.fullName || 'Khách hàng'}</Text>
              </View>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable
                style={styles.notifBtn}
                accessibilityRole="button"
                accessibilityLabel={`Thông báo, ${unreadCount} chưa đọc`}
                onPress={() => router.push('/notifications')}>
                <IconSymbol name="bell" size={22} color={BrandColors.gray800} />
                <NotificationBadge count={unreadCount} />
              </Pressable>

            </View>
          </View>

          {expiredBooking && <StaffResponseDecision key={expiredBooking.id} booking={expiredBooking} />}
          {waitingBookings.map(booking => <Pressable key={booking.id} style={styles.upcomingBox}
            onPress={() => router.push({ pathname: '/booking/waiting', params: { id: booking.id } })}>
            <View style={styles.upcomingHeader}><View style={styles.upcomingDotRow}>
              <IconSymbol name="clock" size={18} color={BrandColors.primary} />
              <Text style={styles.upcomingTitle}>{booking.staffWaitState === 'EXPIRED' ? 'Hết giờ chờ • Cần xác nhận' : 'Đang chờ nhân viên nhận'}</Text>
            </View><IconSymbol name="chevronRight" size={18} color={BrandColors.primary} /></View>
            <Text style={styles.upcomingServiceName}>{booking.service.name || booking.service.serviceName || 'Đơn dịch vụ'}</Text>
            <Text style={styles.upcomingTime}>{String(booking.staff?.fullName || 'Nhân viên đã chọn')} • {booking.bookingCode}</Text>
            <Text style={styles.upcomingTime}>{booking.staffWaitState === 'EXPIRED' ? 'Nhấn để chờ thêm 5 phút hoặc tìm nhân viên khác' : 'Nhấn để xem thời gian chờ và phản hồi của nhân viên'}</Text>
          </Pressable>)}

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
                {services.find((s) => s.id === upcomingBooking.serviceId)?.name ||
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
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Đặt lại dịch vụ đã dùng</Text>
                    <View style={styles.rebookPill}>
                      <Text style={styles.rebookPillText}>1 chạm</Text>
                    </View>
                  </View>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Dành cho bạn • Nhân viên quen thuộc • Tiết kiệm thời gian</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: 12 }}>
                {recentCompletedBookings.slice(0, 3).map((b) => {
                  const srv = getServiceById(b.serviceId);
                  const staff = b.staff ? staffView(b.staff) : undefined;
                  const bAddr = addresses.find(a => a.id === b.addressId) || b.address;
                  return (
                    <View key={b.id} style={[styles.rebookCard, { maxWidth: windowWidth - Spacing.three * 2 }]}>
                      <View style={styles.rebookTagRow}>
                        <Text style={styles.rebookBadge}>Đã hoàn thành</Text>
                        {staff && <Text style={styles.rebookStaffTag}>Thợ quen</Text>}
                      </View>

                      <View style={styles.rebookMainRow}>
                        {srv?.image ? (
                          <Image source={remoteImageSource(srv.image)} style={styles.rebookThumb} />
                        ) : (
                          <View style={styles.rebookThumbPlaceholder}>
                            <IconSymbol name="🧹" style={{ fontSize: 18 }} />
                          </View>
                        )}
                        <View style={styles.rebookMainInfo}>
                          <Text numberOfLines={1} style={styles.rebookServiceName}>
                            {srv?.name || 'Dịch vụ gia đình'}
                          </Text>
                          {staff && (
                            <View style={styles.rebookStaffRow}>
                              <Image source={remoteImageSource(staff.avatar)} style={styles.rebookStaffAvatar} />
                              <Text style={styles.rebookStaffName} numberOfLines={1}>
                                {staff.fullName} ({staff.rating}★)
                              </Text>
                            </View>
                          )}
                          <Text numberOfLines={1} style={styles.rebookAddrText}>
                            {bAddr?.fullAddress?.split(',')[0] || bAddr?.streetAddress || 'Chọn lại địa chỉ'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.rebookPrice}>Lần trước · {formatVND(b.totalAmount)}</Text>
                      <Pressable
                        accessibilityRole="button"
                        style={styles.rebookActionBtn}
                        onPress={() => handleOpenRebook(b)}>
                        <Text style={styles.rebookActionBtnText}>Đặt lại nhanh</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* DEDICATED SECTION: CHỌN NHÂN VIÊN THEO NHU CẦU CỦA RIÊNG BẠN (MODE A) */}
          <View style={styles.staffModeSection}>
            <Pressable
              style={styles.compactStaffBanner}
              onPress={() =>
                router.push({
                  pathname: '/booking/new',
                  params: { serviceId: 'srv-001', mode: 'MODE_A' },
                })
              }>
              <LinearGradient
                colors={['#0F766E', '#0D9488']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.compactStaffGradient}>
                <View style={styles.compactStaffIconBox}>
                  <IconSymbol name="person" size={22} color="#FFFFFF" />
                </View>

                <View style={styles.compactStaffTextBox}>
                  <Text style={styles.compactStaffTitle} numberOfLines={1}>
                    Chọn nhân viên theo nhu cầu của riêng bạn
                  </Text>
                  <Text style={styles.compactStaffSubtitle} numberOfLines={1}>
                    Chủ động duyệt hồ sơ, xem đánh giá 5★ & chọn thợ
                  </Text>
                </View>

                <View style={styles.compactStaffArrow}>
                  <IconSymbol name="chevronRight" size={16} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          {/* HERO BANNERS CAROUSEL */}
          {bannerResource.error && !banners.length && <Pressable accessibilityRole="button" style={styles.bannerRetry} onPress={bannerResource.retry}>
            <Text style={{ color: colors.text }}>Chưa tải được banner · Thử lại</Text>
          </Pressable>}
          {banners.length > 0 && <View style={styles.bannerContainer}>
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
                const safeIndex = Math.max(0, Math.min(index, banners.length - 1));
                setActiveBannerIndex(safeIndex);
                setTimeout(() => {
                  isInteractingRef.current = false;
                }, 2000);
              }}
              contentContainerStyle={{
                paddingHorizontal: horizontalPadding,
                gap: bannerGap,
                alignItems: 'center',
              }}>
              {banners.map((banner) => {
                const fullImage = banner.layout === 'FULL_IMAGE';
                const theme = bannerThemes[banner.theme];
                return (
                <Pressable
                  key={banner.id}
                  accessibilityRole="button"
                  accessibilityLabel={banner.title}
                  style={[styles.bannerCard, { width: bannerWidth, height: fullImage ? bannerWidth * 5 / 12 : 160 }]}
                  onPress={() =>
                    router.push({
                      pathname: '/service/[id]',
                      params: { id: String(banner.serviceId) },
                    })
                  }>
                  {fullImage ? <Image source={remoteImageSource(banner.imageUrl)} style={styles.bannerFullImage} resizeMode="cover" />
                    : <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bannerGradient}>
                    <View style={styles.bannerContentCol}>
                      {!!banner.badge && <View style={[styles.bannerBadge, { backgroundColor: theme.badge }]}>
                        <Text numberOfLines={1} style={styles.bannerBadgeText}>{banner.badge}</Text>
                      </View>}
                      <Text numberOfLines={2} style={styles.bannerTitle}>{banner.title}</Text>
                      {!!banner.description && <Text numberOfLines={2} style={styles.bannerDesc}>{banner.description}</Text>}
                      {!!banner.buttonLabel && <View style={styles.bannerCtaBtn}>
                        <Text numberOfLines={1} style={styles.bannerCtaText}>{banner.buttonLabel} →</Text>
                      </View>}
                    </View>

                    <Image source={remoteImageSource(banner.imageUrl)} resizeMode="cover"
                      style={[styles.bannerImage, { width: Math.min(110, (bannerWidth - Spacing.three * 2) * 0.4) }]} />
                  </LinearGradient>}
                </Pressable>
              ); })}
            </ScrollView>

            {/* Pagination dots (clickable & smooth) */}
            {banners.length > 1 && <View style={styles.paginationRow}>
              {banners.map((banner, i) => (
                <Pressable
                  key={banner.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Banner ${i + 1}`}
                  accessibilityState={{ selected: activeBannerIndex === i }}
                  hitSlop={8}
                  onPress={() => handleScrollToBanner(i)}
                  style={[
                    styles.paginationDot,
                    activeBannerIndex === i && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>}
          </View>}

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
                    const service = services.find((item) => item.categoryId === cat.id);
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Dịch vụ phổ biến</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Khách hàng tin tưởng đặt nhiều nhất</Text>
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
                <Image source={remoteImageSource(service.image)} style={styles.popularImage} />
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
                <IconSymbol name="💡" style={{ fontSize: 18 }} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Combo Gợi ý thông minh (AI Bundle)</Text>
              </View>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Kết hợp dịch vụ liên quan • Tiết kiệm đến 20% chi phí</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: 12 }}>
            {serviceBundles.map((bundle) => (
              <Pressable
                key={bundle.id}
                style={styles.bundleCard}
                onPress={() => setSelectedBundle(bundle)}>
                <Image source={remoteImageSource(bundle.bannerImage)} style={styles.bundleImage} />
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

          <HomeBlogRow visible={blogVisible && !selectedBundle} onLayout={handleBlogLayout} />

          {/* PROMOTIONS & VOUCHERS */}
          <View style={[styles.sectionHeaderRow, { marginTop: Spacing.four }]}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Mã giảm giá hấp dẫn</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Áp dụng ngay khi thanh toán đơn hàng</Text>
            </View>
          </View>

          <View style={styles.promotionList}>
            {promotions.filter(item => item.isActive).slice(0, 2).map((promo) => (
              <PromotionCard
                key={promo.id}
                promotion={promo}
                onApply={() => {
                  router.push({
                    pathname: '/catalog',
                  });
                }}
              />
            ))}
          </View>

        </ScrollView>

        {showFloatingAI && <Pressable
          accessibilityRole="button"
          onLayout={({ nativeEvent }) => { floatingAIHeight.current = nativeEvent.layout.height; }}
          style={[styles.floatingAIBtn, { bottom: bottomTabHeight + floatingAIBottom }]}
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
        </Pressable>}

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
                  <Image source={remoteImageSource(selectedBundle.bannerImage)} style={styles.modalBundleHero} />

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
    </View>
  );
}


const floatingAIBottom = 12;

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  promotionList: {
    paddingHorizontal: Spacing.three,
    gap: 12,
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
    // Dedicated Staff Mode Section (Mode A) - Compact & Elegant
  staffModeSection: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  compactStaffBanner: {
    marginHorizontal: Spacing.three,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  compactStaffGradient: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactStaffIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactStaffTextBox: {
    flex: 1,
  },
  compactStaffTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  compactStaffSubtitle: {
    fontSize: 11,
    color: '#CCFBF1',
    fontWeight: '500',
  },
  compactStaffArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  bannerRetry: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: BrandColors.gray300,
    borderRadius: BorderRadius.lg,
    padding: Spacing.two,
  },
  bannerCard: {
    backgroundColor: BrandColors.gray200,
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
    minWidth: 0,
    justifyContent: 'space-evenly',
    paddingRight: 8,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
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
    maxWidth: '100%',
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
    alignSelf: 'center',
    aspectRatio: 55 / 64,
    borderRadius: BorderRadius.lg,
  },
  bannerFullImage: { width: '100%', height: '100%' },
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 18,
    paddingBottom: 12,
    paddingHorizontal: 10,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    color: BrandColors.gray900,
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
  floatingAIBtn: {
    position: 'absolute',
    right: 16,
    maxWidth: '90%',
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
    flexShrink: 1,
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
  rebookTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  rebookBadge: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.primary,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rebookStaffTag: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rebookPrice: {
    marginTop: 'auto',
    marginBottom: 8,
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
  rebookMainInfo: {
    flex: 1,
    minWidth: 0,
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
    flexShrink: 1,
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
