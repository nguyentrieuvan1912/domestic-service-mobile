import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { mockConversations } from '@/data/conversations';

export default function ChatListScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tin nhắn & Tư vấn</Text>
        </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Featured AI Assistant Banner */}
        <Pressable style={styles.aiBanner} onPress={() => router.push('/ai')}>
          <View style={styles.aiIconBox}>
            <Image
              source={require('@/assets/images/ai-mascot.png')}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              resizeMode="cover"
            />
          </View>
          <View style={styles.aiInfo}>
            <View style={styles.aiTitleRow}>
              <Text style={styles.aiTitle}>Trợ lý CleanMaster AI</Text>
              <View style={styles.aiOnlineBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.aiOnlineText}>Online 24/7</Text>
              </View>
            </View>
            <Text style={styles.aiLastMsg}>
              Tư vấn dịch vụ, chọn gói, so sánh giá và giải đáp chính sách...
            </Text>
          </View>
          <IconSymbol name="chevronRight" size={16} color={BrandColors.primary} />
        </Pressable>

        <Text style={styles.sectionHeader}>Nhân viên phụ trách đơn</Text>

        {/* Conversations List */}
        <View style={styles.conversationList}>
          {mockConversations.map((conv) => {
            const hasUnread = conv.unreadCountCustomer > 0;
            return (
              <Pressable
                key={conv.id}
                style={[
                  styles.convCard,
                  hasUnread && styles.convCardUnread,
                ]}
                onPress={() => router.push(`/chat/${conv.id}`)}>
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: conv.staffAvatar }} style={styles.avatar} />
                  <View style={styles.onlineDot} />
                </View>

                <View style={styles.convBody}>
                  <View style={styles.convTopRow}>
                    <Text style={[styles.staffName, hasUnread && styles.staffNameBold]}>
                      {conv.staffName}
                    </Text>
                    <Text style={styles.timeText}>
                      {new Date(conv.lastMessageTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <Text style={styles.serviceTag}>{conv.serviceName}</Text>

                  <View style={styles.convBottomRow}>
                    <Text
                      style={[styles.lastMsg, hasUnread && styles.lastMsgBold]}
                      numberOfLines={1}>
                      {conv.lastMessage}
                    </Text>
                    {hasUnread && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {conv.unreadCountCustomer}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
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
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.lg,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: Spacing.three,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  aiIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  aiInfo: {
    flex: 1,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primaryDark,
  },
  aiOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BrandColors.primary,
  },
  aiOnlineText: {
    fontSize: 9,
    fontWeight: '700',
    color: BrandColors.primaryDark,
  },
  aiLastMsg: {
    fontSize: 11,
    color: BrandColors.gray600,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray700,
    marginBottom: Spacing.two,
  },
  conversationList: {
    gap: Spacing.two,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.two,
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BrandColors.gray100,
  },
  convCardUnread: {
    backgroundColor: '#F9FAFB',
    borderColor: BrandColors.primaryLight,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: Spacing.two,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BrandColors.success,
    borderWidth: 2,
    borderColor: BrandColors.white,
  },
  convBody: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.gray900,
  },
  staffNameBold: {
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
    color: BrandColors.gray400,
  },
  serviceTag: {
    fontSize: 11,
    color: BrandColors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  convBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  lastMsg: {
    fontSize: 12,
    color: BrandColors.gray500,
    flex: 1,
    marginRight: 6,
  },
  lastMsgBold: {
    color: BrandColors.gray900,
    fontWeight: '700',
  },
  unreadBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BrandColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
