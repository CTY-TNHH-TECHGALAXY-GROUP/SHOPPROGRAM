import {
  json,
  ensureProductsInventoryModeColumn,
  ensureComponentsInventoryColumns,
  ensureProductionTables,
  ensureSalesStorageCompatibility,
} from "../_lib.js";

// GET /api/sync/pull?since=<ts>
// Returns a delta of everything updated after `since`. Client uses it for
// background sync. Without `since` it returns the full snapshot.
export const onRequestGet = async ({ env, request }) => {
  await ensureProductsInventoryModeColumn(env.DB);
  await ensureComponentsInventoryColumns(env.DB);
  await ensureProductionTables(env.DB);
  await ensureSalesStorageCompatibility(env.DB);
  const url = new URL(request.url);
  const since = Number(url.searchParams.get("since")) || 0;
  // Pull recent terminal rows even if they were completed before `updated_at`
  // existed. This clears stale held/preparing cards on other devices.
  const recentTerminalCutoff = Date.now() - (14 * 24 * 60 * 60 * 1000);

  const [categories, addOns, components, products, inventory, settings, recentSales, productionRecipes, productionBatches] =
    await Promise.all([
      env.DB.prepare(
        `SELECT id, label, icon, sort_order, is_active, updated_at,
                parent_id, level, code
         FROM categories WHERE updated_at > ?`
      ).bind(since).all(),

      env.DB.prepare(
        `SELECT id, label, price, group_key, is_active, updated_at
         FROM add_ons WHERE updated_at > ?`
      ).bind(since).all(),

      // We INCLUDE deactivated products (is_active=0) on purpose so the
      // client can MIRROR soft-deletes — without them, a cached row in
      // localStorage from before the deactivation would linger forever.
      // When `since=0` (first pull) we return EVERYTHING; otherwise only
      // rows touched after `since`.
      env.DB.prepare(
        `SELECT id, label, unit, note, stock_qty, min_stock, item_type, cost_per_unit,
                is_unlimited_stock, is_active, updated_at
         FROM components WHERE updated_at > ? OR is_active = 0`
      ).bind(since).all(),

      env.DB.prepare(
        `SELECT p.id, p.name, p.category_id, p.price, p.cost_price, p.barcode,
                p.image, p.description, p.component_ids, p.min_stock, p.is_active,
                p.inventory_mode,
                p.unit, p.sku_code, p.updated_at,
                COALESCE(i.qty_on_hand, 0) AS stock
         FROM products p
         LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.updated_at > ? OR (i.updated_at IS NOT NULL AND i.updated_at > ?)
            OR p.is_active = 0`
      ).bind(since, since).all(),

      env.DB.prepare(
        `SELECT product_id, qty_on_hand, location, updated_at
         FROM inventory WHERE updated_at > ?`
      ).bind(since).all(),

      // Pull every settings row whose updated_at is newer than `since`.
      // Includes 'shop', 'invoice_templates', 'barcode_templates' and any
      // other future key — clients should handle them by key.
      env.DB.prepare(
        `SELECT key, value, updated_at FROM settings WHERE updated_at > ?`
      ).bind(since).all(),

      env.DB.prepare(
        `SELECT 
           s.id, s.order_id, s.created_at, s.total, s.payment_method, s.customer_name,
           s.subtotal, s.vat_amount, s.discount, s.paid, s.change_amount,
           s.cashier_name, s.payment_status, s.order_status, s.note,
           COALESCE(s.updated_at, s.created_at) AS updated_at,
           COALESCE((
             SELECT SUM(
               CASE
                 WHEN LOWER(COALESCE(pic.unit, '')) IN ('g', 'gr', 'gram', 'kg', 'ml', 'l', 'lit', 'liter') THEN 1
                 ELSE sic.qty
               END
             )
             FROM sale_items sic
             LEFT JOIN products pic ON pic.id = sic.product_id
             WHERE sic.sale_id = s.id
           ), 0) AS item_count,
           (
             SELECT json_group_array(
               json_object(
                 'id', si.id,
                 'productId', si.product_id,
                 'name', si.product_name,
                 'qty', si.qty,
                 'price', si.unit_price,
                 'unit', COALESCE(pi.unit, ''),
                 'addonsJson', si.addons_json,
                 'addonsTotal', si.addons_total,
                 'discountAmount', COALESCE(si.discount_amount, 0),
                 'lineTotal', si.line_total
               )
             )
             FROM sale_items si
             LEFT JOIN products pi ON pi.id = si.product_id
             WHERE si.sale_id = s.id
           ) as items_json
         FROM sales s
         WHERE s.order_status IN ('new', 'held', 'preparing', 'needs_action')
            OR COALESCE(s.updated_at, s.created_at) > ?
            OR (s.order_status IN ('completed', 'cancelled') AND s.created_at > ?)
         ORDER BY s.created_at DESC LIMIT 1000`
      ).bind(since, recentTerminalCutoff).all(),

      env.DB.prepare(
        `SELECT id, name, output_component_id, planned_output_qty, output_unit,
                inputs_json, note, is_active, updated_at
         FROM production_recipes
         WHERE updated_at > ? OR is_active = 0`
      ).bind(since).all(),

      env.DB.prepare(
        `SELECT id, recipe_id, output_component_id, planned_output_qty,
                actual_output_qty, output_unit, total_input_cost,
                actual_cost_per_unit, addons_json, note, created_at
         FROM production_batches
         WHERE created_at > ?
         ORDER BY created_at DESC LIMIT 500`
      ).bind(since).all(),
    ]);

  return json({
    ok: true,
    serverTime: Date.now(),
    since,
    categories: categories.results || [],
    addOns:     addOns.results || [],
    components: components.results || [],
    products:   products.results || [],
    inventory:  inventory.results || [],
    settings:   settings.results || [],
    recentSales: recentSales.results || [],
    productionRecipes: productionRecipes.results || [],
    productionBatches: productionBatches.results || [],
  });
};
