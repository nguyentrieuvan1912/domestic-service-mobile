import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CustomerBookings, ConnectedBooking } from '@/data/connectedBookings';
import { operationRequest } from '@/api/operations';
import type { Staff } from '@/types/user';
export interface StoredInvoice { id: number; bookingId: number; invoiceNumber: string; issuedAt: string; status: string; totalAmount: number }
export function staffView(raw: Record<string, unknown>): Staff {
  return { ...raw, id: String(raw.id), userId: String(raw.id), avatar: String(raw.avatar || ''), phone: '', email: '', fullName: String(raw.fullName || ''), dateOfBirth: String(raw.dateOfBirth || ''), rating: Number(raw.rating || 0), reviewCount: Number(raw.reviewCount || 0), completedBookingsCount: Number(raw.completedBookingsCount || 0), isVerified: !!raw.isVerified, operatingDistricts: [], competencies: Array.isArray(raw.competencies)?raw.competencies.map(String):[], specialties: [], bio: String(raw.bio || ''), gender: raw.gender === 'FEMALE' ? 'FEMALE' : 'MALE', experienceYears: Number(raw.experienceYears || 0), status: String(raw.status || 'OFFLINE'), isOnline: !!raw.isOnline, idCardNumber: '', completionRate: 0, satisfactionRate: 0, createdAt: '' } as Staff;
}
export function useBookingDetail(id: string | undefined) {
  const { currentCustomer } = useAuth();
  const owner = currentCustomer?.id;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ owner?: string; booking?: ConnectedBooking; staff?: Staff; invoice?: StoredInvoice; error: string; loading: boolean }>({ error: '', loading: true });
  useFocusEffect(useCallback(() => {
    let active = true;
    if (!owner || !id || !/^\d+$/.test(id)) { setState({ owner, error: 'Vui lòng đăng nhập và mở một đơn hàng hợp lệ.', loading: false }); return; }
    const load = async () => {
      try {
        const booking = await CustomerBookings.detail(id);
        const [directory, invoices] = await Promise.all([operationRequest<Record<string, unknown>[]>('identity', '/staff-directory'), operationRequest<StoredInvoice[]>('finance', '/invoices')]);
        if (!active) return;
        const selected = booking.staff && booking.staff.fullName ? booking.staff : directory.find(s => String(s.id) === booking.staffId);
        setState({ owner, booking, staff: selected ? staffView(selected) : undefined, invoice: invoices.find(i => String(i.bookingId) === id), error: '', loading: false });
      } catch (error) { if (active) setState({ owner, error: error instanceof Error ? error.message : 'Chưa tải được đơn hàng.', loading: false }); }
    };
    void load(); const timer = setInterval(() => void load(), 5000);
    return () => { active = false; clearInterval(timer); };
  }, [id, owner, attempt]));
  return { ...(state.owner === owner ? state : { error: '', loading: !!owner }), retry: () => setAttempt(x => x + 1) };
}
