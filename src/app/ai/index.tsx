import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { AIChatBubble } from '@/components/common/AIChatBubble';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { mockAIMessages } from '@/data/aiMessages';
import { AIMessage, AISuggestion } from '@/types/ai';

const QUICK_PROMPTS = [
  'Tôi muốn vệ sinh 3 máy lạnh vào chiều thứ bảy',
  'Tìm bảo mẫu trông bé 2 tuổi bán thời gian',
  'Nhà 70m2 nên đặt gói dọn dẹp nào?',
  'Khuyến mãi & mã giảm giá hôm nay có gì?',
  'Chính sách bảo hiểm hư hại của CleanMaster',
];

export default function AIAssistantScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<AIMessage[]>(mockAIMessages.slice(0, 4));
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const sendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: AIMessage = {
      id: `ai-user-${Date.now()}`,
      conversationId: 'ai-conv-001',
      role: 'USER',
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Natural language context-aware AI response
    setTimeout(() => {
      const q = textToSend.toLowerCase();
      let aiReply: AIMessage;

      if (q.includes('máy lạnh') || q.includes('điều hòa')) {
        aiReply = {
          id: `ai-bot-${Date.now()}`,
          conversationId: 'ai-conv-001',
          role: 'ASSISTANT',
          content:
            'Dạ em đã ghi nhận nhu cầu của bạn:\n• Dịch vụ: **Vệ sinh máy lạnh**\n• Số lượng dự kiến: **3 bộ máy**\n• Thời gian đề xuất: **Chiều Thứ Bảy (14:00 - 16:00)**\n\nEm gợi ý bạn chọn **Combo 3 máy lạnh (380.000đ)** kèm Add-on **Khử khuẩn Nano Bạc** để tối ưu chi phí và bảo hành 30 ngày nhé!',
          suggestions: [
            {
              type: 'PACKAGE',
              referenceId: 'pkg-014',
              title: 'Combo vệ sinh 3 máy lạnh',
              subtitle: 'Tiết kiệm 100k • Tặng kiểm tra gas',
              price: 380000,
            },
            {
              type: 'SERVICE',
              referenceId: 'srv-004',
              title: 'Chi tiết dịch vụ Vệ sinh máy lạnh',
              subtitle: 'Thợ điện lạnh chuyên nghiệp',
              price: 150000,
            },
          ],
          createdAt: new Date().toISOString(),
        };
      } else if (q.includes('trẻ em') || q.includes('bé') || q.includes('bảo mẫu')) {
        aiReply = {
          id: `ai-bot-${Date.now()}`,
          conversationId: 'ai-conv-001',
          role: 'ASSISTANT',
          content:
            'Với nhu cầu trông bé, CleanMaster có đội ngũ **Bảo mẫu mầm non** đã qua kiểm tra lý lịch tư pháp số 2 và có chứng chỉ sư phạm mầm non. Bạn có thể chọn ca 4 giờ hoặc ca nguyên ngày 8 giờ.',
          suggestions: [
            {
              type: 'SERVICE',
              referenceId: 'srv-009',
              title: 'Bảo mẫu & Chăm sóc trẻ em',
              subtitle: '100% nhân viên lý lịch sạch',
              price: 120000,
            },
          ],
          createdAt: new Date().toISOString(),
        };
      } else if (q.includes('người già') || q.includes('người cao tuổi') || q.includes('ông bà')) {
        aiReply = {
          id: `ai-bot-${Date.now()}`,
          conversationId: 'ai-conv-001',
          role: 'ASSISTANT',
          content:
            'Dịch vụ **Chăm sóc người cao tuổi** có nhân viên được đào tạo kỹ năng điều dưỡng gia đình, đo huyết áp, nhắc uống thuốc và hỗ trợ vận động an toàn.',
          suggestions: [
            {
              type: 'SERVICE',
              referenceId: 'srv-010',
              title: 'Chăm sóc người cao tuổi',
              subtitle: 'Điều dưỡng tận tâm, nhẹ nhàng',
              price: 130000,
            },
          ],
          createdAt: new Date().toISOString(),
        };
      } else if (q.includes('70m2') || q.includes('tổng vệ sinh') || q.includes('căn hộ')) {
        aiReply = {
          id: `ai-bot-${Date.now()}`,
          conversationId: 'ai-conv-001',
          role: 'ASSISTANT',
          content:
            'Với căn hộ 70m² (2 phòng ngủ), em khuyên bạn nên chọn **Gói Tổng vệ sinh căn hộ tiêu chuẩn (60 - 90m²)** 1.100.000đ để nhân viên tẩy cặn canxi kính, hút bụi trần sàn và chà sàn công nghiệp nhé!',
          suggestions: [
            {
              type: 'PACKAGE',
              referenceId: 'pkg-009',
              title: 'Tổng vệ sinh căn hộ (60–90m²)',
              subtitle: 'Làm sạch sâu toàn diện',
              price: 1100000,
            },
          ],
          createdAt: new Date().toISOString(),
        };
      } else if (q.includes('khuyến mãi') || q.includes('voucher') || q.includes('giảm giá')) {
        aiReply = {
          id: `ai-bot-${Date.now()}`,
          conversationId: 'ai-conv-001',
          role: 'ASSISTANT',
          content:
            'Hôm nay bạn có thể nhập mã **FLASH50K** để được giảm ngay 50.000đ cho mọi đơn dịch vụ gia đình, hoặc mã **SUMMER20** giảm 20% đơn từ 200.000đ!',
          suggestions: [
            {
              type: 'PROMOTION',
              referenceId: 'promo-002',
              title: 'Mã FLASH50K - Giảm 50.000đ',
              subtitle: 'Áp dụng cho mọi đơn',
            },
          ],
          createdAt: new Date().toISOString(),
        };
      } else {
        aiReply = {
          id: `ai-bot-${Date.now()}`,
          conversationId: 'ai-conv-001',
          role: 'ASSISTANT',
          content:
            'Em là CleanMaster AI. Nền tảng hiện cung cấp đầy đủ 16 dịch vụ gia đình: vệ sinh nhà, điện lạnh, máy giặt, chăm sóc trẻ em, người già, thú cưng, nấu ăn, đi chợ hộ. Bạn cần em tư vấn dịch vụ nào ạ?',
          suggestions: [
            {
              type: 'SERVICE',
              referenceId: 'srv-001',
              title: 'Vệ sinh nhà theo giờ',
              subtitle: 'Linh hoạt 2 - 4h',
              price: 80000,
            },
          ],
          createdAt: new Date().toISOString(),
        };
      }

      setMessages((prev) => [...prev, aiReply]);
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1200);
  };

  const handleSuggestionPress = (sug: AISuggestion) => {
    if (sug.type === 'PACKAGE' || sug.type === 'SERVICE') {
      const targetId = sug.referenceId.startsWith('srv') ? sug.referenceId : 'srv-004';
      router.push(`/service/${targetId}`);
    } else if (sug.type === 'PROMOTION') {
      router.push('/(tabs)/services');
    }
  };

  const handleClearHistory = () => {
    setMessages(mockAIMessages.slice(0, 1));
    setShowClearModal(false);
    Alert.alert('Đã xóa', 'Lịch sử hội thoại với Trợ lý AI đã được làm mới.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <IconSymbol name="back" size={20} color={BrandColors.gray800} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Image
            source={require('@/assets/images/ai-mascot.png')}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerTitle}>Trợ lý CleanMaster AI</Text>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Luôn sẵn sàng tư vấn 24/7</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.trashBtn}
          onPress={() => setShowClearModal(true)}
          hitSlop={8}>
          <IconSymbol name="close" size={18} color={BrandColors.gray500} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        {/* MESSAGES SCROLL VIEW */}
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}>
          {messages.map((msg) => (
            <AIChatBubble
              key={msg.id}
              message={msg}
              onSuggestionPress={handleSuggestionPress}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <View style={styles.typingBox}>
              <Text style={styles.typingText}>🤖 CleanMaster AI đang suy nghĩ câu trả lời...</Text>
            </View>
          )}
        </ScrollView>

        {/* QUICK PROMPTS CHIPS */}
        <View style={styles.quickPromptsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickScroll}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <Pressable
                key={idx}
                style={styles.quickChip}
                onPress={() => sendMessage(prompt)}>
                <Text style={styles.quickChipText}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* INPUT BAR */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Hỏi về dịch vụ, giá tiền, chọn thợ..."
            placeholderTextColor={BrandColors.gray400}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(inputText)}
          />
          <Pressable
            style={[
              styles.sendBtn,
              inputText.trim().length > 0 && styles.sendBtnActive,
            ]}
            onPress={() => sendMessage(inputText)}>
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Clear conversation modal */}
      <ConfirmModal
        visible={showClearModal}
        title="Làm mới cuộc trò chuyện"
        message="Bạn có chắc chắn muốn xóa toàn bộ lịch sử tư vấn và bắt đầu đoạn chat mới?"
        confirmText="Xóa lịch sử"
        cancelText="Hủy"
        isDestructive
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearModal(false)}
      />
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
    paddingVertical: 10,
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 10,
    color: BrandColors.gray500,
  },
  trashBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    padding: Spacing.three,
    paddingBottom: 16,
  },
  typingBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  typingText: {
    fontSize: 12,
    color: BrandColors.gray600,
    fontStyle: 'italic',
  },
  quickPromptsWrapper: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickScroll: {
    paddingHorizontal: Spacing.three,
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  quickChipText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: BrandColors.gray900,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: BrandColors.primary,
  },
  sendIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
