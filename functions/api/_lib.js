// Shared helpers for Pages Functions API routes.

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers,
  });
}

export function badRequest(message, extra) {
  return json({ ok: false, error: message, ...(extra || {}) }, { status: 400 });
}

export function notFound(message = "Not found") {
  return json({ ok: false, error: message }, { status: 404 });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function now() {
  return Date.now();
}

export function uid(prefix) {
  return (prefix ? prefix + "-" : "") +
    Math.random().toString(36).slice(2, 9) +
    Date.now().toString(36).slice(-5);
}

function stripVietnameseAccents(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function normalizePaymentMethod(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const text = stripVietnameseAccents(raw);

  if (key === "cash" || /\bcash\b/.test(text) || text.includes("tien mat")) {
    return "cash";
  }
  if (key === "card" || /\bcard\b/.test(text) || /\bthe\b/.test(text)) {
    return "card";
  }
  if (
    key === "bank_transfer" ||
    key === "banktransfer" ||
    key === "transfer" ||
    text.includes("bank transfer") ||
    text.includes("chuyen khoan")
  ) {
    return "bank_transfer";
  }
  if (
    key === "ewallet" ||
    key === "e_wallet" ||
    key === "wallet" ||
    text.includes("e-wallet") ||
    text.includes("e wallet") ||
    text.includes("vi dien tu") ||
    text.includes("wallet")
  ) {
    return "ewallet";
  }
  return "other";
}

// YYYYMMDD in shop-local-ish UTC (no TZ adjust; good enough for daily ids)
export function dateKey(ts) {
  const d = new Date((ts || Date.now()) + 7 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// Atomically allocate the next number in doc_sequences for (prefix, dateKey).
// Returns a string like "PN-20260521-001".
export async function nextDocId(db, prefix, ts) {
  const dk = dateKey(ts);
  if (db && db.__provider === "supabase") {
    const row = await db
      .prepare(
        `INSERT INTO doc_sequences AS ds (prefix, date_key, last_number)
         VALUES (?, ?, 1)
         ON CONFLICT(prefix, date_key)
           DO UPDATE SET last_number = ds.last_number + 1
         RETURNING ds.last_number AS last_number`
      )
      .bind(prefix, dk)
      .first();
    const n = (row && row.last_number) || 1;
    return `${prefix}-${dk}-${String(n).padStart(3, "0")}`;
  }
  // SQLite upsert that increments and returns the value.
  // D1 supports RETURNING.
  const row = await db
    .prepare(
      `INSERT INTO doc_sequences (prefix, date_key, last_number)
       VALUES (?, ?, 1)
       ON CONFLICT(prefix, date_key)
         DO UPDATE SET last_number = last_number + 1
       RETURNING last_number`
    )
    .bind(prefix, dk)
    .first();
  const n = (row && row.last_number) || 1;
  return `${prefix}-${dk}-${String(n).padStart(3, "0")}`;
}

// Check whether a client_op_id has already been applied.
// Returns the existing ref_id when duplicate, otherwise null.
export async function isDuplicateOp(db, clientOpId) {
  if (!clientOpId) return null;
  const row = await db
    .prepare("SELECT ref_id FROM sync_log WHERE client_op_id = ?")
    .bind(clientOpId)
    .first();
  return row ? row.ref_id || true : null;
}

// Build the sync_log INSERT used to seal a mutation as "applied" for a given
// clientOpId. We deliberately use plain INSERT (NOT "INSERT OR IGNORE") so the
// statement throws a UNIQUE-constraint failure when another request already
// recorded this clientOpId. Because env.DB.batch() is transactional, that
// failure rolls back the WHOLE batch — meaning duplicate parallel requests
// can no longer leak two sales into the DB.
export function recordOpStmt(db, clientOpId, opType, refId) {
  return db
    .prepare(
      `INSERT INTO sync_log (client_op_id, op_type, ref_id, applied_at)
       VALUES (?, ?, ?, ?)`
    )
    .bind(clientOpId || uid("auto"), opType || "unknown", refId || null, Date.now());
}

// Wrap env.DB.batch() so a duplicate sync_log insert (UNIQUE constraint
// violation) is converted into a friendly { ok: true, duplicate: true } reply
// instead of a 500. Returns:
//   { duplicate: true, refId }   when sync_log already had this clientOpId
//   { duplicate: false }          when the batch committed successfully
// On any OTHER error, re-throws.
export async function runIdempotentBatch(db, batch, clientOpId) {
  try {
    await db.batch(batch);
    return { duplicate: false };
  } catch (err) {
    const msg = String((err && err.message) || err || "");
    const lowerMsg = msg.toLowerCase();
    const mentionsSyncLog = lowerMsg.indexOf("sync_log") !== -1;
    const isDup =
      mentionsSyncLog && (
        msg.indexOf("UNIQUE constraint failed") !== -1 ||
        lowerMsg.indexOf("duplicate key value violates unique constraint") !== -1 ||
        lowerMsg.indexOf("unique constraint") !== -1 ||
        lowerMsg.indexOf("constraint failed") !== -1 ||
        msg.indexOf("D1_ERROR") !== -1
      );
    if (isDup && clientOpId) {
      const existing = await db.prepare(
        `SELECT ref_id FROM sync_log WHERE client_op_id = ?`
      ).bind(clientOpId).first();
      return { duplicate: true, refId: existing ? existing.ref_id : null };
    }
    throw err;
  }
}

// Inventory upsert delta statement.
// qtyDelta may be negative (sale/issue) or positive (purchase/return).
export function inventoryDeltaStmt(db, productId, qtyDelta, ts) {
  return db
    .prepare(
      `INSERT INTO inventory (product_id, qty_on_hand, location, updated_at)
       VALUES (?, ?, 'main', ?)
       ON CONFLICT(product_id) DO UPDATE SET
         qty_on_hand = inventory.qty_on_hand + excluded.qty_on_hand,
         updated_at = excluded.updated_at`
    )
    .bind(productId, qtyDelta, ts || Date.now());
}

// Build a stock_movements INSERT statement.
export function movementStmt(db, params) {
  return db
    .prepare(
      `INSERT INTO stock_movements
         (id, product_id, movement_type, qty_change, unit_cost, ref_type, ref_id, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      params.id || uid("mv"),
      params.productId,
      params.movementType,
      params.qtyChange,
      params.unitCost == null ? null : params.unitCost,
      params.refType || null,
      params.refId || null,
      params.note || null,
      params.createdAt || Date.now()
    );
}

export function componentMovementStmt(db, params) {
  return db.prepare(
    `INSERT INTO component_stock_movements
       (id, component_id, movement_type, qty_change, unit_cost, ref_type, ref_id, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    params.id || uid("cmv"),
    params.componentId,
    params.movementType,
    params.qtyChange,
    params.unitCost == null ? null : params.unitCost,
    params.refType || null,
    params.refId || null,
    params.note || null,
    params.createdAt || Date.now()
  );
}

// Pull a product's current cost_price (used as snapshot for OUT/SALE moves).
export async function getProductCost(db, productId) {
  const row = await db
    .prepare("SELECT cost_price FROM products WHERE id = ?")
    .bind(productId)
    .first();
  return row ? Number(row.cost_price) || 0 : 0;
}

export async function getProductName(db, productId) {
  const row = await db
    .prepare("SELECT name FROM products WHERE id = ?")
    .bind(productId)
    .first();
  return row ? row.name : null;
}

async function columnExists(db, tableName, columnName) {
  const { results } = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  return (results || []).some((column) => column.name === columnName);
}

export async function ensureProductsInventoryModeColumn(db) {
  const hasColumn = await columnExists(db, "products", "inventory_mode");
  if (!hasColumn) {
    await db.prepare(
      `ALTER TABLE products ADD COLUMN inventory_mode TEXT`
    ).run();
  }
}

export async function ensureComponentsInventoryColumns(db) {
  if (!(await columnExists(db, "components", "stock_qty"))) {
    await db.prepare(
      `ALTER TABLE components ADD COLUMN stock_qty REAL NOT NULL DEFAULT 0`
    ).run();
  }
  if (!(await columnExists(db, "components", "min_stock"))) {
    await db.prepare(
      `ALTER TABLE components ADD COLUMN min_stock REAL NOT NULL DEFAULT 0`
    ).run();
  }
  if (!(await columnExists(db, "components", "is_active"))) {
    await db.prepare(
      `ALTER TABLE components ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`
    ).run();
  }
  if (!(await columnExists(db, "components", "item_type"))) {
    await db.prepare(
      `ALTER TABLE components ADD COLUMN item_type TEXT NOT NULL DEFAULT 'raw_material'`
    ).run();
  }
  if (!(await columnExists(db, "components", "cost_per_unit"))) {
    await db.prepare(
      `ALTER TABLE components ADD COLUMN cost_per_unit INTEGER NOT NULL DEFAULT 0`
    ).run();
  }
  if (!(await columnExists(db, "components", "is_unlimited_stock"))) {
    await db.prepare(
      `ALTER TABLE components ADD COLUMN is_unlimited_stock INTEGER NOT NULL DEFAULT 0`
    ).run();
  }
  if (db && db.__provider === "supabase") {
    await db.prepare(
      `ALTER TABLE components ALTER COLUMN stock_qty TYPE numeric USING stock_qty::numeric`
    ).run();
    await db.prepare(
      `ALTER TABLE components ALTER COLUMN min_stock TYPE numeric USING min_stock::numeric`
    ).run();
  }
}

export async function ensureSalesStorageCompatibility(db) {
  if (!(await columnExists(db, "sales", "updated_at"))) {
    await db.prepare(
      db && db.__provider === "supabase"
        ? `ALTER TABLE sales ADD COLUMN updated_at bigint NOT NULL DEFAULT 0`
        : `ALTER TABLE sales ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0`
    ).run();
  }
  if (!(await columnExists(db, "sale_items", "discount_amount"))) {
    await db.prepare(
      db && db.__provider === "supabase"
        ? `ALTER TABLE sale_items ADD COLUMN discount_amount integer NOT NULL DEFAULT 0`
        : `ALTER TABLE sale_items ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0`
    ).run();
  }
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_sales_updated_at ON sales(updated_at)`).run();

  if (!db || db.__provider !== "supabase") return;

  // D1 tolerated integer-ish columns more loosely. Supabase/Postgres is strict,
  // so keep POS sale storage compatible with fractional kg/g/ml/l quantities
  // and the newer order workflow states used by the UI.
  await db.prepare(
    `ALTER TABLE sale_items ALTER COLUMN qty TYPE numeric USING qty::numeric`
  ).run();
  await db.prepare(
    `ALTER TABLE inventory ALTER COLUMN qty_on_hand TYPE numeric USING qty_on_hand::numeric`
  ).run();
  await db.prepare(
    `ALTER TABLE stock_movements ALTER COLUMN qty_change TYPE numeric USING qty_change::numeric`
  ).run();
  await db.prepare(
    `ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_order_status_check`
  ).run();
  await db.prepare(
    `ALTER TABLE sales ADD CONSTRAINT sales_order_status_check
     CHECK (order_status IN ('completed','cancelled','held','new','preparing','needs_action'))`
  ).run();
}

export async function ensureStockIssueItemColumns(db) {
  if (!(await columnExists(db, "stock_issue_items", "item_type"))) {
    await db.prepare(
      `ALTER TABLE stock_issue_items ADD COLUMN item_type TEXT NOT NULL DEFAULT 'product'`
    ).run();
  }
  if (!(await columnExists(db, "stock_issue_items", "component_id"))) {
    await db.prepare(
      `ALTER TABLE stock_issue_items ADD COLUMN component_id TEXT`
    ).run();
  }
  if (db && db.__provider === "supabase") {
    await db.prepare(
      `ALTER TABLE stock_issue_items ALTER COLUMN product_id DROP NOT NULL`
    ).run();
    await db.prepare(
      `ALTER TABLE stock_issue_items DROP CONSTRAINT IF EXISTS stock_issue_items_product_id_fkey`
    ).run();
    await db.prepare(
      `ALTER TABLE stock_issue_items ADD CONSTRAINT stock_issue_items_product_id_fkey
       FOREIGN KEY (product_id) REFERENCES products(id)`
    ).run().catch(() => {});
    await db.prepare(
      `ALTER TABLE stock_issue_items ADD CONSTRAINT stock_issue_items_component_id_fkey
       FOREIGN KEY (component_id) REFERENCES components(id)`
    ).run().catch(() => {});
  }
}

export function normalizeInventoryItemType(value) {
  const allowed = new Set(["raw_material", "semi_finished", "packaging", "retail_product"]);
  const type = String(value || "raw_material").trim();
  return allowed.has(type) ? type : "raw_material";
}

export function normalizeUnit(value) {
  const unit = String(value || "").trim().toLowerCase();
  if (unit === "kg" || unit === "kilogram" || unit === "kilograms") return "kg";
  if (unit === "g" || unit === "gram" || unit === "grams") return "gram";
  if (unit === "l" || unit === "liter" || unit === "litre" || unit === "lit") return "l";
  if (unit === "ml" || unit === "milliliter" || unit === "milliliters") return "ml";
  if (unit === "piece" || unit === "pieces" || unit === "pcs" || unit === "cai") return "piece";
  return unit;
}

export function isFractionalStockUnit(value) {
  const unit = normalizeUnit(value);
  return unit === "kg" || unit === "gram" || unit === "l" || unit === "ml";
}

export function normalizeStockQty(value, unit) {
  const qty = Number(value);
  if (!Number.isFinite(qty)) return NaN;
  const positive = Math.max(0, qty);
  if (isFractionalStockUnit(unit)) {
    return Math.round(positive * 1000) / 1000;
  }
  return Math.floor(positive);
}

export function normalizeStockDelta(value, unit) {
  const delta = Number(value);
  if (!Number.isFinite(delta)) return NaN;
  const sign = delta < 0 ? -1 : 1;
  const abs = Math.abs(delta);
  if (isFractionalStockUnit(unit)) {
    return sign * (Math.round(abs * 1000) / 1000);
  }
  return sign * Math.floor(abs);
}

export async function ensureProductionTables(db) {
  await ensureComponentsInventoryColumns(db);
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
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS production_recipes (
      id                 TEXT PRIMARY KEY,
      name               TEXT NOT NULL,
      output_component_id TEXT NOT NULL REFERENCES components(id),
      planned_output_qty REAL NOT NULL,
      output_unit        TEXT NOT NULL,
      inputs_json        TEXT NOT NULL,
      note               TEXT,
      is_active          INTEGER NOT NULL DEFAULT 1,
      updated_at         INTEGER NOT NULL
    )`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_production_recipes_output
     ON production_recipes(output_component_id)`
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS production_batches (
      id                   TEXT PRIMARY KEY,
      recipe_id            TEXT NOT NULL REFERENCES production_recipes(id),
      output_component_id  TEXT NOT NULL REFERENCES components(id),
      planned_output_qty   REAL NOT NULL,
      actual_output_qty    REAL NOT NULL,
      output_unit          TEXT NOT NULL,
      total_input_cost     INTEGER NOT NULL DEFAULT 0,
      actual_cost_per_unit INTEGER NOT NULL DEFAULT 0,
      note                 TEXT,
      created_at           INTEGER NOT NULL
    )`
  ).run();
  if (!(await columnExists(db, "production_batches", "addons_json"))) {
    await db.prepare(
      `ALTER TABLE production_batches ADD COLUMN addons_json TEXT`
    ).run();
  }
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_production_batches_recipe
     ON production_batches(recipe_id, created_at)`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_production_batches_output
     ON production_batches(output_component_id, created_at)`
  ).run();
}

const TOKEN_SECRET = "shopprogram_jwt_secret_key_2026";

export async function createSignedToken(payload, secret) {
  // Use Web Crypto API to sign a token with SHA-256
  // Format: base64(payload) . signature
  const payloadStr = btoa(JSON.stringify(payload));
  const encoder = new TextEncoder();
  const data = encoder.encode(payloadStr + "." + (secret || TOKEN_SECRET));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return payloadStr + "." + signature;
}

export async function verifyToken(token, secret) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadStr + "." + (secret || TOKEN_SECRET));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(atob(payloadStr));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (salt || ""));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [k, v] = pair.split("=");
    if (k && k.trim() === name) {
      return decodeURIComponent(v.trim());
    }
  }
  return null;
}
