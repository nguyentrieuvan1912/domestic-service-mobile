import { Refund } from '../types/payment';

export const mockRefunds: Refund[] = [
  // rf-001 (Processed for bk-031)
  {
    id: 'rf-001',
    paymentId: 'pay-031',
    bookingId: 'bk-031',
    customerId: 'cust-005',
    amount: 320000,
    reason: 'Khách hàng hủy đơn trước thời hạn quy định (18 giờ)',
    status: 'PROCESSED',
    createdAt: '2024-06-10T15:05:00Z',
    processedAt: '2024-06-10T15:30:00Z',
    adminNote: 'Đã hoàn trả 100% tiền qua cổng VNPAY, mã giao dịch REF-99120',
  },
  // rf-002 (Pending - Khách khiếu nại dịch vụ)
  {
    id: 'rf-002',
    paymentId: 'pay-016',
    bookingId: 'bk-016',
    customerId: 'cust-003',
    amount: 100000,
    reason: 'Khách hàng yêu cầu hoàn một phần do nhân viên hoàn thành sớm hơn thời gian dự kiến',
    status: 'PENDING',
    createdAt: '2024-06-12T10:00:00Z',
    adminNote: 'Đang xác minh lại biên bản nghiệm thu và dữ liệu GPS của nhân viên',
  },
  // rf-003 (Processed - Hoàn tiền cọc do hệ thống hủy)
  {
    id: 'rf-003',
    paymentId: 'pay-012',
    bookingId: 'bk-012',
    customerId: 'cust-004',
    amount: 50000,
    reason: 'Áp dụng mã giảm giá bù do hệ thống bảo trì chậm trễ kết nối',
    status: 'PROCESSED',
    createdAt: '2024-06-03T17:00:00Z',
    processedAt: '2024-06-03T17:15:00Z',
    adminNote: 'Hoàn lại qua ví ZaloPay',
  },
  // rf-004 (Rejected - Khách hủy sát giờ vi phạm chính sách)
  {
    id: 'rf-004',
    paymentId: 'pay-010',
    bookingId: 'bk-010',
    customerId: 'cust-001',
    amount: 300000,
    reason: 'Yêu cầu hoàn tiền sau khi nhân viên đã có mặt tại địa chỉ',
    status: 'REJECTED',
    createdAt: '2024-05-10T14:00:00Z',
    processedAt: '2024-05-10T15:00:00Z',
    adminNote: 'Từ chối theo điều khoản dịch vụ khoản 4.2: Nhân viên đã di chuyển đến nơi',
  },
  // rf-005 (Processed)
  {
    id: 'rf-005',
    paymentId: 'pay-007',
    bookingId: 'bk-007',
    customerId: 'cust-007',
    amount: 80000,
    reason: 'Khách thanh toán trùng 2 lần trên cổng VNPAY',
    status: 'PROCESSED',
    createdAt: '2024-06-08T15:10:00Z',
    processedAt: '2024-06-08T15:40:00Z',
    adminNote: 'Đối soát cổng ngân hàng thành công và hoàn trả giao dịch trùng',
  },
];
