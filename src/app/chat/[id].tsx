import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { ChatRepository, createChatDraft, getChatActor } from '@/data/chatRepository';
import { StaffRepository } from '@/data/staffRepository';
import { canSendChat, CHAT_PHASE_LABELS, CHAT_TIME_ZONE, isOwnChatMessage } from '@/data/chatPolicy';
import type { ChatActor, ChatBookingPhase } from '@/data/chatPolicy';
import type { ChatMessage, Conversation } from '@/types/chat';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const { currentUser, currentRole } = useAuth();
  const actor = useMemo(() => getChatActor(currentUser), [currentUser]);
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  useEffect(() => {
    const unsubscribeBooking = StaffRepository.subscribe(refresh);
    const unsubscribeChat = ChatRepository.subscribe(refresh);
    return () => { unsubscribeBooking(); unsubscribeChat(); };
  }, []);
  const access = ChatRepository.access(typeof id === 'string' ? id : undefined, actor);
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(currentRole === 'STAFF' ? '/staff/jobs' : '/(tabs)/chat');
  };

  if (access.kind !== 'READY' || !actor) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn} accessibilityLabel="Quay lại">
            <IconSymbol name="back" size={22} color={BrandColors.gray700} />
          </Pressable>
          <Text style={styles.headerName}>Tin nhắn</Text>
        </View>
        <View style={styles.stateBox}>
          <IconSymbol name="chat" size={32} color={BrandColors.gray500} />
          <Text style={styles.stateTitle}>{access.kind === 'FORBIDDEN' ? 'Không có quyền truy cập' : 'Không thể mở cuộc trò chuyện'}</Text>
          <Text style={styles.stateText}>{access.kind !== 'READY' ? access.reason : 'Vui lòng đăng nhập lại.'}</Text>
          <Pressable style={styles.retryBtn} onPress={goBack}><Text style={styles.retryText}>Quay lại</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }
  return <ChatContent key={actor.userId + ':' + access.conversation.id} actor={actor}
    conversation={access.conversation} phase={access.phase} bookingCode={access.bookingCode} goBack={goBack} />;
}

interface ChatContentProps {
  actor: ChatActor;
  conversation: Conversation;
  phase: ChatBookingPhase;
  bookingCode: string;
  goBack: () => void;
}
interface PendingMessage { message: ChatMessage; status: 'SENDING' | 'FAILED'; error?: string }

function ChatContent({ actor, conversation, phase, bookingCode, goBack }: ChatContentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadState, setLoadState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [loadError, setLoadError] = useState('');
  const [inputText, setInputText] = useState('');
  const [pending, setPending] = useState<PendingMessage | null>(null);
  const [sendNotice, setSendNotice] = useState('');
  const listRef = useRef<ScrollView>(null);
  const requests = useRef(new Set<AbortController>());
  const sending = useRef(false);
  const isLocked = !canSendChat(phase);
  const lockReason = phase === 'AWAITING_ACCEPTANCE'
    ? 'Tạm khóa gửi tin trong thời gian chờ nghiệm thu theo chính sách của ca.'
    : 'Ca đã đóng kênh gửi tin nhắn. Bạn vẫn có thể đọc lịch sử.';
  const otherName = actor.role === 'STAFF' ? conversation.customerName : conversation.staffName;
  const otherAvatar = actor.role === 'STAFF' ? conversation.customerAvatar : conversation.staffAvatar;
  const conversationId = conversation.id;

  const load = useCallback(() => {
    const controller = new AbortController();
    requests.current.add(controller);
    void ChatRepository.load(conversationId, actor, controller.signal).then((next) => {
      if (!controller.signal.aborted) { setMessages(next); setLoadState('READY'); }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        setLoadError(error instanceof Error ? error.message : 'Chưa tải được tin nhắn.');
        setLoadState('ERROR');
      }
    }).finally(() => { requests.current.delete(controller); });
  }, [actor, conversationId]);

  useEffect(() => {
    const activeRequests = requests.current;
    void load();
    const unsubscribe = ChatRepository.subscribe(() => {
      try { setMessages(ChatRepository.getMessages(conversationId, actor)); }
      catch { /* Parent immediately replaces content when booking access is revoked. */ }
    });
    return () => {
      unsubscribe();
      activeRequests.forEach((controller) => controller.abort());
      activeRequests.clear();
    };
  }, [actor, conversationId, load]);

  const send = async (retry?: ChatMessage) => {
    if (sending.current || isLocked || loadState !== 'READY') return;
    const content = retry?.content ?? inputText.trim();
    if (!content || (!retry && pending)) return;
    const message = retry ?? createChatDraft(conversationId, actor, content);
    sending.current = true;
    setPending({ message, status: 'SENDING' });
    setInputText('');
    setSendNotice('');
    const controller = new AbortController();
    requests.current.add(controller);
    try {
      await ChatRepository.send(conversationId, actor, content, message.id, controller.signal);
      if (!controller.signal.aborted) {
        setMessages(ChatRepository.getMessages(conversationId, actor));
        setPending(null);
        setSendNotice('Đã gửi');
      }
    } catch (error) {
      if (!controller.signal.aborted) setPending({ message, status: 'FAILED',
        error: error instanceof Error ? error.message : 'Chưa gửi được tin nhắn.' });
    } finally { requests.current.delete(controller); sending.current = false; }
  };

  const displayed = pending && !messages.some((message) => message.id === pending.message.id)
    ? [...messages, pending.message] : messages;
  const sendEnabled = loadState === 'READY' && !isLocked && !pending && !!inputText.trim();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={goBack} accessibilityLabel="Quay lại">
          <IconSymbol name="back" size={22} color={BrandColors.gray700} />
        </Pressable>
        <Image source={{ uri: otherAvatar }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherName}</Text>
          <Text style={styles.headerSubtitle}>{bookingCode} • {CHAT_PHASE_LABELS[phase]}</Text>
          <Text style={styles.headerSubtitle}>{conversation.serviceName}</Text>
        </View>
        <View style={styles.callUnavailable} accessibilityLabel="Gọi thoại chưa được hỗ trợ">
          <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }}
            accessibilityLabel="Gọi thoại chưa được hỗ trợ" style={[styles.callBtn, styles.callBtnDisabled]}>
            <IconSymbol name="phone" size={18} color={BrandColors.gray400} />
          </Pressable>
          <Text style={styles.headerSubtitle}>Chưa hỗ trợ</Text>
        </View>
      </View>
      <View style={[styles.privacyBanner, isLocked && styles.privacyBannerLocked]}>
        <Text style={[styles.privacyBannerText, isLocked && styles.privacyBannerTextLocked]}>
          {isLocked ? lockReason : 'Trao đổi về ca làm việc. Hạn chế chia sẻ thông tin cá nhân không cần thiết.'}
        </Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView ref={listRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.messageScroll}>
          {loadState === 'LOADING' ? <View style={styles.stateBox}><ActivityIndicator color={BrandColors.primary} /><Text style={styles.stateText}>Đang tải tin nhắn…</Text></View> :
            loadState === 'ERROR' ? <View style={styles.stateBox}><Text style={styles.stateText}>{loadError}</Text><Pressable style={styles.retryBtn} onPress={() => { setLoadState('LOADING'); void load(); }}><Text style={styles.retryText}>Thử lại</Text></Pressable></View> :
            displayed.length === 0 ? <View style={styles.stateBox}><IconSymbol name="chat" size={32} color={BrandColors.gray400} /><Text style={styles.stateTitle}>Chưa có tin nhắn</Text><Text style={styles.stateText}>{isLocked ? 'Ca này đã kết thúc.' : 'Bắt đầu trao đổi về ca với ' + otherName + '.'}</Text></View> :
            displayed.map((message) => {
              if (message.senderType === 'SYSTEM') return <View key={message.id} style={styles.systemMsgBox}><Text style={styles.systemMsgText}>{message.content}</Text></View>;
              const isMe = isOwnChatMessage(message, actor);
              const delivery = pending?.message.id === message.id ? pending : null;
              return (
                <View key={message.id} style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
                  {!isMe && <Image source={{ uri: message.senderAvatar }} style={styles.msgAvatar} />}
                  <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                    <Text style={[styles.bubbleText, isMe ? styles.bubbleTextRight : styles.bubbleTextLeft]}>{message.content}</Text>
                    <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeRight : styles.bubbleTimeLeft]}>
                      {new Date(message.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: CHAT_TIME_ZONE })}
                      {isMe ? delivery?.status === 'SENDING' ? ' • Đang gửi…' : delivery?.status === 'FAILED' ? ' • Chưa gửi' : ' • Đã gửi' : ''}
                    </Text>
                    {delivery?.status === 'FAILED' && <Pressable disabled={isLocked} accessibilityState={{ disabled: isLocked }}
                      accessibilityLabel="Thử gửi lại tin nhắn" onPress={() => void send(message)}>
                      <Text style={styles.messageRetry}>{isLocked ? 'Ca đã khóa gửi tin' : 'Thử gửi lại'}</Text>
                    </Pressable>}
                  </View>
                </View>
              );
            })}
        </ScrollView>
        {pending?.error && <Text style={styles.deliveryNotice} accessibilityLiveRegion="polite">{pending.error}</Text>}
        {!!sendNotice && <Text style={styles.deliveryNotice} accessibilityLiveRegion="polite">{sendNotice}</Text>}
        {isLocked ? <View style={styles.lockedBar}><Text style={styles.lockedText}>{lockReason}</Text></View> :
          <View style={styles.inputBar}>
            <TextInput placeholder={pending ? 'Đang xử lý tin nhắn trước…' : loadState === 'READY' ? 'Nhập tin nhắn…' : 'Chờ tải tin nhắn…'}
              placeholderTextColor={BrandColors.gray400} value={inputText} onChangeText={setInputText}
              editable={loadState === 'READY' && !pending} style={styles.inputField} multiline maxLength={2000}
              accessibilityLabel="Nội dung tin nhắn" />
            <Pressable disabled={!sendEnabled} accessibilityRole="button" accessibilityState={{ disabled: !sendEnabled }}
              accessibilityLabel="Gửi tin nhắn" style={[styles.sendBtn, sendEnabled && styles.sendBtnActive]} onPress={() => void send()}>
              {pending?.status === 'SENDING' ? <ActivityIndicator size="small" color={BrandColors.gray500} /> : <IconSymbol name="send" size={18} color={sendEnabled ? BrandColors.white : BrandColors.gray400} />}
            </Pressable>
          </View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  stateBox: { alignItems: 'center', padding: Spacing.four, gap: Spacing.two },
  stateTitle: { fontSize: 17, fontWeight: '700', color: BrandColors.gray900, textAlign: 'center' },
  stateText: { fontSize: 14, lineHeight: 21, color: BrandColors.gray600, textAlign: 'center' },
  retryBtn: { padding: Spacing.two, borderRadius: BorderRadius.md, backgroundColor: BrandColors.primary },
  retryText: { color: BrandColors.white, fontWeight: '600' },
  callUnavailable: { alignItems: 'center', gap: 3 },
  messageRetry: { color: BrandColors.white, textDecorationLine: 'underline', fontSize: 13, paddingVertical: 8 },
  deliveryNotice: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, fontSize: 12, color: BrandColors.gray600 },

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
