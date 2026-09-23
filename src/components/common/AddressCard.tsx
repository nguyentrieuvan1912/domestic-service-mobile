import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { CustomerAddress } from '@/types/user';
import { IconSymbol } from './IconSymbol';

interface AddressCardProps {
  address: CustomerAddress;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  showActions?: boolean;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  showActions = false,
}) => {
  return (
    <Pressable
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onSelect}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <IconSymbol
            name={address.title.includes('quan') || address.title.includes('phòng') ? 'work' : 'home'}
            size={18}
            color={BrandColors.primary}
          />
          <Text style={styles.titleText}>{address.title}</Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Mặc định</Text>
            </View>
          )}
        </View>

        {onSelect && (
          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        )}
      </View>

      <Text style={styles.contactText}>
        {address.recipientName} • {address.recipientPhone}
      </Text>

      <Text style={styles.addressText}>{address.fullAddress}</Text>

      {address.note ? (
        <Text style={styles.noteText}>Ghi chú: {address.note}</Text>
      ) : null}

      {showActions && (
        <View style={styles.actionRow}>
          {!address.isDefault && onSetDefault && (
            <Pressable style={styles.actionBtn} onPress={onSetDefault}>
              <Text style={styles.actionBtnTextPrimary}>Đặt làm mặc định</Text>
            </Pressable>
          )}
          {onEdit && (
            <Pressable style={styles.actionBtn} onPress={onEdit}>
              <Text style={styles.actionBtnText}>Chỉnh sửa</Text>
            </Pressable>
          )}
          {onDelete && !address.isDefault && (
            <Pressable style={styles.actionBtn} onPress={onDelete}>
              <Text style={styles.actionBtnTextDanger}>Xóa</Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.two,
  },
  containerSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  defaultBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: BrandColors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.primary,
  },
  contactText: {
    fontSize: 13,
    color: BrandColors.gray700,
    fontWeight: '500',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: BrandColors.gray600,
    lineHeight: 18,
  },
  noteText: {
    fontSize: 12,
    color: BrandColors.gray500,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: Spacing.two,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.gray600,
  },
  actionBtnTextPrimary: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  actionBtnTextDanger: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.danger,
  },
});
