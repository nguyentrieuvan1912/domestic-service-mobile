import React, { useState, useRef, useEffect } from 'react';
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
import { operationRequest } from '@/api/operations';
import { useAuth } from '@/context/AuthContext';
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
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const { currentCustomer } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error,setError]=useState('');
  const requestRef=useRef<{text:string;key:string}|null>(null);
  const mapMessages = (rows: (AIMessage & {id:number;conversationId:number})[]): AIMessage[] => rows.map(m=>({...m,id:String(m.id),conversationId:String(m.conversationId)}));
  useEffect(()=>{let active=true;setMessages([]);setConversationId(null);if(!currentCustomer)return;void operationRequest<{id:number}[]>('ai-assistant','/conversations').then(async list=>{if(!active||!list[0])return;const id=String(list[0].id);const rows=await operationRequest<(AIMessage & {id:number;conversationId:number})[]>('ai-assistant','/conversations/'+id+'/messages');if(active){setConversationId(id);setMessages(mapMessages(rows));}}).catch(e=>{if(active)setError(e.message)});return()=>{active=false;};},[currentCustomer?.id]);
  const sendMessage = async (textToSend: string) => {
    const text=textToSend.trim();if(!text||isTyping)return;
    setIsTyping(true);setError('');
    try {
      let id=conversationId;
      if(!id){const created=await operationRequest<{id:number}>('ai-assistant','/conversations','POST');id=String(created.id);setConversationId(id);}
      if(requestRef.current?.text!==text)requestRef.current={text,key:'ai-'+Date.now()+'-'+Math.random().toString(36).slice(2)};
      await operationRequest('ai-assistant','/conversations/'+id+'/messages','POST',{content:text,clientKey:requestRef.current!.key});
      const rows=await operationRequest<(AIMessage & {id:number;conversationId:number})[]>('ai-assistant','/conversations/'+id+'/messages');setMessages(mapMessages(rows));setInputText('');requestRef.current=null;
      scrollViewRef.current?.scrollToEnd({animated:true});
    } catch(e){setError(e instanceof Error?e.message:'Chưa nhận được phản hồi AI.');}finally{setIsTyping(false);}
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
    try {if(conversationId)await operationRequest('ai-assistant','/conversations/'+conversationId,'DELETE');setMessages([]);setConversationId(null);requestRef.current=null;setShowClearModal(false);}
    catch(e){setError(e instanceof Error?e.message:'Chưa kết thúc được hội thoại.');}
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
            <IconSymbol name="➤" style={styles.sendIcon} />
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
