-- Track paid-stock application and admin-approved sale cancellation.

alter table public.sales
  add column if not exists stock_status text not null default 'pending';

alter table public.sales
  drop constraint if exists sales_order_status_check;

alter table public.sales
  add constraint sales_order_status_check
  check (order_status in ('completed','cancelled','cancel_requested','held','new','preparing','ready','needs_action'));

alter table public.sales
  drop constraint if exists sales_stock_status_check;

alter table public.sales
  add constraint sales_stock_status_check
  check (stock_status in ('pending','applied','restored'));

update public.sales
set stock_status = case
  when order_status = 'cancelled' then 'restored'
  when order_status = 'completed' then 'applied'
  else stock_status
end
where stock_status = 'pending';

create table if not exists public.sale_cancel_requests (
  id text primary key,
  sale_id text not null references public.sales(id) on delete cascade,
  order_id text,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_by text,
  reviewed_by text,
  requested_at bigint not null,
  reviewed_at bigint,
  metadata_json text
);

create index if not exists idx_sale_cancel_requests_sale
  on public.sale_cancel_requests(sale_id);

create index if not exists idx_sale_cancel_requests_status
  on public.sale_cancel_requests(status, requested_at);

alter table public.sale_cancel_requests enable row level security;

grant select on public.sale_cancel_requests to authenticated;

drop policy if exists "staff_select_sale_cancel_requests" on public.sale_cancel_requests;
create policy "staff_select_sale_cancel_requests"
on public.sale_cancel_requests for select
to authenticated
using (true);
