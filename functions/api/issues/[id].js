import { json, notFound, ensureStockIssueItemColumns } from "../_lib.js";

export const onRequestGet = async ({ env, params }) => {
  await ensureStockIssueItemColumns(env.DB);
  const head = await env.DB.prepare(`SELECT * FROM stock_issues WHERE id = ?`)
    .bind(params.id).first();
  if (!head) return notFound();
  const { results: items } = await env.DB.prepare(
    `SELECT sii.*,
            COALESCE(NULLIF(sii.product_name, ''), p.name, c.label, sii.product_id, sii.component_id) AS item_name,
            p.barcode AS barcode,
            p.sku AS sku,
            COALESCE(p.unit, c.unit) AS unit,
            c.item_type AS component_type
     FROM stock_issue_items sii
     LEFT JOIN products p ON p.id = sii.product_id
     LEFT JOIN components c ON c.id = sii.component_id
     WHERE sii.issue_id = ?
     ORDER BY sii.rowid`
  ).bind(params.id).all();
  return json({
    ok: true,
    issue: head,
    items: (items || []).map((item) => ({
      ...item,
      display_name: item.item_name || item.product_name || item.product_id || item.component_id,
    })),
  });
};
