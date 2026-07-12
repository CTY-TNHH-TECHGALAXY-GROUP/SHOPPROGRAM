import {
  uid,
  inventoryDeltaStmt,
  movementStmt,
  componentMovementStmt,
  normalizePaymentMethod,
  ensureComponentsInventoryColumns,
  ensureProductsInventoryModeColumn,
  normalizeStockQty,
} from "../_lib.js";

export const VERIFICATION_PENDING = "pending_verification";
export const VERIFICATION_VERIFIED = "verified";
export const VERIFICATION_NEEDS_REVISION = "needs_revision";
export const VERIFICATION_REJECTED = "rejected";

let purchaseSchemaBootstrapped = false;

function isSupabaseAdapter(db) {
  return db && db.__provider === "supabase";
}

async function columnExists(db, tableName, columnName) {
  const { results } = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  return (results || []).some((column) => column.name === columnName);
}

async function addColumnIfMissing(db, tableName, columnName, definition) {
  if (await columnExists(db, tableName, columnName)) return;
  await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
}

export async function ensurePurchaseTables(db) {
  if (purchaseSchemaBootstrapped) return;

  if (isSupabaseAdapter(db)) {
    // Supabase schema is migration-managed. Re-running DDL/PRAGMA on every
    // purchase request creates many Cloudflare subrequests and can block large saves.
    purchaseSchemaBootstrapped = true;
    return;
  }

  await ensureProductsInventoryModeColumn(db);
  await ensureComponentsInventoryColumns(db);
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS purchase_component_items (
      id                  TEXT PRIMARY KEY,
      purchase_id         TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      component_id        TEXT NOT NULL REFERENCES components(id),
      component_name      TEXT,
      qty                 REAL NOT NULL,
      unit                TEXT,
      unit_cost           INTEGER NOT NULL,
      subtotal            INTEGER NOT NULL,
      purchase_qty        REAL,
      purchase_unit       TEXT,
      purchase_unit_cost  INTEGER
    )`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_po_component_items_purchase
     ON purchase_component_items(purchase_id)`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_po_component_items_component
     ON purchase_component_items(component_id)`
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS component_stock_movements (
      id            TEXT PRIMARY KEY,
      component_id  TEXT NOT NULL REFERENCES components(id),
      movement_type TEXT NOT NULL,
      qty_change    REAL NOT NULL,
      unit_cost     INTEGER,
      ref_type      TEXT,
      ref_id        TEXT,
      note          TEXT,
      created_at    INTEGER NOT NULL
    )`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_component_mov_component
     ON component_stock_movements(component_id, created_at)`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_component_mov_ref
     ON component_stock_movements(ref_type, ref_id)`
  ).run();

  await addColumnIfMissing(db, "purchase_orders", "verification_status", "TEXT NOT NULL DEFAULT 'verified'");
  await addColumnIfMissing(db, "purchase_orders", "source_request_ids", "TEXT");
  await addColumnIfMissing(db, "purchase_orders", "verified_at", "BIGINT");
  await addColumnIfMissing(db, "purchase_orders", "verified_by", "TEXT");
  await addColumnIfMissing(db, "purchase_order_items", "purchase_qty", "REAL");
  await addColumnIfMissing(db, "purchase_order_items", "purchase_unit", "TEXT");
  await addColumnIfMissing(db, "purchase_order_items", "purchase_unit_cost", "INTEGER");
  await addColumnIfMissing(db, "purchase_component_items", "purchase_qty", "REAL");
  await addColumnIfMissing(db, "purchase_component_items", "purchase_unit", "TEXT");
  await addColumnIfMissing(db, "purchase_component_items", "purchase_unit_cost", "INTEGER");
  purchaseSchemaBootstrapped = true;
}

function normalizeUnit(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/\s+/g, "_");
}

export function displayUnit(value) {
  const unit = normalizeUnit(value);
  if (unit === "kg" || unit === "kilogram" || unit === "kilograms") return "kg";
  if (unit === "g" || unit === "gram" || unit === "grams") return "gram";
  if (unit === "l" || unit === "liter" || unit === "litre" || unit === "lit") return "l";
  if (unit === "ml" || unit === "milliliter" || unit === "millilitre") return "ml";
  if (unit === "piece" || unit === "pieces" || unit === "pcs" || unit === "cai") return "piece";
  if (unit === "box" || unit === "hop") return "box";
  if (unit === "bottle" || unit === "chai") return "bottle";
  return unit || "";
}

export function convertToBaseQty(qty, purchaseUnit, baseUnit) {
  const amount = Number(qty);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "qty must be > 0" };
  const from = displayUnit(purchaseUnit || baseUnit);
  const to = displayUnit(baseUnit || purchaseUnit);
  if (!from || !to || from === to) return { ok: true, qty: amount, unit: to || from };
  if (from === "kg" && to === "gram") return { ok: true, qty: amount * 1000, unit: "gram" };
  if (from === "gram" && to === "kg") return { ok: true, qty: amount / 1000, unit: "kg" };
  if (from === "l" && to === "ml") return { ok: true, qty: amount * 1000, unit: "ml" };
  if (from === "ml" && to === "l") return { ok: true, qty: amount / 1000, unit: "l" };
  if (from === "piece" && to === "piece") return { ok: true, qty: amount, unit: "piece" };
  return { ok: false, error: `cannot convert ${from} to ${to}` };
}

export function isPendingPurchaseBody(body) {
  const status = String(body.status || body.verificationStatus || body.verification_status || "").trim();
  return status === VERIFICATION_PENDING || body.requiresVerification === true;
}

export async function normalizePurchasePayload(db, body, purchaseId, ts) {
  const verificationStatus = isPendingPurchaseBody(body) ? VERIFICATION_PENDING : VERIFICATION_VERIFIED;
  const orderStatus = verificationStatus === VERIFICATION_PENDING ? "draft" : "completed";
  const paymentMethod = normalizePaymentMethod(body.paymentMethod || "cash");
  const sourceRequestIds = Array.isArray(body.sourceRequestIds)
    ? Array.from(new Set(body.sourceRequestIds.filter(Boolean)))
    : [];
  let total = 0;
  const itemRows = [];
  const componentRows = [];

  for (let i = 0; i < body.items.length; i++) {
    const raw = body.items[i] || {};
    const itemType = raw.itemType === "component" || raw.type === "component" ? "component" : "product";
    const purchaseQty = Number(raw.purchaseQty != null ? raw.purchaseQty : raw.qty);
    if (!Number.isFinite(purchaseQty) || purchaseQty <= 0) {
      throw new Error(`items[${i}].qty must be > 0`);
    }
    const purchaseUnitCost = Math.round(Number(raw.purchaseUnitCost != null ? raw.purchaseUnitCost : raw.unitCost) || 0);
    if (purchaseUnitCost < 0) throw new Error(`items[${i}].unitCost must be >= 0`);

    if (itemType === "component") {
      const componentId = String(raw.componentId || raw.itemId || "").trim();
      if (!componentId) throw new Error(`items[${i}].componentId required`);
      const component = await db.prepare(
        `SELECT id, label, unit, is_unlimited_stock FROM components WHERE id = ? AND is_active = 1`
      ).bind(componentId).first();
      if (!component) throw new Error(`component not found: ${componentId}`);
      const baseUnit = displayUnit(component.unit || raw.baseUnit || raw.unit || "gram");
      const purchaseUnit = displayUnit(raw.purchaseUnit || raw.unit || baseUnit);
      const converted = convertToBaseQty(purchaseQty, purchaseUnit, baseUnit);
      if (!converted.ok) throw new Error(`items[${i}]: ${converted.error}`);
      const subtotal = purchaseQty * purchaseUnitCost;
      const baseQty = converted.qty;
      const baseUnitCost = baseQty > 0 ? Math.round(subtotal / baseQty) : purchaseUnitCost;
      total += subtotal;
      componentRows.push({
        id: uid("pci"),
        componentId,
        componentName: raw.componentName || raw.productName || component.label || componentId,
        qty: baseQty,
        unit: converted.unit || baseUnit,
        unitCost: baseUnitCost,
        subtotal,
        purchaseQty,
        purchaseUnit,
        purchaseUnitCost,
        isUnlimitedStock: Number(component.is_unlimited_stock) === 1,
      });
    } else {
      const productId = String(raw.productId || raw.itemId || "").trim();
      if (!productId) throw new Error(`items[${i}].productId required`);
      const product = await db.prepare(
        `SELECT id, name, unit FROM products WHERE id = ?`
      ).bind(productId).first();
      if (!product) throw new Error(`product not found: ${productId}`);
      const baseUnit = displayUnit(product.unit || raw.baseUnit || raw.unit || "piece") || "piece";
      const purchaseUnit = displayUnit(raw.purchaseUnit || raw.unit || baseUnit) || baseUnit;
      const converted = convertToBaseQty(purchaseQty, purchaseUnit, baseUnit);
      if (!converted.ok) throw new Error(`items[${i}]: ${converted.error}`);
      const qty = normalizeStockQty(converted.qty, baseUnit);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error(`items[${i}].qty must be >= 1 unless unit supports decimals`);
      const subtotal = purchaseQty * purchaseUnitCost;
      const baseUnitCost = qty > 0 ? Math.round(subtotal / qty) : purchaseUnitCost;
      total += subtotal;
      itemRows.push({
        id: uid("poi"),
        productId,
        productName: raw.productName || product.name || productId,
        qty,
        unitCost: baseUnitCost,
        subtotal,
        purchaseQty,
        purchaseUnit,
        purchaseUnitCost,
      });
    }
  }

  const productStateRows = await Promise.all(
    itemRows.map((row) =>
      db.prepare(
        `SELECT p.cost_price, p.inventory_mode, p.unit, COALESCE(i.qty_on_hand, 0) AS qty
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.id = ?`
      ).bind(row.productId).first()
    )
  );
  for (let i = 0; i < itemRows.length; i++) {
    const state = productStateRows[i];
    if (!state) throw new Error(`product not found: ${itemRows[i].productId}`);
    if (state.inventory_mode === "recipe") {
      throw new Error(`recipe product stock is derived from components: ${itemRows[i].productId}`);
    }
    if (state.inventory_mode !== "stock") {
      throw new Error(`inventory mode required for product: ${itemRows[i].productId}`);
    }
  }

  return {
    purchaseId,
    ts,
    total,
    itemRows,
    componentRows,
    productStateRows,
    paymentMethod,
    orderStatus,
    verificationStatus,
    sourceRequestIds,
  };
}

export function purchaseInsertStatements(db, body, prepared) {
  const stmts = [];
  stmts.push(
    db.prepare(
      `INSERT INTO purchase_orders
         (id, supplier_id, supplier_name, total_amount, paid_amount,
          payment_method, status, verification_status, source_request_ids, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      prepared.purchaseId,
      body.supplierId || null,
      body.supplierName || null,
      Math.round(prepared.total),
      Number(body.paidAmount) || Math.round(prepared.total),
      prepared.paymentMethod,
      prepared.orderStatus,
      prepared.verificationStatus,
      prepared.sourceRequestIds.length ? JSON.stringify(prepared.sourceRequestIds) : null,
      body.note || null,
      prepared.ts
    )
  );

  prepared.itemRows.forEach((row) => {
    stmts.push(
      db.prepare(
        `INSERT INTO purchase_order_items
           (id, purchase_id, product_id, product_name, qty, unit_cost, subtotal,
            purchase_qty, purchase_unit, purchase_unit_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        row.id,
        prepared.purchaseId,
        row.productId,
        row.productName,
        row.qty,
        row.unitCost,
        Math.round(row.subtotal),
        row.purchaseQty,
        row.purchaseUnit,
        row.purchaseUnitCost
      )
    );
  });

  prepared.componentRows.forEach((row) => {
    stmts.push(
      db.prepare(
        `INSERT INTO purchase_component_items
           (id, purchase_id, component_id, component_name, qty, unit, unit_cost, subtotal,
            purchase_qty, purchase_unit, purchase_unit_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        row.id,
        prepared.purchaseId,
        row.componentId,
        row.componentName,
        row.qty,
        row.unit || null,
        row.unitCost,
        Math.round(row.subtotal),
        row.purchaseQty,
        row.purchaseUnit,
        row.purchaseUnitCost
      )
    );
  });

  return stmts;
}

export function purchaseStockStatements(db, prepared, note) {
  const stmts = [];
  prepared.itemRows.forEach((row, idx) => {
    stmts.push(movementStmt(db, {
      productId: row.productId,
      movementType: "IN",
      qtyChange: row.qty,
      unitCost: row.unitCost,
      refType: "purchase",
      refId: prepared.purchaseId,
      note: note || null,
      createdAt: prepared.ts,
    }));
    stmts.push(inventoryDeltaStmt(db, row.productId, row.qty, prepared.ts));
    const prev = prepared.productStateRows[idx] || { qty: 0, cost_price: 0 };
    const prevQty = Number(prev.qty) || 0;
    const prevCost = Number(prev.cost_price) || 0;
    const newQty = prevQty + row.qty;
    const newCost = newQty > 0
      ? Math.round((prevQty * prevCost + row.qty * row.unitCost) / newQty)
      : row.unitCost;
    stmts.push(
      db.prepare(
        `UPDATE products SET cost_price = ?, updated_at = ? WHERE id = ?`
      ).bind(newCost, prepared.ts, row.productId)
    );
  });

  prepared.componentRows.forEach((row) => {
    stmts.push(
      db.prepare(
        `UPDATE components
         SET stock_qty = CASE
               WHEN COALESCE(is_unlimited_stock, 0) = 1 THEN COALESCE(stock_qty, 0)
               ELSE COALESCE(stock_qty, 0) + ?
             END,
             unit = COALESCE(NULLIF(unit, ''), ?),
             cost_per_unit = ?,
             updated_at = ?
         WHERE id = ?`
      ).bind(row.qty, row.unit || null, row.unitCost, prepared.ts, row.componentId)
    );
    if (!row.isUnlimitedStock) {
      stmts.push(componentMovementStmt(db, {
        componentId: row.componentId,
        movementType: "IN",
        qtyChange: row.qty,
        unitCost: row.unitCost,
        refType: "purchase",
        refId: prepared.purchaseId,
        note: note || null,
        createdAt: prepared.ts,
      }));
    }
  });

  return stmts;
}

export async function loadPurchaseForStock(db, purchaseId, ts) {
  const head = await db.prepare(
    `SELECT * FROM purchase_orders WHERE id = ?`
  ).bind(purchaseId).first();
  if (!head) return null;
  const { results: productItems } = await db.prepare(
    `SELECT * FROM purchase_order_items WHERE purchase_id = ? ORDER BY rowid`
  ).bind(purchaseId).all();
  const { results: componentItems } = await db.prepare(
    `SELECT * FROM purchase_component_items WHERE purchase_id = ? ORDER BY rowid`
  ).bind(purchaseId).all();
  const itemRows = (productItems || []).map((row) => ({
    productId: row.product_id,
    productName: row.product_name,
    qty: Number(row.qty) || 0,
    unitCost: Number(row.unit_cost) || 0,
  }));
  const componentRows = (componentItems || []).map((row) => ({
    componentId: row.component_id,
    componentName: row.component_name,
    qty: Number(row.qty) || 0,
    unit: row.unit || "",
    unitCost: Number(row.unit_cost) || 0,
  }));
  const productStateRows = await Promise.all(
    itemRows.map((row) =>
      db.prepare(
        `SELECT p.cost_price, p.inventory_mode, COALESCE(i.qty_on_hand, 0) AS qty
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.id = ?`
      ).bind(row.productId).first()
    )
  );
  return {
    purchaseId,
    ts,
    head,
    itemRows,
    componentRows,
    productStateRows,
  };
}
