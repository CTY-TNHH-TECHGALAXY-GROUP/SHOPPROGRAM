-- Normalize legacy bilingual payment labels into stable dashboard/sort codes.
-- New writes are normalized in the API; this cleans existing D1 rows.

UPDATE sales
SET payment_method = 'cash'
WHERE payment_method IS NOT NULL
  AND (
    lower(payment_method) = 'cash'
    OR lower(payment_method) LIKE '%cash%'
    OR lower(payment_method) LIKE '%tiền mặt%'
  );

UPDATE sales
SET payment_method = 'card'
WHERE payment_method IS NOT NULL
  AND (
    lower(payment_method) = 'card'
    OR lower(payment_method) LIKE '%card%'
    OR lower(payment_method) LIKE '%thẻ%'
  );

UPDATE sales
SET payment_method = 'bank_transfer'
WHERE payment_method IS NOT NULL
  AND (
    lower(payment_method) IN ('bank_transfer', 'banktransfer', 'transfer')
    OR lower(payment_method) LIKE '%bank transfer%'
    OR lower(payment_method) LIKE '%chuyển khoản%'
  );

UPDATE sales
SET payment_method = 'ewallet'
WHERE payment_method IS NOT NULL
  AND (
    lower(payment_method) IN ('ewallet', 'e_wallet', 'wallet')
    OR lower(payment_method) LIKE '%e-wallet%'
    OR lower(payment_method) LIKE '%e wallet%'
    OR lower(payment_method) LIKE '%ví điện tử%'
  );

UPDATE purchase_orders
SET payment_method = 'cash'
WHERE payment_method IS NOT NULL
  AND (
    lower(payment_method) = 'cash'
    OR lower(payment_method) LIKE '%cash%'
    OR lower(payment_method) LIKE '%tiền mặt%'
  );

UPDATE purchase_orders
SET payment_method = 'card'
WHERE payment_method IS NOT NULL
  AND (
    lower(payment_method) = 'card'
    OR lower(payment_method) LIKE '%card%'
    OR lower(payment_method) LIKE '%thẻ%'
  );

UPDATE purchase_orders
SET payment_method = 'bank_transfer'
WHERE payment_method IS NOT NULL
  AND (
    lower(payment_method) IN ('bank_transfer', 'banktransfer', 'transfer')
    OR lower(payment_method) LIKE '%bank transfer%'
    OR lower(payment_method) LIKE '%chuyển khoản%'
  );

UPDATE purchase_orders
SET payment_method = 'ewallet'
WHERE payment_method IS NOT NULL
  AND (
    lower(payment_method) IN ('ewallet', 'e_wallet', 'wallet')
    OR lower(payment_method) LIKE '%e-wallet%'
    OR lower(payment_method) LIKE '%e wallet%'
    OR lower(payment_method) LIKE '%ví điện tử%'
  );
