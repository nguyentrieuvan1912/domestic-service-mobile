import { remoteImageSource } from '@/utils/image-source';
import { useAuth } from '@/context/AuthContext';
import { operationRequest } from '@/api/operations';
import { CatalogDetail, CatalogPage } from '@/api/catalog-types';
import { catalogDetailView, catalogTemplate } from '@/api/catalog-view';
import { useCatalogResource } from '@/hooks/use-catalog-resource';
import { CatalogState } from '@/components/common/CatalogState';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { Badge, formatVND } from '@/components/common/Badge';
import { RatingStars } from '@/components/common/RatingStars';
import { usePublicBookingResource } from '@/hooks/use-public-booking-resource';
import type { ServiceBundle, RelatedServiceItem } from '@/data/serviceBundles';
import { catalogSummaryView } from '@/api/catalog-view';


type ActiveTab = 'CONFIG' | 'PACKAGES' | 'REVIEWS' | 'INFO';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return /^\d+$/.test(id || '') ? <CatalogDetailLoader id={id!} /> : <LegacyCatalogLookup id={id || ''} />;
}

function ServiceLoadState(props: React.ComponentProps<typeof CatalogState>) {
  const router = useRouter();
  return <SafeAreaView style={{ flex: 1, backgroundColor: BrandColors.white }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
      <IconSymbol name="chevron.left" size={22} color={BrandColors.primary} />
      <Text style={{ color: BrandColors.primary, fontWeight: '700' }}>Quay lại</Text>
    </Pressable>
    <CatalogState {...props} />
  </SafeAreaView>;
}

// Old banners/Booking/AI prototypes still use srv-* IDs. Resolve them before calling the numeric API.
function LegacyCatalogLookup({ id }: { id: string }) {
  const result = useCatalogResource<CatalogPage>('/services?size=100');
  if (result.loading || result.error) return <ServiceLoadState loading={result.loading} error={result.error} onRetry={result.retry} />;
  const service = result.data?.items.find(item => item.code === 'UI-' + id);
  return service ? <CatalogDetailLoader id={String(service.id)} /> : <ServiceLoadState error="Không tìm thấy dịch vụ." />;
}

function CatalogDetailLoader({ id }: { id: string }) {
  const result = useCatalogResource<CatalogDetail>('/services/' + encodeURIComponent(id));
  if (result.loading || result.error || !result.data) return <ServiceLoadState loading={result.loading} error={result.error} onRetry={result.retry} />;
  return <ServiceDetailContent key={result.data.service.id} detail={result.data} />;
}

function ServiceDetailContent({ detail }: { detail: CatalogDetail }) {
  const router = useRouter();
  const viewport = useWindowDimensions();
  const twoColumnTabs = viewport.width < 340 || viewport.fontScale > 1.2;
  const { service, packages, addOns } = catalogDetailView(detail);
  const reviewResource = usePublicBookingResource<{id:number;rating:number;comment:string;createdAt:string}[]>('/services/'+service.id+'/reviews');
  const reviews = (reviewResource.data || []).map(r=>({...r,customerName:'Khách hàng',customerAvatar:''}));
  service.reviewCount=reviews.length;service.rating=reviews.length?reviews.reduce((n,r)=>n+r.rating,0)/reviews.length:0;
  const relatedResource = useCatalogResource<CatalogPage>('/services?size=10');
  const relatedServices: RelatedServiceItem[] = (relatedResource.data?.items || []).filter(s=>String(s.id)!==service.id).slice(0,3).map(raw=>{const service=catalogSummaryView(raw);return {service,reason:'Dịch vụ đang hoạt động',discountOffer:'',discountedPrice:service.basePrice};});
  const serviceBundle = React.useMemo<ServiceBundle | undefined>(()=>undefined,[]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('CONFIG');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    packages.find((p) => p.isPopular)?.id || packages[0]?.id || ''
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const { currentCustomer }=useAuth();
  const [isFavorite,setIsFavorite]=useState(false),[favoriteBusy,setFavoriteBusy]=useState(false);
  React.useEffect(()=>{let active=true;setIsFavorite(false);if(currentCustomer)void operationRequest<number[]>('identity','/customer/favorites').then(ids=>{if(active)setIsFavorite(ids.includes(Number(service.id)));}).catch(()=>{});return()=>{active=false;};},[currentCustomer?.id,service.id]);
  const toggleFavorite=async()=>{if(favoriteBusy)return;setFavoriteBusy(true);try{const result=await operationRequest<{favorite:boolean}>('identity','/customer/favorites/'+service.id,'PUT',{favorite:!isFavorite});setIsFavorite(result.favorite);}catch(e){Alert.alert('Chưa lưu được dịch vụ',e instanceof Error?e.message:'Vui lòng thử lại.');}finally{setFavoriteBusy(false);}};

  const quantity = 1;

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];

  const toggleAddOn = (addonId: string) => {
    if (selectedAddOnIds.includes(addonId)) {
      setSelectedAddOnIds(selectedAddOnIds.filter((id) => id !== addonId));
    } else {
      setSelectedAddOnIds([...selectedAddOnIds, addonId]);
    }
  };

  const calculateTotalPrice = () => {
    let total = selectedPackage ? selectedPackage.price : service.basePrice;
    if (detail.service.priceUnit === 'ITEM') total *= quantity;

    selectedAddOnIds.forEach((addId) => {
      const add = addOns.find((a) => a.id === addId);
      if (add) total += add.price;
    });

    return total;
  };

  const handleBookNow = () => {
    router.push({
      pathname: '/booking/new',
      params: {
        serviceId: service.id,
        packageId: selectedPackage?.id || '',
        mode: 'MODE_B',
        quantity: String(quantity),
        customConfig: '{}',
        answers: JSON.stringify({}),
        addOnIds: JSON.stringify(selectedAddOnIds),
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HERO IMAGE */}
        <View style={styles.heroContainer}>
          <Image source={remoteImageSource(service.image)} style={styles.heroImage} />
          <SafeAreaView style={styles.heroOverlay} edges={['top']}>
            <Pressable
              style={styles.heroNavButton}
              onPress={() => router.back()}
              hitSlop={8}>
              <IconSymbol name="back" size={22} color={BrandColors.gray900} />
            </Pressable>

            <Pressable
              style={styles.heroNavButton}
              disabled={favoriteBusy} onPress={()=>void toggleFavorite()}
              hitSlop={8}>
              <IconSymbol
                name={isFavorite ? 'heart' : 'heartOutline'}
                size={20}
                color={isFavorite ? BrandColors.danger : BrandColors.gray900}
              />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* MAIN INFO HEADER */}
        <View style={styles.mainInfoCard}>
          <View style={styles.headerInfoRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.serviceTitle}>{service.name}</Text>
              <View style={styles.ratingRow}>
                <RatingStars
                  rating={service.rating}
                  reviewCount={service.reviewCount}
                  size={14}
                />
                <Text style={styles.durationTag}>⏱ {service.duration || '2 - 4 giờ'}</Text>
              </View>
            </View>

            <View style={styles.basePriceBadge}>
              <Text style={styles.basePriceLabel}>Khởi điểm</Text>
              <Text style={styles.basePriceNumber}>{formatVND(service.basePrice)}</Text>
              <Text style={styles.basePriceUnit}>/{service.unit}</Text>
            </View>
          </View>

          {/* Badges */}
          {service.highlightBadges.length > 0 && <View style={styles.highlightsSection}>
            <Text style={styles.highlightsTitle}>Điểm nổi bật</Text>
            <View style={styles.badgesRow}>
              {service.highlightBadges.map((badge, idx) => (
                <View key={idx} style={[styles.badgePill, { width: Math.floor((viewport.width - 32 - 2 * Spacing.three - 8) / 2) }, (service.highlightBadges.length % 2 === 1 && idx === service.highlightBadges.length - 1 || viewport.fontScale > 1.2) && styles.badgeFull]}>
                  <View style={styles.badgeCheck}><IconSymbol name="check" size={14} color="#15803D" /></View>
                  <Text style={styles.badgePillText}>{badge}</Text>
                </View>
              ))}
            </View>
          </View>}

          <Text style={styles.serviceDesc}>
            {service.detailedDescription || service.description}
          </Text>
        </View>

        {/* TABS NAVIGATION */}
        <View accessibilityRole="tablist" style={[styles.tabNav, twoColumnTabs && styles.tabNavWrap]}>
          {([
            { key: 'CONFIG', label: 'Thông tin', accessibility: 'Thông tin dịch vụ' },
            { key: 'PACKAGES', label: 'Gói dịch vụ', accessibility: `Gói và tiện ích, ${packages.length} gói` },
            { key: 'INFO', label: 'Quy trình', accessibility: 'Quy trình và tiêu chuẩn' },
            { key: 'REVIEWS', label: 'Đánh giá', accessibility: `Đánh giá, ${service.reviewCount} nhận xét` },
          ] as const).map(tab => <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.key }} accessibilityLabel={tab.accessibility}
            style={[styles.tabButton, twoColumnTabs && styles.tabButtonHalf, activeTab === tab.key && styles.tabButtonActive]} onPress={() => setActiveTab(tab.key)}>
            <Text numberOfLines={1} style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>{tab.label}</Text>
          </Pressable>)}
        </View>

        {/* TAB 1: DYNAMIC CONFIGURATION FOR SERVICE */}
        {activeTab === 'CONFIG' && (
          <View style={styles.tabContentSection}>
            <Text style={styles.sectionHeading}>Đặt dịch vụ theo từng bước</Text>
            <Text style={styles.sectionSubtitle}>
              Bấm Bắt đầu đặt dịch vụ. Ứng dụng sẽ lần lượt hướng dẫn bạn chọn nhu cầu, gói dịch vụ, địa chỉ và thời gian.
            </Text>

            <Pressable accessibilityRole="button" style={[styles.bookNowBtn,{padding:16,alignSelf:'stretch',marginBottom:16}]} onPress={handleBookNow}>
              <Text style={styles.bookNowText}>Đặt dịch vụ →</Text>
            </Pressable>
            {detail.requirements.length>0 && <Text style={styles.reqText}>Bạn sẽ được hướng dẫn chọn: {detail.requirements.map(field=>field.label).join(' • ')}.</Text>}

            {/* Default general requirements */}
            <View style={styles.reqBlock}>
              <Text style={styles.fieldLabel}>Khu vực cung cấp dịch vụ</Text>
              <Text style={styles.reqText}>
                📍 TP. Hồ Chí Minh
              </Text>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Yêu cầu đối với khách hàng</Text>
              {service.serviceRequirements?.map((r, i) => (
                <Text key={i} style={styles.bulletItem}>• {r}</Text>
              ))}

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Tiêu chuẩn năng lực nhân viên phụ trách</Text>
              {service.requiredStaffSkills?.map((s, i) => (
                <Text key={i} style={styles.bulletItem}>✓ {s}</Text>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: PACKAGES & ADD-ONS */}
        {activeTab === 'PACKAGES' && (
          <View style={styles.tabContentSection}>
            <Text style={styles.sectionHeading}>Chọn gói thời lượng / quy mô</Text>
            {packages.map((pkg) => {
              const isSelected = pkg.id === selectedPackageId;
              return (
                <Pressable
                  key={pkg.id}
                  style={[styles.pkgCard, isSelected && styles.pkgCardSelected]}
                  onPress={() => setSelectedPackageId(pkg.id)}>
                  <View style={styles.pkgTopRow}>
                    <View style={styles.cardInfo}>
                      <View style={styles.pkgHeading}>
                        <Text style={styles.pkgName}>{pkg.name}</Text>
                        {pkg.isPopular && (
                          <View style={styles.pkgHotBadge}>
                            <Text style={styles.pkgHotText}>Khuyên dùng</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.pkgDesc}>{pkg.description}</Text>
                    </View>
                    <View style={styles.pkgPriceCol}>
                      <Text style={styles.pkgPrice}>{formatVND(pkg.price)}</Text>
                      {pkg.originalPrice ? (
                        <Text style={styles.pkgOriginalPrice}>{formatVND(pkg.originalPrice)}</Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}

            {/* ADD-ONS SECTION */}
            {addOns.length > 0 && (
              <>
                <Text style={[styles.sectionHeading, { marginTop: Spacing.four }]}>
                  Dịch vụ bổ sung (Add-ons)
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Chọn kèm để hoàn thành cùng ca làm việc với chi phí ưu đãi.
                </Text>

                {addOns.map((add) => {
                  const isChecked = selectedAddOnIds.includes(add.id);
                  return (
                    <Pressable
                      key={add.id}
                      style={[styles.addonItem, isChecked && styles.addonItemSelected]}
                      onPress={() => toggleAddOn(add.id)}>
                      <Image source={remoteImageSource(add.image)} style={styles.addonThumb} />
                      <View style={styles.cardInfo}>
                        <Text style={styles.addonName}>{add.name}</Text>
                        <Text numberOfLines={2} style={styles.addonDesc}>{add.description}</Text>
                        <Text style={styles.addonPrice}>+{formatVND(add.price)}</Text>
                      </View>
                      <View style={[styles.addonCheck, isChecked && styles.addonCheckActive]}>
                        <Text style={styles.addonCheckIcon}>{isChecked ? '✓' : '+'}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </>
            )}

            {/* GỢI Ý GÓI COMBO TIẾT KIỆM NẾU CÓ */}
            {serviceBundle && (
              <View style={styles.bundleCalloutCard}>
                <View style={styles.bundleCalloutBadge}>
                  <Text style={styles.bundleCalloutBadgeText}>💡 Gói Combo Tiết Kiệm</Text>
                </View>
                <Text style={styles.bundleCalloutTitle}>{serviceBundle.title}</Text>
                <Text style={styles.bundleCalloutDesc}>{serviceBundle.aiReason}</Text>
                <View style={styles.bundleCalloutFooter}>
                  <View>
                    <Text style={styles.bundleCalloutOldPrice}>{formatVND(serviceBundle.originalPrice)}</Text>
                    <Text style={styles.bundleCalloutPrice}>{formatVND(serviceBundle.bundlePrice)}</Text>
                  </View>
                  <Pressable
                    style={styles.bundleCalloutBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/booking/new',
                        params: {
                          serviceId: serviceBundle.primaryServiceId,
                          mode: 'MODE_B',
                        },
                      })
                    }>
                    <Text style={styles.bundleCalloutBtnText}>Đặt Combo (Tiết kiệm {formatVND(serviceBundle.discountAmount)}) →</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* DỊCH VỤ THƯỜNG ĐƯỢC ĐẶT CÙNG (AI RELATED SERVICES) */}
            {relatedServices.length > 0 && (
              <View style={{ marginTop: Spacing.four }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <IconSymbol name="💡" style={{ fontSize: 16 }} />
                  <Text style={[styles.sectionHeading, styles.shrinkText]}>Dịch vụ thường được đặt cùng</Text>
                </View>
                <Text style={styles.subHeading}>
                  AI đề xuất các dịch vụ bổ trợ có thể thực hiện cùng thời điểm để tối ưu chi phí
                </Text>

                {relatedServices.map((item) => (
                  <View key={item.service.id} style={styles.relatedCard}>
                    <Image source={remoteImageSource(item.service.image)} style={styles.relatedThumb} />
                    <View style={styles.cardInfo}>
                        <View style={styles.relatedPill}>
                          <Text style={styles.relatedPillText}>AI Gợi ý</Text>
                        </View>
                      <Text style={styles.relatedName}>{item.service.name}</Text>
                      <Text numberOfLines={2} style={styles.relatedReason}>
                        {item.reason}
                      </Text>
                      <View style={styles.relatedFooterRow}>
                        <View style={styles.relatedPrices}>
                          <Text style={styles.relatedPrice}>{formatVND(item.discountedPrice)}</Text>
                          {item.discountedPrice < item.service.basePrice && (
                            <Text style={styles.relatedOldPrice}>{formatVND(item.service.basePrice)}</Text>
                          )}
                        </View>
                        <Pressable
                          style={styles.relatedActionBtn}
                          onPress={() =>
                            router.push({
                              pathname: '/service/[id]',
                              params: { id: item.service.id },
                            })
                          }>
                          <Text style={styles.relatedActionText}>Xem & Đặt ›</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: WORKFLOW & BENEFITS */}
        {activeTab === 'INFO' && (
          <View style={styles.tabContentSection}>
            <Text style={styles.sectionHeading}>Quy trình thực hiện chuẩn 5 bước</Text>
            {service.workflow?.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            <Text style={[styles.sectionHeading, { marginTop: Spacing.four }]}>
              Quyền lợi khi đặt qua CleanMaster
            </Text>
            {service.benefits?.map((b, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <IconSymbol name="🛡️" style={styles.benefitIcon} />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        )}

        {/* TAB 4: CUSTOMER REVIEWS */}
        {activeTab === 'REVIEWS' && (
          <View style={styles.tabContentSection}>
            <View style={styles.ratingSummaryBox}>
              <Text style={styles.bigScore}>{service.rating.toFixed(1)}</Text>
              <RatingStars rating={service.rating} size={18} />
              <Text style={styles.totalReviewsText}>Dựa trên {service.reviewCount} đánh giá xác thực</Text>
            </View>

            {reviewResource.error && <Pressable onPress={reviewResource.retry}><Text>{reviewResource.error} • Thử lại</Text></Pressable>}
            {reviews.length === 0 ? (
              <Text style={styles.emptyReviewText}>Chưa có nhận xét nào cho dịch vụ này.</Text>
            ) : (
              reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.revHeader}>
                    <Image source={remoteImageSource(rev.customerAvatar)} style={styles.revAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.revName}>{rev.customerName}</Text>
                      <Text style={styles.revDate}>{rev.createdAt.split('T')[0]}</Text>
                    </View>
                    <RatingStars rating={rev.rating} size={12} />
                  </View>
                  <Text style={styles.revComment}>{rev.comment}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* STICKY BOTTOM BOOKING BAR */}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Tạm tính dịch vụ</Text>
          <Text style={styles.bottomPriceValue}>
            {formatVND(calculateTotalPrice())}
          </Text>
        </View>

        <Pressable style={styles.bookNowBtn} onPress={handleBookNow}>
          <Text style={styles.bookNowText}>Đặt dịch vụ →</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#000',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: 8,
  },
  heroNavButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainInfoCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    marginHorizontal: 16,
    marginTop: -20,
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  durationTag: {
    fontSize: 12,
    color: BrandColors.gray600,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  basePriceBadge: {
    maxWidth: '42%',
    flexShrink: 0,
    alignItems: 'flex-end',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  basePriceLabel: {
    fontSize: 10,
    color: BrandColors.gray500,
  },
  basePriceNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  basePriceUnit: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  highlightsSection: { marginVertical: 12, gap: 10 },
  highlightsTitle: { fontSize: 12, fontWeight: '700', color: '#475569' },
  badgeFull: { width: '100%' },
  badgeCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  badgePill: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  badgePillText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 18,
    color: '#15803D',
    fontWeight: '600',
  },
  serviceDesc: {
    fontSize: 13,
    color: BrandColors.gray600,
    lineHeight: 19,
    marginTop: 4,
  },
  tabNav: {
    flexDirection: 'row', backgroundColor: '#EAF3EF', marginHorizontal: 16, marginTop: 16,
    padding: 4, gap: 4, borderRadius: 14, borderWidth: 1, borderColor: '#DCE8E2',
  },
  tabNavWrap: { flexWrap: 'wrap' },
  tabButton: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  tabButtonHalf: { flexBasis: '48%', flexGrow: 1 },
  tabButtonActive: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#A7DBC8' },
  tabButtonText: { fontSize: 12, lineHeight: 18, fontWeight: '600', color: '#64748B', textAlign: 'center' },
  tabButtonTextActive: { color: '#047857', fontWeight: '800' },
  tabContentSection: { backgroundColor: '#FFF', padding: 16, marginHorizontal: 16, marginTop: 16, borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginBottom: Spacing.three,
  },
  configBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.three,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray800,
    marginTop: 10,
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  optionPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: BrandColors.primary,
  },
  optionPillText: {
    fontSize: 12,
    color: BrandColors.gray700,
    fontWeight: '500',
  },
  optionPillTextActive: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.gray800,
  },
  counterValue: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  checkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 12,
  },
  checkOptionActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  checkIcon: {
    fontSize: 20,
    color: BrandColors.primary,
  },
  checkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  checkDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  inputBox: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: BrandColors.gray900,
  },
  optionsCol: {
    gap: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 8,
  },
  radioItemActive: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  radioDot: {
    fontSize: 16,
  },
  radioText: {
    fontSize: 12,
    color: BrandColors.gray800,
    flex: 1,
  },
  reqBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reqText: {
    fontSize: 13,
    color: BrandColors.gray700,
    lineHeight: 18,
  },
  bulletItem: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 18,
    marginBottom: 3,
  },
  pkgCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.two,
  },
  pkgCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  pkgTopRow: {
    gap: 10,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
  },
  shrinkText: {
    flex: 1,
    minWidth: 0,
  },
  pkgHeading: {
    alignItems: 'flex-start',
    gap: 6,
  },
  pkgName: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  pkgHotBadge: {
    maxWidth: '100%',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pkgHotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  pkgDesc: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginTop: 4,
  },
  pkgPriceCol: {
    alignItems: 'flex-start',
    maxWidth: '100%',
  },
  pkgPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  pkgOriginalPrice: {
    fontSize: 11,
    color: BrandColors.gray400,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  addonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.two,
    gap: 12,
  },
  addonItemSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  addonThumb: {
    flexShrink: 0,
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
  },
  addonName: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  addonDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
    marginVertical: 2,
  },
  addonPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  addonCheck: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonCheckActive: {
    backgroundColor: BrandColors.primary,
  },
  addonCheckIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: BrandColors.gray800,
    lineHeight: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  benefitIcon: {
    fontSize: 18,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: BrandColors.gray700,
    lineHeight: 18,
  },
  ratingSummaryBox: {
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.three,
  },
  bigScore: {
    fontSize: 36,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 4,
  },
  totalReviewsText: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginTop: 6,
  },
  emptyReviewText: {
    textAlign: 'center',
    color: BrandColors.gray400,
    fontSize: 13,
    marginVertical: 20,
  },
  reviewCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  revHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  revAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  revName: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  revDate: {
    fontSize: 11,
    color: BrandColors.gray400,
  },
  revComment: {
    fontSize: 13,
    color: BrandColors.gray700,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 10,
    paddingHorizontal: Spacing.three,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bottomPriceCol: {
    width: '100%',
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  bottomPriceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  bookNowBtn: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  bookNowText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  subHeading: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginBottom: 10,
    lineHeight: 16,
  },

  // Bundle Callout in Detail
  bundleCalloutCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginTop: Spacing.three,
  },
  bundleCalloutBadge: {
    maxWidth: '100%',
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
  },
  bundleCalloutBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  bundleCalloutTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: 4,
  },
  bundleCalloutDesc: {
    fontSize: 12,
    color: BrandColors.gray700,
    lineHeight: 16,
    marginBottom: 10,
  },
  bundleCalloutFooter: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 8,
  },
  bundleCalloutOldPrice: {
    fontSize: 11,
    color: BrandColors.gray500,
    textDecorationLine: 'line-through',
  },
  bundleCalloutPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  bundleCalloutBtn: {
    maxWidth: '100%',
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  bundleCalloutBtnText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Related Services in Detail
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 10,
  },
  relatedThumb: {
    flexShrink: 0,
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  relatedName: {
    lineHeight: 19,
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  relatedPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginBottom: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relatedPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  relatedReason: {
    fontSize: 11,
    color: BrandColors.gray600,
    marginVertical: 3,
    lineHeight: 15,
  },
  relatedFooterRow: {
    gap: 8,
    marginTop: 2,
  },
  relatedPrices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 6,
  },
  relatedPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  relatedOldPrice: {
    fontSize: 10,
    color: BrandColors.gray400,
    textDecorationLine: 'line-through',
  },
  relatedActionBtn: {
    alignSelf: 'flex-end',
    maxWidth: '100%',
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  relatedActionText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
});
