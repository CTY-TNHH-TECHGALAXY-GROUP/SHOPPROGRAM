"""
E2E simulator for ShopFlow POS sales flow.

Goal: prove that a sale request lands correctly in D1 and the inventory + ledger
are updated atomically and arithmetically correct.

Scenario:
  1. Pick 3 real products from /api/products.
  2. Look up by *name* (user requirement: nhập tên SP để thêm vào đơn).
  3. Build a 3-line cart with mixed quantities, simulate add-on extras.
  4. Compute subtotal / VAT / total / change client-side (same math the UI does).
  5. POST to /api/sales with idempotency clientOpId.
  6. Re-fetch /api/sales/:id and /api/products and verify:
       - sale total == client total
       - stock decreased by sold qty
       - stock_movements has SALE rows with qty_change < 0
  7. Replay the same POST → server must answer duplicate=true (idempotency).
"""

import json
import sys
import urllib.request
import urllib.error
import uuid

BASE = "https://shopprogram.pages.dev"
VAT_RATE = 0.08  # matches VAT_RATE in src/app.js


def http(method, path, body=None):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "ShopFlowE2E/1.0",
        },
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode("utf-8")
            return r.status, json.loads(raw)
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, {"raw": raw[:300]}


def banner(t):
    print()
    print("=" * 70)
    print(t)
    print("=" * 70)


def find_by_name(products, query):
    """Naive 'nhập tên SP' lookup: case-insensitive contains."""
    q = query.lower()
    matches = [p for p in products if q in p["name"].lower()]
    return matches


def fmt_vnd(n):
    return f"{int(n):,} VND"


def main():
    banner("STEP 1 — Pull catalog")
    code, data = http("GET", "/api/products")
    assert code == 200 and data["ok"], data
    products = data["products"]
    inv_before = {p["id"]: p["stock"] for p in products}
    print(f"  Loaded {len(products)} products from D1")

    banner("STEP 2 — Lookup by NAME (user requirement)")
    queries = ["OREO", "DASANI", "MILO"]
    cart_inputs = []  # (product, qty_chosen)
    qty_choices = [3, 5, 2]
    for q, qty in zip(queries, qty_choices):
        matches = find_by_name(products, q)
        print(f"  query='{q}' → {len(matches)} match(es)")
        if not matches:
            print(f"  ! No product matches '{q}' — aborting test")
            sys.exit(1)
        chosen = matches[0]
        print(f"    → pick: {chosen['id']:<12} {chosen['name']!r:<48} price={fmt_vnd(chosen['price'])}  stock={chosen['stock']}")
        cart_inputs.append((chosen, qty))

    banner("STEP 3 — Build cart + arithmetic (client-side)")
    items_payload = []
    subtotal_client = 0
    for p, qty in cart_inputs:
        unit_price = int(p["price"])
        # Apply a fake +5000 addon on the 2nd line to stress the math.
        addon_total = 5000 if p == cart_inputs[1][0] else 0
        line_total = (unit_price + addon_total) * qty
        subtotal_client += line_total
        items_payload.append({
            "productId": p["id"],
            "productName": p["name"],
            "qty": qty,
            "unitPrice": unit_price + addon_total,
            "addonsTotal": addon_total,
            "lineTotal": line_total,
            "addons": ([{"id": "test-extra", "label": "Test Extra", "price": 5000}]
                       if addon_total else []),
        })
        print(f"  + {qty} × {p['name'][:36]:<36} unit={fmt_vnd(unit_price)}  addons={fmt_vnd(addon_total)}  line={fmt_vnd(line_total)}")

    vat = round(subtotal_client * VAT_RATE)
    total = subtotal_client + vat
    paid = ((total + 9999) // 10000) * 10000  # round up to nearest 10k
    change = paid - total
    print(f"\n  Subtotal: {fmt_vnd(subtotal_client)}")
    print(f"  VAT 8% : {fmt_vnd(vat)}")
    print(f"  TOTAL   : {fmt_vnd(total)}")
    print(f"  Paid    : {fmt_vnd(paid)}")
    print(f"  Change  : {fmt_vnd(change)}")

    banner("STEP 4 — POST /api/sales")
    client_op_id = str(uuid.uuid4())
    sale_body = {
        "clientOpId": client_op_id,
        "orderId": "TEST-" + client_op_id[:8],
        "customerName": "E2E Tester",
        "paymentMethod": "Tiền mặt / Cash",
        "cashierName": "E2E Bot",
        "subtotal": subtotal_client,
        "vatAmount": vat,
        "discount": 0,
        "total": total,
        "paid": paid,
        "changeAmount": change,
        "items": items_payload,
    }
    code, data = http("POST", "/api/sales", sale_body)
    print("  Status:", code, "Body:", data)
    assert code == 200 and data["ok"], "sale POST failed"
    sale_id = data["id"]
    print("  → Sale ID:", sale_id)

    banner("STEP 5 — Verify sale row matches client math")
    code, data = http("GET", f"/api/sales/{sale_id}")
    assert code == 200, data
    sale_row = data["sale"]
    items_row = data["items"]
    ok_total = sale_row["total"] == total
    ok_vat   = sale_row["vat_amount"] == vat
    ok_sub   = sale_row["subtotal"] == subtotal_client
    ok_items_count = len(items_row) == len(items_payload)
    print(f"  sale.subtotal = {fmt_vnd(sale_row['subtotal'])}  (client: {fmt_vnd(subtotal_client)})  {'✓' if ok_sub else '✗'}")
    print(f"  sale.vat      = {fmt_vnd(sale_row['vat_amount'])}  (client: {fmt_vnd(vat)})  {'✓' if ok_vat else '✗'}")
    print(f"  sale.total    = {fmt_vnd(sale_row['total'])}  (client: {fmt_vnd(total)})  {'✓' if ok_total else '✗'}")
    print(f"  items_count   = {len(items_row)}  expected {len(items_payload)}  {'✓' if ok_items_count else '✗'}")
    line_ok = True
    for client_it, db_it in zip(items_payload, items_row):
        match = (
            db_it["qty"] == client_it["qty"]
            and db_it["unit_price"] == client_it["unitPrice"]
            and db_it["line_total"] == client_it["lineTotal"]
        )
        line_ok = line_ok and match
        print(f"    line {client_it['productId']}: qty {db_it['qty']}={client_it['qty']}  "
              f"unit_price {db_it['unit_price']}={client_it['unitPrice']}  "
              f"line_total {db_it['line_total']}={client_it['lineTotal']}  "
              f"{'✓' if match else '✗'}")

    banner("STEP 6 — Verify inventory decremented atomically")
    code, data = http("GET", "/api/products")
    inv_after = {p["id"]: p["stock"] for p in data["products"]}
    stock_ok = True
    for p, qty in cart_inputs:
        before = inv_before.get(p["id"], 0)
        after = inv_after.get(p["id"], 0)
        expected = before - qty
        ok = after == expected
        stock_ok = stock_ok and ok
        print(f"  {p['id']:<12} before={before}  qty_sold={qty}  after={after}  expected={expected}  {'✓' if ok else '✗'}")

    banner("STEP 7 — Verify stock_movements ledger has SALE rows")
    # Sum SALE qty_change per product for this sale.
    code, mv_data = http("GET", "/api/inventory/movements?limit=50")
    related = [m for m in mv_data["movements"] if m["ref_id"] == sale_id]
    print(f"  Found {len(related)} movement(s) tagged ref_id={sale_id}")
    move_ok = True
    for p, qty in cart_inputs:
        rows = [m for m in related if m["product_id"] == p["id"]]
        if not rows:
            print(f"  ! No SALE movement found for {p['id']}")
            move_ok = False
            continue
        delta = sum(r["qty_change"] for r in rows)
        ok = delta == -qty
        move_ok = move_ok and ok
        print(f"  {p['id']:<12} ledger qty_change sum={delta}  expected={-qty}  {'✓' if ok else '✗'}")

    banner("STEP 8 — Idempotency: replay same POST")
    code, data2 = http("POST", "/api/sales", sale_body)
    is_dup = data2.get("duplicate") is True
    print(f"  Replay status={code} duplicate={is_dup}  {'✓' if is_dup else '✗'}")

    banner("RESULT")
    all_ok = ok_sub and ok_vat and ok_total and ok_items_count and line_ok and stock_ok and move_ok and is_dup
    if all_ok:
        print("  ✅ E2E PASS — sale persisted, ledger correct, idempotency works")
    else:
        print("  ❌ E2E FAILED — see ✗ above")
        sys.exit(2)


if __name__ == "__main__":
    main()
