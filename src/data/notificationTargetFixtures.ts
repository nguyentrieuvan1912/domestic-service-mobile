// Read-only snapshots for targets whose product screens/API are not implemented.
// Labels are presentation states, not booking/finance DTOs or wallet mutations.
export interface NotificationDetailFixture { id: string; userId: string; summary: string; statusLabel: string }
export const notificationInvitationFixtures: readonly NotificationDetailFixture[] = [
  { id: 'invite-hoa-01', userId: 'user-s01', statusLabel: 'Chờ bạn phản hồi',
    summary: 'Khách Hoàng Bích Thủy chọn Nguyễn Thị Hoa cho ca giúp việc 09:00–12:00 ngày 09/10/2026 tại Bình Thạnh. Lời mời cần bạn chấp nhận.' },
];
export const notificationWithdrawalFixtures: readonly NotificationDetailFixture[] = [
  { id: 'withdraw-hoa-pending', userId: 'user-s01', statusLabel: 'Đang xử lý',
    summary: 'Yêu cầu đang chờ đối soát. Chưa xác nhận tiền đã chuyển tới tài khoản nhận.' },
  { id: 'withdraw-hoa-failed', userId: 'user-s01', statusLabel: 'Không thành công',
    summary: 'Thông tin tài khoản nhận cần được kiểm tra lại. Chưa có xác nhận chuyển tiền thành công.' },
];
