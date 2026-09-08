import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { Badge, formatVND } from '@/components/common/Badge';
import { RatingStars } from '@/components/common/RatingStars';
import {
  getServiceById,
  getPackagesByServiceId,
  getAddOnsByServiceId,
  getReviewsByServiceId,
} from '@/data';

const { width } = Dimensions.get('window');

type ActiveTab = 'PACKAGES' | 'DESCRIPTION' | 'REVIEWS';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const service = getServiceById(id || 'srv-001') || getServiceById('srv-001')!;
  const packages = getPackagesByServiceId(service.id);
  const addOns = getAddOnsByServiceId(service.id);
  const reviews = getReviewsByServiceId(service.id);

  const [activeTab, setActiveTab] = useState<ActiveTab>('PACKAGES');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    packages.find((p) => p.isPopular)?.id || packages[0]?.id || ''
  );
  const [isFavorite, setIsFavorite] = useState(false);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) || packages[0];

  const handleBookNow = () => {
    router.push({
      pathname: '/booking/new',
      params: {
        serviceId: service.id,
        packageId: selectedPackage?.id || '',
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image with Overlay Actions */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: service.image }} style={styles.heroImage} />
          <SafeAreaView style={styles.heroOverlay} edges={['top']}>
            <Pressable
              style={styles.heroNavButton}
              onPress={() => router.back()}
              hitSlop={8}>
              <IconSymbol name="back" size={24} color={BrandColors.gray900} />
            </Pressable>

            <Pressable
              style={styles.heroNavButton}
              onPress={() => setIsFavorite(!isFavorite)}
              hitSlop={8}>
              <IconSymbol
                name={isFavorite ? 'heart' : 'heartOutline'}
                size={20}
                color={isFavorite ? BrandColors.danger : BrandColors.gray900}
              />
            </Pressable>
          </SafeAreaView>
        </View>

        {/* Main Service Info Card */}
        <View style={styles.contentCard}>
          <View style={styles.headerInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>{service.name}</Text>
              <RatingStars
                rating={service.rating}
                reviewCount={service.reviewCount}
                size={14}
                style={{ marginTop: 4 }}
              />
            </View>
            <View style={styles.basePriceBadge}>
              <Text style={styles.basePriceNumber}>{formatVND(service.basePrice)}</Text>
              <Text style={styles.basePriceUnit}>/{service.unit}</Text>
            </View>
          </View>

          {/* Guarantee Badges Row matching mockup */}
          <View style={styles.guaranteeRow}>
            {service.highlightBadges.map((badge, idx) => {
              const icons = ['shield', 'star', 'clock'];
              return (
                <View key={badge} style={styles.guaranteePill}>
                  <IconSymbol
                    name={icons[idx % icons.length]}
                    size={13}
                    color={BrandColors.primary}
                  />
                  <Text style={styles.guaranteeText}>{badge}</Text>
                </View>
              );
            })}
          </View>

          {/* Segmented Tab Navigation */}
          <View style={styles.segmentedTabBar}>
            <Pressable
              style={[
                styles.segmentedTab,
                activeTab === 'PACKAGES' && styles.segmentedTabActive,
              ]}
              onPress={() => setActiveTab('PACKAGES')}>
              <Text
                style={[
                  styles.segmentedTabText,
                  activeTab === 'PACKAGES' && styles.segmentedTabTextActive,
                ]}>
                Gói dịch vụ ({packages.length})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentedTab,
                activeTab === 'DESCRIPTION' && styles.segmentedTabActive,
              ]}
              onPress={() => setActiveTab('DESCRIPTION')}>
              <Text
                style={[
                  styles.segmentedTabText,
                  activeTab === 'DESCRIPTION' && styles.segmentedTabTextActive,
                ]}>
                Mô tả chi tiết
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.segmentedTab,
                activeTab === 'REVIEWS' && styles.segmentedTabActive,
              ]}
              onPress={() => setActiveTab('REVIEWS')}>
              <Text
                style={[
                  styles.segmentedTabText,
                  activeTab === 'REVIEWS' && styles.segmentedTabTextActive,
                ]}>
                Đánh giá ({reviews.length})
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: GÓI DỊCH VỤ (PACKAGES) */}
          {activeTab === 'PACKAGES' && (
            <View style={styles.packagesContainer}>
              <Text style={styles.tabSectionTitle}>Chọn gói dịch vụ phù hợp</Text>

              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <Pressable
                    key={pkg.id}
                    style={[
                      styles.packageCard,
                      isSelected && styles.packageCardSelected,
                    ]}
                    onPress={() => setSelectedPackageId(pkg.id)}>
                    <View style={styles.packageCardHeader}>
                      <View style={styles.packageCardTitleRow}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}>
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                        <Text
                          style={[
                            styles.packageName,
                            isSelected && styles.packageNameSelected,
                          ]}>
                          {pkg.name}
                        </Text>
                      </View>
                      <View style={styles.packagePriceCol}>
                        <Text style={styles.packagePriceText}>{formatVND(pkg.price)}</Text>
                        {pkg.originalPrice && (
                          <Text style={styles.packageOriginalPrice}>
                            {formatVND(pkg.originalPrice)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <Text style={styles.packageDescription}>{pkg.description}</Text>

                    <View style={styles.packageLimitsRow}>
                      <Badge label={`⏱️ ${pkg.durationHours} giờ`} variant="info" size="sm" />
                      <Badge label={`📐 ${pkg.maxArea}`} variant="primary" size="sm" />
                    </View>

                    <View style={styles.packageFooter}>
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>💡 {pkg.recommendedFor}</Text>
                      </View>
                      {pkg.isPopular && (
                        <Badge label="Phổ biến nhất" variant="warning" size="sm" />
                      )}
                    </View>
                  </Pressable>
                );
              })}

              {/* Add-ons Preview */}
              {addOns.length > 0 && (
                <View style={styles.addOnPreviewSection}>
                  <Text style={styles.tabSectionTitle}>Dịch vụ phụ trợ tùy chọn</Text>
                  <Text style={styles.tabSectionDesc}>
                    Bạn có thể tích chọn thêm các dịch vụ này trong bước đặt lịch:
                  </Text>
                  <View style={styles.addOnTagsGrid}>
                    {addOns.map((addon) => (
                      <View key={addon.id} style={styles.addOnTag}>
                        <Image source={{ uri: addon.image }} style={styles.addOnTagImg} />
                        <View>
                          <Text style={styles.addOnTagName}>{addon.name}</Text>
                          <Text style={styles.addOnTagPrice}>+{formatVND(addon.price)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* TAB 2: MÔ TẢ (DESCRIPTION & WORKFLOW) */}
          {activeTab === 'DESCRIPTION' && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.tabSectionTitle}>Giới thiệu dịch vụ</Text>
              <Text style={styles.longDescription}>
                {service.detailedDescription || service.description}
              </Text>

              {service.benefits && (
                <View style={styles.benefitsSection}>
                  <Text style={styles.subSectionTitle}>Lợi ích vượt trội:</Text>
                  {service.benefits.map((benefit, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={styles.bulletCheck}>✓</Text>
                      <Text style={styles.bulletText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              )}

              {service.workflow && (
                <View style={styles.workflowSection}>
                  <Text style={styles.subSectionTitle}>Quy trình thực hiện 6 bước:</Text>
                  {service.workflow.map((step, idx) => (
                    <View key={idx} style={styles.workflowStepRow}>
                      <View style={styles.stepIndexBadge}>
                        <Text style={styles.stepIndexText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.workflowStepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* TAB 3: ĐÁNH GIÁ (REVIEWS) */}
          {activeTab === 'REVIEWS' && (
            <View style={styles.reviewsContainer}>
              <View style={styles.reviewScoreCard}>
                <View style={styles.overallScoreCol}>
                  <Text style={styles.overallScoreBig}>{service.rating.toFixed(1)}</Text>
                  <RatingStars rating={service.rating} size={14} showScore={false} />
                  <Text style={styles.overallReviewCount}>{reviews.length} đánh giá thực tế</Text>
                </View>
              </View>

              {reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewItemCard}>
                  <View style={styles.reviewItemHeader}>
                    <Image source={{ uri: rev.customerAvatar }} style={styles.reviewAvatar} />
                    <View style={styles.reviewCustomerInfo}>
                      <Text style={styles.reviewCustomerName}>{rev.customerName}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <RatingStars rating={rev.rating} size={12} showScore={false} />
                  </View>

                  <Text style={styles.reviewComment}>{rev.comment}</Text>

                  {rev.tags && (
                    <View style={styles.reviewTagsRow}>
                      {rev.tags.map((t) => (
                        <View key={t} style={styles.reviewTagPill}>
                          <Text style={styles.reviewTagText}>#{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Booking Bar matching mockup */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomLabel}>Gói đang chọn:</Text>
          <Text style={styles.bottomPriceBig}>
            {formatVND(selectedPackage?.price || service.basePrice)}
          </Text>
          <Text style={styles.bottomPackageName}>{selectedPackage?.name}</Text>
        </View>

        <Pressable style={styles.bookNowButton} onPress={handleBookNow}>
          <Text style={styles.bookNowButtonText}>Đặt ngay</Text>
          <IconSymbol name="chevronRight" size={16} color={BrandColors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.white,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    width: width,
    height: 250,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
  },
  heroNavButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentCard: {
    marginTop: -20,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    backgroundColor: BrandColors.white,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  headerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  basePriceBadge: {
    alignItems: 'flex-end',
  },
  basePriceNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  basePriceUnit: {
    fontSize: 12,
    color: BrandColors.gray400,
  },
  guaranteeRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  guaranteePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  guaranteeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },

  // Segmented Tabs
  segmentedTabBar: {
    flexDirection: 'row',
    backgroundColor: BrandColors.gray100,
    borderRadius: BorderRadius.lg,
    padding: 3,
    marginVertical: Spacing.two,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  segmentedTabActive: {
    backgroundColor: BrandColors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  segmentedTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray500,
  },
  segmentedTabTextActive: {
    color: BrandColors.primary,
    fontWeight: '700',
  },

  // Packages Tab
  packagesContainer: {
    marginTop: Spacing.one,
  },
  tabSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: Spacing.two,
  },
  tabSectionDesc: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginBottom: Spacing.two,
  },
  packageCard: {
    borderWidth: 1.5,
    borderColor: BrandColors.gray200,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    backgroundColor: BrandColors.white,
  },
  packageCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  packageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BrandColors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
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
  packageName: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray800,
  },
  packageNameSelected: {
    color: BrandColors.primaryDark,
  },
  packagePriceCol: {
    alignItems: 'flex-end',
  },
  packagePriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  packageOriginalPrice: {
    fontSize: 11,
    color: BrandColors.gray400,
    textDecorationLine: 'line-through',
  },
  packageDescription: {
    fontSize: 12,
    color: BrandColors.gray600,
    marginVertical: 6,
    paddingLeft: 28,
  },
  packageLimitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 28,
    marginBottom: 4,
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 28,
    marginTop: 4,
  },
  recommendedBadge: {
    flex: 1,
  },
  recommendedText: {
    fontSize: 11,
    color: BrandColors.gray500,
    fontStyle: 'italic',
  },

  // AddOn Preview
  addOnPreviewSection: {
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray100,
  },
  addOnTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addOnTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  addOnTagImg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: BrandColors.gray200,
  },
  addOnTagName: {
    fontSize: 12,
    color: BrandColors.gray800,
    fontWeight: '500',
  },
  addOnTagPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.primary,
  },

  // Description Tab
  descriptionContainer: {
    paddingVertical: Spacing.one,
  },
  longDescription: {
    fontSize: 13,
    color: BrandColors.gray700,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  benefitsSection: {
    marginBottom: Spacing.three,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: Spacing.one,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  bulletCheck: {
    color: BrandColors.primary,
    fontWeight: '900',
  },
  bulletText: {
    fontSize: 12,
    color: BrandColors.gray600,
    flex: 1,
    lineHeight: 18,
  },
  workflowSection: {
    marginBottom: Spacing.two,
  },
  workflowStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 8,
  },
  stepIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  workflowStepText: {
    fontSize: 12,
    color: BrandColors.gray700,
    flex: 1,
  },

  // Reviews Tab
  reviewsContainer: {
    paddingVertical: Spacing.one,
  },
  reviewScoreCard: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    backgroundColor: BrandColors.gray50,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.three,
  },
  overallScoreCol: {
    alignItems: 'center',
    gap: 4,
  },
  overallScoreBig: {
    fontSize: 36,
    fontWeight: '900',
    color: BrandColors.gray900,
  },
  overallReviewCount: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  reviewItemCard: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray100,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 6,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewCustomerInfo: {
    flex: 1,
  },
  reviewCustomerName: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  reviewDate: {
    fontSize: 10,
    color: BrandColors.gray400,
  },
  reviewComment: {
    fontSize: 12,
    color: BrandColors.gray700,
    lineHeight: 18,
  },
  reviewTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  reviewTagPill: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reviewTagText: {
    fontSize: 10,
    color: BrandColors.primaryDark,
    fontWeight: '600',
  },

  // Bottom Floating Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BrandColors.white,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomLabel: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  bottomPriceBig: {
    fontSize: 18,
    fontWeight: '900',
    color: BrandColors.primary,
  },
  bottomPackageName: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.gray600,
  },
  bookNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  bookNowButtonText: {
    color: BrandColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
