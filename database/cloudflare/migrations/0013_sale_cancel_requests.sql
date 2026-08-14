-- Track paid-stock application and admin-approved sale cancellation.
-- D1 cannot alter CHECK constraints in-place, so rebuild sales safely.

PRAGMA foreign_keys=off;

CREATE TABLE IF NOT EXISTS sales_v2 (
  id              TEXT PRIMARY KEY,
  order_id        TEXT,
  customer_name   TEXT,
  subtotal        INTEGER NOT NULL DEFAULT 0,
  vat_amount      INTEGER NOT NULL DEFAULT 0,
  discount        INTEGER NOT NULL DEFAULT 0,
  total           INTEGER NOT NULL DEFAULT 0,
  paid            INTEGER NOT NULL DEFAULT 0,
  change_amount   INTEGER NOT NULL DEFAULT 0,
  payment_method  TEXT,
  cashier_name    TEXT,
  payment_status  TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid','pending','refunded')),
  order_status    TEXT NOT NULL DEFAULT 'completed' CHECK (order_status IN ('completed','cancelled','cancel_requested','held','new','preparing','ready','needs_action')),
  stock_status    TEXT NOT NULL DEFAULT 'pending' CHECK (stock_status IN ('pending','applied','restored')),
  note            TEXT,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO sales_v2
  (id, order_id, customer_name, subtotal, vat_amount, discount, total,
   paid, change_amount, payment_method, cashier_name, payment_status,
   order_status, stock_status, note, created_at, updated_at)
SELECT
  id, order_id, customer_name, subtotal, vat_amount, discount, total,
  paid, change_amount, payment_method, cashier_name, payment_status,
  order_status,
  CASE
    WHEN order_status = 'cancelled' THEN 'restored'
    WHEN order_status = 'completed' THEN 'applied'
    ELSE 'pending'
  END,
  note, created_at, COALESCE(updated_at, created_at)
FROM sales;

DROP TABLE sales;
ALTER TABLE sales_v2 RENAME TO sales;

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_order ON sales(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(order_status, payment_status, stock_status);

PRAGMA foreign_keys=on;

CREATE TABLE IF NOT EXISTS sale_cancel_requests (
  id            TEXT PRIMARY KEY,
  sale_id       TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  order_id      TEXT,
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  requested_by  TEXT,
  reviewed_by   TEXT,
  requested_at  INTEGER NOT NULL,
  reviewed_at   INTEGER,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_sale_cancel_requests_sale ON sale_cancel_requests(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_cancel_requests_status ON sale_cancel_requests(status, requested_at);
