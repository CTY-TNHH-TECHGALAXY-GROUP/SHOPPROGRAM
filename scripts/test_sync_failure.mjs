import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const values = new Map();
const localStorage = {
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) { values.set(key, value); },
};
let serverError = "inventory_product_id_fkey";
const window = {
  localStorage,
  crypto: { randomUUID: () => "op-rename-test" },
  addEventListener() {},
  setTimeout() { return 1; },
  clearTimeout() {},
};
vm.runInNewContext(readFileSync(new URL("../src/sync.js", import.meta.url), "utf8"), {
  window,
  localStorage,
  navigator: { onLine: true },
  crypto: window.crypto,
  fetch: async () => ({ ok: false, status: 500, json: async () => ({ ok: false, error: serverError }) }),
});

const failures = [];
window.ShopFlowSync.on("failure", (event) => failures.push(event));
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
console.log("Sync keeps failed writes and limits repeated error notices");
