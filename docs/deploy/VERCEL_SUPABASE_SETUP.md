# Vercel + Supabase Prep

Tài liệu này chuẩn bị sẵn bộ dữ liệu và cấu hình để đưa `SHOPPROGRAM` từ mô hình `Cloudflare Pages + D1` sang `Vercel + Supabase`.

## Hiện trạng

- Frontend hiện tại là static web app: `index.html`, `src/app.js`, `src/styles.css`
- Backend hiện tại vẫn là Cloudflare Pages Functions: `functions/api/*`
- Database hiện tại là Cloudflare D1

Điều đó có nghĩa là:

1. Bạn **có thể deploy frontend lên Vercel ngay**
2. Nhưng để chạy full CRUD và sync trên Vercel, bạn sẽ cần chuyển backend/data layer sang Supabase hoặc Vercel Functions

## Bộ file đã chuẩn bị

- [database/supabase/schema.sql](/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/SHOPPROGRAM/database/supabase/schema.sql)
- [database/supabase/seed.sql](/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/SHOPPROGRAM/database/supabase/seed.sql)
- [database/supabase/seed.json](/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/SHOPPROGRAM/database/supabase/seed.json)
- [database/supabase/manifest.json](/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/SHOPPROGRAM/database/supabase/manifest.json)
- [.env.vercel.example](/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/SHOPPROGRAM/.env.vercel.example)
- [vercel.json](/Users/charlotte/Desktop/NGÂN HÀ/CTY TechGalaxy Group/SHOPPROGRAM/vercel.json)

## Dữ liệu đã được chuẩn bị

- Danh mục 2 cấp của OriaFarm
- Add-ons
- Components
- Toàn bộ master product list từ `database/data/db_dump.json`
- Inventory khởi tạo theo SKU
- Shop settings
- Invoice templates
- Barcode templates

Lưu ý:

- `inventory.qty_on_hand` hiện được seed về `0` cho bộ Oria master vì repo hiện tại không chứa snapshot tồn kho cloud hoàn chỉnh đủ tin cậy để chuyển thẳng sang Supabase.
- Nếu bạn có file backup inventory thực tế sau này, mình nên import tiếp đè lên bảng `inventory`.

## Cách import vào Supabase

### 1. Tạo project Supabase

Tạo một project mới trong Supabase.

### 2. Chạy schema

Mở SQL Editor và chạy:

```sql
\i database/supabase/schema.sql
```

Nếu bạn đang copy-paste trực tiếp trong dashboard, dán nội dung file `schema.sql` vào SQL Editor và Run.

### 3. Chạy seed

Sau khi schema xong, chạy:

```sql
\i database/supabase/seed.sql
```

Hoặc copy-paste file `seed.sql` vào SQL Editor.

### 3b. Hoặc upload bằng script tự động

Nếu bạn muốn đẩy trực tiếp từ máy này qua Supabase Management API, repo đã có sẵn:

- [scripts/push_supabase_bundle.js](/Users/charlotte/Desktop/NGÂN HÀ/CTY%20TechGalaxy%20Group/SHOPPROGRAM/scripts/push_supabase_bundle.js)
- [.env.supabase-upload.example](/Users/charlotte/Desktop/NGÂN HÀ/CTY%20TechGalaxy%20Group/SHOPPROGRAM/.env.supabase-upload.example)

Script dùng Supabase Management API `POST /v1/projects/{ref}/database/query`.

Bạn cần:

- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN` (personal access token)

Sau đó chạy:

```bash
SUPABASE_PROJECT_REF=your-project-ref \
SUPABASE_ACCESS_TOKEN=sbp_your_pat \
node scripts/push_supabase_bundle.js
```

### 4. Cấu hình Vercel env

Tạo các biến môi trường trong Vercel theo file `.env.vercel.example`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_SCHEMA`
- `SHOPFLOW_DEPLOY_TARGET`
- `SHOPFLOW_BACKEND_PROVIDER`

## Deploy frontend lên Vercel

Project này hiện không cần bước build phức tạp. Bạn có thể:

1. push repo lên GitHub
2. import repo vào Vercel
3. để Vercel deploy static site từ root project

`vercel.json` đã được thêm để giữ static deploy đơn giản hơn.

## Điều chưa được migrate trong bước này

Phần dưới đây vẫn đang dùng logic Cloudflare/D1 và sẽ cần chuyển tiếp:

- `functions/api/*`
- `src/sync.js` hiện đang gọi `/api/*`
- idempotent sync log
- stock movements writes
- sales / purchases / reports routes

## Bước tiếp theo mình khuyên làm

1. giữ frontend hiện tại
2. chuyển `/api/products`, `/api/inventory`, `/api/settings`, `/api/sales` sang Supabase trước
3. sau đó chuyển tiếp `sync`, `purchases`, `reports`

## Rebuild seed khi dữ liệu thay đổi

Nếu bạn cập nhật lại `database/data/db_dump.json` hoặc nguồn sản phẩm, chạy:

```bash
node scripts/build_supabase_bundle.js
```

Script này sẽ build lại:

- `database/supabase/schema.sql`
- `database/supabase/seed.sql`
- `database/supabase/seed.json`
- `database/supabase/manifest.json`
