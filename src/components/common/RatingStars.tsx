import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BrandColors, Typography } from '@/constants/theme';
import { IconSymbol } from './IconSymbol';

export interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  showScore?: boolean;
  style?: ViewStyle;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  reviewCount,
  size = 14,
  showScore = true,
  style,
}) => {
  return (
    <View style={[styles.ratingRow, style]}>
      <IconSymbol name="star" size={size} color={BrandColors.accent} />
      {showScore && (
        <Text style={[styles.ratingText, { fontSize: size }]}>
          {rating.toFixed(1)}
        </Text>
      )}
      {reviewCount !== undefined && (
        <Text style={[styles.reviewCountText, { fontSize: size * 0.9 }]}>
          ({reviewCount} lượt)
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontWeight: Typography.weights.semiBold,
    color: BrandColors.gray800,
  },
  reviewCountText: {
    color: BrandColors.gray500,
  },
});
