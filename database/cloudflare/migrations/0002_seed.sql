-- ShopFlow POS - Seed data
-- Mirrors DEFAULT_PRODUCTS/CATEGORIES/ADD_ONS/COMPONENTS in src/app.js so a fresh
-- D1 database starts with the same content the offline app ships with.
-- Safe to re-run: uses INSERT OR IGNORE.

-- Categories
INSERT OR IGNORE INTO categories (id, label, icon, sort_order, is_active, updated_at) VALUES
  ('fresh-juice', 'Nước ép / Fresh Juice', '🍹', 10, 1, strftime('%s','now')*1000),
  ('smoothie',    'Sinh tố / Smoothie',     '🥤', 20, 1, strftime('%s','now')*1000),
  ('cut-fruit',   'Trái cây cắt / Cut Fruit','🍍', 30, 1, strftime('%s','now')*1000),
  ('fruit-box',   'Hộp trái cây / Fruit Box','📦', 40, 1, strftime('%s','now')*1000),
  ('combo',       'Combo / Combo',          '✨', 50, 1, strftime('%s','now')*1000);

-- Add-ons
INSERT OR IGNORE INTO add_ons (id, label, price, group_key, is_active, updated_at) VALUES
  ('sugar-50', '50% đường / Sugar 50%',          0,     'sweetness', 1, strftime('%s','now')*1000),
  ('sugar-0',  'Không đường / No Sugar',         0,     'sweetness', 1, strftime('%s','now')*1000),
  ('ice-less', 'Ít đá / Less Ice',               0,     'ice',       1, strftime('%s','now')*1000),
  ('ice-none', 'Không đá / No Ice',              0,     'ice',       1, strftime('%s','now')*1000),
  ('chia',     'Hạt chia / Chia Seeds',          8000,  'extras',    1, strftime('%s','now')*1000),
  ('aloe',     'Nha đam / Aloe Vera',            7000,  'extras',    1, strftime('%s','now')*1000),
  ('yogurt',   'Sữa chua Hy Lạp / Greek Yogurt', 12000, 'extras',    1, strftime('%s','now')*1000),
  ('protein',  'Protein thêm / Protein Shot',    15000, 'extras',    1, strftime('%s','now')*1000);

-- Components
INSERT OR IGNORE INTO components (id, label, unit, note, updated_at) VALUES
  ('orange',      'Cam / Orange',         'trái / fruits', 'Nguyên liệu nước ép cam / Juice base',  strftime('%s','now')*1000),
  ('watermelon',  'Dưa hấu / Watermelon', 'gram',          'Nguyên liệu lạnh / Chilled prep',       strftime('%s','now')*1000),
  ('mint',        'Lá bạc hà / Mint',     'lá / leaves',   'Trang trí và tạo mùi / Garnish',        strftime('%s','now')*1000),
  ('honey',       'Mật ong / Honey',      'ml',            'Tăng vị ngọt / Sweetener',              strftime('%s','now')*1000),
  ('yogurt-base', 'Sữa chua / Yogurt',    'gram',          'Base cho smoothie / Smoothie base',     strftime('%s','now')*1000),
  ('chia-base',   'Hạt chia / Chia Seeds','gram',          'Topping mặc định / Default topping',    strftime('%s','now')*1000);

-- Products
INSERT OR IGNORE INTO products (id, name, category_id, price, cost_price, barcode, image, description, min_stock, is_active, updated_at) VALUES
  ('p-orange-juice',    'Cam Mat Ong',         'fresh-juice', 45000,  20000, 'TFH-001', '🍊', 'Cam tuoi ep cung mat ong rung.',      5, 1, strftime('%s','now')*1000),
  ('p-watermelon',      'Dua Hau Mat Lanh',    'fresh-juice', 42000,  18000, 'TFH-002', '🍉', 'Nuoc dua hau it da, giai nhiet nhanh.',5,1, strftime('%s','now')*1000),
  ('p-pineapple',       'Dua Thom Mint',       'fresh-juice', 47000,  21000, 'TFH-003', '🍍', 'Thom ep cung la bac ha.',             5, 1, strftime('%s','now')*1000),
  ('p-detox',           'Detox Xanh',          'fresh-juice', 49000,  22000, 'TFH-004', '🥒', 'Cần tây, táo xanh, dưa leo.',         5, 1, strftime('%s','now')*1000),
  ('p-mango',           'Mango Smoothie',      'smoothie',    58000,  26000, 'TFH-005', '🥭', 'Xoai xay cung sua chua.',             5, 1, strftime('%s','now')*1000),
  ('p-berry',           'Berry Boost',         'smoothie',    62000,  28000, 'TFH-006', '🫐', 'Viet quat va dau tay dam vi.',        5, 1, strftime('%s','now')*1000),
  ('p-avocado',         'Bo Kem Dua',          'smoothie',    64000,  29000, 'TFH-007', '🥑', 'Sinh to bo mem min voi dua.',         5, 1, strftime('%s','now')*1000),
  ('p-dragon',          'Dragon Glow',         'smoothie',    59000,  26000, 'TFH-008', '🐉', 'Thanh long hồng và chuối.',           5, 1, strftime('%s','now')*1000),
  ('p-cut-mix',         'Hop Trai Cay Mix',    'cut-fruit',   55000,  25000, 'TFH-009', '🍇', 'Mix dua, tao, nho, kiwi.',            5, 1, strftime('%s','now')*1000),
  ('p-cut-tropical',    'Tropical Cup',        'cut-fruit',   52000,  24000, 'TFH-010', '🥝', 'Cup trai cay nhiet doi an lien.',     5, 1, strftime('%s','now')*1000),
  ('p-box-family',      'Fruit Box Family',    'fruit-box',  145000,  70000, 'TFH-011', '🧺', 'Hộp lớn cho gia đình 3-4 người.',     3, 1, strftime('%s','now')*1000),
  ('p-box-office',      'Office Energy Box',   'fruit-box',   99000,  48000, 'TFH-012', '📦', 'Fruit box gon cho van phong.',        3, 1, strftime('%s','now')*1000),
  ('p-combo-breakfast', 'Combo Sang Nhe',      'combo',       79000,  38000, 'TFH-013', '🌞', '1 juice + 1 cut fruit.',              3, 1, strftime('%s','now')*1000),
  ('p-combo-clean',     'Combo Clean Body',    'combo',      119000,  58000, 'TFH-014', '💚', '2 chai detox + hat chia.',            3, 1, strftime('%s','now')*1000);

-- Initial inventory snapshot (matches original `stock` numbers)
INSERT OR IGNORE INTO inventory (product_id, qty_on_hand, location, updated_at) VALUES
  ('p-orange-juice',    28, 'main', strftime('%s','now')*1000),
  ('p-watermelon',      24, 'main', strftime('%s','now')*1000),
  ('p-pineapple',       18, 'main', strftime('%s','now')*1000),
  ('p-detox',           16, 'main', strftime('%s','now')*1000),
  ('p-mango',           20, 'main', strftime('%s','now')*1000),
  ('p-berry',           14, 'main', strftime('%s','now')*1000),
  ('p-avocado',         11, 'main', strftime('%s','now')*1000),
  ('p-dragon',          13, 'main', strftime('%s','now')*1000),
  ('p-cut-mix',         17, 'main', strftime('%s','now')*1000),
  ('p-cut-tropical',    19, 'main', strftime('%s','now')*1000),
  ('p-box-family',       8, 'main', strftime('%s','now')*1000),
  ('p-box-office',      10, 'main', strftime('%s','now')*1000),
  ('p-combo-breakfast',  9, 'main', strftime('%s','now')*1000),
  ('p-combo-clean',      7, 'main', strftime('%s','now')*1000);

-- Opening stock as a single IN movement so the ledger stays consistent
INSERT OR IGNORE INTO stock_movements (id, product_id, movement_type, qty_change, unit_cost, ref_type, ref_id, note, created_at) VALUES
  ('mv-seed-p-orange-juice',    'p-orange-juice',    'IN', 28, 20000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-watermelon',      'p-watermelon',      'IN', 24, 18000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-pineapple',       'p-pineapple',       'IN', 18, 21000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-detox',           'p-detox',           'IN', 16, 22000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-mango',           'p-mango',           'IN', 20, 26000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-berry',           'p-berry',           'IN', 14, 28000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-avocado',         'p-avocado',         'IN', 11, 29000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-dragon',          'p-dragon',          'IN', 13, 26000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-cut-mix',         'p-cut-mix',         'IN', 17, 25000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-cut-tropical',    'p-cut-tropical',    'IN', 19, 24000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-box-family',      'p-box-family',      'IN',  8, 70000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-box-office',      'p-box-office',      'IN', 10, 48000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-combo-breakfast', 'p-combo-breakfast', 'IN',  9, 38000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000),
  ('mv-seed-p-combo-clean',     'p-combo-clean',     'IN',  7, 58000, 'manual', 'SEED', 'Khoi tao ton dau / Opening stock', strftime('%s','now')*1000);

-- Default settings (one JSON blob keyed by 'shop')
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
  ('shop', '{"storeName":"The Fruit House","brandLine":"THE FRUIT HOUSE","brandDisplayName":"OriaFarm","branchName":"Quầy Linh Trần","address":"123 Nguyễn Huệ, Quận 1, TP.HCM","phone":"0909 123 456","taxId":"0312345678","cashierName":"Linh Tran","openHours":"07:00 - 22:00","receiptFooter":"Cảm ơn bạn đã ghé The Fruit House.","vatNote":"Hóa đơn VAT sẽ được gửi theo yêu cầu."}', strftime('%s','now')*1000);
