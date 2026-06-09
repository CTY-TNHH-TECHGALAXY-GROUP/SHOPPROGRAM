# Kế hoạch Triển khai: Quản lý Tồn kho theo Nguyên liệu (Recipe-based Inventory)

Hệ thống sẽ chuyển sang quản lý kho theo **công thức/định mức (BOM)** thay vì trừ kho thành phẩm, dựa theo mã danh mục của sản phẩm.

## Quy tắc áp dụng Mã Danh Mục (Category Code)
- **`10000 - 50000` (Món pha chế)**: Là thành phẩm. Khi bán, hệ thống tự động phân rã để trừ kho nguyên liệu.
- **`70000` (Nguyên vật liệu ly nhựa)**: Bao bì, ly, nắp, ống hút...
- **`80000` (Nguyên vật liệu pha chế)**: Đường, sữa, trà, siro...
*Các mã danh mục khác (vd 60000 - đồ ăn vặt đóng gói) vẫn trừ trực tiếp vào kho của nó.*

## Chi tiết Triển khai

### 1. API Backend (Cloudflare D1)

---
#### `functions/api/sales/index.js`
- **Kiểm tra tồn kho (B1)**:
  - Nếu món thuộc nhóm `10000-50000`, đọc `component_ids` để lấy danh sách nguyên liệu.
  - Cộng dồn số lượng nguyên liệu cần dùng (bao gồm nguyên liệu 80000 và ly nhựa 70000).
  - Kiểm tra xem kho có đủ các nguyên liệu đó không. Báo lỗi "Hết nguyên liệu" nếu kho trống.
- **Trừ tồn kho (B2)**:
  - Ghi nhận sổ cái (Ledger) và giảm tồn kho (Inventory) trực tiếp vào mã nguyên liệu (70000, 80000) đối với các món pha chế được bán ra.
  - Các món khác (vd đồ đóng gói) vẫn trừ thẳng tồn kho của chính nó.

### 2. Frontend (React App)

---
#### `src/app.js`
- **Tính toán Tồn kho Tự động (Dynamic/Virtual Stock)**:
  - Thêm hàm tính tồn kho ảo: Lặp qua `componentIds`, lấy (Tồn nguyên liệu / Định mức) -> Tính `Math.min` để ra số lượng ly tối đa có thể pha.
  - Cập nhật số lượng ảo này vào màn hình POS. Nút chọn món sẽ bị mờ đi (Out of stock) nếu số lượng ảo = 0 (tức là 1 trong các nguyên liệu đã hết).
- **Màn hình Tồn hiện tại (Current Stock)**:
  - Vẫn hiển thị các món `10000-50000` để bạn có thể bấm **Sửa chi tiết** và cài đặt nguyên liệu cho nó.
  - **Thay đổi**: Ô nhập số lượng tồn kho của các món này sẽ chuyển thành dạng **chỉ đọc (read-only)**, hiển thị số lượng tính toán tự động.
- **Màn hình Kiểm kê (Stocktake) & Sổ cái (Ledger)**:
  - Ẩn hoàn toàn các sản phẩm thuộc nhóm `10000-50000`, chỉ hiển thị nguyên liệu và các món bán thẳng.
- **Offline Sync Logic**:
  - Khi bán hàng offline, App tự phân rã nguyên liệu và trừ tạm thời tại LocalStorage (biến `pendingStock`) tương tự như Backend.

## Verification Plan
1. **Tạo dữ liệu test**:
   - Trà đen (80000): 500g, Sữa đặc (80000): 1000ml, Ly nhựa (70000): 10 cái.
   - Trà sữa (10000): Định mức gồm 10g trà, 50ml sữa, 1 ly nhựa.
2. **Kiểm tra hiển thị**: 
   - POS tính toán Trà sữa tồn kho là `10`.
   - Quản lý kho "Tồn hiện tại": Trà sữa hiện tồn `10`, ô nhập bị khóa, bấm Sửa để đổi công thức. "Kiểm kê": Không thấy Trà sữa.
3. **Bán hàng**: Bán 2 ly Trà sữa.
4. **Kiểm tra kho**: 
   - Trà đen: Tụt xuống 480g. Sữa đặc: Tụt xuống 900ml. Ly nhựa: Tụt xuống 8 cái.
