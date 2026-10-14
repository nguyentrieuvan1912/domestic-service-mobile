import { remoteImageSource } from '@/utils/image-source';
import { useFocusEffect } from 'expo-router';
import { identityRequest } from '@/api/identity';
import { operationRequest } from '@/api/operations';
import React, { useMemo, useState, useCallback } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';

type CommunityComment = { id: string; author: string; content: string };
type CommunityMedia = { uri: string; type: 'image' | 'video'; fileName?: string | null };
type CommunityPost = {
  id: string; author: string; avatar: string; createdAt: string; topic: string;
  content: string; likes: number; comments: CommunityComment[]; isSponsored?: boolean;
  media?: CommunityMedia[];
};


function VideoAttachment({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  return <VideoView player={player} style={styles.postVideo} nativeControls contentFit="cover" />;
}

function MediaGallery({ media, onImagePress }: { media: CommunityMedia[]; onImagePress?: (images: CommunityMedia[], index: number) => void }) {
  const images = media.filter((item) => item.type === 'image');
  return <View style={[styles.mediaGallery, media.length === 1 && styles.singleMediaGallery]}>
    {media.map((item) => item.type === 'image'
      ? <Pressable key={item.uri} onPress={() => onImagePress?.(images, images.findIndex((image) => image.uri === item.uri))} style={[styles.galleryImage, media.length === 1 && styles.singleGalleryImage]}>
        <Image source={remoteImageSource(item.uri)} style={styles.galleryImageContent} />
      </Pressable>
      : <VideoAttachment key={item.uri} uri={item.uri} />)}
  </View>;
}

export default function CommunityScreen() {
  const { currentCustomer, accessToken } = useAuth();
  const [posts,setPosts]=useState<CommunityPost[]>([]);
  const [error,setError]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[attempt,setAttempt]=useState(0);
  type RawPost={id:number;author:string;avatar:string;createdAt:string;status:string;content:string;likes:number;isLiked:boolean;comments:{id:number;author:string;content:string}[]};
  const updatePosts=(rows:RawPost[])=>{setPosts(rows.map(p=>({...p,id:String(p.id),avatar:p.avatar || '',createdAt:new Date(p.createdAt).toLocaleString('vi-VN'),topic:p.status==='PENDING'?'Chờ Admin duyệt':p.status==='HIDDEN'?'Đã ẩn':'Cộng đồng',comments:p.comments.map(c=>({...c,id:String(c.id)}))})));setLikedPostIds(rows.filter(p=>p.isLiked).map(p=>String(p.id)));};
  useFocusEffect(useCallback(()=>{let active=true;const controller=new AbortController();setPosts([]);setLikedPostIds([]);setLoading(true);void identityRequest<RawPost[]>('/community/posts',undefined,accessToken || undefined,'GET',controller.signal).then(rows=>{if(active){updatePosts(rows);setError('');}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false;controller.abort();};},[currentCustomer?.id,accessToken,attempt]));
  const [draft, setDraft] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<CommunityMedia[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [fullscreenImages, setFullscreenImages] = useState<CommunityMedia[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const displayName = currentCustomer?.fullName || 'Bạn';
  const totalPosts = useMemo(() => posts.filter((post) => !post.isSponsored).length, [posts]);

  const publishPost = async () => {
    if(saving)return;setSaving(true);setError('');
    try{const result=await operationRequest<{id:number;status:string}>('identity','/community/posts','POST',{content:draft.trim(),media:selectedMedia});setDraft('');setSelectedMedia([]);setAttempt(x=>x+1);Alert.alert('Đã lưu bài viết',result.status==='PENDING'?'Bài đã lưu, chờ Admin kiểm duyệt.':'Bài đã được công bố.');}
    catch(e){setError(e instanceof Error?e.message:'Chưa đăng được bài.');}finally{setSaving(false);}
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền thư viện', 'Hãy cấp quyền ảnh và video để đính kèm vào bài viết.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedMedia(result.assets.slice(0, 4).map((asset) => ({
        uri: asset.uri, type: asset.type === 'video' ? 'video' : 'image', fileName: asset.fileName,
      })));
    }
  };

  const toggleLike = async (postId:string) => {
    try{const result=await operationRequest<{isLiked:boolean;likes:number}>('identity','/community/posts/'+postId+'/like','PATCH',{liked:!likedPostIds.includes(postId)});setPosts(current=>current.map(p=>p.id===postId?{...p,likes:result.likes}:p));setLikedPostIds(current=>result.isLiked?[...new Set([...current,postId])]:current.filter(id=>id!==postId));}
    catch(e){setError(e instanceof Error?e.message:'Chưa lưu được lượt thích.');}
  };
  const submitComment = async (postId:string) => {
    if(!commentDrafts[postId]?.trim())return;
    try{await operationRequest('identity','/community/posts/'+postId+'/comments','POST',{content:commentDrafts[postId].trim()});setCommentDrafts(current=>({...current,[postId]:''}));setAttempt(x=>x+1);}
    catch(e){setError(e instanceof Error?e.message:'Chưa lưu được bình luận.');}
  };

  const openImageViewer = (images: CommunityMedia[], index: number) => {
    setFullscreenImages(images);
    setFullscreenIndex(index);
  };

  const closeImageViewer = () => setFullscreenImages([]);

  return (
    <LinearGradient colors={BrandColors.softBgGradient} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View>{loading && <Text>Đang tải cộng đồng...</Text>}{error && <Pressable onPress={()=>setAttempt(x=>x+1)}><Text style={{color:'#B91C1C'}}>{error} • Thử lại</Text></Pressable>}</View>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Cộng đồng</Text>
              <Text style={styles.subtitle}>Chia sẻ, hỏi đáp và kết nối cùng CleanMaster</Text>
            </View>
            <View style={styles.memberCount}>
              <IconSymbol name="users" size={16} color={BrandColors.primary} />
              <Text style={styles.memberText}>{totalPosts} bài viết</Text>
            </View>
          </View>

          <View style={styles.composer}>
            <View style={styles.composerTop}>
              <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text></View>
              <Text style={styles.composerPrompt}>Bạn đang nghĩ gì, {displayName.split(' ').slice(-1)[0]}?</Text>
            </View>
            <TextInput value={draft} onChangeText={setDraft} placeholder="Chia sẻ mẹo nhà cửa hoặc đặt câu hỏi..." placeholderTextColor={BrandColors.gray400} multiline style={styles.composerInput} textAlignVertical="top" />
            {selectedMedia.length > 0 && <View style={styles.mediaPreview}>
              <MediaGallery media={selectedMedia} />
              <Pressable style={styles.removeMedia} onPress={() => setSelectedMedia([])} hitSlop={8}><Text style={styles.removeMediaText}>×</Text></Pressable>
              <Text numberOfLines={1} style={styles.mediaFileName}>{selectedMedia.length} tệp đã chọn · tối đa 4 tệp/bài</Text>
            </View>}
            <View style={styles.composerFooter}>
              <Pressable style={styles.mediaButton} onPress={pickMedia}>
                <IconSymbol name="plus" size={18} color={BrandColors.primary} />
                <Text style={styles.mediaButtonText}>Ảnh / Video</Text>
              </Pressable>
              <Pressable style={styles.publishButton} disabled={saving} onPress={()=>void publishPost()}>
                <IconSymbol name="send" size={16} color="#FFFFFF" />
                <Text style={styles.publishText}>Đăng bài</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.backendHint}>
            <IconSymbol name="warning" size={18} color="#B45309" />
            <Text style={styles.backendHintText}>Bài viết được lưu trên hệ thống và chờ Admin duyệt. Ảnh/video cần cấu hình lưu trữ trước khi đăng.</Text>
          </View>

          {posts.map((post) => {
            const isLiked = likedPostIds.includes(post.id);
            return <View key={post.id} style={[styles.post, post.isSponsored && styles.sponsoredPost]}>
              <View style={styles.postHeader}>
                <Image source={remoteImageSource(post.avatar)} style={styles.postAvatar} />
                <View style={styles.postMeta}>
                  <View style={styles.authorRow}>
                    <Text style={styles.author}>{post.author}</Text>
                    {post.isSponsored && <View style={styles.sponsoredBadge}><Text style={styles.sponsoredText}>Tài trợ</Text></View>}
                  </View>
                  <Text style={styles.postTime}>{post.createdAt} · {post.topic}</Text>
                </View>
                <Text style={styles.moreButton}>•••</Text>
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              {post.media && <MediaGallery media={post.media} onImagePress={openImageViewer} />}
              <View style={styles.postStats}>
                <Text style={styles.statsText}>{post.likes} lượt thích</Text>
                <Text style={styles.statsText}>{post.comments.length} bình luận</Text>
              </View>
              <View style={styles.actions}>
                <Pressable style={styles.action} onPress={() => toggleLike(post.id)}>
                  <IconSymbol name={isLiked ? 'heart' : 'heartOutline'} size={19} color={isLiked ? '#E11D48' : BrandColors.gray600} />
                  <Text style={[styles.actionText, isLiked && styles.likedText]}>Thích</Text>
                </Pressable>
                <Pressable style={styles.action} onPress={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}>
                  <IconSymbol name="chat" size={18} color={BrandColors.gray600} />
                  <Text style={styles.actionText}>Bình luận</Text>
                </Pressable>
              </View>
              {post.comments.map((comment) => <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>{comment.author}</Text>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>)}
              {commentingPostId === post.id && <View style={styles.commentComposer}>
                <TextInput value={commentDrafts[post.id] || ''} onChangeText={(value) => setCommentDrafts((current) => ({ ...current, [post.id]: value }))} placeholder="Viết bình luận..." placeholderTextColor={BrandColors.gray400} style={styles.commentInput} />
                <Pressable onPress={() => submitComment(post.id)} hitSlop={8}><IconSymbol name="send" size={19} color={BrandColors.primary} /></Pressable>
              </View>}
            </View>;
          })}
        </ScrollView>
        <Modal visible={fullscreenImages.length > 0} transparent animationType="fade" onRequestClose={closeImageViewer}>
          <View style={styles.fullscreenBackdrop}>
            <SafeAreaView style={styles.fullscreenSafeArea}>
              <View style={styles.fullscreenHeader}>
                <Text style={styles.fullscreenCount}>{fullscreenIndex + 1} / {fullscreenImages.length}</Text>
                <Pressable style={styles.closeViewerButton} onPress={closeImageViewer} hitSlop={10}>
                  <Text style={styles.closeViewerText}>×</Text>
                </Pressable>
              </View>
              {fullscreenImages[fullscreenIndex] && <Image source={remoteImageSource(fullscreenImages[fullscreenIndex].uri)} style={styles.fullscreenImage} resizeMode="contain" />}
              {fullscreenImages.length > 1 && <View style={styles.viewerNavigation}>
                <Pressable style={[styles.viewerArrow, fullscreenIndex === 0 && styles.viewerArrowDisabled]} disabled={fullscreenIndex === 0} onPress={() => setFullscreenIndex((current) => current - 1)}>
                  <Text style={styles.viewerArrowText}>‹</Text>
                </Pressable>
                <Pressable style={[styles.viewerArrow, fullscreenIndex === fullscreenImages.length - 1 && styles.viewerArrowDisabled]} disabled={fullscreenIndex === fullscreenImages.length - 1} onPress={() => setFullscreenIndex((current) => current + 1)}>
                  <Text style={styles.viewerArrowText}>›</Text>
                </Pressable>
              </View>}
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' }, postMeta: { flex: 1 }, authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, author: { color: BrandColors.gray900, fontSize: 14, fontWeight: '800' },
  moreButton: { color: BrandColors.gray500, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  sponsoredBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }, sponsoredText: { color: '#B45309', fontSize: 10, fontWeight: '800' }, postTime: { color: BrandColors.gray500, fontSize: 11, marginTop: 2 }, postContent: { color: BrandColors.gray800, fontSize: 14, lineHeight: 21, marginTop: 13 },
  mediaGallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 12, borderRadius: 12, overflow: 'hidden' }, singleMediaGallery: { display: 'flex' }, galleryImage: { width: '49.5%', height: 132, backgroundColor: '#E2E8F0' }, galleryImageContent: { width: '100%', height: '100%' }, singleGalleryImage: { width: '100%', height: 220 }, postVideo: { width: '49.5%', height: 132, marginTop: 0, borderRadius: 0, backgroundColor: '#0F172A' },
  fullscreenBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' }, fullscreenSafeArea: { flex: 1 }, fullscreenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 }, fullscreenCount: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' }, closeViewerButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }, closeViewerText: { color: '#FFFFFF', fontSize: 29, lineHeight: 32, fontWeight: '300' }, fullscreenImage: { flex: 1, width: '100%' }, viewerNavigation: { position: 'absolute', bottom: 28, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 }, viewerArrow: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }, viewerArrowDisabled: { opacity: 0.3 }, viewerArrowText: { color: '#FFFFFF', fontSize: 36, lineHeight: 40, fontWeight: '300' },
  postStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 13, paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }, statsText: { color: BrandColors.gray500, fontSize: 11 }, actions: { flexDirection: 'row', paddingVertical: 7, gap: 24 }, action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 }, actionText: { color: BrandColors.gray600, fontSize: 12, fontWeight: '700' }, likedText: { color: '#E11D48' },
  comment: { backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 5 }, commentAuthor: { color: BrandColors.gray800, fontSize: 12, fontWeight: '800' }, commentContent: { color: BrandColors.gray600, fontSize: 12, lineHeight: 17, marginTop: 2 },
  commentComposer: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9, paddingHorizontal: 10, backgroundColor: '#F8FAFC', borderRadius: BorderRadius.full, borderWidth: 1, borderColor: '#E2E8F0' }, commentInput: { flex: 1, color: BrandColors.gray800, fontSize: 13, paddingVertical: 9 },
});
