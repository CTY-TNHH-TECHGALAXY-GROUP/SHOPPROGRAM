-- Promotions / sale cards for Supabase.
-- Non-destructive: only creates new tables and nullable marker columns.

create table if not exists promotions (
  id text primary key,
  name text not null,
  code text,
  promo_type text not null default 'combo',
  price integer not null default 0,
  discount_amount integer not null default 0,
  image text,
  description text,
  items_json text not null default '[]',
  starts_at bigint,
  ends_at bigint,
  is_active integer not null default 1,
  sort_order integer not null default 0,
  usage_count integer not null default 0,
  created_at bigint not null,
  updated_at bigint not null
);

create unique index if not exists idx_promotions_code
  on promotions(code)
  where code is not null and code <> '';
create index if not exists idx_promotions_active
  on promotions(is_active, starts_at, ends_at);

create table if not exists sale_promotions (
  id text primary key,
  sale_id text not null references sales(id) on delete cascade,
  promotion_id text references promotions(id) on delete set null,
  promotion_name text not null,
  promotion_code text,
  qty integer not null default 1,
  gross_amount integer not null default 0,
  discount_amount integer not null default 0,
  net_amount integer not null default 0,
  metadata_json text,
  created_at bigint not null
);

create index if not exists idx_sale_promotions_sale
  on sale_promotions(sale_id);
create index if not exists idx_sale_promotions_promo
  on sale_promotions(promotion_id, created_at);

alter table sale_items add column if not exists promotion_id text;
alter table sale_items add column if not exists promotion_name text;
alter table sale_items add column if not exists report_scope text not null default 'product';

create index if not exists idx_sale_items_report_scope
  on sale_items(report_scope);
create index if not exists idx_sale_items_promotion
  on sale_items(promotion_id);
