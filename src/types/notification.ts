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
  data?: { bookingId?: string; [key: string]: any };
  isRead: boolean;
  createdAt: string;
}

export type Notification = AppNotification;

