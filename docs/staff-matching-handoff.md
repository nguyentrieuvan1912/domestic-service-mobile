# Bàn giao Prompt 06 — Việc phù hợp có lọc và giải thích

Kiểm tra ngày 08/10/2026. Đã đọc AGENTS.md, package.json, source hiện tại, [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) và `domestic-service-backend/docs/api-contracts/{README,booking}.md`. Giữ các thay đổi Prompt 05 đang có trong working tree; không sửa luồng Customer hoặc schema/enum backend.

## File và điểm mở

| File | Phần triển khai Prompt 06 |
| --- | --- |
| `src/types/staff-matching.ts` | Public opportunity whitelist, context đúng actor, kết quả eligibility/check/reasons có mã, filter và sort. DTO UI đề xuất. |
| `src/data/staffMatchingRules.ts` | Hàm thuần đánh giá, tìm kiếm tiếng Việt có/không dấu, lọc quận, sort ổn định và phân loại empty state. |
| `src/data/staffMatchingRepository.ts` | Adapter xác minh userId–staffId; load/retry/abort, read/detail/online và claim mô phỏng. |
| `src/data/staffRepository.ts` | Read model scoped; privacy trước assignment; recheck mọi điều kiện trong claim lock; đếm/nhận vị trí Mode B nhiều Staff; fixture loại trừ và ca Tuấn. |
| `src/data/staffService.ts` | `getOpenShifts(staffId)` yêu cầu Staff ID và trả cùng ca đủ điều kiện như hai màn; không còn mặc định trả mọi ca. |
| `src/hooks/use-staff-matching.ts` | Loading/error/retry, scoped actor, focus refresh, subscription revision và clock cục bộ 30 giây; hủy timer/load khi rời màn. |
| `src/hooks/use-staff-service-eligibility.ts` | Compatibility: kiểm tra opportunity bằng evaluator mới; không dùng năng lực/lịch riêng để cho phép claim. |
| `src/types/staff-availability.ts`, `src/data/staffAvailabilityRules.ts` | Bổ sung mã lỗi lịch có kiểu cho matching; giữ câu tiếng Việt và rule/policy Prompt 05. |
| `src/components/staff/StaffMatchingList.tsx` | Card chung, sort picker, trạng thái rỗng với CTA, sheet giải thích và xác nhận một vị trí. CTA cố định ngoài nội dung sheet cuộn. |
| `src/app/staff/index.tsx` | Việc phù hợp chỉ lấy ca hợp lệ, hiển thị ba ca đầu và tổng chung; bật/tắt nhận việc commit vào store, giữ ca đang làm. Bỏ lời hứa bán kính và khoảng cách không có nguồn. |
| `src/app/staff/jobs.tsx` | Tab Việc mới dùng cùng nguồn, tìm kiếm/chip quận hiện có kết hợp eligibility; sort giờ/thu nhập. Ca đã nhận/lịch sử vẫn đọc assignments riêng. |
| `src/app/staff/job-detail.tsx` | Ca mở có lý do khóa và sheet, retry kiểm tra; ẩn tên/liên hệ/avatar/địa chỉ chi tiết/map trước assignment. Ca của người khác bị chặn. Sau nhận đọc assignment có quyền. |
| `scripts/test-staff-matching.mjs`, `package.json` | Test rule/repository/privacy/claims có ý nghĩa, bộ thứ bảy trong `npm test`. |

Route hiện có: `/staff` → **Việc phù hợp / Xem tất cả**, `/staff/jobs?tab=open` → **Việc mới**, `/staff/job-detail?id=...` → **Vì sao phù hợp / Điều kiện chưa đạt**. Không tạo tab mới; giữ năm tab và nút quay lại ở chi tiết. Guard AuthContext không cho Customer hoặc actor thiếu mapping xem fallback Staff Hoa.

## Điều kiện và lý do

`evaluateOpportunity(context, opportunity, now)` không ghi dữ liệu. Context do adapter lấy từ account/Staff đăng nhập, năng lực/restriction được Admin xác nhận và lịch **đã lưu** của Prompt 05. Draft không notify store hoặc thay matching.

- Account phải ACTIVE. Profile Staff SUSPENDED/RESTRICTED chặn việc mới. BUSY có thể nhận ca tương lai nếu không trùng lịch; trạng thái nghỉ/nhận việc thực tế lấy từ `profile.isOnline`, vì toggle là nguồn mô phỏng thay đổi được. Staff OFFLINE có thể bật lại toggle; không thay enum backend.
- `STAFF_MATCHING_POLICY.requireOnline = true`, default sort `START_TIME`. Tắt nhận việc làm ca mới về 0, không hủy/ẩn assignment đã nhận.
- Năng lực từng service/requiredCapabilities phải được Admin xác nhận, còn hiệu lực lúc kiểm tra và bao trọn thời gian ca. Không dùng specialties, isVerified, rating hoặc kinh nghiệm để cấp quyền. Restriction không phải WARNING đang chặn nhận, hoặc có thời hạn giao với ca tương lai, cũng chặn dịch vụ theo scope.
- Khu vực nằm trong danh mục đã chọn; toàn bộ ca trong một khoảng rảnh đã lưu; thời gian ISO +07:00 theo policy 7 ngày, 30 phút, 08–20h; không trùng assignment/vùng đệm 60 phút. Giữ giả định config end <=20:00 của Prompt 05; buffer không tính giờ công và không dùng GPS/ETA.
- Mode B kiểm tra số vị trí là integer hợp lệ, còn chỗ và Staff chưa có assignment trong cùng ca. Một lần xác nhận nhận đúng một vị trí. Sau một Staff nhận ca cần hai người, pool giữ ca còn một chỗ; khi đầy, loại khỏi danh sách. Assignment của chính Staff được ưu tiên đọc chi tiết dù ca còn vị trí.
- Evaluator hỗ trợ điều kiện Mode A `invitedStaffId` đúng người và vẫn cần xác nhận; không tự nhận, tự thay người hoặc triển khai lại trang lời mời. Fixture giao diện ở prompt này dùng Mode B. Luồng Mode A/API vẫn cần hợp đồng riêng.

Mã UI: `INVALID_ACTOR`, `INACTIVE`, `OFFLINE`, `RESTRICTION`, `CAPABILITY_MISSING`, `CAPABILITY_INVALID`, `NO_AVAILABILITY`, `AREA_OUTSIDE`, `OUTSIDE_AVAILABILITY`, `BOOKING_CONFLICT`, `SCHEDULE_INVALID`, `TIME_INVALID`, `OUTSIDE_WINDOW`, `PAST_START`, `POSITION_FULL`, `ALREADY_ASSIGNED`, `NOT_INVITED`. `reasons[]` có code/message tiếng Việt; `checks[]` giải thích điều kiện đạt/chưa đạt. Schedule adapter bổ sung code vào lỗi hiện có, không đổi backend enum.

Claim đợi latency mock rồi lấy lại account, capability, restriction, saved schedule, assignments và số vị trí **bên trong lock**. Không tin snapshot preview. Thất bại không tạo assignment/ghi ví; sheet giữ lý do. Thành công lưu assignment thực vào store rồi mở chi tiết, không dùng Alert thành công thay cho commit. Khi store đổi, list/sheet cập nhật; hết vị trí bị khóa. Timer chỉ cập nhật giờ cục bộ, không giả push realtime.

## Privacy, bộ lọc và sắp xếp

Public `MatchingOpportunity` là whitelist không có tên/phone/avatar/địa chỉ chi tiết/free-text notes/claimedStaffIds. Legacy `getOpenOpportunities` và open detail cũng redacted để tránh đường đọc cũ lộ dữ liệu. Search chỉ dùng dịch vụ, package được cung cấp, mã ca và vùng; không tìm tên/địa chỉ bí mật. Thông tin đầy đủ nằm ở assignment của đúng Staff, không mở bằng cách đoán ID.

Card: ngày/giờ/thời lượng từ ISO, dịch vụ, vùng, thu nhập ước tính **một vị trí**, chế độ và chỗ còn trống. Các số khoảng cách cũ chưa có tọa độ/nguồn đo, nên không hiển thị; không giả 0km hoặc ETA. Public model có `distance {km, source}` để adapter thật cung cấp sau, fixture hiện không cấp trường đó.

Sort chỉ có giờ bắt đầu tăng dần hoặc thu nhập giảm dần, tie-break giờ/id ổn định. Không weighted score, AI, CP-SAT hoặc dùng rating không đổi của Staff để xếp ca. Homepage ba ca đầu và badge tổng; jobs tổng trước bộ lọc giống homepage, phần danh sách có số sau bộ lọc. Chip quận tái dùng danh mục Prompt 05. Empty phân biệt nghỉ, hạn chế/account không active, chưa có năng lực, chưa lưu lịch, pool trống, không đủ điều kiện và không khớp bộ lọc; CTA đi đến lịch/năng lực, bật nhận việc, tải lại hoặc xóa bộ lọc.

## Fixture demo

Ngày tương đối tính từ lần khởi tạo module tại timezone `Asia/Ho_Chi_Minh`. Reload toàn bộ reset store; không đổi ngày booking khi chạm chip.

| Tài khoản / ca | Cách kiểm tra |
| --- | --- |
| NV1 Hoa `user-s01/staff-001` | Mặc định **5 ca hợp lệ**: `open-101`, `open-buffer-2`, `open-104`, `open-105`, `open-team`. Bật nghỉ → 0, assignments vẫn truy cập được. |
| `open-buffer-1` | Ngày +2 (10/10), 10:30–11:30, sau ca 08–10: bị loại; mở chi tiết trực tiếp thấy `BOOKING_CONFLICT`, CTA disabled. |
| `open-buffer-2` | Ngày +2, 11–12: đủ đúng 60 phút buffer, còn 1/1 chỗ. |
| `open-104/open-105` | Ngày +3 (11/10), hai ca demo cũ 08–10 và 13–15:30; tên/phone/địa chỉ không hiển thị trước nhận. |
| `open-team` | Ngày +4 (12/10), 08–11 Bình Thạnh, **2/2 vị trí**, 242.250đ/người. Giá tham chiếu/phí fixture theo một vị trí 285.000/42.750đ; không phải quote thanh toán thật. |
| `open-outside-area` | Ngày +4, service srv-001 nhưng Quận 7 ngoài vùng Hoa: bị loại/giải thích AREA_OUTSIDE khi mở detail. |
| `open-outside-time` | Ngày +4, 12–13 Bình Thạnh nằm trong khe giữa 08–12 và 13–18: bị loại. |
| `open-laundry-restricted` | Ngày +4, srv-012: restriction của Hoa còn hiệu lực tại thời điểm demo, bị loại. |
| `open-102/open-103` | Tổng vệ sinh hết hiệu lực / nấu ăn đang chờ xác nhận: bị loại với lý do năng lực. |
| NV2 Tuấn `user-s05/staff-005` | Mặc định **1 ca** `open-tuan-ac` ngày +4, 13–15 Quận 1, srv-004; không thấy ca vệ sinh của Hoa. |
| Hoàng Văn Minh `user-s06/staff-006` | Login Staff phone **0912001006** bằng mật khẩu demo hiện có. Chưa có capability được Admin xác nhận trong fixture → trạng thái chưa có năng lực và CTA xem năng lực. Specialties không cấp quyền. |

Các ca dùng chung repository với homepage/jobs/availability. Native QA đã nhận `open-104` cục bộ để kiểm tra commit/ownership; sau kiểm tra reload khôi phục ca cho người dùng demo. Không thử gọi điện, map, chat, chuyển tiền hoặc dịch vụ thật.

## Kiểm tra và giới hạn

- `npx tsc --noEmit`: qua.
- `npm test`: qua bảy bộ. Test mới: buffer 10:30/11h, sai năng lực/vùng/lịch, account/online/restriction, hiệu lực bao trọn ca, restriction tương lai, Mode A đúng người, requiredCapabilities, thời gian/horizon, privacy cả facade/detail/search, sort/filter/empty, actor giả/cross-account, abort/retry, saved schedule đổi sau preview, capability/restriction/account đổi trước claim, ca hai người/duplicate/last-slot race, không ghi có ví và mở contact đúng ownership.
- `npm run lint -- -- --format json --output-file ...`: **64 lỗi nền / 52 cảnh báo**, baseline đầu Prompt 06 **64/57**. Không có message mới; năm unused warnings hết do dùng mapping/Spacing và bỏ imports thừa khi nâng màn. ESLint config tự sinh chỉ dùng kiểm tra, không đưa vào diff.
- Android / Expo Go: Hoa homepage/jobs đồng nhất 5; sort thu nhập lên đầu ca 2 vị trí; lọc Quận 1 empty, xóa lọc, tìm DEMO-104 chỉ một kết quả; sheet cuộn đến điều kiện đệm, CTA không bị che; open-104 preview không có tên/phone/address, nhận local thành assignment rồi mới mở contact; count 5→4, ca xuất hiện Sắp tới; offline 0 nhưng Sắp tới vẫn truy cập; CTA bật nhận việc; direct 10:30 bị khóa; Tuấn thấy đúng 1 ca máy lạnh; Hoàng Văn Minh thấy trạng thái chưa có năng lực, CTA mở đúng section skills hiện có. Error/retry/abort và race fixture được kiểm tra ở repository test, không thêm nút phá fixture vào sản phẩm.

API Booking vẫn draft/scaffold: models/mode/positions/reasons/thu nhập-per-position/privacy projection là đề xuất UI; không áp schema backend. Backend cần authorization thật, source quote/capability/restriction/area/time, atomic claim/hold/idempotency và recheck tránh vượt vị trí/trùng ca. Mock in-memory/lock chỉ trong một runtime ứng dụng; không phải matching engine production, không đồng bộ nhiều thiết bị, không push, GPS, WebSocket hoặc solver. Không lưu bền sau full reload.
