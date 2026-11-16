import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, AppState, PixelRatio, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type FlatList, type LayoutChangeEvent } from 'react-native';
import { useFocusEffect, useIsFocused, useRouter } from 'expo-router';
import Animated, { scrollTo, useAnimatedRef, useAnimatedScrollHandler, useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { blogCategories, listPublishedBlog, type BlogSummary } from '@/api/blog';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { BlogCover } from './BlogContent';

const CARD_GAP = 12;
const SCROLL_SPEED = 24; // dp per second
const RESUME_DELAY = 2500;
const PIXEL_RATIO = PixelRatio.get();

export function HomeBlogRow({ visible, onLayout }: { visible: boolean; onLayout: (event: LayoutChangeEvent) => void }) {
  const [articles, setArticles] = useState<BlogSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(useCallback(() => {
    let request: AbortController | undefined;
    const refresh = async () => {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      setFailed(false);
      try {
        const next = await listPublishedBlog(controller.signal);
        if (!controller.signal.aborted) setArticles(next);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    };
    void refresh();
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => {
      request?.abort();
      foreground.remove();
    };
  }, [attempt]));

  return (
    <View style={styles.section} onLayout={onLayout}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>Blog CleanMaster</Text>
          <Text style={styles.subtitle}>Mẹo chăm nhà và kiến thức gia đình</Text>
        </View>
        {(articles?.length ?? 0) > 1 && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>Vuốt xem</Text>
            <IconSymbol name="chevronRight" size={14} color="#047857" />
          </View>
        )}
      </View>
      {articles && articles.length > 0 && (
        <BlogCarousel articles={articles} visible={visible} />
      )}
      {failed ? (
        <Pressable accessibilityRole="button" style={styles.notice} onPress={() => setAttempt(value => value + 1)}>
          <Text style={styles.subtitle}>Chưa tải được blog.</Text>
          <Text style={styles.readText}>Thử lại</Text>
        </Pressable>
      ) : !articles ? (
        <ActivityIndicator accessibilityLabel="Đang tải blog" style={styles.notice} color={BrandColors.primaryDark} />
      ) : articles.length === 0 ? (
        <Text style={[styles.notice, styles.subtitle]}>Chưa có bài viết được xuất bản.</Text>
      ) : null}
    </View>
  );
}

function BlogCarousel({ articles, visible }: { articles: BlogSummary[]; visible: boolean }) {
  const router = useRouter();
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(240, Math.round(width * 0.63));
  const stride = cardWidth + CARD_GAP;
  const viewportItems = Math.ceil(width / stride) + 1;
  const [appActive, setAppActive] = useState(() => AppState.currentState === 'active');
  const [screenReader, setScreenReader] = useState(false);
  const canLoop = !reduceMotion && !screenReader && articles.length > 1
    && articles.length * stride - CARD_GAP + 2 * Spacing.three > width;
  const loopLength = canLoop ? articles.length * stride : 0;
  // Only repeat enough cards to cover the viewport at the wrap point.
  const items = useMemo(() => canLoop ? [...articles, ...articles.slice(0, viewportItems)] : articles,
    [articles, canLoop, viewportItems]);

  useEffect(() => {
    const appState = AppState.addEventListener('change', state => setAppActive(state === 'active'));
    let mounted = true;
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    void AccessibilityInfo.isScreenReaderEnabled().then(enabled => { if (mounted) setScreenReader(enabled); }).catch(() => undefined);
    return () => { mounted = false; appState.remove(); reader.remove(); };
  }, []);

  const list = useAnimatedRef<FlatList<BlogSummary>>();
  const offset = useSharedValue(0);
  const touching = useSharedValue(false);
  const dragging = useSharedValue(false);
  const coasting = useSharedValue(false);
  const hovering = useSharedValue(false);
  const resumeAfter = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (touching.value || dragging.value || coasting.value || hovering.value || Date.now() < resumeAfter.value) {
        offset.value = Math.max(0, event.contentOffset.x);
      }
    },
    onBeginDrag: event => {
      dragging.value = true;
      offset.value = Math.max(0, event.contentOffset.x);
    },
    onEndDrag: event => {
      dragging.value = false;
      offset.value = Math.max(0, event.contentOffset.x);
      resumeAfter.value = Date.now() + RESUME_DELAY;
    },
    onMomentumBegin: () => { coasting.value = true; },
    onMomentumEnd: event => {
      coasting.value = false;
      offset.value = Math.max(0, event.contentOffset.x);
      resumeAfter.value = Date.now() + RESUME_DELAY;
    },
  });
  const advance = useCallback(({ timeSincePreviousFrame }: { timeSincePreviousFrame: number | null }) => {
    'worklet';
    if (!loopLength || !timeSincePreviousFrame || touching.value || dragging.value || coasting.value || hovering.value || Date.now() < resumeAfter.value) return;
    const previous = offset.value;
    const next = (previous + Math.min(timeSincePreviousFrame, 48) * SCROLL_SPEED / 1000) % loopLength;
    offset.value = next;
    if (Math.round(previous * PIXEL_RATIO) !== Math.round(next * PIXEL_RATIO)) {
      scrollTo(list, next, 0, false);
    }
  }, [coasting, dragging, hovering, list, loopLength, offset, resumeAfter, touching]);
  const animation = useFrameCallback(advance, false);

  useEffect(() => {
    animation.setActive(visible && focused && appActive && canLoop);
    return () => animation.setActive(false);
  }, [animation, visible, focused, appActive, canLoop]);

  const endTouch = () => {
    touching.value = false;
    resumeAfter.value = Date.now() + RESUME_DELAY;
  };

  return (
    <View onTouchStart={() => { touching.value = true; coasting.value = false; }}
      onTouchEnd={endTouch} onTouchCancel={endTouch}
      onPointerEnter={Platform.OS === 'web' ? event => { hovering.value = event.nativeEvent.pointerType === 'mouse'; } : undefined}
      onPointerLeave={Platform.OS === 'web' ? () => { hovering.value = false; } : undefined}>
      <Animated.FlatList
        ref={list}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={(item, index) => index < articles.length ? String(item.id) : `loop-${item.id}`}
        initialNumToRender={viewportItems}
        windowSize={5}
        getItemLayout={(_, index) => ({ length: cardWidth, offset: Spacing.three + index * stride, index })}
        contentContainerStyle={styles.track}
        ItemSeparatorComponent={BlogCardGap}
        onScroll={scrollHandler}
        scrollEventThrottle={64}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Đọc bài viết ${item.title}`}
            style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}
            onPress={() => router.push({ pathname: '/blog/[slug]', params: { slug: item.slug } })}>
            <BlogCover url={item.coverUrl} style={styles.cover} />
            <View style={styles.body}>
              <Text numberOfLines={1} style={styles.category}>{blogCategories[item.category]}</Text>
              <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.readRow}>
                <Text style={styles.readText}>Đọc bài viết</Text>
                <IconSymbol name="chevronRight" size={14} color="#047857" />
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function BlogCardGap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.four },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: Spacing.three },
  heading: { flex: 1 },
  title: { fontSize: 17, fontWeight: '800', color: BrandColors.gray900 },
  subtitle: { fontSize: 12, color: BrandColors.gray600, marginTop: 2 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  hintText: { fontSize: 12, color: '#047857', fontWeight: '700' },
  track: { paddingHorizontal: Spacing.three },
  gap: { width: CARD_GAP },
  card: { backgroundColor: BrandColors.white, borderColor: '#D8E8DF', borderWidth: 1, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  pressed: { opacity: 0.78 },
  cover: { aspectRatio: 2.15, borderRadius: 0 },
  body: { flex: 1, gap: 5, padding: 12 },
  category: { color: '#047857', fontSize: 11, fontWeight: '700' },
  cardTitle: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '800', color: BrandColors.gray900 },
  readRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  readText: { color: '#047857', fontSize: 12, fontWeight: '700' },
  notice: { marginHorizontal: Spacing.three, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
