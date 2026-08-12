import { json } from "../_lib.js";

const SHOP_TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
const PAID_REVENUE_FILTER = `
  AND (payment_status IS NULL OR payment_status = '' OR payment_status = 'paid')
  AND order_status IN ('completed', 'preparing', 'ready')
`;

function shopDateKey(timestamp) {
  const date = new Date((Number(timestamp) || 0) + SHOP_TZ_OFFSET_MS);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

// GET /api/reports/summary?from=&to=
// Returns revenue, gross profit, order count, top products,
// and a per-day revenue breakdown for charting.
export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const from = Number(url.searchParams.get("from")) || 0;
  const to = Number(url.searchParams.get("to")) || Date.now();

  const totals = await env.DB.prepare(
    `SELECT COUNT(*) AS order_count,
            COALESCE(SUM(total), 0) AS revenue,
            COALESCE(SUM(vat_amount), 0) AS vat,
            COALESCE(SUM(discount), 0) AS discount
     FROM sales
     WHERE created_at BETWEEN ? AND ?
       ${PAID_REVENUE_FILTER}`
  ).bind(from, to).first();

  const profit = await env.DB.prepare(
    `SELECT COALESCE(SUM(si.line_total - (si.qty * COALESCE(si.unit_cost, 0))), 0) AS gross_profit,
            COALESCE(SUM(si.qty * COALESCE(si.unit_cost, 0)), 0) AS cogs
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     WHERE s.created_at BETWEEN ? AND ?
       AND (s.payment_status IS NULL OR s.payment_status = '' OR s.payment_status = 'paid')
       AND s.order_status IN ('completed', 'preparing', 'ready')`
  ).bind(from, to).first();

  const { results: topProducts } = await env.DB.prepare(
    `SELECT COALESCE(NULLIF(si.product_id, ''), p.id, si.product_name) AS product_key,
            COALESCE(NULLIF(si.product_id, ''), p.id) AS product_id,
            COALESCE(p.name, si.product_name) AS product_name,
            p.category_id AS product_category,
            p.image AS product_image,
            p.barcode AS product_barcode,
            p.sku_code AS product_sku_code,
            SUM(si.qty) AS qty,
            SUM(si.line_total) AS revenue
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     LEFT JOIN products p ON p.id = si.product_id
     WHERE s.created_at BETWEEN ? AND ?
       AND (s.payment_status IS NULL OR s.payment_status = '' OR s.payment_status = 'paid')
       AND s.order_status IN ('completed', 'preparing', 'ready')
     GROUP BY si.product_id, p.id, si.product_name, p.name, p.category_id, p.image, p.barcode, p.sku_code
     ORDER BY qty DESC`
  ).bind(from, to).all();

  const { results: dayRows } = await env.DB.prepare(
    `SELECT created_at, total
     FROM sales
     WHERE created_at BETWEEN ? AND ?
       ${PAID_REVENUE_FILTER}
     ORDER BY created_at`
  ).bind(from, to).all();
  const byDayMap = new Map();
  for (const row of dayRows || []) {
    const day = shopDateKey(row.created_at);
    if (!day) continue;
    const current = byDayMap.get(day) || { day, orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += Number(row.total) || 0;
    byDayMap.set(day, current);
  }
  const byDay = Array.from(byDayMap.values()).sort((a, b) => a.day.localeCompare(b.day));

  const { results: byPaymentMethod } = await env.DB.prepare(
    `SELECT payment_method,
            COUNT(*) AS orders,
            COALESCE(SUM(total), 0) AS revenue
     FROM (
       SELECT total,
              CASE
                WHEN payment_method IS NULL OR trim(payment_method) = '' THEN 'unknown'
                WHEN lower(payment_method) = 'cash' OR lower(payment_method) LIKE '%cash%' OR lower(payment_method) LIKE '%tiền mặt%' THEN 'cash'
                WHEN lower(payment_method) = 'card' OR lower(payment_method) LIKE '%card%' OR lower(payment_method) LIKE '%thẻ%' THEN 'card'
                WHEN lower(payment_method) IN ('bank_transfer', 'banktransfer', 'transfer')
                  OR lower(payment_method) LIKE '%bank transfer%'
                  OR lower(payment_method) LIKE '%chuyển khoản%' THEN 'bank_transfer'
                WHEN lower(payment_method) IN ('ewallet', 'e_wallet', 'wallet')
                  OR lower(payment_method) LIKE '%e-wallet%'
                  OR lower(payment_method) LIKE '%e wallet%'
                  OR lower(payment_method) LIKE '%ví điện tử%' THEN 'ewallet'
                ELSE 'other'
              END AS payment_method
       FROM sales
       WHERE created_at BETWEEN ? AND ?
         ${PAID_REVENUE_FILTER}
     )
     GROUP BY payment_method
     ORDER BY revenue DESC`
  ).bind(from, to).all();

  return json({
    ok: true,
    range: { from, to },
    totals: {
      orderCount: Number(totals.order_count) || 0,
      revenue:    Number(totals.revenue)     || 0,
      vat:        Number(totals.vat)         || 0,
      discount:   Number(totals.discount)    || 0,
      grossProfit: Number(profit.gross_profit) || 0,
      cogs:        Number(profit.cogs)         || 0,
    },
    topProducts: topProducts || [],
    byDay,
    byPaymentMethod: byPaymentMethod || [],
  });
};
