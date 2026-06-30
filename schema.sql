CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,           
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL
, parent_id TEXT REFERENCES categories(id), level     INTEGER NOT NULL DEFAULT 1, code      TEXT);
CREATE TABLE add_ons (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  price       INTEGER NOT NULL DEFAULT 0,
  group_key   TEXT NOT NULL,           
  is_active   INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL
);
CREATE TABLE components (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  unit        TEXT,
  note        TEXT,
  updated_at  INTEGER NOT NULL
, stock_qty INTEGER NOT NULL DEFAULT 0, min_stock INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, item_type TEXT NOT NULL DEFAULT 'raw_material', cost_per_unit INTEGER NOT NULL DEFAULT 0);
CREATE TABLE products (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
  price         INTEGER NOT NULL DEFAULT 0,
  cost_price    INTEGER NOT NULL DEFAULT 0,   
  barcode       TEXT,
  image         TEXT,
  description   TEXT,
  component_ids TEXT,                          
  min_stock     INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  updated_at    INTEGER NOT NULL
, unit     TEXT, sku_code TEXT, inventory_mode TEXT);
CREATE UNIQUE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL AND barcode <> '';
CREATE INDEX idx_products_category ON products(category_id);
CREATE TABLE inventory (
  product_id   TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  qty_on_hand  INTEGER NOT NULL DEFAULT 0,
  location     TEXT NOT NULL DEFAULT 'main',
  updated_at   INTEGER NOT NULL
);
CREATE TABLE stock_movements (
  id             TEXT PRIMARY KEY,
  product_id     TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type  TEXT NOT NULL CHECK (movement_type IN ('IN','OUT','SALE','ADJUST','RETURN')),
  qty_change     INTEGER NOT NULL,        
  unit_cost      INTEGER,                 
  ref_type       TEXT,                    
  ref_id         TEXT,                    
  note           TEXT,
  created_at     INTEGER NOT NULL
);
CREATE INDEX idx_mov_product ON stock_movements(product_id, created_at);
CREATE INDEX idx_mov_ref     ON stock_movements(ref_type, ref_id);
CREATE INDEX idx_mov_date    ON stock_movements(created_at);
CREATE TABLE suppliers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT,
  note       TEXT,
  is_active  INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
CREATE TABLE purchase_orders (
  id              TEXT PRIMARY KEY,             
  supplier_id     TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name   TEXT,                          
  total_amount    INTEGER NOT NULL DEFAULT 0,
  paid_amount     INTEGER NOT NULL DEFAULT 0,
  payment_method  TEXT,
  status          TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft','completed','cancelled')),
  note            TEXT,
  created_at      INTEGER NOT NULL
, verification_status TEXT NOT NULL DEFAULT 'verified', source_request_ids TEXT, verified_at INTEGER, verified_by TEXT);
CREATE INDEX idx_purchase_date ON purchase_orders(created_at);
CREATE TABLE purchase_order_items (
  id           TEXT PRIMARY KEY,
  purchase_id  TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL REFERENCES products(id),
  product_name TEXT,
  qty          INTEGER NOT NULL,
  unit_cost    INTEGER NOT NULL,
  subtotal     INTEGER NOT NULL
, purchase_qty REAL, purchase_unit TEXT, purchase_unit_cost INTEGER);
CREATE INDEX idx_po_items_purchase ON purchase_order_items(purchase_id);
CREATE INDEX idx_po_items_product  ON purchase_order_items(product_id);
CREATE TABLE stock_issues (
  id          TEXT PRIMARY KEY,                 
  reason      TEXT NOT NULL CHECK (reason IN ('damaged','sample','internal','transfer','other')),
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('draft','completed','cancelled')),
  created_at  INTEGER NOT NULL
);
CREATE INDEX idx_issue_date ON stock_issues(created_at);
CREATE TABLE stock_issue_items (
  id            TEXT PRIMARY KEY,
  issue_id      TEXT NOT NULL REFERENCES stock_issues(id) ON DELETE CASCADE,
  product_id    TEXT NOT NULL REFERENCES products(id),
  product_name  TEXT,
  qty           INTEGER NOT NULL,
  unit_cost     INTEGER                          
, item_type TEXT NOT NULL DEFAULT 'product', component_id TEXT);
CREATE INDEX idx_issue_items_issue   ON stock_issue_items(issue_id);
CREATE INDEX idx_issue_items_product ON stock_issue_items(product_id);
CREATE TABLE sales (
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
  order_status    TEXT NOT NULL DEFAULT 'completed' CHECK (order_status IN ('completed','cancelled','held')),
  note            TEXT,
  created_at      INTEGER NOT NULL
);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_order ON sales(order_id);
CREATE TABLE sale_items (
  id            TEXT PRIMARY KEY,
  sale_id       TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id    TEXT REFERENCES products(id),
  product_name  TEXT NOT NULL,
  qty           INTEGER NOT NULL,
  unit_price    INTEGER NOT NULL,
  addons_json   TEXT,                            
  addons_total  INTEGER NOT NULL DEFAULT 0,
  line_total    INTEGER NOT NULL,
  unit_cost     INTEGER                          
);
CREATE INDEX idx_sale_items_sale    ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,                      
  updated_at INTEGER NOT NULL
);
CREATE TABLE sync_log (
  client_op_id TEXT PRIMARY KEY,
  op_type      TEXT,                              
  ref_id       TEXT,                              
  applied_at   INTEGER NOT NULL
);
CREATE INDEX idx_sync_log_time ON sync_log(applied_at);
CREATE TABLE doc_sequences (
  prefix      TEXT NOT NULL,                     
  date_key    TEXT NOT NULL,                     
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, date_key)
);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_code   ON categories(code);
CREATE INDEX idx_products_sku      ON products(sku_code);
CREATE TABLE purchase_component_items (
  id             TEXT PRIMARY KEY,
  purchase_id    TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  component_id   TEXT NOT NULL REFERENCES components(id),
  component_name TEXT,
  qty            REAL NOT NULL,
  unit           TEXT,
  unit_cost      INTEGER NOT NULL,
  subtotal       INTEGER NOT NULL
, purchase_qty REAL, purchase_unit TEXT, purchase_unit_cost INTEGER);
CREATE INDEX idx_po_component_items_purchase
  ON purchase_component_items(purchase_id);
CREATE INDEX idx_po_component_items_component
  ON purchase_component_items(component_id);
CREATE TABLE component_stock_movements (
  id            TEXT PRIMARY KEY,
  component_id  TEXT NOT NULL REFERENCES components(id),
  movement_type TEXT NOT NULL,
  qty_change    REAL NOT NULL,
  unit_cost     INTEGER,
  ref_type      TEXT,
  ref_id        TEXT,
  note          TEXT,
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_component_mov_component
  ON component_stock_movements(component_id, created_at);
CREATE INDEX idx_component_mov_ref
  ON component_stock_movements(ref_type, ref_id);
CREATE TABLE production_recipes (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  output_component_id TEXT NOT NULL REFERENCES components(id),
  planned_output_qty  REAL NOT NULL,
  output_unit         TEXT NOT NULL,
  inputs_json         TEXT NOT NULL,
  note                TEXT,
  is_active           INTEGER NOT NULL DEFAULT 1,
  updated_at          INTEGER NOT NULL
);
CREATE INDEX idx_production_recipes_output
  ON production_recipes(output_component_id);
CREATE TABLE production_batches (
  id                   TEXT PRIMARY KEY,
  recipe_id            TEXT NOT NULL REFERENCES production_recipes(id),
  output_component_id  TEXT NOT NULL REFERENCES components(id),
  planned_output_qty   REAL NOT NULL,
  actual_output_qty    REAL NOT NULL,
  output_unit          TEXT NOT NULL,
  total_input_cost     INTEGER NOT NULL DEFAULT 0,
  actual_cost_per_unit INTEGER NOT NULL DEFAULT 0,
  note                 TEXT,
  created_at           INTEGER NOT NULL
);
CREATE INDEX idx_production_batches_recipe
  ON production_batches(recipe_id, created_at);
CREATE INDEX idx_production_batches_output
  ON production_batches(output_component_id, created_at);
CREATE INDEX idx_issue_items_component ON stock_issue_items(component_id);
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL,           
  full_name     TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
