import { json, readJson, badRequest, now, uid } from "../_lib.js";

async function ensurePurchaseRequestTables(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS purchase_requests (
      id              TEXT PRIMARY KEY,
      request_title   TEXT,
      requester_name  TEXT,
      note            TEXT,
      items_json      TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'open',
      fulfilled_by    TEXT,
      fulfilled_at    BIGINT,
      purchase_id     TEXT,
      created_at      BIGINT NOT NULL,
      updated_at      BIGINT NOT NULL
    )`
  ).run();
  await ensurePurchaseRequestColumns(db);
  await ensureTimestampColumns(db);
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_purchase_requests_status
     ON purchase_requests(status, created_at)`
  ).run();
}

async function columnExists(db, tableName, columnName) {
  const { results } = await db.prepare(`PRAGMA table_info(${tableName})`).all();
  return (results || []).some((column) => column.name === columnName);
}

async function ensurePurchaseRequestColumns(db) {
  if (!(await columnExists(db, "purchase_requests", "request_title"))) {
    await db.prepare(
      `ALTER TABLE purchase_requests ADD COLUMN request_title TEXT`
    ).run();
  }
}

async function ensureTimestampColumns(db) {
  if (!db || db.__provider !== "supabase") return;
  const { results } = await db.prepare(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'purchase_requests'
       AND column_name IN ('fulfilled_at', 'created_at', 'updated_at')`
  ).all();
  const needsMigration = (results || []).some((row) =>
    String(row.data_type || "").toLowerCase() === "integer"
  );
  if (!needsMigration) return;

  // Supabase/Postgres INTEGER is 32-bit, but the app stores Date.now() milliseconds.
  // Keep this migration here so older auto-created tables stop throwing "integer out of range".
  await db.prepare(
    `ALTER TABLE purchase_requests
       ALTER COLUMN fulfilled_at TYPE BIGINT USING fulfilled_at::BIGINT,
       ALTER COLUMN created_at TYPE BIGINT USING created_at::BIGINT,
       ALTER COLUMN updated_at TYPE BIGINT USING updated_at::BIGINT`
  ).run();
}

function normalizeItems(items) {
  return (items || []).map((raw) => {
    const itemType = raw.itemType === "component" || raw.item_type === "component" ? "component" : "product";
    const itemId = String(raw.itemId || raw.item_id || raw.productId || raw.product_id || raw.componentId || raw.component_id || "").trim();
    return {
      itemType,
      itemId,
      name: String(raw.name || raw.productName || raw.product_name || raw.componentName || raw.component_name || itemId).trim(),
      unit: String(raw.unit || "").trim(),
      requestedQty: Number(raw.requestedQty != null ? raw.requestedQty : raw.qty) || 0,
      note: String(raw.note || "").trim(),
    };
  }).filter((item) => item.itemId && item.requestedQty > 0);
}

function parseRequest(row) {
  let items = [];
  try {
    items = JSON.parse(row.items_json || "[]");
  } catch (_) {
    items = [];
  }
  return {
    id: row.id,
    requestTitle: row.request_title || "",
    requesterName: row.requester_name || "",
    note: row.note || "",
    status: row.status || "open",
    fulfilledBy: row.fulfilled_by || "",
    fulfilledAt: Number(row.fulfilled_at) || 0,
    purchaseId: row.purchase_id || "",
    createdAt: Number(row.created_at) || 0,
    updatedAt: Number(row.updated_at) || 0,
    items,
  };
}

export const onRequestGet = async ({ env, request }) => {
  await ensurePurchaseRequestTables(env.DB);
  const url = new URL(request.url);
  const status = String(url.searchParams.get("status") || "open").trim();
  const limit = Math.min(Number(url.searchParams.get("limit")) || 60, 200);
  const where = status === "all" ? "" : "WHERE status = ?";
  const stmt = env.DB.prepare(
    `SELECT id, request_title, requester_name, note, items_json, status, fulfilled_by,
            fulfilled_at, purchase_id, created_at, updated_at
     FROM purchase_requests
     ${where}
     ORDER BY created_at DESC
     LIMIT ?`
  );
  const { results } = status === "all"
    ? await stmt.bind(limit).all()
    : await stmt.bind(status, limit).all();
  return json({ ok: true, requests: (results || []).map(parseRequest) });
};

export const onRequestPost = async ({ env, request }) => {
  await ensurePurchaseRequestTables(env.DB);
  const body = await readJson(request);
  if (!body) return badRequest("body required");
  const action = String(body.action || "create").trim();
  const ts = now();

  if (action === "fulfill" || action === "close") {
    if (!body.id) return badRequest("id required");
    await env.DB.prepare(
      `UPDATE purchase_requests
       SET status = ?, fulfilled_by = ?, fulfilled_at = ?, purchase_id = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      action === "close" ? "closed" : "fulfilled",
      body.fulfilledBy || body.receiverName || null,
      ts,
      body.purchaseId || null,
      ts,
      body.id
    ).run();
    return json({ ok: true, id: body.id });
  }

  const items = normalizeItems(body.items);
  if (!items.length) return badRequest("items required");
  const id = body.id || uid("req");
  await env.DB.prepare(
    `INSERT INTO purchase_requests
       (id, request_title, requester_name, note, items_json, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       request_title = excluded.request_title,
       requester_name = excluded.requester_name,
       note = excluded.note,
       items_json = excluded.items_json,
       status = 'open',
       updated_at = excluded.updated_at`
  ).bind(
    id,
    String(body.requestTitle || body.request_title || "").trim() || null,
    String(body.requesterName || body.requester_name || "").trim() || null,
    String(body.note || "").trim() || null,
    JSON.stringify(items),
    ts,
    ts
  ).run();

  return json({ ok: true, id });
};
