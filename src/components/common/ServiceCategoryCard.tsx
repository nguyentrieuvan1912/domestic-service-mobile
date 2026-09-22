import React from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { CategoryInfo } from '@/types/service';
import { CATEGORY_ICONS } from '@/constants/categoryIcons';

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
  const iconSource = category.image || CATEGORY_ICONS[category.id];

  if (compact) {
    return (
      <Pressable
        style={[styles.compactContainer, isSelected && styles.compactSelected]}
        onPress={onPress}>
        {iconSource ? (
          <Image source={iconSource} style={styles.compactImage} resizeMode="contain" />
        ) : (
          <Text style={styles.compactIcon}>{category.icon}</Text>
        )}
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
        {iconSource ? (
          <Image source={iconSource} style={styles.iconImage} resizeMode="contain" />
        ) : (
          <Text style={styles.iconText}>{category.icon}</Text>
        )}
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
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3.5,
  },
  iconImage: {
    width: 52,
    height: 52,
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
  compactImage: {
    width: 18,
    height: 18,
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
