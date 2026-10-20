import { remoteImageSource } from '@/utils/image-source';
import { useFocusEffect } from 'expo-router';
import { identityRequest } from '@/api/identity';
import { operationRequest, operationSession } from '@/api/operations';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, AppState, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';
import { CommunityThread } from './CommunityThread';
import { CommunityMediaGallery, CommunityMediaViewer, type DisplayMedia } from './CommunityMediaGallery';
import { CommunityPost, CommunityMedia, REACTIONS, Reaction, UploadTicket, requestKey, uploadAttachment, validateAttachment } from '@/api/community';

type LocalMedia = { asset: ImagePicker.ImagePickerAsset; ticket?: UploadTicket; uploaded?: CommunityMedia; progress: number };
export default function CommunityScreen({ staffNavigation = false }: { staffNavigation?: boolean }) {
  const { currentUser, accessToken } = useAuth();
  return <CommunityContent key={String(currentUser?.id) + ':' + accessToken} staffNavigation={staffNavigation} />;
}
function CommunityContent({ staffNavigation }: { staffNavigation: boolean }) {
  const { currentUser, accessToken } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState(''), [media, setMedia] = useState<LocalMedia[]>([]), [mediaEnabled, setMediaEnabled] = useState(false);
  const [thread, setThread] = useState<CommunityPost | null>(null), [reactionPost, setReactionPost] = useState<number | null>(null);
  const [fullscreenImages, setFullscreenImages] = useState<DisplayMedia[]>([]), [fullscreenIndex, setFullscreenIndex] = useState(0);
  const alive = useRef(true), controller = useRef(new AbortController()), locked = useRef(false), reading = useRef(false), mutations = useRef(new Set<number>());
  const publishKey = useRef({ body: '', key: requestKey() });
  const revision = useRef(0);
  const owner = useRef(operationSession()?.token);
  const current = () => alive.current && owner.current === operationSession()?.token;
  useEffect(() => { alive.current = true; return () => { alive.current = false; controller.current.abort(); }; }, []);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (reading.current || mutations.current.size) return; reading.current = true; const version = revision.current;
    try {
      const [rows, capability] = await Promise.all([
        identityRequest<CommunityPost[]>('/community/posts', undefined, accessToken || undefined, 'GET', signal),
        identityRequest<{ enabled: boolean }>('/community/media/capabilities', undefined, undefined, 'GET', signal),
      ]);
      if (current() && !signal?.aborted && version === revision.current) { setPosts(rows); setMediaEnabled(capability.enabled); setLoadError(''); }
    } catch (cause) { if (current() && !signal?.aborted) setLoadError(cause instanceof Error ? cause.message : 'Chưa tải được cộng đồng.'); }
    finally { reading.current = false; if (current()) setLoading(false); }
  }, [accessToken]);
  useFocusEffect(useCallback(() => {
    const abort = new AbortController(); void refresh(abort.signal);
    const timer = setInterval(() => { if (AppState.currentState === 'active' && !locked.current) void refresh(abort.signal); }, 15000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(abort.signal); });
    return () => { abort.abort(); clearInterval(timer); listener.remove(); };
  }, [refresh]));
  const pickMedia = async () => {
    if (locked.current) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsEditing: false, allowsMultipleSelection: true, selectionLimit: 4, quality: 0.85 });
      if (!current() || result.canceled) return;
      const assets = result.assets.slice(0, 4); assets.forEach(validateAttachment); setMedia(assets.map(asset => ({ asset, progress: 0 })));
    } catch (cause) { if (current()) setError(cause instanceof Error ? cause.message : 'Chưa chọn được tệp.'); }
  };
  const publish = async () => {
    if (locked.current || (!draft.trim() && !media.length)) return;
    if (!currentUser) { setError('Vui lòng đăng nhập để đăng bài.'); return; }
    locked.current = true; revision.current++; setSaving(true); setError('');
    try {
      const selected = [...media];
      for (let index = 0; index < selected.length; index++) {
        if (selected[index].uploaded) continue;
        if (!selected[index].ticket) {
          selected[index] = { ...selected[index], ticket: await operationRequest<UploadTicket>('identity', '/community/media/signature', 'POST', { type: selected[index].asset.type }) };
          if (!current()) return; setMedia([...selected]);
        }
        const uploaded = await uploadAttachment(selected[index].asset, selected[index].ticket!, progress => {
          if (current()) setMedia(old => old.map((item, i) => i === index ? { ...item, progress } : item));
        }, controller.current.signal);
        if (!current()) return; selected[index] = { ...selected[index], uploaded, progress: 100 }; setMedia([...selected]);
      }
      const body = { content: draft.trim(), mediaIds: selected.map(item => item.uploaded!.id) }, serialized = JSON.stringify(body);
      if (publishKey.current.body !== serialized) publishKey.current = { body: serialized, key: requestKey() };
      const result = await operationRequest<{ id: number; status: string }>('identity', '/community/posts', 'POST', { ...body, requestKey: publishKey.current.key });
      if (!current()) return;
      revision.current++; setComposerOpen(false); setDraft(''); setMedia([]); publishKey.current = { body: '', key: requestKey() }; await refresh();
      Alert.alert('Đã lưu bài viết', result.status === 'PENDING' ? 'Bài đã được lưu, chờ quản trị viên duyệt.' : 'Bài đã được công bố.');
    } catch (cause) { if (current()) setError(cause instanceof Error ? cause.message : 'Chưa đăng được. Bản nháp được giữ lại.'); }
    finally { locked.current = false; if (current()) setSaving(false); }
  };
  const react = async (post: CommunityPost, reaction: Reaction) => {
    if (mutations.current.has(post.id)) return; mutations.current.add(post.id); revision.current++;
    try {
      const result = await operationRequest<CommunityPost>('identity', '/community/posts/' + post.id + '/reaction', 'PATCH', { reaction: post.myReaction === reaction ? null : reaction });
      if (current()) { revision.current++; setPosts(old => old.map(item => item.id === result.id ? result : item)); setReactionPost(null); }
    } catch (cause) { if (current()) setError(cause instanceof Error ? cause.message : 'Chưa lưu được cảm xúc.'); }
    finally { mutations.current.delete(post.id); }
  };
  const displayName = currentUser?.fullName || 'Bạn';
  return <LinearGradient colors={BrandColors.softBgGradient} style={styles.gradient}><SafeAreaView style={styles.safeArea} edges={['top']}>
    <FlatList data={posts} keyExtractor={post => String(post.id)} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" initialNumToRender={5} windowSize={5}
      ListHeaderComponent={<View style={{ gap: 14 }}>
        <View style={styles.header}><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.title}>Cộng đồng</Text><Text style={styles.subtitle}>Chia sẻ, hỏi đáp và kết nối cùng CleanMaster</Text></View><View style={styles.memberCount}><Text style={styles.memberText}>{posts.length} bài viết</Text></View></View>
        {!!(error || loadError) && <Pressable onPress={() => void refresh()} style={styles.backendHint}><Text style={[styles.backendHintText, { color: '#B91C1C' }]}>{error || loadError} · Tải lại</Text></Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel="Mở màn hình đăng bài" onPress={() => { if (!currentUser) { setError('Vui lòng đăng nhập để đăng bài.'); return; } setComposerOpen(true); }} style={styles.composerShortcut}>
          <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text></View>
          <Text numberOfLines={1} style={styles.shortcutText}>{draft.trim() || media.length ? 'Tiếp tục bản nháp của bạn…' : 'Bạn muốn chia sẻ điều gì?'}</Text>
          <Text style={styles.shortcutPlus}>＋</Text>
        </Pressable>
      </View>}
      ListEmptyComponent={<Text style={styles.subtitle}>{loading ? 'Đang tải cộng đồng…' : 'Chưa có bài viết để hiển thị.'}</Text>}
      renderItem={({ item: post }) => <View style={[styles.post, post.status === 'PENDING' && styles.pendingPost]}>
        {post.status === 'PENDING' && <View style={styles.pendingNotice}><Text style={styles.pendingTitle}>◷ CHỜ DUYỆT</Text><Text style={styles.pendingDescription}>Bài viết đang chờ quản trị viên duyệt, chưa hiển thị công khai.</Text></View>}
        {post.status === 'HIDDEN' && <View style={styles.hiddenNotice}><Text style={styles.hiddenTitle}>BÀI VIẾT ĐÃ ẨN</Text></View>}
        <View style={styles.postHeader}>{post.avatar ? <Image source={remoteImageSource(post.avatar)} style={styles.postAvatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{post.author.charAt(0)}</Text></View>}<View style={styles.postMeta}><Text style={styles.author}>{post.author}</Text><Text style={styles.postTime}>{new Date(post.createdAt).toLocaleString('vi-VN')} · Cộng đồng</Text></View></View>
        {!!post.content && <Text style={styles.postContent}>{post.content}</Text>}
        {!!post.media.length && <CommunityMediaGallery media={post.media} onOpen={(items, index) => { setFullscreenImages(items); setFullscreenIndex(index); }} />}
        <View style={styles.postStats}><Text style={[styles.statsText, { flex: 1 }]}>{REACTIONS.filter(r => post.reactions[r.id]).map(r => r.emoji + ' ' + post.reactions[r.id]).join('  ') || 'Chưa có cảm xúc'}</Text><Text style={styles.statsText}>{post.commentCount} bình luận</Text></View>
        <View style={styles.actions}><Pressable disabled={!currentUser} style={styles.action} onPress={() => setReactionPost(reactionPost === post.id ? null : post.id)}><Text style={[styles.actionText, !!post.myReaction && styles.likedText]}>{post.myReaction ? REACTIONS.find(r => r.id === post.myReaction)?.emoji : '♡'} Cảm xúc</Text></Pressable><Pressable style={styles.action} onPress={() => setThread(post)}><Text style={styles.actionText}>💬 Thảo luận</Text></Pressable></View>
        {reactionPost === post.id && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>{REACTIONS.map(reaction => <Pressable key={reaction.id} accessibilityLabel={reaction.label} onPress={() => void react(post, reaction.id)} style={{ padding: 9, minHeight: 44 }}><Text style={{ fontSize: 24 }}>{reaction.emoji}</Text></Pressable>)}</View>}
      </View>} />
    <Modal visible={!!thread} animationType="slide" onRequestClose={() => setThread(null)}>{thread && <CommunityThread key={thread.id} post={thread} onClose={() => setThread(null)} onChanged={() => void refresh()} />}</Modal>
    <Modal visible={composerOpen || fullscreenImages.length > 0} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (fullscreenImages.length) setFullscreenImages([]); else if (!saving) setComposerOpen(false); }}>
      {fullscreenImages.length > 0 ? <CommunityMediaViewer media={fullscreenImages} index={fullscreenIndex} onIndex={setFullscreenIndex} onClose={() => setFullscreenImages([])} /> : <SafeAreaView style={styles.composeScreen} edges={['top', 'bottom']}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.composeHeader}><Pressable disabled={saving} onPress={() => { Keyboard.dismiss(); setComposerOpen(false); }} style={styles.composeBack}><Text style={styles.mediaButtonText}>‹ Quay lại</Text></Pressable><Text style={styles.composeTitle}>Tạo bài viết</Text><Pressable accessibilityRole="button" disabled={saving || (!draft.trim() && !media.length)} onPress={() => void publish()} style={[styles.publishButton, (saving || (!draft.trim() && !media.length)) && { opacity: 0.45 }]}><Text style={styles.publishText}>{saving ? 'Đang đăng…' : 'Đăng'}</Text></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.composeContent}>
          <View style={styles.composerTop}><View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text></View><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.author}>{displayName}</Text><Text style={styles.subtitle}>Bài viết sẽ được quản trị viên duyệt</Text></View></View>
          {!!error && <Text accessibilityRole="alert" style={styles.composeError}>{error}</Text>}
          <TextInput accessibilityLabel="Nội dung bài đăng" editable={!saving} value={draft} onChangeText={setDraft} placeholder="Chia sẻ mẹo nhà cửa hoặc đặt câu hỏi…" maxLength={5000} multiline textAlignVertical="top" style={styles.composeTextInput} />
          {!!media.length && <View style={styles.mediaPreview}><CommunityMediaGallery media={media.map(item => ({ uri: item.asset.uri, type: item.asset.type === 'video' ? 'video' : 'image', width: item.asset.width, height: item.asset.height }))} onOpen={(items, index) => { Keyboard.dismiss(); setFullscreenImages(items); setFullscreenIndex(index); }} />
            {media.map((item, index) => <View key={item.asset.uri + index} style={styles.selectedFile}><Text numberOfLines={2} style={styles.selectedFileText}>{index + 1}. {item.asset.type === 'video' ? 'Video' : 'Ảnh'} · {saving ? item.uploaded ? 'Đã xác minh' : `Đang tải ${item.progress}%` : item.uploaded ? 'Đã tải và xác minh' : 'Đã chọn'}</Text><Pressable disabled={saving} accessibilityLabel={`Bỏ tệp ${index + 1}`} onPress={() => setMedia(old => old.filter((_, i) => i !== index))} style={styles.composeBack}><Text style={styles.mediaButtonText}>Bỏ</Text></Pressable></View>)}
          </View>}
          <Pressable disabled={saving || !mediaEnabled} onPress={() => void pickMedia()} style={[styles.composeMediaButton, !mediaEnabled && { opacity: 0.45 }]}><IconSymbol name="plus" size={20} color={BrandColors.primary} /><Text style={styles.mediaButtonText}>{media.length ? 'Chọn lại ảnh / video' : 'Thêm ảnh / video'}</Text></Pressable>
          <Text style={styles.subtitle}>{mediaEnabled ? 'Tối đa 4 tệp · ảnh 10 MB · video 50 MB / 2 phút. Quay lại sẽ giữ bản nháp khi bạn vẫn ở màn Cộng đồng.' : 'Chưa kết nối Cloudinary. Bạn vẫn có thể đăng bài bằng văn bản.'}</Text>
        </ScrollView>
      </KeyboardAvoidingView></SafeAreaView>}
    </Modal>
  </SafeAreaView>{staffNavigation && <StaffBottomNav activeTab="community" />}</LinearGradient>;
}

const styles = StyleSheet.create({
  composerShortcut: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 62, padding: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#DCE8E2' },
  shortcutText: { flex: 1, minWidth: 0, color: '#64748B', fontSize: 13 }, shortcutPlus: { color: '#00875F', fontSize: 25 },
  composeScreen: { flex: 1, backgroundColor: '#fff' }, composeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }, composeBack: { minHeight: 44, padding: 8, justifyContent: 'center' }, composeTitle: { flex: 1, minWidth: 0, textAlign: 'center', color: '#163A2C', fontSize: 17, fontWeight: '800' },
  composeContent: { padding: 16, gap: 16, paddingBottom: 32, flexGrow: 1 }, composeTextInput: { minHeight: 180, paddingVertical: 12, fontSize: 17, lineHeight: 25, color: '#334155' }, composeError: { color: '#B91C1C', lineHeight: 20, fontSize: 13 }, composeMediaButton: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, borderWidth: 1, borderColor: '#B7E4D1', padding: 14, borderRadius: 12 },
  selectedFile: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' }, selectedFileText: { flex: 1, minWidth: 0, fontSize: 12, color: '#475569' },
  gradient: { flex: 1 }, safeArea: { flex: 1 }, content: { padding: Spacing.four, paddingBottom: 32, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  title: { color: BrandColors.gray900, fontSize: 26, fontWeight: '800' }, subtitle: { color: BrandColors.gray600, fontSize: 13, marginTop: 3 },
  memberCount: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 9, paddingVertical: 6, borderRadius: BorderRadius.full }, memberText: { color: BrandColors.primary, fontSize: 11, fontWeight: '700' },
  composer: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.lg, padding: 14, borderWidth: 1, borderColor: '#DCFCE7', gap: 11 }, composerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: BrandColors.primary, alignItems: 'center', justifyContent: 'center' }, avatarInitial: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 }, composerPrompt: { color: BrandColors.gray700, fontWeight: '600', fontSize: 13 },
  composerInput: { minHeight: 76, color: BrandColors.gray800, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 11, fontSize: 14 }, composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  mediaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7 }, mediaButtonText: { color: BrandColors.primary, fontSize: 12, fontWeight: '700' },
  publishButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BrandColors.primary, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 10 }, publishText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  mediaPreview: { position: 'relative', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F1F5F9' },
  videoPreview: { height: 120, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', gap: 6 }, videoPreviewText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  removeMedia: { position: 'absolute', top: 8, right: 8, width: 25, height: 25, borderRadius: 13, backgroundColor: 'rgba(15,23,42,0.75)', alignItems: 'center', justifyContent: 'center' }, removeMediaText: { color: '#FFFFFF', fontSize: 21, lineHeight: 23 }, mediaFileName: { color: BrandColors.gray600, fontSize: 11, paddingHorizontal: 10, paddingVertical: 7 },
  backendHint: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 11, borderRadius: 12, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' }, backendHintText: { flex: 1, color: '#92400E', fontSize: 12, lineHeight: 17 },
  post: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.lg, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' }, sponsoredPost: { borderColor: '#FCD34D', backgroundColor: '#FFFEF8' },
  pendingPost: { borderColor: '#F59E0B', borderWidth: 2, backgroundColor: '#FFFCF5' },
  pendingNotice: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 12, gap: 4 },
  pendingTitle: { color: '#92400E', fontSize: 15, fontWeight: '800' },
  pendingDescription: { color: '#92400E', fontSize: 13, lineHeight: 19 },
  hiddenNotice: { backgroundColor: '#F1F5F9', borderRadius: 8, padding: 10, marginBottom: 12 },
  hiddenTitle: { color: '#475569', fontSize: 14, fontWeight: '800' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' }, postMeta: { flex: 1, minWidth: 0 }, authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, author: { color: BrandColors.gray900, fontSize: 14, fontWeight: '800' },
  moreButton: { color: BrandColors.gray500, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  sponsoredBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }, sponsoredText: { color: '#B45309', fontSize: 10, fontWeight: '800' }, postTime: { color: BrandColors.gray500, fontSize: 11, marginTop: 2 }, postContent: { color: BrandColors.gray800, fontSize: 14, lineHeight: 21, marginTop: 13 },
  mediaGallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 12, borderRadius: 12, overflow: 'hidden' }, singleMediaGallery: { display: 'flex' }, galleryImage: { width: '49%', height: 132, backgroundColor: '#E2E8F0' }, galleryImageContent: { width: '100%', height: '100%' }, singleGalleryImage: { width: '100%', height: 220 }, postVideo: { width: '49%', height: 132, marginTop: 0, borderRadius: 0, backgroundColor: '#0F172A' },
  fullscreenBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' }, fullscreenSafeArea: { flex: 1 }, fullscreenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 }, fullscreenCount: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }, closeViewerButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }, closeViewerText: { color: '#FFFFFF', fontSize: 29, lineHeight: 32, fontWeight: '300' }, fullscreenImage: { flex: 1, width: '100%' }, viewerNavigation: { position: 'absolute', bottom: 28, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 }, viewerArrow: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }, viewerArrowDisabled: { opacity: 0.3 }, viewerArrowText: { color: '#FFFFFF', fontSize: 36, lineHeight: 40, fontWeight: '300' },
  postStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13, paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }, statsText: { color: BrandColors.gray500, fontSize: 11 }, actions: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 7, gap: 16 }, action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, minHeight: 44 }, actionText: { color: BrandColors.gray600, fontSize: 12, fontWeight: '700' }, likedText: { color: '#E11D48' },
  comment: { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 5 }, commentAuthor: { color: BrandColors.gray800, fontSize: 12, fontWeight: '800' }, commentContent: { color: BrandColors.gray600, fontSize: 12, lineHeight: 17, marginTop: 2 },
  commentComposer: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9, paddingHorizontal: 10, backgroundColor: '#F8FAFC', borderRadius: BorderRadius.full, borderWidth: 1, borderColor: '#E2E8F0' }, commentInput: { flex: 1, color: BrandColors.gray800, fontSize: 13, paddingVertical: 9 },
});
