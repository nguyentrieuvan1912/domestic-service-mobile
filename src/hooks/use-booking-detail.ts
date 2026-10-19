import { staffRating } from '@/utils/staff-profile';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { CustomerBookings, ConnectedBooking } from '@/data/connectedBookings';
import { operationRequest } from '@/api/operations';
import type { Staff } from '@/types/user';
export interface StoredInvoice { id: number; bookingId: number; invoiceNumber: string; issuedAt: string; status: string; totalAmount: number }
export function staffView(raw: Record<string, unknown>): Staff {
  const eligibleServices = Array.isArray(raw.eligibleServices) ? raw.eligibleServices.map(item => ({ id: String(item.id), name: String(item.name) })) : [];
  return { ...raw, eligibleServices, id: String(raw.id), userId: String(raw.id), avatar: String(raw.avatar || '/api/v1/identity/staff-avatar.png'), phone: '', email: '', fullName: String(raw.fullName || ''), dateOfBirth: String(raw.dateOfBirth || ''), birthYear: raw.birthYear ? Number(raw.birthYear) : undefined, rating: staffRating(Number(raw.rating ?? 5), Number(raw.reviewCount || 0)), reviewCount: Number(raw.reviewCount || 0), completedBookingsCount: Number(raw.completedBookingsCount || 0), isVerified: !!raw.isVerified, operatingDistricts: Array.isArray(raw.operatingDistricts)?raw.operatingDistricts.map(String):[], competencies: Array.isArray(raw.competencies)?raw.competencies.map(String):[], specialties: eligibleServices.map(item => item.name), bio: String(raw.bio || ''), gender: raw.gender === 'FEMALE' ? 'FEMALE' : raw.gender === 'MALE' ? 'MALE' : 'OTHER', experienceYears: Number(raw.experienceYears || 0), status: String(raw.status || 'OFFLINE'), isOnline: !!raw.isOnline, idCardNumber: '', completionRate: 0, satisfactionRate: 0, createdAt: '' } as Staff;
}
export function useBookingDetail(id: string | undefined) {
  const { currentCustomer } = useAuth();
  const owner = currentCustomer?.id;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ owner?: string; booking?: ConnectedBooking; staff?: Staff; invoice?: StoredInvoice; error: string; loading: boolean }>({ error: '', loading: true });
  useFocusEffect(useCallback(() => {
    let active = true, inFlight=false;
    if (!owner || !id || !/^\d+$/.test(id)) { setState({ owner, error: 'Vui lòng đăng nhập và mở một đơn hàng hợp lệ.', loading: false }); return; }
    const load = async () => {
      if(inFlight || !active || AppState.currentState !== 'active') return;
      inFlight=true;
      try {
        const booking = await CustomerBookings.detail(id);
        // Accepted bookings already carry the persisted staff snapshot.
        const needsDirectory=!!booking.staffId && !booking.staff?.fullName;
        const [directory, invoices] = await Promise.all([needsDirectory ? operationRequest<Record<string, unknown>[]>('identity', '/staff-directory') : Promise.resolve([]), operationRequest<StoredInvoice[]>('finance', '/invoices')]);
        if (!active) return;
        const selected = booking.staff && booking.staff.fullName ? booking.staff : directory.find(s => String(s.id) === booking.staffId);
        setState({ owner, booking, staff: selected ? staffView(selected) : undefined, invoice: invoices.find(i => String(i.bookingId) === id), error: '', loading: false });
      } catch (error) { if (active) setState({ owner, error: error instanceof Error ? error.message : 'Chưa tải được đơn hàng.', loading: false }); }
      finally { inFlight=false; }
    };
    void load(); const timer = setInterval(() => void load(), 5000);
    const foreground=AppState.addEventListener('change',state=>{if(state==='active')void load();});
    return () => { active = false; clearInterval(timer); foreground.remove(); };
  }, [id, owner, attempt]));
  return { ...(state.owner === owner ? state : { error: '', loading: !!owner }), retry: () => setAttempt(x => x + 1) };
}
