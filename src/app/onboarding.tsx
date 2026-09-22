import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

const SLIDES = [
  {
    id: 'slide-1',
    icon: '🏡',
    title: 'Đa dạng dịch vụ gia đình',
    desc: 'Hơn 16 nhóm dịch vụ thiết yếu: Vệ sinh nhà, điện lạnh, chăm sóc trẻ em, người già, thú cưng và việc nhà.',
    badge: 'Toàn diện',
  },
  {
    id: 'slide-2',
    icon: '⚡',
    title: 'Đặt dịch vụ siêu nhanh',
    desc: 'Chỉ 3 bước tạo lịch hẹn. Hỗ trợ tự chọn nhân viên quen thuộc (Mode A) hoặc điều phối tự động trong 5 phút (Mode B).',
    badge: 'Nhanh chóng',
  },
  {
    id: 'slide-3',
    icon: '🛡️',
    title: 'Nhân viên 100% kiểm duyệt',
    desc: 'Thẩm định hồ sơ tư pháp, xác minh danh tính và đào tạo kỹ năng chuyên nghiệp chuẩn 5 sao an tâm tuyệt đối.',
    badge: 'Tin cậy',
  },
  {
    id: 'slide-4',
    icon: '📊',
    title: 'Theo dõi Booking minh bạch',
    desc: 'Cập nhật lộ trình thợ di chuyển, lịch sử làm việc, hóa đơn VAT điện tử và bảo hiểm hư hại rõ ràng.',
    badge: 'Minh bạch',
  },
  {
    id: 'slide-5',
    icon: '🤖',
    title: 'Trợ lý AI tư vấn 24/7',
    desc: 'Chỉ cần nói nhu cầu tự nhiên, AI sẽ phân tích diện tích, gợi ý gói dịch vụ và chọn giờ đặt phù hợp nhất.',
    badge: 'Thông minh',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setActiveSlide(index);
  };

  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top bar with Skip button */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Text style={{ fontSize: 24 }}>🏡</Text>
          <Text style={styles.logoText}>CleanMaster</Text>
        </View>
        <Pressable onPress={handleComplete}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </Pressable>
      </View>

      {/* Carousel Slides */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}>
        {SLIDES.map((slide) => (
          <View key={slide.id} style={[styles.slideBox, { width }]}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>{slide.icon}</Text>
            </View>

            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{slide.badge}</Text>
            </View>

            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.desc}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                activeSlide === idx && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <Pressable style={styles.nextBtn} onPress={handleComplete}>
          <Text style={styles.nextBtnText}>
            {activeSlide === SLIDES.length - 1 ? 'Khám phá ngay →' : 'Tiếp tục →'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.gray500,
  },
  slideBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    fontSize: 54,
  },
  badgePill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BrandColors.gray900,
    textAlign: 'center',
    marginBottom: 10,
  },
  slideDesc: {
    fontSize: 14,
    color: BrandColors.gray600,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
    alignItems: 'center',
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 24,
    backgroundColor: BrandColors.primary,
  },
  nextBtn: {
    width: '100%',
    backgroundColor: BrandColors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
