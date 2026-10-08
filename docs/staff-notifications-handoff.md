# Bàn giao Prompt 03 — Thông báo theo tài khoản

Ngày kiểm tra: 08/10/2026. Phạm vi: thông báo Staff và thay đổi tối thiểu màn dùng chung/Customer để giữ đúng ownership và badge. Giữ nguyên 5 tab Staff. Không thay đổi backend, enum DTO, booking/finance hay tích hợp push.

## File triển khai

| File | Thay đổi |
| --- | --- |
| `src/types/notification.ts` | Metadata target có kiểu; giữ NotificationType hiện tại. Target là mô hình điều hướng UI, không phải enum DTO mới. |
| `src/data/notificationAdapter.ts` | Actor từ AuthContext/currentUser; ownership bằng **userId** + role; nhóm riêng Staff/Customer; target legacy; thời gian theo Asia/Ho_Chi_Minh. |
| `src/data/notificationRepository.ts` | Danh sách có quyền trước khi lọc nhóm, sắp theo thời điểm ISO, đọc từng/đọc tất cả đúng tài khoản, kiểm tra target tồn tại và quyền, lỗi/thử lại/hủy, snapshot dùng chung. |
| `src/data/notificationTargetFixtures.ts` | Snapshot chỉ đọc của lời mời/yêu cầu rút khi chưa có repository/màn tương ứng. |
| `src/data/notifications.ts` | Fixture Hoa/Tuấn, ca sắp bắt đầu, nghiệm thu, yêu cầu rút và target bị xóa; giữ fixture Customer/Staff khác. |
| `src/hooks/use-notifications.ts` | Snapshot theo tài khoản hiện tại, tự cập nhật sau thao tác đọc. |
| `src/components/common/NotificationItem.tsx` | Nhóm, thời gian, nội dung ngắn, đã/chưa đọc và trạng thái đang cập nhật. |
| `src/components/common/NotificationBadge.tsx` | Badge số chưa đọc; ẩn khi bằng 0. |
| `src/app/notifications/index.tsx` | Danh sách/nhóm/chip số chưa đọc, loading/empty/error/retry/success, đọc tất cả và mở target đúng vai trò. |
| `src/app/notifications/[id].tsx` | Chi tiết thông báo/nội dung chưa khả dụng, chặn tài khoản khác, nút quay lại, CTA vô hiệu có lý do. Chỉ tự đọc khi route đang được xem. |
| `src/app/staff/index.tsx` | Điểm mở thông báo và badge từ repository. |
| `src/app/(tabs)/index.tsx` | Badge riêng Customer từ cùng repository; bỏ dấu chấm chưa đọc cố định. |
| `src/app/_layout.tsx` | Đăng ký route chi tiết thông báo. |
| `scripts/test-notifications.mjs`, `package.json` | Thêm bộ test vào script `npm test` hiện có. |

Các thay đổi đã có từ Prompt 01/02 và catalog trong working tree được giữ lại.

## Route và quyền

- Chuông trên trang chủ Staff/Customer → `/notifications`.
- Ca đã nhận thuộc Staff → `/staff/job-detail?id={assignmentId}`. Kiểm tra lại bằng StaffRepository lúc bấm; không mở `/booking/...` của Customer.
- Customer chỉ mở `/booking/{id}` nếu booking thuộc customer được ánh xạ từ currentUser.id. Payment/refund legacy được resolve qua booking có quyền.
- Target lời mời, giao dịch, yêu cầu rút, restriction chưa có màn chi tiết riêng → `/notifications/{notificationId}` với nội dung, trạng thái và lý do chưa khả dụng. Lời mời còn chờ phản hồi, không tự nhận/từ chối. Giao dịch kiểm tra tồn tại trong ví đúng Staff và lấy số tiền từ ví; không chuyển tới màn Customer.
- Target bị xóa hoặc không có quyền → chi tiết thông báo và lý do cụ thể, không fallback ca/tài khoản khác. ID thông báo sai/tài khoản khác → màn chặn + quay lại.
- Hai nhánh BOOKING và OPPORTUNITY riêng biệt: BOOKING không được mở vị trí còn trống như thể đã nhận.

## Fixture kiểm tra

Đăng nhập demo ở `/auth/login`: chọn Nhân viên rồi **NV 1: Nguyễn Thị Hoa (Bình Thạnh)** hoặc **NV 2: Đỗ Văn Tuấn (Quận 1)**. Ownership dùng `user-s01`/`user-s05`; chỉ khi resolve ca/ví/restriction mới ánh xạ sang `staff-001`/`staff-005`.

| Notification ID | Tài khoản | Target/kết quả |
| --- | --- | --- |
| `notif-016` | Hoa | `invite-hoa-01`: lời mời Hoàng Bích Thủy, 09:00–12:00 ngày 09/10/2026, chờ chấp nhận; chi tiết chỉ đọc. |
| `notif-018` | Hoa | `bk-031`: ca Lê Minh Anh, 08:30–12:30 ngày mai; mở chi tiết Staff. |
| `notif-017` | Hoa | Nghiệm thu BK-2024-001, giao dịch `tx-003`, 272.000đ từ ví fixture; chi tiết thông báo. |
| `notif-020` | Hoa | BK-2024-015 / `tx-001`, 297.500đ; đã đọc. |
| `notif-hoa-withdraw-pending` | Hoa | `withdraw-hoa-pending`: đang xử lý, không xác nhận đã chuyển tiền. |
| `notif-hoa-withdraw-failed` | Hoa | `withdraw-hoa-failed`: không thành công; không có nút gửi yêu cầu rút thật. |
| `notif-hoa-deleted` | Hoa | `bk-deleted-hoa`: target không còn khả dụng. |
| `notif-031` | Tuấn | `bk-042`: chờ nghiệm thu; mở chi tiết Staff của Tuấn. Hoa bị chặn. |
| `notif-tuan-restriction` | Tuấn | `res-003`: restriction có sẵn, đã hết hạn 22/03/2024; lịch sử này không tạo restriction mới. |
| `notif-001`…`notif-015` | Customer | Không hiển thị cho Staff. Customer mẫu `user-c01` có 5 thông báo, 2 chưa đọc. |

Session mới: Hoa có 8 thông báo/6 chưa đọc, Tuấn 2/2. Nhóm Thu nhập của Tuấn rỗng. Staff `user-s07` không có thông báo (bộ test kiểm tra danh sách rỗng). Read state giữ khi đổi route/đổi tài khoản trong cùng runtime; reload ứng dụng khởi tạo lại fixture.

## Kiểm tra

- Đã đọc AGENTS.md, package.json/source hiện tại, hợp đồng identity/booking/finance trong backend docs và [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/). Không tự bổ sung endpoint hay enum backend.
- `npx tsc --noEmit`: đạt; repo chưa có script typecheck riêng.
- `npm test`: đạt 6 nhóm Staff transition, bộ chat và bộ notification. Notification kiểm tra ownership/userId-vs-staffId, role giả, target khác tài khoản, target bị xóa, nhóm/thứ tự timezone, Customer route, vị trí chưa nhận, snapshot không thể sửa, lỗi/thử lại, hủy timeout, đọc idempotent và đọc tất cả không tác động bất kỳ tài khoản khác.
- `npm run lint -- -- --format json --output-file ...`: exit 1 do lỗi nền. Trước/sau cùng **64 errors / 60 warnings**, so sánh file/rule/message không có lỗi/cảnh báo mới. Lỗi nằm ở AI (1), booking/new (34), CenterAIMascotTabButton (16), StaffCard (2), data/index (10), use-color-scheme.web (1). File cấu hình ESLint Expo tự tạo để kiểm tra được dọn sau kiểm tra; không cài thêm dependency.
- QA Android emulator `emulator-5554`, Expo Go: danh sách/badge Hoa 6; card rút đang xử lý mở chi tiết không thể thao tác chuyển tiền; ca BK-2024-031 mở đúng chi tiết Staff/Lê Minh Anh; lời mời có trạng thái chờ phản hồi; target bị xóa báo không còn khả dụng; direct link notification Tuấn từ Hoa bị chặn; đọc tất cả Hoa 6→0 và badge trang chủ 0; chuyển từ màn chặn qua login Tuấn vẫn **2 chưa đọc**, không tự đọc thông báo dưới màn login; nhóm Thu nhập Tuấn rỗng; đọc restriction giảm số chưa đọc; Customer vẫn 2 chưa đọc và card BK-2024-001 mở đúng chi tiết đơn hàng. Không gửi thông báo/push, gọi dịch vụ, gửi tin nhắn hay rút tiền thật.
- Chưa kiểm tra native iOS/web. Lỗi/thử lại/hủy thao tác được kiểm tra bằng test repository; chưa gây lỗi qua UI Android.
- Bằng chứng ngoài repo: `E:/KhoaLuanTN/outputs/staff-notifications-{home,list,withdrawal,deleted,tuan,customer}.png`; JSON lint trước/sau cùng thư mục.

Snapshot immutable/cached dùng theo [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) để badge hoạt động khi React Compiler đang bật. Chi tiết resolve quyền của StaffRepository mutable trên mỗi lần store cập nhật; scope nhỏ này dùng directive bỏ memo. Effect tự đọc chỉ chạy khi [route đang focus](https://docs.expo.dev/versions/v57.0.0/sdk/router/#usefocuseffecteffect-do_not_pass_a_second_prop) và hủy khi rời màn.

## Phần vẫn mô phỏng / chờ tích hợp

- NotificationRepository là store trong bộ nhớ, không lưu bền, không push realtime, không gọi API thông báo.
- Metadata lời mời/rút là snapshot demo chỉ đọc, không tạo booking, không nhận việc, không mutate số dư. Thiếu màn/repository chi tiết lời mời/giao dịch/rút/restriction được xử lý bằng detail thông báo có lý do chưa khả dụng.
- Đổi `NOTIFICATION_DEMO_CONFIG.failNextLoad` hoặc `.failNextRead` để thử lỗi một lần trong môi trường phát triển; retry dùng cùng thao tác, chỉ mutate sau thành công, timeout được dọn bằng AbortSignal. Test chạy trong process riêng và không làm thay đổi fixture ứng dụng.
- Backend phải thực thi authorization theo principal, ownership notification và quyền target. Kiểm tra phía mock hiện tại chỉ chuẩn bị hành vi UI; khi có API cần adapter DTO thật và endpoint read/read-all đúng tài khoản.
