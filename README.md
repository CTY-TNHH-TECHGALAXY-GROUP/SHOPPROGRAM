# ShopFlow POS

Ứng dụng POS song ngữ Việt/Anh cho cửa hàng nhỏ (mặc định dành cho The Fruit House).

## Tính năng

- **Bán hàng (POS)**: scan barcode, giỏ hàng đa đơn, add-on, in hóa đơn nhiệt
- **Nhập hàng** (mới): tạo phiếu PN, quản lý nhà cung cấp, cập nhật giá vốn trung bình
- **Xuất hàng** (mới): xuất hủy / mẫu / nội bộ / chuyển kho
- **Lưu kho** (mới): tồn hiện tại + sổ cái chuyển động + kiểm kê
- **Tổng quan**: doanh thu, lãi gộp (CoGS), top sản phẩm
- **In nhãn barcode** (PDF/canvas)
- **Cloudflare D1** làm DB chính + **LocalStorage** làm cache offline-first

## Kiến trúc

| Lớp | File / thư mục |
|---|---|
| Entry HTML + deploy headers | `index.html`, `_headers` |
| UI React + htm | `src/app.js`, `src/styles.css` |
| Sync engine + outbox | `src/sync.js` |
| API REST | `functions/api/*` (Cloudflare Pages Functions) |
| Database | Cloudflare D1 (`shopflow-db`) |
| Cloudflare migrations | `database/cloudflare/migrations/*.sql` |
| Supabase bundle | `database/supabase/*` |
| Data imports/exports | `database/data/*` |
| Deploy docs + plans | `docs/deploy/*`, `docs/plans/*` |

## Sơ đồ cây source

Xem bản đồ nhanh tại [docs/SOURCE_TREE.md](./docs/SOURCE_TREE.md).

```text
SHOPPROGRAM/
├── index.html                 # File mở app, load src/styles.css + src/app.js
├── _headers                   # Cache headers cho Cloudflare Pages
├── src/
│   ├── app.js                 # UI POS chính: POS, inventory, settings, dashboard
│   ├── styles.css             # Toàn bộ giao diện responsive
│   └── sync.js                # Offline outbox + sync API helper
├── functions/
│   └── api/                   # Cloudflare Pages Functions REST API
├── database/
│   ├── cloudflare/
│   │   └── migrations/        # D1 migrations
│   ├── supabase/              # Supabase schema, seed, export bundle
│   └── data/                  # Dữ liệu nguồn: db dump, Excel, xlsx dump
├── scripts/                   # Tool build seed, copy Cloudflare -> Supabase, test flow
├── docs/
│   ├── deploy/                # Hướng dẫn Cloudflare/Vercel/Supabase
│   ├── plans/                 # Kế hoạch kỹ thuật
│   └── assets/                # Hình/asset tài liệu
├── logo.png
├── logo-thermal.png
├── wrangler.toml
└── vercel.json
```

## Chạy local

```bash
# 1. Tạo D1 local + nạp data mẫu
npx wrangler d1 execute shopflow-db --local --file=./database/cloudflare/migrations/0001_init.sql
npx wrangler d1 execute shopflow-db --local --file=./database/cloudflare/migrations/0002_seed.sql

# 2. Chạy dev server
npx wrangler pages dev . --d1=DB=shopflow-db
```

Mở http://localhost:8788.

Hoặc chạy thuần static (không có API D1):

```bash
python3 -m http.server 8080
```

Khi không có API, app vẫn chạy bằng LocalStorage và mọi mutation sẽ được giữ trong outbox để đẩy lên sau.

## Deploy lên Cloudflare

Xem chi tiết tại [docs/deploy/CLOUDFLARE_DEPLOY.md](./docs/deploy/CLOUDFLARE_DEPLOY.md).

Tóm tắt:

```bash
npx wrangler d1 create shopflow-db
# Copy database_id vào wrangler.toml
npx wrangler d1 execute shopflow-db --remote --file=./database/cloudflare/migrations/0001_init.sql
npx wrangler d1 execute shopflow-db --remote --file=./database/cloudflare/migrations/0002_seed.sql
npx wrangler pages deploy .
```

## Chuẩn bị cho Vercel + Supabase

Repo này hiện đã có sẵn bộ dữ liệu và schema để chuẩn bị migrate sang `Vercel + Supabase`.

- Hướng dẫn: [docs/deploy/VERCEL_SUPABASE_SETUP.md](./docs/deploy/VERCEL_SUPABASE_SETUP.md)
- Schema: [database/supabase/schema.sql](./database/supabase/schema.sql)
- Seed SQL: [database/supabase/seed.sql](./database/supabase/seed.sql)
- Seed JSON: [database/supabase/seed.json](./database/supabase/seed.json)

Để build lại bundle seed từ dữ liệu hiện có:

```bash
node scripts/build_supabase_bundle.js
```

## API tóm tắt

| Endpoint | Mô tả |
|---|---|
| `GET  /api/products` | Danh sách sản phẩm + tồn kho |
| `POST /api/products` | Upsert sản phẩm |
| `DELETE /api/products/:id` | Soft delete |
| `GET  /api/inventory` | Tồn hiện tại |
| `GET  /api/inventory/movements` | Sổ cái stock movements |
| `GET/POST /api/categories` | Danh mục |
| `GET/POST /api/addons` | Add-ons |
| `GET/POST /api/suppliers` | Nhà cung cấp |
| `GET/POST /api/purchases` | Nhập hàng (PN) |
| `GET  /api/purchases/:id` | Chi tiết phiếu nhập |
| `GET/POST /api/issues` | Xuất hàng (PX) |
| `GET  /api/issues/:id` | Chi tiết phiếu xuất |
| `GET/POST /api/sales` | Bán hàng (HD) |
| `GET  /api/sales/:id` | Chi tiết hóa đơn |
| `GET  /api/reports/summary?from&to` | Tổng quan doanh thu/lãi |
| `GET  /api/reports/low-stock` | Sản phẩm dưới mức tối thiểu |
| `GET/POST /api/settings` | Cấu hình cửa hàng |
| `GET  /api/sync/pull?since=` | Delta đồng bộ |
| `POST /api/sync/push` | Đẩy batch outbox |

Mọi POST tạo dữ liệu mới nên kèm `clientOpId` (UUID) để chống trùng (idempotency).
