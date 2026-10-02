import {
  json, readJson, badRequest, notFound, now,
  isDuplicateOp, recordOpStmt, runIdempotentBatch,
} from "../_lib.js";

// POST /api/products/rename
// Body: { oldId, newId, clientOpId? }
//
// Move a product to a new primary key while keeping every referenced row.
// Supabase checks these foreign keys immediately, so the new parent must
// exist before its children can be moved.
//
// Tables updated:
//   products            (id)
//   inventory           (product_id)
//   sale_items          (product_id)
//   stock_movements     (product_id)
//   purchase_order_items(product_id)
//   stock_issue_items   (product_id)
//
// Returns 200 with { ok:true, oldId, newId } on success.
// Returns 400 if newId already exists or oldId not found.
export const onRequestPost = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !body.oldId || !body.newId) {
    return badRequest("oldId and newId required");
  }
  const oldId = String(body.oldId).trim();
  const newId = String(body.newId).trim().toUpperCase();

  if (oldId === newId) {
    return json({ ok: true, unchanged: true, oldId, newId });
  }
  if (!/^[A-Z0-9_-]{2,40}$/i.test(newId)) {
    return badRequest("newId must be 2-40 chars of A-Z, 0-9, _, -");
  }

  // Idempotency check.
  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) return json({ ok: true, duplicate: true, newId });
  }

  // Verify old exists, new doesn't.
  const oldRow = await env.DB.prepare("SELECT id, barcode FROM products WHERE id = ?").bind(oldId).first();
  if (!oldRow) return notFound("Product " + oldId + " not found");
  const collision = await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(newId).first();
  if (collision) return badRequest("New ID already exists: " + newId, { code: "ID_COLLISION" });

  const ts = now();
  // Start the replacement without a barcode because products.barcode is unique.
  // batch() is transactional on both providers: if any child move fails, the
  // original product and its inventory remain unchanged.
  const stmts = [
    env.DB.prepare(
      `INSERT INTO products
         (id, name, category_id, price, cost_price, barcode, image, description,
          component_ids, min_stock, is_active, updated_at, unit, sku_code, inventory_mode)
       SELECT ?, name, category_id, price, cost_price, NULL, image, description,
              component_ids, min_stock, is_active, ?, unit, ?, inventory_mode
       FROM products WHERE id = ?`
    ).bind(newId, ts, newId, oldId),
    env.DB.prepare("UPDATE inventory         SET product_id = ? WHERE product_id = ?").bind(newId, oldId),
    env.DB.prepare("UPDATE sale_items        SET product_id = ? WHERE product_id = ?").bind(newId, oldId),
    env.DB.prepare("UPDATE stock_movements   SET product_id = ? WHERE product_id = ?").bind(newId, oldId),
    env.DB.prepare("UPDATE purchase_order_items SET product_id = ? WHERE product_id = ?").bind(newId, oldId),
    env.DB.prepare("UPDATE stock_issue_items SET product_id = ? WHERE product_id = ?").bind(newId, oldId),
    env.DB.prepare("DELETE FROM products WHERE id = ?").bind(oldId),
    env.DB.prepare("UPDATE products SET barcode = ? WHERE id = ?").bind(oldRow.barcode, newId),
    recordOpStmt(env.DB, body.clientOpId, "rename", newId),
  ];

  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    return json({ ok: true, duplicate: true, newId });
  }

  return json({ ok: true, oldId, newId });
};
