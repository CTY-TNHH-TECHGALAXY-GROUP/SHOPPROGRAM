# Source Tree

File tree này là bản đồ nhanh để chỉnh sửa SHOPPROGRAM sau này.

```text
SHOPPROGRAM/
├── index.html
├── _headers
├── src/
│   ├── app.js
│   ├── styles.css
│   └── sync.js
├── functions/
│   └── api/
├── database/
│   ├── cloudflare/
│   │   └── migrations/
│   ├── supabase/
│   └── data/
├── scripts/
├── docs/
│   ├── deploy/
│   ├── plans/
│   └── assets/
├── logo.png
├── logo-thermal.png
├── wrangler.toml
└── vercel.json
```

## Chỉnh nhanh theo nhu cầu

- Sửa giao diện POS, dashboard, inventory, setting: `src/app.js`
- Sửa màu sắc, responsive, layout: `src/styles.css`
- Sửa đồng bộ offline/online: `src/sync.js`
- Sửa API Cloudflare: `functions/api/`
- Sửa database Cloudflare D1: `database/cloudflare/migrations/`
- Sửa Supabase schema/seed: `database/supabase/`
- Sửa dữ liệu nguồn import: `database/data/`
- Sửa tool upload/migration/test: `scripts/`
- Xem hướng dẫn deploy: `docs/deploy/`
- Xem kế hoạch kỹ thuật cũ: `docs/plans/`
