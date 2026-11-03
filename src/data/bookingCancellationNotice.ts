import { subscribeSession } from '@/api/operations';

type CancelledBooking = { bookingCode: string; status: string; paymentMethod: string; paymentStatus: string };
type Notice = { title: string; message: string; showWallet: boolean };
let notice: Notice | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());
export const getBookingCancellationNotice = () => notice;
export function subscribeBookingCancellationNotice(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function dismissBookingCancellationNotice() { notice = null; notify(); }
subscribeSession(dismissBookingCancellationNotice);

/** Publish only after Booking has persisted the cancellation; refund posting can still be pending. */
export function publishBookingCancellationNotice(booking: CancelledBooking) {
  if (booking.status !== 'CANCELLED') return;
  const prepaid = ['BANK_TRANSFER_QR', 'WALLET'].includes(booking.paymentMethod);
  const confirmed = ['PAID', 'REFUNDED'].includes(booking.paymentStatus);
  const refunded = booking.paymentStatus === 'REFUNDED';
  const refundMessage = refunded
    ? 'Số tiền đã thanh toán đã được cộng vào ví của bạn. Bạn có thể sử dụng số dư ví cho lần đặt dịch vụ sau. Xin cảm ơn quý khách!'
    : confirmed
      ? 'Số tiền đã thanh toán sẽ được cộng vào ví của bạn. Bạn có thể sử dụng số dư ví cho lần đặt dịch vụ sau. Xin cảm ơn quý khách!'
      : 'Nếu quý khách đã chuyển khoản, số tiền sau khi được hệ thống xác minh sẽ được cộng vào ví của bạn và có thể sử dụng cho lần đặt dịch vụ sau. Xin cảm ơn quý khách!';
  notice = { title: 'Đã hủy đơn dịch vụ', message: `Đơn ${booking.bookingCode} đã được hủy.\n\n${prepaid ? refundMessage : 'Xin cảm ơn quý khách!'}`, showWallet: prepaid };
  notify();
}
