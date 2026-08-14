-- Promotions / sale cards.
-- Adds non-destructive tables and nullable sale item markers so promotion
-- component items can be excluded from product reports while still driving
-- inventory deduction.

CREATE TABLE IF NOT EXISTS promotions (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  code            TEXT,
  promo_type      TEXT NOT NULL DEFAULT 'combo',
  price           INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  image           TEXT,
  description     TEXT,
  items_json      TEXT NOT NULL DEFAULT '[]',
  starts_at       INTEGER,
  ends_at         INTEGER,
  is_active       INTEGER NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  usage_count     INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_code
  ON promotions(code)
  WHERE code IS NOT NULL AND code <> '';
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS sale_promotions (
  id              TEXT PRIMARY KEY,
  sale_id         TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  promotion_id    TEXT REFERENCES promotions(id) ON DELETE SET NULL,
  promotion_name  TEXT NOT NULL,
  promotion_code  TEXT,
  qty             INTEGER NOT NULL DEFAULT 1,
  gross_amount    INTEGER NOT NULL DEFAULT 0,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  net_amount      INTEGER NOT NULL DEFAULT 0,
  metadata_json   TEXT,
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_promotions_sale ON sale_promotions(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_promotions_promo ON sale_promotions(promotion_id, created_at);

ALTER TABLE sale_items ADD COLUMN promotion_id TEXT;
ALTER TABLE sale_items ADD COLUMN promotion_name TEXT;
ALTER TABLE sale_items ADD COLUMN report_scope TEXT NOT NULL DEFAULT 'product';

CREATE INDEX IF NOT EXISTS idx_sale_items_report_scope ON sale_items(report_scope);
CREATE INDEX IF NOT EXISTS idx_sale_items_promotion ON sale_items(promotion_id);
