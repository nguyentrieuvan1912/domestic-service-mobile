import type { AppNotification, NotificationTarget } from '../types/notification';
import type { User, UserRole } from '../types/user';
import { mockUsers } from './users';

export const NOTIFICATION_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export interface NotificationActor { userId: string; role: UserRole }
export type NotificationGroup = 'ALL' | 'WORK' | 'SCHEDULE' | 'INCOME' | 'SYSTEM' | 'BOOKING' | 'STAFF' | 'PROMOTION';
export interface NotificationFilter { id: NotificationGroup; label: string }
export const STAFF_NOTIFICATION_FILTERS: readonly NotificationFilter[] = [
  { id: 'ALL', label: 'Tất cả' }, { id: 'WORK', label: 'Lời mời / Việc' },
  { id: 'SCHEDULE', label: 'Lịch ca' }, { id: 'INCOME', label: 'Thu nhập' }, { id: 'SYSTEM', label: 'Hệ thống' },
];
export const CUSTOMER_NOTIFICATION_FILTERS: readonly NotificationFilter[] = [
  { id: 'ALL', label: 'Tất cả' }, { id: 'BOOKING', label: 'Đơn hàng' },
  { id: 'STAFF', label: 'Nhân viên' }, { id: 'PROMOTION', label: 'Khuyến mãi' }, { id: 'SYSTEM', label: 'Hệ thống' },
];
export function getNotificationActor(user: User | null): NotificationActor | null {
  return user ? { userId: user.id, role: user.role } : null;
}
export function isNotificationActorValid(actor: NotificationActor | null): actor is NotificationActor {
  return !!actor && mockUsers.some((user) => user.id === actor.userId && user.role === actor.role);
}
export function ownsNotification(notification: AppNotification, actor: NotificationActor | null): boolean {
  return isNotificationActorValid(actor) && notification.userId === actor.userId && notification.targetRole === actor.role;
}
export function getNotificationTarget(notification: AppNotification): NotificationTarget | undefined {
  if (notification.target) return notification.target;
  if (notification.data?.bookingId) return { type: 'BOOKING', id: notification.data.bookingId };
  const id = notification.referenceId;
  if (!id) return undefined;
  if (notification.type === 'NEW_JOB_AVAILABLE') return { type: 'INVITATION', id };
  if (notification.type === 'INCOME_UPDATE') return { type: 'TRANSACTION', id };
  if (notification.type === 'PROMOTION') return { type: 'PROMOTION', id };
  if (notification.type === 'PAYMENT_SUCCESS' || notification.type === 'REFUND_PROCESSED') return { type: 'TRANSACTION', id };
  if (['BOOKING_CREATED', 'BOOKING_CANCELLED', 'STAFF_ASSIGNED', 'STAFF_ACCEPTED', 'STAFF_ARRIVED',
    'SERVICE_IN_PROGRESS', 'SERVICE_COMPLETED', 'SCHEDULE_UPDATE'].includes(notification.type)) return { type: 'BOOKING', id };
  return { type: 'SYSTEM', id };
}
export function getNotificationGroup(notification: AppNotification): NotificationGroup {
  if (notification.targetRole === 'STAFF') {
    const target = getNotificationTarget(notification);
    if (target?.type === 'INVITATION' || target?.type === 'OPPORTUNITY' || notification.type === 'NEW_JOB_AVAILABLE') return 'WORK';
    if (target?.type === 'TRANSACTION' || target?.type === 'WITHDRAWAL' || notification.type === 'INCOME_UPDATE') return 'INCOME';
    if (target?.type === 'BOOKING') return 'SCHEDULE';
    return 'SYSTEM';
  }
  if (notification.type === 'PROMOTION') return 'PROMOTION';
  if (['STAFF_ASSIGNED', 'STAFF_ACCEPTED', 'STAFF_ARRIVED'].includes(notification.type)) return 'STAFF';
  if (['BOOKING_CREATED', 'BOOKING_CANCELLED', 'SERVICE_IN_PROGRESS', 'SERVICE_COMPLETED'].includes(notification.type)) return 'BOOKING';
  return 'SYSTEM';
}
export function getNotificationPresentation(notification: AppNotification): { label: string; icon: string; background: string } {
  switch (getNotificationGroup(notification)) {
    case 'WORK': return { label: 'Lời mời / Việc', icon: 'users', background: '#DCFCE7' };
    case 'SCHEDULE': return { label: 'Lịch ca', icon: 'calendar', background: '#E0F2FE' };
    case 'INCOME': return { label: 'Thu nhập', icon: 'wallet', background: '#FEF3C7' };
    case 'BOOKING': return { label: 'Đơn hàng', icon: 'calendar', background: '#E0F2FE' };
    case 'STAFF': return { label: 'Nhân viên', icon: 'user', background: '#DCFCE7' };
    case 'PROMOTION': return { label: 'Khuyến mãi', icon: 'gift', background: '#FCE7F3' };
    default: return { label: 'Hệ thống', icon: 'bell', background: '#F1F5F9' };
  }
}
export function formatNotificationTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: NOTIFICATION_TIME_ZONE,
  });
}
