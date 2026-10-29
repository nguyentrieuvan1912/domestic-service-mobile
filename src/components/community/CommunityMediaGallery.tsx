import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { remoteImageSource } from '@/utils/image-source';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BrandColors, BorderRadius } from '@/constants/theme';

export type DisplayMedia = { uri: string; type: 'image' | 'video'; width?: number; height?: number };

function VideoPoster({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  const isCloudinary = uri.startsWith('https://res.cloudinary.com/') && uri.includes('/video/upload/');
  const poster = isCloudinary
    ? uri.replace('/video/upload/', '/video/upload/so_0,w_800,q_auto/').replace(/\.[a-zA-Z0-9]+$/, '.jpg')
    : null;
  return (
    <View style={s.videoPoster}>
      {poster && !failed && (
        <Image source={remoteImageSource(poster)} style={s.fill} resizeMode="cover" onError={() => setFailed(true)} />
      )}
      <View style={s.videoOverlay} />
      <View style={s.play}>
        <IconSymbol name="play" size={18} color="#FFFFFF" />
      </View>
      <View style={s.videoBadge}>
        <IconSymbol name="video" size={12} color="#FFFFFF" />
        <Text style={s.videoLabel}>Video</Text>
      </View>
    </View>
  );
}

function Tile({
  media,
  index,
  hidden,
  onOpen,
}: {
  media: DisplayMedia[];
  index: number;
  hidden?: number;
  onOpen: (items: DisplayMedia[], index: number) => void;
}) {
  const item = media[index];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        hidden
          ? `Xem tất cả ${media.length} ảnh và video, còn ${hidden} tệp`
          : `Xem ${item.type === 'video' ? 'video' : 'ảnh'} ${index + 1} trên ${media.length}`
      }
      onPress={() => onOpen(media, index)}
      style={({ pressed }) => [s.tile, pressed && s.tilePressed]}
    >
      {item.type === 'image' ? (
        <Image source={remoteImageSource(item.uri)} style={s.fill} resizeMode="cover" />
      ) : (
        <VideoPoster uri={item.uri} />
      )}
      {!!hidden && (
        <View pointerEvents="none" style={s.more}>
          <Text style={s.moreCount}>+{hidden}</Text>
          <Text style={s.moreText}>Xem tất cả</Text>
        </View>
      )}
    </Pressable>
  );
}

export function CommunityMediaGallery({
  media,
  onOpen,
  compact = false,
}: {
  media: DisplayMedia[];
  onOpen: (items: DisplayMedia[], index: number) => void;
  compact?: boolean;
}) {
  if (!media.length) return null;
  const first = media[0];
  const ratio =
    first.width && first.height
      ? Math.max(0.8, Math.min(1.85, first.width / first.height))
      : first.type === 'video'
        ? 16 / 9
        : 1.3;

  if (media.length === 1) {
    return (
      <View style={[s.gallery, compact && s.galleryCompact, { aspectRatio: ratio }]}>
        <Tile media={media} index={0} onOpen={onOpen} />
      </View>
    );
  }
  if (media.length === 2) {
    return (
      <View style={[s.gallery, compact && s.galleryCompact, s.row, { aspectRatio: 1.55 }]}>
        <Tile media={media} index={0} onOpen={onOpen} />
        <Tile media={media} index={1} onOpen={onOpen} />
      </View>
    );
  }
  return (
    <View style={[s.gallery, compact && s.galleryCompact, s.row, { aspectRatio: 1.25 }]}>
      <View style={s.main}>
        <Tile media={media} index={0} onOpen={onOpen} />
      </View>
      <View style={s.side}>
        <Tile media={media} index={1} onOpen={onOpen} />
        <Tile media={media} index={2} hidden={media.length - 3} onOpen={onOpen} />
      </View>
    </View>
  );
}

function DetailVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => {
    p.loop = false;
  });
  return <VideoView player={player} style={s.detail} nativeControls contentFit="contain" />;
}

export function CommunityMediaViewer({
  media,
  index,
  onIndex,
  onClose,
}: {
  media: DisplayMedia[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const item = media[index];
  return (
    <SafeAreaView style={s.viewer} edges={['top', 'bottom']}>
      <View style={s.viewerHeader}>
        <View style={s.counterPill}>
          <IconSymbol name={item?.type === 'video' ? 'video' : 'image'} size={15} color="#A7F3D0" />
          <Text style={s.counter}>
            {item?.type === 'video' ? 'Video' : 'Ảnh'} {index + 1} / {media.length}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Đóng xem ảnh và video"
          style={({ pressed }) => [s.closeButton, pressed && s.buttonPressed]}
          onPress={onClose}
        >
          <IconSymbol name="close" size={18} color="#FFFFFF" />
          <Text style={s.closeButtonText}>Đóng</Text>
        </Pressable>
      </View>

      <View style={s.detailContainer}>
        {item?.type === 'video' ? (
          <DetailVideo key={item.uri} uri={item.uri} />
        ) : (
          item && <Image source={remoteImageSource(item.uri)} style={s.detail} resizeMode="contain" />
        )}
      </View>

      {media.length > 1 && (
        <View style={s.viewerFooter}>
          <Pressable
            disabled={index === 0}
            accessibilityLabel="Tệp trước"
            onPress={() => onIndex(index - 1)}
            style={({ pressed }) => [
              s.viewerNavButton,
              index === 0 && s.disabled,
              pressed && index > 0 && s.buttonPressed,
            ]}
          >
            <IconSymbol name="back" size={17} color="#FFFFFF" />
            <Text style={s.navButtonText}>Trước</Text>
          </Pressable>

          <View style={s.dotsRow}>
            {media.map((_, idx) => (
              <View key={idx} style={[s.dot, idx === index && s.dotActive]} />
            ))}
          </View>

          <Pressable
            disabled={index >= media.length - 1}
            accessibilityLabel="Tệp tiếp theo"
            onPress={() => onIndex(index + 1)}
            style={({ pressed }) => [
              s.viewerNavButton,
              index >= media.length - 1 && s.disabled,
              pressed && index < media.length - 1 && s.buttonPressed,
            ]}
          >
            <Text style={s.navButtonText}>Tiếp</Text>
            <IconSymbol name="chevronRight" size={17} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  gallery: {
    width: '100%',
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E8F0EC',
    borderWidth: 1,
    borderColor: '#DCE8E2',
    gap: 3,
  },
  galleryCompact: {
    marginTop: 8,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  tilePressed: {
    opacity: 0.9,
  },
  main: {
    flex: 1.85,
    minWidth: 0,
  },
  side: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  videoPoster: {
    flex: 1,
    backgroundColor: '#132A23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
  },
  play: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  videoLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  more: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  moreCount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  moreText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  viewer: {
    flex: 1,
    backgroundColor: '#0B1310',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  counter: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  detailContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  detail: {
    flex: 1,
    width: '100%',
  },
  viewerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewerNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    backgroundColor: '#1E352D',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.22)',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  dotActive: {
    width: 18,
    backgroundColor: BrandColors.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.3,
  },
});
