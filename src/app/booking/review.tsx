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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { RatingView } from '@/components/common/RatingView';
import { getBookingById, getStaffById, getServiceById, mockBookings } from '@/data';

const CRITERIA_LIST = [
  'Đúng giờ hẹn',
  'Nhiệt tình chu đáo',
  'Tay nghề chuyên nghiệp',
  'Gọn gàng, sạch sẽ',
  'Lịch sự, trung thực',
  'Bảo quản đồ đạc cẩn thận',
];

export default function ReviewStaffScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();

  const booking = getBookingById(bookingId || 'bk-001') || mockBookings[0];
  const service = getServiceById(booking.serviceId);
  const staff = booking.staffId ? getStaffById(booking.staffId) : getStaffById('staff-001');

  // Prevent reviewing non-completed booking
  if (booking.status !== 'COMPLETED') {
    Alert.alert(
      'Chưa thể đánh giá',
      'Đánh giá chỉ áp dụng cho đơn hàng đã hoàn tất nghiệm thu dịch vụ.',
      [{ text: 'Quay lại', onPress: () => router.back() }]
    );
  }

  const [rating, setRating] = useState(5);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([
    'Đúng giờ hẹn',
    'Tay nghề chuyên nghiệp',
  ]);
  const [comment, setComment] = useState('');

  const toggleCriteria = (item: string) => {
    if (selectedCriteria.includes(item)) {
      setSelectedCriteria(selectedCriteria.filter((c) => c !== item));
    } else {
      setSelectedCriteria([...selectedCriteria, item]);
    }
  };

  const handleSubmit = () => {
    if (!comment.trim()) {
      Alert.alert('Gợi ý', 'Vui lòng chia sẻ thêm vài dòng cảm nhận để giúp nhân viên hoàn thiện hơn nhé!');
      return;
    }

    Alert.alert(
      'Cảm ơn đánh giá của bạn!',
      `Đánh giá ${rating} sao và phản hồi quý báu của bạn đã được ghi nhận vào hồ sơ nhân viên ${staff?.fullName || ''}.`,
      [
        {
          text: 'Hoàn tất',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <IconSymbol name="close" size={20} color={BrandColors.gray800} />
        </Pressable>
        <Text style={styles.headerTitle}>Đánh giá dịch vụ</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Staff & Service Header Card */}
        <View style={styles.staffCard}>
          <Image source={{ uri: staff?.avatar }} style={styles.staffAvatar} />
          <Text style={styles.staffName}>{staff?.fullName || 'Nhân viên CleanMaster'}</Text>
          <Text style={styles.serviceName}>
            {service?.name} • Mã đơn: {booking.bookingCode}
          </Text>
        </View>

        {/* Interactive Star Rating */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Bạn hài lòng với chất lượng phục vụ chứ?</Text>
          <RatingView
            rating={rating}
            onRatingChange={setRating}
            interactive
            size={36}
          />
        </View>

        {/* Criteria Tags */}
        <View style={styles.criteriaSection}>
          <Text style={styles.sectionHeading}>Điểm nổi bật của nhân viên:</Text>
          <View style={styles.criteriaGrid}>
            {CRITERIA_LIST.map((crit) => {
              const isSelected = selectedCriteria.includes(crit);
              return (
                <Pressable
                  key={crit}
                  style={[styles.criteriaChip, isSelected && styles.criteriaChipSelected]}
                  onPress={() => toggleCriteria(crit)}>
                  <Text
                    style={[
                      styles.criteriaText,
                      isSelected && styles.criteriaTextSelected,
                    ]}>
                    {isSelected ? '✓ ' : '+ '}
                    {crit}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Detailed Comment Box */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionHeading}>Nhận xét chi tiết</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Chia sẻ trải nghiệm của bạn về thái độ phục vụ, thời gian, sự sạch sẽ..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Submit button */}
        <Pressable style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Gửi đánh giá dịch vụ</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: 14,
  },
  staffCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  serviceName: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginTop: 4,
  },
  ratingCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray800,
    marginBottom: 6,
    textAlign: 'center',
  },
  criteriaSection: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: Spacing.two,
  },
  criteriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  criteriaChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  criteriaChipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: BrandColors.primary,
  },
  criteriaText: {
    fontSize: 12,
    color: BrandColors.gray700,
    fontWeight: '500',
  },
  criteriaTextSelected: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
  commentSection: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.lg,
    padding: 12,
    fontSize: 13,
    color: BrandColors.gray900,
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    elevation: 3,
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
