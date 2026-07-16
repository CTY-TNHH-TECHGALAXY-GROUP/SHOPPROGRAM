-- Safe admin audit log table.
-- Append-only operational events; does not touch sales/orders/products data.

create table if not exists audit_logs (
  id            text primary key,
  event_type    text not null,
  actor_email   text,
  actor_role    text,
  target        text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at    bigint not null
);

create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
create index if not exists idx_audit_logs_event_type on audit_logs(event_type);
create index if not exists idx_audit_logs_actor_email on audit_logs(actor_email);

alter table audit_logs enable row level security;

drop policy if exists "admin_select_audit_logs" on audit_logs;
create policy "admin_select_audit_logs"
on audit_logs for select
to authenticated
using (
  exists (
    select 1
    from users
    where users.id = auth.uid()::text
      and users.role = 'admin'
      and users.is_active = 1
  )
);
