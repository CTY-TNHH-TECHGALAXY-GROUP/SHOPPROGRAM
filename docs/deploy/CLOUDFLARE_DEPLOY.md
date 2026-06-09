# Deploy lên Cloudflare Pages + D1

Ứng dụng giờ gồm 2 phần:

1. **Static frontend** ở `index.html` và `src/` (`src/app.js`, `src/styles.css`, `src/sync.js`).
2. **Pages Functions API** trong `functions/api/*` đọc/ghi vào **Cloudflare D1**.

Kiến trúc:

```
Browser ──► /api/* (Pages Functions) ──► Cloudflare D1 (shopflow-db)
        ▲                                  ▲
        └─ LocalStorage cache + outbox khi mất mạng
```

## 1. Cài Wrangler (lần đầu)

```bash
npm install --global wrangler
npx wrangler login
```

## 2. Tạo D1 database

```bash
npx wrangler d1 create shopflow-db
```

Lệnh in ra một block giống:

```toml
[[d1_databases]]
binding = "DB"
database_name = "shopflow-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy `database_id` đó dán vào `wrangler.toml` (thay chuỗi `REPLACE_WITH_DATABASE_ID`).

## 3. Chạy migration + seed

```bash
# Tạo bảng
npx wrangler d1 execute shopflow-db --remote --file=./database/cloudflare/migrations/0001_init.sql

# Nạp dữ liệu mẫu (giống DEFAULT_PRODUCTS trong src/app.js)
npx wrangler d1 execute shopflow-db --remote --file=./database/cloudflare/migrations/0002_seed.sql
```

Bỏ `--remote` nếu muốn dùng D1 local trong khi dev với `wrangler pages dev`.

## 4. Deploy Pages

### Option A — Lệnh CLI

```bash
# QUAN TRỌNG: --branch=main để deploy lên PRODUCTION.
# Nếu bỏ --branch, Cloudflare sẽ tạo preview deployment (URL random)
# và domain chính KHÔNG được cập nhật!
npx wrangler pages deploy . --branch=main
```

Cloudflare sẽ tự nhận thư mục `functions/` và build Pages Functions kèm static site.

> ⚠️ **Lưu ý:** Nếu wrangler hết phiên đăng nhập, chạy `npx wrangler login` trước.

### Option B — Git integration

- Framework preset: `None`
- Build command: để trống (hoặc `exit 0`)
- Build output directory: `.`
- Functions directory: `functions` (mặc định)
- Bindings: thêm D1 binding `DB` -> `shopflow-db` trong Settings của project.

## 5. Test API

Sau khi deploy, mở:

```
https://<project>.pages.dev/api/products
https://<project>.pages.dev/api/inventory
https://<project>.pages.dev/api/sync/pull?since=0
```

Nếu trả về `{"ok":true,"products":[...]}` là đã thông.

## 6. Local development

```bash
npx wrangler pages dev . --d1=DB=shopflow-db
```

Mở http://localhost:8788. D1 dev sẽ là một file SQLite cục bộ; chạy lại migration với:

```bash
npx wrangler d1 execute shopflow-db --local --file=./database/cloudflare/migrations/0001_init.sql
npx wrangler d1 execute shopflow-db --local --file=./database/cloudflare/migrations/0002_seed.sql
```

## 7. Sao lưu / khôi phục D1

```bash
# Dump
npx wrangler d1 export shopflow-db --remote --output=backup.sql

# Import
npx wrangler d1 execute shopflow-db --remote --file=backup.sql
```

## Notes

- Camera quét barcode chỉ hoạt động trên HTTPS hoặc `localhost`.
- LocalStorage vẫn là cache; khi mất mạng, mọi mutation đi vào outbox (`shopflow-outbox`) và sẽ tự đẩy lên D1 khi có mạng trở lại.
- Mỗi mutation gửi kèm `clientOpId` (UUID). Bảng `sync_log` ở D1 đảm bảo không bị trùng hóa đơn khi sync.
