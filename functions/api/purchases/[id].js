import { json, readJson, notFound, badRequest, now } from "../_lib.js";
import {
  VERIFICATION_PENDING,
  VERIFICATION_VERIFIED,
  VERIFICATION_NEEDS_REVISION,
  VERIFICATION_REJECTED,
  ensurePurchaseTables,
  loadPurchaseForStock,
  purchaseStockStatements,
} from "./_shared.js";

// GET /api/purchases/:id  — header + items.
export const onRequestGet = async ({ env, params }) => {
  await ensurePurchaseTables(env.DB);
  const head = await env.DB.prepare(
    `SELECT * FROM purchase_orders WHERE id = ?`
  ).bind(params.id).first();
  if (!head) return notFound();
  const { results: productItems } = await env.DB.prepare(
    `SELECT poi.*,
            COALESCE(NULLIF(poi.product_name, ''), p.name, poi.product_id) AS item_name,
            p.barcode AS barcode,
            p.sku AS sku,
            p.unit AS stock_unit
     FROM purchase_order_items poi
     LEFT JOIN products p ON p.id = poi.product_id
     WHERE poi.purchase_id = ?
     ORDER BY poi.rowid`
  ).bind(params.id).all();
  const { results: componentItems } = await env.DB.prepare(
    `SELECT pci.*,
            COALESCE(NULLIF(pci.component_name, ''), c.label, pci.component_id) AS item_name,
            c.unit AS stock_unit,
            c.item_type AS component_type
     FROM purchase_component_items pci
     LEFT JOIN components c ON c.id = pci.component_id
     WHERE pci.purchase_id = ?
     ORDER BY pci.rowid`
  ).bind(params.id).all();
  const items = (productItems || []).map((item) => ({
    ...item,
    item_type: "product",
    display_name: item.item_name || item.product_name || item.product_id,
    stock_unit: item.stock_unit || item.unit || "",
  })).concat((componentItems || []).map((item) => ({
    ...item,
    item_type: "component",
    product_id: item.component_id,
    product_name: item.component_name,
    display_name: item.item_name || item.component_name || item.component_id,
    stock_unit: item.stock_unit || item.unit || "",
  })));
  return json({ ok: true, purchase: head, items: items || [] });
};

function requestIdsFromPurchase(head) {
  try {
    const ids = JSON.parse(head.source_request_ids || "[]");
    return Array.isArray(ids) ? ids.filter(Boolean) : [];
  } catch (_) {
    return [];
  }
}

function requestStatusStatements(db, requestIds, status, purchaseId, ts) {
  return requestIds.map((id) =>
    db.prepare(
      `UPDATE purchase_requests
       SET status = ?, purchase_id = ?, updated_at = ?
       WHERE id = ?`
    ).bind(status, purchaseId || null, ts, id)
  );
}

// POST /api/purchases/:id
// Body: { action: "verify" | "needs_revision" | "reject", verifiedBy?, note? }
export const onRequestPost = async ({ env, params, request }) => {
  await ensurePurchaseTables(env.DB);
  const body = await readJson(request) || {};
  const action = String(body.action || "verify").trim();
  const ts = now();
  const loaded = await loadPurchaseForStock(env.DB, params.id, ts);
  if (!loaded || !loaded.head) return notFound();
  const currentVerification = loaded.head.verification_status || VERIFICATION_VERIFIED;
  if (loaded.head.status === "completed" || currentVerification === VERIFICATION_VERIFIED) {
    return json({ ok: true, id: params.id, alreadyVerified: true });
  }
  if (currentVerification !== VERIFICATION_PENDING && action === "verify") {
    return badRequest("purchase is not pending verification");
  }

  const sourceRequestIds = requestIdsFromPurchase(loaded.head);
  const stmts = [];

  if (action === "verify") {
    stmts.push(...purchaseStockStatements(env.DB, loaded, body.note || loaded.head.note || null));
    stmts.push(
      env.DB.prepare(
        `UPDATE purchase_orders
         SET status = 'completed',
             verification_status = ?,
             verified_at = ?,
             verified_by = ?
         WHERE id = ?`
      ).bind(VERIFICATION_VERIFIED, ts, body.verifiedBy || body.verified_by || null, params.id)
    );
    stmts.push(...requestStatusStatements(env.DB, sourceRequestIds, "fulfilled", params.id, ts));
  } else if (action === "needs_revision") {
    stmts.push(
      env.DB.prepare(
        `UPDATE purchase_orders
         SET status = 'draft',
             verification_status = ?,
             note = COALESCE(?, note)
         WHERE id = ?`
      ).bind(VERIFICATION_NEEDS_REVISION, body.note || null, params.id)
    );
    stmts.push(...requestStatusStatements(env.DB, sourceRequestIds, "open", null, ts));
  } else if (action === "reject") {
    stmts.push(
      env.DB.prepare(
        `UPDATE purchase_orders
         SET status = 'cancelled',
             verification_status = ?,
             note = COALESCE(?, note)
         WHERE id = ?`
      ).bind(VERIFICATION_REJECTED, body.note || null, params.id)
    );
    stmts.push(...requestStatusStatements(env.DB, sourceRequestIds, "closed", params.id, ts));
  } else {
    return badRequest("unknown purchase action");
  }

  await env.DB.batch(stmts);
  return json({ ok: true, id: params.id, action });
};
