import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { SearchBar } from '@/components/common/SearchBar';
import { FilterChip } from '@/components/common/FilterChip';
import { ServiceCard } from '@/components/common/ServiceCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ServiceCardSkeleton } from '@/components/common/LoadingSkeleton';
import { IconSymbol } from '@/components/common/IconSymbol';
import {
  SERVICE_CATEGORIES,
  mockServices,
} from '@/data/services';
import { ServiceCategory } from '@/types/service';

type SortOption = 'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING_DESC';

const SORT_LABELS: { [key in SortOption]: string } = {
  POPULAR: 'Phổ biến nhất',
  PRICE_ASC: 'Giá: Thấp đến cao',
  PRICE_DESC: 'Giá: Cao đến thấp',
  RATING_DESC: 'Đánh giá cao nhất',
};

const PRICE_FILTERS = [
  { label: 'Tất cả giá', value: 'ALL' },
  { label: 'Dưới 200k', value: 'UNDER_200' },
  { label: '200k - 500k', value: '200_500' },
  { label: 'Trên 500k', value: 'OVER_500' },
];

const RATING_FILTERS = [
  { label: 'Tất cả sao', value: 'ALL' },
  { label: '⭐ 4.8+ sao', value: '4.8' },
  { label: '⭐ 4.9+ sao', value: '4.9' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; q?: string }>();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category || 'ALL');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('ALL');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('POPULAR');

  // Sort dropdown modal
  const [showSortModal, setShowSortModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filtered & Sorted services
  const filteredServices = useMemo(() => {
    return mockServices
      .filter((service) => {
        // Category filter
        if (selectedCategory !== 'ALL') {
          if (service.categoryId !== selectedCategory && service.category !== selectedCategory) {
            return false;
          }
        }

        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = service.name.toLowerCase().includes(q);
          const matchDesc = (service.shortDescription || service.description).toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }

        // Price filter
        if (selectedPriceFilter === 'UNDER_200' && service.basePrice >= 200000) return false;
        if (selectedPriceFilter === '200_500' && (service.basePrice < 200000 || service.basePrice > 500000)) return false;
        if (selectedPriceFilter === 'OVER_500' && service.basePrice <= 500000) return false;

        // Rating filter
        if (selectedRatingFilter === '4.8' && service.rating < 4.8) return false;
        if (selectedRatingFilter === '4.9' && service.rating < 4.9) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'PRICE_ASC':
            return a.basePrice - b.basePrice;
          case 'PRICE_DESC':
            return b.basePrice - a.basePrice;
          case 'RATING_DESC':
            return b.rating - a.rating;
          case 'POPULAR':
          default:
            return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        }
      });
  }, [searchQuery, selectedCategory, selectedPriceFilter, selectedRatingFilter, sortOption]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedPriceFilter('ALL');
    setSelectedRatingFilter('ALL');
    setSortOption('POPULAR');
  };

  return (
    <LinearGradient
      colors={BrandColors.softBgGradient}
      locations={BrandColors.softBgGradientLocations}
      style={styles.gradientContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Khám phá dịch vụ</Text>
          <Text style={styles.headerSubtitle}>
            16 nhóm dịch vụ gia đình tận tâm chuẩn 5 sao
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo tên dịch vụ hoặc nhu cầu..."
          />
        </View>

        {/* CATEGORY FILTER PILLS */}
        <View style={styles.categoryScrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}>
            <FilterChip
              label="Tất cả dịch vụ"
              isSelected={selectedCategory === 'ALL'}
              onPress={() => setSelectedCategory('ALL')}
            />
            {SERVICE_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat.id}
                label={cat.name}
                icon={cat.icon}
                isSelected={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(cat.id)}
              />
            ))}
          </ScrollView>
        </View>

        {/* SECONDARY FILTER BAR: Price, Rating & Sort Button */}
        <View style={styles.secondaryFilterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.secondaryScrollContent}>
            {/* Sort trigger button */}
            <Pressable
              style={styles.sortButton}
              onPress={() => setShowSortModal(true)}>
              <Text style={styles.sortButtonText}>
                ↕ {SORT_LABELS[sortOption]}
              </Text>
            </Pressable>

            {/* Price filters */}
            {PRICE_FILTERS.map((pf) => (
              <Pressable
                key={pf.value}
                style={[
                  styles.miniChip,
                  selectedPriceFilter === pf.value && styles.miniChipSelected,
                ]}
                onPress={() => setSelectedPriceFilter(pf.value)}>
                <Text
                  style={[
                    styles.miniChipText,
                    selectedPriceFilter === pf.value && styles.miniChipTextSelected,
                  ]}>
                  {pf.label}
                </Text>
              </Pressable>
            ))}

            {/* Rating filters */}
            {RATING_FILTERS.map((rf) => (
              <Pressable
                key={rf.value}
                style={[
                  styles.miniChip,
                  selectedRatingFilter === rf.value && styles.miniChipSelected,
                ]}
                onPress={() => setSelectedRatingFilter(rf.value)}>
                <Text
                  style={[
                    styles.miniChipText,
                    selectedRatingFilter === rf.value && styles.miniChipTextSelected,
                  ]}>
                  {rf.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* SERVICE LIST OR EMPTY STATE */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}>
          {/* Results count text */}
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              Tìm thấy <Text style={styles.countBold}>{filteredServices.length}</Text> dịch vụ
            </Text>
            {(selectedCategory !== 'ALL' ||
              selectedPriceFilter !== 'ALL' ||
              selectedRatingFilter !== 'ALL' ||
              searchQuery.length > 0) && (
              <Pressable onPress={resetFilters}>
                <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
              </Pressable>
            )}
          </View>

          {isLoading ? (
            <>
              <ServiceCardSkeleton />
              <ServiceCardSkeleton />
            </>
          ) : filteredServices.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Không tìm thấy dịch vụ phù hợp"
              description="Thử tìm kiếm với từ khóa khác hoặc điều chỉnh lại các tiêu chí lọc giá, sao hoặc danh mục."
              actionText="Xóa tất cả bộ lọc"
              onAction={resetFilters}
            />
          ) : (
            filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() =>
                  router.push({
                    pathname: '/service/[id]',
                    params: { id: service.id },
                  })
                }
                onBookNow={() =>
                  router.push({
                    pathname: '/booking/new',
                    params: { serviceId: service.id },
                  })
                }
              />
            ))
          )}

          <View style={{ height: 60 }} />
        </ScrollView>

        {/* SORT SELECTION MODAL */}
        <Modal
          visible={showSortModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSortModal(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowSortModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sắp xếp danh sách dịch vụ</Text>
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => {
                const isSelected = sortOption === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.sortOptionItem, isSelected && styles.sortOptionItemSelected]}
                    onPress={() => {
                      setSortOption(key);
                      setShowSortModal(false);
                    }}>
                    <Text style={[styles.sortOptionText, isSelected && styles.sortOptionTextSelected]}>
                      {SORT_LABELS[key]}
                    </Text>
                    {isSelected && <IconSymbol name="check" size={18} color={BrandColors.primary} />}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandColors.gray900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BrandColors.gray500,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: Spacing.three,
    marginTop: 8,
    marginBottom: 6,
  },
  categoryScrollWrapper: {
    marginVertical: 4,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.three,
  },
  secondaryFilterBar: {
    marginTop: 6,
    marginBottom: 6,
  },
  secondaryScrollContent: {
    paddingHorizontal: Spacing.three,
    gap: 8,
    alignItems: 'center',
  },
  sortButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: BrandColors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  miniChip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  miniChipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: BrandColors.primary,
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: BrandColors.gray600,
  },
  miniChipTextSelected: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: Spacing.three,
    paddingTop: 8,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  countText: {
    fontSize: 12,
    color: BrandColors.gray500,
  },
  countBold: {
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.four,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.gray900,
    marginBottom: Spacing.three,
  },
  sortOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sortOptionItemSelected: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
  },
  sortOptionText: {
    fontSize: 14,
    color: BrandColors.gray700,
    fontWeight: '500',
  },
  sortOptionTextSelected: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
});
