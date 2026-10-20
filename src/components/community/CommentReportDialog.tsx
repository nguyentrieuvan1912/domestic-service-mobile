import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { operationRequest } from '@/api/operations';
import { REPORT_REASONS, type CommunityComment } from '@/api/community';

export function CommentReportDialog({ postId, comment, onClose, onSaved }: { postId: number; comment: CommunityComment; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState('SPAM'), [detail, setDetail] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = useRef(false);
  const send = async () => {
    if (locked.current) return; locked.current = true; setBusy(true); setError('');
    try { await operationRequest('identity', `/community/posts/${postId}/comments/${comment.id}/reports`, 'POST', { reason, detail: detail.trim() }); onSaved(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa gửi được báo cáo.'); }
    finally { locked.current = false; setBusy(false); }
  };
  return <Modal animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}><SafeAreaView style={s.screen}><KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <View style={s.row}><Text style={s.title}>Báo cáo bình luận</Text><Pressable disabled={busy} onPress={onClose} style={s.button}><Text>Đóng ✕</Text></Pressable></View>
    <View style={s.quote}><Text style={s.bold}>{comment.author}</Text><Text numberOfLines={4}>{comment.content || `${comment.media?.length || 0} ảnh / video`}</Text></View>
    <Text>Chọn lý do để quản trị viên xem xét nội dung và các tệp đính kèm.</Text>
    {REPORT_REASONS.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: reason === item.id }} disabled={busy} style={[s.choice, reason === item.id && s.selected]} onPress={() => setReason(item.id)}><Text style={s.bold}>{reason === item.id ? '●' : '○'} {item.label}</Text></Pressable>)}
    <TextInput accessibilityLabel="Chi tiết báo cáo" editable={!busy} value={detail} onChangeText={setDetail} placeholder={reason === 'OTHER' ? 'Mô tả lý do (bắt buộc)' : 'Mô tả thêm (không bắt buộc)'} multiline maxLength={2000} style={s.input} />
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <Pressable disabled={busy || (reason === 'OTHER' && !detail.trim())} style={[s.submit, (busy || (reason === 'OTHER' && !detail.trim())) && { opacity: 0.5 }]} onPress={() => void send()}><Text style={s.white}>{busy ? 'Đang gửi…' : 'Gửi báo cáo'}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;
}
const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#fff' }, content: { padding: 18, gap: 14 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, title: { flex: 1, fontSize: 19, fontWeight: '800', color: '#164E3B' }, bold: { fontWeight: '700', color: '#334155' }, button: { minHeight: 44, padding: 10, justifyContent: 'center' }, quote: { padding: 12, gap: 6, borderRadius: 12, backgroundColor: '#F1F5F9' }, choice: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 14 }, selected: { borderColor: '#00875F', backgroundColor: '#ECFDF5' }, input: { minHeight: 100, maxHeight: 200, textAlignVertical: 'top', padding: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10 }, submit: { backgroundColor: '#00875F', borderRadius: 10, padding: 15, alignItems: 'center' }, white: { color: '#fff', fontWeight: '700' }, error: { color: '#B91C1C' } });
