import { StaffAvailability } from '../types/user';

export const mockStaffAvailabilities: StaffAvailability[] = [
  // staff-001 (An) - T2 to T7
  { id: 'av-001', staffId: 'staff-001', dayOfWeek: 1, dayName: 'Thứ 2', startTime: '08:00', endTime: '12:00', isAvailable: true },
  { id: 'av-002', staffId: 'staff-001', dayOfWeek: 1, dayName: 'Thứ 2', startTime: '13:00', endTime: '17:00', isAvailable: true },
  { id: 'av-003', staffId: 'staff-001', dayOfWeek: 2, dayName: 'Thứ 3', startTime: '08:00', endTime: '12:00', isAvailable: true },
  { id: 'av-004', staffId: 'staff-001', dayOfWeek: 2, dayName: 'Thứ 3', startTime: '13:00', endTime: '17:00', isAvailable: true },
  { id: 'av-005', staffId: 'staff-001', dayOfWeek: 3, dayName: 'Thứ 4', startTime: '08:00', endTime: '12:00', isAvailable: true },
  { id: 'av-006', staffId: 'staff-001', dayOfWeek: 4, dayName: 'Thứ 5', startTime: '08:00', endTime: '17:00', isAvailable: true },
  { id: 'av-007', staffId: 'staff-001', dayOfWeek: 5, dayName: 'Thứ 6', startTime: '08:00', endTime: '17:00', isAvailable: true },
  { id: 'av-008', staffId: 'staff-001', dayOfWeek: 6, dayName: 'Thứ 7', startTime: '08:00', endTime: '12:00', isAvailable: true },

  // staff-002 (Mai) - T2 to CN
  { id: 'av-009', staffId: 'staff-002', dayOfWeek: 1, dayName: 'Thứ 2', startTime: '08:00', endTime: '16:00', isAvailable: true },
  { id: 'av-010', staffId: 'staff-002', dayOfWeek: 2, dayName: 'Thứ 3', startTime: '08:00', endTime: '16:00', isAvailable: true },
  { id: 'av-011', staffId: 'staff-002', dayOfWeek: 3, dayName: 'Thứ 4', startTime: '08:00', endTime: '16:00', isAvailable: true },
  { id: 'av-012', staffId: 'staff-002', dayOfWeek: 4, dayName: 'Thứ 5', startTime: '08:00', endTime: '16:00', isAvailable: true },
  { id: 'av-013', staffId: 'staff-002', dayOfWeek: 5, dayName: 'Thứ 6', startTime: '08:00', endTime: '16:00', isAvailable: true },
  { id: 'av-014', staffId: 'staff-002', dayOfWeek: 6, dayName: 'Thứ 7', startTime: '08:00', endTime: '18:00', isAvailable: true },
  { id: 'av-015', staffId: 'staff-002', dayOfWeek: 0, dayName: 'Chủ Nhật', startTime: '08:00', endTime: '12:00', isAvailable: true },

  // staff-003 (Hùng) - Afternoon/Evening
  { id: 'av-016', staffId: 'staff-003', dayOfWeek: 1, dayName: 'Thứ 2', startTime: '13:00', endTime: '20:00', isAvailable: true },
  { id: 'av-017', staffId: 'staff-003', dayOfWeek: 2, dayName: 'Thứ 3', startTime: '13:00', endTime: '20:00', isAvailable: true },
  { id: 'av-018', staffId: 'staff-003', dayOfWeek: 4, dayName: 'Thứ 5', startTime: '13:00', endTime: '20:00', isAvailable: true },
  { id: 'av-019', staffId: 'staff-003', dayOfWeek: 5, dayName: 'Thứ 6', startTime: '13:00', endTime: '20:00', isAvailable: true },
  { id: 'av-020', staffId: 'staff-003', dayOfWeek: 6, dayName: 'Thứ 7', startTime: '08:00', endTime: '18:00', isAvailable: true },

  // staff-004 (Lan)
  { id: 'av-021', staffId: 'staff-004', dayOfWeek: 1, dayName: 'Thứ 2', startTime: '07:30', endTime: '17:30', isAvailable: true },
  { id: 'av-022', staffId: 'staff-004', dayOfWeek: 2, dayName: 'Thứ 3', startTime: '07:30', endTime: '17:30', isAvailable: true },
  { id: 'av-023', staffId: 'staff-004', dayOfWeek: 3, dayName: 'Thứ 4', startTime: '07:30', endTime: '17:30', isAvailable: true },
  { id: 'av-024', staffId: 'staff-004', dayOfWeek: 4, dayName: 'Thứ 5', startTime: '07:30', endTime: '17:30', isAvailable: true },
  { id: 'av-025', staffId: 'staff-004', dayOfWeek: 5, dayName: 'Thứ 6', startTime: '07:30', endTime: '17:30', isAvailable: true },

  // staff-005 (Tuấn)
  { id: 'av-026', staffId: 'staff-005', dayOfWeek: 2, dayName: 'Thứ 3', startTime: '08:00', endTime: '18:00', isAvailable: true },
  { id: 'av-027', staffId: 'staff-005', dayOfWeek: 4, dayName: 'Thứ 5', startTime: '08:00', endTime: '18:00', isAvailable: true },
  { id: 'av-028', staffId: 'staff-005', dayOfWeek: 6, dayName: 'Thứ 7', startTime: '08:00', endTime: '18:00', isAvailable: true },
  { id: 'av-029', staffId: 'staff-005', dayOfWeek: 0, dayName: 'Chủ Nhật', startTime: '08:00', endTime: '18:00', isAvailable: true },

  // staff-006 (Nhung)
  { id: 'av-030', staffId: 'staff-006', dayOfWeek: 1, dayName: 'Thứ 2', startTime: '08:00', endTime: '14:00', isAvailable: true },
  { id: 'av-031', staffId: 'staff-006', dayOfWeek: 3, dayName: 'Thứ 4', startTime: '08:00', endTime: '14:00', isAvailable: true },
  { id: 'av-032', staffId: 'staff-006', dayOfWeek: 5, dayName: 'Thứ 6', startTime: '08:00', endTime: '14:00', isAvailable: true },

  // staff-008 (Ánh)
  { id: 'av-033', staffId: 'staff-008', dayOfWeek: 1, dayName: 'Thứ 2', startTime: '13:00', endTime: '19:00', isAvailable: true },
  { id: 'av-034', staffId: 'staff-008', dayOfWeek: 2, dayName: 'Thứ 3', startTime: '13:00', endTime: '19:00', isAvailable: true },
  { id: 'av-035', staffId: 'staff-008', dayOfWeek: 4, dayName: 'Thứ 5', startTime: '13:00', endTime: '19:00', isAvailable: true },
  { id: 'av-036', staffId: 'staff-008', dayOfWeek: 6, dayName: 'Thứ 7', startTime: '09:00', endTime: '17:00', isAvailable: true },

  // staff-012 (Phương)
  { id: 'av-037', staffId: 'staff-012', dayOfWeek: 2, dayName: 'Thứ 3', startTime: '08:00', endTime: '16:00', isAvailable: true },
  { id: 'av-038', staffId: 'staff-012', dayOfWeek: 3, dayName: 'Thứ 4', startTime: '08:00', endTime: '16:00', isAvailable: true },
  { id: 'av-039', staffId: 'staff-012', dayOfWeek: 5, dayName: 'Thứ 6', startTime: '08:00', endTime: '16:00', isAvailable: true },
  { id: 'av-040', staffId: 'staff-012', dayOfWeek: 6, dayName: 'Thứ 7', startTime: '08:00', endTime: '16:00', isAvailable: true },
];
