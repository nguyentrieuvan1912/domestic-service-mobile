import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { Promotion } from '@/types/service';
import { formatVND } from './Badge';

interface PromotionCardProps {
  promotion: Promotion;
  onApply?: () => void;
  isApplied?: boolean;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({
  promotion,
  onApply,
  isApplied,
}) => {
  return (
    <View style={[styles.container, isApplied && styles.containerApplied]}>
      <View style={styles.leftStub}>
        <Text style={styles.ticketIcon}>🎟️</Text>
        <Text style={styles.discountBadge}>
          {promotion.discountType === 'PERCENTAGE'
            ? `-${promotion.discountValue}%`
            : `-${formatVND(promotion.discountValue)}`}
        </Text>
      </View>

      <View style={styles.rightContent}>
        <View style={styles.headerRow}>
          <Text style={styles.promoCode}>{promotion.code}</Text>
          {isApplied ? (
            <View style={styles.appliedBadge}>
              <Text style={styles.appliedText}>Đã áp dụng</Text>
            </View>
          ) : onApply ? (
            <Pressable style={styles.applyBtn} onPress={onApply}>
              <Text style={styles.applyBtnText}>Dùng ngay</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.promoName}>{promotion.name}</Text>
        <Text style={styles.promoDesc}>{promotion.description}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Đơn tối thiểu: {formatVND(promotion.minimumBookingAmount)}
          </Text>
          <Text style={styles.metaText}>HSD: {promotion.endDate}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.two,
  },
  containerApplied: {
    borderColor: BrandColors.primary,
    backgroundColor: '#F0FDF4',
  },
  leftStub: {
    width: 80,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    borderRightWidth: 1,
    borderRightColor: '#D1FAE5',
    borderStyle: 'dashed',
  },
  ticketIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  discountBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandColors.primary,
    textAlign: 'center',
  },
  rightContent: {
    flex: 1,
    padding: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  promoCode: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandColors.gray900,
    letterSpacing: 0.5,
  },
  appliedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  appliedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  applyBtn: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.lg,
  },
  applyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  promoName: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.gray800,
    marginBottom: 2,
  },
  promoDesc: {
    fontSize: 11,
    color: BrandColors.gray500,
    lineHeight: 15,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 10,
    color: BrandColors.gray400,
  },
});
