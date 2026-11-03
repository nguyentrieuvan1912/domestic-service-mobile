export type BookingQrIntent = { id: number; bookingId?: number | null; amount: number; amountReceived: number; status: string; qrCode: string | null; accountNumber: string | null; accountName: string | null; bankBin?: string | null; description: string; expiresAt: string };
type Request = <T>(service: string, path: string, method?: string, body?: unknown, signal?: AbortSignal) => Promise<T>;

/** Only QR collection is automatic. Wallet debits still require an explicit customer action. */
export async function prepareBookingQr(booking: { id: string; status: string; paymentMethod: string }, existing: BookingQrIntent | null, request: Request, signal?: AbortSignal): Promise<BookingQrIntent | null> {
  if (booking.status !== 'AWAITING_PAYMENT' || booking.paymentMethod !== 'BANK_TRANSFER_QR') return null;
  if (existing && existing.status !== 'CREATING') return existing;
  // Finance pins the amount to the booking and reuses its durable booking-specific provider intent.
  const result = await request<{ topup?: BookingQrIntent }>('finance', `/customer/bookings/${booking.id}/pay`, 'POST', undefined, signal);
  return result.topup || null;
}
