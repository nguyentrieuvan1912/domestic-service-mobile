import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatInbox } from '@/hooks/use-chat-inbox';
import { ChatRepository } from '@/data/connectedChatRepository';
import { IconSymbol } from '@/components/common/IconSymbol';
import { remoteImageSource } from '@/utils/image-source';
import type { Conversation } from '@/types/chat';

export default function ChatTrashScreen() {
  const router = useRouter();
  const { actor, conversations, error: loadError, isLoaded } = useChatInbox();
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  if (!actor || actor.role !== 'CUSTOMER') return <Redirect href="/(tabs)/chat" />;
  const trashed = conversations.filter(item => !!item.customerTrashedAt);
  const remove = async () => {
    if (!selected || busy) return;
    setBusy(true); setError('');
    try { await ChatRepository.deletePermanently(selected.id, actor); setSelected(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa xóa được hội thoại.'); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={() => router.back()} style={s.back}><IconSymbol name="back" size={24} color="#334155" /></Pressable><Text style={s.title}>Thùng rác tin nhắn</Text></View>
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.hint}>Cả cuộc hội thoại của đơn hàng sẽ chuyển vào đây sau 24 giờ kể từ tin nhắn cuối. Khi có tin mới, hội thoại sẽ hiện lại trong danh sách chính.</Text>
      {loadError ? <Pressable style={s.button} onPress={() => void ChatRepository.loadList(actor).catch(() => {})}><Text style={s.error}>{loadError} Chạm để thử lại.</Text></Pressable> : null}
      {!isLoaded && !loadError && <View style={s.empty}><ActivityIndicator color="#059669" /><Text style={s.emptyText}>Đang tải thùng rác…</Text></View>}
      {isLoaded && trashed.length === 0 && !loadError && <View style={s.empty}><IconSymbol name="trash" size={40} color="#94A3B8" /><Text style={s.emptyText}>Thùng rác đang trống</Text></View>}
      {trashed.map(item => <View key={item.id} style={s.card}>
        <Pressable accessibilityRole="button" onPress={() => router.push(`/chat/${item.id}`)} style={s.row}>
          <Image source={remoteImageSource(item.staffAvatar || '/api/v1/identity/default-avatar.png')} style={s.avatar} />
          <View style={{ flex: 1, gap: 4 }}><Text style={s.name}>{item.staffName}</Text><Text style={s.service}>{item.serviceName} · Đơn {item.bookingCode || `#${item.bookingId}`}</Text><Text numberOfLines={2} style={s.preview}>{item.lastMessage || 'Chưa có tin nhắn'}</Text></View>
          <IconSymbol name="chevronRight" size={18} color="#64748B" />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setError(''); setSelected(item); }} style={[s.button, s.danger]}><IconSymbol name="trash" size={18} color="#DC2626" /><Text style={s.dangerText}>Xóa vĩnh viễn</Text></Pressable>
      </View>)}
    </ScrollView>
    <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => { if (!busy) setSelected(null); }}>
      <View style={s.scrim}><View style={s.dialog}>
        <Text style={s.title}>Xóa vĩnh viễn hội thoại?</Text>
        <Text style={s.hint}>Toàn bộ lịch sử hiện tại của cuộc hội thoại này sẽ bị xóa khỏi tài khoản của bạn và không thể khôi phục. Lịch sử phía nhân viên vẫn được giữ.</Text>
        {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={busy} style={[s.button, s.danger, busy && { opacity: 0.5 }]} onPress={() => void remove()}>{busy ? <ActivityIndicator color="#DC2626" /> : <Text style={s.dangerText}>Xóa vĩnh viễn</Text>}</Pressable>
        <Pressable accessibilityRole="button" disabled={busy} style={s.button} onPress={() => setSelected(null)}><Text style={s.preview}>Hủy</Text></Pressable>
      </View></View>
    </Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }, back: { padding: 8 }, title: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  content: { padding: 20, gap: 16 }, hint: { color: '#64748B', lineHeight: 22, fontSize: 14 }, card: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, gap: 16 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 48, height: 48, borderRadius: 24 }, name: { fontSize: 15, color: '#0F172A', fontWeight: '700' }, service: { fontSize: 12, color: '#059669' }, preview: { color: '#475569', fontSize: 14 },
  button: { minHeight: 46, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: 'white' }, danger: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }, dangerText: { color: '#DC2626', fontWeight: '700', fontSize: 14 }, error: { color: '#DC2626' }, empty: { alignItems: 'center', paddingVertical: 64, gap: 16 }, emptyText: { color: '#64748B', fontSize: 16 }, scrim: { flex: 1, backgroundColor: '#0007', justifyContent: 'center', padding: 24 }, dialog: { padding: 24, borderRadius: 20, backgroundColor: 'white', gap: 16 },
});
