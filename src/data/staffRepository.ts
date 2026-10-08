import { mockStaffs } from './staffs';
import { mockStaffBalances } from './staffBalances';
import { mockReviews } from './reviews';
import { StaffCapabilityRepository } from './staffCapabilityRepository';
import {
  JobStepStatus,
  validateJobTransition,
  calculateCompletionCredit,
  isTerminalStatus,
} from './staffStateTransitions';
import { StaffId, UserId, getUserIdByStaffId, getStaffIdByUserId } from './staffMapping';

export type { JobStepStatus, StaffId, UserId };

export interface OpenOpportunity {
  id: string; // e.g. 'open-101'
  bookingCode: string;
  serviceId: string;
  serviceName: string;
  serviceIcon?: string;
  customerName: string;
  customerPhone: string;
  customerAvatar: string;
  address: string;
  district: string;
  distanceKm: number;
  date: string;
  timeSlot: string;
  startsAt?: string;
  endsAt?: string;
  packageTitle: string;
  addOnsText?: string;
  notes?: string;
  totalCustomerPaid: number;
  platformFee: number;
  netIncome: number;
  requiredCapabilities?: string[];
  status: 'OPEN';
}

export interface AcceptedAssignment {
  id: string; // bookingId e.g. 'bk-023'
  bookingCode: string;
  staffId: StaffId;
  serviceId: string;
  serviceName: string;
  serviceIcon?: string;
  customerName: string;
  customerPhone: string;
  customerAvatar: string;
  address: string;
  district: string;
  distanceKm: number;
  date: string;
  timeSlot: string;
  startsAt?: string;
  endsAt?: string;
  packageTitle: string;
  addOnsText?: string;
  notes?: string;
  totalCustomerPaid: number;
  platformFee: number;
  netIncome: number;
  status: JobStepStatus;
  customerId?: string;
  // Local chat presentation metadata until the acceptance DTO is agreed.
  chatAwaitingAcceptance?: boolean;
  conversationId?: string;
  checklist?: { id: string; title: string; done: boolean }[];
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  acceptedAt?: string;
  completedAt?: string;
}

// For seamless backwards compatibility
export type StaffJobItem = AcceptedAssignment;

export interface StaffWalletTransaction {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: 'INCOME' | 'WITHDRAW' | 'BONUS' | 'FEE';
  status: 'SUCCESS' | 'PENDING';
  bookingCode?: string;
}

export interface StaffWalletBalance {
  available: number;
  pending: number;
  totalEarned: number;
  withdrawn: number;
}

export interface StaffAvailabilitySlot {
  id: string;
  dayOfWeek: number; // 0: CN, 1: T2, ..., 6: T7
  dayName: string;
  shiftType: 'MORNING' | 'AFTERNOON' | 'EVENING';
  shiftName: string;
  timeRange: string;
  enabled: boolean;
}

export interface StaffOperationalProfile {
  staffId: StaffId;
  userId: UserId;
  fullName: string;
  phone: string;
  email: string;
  avatar: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  completionRate: number;
  isOnline: boolean;
  autoAccept: boolean;
  maxDistanceKm: number;
  primaryDistrict: string;
  operatingDistricts: string[];
  specialties: string[];
}

export type ClaimOpportunityResult =
  | { success: true; assignment: AcceptedAssignment }
  | {
      success: false;
      reason: string;
      errorCode: 'NOT_FOUND' | 'ALREADY_CLAIMED' | 'LOCKED' | 'NOT_ELIGIBLE';
    };

export type JobDetailResult =
  | { kind: 'ASSIGNMENT'; assignment: AcceptedAssignment }
  | { kind: 'OPEN_OPPORTUNITY'; opportunity: OpenOpportunity }
  | { kind: 'FORBIDDEN'; reason: string }
  | { kind: 'NOT_FOUND'; reason: string };

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Internal Per-Staff Store
interface StaffDataStore {
  profile: StaffOperationalProfile;
  assignments: AcceptedAssignment[];
  creditedBookingIds: Set<string>;
  walletBalance: StaffWalletBalance;
  walletTransactions: StaffWalletTransaction[];
  availabilitySlots: StaffAvailabilitySlot[];
}

function createDefaultAvailabilitySlots(prefix: string): StaffAvailabilitySlot[] {
  return [
    { id: `${prefix}-1a`, dayOfWeek: 1, dayName: 'Thứ 2', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
    { id: `${prefix}-1b`, dayOfWeek: 1, dayName: 'Thứ 2', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: true },
    { id: `${prefix}-1c`, dayOfWeek: 1, dayName: 'Thứ 2', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 20:00', enabled: false },

    { id: `${prefix}-2a`, dayOfWeek: 2, dayName: 'Thứ 3', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
    { id: `${prefix}-2b`, dayOfWeek: 2, dayName: 'Thứ 3', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: true },
    { id: `${prefix}-2c`, dayOfWeek: 2, dayName: 'Thứ 3', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 20:00', enabled: false },

    { id: `${prefix}-3a`, dayOfWeek: 3, dayName: 'Thứ 4', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
    { id: `${prefix}-3b`, dayOfWeek: 3, dayName: 'Thứ 4', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: true },
    { id: `${prefix}-3c`, dayOfWeek: 3, dayName: 'Thứ 4', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 20:00', enabled: false },

    { id: `${prefix}-4a`, dayOfWeek: 4, dayName: 'Thứ 5', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
    { id: `${prefix}-4b`, dayOfWeek: 4, dayName: 'Thứ 5', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: true },
    { id: `${prefix}-4c`, dayOfWeek: 4, dayName: 'Thứ 5', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 20:00', enabled: true },

    { id: `${prefix}-5a`, dayOfWeek: 5, dayName: 'Thứ 6', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
    { id: `${prefix}-5b`, dayOfWeek: 5, dayName: 'Thứ 6', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: true },
    { id: `${prefix}-5c`, dayOfWeek: 5, dayName: 'Thứ 6', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 20:00', enabled: false },

    { id: `${prefix}-6a`, dayOfWeek: 6, dayName: 'Thứ 7', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
    { id: `${prefix}-6b`, dayOfWeek: 6, dayName: 'Thứ 7', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: false },
    { id: `${prefix}-6c`, dayOfWeek: 6, dayName: 'Thứ 7', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 20:00', enabled: false },

    { id: `${prefix}-0a`, dayOfWeek: 0, dayName: 'Chủ nhật', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: false },
    { id: `${prefix}-0b`, dayOfWeek: 0, dayName: 'Chủ nhật', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: false },
    { id: `${prefix}-0c`, dayOfWeek: 0, dayName: 'Chủ nhật', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 20:00', enabled: false },
  ];
}

// Global in-memory claim lock
const claimLockSet = new Set<string>();

// Global open pool (unassigned shifts)
// Two local demo opportunities for tomorrow in the same timezone as capability validity.
const demoTomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const demoDateParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(demoTomorrow);
const demoDatePart = (type: Intl.DateTimeFormatPartTypes) => demoDateParts.find((part) => part.type === type)!.value;
const demoDateIso = `${demoDatePart('year')}-${demoDatePart('month')}-${demoDatePart('day')}`;
const demoDateLabel = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(demoTomorrow);
let openOpportunitiesStore: OpenOpportunity[] = [
  {
    id: 'open-104',
    bookingCode: 'BK-DEMO-104',
    serviceId: 'srv-001',
    serviceName: 'Vệ sinh nhà theo giờ',
    serviceIcon: 'clean',
    customerName: 'Phạm Ngọc Mai',
    customerPhone: '0900000104',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    address: 'Căn hộ demo, 90 Nguyễn Hữu Cảnh',
    district: 'Bình Thạnh',
    distanceKm: 0.6,
    date: demoDateLabel,
    timeSlot: '08:00 - 10:00 (2 giờ)',
    startsAt: `${demoDateIso}T08:00:00+07:00`,
    endsAt: `${demoDateIso}T10:00:00+07:00`,
    packageTitle: 'Dọn căn hộ 2 phòng ngủ',
    notes: 'Lau sàn, vệ sinh bếp và phòng tắm. Gia chủ chuẩn bị dụng cụ.',
    totalCustomerPaid: 190000,
    platformFee: 28500,
    netIncome: 161500,
    status: 'OPEN',
  },
  {
    id: 'open-105',
    bookingCode: 'BK-DEMO-105',
    serviceId: 'srv-001',
    serviceName: 'Vệ sinh nhà theo giờ',
    serviceIcon: 'clean',
    customerName: 'Lê Minh Khang',
    customerPhone: '0900000105',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    address: 'Căn hộ demo, 135 Điện Biên Phủ',
    district: 'Bình Thạnh',
    distanceKm: 1.1,
    date: demoDateLabel,
    timeSlot: '13:00 - 15:30 (2,5 giờ)',
    startsAt: `${demoDateIso}T13:00:00+07:00`,
    endsAt: `${demoDateIso}T15:30:00+07:00`,
    packageTitle: 'Dọn phòng khách, bếp và ban công',
    notes: 'Ban công ở tầng trệt; chỉ vệ sinh trong phạm vi căn hộ.',
    totalCustomerPaid: 235000,
    platformFee: 35250,
    netIncome: 199750,
    status: 'OPEN',
  },
  {
    id: 'open-101',
    bookingCode: 'BK-2024-101',
    serviceId: 'srv-001',
    serviceName: 'Dọn dẹp nhà theo giờ',
    serviceIcon: 'clean',
    customerName: 'Hoàng Bích Thủy',
    customerPhone: '0908889991',
    customerAvatar: 'https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?w=250&auto=format&fit=crop&q=80',
    address: 'Chung cư Richmond City, 207C Nguyễn Xí',
    district: 'Bình Thạnh',
    distanceKm: 0.9,
    date: 'Hôm nay',
    timeSlot: '18:00 - 20:00 (2 giờ)',
    packageTitle: 'Gói 2 giờ dọn dẹp',
    addOnsText: 'Ủi 5 bộ quần áo',
    notes: 'Cần dọn gấp trước 20h30 tối nay do có khách đến chơi.',
    totalCustomerPaid: 210000,
    platformFee: 31500,
    netIncome: 178500,
    status: 'OPEN',
  },
  {
    id: 'open-102',
    bookingCode: 'BK-2024-102',
    serviceId: 'srv-002',
    serviceName: 'Tổng vệ sinh nhà phố',
    serviceIcon: 'sparkles',
    customerName: 'Vũ Đức Nam',
    customerPhone: '0917772223',
    customerAvatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=250&auto=format&fit=crop&q=80',
    address: 'Khu biệt thự Nam Long, Trần Trọng Khiêm',
    district: 'Quận 7',
    distanceKm: 4.8,
    date: 'Ngày mai',
    timeSlot: '08:00 - 13:00 (5 giờ)',
    packageTitle: 'Tổng vệ sinh nhà 3 tầng',
    notes: 'Có thang leo và máy hút bụi sẵn tại nhà.',
    totalCustomerPaid: 650000,
    platformFee: 97500,
    netIncome: 552500,
    status: 'OPEN',
  },
  {
    id: 'open-103',
    bookingCode: 'BK-2024-103',
    serviceId: 'srv-011',
    serviceName: 'Nấu ăn gia đình',
    serviceIcon: 'cooking',
    customerName: 'Đặng Mai Lan',
    customerPhone: '0933221100',
    customerAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80',
    address: '68 Hoàng Sa, Phường Tân Định',
    district: 'Quận 1',
    distanceKm: 2.4,
    date: 'Ngày mai',
    timeSlot: '16:00 - 18:30',
    packageTitle: 'Nấu 1 bữa tối (4 món) cho 4 người',
    notes: 'Thực đơn: Canh chua cá, sườn xào chua ngọt, rau muống xào tỏi.',
    totalCustomerPaid: 280000,
    platformFee: 42000,
    netIncome: 238000,
    status: 'OPEN',
  },
];

// Per-staff in-memory state dictionary
const staffDataMap = new Map<StaffId, StaffDataStore>();

// Initialise Staff 1: staff-001 (Nguyễn Thị Hoa)
staffDataMap.set('staff-001', {
  profile: {
    staffId: 'staff-001',
    userId: 'user-s01',
    fullName: 'Nguyễn Thị Hoa',
    phone: '0912001001',
    email: 'hoa.nguyen.staff@homecare.vn',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=250&auto=format&fit=crop&q=80',
    bio: 'Cẩn thận, chu đáo, trung thực. Đã làm việc hơn 5 năm trong ngành vệ sinh căn hộ cao cấp tại Bình Thạnh và Quận 1.',
    rating: 4.92,
    reviewCount: 248,
    completionRate: 99,
    isOnline: true,
    autoAccept: true,
    maxDistanceKm: 10,
    primaryDistrict: 'Bình Thạnh',
    operatingDistricts: ['Bình Thạnh', 'Quận 1', 'Quận 2', 'Quận 3'],
    specialties: ['Vệ sinh nhà theo giờ', 'Dọn dẹp căn hộ'],
  },
  creditedBookingIds: new Set(['bk-015', 'bk-001']),
  walletBalance: {
    available: 4320000,
    pending: 467500,
    totalEarned: 28500000,
    withdrawn: 24180000,
  },
  walletTransactions: [
    {
      id: 'tx-001',
      title: 'Tiền công ca BK-2024-015',
      date: '10:30 Hôm qua',
      amount: 297500,
      type: 'INCOME',
      status: 'SUCCESS',
      bookingCode: 'BK-2024-015',
    },
    {
      id: 'tx-002',
      title: 'Rút tiền về Vietcombank (****9821)',
      date: '15:20 Ngày 11/06',
      amount: 2000000,
      type: 'WITHDRAW',
      status: 'SUCCESS',
    },
    {
      id: 'tx-003',
      title: 'Tiền công ca BK-2024-001',
      date: '18:15 Ngày 11/06',
      amount: 272000,
      type: 'INCOME',
      status: 'SUCCESS',
      bookingCode: 'BK-2024-001',
    },
    {
      id: 'tx-004',
      title: 'Thưởng chuyên cần tuần 24',
      date: '08:00 Ngày 10/06',
      amount: 300000,
      type: 'BONUS',
      status: 'SUCCESS',
    },
    {
      id: 'tx-005',
      title: 'Tiền tip từ khách Trần Gia Huy',
      date: '17:30 Ngày 08/06',
      amount: 50000,
      type: 'BONUS',
      status: 'SUCCESS',
    },
  ],
  availabilitySlots: createDefaultAvailabilitySlots('s1'),
  assignments: [
    {
      id: 'bk-023',
      customerId: 'cust-004',
      bookingCode: 'BK-2024-023',
      staffId: 'staff-001',
      serviceId: 'srv-001',
      serviceName: 'Giúp việc theo giờ',
      serviceIcon: 'clean',
      customerName: 'Trần Gia Huy',
      customerPhone: '0901234004',
      customerAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=250&auto=format&fit=crop&q=80',
      address: 'Căn hộ B12.04 Vinhomes Central Park, 208 Nguyễn Hữu Cảnh',
      district: 'Bình Thạnh',
      distanceKm: 1.2,
      date: 'Hôm nay',
      timeSlot: '14:00 - 17:00 (3 giờ)',
      packageTitle: 'Gói 3 giờ tiêu chuẩn',
      addOnsText: 'Vệ sinh tủ lạnh, Lau ban công',
      notes: 'Nhà có nuôi cún Poodle nhỏ rất ngoan. Nhờ chị lau kỹ mặt kính ban công và gầm sofa giúp em.',
      totalCustomerPaid: 320000,
      platformFee: 48000,
      netIncome: 272000,
      status: 'IN_PROGRESS',
      conversationId: 'conv-001',
      checklist: [
        { id: 'chk-1', title: 'Thu gom rác và phân loại các phòng', done: true },
        { id: 'chk-2', title: 'Lau dọn bàn ghế, kệ TV và hút bụi thảm', done: true },
        { id: 'chk-3', title: 'Vệ sinh tủ lạnh & lau mặt kính ban công', done: false },
        { id: 'chk-4', title: 'Lau sàn bằng nước thơm & khử khuẩn', done: false },
      ],
    },
    {
      id: 'bk-031',
      customerId: 'cust-demo-031',
      bookingCode: 'BK-2024-031',
      staffId: 'staff-001',
      serviceId: 'srv-001',
      serviceName: 'Tổng vệ sinh căn hộ',
      serviceIcon: 'sparkles',
      customerName: 'Lê Minh Anh',
      customerPhone: '0901234002',
      customerAvatar: 'https://images.unsplash.com/photo-1531927557220-a9e23c1e4794?w=250&auto=format&fit=crop&q=80',
      address: 'Tầng 15 Masteri An Phú, Xa lộ Hà Nội',
      district: 'Quận 2',
      distanceKm: 3.5,
      date: 'Ngày mai',
      timeSlot: '08:30 - 12:30 (4 giờ)',
      packageTitle: 'Tổng vệ sinh căn 2PN',
      notes: 'Mang theo cây lau kính dài. Chủ nhà có mặt để mở cửa.',
      totalCustomerPaid: 580000,
      platformFee: 87000,
      netIncome: 493000,
      status: 'ACCEPTED',
      conversationId: 'conv-staff-031',
      checklist: [
        { id: 'chk-1', title: 'Lau quét bụi trần và tường', done: false },
        { id: 'chk-2', title: 'Lau hệ thống kính mặt ngoài & trong', done: false },
        { id: 'chk-3', title: 'Tẩy ố nhà tắm và bồn rửa', done: false },
        { id: 'chk-4', title: 'Lau sàn gỗ bóng chuyên dụng', done: false },
      ],
    },
    {
      id: 'bk-015',
      bookingCode: 'BK-2024-015',
      staffId: 'staff-001',
      serviceId: 'srv-002',
      serviceName: 'Vệ sinh máy lạnh',
      serviceIcon: 'fridge',
      customerName: 'Phạm Hồng Quân',
      customerPhone: '0901234003',
      customerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
      address: '45/2 Nguyễn Thị Minh Khai, P. Bến Nghé',
      district: 'Quận 1',
      distanceKm: 2.1,
      date: 'Hôm qua',
      timeSlot: '10:00 - 11:30',
      packageTitle: 'Bảo dưỡng 2 máy treo tường + xịt bạt',
      totalCustomerPaid: 350000,
      platformFee: 52500,
      netIncome: 297500,
      status: 'COMPLETED',
      checklist: [
        { id: 'chk-1', title: 'Tháo vỏ nhựa & vệ sinh lưới lọc bụi', done: true },
        { id: 'chk-2', title: 'Bọc bạt hứng nước và xịt áp lực dàn lạnh', done: true },
        { id: 'chk-3', title: 'Xịt rửa dàn nóng ngoài trời', done: true },
        { id: 'chk-4', title: 'Kiểm tra gas & bàn giao máy lạnh mát sâu', done: true },
      ],
    },
    {
      id: 'bk-001',
      customerId: 'cust-001',
      conversationId: 'conv-002',
      bookingCode: 'BK-2024-001',
      staffId: 'staff-001',
      serviceId: 'srv-001',
      serviceName: 'Giúp việc theo giờ',
      serviceIcon: 'clean',
      customerName: 'Nguyễn Thị Hoa',
      customerPhone: '0901234001',
      customerAvatar: 'https://images.unsplash.com/photo-1631947430066-48c30d57b943?w=250&auto=format&fit=crop&q=80',
      address: 'Số 120 Điện Biên Phủ, P. 15',
      district: 'Bình Thạnh',
      distanceKm: 1.5,
      date: '11/06/2024',
      timeSlot: '14:00 - 18:00',
      packageTitle: 'Gói 4 giờ chiều',
      notes: 'Nhà có mèo thân thiện, lau kỹ phòng ngủ trẻ em',
      totalCustomerPaid: 320000,
      platformFee: 48000,
      netIncome: 272000,
      status: 'COMPLETED',
    },
  ],
});

// Initialise Staff 2: staff-005 (Đỗ Văn Tuấn)
staffDataMap.set('staff-005', {
  profile: {
    staffId: 'staff-005',
    userId: 'user-s05',
    fullName: 'Đỗ Văn Tuấn',
    phone: '0912001005',
    email: 'tuan.do.staff@homecare.vn',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=250&auto=format&fit=crop&q=80',
    bio: 'Chứng chỉ kỹ thuật điện lạnh Đại học Công nghiệp. Đầy đủ đồ nghề bạt hứng nước, máy xịt rửa áp lực cao, đồng hồ đo gas R32.',
    rating: 4.96,
    reviewCount: 180,
    completionRate: 100,
    isOnline: true,
    autoAccept: false,
    maxDistanceKm: 15,
    primaryDistrict: 'Quận 1',
    operatingDistricts: ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh', 'TP. Thủ Đức'],
    specialties: ['Vệ sinh máy lạnh', 'Nạp gas & Bảo dưỡng điện lạnh'],
  },
  creditedBookingIds: new Set(['bk-038']),
  walletBalance: {
    available: 1650000,
    pending: 0,
    totalEarned: 11200000,
    withdrawn: 9550000,
  },
  walletTransactions: [
    {
      id: 'tx-tuan-001',
      title: 'Tiền công ca BK-2024-038',
      date: '14:15 Hôm qua',
      amount: 380000,
      type: 'INCOME',
      status: 'SUCCESS',
      bookingCode: 'BK-2024-038',
    },
    {
      id: 'tx-tuan-002',
      title: 'Rút tiền về MB Bank (****5678)',
      date: '09:00 Ngày 10/06',
      amount: 1000000,
      type: 'WITHDRAW',
      status: 'SUCCESS',
    },
  ],
  availabilitySlots: createDefaultAvailabilitySlots('s5'),
  assignments: [
    {
      id: 'bk-042',
      customerId: 'cust-demo-042',
      chatAwaitingAcceptance: true,
      bookingCode: 'BK-2024-042',
      staffId: 'staff-005',
      serviceId: 'srv-002',
      serviceName: 'Vệ sinh & Bảo dưỡng máy lạnh',
      serviceIcon: 'fridge',
      customerName: 'Hoàng Minh Tuấn',
      customerPhone: '0903332211',
      customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      address: 'Số 12 Nguyễn Huệ, Phường Bến Nghé',
      district: 'Quận 1',
      distanceKm: 0.8,
      date: 'Hôm nay',
      timeSlot: '15:00 - 17:00',
      packageTitle: 'Vệ sinh 3 dàn lạnh treo tường',
      notes: 'Căn hộ tầng 8, thang máy tải sẵn sàng.',
      totalCustomerPaid: 520000,
      platformFee: 78000,
      netIncome: 442000,
      status: 'IN_PROGRESS',
      conversationId: 'conv-tuan-01',
      checklist: [
        { id: 't-1', title: 'Tháo lưới lọc và mặt nạ dàn lạnh', done: true },
        { id: 't-2', title: 'Bọc bạt máng và xịt rửa quạt lồng sóc', done: true },
        { id: 't-3', title: 'Vệ sinh khay nước ngưng và ống xả', done: true },
        { id: 't-4', title: 'Đo kiểm áp suất gas & chạy thử lạnh buốt', done: true },
      ],
    },
    {
      id: 'bk-038',
      bookingCode: 'BK-2024-038',
      staffId: 'staff-005',
      serviceId: 'srv-002',
      serviceName: 'Bảo dưỡng máy lạnh Inverter',
      serviceIcon: 'fridge',
      customerName: 'Trịnh Cẩm Tú',
      customerPhone: '0918881234',
      customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      address: '72 Lê Duẩn, Phường Bến Nghé',
      district: 'Quận 1',
      distanceKm: 1.1,
      date: 'Hôm qua',
      timeSlot: '14:00 - 15:30',
      packageTitle: 'Vệ sinh 2 máy Daikin + nạp gas bổ sung',
      totalCustomerPaid: 450000,
      platformFee: 67500,
      netIncome: 382500,
      status: 'COMPLETED',
    },
  ],
});

function getOrCreateStaffStore(staffId: StaffId): StaffDataStore {
  let store = staffDataMap.get(staffId);
  if (!store) {
    const rawStaff = mockStaffs.find((s) => s.id === staffId);
    const rawBalance = mockStaffBalances.find((b) => b.staffId === staffId);
    store = {
      profile: {
        staffId,
        userId: rawStaff?.userId || `user-${staffId}`,
        fullName: rawStaff?.fullName || 'Nhân viên dịch vụ',
        phone: rawStaff?.phone || '0900000000',
        email: rawStaff?.email || `${staffId}@homecare.vn`,
        avatar: rawStaff?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        bio: rawStaff?.bio || '',
        rating: rawStaff?.rating || 5.0,
        reviewCount: rawStaff?.reviewCount || 0,
        completionRate: rawStaff?.completionRate || 100,
        isOnline: rawStaff?.isOnline ?? true,
        autoAccept: false,
        maxDistanceKm: 10,
        primaryDistrict: rawStaff?.operatingDistricts?.[0] || 'Quận 1',
        operatingDistricts: rawStaff?.operatingDistricts || ['Quận 1', 'Bình Thạnh'],
        specialties: rawStaff?.specialties || ['Vệ sinh nhà'],
      },
      creditedBookingIds: new Set<string>(),
      walletBalance: {
        available: rawBalance?.availableBalance || 0,
        pending: rawBalance?.pendingBalance || 0,
        totalEarned: rawBalance?.totalEarned || 0,
        withdrawn: rawBalance?.withdrawnAmount || 0,
      },
      walletTransactions: [],
      availabilitySlots: createDefaultAvailabilitySlots(staffId),
      assignments: [],
    };
    staffDataMap.set(staffId, store);
  }
  return store;
}

// Reactive listeners
type Listener = () => void;
const listeners = new Set<Listener>();
function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // swallow subscriber error to protect pipeline
    }
  });
}

/**
 * Type-safe StaffRepository providing scoped immutable snapshots and reactive subscriptions.
 */
export const StaffRepository = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  getOperationalProfile(staffId: StaffId): StaffOperationalProfile {
    const store = getOrCreateStaffStore(staffId);
    return clone(store.profile);
  },

  setOnline(staffId: StaffId, isOnline: boolean): void {
    const store = getOrCreateStaffStore(staffId);
    store.profile = { ...store.profile, isOnline };
    notifyListeners();
  },

  updateOperatingAreas(
    staffId: StaffId,
    settings: {
      autoAccept?: boolean;
      maxDistanceKm?: number;
      primaryDistrict?: string;
      selectedDistricts?: string[];
      operatingDistricts?: string[];
    }
  ): void {
    const store = getOrCreateStaffStore(staffId);
    const operatingDistricts = settings.operatingDistricts || settings.selectedDistricts || store.profile.operatingDistricts;
    store.profile = {
      ...store.profile,
      ...(settings.autoAccept !== undefined ? { autoAccept: settings.autoAccept } : {}),
      ...(settings.maxDistanceKm !== undefined ? { maxDistanceKm: settings.maxDistanceKm } : {}),
      ...(settings.primaryDistrict !== undefined ? { primaryDistrict: settings.primaryDistrict } : {}),
      operatingDistricts,
    };
    notifyListeners();
  },

  getAssignments(staffId: StaffId): AcceptedAssignment[] {
    const store = getOrCreateStaffStore(staffId);
    return clone(store.assignments);
  },

  getOpenOpportunities(): OpenOpportunity[] {
    return clone(openOpportunitiesStore);
  },

  getJobDetail(staffId: StaffId, jobId: string): JobDetailResult {
    // 1. Check open opportunities pool
    const openOpp = openOpportunitiesStore.find((o) => o.id === jobId);
    if (openOpp) {
      return { kind: 'OPEN_OPPORTUNITY', opportunity: clone(openOpp) };
    }

    // 2. Check current staff's assignments
    const currentStore = getOrCreateStaffStore(staffId);
    const myAssignment = currentStore.assignments.find((a) => a.id === jobId);
    if (myAssignment) {
      return { kind: 'ASSIGNMENT', assignment: clone(myAssignment) };
    }

    // 3. Check if this assignment belongs to another staff (forbidden access!)
    for (const [otherStaffId, otherStore] of staffDataMap.entries()) {
      if (otherStaffId !== staffId) {
        const foundOther = otherStore.assignments.find((a) => a.id === jobId);
        if (foundOther) {
          return {
            kind: 'FORBIDDEN',
            reason: 'Bạn không có quyền truy cập ca làm việc của nhân viên khác.',
          };
        }
      }
    }

    // 4. Not found in any collection
    return {
      kind: 'NOT_FOUND',
      reason: 'Không tìm thấy ca làm việc hoặc ca đã bị hủy.',
    };
  },

  claimOpportunity(staffId: StaffId, opportunityId: string): ClaimOpportunityResult {
    // Lock check
    if (claimLockSet.has(opportunityId)) {
      return {
        success: false,
        reason: 'Ca làm việc đang được xử lý bởi nhân viên khác. Vui lòng thử lại sau giây lát.',
        errorCode: 'LOCKED',
      };
    }

    claimLockSet.add(opportunityId);

    try {
      const idx = openOpportunitiesStore.findIndex((o) => o.id === opportunityId);
      if (idx === -1) {
        return {
          success: false,
          reason: 'Ca làm việc không còn tồn tại hoặc đã được nhận bởi đối tác khác.',
          errorCode: 'NOT_FOUND',
        };
      }

      const opportunity = openOpportunitiesStore[idx];
      // Check the Admin-confirmed capability again before consuming the slot.
      const eligibility = StaffCapabilityRepository.canReceiveService(staffId, opportunity.serviceId);
      if (!eligibility.allowed) return { success: false, reason: eligibility.reason ?? 'Chưa đủ điều kiện năng lực.', errorCode: 'NOT_ELIGIBLE' };
      // Remove from open pool
      openOpportunitiesStore = openOpportunitiesStore.filter((o) => o.id !== opportunityId);

      // Create new accepted assignment for this staff
      const store = getOrCreateStaffStore(staffId);
      const newAssignment: AcceptedAssignment = {
        id: opportunity.id,
        bookingCode: opportunity.bookingCode,
        staffId,
        serviceId: opportunity.serviceId,
        serviceName: opportunity.serviceName,
        serviceIcon: opportunity.serviceIcon,
        customerName: opportunity.customerName,
        customerPhone: opportunity.customerPhone,
        customerAvatar: opportunity.customerAvatar,
        address: opportunity.address,
        district: opportunity.district,
        distanceKm: opportunity.distanceKm,
        date: opportunity.date,
        timeSlot: opportunity.timeSlot,
        startsAt: opportunity.startsAt,
        endsAt: opportunity.endsAt,
        packageTitle: opportunity.packageTitle,
        addOnsText: opportunity.addOnsText,
        notes: opportunity.notes,
        totalCustomerPaid: opportunity.totalCustomerPaid,
        platformFee: opportunity.platformFee,
        netIncome: opportunity.netIncome,
        status: 'ACCEPTED',
        acceptedAt: new Date().toISOString(),
        checklist: [
          { id: `c-1`, title: 'Chuẩn bị đầy đủ dụng cụ và trang phục', done: true },
          { id: `c-2`, title: 'Có mặt đúng giờ và chào hỏi gia chủ', done: false },
          { id: `c-3`, title: 'Tiến hành công việc theo quy chuẩn', done: false },
          { id: `c-4`, title: 'Mời gia chủ nghiệm thu & hoàn tất ca', done: false },
        ],
      };

      store.assignments = [newAssignment, ...store.assignments];
      notifyListeners();
      return { success: true, assignment: clone(newAssignment) };
    } finally {
      claimLockSet.delete(opportunityId);
    }
  },

  updateJobStatus(
    staffId: StaffId,
    jobId: string,
    nextStatus: JobStepStatus
  ): { success: boolean; reason?: string; assignment?: AcceptedAssignment } {
    const store = getOrCreateStaffStore(staffId);
    const assignment = store.assignments.find((a) => a.id === jobId);

    // Validate using pure state machine logic
    const validation = validateJobTransition(assignment, staffId, nextStatus);
    if (!validation.valid || !assignment) {
      return { success: false, reason: validation.reason };
    }

    const updatedAssignment: AcceptedAssignment = {
      ...assignment,
      status: nextStatus,
      completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : assignment.completedAt,
    };

    // Replace immutably
    store.assignments = store.assignments.map((a) => (a.id === jobId ? updatedAssignment : a));

    // Idempotent wallet credit on completion
    if (nextStatus === 'COMPLETED') {
      const creditResult = calculateCompletionCredit(
        store.walletBalance.available,
        store.walletBalance.totalEarned,
        assignment.netIncome,
        assignment.id,
        store.creditedBookingIds
      );

      if (creditResult.credited) {
        store.creditedBookingIds.add(assignment.id);
        store.walletBalance = {
          ...store.walletBalance,
          available: creditResult.nextAvailableBalance,
          totalEarned: creditResult.nextTotalEarned,
        };

        const newTx: StaffWalletTransaction = {
          id: `tx-${Date.now()}`,
          title: `Tiền công ca ${assignment.bookingCode}`,
          date: 'Vừa xong',
          amount: assignment.netIncome,
          type: 'INCOME',
          status: 'SUCCESS',
          bookingCode: assignment.bookingCode,
        };
        store.walletTransactions = [newTx, ...store.walletTransactions];
      }
    }

    notifyListeners();
    return { success: true, assignment: clone(updatedAssignment) };
  },

  toggleChecklistItem(
    staffId: StaffId,
    jobId: string,
    checkId: string
  ): { success: boolean; assignment?: AcceptedAssignment } {
    const store = getOrCreateStaffStore(staffId);
    const assignment = store.assignments.find((a) => a.id === jobId);
    if (!assignment || !assignment.checklist) {
      return { success: false };
    }

    const nextChecklist = assignment.checklist.map((item) =>
      item.id === checkId ? { ...item, done: !item.done } : { ...item }
    );

    const nextAssignment: AcceptedAssignment = {
      ...assignment,
      checklist: nextChecklist,
    };

    store.assignments = store.assignments.map((a) => (a.id === jobId ? nextAssignment : a));
    notifyListeners();
    return { success: true, assignment: clone(nextAssignment) };
  },

  getWallet(staffId: StaffId): {
    balance: StaffWalletBalance;
    transactions: StaffWalletTransaction[];
  } {
    const store = getOrCreateStaffStore(staffId);
    return {
      balance: clone(store.walletBalance),
      transactions: clone(store.walletTransactions),
    };
  },

  withdrawMoney(
    staffId: StaffId,
    amount: number,
    bankName: string,
    accountNumber: string
  ): boolean {
    const store = getOrCreateStaffStore(staffId);
    if (amount <= 0 || amount > store.walletBalance.available) {
      return false;
    }

    store.walletBalance = {
      ...store.walletBalance,
      available: store.walletBalance.available - amount,
      withdrawn: store.walletBalance.withdrawn + amount,
    };

    const newTx: StaffWalletTransaction = {
      id: `tx-${Date.now()}`,
      title: `Rút tiền về ${bankName} (${accountNumber.slice(-4)})`,
      date: 'Vừa xong',
      amount,
      type: 'WITHDRAW',
      status: 'SUCCESS',
    };

    store.walletTransactions = [newTx, ...store.walletTransactions];
    notifyListeners();
    return true;
  },

  getAvailability(staffId: StaffId): {
    slots: StaffAvailabilitySlot[];
    areas: {
      autoAccept: boolean;
      maxDistanceKm: number;
      primaryDistrict: string;
      selectedDistricts: string[];
    };
  } {
    const store = getOrCreateStaffStore(staffId);
    return {
      slots: clone(store.availabilitySlots),
      areas: {
        autoAccept: store.profile.autoAccept,
        maxDistanceKm: store.profile.maxDistanceKm,
        primaryDistrict: store.profile.primaryDistrict,
        selectedDistricts: clone(store.profile.operatingDistricts),
      },
    };
  },

  toggleShiftSlot(staffId: StaffId, slotId: string): void {
    const store = getOrCreateStaffStore(staffId);
    store.availabilitySlots = store.availabilitySlots.map((item) =>
      item.id === slotId ? { ...item, enabled: !item.enabled } : { ...item }
    );
    notifyListeners();
  },

  getStaffReviews(staffId: StaffId) {
    const filtered = mockReviews.filter((r) => r.staffId === staffId);
    if (filtered.length === 0 && staffId === 'staff-005') {
      return [
        {
          id: 'rev-tuan-1',
          bookingId: 'bk-038',
          customerId: 'cust-002',
          customerName: 'Trịnh Cẩm Tú',
          customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
          staffId: 'staff-005',
          rating: 5,
          comment: 'Anh Tuấn làm việc rất chuyên nghiệp, máy lạnh mát sâu ngay sau khi bảo dưỡng.',
          createdAt: '2024-06-11T16:00:00Z',
        },
      ];
    }
    return clone(filtered);
  },
};
