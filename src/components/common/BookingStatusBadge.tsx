import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookingStatus } from '@/types/booking';
import { BrandColors } from '@/constants/theme';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md';
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getStatusConfig = (st: BookingStatus) => {
    switch (st) {
      case 'PENDING':
        return { label: 'Chờ xác nhận', bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' };
      case 'MATCHING':
        return { label: 'Đang tìm thợ', bg: '#EDE9FE', text: '#7C3AED', dot: '#8B5CF6' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận', bg: '#E0F2FE', text: '#0284C7', dot: '#38BDF8' };
      case 'STAFF_ASSIGNED':
      case 'ASSIGNED':
      case 'ACCEPTED':
        return { label: 'Đã có thợ nhận', bg: '#CCFBF1', text: '#0D9488', dot: '#14B8A6' };
      case 'IN_PROGRESS':
        return { label: 'Đang thực hiện', bg: '#DCFCE7', text: '#16A34A', dot: '#22C55E' };
      case 'COMPLETED':
        return { label: 'Hoàn thành', bg: '#F0FDF4', text: '#15803D', dot: '#16A34A' };
      case 'CANCELLED':
        return { label: 'Đã hủy', bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' };
      case 'REFUNDING':
        return { label: 'Đang hoàn tiền', bg: '#FFF7ED', text: '#EA580C', dot: '#F97316' };
      case 'REFUNDED':
        return { label: 'Đã hoàn tiền', bg: '#F1F5F9', text: '#475569', dot: '#64748B' };
      case 'NO_STAFF_FOUND':
        return { label: 'Không tìm thấy thợ', bg: '#FFE4E6', text: '#E11D48', dot: '#F43F5E' };
      case 'ABSENT':
        return { label: 'Khách vắng mặt', bg: '#FEF9C3', text: '#CA8A04', dot: '#EAB308' };
      case 'REJECTED':
        return { label: 'Bị từ chối', bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' };
      default:
        return { label: st, bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' };
    }
  };

  const config = getStatusConfig(status);
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSm && styles.badgeSm]}>
      <View style={[styles.dot, { backgroundColor: config.dot }, isSm && styles.dotSm]} />
      <Text style={[styles.text, { color: config.text }, isSm && styles.textSm]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotSm: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSm: {
    fontSize: 11,
    fontWeight: '600',
  },
});
