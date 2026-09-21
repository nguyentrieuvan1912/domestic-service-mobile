import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { CategoryInfo } from '@/types/service';

interface ServiceCategoryCardProps {
  category: CategoryInfo;
  onPress: () => void;
  isSelected?: boolean;
  compact?: boolean;
}

export const ServiceCategoryCard: React.FC<ServiceCategoryCardProps> = ({
  category,
  onPress,
  isSelected,
  compact = false,
}) => {
  if (compact) {
    return (
      <Pressable
        style={[styles.compactContainer, isSelected && styles.compactSelected]}
        onPress={onPress}>
        <Text style={styles.compactIcon}>{category.icon}</Text>
        <Text
          numberOfLines={1}
          style={[styles.compactName, isSelected && styles.compactNameSelected]}>
          {category.name}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.cardContainer, isSelected && styles.cardSelected]}
      onPress={onPress}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>{category.icon}</Text>
      </View>
      <Text numberOfLines={2} style={styles.categoryName}>
        {category.name}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '23%',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  cardSelected: {
    transform: [{ scale: 1.05 }],
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconText: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.gray800,
    textAlign: 'center',
    lineHeight: 14,
    height: 28,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    gap: 6,
  },
  compactSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: BrandColors.primary,
  },
  compactIcon: {
    fontSize: 16,
  },
  compactName: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray700,
  },
  compactNameSelected: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
});
