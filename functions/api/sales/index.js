import {
  json, readJson, badRequest, now, uid, dateKey,
  isDuplicateOp, recordOpStmt, runIdempotentBatch, nextDocId,
  inventoryDeltaStmt, movementStmt, getProductCost,
  ensureProductsInventoryModeColumn, ensureComponentsInventoryColumns,
  ensureSalesStorageCompatibility,
  normalizePaymentMethod, normalizeStockQty,
} from "../_lib.js";

function normalizeWastePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(99, Math.max(0, n));
}

function getRecipeWastePercent(entry) {
  if (!entry || typeof entry !== "object") return 0;
  if (entry.wastePercent !== undefined) return normalizeWastePercent(entry.wastePercent);
  if (entry.waste_percent !== undefined) return normalizeWastePercent(entry.waste_percent);
  if (entry.wasteRate !== undefined) {
    const rate = Number(entry.wasteRate);
    return normalizeWastePercent(rate > 0 && rate <= 1 ? rate * 100 : rate);
  }
  if (entry.waste_rate !== undefined) {
    const snakeRate = Number(entry.waste_rate);
    return normalizeWastePercent(snakeRate > 0 && snakeRate <= 1 ? snakeRate * 100 : snakeRate);
  }
  return 0;
}

function getRecipeComponentStockQty(entry) {
  if (typeof entry === "string") return 1;
  const netQty = entry && entry.qty !== undefined && entry.qty !== null
    ? Math.max(0, Number(entry.qty) || 0)
    : 1;
  let usableRate = 1 - (getRecipeWastePercent(entry) / 100);
  if (usableRate <= 0) usableRate = 0.01;
  return netQty / usableRate;
}

function orderIdFromSaleId(saleId) {
  const match = String(saleId || "").match(/^HD-(\d{4})(\d{2})(\d{2})-(\d+)$/i);
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}-${String(Number(match[4]) || 0).padStart(3, "0")}`;
}

function parseItemAddOns(item) {
  if (!item || typeof item !== "object") return [];
  const candidates = [
    item.addons,
    item.addOns,
    item.addonsJson,
    item.addons_json,
    item.addOnIds,
    item.add_on_ids,
  ];

  for (const candidate of candidates) {
    if (candidate == null || candidate === "") continue;
    if (Array.isArray(candidate)) return candidate;
    if (typeof candidate === "string") {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {
        return candidate.split(",").map((id) => id.trim()).filter(Boolean);
      }
    }
  }
  return [];
}

function getItemAddOnIds(item) {
  return parseItemAddOns(item)
    .map((addon) => {
      if (typeof addon === "string") return addon;
      if (!addon || typeof addon !== "object") return "";
      return addon.id || addon.addOnId || addon.addon_id || "";
    })
    .map((id) => String(id || "").trim())
    .filter(Boolean);
}

// GET /api/sales?from=&to=&limit=
export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const from = Number(url.searchParams.get("from"));
  const to = Number(url.searchParams.get("to"));
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 1000);
  const where = [];
  const binds = [];
  if (from) { where.push("created_at >= ?"); binds.push(from); }
  if (to)   { where.push("created_at <= ?"); binds.push(to); }
  const sql = `
    SELECT s.*,
           COALESCE((
             SELECT SUM(
               CASE
                 WHEN LOWER(COALESCE(p.unit, '')) IN ('g', 'gr', 'gram', 'kg', 'ml', 'l', 'lit', 'liter') THEN 1
                 ELSE si.qty
               END
             )
             FROM sale_items si
             LEFT JOIN products p ON p.id = si.product_id
             WHERE si.sale_id = s.id
           ), 0) AS item_count
    FROM sales s
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY created_at DESC
    LIMIT ?
  `;
  binds.push(limit);
  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ ok: true, sales: results || [] });
};

// POST /api/sales — Chốt hóa đơn
// Body:
//   {
//     clientOpId, orderId?, customerName?, paymentMethod?, cashierName?,
//     subtotal, vatAmount, discount?, total, paid, changeAmount,
//     note?,
//     items: [{ productId, productName, qty, unitPrice,
//               addons: [...] | addonsJson, addonsTotal, lineTotal }]
//   }
// Atomic: sales + sale_items + stock_movements (SALE) + inventory delta.
export const onRequestPost = async ({ env, request, data }) => {
  await ensureProductsInventoryModeColumn(env.DB);
  await ensureComponentsInventoryColumns(env.DB);
  await ensureSalesStorageCompatibility(env.DB);
  const body = await readJson(request);

  if (body && body.repairStatusOnly) {
    if (!data || !data.user || data.user.role !== "admin") {
      return json({ ok: false, error: "admin required" }, { status: 403 });
    }
    const saleId = String(body.id || "");
    if (!/^HD-\d{8}-\d{3,}$/i.test(saleId)) {
      return badRequest("valid sale id required");
    }
    const existing = await env.DB.prepare(
      `SELECT id, order_id, total, paid, payment_method, note
       FROM sales
       WHERE id = ?`
    ).bind(saleId).first();
    if (!existing) {
      return badRequest("sale not found");
    }
    const ts = now();
    const total = Math.max(0, Math.round(Number(existing.total) || 0));
    const paidAmount = Number.isFinite(Number(body.paid))
      ? Math.max(0, Math.round(Number(body.paid)))
      : total;
    const paymentMethod = normalizePaymentMethod(body.paymentMethod || existing.payment_method || "other") || "other";
    await env.DB.prepare(
      `UPDATE sales
       SET paid = ?,
           change_amount = ?,
           payment_method = ?,
           payment_status = 'paid',
           order_status = 'completed',
           note = COALESCE(?, note),
           updated_at = ?
       WHERE id = ?`
    ).bind(
      paidAmount,
      Math.max(0, paidAmount - total),
      paymentMethod,
      body.note === undefined ? null : body.note,
      ts,
      saleId
    ).run();
    return json({
      ok: true,
      id: saleId,
      orderId: existing.order_id || orderIdFromSaleId(saleId),
      repaired: true,
      orderStatus: "completed",
      paymentStatus: "paid",
      paid: paidAmount,
    });
  }

  const requestedOrderStatus = String(body && (body.orderStatus || body.order_status) || "completed").toLowerCase();
  const allowedOrderStatuses = new Set(["completed", "cancelled", "held", "new", "preparing", "needs_action"]);
  const orderStatus = allowedOrderStatuses.has(requestedOrderStatus) ? requestedOrderStatus : "completed";
  const isCompleted = orderStatus === "completed";
  const isCancelled = orderStatus === "cancelled";

  if (!body || !Array.isArray(body.items) || (!body.items.length && !isCancelled)) {
    return badRequest("items required");
  }

  if (isCancelled && (!body.items || !body.items.length)) {
    const ts = now();
    const requestedSaleId = String(body.id || "");
    const requestedIdMatch = requestedSaleId.match(/^HD-(\d{8})-\d{3,}$/i);
    const saleId = requestedIdMatch
      ? requestedSaleId
      : await nextDocId(env.DB, "HD", ts);
    const canonicalOrderId = orderIdFromSaleId(saleId);
    await env.DB.prepare(
      `INSERT INTO sales
         (id, order_id, customer_name, subtotal, vat_amount, discount, total,
          paid, change_amount, payment_method, cashier_name,
          payment_status, order_status, note, created_at, updated_at)
       VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, NULL, ?, 'pending', 'cancelled', ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         order_id = excluded.order_id,
         customer_name = excluded.customer_name,
         payment_status = excluded.payment_status,
         order_status = excluded.order_status,
         note = excluded.note,
         updated_at = excluded.updated_at`
    ).bind(
      saleId,
      canonicalOrderId || body.orderId || null,
      body.customerName || null,
      body.cashierName || null,
      body.note || null,
      ts,
      ts
    ).run();
    await env.DB.prepare("DELETE FROM sale_items WHERE sale_id = ?").bind(saleId).run();
    return json({ ok: true, id: saleId, orderId: canonicalOrderId || body.orderId || null, orderStatus: "cancelled" });
  }

  // -------- Item-level validation (E3, E6, E8) --------
  // Normalize qty, reject lines that are unsalvageable. Products sold by
  // measured units (kg/gram/l/ml) are normalized after product metadata loads.
  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i];
    if (!it || typeof it !== "object") {
      return badRequest(`items[${i}] must be an object`);
    }
    if (!it.productId || typeof it.productId !== "string") {
      return badRequest(`items[${i}].productId required`);
    }
    // Coerce qty: must be positive.
    const q = Number(it.qty);
    if (!Number.isFinite(q) || q <= 0) {
      return badRequest(`items[${i}].qty must be > 0 (got ${it.qty})`);
    }
    it.qty = q;
    // Clamp unitPrice / addonsTotal so a tampered negative can't be billed.
    if (it.unitPrice != null) {
      const up = Number(it.unitPrice);
      it.unitPrice = Number.isFinite(up) ? Math.max(0, up) : 0;
    }
    if (it.addonsTotal != null) {
      const at = Number(it.addonsTotal);
      it.addonsTotal = Number.isFinite(at) ? Math.max(0, at) : 0;
    }
  }

  if (body.clientOpId) {
    const dup = await isDuplicateOp(env.DB, body.clientOpId);
    if (dup) {
      const existing = await env.DB.prepare("SELECT order_id FROM sales WHERE id = ?").bind(dup).first();
      return json({ ok: true, duplicate: true, id: dup, orderId: existing ? existing.order_id : orderIdFromSaleId(dup) });
    }
  }

  // -------- B1: Server-side stock guard & BOM Expansion --------
  // Expand explicitly-marked recipe products into their components.
  const productIds = [...new Set(body.items.map((it) => it.productId).filter(Boolean))];
  let productInfoMap = new Map();
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => "?").join(",");
    const sql = `
      SELECT p.id, p.price, p.component_ids, p.inventory_mode, p.unit
      FROM products p
      WHERE p.id IN (${placeholders})
    `;
    const { results } = await env.DB.prepare(sql).bind(...productIds).all();
    if (results) {
      results.forEach((r) => productInfoMap.set(r.id, r));
    }
  }

  const addOnIds = [...new Set(body.items.flatMap((it) => getItemAddOnIds(it)))];
  const addOnInfoMap = new Map();
  if (addOnIds.length > 0) {
    const placeholders = addOnIds.map(() => "?").join(",");
    const { results } = await env.DB.prepare(
      `SELECT id, label, price, group_key
       FROM add_ons
       WHERE is_active = 1 AND id IN (${placeholders})`
    ).bind(...addOnIds).all();
    if (results) {
      results.forEach((row) => addOnInfoMap.set(row.id, row));
    }
  }

  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i];
    const info = productInfoMap.get(it.productId);
    it.qty = normalizeStockQty(it.qty, info ? info.unit : undefined);
    if (!Number.isFinite(it.qty) || it.qty <= 0) {
      return badRequest(`items[${i}].qty must be >= 1 unless unit supports decimals`);
    }
  }

  const requiredByProduct = new Map();
  const requiredByComponent = new Map();
  const qtyByProduct = new Map();
  const qtyByComponent = new Map();

  for (const it of body.items) {
    if (!it.productId) continue;
    const qty = Number(it.qty) || 0;
    if (qty <= 0) continue;

    const info = productInfoMap.get(it.productId);
    let isMixedDrink = false;
    if (info && info.inventory_mode === "recipe") {
      isMixedDrink = true;
    } else if (info && info.inventory_mode === "stock") {
      isMixedDrink = false;
    } else if (info) {
      return badRequest(`inventory mode required for product: ${it.productId}`);
    }

    if (isMixedDrink) {
      let components = [];
      try {
        components = JSON.parse(info.component_ids || "[]");
      } catch (e) {}
      if (Array.isArray(components) && components.length > 0) {
        for (const comp of components) {
          const compId = typeof comp === "string" ? comp : comp.id;
          const compQty = getRecipeComponentStockQty(comp) || 1;
          const totalCompQty = compQty * qty;
          requiredByComponent.set(compId, (requiredByComponent.get(compId) || 0) + totalCompQty);
          qtyByComponent.set(compId, (qtyByComponent.get(compId) || 0) + totalCompQty);
        }
      }
    } else {
      requiredByProduct.set(it.productId, (requiredByProduct.get(it.productId) || 0) + qty);
      qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + qty);
    }
  }

  if (isCompleted && !body.allowNegativeStock) {
    const productChecks = await Promise.all(
      [...requiredByProduct.keys()].map((pid) =>
        env.DB.prepare(
          `SELECT p.name, COALESCE(i.qty_on_hand, 0) AS stock
           FROM products p LEFT JOIN inventory i ON i.product_id = p.id
           WHERE p.id = ?`
        ).bind(pid).first()
      )
    );
    const componentChecks = await Promise.all(
      [...requiredByComponent.keys()].map((componentId) =>
        env.DB.prepare(
          `SELECT label AS name, COALESCE(stock_qty, 0) AS stock,
                  COALESCE(is_unlimited_stock, 0) AS is_unlimited_stock
           FROM components WHERE id = ?`
        ).bind(componentId).first()
      )
    );
    const insufficient = [];
    [...requiredByProduct.entries()].forEach(([pid, need], idx) => {
      const row = productChecks[idx];
      const have = row ? Number(row.stock) || 0 : 0;
      if (have < need) {
        insufficient.push({
          productId: pid,
          name: row ? row.name : pid,
          available: have,
          required: need,
        });
      }
    });
    [...requiredByComponent.entries()].forEach(([componentId, need], idx) => {
      const row = componentChecks[idx];
      if (row && Number(row.is_unlimited_stock) === 1) return;
      const have = row ? Number(row.stock) || 0 : 0;
      if (have < need) {
        insufficient.push({
          productId: componentId,
          name: row ? row.name : componentId,
          available: have,
          required: need,
        });
      }
    });
    if (insufficient.length) {
      return badRequest("Insufficient stock", {
        code: "INSUFFICIENT_STOCK",
        insufficient,
      });
    }
  }

  // -------- B2: Server-side recompute totals from items --------
  // We do NOT trust client-supplied prices. Product prices and add-on prices
  // are read from the database, then recomputed server-side so the checkout
  // total matches the POS UI without allowing tampered prices.
  let serverSubtotal = 0;
  for (const it of body.items) {
    const qty = Number(it.qty) || 0;
    const info = productInfoMap.get(it.productId);
    if (!info) {
      return badRequest(`Unknown product: ${it.productId}`);
    }
    const requestedAddOnIds = getItemAddOnIds(it);
    const addOns = [];
    for (const addOnId of requestedAddOnIds) {
      const addOn = addOnInfoMap.get(addOnId);
      if (!addOn) {
        return badRequest(`Unknown add-on: ${addOnId}`);
      }
      addOns.push({
        id: addOn.id,
        label: addOn.label || addOn.id,
        price: Math.max(0, Math.round(Number(addOn.price) || 0)),
        group: addOn.group_key || "extras",
      });
    }
    const baseUnitPrice = Math.max(0, Math.round(Number(info.price) || 0));
    const addonsTotal = addOns.reduce((sum, addOn) => sum + (Number(addOn.price) || 0), 0);
    const lineTotal = Math.round((baseUnitPrice + addonsTotal) * qty);
    serverSubtotal += lineTotal;
    // Store base price separately from add-ons. Held orders are hydrated with
    // addOnIds, so unit_price must remain the product base price to avoid
    // double-counting add-ons after sync.
    it.unitPrice = baseUnitPrice;
    it.addonsTotal = addonsTotal;
    it.addons = addOns;
    it.addonsJson = addOns.length ? JSON.stringify(addOns) : null;
    it.__lineTotal = lineTotal;
    it.__discountAmount = Math.min(
      lineTotal,
      Math.max(0, Math.round(Number(it.discountAmount || it.discount_amount) || 0))
    );
  }
  const discount = Math.max(0, Math.round(Number(body.discount) || 0));
  const VAT_RATE = Number.isFinite(Number(body.vatRate)) ? Number(body.vatRate) : 0.08;
  const serverTotal = Math.max(0, serverSubtotal - discount);
  const serverVat = VAT_RATE > 0
    ? Math.round(serverTotal - (serverTotal / (1 + VAT_RATE)))
    : 0;
  // Server-side totals always override client-supplied values.
  // Price discrepancies are silently overridden — no logging to prevent information leakage.

  let paymentMethod = null;
  let paidAmount = 0;
  let paymentStatus = 'pending';
  let orderStatusDb = 'held';

  if (isCompleted) {
    paymentMethod = normalizePaymentMethod(body.paymentMethod);
    if (!paymentMethod) {
      return badRequest("payment method required", {
        code: "PAYMENT_METHOD_REQUIRED",
        total: serverTotal,
      });
    }
    const hasPaidAmount =
      body.paid !== undefined &&
      body.paid !== null &&
      String(body.paid).trim() !== "";
    const rawPaidAmount = Number(body.paid);
    if (serverTotal > 0 && (!hasPaidAmount || !Number.isFinite(rawPaidAmount) || rawPaidAmount <= 0)) {
      return badRequest("paid amount required", {
        code: "PAYMENT_REQUIRED",
        total: serverTotal,
        paymentMethod,
      });
    }

    // A completed checkout must be fully paid. This keeps sales reports,
    // payment-method dashboards, and later DB imports consistent.
    paidAmount = Math.max(0, Math.round(rawPaidAmount || 0));
    if (serverTotal > 0 && paidAmount < serverTotal) {
      return badRequest("paid amount is less than total", {
        code: "PAYMENT_INSUFFICIENT",
        total: serverTotal,
        paid: paidAmount,
        shortBy: serverTotal - paidAmount,
        paymentMethod,
      });
    }
    paymentStatus = 'paid';
    orderStatusDb = 'completed';
  } else {
    paymentMethod = body.paymentMethod ? normalizePaymentMethod(body.paymentMethod) : null;
    paidAmount = Number.isFinite(Number(body.paid)) ? Math.max(0, Math.round(Number(body.paid))) : 0;
    paymentStatus = 'pending';
    orderStatusDb = isCancelled ? 'cancelled' : orderStatus;
  }

  const ts = now();
  const requestedSaleId = String(body.id || "");
  const requestedIdMatch = requestedSaleId.match(/^HD-(\d{8})-\d{3,}$/i);
  const saleId = requestedIdMatch
    ? requestedSaleId
    : await nextDocId(env.DB, "HD", ts);
  const canonicalOrderId = orderIdFromSaleId(saleId);

  if (!isCompleted) {
    const existingTerminal = await env.DB.prepare(
      `SELECT id, order_id, order_status, payment_status, total, paid
       FROM sales
       WHERE id = ? OR order_id = ?
       ORDER BY
         CASE WHEN id = ? THEN 0 ELSE 1 END,
         updated_at DESC,
         created_at DESC
       LIMIT 1`
    ).bind(
      saleId,
      canonicalOrderId || body.orderId || "",
      saleId
    ).first();
    const existingStatus = String(existingTerminal && existingTerminal.order_status || "").toLowerCase();
    if (existingStatus === "completed" || existingStatus === "cancelled") {
      return json({
        ok: true,
        id: existingTerminal.id,
        orderId: existingTerminal.order_id || canonicalOrderId || body.orderId || null,
        ignored: true,
        orderStatus: existingTerminal.order_status,
        paymentStatus: existingTerminal.payment_status,
      });
    }
  }

  // Snapshot costs for gross-profit reporting.
  const enriched = await Promise.all(body.items.map(async (it) => ({
    ...it,
    unitCost: it.unitCost != null
      ? Number(it.unitCost)
      : await getProductCost(env.DB, it.productId),
  })));

  const stmts = [];
  // Use SERVER-computed amounts so a tampered client can't change billing.
  const changeAmount = isCompleted ? Math.max(0, paidAmount - serverTotal) : 0;
  stmts.push(
    env.DB.prepare(
      `INSERT INTO sales
         (id, order_id, customer_name, subtotal, vat_amount, discount, total,
          paid, change_amount, payment_method, cashier_name,
          payment_status, order_status, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         order_id = excluded.order_id,
         customer_name = excluded.customer_name,
         subtotal = excluded.subtotal,
         vat_amount = excluded.vat_amount,
         discount = excluded.discount,
         total = excluded.total,
         paid = excluded.paid,
         change_amount = excluded.change_amount,
         payment_method = excluded.payment_method,
         cashier_name = excluded.cashier_name,
         payment_status = excluded.payment_status,
         order_status = excluded.order_status,
         note = excluded.note,
         updated_at = excluded.updated_at`
    ).bind(
      saleId,
      canonicalOrderId || body.orderId || null,
      body.customerName || null,
      serverSubtotal,
      serverVat,
      discount,
      serverTotal,
      paidAmount,
      changeAmount,
      paymentMethod,
      body.cashierName || null,
      paymentStatus,
      orderStatusDb,
      body.note || null,
      ts,
      ts
    )
  );

  // Clear previous sale items if updating an existing sale
  stmts.push(
    env.DB.prepare("DELETE FROM sale_items WHERE sale_id = ?").bind(saleId)
  );

  enriched.forEach((it) => {
    const qty = Number(it.qty) || 0;

    stmts.push(
      env.DB.prepare(
        `INSERT INTO sale_items
           (id, sale_id, product_id, product_name, qty, unit_price,
            addons_json, addons_total, line_total, discount_amount, unit_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        uid("si"),
        saleId,
        it.productId || null,
        it.productName || it.name || "",
        qty,
        Number(it.unitPrice) || Number(it.price) || 0,
        it.addonsJson || (it.addons ? JSON.stringify(it.addons) : null),
        Number(it.addonsTotal) || 0,
        // B2: server-recomputed line total
        Number(it.__lineTotal) || (Number(it.unitPrice) || 0) * qty,
        Number(it.__discountAmount) || 0,
        it.unitCost || 0
      )
    );
  });

  // One stock movement + one inventory delta per distinct product.
  if (isCompleted) {
    for (const [productId, qty] of qtyByProduct.entries()) {
      if (!productId || !qty) continue;
      const cost = await getProductCost(env.DB, productId);
      stmts.push(
        movementStmt(env.DB, {
          productId,
          movementType: "SALE",
          qtyChange: -qty,
          unitCost: cost,
          refType: "sale",
          refId: saleId,
          note: null,
          createdAt: ts,
        })
      );
      stmts.push(inventoryDeltaStmt(env.DB, productId, -qty, ts));
    }
    for (const [componentId, qty] of qtyByComponent.entries()) {
      if (!componentId || !qty) continue;
      stmts.push(
        env.DB.prepare(
          `UPDATE components
           SET stock_qty = MAX(0, COALESCE(stock_qty, 0) - ?),
               updated_at = ?
           WHERE id = ? AND COALESCE(is_unlimited_stock, 0) = 0`
        ).bind(qty, ts, componentId)
      );
    }
  }

  stmts.push(recordOpStmt(env.DB, body.clientOpId, "sale", saleId));

  // Use runIdempotentBatch so two parallel POSTs with the same clientOpId
  // can no longer both insert a sale. The UNIQUE constraint on sync_log
  // rolls back the loser's whole batch and we surface a "duplicate" reply.
  const outcome = await runIdempotentBatch(env.DB, stmts, body.clientOpId);
  if (outcome.duplicate) {
    const existing = outcome.refId
      ? await env.DB.prepare("SELECT order_id FROM sales WHERE id = ?").bind(outcome.refId).first()
      : null;
    return json({
      ok: true,
      duplicate: true,
      id: outcome.refId,
      orderId: existing ? existing.order_id : orderIdFromSaleId(outcome.refId)
    });
  }
  return json({
    ok: true,
    id: saleId,
    orderId: canonicalOrderId || body.orderId || null,
    serverTotal,
    serverSubtotal,
    serverVat,
    change: changeAmount,
  });
};
