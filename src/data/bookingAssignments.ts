import { BookingAssignment } from '../types/booking';

export const mockBookingAssignments: BookingAssignment[] = [
  // bk-001: Staff An
  {
    id: 'asg-001',
    bookingId: 'bk-001',
    staffId: 'staff-001',
    status: 'ACCEPTED',
    assignedAt: '2024-06-10T09:16:00Z',
    acceptedAt: '2024-06-10T09:20:00Z',
  },
  // bk-002: Staff Mai
  {
    id: 'asg-002',
    bookingId: 'bk-002',
    staffId: 'staff-002',
    status: 'ACCEPTED',
    assignedAt: '2024-06-09T11:02:00Z',
    acceptedAt: '2024-06-09T11:15:00Z',
  },
  // bk-003: Staff Lan
  {
    id: 'asg-003',
    bookingId: 'bk-003',
    staffId: 'staff-004',
    status: 'ACCEPTED',
    assignedAt: '2024-06-10T14:35:00Z',
    acceptedAt: '2024-06-10T14:40:00Z',
  },
  // bk-004: Mode B 2 Staff (Hùng + Chiến)
  {
    id: 'asg-004a',
    bookingId: 'bk-004',
    staffId: 'staff-003', // Hùng
    status: 'ACCEPTED',
    assignedAt: '2024-06-06T10:05:00Z',
    acceptedAt: '2024-06-06T10:15:00Z',
  },
  {
    id: 'asg-004b',
    bookingId: 'bk-004',
    staffId: 'staff-007', // Chiến
    status: 'ACCEPTED',
    assignedAt: '2024-06-06T10:05:00Z',
    acceptedAt: '2024-06-06T10:20:00Z',
  },
  // bk-005: Staff An
  {
    id: 'asg-005',
    bookingId: 'bk-005',
    staffId: 'staff-001',
    status: 'ACCEPTED',
    assignedAt: '2024-06-07T08:05:00Z',
    acceptedAt: '2024-06-07T08:10:00Z',
  },
  // bk-006: Staff Mai
  {
    id: 'asg-006',
    bookingId: 'bk-006',
    staffId: 'staff-002',
    status: 'ACCEPTED',
    assignedAt: '2024-06-05T19:05:00Z',
    acceptedAt: '2024-06-05T19:15:00Z',
  },
  // bk-007: Staff Hùng
  {
    id: 'asg-007',
    bookingId: 'bk-007',
    staffId: 'staff-003',
    status: 'ACCEPTED',
    assignedAt: '2024-06-08T15:05:00Z',
    acceptedAt: '2024-06-08T15:25:00Z',
  },
  // bk-008: Staff Lan
  {
    id: 'asg-008',
    bookingId: 'bk-008',
    staffId: 'staff-004',
    status: 'ACCEPTED',
    assignedAt: '2024-06-04T10:05:00Z',
    acceptedAt: '2024-06-04T10:12:00Z',
  },
  // bk-009: Staff Tuấn
  {
    id: 'asg-009',
    bookingId: 'bk-009',
    staffId: 'staff-005',
    status: 'ACCEPTED',
    assignedAt: '2024-06-08T09:05:00Z',
    acceptedAt: '2024-06-08T09:30:00Z',
  },
  // bk-010: Staff An
  {
    id: 'asg-010',
    bookingId: 'bk-010',
    staffId: 'staff-001',
    status: 'ACCEPTED',
    assignedAt: '2024-06-03T11:05:00Z',
    acceptedAt: '2024-06-03T11:10:00Z',
  },
  // bk-011: Staff Mai
  {
    id: 'asg-011',
    bookingId: 'bk-011',
    staffId: 'staff-002',
    status: 'ACCEPTED',
    assignedAt: '2024-06-03T14:05:00Z',
    acceptedAt: '2024-06-03T14:20:00Z',
  },
  // bk-012: Staff Hùng
  {
    id: 'asg-012',
    bookingId: 'bk-012',
    staffId: 'staff-003',
    status: 'ACCEPTED',
    assignedAt: '2024-06-02T09:05:00Z',
    acceptedAt: '2024-06-02T09:18:00Z',
  },
  // bk-013: Staff Nhung
  {
    id: 'asg-013',
    bookingId: 'bk-013',
    staffId: 'staff-006',
    status: 'ACCEPTED',
    assignedAt: '2024-06-03T16:05:00Z',
    acceptedAt: '2024-06-03T16:15:00Z',
  },
  // bk-014: Staff An
  {
    id: 'asg-014',
    bookingId: 'bk-014',
    staffId: 'staff-001',
    status: 'ACCEPTED',
    assignedAt: '2024-06-01T10:05:00Z',
    acceptedAt: '2024-06-01T10:10:00Z',
  },
  // bk-015: Staff Lan
  {
    id: 'asg-015',
    bookingId: 'bk-015',
    staffId: 'staff-004',
    status: 'ACCEPTED',
    assignedAt: '2024-05-29T11:05:00Z',
    acceptedAt: '2024-05-29T11:20:00Z',
  },
  // bk-016: Staff Mai
  {
    id: 'asg-016',
    bookingId: 'bk-016',
    staffId: 'staff-002',
    status: 'ACCEPTED',
    assignedAt: '2024-05-26T18:05:00Z',
    acceptedAt: '2024-05-26T18:30:00Z',
  },
  // bk-017: Staff Tuấn
  {
    id: 'asg-017',
    bookingId: 'bk-017',
    staffId: 'staff-005',
    status: 'ACCEPTED',
    assignedAt: '2024-05-24T12:05:00Z',
    acceptedAt: '2024-05-24T12:15:00Z',
  },
  // bk-018: Staff Chiến
  {
    id: 'asg-018',
    bookingId: 'bk-018',
    staffId: 'staff-007',
    status: 'ACCEPTED',
    assignedAt: '2024-05-21T09:05:00Z',
    acceptedAt: '2024-05-21T09:12:00Z',
  },
  // bk-019: Staff Ánh
  {
    id: 'asg-019',
    bookingId: 'bk-019',
    staffId: 'staff-008',
    status: 'ACCEPTED',
    assignedAt: '2024-05-19T10:05:00Z',
    acceptedAt: '2024-05-19T10:15:00Z',
  },
  // bk-020: Staff Phương
  {
    id: 'asg-020',
    bookingId: 'bk-020',
    staffId: 'staff-012',
    status: 'ACCEPTED',
    assignedAt: '2024-05-17T11:05:00Z',
    acceptedAt: '2024-05-17T11:18:00Z',
  },
  // bk-021: Staff An (Chưa review)
  {
    id: 'asg-021',
    bookingId: 'bk-021',
    staffId: 'staff-001',
    status: 'ACCEPTED',
    assignedAt: '2024-06-11T16:05:00Z',
    acceptedAt: '2024-06-11T16:10:00Z',
  },
  // bk-022: Staff Mai (Chưa review)
  {
    id: 'asg-022',
    bookingId: 'bk-022',
    staffId: 'staff-002',
    status: 'ACCEPTED',
    assignedAt: '2024-06-11T19:05:00Z',
    acceptedAt: '2024-06-11T19:15:00Z',
  },
  // bk-023: Staff An (Đang làm - IN_PROGRESS)
  {
    id: 'asg-023',
    bookingId: 'bk-023',
    staffId: 'staff-001',
    status: 'ACCEPTED',
    assignedAt: '2024-06-11T10:05:00Z',
    acceptedAt: '2024-06-11T10:12:00Z',
  },
  // bk-024: Staff Mai (Đang làm - IN_PROGRESS)
  {
    id: 'asg-024',
    bookingId: 'bk-024',
    staffId: 'staff-002',
    status: 'ACCEPTED',
    assignedAt: '2024-06-11T15:05:00Z',
    acceptedAt: '2024-06-11T15:10:00Z',
  },
  // bk-025: Staff Lan (ACCEPTED)
  {
    id: 'asg-025',
    bookingId: 'bk-025',
    staffId: 'staff-004',
    status: 'ACCEPTED',
    assignedAt: '2024-06-12T08:05:00Z',
    acceptedAt: '2024-06-12T08:20:00Z',
  },
  // bk-026: Staff Nhung (ACCEPTED)
  {
    id: 'asg-026',
    bookingId: 'bk-026',
    staffId: 'staff-006',
    status: 'ACCEPTED',
    assignedAt: '2024-06-12T09:35:00Z',
    acceptedAt: '2024-06-12T09:50:00Z',
  },
  // bk-027: Staff An (ASSIGNED - Chưa accept)
  {
    id: 'asg-027',
    bookingId: 'bk-027',
    staffId: 'staff-001',
    status: 'ASSIGNED',
    assignedAt: '2024-06-12T14:05:00Z',
  },
  // bk-032: Staff Thủy (CANCELLED do staff hủy)
  {
    id: 'asg-032',
    bookingId: 'bk-032',
    staffId: 'staff-010',
    status: 'CANCELLED',
    assignedAt: '2024-05-14T11:05:00Z',
    acceptedAt: '2024-05-14T11:15:00Z',
    cancellationReason: 'Nhân viên báo sự cố hỏng xe',
  },
  // bk-033: Staff Tuấn (REJECTED)
  {
    id: 'asg-033',
    bookingId: 'bk-033',
    staffId: 'staff-005',
    status: 'REJECTED',
    assignedAt: '2024-06-11T11:35:00Z',
    rejectedAt: '2024-06-11T12:00:00Z',
  },
];
