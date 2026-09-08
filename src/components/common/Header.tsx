import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { BrandColors, Spacing, BorderRadius } from '@/constants/theme';
import { IconSymbol } from './IconSymbol';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  onBack,
  rightAction,
  style,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showBack ? (
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={10}>
          <IconSymbol name="back" size={26} color={BrandColors.gray800} />
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {rightAction ? (
        <View style={styles.rightAction}>{rightAction}</View>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

interface RatingStarsProps {
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
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.two,
    backgroundColor: BrandColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginHorizontal: Spacing.one,
  },
  placeholder: {
    width: 40,
  },
  rightAction: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontWeight: '700',
    color: BrandColors.gray800,
  },
  reviewCountText: {
    color: BrandColors.gray500,
    fontWeight: '400',
  },
});
