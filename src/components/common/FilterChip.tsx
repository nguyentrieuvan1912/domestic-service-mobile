import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius } from '@/constants/theme';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isSelected,
  onPress,
  icon,
}) => {
  return (
    <Pressable
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  chipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: BrandColors.primary,
  },
  icon: {
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    color: BrandColors.gray600,
    fontWeight: '500',
  },
  labelSelected: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
});
