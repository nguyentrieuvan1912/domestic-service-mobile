import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { blogCategories, getPublishedArticle, type BlogArticle } from '@/api/blog';
import { BlogContent, BlogCover } from '@/components/blog/BlogContent';
import { IconSymbol } from '@/components/common/IconSymbol';
import { BrandColors, BorderRadius, MaxContentWidth, Spacing } from '@/constants/theme';

export default function BlogArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Quay lại"
        accessibilityRole="button"
        style={styles.back}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
        <IconSymbol name="back" size={22} color={BrandColors.gray900} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>Blog CleanMaster</Text>
    </View>
    <Article key={slug} slug={slug} />
  </SafeAreaView>;
}

function Article({ slug }: { slug: string }) {
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getPublishedArticle(slug, controller.signal).then(next => {
      if (!controller.signal.aborted) setArticle(next);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error && cause.message === 'Bài viết không còn được xuất bản.'
        ? cause.message : 'Chưa tải được bài viết. Vui lòng thử lại.');
    });
    return () => controller.abort();
  }, [slug, attempt]);

  if (error) return <View style={styles.notice}>
    <Text style={styles.byline}>{error}</Text>
    <Pressable accessibilityRole="button" hitSlop={8} onPress={() => { setError(''); setAttempt(value => value + 1); }}>
      <Text style={styles.retry}>Thử lại</Text>
    </Pressable>
  </View>;
  if (!article) return <ActivityIndicator accessibilityLabel="Đang tải bài viết" color={BrandColors.primaryDark} style={styles.notice} />;

  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    : null;

  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.category}>{blogCategories[article.category]}</Text>
    <Text accessibilityRole="header" style={styles.title}>{article.title}</Text>
    <Text style={styles.excerpt}>{article.excerpt}</Text>
    <View style={styles.metadata}>
      <Text style={styles.author}>{article.authorName}</Text>
      {publishedDate && <Text style={styles.byline}>{publishedDate}</Text>}
    </View>
    <BlogCover url={article.coverUrl} />
    <BlogContent document={article.document} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.white },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: BrandColors.gray100 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: BrandColors.gray900 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.three, paddingTop: 20, paddingBottom: 36, gap: 14 },
  category: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, backgroundColor: BrandColors.primaryLight, color: '#047857', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 27, lineHeight: 35, fontWeight: '800', color: BrandColors.gray900 },
  excerpt: { color: BrandColors.gray700, fontSize: 16, lineHeight: 24 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  author: { color: BrandColors.gray800, fontSize: 13, fontWeight: '700' },
  byline: { color: BrandColors.gray600, fontSize: 13 },
  notice: { alignItems: 'center', gap: 12, margin: 24 },
  retry: { color: '#047857', fontWeight: '700' },
});
