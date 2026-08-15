import {
  json, readJson, badRequest, now, uid, runIdempotentBatch, recordOpStmt,
  inventoryDeltaStmt, movementStmt, componentMovementStmt,
  ensureSaleCancellationStorageCompatibility,
} from "../../_lib.js";

function normalizeStatus(value) {
  const status = String(value || "pending").toLowerCase();
  return ["pending", "approved", "rejected"].includes(status) ? status : "pending";
}

async function loadSaleItems(db, saleId) {
  const { results } = await db.prepare(
    `SELECT si.*, p.inventory_mode, p.component_ids, p.cost_price
     FROM sale_items si
     LEFT JOIN products p ON p.id = si.product_id
     WHERE si.sale_id = ?`
  ).bind(saleId).all();
  return results || [];
}

function getRecipeComponentStockQty(entry) {
  if (typeof entry === "string") return 1;
  const netQty = entry && entry.qty !== undefined && entry.qty !== null
    ? Math.max(0, Number(entry.qty) || 0)
    : 1;
  const waste = Math.min(99, Math.max(0, Number(entry && (entry.wastePercent ?? entry.waste_percent)) || 0));
  let usableRate = 1 - (waste / 100);
  if (usableRate <= 0) usableRate = 0.01;
  return netQty / usableRate;
}

function expandStockReturns(items) {
  const products = new Map();
  const components = new Map();
  items.forEach((item) => {
    const qty = Number(item.qty) || 0;
    if (!item.product_id || qty <= 0) return;
    if (item.inventory_mode === "recipe") {
      let componentIds = [];
      try {
        componentIds = JSON.parse(item.component_ids || "[]");
      } catch (_) {}
      if (Array.isArray(componentIds)) {
        componentIds.forEach((component) => {
          const componentId = typeof component === "string" ? component : component.id;
          if (!componentId) return;
          components.set(componentId, (components.get(componentId) || 0) + (getRecipeComponentStockQty(component) * qty));
        });
      }
      return;
    }
    products.set(item.product_id, (products.get(item.product_id) || 0) + qty);
  });
  return { products, components };
}

export const onRequestGet = async ({ env, request, data }) => {
  await ensureSaleCancellationStorageCompatibility(env.DB);
  if (!data || !data.user || data.user.role !== "admin") {
    return json({ ok: false, error: "admin required" }, { status: 403 });
  }
  const url = new URL(request.url);
  const status = normalizeStatus(url.searchParams.get("status") || "pending");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 300);
  const { results } = await env.DB.prepare(
    `SELECT cr.*, s.total, s.paid, s.payment_status, s.order_status, s.stock_status, s.customer_name, s.created_at
     FROM sale_cancel_requests cr
     JOIN sales s ON s.id = cr.sale_id
     WHERE cr.status = ?
     ORDER BY cr.requested_at DESC
     LIMIT ?`
  ).bind(status, limit).all();
  return json({ ok: true, requests: results || [] });
};

export const onRequestPost = async ({ env, request, data }) => {
  await ensureSaleCancellationStorageCompatibility(env.DB);
  const user = data && data.user;
  if (!user || !["admin", "cashier"].includes(user.role)) {
    return json({ ok: false, error: "not allowed" }, { status: 403 });
  }
  const body = await readJson(request);
  const saleId = String(body && (body.saleId || body.sale_id || body.id) || "").trim();
  const reason = String(body && body.reason || "").trim();
  if (!/^HD-\d{8}-\d{3,}$/i.test(saleId)) return badRequest("valid sale id required");
  if (!reason) return badRequest("reason required");

  const sale = await env.DB.prepare(
    `SELECT id, order_id, order_status, payment_status, stock_status
     FROM sales
     WHERE id = ?`
  ).bind(saleId).first();
  if (!sale) return badRequest("sale not found");
  const orderStatus = String(sale.order_status || "").toLowerCase();
  if (["cancelled", "cancel_requested"].includes(orderStatus)) {
    return json({ ok: true, id: saleId, orderStatus: orderStatus, duplicate: true });
  }
  if (String(sale.payment_status || "").toLowerCase() !== "paid") {
    return badRequest("only paid sales can request cancellation");
  }

  const existing = await env.DB.prepare(
    `SELECT id FROM sale_cancel_requests
     WHERE sale_id = ? AND status = 'pending'
     ORDER BY requested_at DESC
     LIMIT 1`
  ).bind(saleId).first();
  if (existing) {
    return json({ ok: true, requestId: existing.id, duplicate: true });
  }

  const ts = now();
  const requestId = uid("scr");
  const clientOpId = body.clientOpId || uid("cancel-op");
  const metadata = {
    previousOrderStatus: orderStatus,
    previousStockStatus: sale.stock_status || "pending",
  };
  const outcome = await runIdempotentBatch(env.DB, [
    env.DB.prepare(
      `INSERT INTO sale_cancel_requests
         (id, sale_id, order_id, reason, status, requested_by, requested_at, metadata_json)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`
    ).bind(requestId, saleId, sale.order_id || null, reason, user.email || user.id || null, ts, JSON.stringify(metadata)),
    env.DB.prepare(
      `UPDATE sales
       SET order_status = 'cancel_requested',
           note = COALESCE(note, '') || ?,
           updated_at = ?
       WHERE id = ? AND order_status NOT IN ('cancelled', 'cancel_requested')`
    ).bind("\n[cancel_request:" + requestId + "] " + reason, ts, saleId),
    recordOpStmt(env.DB, clientOpId, "sale_cancel_request", requestId),
  ], clientOpId);

  if (outcome.duplicate) return json({ ok: true, duplicate: true, requestId: outcome.refId });
  return json({ ok: true, requestId, saleId, orderStatus: "cancel_requested" });
};

export const onRequestPatch = async ({ env, request, data }) => {
  await ensureSaleCancellationStorageCompatibility(env.DB);
  const user = data && data.user;
  if (!user || user.role !== "admin") {
    return json({ ok: false, error: "admin required" }, { status: 403 });
  }
  const body = await readJson(request);
  const requestId = String(body && (body.requestId || body.id) || "").trim();
  const decision = String(body && body.decision || "").toLowerCase();
  if (!requestId) return badRequest("requestId required");
  if (!["approved", "rejected"].includes(decision)) return badRequest("decision must be approved or rejected");

  const requestRow = await env.DB.prepare(
    `SELECT cr.*, s.order_status, s.payment_status, s.stock_status
     FROM sale_cancel_requests cr
     JOIN sales s ON s.id = cr.sale_id
     WHERE cr.id = ?`
  ).bind(requestId).first();
  if (!requestRow) return badRequest("request not found");
  if (String(requestRow.status || "").toLowerCase() !== "pending") {
    return json({ ok: true, requestId, status: requestRow.status, duplicate: true });
  }

  let metadata = {};
  try {
    metadata = requestRow.metadata_json ? JSON.parse(requestRow.metadata_json) : {};
  } catch (_) {}
  const ts = now();
  const stmts = [
    env.DB.prepare(
      `UPDATE sale_cancel_requests
       SET status = ?, reviewed_by = ?, reviewed_at = ?
       WHERE id = ? AND status = 'pending'`
    ).bind(decision, user.email || user.id || null, ts, requestId),
  ];

  if (decision === "rejected") {
    const previousStatus = ["preparing", "ready", "completed"].includes(metadata.previousOrderStatus)
      ? metadata.previousOrderStatus
      : "ready";
    stmts.push(
      env.DB.prepare(
        `UPDATE sales
         SET order_status = ?, updated_at = ?
         WHERE id = ? AND order_status = 'cancel_requested'`
      ).bind(previousStatus, ts, requestRow.sale_id)
    );
  } else {
    if (String(requestRow.stock_status || "").toLowerCase() === "applied") {
      const items = await loadSaleItems(env.DB, requestRow.sale_id);
      const returns = expandStockReturns(items);
      for (const [productId, qty] of returns.products.entries()) {
        const item = items.find((row) => row.product_id === productId);
        stmts.push(inventoryDeltaStmt(env.DB, productId, qty, ts));
        stmts.push(
          movementStmt(env.DB, {
            productId,
            movementType: "RETURN",
            qtyChange: qty,
            unitCost: item ? Number(item.cost_price) || Number(item.unit_cost) || 0 : 0,
            refType: "sale_cancel",
            refId: requestRow.sale_id,
            note: requestRow.reason,
            createdAt: ts,
          })
        );
      }
      for (const [componentId, qty] of returns.components.entries()) {
        stmts.push(
          env.DB.prepare(
            `UPDATE components
             SET stock_qty = COALESCE(stock_qty, 0) + ?,
                 updated_at = ?
             WHERE id = ? AND COALESCE(is_unlimited_stock, 0) = 0`
          ).bind(qty, ts, componentId)
        );
        stmts.push(
          componentMovementStmt(env.DB, {
            componentId,
            movementType: "RETURN",
            qtyChange: qty,
            unitCost: null,
            refType: "sale_cancel",
            refId: requestRow.sale_id,
            note: requestRow.reason,
            createdAt: ts,
          })
        );
      }
    }
    stmts.push(
      env.DB.prepare(
        `UPDATE sales
         SET order_status = 'cancelled',
             payment_status = 'refunded',
             stock_status = 'restored',
             updated_at = ?
         WHERE id = ? AND order_status = 'cancel_requested'`
      ).bind(ts, requestRow.sale_id)
    );
  }

  await env.DB.batch(stmts);
  return json({ ok: true, requestId, saleId: requestRow.sale_id, status: decision });
};
