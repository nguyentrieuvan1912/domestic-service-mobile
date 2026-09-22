import React, { useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { mockConversations } from '@/data/conversations';
import { getMessagesByConversationId } from '@/data';
import { mockBookings } from '@/data/bookings';
import { ChatMessage } from '@/types/chat';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const conversation =
    mockConversations.find((c) => c.id === id) || mockConversations[0];
  const initialMessages = getMessagesByConversationId(conversation.id);

  // Check booking status for locking rule (Section 17)
  const relatedBooking = mockBookings.find((b) => b.id === conversation.bookingId);
  const isLocked = relatedBooking
    ? ['COMPLETED', 'CANCELLED', 'ABSENT'].includes(relatedBooking.status)
    : false;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (isLocked) {
      Alert.alert(
        'Đã khóa chat',
        'Cuộc trò chuyện đã được khóa tự động sau khi đơn hàng hoàn tất/kết thúc để bảo vệ thông tin cá nhân.'
      );
      return;
    }

    if (!inputText.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: conversation.id,
      senderId: conversation.customerId,
      senderName: conversation.customerName,
      senderAvatar: conversation.customerAvatar,
      senderType: 'CUSTOMER',
      content: inputText.trim(),
      contentType: 'TEXT',
      isRead: true,
      sentAt: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Auto simulated reply from staff after 1.2s
    setTimeout(() => {
      const staffReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        conversationId: conversation.id,
        senderId: conversation.staffId,
        senderName: conversation.staffName,
        senderAvatar: conversation.staffAvatar,
        senderType: 'STAFF',
        content: 'Dạ vâng, em đã nhận được tin nhắn và sẽ chuẩn bị chu đáo ạ!',
        contentType: 'TEXT',
        isRead: true,
        sentAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, staffReply]);
    }, 1200);
  };

  const handleCall = () => {
    if (isLocked) {
      Alert.alert(
        'Đã khóa cuộc gọi',
        'Tính năng gọi thoại qua nền tảng đã khóa tự động sau khi đơn hoàn tất theo quy định bảo mật.'
      );
      return;
    }

    Alert.alert(
      'Cuộc gọi thoại bảo mật CleanMaster',
      'Đang kết nối qua tổng đài thoại nội bộ của nền tảng. Số điện thoại cá nhân và email của đôi bên được bảo mật an toàn.',
      [{ text: 'Đồng ý' }, { text: 'Hủy', style: 'cancel' }]
    );
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

        <Image source={{ uri: conversation.staffAvatar }} style={styles.headerAvatar} />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{conversation.staffName}</Text>
          <Text style={styles.headerSubtitle}>
            {conversation.serviceName} • {isLocked ? 'Đã hoàn thành' : 'Đang xử lý'}
          </Text>
        </View>

        <Pressable
          style={[styles.callBtn, isLocked && styles.callBtnDisabled]}
          onPress={handleCall}>
          <IconSymbol
            name="phone"
            size={16}
            color={isLocked ? BrandColors.gray400 : BrandColors.primary}
          />
        </Pressable>
      </View>

      {/* Security Privacy Notice Banner (Section 17 & 29) */}
      <View style={[styles.privacyBanner, isLocked && styles.privacyBannerLocked]}>
        <IconSymbol
          name="shield"
          size={14}
          color={isLocked ? BrandColors.warning : BrandColors.primary}
        />
        <Text style={[styles.privacyBannerText, isLocked && styles.privacyBannerTextLocked]}>
          {isLocked
            ? 'Khóa kênh chat: Đơn dịch vụ đã kết thúc. Mọi trao đổi đã đóng theo quy định bảo mật thông tin.'
            : 'Liên lạc bảo mật qua hệ thống: Không chia sẻ thông tin cá nhân hoặc giao dịch ngoài nền tảng.'}
        </Text>
      </View>

      {/* Messages Scroll Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messageScroll}>
          {messages.map((msg) => {
            const isMe = msg.senderType === 'CUSTOMER';
            const isSystem = msg.senderType === 'SYSTEM';

            if (isSystem) {
              return (
                <View key={msg.id} style={styles.systemMsgBox}>
                  <Text style={styles.systemMsgText}>{msg.content}</Text>
                </View>
              );
            }

            return (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  isMe ? styles.msgRowRight : styles.msgRowLeft,
                ]}>
                {!isMe && (
                  <Image source={{ uri: msg.senderAvatar }} style={styles.msgAvatar} />
                )}

                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.bubbleRight : styles.bubbleLeft,
                  ]}>
                  <Text
                    style={[
                      styles.bubbleText,
                      isMe ? styles.bubbleTextRight : styles.bubbleTextLeft,
                    ]}>
                    {msg.content}
                  </Text>
                  <Text
                    style={[
                      styles.bubbleTime,
                      isMe ? styles.bubbleTimeRight : styles.bubbleTimeLeft,
                    ]}>
                    {new Date(msg.sentAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar or Locked Notice */}
        {isLocked ? (
          <View style={styles.lockedBar}>
            <Text style={styles.lockedText}>
              🔒 Kênh liên lạc đã đóng sau khi hoàn tất đơn hàng
            </Text>
          </View>
        ) : (
          <View style={styles.inputBar}>
            <TextInput
              placeholder="Nhập tin nhắn trao đổi qua nền tảng..."
              placeholderTextColor={BrandColors.gray400}
              value={inputText}
              onChangeText={setInputText}
              style={styles.inputField}
              onSubmitEditing={handleSend}
            />
            <Pressable
              style={[
                styles.sendBtn,
                inputText.trim() ? styles.sendBtnActive : null,
              ]}
              onPress={handleSend}>
              <IconSymbol
                name="send"
                size={16}
                color={inputText.trim() ? BrandColors.white : BrandColors.gray400}
              />
            </Pressable>
          </View>
        )}
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
    backgroundColor: BrandColors.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: Spacing.two,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  headerSubtitle: {
    fontSize: 11,
    color: BrandColors.gray500,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.one,
  },
  callBtnDisabled: {
    borderColor: BrandColors.gray300,
    backgroundColor: BrandColors.gray100,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  privacyBannerLocked: {
    backgroundColor: '#FFFBEB',
    borderBottomColor: '#FDE68A',
  },
  privacyBannerText: {
    flex: 1,
    fontSize: 11,
    color: BrandColors.primaryDark,
    lineHeight: 14,
  },
  privacyBannerTextLocked: {
    color: '#92400E',
  },
  messageScroll: {
    padding: Spacing.three,
    paddingBottom: Spacing.two,
  },
  systemMsgBox: {
    alignSelf: 'center',
    backgroundColor: BrandColors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginVertical: Spacing.two,
    maxWidth: '85%',
  },
  systemMsgText: {
    fontSize: 11,
    color: BrandColors.gray600,
    textAlign: 'center',
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: Spacing.two,
    alignItems: 'flex-end',
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
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
    lineHeight: 18,
  },
  bubbleTextLeft: {
    color: BrandColors.gray900,
  },
  bubbleTextRight: {
    color: BrandColors.white,
  },
  bubbleTime: {
    fontSize: 9,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  bubbleTimeLeft: {
    color: BrandColors.gray400,
  },
  bubbleTimeRight: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
    backgroundColor: BrandColors.white,
    gap: 8,
  },
  inputField: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: BrandColors.gray50,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: BrandColors.gray900,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: BrandColors.primary,
  },
  lockedBar: {
    padding: Spacing.three,
    backgroundColor: BrandColors.gray100,
    borderTopWidth: 1,
    borderTopColor: BrandColors.gray200,
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 12,
    color: BrandColors.gray600,
    fontWeight: '600',
  },
});
