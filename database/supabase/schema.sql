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
  stock_qty numeric not null default 0,
  min_stock numeric not null default 0,
  item_type text not null default 'raw_material',
  cost_per_unit integer not null default 0,
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
  inventory_mode text,
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
  qty_on_hand numeric not null default 0,
  location text not null default 'main',
  updated_at bigint not null
);

create table if not exists stock_movements (
  id text primary key,
  product_id text not null references products(id) on delete cascade,
  movement_type text not null check (movement_type in ('IN','OUT','SALE','ADJUST','RETURN')),
  qty_change numeric not null,
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
  verification_status text not null default 'verified',
  source_request_ids text,
  verified_at bigint,
  verified_by text,
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
  subtotal integer not null,
  purchase_qty numeric,
  purchase_unit text,
  purchase_unit_cost integer
);
create index if not exists idx_po_items_purchase on purchase_order_items(purchase_id);
create index if not exists idx_po_items_product on purchase_order_items(product_id);

create table if not exists purchase_component_items (
  id text primary key,
  purchase_id text not null references purchase_orders(id) on delete cascade,
  component_id text not null references components(id),
  component_name text,
  qty numeric not null,
  unit text,
  unit_cost integer not null,
  subtotal integer not null,
  purchase_qty numeric,
  purchase_unit text,
  purchase_unit_cost integer
);
create index if not exists idx_po_component_items_purchase on purchase_component_items(purchase_id);
create index if not exists idx_po_component_items_component on purchase_component_items(component_id);

create table if not exists component_stock_movements (
  id text primary key,
  component_id text not null references components(id),
  movement_type text not null,
  qty_change numeric not null,
  unit_cost integer,
  ref_type text,
  ref_id text,
  note text,
  created_at bigint not null
);
create index if not exists idx_component_mov_component on component_stock_movements(component_id, created_at);
create index if not exists idx_component_mov_ref on component_stock_movements(ref_type, ref_id);

create table if not exists production_recipes (
  id text primary key,
  name text not null,
  output_component_id text not null references components(id),
  planned_output_qty numeric not null,
  output_unit text not null,
  inputs_json text not null,
  note text,
  is_active integer not null default 1,
  updated_at bigint not null
);
create index if not exists idx_production_recipes_output on production_recipes(output_component_id);

create table if not exists production_batches (
  id text primary key,
  recipe_id text not null references production_recipes(id),
  output_component_id text not null references components(id),
  planned_output_qty numeric not null,
  actual_output_qty numeric not null,
  output_unit text not null,
  total_input_cost integer not null default 0,
  actual_cost_per_unit integer not null default 0,
  note text,
  created_at bigint not null
);
create index if not exists idx_production_batches_recipe on production_batches(recipe_id, created_at);
create index if not exists idx_production_batches_output on production_batches(output_component_id, created_at);

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
  product_id text references products(id),
  component_id text references components(id),
  item_type text not null default 'product' check (item_type in ('product','component')),
  product_name text,
  qty numeric not null,
  unit_cost integer
);
create index if not exists idx_issue_items_issue on stock_issue_items(issue_id);
create index if not exists idx_issue_items_product on stock_issue_items(product_id);
create index if not exists idx_issue_items_component on stock_issue_items(component_id);

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
  order_status text not null default 'completed' check (order_status in ('completed','cancelled','held','new','preparing','needs_action')),
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
  qty numeric not null,
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
-- Supabase RLS policies for ShopFlow POS.
--
-- Supabase exposes the public schema through PostgREST, so each public table
-- must have row level security enabled. Browser clients can read only the
-- safe catalog/config data needed to render the POS. Sensitive writes should
-- be handled by server-side code using the service role key.

alter table public.categories enable row level security;
alter table public.add_ons enable row level security;
alter table public.components enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.stock_movements enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.purchase_component_items enable row level security;
alter table public.component_stock_movements enable row level security;
alter table public.production_recipes enable row level security;
alter table public.production_batches enable row level security;
alter table public.stock_issues enable row level security;
alter table public.stock_issue_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.settings enable row level security;
alter table public.sync_log enable row level security;
alter table public.doc_sequences enable row level security;

alter table public.components add column if not exists stock_qty numeric not null default 0;
alter table public.components add column if not exists min_stock numeric not null default 0;
alter table public.components alter column stock_qty type numeric using stock_qty::numeric;
alter table public.components alter column min_stock type numeric using min_stock::numeric;
alter table public.components add column if not exists is_active integer not null default 1;
alter table public.components add column if not exists item_type text not null default 'raw_material';
alter table public.components add column if not exists cost_per_unit integer not null default 0;
alter table public.products add column if not exists inventory_mode text;
alter table public.stock_issue_items add column if not exists item_type text not null default 'product';
alter table public.stock_issue_items add column if not exists component_id text;
alter table public.stock_issue_items alter column product_id drop not null;
alter table public.stock_issue_items alter column qty type numeric using qty::numeric;
alter table public.stock_issue_items drop constraint if exists stock_issue_items_product_id_fkey;
alter table public.stock_issue_items add constraint stock_issue_items_product_id_fkey foreign key (product_id) references public.products(id);
alter table public.stock_issue_items drop constraint if exists stock_issue_items_component_id_fkey;
alter table public.stock_issue_items add constraint stock_issue_items_component_id_fkey foreign key (component_id) references public.components(id);
create index if not exists idx_issue_items_component on public.stock_issue_items(component_id);

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.add_ons, public.components, public.products, public.inventory, public.settings to anon, authenticated;
grant select on public.suppliers, public.sales, public.sale_items, public.purchase_orders, public.purchase_order_items, public.purchase_component_items, public.stock_issues, public.stock_issue_items, public.stock_movements, public.component_stock_movements, public.production_recipes, public.production_batches to authenticated;

drop policy if exists "catalog_select_active_categories" on public.categories;
create policy "catalog_select_active_categories"
on public.categories for select
to anon, authenticated
using (is_active = 1);

drop policy if exists "catalog_select_active_add_ons" on public.add_ons;
create policy "catalog_select_active_add_ons"
on public.add_ons for select
to anon, authenticated
using (is_active = 1);

drop policy if exists "catalog_select_active_components" on public.components;
create policy "catalog_select_active_components"
on public.components for select
to anon, authenticated
using (is_active = 1);

drop policy if exists "catalog_select_active_products" on public.products;
create policy "catalog_select_active_products"
on public.products for select
to anon, authenticated
using (is_active = 1);

drop policy if exists "catalog_select_active_inventory" on public.inventory;
create policy "catalog_select_active_inventory"
on public.inventory for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = inventory.product_id
      and products.is_active = 1
  )
);

drop policy if exists "settings_select_public_app_config" on public.settings;
create policy "settings_select_public_app_config"
on public.settings for select
to anon, authenticated
using (
  key in (
    'shop',
    'invoice_templates',
    'barcode_templates',
    'selected_invoice_template_id',
    'selected_barcode_template_id'
  )
);

drop policy if exists "staff_select_suppliers" on public.suppliers;
create policy "staff_select_suppliers"
on public.suppliers for select
to authenticated
using (true);

drop policy if exists "staff_select_sales" on public.sales;
create policy "staff_select_sales"
on public.sales for select
to authenticated
using (true);

drop policy if exists "staff_select_sale_items" on public.sale_items;
create policy "staff_select_sale_items"
on public.sale_items for select
to authenticated
using (true);

drop policy if exists "staff_select_purchase_orders" on public.purchase_orders;
create policy "staff_select_purchase_orders"
on public.purchase_orders for select
to authenticated
using (true);

drop policy if exists "staff_select_purchase_order_items" on public.purchase_order_items;
create policy "staff_select_purchase_order_items"
on public.purchase_order_items for select
to authenticated
using (true);

drop policy if exists "staff_select_purchase_component_items" on public.purchase_component_items;
create policy "staff_select_purchase_component_items"
on public.purchase_component_items for select
to authenticated
using (true);

drop policy if exists "staff_select_component_stock_movements" on public.component_stock_movements;
create policy "staff_select_component_stock_movements"
on public.component_stock_movements for select
to authenticated
using (true);

drop policy if exists "staff_select_production_recipes" on public.production_recipes;
create policy "staff_select_production_recipes"
on public.production_recipes for select
to authenticated
using (true);

drop policy if exists "staff_select_production_batches" on public.production_batches;
create policy "staff_select_production_batches"
on public.production_batches for select
to authenticated
using (true);

drop policy if exists "staff_select_stock_issues" on public.stock_issues;
create policy "staff_select_stock_issues"
on public.stock_issues for select
to authenticated
using (true);

drop policy if exists "staff_select_stock_issue_items" on public.stock_issue_items;
create policy "staff_select_stock_issue_items"
on public.stock_issue_items for select
to authenticated
using (true);

drop policy if exists "staff_select_stock_movements" on public.stock_movements;
create policy "staff_select_stock_movements"
on public.stock_movements for select
to authenticated
using (true);

-- ===========================================================
-- Users (RBAC)
-- ===========================================================
create table if not exists users (
  id            text primary key,
  email         text not null unique,
  password_hash text not null,
  role          text not null,
  full_name     text,
  is_active     integer not null default 1,
  created_at    bigint not null,
  updated_at    bigint not null
);

create index if not exists idx_users_email on users(email);
create index if not exists idx_users_role on users(role);

-- RLS policies for users
alter table users enable row level security;

create policy "admin_all_users"
on public.users for all
to authenticated
using (
  (select role from public.users where id = auth.uid()::text limit 1) = 'admin'
);
