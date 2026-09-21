import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  TextInput,
  Alert,
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
  getRelatedServices,
  getBundleForService,
} from '@/data';

const { width } = Dimensions.get('window');

type ActiveTab = 'CONFIG' | 'PACKAGES' | 'REVIEWS' | 'INFO';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const service = getServiceById(id || 'srv-001') || getServiceById('srv-001')!;
  const packages = getPackagesByServiceId(service.id);
  const addOns = getAddOnsByServiceId(service.id);
  const reviews = getReviewsByServiceId(service.id);
  const relatedServices = getRelatedServices(service.id);
  const serviceBundle = getBundleForService(service.id);

  const [activeTab, setActiveTab] = useState<ActiveTab>('CONFIG');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    packages.find((p) => p.isPopular)?.id || packages[0]?.id || ''
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // Dynamic Service-Specific Configuration States
  // 1. Máy lạnh
  const [acType, setAcType] = useState<'WALL' | 'CASSETTE' | 'CEILING'>('WALL');
  const [acQuantity, setAcQuantity] = useState(1);
  const [acPosition, setAcPosition] = useState<'NORMAL' | 'HIGH_LADDER'>('NORMAL');
  const [acNeedGas, setAcNeedGas] = useState(false);

  // 2. Chăm sóc trẻ em
  const [childAgeGroup, setChildAgeGroup] = useState<'INFANT' | 'TODDLER' | 'KID'>('TODDLER');
  const [childSpecialNotes, setChildSpecialNotes] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('0909123456');

  // 3. Chăm sóc người cao tuổi
  const [elderlyAge, setElderlyAge] = useState('78');
  const [elderlyMobility, setElderlyMobility] = useState<'INDEPENDENT' | 'NEED_SUPPORT' | 'BEDRIDDEN'>('NEED_SUPPORT');
  const [elderlyMedicalNotes, setElderlyMedicalNotes] = useState('');

  // 4. Chăm sóc thú cưng
  const [petType, setPetType] = useState<'DOG' | 'CAT'>('DOG');
  const [petWeight, setPetWeight] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('SMALL');

  // 5. Nấu ăn
  const [dietStyle, setDietStyle] = useState<'NORTH' | 'CENTRAL' | 'SOUTH' | 'VEGAN'>('SOUTH');
  const [memberCount, setMemberCount] = useState(4);

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
    if (service.dynamicFieldType === 'AC_CLEANING' && acQuantity > 1) {
      total = selectedPackage.price * acQuantity;
    }
    if (acNeedGas) total += 80000;

    selectedAddOnIds.forEach((addId) => {
      const add = addOns.find((a) => a.id === addId);
      if (add) total += add.price;
    });

    return total;
  };

  const handleBookNow = () => {
    // Pass configured dynamic fields to Booking Flow
    const customConfig = {
      acType,
      acQuantity,
      acPosition,
      acNeedGas,
      childAgeGroup,
      childSpecialNotes,
      emergencyPhone,
      elderlyAge,
      elderlyMobility,
      elderlyMedicalNotes,
      petType,
      petWeight,
      dietStyle,
      memberCount,
    };

    router.push({
      pathname: '/booking/new',
      params: {
        serviceId: service.id,
        packageId: selectedPackage?.id || '',
        mode: 'MODE_B',
        customConfig: JSON.stringify(customConfig),
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* HERO IMAGE */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: service.image }} style={styles.heroImage} />
          <SafeAreaView style={styles.heroOverlay} edges={['top']}>
            <Pressable
              style={styles.heroNavButton}
              onPress={() => router.back()}
              hitSlop={8}>
              <IconSymbol name="back" size={22} color={BrandColors.gray900} />
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
          <View style={styles.badgesRow}>
            {service.highlightBadges.map((badge, idx) => (
              <View key={idx} style={styles.badgePill}>
                <Text style={styles.badgePillText}>✓ {badge}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.serviceDesc}>
            {service.detailedDescription || service.description}
          </Text>
        </View>

        {/* TABS NAVIGATION */}
        <View style={styles.tabNav}>
          <Pressable
            style={[styles.tabButton, activeTab === 'CONFIG' && styles.tabButtonActive]}
            onPress={() => setActiveTab('CONFIG')}>
            <Text style={[styles.tabButtonText, activeTab === 'CONFIG' && styles.tabButtonTextActive]}>
              Thông tin dịch vụ
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'PACKAGES' && styles.tabButtonActive]}
            onPress={() => setActiveTab('PACKAGES')}>
            <Text style={[styles.tabButtonText, activeTab === 'PACKAGES' && styles.tabButtonTextActive]}>
              Gói & Tiện ích ({packages.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'INFO' && styles.tabButtonActive]}
            onPress={() => setActiveTab('INFO')}>
            <Text style={[styles.tabButtonText, activeTab === 'INFO' && styles.tabButtonTextActive]}>
              Quy trình & Tiêu chuẩn
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'REVIEWS' && styles.tabButtonActive]}
            onPress={() => setActiveTab('REVIEWS')}>
            <Text style={[styles.tabButtonText, activeTab === 'REVIEWS' && styles.tabButtonTextActive]}>
              Đánh giá ({service.reviewCount})
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: DYNAMIC CONFIGURATION FOR SERVICE */}
        {activeTab === 'CONFIG' && (
          <View style={styles.tabContentSection}>
            <Text style={styles.sectionHeading}>Tùy chỉnh thông số dịch vụ</Text>
            <Text style={styles.sectionSubtitle}>
              Thông tin cụ thể giúp nền tảng chuẩn bị thiết bị và điều phối nhân viên phù hợp nhất.
            </Text>

            {/* A. Dynamic Form: Máy Lạnh */}
            {(service.dynamicFieldType === 'AC_CLEANING' || service.dynamicFieldType === 'AC_MAINTENANCE') && (
              <View style={styles.configBlock}>
                <Text style={styles.fieldLabel}>Loại máy lạnh</Text>
                <View style={styles.optionsRow}>
                  {[
                    { id: 'WALL', label: 'Treo tường' },
                    { id: 'CASSETTE', label: 'Âm trần' },
                    { id: 'CEILING', label: 'Áp trần' },
                  ].map((item) => (
                    <Pressable
                      key={item.id}
                      style={[styles.optionPill, acType === item.id && styles.optionPillActive]}
                      onPress={() => setAcType(item.id as any)}>
                      <Text style={[styles.optionPillText, acType === item.id && styles.optionPillTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Số lượng máy cần vệ sinh</Text>
                <View style={styles.counterRow}>
                  <Pressable
                    style={styles.counterBtn}
                    onPress={() => setAcQuantity(Math.max(1, acQuantity - 1))}>
                    <Text style={styles.counterBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{acQuantity} bộ máy</Text>
                  <Pressable
                    style={styles.counterBtn}
                    onPress={() => setAcQuantity(acQuantity + 1)}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </Pressable>
                </View>

                <Text style={styles.fieldLabel}>Vị trí dàn nóng ngoài trời</Text>
                <View style={styles.optionsRow}>
                  <Pressable
                    style={[styles.optionPill, acPosition === 'NORMAL' && styles.optionPillActive]}
                    onPress={() => setAcPosition('NORMAL')}>
                    <Text style={[styles.optionPillText, acPosition === 'NORMAL' && styles.optionPillTextActive]}>
                      Ban công / Dưới 3 mét
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.optionPill, acPosition === 'HIGH_LADDER' && styles.optionPillActive]}
                    onPress={() => setAcPosition('HIGH_LADDER')}>
                    <Text style={[styles.optionPillText, acPosition === 'HIGH_LADDER' && styles.optionPillTextActive]}>
                      Trên cao / Cần thang dây
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  style={[styles.checkOption, acNeedGas && styles.checkOptionActive]}
                  onPress={() => setAcNeedGas(!acNeedGas)}>
                  <Text style={styles.checkIcon}>{acNeedGas ? '☑' : '☐'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkTitle}>Kiểm tra & Nạp bổ sung gas R32/R410A (+80.000đ)</Text>
                    <Text style={styles.checkDesc}>Đo áp suất gas bằng đồng hồ chuyên dụng trước mặt khách</Text>
                  </View>
                </Pressable>
              </View>
            )}

            {/* B. Dynamic Form: Chăm Sóc Trẻ Em */}
            {service.dynamicFieldType === 'CHILD_CARE' && (
              <View style={styles.configBlock}>
                <Text style={styles.fieldLabel}>Độ tuổi của bé</Text>
                <View style={styles.optionsRow}>
                  {[
                    { id: 'INFANT', label: 'Dưới 1 tuổi' },
                    { id: 'TODDLER', label: '1 - 3 tuổi' },
                    { id: 'KID', label: 'Trên 3 tuổi' },
                  ].map((item) => (
                    <Pressable
                      key={item.id}
                      style={[styles.optionPill, childAgeGroup === item.id && styles.optionPillActive]}
                      onPress={() => setChildAgeGroup(item.id as any)}>
                      <Text style={[styles.optionPillText, childAgeGroup === item.id && styles.optionPillTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Số điện thoại liên hệ khẩn cấp</Text>
                <TextInput
                  style={styles.inputBox}
                  value={emergencyPhone}
                  onChangeText={setEmergencyPhone}
                  keyboardType="phone-pad"
                  placeholder="Nhập số điện thoại ba/mẹ..."
                />

                <Text style={styles.fieldLabel}>Lưu ý đặc biệt (Dị ứng, giờ giấc ăn ngủ)</Text>
                <TextInput
                  style={[styles.inputBox, { height: 70 }]}
                  value={childSpecialNotes}
                  onChangeText={setChildSpecialNotes}
                  multiline
                  placeholder="Ví dụ: Bé dị ứng tôm cua, cần ru ngủ lúc 13h..."
                />
              </View>
            )}

            {/* C. Dynamic Form: Chăm Sóc Người Cao Tuổi */}
            {service.dynamicFieldType === 'ELDERLY_CARE' && (
              <View style={styles.configBlock}>
                <Text style={styles.fieldLabel}>Độ tuổi của người thân</Text>
                <TextInput
                  style={styles.inputBox}
                  value={elderlyAge}
                  onChangeText={setElderlyAge}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 75 tuổi"
                />

                <Text style={styles.fieldLabel}>Mức độ hỗ trợ sinh hoạt</Text>
                <View style={styles.optionsCol}>
                  {[
                    { id: 'INDEPENDENT', label: 'Tự đi lại được, cần nhắc thuốc và trò chuyện' },
                    { id: 'NEED_SUPPORT', label: 'Yếu sức, cần dìu đỡ khi đi lại và vệ sinh' },
                    { id: 'BEDRIDDEN', label: 'Nằm tại giường, cần hỗ trợ xoay trở và ăn uống' },
                  ].map((item) => (
                    <Pressable
                      key={item.id}
                      style={[styles.radioItem, elderlyMobility === item.id && styles.radioItemActive]}
                      onPress={() => setElderlyMobility(item.id as any)}>
                      <Text style={styles.radioDot}>{elderlyMobility === item.id ? '🔘' : '⚪'}</Text>
                      <Text style={styles.radioText}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Bệnh lý nền cần lưu ý</Text>
                <TextInput
                  style={[styles.inputBox, { height: 60 }]}
                  value={elderlyMedicalNotes}
                  onChangeText={setElderlyMedicalNotes}
                  placeholder="Ví dụ: Cao huyết áp, tiểu đường..."
                />
              </View>
            )}

            {/* D. Dynamic Form: Thú Cưng */}
            {service.dynamicFieldType === 'PET_CARE' && (
              <View style={styles.configBlock}>
                <Text style={styles.fieldLabel}>Loại thú cưng</Text>
                <View style={styles.optionsRow}>
                  <Pressable
                    style={[styles.optionPill, petType === 'DOG' && styles.optionPillActive]}
                    onPress={() => setPetType('DOG')}>
                    <Text style={[styles.optionPillText, petType === 'DOG' && styles.optionPillTextActive]}>
                      🐶 Chó cưng
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.optionPill, petType === 'CAT' && styles.optionPillActive]}
                    onPress={() => setPetType('CAT')}>
                    <Text style={[styles.optionPillText, petType === 'CAT' && styles.optionPillTextActive]}>
                      🐱 Mèo cưng
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.fieldLabel}>Cân nặng thú cưng</Text>
                <View style={styles.optionsRow}>
                  {[
                    { id: 'SMALL', label: 'Nhỏ (< 5kg)' },
                    { id: 'MEDIUM', label: 'Vừa (5 - 15kg)' },
                    { id: 'LARGE', label: 'Lớn (> 15kg)' },
                  ].map((item) => (
                    <Pressable
                      key={item.id}
                      style={[styles.optionPill, petWeight === item.id && styles.optionPillActive]}
                      onPress={() => setPetWeight(item.id as any)}>
                      <Text style={[styles.optionPillText, petWeight === item.id && styles.optionPillTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* E. Dynamic Form: Nấu Ăn */}
            {service.dynamicFieldType === 'COOKING' && (
              <View style={styles.configBlock}>
                <Text style={styles.fieldLabel}>Khẩu vị gia đình mong muốn</Text>
                <View style={styles.optionsRow}>
                  {[
                    { id: 'NORTH', label: 'Miền Bắc' },
                    { id: 'CENTRAL', label: 'Miền Trung' },
                    { id: 'SOUTH', label: 'Miền Nam' },
                    { id: 'VEGAN', label: 'Món chay' },
                  ].map((item) => (
                    <Pressable
                      key={item.id}
                      style={[styles.optionPill, dietStyle === item.id && styles.optionPillActive]}
                      onPress={() => setDietStyle(item.id as any)}>
                      <Text style={[styles.optionPillText, dietStyle === item.id && styles.optionPillTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Số người trong bữa ăn</Text>
                <View style={styles.counterRow}>
                  <Pressable
                    style={styles.counterBtn}
                    onPress={() => setMemberCount(Math.max(1, memberCount - 1))}>
                    <Text style={styles.counterBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{memberCount} người</Text>
                  <Pressable
                    style={styles.counterBtn}
                    onPress={() => setMemberCount(memberCount + 1)}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Default general requirements */}
            <View style={styles.reqBlock}>
              <Text style={styles.fieldLabel}>Khu vực cung cấp dịch vụ</Text>
              <Text style={styles.reqText}>
                📍 {service.supportedAreas?.join(' • ') || 'Nội thành TP. Hồ Chí Minh & Hà Nội'}
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
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                      <Image source={{ uri: add.image }} style={styles.addonThumb} />
                      <View style={{ flex: 1 }}>
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
                  <Text style={{ fontSize: 16 }}>💡</Text>
                  <Text style={styles.sectionHeading}>Dịch vụ thường được đặt cùng</Text>
                </View>
                <Text style={styles.subHeading}>
                  AI đề xuất các dịch vụ bổ trợ có thể thực hiện cùng thời điểm để tối ưu chi phí
                </Text>

                {relatedServices.map((item) => (
                  <View key={item.service.id} style={styles.relatedCard}>
                    <Image source={{ uri: item.service.image }} style={styles.relatedThumb} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.relatedName}>{item.service.name}</Text>
                        <View style={styles.relatedPill}>
                          <Text style={styles.relatedPillText}>AI Gợi ý</Text>
                        </View>
                      </View>
                      <Text numberOfLines={2} style={styles.relatedReason}>
                        {item.reason}
                      </Text>
                      <View style={styles.relatedFooterRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                          <Text style={styles.relatedPrice}>{formatVND(item.discountedPrice)}</Text>
                          <Text style={styles.relatedOldPrice}>{formatVND(item.service.basePrice)}</Text>
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
              Quyền lợi khi đặt qua HomeCare
            </Text>
            {service.benefits?.map((b, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>🛡️</Text>
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

            {reviews.length === 0 ? (
              <Text style={styles.emptyReviewText}>Chưa có nhận xét nào cho dịch vụ này.</Text>
            ) : (
              reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.revHeader}>
                    <Image source={{ uri: rev.customerAvatar }} style={styles.revAvatar} />
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

        <View style={{ height: 120 }} />
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
          <Text style={styles.bookNowText}>Đặt dịch vụ ngay →</Text>
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: Spacing.two,
  },
  badgePill: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  badgePillText: {
    fontSize: 11,
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
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: BrandColors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray500,
  },
  tabButtonTextActive: {
    color: BrandColors.primary,
    fontWeight: '800',
  },
  tabContentSection: {
    backgroundColor: '#FFF',
    padding: Spacing.three,
    marginTop: 8,
  },
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pkgName: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  pkgHotBadge: {
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
    alignItems: 'flex-end',
    paddingLeft: 8,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    justifyContent: 'center',
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
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  bookNowText: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  bundleCalloutBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Related Services in Detail
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 10,
  },
  relatedThumb: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  relatedName: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  relatedPill: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
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
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  relatedActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
});
