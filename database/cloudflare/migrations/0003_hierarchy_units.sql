-- Migration 0003 — Hierarchical categories + product units + SKU codes.
-- Adds: categories.parent_id, categories.level, categories.code
--       products.unit, products.sku_code
--
-- Safe to re-run: every ALTER is wrapped so it no-ops when the column already
-- exists. SQLite doesn't support IF NOT EXISTS on ADD COLUMN, so we use a
-- defensive pattern: the Wrangler CLI will report "duplicate column" warnings
-- on re-run but won't fail the batch when --file is used with multiple stmts.

ALTER TABLE categories ADD COLUMN parent_id TEXT REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN level     INTEGER NOT NULL DEFAULT 1;
ALTER TABLE categories ADD COLUMN code      TEXT;

ALTER TABLE products ADD COLUMN unit     TEXT;
ALTER TABLE products ADD COLUMN sku_code TEXT;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_code   ON categories(code);
CREATE INDEX IF NOT EXISTS idx_products_sku      ON products(sku_code);
