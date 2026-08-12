import { json, ensureProductsInventoryModeColumn, ensureComponentsInventoryColumns } from "../_lib.js";

function safeJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function normalizeWastePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(99, Math.max(0, n));
}

function recipeEntryStockQty(entry) {
  if (typeof entry === "string") return 1;
  const qty = entry && entry.qty !== undefined && entry.qty !== null
    ? Math.max(0, Number(entry.qty) || 0)
    : 1;
  const waste = entry && (
    entry.wastePercent !== undefined ? entry.wastePercent :
      entry.waste_percent !== undefined ? entry.waste_percent :
        entry.wasteRate !== undefined ? entry.wasteRate :
          entry.waste_rate
  );
  const rawWaste = Number(waste);
  const wastePercent = rawWaste > 0 && rawWaste <= 1
    ? normalizeWastePercent(rawWaste * 100)
    : normalizeWastePercent(rawWaste);
  const usableRate = Math.max(0.01, 1 - (wastePercent / 100));
  return qty / usableRate;
}

function recipeEntryId(entry) {
  if (typeof entry === "string") return entry;
  if (!entry || typeof entry !== "object") return "";
  return entry.id || entry.componentId || entry.component_id || "";
}

function recipeAvailability(product, componentMap) {
  const entries = safeJsonArray(product.component_ids)
    .map((entry) => ({ id: recipeEntryId(entry), qty: recipeEntryStockQty(entry) }))
    .filter((entry) => entry.id);
  if (!entries.length) return 0;
  let minPossible = Infinity;
  for (const entry of entries) {
    const component = componentMap.get(entry.id);
    if (!component) return 0;
    if (Number(component.is_unlimited_stock) === 1) continue;
    const needed = Math.max(0.0001, Number(entry.qty) || 1);
    const available = Math.max(0, Number(component.stock_qty) || 0);
    minPossible = Math.min(minPossible, Math.floor(available / needed));
  }
  return minPossible === Infinity ? 999999 : Math.max(0, minPossible);
}

// GET /api/reports/low-stock
// Returns direct-stock products, components, and recipe products whose derived
// available quantity is at or below their configured min_stock.
export const onRequestGet = async ({ env }) => {
  await ensureProductsInventoryModeColumn(env.DB);
  await ensureComponentsInventoryColumns(env.DB);

  const { results } = await env.DB.prepare(
    `SELECT 'product' AS type,
            p.id AS id,
            p.name AS name,
            p.image AS image,
            p.min_stock AS min_stock,
            p.unit AS unit,
            p.category_id AS category_id,
            p.barcode AS barcode,
            COALESCE(i.qty_on_hand, 0) AS qty_on_hand,
            (COALESCE(i.qty_on_hand, 0) * 1.0 / NULLIF(p.min_stock, 0)) AS stock_ratio
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.is_active = 1
       AND p.inventory_mode = 'stock'
       AND p.min_stock > 0
       AND COALESCE(i.qty_on_hand, 0) <= p.min_stock

     UNION ALL

     SELECT 'component' AS type,
            c.id AS id,
            c.label AS name,
            NULL AS image,
            c.min_stock AS min_stock,
            c.unit AS unit,
            c.item_type AS category_id,
            NULL AS barcode,
            COALESCE(c.stock_qty, 0) AS qty_on_hand,
            (COALESCE(c.stock_qty, 0) * 1.0 / NULLIF(c.min_stock, 0)) AS stock_ratio
     FROM components c
     WHERE c.is_active = 1
       AND c.min_stock > 0
       AND COALESCE(c.stock_qty, 0) <= c.min_stock

     ORDER BY stock_ratio ASC, name`
  ).all();

  const { results: recipeProducts } = await env.DB.prepare(
    `SELECT id, name, image, min_stock, unit, category_id, barcode, component_ids
     FROM products
     WHERE is_active = 1
       AND inventory_mode = 'recipe'
       AND min_stock > 0`
  ).all();

  const { results: componentRows } = await env.DB.prepare(
    `SELECT id, stock_qty, is_unlimited_stock
     FROM components
     WHERE is_active = 1`
  ).all();
  const componentMap = new Map();
  (componentRows || []).forEach((component) => componentMap.set(component.id, component));

  const derivedRecipeItems = (recipeProducts || []).map((product) => {
    const available = recipeAvailability(product, componentMap);
    const minStock = Number(product.min_stock) || 0;
    if (available > minStock) return null;
    return {
      type: "recipe_product",
      id: product.id,
      name: product.name,
      image: product.image,
      min_stock: minStock,
      unit: product.unit,
      category_id: product.category_id,
      barcode: product.barcode,
      qty_on_hand: available,
      stock_ratio: minStock > 0 ? available / minStock : 0,
    };
  }).filter(Boolean);

  const items = (results || []).concat(derivedRecipeItems).sort((a, b) => {
    const ratioDiff = (Number(a.stock_ratio) || 0) - (Number(b.stock_ratio) || 0);
    if (ratioDiff) return ratioDiff;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  return json({ ok: true, items });
};
