export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface User {
  id: string;
  phone: string;
  email: string;
  fullName: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  title: string; // e.g. "Nhà riêng", "Văn phòng", "Nhà bố mẹ"
  recipientName: string;
  recipientPhone: string;
  streetAddress: string; // e.g. "Số 208 Nguyễn Hữu Cảnh"
  ward: string; // e.g. "Dịch Vọng Hậu"
  district: string; // e.g. "Bình Thạnh"
  city: string; // e.g. "TP. Hồ Chí Minh"
  fullAddress: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  note?: string;
}

export interface Customer {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  avatar: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  defaultAddressId?: string;
  totalBookings: number;
  rewardPoints: number;
  createdAt: string;
}

export type StaffStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'SUSPENDED' | 'RESTRICTED';

export interface Staff {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  avatar: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  idCardNumber: string; // CCCD
  experienceYears: number;
  rating: number; // e.g. 4.8
  reviewCount: number;
  completionRate: number; // e.g. 98%
  satisfactionRate: number; // e.g. 99%
  status: StaffStatus;
  isOnline: boolean;
  bio: string;
  competencies: string[]; // List of service category tags
  operatingDistricts: string[];
  createdAt: string;
}

export interface StaffAvailability {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0: CN, 1: T2, 2: T3, ..., 6: T7
  dayName: string;
  startTime: string; // "08:00"
  endTime: string; // "12:00"
  isAvailable: boolean;
}

export interface StaffArea {
  id: string;
  staffId: string;
  district: string;
  city: string;
  isPrimary: boolean;
}

export interface StaffIncome {
  id: string;
  staffId: string;
  bookingId: string;
  serviceName: string;
  amount: number;
  platformFee: number;
  netIncome: number;
  createdAt: string;
  status: 'PENDING' | 'SETTLED';
}

export interface StaffBalance {
  staffId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  withdrawnAmount: number;
  lastUpdated: string;
}

export interface Penalty {
  id: string;
  staffId: string;
  bookingId?: string;
  reason: string;
  amount: number;
  createdAt: string;
  status: 'APPLIED' | 'APPEALED' | 'WAIVED';
}

export interface StaffRestriction {
  id: string;
  staffId: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}
