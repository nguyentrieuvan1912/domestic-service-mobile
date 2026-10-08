import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BrandColors } from '@/constants/theme';
import { CatalogCategory, CatalogPage } from '@/api/catalog-types';
import { useCatalogResource } from '@/hooks/use-catalog-resource';
import { SearchBar } from '@/components/common/SearchBar';
import { CatalogState } from '@/components/common/CatalogState';
import { ServiceCard } from '@/components/common/ServiceCard';
import { catalogSummaryView } from '@/api/catalog-view';

export default function CatalogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; categoryId?: string }>();
  const [draft, setDraft] = useState(params.q || '');
  const [q, setQ] = useState(params.q || '');
  const [categoryId, setCategoryId] = useState(params.categoryId || '');
  const [page, setPage] = useState(0);
  const categories = useCatalogResource<CatalogCategory[]>('/categories');
  const query = new URLSearchParams({ q, page: String(page), size: '12' });
  if (categoryId) query.set('categoryId', categoryId);
  const services = useCatalogResource<CatalogPage>(`/services?${query}`);
  const submit = () => { setQ(draft.trim()); setPage(0); };
  return <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}><Text style={styles.back}>← Trang chủ</Text></Pressable>
      <Text style={styles.title}>Dịch vụ gia đình</Text>
      <Text style={styles.subtitle}>Danh mục và giá tham khảo từ hệ thống</Text>
      <SearchBar value={draft} onChangeText={value => setDraft(value.slice(0, 100))} onSubmit={submit} />
      <Pressable accessibilityRole="button" style={styles.searchButton} onPress={submit}><Text style={styles.buttonText}>Tìm kiếm</Text></Pressable>
      {categories.loading && <ActivityIndicator color={BrandColors.primary} />}
      {categories.error ? <CatalogState error={categories.error} onRetry={categories.retry} /> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[{ id: '', name: 'Tất cả' }, ...(categories.data || []).map(category => ({ id: String(category.id), name: category.name }))].map(category => <Pressable accessibilityRole="button" accessibilityState={{ selected: category.id === categoryId }} key={category.id} onPress={() => { setCategoryId(category.id); setPage(0); }} style={[styles.chip, category.id === categoryId && styles.activeChip]}><Text style={category.id === categoryId ? styles.buttonText : styles.chipText}>{category.name}</Text></Pressable>)}
      </ScrollView>}
      {services.loading || services.error ? <CatalogState loading={services.loading} error={services.error} onRetry={services.retry} /> : <>
        <Text style={styles.subtitle}>{services.data?.total || 0} dịch vụ phù hợp</Text>
        {services.data?.items.length ? services.data.items.map(service => <ServiceCard service={catalogSummaryView(service)} key={service.id} onPress={() => router.push({ pathname: '/service/[id]', params: { id: String(service.id) } })} />) : <CatalogState />}
        {!!services.data?.totalPages && <View style={styles.pagination}>
          <Pressable accessibilityRole="button" disabled={page === 0} style={{ opacity: page === 0 ? 0.4 : 1 }} onPress={() => setPage(value => value - 1)}><Text style={styles.back}>Trang trước</Text></Pressable>
          <Text>{page + 1} / {services.data.totalPages}</Text>
          <Pressable accessibilityRole="button" disabled={page + 1 >= services.data.totalPages} style={{ opacity: page + 1 >= services.data.totalPages ? 0.4 : 1 }} onPress={() => setPage(value => value + 1)}><Text style={styles.back}>Trang sau</Text></Pressable>
        </View>}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3FAF7' }, content: { padding: 16, paddingBottom: 40, gap: 14, width: '100%', maxWidth: 800, alignSelf: 'center' },
  back: { color: BrandColors.primaryDark, fontWeight: '700', paddingVertical: 8 }, title: { fontSize: 27, fontWeight: '800', color: BrandColors.gray900 }, subtitle: { color: BrandColors.gray600, lineHeight: 20 },
  searchButton: { backgroundColor: BrandColors.primary, borderRadius: 12, padding: 12, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '700' },
  chips: { gap: 8 }, chip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DCFCE7', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12 }, activeChip: { backgroundColor: BrandColors.primary }, chipText: { color: BrandColors.primaryDark },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
});
