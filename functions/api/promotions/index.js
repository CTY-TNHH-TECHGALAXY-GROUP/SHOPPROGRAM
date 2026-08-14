import { json, readJson, badRequest, now, uid } from "../_lib.js";

function safeJson(value, fallback) {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizePromotionRow(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code || "",
    promoType: row.promo_type || row.promoType || "combo",
    price: Number(row.price) || 0,
    discountAmount: Number(row.discount_amount || row.discountAmount) || 0,
    image: row.image || "",
    description: row.description || "",
    items: safeJson(row.items_json || row.itemsJson || row.items, []),
    startsAt: Number(row.starts_at || row.startsAt) || 0,
    endsAt: Number(row.ends_at || row.endsAt) || 0,
    isActive: row.is_active !== 0 && row.isActive !== false,
    sortOrder: Number(row.sort_order || row.sortOrder) || 0,
    usageCount: Number(row.usage_count || row.usageCount) || 0,
    createdAt: Number(row.created_at || row.createdAt) || 0,
    updatedAt: Number(row.updated_at || row.updatedAt) || 0,
  };
}

function normalizePromotionBody(body) {
  const ts = now();
  const items = Array.isArray(body.items) ? body.items : safeJson(body.itemsJson || body.items_json, []);
  const requestedType = String(body.promoType || body.promo_type || "combo").trim();
  const promoType = ["combo", "item_discount", "buy_get"].includes(requestedType) ? requestedType : "combo";
  const normalizedItems = items.map((item) => ({
    productId: String(item.productId || item.product_id || "").trim(),
    productName: String(item.productName || item.product_name || item.name || "").trim(),
    qty: Math.max(0, Number(item.qty) || 0),
    role: String(item.role || item.itemRole || item.item_role || (promoType === "item_discount" ? "discount" : "bundle")).trim(),
    discountType: String(item.discountType || item.discount_type || body.discountType || body.discount_type || "").trim(),
    discountValue: Math.max(0, Number(item.discountValue || item.discount_value || body.discountValue || body.discount_value) || 0),
    buyQty: Math.max(0, Number(item.buyQty || item.buy_qty || body.buyQty || body.buy_qty) || 0),
    giftQty: Math.max(0, Number(item.giftQty || item.gift_qty || body.giftQty || body.gift_qty) || 0),
  })).filter((item) => item.productId && item.qty > 0);

  return {
    id: String(body.id || "").trim() || uid("promo"),
    name: String(body.name || "").trim(),
    code: String(body.code || "").trim().toUpperCase(),
    promoType,
    price: Math.max(0, Math.round(Number(body.price) || 0)),
    discountAmount: Math.max(0, Math.round(Number(body.discountAmount || body.discount_amount) || 0)),
    image: String(body.image || "").trim(),
    description: String(body.description || "").trim(),
    items: normalizedItems,
    startsAt: Number(body.startsAt || body.starts_at) || null,
    endsAt: Number(body.endsAt || body.ends_at) || null,
    isActive: body.isActive === false || body.is_active === 0 ? 0 : 1,
    sortOrder: Math.round(Number(body.sortOrder || body.sort_order) || 0),
    ts,
  };
}

export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("all") === "1";
  const activeOnlySql = includeInactive
    ? ""
    : `WHERE is_active = 1
       AND (starts_at IS NULL OR starts_at = 0 OR starts_at <= ?)
       AND (ends_at IS NULL OR ends_at = 0 OR ends_at >= ?)`;
  const binds = includeInactive ? [] : [now(), now()];

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, name, code, promo_type, price, discount_amount, image,
              description, items_json, starts_at, ends_at, is_active,
              sort_order, usage_count, created_at, updated_at
       FROM promotions
       ${activeOnlySql}
       ORDER BY sort_order, name`
    ).bind(...binds).all();
    return json({ ok: true, promotions: (results || []).map(normalizePromotionRow) });
  } catch (err) {
    console.warn("[promotions] read failed", err && err.message ? err.message : err);
    return json({
      ok: true,
      promotions: [],
      warning: "promotions schema not ready",
    });
  }
};

export const onRequestPost = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !body.name) return badRequest("name required");
  const promo = normalizePromotionBody(body);
  if (!promo.items.length) return badRequest("at least one promotion item required");
  if (promo.promoType === "combo" && !promo.price) return badRequest("combo price required");
  if (promo.promoType === "item_discount" && !promo.items.some((item) => item.discountValue > 0)) {
    return badRequest("discount value required");
  }
  if (promo.promoType === "buy_get") {
    const hasBuy = promo.items.some((item) => item.role === "buy");
    const hasGift = promo.items.some((item) => item.role === "gift");
    if (!hasBuy || !hasGift) return badRequest("buy and gift items required");
  }

  await env.DB.prepare(
    `INSERT INTO promotions
       (id, name, code, promo_type, price, discount_amount, image, description,
        items_json, starts_at, ends_at, is_active, sort_order, usage_count,
        created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       code=excluded.code,
       promo_type=excluded.promo_type,
       price=excluded.price,
       discount_amount=excluded.discount_amount,
       image=excluded.image,
       description=excluded.description,
       items_json=excluded.items_json,
       starts_at=excluded.starts_at,
       ends_at=excluded.ends_at,
       is_active=excluded.is_active,
       sort_order=excluded.sort_order,
       updated_at=excluded.updated_at`
  ).bind(
    promo.id,
    promo.name,
    promo.code || null,
    promo.promoType,
    promo.price,
    promo.discountAmount,
    promo.image || null,
    promo.description || null,
    JSON.stringify(promo.items),
    promo.startsAt,
    promo.endsAt,
    promo.isActive,
    promo.sortOrder,
    promo.ts,
    promo.ts
  ).run();

  return json({ ok: true, id: promo.id });
};

export const onRequestDelete = async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !body.id) return badRequest("id required");
  await env.DB.prepare(
    `UPDATE promotions SET is_active = 0, updated_at = ? WHERE id = ?`
  ).bind(now(), body.id).run();
  return json({ ok: true, id: body.id });
};
