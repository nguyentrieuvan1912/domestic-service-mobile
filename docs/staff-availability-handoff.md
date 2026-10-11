# Bàn giao Prompt 05 — Lịch rảnh 7 ngày và khu vực

Ngày kiểm tra: 08/10/2026. Đã đọc AGENTS.md, package.json, source hiện tại, tài liệu Expo SDK 57 và hợp đồng Booking backend. Chỉ sửa Staff, không xây backend hoặc gọi endpoint availability tự đặt.

## File triển khai và route

| File | Thay đổi |
| --- | --- |
| `src/app/staff/availability.tsx` | Giữ route `/staff/availability`, chuyển sang màn lịch mới. |
| `src/components/staff/StaffAvailabilityEditor.tsx` | Thanh ngày, nhiều khoảng rảnh, picker 30 phút, thêm/sửa/xóa, sao chép, draft/saved, vùng đệm, khu vực, lưu/thử lại và xử lý rời màn. |
| `src/types/staff-availability.ts` | Read model và draft có kiểu; actor userId–staffId, snapshot, revision. |
| `src/data/staffAvailabilityRules.ts` | Timezone/horizon/config, ISO, normalize, containment, overlap và buffer. |
| `src/data/staffAreas.ts` | Giữ `mockStaffAreas` hiện có; bổ sung danh mục từ union khu vực vận hành và fixture dùng chung cho lịch, repository và kiểm tra việc phù hợp. |
| `src/data/staffAvailabilityRepository.ts` | Load/save mô phỏng, kiểm tra actor, clone bản gửi, lỗi/thử lại/hủy; không có endpoint mới. |
| `src/data/staffRepository.ts` | Saved schedule theo Staff, rolling horizon, commit atomically, overlay từ assignment thật của mock, cập nhật profile/khu vực và kiểm tra lại trước khi nhận vị trí. Thêm ISO cho các ca đang mở/đã nhận hiện tại và fixture buffer. |
| `src/data/staffService.ts` | Facade đọc snapshot mới, giữ compatibility với API cục bộ cũ. |
| `src/hooks/use-staff-service-eligibility.ts` | Kết hợp năng lực với lịch/khu vực đã lưu; cập nhật theo revision của store. |
| `src/app/staff/index.tsx` | Homepage hiển thị số khu vực/khoảng đã lưu, bỏ “bán kính quét việc”; CTA kiểm tra lịch theo đúng vị trí. |
| `src/app/staff/jobs.tsx`, `job-detail.tsx` | CTA nhận việc và lý do chưa đủ điều kiện dùng cùng saved schedule. Fixture không có số liên hệ được khóa gọi, không mở `tel:` rỗng; avatar trống dùng icon. |
| `scripts/test-staff-availability.mjs`, `package.json` | Bộ test rule và repository thật được thêm vào `npm test`. |

Điểm mở: tab thứ ba **Đăng ký lịch**, nút **Đăng ký lịch làm** trên homepage và route hiện có `/staff/availability`. Giữ nguyên năm tab Staff. Màn có nút quay lại, kể cả trạng thái không có actor hợp lệ. Customer không dùng hoặc bị chuyển đổi sang lịch này.

## Policy và trạng thái

- Cửa sổ gồm **hôm nay + 6 ngày tiếp theo**, tính ngày lịch tại `Asia/Ho_Chi_Minh`; ngày là `YYYY-MM-DD`, khoảng giờ nguồn ISO có offset `+07:00`, timestamp cập nhật lưu ISO UTC. `scheduleDates/localDate` ghi rõ lựa chọn này trong code. Qua nửa đêm, ngày mới vào horizon được để trống; không tự đăng ký rảnh. Draft của cửa sổ cũ bị từ chối khi lưu, có nút tải lại.
- `STAFF_SCHEDULE_POLICY`: 08:00–20:00, bước 30 phút, đệm 60 phút, hợp nhất khoảng chạm nhau. Khoảng đảo/ngoài giờ/chồng nhau bị từ chối. Mặc định chỉ yêu cầu **end ca <= 20:00**; buffer có thể nằm ngoài giờ hoạt động. Đây là giả định UI chờ chốt policy. Cờ `bufferMustEndWithinHours` hỗ trợ policy khác nếu được chốt, mặc định false.
- Booking phải nằm toàn bộ trong **một khoảng rảnh đã normalize**. 08–10 và 10–12 hợp nhất thành 08–12; hai khoảng thực sự chồng nhau báo lỗi để sửa. Khoảng rảnh không phải booking và không cần tự chèn buffer giữa các khoảng rảnh.
- Không nhận thêm booking trong ca/vùng đệm của booking khác. Đúng 60 phút trước hoặc sau được nhận; buffer không cộng vào giờ công. Không dùng GPS hoặc ETA.
- Overlay lấy từ assignments đúng Staff, không tạo một lịch booking song song. Ca đang được giữ/chưa hoàn tất phải nằm trọn trong lịch rảnh và khu vực đã chọn; xóa/sửa/sao chép làm mất điều kiện này bị chặn kèm mã ca và lý do. Không tự hủy hoặc chuyển nhân viên. Ca hoàn tất vẫn có buffer khi kiểm tra ca tiếp theo; không khóa sửa lịch như ca chưa hoàn tất.
- Nếu ca chưa có giờ hợp lệ, mock chặn lưu/nhận thêm và yêu cầu xác minh thay vì bỏ qua ca đó.
- Draft không cập nhật store, không gọi `toggleShiftSlot`. Sao chép thay các khoảng ở ngày chọn, chỉ tác động draft. Lưu mới commit lịch + khu vực, notify các màn đang đọc. Revision ngăn ghi đè lịch đã thay đổi; ca vừa được nhận sau lúc mở draft cũng được kiểm tra lại ở lần lưu.
- Quay lại, Android back hoặc chuyển tab khi dirty có **Lưu rồi rời / Bỏ thay đổi / Tiếp tục chỉnh sửa**. Hủy picker không thoát toàn màn. Lưu thất bại giữ draft và cho bấm lưu lại. Có loading, load error/retry, ngày rảnh trống, đang lưu và xác nhận đã lưu hiển thị trong trang, không dùng Alert thành công thay cho commit. Chưa có thay đổi thì nút lưu vô hiệu và có nhãn giải thích.

## Khu vực và compatibility

Danh mục fixture dùng tên khu vực hiện tại của Staff, có ID UI `area-*`; ít nhất một vùng, còn ca đã nhận ở nhiều vùng thì phải giữ các vùng đó. Homepage và kiểm tra nhận vị trí đọc cùng dữ liệu sau commit. Bán kính cũ không được dùng để thay thế khu vực: hồ sơ vận hành chưa có tọa độ điểm làm mốc đã xác nhận, nên màn không cho chỉnh bán kính. Khoảng cách trên card cũ vẫn là fixture, không đo GPS.

“Tự động nhận ca” thay bằng **Nhận thông báo việc phù hợp**. Giá trị legacy autoAccept lúc seed được ánh xạ sang preference này; autoAccept được đặt false và không có engine tự nhận. Toggle preference chỉ lưu lựa chọn, không tạo push/gửi thông báo mới. Ca luôn cần xác nhận và recheck. Legacy `availabilitySlots/getAvailability/toggleShiftSlot/updateOperatingAreas` vẫn giữ để tương thích mã cũ, nhưng màn mới dùng saved schedule riêng; weekly slots cũ không phải nguồn kiểm tra nhận ca v4. Không có dữ liệu tuần được lưu trên backend để migrate ở phiên này; calendar được seed fixture cục bộ, không khẳng định đã migrate dữ liệu người dùng thật.

## Fixture demo

Đăng nhập `/auth/login` → Nhân viên → **NV 1: Hoa** (`user-s01`, `staff-001`). Mốc ngày tương đối được tạo khi khởi tạo module, không sửa booking đang chạy thành ngày khác lúc đổi chip.

| Fixture | Giờ / kết quả |
| --- | --- |
| Ngày hôm nay | Ca `BK-2024-023` 14–17 giữ nguyên, có ISO; vùng đệm 13–14 và 17–18. |
| Ngày +1 | Ca `BK-2024-031` 08:30–12:30 giữ nguyên, có ISO. |
| Ngày +2, tại lần kiểm tra là **10/10/2026** | Lịch rảnh **08–12**, ca đã nhận `bk-demo-buffer` / `BK-DEMO-0800` **08–10**, chỉ **2 giờ công**; vùng đệm 07–08 và 10–11. |
| `open-buffer-1` / `BK-DEMO-BUFFER-1` | Ngày +2 **10:30–11:30**, bị chặn thiếu đệm 60 phút. |
| `open-buffer-2` / `BK-DEMO-BUFFER-2` | Ngày +2 **11–12**, đủ đệm và nằm trọn trong lịch đã lưu. Hoa đủ năng lực dọn nhà nên có thể nhận thủ công. |
| `open-104`, `open-105` từ yêu cầu demo trước | Dời sang **ngày +3 (11/10/2026 tại lần kiểm tra)**, 08–10 và 13–15:30, để tránh ca đã nhận ngày +1. Thời lượng/thu nhập giữ nguyên. |
| `open-101` | Ca 18–20 ngày +1; đủ khoảng cách với ca sáng, dùng ISO thay nhãn ngày làm nguồn rule. |
| Tuấn `user-s05`, `staff-005` | Chỉ thấy overlay của mình `BK-2024-042` 15–17; khu vực/preference riêng. |
| Ngô Thanh Tùng `user-s10`, `staff-010` | Các ngày chưa có khoảng rảnh; vẫn cần chọn khu vực khi đăng ký. |

Route kiểm tra ca: `/staff/job-detail?id=open-buffer-1` và `...?id=open-buffer-2`; nguồn pool dùng chung với homepage/Việc mới. Không chấp nhận các ca này trên máy ảo khi kiểm tra, để người dùng tiếp tục demo. Các mutation trong test chạy ở tiến trình riêng.

`AVAILABILITY_DEMO_CONFIG.failNextLoad/failNextSave` tạo lỗi một lần để kiểm tra retry; latency mặc định 300ms. Save được lưu trong memory của phiên ứng dụng, giữ qua chuyển màn nhưng reset khi reload toàn bộ ứng dụng. Không ghi backend, gửi push, nhắn tin, gọi điện hoặc chuyển tiền thật.

## Kiểm tra và giới hạn

- `npx tsc --noEmit`: qua.
- `npm test`: qua cả sáu bộ. Bộ lịch kiểm tra timezone tại nửa đêm, 7 ngày, 08:10, start >= end, ngoài 08–20, overlap/merge, chứa toàn bộ booking, cả hai cận buffer 60 phút, end=20 theo policy, actor/Staff khác, empty, clone/draft isolation, commit ảnh hưởng matching, load/save failure/retry/abort, revision, bảo vệ ca nhận sau khi đọc draft, và ví không cộng tiền khi nhận.
- `npm run lint -- -- --format json --output-file ...`: **64 lỗi nền, 57 cảnh báo**, baseline trước sửa **64/60**. Không có message/rule/file mới; bỏ ba cảnh báo unused import từ màn cũ. Cấu hình ESLint tự sinh dùng tạm để kiểm tra, không đưa vào thay đổi.
- Android emulator / Expo Go: mở màn hiện có, đổi ngày đúng; xem ca/vùng đệm; xóa interval chứa ca bị chặn; picker 30 phút và start=end lỗi; thêm vào draft; sao chép và bỏ draft; cả ba lựa chọn khi rời màn; lưu thông thường và lưu rồi rời; homepage chuyển 11 → 10 khoảng khi commit, giữ 10 khi bỏ draft và trở lại 11 sau lưu khôi phục. Hoa/Tuấn thấy overlay và số khu vực riêng (Hoa 4, Tuấn 5). Ca 10:30 bị khóa, ca 11h có nút nhận; CTA/safe area không bị tab che. Load/save failure/retry/abort được kiểm tra bằng repository test, không chèn lỗi vào phiên demo sản phẩm.

**Chờ API/policy**: Booking contract hiện mới là draft, chưa có DTO availability/area hoàn chỉnh. `AvailabilityDraft`, ngày/khoảng, `area-*`, matchNotifications, revision và trạng thái UI là đề xuất read/write model, không áp vào schema/enum backend. API thật cần chuyển ISO về timezone UI, IDs theo contract, server authorization, revision/đồng thời, hold/vị trí còn trống và recheck capability + schedule + buffer trong cùng thao tác nhận. Chưa triển khai Mode B nhiều Staff, engine ghép việc, push, GPS hoặc lưu bền ngoài memory.
