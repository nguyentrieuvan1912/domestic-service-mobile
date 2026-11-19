export const BOOKING_PAYMENT_OPTIONS = [
  { id: 'BANK_TRANSFER_QR', name: 'Chuyển khoản QR · payOS', desc: 'Kết nối nhân viên sau khi nhận đủ tiền', icon: 'creditCard' },
  { id: 'WALLET', name: 'Ví của tôi', desc: 'Thanh toán bằng số dư ví. Tiền hoàn được trả về ví', icon: 'wallet' },
  { id: 'CASH', name: 'Tiền mặt', desc: 'Thanh toán sau khi hoàn thành dịch vụ', icon: 'cash' },
] as const;

export type BookingPaymentMethod = typeof BOOKING_PAYMENT_OPTIONS[number]['id'];

export function paymentMethodFromBooking(method: string): BookingPaymentMethod | null {
  return BOOKING_PAYMENT_OPTIONS.find(option => option.id === method)?.id ?? null;
}

export function bookingRequiresPayment(status: string): boolean {
  return status === 'AWAITING_PAYMENT';
}
