import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import type { Customer } from '@/types/user';
import type { BookingMode } from '@/types/booking';

import { useAdministrativeUnits } from '@/hooks/use-administrative-units';
import { WardSelect } from '@/components/common/WardSelect';

interface RequireAddressViewProps {
  mode?: BookingMode | null;
  currentCustomer?: Customer | null;
  onManageAddresses: () => void;
  onBack: () => void;
  mutateAddress: (path: string, method: string, body?: object) => Promise<any>;
  onAddressCreated?: () => void;
}

const POPULAR_LABELS = ['Nhà riêng', 'Chung cư', 'Cơ quan', 'Nhà bố mẹ'];
const POPULAR_DISTRICTS = ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh', 'Gò Vấp', 'Tân Bình', 'Thủ Đức'];

export const RequireAddressView: React.FC<RequireAddressViewProps> = ({
  mode = 'MODE_A',
  currentCustomer,
  onManageAddresses,
  onBack,
  mutateAddress,
  onAddressCreated,
}) => {
  const administrative = useAdministrativeUnits();
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal form states
  const [title, setTitle] = useState('Nhà riêng');
  const [recipientName, setRecipientName] = useState(currentCustomer?.fullName || '');
  const [recipientPhone, setRecipientPhone] = useState(currentCustomer?.phone || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('Quận 1');
  const [note, setNote] = useState('');

  const openAddModal = () => {
    setTitle('Nhà riêng');
    setRecipientName(currentCustomer?.fullName || '');
    setRecipientPhone(currentCustomer?.phone || '');
    setStreetAddress('');
    setWard('');
    setDistrict('Quận 1');
    setNote('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (saving) return;
    if (!streetAddress.trim() || !recipientName.trim() || !recipientPhone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ tên người nhận, số điện thoại và địa chỉ cụ thể.');
      return;
    }

    const selectedWard = administrative.units.find(unit => unit.name === ward.trim());
    if (!selectedWard && !district.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn phường/xã hoặc quận/huyện.');
      return;
    }

    setSaving(true);
    try {
      await mutateAddress('/customer/addresses', 'POST', {
        title: title.trim() || 'Nhà riêng',
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        streetAddress: streetAddress.trim(),
        district: selectedWard ? '' : district.trim(),
        ward: selectedWard ? selectedWard.name : '',
        note: note.trim(),
        city: 'TP. Hồ Chí Minh',
        isDefault: true,
      });

      setModalVisible(false);
      if (onAddressCreated) {
        onAddressCreated();
      }
    } catch (cause) {
      Alert.alert(
        'Chưa lưu được địa chỉ',
        cause instanceof Error ? cause.message : 'Vui lòng kiểm tra lại thông tin và thử lại.'
      );
    } finally {
      setSaving(false);
    }
  };

  const isModeA = mode === 'MODE_A' || !mode;

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Navigation Header */}
        <View style={styles.headerWrapper}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              style={styles.backButton}
              onPress={onBack}
              hitSlop={8}>
              <IconSymbol name="arrowBack" size={20} color={BrandColors.gray900} />
            </Pressable>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Địa chỉ làm việc
              </Text>
              <Text style={styles.headerStepBadge}>
                {isModeA ? 'Bước 1 / 8 • Chọn nhân viên' : 'Bước 1 / 8 • Thiết lập địa chỉ'}
              </Text>
            </View>

            <View style={styles.placeholderBtn} />
          </View>

          {/* Progress bar line */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '12.5%' }]} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Mode Pill Notice */}
          <View style={styles.modeNoticeCard}>
            <View style={styles.modeIconCircle}>
              <IconSymbol name={isModeA ? 'user' : 'sparkle'} size={20} color={BrandColors.primary} />
            </View>
            <View style={styles.modeNoticeTextCol}>
              <View style={styles.modeBadgeRow}>
                <Text style={styles.modeNoticeHeading}>
                  {isModeA ? 'Chọn nhân viên trực tiếp' : 'Đặt dịch vụ'}
                </Text>
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{isModeA ? 'Tự chọn' : 'Tự động'}</Text>
                </View>
              </View>
              <Text style={styles.modeNoticeDesc}>
                {isModeA
                  ? 'Cần vị trí địa chỉ để gợi ý các nhân viên đang hoạt động gần bạn nhất.'
                  : 'Cần vị trí địa chỉ để hệ thống điều phối nhân viên đến làm việc đúng giờ.'}
              </Text>
            </View>
          </View>

          {/* Main Visual Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconBadge}>
              <IconSymbol name="location" size={40} color={BrandColors.primary} />
            </View>

            <Text style={styles.heroTitle}>Thêm địa chỉ trước khi đặt dịch vụ</Text>
            <Text style={styles.heroSubtitle}>
              Hiện bạn chưa lưu địa chỉ nào trong sổ địa chỉ. Hãy thêm địa chỉ phục vụ để hệ thống lọc danh sách người giúp việc phù hợp và tính toán thời gian di chuyển chuẩn xác.
            </Text>

            {/* Benefit Highlights */}
            <View style={styles.benefitBox}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconWrap}>
                  <IconSymbol name="user" size={16} color={BrandColors.primary} />
                </View>
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>Đề xuất nhân viên gần bạn nhất</Text>
                  <Text style={styles.benefitDesc}>
                    Ưu tiên nhân viên trong cùng quận/huyện để giảm tối đa thời gian chờ đợi.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitDivider} />

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconWrap}>
                  <IconSymbol name="clock" size={16} color={BrandColors.primary} />
                </View>
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>Chính xác lịch làm việc & giờ đến</Text>
                  <Text style={styles.benefitDesc}>
                    Kiểm tra lịch trống và đảm bảo thợ có mặt đúng giờ cam kết.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitDivider} />

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconWrap}>
                  <IconSymbol name="shield" size={16} color={BrandColors.primary} />
                </View>
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>Lưu tự động cho lần sau</Text>
                  <Text style={styles.benefitDesc}>
                    Chỉ cần tạo một lần, tự động lưu vào sổ địa chỉ để sử dụng nhiều lần.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Primary Action: Thêm địa chỉ mới ngay */}
            <Pressable
              style={styles.primaryBtn}
              onPress={openAddModal}
              accessibilityRole="button">
              <LinearGradient
                colors={BrandColors.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}>
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Thêm địa chỉ mới ngay</Text>
              </LinearGradient>
            </Pressable>

            {/* Secondary Action: Quản lý địa chỉ */}
            <Pressable
              style={styles.secondaryBtn}
              onPress={onManageAddresses}
              accessibilityRole="button">
              <IconSymbol name="location" size={18} color={BrandColors.primaryDark} />
              <Text style={styles.secondaryBtnText}>Quản lý địa chỉ</Text>
            </Pressable>

            {/* Back action */}
            <Pressable
              style={styles.backLinkBtn}
              onPress={onBack}
              accessibilityRole="button">
              <IconSymbol name="arrowBack" size={16} color={BrandColors.gray600} />
              <Text style={styles.backLinkText}>Quay lại</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Modal Thêm Địa Chỉ Nhanh */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalHeaderIconWrap}>
                    <IconSymbol name="location" size={20} color={BrandColors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Thêm địa chỉ làm việc mới</Text>
                </View>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setModalVisible(false)}
                  hitSlop={8}>
                  <IconSymbol name="close" size={18} color={BrandColors.gray600} />
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalFormContent}>
                {/* Tên gợi nhớ */}
                <Text style={styles.fieldLabel}>Tên gợi nhớ</Text>
                <View style={styles.chipsRow}>
                  {POPULAR_LABELS.map((item) => {
                    const isSelected = title === item;
                    return (
                      <Pressable
                        key={item}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => setTitle(item)}>
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ví dụ: Nhà riêng, Chung cư, Cơ quan..."
                  placeholderTextColor={BrandColors.gray400}
                />

                {/* Người nhận */}
                <Text style={styles.fieldLabel}>
                  Họ tên người nhận <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={recipientName}
                  onChangeText={setRecipientName}
                  placeholder="Họ và tên của bạn"
                  placeholderTextColor={BrandColors.gray400}
                />

                {/* Số điện thoại */}
                <Text style={styles.fieldLabel}>
                  Số điện thoại liên hệ <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={recipientPhone}
                  onChangeText={setRecipientPhone}
                  placeholder="09xx xxx xxx"
                  placeholderTextColor={BrandColors.gray400}
                  keyboardType="phone-pad"
                />

                {/* Địa chỉ cụ thể */}
                <Text style={styles.fieldLabel}>
                  Địa chỉ cụ thể (Số nhà, tên đường, căn hộ) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                  placeholder="Ví dụ: Số 123 Nguyễn Thị Minh Khai, Tòa A"
                  placeholderTextColor={BrandColors.gray400}
                />

                {/* Quận / Huyện */}
                <Text style={styles.fieldLabel}>
                  Quận / Huyện <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.chipsRow}>
                  {POPULAR_DISTRICTS.map((item) => {
                    const isSelected = district === item;
                    return (
                      <Pressable
                        key={item}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => setDistrict(item)}>
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  style={styles.input}
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="Nhập hoặc chọn quận / huyện"
                  placeholderTextColor={BrandColors.gray400}
                />

                {/* Phường / Xã */}
                <Text style={styles.fieldLabel}>Phường / Xã (TP. Hồ Chí Minh)</Text>
                <WardSelect
                  value={ward}
                  onChange={setWard}
                  units={administrative.units}
                  loading={administrative.loading}
                  error={administrative.error}
                  retry={administrative.retry}
                />

                {/* Ghi chú chỉ đường */}
                <Text style={styles.fieldLabel}>Ghi chú chỉ đường (tùy chọn)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ví dụ: Bấm chuông tầng 5, phòng 502..."
                  placeholderTextColor={BrandColors.gray400}
                  multiline
                  numberOfLines={2}
                />

                {/* Save button */}
                <Pressable
                  style={styles.modalSaveBtn}
                  disabled={saving}
                  onPress={handleSave}>
                  <LinearGradient
                    colors={BrandColors.primaryGradient}
                    style={styles.modalSaveGradient}>
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <IconSymbol name="check" size={18} color="#FFFFFF" />
                        <Text style={styles.modalSaveText}>Lưu & Tiếp tục đặt dịch vụ</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  placeholderBtn: {
    width: 38,
    height: 38,
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
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
  },

  // Mode notice
  modeNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.two + 4,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  modeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeNoticeTextCol: {
    flex: 1,
  },
  modeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  modeNoticeHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  tagPill: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  modeNoticeDesc: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 16,
  },

  // Main Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: Spacing.four,
  },
  heroIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.primaryLight,
    borderWidth: 3,
    borderColor: 'rgba(0, 176, 116, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.gray900,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: BrandColors.gray600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.four,
  },

  // Benefit Box
  benefitBox: {
    width: '100%',
    backgroundColor: BrandColors.gray50,
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  benefitIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12,
    color: BrandColors.gray600,
    lineHeight: 16,
  },
  benefitDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },

  // Actions Container
  actionsContainer: {
    gap: 12,
  },
  primaryBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.four,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: BrandColors.primary,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  secondaryBtnText: {
    color: BrandColors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  backLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  backLinkText: {
    color: BrandColors.gray600,
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeaderIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormContent: {
    padding: Spacing.three,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandColors.gray800,
    marginTop: 10,
    marginBottom: 6,
  },
  requiredStar: {
    color: BrandColors.danger,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.gray100,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  chipSelected: {
    backgroundColor: BrandColors.primaryLight,
    borderColor: BrandColors.primary,
  },
  chipText: {
    fontSize: 12,
    color: BrandColors.gray700,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: BrandColors.primaryDark,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: BrandColors.gray900,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  modalSaveBtn: {
    marginTop: Spacing.four,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
