"""
Generates database/cloudflare/migrations/0004_oria_master.sql from
database/data/SHOPHOUSE_GIA_MENU_FOR_WEB_with_unit.xlsx.

The xlsx is organized as section-headers + product rows:
    A=ORIA61000   B="1. ĐỒ ĂN NHANH..."         (section header, level-2 category)
    A=ORIA61001   B="PHO GA DE NHAT..."  C=Unit  D=price  (product row)
    ...
Some rows are stray "Item Name / Unit / Proposed Selling Price (VND)" repeats
(noise) — we skip them.

Price quirk:  values < 100 are entered in thousand-units (e.g. 49.5 = 49,500
VND, 5 = 5,000 VND). We multiply by 1000 in that case.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "database" / "data"
XLSX_DUMP = DATA_DIR / "xlsx_dump.json"
OUT_SQL = ROOT / "database" / "cloudflare" / "migrations" / "0004_oria_master.sql"

# Hand-coded full category list (from the user-provided table).
# id    = stable slug used everywhere in the app
# code  = the 5-digit ORIA category code from the xlsx
# parent= slug of parent or None
LEVEL1 = [
    ("fruits",            "10000", "Trái cây / Fruits",                                                              "🍎"),
    ("smoothies",         "20000", "Sinh tố / Smoothies",                                                            "🥤"),
    ("juices",            "30000", "Nước ép / Juices",                                                               "🍊"),
    ("nutritious-drinks", "40000", "Thức uống dinh dưỡng / Nutritious Drinks",                                       "💪"),
    ("refreshing-drinks", "50000", "Thức uống giải khát / Refreshing Beverages",                                     "🧃"),
    ("essentials",        "60000", "Nhu yếu phẩm / Essentials & Convenience Goods",                                  "🛒"),
]
LEVEL2 = [
    ("snacks",        "61000", "essentials", "Đồ ăn nhanh và đồ ăn vặt / Fast Food & Snacks",                                        "🍿"),
    ("beverages",     "62000", "essentials", "Thức uống, sữa, ngũ cốc / Beverages, Milk & Cereals",                                  "🥛"),
    ("pantry",        "63000", "essentials", "Nguyên liệu khô và thực phẩm thiết yếu trong bếp / Pantry & Kitchen Staples",          "🥫"),
    ("personal-care", "64000", "essentials", "Chăm sóc cá nhân & vệ sinh / Personal Care & Hygiene",                                 "🧴"),
    ("household",     "65000", "essentials", "Đồ gia dụng, vệ sinh nhà cửa và hàng thiết yếu / Household, Cleaning & Home Essentials","🧹"),
    ("packaging",     "66000", "essentials", "Dụng cụ, bao bì, đồ dùng một lần / Utensils, Packaging & Disposable Food Ware",        "🥡"),
]

# Map ORIA code prefix (first 3 digits of last 5) to category slug.
# ORIA61xxx -> snacks, ORIA62xxx -> beverages, etc.
CODE_TO_SLUG = {
    "61": "snacks",
    "62": "beverages",
    "63": "pantry",
    "64": "personal-care",
    "65": "household",
    "66": "packaging",
}

NOISE_LABELS = {"item name", "item nam"}


def normalize_price(raw) -> int:
    """xlsx mixes K and full-VND values. <100 is K; >=100 is full."""
    if raw is None:
        return 0
    try:
        v = float(raw)
    except (TypeError, ValueError):
        return 0
    if v < 100:
        v *= 1000
    return int(round(v))


def pick_icon_for(name: str) -> str:
    n = (name or "").upper()
    if any(w in n for w in ("MI ", "MIEN", "PHO", "BUN", "UDON", "RAMYUN", "JIN ")):
        return "🍜"
    if any(w in n for w in ("BANH ", "B.OREO", "B.QUE", "SNACK", "KHOAITAY", "KTC ", "TOKPOKKI")):
        return "🍪"
    if any(w in n for w in ("KEO", "G.XYLITOL")):
        return "🍬"
    if any(w in n for w in ("MILO", "CACAO", "NESCAFE", "N.COC", "NGU COC", "BNC ")):
        return "🥛"
    if any(w in n for w in ("BIA ", "RUOU")):
        return "🍺"
    if any(w in n for w in ("N.T.KHIET", "N.NT", "NUOC T.", "DASANI", "AQUARIUS", "AQUAFINA", "SPRITE", "COCA", "REDBULL", "NGK ", "NTL ", "NUOC ", "NTT ")):
        return "🥤"
    if any(w in n for w in ("TUONG", "XOT", "N.TUONG", "N.MAM", "MUOI", "DUONG", "DAU ", "BOT ", "HAT ", "PHO TAI", "TAO KHO", "DAU ", "VAI THIEU", "DA ME", "BO TV", "BO THUC")):
        return "🥫"
    if any(w in n for w in ("KDR ", "BCDR", "BAN CHAI", "BAN CHAY", "NSM ", "TAM", "BVS", "BUS", "BANG ", "DAY CHA", "DCR ", "K.TRANG", "KEM CAO")):
        return "🧴"
    if any(w in n for w in ("BO OMO", "BQ ", "XBT ", "VIEN TREO", "SAP THOM", "NON ")):
        return "🧹"
    if any(w in n for w in ("DUA ", "BICH", "LY ", "TO ", "DIA ", "TOGIAY", "CHEN", "KHAY", "GIAY ", "MANG ", "B.THAM", "TUI ", "BAO TAY", "KHAN ", "GVS ", "K.GIAY")):
        return "🥡"
    return "🛒"


def main():
    if not XLSX_DUMP.exists():
        print(f"missing {XLSX_DUMP}; run the dump step first", file=sys.stderr)
        sys.exit(1)
    rows = json.load(XLSX_DUMP.open(encoding="utf-8"))

    products = []
    for r in rows:
        if not r:
            continue
        a = (r[0] or "").strip() if len(r) > 0 and r[0] else ""
        b = (r[1] or "").strip() if len(r) > 1 and r[1] else ""
        c = (r[2] or "").strip() if len(r) > 2 and r[2] else ""
        d = r[3] if len(r) > 3 else None

        m = re.match(r"^ORIA(\d{2})(\d{3})$", a)
        if not m:
            continue
        cat_prefix, sub = m.group(1), m.group(2)
        # Section header rows have sub == "000".
        if sub == "000":
            continue
        # Skip "Item Name" noise rows.
        if b.lower() in NOISE_LABELS:
            continue
        slug = CODE_TO_SLUG.get(cat_prefix)
        if not slug:
            continue

        price = normalize_price(d)
        if price <= 0:
            # Some rows in the source had blank price; keep them so the user
            # sees the SKU but mark price 0 — they can edit later.
            price = 0

        products.append({
            "id": a,                       # e.g. ORIA61001 — stable across sources
            "sku_code": a,
            "name": b,
            "unit": c or None,
            "price": price,
            "category": slug,
            "icon": pick_icon_for(b),
        })

    # ---- write SQL ----
    out = []
    out.append("-- Migration 0004 — Oria master menu / SHOPHOUSE_GIA_MENU.")
    out.append("-- Generated from SHOPHOUSE_GIA_MENU_FOR_WEB_with_unit.xlsx")
    out.append(f"-- {len(LEVEL1) + len(LEVEL2)} categories, {len(products)} products")
    out.append("--")
    out.append("-- Strategy:")
    out.append("--   1. Soft-deactivate everything that's already in the DB so the UI")
    out.append("--      doesn't show old fruit-house demo data alongside the new master.")
    out.append("--   2. Upsert the 12 categories with hierarchy.")
    out.append("--   3. Upsert all products + create matching 0-quantity inventory rows.")
    out.append("--")
    out.append("PRAGMA foreign_keys = ON;")
    out.append("")
    out.append("-- 1) Deactivate previous demo data ----------------------------------")
    out.append("UPDATE products   SET is_active = 0, updated_at = strftime('%s','now')*1000 WHERE id LIKE 'p-%';")
    out.append("UPDATE categories SET is_active = 0, updated_at = strftime('%s','now')*1000 WHERE id IN ('fresh-juice','smoothie','cut-fruit','fruit-box','combo');")
    out.append("")

    out.append("-- 2) Categories (level 1) -------------------------------------------")
    for slug, code, label, icon in LEVEL1:
        out.append(
            "INSERT INTO categories (id, label, icon, sort_order, is_active, updated_at, parent_id, level, code) VALUES "
            f"('{slug}', '{label.replace(chr(39), chr(39)*2)}', '{icon}', {int(code)}, 1, strftime('%s','now')*1000, NULL, 1, '{code}') "
            "ON CONFLICT(id) DO UPDATE SET label=excluded.label, icon=excluded.icon, sort_order=excluded.sort_order, is_active=1, "
            "parent_id=excluded.parent_id, level=excluded.level, code=excluded.code, updated_at=excluded.updated_at;"
        )
    out.append("")
    out.append("-- 2b) Categories (level 2 - children of essentials) -----------------")
    for slug, code, parent, label, icon in LEVEL2:
        out.append(
            "INSERT INTO categories (id, label, icon, sort_order, is_active, updated_at, parent_id, level, code) VALUES "
            f"('{slug}', '{label.replace(chr(39), chr(39)*2)}', '{icon}', {int(code)}, 1, strftime('%s','now')*1000, '{parent}', 2, '{code}') "
            "ON CONFLICT(id) DO UPDATE SET label=excluded.label, icon=excluded.icon, sort_order=excluded.sort_order, is_active=1, "
            "parent_id=excluded.parent_id, level=excluded.level, code=excluded.code, updated_at=excluded.updated_at;"
        )
    out.append("")

    out.append("-- 3) Products ------------------------------------------------------")
    for p in products:
        name_sql = p["name"].replace("'", "''")
        unit_sql = "NULL" if not p["unit"] else f"'{p['unit'].replace(chr(39), chr(39)*2)}'"
        out.append(
            "INSERT INTO products (id, name, category_id, price, cost_price, barcode, image, description, "
            "component_ids, min_stock, is_active, updated_at, unit, sku_code) VALUES "
            f"('{p['id']}', '{name_sql}', '{p['category']}', {p['price']}, 0, '{p['id']}', '{p['icon']}', NULL, '[]', 0, 1, "
            f"strftime('%s','now')*1000, {unit_sql}, '{p['sku_code']}') "
            "ON CONFLICT(id) DO UPDATE SET name=excluded.name, category_id=excluded.category_id, "
            "price=excluded.price, barcode=excluded.barcode, image=excluded.image, "
            "is_active=1, updated_at=excluded.updated_at, unit=excluded.unit, sku_code=excluded.sku_code;"
        )
    out.append("")

    out.append("-- 4) Inventory rows (0 qty — user nhập hàng for opening stock) -----")
    for p in products:
        out.append(
            "INSERT INTO inventory (product_id, qty_on_hand, location, updated_at) VALUES "
            f"('{p['id']}', 0, 'main', strftime('%s','now')*1000) ON CONFLICT(product_id) DO NOTHING;"
        )

    OUT_SQL.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_SQL} ({len(products)} products, {len(LEVEL1)+len(LEVEL2)} categories)")


if __name__ == "__main__":
    main()
