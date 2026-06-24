-- ShopFlow POS - D1 initial schema
-- Single-tenant, single-shop. All money fields stored as INTEGER (VND).
-- Timestamps stored as INTEGER milliseconds since epoch (Date.now()).

PRAGMA foreign_keys = ON;

-- ===========================================================
-- Categories
-- ===========================================================
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,           -- bilingual "VI / EN"
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL
);

-- ===========================================================
-- Add-ons (toppings, sweetness, ice level, extras)
-- ===========================================================
CREATE TABLE IF NOT EXISTS add_ons (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  price       INTEGER NOT NULL DEFAULT 0,
  group_key   TEXT NOT NULL,           -- 'sweetness' | 'ice' | 'extras'
  is_active   INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL
);

-- ===========================================================
-- Components (raw ingredients used by products)
-- ===========================================================
CREATE TABLE IF NOT EXISTS components (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  unit        TEXT,
  note        TEXT,
  updated_at  INTEGER NOT NULL
);

-- ===========================================================
-- Products (SKU master)
-- ===========================================================
CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
  price         INTEGER NOT NULL DEFAULT 0,
  cost_price    INTEGER NOT NULL DEFAULT 0,   -- weighted-average cost
  barcode       TEXT,
  image         TEXT,
  description   TEXT,
  component_ids TEXT,                          -- JSON array
  min_stock     INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  updated_at    INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL AND barcode <> '';
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- ===========================================================
-- Inventory snapshot (one row per SKU)
-- Source of truth for current on-hand quantity.
-- Updated atomically alongside stock_movements inserts.
-- ===========================================================
CREATE TABLE IF NOT EXISTS inventory (
  product_id   TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  qty_on_hand  INTEGER NOT NULL DEFAULT 0,
  location     TEXT NOT NULL DEFAULT 'main',
  updated_at   INTEGER NOT NULL
);

-- ===========================================================
-- Stock movements (immutable ledger)
-- Every IN / OUT / SALE / ADJUST / RETURN writes one row.
-- ===========================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id             TEXT PRIMARY KEY,
  product_id     TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type  TEXT NOT NULL CHECK (movement_type IN ('IN','OUT','SALE','ADJUST','RETURN')),
  qty_change     INTEGER NOT NULL,        -- positive for IN/RETURN, negative for OUT/SALE; ADJUST may be either
  unit_cost      INTEGER,                 -- captured cost (for IN, or snapshot at OUT/SALE)
  ref_type       TEXT,                    -- 'purchase' | 'issue' | 'sale' | 'manual'
  ref_id         TEXT,                    -- PN-... / PX-... / HD-... / NULL
  note           TEXT,
  created_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mov_product ON stock_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mov_ref     ON stock_movements(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_mov_date    ON stock_movements(created_at);

-- ===========================================================
-- Suppliers
-- ===========================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT,
  note       TEXT,
  is_active  INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

-- ===========================================================
-- Purchase orders (Nhập hàng)
-- ===========================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id              TEXT PRIMARY KEY,             -- 'PN-YYYYMMDD-NNN'
  supplier_id     TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name   TEXT,                          -- denormalized for fast list
  total_amount    INTEGER NOT NULL DEFAULT 0,
  paid_amount     INTEGER NOT NULL DEFAULT 0,
  payment_method  TEXT,
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft','completed','cancelled')),
  note            TEXT,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_purchase_date ON purchase_orders(created_at);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id           TEXT PRIMARY KEY,
  purchase_id  TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL REFERENCES products(id),
  product_name TEXT,
  qty          INTEGER NOT NULL,
  unit_cost    INTEGER NOT NULL,
  subtotal     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_po_items_purchase ON purchase_order_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product  ON purchase_order_items(product_id);

-- ===========================================================
-- Stock issues (Xuất hàng - NOT sales)
-- Used for damaged, samples, internal use, transfers, etc.
-- ===========================================================
CREATE TABLE IF NOT EXISTS stock_issues (
  id          TEXT PRIMARY KEY,                 -- 'PX-YYYYMMDD-NNN'
  reason      TEXT NOT NULL CHECK (reason IN ('damaged','sample','internal','transfer','other')),
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft','completed','cancelled')),
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_issue_date ON stock_issues(created_at);

CREATE TABLE IF NOT EXISTS stock_issue_items (
  id            TEXT PRIMARY KEY,
  issue_id      TEXT NOT NULL REFERENCES stock_issues(id) ON DELETE CASCADE,
  product_id    TEXT NOT NULL REFERENCES products(id),
  product_name  TEXT,
  qty           INTEGER NOT NULL,
  unit_cost     INTEGER                          -- cost snapshot at issue time (for valuation)
);
CREATE INDEX IF NOT EXISTS idx_issue_items_issue   ON stock_issue_items(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_items_product ON stock_issue_items(product_id);

-- ===========================================================
-- Sales (Buôn bán)
-- ===========================================================
CREATE TABLE IF NOT EXISTS sales (
  id              TEXT PRIMARY KEY,             -- 'HD-YYYYMMDD-NNN' or legacy
  order_id        TEXT,                          -- POS order id (DD/MM/YYYY-NNN)
  customer_name   TEXT,
  subtotal        INTEGER NOT NULL DEFAULT 0,
  vat_amount      INTEGER NOT NULL DEFAULT 0,
  discount        INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,
  paid            INTEGER NOT NULL DEFAULT 0,   -- cash received
  change_amount   INTEGER NOT NULL DEFAULT 0,
  payment_method  TEXT,
  cashier_name    TEXT,
  payment_status  TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid','pending','refunded')),
  order_status    TEXT NOT NULL DEFAULT 'completed' CHECK (order_status IN ('completed','cancelled','held','new','preparing','needs_action')),
  note            TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_order ON sales(order_id);

CREATE TABLE IF NOT EXISTS sale_items (
  id            TEXT PRIMARY KEY,
  sale_id       TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id    TEXT REFERENCES products(id),
  product_name  TEXT NOT NULL,
  qty           INTEGER NOT NULL,
  unit_price    INTEGER NOT NULL,
  addons_json   TEXT,                            -- JSON array of addon ids/labels/prices
  addons_total  INTEGER NOT NULL DEFAULT 0,
  line_total    INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  unit_cost     INTEGER                          -- cost snapshot for gross-profit
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale    ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- ===========================================================
-- Settings (key-value store for shop config)
-- ===========================================================
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,                      -- JSON
  updated_at INTEGER NOT NULL
);

-- ===========================================================
-- Sync log (idempotency for client-pushed operations)
-- Client sends client_op_id (UUID) with every mutation.
-- Server rejects duplicates here.
-- ===========================================================
CREATE TABLE IF NOT EXISTS sync_log (
  client_op_id TEXT PRIMARY KEY,
  op_type      TEXT,                              -- 'sale' | 'purchase' | 'issue' | 'product' | ...
  ref_id       TEXT,                              -- resulting server id (sale id, purchase id, ...)
  applied_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_log_time ON sync_log(applied_at);

-- ===========================================================
-- Daily sequence counters (for human-readable PN-/PX-/HD- IDs)
-- ===========================================================
CREATE TABLE IF NOT EXISTS doc_sequences (
  prefix      TEXT NOT NULL,                     -- 'PN' | 'PX' | 'HD'
  date_key    TEXT NOT NULL,                     -- 'YYYYMMDD'
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, date_key)
);
