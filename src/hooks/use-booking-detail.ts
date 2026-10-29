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
interface DetailState {
  owner?: string; id?: string; booking?: ConnectedBooking; staff?: Staff; invoice?: StoredInvoice;
  error: string; refreshError: string; invoiceError: string; invoiceLoading: boolean; loading: boolean;
}
export function useBookingDetail(id: string | undefined) {
  const { currentCustomer, accessToken } = useAuth();
  const owner = currentCustomer?.id;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DetailState>({ error: '', refreshError: '', invoiceError: '', invoiceLoading: true, loading: true });
  useFocusEffect(useCallback(() => {
    let active = true, inFlight = false, auxiliaryLoading = false, auxiliaryLoadedAt = 0;
    const controller = new AbortController();
    const empty: DetailState = { owner, id, error: '', refreshError: '', invoiceError: '', invoiceLoading: true, loading: true };
    if (!owner || !id || !/^\d+$/.test(id)) { setState({ ...empty, error: 'Vui lòng đăng nhập và mở một đơn hàng hợp lệ.', loading: false }); return; }
    const cached = CustomerBookings.get(id);
    setState(previous => previous.owner === owner && previous.id === id ? { ...previous, error: '', refreshError: '' }
      : { ...empty, booking: cached?.customerId === owner ? cached : undefined });
    const enrich = (booking: ConnectedBooking) => {
      if (auxiliaryLoading || Date.now() - auxiliaryLoadedAt < 60000) return;
      auxiliaryLoading = true;
      const needsDirectory = !!booking.staffId && !booking.staff?.fullName;
      void Promise.allSettled([
        needsDirectory ? operationRequest<Record<string, unknown>[]>('identity', '/staff-directory', 'GET', undefined, controller.signal) : Promise.resolve([]),
        operationRequest<StoredInvoice[]>('finance', '/invoices', 'GET', undefined, controller.signal),
      ]).then(([directory, invoices]) => {
        if (!active || controller.signal.aborted) return;
        auxiliaryLoadedAt = Date.now();
        setState(previous => {
          if (previous.owner !== owner || previous.id !== id) return previous;
          const selected = directory.status === 'fulfilled' ? directory.value.find(item => String(item.id) === previous.booking?.staffId) : undefined;
          return { ...previous, invoiceLoading: false, staff: previous.staff || (selected ? staffView(selected) : undefined),
            ...(invoices.status === 'fulfilled' ? { invoice: invoices.value.find(item => String(item.bookingId) === id), invoiceError: '' }
              : { invoiceError: invoices.reason instanceof Error ? invoices.reason.message : 'Chưa tải được hóa đơn.' }) };
        });
      }).finally(() => { auxiliaryLoading = false; });
    };
    const load = async () => {
      if (inFlight || !active || AppState.currentState !== 'active') return;
      inFlight = true;
      try {
        const booking = await CustomerBookings.detail(id, controller.signal);
        if (!active || controller.signal.aborted) return;
        // Render the owned booking immediately; optional services cannot hide it.
        setState(previous => ({ ...(previous.owner === owner && previous.id === id ? previous : empty), owner, id, booking,
          ...(booking.staff?.fullName ? { staff: staffView(booking.staff) } : {}), error: '', refreshError: '', loading: false }));
        enrich(booking);
      } catch (error) {
        if (active && !controller.signal.aborted) setState(previous => {
          const scoped = previous.owner === owner && previous.id === id ? previous : empty;
          const message = error instanceof Error ? error.message : 'Chưa tải được đơn hàng.';
          return { ...scoped, error: scoped.booking ? '' : message, refreshError: scoped.booking ? message : '', loading: false };
        });
      } finally { inFlight = false; }
    };
    void load();
    const timer = setInterval(() => void load(), 5000);
    const foreground = AppState.addEventListener('change', next => { if (next === 'active') void load(); });
    return () => { active = false; controller.abort(); clearInterval(timer); foreground.remove(); };
  }, [id, owner, accessToken, attempt]));
  return { ...(state.owner === owner && state.id === id ? state : { error: '', refreshError: '', invoiceError: '', invoiceLoading: true, loading: !!owner }), retry: () => setAttempt(value => value + 1) };
}
