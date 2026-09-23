import { mockStaffs } from './staffs';
import { mockBookings } from './bookings';
import { mockBookingAssignments } from './bookingAssignments';
import { mockStaffBalances } from './staffBalances';
import { mockStaffIncomes } from './staffIncomes';
import { mockStaffAvailabilities } from './staffAvailabilities';
import { mockStaffAreas } from './staffAreas';
import { mockReviews } from './reviews';
import { mockServices } from './services';
import { mockCustomers } from './customers';
import { mockCustomerAddresses } from './customerAddresses';
import { mockConversations } from './conversations';

export type JobStepStatus = 'ACCEPTED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface StaffJobItem {
  id: string; // bookingId
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
  packageTitle: string;
  addOnsText?: string;
  notes?: string;
  totalCustomerPaid: number;
  platformFee: number;
  netIncome: number;
  status: JobStepStatus;
  conversationId?: string;
  checklist?: { id: string; title: string; done: boolean }[];
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
}

export interface StaffWalletTransaction {
  id: string;
  title: string;
  date: string;
  amount: number;
  type: 'INCOME' | 'WITHDRAW' | 'BONUS' | 'FEE';
  status: 'SUCCESS' | 'PENDING';
  bookingCode?: string;
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

// Initial mock shifts assigned to staff-001 or available around
let staffJobsState: StaffJobItem[] = [
  {
    id: 'bk-023',
    bookingCode: 'BK-2024-023',
    serviceId: 'srv-001',
    serviceName: 'Giúp việc theo giờ',
    serviceIcon: 'clean',
    customerName: 'Trần Gia Huy',
    customerPhone: '0901234004',
    customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
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
    bookingCode: 'BK-2024-031',
    serviceId: 'srv-001',
    serviceName: 'Tổng vệ sinh căn hộ',
    serviceIcon: 'sparkles',
    customerName: 'Lê Minh Anh',
    customerPhone: '0901234002',
    customerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
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
    conversationId: 'conv-002',
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
    bookingCode: 'BK-2024-001',
    serviceId: 'srv-001',
    serviceName: 'Giúp việc theo giờ',
    serviceIcon: 'clean',
    customerName: 'Nguyễn Thị Hoa',
    customerPhone: '0901234001',
    customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
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
];

// Open / Available Shifts waiting for staff to claim
let openShiftsState: StaffJobItem[] = [
  {
    id: 'open-101',
    bookingCode: 'BK-2024-101',
    serviceId: 'srv-001',
    serviceName: 'Dọn dẹp nhà theo giờ',
    serviceIcon: 'clean',
    customerName: 'Hoàng Bích Thủy',
    customerPhone: '0908889991',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
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
    status: 'ACCEPTED',
  },
  {
    id: 'open-102',
    bookingCode: 'BK-2024-102',
    serviceId: 'srv-001',
    serviceName: 'Tổng vệ sinh nhà phố',
    serviceIcon: 'sparkles',
    customerName: 'Vũ Đức Nam',
    customerPhone: '0917772223',
    customerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
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
    status: 'ACCEPTED',
  },
  {
    id: 'open-103',
    bookingCode: 'BK-2024-103',
    serviceId: 'srv-003',
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
    status: 'ACCEPTED',
  },
];

// Wallet state
let walletBalanceState = {
  available: 4320000,
  pending: 467500,
  totalEarned: 28500000,
  withdrawn: 24180000,
};

let walletTransactionsState: StaffWalletTransaction[] = [
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
];

// Availability slots state
let availabilitySlotsState: StaffAvailabilitySlot[] = [
  { id: 's-1a', dayOfWeek: 1, dayName: 'Thứ 2', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
  { id: 's-1b', dayOfWeek: 1, dayName: 'Thứ 2', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: true },
  { id: 's-1c', dayOfWeek: 1, dayName: 'Thứ 2', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 21:00', enabled: false },

  { id: 's-2a', dayOfWeek: 2, dayName: 'Thứ 3', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
  { id: 's-2b', dayOfWeek: 2, dayName: 'Thứ 3', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: true },
  { id: 's-2c', dayOfWeek: 2, dayName: 'Thứ 3', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 21:00', enabled: false },

  { id: 's-3a', dayOfWeek: 3, dayName: 'Thứ 4', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
  { id: 's-3b', dayOfWeek: 3, dayName: 'Thứ 4', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: true },
  { id: 's-3c', dayOfWeek: 3, dayName: 'Thứ 4', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 21:00', enabled: false },

  { id: 's-4a', dayOfWeek: 4, dayName: 'Thứ 5', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
  { id: 's-4b', dayOfWeek: 4, dayName: 'Thứ 5', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: true },
  { id: 's-4c', dayOfWeek: 4, dayName: 'Thứ 5', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 21:00', enabled: true },

  { id: 's-5a', dayOfWeek: 5, dayName: 'Thứ 6', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
  { id: 's-5b', dayOfWeek: 5, dayName: 'Thứ 6', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: true },
  { id: 's-5c', dayOfWeek: 5, dayName: 'Thứ 6', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 21:00', enabled: false },

  { id: 's-6a', dayOfWeek: 6, dayName: 'Thứ 7', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: true },
  { id: 's-6b', dayOfWeek: 6, dayName: 'Thứ 7', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: false },
  { id: 's-6c', dayOfWeek: 6, dayName: 'Thứ 7', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 21:00', enabled: false },

  { id: 's-0a', dayOfWeek: 0, dayName: 'Chủ nhật', shiftType: 'MORNING', shiftName: 'Ca sáng', timeRange: '08:00 - 12:00', enabled: false },
  { id: 's-0b', dayOfWeek: 0, dayName: 'Chủ nhật', shiftType: 'AFTERNOON', shiftName: 'Ca chiều', timeRange: '13:00 - 17:00', enabled: false },
  { id: 's-0c', dayOfWeek: 0, dayName: 'Chủ nhật', shiftType: 'EVENING', shiftName: 'Ca tối', timeRange: '17:30 - 21:00', enabled: false },
];

let operatingAreasState = {
  autoAccept: true,
  maxDistanceKm: 10,
  primaryDistrict: 'Bình Thạnh',
  selectedDistricts: ['Bình Thạnh', 'Quận 1', 'Quận 2', 'Quận 3', 'Phú Nhuận'],
};

// Event listeners for reactive state updates
type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((fn) => fn());

export const StaffService = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  getJobs(): StaffJobItem[] {
    return staffJobsState;
  },

  getOpenShifts(): StaffJobItem[] {
    return openShiftsState;
  },

  getJobById(id: string): StaffJobItem | undefined {
    return staffJobsState.find((j) => j.id === id) || openShiftsState.find((j) => j.id === id);
  },

  getActiveJob(): StaffJobItem | undefined {
    return staffJobsState.find((j) => j.status === 'IN_PROGRESS' || j.status === 'EN_ROUTE');
  },

  getUpcomingJobs(): StaffJobItem[] {
    return staffJobsState.filter((j) => j.status === 'ACCEPTED' || j.status === 'EN_ROUTE' || j.status === 'IN_PROGRESS');
  },

  getCompletedJobs(): StaffJobItem[] {
    return staffJobsState.filter((j) => j.status === 'COMPLETED');
  },

  claimOpenShift(shiftId: string): boolean {
    const idx = openShiftsState.findIndex((s) => s.id === shiftId);
    if (idx !== -1) {
      const shift = openShiftsState[idx];
      openShiftsState = openShiftsState.filter((s) => s.id !== shiftId);
      staffJobsState = [{ ...shift, status: 'ACCEPTED' }, ...staffJobsState];
      notify();
      return true;
    }
    return false;
  },

  updateJobStatus(jobId: string, status: JobStepStatus): void {
    const job = staffJobsState.find((j) => j.id === jobId);
    if (job) {
      job.status = status;
      if (status === 'COMPLETED') {
        walletBalanceState.available += job.netIncome;
        walletBalanceState.totalEarned += job.netIncome;
        walletTransactionsState = [
          {
            id: `tx-${Date.now()}`,
            title: `Tiền công ca ${job.bookingCode}`,
            date: 'Vừa xong',
            amount: job.netIncome,
            type: 'INCOME',
            status: 'SUCCESS',
            bookingCode: job.bookingCode,
          },
          ...walletTransactionsState,
        ];
      }
      notify();
    }
  },

  toggleChecklistItem(jobId: string, checkId: string): void {
    const job = staffJobsState.find((j) => j.id === jobId);
    if (job && job.checklist) {
      const item = job.checklist.find((c) => c.id === checkId);
      if (item) {
        item.done = !item.done;
        notify();
      }
    }
  },

  getWallet() {
    return {
      balance: walletBalanceState,
      transactions: walletTransactionsState,
    };
  },

  withdrawMoney(amount: number, bankName: string, accountNumber: string): boolean {
    if (amount <= 0 || amount > walletBalanceState.available) return false;
    walletBalanceState.available -= amount;
    walletBalanceState.withdrawn += amount;
    walletTransactionsState = [
      {
        id: `tx-${Date.now()}`,
        title: `Rút tiền về ${bankName} (${accountNumber.slice(-4)})`,
        date: 'Vừa xong',
        amount: amount,
        type: 'WITHDRAW',
        status: 'SUCCESS',
      },
      ...walletTransactionsState,
    ];
    notify();
    return true;
  },

  getAvailability() {
    return {
      slots: availabilitySlotsState.map((slot) => ({ ...slot })),
      areas: { ...operatingAreasState, selectedDistricts: [...operatingAreasState.selectedDistricts] },
    };
  },

  toggleShiftSlot(slotId: string) {
    const slot = availabilitySlotsState.find((item) => item.id === slotId);
    if (slot) {
      availabilitySlotsState = availabilitySlotsState.map((item) =>
        item.id === slotId ? { ...item, enabled: !item.enabled } : item
      );
      notify();
    }
  },

  updateOperatingAreas(settings: Partial<typeof operatingAreasState>) {
    operatingAreasState = { ...operatingAreasState, ...settings };
    notify();
  },

  getStaffReviews() {
    return mockReviews.filter((r) => r.staffId === 'staff-001');
  },
};
