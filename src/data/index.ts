export * from './users';
export * from './customers';
export * from './staffs';
export * from './customerAddresses';
export * from './staffAreas';
export * from './staffAvailabilities';
export * from './staffIncomes';
export * from './staffBalances';
export * from './penalties';
export * from './staffRestrictions';
export * from './services';
export * from './servicePackages';
export * from './addOns';
export * from './promotions';
export * from './bookings';
export * from './bookingAssignments';
export * from './bookingStatusHistories';
export * from './payments';
export * from './refunds';
export * from './invoices';
export * from './reviews';
export * from './notifications';
export * from './conversations';
export * from './messages';
export * from './aiConversations';
export * from './aiMessages';
export * from './serviceBundles';

import { mockServices } from './services';
import { mockServicePackages } from './servicePackages';
import { mockAddOns } from './addOns';
import { mockCustomers } from './customers';
import { mockStaffs } from './staffs';
import { mockCustomerAddresses } from './customerAddresses';
import { mockBookings } from './bookings';
import { mockBookingAssignments } from './bookingAssignments';
import { mockBookingStatusHistories } from './bookingStatusHistories';
import { mockPayments } from './payments';
import { mockInvoices } from './invoices';
import { mockReviews } from './reviews';
import { mockNotifications } from './notifications';
import { mockMessages } from './messages';
import { mockAIMessages } from './aiMessages';

// Helper lookup functions
export const getServiceById = (serviceId: string) =>
  mockServices.find((s) => s.id === serviceId);

export const getPackagesByServiceId = (serviceId: string) =>
  mockServicePackages.filter((p) => p.serviceId === serviceId && p.isActive);

export const getAddOnsByServiceId = (serviceId: string) =>
  mockAddOns.filter((a) => a.serviceId === serviceId && a.isActive);

export const getCustomerById = (customerId: string) =>
  mockCustomers.find((c) => c.id === customerId);

export const getStaffById = (staffId: string) =>
  mockStaffs.find((s) => s.id === staffId);

export const getAddressesByCustomerId = (customerId: string) =>
  mockCustomerAddresses.filter((a) => a.customerId === customerId);

export const getBookingById = (bookingId: string) =>
  mockBookings.find((b) => b.id === bookingId);

export const getBookingAssignments = (bookingId: string) =>
  mockBookingAssignments.filter((a) => a.bookingId === bookingId);

export const getBookingTimeline = (bookingId: string) =>
  mockBookingStatusHistories
    .filter((h) => h.bookingId === bookingId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

export const getPaymentByBookingId = (bookingId: string) =>
  mockPayments.find((p) => p.bookingId === bookingId);

export const getInvoiceByBookingId = (bookingId: string) =>
  mockInvoices.find((inv) => inv.bookingId === bookingId);

export const getReviewsByStaffId = (staffId: string) =>
  mockReviews.filter((r) => r.staffId === staffId);

export const getReviewsByServiceId = (serviceId: string) =>
  mockReviews.filter((r) => r.serviceId === serviceId);

export const getNotificationsByUserId = (userId: string) =>
  mockNotifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getMessagesByConversationId = (conversationId: string) =>
  mockMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

export const getAIMessagesByConversationId = (conversationId: string) =>
  mockAIMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

/**
 * Filter staff for Mode A & Mode B matching
 */
export const getAvailableStaffs = (
  filter?:
    | {
        district?: string;
        competency?: string;
        onlyOnline?: boolean;
      }
    | string
) => {
  const comp = typeof filter === 'string' ? filter : filter?.competency;
  const dist = typeof filter === 'object' ? filter?.district : undefined;
  const onlyOn = typeof filter === 'object' ? filter?.onlyOnline : true;

  return mockStaffs.filter((staff) => {
    if (staff.status === 'SUSPENDED' || staff.status === 'RESTRICTED') return false;
    if (onlyOn && !staff.isOnline) return false;
    if (dist && !staff.operatingDistricts.includes(dist)) return false;
    if (comp && !staff.competencies.includes(comp)) return false;
    return true;
  });
};

/**
 * Get past completed bookings for a customer to enable 1-click re-booking
 */
export const getRecentCompletedBookings = (customerId: string) => {
  return mockBookings
    .filter((b) => b.customerId === customerId && (b.status === 'COMPLETED' || b.status === 'CONFIRMED'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};


