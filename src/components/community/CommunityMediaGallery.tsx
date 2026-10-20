import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { remoteImageSource } from '@/utils/image-source';

export type DisplayMedia = { uri: string; type: 'image' | 'video'; width?: number; height?: number };

function VideoPoster({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  const isCloudinary = uri.startsWith('https://res.cloudinary.com/') && uri.includes('/video/upload/');
  const poster = isCloudinary ? uri.replace('/video/upload/', '/video/upload/so_0,w_800,q_auto/').replace(/\.[a-zA-Z0-9]+$/, '.jpg') : null;
  return <View style={s.videoPoster}>{poster && !failed && <Image source={remoteImageSource(poster)} style={s.fill} onError={() => setFailed(true)} />}
    <View style={s.play}><Text style={s.playText}>▶</Text></View><Text style={s.videoLabel}>Video</Text>
  </View>;
}
function Tile({ media, index, hidden, onOpen }: { media: DisplayMedia[]; index: number; hidden?: number; onOpen: (items: DisplayMedia[], index: number) => void }) {
  const item = media[index];
  return <Pressable accessibilityRole="button" accessibilityLabel={hidden ? `Xem tất cả ${media.length} ảnh và video, còn ${hidden} tệp` : `Xem ${item.type === 'video' ? 'video' : 'ảnh'} ${index + 1} trên ${media.length}`} onPress={() => onOpen(media, index)} style={s.tile}>
    {item.type === 'image' ? <Image source={remoteImageSource(item.uri)} style={s.fill} resizeMode="cover" /> : <VideoPoster uri={item.uri} />}
    {!!hidden && <View pointerEvents="none" style={s.more}><Text style={s.moreCount}>+{hidden}</Text><Text style={s.moreText}>Xem tất cả</Text></View>}
  </Pressable>;
}
export function CommunityMediaGallery({ media, onOpen }: { media: DisplayMedia[]; onOpen: (items: DisplayMedia[], index: number) => void }) {
  if (!media.length) return null;
  const first = media[0];
  const ratio = first.width && first.height ? Math.max(0.75, Math.min(1.9, first.width / first.height)) : first.type === 'video' ? 16 / 9 : 1.25;
  if (media.length === 1) return <View style={[s.gallery, { aspectRatio: ratio }]}><Tile media={media} index={0} onOpen={onOpen} /></View>;
  if (media.length === 2) return <View style={[s.gallery, s.row, { aspectRatio: 1.5 }]}><Tile media={media} index={0} onOpen={onOpen} /><Tile media={media} index={1} onOpen={onOpen} /></View>;
  return <View style={[s.gallery, s.row, { aspectRatio: 1.2 }]}>
    <View style={s.main}><Tile media={media} index={0} onOpen={onOpen} /></View>
    <View style={s.side}><Tile media={media} index={1} onOpen={onOpen} /><Tile media={media} index={2} hidden={media.length - 3} onOpen={onOpen} /></View>
  </View>;
}
function DetailVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => { p.loop = false; });
  return <VideoView player={player} style={s.detail} nativeControls contentFit="contain" />;
}
export function CommunityMediaViewer({ media, index, onIndex, onClose }: { media: DisplayMedia[]; index: number; onIndex: (index: number) => void; onClose: () => void }) {
  const item = media[index];
  return <SafeAreaView style={s.viewer} edges={['top', 'bottom']}>
    <View style={s.viewerHeader}><Text style={s.counter}>{item?.type === 'video' ? 'Video' : 'Ảnh'} {index + 1} / {media.length}</Text><Pressable accessibilityLabel="Đóng xem ảnh và video" style={s.viewerButton} onPress={onClose}><Text style={s.white}>Đóng ✕</Text></Pressable></View>
    {item?.type === 'video' ? <DetailVideo key={item.uri} uri={item.uri} /> : item && <Image source={remoteImageSource(item.uri)} style={s.detail} resizeMode="contain" />}
    <View style={s.viewerFooter}><Pressable disabled={index === 0} accessibilityLabel="Tệp trước" onPress={() => onIndex(index - 1)} style={[s.viewerButton, index === 0 && s.disabled]}><Text style={s.white}>‹ Trước</Text></Pressable><Pressable disabled={index >= media.length - 1} accessibilityLabel="Tệp tiếp theo" onPress={() => onIndex(index + 1)} style={[s.viewerButton, index >= media.length - 1 && s.disabled]}><Text style={s.white}>Tiếp ›</Text></Pressable></View>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  gallery: { width: '100%', marginTop: 12, borderRadius: 14, overflow: 'hidden', backgroundColor: '#E2E8F0', gap: 3 }, row: { flexDirection: 'row' },
  tile: { flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', backgroundColor: '#E2E8F0' }, main: { flex: 2, minWidth: 0 }, side: { flex: 1, minWidth: 0, gap: 3 }, fill: { width: '100%', height: '100%' },
  videoPoster: { flex: 1, backgroundColor: '#172D29', alignItems: 'center', justifyContent: 'center' }, play: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }, playText: { color: '#fff', fontSize: 21 }, videoLabel: { position: 'absolute', bottom: 8, left: 8, color: '#fff', fontSize: 11, fontWeight: '700', backgroundColor: '#172D29', padding: 4, borderRadius: 4 },
  more: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.58)', alignItems: 'center', justifyContent: 'center', padding: 6 }, moreCount: { color: '#fff', fontSize: 29, fontWeight: '800' }, moreText: { color: '#fff', fontSize: 11, textAlign: 'center', marginTop: 3 },
  viewer: { flex: 1, backgroundColor: '#090F0E' }, viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: 14 }, counter: { color: '#fff', fontSize: 14, flex: 1 }, viewerButton: { minHeight: 44, justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: '#253A34' }, white: { color: '#fff', fontSize: 14, fontWeight: '700' }, detail: { flex: 1, width: '100%' }, viewerFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, padding: 16 }, disabled: { opacity: 0.3 },
});
