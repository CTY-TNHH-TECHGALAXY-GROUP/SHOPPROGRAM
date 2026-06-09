# Kế hoạch đồng bộ Hóa đơn giữa các máy POS

## 1. Nguyên nhân lỗi "Không đồng bộ thông tin đơn"
Hiện tại, ứng dụng POS thiết kế theo hướng offline-first. Khi một máy (VD: Máy E) chốt đơn, đơn đó được lưu vào `localStorage` của Máy E và gửi ngầm lên DB Cloudflare D1. Tuy nhiên:
- API `pull.js` (dùng để kéo dữ liệu từ server về máy) có trả về một mảng `recentSales` nhưng **bị thiếu chi tiết món (`sale_items`)**.
- File giao diện `src/app.js` lại **bỏ qua hoàn toàn** dữ liệu `recentSales` này trong hàm `handlePulled()`.
- Hậu quả: Dữ liệu bị "đẩy lên" một chiều mà không được "kéo về" và hợp nhất vào các máy khác, nên Máy Y không thấy đơn của Máy E.

## 2. Giải pháp kỹ thuật

### Bước 2.1: Sửa API Pull (`functions/api/sync/pull.js`)
- Cập nhật query SQL của `recentSales` để trả về thêm các trường quan trọng (subtotal, vat, discount).
- Gắn thêm danh sách món ăn (`items`) vào từng hóa đơn bằng hàm `json_group_array()` của SQLite.
- Giới hạn kéo về khoảng 500 đơn gần nhất để không làm quá tải băng thông và dung lượng trình duyệt.

### Bước 2.2: Xử lý dữ liệu Pull trên Client (`src/app.js`)
- Cập nhật hàm `handlePulled()` để nhận `data.recentSales`.
- Hợp nhất (Merge) các đơn hàng từ server vào biến `sales` hiện tại của POS.
- Sắp xếp lại theo thời gian mới nhất (`createdAt DESC`).
- **Giới hạn LocalStorage:** Chỉ giữ lại tối đa 1000 đơn hàng gần nhất trong `localStorage` để tránh lỗi đầy bộ nhớ (QuotaExceededError). 

### Lưu ý về Báo cáo doanh thu (Dashboard)
Vì chúng ta sẽ giới hạn lưu trữ cục bộ ở 1000 đơn hàng (để tránh sập trình duyệt), báo cáo doanh thu tại trang chủ POS sẽ chỉ tính toán chính xác trong phạm vi 1000 đơn này. (Phù hợp để xem báo cáo trong tuần/tháng tùy lượng khách). Nếu sau này bạn cần báo cáo chính xác trọn đời, ta sẽ viết riêng 1 API Báo Cáo trên server (như kế hoạch trước).

---

> **Phản hồi từ User**: Phương án kéo 500 hóa đơn gần nhất (kèm chi tiết món) về các máy POS để đồng bộ xem thông tin đơn là bắt buộc để giải quyết lỗi của bạn. Bạn có **Duyệt (OK)** để tôi tiến hành sửa code theo plan này không?
