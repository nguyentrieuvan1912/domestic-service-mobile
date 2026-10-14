import { operationRequest, operationSession, subscribeSession } from '@/api/operations';
import type { Booking } from '@/types/booking';
import type { Service } from '@/types/service';
import type { Staff, CustomerAddress } from '@/types/user';
export interface ConnectedBooking extends Booking { staff?: Record<string,unknown>; service: { image?: string; name?: string; serviceName?: string; packageName?: string; answers?: Record<string, unknown> }; address: CustomerAddress; assignments: { staffId: string; status: string; executionStatus: string; staffSnapshot?: Record<string,unknown> }[]; startsAt: string; endsAt: string; paymentStatus: string; paymentMethod: string }
let items: ConnectedBooking[] = [], owner = '';
const listeners = new Set<() => void>();
function notify() { listeners.forEach(listener => { try { listener(); } catch { /* A login change can unmount a subscriber. */ } }); }
subscribeSession(() => { const next = operationSession()?.profile.role === 'CUSTOMER' ? operationSession()!.userId : ''; if (owner !== next) { owner = next; items = []; notify(); } });
export const bookingView = (raw: Record<string, unknown>): ConnectedBooking => ({ ...raw, id: String(raw.id), customerId: String(raw.customerId), serviceId: String(raw.serviceId), packageId: String(raw.packageId || ''), addressId: String(raw.addressId), staffId: raw.staffId == null ? undefined : String(raw.staffId), addOns: (raw.addOns as Booking['addOns']).map(item => ({ ...item, addOnId: String(item.addOnId) })), assignments: (raw.assignments as ConnectedBooking['assignments']).map(item => ({ ...item, staffId: String(item.staffId) })) } as ConnectedBooking);
function customerSession() { const active=operationSession();if(!active || active.profile.role!=='CUSTOMER')throw new Error('Vui lòng đăng nhập tài khoản khách hàng.');return active; }
export const CustomerBookings = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  list: () => items,
  get: (id: string) => items.find(item => item.id === id),
  async load() { const session = operationSession(); if (!session || session.profile.role !== 'CUSTOMER') { items = []; notify(); return; } const data = await operationRequest<Record<string, unknown>[]>('booking', '/bookings'); if (session.token === operationSession()?.token) { items = data.map(bookingView); notify(); } },
  async detail(id: string) { customerSession(); const item = bookingView(await operationRequest<Record<string, unknown>>('booking', '/bookings/' + id)); items = [item, ...items.filter(b => b.id !== id)]; notify(); return item; },
  async cancel(id: string, reason: string) { customerSession(); const item = bookingView(await operationRequest<Record<string, unknown>>('booking', '/bookings/' + id + '/cancel', 'POST', { reason })); items = items.map(b => b.id === id ? item : b); notify(); return item; },
};
export const bookingServiceView = (b: ConnectedBooking): Service => ({ id: b.serviceId, categoryId: undefined, category: 'OTHER_SERVICES', name: b.service.name || b.service.serviceName || '', serviceName: b.service.name || b.service.serviceName || '', description: '', shortDescription: '', basePrice: b.packagePrice, price: b.packagePrice, unit: 'gói', duration: '', image: b.service.image || '', rating: 0, reviewCount: 0, isPopular: false, isActive: true, status: 'ACTIVE', highlightBadges: [], dynamicFieldType: 'GENERAL' });
export function bookingStaffView(id: string, directory: Staff[]): Staff | undefined { return directory.find(item => item.id === id); }
