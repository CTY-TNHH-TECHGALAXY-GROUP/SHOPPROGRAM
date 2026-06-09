-- Supabase/Postgres schema for ShopFlow POS
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
  stock_qty integer not null default 0,
  min_stock integer not null default 0,
  is_active integer not null default 1,
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
  inventory_mode text not null default 'stock',
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
comment on column sales.payment_method is 'Canonical POS payment method code: cash, card, bank_transfer, ewallet, or other.';
comment on column purchase_orders.payment_method is 'Canonical POS payment method code: cash, card, bank_transfer, ewallet, or other.';

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
