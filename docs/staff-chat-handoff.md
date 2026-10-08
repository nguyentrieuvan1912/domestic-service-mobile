# Bàn giao Prompt 02 — Chat theo ca và người tham gia

Ngày kiểm tra: 08/10/2026. Đã đọc AGENTS.md, package.json, tài liệu Expo SDK 57 (Router và safe-area-context), hợp đồng booking/identity tại backend/docs/api-contracts. Hợp đồng hiện vẫn là draft/scaffold; không thêm endpoint hoặc thay enum backend.

## Kết quả và phạm vi file

- `src/app/chat/[id].tsx`: bỏ fallback; lấy actor từ AuthContext; header là người đối diện; xác định tin của mình qua senderId và mapping account/domain ID. Có loading, lỗi tải/thử lại, trống, gửi/đã gửi/thất bại/thử lại, khóa gửi và quay lại. Hủy request/timer khi rời màn. Không có reply tự động hoặc cuộc gọi giả.
- `src/data/chatRepository.ts`: repository mô phỏng có kiểu, kiểm tra account/participant và quyền booking khi đọc, resolve route và gửi; kiểm tra lại sau độ trễ xử lý; chống gửi trùng khi retry; lưu tin trong bộ nhớ của phiên ứng dụng và cập nhật preview hội thoại.
- `src/data/chatPolicy.ts`: adapter trạng thái trình bày `ACTIVE / AWAITING_ACCEPTANCE / CLOSED`, policy khóa nhập và timezone `Asia/Ho_Chi_Minh`. Mặc định cho gửi khi chờ nghiệm thu; `allowWhileAwaitingAcceptance` có thể đổi khi policy được chốt. Trạng thái lạ khóa gửi.
- `src/components/common/BookingChatLink.tsx`: resolve conversationId từ booking và actor, kiểm tra lại lúc nhấn. Thiếu mapping hoặc không có quyền hiển thị nút vô hiệu với lý do.
- `src/app/staff/jobs.tsx`, `src/app/staff/job-detail.tsx`: dùng BookingChatLink cho ca của mình; chat lịch sử cũng truy cập được nếu có mapping. Sửa thông báo lỗi mở ứng dụng điện thoại để không nói đã gọi.
- `src/app/(tabs)/chat.tsx`: lọc hội thoại có quyền theo tài khoản, cập nhật preview khi gửi, dùng timezone chung, giữ đúng người đối diện.
- `src/app/booking/[id].tsx`, `src/app/booking/matching.tsx`: thay route chat cố định bằng resolve theo booking và Staff đối diện. Bỏ lời hứa tổng đài mã hóa/gọi bảo mật chưa có ở chi tiết booking; nút gọi nền tảng hiển thị chưa hỗ trợ.
- `src/data/staffRepository.ts`: thêm customerId và metadata chat chờ nghiệm thu cho fixture liên quan; BK-031 dùng `conv-staff-031`, BK-001 dùng `conv-002`. Không sửa workflow/enum tiến độ chung.
- `src/data/conversations.ts`, `src/data/messages.ts`: sửa Huy–Hoa, thêm chat trống và chat Tuấn; bỏ lời hứa mã hóa. Tin BK-023 dùng ISO `+07:00` và giờ phù hợp fixture ca 14:00–17:00.
- `src/data/customers.ts`, `src/data/users.ts`: tên `cust-004 / user-c04` thống nhất là Trần Gia Huy.
- `scripts/test-chat.mjs`, `package.json`: chạy thêm kiểm tra repository/rule chat trong script `npm test`, không thêm thư viện.

Các thay đổi sẵn có của Prompt 01 và phần khác được giữ nguyên. Không thay StaffBottomNav hay 5 tab Staff.

## Route và fixture kiểm tra

Route dùng chung: `/chat/[id]`, trong đó `id` luôn là conversationId. Điểm mở Staff: `/staff/jobs` và `/staff/job-detail?id=<bookingId>`. Điểm mở Customer dùng resolver: tab tin nhắn, chi tiết booking và màn matching.

| Tài khoản / ca | Route chat | Kết quả |
| --- | --- | --- |
| Staff Hoa: `staff-001 / user-s01`, BK-2024-023 | `/chat/conv-001` | Trần Gia Huy, ca đang hoạt động; gửi với `senderType=STAFF`, `senderId=staff-001` |
| Staff Hoa, BK-2024-031 | `/chat/conv-staff-031` | Lê Minh Anh, chưa có tin nhắn |
| Staff Hoa, BK-2024-001 | `/chat/conv-002` | Khách Nguyễn Thị Hoa, ca kết thúc; đọc lịch sử, không nhập/gửi |
| Staff Tuấn: `staff-005 / user-s05`, BK-2024-042 | `/chat/conv-tuan-01` | Hoàng Minh Tuấn, chờ nghiệm thu; cho gửi theo policy mặc định |
| Staff Hoa mở chat của Tuấn hoặc ngược lại | Hai route trên | Không có quyền truy cập và có nút quay lại |
| `/chat/bk-023`, `/chat/id-khong-ton-tai` | ID booking / ID sai | Không tìm thấy; không mở hội thoại khác |
| Customer Huy: `cust-004 / user-c04` | `/chat/conv-001` | Đối diện là Staff Hoa; gửi với `CUSTOMER / cust-004` |
| Customer mẫu: `cust-001 / user-c01` | `/chat/conv-002` | Đối diện là Staff Hoa; bong bóng Customer ở phía mình; chat đóng |

Login đã có nút demo NV 1 (Hoa), NV 2 (Tuấn) và Customer mẫu. Khách của BK-031/BK-042 dùng domain ID `cust-demo-031 / cust-demo-042` trong fixture Staff; chưa có tài khoản đăng nhập riêng cho hai khách này.

## Kiểm tra

- `npx tsc --noEmit`: thành công cả trước thay đổi và sau thay đổi.
- `npm test`: thành công bộ 6 nhóm Staff cũ và bộ chat mới. Kiểm tra ID sai, thiếu mapping, không thuộc participant, participant nhưng sai booking, giả mapping account/domain, actor Staff/Customer, trạng thái đóng/chờ nghiệm thu, policy khóa, tải lỗi/thử lại, gửi lỗi/thử lại không trùng, lưu tin khi mở lại, hủy request, ca kết thúc trong lúc gửi. Test không gọi API hay dịch vụ liên lạc.
- ESLint riêng chat screen, repository, policy, BookingChatLink, danh sách chat và test: 0 lỗi, 0 cảnh báo. Các điểm mở chat có cảnh báo unused sẵn có; không có lỗi mới.
- `npm run lint -- -- --format json --output-file E:/KhoaLuanTN/outputs/staff-chat-script-lint.json`: chưa qua vì 64 lỗi và 60 cảnh báo nền. Lỗi: `src/app/ai/index.tsx` (1), `src/app/booking/new.tsx` (34), `CenterAIMascotTabButton.tsx` (16), `StaffCard.tsx` (2), `src/data/index.ts` (10), `use-color-scheme.web.ts` (1). Các file có lỗi này không được sửa trong Prompt 02. Repo chưa có ESLint config; Expo tự tạo config tạm bằng các package ESLint đã có trong node_modules, config đã được dọn sau kiểm tra. Không thay dependency/lockfile.
- Android Expo Go trên emulator-5554: mở chat từ nút BK-023; header Trần Gia Huy, tin Staff phía mình; gửi một tin mô phỏng và thấy Đã gửi; mở chat Staff khác bị chặn; ID booking dùng nhầm báo không tìm thấy; chat đóng không có ô nhập; chat BK-031 trống; Tuấn mở đúng Hoàng Minh Tuấn/chờ nghiệm thu; Customer mẫu hiển thị đúng header Staff và phía bong bóng. Không bấm gọi hay gửi dịch vụ thật.
- Ô nhập/nút gửi ở trên safe-area Android. Đã kiểm tra nhập bằng bàn phím phần cứng và IME nổi của emulator; chưa kiểm tra bàn phím mềm toàn màn hình hoặc iOS. Thử cấu hình bàn phím emulator xong đã khôi phục giá trị ban đầu.
- Ảnh QA nằm ngoài repo tại `E:/KhoaLuanTN/outputs/staff-chat-sent.png`, `staff-chat-forbidden.png`, `staff-chat-closed.png`, `staff-chat-empty.png`, `staff-chat-tuan-review.png`, `staff-chat-customer-closed.png`, `staff-chat-keyboard.png`.

## Còn mô phỏng / chờ tích hợp

Tin thành công được lưu trong bộ nhớ phiên, dùng chung giữa actor và khi mở lại route; khởi động lại/reload ứng dụng sẽ trở về fixture. Không có lưu backend, realtime/WebSocket, VoIP, mã hóa đầu cuối hoặc tổng đài ẩn số. Nút gọi chat/nền tảng vô hiệu; nút gọi trực tiếp sẵn có ở chi tiết Staff chỉ mở trình quay số thiết bị và không được thử trong QA.

`CHAT_DEMO_CONFIG` mặc định chỉ thêm độ trễ 350 ms. `failNextLoad` và `failNextSend` là công tắc QA một lần, được test bật trong process test riêng; không có lỗi ngẫu nhiên hoặc reply tự động trong sản phẩm. Tất cả timer của thao tác màn hình được hủy theo AbortSignal khi unmount.

Chờ nghiệm thu là metadata `chatAwaitingAcceptance` trên assignment IN_PROGRESS của fixture BK-042, không phải enum DTO mới. Bộ tiến độ Staff hiện vẫn có IN_PROGRESS → COMPLETED; cần hợp đồng nghiệm thu thật để thay metadata demo bằng adapter DTO. Các ca vừa nhận hoặc ca chưa có mapping không tự tạo hội thoại; nút cho biết ca chưa liên kết chat. Quyền hiện được kiểm tra ở repository cục bộ; khi nối API cần server kiểm tra participant và booking tương ứng.
