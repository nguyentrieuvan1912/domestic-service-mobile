import type { AppNotification } from '../types/notification';
import { mockNotifications } from './notifications';
import { mockBookings } from './bookings';
import { mockCustomers } from './customers';
import { mockPayments } from './payments';
import { mockRefunds } from './refunds';
import { mockStaffRestrictions } from './staffRestrictions';
import { StaffRepository } from './staffRepository';
import { getStaffIdByUserId } from './staffMapping';
import { getNotificationTarget, isNotificationActorValid, ownsNotification } from './notificationAdapter';
import type { NotificationActor } from './notificationAdapter';
import { notificationInvitationFixtures, notificationWithdrawalFixtures } from './notificationTargetFixtures';

export type NotificationDestination =
  | { pathname: '/staff/job-detail'; params: { id: string } }
  | { pathname: '/booking/[id]'; params: { id: string } };
export type NotificationTargetResult =
  | { kind: 'AVAILABLE'; destination: NotificationDestination; actionLabel: string }
  | { kind: 'DETAIL_ONLY'; reason: string; summary?: string; statusLabel?: string }
  | { kind: 'UNAVAILABLE' | 'FORBIDDEN'; reason: string };
const clone = (item: AppNotification): AppNotification => ({ ...item,
  ...(item.target ? { target: { ...item.target } } : {}), ...(item.data ? { data: { ...item.data } } : {}),
});
const store = mockNotifications.map(clone);
const listeners = new Set<() => void>();
const snapshots = new Map<string, readonly AppNotification[]>();
let revision = 0;
export const NOTIFICATION_DEMO_CONFIG = { latencyMs: 300, failNextLoad: false, failNextRead: false };
function notify(): void { revision += 1; snapshots.clear(); listeners.forEach((listener) => listener()); }
function delay(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); reject(new Error('Đã hủy thao tác.')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, NOTIFICATION_DEMO_CONFIG.latencyMs);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
  });
}
export const NotificationRepository = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  getRevision(): number { return revision; },
  // Stable immutable snapshots are required by useSyncExternalStore/React Compiler.
  getSnapshot(actor: NotificationActor | null): readonly AppNotification[] {
    const key = actor ? actor.role + ':' + actor.userId : '';
    const cached = snapshots.get(key);
    if (cached) return cached;
    const items = this.list(actor);
    items.forEach((item) => {
      if (item.target) Object.freeze(item.target);
      if (item.data) Object.freeze(item.data);
      Object.freeze(item);
    });
    const snapshot = Object.freeze(items);
    snapshots.set(key, snapshot);
    return snapshot;
  },
  list(actor: NotificationActor | null): AppNotification[] {
    return store.filter((item) => ownsNotification(item, actor)).map(clone)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
  },
  get(actor: NotificationActor | null, id: string): AppNotification {
    const item = store.find((notification) => notification.id === id);
    if (!item) throw new Error('Không tìm thấy thông báo này.');
    if (!ownsNotification(item, actor)) throw new Error('Bạn không có quyền xem thông báo này.');
    return clone(item);
  },
  unreadCount(actor: NotificationActor | null): number { return this.list(actor).filter((item) => !item.isRead).length; },
  async load(actor: NotificationActor | null, signal?: AbortSignal): Promise<AppNotification[]> {
    await delay(signal);
    if (signal?.aborted) throw new Error('Đã hủy thao tác.');
    if (!isNotificationActorValid(actor)) throw new Error('Vui lòng đăng nhập bằng tài khoản hợp lệ để xem thông báo.');
    if (NOTIFICATION_DEMO_CONFIG.failNextLoad) {
      NOTIFICATION_DEMO_CONFIG.failNextLoad = false;
      throw new Error('Chưa tải được thông báo. Vui lòng thử lại.');
    }
    return this.list(actor);
  },
  async markRead(actor: NotificationActor, id?: string, signal?: AbortSignal): Promise<number> {
    await delay(signal);
    if (signal?.aborted) throw new Error('Đã hủy thao tác.');
    if (!isNotificationActorValid(actor)) throw new Error('Tài khoản không hợp lệ. Vui lòng đăng nhập lại.');
    if (id !== undefined) this.get(actor, id);
    if (NOTIFICATION_DEMO_CONFIG.failNextRead) {
      NOTIFICATION_DEMO_CONFIG.failNextRead = false;
      throw new Error('Chưa cập nhật trạng thái đã đọc. Vui lòng thử lại.');
    }
    let changed = 0;
    store.forEach((item) => {
      if (ownsNotification(item, actor) && (id === undefined || item.id === id) && !item.isRead) { item.isRead = true; changed += 1; }
    });
    if (changed) notify();
    return changed;
  },
  resolveTarget(actor: NotificationActor | null, notificationId: string): NotificationTargetResult {
    let item: AppNotification;
    try { item = this.get(actor, notificationId); }
    catch (error) { return { kind: 'FORBIDDEN', reason: error instanceof Error ? error.message : 'Không thể mở thông báo.' }; }
    if (!actor) return { kind: 'FORBIDDEN', reason: 'Vui lòng đăng nhập lại.' };
    const target = getNotificationTarget(item);
    if (!target) return { kind: 'DETAIL_ONLY', reason: 'Thông báo này không có nội dung liên kết.' };
    const staffId = actor.role === 'STAFF' ? getStaffIdByUserId(actor.userId) : undefined;
    if (actor.role === 'STAFF' && !staffId) return { kind: 'FORBIDDEN', reason: 'Tài khoản chưa liên kết hồ sơ nhân viên.' };
    if (target.type === 'BOOKING' || target.type === 'OPPORTUNITY') {
      if (staffId) {
        const detail = StaffRepository.getJobDetail(staffId, target.id);
        if (detail.kind === 'ASSIGNMENT' && detail.assignment.staffId === staffId) {
          return { kind: 'AVAILABLE', destination: { pathname: '/staff/job-detail', params: { id: detail.assignment.id } }, actionLabel: 'Xem ca làm việc' };
        }
        if (target.type === 'OPPORTUNITY' && detail.kind === 'OPEN_OPPORTUNITY') {
          return { kind: 'AVAILABLE', destination: { pathname: '/staff/job-detail', params: { id: detail.opportunity.id } }, actionLabel: 'Xem việc còn trống' };
        }
        return { kind: detail.kind === 'FORBIDDEN' ? 'FORBIDDEN' : 'UNAVAILABLE', reason: detail.kind === 'FORBIDDEN'
          ? 'Ca làm việc không thuộc quyền truy cập của bạn.' : 'Ca hoặc vị trí việc làm không còn khả dụng.' };
      }
      const customer = mockCustomers.find((person) => person.userId === actor.userId);
      const booking = mockBookings.find((booking) => booking.id === target.id);
      if (!booking) return { kind: 'UNAVAILABLE', reason: 'Đơn hàng liên kết không còn khả dụng.' };
      if (actor.role !== 'CUSTOMER' || !customer || booking.customerId !== customer.id) return { kind: 'FORBIDDEN', reason: 'Bạn không có quyền xem đơn hàng này.' };
      return { kind: 'AVAILABLE', destination: { pathname: '/booking/[id]', params: { id: booking.id } }, actionLabel: 'Xem đơn hàng' };
    }
    if (target.type === 'INVITATION' || target.type === 'WITHDRAWAL') {
      const invitation = target.type === 'INVITATION';
      const record = (invitation ? notificationInvitationFixtures : notificationWithdrawalFixtures).find((record) => record.id === target.id);
      if (!record) return { kind: 'UNAVAILABLE', reason: invitation ? 'Lời mời liên kết không còn khả dụng.' : 'Yêu cầu rút liên kết không còn khả dụng.' };
      if (actor.role !== 'STAFF' || record.userId !== actor.userId) return { kind: 'FORBIDDEN', reason: 'Nội dung liên kết này không dành cho bạn.' };
      return { kind: 'DETAIL_ONLY', summary: record.summary, statusLabel: record.statusLabel,
        reason: invitation ? 'Chưa hỗ trợ nhận hoặc từ chối lời mời tại đây. Bạn có thể đọc nội dung lời mời.'
          : 'Màn chi tiết yêu cầu rút chưa khả dụng. Thông báo này chưa xác nhận tiền đã chuyển.' };
    }
    if (target.type === 'TRANSACTION') {
      if (staffId) {
        const transaction = StaffRepository.getWallet(staffId).transactions.find((record) => record.id === target.id);
        if (!transaction) return { kind: 'UNAVAILABLE', reason: 'Giao dịch liên kết không còn khả dụng.' };
        return { kind: 'DETAIL_ONLY', summary: `${transaction.title}: ${transaction.amount.toLocaleString('vi-VN')}đ.`,
          statusLabel: transaction.status === 'PENDING' ? 'Chờ ghi nhận' : 'Đã ghi nhận',
          reason: 'Màn chi tiết giao dịch chưa khả dụng. Bạn có thể xem nội dung thông báo và khoản tiền liên quan.' };
      }
      const customer = mockCustomers.find((person) => person.userId === actor.userId);
      const payment = mockPayments.find((record) => record.id === target.id);
      const refund = mockRefunds.find((record) => record.id === target.id);
      const bookingId = payment?.bookingId ?? refund?.bookingId;
      const booking = mockBookings.find((record) => record.id === bookingId);
      if (!booking) return { kind: 'UNAVAILABLE', reason: 'Giao dịch liên kết không còn khả dụng.' };
      if (actor.role !== 'CUSTOMER' || !customer || booking.customerId !== customer.id) return { kind: 'FORBIDDEN', reason: 'Bạn không có quyền xem giao dịch này.' };
      return { kind: 'AVAILABLE', destination: { pathname: '/booking/[id]', params: { id: booking.id } }, actionLabel: 'Xem đơn hàng liên quan' };
    }
    if (target.type === 'RESTRICTION') {
      const restriction = mockStaffRestrictions.find((record) => record.id === target.id);
      if (!restriction) return { kind: 'UNAVAILABLE', reason: 'Thông tin hạn chế liên kết không còn khả dụng.' };
      if (restriction.staffId !== staffId) return { kind: 'FORBIDDEN', reason: 'Bạn không có quyền xem hạn chế của nhân viên khác.' };
      return { kind: 'DETAIL_ONLY', summary: restriction.reason, statusLabel: restriction.status === 'EXPIRED' ? 'Đã hết hạn' : restriction.status === 'REVOKED' ? 'Đã được gỡ' : 'Đang áp dụng',
        reason: 'Màn quản lý hạn chế chưa khả dụng. Bạn có thể xem nội dung thông báo.' };
    }
    return { kind: 'DETAIL_ONLY', reason: 'Chưa có màn chi tiết riêng cho nội dung liên kết này.' };
  },
};
