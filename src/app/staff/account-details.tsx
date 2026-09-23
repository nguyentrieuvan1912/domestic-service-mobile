import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';
import { StaffService } from '@/data/staffService';

type DetailSection = 'badges' | 'skills' | 'reviews';

const PAGE_COPY: Record<DetailSection, { title: string; description: string }> = {
  badges: { title: 'Huy hiệu khen ngợi', description: 'Những điểm mạnh được khách hàng ghi nhận.' },
  skills: { title: 'Kỹ năng & chuyên môn', description: 'Các dịch vụ bạn đã được xác nhận đủ điều kiện thực hiện.' },
  reviews: { title: 'Nhận xét từ khách hàng', description: 'Các phản hồi gần đây giúp bạn theo dõi chất lượng phục vụ.' },
};

const BADGES = [
  { icon: '⏱️', label: 'Đúng giờ', count: 182 },
  { icon: '✨', label: 'Cẩn thận & Tỉ mỉ', count: 210 },
  { icon: '😊', label: 'Thân thiện, trung thực', count: 154 },
  { icon: '🧼', label: 'Sạch sẽ vượt mong đợi', count: 198 },
  { icon: '⚡', label: 'Tác phong chuyên nghiệp', count: 120 },
];

const SKILLS = ['Vệ sinh nhà theo giờ', 'Tổng vệ sinh căn hộ', 'Ủi đồ chuyên nghiệp', 'Nấu ăn gia đình'];

export default function StaffAccountDetailsScreen() {
  const router = useRouter();
  const { section: rawSection } = useLocalSearchParams<{ section?: string }>();
  const section: DetailSection = rawSection === 'skills' || rawSection === 'reviews' ? rawSection : 'badges';
  const page = PAGE_COPY[section];
  const reviews = StaffService.getStaffReviews();

  return <View style={styles.root}>
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><IconSymbol name="back" size={24} color={BrandColors.gray800} /></Pressable>
        <Text style={styles.headerTitle}>{page.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.description}>{page.description}</Text>

        {section === 'badges' && <View style={styles.card}>
          {BADGES.map((badge) => <View key={badge.label} style={styles.badgeRow}>
            <View style={styles.badgeIcon}><Text style={styles.badgeEmoji}>{badge.icon}</Text></View>
            <View style={styles.detailCopy}><Text style={styles.detailTitle}>{badge.label}</Text><Text style={styles.detailSub}>Được khách hàng khen {badge.count} lần</Text></View>
            <Text style={styles.badgeCount}>{badge.count}</Text>
          </View>)}
        </View>}

        {section === 'skills' && <View style={styles.card}>
          {SKILLS.map((skill) => <View key={skill} style={styles.skillRow}>
            <View style={styles.skillCheck}><Text style={styles.skillCheckText}>✓</Text></View>
            <View style={styles.detailCopy}><Text style={styles.detailTitle}>{skill}</Text><Text style={styles.detailSub}>Đã xác minh năng lực</Text></View>
          </View>)}
        </View>}

        {section === 'reviews' && <View style={styles.card}>
          {reviews.map((review) => <View key={review.id} style={styles.reviewItem}>
            <View style={styles.reviewTop}>
              <Image source={{ uri: review.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80' }} style={styles.reviewerAvatar} />
              <View style={styles.detailCopy}><Text style={styles.detailTitle}>{review.customerName}</Text><Text style={styles.reviewDate}>{review.createdAt.split('T')[0]}</Text></View>
              <Text style={styles.rating}>{'★'.repeat(review.rating)}<Text style={styles.emptyStars}>{'★'.repeat(5 - review.rating)}</Text></Text>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
          </View>)}
        </View>}
      </ScrollView>
    </SafeAreaView>
    <StaffBottomNav activeTab="profile" />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  screen: { flex: 1 },
  header: { height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: BrandColors.gray900, fontSize: 17, fontWeight: '900' },
  headerSpacer: { width: 36 },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  description: { color: BrandColors.gray500, fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  badgeRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  badgeIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  badgeEmoji: { fontSize: 20 },
  detailCopy: { flex: 1 },
  detailTitle: { color: BrandColors.gray900, fontSize: 13, fontWeight: '900' },
  detailSub: { color: BrandColors.gray500, fontSize: 11, marginTop: 3 },
  badgeCount: { color: '#047857', fontSize: 16, fontWeight: '900' },
  skillRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  skillCheck: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#047857', alignItems: 'center', justifyContent: 'center' },
  skillCheckText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  reviewItem: { padding: 14, gap: 9, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewerAvatar: { width: 38, height: 38, borderRadius: 19 },
  reviewDate: { color: BrandColors.gray400, fontSize: 10, marginTop: 2 },
  rating: { color: '#F59E0B', fontSize: 12, letterSpacing: 1 },
  emptyStars: { color: '#E2E8F0' },
  reviewComment: { color: BrandColors.gray700, fontSize: 12, lineHeight: 18 },
});
