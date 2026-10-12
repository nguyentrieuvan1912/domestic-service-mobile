export type NotificationType =
  | 'BOOKING_CREATED'
  | 'STAFF_ASSIGNED'
  | 'STAFF_ACCEPTED'
  | 'STAFF_ARRIVED'
  | 'SERVICE_IN_PROGRESS'
  | 'SERVICE_COMPLETED'
  | 'PAYMENT_SUCCESS'
  | 'REFUND_PROCESSED'
  | 'BOOKING_CANCELLED'
  | 'PROMOTION'
  | 'NEW_JOB_AVAILABLE'
  | 'SCHEDULE_UPDATE'
  | 'INCOME_UPDATE'
  | 'SYSTEM';

export interface AppNotification {
  id: string;
  userId: string;
  targetRole: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  title: string;
  content: string;
  type: NotificationType;
  referenceId?: string; // bookingId, promotionId, etc.
  target?: NotificationTarget;
  data?: { bookingId?: string; [key: string]: unknown };
  isRead: boolean;
  createdAt: string;
}

export type Notification = AppNotification;

// Local navigation metadata; does not redefine backend notification DTOs.
export type NotificationTargetType =
  | 'BOOKING' | 'INVITATION' | 'OPPORTUNITY' | 'TRANSACTION' | 'WITHDRAWAL'
  | 'RESTRICTION' | 'PROMOTION' | 'REVIEW' | 'SYSTEM';
export interface NotificationTarget { type: NotificationTargetType; id: string }
