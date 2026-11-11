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
import { loadAiBookingDraft, loadAiDraftPanel, type AiBookingDraft, type AiDraftPanel } from '@/api/ai-booking-draft';
import { ServiceAnswersSummary } from '@/components/booking/ServiceQuestions';
import { useAuth } from '@/context/AuthContext';
import { useAiChatVoice } from '@/hooks/useAiChatVoice';
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

function DraftCard({ draft, expanded, onToggle, onConfirm }: {
  draft: AiBookingDraft;
  expanded: boolean;
  onToggle: () => void;
  onConfirm: () => void;
}) {
  const name = draft.choices?.service?.name || 'Dịch vụ không còn khả dụng';
  const pack = draft.choices?.packages?.find(item => item.id === draft.data.packageId);
  return (
    <View style={[styles.draftCard, expanded && styles.draftCardExpanded]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onToggle} style={styles.draftHeader}>
        <View style={styles.draftHeading}>
          <Text style={styles.draftTitle}>{name}</Text>
          {pack && <Text style={styles.draftText}>{pack.name}</Text>}
        </View>
        <IconSymbol name={expanded ? 'chevronUp' : 'chevronDown'} size={18} color={BrandColors.primaryDark} />
      </Pressable>
      {expanded && (
        <View style={styles.draftDetails}>
          <Text style={styles.draftText}>{[
            draft.data.quantity && 'Số lượng gói: ' + draft.data.quantity,
            draft.data.requiredStaffCount && draft.data.requiredStaffCount + ' nhân viên',
            'Chờ nhân viên nhận đơn sau khi đặt',
          ].filter(Boolean).join(' · ')}</Text>
          <ServiceAnswersSummary fields={draft.choices?.requirements || []} values={draft.data.answers || {}} />
          {draft.choices?.service?.name && <>
            <Text style={styles.draftText}>Kiểm tra thông tin, chọn ngày giờ và địa chỉ ở bước tiếp theo.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={'Xác nhận ' + name} style={styles.draftConfirm} onPress={onConfirm}>
              <Text style={styles.draftConfirmText}>Xác nhận</Text>
            </Pressable>
          </>}
        </View>
      )}
    </View>
  );
}

export default function AIAssistantScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [voiceDraft, setVoiceDraft] = useState('');
  const replaceInput = (text: string) => {
    voice.clearNotice();
    setInputText(text);
    setVoiceDraft('');
  };
  const [pendingMessage, setPendingMessage] = useState<AIMessage | null>(null);
  const [selectingSuggestion, setSelectingSuggestion] = useState(false);
  const selectingRef = useRef(false);
  const isTyping = pendingMessage !== null || selectingSuggestion;
  const [showClearModal, setShowClearModal] = useState(false);
  const clearingHistory = useRef(false);

  const { currentCustomer } = useAuth();
  const voice = useAiChatVoice(currentCustomer ? String(currentCustomer.id) : undefined, setVoiceDraft);
  const composerBusy = isTyping || voice.busy;
  const dictatedText = voice.busy ? voice.preview : voiceDraft;
  const composerText = dictatedText ? [inputText.trim(), dictatedText.trim()].filter(Boolean).join(' ').slice(0, 4000) : inputText;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draftPanel, setDraftPanel] = useState<{ conversation: string; customer: string; value: AiDraftPanel } | null>(null);
  const [draftLoadError, setDraftLoadError] = useState('');
  const [draftLoadAttempt, setDraftLoadAttempt] = useState(0);
  const draftRequest = useRef<AbortController | null>(null);
  const panel = draftPanel?.conversation === conversationId && draftPanel?.customer === String(currentCustomer?.id)
    ? draftPanel.value : null;
  useEffect(() => {
    setDraftLoadError('');
    if (!conversationId || !currentCustomer) return;
    const controller = new AbortController();
    draftRequest.current = controller;
    void loadAiDraftPanel(conversationId, controller.signal).then(value => {
      if (!controller.signal.aborted) setDraftPanel({ conversation: conversationId, customer: String(currentCustomer.id), value });
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
  }, [pendingMessage, messages, panel]);
  const mapMessages = (rows: StoredMessage[]): AIMessage[] => rows.map(m=>({...m,id:String(m.id),conversationId:String(m.conversationId)}));
  useEffect(() => {
    const controller = new AbortController();
    setMessages([]);
    setConversationId(null);
    setDraftPanel(null);
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

  const refreshDraftPanel = (conversation: string, customer: string, saved?: AiBookingDraft) => {
    draftRequest.current?.abort();
    setDraftLoadError('');
    setDraftPanel(previous => {
      const drafts = previous?.conversation === conversation && previous.customer === customer ? previous.value.drafts : [];
      const visibleDraft = saved?.id && saved.data.serviceId ? saved : null;
      return { conversation, customer, value: {
        drafts: visibleDraft ? [visibleDraft, ...drafts.filter(draft => draft.id !== visibleDraft.id)] : drafts,
        expandedDraftId: visibleDraft?.id ?? null,
      } };
    });
    setDraftLoadAttempt(attempt => attempt + 1);
  };

  const sendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || !currentCustomer || sendingRef.current || clearingHistory.current || selectingRef.current || voice.isBusy()) return;
    voice.clearNotice();
    void voice.stopSpeaking();
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
    replaceInput('');
    Keyboard.dismiss();
    setError('');
    try {
      let id=conversationId;
      if(!id){const created=await operationRequest<{id:number}>('ai-assistant','/conversations','POST');id=String(created.id);setConversationId(id);}
      const result = await operationRequest<{ messages?: StoredMessage[]; bookingDraft?: AiBookingDraft }>(
        'ai-assistant', '/conversations/'+id+'/messages', 'POST', { content: text, clientKey: key });
      scrollAfterSend.current = true;
      refreshDraftPanel(id, String(currentCustomer.id), result.bookingDraft);
      if (result.messages?.some(message => message.role === 'ASSISTANT')) {
        const received = mapMessages(result.messages);
        setMessages(previous => [...previous, ...received.filter(message => !previous.some(item => item.id === message.id))]);
      } else {
        const rows = await operationRequest<StoredMessage[]>('ai-assistant', '/conversations/'+id+'/messages');
        setMessages(mapMessages(rows));
      }
      requestRef.current = null;
    } catch (e) {
      replaceInput(text);
      setError(e instanceof Error ? e.message : 'Chưa nhận được phản hồi AI.');
    } finally {
      sendingRef.current = false;
      setPendingMessage(null);
    }
  };

  const handleSuggestionPress = async (sug: AISuggestion) => {
    if (sendingRef.current || selectingRef.current || clearingHistory.current || voice.isBusy()) return;
    if (sug.type === 'PACKAGE' && sug.serviceId && conversationId && currentCustomer) {
      selectingRef.current = true;
      setSelectingSuggestion(true);
      setError('');
      draftRequest.current?.abort();
      try {
        const previous = await loadAiBookingDraft(conversationId);
        const updated = await operationRequest<AiBookingDraft>('ai-assistant',
          '/conversations/' + conversationId + '/booking-draft', 'PATCH', {
            draftId: previous.id, version: previous.version,
            changes: {
              serviceId: Number(sug.serviceId), packageId: Number(sug.referenceId), mode: 'B',
              quantity: sug.quantity || 1, requiredStaffCount: sug.requiredStaffCount || 1,
              ...(sug.answers ? { answers: sug.answers } : {}),
            },
          });
        scrollAfterSend.current = true;
        refreshDraftPanel(conversationId, String(currentCustomer.id), updated);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Chưa chọn được gói. Bạn thử lại nhé.');
        setDraftLoadAttempt(attempt => attempt + 1);
      } finally {
        selectingRef.current = false;
        setSelectingSuggestion(false);
      }
    } else if (sug.type === 'SERVICE') {
      router.push(`/service/${sug.referenceId}`);
    } else if (sug.type === 'PACKAGE') {
      router.push('/(tabs)/services');
    } else if (sug.type === 'PROMOTION') {
      router.push('/(tabs)/services');
    }
  };

  const handleClearHistory = async () => {
    if (clearingHistory.current || sendingRef.current || selectingRef.current) return;
    voice.clearNotice();
    void voice.stopSpeaking();
    clearingHistory.current = true;
    try {
      if (conversationId) await operationRequest('ai-assistant', '/conversations/' + conversationId, 'DELETE');
      draftRequest.current?.abort();
      setMessages([]);
      setDraftPanel(null);
      setDraftLoadError('');
      setConversationId(null);
      replaceInput('');
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
      {selectingSuggestion && <Text accessibilityLiveRegion="polite" style={{color:'#047857',padding:12}}>Đang cập nhật gói đã chọn vào đơn nháp…</Text>}
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
          disabled={composerBusy}
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
          onLayout={() => {
            if (scrollAfterSend.current) scrollViewRef.current?.scrollToEnd({ animated: false });
          }}
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
              onSuggestionPress={sug => { void handleSuggestionPress(sug); }}
              suggestionsDisabled={composerBusy}
              onSpeak={msg.role === 'ASSISTANT' ? () => { void voice.toggleSpeaking(msg.id, msg.content); } : undefined}
              speaking={voice.speakingId === msg.id}
              voiceDisabled={voice.busy}
            />
          ))}

          {!pendingMessage && draftLoadError ? (
            <View style={styles.draftError}>
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

          {conversationId && panel && panel.drafts.length > 0 && (
            <View style={styles.draftList}>
              <Text style={styles.draftLabel}>ĐƠN NHÁP · {panel.drafts.length}</Text>
              {panel.drafts.map(draft => (
                <DraftCard key={draft.id} draft={draft} expanded={!pendingMessage && panel.expandedDraftId === draft.id}
                  onToggle={() => setDraftPanel(previous => previous && ({ ...previous, value: {
                    ...previous.value,
                    expandedDraftId: previous.value.expandedDraftId === draft.id ? null : draft.id,
                  } }))}
                  onConfirm={() => router.push({ pathname: '/booking/new', params: {
                    aiConversationId: conversationId,
                    aiDraftId: String(draft.id),
                  } })}
                />
              ))}
            </View>
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
                disabled={composerBusy}
                onPress={() => { replaceInput(prompt); setError(''); }}>
                <Text style={styles.quickChipText}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {(voice.busy || voice.notice) && (
          <View style={styles.voiceBanner}>
            {voice.phase === 'recording' && (
              <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.voiceMeter}>
                {[0.45, 0.72, 1, 0.72, 0.45].map((scale, index) => (
                  <View key={index} style={[styles.voiceMeterBar, { height: 3 + 20 * scale * voice.level }]} />
                ))}
              </View>
            )}
            <Text accessibilityLiveRegion="polite" style={styles.voiceStatus}>
              {voice.phase === 'recording' ? voice.level >= 0.1 ? 'Đang nhận âm thanh' : 'Đang nghe · chưa nhận tiếng nói'
                : voice.phase === 'transcribing' ? 'Đang chuyển lời nói thành chữ…'
                : voice.phase === 'refining' ? 'Đang kiểm tra câu chữ…'
                : voice.busy ? 'Đang xử lý bản thu âm…' : voice.notice}
            </Text>
            {(voice.phase === 'recording' || voice.phase === 'transcribing' || voice.phase === 'refining') && (
              <Pressable accessibilityRole="button" onPress={() => { void voice.cancelRecording(); }}>
                <Text style={styles.voiceCancel}>Hủy</Text>
              </Pressable>
            )}
            {!voice.busy && voice.canCompare && (
              <Pressable accessibilityRole="button" onPress={voice.toggleOriginal}>
                <Text style={styles.voiceCancel}>{voice.showingOriginal ? 'Bản hiệu chỉnh' : 'Bản gốc'}</Text>
              </Pressable>
            )}
          </View>
        )}
        {/* INPUT BAR */}
        <View style={styles.inputBar}>
          <Pressable accessibilityRole="button" accessibilityLabel={voice.phase === 'recording' ? 'Dừng thu âm' : 'Thu âm tin nhắn'}
            disabled={!currentCustomer || isTyping || (voice.busy && voice.phase !== 'recording')}
            style={[styles.voiceButton, voice.phase === 'recording' && styles.voiceButtonActive]}
            onPress={() => {
              if (sendingRef.current || selectingRef.current || clearingHistory.current) return;
              void (voice.phase === 'recording' ? voice.stopRecording() : voice.startRecording());
            }}>
            <IconSymbol name={voice.phase === 'recording' ? 'stop' : 'microphone'} size={20}
              color={voice.phase === 'recording' ? '#B91C1C' : BrandColors.primaryDark} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={composerText}
            editable={!composerBusy}
            onChangeText={text => { voice.clearNotice(); replaceInput(text); }}
            placeholder="Hỏi về dịch vụ, giá tiền, chọn thợ..."
            placeholderTextColor={BrandColors.gray400}
            multiline
            rows={Platform.OS === 'web' ? 1 : undefined}
            submitBehavior="blurAndSubmit"
            blurOnSubmit={Platform.OS === 'web' ? true : undefined}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(composerText)}
          />
          <Pressable
            style={[
              styles.sendBtn,
              composerText.trim().length > 0 && styles.sendBtnActive,
            ]}
            disabled={composerBusy || !composerText.trim()}
            onPress={() => sendMessage(composerText)}>
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
  voiceBanner: { backgroundColor: '#F0FDF4', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  voiceStatus: { color: '#065F46', fontSize: 12, flex: 1 },
  voiceMeter: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 24 },
  voiceMeterBar: { width: 3, borderRadius: 2, backgroundColor: BrandColors.primary },
  voiceCancel: { color: '#047857', fontWeight: '700', padding: 6 },
  voiceButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6F8F1', alignItems: 'center', justifyContent: 'center' },
  voiceButtonActive: { backgroundColor: '#FEE2E2' },
  draftList: { gap: 8, marginLeft: 40, marginTop: 4 },
  draftCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D8E8E1', borderRadius: 14 },
  draftCardExpanded: { borderColor: '#A7E8CF' },
  draftHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  draftHeading: { flex: 1, gap: 2 },
  draftDetails: { marginHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderColor: '#E7F1EC', gap: 7 },
  draftError: { marginLeft: 40, padding: 12, gap: 7 },
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
    alignItems: 'flex-end',
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    maxHeight: 120,
    textAlignVertical: 'top',
    ...Platform.select({ web: { fieldSizing: 'content' } }),
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
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
