const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SUPABASE_DIR = path.join(ROOT, "database", "supabase");
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const CLOUDFLARE_BASE = process.env.CLOUDFLARE_POS_BASE_URL || "https://shopprogram.pages.dev";
const API_BASE = "https://api.supabase.com/v1";
const NOW = Date.now();

if (!PROJECT_REF) {
  console.error("Missing SUPABASE_PROJECT_REF");
  process.exit(1);
}

if (!ACCESS_TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

function escapeSql(value) {
  return String(value).replace(/'/g, "''");
}

function sqlValue(value, { json = false } = {}) {
  if (value === null || value === undefined) return "NULL";
  if (json) return `'${escapeSql(JSON.stringify(value))}'::jsonb`;
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${escapeSql(value)}'`;
}

function stripVietnameseAccents(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function normalizePaymentMethod(value) {
  if (!value) return "bank_transfer";
  const raw = String(value).trim();
  const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const text = stripVietnameseAccents(raw);

  if (key === "cash" || /\bcash\b/.test(text) || text.includes("tien mat")) return "cash";
  if (key === "card" || /\bcard\b/.test(text) || /\bthe\b/.test(text)) return "card";
  if (
    key === "bank_transfer" ||
    key === "banktransfer" ||
    key === "transfer" ||
    text.includes("bank transfer") ||
    text.includes("chuyen khoan")
  ) return "bank_transfer";
  if (
    key === "ewallet" ||
    key === "e_wallet" ||
    key === "wallet" ||
    text.includes("e-wallet") ||
    text.includes("e wallet") ||
    text.includes("vi dien tu") ||
    text.includes("wallet")
  ) return "ewallet";
  return "other";
}

async function fetchJson(pathname) {
  const url = `${CLOUDFLARE_BASE}${pathname}`;
  const res = await fetch(url);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    throw new Error(`Invalid JSON from ${url}: ${text.slice(0, 300)}`);
  }
  if (!res.ok || (data && data.ok === false)) {
    throw new Error(`Failed ${url}: ${res.status} ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data;
}

async function runQuery(query) {
  const response = await fetch(`${API_BASE}/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, read_only: false })
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }
  if (!response.ok) {
    const error = new Error(`Supabase API ${response.status}`);
    error.data = data;
    throw error;
  }
  return data;
}

async function runBatch(label, statements) {
  console.log(`\n== ${label}: ${statements.length} statements ==`);
  for (let index = 0; index < statements.length; index += 1) {
    process.stdout.write(`[${index + 1}/${statements.length}] `);
    await runQuery(statements[index]);
    console.log("ok");
  }
}

function chunkRows(rows, chunkSize = 100) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    chunks.push(rows.slice(i, i + chunkSize));
  }
  return chunks;
}

function buildUpsertStatements(tableName, columns, rows, options = {}) {
  if (!rows.length) return [];
  const jsonColumns = new Set(options.jsonColumns || []);
  const conflict = options.conflict || [columns[0]];
  const updateColumns = columns.filter((column) => !conflict.includes(column));
  return chunkRows(rows, options.chunkSize || 100).map((chunk) => {
    const valuesSql = chunk.map((row) => {
      const values = columns.map((column) => sqlValue(row[column], { json: jsonColumns.has(column) }));
      return `(${values.join(", ")})`;
    }).join(",\n");
    return [
      `insert into ${tableName} (${columns.join(", ")}) values`,
      valuesSql,
      `on conflict (${conflict.join(", ")}) do update set`,
      updateColumns.map((column) => `${column} = excluded.${column}`).join(",\n"),
      ";"
    ].join("\n");
  });
}

function buildSettingsRows(settingsObject) {
  return Object.entries(settingsObject || {}).map(([key, value]) => ({
    key,
    value,
    updated_at: NOW
  }));
}

function defaultComponents() {
  const seed = JSON.parse(fs.readFileSync(path.join(SUPABASE_DIR, "seed.json"), "utf8"));
  return seed.tables.components || [];
}

async function fetchAllData() {
  const [
    categoriesPayload,
    addonsPayload,
    productsPayload,
    inventoryPayload,
    movementsPayload,
    suppliersPayload,
    purchasesPayload,
    issuesPayload,
    salesPayload,
    settingsPayload
  ] = await Promise.all([
    fetchJson("/api/categories"),
    fetchJson("/api/addons"),
    fetchJson("/api/products"),
    fetchJson("/api/inventory"),
    fetchJson("/api/inventory/movements"),
    fetchJson("/api/suppliers"),
    fetchJson("/api/purchases"),
    fetchJson("/api/issues"),
    fetchJson("/api/sales"),
    fetchJson("/api/settings")
  ]);

  const purchaseIds = (purchasesPayload.purchases || []).map((item) => item.id);
  const issueIds = (issuesPayload.issues || []).map((item) => item.id);
  const saleIds = (salesPayload.sales || []).map((item) => item.id);

  const [purchaseDetails, issueDetails, saleDetails] = await Promise.all([
    Promise.all(purchaseIds.map((id) => fetchJson(`/api/purchases/${encodeURIComponent(id)}`))),
    Promise.all(issueIds.map((id) => fetchJson(`/api/issues/${encodeURIComponent(id)}`))),
    Promise.all(saleIds.map((id) => fetchJson(`/api/sales/${encodeURIComponent(id)}`)))
  ]);

  return {
    categories: categoriesPayload.categories || [],
    add_ons: addonsPayload.addOns || [],
    products: productsPayload.products || [],
    inventory: inventoryPayload.items || [],
    stock_movements: movementsPayload.movements || [],
    suppliers: suppliersPayload.suppliers || [],
    purchase_orders: (purchasesPayload.purchases || []).map((item) => ({
      id: item.id,
      supplier_id: item.supplier_id || null,
      supplier_name: item.supplier_name || null,
      total_amount: Number(item.total_amount) || 0,
      paid_amount: Number(item.paid_amount) || 0,
      payment_method: normalizePaymentMethod(item.payment_method),
      status: item.status || "completed",
      note: item.note || null,
      created_at: Number(item.created_at) || NOW
    })),
    purchase_order_items: purchaseDetails.flatMap((payload) => payload.items || []).map((item) => ({
      id: item.id,
      purchase_id: item.purchase_id,
      product_id: item.product_id,
      product_name: item.product_name || null,
      qty: Number(item.qty) || 0,
      unit_cost: Number(item.unit_cost) || 0,
      subtotal: Number(item.subtotal) || 0
    })),
    stock_issues: (issuesPayload.issues || []).map((item) => ({
      id: item.id,
      reason: item.reason || "other",
      note: item.note || null,
      status: item.status || "completed",
      created_at: Number(item.created_at) || NOW
    })),
    stock_issue_items: issueDetails.flatMap((payload) => payload.items || []).map((item) => ({
      id: item.id,
      issue_id: item.issue_id,
      product_id: item.product_id,
      product_name: item.product_name || null,
      qty: Number(item.qty) || 0,
      unit_cost: item.unit_cost == null ? null : Number(item.unit_cost)
    })),
    sales: (salesPayload.sales || []).map((item) => ({
      id: item.id,
      order_id: item.order_id || null,
      customer_name: item.customer_name || null,
      subtotal: Number(item.subtotal) || 0,
      vat_amount: Number(item.vat_amount) || 0,
      discount: Number(item.discount) || 0,
      total: Number(item.total) || 0,
      paid: Number(item.paid) || 0,
      change_amount: Number(item.change_amount) || 0,
      payment_method: normalizePaymentMethod(item.payment_method),
      cashier_name: item.cashier_name || null,
      payment_status: item.payment_status || "paid",
      order_status: item.order_status || "completed",
      note: item.note || null,
      created_at: Number(item.created_at) || NOW
    })),
    sale_items: saleDetails.flatMap((payload) => payload.items || []).map((item) => ({
      id: item.id,
      sale_id: item.sale_id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      qty: Number(item.qty) || 0,
      unit_price: Number(item.unit_price) || 0,
      addons_json: item.addons_json || "[]",
      addons_total: Number(item.addons_total) || 0,
      line_total: Number(item.line_total) || 0,
      unit_cost: item.unit_cost == null ? null : Number(item.unit_cost)
    })),
    settings: buildSettingsRows(settingsPayload.settings || {}),
    components: defaultComponents()
  };
}

function normalizeTables(data) {
  const tables = {
    categories: data.categories.map((row) => ({
      id: row.id,
      label: row.label,
      icon: row.icon || null,
      sort_order: Number(row.sort_order) || 0,
      is_active: Number(row.is_active) || 0,
      updated_at: Number(row.updated_at) || NOW,
      parent_id: row.parent_id || null,
      level: Number(row.level) || 1,
      code: row.code || null
    })),
    add_ons: data.add_ons.map((row) => ({
      id: row.id,
      label: row.label,
      price: Number(row.price) || 0,
      group_key: row.group_key,
      is_active: Number(row.is_active) || 0,
      updated_at: Number(row.updated_at) || NOW
    })),
    components: data.components.map((row) => ({
      id: row.id,
      label: row.label,
      unit: row.unit || null,
      note: row.note || null,
      updated_at: Number(row.updated_at) || NOW
    })),
    products: data.products.map((row) => ({
      id: row.id,
      name: row.name,
      category_id: row.category || row.category_id || null,
      price: Number(row.price) || 0,
      cost_price: Number(row.costPrice ?? row.cost_price) || 0,
      barcode: row.barcode || null,
      image: row.image || null,
      description: row.description || null,
      component_ids: JSON.stringify(Array.isArray(row.componentIds) ? row.componentIds : []),
      min_stock: Number(row.minStock ?? row.min_stock) || 0,
      is_active: row.isActive === false || row.is_active === 0 ? 0 : 1,
      updated_at: Number(row.updatedAt ?? row.updated_at) || NOW,
      unit: row.unit || null,
      sku_code: row.skuCode || row.sku_code || row.id
    })),
    inventory: data.inventory.map((row) => ({
      product_id: row.product_id,
      qty_on_hand: Number(row.qty_on_hand) || 0,
      location: row.location || "main",
      updated_at: Number(row.updated_at) || NOW
    })),
    stock_movements: data.stock_movements.map((row) => ({
      id: row.id,
      product_id: row.product_id,
      movement_type: row.movement_type,
      qty_change: Number(row.qty_change) || 0,
      unit_cost: row.unit_cost == null ? null : Number(row.unit_cost),
      ref_type: row.ref_type || null,
      ref_id: row.ref_id || null,
      note: row.note || null,
      created_at: Number(row.created_at) || NOW
    })),
    suppliers: data.suppliers.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone || null,
      address: row.address || null,
      note: row.note || null,
      is_active: Number(row.is_active) || 0,
      updated_at: Number(row.updated_at) || NOW
    })),
    purchase_orders: data.purchase_orders,
    purchase_order_items: data.purchase_order_items,
    stock_issues: data.stock_issues,
    stock_issue_items: data.stock_issue_items,
    sales: data.sales,
    sale_items: data.sale_items,
    settings: data.settings
  };

  const productMap = new Map(tables.products.map((row) => [row.id, row]));
  const missingProducts = new Map();

  function ensureProduct(productId, productName) {
    if (!productId || productMap.has(productId) || missingProducts.has(productId)) return;
    missingProducts.set(productId, {
      id: productId,
      name: productName || productId,
      category_id: null,
      price: 0,
      cost_price: 0,
      barcode: productId,
      image: null,
      description: "Auto-created placeholder from Cloudflare live history",
      component_ids: "[]",
      min_stock: 0,
      is_active: 0,
      updated_at: NOW,
      unit: null,
      sku_code: productId
    });
  }

  tables.inventory.forEach((row) => ensureProduct(row.product_id));
  tables.stock_movements.forEach((row) => ensureProduct(row.product_id, row.product_name || row.product_id));
  tables.purchase_order_items.forEach((row) => ensureProduct(row.product_id, row.product_name || row.product_id));
  tables.stock_issue_items.forEach((row) => ensureProduct(row.product_id, row.product_name || row.product_id));
  tables.sale_items.forEach((row) => ensureProduct(row.product_id, row.product_name || row.product_id));

  if (missingProducts.size) {
    tables.products = tables.products.concat(Array.from(missingProducts.values()));
  }

  return tables;
}

function buildStatements(tables) {
  return [
    ...buildUpsertStatements("categories", ["id", "label", "icon", "sort_order", "is_active", "updated_at", "parent_id", "level", "code"], tables.categories, { conflict: ["id"] }),
    ...buildUpsertStatements("add_ons", ["id", "label", "price", "group_key", "is_active", "updated_at"], tables.add_ons, { conflict: ["id"] }),
    ...buildUpsertStatements("components", ["id", "label", "unit", "note", "updated_at"], tables.components, { conflict: ["id"] }),
    ...buildUpsertStatements("products", ["id", "name", "category_id", "price", "cost_price", "barcode", "image", "description", "component_ids", "min_stock", "is_active", "updated_at", "unit", "sku_code"], tables.products, { conflict: ["id"] }),
    ...buildUpsertStatements("inventory", ["product_id", "qty_on_hand", "location", "updated_at"], tables.inventory, { conflict: ["product_id"] }),
    ...buildUpsertStatements("stock_movements", ["id", "product_id", "movement_type", "qty_change", "unit_cost", "ref_type", "ref_id", "note", "created_at"], tables.stock_movements, { conflict: ["id"] }),
    ...buildUpsertStatements("suppliers", ["id", "name", "phone", "address", "note", "is_active", "updated_at"], tables.suppliers, { conflict: ["id"] }),
    ...buildUpsertStatements("purchase_orders", ["id", "supplier_id", "supplier_name", "total_amount", "paid_amount", "payment_method", "status", "note", "created_at"], tables.purchase_orders, { conflict: ["id"] }),
    ...buildUpsertStatements("purchase_order_items", ["id", "purchase_id", "product_id", "product_name", "qty", "unit_cost", "subtotal"], tables.purchase_order_items, { conflict: ["id"] }),
    ...buildUpsertStatements("stock_issues", ["id", "reason", "note", "status", "created_at"], tables.stock_issues, { conflict: ["id"] }),
    ...buildUpsertStatements("stock_issue_items", ["id", "issue_id", "product_id", "product_name", "qty", "unit_cost"], tables.stock_issue_items, { conflict: ["id"] }),
    ...buildUpsertStatements("sales", ["id", "order_id", "customer_name", "subtotal", "vat_amount", "discount", "total", "paid", "change_amount", "payment_method", "cashier_name", "payment_status", "order_status", "note", "created_at"], tables.sales, { conflict: ["id"] }),
    ...buildUpsertStatements("sale_items", ["id", "sale_id", "product_id", "product_name", "qty", "unit_price", "addons_json", "addons_total", "line_total", "unit_cost"], tables.sale_items, { conflict: ["id"] }),
    ...buildUpsertStatements("settings", ["key", "value", "updated_at"], tables.settings, { conflict: ["key"], jsonColumns: ["value"], chunkSize: 20 })
  ];
}

async function main() {
  console.log(`Fetching live Cloudflare data from ${CLOUDFLARE_BASE} ...`);
  const rawData = await fetchAllData();
  const tables = normalizeTables(rawData);
  const summary = Object.fromEntries(Object.entries(tables).map(([key, value]) => [key, value.length]));
  console.log(JSON.stringify(summary, null, 2));

  const statements = buildStatements(tables);
  await runBatch("cloudflare -> supabase copy", statements);

  const outPath = path.join(SUPABASE_DIR, "cloudflare-live-export.json");
  fs.writeFileSync(outPath, JSON.stringify({
    exported_at: new Date().toISOString(),
    source: CLOUDFLARE_BASE,
    tables
  }, null, 2) + "\n", "utf8");
  console.log(`\nSaved live snapshot to ${outPath}`);
}

main().catch((error) => {
  console.error("\nClone failed.");
  console.error(error.message || error);
  if (error.data) {
    console.error(JSON.stringify(error.data, null, 2));
  }
  process.exit(1);
});
