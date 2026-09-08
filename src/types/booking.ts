export type BookingMode = 'MODE_A' | 'MODE_B'; // MODE_A: Customer selects staff, MODE_B: System matches

export type BookingStatus =
  | 'PENDING'
  | 'MATCHING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ABSENT'
  | 'REJECTED';

export interface BookingAddOnItem {
  addOnId: string;
  addOnName: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. "BK-2024-001"
  customerId: string;
  serviceId: string;
  packageId: string;
  addressId: string;
  mode: BookingMode;
  requiredStaffCount: number; // 1 or more
  bookingDate: string; // "2024-06-11"
  startTime: string; // "09:00"
  endTime: string; // "13:00"
  status: BookingStatus;
  notes?: string;
  
  // Financials
  packagePrice: number;
  addOnsTotal: number;
  discountAmount: number;
  totalAmount: number;
  promotionCode?: string;

  // Selected add-ons snapshot
  addOns: BookingAddOnItem[];

  // Execution meta
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: 'CUSTOMER' | 'STAFF' | 'SYSTEM' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export type AssignmentStatus = 'ASSIGNED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface BookingAssignment {
  id: string;
  bookingId: string;
  staffId: string;
  status: AssignmentStatus;
  assignedAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  cancellationReason?: string;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  status: BookingStatus;
  title: string;
  description: string;
  timestamp: string;
  changedBy: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SYSTEM';
}
