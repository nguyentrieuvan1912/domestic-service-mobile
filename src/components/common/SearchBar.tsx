import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { IconSymbol } from './IconSymbol';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Tìm kiếm dịch vụ (ví dụ: máy lạnh, dọn nhà...)',
  onClear,
  onSubmit,
}) => {
  return (
    <View style={styles.container}>
      <IconSymbol name="search" size={18} color={BrandColors.gray400} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={BrandColors.gray400}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {value.length > 0 ? (
        <Pressable
          hitSlop={8}
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}>
          <IconSymbol name="close" size={16} color={BrandColors.gray400} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.two,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.gray900,
    paddingVertical: 0,
  },
});
