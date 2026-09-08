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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { formatVND } from '@/components/common/Badge';
import { mockAIMessages } from '@/data/aiMessages';
import { AIMessage, AISuggestion } from '@/types/ai';

const QUICK_PROMPTS = [
  'Tôi cần tổng vệ sinh căn hộ 70m2',
  'Nên chọn gói 2 giờ hay 4 giờ?',
  'Chính sách hủy đơn và hoàn tiền',
  'Khuyến mãi hôm nay có gì?',
];

export default function AIAssistantScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<AIMessage[]>(mockAIMessages.slice(0, 6));
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

    // Intelligent context-aware AI simulated answer
    setTimeout(() => {
      let aiReply: AIMessage;

      if (textToSend.includes('70m2') || textToSend.includes('diện tích')) {
        aiReply = {
          id: `ai-bot-${Date.now()}`,
          conversationId: 'ai-conv-001',
          role: 'ASSISTANT',
          content:
            'Với căn hộ 70m² (thường 2 phòng ngủ), mình khuyên bạn nên chọn **Gói Tổng vệ sinh căn hộ (< 80m²)** 650.000đ để nhân viên tổng vệ sinh sạch sâu sàn, vách kính và hút bụi toàn diện nhé!',
          suggestions: [
            {
              type: 'PACKAGE',
              referenceId: 'pkg-004',
              title: 'Tổng vệ sinh căn hộ (< 80m²)',
              subtitle: '4 giờ • Làm sạch sâu toàn diện',
              price: 650000,
            },
          ],
          createdAt: new Date().toISOString(),
        };
      } else if (textToSend.includes('2 giờ') || textToSend.includes('4 giờ')) {
        aiReply = {
          id: `ai-bot-${Date.now()}`,
          conversationId: 'ai-conv-001',
          role: 'ASSISTANT',
          content:
            'Với căn hộ từ 55m² - 85m² hoặc nhà có nấu ăn, **Gói 4 giờ (320.000đ)** là tối ưu nhất. Gói 2 giờ chỉ phù hợp cho căn hộ studio hoặc dọn dẹp cơ bản.',
          suggestions: [
            {
              type: 'PACKAGE',
              referenceId: 'pkg-002',
              title: 'Giúp việc theo giờ (Gói 4 giờ)',
              subtitle: 'Phổ biến nhất • Dọn dẹp tiêu chuẩn',
              price: 320000,
            },
          ],
          createdAt: new Date().toISOString(),
        };
      } else if (textToSend.includes('khuyến mãi') || textToSend.includes('voucher')) {
        aiReply = {
          id: `ai-bot-${Date.now()}`,
          conversationId: 'ai-conv-001',
          role: 'ASSISTANT',
          content:
            'Hôm nay bạn có thể dùng mã **SUMMER20** để được giảm 20% (tối đa 50.000đ), hoặc mã **FLASH50K** trong khung giờ sáng nhé!',
          suggestions: [
            {
              type: 'PROMOTION',
              referenceId: 'promo-001',
              title: 'Mã SUMMER20 - Giảm 50.000đ',
              subtitle: 'Đơn từ 200.000đ',
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
            'Dạ em đã hiểu nhu cầu của bạn! HomeCare có đầy đủ các dịch vụ giúp việc theo giờ, tổng vệ sinh và chăm sóc gia đình với đội ngũ nhân viên 5 sao đã xác minh lý lịch rõ ràng.',
          suggestions: [
            {
              type: 'SERVICE',
              referenceId: 'srv-001',
              title: 'Giúp việc theo giờ',
              subtitle: 'Từ 80.000đ/giờ',
              price: 80000,
            },
          ],
          createdAt: new Date().toISOString(),
        };
      }

      setMessages((prev) => [...prev, aiReply]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSuggestionPress = (sug: AISuggestion) => {
    if (sug.type === 'PACKAGE' || sug.type === 'SERVICE') {
      router.push(`/service/srv-001`);
    } else if (sug.type === 'PROMOTION') {
      router.push(`/booking/new?serviceId=srv-001`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}>
          <IconSymbol name="back" size={24} color={BrandColors.gray900} />
        </Pressable>

        <View style={styles.botIconWrapper}>
          <Text style={{ fontSize: 20 }}>🤖</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Trợ lý HomeCare AI</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Tư vấn thông minh</Text>
          </View>
        </View>
      </View>

      {/* Quick Questions Chips */}
      <View style={styles.quickPromptsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptsScroll}>
          {QUICK_PROMPTS.map((prompt) => (
            <Pressable
              key={prompt}
              style={styles.promptChip}
              onPress={() => sendMessage(prompt)}>
              <Text style={styles.promptChipText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Messages Scroll Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageScroll}>
          {messages.map((msg) => {
            const isUser = msg.role === 'USER';

            return (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  isUser ? styles.msgRowRight : styles.msgRowLeft,
                ]}>
                {!isUser && (
                  <View style={styles.botAvatarMini}>
                    <Image
                      source={require('@/assets/images/ai-mascot.png')}
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.bubbleRight : styles.bubbleLeft,
                  ]}>
                  <Text
                    style={[
                      styles.bubbleText,
                      isUser ? styles.bubbleTextRight : styles.bubbleTextLeft,
                    ]}>
                    {msg.content}
                  </Text>

                  {/* Interactive Action Cards */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <View style={styles.suggestionCardsContainer}>
                      {msg.suggestions.map((sug, idx) => (
                        <Pressable
                          key={idx}
                          style={styles.suggestionCard}
                          onPress={() => handleSuggestionPress(sug)}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.sugTitle}>{sug.title}</Text>
                            {sug.subtitle && (
                              <Text style={styles.sugSubtitle}>{sug.subtitle}</Text>
                            )}
                          </View>
                          {sug.price ? (
                            <View style={styles.sugPriceCol}>
                              <Text style={styles.sugPrice}>{formatVND(sug.price)}</Text>
                              <View style={styles.sugBtn}>
                                <Text style={styles.sugBtnText}>Đặt ngay</Text>
                              </View>
                            </View>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.msgRow, styles.msgRowLeft]}>
              <View style={styles.botAvatarMini}>
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
              <View style={[styles.bubble, styles.bubbleLeft, { paddingVertical: 10 }]}>
                <Text style={{ color: BrandColors.gray500, fontSize: 12 }}>
                  HomeCare AI đang phân tích và soạn câu trả lời...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            placeholder="Hỏi AI về dịch vụ, diện tích nhà, giá cả..."
            placeholderTextColor={BrandColors.gray400}
            value={inputText}
            onChangeText={setInputText}
            style={styles.inputField}
            onSubmitEditing={() => sendMessage(inputText)}
          />
          <Pressable
            style={[
              styles.sendBtn,
              inputText.trim() ? styles.sendBtnActive : null,
            ]}
            onPress={() => sendMessage(inputText)}>
            <IconSymbol
              name="send"
              size={16}
              color={inputText.trim() ? BrandColors.white : BrandColors.gray400}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandColors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray100,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  headerInfo: {
    flex: 1,
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
    marginTop: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BrandColors.success,
  },
  onlineText: {
    fontSize: 10,
    color: BrandColors.success,
    fontWeight: '700',
  },
  quickPromptsRow: {
    paddingVertical: Spacing.one,
    backgroundColor: BrandColors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray100,
  },
  quickPromptsScroll: {
    paddingHorizontal: Spacing.two,
    gap: 6,
  },
  promptChip: {
    backgroundColor: BrandColors.white,
    borderWidth: 1,
    borderColor: BrandColors.gray200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.gray700,
  },
  messageScroll: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  botAvatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  bubbleLeft: {
    backgroundColor: BrandColors.gray100,
    borderBottomLeftRadius: 2,
  },
  bubbleRight: {
    backgroundColor: BrandColors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bubbleTextLeft: {
    color: BrandColors.gray900,
  },
  bubbleTextRight: {
    color: BrandColors.white,
  },

  // Interactive Suggestion Cards
  suggestionCardsContainer: {
    marginTop: Spacing.two,
    gap: 6,
  },
  suggestionCard: {
    backgroundColor: BrandColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BrandColors.gray200,
  },
  sugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  sugSubtitle: {
    fontSize: 10,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  sugPriceCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  sugPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  sugBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 2,
  },
  sugBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.white,
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray100,
    backgroundColor: BrandColors.white,
    gap: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: BrandColors.gray100,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.three,
    height: 40,
    fontSize: 13,
    color: BrandColors.gray900,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: BrandColors.primary,
  },
});
