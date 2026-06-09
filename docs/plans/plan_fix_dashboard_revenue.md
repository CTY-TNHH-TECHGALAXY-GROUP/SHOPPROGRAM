# Kế hoạch khắc phục lỗi Báo Cáo Doanh Thu (SHOPPROGRAM)

## 1. Phân tích nguyên nhân gốc rễ (Root Cause)
Hiện tại, khi xem tab "Báo cáo", hai máy (Máy E và Máy Y) hiển thị hai số liệu khác nhau (80k và 57k) vì:
- Báo cáo trên ứng dụng POS (`src/app.js`) đang được **tính toán hoàn toàn dựa trên dữ liệu lưu ở LocalStorage** của từng máy (biến `sales`).
- Khi Máy E tạo đơn, đơn đó được lưu vào LocalStorage của Máy E và đẩy lên Server (qua `src/sync.js`). Tuy nhiên, cơ chế đồng bộ hiện tại **không kéo ngược (pull)** toàn bộ danh sách hóa đơn và chi tiết món (`sale_items`) từ Server về lại các máy khác.
- Kết quả: Máy nào tạo bill thì máy đó mới lưu bill đó ở LocalStorage, dẫn đến báo cáo doanh thu mạnh máy nào máy nấy tính.

## 2. Giải pháp đề xuất
Vì POS cần khả năng hoạt động offline (Offline-first), ta không nên bắt mỗi máy POS tải toàn bộ lịch sử hóa đơn của cửa hàng về máy (gây nặng máy và tốn băng thông). Thay vào đó, ta sẽ chuyển logic tính toán báo cáo lên Server.

### Bước 2.1: Tạo API Báo Cáo trên Server (`/api/reports/dashboard`)
Tạo một Cloudflare Worker mới tại `functions/api/reports/dashboard.js`:
- Nhận tham số `from` và `to` (timestamp).
- Dùng SQL query trực tiếp database (D1) để tính:
  - Tổng doanh thu (`revenue`), Số đơn (`ordersCount`), Trung bình đơn (`avgTicket`).
  - Biểu đồ theo ngày (`daySeries`).
  - Top sản phẩm bán chạy (`topProducts`) bằng cách JOIN bảng `sales` và `sale_items`.
  - Lịch sử giao dịch gần đây (`recentSales`).

### Bước 2.2: Cập nhật giao diện Báo Cáo (`src/app.js`)
- Đổi biến `dashboardMetrics` từ `useMemo` (tính toán local) sang dạng `useState` + `useEffect` để `fetch` dữ liệu từ API `/api/reports/dashboard`.
- **Xử lý Offline/Online:**
  - Nếu có mạng (Online): Giao diện sẽ hiển thị dữ liệu chuẩn từ Server (gộp chung tất cả các máy).
  - Nếu mất mạng (Offline): Giao diện sẽ tạm fallback dùng thuật toán cũ (chỉ tính trên `sales` local) để POS vẫn hoạt động được.

---

> **Phản hồi từ User**: Bạn có đồng ý triển khai theo hướng tách API tính toán báo cáo lên Server không? Vui lòng xác nhận để tôi tiến hành code.
