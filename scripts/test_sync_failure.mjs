import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const values = new Map();
const localStorage = {
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) { values.set(key, value); },
};
let serverError = "inventory_product_id_fkey";
let nextOp = 0;
const sent = [];
const window = {
  localStorage,
  crypto: { randomUUID: () => "op-" + ++nextOp },
  addEventListener() {},
  setTimeout() { return 1; },
  clearTimeout() {},
};
vm.runInNewContext(readFileSync(new URL("../src/sync.js", import.meta.url), "utf8"), {
  window,
  localStorage,
  navigator: { onLine: true },
  crypto: window.crypto,
  fetch: async (path) => {
    sent.push(path);
    return serverError
      ? { ok: false, status: 500, json: async () => ({ ok: false, error: serverError }) }
      : { ok: true, status: 200, json: async () => ({ ok: true }) };
  },
});

const failures = [];
const successes = [];
window.ShopFlowSync.on("failure", (event) => failures.push(event));
window.ShopFlowSync.on("success", (event) => successes.push(event));
window.ShopFlowSync.enqueue({
  endpoint: "/products/rename",
  method: "POST",
  body: { oldId: "OLD", newId: "NEW" },
});
await new Promise(setImmediate);
assert.equal(failures.length, 1);
assert.equal(window.ShopFlowSync._outbox().length, 1);
assert.match(window.ShopFlowSync.getStatus().lastError, /\/products\/rename/);

await window.ShopFlowSync.flush().catch(() => {});
assert.equal(failures.length, 1, "same failure should not repeat the toast immediately");
assert.equal(window.ShopFlowSync._outbox().length, 1, "failed write must remain queued");

serverError = "different server error";
await window.ShopFlowSync.flush().catch(() => {});
assert.equal(failures.length, 2, "a changed error should be shown");
window.ShopFlowSync.enqueue({ endpoint: "/products", method: "POST", body: { id: "NEW" } });
await new Promise(setImmediate);
assert.equal(sent.includes("/api/products"), false, "dependent write must wait behind the rename");

serverError = null;
await window.ShopFlowSync.flush();
assert.deepEqual(sent.slice(-2), ["/api/products/rename", "/api/products"]);
assert.equal(successes.length, 2);
assert.equal(window.ShopFlowSync._outbox().length, 0);
console.log("Sync keeps order, limits repeated notices, and drains after recovery");
