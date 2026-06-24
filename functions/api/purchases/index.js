import {
  json, readJson, badRequest, now,
  isDuplicateOp, recordOpStmt, runIdempotentBatch, nextDocId,
} from "../_lib.js";
import {
  ensurePurchaseTables,
  isPendingPurchaseBody,
  normalizePurchasePayload,
  purchaseInsertStatements,
  purchaseStockStatements,
} from "./_shared.js";

// GET /api/purchases?from=&to=&limit=
// List purchase orders, newest first, with item count + supplier name.
export const onRequestGet = async ({ env, request }) => {
  await ensurePurchaseTables(env.DB);
  const url = new URL(request.url);
  const from = Number(url.searchParams.get("from"));
  const to   = Number(url.searchParams.get("to"));
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
  const status = String(url.searchParams.get("status") || "").trim();
  const verificationStatus = String(url.searchParams.get("verificationStatus") || url.searchParams.get("verification_status") || "").trim();
  const where = [];
  const binds = [];
  if (from) { where.push("po.created_at >= ?"); binds.push(from); }
  if (to)   { where.push("po.created_at <= ?"); binds.push(to); }
  if (status) { where.push("po.status = ?"); binds.push(status); }
  if (verificationStatus) { where.push("COALESCE(po.verification_status, 'verified') = ?"); binds.push(verificationStatus); }
  const isSupabase = env.DB && env.DB.__provider === "supabase";
  const productNameAgg = isSupabase
    ? "STRING_AGG(product_name, ', ')"
    : "GROUP_CONCAT(product_name, ', ')";
  const componentNameAgg = isSupabase
    ? "STRING_AGG(component_name, ', ')"
    : "GROUP_CONCAT(component_name, ', ')";
  const sql = `
    SELECT po.*,
           COALESCE(product_items.item_count, 0) + COALESCE(component_items.item_count, 0) AS item_count,
           TRIM(
             COALESCE(product_items.item_names, '') ||
             CASE
               WHEN product_items.item_names IS NOT NULL AND component_items.item_names IS NOT NULL THEN ', '
               ELSE ''
             END ||
             COALESCE(component_items.item_names, '')
           ) AS item_names
    FROM purchase_orders po
    LEFT JOIN (
      SELECT purchase_id,
             COUNT(*) AS item_count,
             ${productNameAgg} AS item_names
      FROM purchase_order_items
      GROUP BY purchase_id
    ) product_items ON product_items.purchase_id = po.id
    LEFT JOIN (
      SELECT purchase_id,
             COUNT(*) AS item_count,
             ${componentNameAgg} AS item_names
      FROM purchase_component_items
      GROUP BY purchase_id
    ) component_items ON component_items.purchase_id = po.id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY po.created_at DESC
    LIMIT ?
  `;
  binds.push(limit);
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ ok: true, purchases: results || [] });
};

// POST /api/purchases
// Body:
//   {
//     clientOpId: string (required for idempotency),
//     supplierId?: string,
//     supplierName?: string,
//     paymentMethod?: string,
//     note?: string,
//     items: [{ itemType: "product", productId, qty, unitCost }
//             | { itemType: "component", componentId, qty, unitCost, unit }]
//   }
// Direct POS stock-in creates a completed purchase and applies stock immediately.
// Standalone buyer intake sends status=pending_verification; this stores the PO
// without touching inventory until the main POS verifies it.
export const onRequestPost = async ({ env, request }) => {
  await ensurePurchaseTables(env.DB);
  const body = await readJson(request);
  if (!body || !Array.isArray(body.items) || !body.items.length) {
    return badRequest("items required");
  }

  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) return json({ ok: true, duplicate: true, id: dup });
  }

  const ts = now();
  const purchaseId = body.id || await nextDocId(env.DB, "PN", ts);
  let prepared;
  try {
    prepared = await normalizePurchasePayload(env.DB, body, purchaseId, ts);
  } catch (err) {
    return badRequest((err && err.message) || "invalid purchase payload");
  }
  const stmts = [];
  stmts.push(...purchaseInsertStatements(env.DB, body, prepared));
  if (!isPendingPurchaseBody(body)) {
    stmts.push(...purchaseStockStatements(env.DB, prepared, body.note || null));
  }
  stmts.push(recordOpStmt(env.DB, body.clientOpId, "purchase", purchaseId));

  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, id: outcome.refId });
  }
  return json({
    ok: true,
    id: purchaseId,
    total: Math.round(prepared.total),
    verificationStatus: prepared.verificationStatus,
    status: prepared.orderStatus,
  });
};
