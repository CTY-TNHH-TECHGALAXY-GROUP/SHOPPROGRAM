PRAGMA foreign_keys = ON;

ALTER TABLE products ADD COLUMN inventory_mode TEXT NOT NULL DEFAULT 'stock';
ALTER TABLE components ADD COLUMN stock_qty INTEGER NOT NULL DEFAULT 0;
ALTER TABLE components ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE components ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

UPDATE products
SET inventory_mode = 'recipe',
    updated_at = strftime('%s','now') * 1000
WHERE inventory_mode <> 'recipe'
  AND (
    id GLOB 'ORIA1*'
    OR id GLOB 'ORIA2*'
    OR id GLOB 'ORIA3*'
    OR id GLOB 'ORIA4*'
    OR id GLOB 'ORIA5*'
  );
