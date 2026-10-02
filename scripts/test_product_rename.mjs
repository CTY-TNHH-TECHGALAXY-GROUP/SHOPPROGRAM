import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { onRequestPost } from "../functions/api/products/rename.js";

const statements = [];
const db = {
  prepare(sql) {
    return {
      sql,
      args: [],
      bind(...args) { this.args = args; return this; },
      async first() {
        if (sql.startsWith("SELECT id, barcode")) return { id: "OLD", barcode: "123456789" };
        return null;
      },
    };
  },
  async batch(batch) { statements.push(...batch); },
};

const response = await onRequestPost({
  env: { DB: db },
  request: new Request("http://localhost/api/products/rename", {
    method: "POST",
    body: JSON.stringify({ oldId: "OLD", newId: "NEW", clientOpId: "rename-test" }),
  }),
});
assert.equal(response.status, 200);
assert.equal((await response.json()).newId, "NEW");

const quote = (value) => value == null ? "NULL" : typeof value === "number"
  ? String(value) : `'${String(value).replace(/'/g, "''")}'`;
const sql = statements.map(({ sql, args }) => {
  let index = 0;
  return sql.replace(/\?/g, () => quote(args[index++])) + ";";
}).join("\n");

const setup = `
.bail on
PRAGMA foreign_keys = ON;
CREATE TABLE products (
  id TEXT PRIMARY KEY, name TEXT, category_id TEXT, price INTEGER, cost_price INTEGER,
  barcode TEXT UNIQUE, image TEXT, description TEXT, component_ids TEXT,
  min_stock INTEGER, is_active INTEGER, updated_at INTEGER, unit TEXT,
  sku_code TEXT, inventory_mode TEXT
);
CREATE TABLE inventory (product_id TEXT REFERENCES products(id), qty_on_hand INTEGER);
CREATE TABLE sale_items (product_id TEXT REFERENCES products(id));
CREATE TABLE stock_movements (product_id TEXT REFERENCES products(id));
CREATE TABLE purchase_order_items (product_id TEXT REFERENCES products(id));
CREATE TABLE stock_issue_items (product_id TEXT REFERENCES products(id));
CREATE TABLE sync_log (client_op_id TEXT PRIMARY KEY, op_type TEXT, ref_id TEXT, applied_at INTEGER);
INSERT INTO products VALUES ('OLD','Product',NULL,100,50,'123456789',NULL,NULL,'[]',0,1,1,'kg','OLD','stock');
INSERT INTO inventory VALUES ('OLD',17);
INSERT INTO sale_items VALUES ('OLD');
INSERT INTO stock_movements VALUES ('OLD');
INSERT INTO purchase_order_items VALUES ('OLD');
INSERT INTO stock_issue_items VALUES ('OLD');
BEGIN;
${sql}
COMMIT;
SELECT id || '|' || barcode || '|' || sku_code FROM products;
SELECT product_id || '|' || qty_on_hand FROM inventory;
SELECT product_id FROM sale_items;
SELECT product_id FROM stock_movements;
SELECT product_id FROM purchase_order_items;
SELECT product_id FROM stock_issue_items;
SELECT ref_id FROM sync_log;
`;
const result = execFileSync("sqlite3", [":memory:"], { input: setup, encoding: "utf8" }).trim().split("\n");
assert.deepEqual(result, ["NEW|123456789|NEW", "NEW|17", "NEW", "NEW", "NEW", "NEW", "NEW"]);
console.log("Product rename keeps barcode, stock, and all product references");
