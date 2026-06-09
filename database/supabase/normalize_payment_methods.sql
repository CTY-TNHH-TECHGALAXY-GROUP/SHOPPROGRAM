-- Run this once in Supabase SQL Editor after importing legacy POS data.
-- It keeps the existing sales.payment_method text column, but standardizes
-- values so dashboards can group/sort reliably.

update sales
set payment_method = 'cash'
where payment_method is not null
  and (
    lower(payment_method) = 'cash'
    or lower(payment_method) like '%cash%'
    or lower(payment_method) like '%tiền mặt%'
  );

update sales
set payment_method = 'card'
where payment_method is not null
  and (
    lower(payment_method) = 'card'
    or lower(payment_method) like '%card%'
    or lower(payment_method) like '%thẻ%'
  );

update sales
set payment_method = 'bank_transfer'
where payment_method is not null
  and (
    lower(payment_method) in ('bank_transfer', 'banktransfer', 'transfer')
    or lower(payment_method) like '%bank transfer%'
    or lower(payment_method) like '%chuyển khoản%'
  );

update sales
set payment_method = 'ewallet'
where payment_method is not null
  and (
    lower(payment_method) in ('ewallet', 'e_wallet', 'wallet')
    or lower(payment_method) like '%e-wallet%'
    or lower(payment_method) like '%e wallet%'
    or lower(payment_method) like '%ví điện tử%'
  );

update purchase_orders
set payment_method = 'cash'
where payment_method is not null
  and (
    lower(payment_method) = 'cash'
    or lower(payment_method) like '%cash%'
    or lower(payment_method) like '%tiền mặt%'
  );

update purchase_orders
set payment_method = 'card'
where payment_method is not null
  and (
    lower(payment_method) = 'card'
    or lower(payment_method) like '%card%'
    or lower(payment_method) like '%thẻ%'
  );

update purchase_orders
set payment_method = 'bank_transfer'
where payment_method is not null
  and (
    lower(payment_method) in ('bank_transfer', 'banktransfer', 'transfer')
    or lower(payment_method) like '%bank transfer%'
    or lower(payment_method) like '%chuyển khoản%'
  );

update purchase_orders
set payment_method = 'ewallet'
where payment_method is not null
  and (
    lower(payment_method) in ('ewallet', 'e_wallet', 'wallet')
    or lower(payment_method) like '%e-wallet%'
    or lower(payment_method) like '%e wallet%'
    or lower(payment_method) like '%ví điện tử%'
  );
