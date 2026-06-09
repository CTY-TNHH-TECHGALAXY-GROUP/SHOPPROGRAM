const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "database", "data");
const OUT_DIR = path.join(ROOT, "database", "supabase");
const NOW = Date.now();

const CATEGORY_ROWS = [
  { id: "fruits", label: "Trái cây / Fruits", icon: "🍎", sort_order: 10000, parent_id: null, level: 1, code: "10000" },
  { id: "smoothies", label: "Sinh tố / Smoothies", icon: "🥤", sort_order: 20000, parent_id: null, level: 1, code: "20000" },
  { id: "juices", label: "Nước ép / Juices", icon: "🍊", sort_order: 30000, parent_id: null, level: 1, code: "30000" },
  { id: "nutritious-drinks", label: "Thức uống dinh dưỡng / Nutritious Drinks", icon: "💪", sort_order: 40000, parent_id: null, level: 1, code: "40000" },
  { id: "refreshing-drinks", label: "Thức uống giải khát / Refreshing Beverages", icon: "🧃", sort_order: 50000, parent_id: null, level: 1, code: "50000" },
  { id: "essentials", label: "Nhu yếu phẩm / Essentials & Convenience Goods", icon: "🛒", sort_order: 60000, parent_id: null, level: 1, code: "60000" },
  { id: "snacks", label: "Đồ ăn nhanh và đồ ăn vặt / Fast Food & Snacks", icon: "🍿", sort_order: 61000, parent_id: "essentials", level: 2, code: "61000" },
  { id: "beverages", label: "Thức uống, sữa, ngũ cốc / Beverages, Milk & Cereals", icon: "🥛", sort_order: 62000, parent_id: "essentials", level: 2, code: "62000" },
  { id: "pantry", label: "Nguyên liệu khô và thực phẩm thiết yếu trong bếp / Pantry & Kitchen Staples", icon: "🥫", sort_order: 63000, parent_id: "essentials", level: 2, code: "63000" },
  { id: "personal-care", label: "Chăm sóc cá nhân & vệ sinh / Personal Care & Hygiene", icon: "🧴", sort_order: 64000, parent_id: "essentials", level: 2, code: "64000" },
  { id: "household", label: "Đồ gia dụng, vệ sinh nhà cửa và hàng thiết yếu / Household, Cleaning & Home Essentials", icon: "🧹", sort_order: 65000, parent_id: "essentials", level: 2, code: "65000" },
  { id: "packaging", label: "Dụng cụ, bao bì, đồ dùng một lần / Utensils, Packaging & Disposable Food Ware", icon: "🥡", sort_order: 66000, parent_id: "essentials", level: 2, code: "66000" }
];

const CATEGORY_ICON_MAP = Object.fromEntries(CATEGORY_ROWS.map((row) => [row.id, row.icon]));

const ADD_ON_ROWS = [
  { id: "sugar-50", label: "50% đường / Sugar 50%", price: 0, group_key: "sweetness", is_active: 1 },
  { id: "sugar-0", label: "Không đường / No Sugar", price: 0, group_key: "sweetness", is_active: 1 },
  { id: "ice-less", label: "Ít đá / Less Ice", price: 0, group_key: "ice", is_active: 1 },
  { id: "ice-none", label: "Không đá / No Ice", price: 0, group_key: "ice", is_active: 1 },
  { id: "chia", label: "Hạt chia / Chia Seeds", price: 8000, group_key: "extras", is_active: 1 },
  { id: "aloe", label: "Nha đam / Aloe Vera", price: 7000, group_key: "extras", is_active: 1 },
  { id: "yogurt", label: "Sữa chua Hy Lạp / Greek Yogurt", price: 12000, group_key: "extras", is_active: 1 },
  { id: "protein", label: "Protein thêm / Protein Shot", price: 15000, group_key: "extras", is_active: 1 }
];

const COMPONENT_ROWS = [
  { id: "orange", label: "Cam / Orange", unit: "trái / fruits", note: "Nguyên liệu nước ép cam / Juice base" },
  { id: "watermelon", label: "Dưa hấu / Watermelon", unit: "gram", note: "Nguyên liệu lạnh / Chilled prep" },
  { id: "mint", label: "Lá bạc hà / Mint", unit: "lá / leaves", note: "Trang trí và tạo mùi / Garnish" },
  { id: "honey", label: "Mật ong / Honey", unit: "ml", note: "Tăng vị ngọt / Sweetener" },
  { id: "yogurt-base", label: "Sữa chua / Yogurt", unit: "gram", note: "Base cho smoothie / Smoothie base" },
  { id: "chia-base", label: "Hạt chia / Chia Seeds", unit: "gram", note: "Topping mặc định / Default topping" }
];

const SHOP_SETTINGS = {
  storeName: "OriaFarm",
  brandLine: "ORIAFARM",
  brandDisplayName: "OriaFarm",
  branchName: "Quầy Linh Trần",
  address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
  phone: "0909 123 456",
  taxId: "0312345678",
  cashierName: "Linh Tran",
  openHours: "07:00 - 22:00",
  receiptFooter: "Cảm ơn quý khách đã ghé OriaFarm. / Thank you for visiting OriaFarm.",
  vatNote: "Giá đã bao gồm VAT / Prices include VAT",
  logoUrl: "/logo.png",
  logoPrintUrl: "/logo-thermal.png"
};

const INVOICE_TEMPLATES = [
  {
    id: "invoice-classic",
    name: "Mẫu A — Cổ điển 80mm / Classic 80mm",
    title: "HÓA ĐƠN BÁN HÀNG / SALES RECEIPT",
    subtitle: "Mẫu A — Logo + địa chỉ + tổng (giá đã bao gồm VAT) / Logo + address + total (VAT included)",
    footer: "Cảm ơn quý khách đã ghé OriaFarm. / Thank you for visiting OriaFarm.",
    showSubtitle: true,
    showAddress: true,
    showBranch: true,
    showPhone: true,
    showTaxId: true,
    showCashier: true,
    showCustomerName: true,
    showPaymentMethod: true,
    showUnitPrice: true,
    showCashReceived: true,
    showChangeDue: true,
    showOrderMeta: true
  },
  {
    id: "invoice-vat",
    name: "FnB VAT Invoice",
    title: "HÓA ĐƠN VAT / VAT INVOICE",
    subtitle: "Dùng cho khách doanh nghiệp và xuất VAT / For business customers and VAT requests",
    footer: "Vui lòng đối chiếu thông tin doanh nghiệp trước khi xuất hóa đơn VAT. / Please verify business details before issuing the VAT invoice.",
    showSubtitle: true,
    showAddress: true,
    showBranch: true,
    showPhone: true,
    showTaxId: true,
    showCashier: true,
    showCustomerName: true,
    showPaymentMethod: true,
    showUnitPrice: true,
    showCashReceived: true,
    showChangeDue: true,
    showOrderMeta: true
  }
];

const BARCODE_TEMPLATES = [
  {
    id: "barcode-retail",
    name: "Retail Sticker",
    prefix: "TFH",
    suffix: "01",
    width: 180,
    height: 72,
    printWidthMm: 90,
    printHeightMm: 55,
    title: "Tem bán lẻ / Retail Label",
    subtitle: "Dùng cho quầy / For counter sales",
    showName: true,
    showPrice: true,
    showStoreName: true,
    showCategory: true,
    showBarcodeValue: true,
    accent: "#db5d17"
  },
  {
    id: "barcode-shelf",
    name: "Shelf Label",
    prefix: "SHELF",
    suffix: "A",
    width: 220,
    height: 84,
    printWidthMm: 100,
    printHeightMm: 62,
    title: "Tem kệ hàng / Shelf Label",
    subtitle: "Dành cho trưng bày / For display",
    showName: true,
    showPrice: false,
    showStoreName: true,
    showCategory: true,
    showBarcodeValue: true,
    accent: "#6dbb59"
  }
];

const LEGACY_PRODUCT_ID_MAP = {
  "p-djp0k0ew": "ORIA61034",
  "p-uyol67bm": "ORIA61035",
  "p-m5abfj39": "ORIA61036"
};

const DUPLICATE_PRODUCT_IDS = new Set(["product-oiqum90zl"]);

const SCHEMA_SQL = `-- Supabase/Postgres schema for ShopFlow POS
-- Generated from the current Cloudflare D1 project.

create extension if not exists pgcrypto;

create table if not exists categories (
  id text primary key,
  label text not null,
  icon text,
  sort_order integer default 0,
  is_active integer not null default 1,
  updated_at bigint not null,
  parent_id text references categories(id) on delete set null,
  level integer not null default 1,
  code text
);

create table if not exists add_ons (
  id text primary key,
  label text not null,
  price integer not null default 0,
  group_key text not null,
  is_active integer not null default 1,
  updated_at bigint not null
);

create table if not exists components (
  id text primary key,
  label text not null,
  unit text,
  note text,
  updated_at bigint not null
);

create table if not exists products (
  id text primary key,
  name text not null,
  category_id text references categories(id) on delete set null,
  price integer not null default 0,
  cost_price integer not null default 0,
  barcode text,
  image text,
  description text,
  component_ids text,
  min_stock integer not null default 0,
  is_active integer not null default 1,
  updated_at bigint not null,
  unit text,
  sku_code text
);

create unique index if not exists idx_products_barcode
  on products(barcode)
  where barcode is not null and barcode <> '';
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_sku on products(sku_code);

create table if not exists inventory (
  product_id text primary key references products(id) on delete cascade,
  qty_on_hand integer not null default 0,
  location text not null default 'main',
  updated_at bigint not null
);

create table if not exists stock_movements (
  id text primary key,
  product_id text not null references products(id) on delete cascade,
  movement_type text not null check (movement_type in ('IN','OUT','SALE','ADJUST','RETURN')),
  qty_change integer not null,
  unit_cost integer,
  ref_type text,
  ref_id text,
  note text,
  created_at bigint not null
);
create index if not exists idx_mov_product on stock_movements(product_id, created_at);
create index if not exists idx_mov_ref on stock_movements(ref_type, ref_id);
create index if not exists idx_mov_date on stock_movements(created_at);

create table if not exists suppliers (
  id text primary key,
  name text not null,
  phone text,
  address text,
  note text,
  is_active integer not null default 1,
  updated_at bigint not null
);

create table if not exists purchase_orders (
  id text primary key,
  supplier_id text references suppliers(id) on delete set null,
  supplier_name text,
  total_amount integer not null default 0,
  paid_amount integer not null default 0,
  payment_method text,
  status text not null default 'completed' check (status in ('draft','completed','cancelled')),
  note text,
  created_at bigint not null
);
create index if not exists idx_purchase_date on purchase_orders(created_at);

create table if not exists purchase_order_items (
  id text primary key,
  purchase_id text not null references purchase_orders(id) on delete cascade,
  product_id text not null references products(id),
  product_name text,
  qty integer not null,
  unit_cost integer not null,
  subtotal integer not null
);
create index if not exists idx_po_items_purchase on purchase_order_items(purchase_id);
create index if not exists idx_po_items_product on purchase_order_items(product_id);

create table if not exists stock_issues (
  id text primary key,
  reason text not null check (reason in ('damaged','sample','internal','transfer','other')),
  note text,
  status text not null default 'completed' check (status in ('draft','completed','cancelled')),
  created_at bigint not null
);
create index if not exists idx_issue_date on stock_issues(created_at);

create table if not exists stock_issue_items (
  id text primary key,
  issue_id text not null references stock_issues(id) on delete cascade,
  product_id text not null references products(id),
  product_name text,
  qty integer not null,
  unit_cost integer
);
create index if not exists idx_issue_items_issue on stock_issue_items(issue_id);
create index if not exists idx_issue_items_product on stock_issue_items(product_id);

create table if not exists sales (
  id text primary key,
  order_id text,
  customer_name text,
  subtotal integer not null default 0,
  vat_amount integer not null default 0,
  discount integer not null default 0,
  total integer not null default 0,
  paid integer not null default 0,
  change_amount integer not null default 0,
  payment_method text,
  cashier_name text,
  payment_status text not null default 'paid' check (payment_status in ('paid','pending','refunded')),
  order_status text not null default 'completed' check (order_status in ('completed','cancelled','held')),
  note text,
  created_at bigint not null
);
create index if not exists idx_sales_date on sales(created_at);
create index if not exists idx_sales_order on sales(order_id);

create table if not exists sale_items (
  id text primary key,
  sale_id text not null references sales(id) on delete cascade,
  product_id text references products(id),
  product_name text not null,
  qty integer not null,
  unit_price integer not null,
  addons_json text,
  addons_total integer not null default 0,
  line_total integer not null,
  unit_cost integer
);
create index if not exists idx_sale_items_sale on sale_items(sale_id);
create index if not exists idx_sale_items_product on sale_items(product_id);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at bigint not null
);

create table if not exists sync_log (
  client_op_id text primary key,
  op_type text,
  ref_id text,
  applied_at bigint not null
);
create index if not exists idx_sync_log_time on sync_log(applied_at);

create table if not exists doc_sequences (
  prefix text not null,
  date_key text not null,
  last_number integer not null default 0,
  primary key (prefix, date_key)
);
`;

function readProducts() {
  const source = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "db_dump.json"), "utf8"));
  const rows = (((source || [])[0] || {}).results) || [];
  return rows
    .filter((row) => row && !DUPLICATE_PRODUCT_IDS.has(row.id))
    .map((row) => {
      const normalizedId = LEGACY_PRODUCT_ID_MAP[row.id] || row.id;
      const normalizedSku = LEGACY_PRODUCT_ID_MAP[row.sku_code] || row.sku_code || normalizedId;
      return {
        id: normalizedId,
    name: row.name,
    category_id: row.category_id || null,
    price: Number(row.price) || 0,
    cost_price: 0,
    barcode: row.barcode || normalizedSku || normalizedId,
    image: CATEGORY_ICON_MAP[row.category_id] || "🛒",
    description: row.description || null,
    component_ids: "[]",
    min_stock: Number(row.min_stock) || 0,
    is_active: 1,
    updated_at: NOW,
    unit: row.unit || null,
    sku_code: normalizedSku
      };
    });
}

function buildSeedData() {
  const products = readProducts();
  const inventory = products.map((product) => ({
    product_id: product.id,
    qty_on_hand: 0,
    location: "main",
    updated_at: NOW
  }));

  const settings = [
    { key: "shop", value: SHOP_SETTINGS, updated_at: NOW },
    { key: "invoice_templates", value: { templates: INVOICE_TEMPLATES, selectedId: "invoice-vat" }, updated_at: NOW },
    { key: "barcode_templates", value: { templates: BARCODE_TEMPLATES, selectedId: "barcode-retail" }, updated_at: NOW },
    { key: "selected_invoice_template_id", value: "invoice-vat", updated_at: NOW },
    { key: "selected_barcode_template_id", value: "barcode-retail", updated_at: NOW }
  ];

  return {
    meta: {
      format: "shopflow-supabase-seed-v1",
      generated_at: new Date(NOW).toISOString(),
      source: "Cloudflare D1 preparation bundle for Vercel + Supabase",
      notes: [
        "Products are sourced from database/data/db_dump.json.",
        "Inventory is initialized to 0 because live cross-device stock snapshots are not stored in this repo dump.",
        "Templates and shop settings are included so a fresh Supabase environment starts with the same UI defaults."
      ]
    },
    tables: {
      categories: CATEGORY_ROWS.map((row) => ({ ...row, is_active: 1, updated_at: NOW })),
      add_ons: ADD_ON_ROWS.map((row) => ({ ...row, updated_at: NOW })),
      components: COMPONENT_ROWS.map((row) => ({ ...row, updated_at: NOW })),
      products,
      inventory,
      stock_movements: [],
      suppliers: [],
      purchase_orders: [],
      purchase_order_items: [],
      stock_issues: [],
      stock_issue_items: [],
      sales: [],
      sale_items: [],
      settings,
      sync_log: [],
      doc_sequences: []
    }
  };
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sqlValue(value, { json = false } = {}) {
  if (value === null || value === undefined) return "NULL";
  if (json) {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildUpsertSql(tableName, columns, rows, options = {}) {
  if (!rows.length) {
    return `-- ${tableName}: no seed rows\n`;
  }
  const conflict = options.conflict;
  const jsonColumns = new Set(options.jsonColumns || []);
  const updateColumns = columns.filter((column) => !conflict.includes(column));
  const lines = [];
  lines.push(`-- ${tableName}`);
  lines.push(`insert into ${tableName} (${columns.join(", ")}) values`);
  lines.push(
    rows
      .map((row) => {
        const values = columns.map((column) => sqlValue(row[column], { json: jsonColumns.has(column) }));
        return `  (${values.join(", ")})`;
      })
      .join(",\n")
  );
  lines.push(`on conflict (${conflict.join(", ")}) do update set`);
  lines.push(
    updateColumns
      .map((column) => `  ${column} = excluded.${column}`)
      .join(",\n")
  );
  lines.push(";");
  lines.push("");
  return lines.join("\n");
}

function buildSeedSql(seed) {
  const { tables } = seed;
  return [
    "-- Supabase seed for ShopFlow POS",
    `-- Generated at ${seed.meta.generated_at}`,
    "",
    "begin;",
    "",
    buildUpsertSql("categories", ["id", "label", "icon", "sort_order", "is_active", "updated_at", "parent_id", "level", "code"], tables.categories, { conflict: ["id"] }),
    buildUpsertSql("add_ons", ["id", "label", "price", "group_key", "is_active", "updated_at"], tables.add_ons, { conflict: ["id"] }),
    buildUpsertSql("components", ["id", "label", "unit", "note", "updated_at"], tables.components, { conflict: ["id"] }),
    buildUpsertSql("products", ["id", "name", "category_id", "price", "cost_price", "barcode", "image", "description", "component_ids", "min_stock", "is_active", "updated_at", "unit", "sku_code"], tables.products, { conflict: ["id"] }),
    buildUpsertSql("inventory", ["product_id", "qty_on_hand", "location", "updated_at"], tables.inventory, { conflict: ["product_id"] }),
    buildUpsertSql("settings", ["key", "value", "updated_at"], tables.settings, { conflict: ["key"], jsonColumns: ["value"] }),
    "commit;",
    ""
  ].join("\n");
}

function main() {
  ensureDir(OUT_DIR);
  const seed = buildSeedData();
  const seedSql = buildSeedSql(seed);
  const manifest = {
    generated_at: seed.meta.generated_at,
    files: [
      "database/supabase/schema.sql",
      "database/supabase/seed.sql",
      "database/supabase/seed.json"
    ],
    table_counts: Object.fromEntries(
      Object.entries(seed.tables).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
    )
  };

  fs.writeFileSync(path.join(OUT_DIR, "schema.sql"), SCHEMA_SQL, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "seed.sql"), seedSql, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "seed.json"), JSON.stringify(seed, null, 2) + "\n", "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`Wrote Supabase bundle to ${OUT_DIR}`);
  console.log(JSON.stringify(manifest.table_counts, null, 2));
}

main();
