import type { Promotion } from '../types/service';
export function promotionIssue(promotion: Promotion, serviceId: string, amount: number, now = Date.now()): string {
  if (Date.parse(promotion.startDate) > now) return 'Mã chưa đến thời gian áp dụng.';
  if (Date.parse(promotion.endDate) <= now) return 'Mã đã hết hạn sử dụng.';
  if (!promotion.isActive) return 'Mã đang tạm ngừng áp dụng.';
  if (promotion.usageLimit != null && promotion.usedCount >= promotion.usageLimit) return 'Mã đã hết lượt sử dụng.';
  if (promotion.serviceIds?.length && !promotion.serviceIds.some(id => String(id) === serviceId)) return 'Mã không áp dụng cho dịch vụ chính đang chọn. Xem danh sách dịch vụ được áp dụng bên dưới.';
  if (amount < promotion.minimumBookingAmount) return `Đơn chưa đạt giá trị tối thiểu ${promotion.minimumBookingAmount.toLocaleString('vi-VN')}đ.`;
  return '';
}
