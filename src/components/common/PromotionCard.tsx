import { View } from 'react-native';
import type { Promotion } from '@/types/service';
import { VoucherTicket } from './VoucherTicket';

interface PromotionCardProps { promotion: Promotion; onApply?: () => void; isApplied?: boolean }

export function PromotionCard({ promotion, onApply, isApplied }: PromotionCardProps) {
  return <View style={{ marginBottom: 12 }}><VoucherTicket promotion={promotion} onPress={onApply} selected={isApplied} actionLabel="Dùng ngay" /></View>;
}
