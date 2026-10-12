# Kết nối Catalog local — 08/10/2026

Ảnh báo `java.net.ConnectException` tới `10.0.2.2:8080`: Docker Desktop chưa chạy nên Gateway không lắng nghe cổng 8080. Địa chỉ này đúng cho Android emulator trên cùng máy Windows. Đã khởi động Docker Desktop và các container có sẵn; không thay schema, seed hoặc endpoint backend.

Từ repo backend, sau khi Docker Desktop chạy Linux engine:

```powershell
docker compose up -d postgres api-gateway catalog-service
Invoke-RestMethod 'http://localhost:8080/api/v1/catalog/services?size=12'
```

Lần đầu chưa có image, dùng `docker compose up -d --build postgres api-gateway catalog-service` theo README backend. Không cần xóa volume. Catalog đọc qua Gateway `/api/v1/catalog`, không fallback dữ liệu mock khi mất kết nối.

Mobile `.env.local`:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080
EXPO_PUBLIC_WEB_API_BASE_URL=http://localhost:8080
```

Giữ Metro ở cổng 8090 theo `npm start` hiện tại. Khi dùng link Expo `exp://127.0.0.1:8090` trên emulator, cần `adb reverse tcp:8090 tcp:8090` sau khi máy ảo/ADB khởi động lại. Kết nối này dành cho Metro, tách với Catalog tại 10.0.2.2:8080. Điện thoại thật cần địa chỉ LAN và cấu hình truy cập host phù hợp; cấu hình hiện tại dành cho máy ảo, không khẳng định hỗ trợ thiết bị thật.

File sửa:

- `src/api/catalog.ts`: chuẩn hóa lỗi fetch Android dạng Error chứa Java exception thành tiếng Việt; giữ hủy và thông báo HTTP 400/404; không lộ chi tiết kết nối kỹ thuật trong UI.
- `src/hooks/use-catalog-resource.ts`: timeout có thông báo thử lại, vẫn hủy khi unmount.
- `src/app/service/[id].tsx`: loading/lỗi/not found có safe area và nút Quay lại. Giữ resolve ID `srv-*` qua catalog trước khi gọi ID số.
- `scripts/test-catalog.mjs` / `package.json`: test URL Gateway, native Error/TypeError, HTTP error, hủy, thử lại thành công.

Đã đọc thành công catalog qua Gateway và mở `/service/srv-001` trên Android emulator: đúng “Vệ sinh nhà theo giờ”, giá/gói từ API. Đăng nhập Customer, bấm dịch vụ từ banner trang chủ cũng mở thành công. ID không tồn tại `/service/999999` hiện thông báo 404, Quay lại và Thử lại. TypeScript và `npm test` qua. Lint nền được ghi tại bàn giao năng lực Staff. Không đặt booking, gửi tin hoặc gọi dịch vụ thật khi kiểm tra.
