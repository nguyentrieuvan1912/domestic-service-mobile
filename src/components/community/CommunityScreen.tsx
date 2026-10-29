import { remoteImageSource } from '@/utils/image-source';
import { useFocusEffect } from 'expo-router';
import { identityRequest } from '@/api/identity';
import { operationRequest, operationSession } from '@/api/operations';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from '@/components/common/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import { StaffBottomNav } from '@/components/staff/StaffBottomNav';
import { CommunityThread } from './CommunityThread';
import { CommunityMediaGallery, CommunityMediaViewer, type DisplayMedia } from './CommunityMediaGallery';
import {
  CommunityPost,
  CommunityMedia,
  REACTIONS,
  Reaction,
  UploadTicket,
  requestKey,
  uploadAttachment,
  validateAttachment,
} from '@/api/community';

type LocalMedia = {
  asset: ImagePicker.ImagePickerAsset;
  ticket?: UploadTicket;
  uploaded?: CommunityMedia;
  progress: number;
};

function formatPostTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CommunityScreen({ staffNavigation = false }: { staffNavigation?: boolean }) {
  const { currentUser, accessToken } = useAuth();
  return (
    <CommunityContent
      key={String(currentUser?.id) + ':' + accessToken}
      staffNavigation={staffNavigation}
    />
  );
}

function CommunityContent({ staffNavigation }: { staffNavigation: boolean }) {
  const { currentUser, accessToken } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [media, setMedia] = useState<LocalMedia[]>([]);
  const [mediaEnabled, setMediaEnabled] = useState(false);
  const [thread, setThread] = useState<CommunityPost | null>(null);
  const [reactionPost, setReactionPost] = useState<number | null>(null);
  const [expandedPost, setExpandedPost] = useState<Record<number, boolean>>({});
  const [fullscreenImages, setFullscreenImages] = useState<DisplayMedia[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  const alive = useRef(true);
  const controller = useRef(new AbortController());
  const locked = useRef(false);
  const reading = useRef(false);
  const mutations = useRef(new Set<number>());
  const publishKey = useRef({ body: '', key: requestKey() });
  const revision = useRef(0);
  const owner = useRef(operationSession()?.token);
  const current = () => alive.current && owner.current === operationSession()?.token;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current.abort();
    };
  }, []);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (reading.current || mutations.current.size) return;
      reading.current = true;
      const version = revision.current;
      try {
        const [rows, capability] = await Promise.all([
          identityRequest<CommunityPost[]>(
            '/community/posts',
            undefined,
            accessToken || undefined,
            'GET',
            signal
          ),
          identityRequest<{ enabled: boolean }>(
            '/community/media/capabilities',
            undefined,
            undefined,
            'GET',
            signal
          ),
        ]);
        if (current() && !signal?.aborted && version === revision.current) {
          setPosts(rows);
          setMediaEnabled(capability.enabled);
          setLoadError('');
        }
      } catch (cause) {
        if (current() && !signal?.aborted) {
          setLoadError(cause instanceof Error ? cause.message : 'Chưa tải được cộng đồng.');
        }
      } finally {
        reading.current = false;
        if (current()) setLoading(false);
      }
    },
    [accessToken]
  );

  useFocusEffect(
    useCallback(() => {
      const abort = new AbortController();
      void refresh(abort.signal);
      const timer = setInterval(() => {
        if (AppState.currentState === 'active' && !locked.current) void refresh(abort.signal);
      }, 15000);
      const listener = AppState.addEventListener('change', state => {
        if (state === 'active') void refresh(abort.signal);
      });
      return () => {
        abort.abort();
        clearInterval(timer);
        listener.remove();
      };
    }, [refresh])
  );

  const pickMedia = async () => {
    if (locked.current) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 4,
        quality: 0.85,
      });
      if (!current() || result.canceled) return;
      const assets = result.assets.slice(0, 4);
      assets.forEach(validateAttachment);
      setMedia(assets.map(asset => ({ asset, progress: 0 })));
    } catch (cause) {
      if (current()) setError(cause instanceof Error ? cause.message : 'Chưa chọn được tệp.');
    }
  };

  const publish = async () => {
    if (locked.current || (!draft.trim() && !media.length)) return;
    if (!currentUser) {
      setError('Vui lòng đăng nhập để đăng bài.');
      return;
    }
    locked.current = true;
    revision.current++;
    setSaving(true);
    setError('');
    try {
      const selected = [...media];
      for (let index = 0; index < selected.length; index++) {
        if (selected[index].uploaded) continue;
        if (!selected[index].ticket) {
          selected[index] = {
            ...selected[index],
            ticket: await operationRequest<UploadTicket>(
              'identity',
              '/community/media/signature',
              'POST',
              { type: selected[index].asset.type }
            ),
          };
          if (!current()) return;
          setMedia([...selected]);
        }
        const uploaded = await uploadAttachment(
          selected[index].asset,
          selected[index].ticket!,
          progress => {
            if (current()) {
              setMedia(old => old.map((item, i) => (i === index ? { ...item, progress } : item)));
            }
          },
          controller.current.signal
        );
        if (!current()) return;
        selected[index] = { ...selected[index], uploaded, progress: 100 };
        setMedia([...selected]);
      }
      const body = { content: draft.trim(), mediaIds: selected.map(item => item.uploaded!.id) };
      const serialized = JSON.stringify(body);
      if (publishKey.current.body !== serialized) {
        publishKey.current = { body: serialized, key: requestKey() };
      }
      const result = await operationRequest<{ id: number; status: string }>(
        'identity',
        '/community/posts',
        'POST',
        { ...body, requestKey: publishKey.current.key }
      );
      if (!current()) return;
      revision.current++;
      setComposerOpen(false);
      setDraft('');
      setMedia([]);
      publishKey.current = { body: '', key: requestKey() };
      await refresh();
      Alert.alert(
        'Đã lưu bài viết',
        result.status === 'PENDING'
          ? 'Bài đã được lưu, chờ quản trị viên duyệt.'
          : 'Bài đã được công bố.'
      );
    } catch (cause) {
      if (current()) {
        setError(cause instanceof Error ? cause.message : 'Chưa đăng được. Bản nháp được giữ lại.');
      }
    } finally {
      locked.current = false;
      if (current()) setSaving(false);
    }
  };

  const react = async (post: CommunityPost, reaction: Reaction) => {
    if (mutations.current.has(post.id)) return;
    mutations.current.add(post.id);
    revision.current++;
    try {
      const result = await operationRequest<CommunityPost>(
        'identity',
        '/community/posts/' + post.id + '/reaction',
        'PATCH',
        { reaction: post.myReaction === reaction ? null : reaction }
      );
      if (current()) {
        revision.current++;
        setPosts(old => old.map(item => (item.id === result.id ? result : item)));
        setReactionPost(null);
      }
    } catch (cause) {
      if (current()) setError(cause instanceof Error ? cause.message : 'Chưa lưu được cảm xúc.');
    } finally {
      mutations.current.delete(post.id);
    }
  };

  const displayName = currentUser?.fullName || 'Bạn';
  const hasDraft = !!draft.trim() || media.length > 0;

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={posts}
          keyExtractor={post => String(post.id)}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          windowSize={5}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              {/* Top Community Banner Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerBadgeIcon}>
                    <IconSymbol name="users" size={20} color="#047857" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.title}>Cộng đồng</Text>
                    <Text style={styles.subtitle}>
                      Chia sẻ, hỏi đáp và kết nối cùng CleanMaster
                    </Text>
                  </View>
                </View>
                <View style={styles.memberCount}>
                  <View style={styles.memberDot} />
                  <Text style={styles.memberText}>{posts.length} bài viết</Text>
                </View>
              </View>

              {!!(error || loadError) && (
                <Pressable onPress={() => void refresh()} style={styles.backendHint}>
                  <IconSymbol name="warning" size={16} color="#B91C1C" />
                  <Text style={[styles.backendHintText, { color: '#B91C1C' }]}>
                    {error || loadError} · Chạm để tải lại
                  </Text>
                </Pressable>
              )}

              {/* Modern Composer Shortcut Card */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mở màn hình đăng bài"
                onPress={() => {
                  if (!currentUser) {
                    setError('Vui lòng đăng nhập để đăng bài.');
                    return;
                  }
                  setComposerOpen(true);
                }}
                style={({ pressed }) => [styles.composerShortcut, pressed && styles.pressed]}
              >
                {currentUser?.avatar ? (
                  <Image source={remoteImageSource(currentUser.avatar)} style={styles.shortcutAvatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.shortcutPromptPill}>
                  <Text numberOfLines={1} style={[styles.shortcutText, hasDraft && styles.shortcutDraftText]}>
                    {hasDraft ? 'Tiếp tục bản nháp của bạn…' : 'Bạn muốn chia sẻ điều gì?'}
                  </Text>
                </View>

                <View style={styles.shortcutActionIcon}>
                  <IconSymbol name="plus" size={18} color="#00734F" />
                </View>
              </Pressable>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <IconSymbol name="users" size={30} color={BrandColors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {loading ? 'Đang tải cộng đồng…' : 'Chưa có bài viết để hiển thị'}
              </Text>
              {!loading && (
                <Text style={styles.emptySubtitle}>
                  Hãy mở đầu cuộc trò chuyện bằng cách chia sẻ mẹo chăm sóc nhà cửa hoặc câu hỏi của bạn.
                </Text>
              )}
            </View>
          }
          renderItem={({ item: post }) => {
            const myReactionObj = post.myReaction
              ? REACTIONS.find(r => r.id === post.myReaction)
              : null;
            const activeReactions = REACTIONS.filter(r => post.reactions[r.id]);
            const isLongContent = post.content.length > 260 || post.content.split('\n').length > 5;
            const isExpanded = !!expandedPost[post.id];

            return (
              <View style={[styles.post, post.status === 'PENDING' && styles.pendingPost]}>
                {post.status === 'PENDING' && (
                  <View style={styles.pendingNotice}>
                    <View style={styles.pendingHeaderRow}>
                      <IconSymbol name="clock" size={15} color="#B45309" />
                      <Text style={styles.pendingTitle}>ĐANG CHỜ DUYỆT</Text>
                    </View>
                    <Text style={styles.pendingDescription}>
                      Bài viết đang chờ quản trị viên duyệt, chưa hiển thị công khai.
                    </Text>
                  </View>
                )}

                {post.status === 'HIDDEN' && (
                  <View style={styles.hiddenNotice}>
                    <IconSymbol name="eyeOff" size={15} color="#475569" />
                    <Text style={styles.hiddenTitle}>BÀI VIẾT ĐÃ ẨN</Text>
                  </View>
                )}

                {/* Post Author Row */}
                <View style={styles.postHeader}>
                  {post.avatar ? (
                    <Image source={remoteImageSource(post.avatar)} style={styles.postAvatar} />
                  ) : (
                    <View style={styles.postAvatarFallback}>
                      <Text style={styles.avatarInitial}>
                        {post.author.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.postMeta}>
                    <View style={styles.authorRow}>
                      <Text numberOfLines={1} style={styles.author}>
                        {post.author}
                      </Text>
                      <View style={styles.memberTag}>
                        <Text style={styles.memberTagText}>Thành viên</Text>
                      </View>
                    </View>
                    <View style={styles.postTimeRow}>
                      <IconSymbol name="globe" size={11} color="#94A3B8" />
                      <Text style={styles.postTime}>
                        {formatPostTime(post.createdAt)} · Cộng đồng
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Post Body */}
                {!!post.content && (
                  <View style={styles.postBodyWrap}>
                    <Text
                      numberOfLines={!isExpanded && isLongContent ? 5 : undefined}
                      style={styles.postContent}
                    >
                      {post.content}
                    </Text>
                    {isLongContent && (
                      <Pressable
                        onPress={() =>
                          setExpandedPost(old => ({ ...old, [post.id]: !old[post.id] }))
                        }
                        style={styles.readMoreBtn}
                      >
                        <Text style={styles.readMoreText}>
                          {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Post Media Gallery */}
                {!!post.media.length && (
                  <CommunityMediaGallery
                    media={post.media}
                    onOpen={(items, index) => {
                      setFullscreenImages(items);
                      setFullscreenIndex(index);
                    }}
                  />
                )}

                {/* Post Stats Summary */}
                <View style={styles.postStats}>
                  <View style={styles.statsReactionsRow}>
                    {activeReactions.length > 0 ? (
                      activeReactions.map(r => (
                        <View key={r.id} style={styles.reactionStatChip}>
                          <Text style={styles.reactionStatEmoji}>{r.emoji}</Text>
                          <Text style={styles.reactionStatCount}>{post.reactions[r.id]}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.statsText}>Chưa có cảm xúc</Text>
                    )}
                  </View>

                  <Pressable
                    onPress={() => setThread(post)}
                    style={({ pressed }) => [styles.statsCommentBtn, pressed && styles.pressed]}
                  >
                    <IconSymbol name="chat" size={13} color="#64748B" />
                    <Text style={styles.statsText}>{post.commentCount} bình luận</Text>
                  </Pressable>
                </View>

                {/* Post Action Buttons */}
                <View style={styles.actions}>
                  <Pressable
                    disabled={!currentUser}
                    style={({ pressed }) => [
                      styles.action,
                      !!myReactionObj && styles.actionActive,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      setReactionPost(reactionPost === post.id ? null : post.id)
                    }
                  >
                    {myReactionObj ? (
                      <Text style={styles.actionEmoji}>{myReactionObj.emoji}</Text>
                    ) : (
                      <IconSymbol name="heart" size={16} color="#475569" />
                    )}
                    <Text style={[styles.actionText, !!myReactionObj && styles.likedText]}>
                      {myReactionObj ? myReactionObj.label : 'Cảm xúc'}
                    </Text>
                  </Pressable>

                  <View style={styles.actionDivider} />

                  <Pressable
                    style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                    onPress={() => setThread(post)}
                  >
                    <IconSymbol name="chat" size={16} color="#475569" />
                    <Text style={styles.actionText}>
                      Thảo luận{post.commentCount > 0 ? ` (${post.commentCount})` : ''}
                    </Text>
                  </Pressable>
                </View>

                {/* Reaction Picker Popover Bar */}
                {reactionPost === post.id && (
                  <View style={styles.reactionPickerBar}>
                    {REACTIONS.map(reaction => {
                      const isSelected = post.myReaction === reaction.id;
                      return (
                        <Pressable
                          key={reaction.id}
                          accessibilityLabel={reaction.label}
                          onPress={() => void react(post, reaction.id)}
                          style={({ pressed }) => [
                            styles.reactionOption,
                            isSelected && styles.reactionOptionSelected,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={styles.reactionOptionEmoji}>{reaction.emoji}</Text>
                          <Text
                            style={[
                              styles.reactionOptionLabel,
                              isSelected && styles.reactionOptionLabelSelected,
                            ]}
                          >
                            {reaction.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          }}
        />

        {/* Thread Discussion Modal */}
        <Modal
          visible={!!thread}
          animationType="slide"
          onRequestClose={() => setThread(null)}
        >
          {thread && (
            <CommunityThread
              key={thread.id}
              post={thread}
              onClose={() => setThread(null)}
              onChanged={() => void refresh()}
            />
          )}
        </Modal>

        {/* Fullscreen Media Viewer or Post Composer Modal */}
        <Modal
          visible={composerOpen || fullscreenImages.length > 0}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            if (fullscreenImages.length) setFullscreenImages([]);
            else if (!saving) setComposerOpen(false);
          }}
        >
          {fullscreenImages.length > 0 ? (
            <CommunityMediaViewer
              media={fullscreenImages}
              index={fullscreenIndex}
              onIndex={setFullscreenIndex}
              onClose={() => setFullscreenImages([])}
            />
          ) : (
            <SafeAreaView style={styles.composeScreen} edges={['top', 'bottom']}>
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              >
                {/* Composer Header */}
                <View style={styles.composeHeader}>
                  <Pressable
                    disabled={saving}
                    onPress={() => {
                      Keyboard.dismiss();
                      setComposerOpen(false);
                    }}
                    style={({ pressed }) => [styles.composeBack, pressed && styles.pressed]}
                  >
                    <IconSymbol name="back" size={18} color="#00734F" />
                    <Text style={styles.mediaButtonText}>Quay lại</Text>
                  </Pressable>

                  <Text style={styles.composeTitle}>Tạo bài viết</Text>

                  <Pressable
                    accessibilityRole="button"
                    disabled={saving || (!draft.trim() && !media.length)}
                    onPress={() => void publish()}
                    style={({ pressed }) => [
                      styles.publishButton,
                      (saving || (!draft.trim() && !media.length)) && { opacity: 0.45 },
                      pressed && styles.pressed,
                    ]}
                  >
                    <IconSymbol name="send" size={14} color="#FFFFFF" />
                    <Text style={styles.publishText}>{saving ? 'Đang đăng…' : 'Đăng'}</Text>
                  </Pressable>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.composeContent}
                >
                  {/* Author Info + Moderation Notice */}
                  <View style={styles.composerTop}>
                    {currentUser?.avatar ? (
                      <Image
                        source={remoteImageSource(currentUser.avatar)}
                        style={styles.shortcutAvatar}
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitial}>
                          {displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.author}>{displayName}</Text>
                      <View style={styles.moderationTag}>
                        <IconSymbol name="shield" size={12} color="#047857" />
                        <Text style={styles.moderationTagText}>
                          Bài viết sẽ được quản trị viên duyệt
                        </Text>
                      </View>
                    </View>
                  </View>

                  {!!error && (
                    <View style={styles.composeErrorBox}>
                      <IconSymbol name="warning" size={16} color="#B91C1C" />
                      <Text accessibilityRole="alert" style={styles.composeError}>
                        {error}
                      </Text>
                    </View>
                  )}

                  {/* Content Text Input Box */}
                  <View style={styles.composeInputCard}>
                    <TextInput
                      accessibilityLabel="Nội dung bài đăng"
                      editable={!saving}
                      value={draft}
                      onChangeText={setDraft}
                      placeholder="Chia sẻ mẹo chăm sóc nhà cửa, kinh nghiệm làm việc hoặc đặt câu hỏi cho cộng đồng…"
                      placeholderTextColor="#94A3B8"
                      maxLength={5000}
                      multiline
                      textAlignVertical="top"
                      style={styles.composeTextInput}
                    />
                  </View>

                  {/* Selected Media Preview + File Progress List */}
                  {!!media.length && (
                    <View style={styles.mediaPreview}>
                      <CommunityMediaGallery
                        media={media.map(item => ({
                          uri: item.asset.uri,
                          type: item.asset.type === 'video' ? 'video' : 'image',
                          width: item.asset.width,
                          height: item.asset.height,
                        }))}
                        onOpen={(items, index) => {
                          Keyboard.dismiss();
                          setFullscreenImages(items);
                          setFullscreenIndex(index);
                        }}
                      />
                      <View style={styles.selectedFilesList}>
                        {media.map((item, index) => (
                          <View key={item.asset.uri + index} style={styles.selectedFile}>
                            <IconSymbol
                              name={item.asset.type === 'video' ? 'video' : 'image'}
                              size={16}
                              color="#047857"
                            />
                            <Text numberOfLines={2} style={styles.selectedFileText}>
                              {index + 1}. {item.asset.type === 'video' ? 'Video' : 'Ảnh'} ·{' '}
                              {saving
                                ? item.uploaded
                                  ? 'Đã xác minh'
                                  : `Đang tải ${item.progress}%`
                                : item.uploaded
                                  ? 'Đã tải và xác minh'
                                  : 'Đã chọn'}
                            </Text>
                            <Pressable
                              disabled={saving}
                              accessibilityLabel={`Bỏ tệp ${index + 1}`}
                              onPress={() =>
                                setMedia(old => old.filter((_, i) => i !== index))
                              }
                              style={styles.removeFileBtn}
                            >
                              <IconSymbol name="close" size={13} color="#B91C1C" />
                              <Text style={styles.removeFileText}>Bỏ</Text>
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Add Media Button */}
                  <Pressable
                    disabled={saving || !mediaEnabled}
                    onPress={() => void pickMedia()}
                    style={({ pressed }) => [
                      styles.composeMediaButton,
                      !mediaEnabled && { opacity: 0.45 },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.composeMediaIconWrap}>
                      <IconSymbol name="image" size={18} color={BrandColors.primaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mediaButtonText}>
                        {media.length ? 'Chọn lại ảnh / video' : 'Thêm ảnh / video đính kèm'}
                      </Text>
                      <Text style={styles.composeMediaSub}>
                        {mediaEnabled
                          ? 'Tối đa 4 tệp · Ảnh 10 MB · Video 50 MB / 2 phút'
                          : 'Chưa kết nối Cloudinary. Bạn vẫn có thể đăng bài bằng văn bản.'}
                      </Text>
                    </View>
                    <IconSymbol name="plus" size={18} color={BrandColors.primaryDark} />
                  </Pressable>
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          )}
        </Modal>
      </SafeAreaView>
      {staffNavigation && <StaffBottomNav activeTab="community" />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 14,
  },
  headerBlock: {
    gap: 12,
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  headerBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBEAD9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#475569',
    fontSize: 12.5,
    marginTop: 2,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBEAD9',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  memberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BrandColors.primary,
  },
  memberText: {
    color: '#047857',
    fontSize: 11.5,
    fontWeight: '700',
  },
  backendHint: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  backendHintText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  composerShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE8E2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  shortcutAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  shortcutPromptPill: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#F4F8F6',
    borderWidth: 1,
    borderColor: '#E2ECE7',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  shortcutText: {
    color: '#64748B',
    fontSize: 13.5,
  },
  shortcutDraftText: {
    color: '#047857',
    fontWeight: '600',
  },
  shortcutActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#C6F0DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE8E2',
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
  post: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#DCE8E2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pendingPost: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: '#FFFDF9',
  },
  pendingNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 11,
    marginBottom: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingTitle: {
    color: '#92400E',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pendingDescription: {
    color: '#92400E',
    fontSize: 12.5,
    lineHeight: 18,
  },
  hiddenNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  hiddenTitle: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '800',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#E2ECE7',
  },
  postAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  author: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '800',
    flexShrink: 1,
  },
  memberTag: {
    backgroundColor: '#F0F9F4',
    borderWidth: 1,
    borderColor: '#D5EBE0',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.full,
  },
  memberTagText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '700',
  },
  postTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postTime: {
    color: '#64748B',
    fontSize: 11.5,
  },
  postBodyWrap: {
    marginTop: 12,
    gap: 4,
  },
  postContent: {
    color: '#1E293B',
    fontSize: 14.5,
    lineHeight: 22,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  readMoreText: {
    color: '#00875F',
    fontSize: 13,
    fontWeight: '700',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 13,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF5F2',
  },
  statsReactionsRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
  },
  reactionStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F4F8F6',
    borderWidth: 1,
    borderColor: '#E2ECE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
  },
  reactionStatEmoji: {
    fontSize: 12,
  },
  reactionStatCount: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  statsCommentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  statsText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    gap: 8,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    minHeight: 40,
    borderRadius: 12,
  },
  actionActive: {
    backgroundColor: '#ECFDF5',
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2ECE7',
  },
  actionEmoji: {
    fontSize: 16,
  },
  actionText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  likedText: {
    color: '#00734F',
  },
  reactionPickerBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 8,
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#F8FBF9',
    borderWidth: 1,
    borderColor: '#CFE5DA',
  },
  reactionOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 46,
  },
  reactionOptionSelected: {
    backgroundColor: '#DCFCE7',
  },
  reactionOptionEmoji: {
    fontSize: 22,
  },
  reactionOptionLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  reactionOptionLabelSelected: {
    color: '#00734F',
    fontWeight: '700',
  },
  composeScreen: {
    flex: 1,
    backgroundColor: '#F6FAF8',
  },
  composeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2ECE7',
  },
  composeBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F0F9F4',
  },
  composeTitle: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    color: '#111827',
    fontSize: 16.5,
    fontWeight: '800',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00875F',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
  },
  publishText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  composeContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
    flexGrow: 1,
  },
  composerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE8E2',
  },
  moderationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  moderationTagText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '600',
  },
  composeErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  composeError: {
    flex: 1,
    color: '#B91C1C',
    lineHeight: 19,
    fontSize: 13,
    fontWeight: '600',
  },
  composeInputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE8E2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  composeTextInput: {
    minHeight: 170,
    fontSize: 15.5,
    lineHeight: 23,
    color: '#1E293B',
  },
  mediaPreview: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCE8E2',
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 10,
  },
  selectedFilesList: {
    gap: 6,
  },
  selectedFile: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F4F8F6',
  },
  selectedFileText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '600',
  },
  removeFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FEF2F2',
  },
  removeFileText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  composeMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B7E4D1',
    padding: 14,
    borderRadius: 16,
  },
  composeMediaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaButtonText: {
    color: '#00734F',
    fontSize: 13.5,
    fontWeight: '700',
  },
  composeMediaSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.82,
  },
});
