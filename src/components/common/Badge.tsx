import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

export type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'accent';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: BrandColors.successLight, text: '#065F46' };
      case 'warning':
        return { bg: BrandColors.accentLight, text: '#92400E' };
      case 'danger':
        return { bg: BrandColors.dangerLight, text: '#991B1B' };
      case 'info':
        return { bg: BrandColors.infoLight, text: '#1E40AF' };
      case 'accent':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'neutral':
        return { bg: BrandColors.gray100, text: BrandColors.gray700 };
      case 'primary':
      default:
        return { bg: BrandColors.primaryLight, text: BrandColors.primaryDark };
    }
  };

  const { bg, text } = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        size === 'sm' && styles.badgeSm,
        size === 'lg' && styles.badgeLg,
        style,
      ]}>
      <Text
        style={[
          styles.text,
          { color: text },
          size === 'sm' && styles.textSm,
          size === 'lg' && styles.textLg,
          textStyle,
        ]}>
        {label}
      </Text>
    </View>
  );
};

export const formatVND = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + 'đ';
};

interface PriceTagProps {
  amount: number;
  unit?: string;
  originalAmount?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  amount,
  unit,
  originalAmount,
  size = 'md',
  style,
}) => {
  return (
    <View style={[styles.priceContainer, style]}>
      <Text
        style={[
          styles.priceText,
          size === 'sm' && styles.priceSm,
          size === 'lg' && styles.priceLg,
          size === 'xl' && styles.priceXl,
        ]}>
        {formatVND(amount)}
        {unit ? <Text style={styles.unitText}>/{unit}</Text> : null}
      </Text>
      {originalAmount && originalAmount > amount ? (
        <Text style={styles.originalPriceText}>{formatVND(originalAmount)}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeLg: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textLg: {
    fontSize: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  priceSm: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceLg: {
    fontSize: 18,
    fontWeight: '800',
  },
  priceXl: {
    fontSize: 22,
    fontWeight: '900',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '500',
    color: BrandColors.gray500,
  },
  originalPriceText: {
    fontSize: 12,
    color: BrandColors.gray400,
    textDecorationLine: 'line-through',
  },
});
