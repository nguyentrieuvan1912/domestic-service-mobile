import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, FlatList, Modal, ScrollView, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { operationRequest } from '@/api/operations';
import { identityRequest } from '@/api/identity';
import { useAuth } from '@/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { CommunityMediaGallery, CommunityMediaViewer, type DisplayMedia } from './CommunityMediaGallery';
import { CommentReportDialog } from './CommentReportDialog';
import { remoteImageSource } from '@/utils/image-source';
import { applyCommentDeletions, uploadAttachment, validateAttachment, type UploadTicket, type CommunityMedia, type CommunityPost, type CommunityComment, type CommentPage, REACTIONS, mergeComments, requestKey } from '@/api/community';

export function CommunityThread({ post, onClose, onChanged }: { post: CommunityPost; onClose: () => void; onChanged: () => void }) {
  const { currentUser, accessToken } = useAuth();
  const [items, setItems] = useState<CommunityComment[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [draft, setDraft] = useState(''), [reply, setReply] = useState<CommunityComment | null>(null), [saving, setSaving] = useState(false), [more, setMore] = useState(false), [picker, setPicker] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(5), [expandedText, setExpandedText] = useState<Record<number, boolean>>({});
  const [media, setMedia] = useState<{ asset: ImagePicker.ImagePickerAsset; ticket?: UploadTicket; uploaded?: CommunityMedia }[]>([]), [progress, setProgress] = useState('');
  const [viewer, setViewer] = useState<DisplayMedia[]>([]), [viewerIndex, setViewerIndex] = useState(0);
  const [report, setReport] = useState<CommunityComment | null>(null), [reported, setReported] = useState<Record<number, boolean>>({});
  const [notice, setNotice] = useState(''), [mediaEnabled, setMediaEnabled] = useState(false);
  const uploadAbort = useRef(new AbortController());
  useEffect(() => { void operationRequest<{ enabled: boolean }>('identity', '/community/media/capabilities').then(value => { if (alive.current) setMediaEnabled(value.enabled); }).catch(() => {}); return () => uploadAbort.current.abort(); }, []);
  const viewerOwner = useRef<number | null>(null);
  const openMedia = (items: DisplayMedia[], index: number) => { setViewer(items); setViewerIndex(index); };
  const pickMedia = async () => {
    if (locked.current) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, selectionLimit: 4, quality: 0.85 });
      if (!alive.current || result.canceled) return;
      const assets = result.assets.slice(0, 4); assets.forEach(validateAttachment); setMedia(assets.map(asset => ({ asset })));
    } catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'Chưa chọn được tệp.'); }
  };
  const list = useRef<FlatList<CommunityComment>>(null), newest = useRef(0), oldest = useRef(0), loaded = useRef(false), nearEnd = useRef(true), alive = useRef(true), reading = useRef(false), locked = useRef(false);
  const submission = useRef({ body: '', key: requestKey() });
  const sync = useCallback(async (signal?: AbortSignal) => {
    if (reading.current) return; reading.current = true;
    try {
      let next = newest.current, rounds = 0, hasMore = false;
      do {
        const page = await identityRequest<CommentPage>('/community/posts/' + post.id + '/comments' + (loaded.current ? '?after=' + next : ''), undefined, accessToken || undefined, 'GET', signal);
        if (!alive.current || signal?.aborted) return;
        const initial = !loaded.current;
        if (initial) { oldest.current = page.nextBefore; setMore(page.hasMore); }
        loaded.current = true;
        setItems(old => applyCommentDeletions(old, page.deletedIds));
        if (page.deletedIds?.length) { setReply(old => old && page.deletedIds.includes(old.id) ? null : old); if (page.deletedIds.includes(viewerOwner.current || 0)) setViewer([]); }
        if (page.items.length) { newest.current = Math.max(newest.current, ...page.items.map(item => item.id)); setItems(old => applyCommentDeletions(mergeComments(old, page.items), page.deletedIds)); }
        if ((initial || page.items.length > 0) && nearEnd.current) requestAnimationFrame(() => list.current?.scrollToEnd({ animated: !initial }));
        hasMore = !initial && page.hasMore; next = newest.current; rounds++;
      } while (hasMore && rounds < 3);
      setError('');
    } catch (cause) { if (alive.current && !signal?.aborted) setError(cause instanceof Error ? cause.message : 'Chưa tải được thảo luận.'); }
    finally { reading.current = false; if (alive.current) setLoading(false); }
  }, [post.id, accessToken]);
  useEffect(() => {
    alive.current = true; const controller = new AbortController(); void sync(controller.signal);
    const timer = setInterval(() => { if (AppState.currentState === 'active') void sync(controller.signal); }, 5000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void sync(controller.signal); });
    return () => { alive.current = false; controller.abort(); clearInterval(timer); subscription.remove(); };
  }, [sync]);
  const older = async () => {
    if (locked.current || !oldest.current) return; locked.current = true; setSaving(true);
    try { const page = await identityRequest<CommentPage>('/community/posts/' + post.id + '/comments?before=' + oldest.current, undefined, accessToken || undefined); if (!alive.current) return; oldest.current = page.nextBefore; setMore(page.hasMore); nearEnd.current = false; setVisibleCount(count => count + 10); setItems(old => applyCommentDeletions(mergeComments(old, page.items), page.deletedIds)); }
    catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'Chưa tải được.'); }
    finally { locked.current = false; if (alive.current) setSaving(false); }
  };
  const send = async () => {
    if (locked.current || (!draft.trim() && !media.length) || !currentUser) return; locked.current = true; setSaving(true); setError('');
    try {
      const selected = [...media];
      for (let index = 0; index < selected.length; index++) {
        if (selected[index].uploaded) continue;
        if (!selected[index].ticket) {
          selected[index] = { ...selected[index], ticket: await operationRequest<UploadTicket>('identity', '/community/media/signature', 'POST', { type: selected[index].asset.type }) };
          if (!alive.current) return; setMedia([...selected]);
        }
        const uploaded = await uploadAttachment(selected[index].asset, selected[index].ticket!, value => { if (alive.current) setProgress(`Đang tải tệp ${index + 1}/${selected.length}: ${value}%`); }, uploadAbort.current.signal);
        if (!alive.current) return; selected[index] = { ...selected[index], uploaded }; setMedia([...selected]);
      }
      const body = { content: draft.trim(), parentId: reply?.id ?? null, mediaIds: selected.map(item => item.uploaded!.id) }, serialized = JSON.stringify(body);
      if (submission.current.body !== serialized) submission.current = { body: serialized, key: requestKey() };
      const saved = await operationRequest<CommunityComment>('identity', '/community/posts/' + post.id + '/comments', 'POST', { ...body, requestKey: submission.current.key });
      if (!alive.current) return;
      // Show the persisted acknowledgement immediately without advancing the polling cursor past other users' unseen replies.
      if (typeof saved.content === 'string' && saved.reactions) setItems(old => mergeComments(old, [saved]));
      setDraft(''); setMedia([]); setReply(null); submission.current = { body: '', key: requestKey() }; nearEnd.current = true; await sync(); onChanged();
    } catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'Chưa gửi được bình luận.'); }
    finally { locked.current = false; if (alive.current) { setSaving(false); setProgress(''); } }
  };
  return <SafeAreaView style={s.screen} edges={['top', 'bottom']}><KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <View style={s.header}><View style={s.grow}><Text style={s.heading}>Thảo luận bài viết</Text><Text numberOfLines={2} style={s.note}>{post.author} · {post.content || 'Ảnh / video'}</Text></View><Pressable accessibilityLabel="Đóng thảo luận" disabled={saving} onPress={onClose} style={s.button}><Text style={s.link}>Đóng ✕</Text></Pressable></View>
    {!!error && <Pressable onPress={() => void sync()} style={s.errorBox}><Text style={s.error}>{error} · Thử lại</Text></Pressable>}
    {!!notice && <Text style={s.success}>{notice}</Text>}
    <FlatList ref={list} data={items.slice(-visibleCount)} keyExtractor={item => String(item.id)} contentContainerStyle={s.messages} keyboardShouldPersistTaps="handled" maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      onContentSizeChange={() => { if (nearEnd.current) list.current?.scrollToEnd({ animated: false }); }}
      onScroll={({ nativeEvent: e }) => { nearEnd.current = e.contentSize.height - e.layoutMeasurement.height - e.contentOffset.y < 100; }} scrollEventThrottle={100}
      ListHeaderComponent={<View style={s.actions}>
        {items.length > visibleCount ? <Pressable disabled={saving} onPress={() => { nearEnd.current = false; setVisibleCount(count => count + 10); }} style={s.button}><Text style={s.link}>Xem thêm {Math.min(10, items.length - visibleCount)} bình luận trước</Text></Pressable> : more ? <Pressable disabled={saving} onPress={() => void older()} style={s.button}><Text style={s.link}>Xem thêm bình luận trước</Text></Pressable> : null}
        {visibleCount > 5 && <Pressable onPress={() => { nearEnd.current = true; setVisibleCount(5); }} style={s.button}><Text style={s.link}>Thu gọn · 5 bình luận gần nhất</Text></Pressable>}
      </View>}
      ListEmptyComponent={<Text style={s.note}>{loading ? 'Đang tải bình luận…' : 'Chưa có bình luận. Hãy bắt đầu trò chuyện.'}</Text>}
      renderItem={({ item }) => <View style={s.bubble}>
        <Text style={s.author}>{item.author}</Text>
        {!!item.parentId && <View style={s.quote}><Text style={s.link}>Trả lời {item.parentAuthor}</Text><Text numberOfLines={3} style={s.note}>{item.parentContent}</Text></View>}
        <Text numberOfLines={!expandedText[item.id] && (item.content.length > 180 || item.content.split('\n').length > 4) ? 5 : undefined} style={s.body}>{item.content}</Text>
        {(item.content.length > 180 || item.content.split('\n').length > 4) && <Pressable style={s.button} onPress={() => setExpandedText(old => ({ ...old, [item.id]: !old[item.id] }))}><Text style={s.link}>{expandedText[item.id] ? 'Thu gọn nội dung' : 'Xem thêm nội dung'}</Text></Pressable>}
        {!!item.media?.length && !item.deleted && <CommunityMediaGallery media={item.media} onOpen={(files, index) => { viewerOwner.current = item.id; openMedia(files, index); }} />}
        <Text style={s.note}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
        {!item.deleted && <View style={s.actions}><Pressable disabled={saving || !currentUser} onPress={() => setReply(item)} style={s.button}><Text style={s.link}>Trả lời</Text></Pressable><Pressable disabled={saving || !currentUser} onPress={() => setPicker(picker === item.id ? null : item.id)} style={s.button}><Text style={s.link}>{item.myReaction ? REACTIONS.find(r => r.id === item.myReaction)?.emoji : '♡'} Cảm xúc</Text></Pressable><Text style={s.note}>{REACTIONS.filter(r => item.reactions[r.id]).map(r => r.emoji + ' ' + item.reactions[r.id]).join('  ')}</Text><Pressable disabled={saving || !currentUser || reported[item.id]} style={s.button} onPress={() => setReport(item)}><Text style={s.report}>{reported[item.id] ? 'Đã báo cáo' : '⚑ Báo cáo'}</Text></Pressable></View>}
        {!item.deleted && picker === item.id && <View style={s.actions}>{REACTIONS.map(reaction => <Pressable key={reaction.id} disabled={saving} accessibilityLabel={reaction.label} style={s.button} onPress={async () => {
          if (locked.current) return; locked.current = true; setSaving(true);
          try { const updated = await operationRequest<CommunityComment>('identity', '/community/posts/' + post.id + '/comments/' + item.id + '/reaction', 'PATCH', { reaction: item.myReaction === reaction.id ? null : reaction.id }); if (alive.current) { setItems(old => mergeComments(old, [updated])); setPicker(null); } }
          catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'Chưa lưu được cảm xúc.'); }
          finally { locked.current = false; if (alive.current) setSaving(false); }
        }}><Text style={s.emoji}>{reaction.emoji}</Text></Pressable>)}</View>}
      </View>} />
    <View style={s.composer}>{reply && <View style={s.reply}><Text numberOfLines={2} style={[s.note, s.grow]}>Đang trả lời {reply.author}: {reply.content}</Text><Pressable disabled={saving} style={s.button} onPress={() => setReply(null)}><Text style={s.link}>Bỏ</Text></Pressable></View>}
      <View style={s.attachmentRow}><Pressable accessibilityRole="button" accessibilityLabel="Thêm ảnh hoặc video vào bình luận" disabled={saving || !currentUser || !mediaEnabled} style={({ pressed }) => [s.addMediaButton, pressed && s.addMediaPressed, (saving || !currentUser || !mediaEnabled) && s.disabled]} onPress={() => void pickMedia()}><Text style={s.addMediaText}>＋ Thêm ảnh / Video {media.length ? `(${media.length}/4)` : ''}</Text></Pressable><Text style={s.note}>Ảnh 10 MB · Video 50 MB / 2 phút</Text></View>
      {!!media.length && <ScrollView horizontal contentContainerStyle={{ gap: 8 }} style={{ maxHeight: 90 }}>{media.map((item, index) => <View key={item.asset.uri} style={s.attachment}>{item.asset.type === 'video' ? <Text style={s.note}>▶ Video {index + 1}</Text> : <Image source={remoteImageSource(item.asset.uri)} style={s.thumbnail} />}<Pressable accessibilityLabel={`Bỏ tệp ${index + 1}`} disabled={saving} onPress={() => setMedia(old => old.filter((_, i) => i !== index))} style={s.remove}><Text>✕</Text></Pressable></View>)}</ScrollView>}
      {!!progress && <Text style={s.note}>{progress}</Text>}
      <View style={s.inputRow}><TextInput accessibilityLabel="Nội dung bình luận" editable={!saving && !!currentUser} value={draft} onChangeText={setDraft} maxLength={2000} multiline placeholder={!currentUser ? 'Đăng nhập để bình luận' : reply ? 'Viết trả lời…' : 'Viết bình luận…'} style={s.input} /><Pressable accessibilityRole="button" disabled={saving || (!draft.trim() && !media.length) || !currentUser} onPress={() => void send()} style={[s.send, (saving || (!draft.trim() && !media.length)) && s.disabled]}><Text style={s.white}>{saving ? 'Đợi…' : 'Gửi'}</Text></Pressable></View>
    </View>
    {!!viewer.length && <Modal animationType="fade" onRequestClose={() => setViewer([])}><CommunityMediaViewer media={viewer} index={viewerIndex} onIndex={setViewerIndex} onClose={() => setViewer([])} /></Modal>}
    {report && <CommentReportDialog key={report.id} postId={post.id} comment={report} onClose={() => setReport(null)} onSaved={() => { setReported(old => ({ ...old, [report.id]: true })); setReport(null); setNotice('Đã lưu báo cáo. Quản trị viên sẽ xem xét bình luận này.'); }} />}
  </KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({
  attachmentRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  addMediaButton: { minHeight: 44, borderWidth: 1, borderColor: '#00875F', borderRadius: 10, backgroundColor: '#ECFDF5', paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  addMediaPressed: { backgroundColor: '#D1FAE5' },
  addMediaText: { color: '#00734F', fontSize: 13, fontWeight: '700' },
  report: { color: '#B45309', fontSize: 12, fontWeight: '700' }, success: { padding: 12, color: '#166534', backgroundColor: '#DCFCE7' }, attachment: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }, thumbnail: { width: 80, height: 80, borderRadius: 8 }, remove: { position: 'absolute', right: 0, top: 0, backgroundColor: '#fff', minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  screen: { flex: 1, backgroundColor: '#F2F8F5' }, header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: '#fff' }, grow: { flex: 1, minWidth: 0 },
  heading: { fontWeight: '800', fontSize: 18, color: '#164E3B' }, note: { color: '#64748B', fontSize: 11, lineHeight: 17 }, messages: { padding: 14, gap: 12, paddingBottom: 20 },
  bubble: { padding: 12, gap: 6, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DCE8E2' }, author: { fontWeight: '700', fontSize: 13, color: '#164E3B' }, body: { fontSize: 14, lineHeight: 21, color: '#334155' },
  quote: { padding: 10, borderLeftWidth: 3, borderLeftColor: '#00A675', backgroundColor: '#F0F8F3', borderRadius: 6 }, actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }, button: { padding: 10, minHeight: 44, justifyContent: 'center' },
  link: { color: '#00875F', fontSize: 12, fontWeight: '700' }, emoji: { fontSize: 22 }, composer: { padding: 12, backgroundColor: '#fff', gap: 8, borderTopWidth: 1, borderTopColor: '#DCE8E2' }, reply: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' }, input: { flex: 1, minWidth: 0, minHeight: 44, maxHeight: 120, borderRadius: 14, backgroundColor: '#F1F5F9', padding: 12, color: '#334155', fontSize: 14 },
  send: { minHeight: 44, borderRadius: 12, backgroundColor: '#00875F', padding: 12, justifyContent: 'center' }, white: { color: '#fff', fontWeight: '700' }, disabled: { opacity: 0.45 }, errorBox: { padding: 12, backgroundColor: '#FEF2F2' }, error: { color: '#B91C1C', fontSize: 12 },
});
