export type UserId = string;
export type StaffId = string;

export interface StaffUserPair {
  staffId: StaffId;
  userId: UserId;
  fullName: string;
}

export const STAFF_USER_MAPPINGS: StaffUserPair[] = [
  { staffId: 'staff-001', userId: 'user-s01', fullName: 'Nguyễn Thị Hoa' },
  { staffId: 'staff-002', userId: 'user-s02', fullName: 'Trần Thị Mai' },
  { staffId: 'staff-003', userId: 'user-s03', fullName: 'Lê Văn Hùng' },
  { staffId: 'staff-004', userId: 'user-s04', fullName: 'Phạm Thị Lan' },
  { staffId: 'staff-005', userId: 'user-s05', fullName: 'Đỗ Văn Tuấn' },
  { staffId: 'staff-006', userId: 'user-s06', fullName: 'Hoàng Thị Nhung' },
  { staffId: 'staff-007', userId: 'user-s07', fullName: 'Vũ Minh Chiến' },
  { staffId: 'staff-008', userId: 'user-s08', fullName: 'Đặng Ngọc Ánh' },
  { staffId: 'staff-009', userId: 'user-s09', fullName: 'Bùi Văn Nam' },
  { staffId: 'staff-010', userId: 'user-s10', fullName: 'Ngô Thị Cúc' },
  { staffId: 'staff-011', userId: 'user-s11', fullName: 'Dương Văn Long' },
  { staffId: 'staff-012', userId: 'user-s12', fullName: 'Trịnh Thị Phương' },
];

export function getStaffIdByUserId(userId: UserId): StaffId | undefined {
  const match = STAFF_USER_MAPPINGS.find((m) => m.userId === userId);
  return match?.staffId;
}

export function getUserIdByStaffId(staffId: StaffId): UserId | undefined {
  const match = STAFF_USER_MAPPINGS.find((m) => m.staffId === staffId);
  return match?.userId;
}

export function isStaffUser(userId: UserId): boolean {
  return STAFF_USER_MAPPINGS.some((m) => m.userId === userId);
}
