import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { operationRequest } from '@/api/operations';
import { identityRequest } from '@/api/identity';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BrandColors, BorderRadius } from '@/constants/theme';
import { CommunityMediaGallery, CommunityMediaViewer, type DisplayMedia } from './CommunityMediaGallery';
import { CommentReportDialog } from './CommentReportDialog';
import { remoteImageSource } from '@/utils/image-source';
import {
  applyCommentDeletions,
  uploadAttachment,
  validateAttachment,
  type UploadTicket,
  type CommunityMedia,
  type CommunityPost,
  type CommunityComment,
  type CommentPage,
  REACTIONS,
  mergeComments,
  requestKey,
} from '@/api/community';

function formatCommentTime(iso: string) {
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

export function CommunityThread({
  post,
  onClose,
  onChanged,
}: {
  post: CommunityPost;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { currentUser, accessToken } = useAuth();
  const [items, setItems] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState<CommunityComment | null>(null);
  const [saving, setSaving] = useState(false);
  const [more, setMore] = useState(false);
  const [picker, setPicker] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [expandedText, setExpandedText] = useState<Record<number, boolean>>({});
  const [media, setMedia] = useState<
    { asset: ImagePicker.ImagePickerAsset; ticket?: UploadTicket; uploaded?: CommunityMedia }[]
  >([]);
  const [progress, setProgress] = useState('');
  const [viewer, setViewer] = useState<DisplayMedia[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [report, setReport] = useState<CommunityComment | null>(null);
  const [reported, setReported] = useState<Record<number, boolean>>({});
  const [notice, setNotice] = useState('');
  const [mediaEnabled, setMediaEnabled] = useState(false);

  const uploadAbort = useRef(new AbortController());
  useEffect(() => {
    void operationRequest<{ enabled: boolean }>('identity', '/community/media/capabilities')
      .then(value => {
        if (alive.current) setMediaEnabled(value.enabled);
      })
      .catch(() => {});
    return () => uploadAbort.current.abort();
  }, []);

  const viewerOwner = useRef<number | null>(null);
  const openMedia = (files: DisplayMedia[], index: number) => {
    setViewer(files);
    setViewerIndex(index);
  };

  const pickMedia = async () => {
    if (locked.current) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: 4,
        quality: 0.85,
      });
      if (!alive.current || result.canceled) return;
      const assets = result.assets.slice(0, 4);
      assets.forEach(validateAttachment);
      setMedia(assets.map(asset => ({ asset })));
    } catch (cause) {
      if (alive.current) setError(cause instanceof Error ? cause.message : 'Chưa chọn được tệp.');
    }
  };

  const list = useRef<FlatList<CommunityComment>>(null);
  const newest = useRef(0);
  const oldest = useRef(0);
  const loaded = useRef(false);
  const nearEnd = useRef(true);
  const alive = useRef(true);
  const reading = useRef(false);
  const locked = useRef(false);
  const submission = useRef({ body: '', key: requestKey() });

  const sync = useCallback(
    async (signal?: AbortSignal) => {
      if (reading.current) return;
      reading.current = true;
      try {
        let next = newest.current;
        let rounds = 0;
        let hasMore = false;
        do {
          const page = await identityRequest<CommentPage>(
            '/community/posts/' + post.id + '/comments' + (loaded.current ? '?after=' + next : ''),
            undefined,
            accessToken || undefined,
            'GET',
            signal
          );
          if (!alive.current || signal?.aborted) return;
          const initial = !loaded.current;
          if (initial) {
            oldest.current = page.nextBefore;
            setMore(page.hasMore);
          }
          loaded.current = true;
          setItems(old => applyCommentDeletions(old, page.deletedIds));
          if (page.deletedIds?.length) {
            setReply(old => (old && page.deletedIds.includes(old.id) ? null : old));
            if (page.deletedIds.includes(viewerOwner.current || 0)) setViewer([]);
          }
          if (page.items.length) {
            newest.current = Math.max(newest.current, ...page.items.map(item => item.id));
            setItems(old => applyCommentDeletions(mergeComments(old, page.items), page.deletedIds));
          }
          if ((initial || page.items.length > 0) && nearEnd.current) {
            requestAnimationFrame(() => list.current?.scrollToEnd({ animated: !initial }));
          }
          hasMore = !initial && page.hasMore;
          next = newest.current;
          rounds++;
        } while (hasMore && rounds < 3);
        setError('');
      } catch (cause) {
        if (alive.current && !signal?.aborted) {
          setError(cause instanceof Error ? cause.message : 'Chưa tải được thảo luận.');
        }
      } finally {
        reading.current = false;
        if (alive.current) setLoading(false);
      }
    },
    [post.id, accessToken]
  );

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    void sync(controller.signal);
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void sync(controller.signal);
    }, 5000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void sync(controller.signal);
    });
    return () => {
      alive.current = false;
      controller.abort();
      clearInterval(timer);
      subscription.remove();
    };
  }, [sync]);

  const older = async () => {
    if (locked.current || !oldest.current) return;
    locked.current = true;
    setSaving(true);
    try {
      const page = await identityRequest<CommentPage>(
        '/community/posts/' + post.id + '/comments?before=' + oldest.current,
        undefined,
        accessToken || undefined
      );
      if (!alive.current) return;
      oldest.current = page.nextBefore;
      setMore(page.hasMore);
      nearEnd.current = false;
      setVisibleCount(count => count + 10);
      setItems(old => applyCommentDeletions(mergeComments(old, page.items), page.deletedIds));
    } catch (cause) {
      if (alive.current) setError(cause instanceof Error ? cause.message : 'Chưa tải được.');
    } finally {
      locked.current = false;
      if (alive.current) setSaving(false);
    }
  };

  const send = async () => {
    if (locked.current || (!draft.trim() && !media.length) || !currentUser) return;
    locked.current = true;
    setSaving(true);
    setError('');
    try {
      const selected = [...media];
      for (let index = 0; index < selected.length; index++) {
        if (selected[index].uploaded) continue;
        if (!selected[index].ticket) {
          selected[index] = {
            ...selected[index],
            ticket: await operationRequest<UploadTicket>('identity', '/community/media/signature', 'POST', {
              type: selected[index].asset.type,
            }),
          };
          if (!alive.current) return;
          setMedia([...selected]);
        }
        const uploaded = await uploadAttachment(
          selected[index].asset,
          selected[index].ticket!,
          value => {
            if (alive.current) setProgress(`Đang tải tệp ${index + 1}/${selected.length}: ${value}%`);
          },
          uploadAbort.current.signal
        );
        if (!alive.current) return;
        selected[index] = { ...selected[index], uploaded };
        setMedia([...selected]);
      }
      const body = {
        content: draft.trim(),
        parentId: reply?.id ?? null,
        mediaIds: selected.map(item => item.uploaded!.id),
      };
      const serialized = JSON.stringify(body);
      if (submission.current.body !== serialized) {
        submission.current = { body: serialized, key: requestKey() };
      }
      const saved = await operationRequest<CommunityComment>(
        'identity',
        '/community/posts/' + post.id + '/comments',
        'POST',
        { ...body, requestKey: submission.current.key }
      );
      if (!alive.current) return;
      // Show the persisted acknowledgement immediately without advancing the polling cursor past other users' unseen replies.
      if (typeof saved.content === 'string' && saved.reactions) {
        setItems(old => mergeComments(old, [saved]));
      }
      setDraft('');
      setMedia([]);
      setReply(null);
      submission.current = { body: '', key: requestKey() };
      nearEnd.current = true;
      await sync();
      onChanged();
    } catch (cause) {
      if (alive.current) setError(cause instanceof Error ? cause.message : 'Chưa gửi được bình luận.');
    } finally {
      locked.current = false;
      if (alive.current) {
        setSaving(false);
        setProgress('');
      }
    }
  };

  const canSend = !saving && (!!draft.trim() || media.length > 0) && !!currentUser;

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Top Header */}
        <View style={s.header}>
          <Pressable
            accessibilityLabel="Đóng thảo luận"
            disabled={saving}
            onPress={onClose}
            style={({ pressed }) => [s.headerIconBtn, pressed && s.pressed]}
          >
            <IconSymbol name="back" size={20} color="#164E3B" />
          </Pressable>
          <View style={s.grow}>
            <Text style={s.heading}>Thảo luận bài viết</Text>
            <Text numberOfLines={1} style={s.headerSub}>
              Bài viết của {post.author} · {items.length || post.commentCount || 0} bình luận
            </Text>
          </View>
          <Pressable
            disabled={saving}
            onPress={onClose}
            style={({ pressed }) => [s.closePill, pressed && s.pressed]}
          >
            <Text style={s.closePillText}>Đóng</Text>
            <IconSymbol name="close" size={14} color="#047857" />
          </Pressable>
        </View>

        {!!error && (
          <Pressable onPress={() => void sync()} style={s.errorBox}>
            <IconSymbol name="warning" size={16} color="#B91C1C" />
            <Text style={s.error}>{error} · Chạm để thử lại</Text>
          </Pressable>
        )}
        {!!notice && (
          <View style={s.successBox}>
            <IconSymbol name="check" size={16} color="#166534" />
            <Text style={s.success}>{notice}</Text>
          </View>
        )}

        <FlatList
          ref={list}
          data={items.slice(-visibleCount)}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.messages}
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          onContentSizeChange={() => {
            if (nearEnd.current) list.current?.scrollToEnd({ animated: false });
          }}
          onScroll={({ nativeEvent: e }) => {
            nearEnd.current = e.contentSize.height - e.layoutMeasurement.height - e.contentOffset.y < 100;
          }}
          scrollEventThrottle={100}
          ListHeaderComponent={
            <View style={s.listHeaderWrap}>
              {/* Original Post Summary Context */}
              <View style={s.postSummaryCard}>
                <View style={s.postSummaryTop}>
                  {post.avatar ? (
                    <Image source={remoteImageSource(post.avatar)} style={s.postSummaryAvatar} />
                  ) : (
                    <View style={s.postSummaryAvatarFallback}>
                      <Text style={s.postSummaryAvatarInitial}>{post.author.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={s.grow}>
                    <Text style={s.postSummaryAuthor}>{post.author}</Text>
                    <Text style={s.postSummaryTime}>{formatCommentTime(post.createdAt)} · Bài viết gốc</Text>
                  </View>
                </View>
                {!!post.content && (
                  <Text numberOfLines={3} style={s.postSummaryContent}>
                    {post.content}
                  </Text>
                )}
              </View>

              {/* Pagination / Filter Controls */}
              {(items.length > visibleCount || more || visibleCount > 5) && (
                <View style={s.paginationBar}>
                  {items.length > visibleCount ? (
                    <Pressable
                      disabled={saving}
                      onPress={() => {
                        nearEnd.current = false;
                        setVisibleCount(count => count + 10);
                      }}
                      style={({ pressed }) => [s.paginationBtn, pressed && s.pressed]}
                    >
                      <IconSymbol name="chevronUp" size={14} color="#00734F" />
                      <Text style={s.paginationBtnText}>
                        Xem thêm {Math.min(10, items.length - visibleCount)} bình luận trước
                      </Text>
                    </Pressable>
                  ) : more ? (
                    <Pressable
                      disabled={saving}
                      onPress={() => void older()}
                      style={({ pressed }) => [s.paginationBtn, pressed && s.pressed]}
                    >
                      <IconSymbol name="chevronUp" size={14} color="#00734F" />
                      <Text style={s.paginationBtnText}>Xem thêm bình luận trước</Text>
                    </Pressable>
                  ) : null}

                  {visibleCount > 5 && (
                    <Pressable
                      onPress={() => {
                        nearEnd.current = true;
                        setVisibleCount(5);
                      }}
                      style={({ pressed }) => [s.paginationCollapseBtn, pressed && s.pressed]}
                    >
                      <IconSymbol name="chevronDown" size={14} color="#475569" />
                      <Text style={s.paginationCollapseText}>Thu gọn · 5 bình luận gần nhất</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <View style={s.emptyIconCircle}>
                <IconSymbol name="chat" size={26} color={BrandColors.primary} />
              </View>
              <Text style={s.emptyTitle}>
                {loading ? 'Đang tải bình luận…' : 'Chưa có bình luận nào'}
              </Text>
              {!loading && (
                <Text style={s.emptySubtitle}>
                  Hãy là người đầu tiên chia sẻ ý kiến hoặc đặt câu hỏi cho bài viết này.
                </Text>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isReply = !!item.parentId;
            const myReactionObj = item.myReaction ? REACTIONS.find(r => r.id === item.myReaction) : null;
            const activeReactions = REACTIONS.filter(r => item.reactions[r.id]);
            const isReplyingHere = reply?.id === item.id;
            const isLongContent = item.content.length > 180 || item.content.split('\n').length > 4;

            return (
              <View style={[s.commentRowWrap, isReply && s.replyRowWrap]}>
                {/* Visual Thread Branch for Replies */}
                {isReply && (
                  <View style={s.replyThreadConnector}>
                    <View style={s.replyThreadCurve} />
                  </View>
                )}

                <View style={s.commentMainRow}>
                  {/* Avatar */}
                  {item.avatar ? (
                    <Image
                      source={remoteImageSource(item.avatar)}
                      style={[s.commentAvatar, isReply && s.replyAvatar]}
                    />
                  ) : (
                    <View
                      style={[
                        s.commentAvatarFallback,
                        isReply && s.replyAvatarFallback,
                      ]}
                    >
                      <Text style={[s.commentAvatarInitial, isReply && s.replyAvatarInitial]}>
                        {item.author.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* Comment / Reply Bubble + Actions */}
                  <View style={s.commentColumn}>
                    <View
                      style={[
                        s.bubble,
                        isReply && s.replyBubble,
                        isReplyingHere && s.bubbleReplyingTarget,
                        item.deleted && s.bubbleDeleted,
                      ]}
                    >
                      {/* Author & Timestamp Header */}
                      <View style={s.bubbleHeader}>
                        <View style={s.authorBadgeRow}>
                          <Text style={s.author}>{item.author}</Text>
                          {isReply && item.parentAuthor && (
                            <View style={s.replyTargetChip}>
                              <IconSymbol name="reply" size={11} color="#047857" />
                              <Text numberOfLines={1} style={s.replyTargetChipText}>
                                {item.parentAuthor}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={s.timeText}>{formatCommentTime(item.createdAt)}</Text>
                      </View>

                      {/* Quoted Parent Comment Preview */}
                      {isReply && (
                        <View style={s.quote}>
                          <View style={s.quoteHeaderRow}>
                            <IconSymbol name="reply" size={12} color="#00734F" />
                            <Text style={s.quoteAuthorText}>Trả lời {item.parentAuthor}</Text>
                          </View>
                          {!!item.parentContent && (
                            <Text numberOfLines={2} style={s.quoteContentText}>
                              {item.parentContent}
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Comment Body */}
                      <Text
                        numberOfLines={!expandedText[item.id] && isLongContent ? 5 : undefined}
                        style={[s.body, item.deleted && s.deletedBodyText]}
                      >
                        {item.content}
                      </Text>

                      {isLongContent && !item.deleted && (
                        <Pressable
                          style={s.expandBtn}
                          onPress={() =>
                            setExpandedText(old => ({ ...old, [item.id]: !old[item.id] }))
                          }
                        >
                          <Text style={s.link}>
                            {expandedText[item.id] ? 'Thu gọn nội dung' : 'Xem thêm nội dung'}
                          </Text>
                        </Pressable>
                      )}

                      {/* Attached Media */}
                      {!!item.media?.length && !item.deleted && (
                        <CommunityMediaGallery
                          compact
                          media={item.media}
                          onOpen={(files, index) => {
                            viewerOwner.current = item.id;
                            openMedia(files, index);
                          }}
                        />
                      )}
                    </View>

                    {/* Comment Action Row */}
                    {!item.deleted && (
                      <View style={s.commentActionBar}>
                        <View style={s.commentActionsLeft}>
                          <Pressable
                            disabled={saving || !currentUser}
                            onPress={() => setPicker(picker === item.id ? null : item.id)}
                            style={({ pressed }) => [
                              s.actionChip,
                              !!myReactionObj && s.actionChipActive,
                              pressed && s.pressed,
                            ]}
                          >
                            {myReactionObj ? (
                              <Text style={s.reactionMiniEmoji}>{myReactionObj.emoji}</Text>
                            ) : (
                              <IconSymbol name="heart" size={13} color="#64748B" />
                            )}
                            <Text
                              style={[
                                s.actionChipText,
                                !!myReactionObj && s.actionChipTextActive,
                              ]}
                            >
                              {myReactionObj ? myReactionObj.label : 'Cảm xúc'}
                            </Text>
                          </Pressable>

                          <Pressable
                            disabled={saving || !currentUser}
                            onPress={() => setReply(item)}
                            style={({ pressed }) => [
                              s.actionChip,
                              isReplyingHere && s.actionChipReplyActive,
                              pressed && s.pressed,
                            ]}
                          >
                            <IconSymbol
                              name="reply"
                              size={13}
                              color={isReplyingHere ? '#00734F' : '#64748B'}
                            />
                            <Text
                              style={[
                                s.actionChipText,
                                isReplyingHere && s.actionChipTextActive,
                              ]}
                            >
                              Trả lời
                            </Text>
                          </Pressable>

                          <Pressable
                            disabled={saving || !currentUser || reported[item.id]}
                            onPress={() => setReport(item)}
                            style={({ pressed }) => [s.actionChip, pressed && s.pressed]}
                          >
                            <IconSymbol
                              name="flag"
                              size={12}
                              color={reported[item.id] ? '#94A3B8' : '#B45309'}
                            />
                            <Text
                              style={[
                                s.reportText,
                                reported[item.id] && s.reportedText,
                              ]}
                            >
                              {reported[item.id] ? 'Đã báo cáo' : 'Báo cáo'}
                            </Text>
                          </Pressable>
                        </View>

                        {activeReactions.length > 0 && (
                          <View style={s.reactionSummaryPill}>
                            <Text style={s.reactionSummaryText}>
                              {activeReactions
                                .map(r => r.emoji + ' ' + item.reactions[r.id])
                                .join('  ')}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Inline Reaction Picker Tray */}
                    {!item.deleted && picker === item.id && (
                      <View style={s.reactionPickerTray}>
                        {REACTIONS.map(reaction => {
                          const selected = item.myReaction === reaction.id;
                          return (
                            <Pressable
                              key={reaction.id}
                              disabled={saving}
                              accessibilityLabel={reaction.label}
                              style={({ pressed }) => [
                                s.reactionOptionBtn,
                                selected && s.reactionOptionBtnSelected,
                                pressed && s.pressed,
                              ]}
                              onPress={async () => {
                                if (locked.current) return;
                                locked.current = true;
                                setSaving(true);
                                try {
                                  const updated = await operationRequest<CommunityComment>(
                                    'identity',
                                    '/community/posts/' + post.id + '/comments/' + item.id + '/reaction',
                                    'PATCH',
                                    { reaction: item.myReaction === reaction.id ? null : reaction.id }
                                  );
                                  if (alive.current) {
                                    setItems(old => mergeComments(old, [updated]));
                                    setPicker(null);
                                  }
                                } catch (cause) {
                                  if (alive.current) {
                                    setError(
                                      cause instanceof Error
                                        ? cause.message
                                        : 'Chưa lưu được cảm xúc.'
                                    );
                                  }
                                } finally {
                                  locked.current = false;
                                  if (alive.current) setSaving(false);
                                }
                              }}
                            >
                              <Text style={s.emoji}>{reaction.emoji}</Text>
                              <Text
                                style={[
                                  s.reactionOptionLabel,
                                  selected && s.reactionOptionLabelSelected,
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
                </View>
              </View>
            );
          }}
        />

        {/* Bottom Comment & Reply Composer */}
        <View style={s.composer}>
          {reply && (
            <View style={s.replyBanner}>
              <View style={s.replyBannerIconWrap}>
                <IconSymbol name="reply" size={14} color="#00734F" />
              </View>
              <View style={s.grow}>
                <Text style={s.replyBannerTitle}>Đang trả lời {reply.author}</Text>
                <Text numberOfLines={1} style={s.replyBannerPreview}>
                  {reply.content || 'Đính kèm ảnh / video'}
                </Text>
              </View>
              <Pressable
                disabled={saving}
                style={({ pressed }) => [s.replyCancelBtn, pressed && s.pressed]}
                onPress={() => setReply(null)}
              >
                <IconSymbol name="close" size={14} color="#047857" />
                <Text style={s.link}>Bỏ</Text>
              </Pressable>
            </View>
          )}

          {!!media.length && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.mediaStrip}
              style={{ maxHeight: 82 }}
            >
              {media.map((item, index) => (
                <View key={item.asset.uri} style={s.attachment}>
                  {item.asset.type === 'video' ? (
                    <View style={s.videoThumb}>
                      <IconSymbol name="video" size={18} color="#FFFFFF" />
                      <Text style={s.videoThumbText}>Video {index + 1}</Text>
                    </View>
                  ) : (
                    <Image source={remoteImageSource(item.asset.uri)} style={s.thumbnail} />
                  )}
                  <Pressable
                    accessibilityLabel={`Bỏ tệp ${index + 1}`}
                    disabled={saving}
                    onPress={() => setMedia(old => old.filter((_, i) => i !== index))}
                    style={s.remove}
                  >
                    <IconSymbol name="close" size={13} color="#1E293B" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          {!!progress && (
            <View style={s.progressPill}>
              <IconSymbol name="clock" size={13} color="#00734F" />
              <Text style={s.progressText}>{progress}</Text>
            </View>
          )}

          <View style={s.inputRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Thêm ảnh hoặc video vào bình luận"
              disabled={saving || !currentUser || !mediaEnabled}
              style={({ pressed }) => [
                s.addMediaButton,
                pressed && s.addMediaPressed,
                (saving || !currentUser || !mediaEnabled) && s.disabled,
              ]}
              onPress={() => void pickMedia()}
            >
              <IconSymbol name="image" size={18} color="#00734F" />
              {media.length > 0 && (
                <Text style={s.addMediaBadgeText}>{media.length}/4</Text>
              )}
            </Pressable>

            <View style={s.inputContainer}>
              <TextInput
                accessibilityLabel="Nội dung bình luận"
                editable={!saving && !!currentUser}
                value={draft}
                onChangeText={setDraft}
                maxLength={2000}
                multiline
                placeholder={
                  !currentUser
                    ? 'Đăng nhập để bình luận'
                    : reply
                      ? `Trả lời ${reply.author}…`
                      : 'Viết bình luận chia sẻ…'
                }
                placeholderTextColor="#94A3B8"
                style={s.input}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!canSend}
              onPress={() => void send()}
              style={({ pressed }) => [
                s.send,
                !canSend && s.disabled,
                pressed && canSend && s.pressed,
              ]}
            >
              <IconSymbol name="send" size={16} color="#FFFFFF" />
              <Text style={s.white}>{saving ? 'Đợi…' : 'Gửi'}</Text>
            </Pressable>
          </View>
        </View>

        {!!viewer.length && (
          <Modal animationType="fade" onRequestClose={() => setViewer([])}>
            <CommunityMediaViewer
              media={viewer}
              index={viewerIndex}
              onIndex={setViewerIndex}
              onClose={() => setViewer([])}
            />
          </Modal>
        )}

        {report && (
          <CommentReportDialog
            key={report.id}
            postId={post.id}
            comment={report}
            onClose={() => setReport(null)}
            onSaved={() => {
              setReported(old => ({ ...old, [report.id]: true }));
              setReport(null);
              setNotice('Đã lưu báo cáo. Quản trị viên sẽ xem xét bình luận này.');
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F8F5',
  },
  grow: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2ECE7',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F9F4',
    borderWidth: 1,
    borderColor: '#D5EBE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontWeight: '800',
    fontSize: 16,
    color: '#111827',
  },
  headerSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
  },
  closePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#C6F0DC',
  },
  closePillText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  error: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 12.5,
    fontWeight: '600',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#DCFCE7',
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
  },
  success: {
    flex: 1,
    color: '#166534',
    fontSize: 12.5,
    fontWeight: '600',
  },
  messages: {
    padding: 14,
    gap: 12,
    paddingBottom: 24,
  },
  listHeaderWrap: {
    gap: 10,
    marginBottom: 4,
  },
  postSummaryCard: {
    padding: 13,
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8E2',
    borderLeftWidth: 3.5,
    borderLeftColor: BrandColors.primary,
  },
  postSummaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postSummaryAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
  },
  postSummaryAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postSummaryAvatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  postSummaryAuthor: {
    fontWeight: '700',
    fontSize: 13.5,
    color: '#0F172A',
  },
  postSummaryTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  postSummaryContent: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#334155',
  },
  paginationBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  paginationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#B7E4D1',
  },
  paginationBtnText: {
    color: '#00734F',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationCollapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8E2',
  },
  paginationCollapseText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E6F8F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  commentRowWrap: {
    width: '100%',
  },
  replyRowWrap: {
    paddingLeft: 24,
    position: 'relative',
  },
  replyThreadConnector: {
    position: 'absolute',
    left: 10,
    top: -6,
    bottom: 24,
    width: 14,
  },
  replyThreadCurve: {
    width: 13,
    height: 26,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#B7E4D1',
    borderBottomLeftRadius: 10,
  },
  commentMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
    marginTop: 2,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  replyAvatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#047857',
  },
  commentAvatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  replyAvatarInitial: {
    fontSize: 11.5,
  },
  commentColumn: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 6,
    borderRadius: 16,
    borderTopLeftRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8E2',
  },
  replyBubble: {
    backgroundColor: '#FAFDFB',
    borderColor: '#CFE5DA',
    borderRadius: 15,
    borderTopLeftRadius: 5,
  },
  bubbleReplyingTarget: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F4FBF8',
  },
  bubbleDeleted: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  authorBadgeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  author: {
    fontWeight: '700',
    fontSize: 13.5,
    color: '#134E3A',
  },
  replyTargetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E6F8F1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    maxWidth: 150,
  },
  replyTargetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  quote: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 2,
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary,
    backgroundColor: '#EFF7F3',
    borderRadius: 8,
  },
  quoteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quoteAuthorText: {
    color: '#00734F',
    fontSize: 11.5,
    fontWeight: '700',
  },
  quoteContentText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
  body: {
    fontSize: 14,
    lineHeight: 20.5,
    color: '#1E293B',
  },
  deletedBodyText: {
    color: '#64748B',
    fontStyle: 'italic',
  },
  expandBtn: {
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  link: {
    color: '#00875F',
    fontSize: 12,
    fontWeight: '700',
  },
  commentActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 2,
  },
  commentActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  actionChipActive: {
    backgroundColor: '#ECFDF5',
  },
  actionChipReplyActive: {
    backgroundColor: '#E6F8F1',
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  actionChipTextActive: {
    color: '#00734F',
    fontWeight: '700',
  },
  reactionMiniEmoji: {
    fontSize: 13,
  },
  reportText: {
    color: '#B45309',
    fontSize: 11.5,
    fontWeight: '600',
  },
  reportedText: {
    color: '#94A3B8',
  },
  reactionSummaryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8E2',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
  },
  reactionSummaryText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  reactionPickerTray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFE5DA',
    alignSelf: 'flex-start',
  },
  reactionOptionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    minWidth: 46,
  },
  reactionOptionBtnSelected: {
    backgroundColor: '#ECFDF5',
  },
  emoji: {
    fontSize: 20,
  },
  reactionOptionLabel: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  reactionOptionLabelSelected: {
    color: '#00734F',
    fontWeight: '700',
  },
  composer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#DCE8E2',
  },
  replyBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F0F9F4',
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.primary,
  },
  replyBannerIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  replyBannerPreview: {
    fontSize: 11.5,
    color: '#475569',
  },
  replyCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C6F0DC',
  },
  mediaStrip: {
    gap: 8,
    paddingVertical: 2,
  },
  attachment: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#DCE8E2',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoThumb: {
    flex: 1,
    width: '100%',
    backgroundColor: '#132A23',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  videoThumbText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  remove: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
  },
  progressText: {
    fontSize: 11.5,
    color: '#047857',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  addMediaButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#B7E4D1',
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addMediaPressed: {
    backgroundColor: '#D1FAE5',
  },
  addMediaBadgeText: {
    color: '#00734F',
    fontSize: 11.5,
    fontWeight: '800',
  },
  inputContainer: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    backgroundColor: '#F4F8F6',
    borderWidth: 1,
    borderColor: '#DCE8E2',
  },
  input: {
    minHeight: 44,
    maxHeight: 110,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: '#1E293B',
    fontSize: 14,
  },
  send: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 14,
    backgroundColor: '#00875F',
    paddingHorizontal: 14,
  },
  white: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
  },
});
