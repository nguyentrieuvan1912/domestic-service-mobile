import type { StaffCapabilityRecord, CapabilityRestrictionRecord } from '../types/staff-capability';
import { mockStaffRestrictions } from './staffRestrictions';

// Explicit Admin-confirmed demo records; specialties/competencies never grant approval.
export const mockStaffCapabilities: readonly StaffCapabilityRecord[] = [
  { id: 'cap-hoa-hourly', staffId: 'staff-001', serviceId: 'srv-001', serviceName: 'Vệ sinh nhà theo giờ',
    experienceYears: 5, status: 'APPROVED', approvedAt: '2026-09-01T09:00:00+07:00', approvedByName: 'Bộ phận xác minh năng lực',
    staffMayViewApproval: true, staffMayViewNote: true, note: 'Đã xác nhận quy trình vệ sinh căn hộ và sử dụng hóa chất an toàn.',
    scope: ['Vệ sinh bề mặt, sàn, bếp và nhà tắm trong căn hộ.', 'Không bao gồm làm việc trên cao hoặc vệ sinh thiết bị điện lạnh.'],
    validFrom: '2024-01-01T00:00:00+07:00', validUntil: '2028-01-01T00:00:00+07:00' },
  { id: 'cap-hoa-deep', staffId: 'staff-001', serviceId: 'srv-002', serviceName: 'Tổng vệ sinh nhà cửa',
    experienceYears: 3, status: 'APPROVED', approvedAt: '2025-09-30T09:00:00+07:00', approvedByName: 'Bộ phận xác minh năng lực',
    staffMayViewApproval: true, staffMayViewNote: true, note: 'Cần xác minh lại trước khi nhận ca tổng vệ sinh mới.',
    scope: ['Tổng vệ sinh căn hộ và nhà phố.', 'Không bao gồm vệ sinh mặt ngoài kính trên cao.'],
    validFrom: '2025-10-01T00:00:00+07:00', validUntil: '2026-10-01T00:00:00+07:00' },
  { id: 'cap-hoa-laundry', staffId: 'staff-001', serviceId: 'srv-012', serviceName: 'Giặt ủi & Ủi đồ chuyên nghiệp',
    experienceYears: 2, status: 'APPROVED', approvedAt: '2026-05-01T09:30:00+07:00',
    approvedByName: 'Thông tin nội bộ không được cấp quyền', note: 'Ghi chú nội bộ không được cấp quyền',
    staffMayViewApproval: false, staffMayViewNote: false,
    scope: ['Phân loại và ủi quần áo gia đình theo nhãn chất liệu.', 'Không bao gồm xử lý vải cần giặt khô.'],
    validFrom: '2026-05-01T00:00:00+07:00', validUntil: '2027-05-01T00:00:00+07:00' },
  { id: 'cap-hoa-cooking', staffId: 'staff-001', serviceId: 'srv-011', serviceName: 'Nấu ăn gia đình',
    experienceYears: 0.5, status: 'PENDING', staffMayViewApproval: false, staffMayViewNote: true,
    note: 'Chưa hoàn tất xác minh an toàn thực phẩm.', scope: ['Chuẩn bị bữa ăn gia đình theo thực đơn thống nhất.'] },
  { id: 'cap-tuan-ac-cleaning', staffId: 'staff-005', serviceId: 'srv-004', serviceName: 'Vệ sinh máy lạnh',
    experienceYears: 6, status: 'APPROVED', approvedAt: '2026-09-01T10:00:00+07:00', approvedByName: 'Bộ phận xác minh kỹ thuật',
    staffMayViewApproval: true, staffMayViewNote: true, note: 'Được xác nhận vệ sinh máy lạnh treo tường và kiểm tra an toàn điện.',
    scope: ['Vệ sinh máy lạnh treo tường dân dụng.', 'Không bao gồm hệ thống lạnh công nghiệp.'],
    validFrom: '2026-09-01T00:00:00+07:00', validUntil: '2028-09-01T00:00:00+07:00' },
  { id: 'cap-tuan-ac-maintenance', staffId: 'staff-005', serviceId: 'srv-005', serviceName: 'Nạp gas & Bảo dưỡng máy lạnh',
    experienceYears: 4, status: 'APPROVED', approvedAt: '2026-09-01T10:30:00+07:00', approvedByName: 'Bộ phận xác minh kỹ thuật',
    staffMayViewApproval: true, staffMayViewNote: false,
    scope: ['Kiểm tra và bảo dưỡng máy lạnh dân dụng.', 'Nạp gas theo quy trình an toàn đã được xác nhận.'],
    validFrom: '2026-09-01T00:00:00+07:00', validUntil: '2028-09-01T00:00:00+07:00' },
];

// Legacy restrictions are adapted explicitly; never infer scope from free text.
const legacyTypes: Record<string, CapabilityRestrictionRecord['type']> = {
  'res-001': 'SERVICE_LIMIT', 'res-002': 'SUSPENSION', 'res-003': 'SUSPENSION', 'res-004': 'WARNING',
};
export const mockCapabilityRestrictions: readonly CapabilityRestrictionRecord[] = [
  ...mockStaffRestrictions.map((record) => ({ id: record.id, staffId: record.staffId,
    type: legacyTypes[record.id] ?? 'SUSPENSION', reason: record.reason,
    startsAt: record.startDate, endsAt: record.endDate, status: record.status })),
  { id: 'res-hoa-laundry', staffId: 'staff-001', type: 'SERVICE_LIMIT', serviceId: 'srv-012', status: 'ACTIVE',
    reason: 'Tạm dừng nhận dịch vụ giặt ủi trong thời gian xác minh lại quy trình bảo quản chất liệu.',
    startsAt: '2026-10-01T00:00:00+07:00', endsAt: '2026-10-15T00:00:00+07:00' },
];
