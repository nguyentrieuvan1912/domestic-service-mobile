import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardProvider, useKeyboardState } from 'react-native-keyboard-controller';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { AIChatBubble } from '@/components/common/AIChatBubble';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { operationRequest } from '@/api/operations';
import { loadAiBookingDraft, type AiBookingDraft } from '@/api/ai-booking-draft';
import { ServiceAnswersSummary } from '@/components/booking/ServiceQuestions';
import { useAuth } from '@/context/AuthContext';
import { AIMessage, AISuggestion } from '@/types/ai';

type StoredMessage = Omit<AIMessage, 'id' | 'conversationId'> & { id: number; conversationId: number };

function AndroidChatKeyboardLayout({ children }: React.PropsWithChildren) {
  const { bottom } = useSafeAreaInsets();
  const controllerHeight = useKeyboardState(state => state.isVisible ? state.height : 0);
  const [systemHeight, setSystemHeight] = useState(() => Keyboard.metrics()?.height ?? 0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const restingHeight = useRef(0);
  const keyboardHeight = Math.max(controllerHeight, systemHeight);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', event => setSystemHeight(event.endCoordinates.height));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setSystemHeight(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  const resizedHeight = Math.max(0, restingHeight.current - layoutHeight);
  const overlap = Math.max(0, keyboardHeight - bottom - resizedHeight);
  return (
    <View
      style={styles.keyboardLayout}
      onLayout={event => {
        const height = event.nativeEvent.layout.height;
        if (!keyboardHeight && !Keyboard.isVisible()) restingHeight.current = height;
        setLayoutHeight(height);
      }}>
      {children}
      {overlap > 0 && <View style={{ height: overlap, flexShrink: 0 }} />}
    </View>
  );
}

function ChatKeyboardLayout({ children }: React.PropsWithChildren) {
  if (Platform.OS === 'android') {
    return (
      <KeyboardProvider>
        <AndroidChatKeyboardLayout>{children}</AndroidChatKeyboardLayout>
      </KeyboardProvider>
    );
  }
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardLayout}>
      {children}
    </KeyboardAvoidingView>
  );
}

const QUICK_PROMPTS = [
  'Tôi muốn vệ sinh 3 máy lạnh vào chiều thứ bảy',
  'Tìm bảo mẫu trông bé 2 tuổi bán thời gian',
  'Nhà 70m2 nên đặt gói dọn dẹp nào?',
  'Khuyến mãi & mã giảm giá hôm nay có gì?',
  'Chính sách bảo hiểm hư hại của CleanMaster',
];

export default function AIAssistantScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [pendingMessage, setPendingMessage] = useState<AIMessage | null>(null);
  const isTyping = pendingMessage !== null;
  const [showClearModal, setShowClearModal] = useState(false);
  const clearingHistory = useRef(false);

  const { currentCustomer } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [bookingDraft, setBookingDraft] = useState<{ conversation: string; customer: string; value: AiBookingDraft } | null>(null);
  const [draftLoadError, setDraftLoadError] = useState('');
  const [draftLoadAttempt, setDraftLoadAttempt] = useState(0);
  const draftRequest = useRef<AbortController | null>(null);
  const draft = bookingDraft?.conversation === conversationId && bookingDraft?.customer === String(currentCustomer?.id)
    ? bookingDraft.value : null;
  const draftService = draft?.choices?.service;
  const draftPackage = draft?.choices?.packages?.find(pack => pack.id === draft.data.packageId);
  useEffect(() => {
    setDraftLoadError('');
    if (!conversationId || !currentCustomer) return;
    const controller = new AbortController();
    draftRequest.current = controller;
    void loadAiBookingDraft(conversationId, controller.signal).then(value => {
      if (!controller.signal.aborted) setBookingDraft({ conversation: conversationId, customer: String(currentCustomer.id), value });
    }).catch(cause => {
      if (!controller.signal.aborted) {
        setDraftLoadError(cause instanceof Error ? cause.message : 'Chưa tải được đơn nháp.');
      }
    });
    return () => controller.abort();
  }, [conversationId, currentCustomer?.id, draftLoadAttempt]);
  const [error,setError]=useState('');
  const requestRef=useRef<{text:string;key:string}|null>(null);
  const sendingRef = useRef(false);
  const scrollAfterSend = useRef(false);
  useEffect(() => {
    if (!scrollAfterSend.current) return;
    const frame = requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [pendingMessage, messages, draft]);
  const mapMessages = (rows: StoredMessage[]): AIMessage[] => rows.map(m=>({...m,id:String(m.id),conversationId:String(m.conversationId)}));
  useEffect(() => {
    const controller = new AbortController();
    setMessages([]);
    setConversationId(null);
    setBookingDraft(null);
    if (!currentCustomer) return;
    void operationRequest<{ id: number }[]>('ai-assistant', '/conversations', 'GET', undefined, controller.signal)
      .then(async list => {
        if (!list[0] || controller.signal.aborted) return;
        const id = String(list[0].id);
        const rows = await operationRequest<StoredMessage[]>(
          'ai-assistant', '/conversations/' + id + '/messages', 'GET', undefined, controller.signal);
        if (controller.signal.aborted) return;
        scrollAfterSend.current = true;
        setConversationId(id);
        setMessages(mapMessages(rows));
      }).catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Chưa tải được hội thoại.');
      });
    return () => controller.abort();
  }, [currentCustomer?.id]);
  const sendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || !currentCustomer || sendingRef.current || clearingHistory.current) return;
    sendingRef.current = true;
    if (requestRef.current?.text !== text) {
      requestRef.current = { text, key: 'ai-' + Date.now() + '-' + Math.random().toString(36).slice(2) };
    }
    const { key } = requestRef.current;
    scrollAfterSend.current = true;
    setPendingMessage({
      id: key,
      conversationId: conversationId ?? '',
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    });
    setInputText('');
    Keyboard.dismiss();
    setError('');
    try {
      let id=conversationId;
      if(!id){const created=await operationRequest<{id:number}>('ai-assistant','/conversations','POST');id=String(created.id);setConversationId(id);}
      const result = await operationRequest<{ messages?: StoredMessage[]; bookingDraft?: AiBookingDraft }>(
        'ai-assistant', '/conversations/'+id+'/messages', 'POST', { content: text, clientKey: key });
      scrollAfterSend.current = true;
      if (result.bookingDraft) {
        draftRequest.current?.abort();
        setDraftLoadError('');
        setBookingDraft({ conversation: id, customer: String(currentCustomer.id), value: result.bookingDraft });
      } else {
        // Replayed turns return the original messages. Read the latest draft separately.
        setDraftLoadAttempt(attempt => attempt + 1);
      }
      if (result.messages?.some(message => message.role === 'ASSISTANT')) {
        const received = mapMessages(result.messages);
        setMessages(previous => [...previous, ...received.filter(message => !previous.some(item => item.id === message.id))]);
      } else {
        const rows = await operationRequest<StoredMessage[]>('ai-assistant', '/conversations/'+id+'/messages');
        setMessages(mapMessages(rows));
      }
      requestRef.current = null;
    } catch (e) {
      setInputText(text);
      setError(e instanceof Error ? e.message : 'Chưa nhận được phản hồi AI.');
    } finally {
      sendingRef.current = false;
      setPendingMessage(null);
    }
  };

  const handleSuggestionPress = (sug: AISuggestion) => {
    if (sug.type === 'PACKAGE' || sug.type === 'SERVICE') {
      const targetId = sug.referenceId;
      router.push(`/service/${targetId}`);
    } else if (sug.type === 'PROMOTION') {
      router.push('/(tabs)/services');
    }
  };

  const handleClearHistory = async () => {
    if (clearingHistory.current || sendingRef.current) return;
    clearingHistory.current = true;
    try {
      if (conversationId) await operationRequest('ai-assistant', '/conversations/' + conversationId, 'DELETE');
      draftRequest.current?.abort();
      setMessages([]);
      setBookingDraft(null);
      setDraftLoadError('');
      setConversationId(null);
      setInputText('');
      requestRef.current = null;
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa xóa được lịch sử trò chuyện.');
    } finally {
      clearingHistory.current = false;
      setShowClearModal(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {error && <Text accessibilityRole="alert" style={{color:'#B91C1C',padding:12}}>{error}</Text>}
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
          disabled={isTyping}
          onPress={() => setShowClearModal(true)}
          hitSlop={8}>
          <IconSymbol name="close" size={18} color={BrandColors.gray500} />
        </Pressable>
      </View>

      <ChatKeyboardLayout>
        {/* MESSAGES SCROLL VIEW */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageScroll}
          onContentSizeChange={() => {
            if (!scrollAfterSend.current) return;
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }}
          onScrollBeginDrag={() => { scrollAfterSend.current = false; }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesList}>
          {messages.map((msg) => (
            <AIChatBubble
              key={msg.id}
              message={msg}
              onSuggestionPress={handleSuggestionPress}
            />
          ))}

          {!pendingMessage && draft?.id && draft.data.serviceId && conversationId ? (
            <View style={styles.draftCard}>
              <Text style={styles.draftLabel}>ĐƠN NHÁP</Text>
              <Text style={styles.draftTitle}>{draftService?.name || 'Dịch vụ đã chọn'}</Text>
              {draftPackage && <Text style={styles.draftText}>{draftPackage.name}</Text>}
              <Text style={styles.draftText}>{[
                draft.data.quantity && (draftService?.serviceType === 'AC_CLEANING'
                  ? draft.data.quantity + ' máy lạnh' : draft.data.quantity + ' gói'),
                draft.data.requiredStaffCount && draft.data.requiredStaffCount + ' nhân viên',
                'Chờ nhân viên nhận đơn sau khi đặt',
              ].filter(Boolean).join(' · ')}</Text>
              <ServiceAnswersSummary fields={draft.choices?.requirements || []} values={draft.data.answers || {}} />
              <Text style={styles.draftText}>Kiểm tra thông tin, chọn ngày giờ và địa chỉ ở bước tiếp theo.</Text>
              <Pressable accessibilityRole="button" style={styles.draftConfirm}
                onPress={() => router.push({ pathname: '/booking/new', params: { aiConversationId: conversationId } })}>
                <Text style={styles.draftConfirmText}>Xác nhận</Text>
              </Pressable>
            </View>
          ) : null}

          {!pendingMessage && draftLoadError ? (
            <View style={styles.draftCard}>
              <Text style={styles.draftText}>{draftLoadError}</Text>
              <Pressable accessibilityRole="button" style={styles.draftConfirm} onPress={() => setDraftLoadAttempt(attempt => attempt + 1)}>
                <Text style={styles.draftConfirmText}>Tải lại đơn nháp</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Typing indicator */}
          {pendingMessage && (
            <>
              <AIChatBubble message={pendingMessage} />
              <View style={styles.typingBox}>
                <Text style={styles.typingText}>CleanMaster AI đang trả lời…</Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* QUICK PROMPTS CHIPS */}
        <View style={styles.quickPromptsWrapper}>
          <ScrollView
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickScroll}>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <Pressable
                key={idx}
                style={styles.quickChip}
                disabled={isTyping}
                onPress={() => { setInputText(prompt); setError(''); }}>
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
            editable={!isTyping}
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
            disabled={isTyping || !inputText.trim()}
            onPress={() => sendMessage(inputText)}>
            <IconSymbol name="➤" style={styles.sendIcon} />
          </Pressable>
        </View>
      </ChatKeyboardLayout>

      {/* Clear conversation modal */}
      <ConfirmModal
        visible={showClearModal}
        title="Làm mới cuộc trò chuyện"
        message="Tin nhắn và bản nháp của cuộc trò chuyện sẽ bị xóa. Đơn đã đặt vẫn nằm trong mục Đơn hàng."
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
  draftCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#A7E8CF', borderRadius: 16, padding: 14, gap: 7, marginLeft: 34 },
  draftLabel: { color: '#047857', fontWeight: '700', fontSize: 11, letterSpacing: 0.8 },
  draftTitle: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
  draftText: { color: '#475569', fontSize: 13, lineHeight: 19 },
  draftConfirm: { alignItems: 'center', padding: 12, backgroundColor: '#047857', borderRadius: 10, marginTop: 5 },
  draftConfirmText: { color: '#fff', fontWeight: '700' },
  keyboardLayout: { flex: 1 },
  messageScroll: { flex: 1, minHeight: 0 },
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
    flexShrink: 0,
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
    flexShrink: 0,
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
