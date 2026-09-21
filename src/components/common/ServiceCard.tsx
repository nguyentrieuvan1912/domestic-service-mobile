import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { Service } from '@/types/service';
import { RatingStars } from './RatingStars';
import { formatVND } from './Badge';

interface ServiceCardProps {
  service: Service;
  onPress: () => void;
  onBookNow?: () => void;
  variant?: 'vertical' | 'horizontal';
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  onBookNow,
  variant = 'vertical',
}) => {
  if (variant === 'horizontal') {
    return (
      <Pressable style={styles.horizontalCard} onPress={onPress}>
        <Image source={{ uri: service.image }} style={styles.horizontalImage} />
        <View style={styles.horizontalBody}>
          <View style={styles.headerRow}>
            <Text numberOfLines={1} style={styles.horizontalTitle}>
              {service.name}
            </Text>
            {service.isPopular && (
              <View style={styles.hotBadge}>
                <Text style={styles.hotBadgeText}>Phổ biến</Text>
              </View>
            )}
          </View>
          <Text numberOfLines={2} style={styles.horizontalDesc}>
            {service.shortDescription || service.description}
          </Text>
          <View style={styles.horizontalFooter}>
            <View>
              <Text style={styles.priceLabel}>Giá từ</Text>
              <Text style={styles.priceValue}>
                {formatVND(service.basePrice)}
                <Text style={styles.unitText}>/{service.unit}</Text>
              </Text>
            </View>
            <RatingStars rating={service.rating} size={12} reviewCount={service.reviewCount} />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.verticalCard} onPress={onPress}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: service.image }} style={styles.verticalImage} />
        {service.isPopular && (
          <View style={styles.floatingHotBadge}>
            <Text style={styles.hotBadgeText}>Hot</Text>
          </View>
        )}
      </View>
      <View style={styles.verticalBody}>
        <Text numberOfLines={1} style={styles.verticalTitle}>
          {service.name}
        </Text>
        <Text numberOfLines={2} style={styles.verticalDesc}>
          {service.shortDescription || service.description}
        </Text>
        <View style={styles.ratingRow}>
          <RatingStars rating={service.rating} size={12} reviewCount={service.reviewCount} />
        </View>
        <View style={styles.verticalFooter}>
          <View>
            <Text style={styles.priceLabel}>Chỉ từ</Text>
            <Text style={styles.priceValue}>
              {formatVND(service.basePrice)}
              <Text style={styles.unitText}>/{service.unit}</Text>
            </Text>
          </View>
          <Pressable
            style={styles.bookButton}
            onPress={(e) => {
              e.stopPropagation();
              if (onBookNow) onBookNow();
              else onPress();
            }}>
            <Text style={styles.bookButtonText}>Đặt lịch</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  verticalCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: Spacing.three,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  imageWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  verticalImage: {
    width: '100%',
    height: '100%',
  },
  floatingHotBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: BrandColors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  verticalBody: {
    padding: Spacing.three,
  },
  verticalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: 4,
  },
  verticalDesc: {
    fontSize: 12,
    color: BrandColors.gray500,
    lineHeight: 16,
    marginBottom: 8,
  },
  ratingRow: {
    marginBottom: 10,
  },
  verticalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  priceLabel: {
    fontSize: 11,
    color: BrandColors.gray400,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '500',
    color: BrandColors.gray500,
  },
  bookButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Horizontal Card
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.two,
    padding: 10,
    gap: 12,
  },
  horizontalImage: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.md,
    backgroundColor: '#E2E8F0',
  },
  horizontalBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    flex: 1,
  },
  hotBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  hotBadgeText: {
    color: BrandColors.danger,
    fontSize: 10,
    fontWeight: '700',
  },
  horizontalDesc: {
    fontSize: 12,
    color: BrandColors.gray500,
    lineHeight: 16,
    marginVertical: 4,
  },
  horizontalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
});
