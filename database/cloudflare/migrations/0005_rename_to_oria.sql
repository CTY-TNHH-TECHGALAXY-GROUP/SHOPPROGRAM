-- Migration 0005 — Rename ad-hoc product IDs to ORIA61xxx sequence.
--
-- 4 SP đã được thêm thủ công trước khi có chế độ "ID nội bộ":
--   p-djp0k0ew       BANH PINATSU DUA 80G     (1 movement)
--   p-uyol67bm       SNACK BENTO H.SAN CAY..  (1 sale, 2 movements)
--   p-m5abfj39       BANH KHO ME 300G         (1 movement)
--   product-oiqum90zl  BANH PINATSU DUA 80G   (duplicate, no refs)
--
-- Strategy: defer foreign keys so we can UPDATE all references in one
-- transaction. We also soft-delete the duplicate PINATSU row.
--
-- ID mapping:
--   p-djp0k0ew       -> ORIA61034
--   p-uyol67bm       -> ORIA61035
--   p-m5abfj39       -> ORIA61036
--   product-oiqum90zl -> (soft-delete, duplicate of ORIA61034)

PRAGMA defer_foreign_keys = ON;

-- 1) Soft-delete the duplicate PINATSU (no FK refs, safe)
UPDATE products SET is_active = 0, updated_at = strftime('%s','now')*1000
WHERE id = 'product-oiqum90zl';

-- 2) Rename p-djp0k0ew -> ORIA61034
UPDATE products          SET id = 'ORIA61034', sku_code = 'ORIA61034', updated_at = strftime('%s','now')*1000
WHERE id = 'p-djp0k0ew';
UPDATE inventory         SET product_id = 'ORIA61034' WHERE product_id = 'p-djp0k0ew';
UPDATE sale_items        SET product_id = 'ORIA61034' WHERE product_id = 'p-djp0k0ew';
UPDATE stock_movements   SET product_id = 'ORIA61034' WHERE product_id = 'p-djp0k0ew';
UPDATE purchase_order_items SET product_id = 'ORIA61034' WHERE product_id = 'p-djp0k0ew';
UPDATE stock_issue_items SET product_id = 'ORIA61034' WHERE product_id = 'p-djp0k0ew';

-- 3) Rename p-uyol67bm -> ORIA61035
UPDATE products          SET id = 'ORIA61035', sku_code = 'ORIA61035', updated_at = strftime('%s','now')*1000
WHERE id = 'p-uyol67bm';
UPDATE inventory         SET product_id = 'ORIA61035' WHERE product_id = 'p-uyol67bm';
UPDATE sale_items        SET product_id = 'ORIA61035' WHERE product_id = 'p-uyol67bm';
UPDATE stock_movements   SET product_id = 'ORIA61035' WHERE product_id = 'p-uyol67bm';
UPDATE purchase_order_items SET product_id = 'ORIA61035' WHERE product_id = 'p-uyol67bm';
UPDATE stock_issue_items SET product_id = 'ORIA61035' WHERE product_id = 'p-uyol67bm';

-- 4) Rename p-m5abfj39 -> ORIA61036
UPDATE products          SET id = 'ORIA61036', sku_code = 'ORIA61036', updated_at = strftime('%s','now')*1000
WHERE id = 'p-m5abfj39';
UPDATE inventory         SET product_id = 'ORIA61036' WHERE product_id = 'p-m5abfj39';
UPDATE sale_items        SET product_id = 'ORIA61036' WHERE product_id = 'p-m5abfj39';
UPDATE stock_movements   SET product_id = 'ORIA61036' WHERE product_id = 'p-m5abfj39';
UPDATE purchase_order_items SET product_id = 'ORIA61036' WHERE product_id = 'p-m5abfj39';
UPDATE stock_issue_items SET product_id = 'ORIA61036' WHERE product_id = 'p-m5abfj39';
