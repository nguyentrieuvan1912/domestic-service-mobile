import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { formatVND } from './Badge';

interface PriceSummaryItem {
  label: string;
  amount: number;
  isNegative?: boolean;
}

interface PriceSummaryProps {
  packagePrice: number;
  packageName?: string;
  addOns?: { name: string; price: number; quantity: number }[];
  staffCount?: number;
  discountAmount?: number;
  voucherCode?: string;
  totalAmount: number;
  showDetails?: boolean;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  packagePrice,
  packageName,
  addOns = [],
  staffCount = 1,
  discountAmount = 0,
  voucherCode,
  totalAmount,
  showDetails = true,
}) => {
  const effectivePackagePrice = packagePrice * Math.max(1, staffCount);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Chi tiết chi phí</Text>

      {showDetails && (
        <View style={styles.detailsBlock}>
          {/* Base package price */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              {packageName || 'Giá gói dịch vụ'}
              {staffCount > 1 ? ` (x${staffCount} nhân viên)` : ''}
            </Text>
            <Text style={styles.rowValue}>{formatVND(effectivePackagePrice)}</Text>
          </View>

          {/* Add-ons list */}
          {addOns.map((add, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.rowLabelSub}>
                + {add.name} {add.quantity > 1 ? `(x${add.quantity})` : ''}
              </Text>
              <Text style={styles.rowValueSub}>
                {formatVND(add.price * (add.quantity || 1))}
              </Text>
            </View>
          ))}

          {/* Discount voucher */}
          {discountAmount > 0 && (
            <View style={styles.row}>
              <Text style={styles.discountLabel}>
                Mã ưu đãi {voucherCode ? `(${voucherCode})` : ''}
              </Text>
              <Text style={styles.discountValue}>-{formatVND(discountAmount)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Total row */}
      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>Tổng cộng thanh toán</Text>
          <Text style={styles.taxNote}>(Đã bao gồm thuế GTGT & bảo hiểm)</Text>
        </View>
        <Text style={styles.totalValue}>{formatVND(totalAmount)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
    marginBottom: Spacing.two,
  },
  detailsBlock: {
    gap: 8,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 13,
    color: BrandColors.gray700,
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.gray900,
  },
  rowLabelSub: {
    fontSize: 12,
    color: BrandColors.gray500,
    paddingLeft: 8,
  },
  rowValueSub: {
    fontSize: 12,
    color: BrandColors.gray600,
  },
  discountLabel: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.gray900,
  },
  taxNote: {
    fontSize: 10,
    color: BrandColors.gray400,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandColors.primary,
  },
});
