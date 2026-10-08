# Bàn giao Prompt 04 — Năng lực được xác nhận

Kiểm tra ngày 08/10/2026, Expo SDK 57. Phạm vi: mục năng lực hiện có của Staff, điều kiện nhận việc và hai việc demo được yêu cầu bổ sung. Không tạo trang skills song song, không thay backend/schema hoặc triển khai các prompt khác.

## File và điểm mở

| File | Nội dung |
| --- | --- |
| `src/types/staff-capability.ts` | Read model có kiểu cho năng lực, trạng thái trình bày, restriction và actor. |
| `src/data/staffCapabilities.ts` | Fixture Admin xác nhận theo Staff; fixture restriction theo dịch vụ. |
| `src/data/staffCapabilityAdapter.ts` | Ánh xạ trạng thái, hiệu lực, restriction, ẩn trường không được phép xem; ngày giờ Asia/Ho_Chi_Minh. |
| `src/data/staffCapabilityRepository.ts` | Đọc hồ sơ đúng userId–staffId; kiểm tra quyền/hiệu lực khi nhận việc; loading/lỗi/thử lại/hủy. Không có hàm tự thêm hoặc duyệt năng lực. |
| `src/hooks/use-staff-capabilities.ts` | Tải khi focus, hủy khi rời màn, ngăn dữ liệu tài khoản trước hiện trên tài khoản mới. |
| `src/hooks/use-staff-service-eligibility.ts` | Dùng cùng dữ liệu để hiển thị điều kiện và vô hiệu CTA nhận việc. |
| `src/components/staff/StaffCapabilitySection.tsx` | List, chi tiết chỉ đọc, empty/error/retry, hướng dẫn xác minh. Export `CapabilityRestrictionSummary` để phần chất lượng tái dùng sau. |
| `src/app/staff/account-details.tsx` | Thay 4 dịch vụ tĩnh bằng mục năng lực hiện tại. |
| `src/app/staff/profile.tsx` | Menu “Năng lực được xác nhận”, số đủ điều kiện từ cùng repository, badge hồ sơ theo dữ liệu. |
| `src/app/staff/index.tsx`, `jobs.tsx`, `job-detail.tsx` | Giải thích điều kiện năng lực, khóa nhận nếu thiếu/hết hiệu lực/bị hạn chế; badge xác minh trên trang chủ theo hồ sơ. |
| `src/data/staffRepository.ts` | Kiểm tra lại năng lực trước khi lấy vị trí khỏi pool; sửa serviceId của việc tổng vệ sinh/nấu ăn; thêm hai việc demo. |
| `scripts/test-staff-capabilities.mjs`, `package.json` | Test quyền, hiệu lực, redaction, restriction và mutation nhận ca thật trong repository cục bộ. |

Profile → `/staff/account-details?section=skills`. Chạm card → cùng route với `capabilityId`. Chi tiết có quay lại; ID sai hoặc của Staff khác hiện trạng thái không tìm thấy, không fallback. Giữ 5 tab Staff. Nút hướng dẫn mở nội dung trong trang, không gửi yêu cầu hoặc báo gửi thành công.

## Fixture

Ở `/auth/login`, chọn Nhân viên và tài khoản mẫu:

| Tài khoản | Dữ liệu |
| --- | --- |
| Hoa `user-s01` / `staff-001` | `cap-hoa-hourly` còn hiệu lực; `cap-hoa-deep` hết hiệu lực 01/10/2026; `cap-hoa-laundry` bị giới hạn tới 15/10/2026; `cap-hoa-cooking` chờ xác nhận. Tổng 4, đủ điều kiện 1 tại ngày kiểm tra. |
| Tuấn `user-s05` / `staff-005` | `cap-tuan-ac-cleaning`, `cap-tuan-ac-maintenance`: 2 năng lực máy lạnh, không có năng lực dọn nhà. |
| Ngô Thanh Tùng `user-s10` / `staff-010` | Chưa có năng lực, hồ sơ chưa xác minh. Đăng nhập demo bằng `0912001010`, mật khẩu mẫu `123456`. |

`cap-hoa-laundry` cố ý có trường fixture nội bộ nhưng adapter không đưa ngày/người xác nhận và ghi chú đó ra view vì quyền xem là false. API thật phải loại bỏ trường không có quyền trên server; cờ client chỉ chuẩn bị giao diện.

`CAPABILITY_DEMO_CONFIG.failNextLoad = true` trong repository tạo lỗi tải một lần, retry sau đó thành công. Đây là công tắc kiểm tra trong mã demo, không phải tính năng của Staff.

### Hai việc mới để demo

Hai vị trí ở đầu pool, hiện trên Trang chủ → “Việc mới quanh bạn” và Ca làm việc → “Việc mới”. Đăng nhập Hoa để nhận được; Tuấn bị chặn vì thiếu năng lực dọn nhà.

| ID / mã | Địa điểm demo | Giờ ngày tiếp theo | Khoảng cách fixture | Thu nhập dự kiến |
| --- | --- | --- | --- | --- |
| `open-104` / `BK-DEMO-104` | 90 Nguyễn Hữu Cảnh, Bình Thạnh; Phạm Ngọc Mai | 08:00–10:00 | 0,6 km | 161.500đ |
| `open-105` / `BK-DEMO-105` | 135 Điện Biên Phủ, Bình Thạnh; Lê Minh Khang | 13:00–15:30 | 1,1 km | 199.750đ |

Chi tiết: `/staff/job-detail?id=open-104` và `...?id=open-105`. Ngày được tạo cho ngày tiếp theo khi khởi tạo ứng dụng, nguồn `startsAt/endsAt` ISO `+07:00`, giữ khi chuyển sang assignment. Hai ca cách nhau 3 giờ, nằm trong 08:00–20:00 và bước 30 phút. Khoảng cách là fixture, không đo GPS. Chấp nhận ca chỉ thay store cục bộ, chưa ghi thu nhập khi mới nhận. Reload toàn bộ ứng dụng khởi tạo lại dữ liệu demo; chuyển route không reset. Chat của hai ca chưa có mapping, màn chat báo chưa khả dụng theo policy hiện có.

## Contract và giới hạn

Đã đọc `docs/api-contracts` của backend. Booking contract chưa định nghĩa DTO năng lực. Migration hiện có tên trạng thái PENDING/APPROVED/REJECTED/INACTIVE, kinh nghiệm, ngày xác nhận và restriction; đây chưa phải hợp đồng API hoàn chỉnh. Không sửa enum hoặc migration backend.

**Đề xuất read DTO/UI cần chốt**: tên dịch vụ, phạm vi công việc, `validFrom/validUntil`, tên người xác nhận được phép hiển thị, ghi chú công khai và quyền xem các trường. Trạng thái VALID/EXPIRED/NOT_YET_VALID/SUSPENDED, số đủ điều kiện và `canReceive` là kết quả adapter UI. Hiệu lực kết thúc theo cận không bao gồm (`now >= validUntil` là hết hiệu lực), chưa phải policy backend đã chốt. Không hiển thị “mức kỹ năng” vì API contract chưa cung cấp dù DB có cột skill_level.

Restriction có phạm vi dịch vụ/toàn hồ sơ; WARNING không tự khóa nhận. Restriction đã hết hạn/thu hồi không khóa. Trạng thái hồ sơ SUSPENDED/RESTRICTED vẫn khóa. Không biến specialties/competencies do Staff khai thành năng lực được duyệt, không hủy ca đã nhận khi năng lực hết hạn.

Toàn bộ năng lực/nhận ca đang mock. API thật cần principal đáng tin cậy, ownership, trường được phép xem và kiểm tra lại năng lực/restriction cùng thao tác nhận. Chưa triển khai rule lịch v4 toàn hệ thống, kiểm tra năng lực tại ngày ca tương lai, Mode B nhiều người hoặc backend authorization. Các fixture ca cũ còn nhãn ngày dạng trình bày; chỉ hai ca mới có nguồn ISO bổ sung, không nâng cấp toàn bộ booking ngoài phạm vi.

## Kiểm tra

- `npx tsc --noEmit`: qua.
- `npm test`: qua tất cả bộ hiện có và test mới. Bao gồm cận hiệu lực, ownership/Staff khác, redaction, restriction, abort/lỗi/retry; thay đổi hiệu lực/restriction sau lần đọc vẫn bị chặn ở mutation; nhận hai ca mới chuyển đúng chủ, giữ ISO, không cộng ví.
- `npm run lint -- -- --format json --output-file ...`: còn **64 lỗi, 60 cảnh báo nền**, bằng baseline trước thay đổi và không có message/rule/file mới. Không tuyên bố lint sạch. Cấu hình ESLint tự sinh tạm chỉ dùng để so sánh, không đưa vào bàn giao.
- Android emulator / Expo Go: kiểm tra Hoa/Tuấn, danh sách và chi tiết read-only, số ở profile khớp, ngày/ghi chú có quyền, ID năng lực của Staff khác bị chặn, hết hiệu lực khóa nút nhận, năng lực hợp lệ cho phép nút, tài khoản không có năng lực và badge chưa xác minh. CTA hướng dẫn mở đúng 3 bước. Hai việc mới hiện đầu trang chủ, mở đúng mã/khách/thu nhập và nút nhận hoạt động; để chưa nhận cho người dùng demo. Loading/error/retry/abort được kiểm tra bằng repository test; không gửi yêu cầu hỗ trợ, nhắn tin, gọi hay chuyển tiền thật.

Đọc thêm `catalog-local-connection.md` cho lỗi màn dịch vụ Customer phát sinh trong phiên này.
