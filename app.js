(function () {
  var root = document.getElementById("root");

  if (!root) {
    return;
  }

  if (!window.React || !window.ReactDOM || !window.htm) {
    root.innerHTML =
      '<div style="padding:24px;font-family:sans-serif;color:#5b3a20">Khong tai duoc thu vien giao dien. Hay mo lai trang khi co ket noi internet.</div>';
    return;
  }

  var useEffect = window.React.useEffect;
  var useMemo = window.React.useMemo;
  var useRef = window.React.useRef;
  var useState = window.React.useState;
  var html = window.htm.bind(window.React.createElement);

  var STORAGE_KEY = "fruit-house-pos-suite-v3";
  var APP_VERSION = "3.4.0";
  var VAT_RATE = 0.08;
  var LANGUAGE_OPTIONS = [
    { id: "vi", label: "VI" },
    { id: "en", label: "EN" }
  ];
  var PAYMENT_METHOD_OPTIONS = [
    { value: "Tiền mặt / Cash", label: "Tiền mặt / Cash" },
    { value: "Thẻ / Card", label: "Thẻ / Card" },
    { value: "Chuyển khoản / Bank Transfer", label: "Chuyển khoản / Bank Transfer" },
    { value: "Ví điện tử / E-wallet", label: "Ví điện tử / E-wallet" }
  ];

  var FILTER_ALL_CATEGORY = { id: "all", label: "Tất cả / All", icon: "🍊" };
  var DEFAULT_CATEGORY_OPTIONS = [
    { id: "fresh-juice", label: "Nước ép / Fresh Juice", icon: "🍹" },
    { id: "smoothie", label: "Sinh tố / Smoothie", icon: "🥤" },
    { id: "cut-fruit", label: "Trái cây cắt / Cut Fruit", icon: "🍍" },
    { id: "fruit-box", label: "Hộp trái cây / Fruit Box", icon: "📦" },
    { id: "combo", label: "Combo / Combo", icon: "✨" }
  ];

  var DEFAULT_ADD_ON_OPTIONS = [
    { id: "sugar-50", label: "50% đường / Sugar 50%", price: 0, group: "sweetness" },
    { id: "sugar-0", label: "Không đường / No Sugar", price: 0, group: "sweetness" },
    { id: "ice-less", label: "Ít đá / Less Ice", price: 0, group: "ice" },
    { id: "ice-none", label: "Không đá / No Ice", price: 0, group: "ice" },
    { id: "chia", label: "Hạt chia / Chia Seeds", price: 8000, group: "extras" },
    { id: "aloe", label: "Nha đam / Aloe Vera", price: 7000, group: "extras" },
    { id: "yogurt", label: "Sữa chua Hy Lạp / Greek Yogurt", price: 12000, group: "extras" },
    { id: "protein", label: "Protein thêm / Protein Shot", price: 15000, group: "extras" }
  ];

  var DEFAULT_COMPONENT_OPTIONS = [
    { id: "orange", label: "Cam / Orange", unit: "trái / fruits", note: "Nguyên liệu nước ép cam / Juice base" },
    { id: "watermelon", label: "Dưa hấu / Watermelon", unit: "gram", note: "Nguyên liệu lạnh / Chilled prep" },
    { id: "mint", label: "Lá bạc hà / Mint", unit: "lá / leaves", note: "Trang trí và tạo mùi / Garnish" },
    { id: "honey", label: "Mật ong / Honey", unit: "ml", note: "Tăng vị ngọt / Sweetener" },
    { id: "yogurt-base", label: "Sữa chua / Yogurt", unit: "gram", note: "Base cho smoothie / Smoothie base" },
    { id: "chia-base", label: "Hạt chia / Chia Seeds", unit: "gram", note: "Topping mặc định / Default topping" }
  ];

  var DEFAULT_PRODUCTS = [
    {
      id: "p-orange-juice",
      name: "Cam Mat Ong",
      category: "fresh-juice",
      price: 45000,
      stock: 28,
      barcode: "TFH-001",
      image: "🍊",
      description: "Cam tuoi ep cung mat ong rung."
    },
    {
      id: "p-watermelon",
      name: "Dua Hau Mat Lanh",
      category: "fresh-juice",
      price: 42000,
      stock: 24,
      barcode: "TFH-002",
      image: "🍉",
      description: "Nuoc dua hau it da, giai nhiet nhanh."
    },
    {
      id: "p-pineapple",
      name: "Dua Thom Mint",
      category: "fresh-juice",
      price: 47000,
      stock: 18,
      barcode: "TFH-003",
      image: "🍍",
      description: "Thom ep cung la bac ha."
    },
    {
      id: "p-detox",
      name: "Detox Xanh",
      category: "fresh-juice",
      price: 49000,
      stock: 16,
      barcode: "TFH-004",
      image: "🥒",
      description: "Cần tây, táo xanh, dưa leo."
    },
    {
      id: "p-mango",
      name: "Mango Smoothie",
      category: "smoothie",
      price: 58000,
      stock: 20,
      barcode: "TFH-005",
      image: "🥭",
      description: "Xoai xay cung sua chua."
    },
    {
      id: "p-berry",
      name: "Berry Boost",
      category: "smoothie",
      price: 62000,
      stock: 14,
      barcode: "TFH-006",
      image: "🫐",
      description: "Viet quat va dau tay dam vi."
    },
    {
      id: "p-avocado",
      name: "Bo Kem Dua",
      category: "smoothie",
      price: 64000,
      stock: 11,
      barcode: "TFH-007",
      image: "🥑",
      description: "Sinh to bo mem min voi dua."
    },
    {
      id: "p-dragon",
      name: "Dragon Glow",
      category: "smoothie",
      price: 59000,
      stock: 13,
      barcode: "TFH-008",
      image: "🐉",
      description: "Thanh long hồng và chuối."
    },
    {
      id: "p-cut-mix",
      name: "Hop Trai Cay Mix",
      category: "cut-fruit",
      price: 55000,
      stock: 17,
      barcode: "TFH-009",
      image: "🍇",
      description: "Mix dua, tao, nho, kiwi."
    },
    {
      id: "p-cut-tropical",
      name: "Tropical Cup",
      category: "cut-fruit",
      price: 52000,
      stock: 19,
      barcode: "TFH-010",
      image: "🥝",
      description: "Cup trai cay nhiet doi an lien."
    },
    {
      id: "p-box-family",
      name: "Fruit Box Family",
      category: "fruit-box",
      price: 145000,
      stock: 8,
      barcode: "TFH-011",
      image: "🧺",
      description: "Hộp lớn cho gia đình 3-4 người."
    },
    {
      id: "p-box-office",
      name: "Office Energy Box",
      category: "fruit-box",
      price: 99000,
      stock: 10,
      barcode: "TFH-012",
      image: "📦",
      description: "Fruit box gon cho van phong."
    },
    {
      id: "p-combo-breakfast",
      name: "Combo Sang Nhe",
      category: "combo",
      price: 79000,
      stock: 9,
      barcode: "TFH-013",
      image: "🌞",
      description: "1 juice + 1 cut fruit."
    },
    {
      id: "p-combo-clean",
      name: "Combo Clean Body",
      category: "combo",
      price: 119000,
      stock: 7,
      barcode: "TFH-014",
      image: "💚",
      description: "2 chai detox + hat chia."
    }
  ];

  var DEFAULT_SETTINGS = {
    storeName: "The Fruit House",
    brandLine: "THE FRUIT HOUSE",
    brandDisplayName: "OriaFarm",
    branchName: "Quầy Linh Trần",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    phone: "0909 123 456",
    taxId: "0312345678",
    cashierName: "Linh Tran",
    openHours: "07:00 - 22:00",
    receiptFooter: "Cảm ơn bạn đã ghé The Fruit House.",
    vatNote: "Hóa đơn VAT sẽ được gửi theo yêu cầu."
  };

  var DEFAULT_INVOICE_TEMPLATES = [
    {
      id: "invoice-classic",
      name: "Classic Receipt",
      title: "PHIẾU THANH TOÁN / RECEIPT",
      subtitle: "Nhanh gọn cho đơn mang đi / Fast takeaway format",
      footer: "Hẹn gặp lại quý khách / See you again.",
      showSubtitle: true,
      showAddress: true,
      showBranch: true,
      showPhone: true,
      showTaxId: true,
      showCashier: true,
      showCustomerName: true,
      showPaymentMethod: true,
      showCashReceived: true,
      showChangeDue: true,
      showOrderMeta: true
    },
    {
      id: "invoice-vat",
      name: "VAT Invoice",
      title: "HÓA ĐƠN VAT / VAT INVOICE",
      subtitle: "Thông tin cho doanh nghiệp / Business details",
      footer: "Vui lòng đối chiếu mã số thuế trước khi xuất / Please verify tax details before issuing.",
      showSubtitle: true,
      showAddress: true,
      showBranch: true,
      showPhone: true,
      showTaxId: true,
      showCashier: true,
      showCustomerName: true,
      showPaymentMethod: true,
      showCashReceived: true,
      showChangeDue: true,
      showOrderMeta: true
    }
  ];

  var DEFAULT_BARCODE_TEMPLATES = [
    {
      id: "barcode-retail",
      name: "Retail Sticker",
      prefix: "TFH",
      suffix: "01",
      width: 180,
      height: 72,
      printWidthMm: 90,
      printHeightMm: 55,
      title: "Tem bán lẻ / Retail Label",
      subtitle: "Dùng cho quầy / For counter sales",
      showName: true,
      showPrice: true,
      showStoreName: true,
      showCategory: true,
      showBarcodeValue: true,
      accent: "#db5d17"
    },
    {
      id: "barcode-shelf",
      name: "Shelf Label",
      prefix: "SHELF",
      suffix: "A",
      width: 220,
      height: 84,
      printWidthMm: 100,
      printHeightMm: 62,
      title: "Tem kệ hàng / Shelf Label",
      subtitle: "Dành cho trưng bày / For display",
      showName: true,
      showPrice: false,
      showStoreName: true,
      showCategory: true,
      showBarcodeValue: true,
      accent: "#6dbb59"
    }
  ];

  var EXPORT_TABLE_SCHEMAS = [
    {
      tableName: "products",
      columns: [
        { name: "product_id", type: "text", primaryKey: true },
        { name: "barcode", type: "text" },
        { name: "sku", type: "text" },
        { name: "product_name", type: "text" },
        { name: "category", type: "text" },
        { name: "size_ml", type: "integer" },
        { name: "price", type: "decimal" },
        { name: "vat_rate", type: "decimal" },
        { name: "active", type: "boolean" },
        { name: "created_at", type: "datetime" },
        { name: "updated_at", type: "datetime" }
      ]
    },
    {
      tableName: "ingredients",
      columns: [
        { name: "ingredient_id", type: "text", primaryKey: true },
        { name: "ingredient_name", type: "text" },
        { name: "category", type: "text" },
        { name: "unit", type: "text" },
        { name: "cost_per_unit", type: "decimal" },
        { name: "stock_qty", type: "decimal" },
        { name: "min_stock", type: "decimal" },
        { name: "supplier_id", type: "text", foreignKey: "suppliers.supplier_id" },
        { name: "active", type: "boolean" },
        { name: "created_at", type: "datetime" },
        { name: "updated_at", type: "datetime" }
      ]
    },
    {
      tableName: "product_ingredients",
      columns: [
        { name: "recipe_id", type: "text", primaryKey: true },
        { name: "product_id", type: "text", foreignKey: "products.product_id" },
        { name: "ingredient_id", type: "text", foreignKey: "ingredients.ingredient_id" },
        { name: "qty_used", type: "decimal" },
        { name: "unit", type: "text" },
        { name: "waste_rate", type: "decimal" },
        { name: "note", type: "text" },
        { name: "created_at", type: "datetime" },
        { name: "updated_at", type: "datetime" }
      ]
    },
    {
      tableName: "orders",
      columns: [
        { name: "order_id", type: "text", primaryKey: true },
        { name: "order_code", type: "text" },
        { name: "order_date", type: "date" },
        { name: "order_time", type: "time" },
        { name: "cashier_id", type: "text", foreignKey: "users.user_id" },
        { name: "customer_id", type: "text", foreignKey: "customers.customer_id" },
        { name: "subtotal", type: "decimal" },
        { name: "discount_amount", type: "decimal" },
        { name: "vat_amount", type: "decimal" },
        { name: "total_amount", type: "decimal" },
        { name: "payment_status", type: "text" },
        { name: "order_status", type: "text" },
        { name: "note", type: "text" },
        { name: "created_at", type: "datetime" }
      ]
    },
    {
      tableName: "order_items",
      columns: [
        { name: "order_item_id", type: "text", primaryKey: true },
        { name: "order_id", type: "text", foreignKey: "orders.order_id" },
        { name: "product_id", type: "text", foreignKey: "products.product_id" },
        { name: "barcode", type: "text" },
        { name: "product_name", type: "text" },
        { name: "qty", type: "decimal" },
        { name: "unit_price", type: "decimal" },
        { name: "discount_amount", type: "decimal" },
        { name: "vat_rate", type: "decimal" },
        { name: "vat_amount", type: "decimal" },
        { name: "line_total", type: "decimal" },
        { name: "created_at", type: "datetime" }
      ]
    },
    {
      tableName: "payments",
      columns: [
        { name: "payment_id", type: "text", primaryKey: true },
        { name: "order_id", type: "text", foreignKey: "orders.order_id" },
        { name: "payment_date", type: "date" },
        { name: "payment_time", type: "time" },
        { name: "method", type: "text" },
        { name: "amount", type: "decimal" },
        { name: "bank", type: "text" },
        { name: "transaction_ref", type: "text" },
        { name: "note", type: "text" },
        { name: "created_at", type: "datetime" }
      ]
    },
    {
      tableName: "customers",
      columns: [
        { name: "customer_id", type: "text", primaryKey: true },
        { name: "customer_name", type: "text" },
        { name: "phone", type: "text" },
        { name: "email", type: "text" },
        { name: "birthday", type: "date" },
        { name: "customer_group", type: "text" },
        { name: "total_spent", type: "decimal" },
        { name: "note", type: "text" },
        { name: "created_at", type: "datetime" },
        { name: "updated_at", type: "datetime" }
      ]
    },
    {
      tableName: "inventory_movements",
      columns: [
        { name: "movement_id", type: "text", primaryKey: true },
        { name: "movement_date", type: "date" },
        { name: "movement_time", type: "time" },
        { name: "movement_type", type: "text" },
        { name: "reference_type", type: "text" },
        { name: "reference_id", type: "text" },
        { name: "product_id", type: "text", foreignKey: "products.product_id" },
        { name: "ingredient_id", type: "text", foreignKey: "ingredients.ingredient_id" },
        { name: "qty_in", type: "decimal" },
        { name: "qty_out", type: "decimal" },
        { name: "unit", type: "text" },
        { name: "unit_cost", type: "decimal" },
        { name: "total_cost", type: "decimal" },
        { name: "balance_after", type: "decimal" },
        { name: "note", type: "text" },
        { name: "created_at", type: "datetime" }
      ]
    },
    {
      tableName: "suppliers",
      columns: [
        { name: "supplier_id", type: "text", primaryKey: true },
        { name: "supplier_name", type: "text" },
        { name: "phone", type: "text" },
        { name: "email", type: "text" },
        { name: "address", type: "text" },
        { name: "tax_code", type: "text" },
        { name: "contact_person", type: "text" },
        { name: "note", type: "text" },
        { name: "active", type: "boolean" },
        { name: "created_at", type: "datetime" },
        { name: "updated_at", type: "datetime" }
      ]
    },
    {
      tableName: "purchase_orders",
      columns: [
        { name: "purchase_id", type: "text", primaryKey: true },
        { name: "purchase_code", type: "text" },
        { name: "supplier_id", type: "text", foreignKey: "suppliers.supplier_id" },
        { name: "purchase_date", type: "date" },
        { name: "subtotal", type: "decimal" },
        { name: "vat_amount", type: "decimal" },
        { name: "total_amount", type: "decimal" },
        { name: "payment_status", type: "text" },
        { name: "note", type: "text" },
        { name: "created_at", type: "datetime" }
      ]
    },
    {
      tableName: "purchase_items",
      columns: [
        { name: "purchase_item_id", type: "text", primaryKey: true },
        { name: "purchase_id", type: "text", foreignKey: "purchase_orders.purchase_id" },
        { name: "ingredient_id", type: "text", foreignKey: "ingredients.ingredient_id" },
        { name: "ingredient_name", type: "text" },
        { name: "qty", type: "decimal" },
        { name: "unit", type: "text" },
        { name: "unit_cost", type: "decimal" },
        { name: "vat_rate", type: "decimal" },
        { name: "vat_amount", type: "decimal" },
        { name: "line_total", type: "decimal" },
        { name: "expiry_date", type: "date" },
        { name: "created_at", type: "datetime" }
      ]
    },
    {
      tableName: "cash_movements",
      columns: [
        { name: "cash_movement_id", type: "text", primaryKey: true },
        { name: "date", type: "date" },
        { name: "time", type: "time" },
        { name: "type", type: "text" },
        { name: "category", type: "text" },
        { name: "amount", type: "decimal" },
        { name: "payment_method", type: "text" },
        { name: "reference_id", type: "text" },
        { name: "description", type: "text" },
        { name: "created_by", type: "text", foreignKey: "users.user_id" },
        { name: "created_at", type: "datetime" }
      ]
    },
    {
      tableName: "users",
      columns: [
        { name: "user_id", type: "text", primaryKey: true },
        { name: "full_name", type: "text" },
        { name: "role", type: "text" },
        { name: "phone", type: "text" },
        { name: "email", type: "text" },
        { name: "active", type: "boolean" },
        { name: "created_at", type: "datetime" },
        { name: "updated_at", type: "datetime" }
      ]
    },
    {
      tableName: "shifts",
      columns: [
        { name: "shift_id", type: "text", primaryKey: true },
        { name: "user_id", type: "text", foreignKey: "users.user_id" },
        { name: "shift_date", type: "date" },
        { name: "start_time", type: "time" },
        { name: "end_time", type: "time" },
        { name: "opening_cash", type: "decimal" },
        { name: "closing_cash", type: "decimal" },
        { name: "expected_cash", type: "decimal" },
        { name: "cash_difference", type: "decimal" },
        { name: "note", type: "text" },
        { name: "created_at", type: "datetime" }
      ]
    },
    {
      tableName: "discounts",
      columns: [
        { name: "discount_id", type: "text", primaryKey: true },
        { name: "discount_name", type: "text" },
        { name: "discount_type", type: "text" },
        { name: "discount_value", type: "decimal" },
        { name: "start_date", type: "date" },
        { name: "end_date", type: "date" },
        { name: "active", type: "boolean" },
        { name: "note", type: "text" }
      ]
    },
    {
      tableName: "tax_settings",
      columns: [
        { name: "tax_id", type: "text", primaryKey: true },
        { name: "tax_name", type: "text" },
        { name: "tax_rate", type: "decimal" },
        { name: "applies_to", type: "text" },
        { name: "active", type: "boolean" },
        { name: "effective_from", type: "date" },
        { name: "effective_to", type: "date" }
      ]
    },
    {
      tableName: "daily_summary",
      columns: [
        { name: "date", type: "date", primaryKey: true },
        { name: "total_orders", type: "integer" },
        { name: "total_items_sold", type: "integer" },
        { name: "gross_revenue", type: "decimal" },
        { name: "discount_total", type: "decimal" },
        { name: "vat_output", type: "decimal" },
        { name: "net_revenue", type: "decimal" },
        { name: "cash_revenue", type: "decimal" },
        { name: "bank_transfer_revenue", type: "decimal" },
        { name: "card_revenue", type: "decimal" },
        { name: "total_cost", type: "decimal" },
        { name: "gross_profit", type: "decimal" },
        { name: "created_at", type: "datetime" }
      ]
    },
    {
      tableName: "settings",
      columns: [
        { name: "setting_key", type: "text", primaryKey: true },
        { name: "setting_value", type: "text" },
        { name: "description", type: "text" },
        { name: "updated_at", type: "datetime" }
      ]
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);
  }

  function getExportTableNames() {
    return EXPORT_TABLE_SCHEMAS.map(function (table) {
      return table.tableName;
    });
  }

  function formatExportDate(value) {
    if (!value) {
      return "";
    }

    var date = new Date(value);
    if (isNaN(date.getTime())) {
      return "";
    }

    return [
      date.getFullYear(),
      padNumber(date.getMonth() + 1, 2),
      padNumber(date.getDate(), 2)
    ].join("-");
  }

  function formatExportTime(value) {
    if (!value) {
      return "";
    }

    var date = new Date(value);
    if (isNaN(date.getTime())) {
      return "";
    }

    return [
      padNumber(date.getHours(), 2),
      padNumber(date.getMinutes(), 2),
      padNumber(date.getSeconds(), 2)
    ].join(":");
  }

  function formatExportDateTime(value) {
    if (!value) {
      return "";
    }

    var datePart = formatExportDate(value);
    var timePart = formatExportTime(value);
    return datePart && timePart ? datePart + " " + timePart : "";
  }

  function matchesExportDateRange(value, startDate, endDate) {
    if (!startDate && !endDate) {
      return true;
    }

    var datePart = formatExportDate(value);
    if (!datePart) {
      return false;
    }

    if (startDate && datePart < startDate) {
      return false;
    }

    if (endDate && datePart > endDate) {
      return false;
    }

    return true;
  }

  function toCsvBoolean(value) {
    return value ? "TRUE" : "FALSE";
  }

  function escapeCsvCell(value) {
    var stringValue = value === null || typeof value === "undefined" ? "" : String(value);
    if (/[",\n\r]/.test(stringValue)) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
  }

  function buildCsvContent(columns, rows) {
    var header = columns.join(",");
    var body = (rows || []).map(function (row) {
      return columns.map(function (columnName) {
        return escapeCsvCell(row[columnName]);
      }).join(",");
    }).join("\n");

    return "\uFEFF" + header + (body ? "\n" + body : "\n");
  }

  function padNumber(value, length) {
    return String(value).padStart(length, "0");
  }

  function getOrderDateKey(dateValue) {
    var date = new Date(dateValue || Date.now());
    return [
      padNumber(date.getDate(), 2),
      padNumber(date.getMonth() + 1, 2),
      date.getFullYear()
    ].join("/");
  }

  function buildOrderId(dateKey, sequenceNumber) {
    return dateKey + "-" + padNumber(sequenceNumber, 3);
  }

  var BARCODE_DETECT_FORMATS = ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "itf", "qr_code"];

  function normalizeBarcode(value) {
    return String(value || "").trim().toUpperCase();
  }

  function getBarcodeDigits(value) {
    return normalizeBarcode(value).replace(/\D+/g, "");
  }

  function getBarcodeCheckDigit(base12) {
    var digits = String(base12 || "")
      .replace(/\D+/g, "")
      .slice(0, 12)
      .split("")
      .map(function (digit) {
        return Number(digit) || 0;
      });

    if (digits.length !== 12) {
      return 0;
    }

    var sum = digits.reduce(function (total, digit, index) {
      return total + digit * (index % 2 === 0 ? 1 : 3);
    }, 0);

    return (10 - (sum % 10)) % 10;
  }

  function createEan13Barcode(seed) {
    var safeSeed = normalizeBarcode(seed) || "FRUIT-HOUSE";
    var hash = 0;
    for (var index = 0; index < safeSeed.length; index += 1) {
      hash = (hash * 31 + safeSeed.charCodeAt(index)) % 100000;
    }

    var base12 = "8938505" + padNumber(hash, 5);
    return base12 + String(getBarcodeCheckDigit(base12));
  }

  function getScannableBarcode(value, seed) {
    var normalizedValue = normalizeBarcode(value);
    var digits = getBarcodeDigits(normalizedValue);

    if (digits.length === 13 && digits === normalizedValue) {
      return digits;
    }

    if (digits.length === 12 && digits === normalizedValue) {
      return digits + String(getBarcodeCheckDigit(digits));
    }

    if (digits.length === 8 && digits === normalizedValue) {
      return digits;
    }

    return createEan13Barcode(seed || normalizedValue);
  }

  function getBarcodeFormat(value) {
    var normalizedValue = normalizeBarcode(value);
    var digits = getBarcodeDigits(normalizedValue);

    if (digits.length === 13 && digits === normalizedValue) {
      return "EAN13";
    }

    if (digits.length === 8 && digits === normalizedValue) {
      return "EAN8";
    }

    if (digits.length === 12 && digits === normalizedValue) {
      return "UPC";
    }

    return "CODE128";
  }

  function renderBarcodeMarkup(value, options) {
    var safeValue = normalizeBarcode(value);
    if (!safeValue || !window.JsBarcode) {
      return "";
    }

    try {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      window.JsBarcode(svg, safeValue, Object.assign({
        format: getBarcodeFormat(safeValue),
        displayValue: false,
        margin: 8,
        background: "transparent",
        lineColor: "#2f2116",
        width: 1.6,
        height: 42
      }, options || {}));
      return svg.outerHTML;
    } catch (error) {
      return "";
    }
  }

  function BarcodeGraphic(props) {
    var svgRef = useRef(null);

    useEffect(function () {
      if (!svgRef.current || !window.JsBarcode) {
        return;
      }

      try {
        window.JsBarcode(svgRef.current, normalizeBarcode(props.value), Object.assign({
          format: getBarcodeFormat(props.value),
          displayValue: false,
          margin: 8,
          background: "transparent",
          lineColor: "#2f2116",
          width: 1.6,
          height: 42
        }, props.options || {}));
      } catch (error) {
        svgRef.current.innerHTML = "";
      }
    }, [props.value, props.options]);

    return html`<svg ref=${svgRef} className=${props.className || ""}></svg>`;
  }

  function buildLabelPdfFileName() {
    var now = new Date();
    return "barcode_labels_" + [
      now.getFullYear(),
      padNumber(now.getMonth() + 1, 2),
      padNumber(now.getDate(), 2)
    ].join("-") + "_" + [
      padNumber(now.getHours(), 2),
      padNumber(now.getMinutes(), 2)
    ].join("-") + ".pdf";
  }

  function escapeSvgText(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadImageFromUrl(url) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () {
        resolve(image);
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  function whenFontsReady() {
    if (typeof document === "undefined" || !document.fonts || !document.fonts.ready) {
      return Promise.resolve();
    }

    return document.fonts.ready.catch(function () {
      return undefined;
    });
  }

  function drawRoundedRectPath(context, x, y, width, height, radius) {
    var safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
  }

  function wrapCanvasText(context, text, maxWidth, maxLines) {
    var safeText = String(text || "").trim();
    if (!safeText) {
      return [];
    }

    var words = safeText.split(/\s+/);
    var lines = [];
    var currentLine = words[0] || "";

    for (var index = 1; index < words.length; index += 1) {
      var testLine = currentLine + " " + words[index];
      if (context.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[index];
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var lastLine = lines[maxLines - 1];
      while (lastLine && context.measureText(lastLine + "…").width > maxWidth) {
        lastLine = lastLine.slice(0, -1);
      }
      lines[maxLines - 1] = (lastLine || "").trim() + "…";
    }

    return lines;
  }

  function renderLabelCardToPngDataUrl(product, template, printSize, settings, language) {
    return whenFontsReady().then(function () {
      var widthPx = Math.max(1080, Math.round(printSize.widthMm * 18));
      var heightPx = Math.max(660, Math.round(printSize.heightMm * 18));
      var canvas = document.createElement("canvas");
      canvas.width = widthPx;
      canvas.height = heightPx;
      var context = canvas.getContext("2d");
      var outerPadding = Math.round(widthPx * 0.026);
      var cardX = outerPadding;
      var cardY = outerPadding;
      var cardWidth = widthPx - outerPadding * 2;
      var cardHeight = heightPx - outerPadding * 2;
      var brandName = settings.brandDisplayName || settings.storeName || "";
      var categoryLabel = getProductCategoryLabel(product);
      var accentColor = String(template.accent || "#db5d17");
      var priceText = formatCurrency(product.price);
      var priceFontSize = Math.max(32, Math.round(heightPx * 0.086));
      var brandFontSize = Math.max(24, Math.round(heightPx * 0.06));
      var nameFontSize = Math.max(34, Math.round(heightPx * 0.09));
      var metaFontSize = Math.max(22, Math.round(heightPx * 0.05));
      var leftPadding = Math.round(cardWidth * 0.043);
      var rightPadding = leftPadding;
      var topPadding = Math.round(cardHeight * 0.072);
      var headerY = cardY + topPadding;
      var nameY = cardY + Math.round(cardHeight * 0.17);
      var barcodeBoxX = cardX + leftPadding;
      var barcodeBoxWidth = cardWidth - leftPadding - rightPadding;
      var barcodeBoxY = cardY + Math.round(cardHeight * 0.29);
      var barcodeBoxHeight = Math.round(cardHeight * 0.48);
      var barcodeImageX = barcodeBoxX + Math.round(barcodeBoxWidth * 0.04);
      var barcodeImageY = barcodeBoxY + Math.round(barcodeBoxHeight * 0.08);
      var barcodeImageWidth = barcodeBoxWidth - Math.round(barcodeBoxWidth * 0.08);
      var barcodeImageHeight = barcodeBoxHeight - Math.round(barcodeBoxHeight * 0.16);
      var codeY = cardY + Math.round(cardHeight * 0.81);
      var categoryY = cardY + Math.round(cardHeight * 0.91);
      var barcodeMarkup = renderBarcodeMarkup(product.barcode, {
        width: printSize.widthMm >= 90 ? 2.45 : 2.2,
        height: Math.max(130, Math.round(printSize.heightMm * 4.4)),
        margin: 18,
        lineColor: "#1f1b18"
      });

      function finishLabelImage() {
        if (template.showBarcodeValue) {
          context.fillStyle = "#74695d";
          context.textAlign = "center";
          context.textBaseline = "top";
          context.font = "500 " + metaFontSize + "px 'Be Vietnam Pro', Arial, sans-serif";
          context.fillText(normalizeBarcode(product.barcode), cardX + cardWidth / 2, codeY);
          context.textAlign = "left";
        }

        if (template.showCategory) {
          context.fillStyle = "#74695d";
          context.textBaseline = "top";
          context.font = "500 " + metaFontSize + "px 'Be Vietnam Pro', Arial, sans-serif";
          context.fillText(pickLanguage("Danh mục / Category", language) + ": " + categoryLabel, cardX + leftPadding, categoryY);
        }

        return canvas.toDataURL("image/png");
      }

      context.fillStyle = "#fffdf7";
      context.fillRect(0, 0, widthPx, heightPx);

      var gradient = context.createLinearGradient(0, cardY, 0, cardY + cardHeight);
      gradient.addColorStop(0, "#fffdf9");
      gradient.addColorStop(1, "#fff4e7");
      context.fillStyle = gradient;
      context.strokeStyle = "rgba(231,194,164,0.95)";
      context.lineWidth = Math.max(3, Math.round(widthPx * 0.0026));
      drawRoundedRectPath(context, cardX, cardY, cardWidth, cardHeight, Math.round(cardHeight * 0.11));
      context.fill();
      context.stroke();

      if (template.showStoreName) {
        context.fillStyle = "#73685d";
        context.textBaseline = "top";
        context.font = "500 " + brandFontSize + "px 'Be Vietnam Pro', Arial, sans-serif";
        context.fillText(brandName, cardX + leftPadding, headerY);
      }

      if (template.showPrice) {
        context.fillStyle = accentColor;
        context.textBaseline = "top";
        context.textAlign = "right";
        context.font = "700 " + priceFontSize + "px 'Space Grotesk', 'Be Vietnam Pro', Arial, sans-serif";
        context.fillText(priceText, cardX + cardWidth - rightPadding, headerY - Math.round(cardHeight * 0.01));
        context.textAlign = "left";
      }

      if (template.showName) {
        context.fillStyle = "#231a14";
        context.textBaseline = "top";
        context.font = "700 " + nameFontSize + "px 'Space Grotesk', 'Be Vietnam Pro', Arial, sans-serif";
        var nameLines = wrapCanvasText(context, product.name || "", cardWidth - leftPadding - rightPadding - Math.round(cardWidth * 0.22), 2);
        nameLines.forEach(function (line, index) {
          context.fillText(line, cardX + leftPadding, nameY + index * Math.round(nameFontSize * 1.02));
        });
      }
      context.fillStyle = "#ffffff";
      context.fillRect(barcodeBoxX, barcodeBoxY, barcodeBoxWidth, barcodeBoxHeight);

      if (barcodeMarkup) {
        var barcodeSvgDocument =
          "<svg xmlns='http://www.w3.org/2000/svg' width='" + barcodeImageWidth + "' height='" + barcodeImageHeight + "' viewBox='0 0 " + barcodeImageWidth + " " + barcodeImageHeight + "'>" +
          "<rect width='100%' height='100%' fill='white'/>" +
          barcodeMarkup +
          "</svg>";
        var blob = new Blob([barcodeSvgDocument], { type: "image/svg+xml;charset=utf-8" });
        var blobUrl = window.URL.createObjectURL(blob);
        return loadImageFromUrl(blobUrl).then(function (barcodeImage) {
          context.imageSmoothingEnabled = false;
          context.drawImage(barcodeImage, barcodeImageX, barcodeImageY, barcodeImageWidth, barcodeImageHeight);
          window.URL.revokeObjectURL(blobUrl);
          return finishLabelImage();
        }).catch(function () {
          window.URL.revokeObjectURL(blobUrl);
          return finishLabelImage();
        });
      }

      return finishLabelImage();
    });
  }

  function buildLabelPdfPageConfig(printSize) {
    var mmToPt = 72 / 25.4;
    return {
      unit: "pt",
      format: [
        Math.round(printSize.widthMm * mmToPt * 1000) / 1000,
        Math.round(printSize.heightMm * mmToPt * 1000) / 1000
      ],
      compress: true
    };
  }

  function pickLanguage(text, language) {
    if (typeof text !== "string") {
      return text;
    }

    var parts = text.split(" / ");
    if (parts.length < 2) {
      return text;
    }

    return language === "en" ? parts.slice(1).join(" / ").trim() : parts[0].trim();
  }

  function buildBilingualLabel(vi, en) {
    var safeVi = String(vi || "").trim();
    var safeEn = String(en || "").trim();

    if (safeVi && safeEn) {
      return safeVi + " / " + safeEn;
    }

    return safeVi || safeEn;
  }

  function splitBilingualLabel(label) {
    var value = String(label || "");
    var parts = value.split(" / ");
    return {
      vi: (parts[0] || "").trim(),
      en: (parts.slice(1).join(" / ") || "").trim()
    };
  }

  function slugify(text) {
    var normalized = String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return normalized || uid("item");
  }

  function createOrder(sequenceByDate) {
    var createdAt = Date.now();
    var dateKey = getOrderDateKey(createdAt);
    var nextSequenceByDate = Object.assign({}, sequenceByDate || {});
    var nextSequence = (nextSequenceByDate[dateKey] || 0) + 1;
    nextSequenceByDate[dateKey] = nextSequence;

    return {
      order: normalizeOrder({
        id: buildOrderId(dateKey, nextSequence),
        createdAt: createdAt
      }),
      nextSequenceByDate: nextSequenceByDate
    };
  }

  function normalizeOrder(order) {
    var baseOrder = order || {};
    return {
      id: baseOrder.id || buildOrderId(getOrderDateKey(baseOrder.createdAt || Date.now()), 1),
      items: Array.isArray(baseOrder.items) ? baseOrder.items : [],
      takeAway: !!baseOrder.takeAway,
      discountPct: Number(baseOrder.discountPct) || 0,
      status: baseOrder.status || "open",
      createdAt: baseOrder.createdAt || Date.now(),
      customerName: baseOrder.customerName || "Khách lẻ / Walk-in",
      paymentMethod: baseOrder.paymentMethod || "Chuyển khoản / Bank Transfer",
      cashReceived: Number(baseOrder.cashReceived) || 0
    };
  }

  function getAddonById(addOnId, addOnOptions) {
    var source = addOnOptions || [];
    for (var i = 0; i < source.length; i += 1) {
      if (source[i].id === addOnId) {
        return source[i];
      }
    }

    return null;
  }

  function getItemAddonTotal(item, addOnOptions) {
    return (item.addOnIds || []).reduce(function (sum, addOnId) {
      var addOn = getAddonById(addOnId, addOnOptions);
      return sum + (addOn ? addOn.price : 0);
    }, 0);
  }

  function calculateOrder(order, addOnOptions) {
    var safeOrder = order || normalizeOrder({ createdAt: Date.now() });
    var subtotal = (safeOrder.items || []).reduce(function (sum, item) {
      var linePrice = item.price + getItemAddonTotal(item, addOnOptions);
      return sum + linePrice * item.qty;
    }, 0);
    var discount = subtotal * ((Number(safeOrder.discountPct) || 0) / 100);
    var taxable = Math.max(0, subtotal - discount);
    var vat = taxable * VAT_RATE;
    var total = taxable + vat;
    var itemCount = (safeOrder.items || []).reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);

    return {
      subtotal: subtotal,
      discount: discount,
      vat: vat,
      total: total,
      itemCount: itemCount
    };
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function formatDateTime(dateValue) {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(dateValue));
  }

  function readStorage() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function buildInitialState() {
    var stored = readStorage();
    var emptySequenceByDate = {};

    if (stored) {
      var storedSequenceByDate = Object.assign({}, stored.orderSequenceByDate || {});
      var normalizedOrders = Array.isArray(stored.orders) && stored.orders.length
        ? stored.orders.map(function (order) {
            var safeOrder = normalizeOrder(order);
            var hasNewFormat = /^\d{2}\/\d{2}\/\d{4}-\d{3}$/.test(safeOrder.id);

            if (hasNewFormat) {
              var existingDateKey = safeOrder.id.slice(0, 10);
              var existingSequence = Number(safeOrder.id.slice(11)) || 0;
              storedSequenceByDate[existingDateKey] = Math.max(storedSequenceByDate[existingDateKey] || 0, existingSequence);
              return safeOrder;
            }

            var migratedDateKey = getOrderDateKey(safeOrder.createdAt);
            var migratedSequence = (storedSequenceByDate[migratedDateKey] || 0) + 1;
            storedSequenceByDate[migratedDateKey] = migratedSequence;

            return normalizeOrder(Object.assign({}, safeOrder, {
              id: buildOrderId(migratedDateKey, migratedSequence)
            }));
          })
        : null;

      if (!normalizedOrders || !normalizedOrders.length) {
        var createdStateOrder = createOrder(storedSequenceByDate);
        normalizedOrders = [createdStateOrder.order];
        storedSequenceByDate = createdStateOrder.nextSequenceByDate;
      }

      return {
        categories: Array.isArray(stored.categories) && stored.categories.length ? stored.categories : clone(DEFAULT_CATEGORY_OPTIONS),
        addOns: Array.isArray(stored.addOns) && stored.addOns.length ? stored.addOns : clone(DEFAULT_ADD_ON_OPTIONS),
        components: Array.isArray(stored.components) && stored.components.length ? stored.components : clone(DEFAULT_COMPONENT_OPTIONS),
        products: Array.isArray(stored.products) && stored.products.length ? stored.products.map(normalizeProduct) : clone(DEFAULT_PRODUCTS).map(normalizeProduct),
        sales: Array.isArray(stored.sales) ? stored.sales : [],
        orders: normalizedOrders,
        activeOrderId: stored.activeOrderId || null,
        language: stored.language || "vi",
        orderSequenceByDate: storedSequenceByDate,
        settings: Object.assign({}, DEFAULT_SETTINGS, stored.settings || {}),
        invoiceTemplates: Array.isArray(stored.invoiceTemplates) && stored.invoiceTemplates.length
          ? stored.invoiceTemplates.map(function (template, index) {
              return normalizeInvoiceTemplate(template, DEFAULT_INVOICE_TEMPLATES[index] || DEFAULT_INVOICE_TEMPLATES[0]);
            })
          : clone(DEFAULT_INVOICE_TEMPLATES),
        barcodeTemplates: Array.isArray(stored.barcodeTemplates) && stored.barcodeTemplates.length
          ? stored.barcodeTemplates.map(function (template, index) {
              return normalizeBarcodeTemplate(template, DEFAULT_BARCODE_TEMPLATES[index] || DEFAULT_BARCODE_TEMPLATES[0]);
            })
          : clone(DEFAULT_BARCODE_TEMPLATES),
        selectedInvoiceTemplateId: stored.selectedInvoiceTemplateId || DEFAULT_INVOICE_TEMPLATES[0].id,
        selectedBarcodeTemplateId: stored.selectedBarcodeTemplateId || DEFAULT_BARCODE_TEMPLATES[0].id
      };
    }

    var firstOrderState = createOrder(emptySequenceByDate);
    var firstOrder = firstOrderState.order;

    return {
      categories: clone(DEFAULT_CATEGORY_OPTIONS),
      addOns: clone(DEFAULT_ADD_ON_OPTIONS),
      components: clone(DEFAULT_COMPONENT_OPTIONS),
      products: clone(DEFAULT_PRODUCTS).map(normalizeProduct),
      sales: [],
      orders: [firstOrder],
      activeOrderId: firstOrder.id,
      language: "vi",
      orderSequenceByDate: firstOrderState.nextSequenceByDate,
      settings: clone(DEFAULT_SETTINGS),
      invoiceTemplates: clone(DEFAULT_INVOICE_TEMPLATES),
      barcodeTemplates: clone(DEFAULT_BARCODE_TEMPLATES),
      selectedInvoiceTemplateId: DEFAULT_INVOICE_TEMPLATES[0].id,
      selectedBarcodeTemplateId: DEFAULT_BARCODE_TEMPLATES[0].id
    };
  }

  function normalizeProduct(product) {
    var baseProduct = product || {};
    var normalizedBarcode = getScannableBarcode(
      baseProduct.barcode,
      [baseProduct.id, baseProduct.name, baseProduct.category, baseProduct.barcode].join("|")
    );
    return Object.assign({}, baseProduct, {
      barcode: normalizedBarcode,
      componentIds: Array.isArray(baseProduct.componentIds) ? baseProduct.componentIds : []
    });
  }

  function normalizeInvoiceTemplate(template, fallbackTemplate) {
    return Object.assign({}, fallbackTemplate || DEFAULT_INVOICE_TEMPLATES[0], template || {});
  }

  function normalizeBarcodeTemplate(template, fallbackTemplate) {
    return Object.assign({}, fallbackTemplate || DEFAULT_BARCODE_TEMPLATES[0], template || {});
  }

  function getBarcodePrintSize(template) {
    return {
      widthMm: Math.max(35, Number(template && template.printWidthMm) || 90),
      heightMm: Math.max(25, Number(template && template.printHeightMm) || 55)
    };
  }

  function buildPrintMarkup(order, totals, settings, template, type, language, addOnOptions) {
    var cashReceived = Number(order.cashReceived) || 0;
    var changeDue = Math.max(0, cashReceived - (Number(totals.total) || 0));
    var lineItems = (order.items || [])
      .map(function (item) {
        var addons = (item.addOnIds || [])
          .map(function (addOnId) {
            var addOn = getAddonById(addOnId, addOnOptions);
            return addOn ? pickLanguage(addOn.label, language) : "";
          })
          .filter(Boolean)
          .join(", ");

        return (
          "<tr>" +
          "<td style='padding:8px 0;border-bottom:1px dashed #d8cdbf'>" +
          "<div style='font-weight:600'>" + item.name + "</div>" +
          (addons ? "<div style='font-size:12px;color:#7b6b5d'>" + addons + "</div>" : "") +
          "</td>" +
          "<td style='padding:8px 0;border-bottom:1px dashed #d8cdbf;text-align:center'>" + item.qty + "</td>" +
          "<td style='padding:8px 0;border-bottom:1px dashed #d8cdbf;text-align:right'>" + formatCurrency((item.price + getItemAddonTotal(item, addOnOptions)) * item.qty) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    return (
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + template.title + "</title></head>" +
      "<body style='font-family:Arial,sans-serif;padding:24px;color:#2d2117'>" +
      "<div style='margin-bottom:18px'>" +
      "<div style='font-size:12px;letter-spacing:0.24em;color:#8f7f71;text-transform:uppercase'>" + (settings.brandLine || settings.storeName) + "</div>" +
      "<h2 style='margin:6px 0 8px'>" + (settings.brandDisplayName || settings.storeName) + "</h2>" +
      "<div style='color:#6c5b4d'>" + pickLanguage(template.title, language) + " - " + pickLanguage(type, language) + "</div>" +
      (template.showSubtitle ? "<div style='margin-top:6px;color:#8f7f71'>" + pickLanguage(template.subtitle || "", language) + "</div>" : "") +
      "</div>" +
      (template.showBranch ? "<div>" + pickLanguage("Chi nhánh / Branch", language) + ": " + settings.branchName + "</div>" : "") +
      (template.showAddress ? "<div>" + settings.address + "</div>" : "") +
      (template.showPhone ? "<div>" + pickLanguage("Điện thoại / Phone", language) + ": " + settings.phone + "</div>" : "") +
      (template.showTaxId ? "<div>" + pickLanguage("Mã số thuế / Tax ID", language) + ": " + settings.taxId + "</div>" : "") +
      (template.showCashier ? "<div>" + pickLanguage("Thu ngân / Cashier", language) + ": " + settings.cashierName + "</div>" : "") +
      (template.showCustomerName ? "<div>" + pickLanguage("Khách hàng / Customer", language) + ": " + (order.customerName || pickLanguage("Khách lẻ / Walk-in", language)) + "</div>" : "") +
      (template.showPaymentMethod ? "<div>" + pickLanguage("Thanh toán / Payment", language) + ": " + pickLanguage(order.paymentMethod || "Chuyển khoản / Bank Transfer", language) + "</div>" : "") +
      (template.showOrderMeta ? "<div style='margin:12px 0'>" + pickLanguage("Mã đơn / Order ID", language) + ": " + order.id + "<br/>" + pickLanguage("Thời gian / Time", language) + ": " + formatDateTime(order.createdAt || Date.now()) + "</div>" : "") +
      "<table style='width:100%;border-collapse:collapse'>" +
      "<thead><tr><th align='left'>" + pickLanguage("Món / Item", language) + "</th><th align='center'>" + pickLanguage("SL / Qty", language) + "</th><th align='right'>" + pickLanguage("Thành tiền / Amount", language) + "</th></tr></thead>" +
      "<tbody>" + lineItems + "</tbody></table>" +
      "<div style='margin-top:16px;line-height:1.8'>" +
      "<div>" + pickLanguage("Tạm tính / Subtotal", language) + ": " + formatCurrency(totals.subtotal) + "</div>" +
      "<div>" + pickLanguage("Giảm giá / Discount", language) + ": " + formatCurrency(totals.discount) + "</div>" +
      "<div>VAT 8%: " + formatCurrency(totals.vat) + "</div>" +
      "<div style='font-size:18px;font-weight:700'>" + pickLanguage("Tổng cộng / Total", language) + ": " + formatCurrency(totals.total) + "</div>" +
      (template.showCashReceived ? "<div>" + pickLanguage("Tiền khách đưa / Cash Received", language) + ": " + formatCurrency(cashReceived) + "</div>" : "") +
      (template.showChangeDue ? "<div>" + pickLanguage("Tiền thừa / Change", language) + ": " + formatCurrency(changeDue) + "</div>" : "") +
      "</div>" +
      "<p style='margin-top:18px;color:#6c5b4d'>" + pickLanguage(template.footer, language) + "</p>" +
      "</body></html>"
    );
  }

  function MenuDrawer(props) {
    var items = [
      { id: "pos", label: "Bán hàng / POS", icon: "🧾", help: "Bán hàng tại quầy / Counter sales" },
      { id: "dashboard", label: "Tổng quan / Dashboard", icon: "📊", help: "Tổng quan doanh thu / Sales overview" },
      { id: "inventory", label: "Kho hàng / Inventory", icon: "📦", help: "Sửa, thêm, xóa sản phẩm / Manage products" },
      { id: "settings", label: "Cài đặt / Settings", icon: "⚙️", help: "Cửa hàng, hóa đơn, mã vạch / Shop, invoice, barcode" }
    ];

    return html`
      <div className=${"drawer-backdrop" + (props.open ? " is-open" : "")} onClick=${props.onClose}>
        <aside className=${"drawer surface" + (props.open ? " is-open" : "")} onClick=${function (event) {
          event.stopPropagation();
        }}>
          <div className="drawer-top">
            <div>
              <div className="drawer-eyebrow">${pickLanguage("Danh mục / Menu", props.language)}</div>
              <h2 className="drawer-title">${props.storeName}</h2>
            </div>
            <button className="ghost-btn" onClick=${props.onClose}>${pickLanguage("Đóng / Close", props.language)}</button>
          </div>
          <div className="drawer-list">
            ${items.map(function (item) {
              return html`
                <button
                  key=${item.id}
                  className=${"drawer-link" + (props.activeView === item.id ? " is-active" : "")}
                  onClick=${function () {
                    props.onSelect(item.id);
                  }}
                >
                  <span className="drawer-link-icon">${item.icon}</span>
                  <span>
                    <strong>${pickLanguage(item.label, props.language)}</strong>
                    <small>${pickLanguage(item.help, props.language)}</small>
                  </span>
                </button>
              `;
            })}
          </div>
        </aside>
      </div>
    `;
  }

  function App() {
    var initialState = useMemo(buildInitialState, []);
    var [categories, setCategories] = useState(initialState.categories);
    var [addOns, setAddOns] = useState(initialState.addOns);
    var [components, setComponents] = useState(initialState.components);
    var [products, setProducts] = useState(initialState.products);
    var [sales, setSales] = useState(initialState.sales);
    var [orders, setOrders] = useState(initialState.orders);
    var [activeOrderId, setActiveOrderId] = useState(initialState.activeOrderId || initialState.orders[0].id);
    var [language, setLanguage] = useState(initialState.language || "vi");
    var [orderSequenceByDate, setOrderSequenceByDate] = useState(initialState.orderSequenceByDate || {});
    var [settings, setSettings] = useState(initialState.settings);
    var [invoiceTemplates, setInvoiceTemplates] = useState(initialState.invoiceTemplates);
    var [barcodeTemplates, setBarcodeTemplates] = useState(initialState.barcodeTemplates);
    var [selectedInvoiceTemplateId, setSelectedInvoiceTemplateId] = useState(initialState.selectedInvoiceTemplateId);
    var [selectedBarcodeTemplateId, setSelectedBarcodeTemplateId] = useState(initialState.selectedBarcodeTemplateId);
    var [activeView, setActiveView] = useState("pos");
    var [menuOpen, setMenuOpen] = useState(false);
    var [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
    var [selectedCategory, setSelectedCategory] = useState("all");
    var [searchTerm, setSearchTerm] = useState("");
    var [settingsSection, setSettingsSection] = useState("general");
    var [inventorySection, setInventorySection] = useState("stock");
    var [selectedProductIds, setSelectedProductIds] = useState([]);
    var [labelPrintQuantities, setLabelPrintQuantities] = useState({});
    var [previewLabelQuantity, setPreviewLabelQuantity] = useState(1);
    var [selectedExportTables, setSelectedExportTables] = useState(getExportTableNames());
    var [exportFilterMode, setExportFilterMode] = useState("all");
    var [exportStartDate, setExportStartDate] = useState("");
    var [exportEndDate, setExportEndDate] = useState("");
    var [exportActiveOnly, setExportActiveOnly] = useState(false);
    var [exportCompletedOrdersOnly, setExportCompletedOrdersOnly] = useState(false);
    var [exportBusy, setExportBusy] = useState(false);
    var [barcodeInput, setBarcodeInput] = useState("");
    var [scanMessage, setScanMessage] = useState("");
    var [cameraActive, setCameraActive] = useState(false);
    var [productDraft, setProductDraft] = useState({
      id: null,
      name: "",
      category: initialState.categories[0] ? initialState.categories[0].id : "",
      price: 0,
      stock: 0,
      barcode: "",
      image: "🍊",
      description: "",
      componentIds: []
    });
    var [categoryDraft, setCategoryDraft] = useState({
      id: null,
      labelVi: "",
      labelEn: "",
      icon: "🍊"
    });
    var [addOnDraft, setAddOnDraft] = useState({
      id: null,
      labelVi: "",
      labelEn: "",
      price: 0,
      group: "extras"
    });
    var [componentDraft, setComponentDraft] = useState({
      id: null,
      labelVi: "",
      labelEn: "",
      unit: "",
      note: ""
    });
    var [selectedBarcodeProductId, setSelectedBarcodeProductId] = useState(initialState.products[0] ? initialState.products[0].id : "");
    var barcodeInputRef = useRef(null);
    var barcodeCaptureInputRef = useRef(null);
    var videoRef = useRef(null);
    var cameraStreamRef = useRef(null);
    var scanIntervalRef = useRef(null);
    var zxingReaderRef = useRef(null);
    var zxingControlsRef = useRef(null);
    var lastScannedCodeRef = useRef("");
    var hardwareScanBufferRef = useRef("");
    var hardwareScanStartedAtRef = useRef(0);
    var hardwareScanLastAtRef = useRef(0);

    useEffect(function () {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            categories: categories,
            addOns: addOns,
            components: components,
            products: products,
            sales: sales,
            orders: orders,
            activeOrderId: activeOrderId,
            language: language,
            orderSequenceByDate: orderSequenceByDate,
            settings: settings,
            invoiceTemplates: invoiceTemplates,
            barcodeTemplates: barcodeTemplates,
            selectedInvoiceTemplateId: selectedInvoiceTemplateId,
            selectedBarcodeTemplateId: selectedBarcodeTemplateId
          })
        );
      } catch (error) {
        // Keep the POS working even when storage is unavailable.
      }
    }, [
      categories,
      addOns,
      components,
      products,
      sales,
      orders,
      activeOrderId,
      language,
      orderSequenceByDate,
      settings,
      invoiceTemplates,
      barcodeTemplates,
      selectedInvoiceTemplateId,
      selectedBarcodeTemplateId
    ]);

    useEffect(function () {
      if (!orders.some(function (order) { return order.id === activeOrderId; })) {
        setActiveOrderId(orders[0] ? orders[0].id : "");
      }
    }, [orders, activeOrderId]);

    useEffect(function () {
      if (products.length && !products.some(function (product) { return product.id === selectedBarcodeProductId; })) {
        setSelectedBarcodeProductId(products[0].id);
      }
    }, [products, selectedBarcodeProductId]);

    useEffect(function () {
      setSelectedProductIds(function (currentIds) {
        return currentIds.filter(function (productId) {
          return products.some(function (product) { return product.id === productId; });
        });
      });
    }, [products]);

    useEffect(function () {
      setLabelPrintQuantities(function (currentQuantities) {
        var nextQuantities = {};
        Object.keys(currentQuantities).forEach(function (productId) {
          if (products.some(function (product) { return product.id === productId; })) {
            nextQuantities[productId] = currentQuantities[productId];
          }
        });
        return nextQuantities;
      });
    }, [products]);

    useEffect(function () {
      if (selectedCategory !== "all" && !categories.some(function (category) { return category.id === selectedCategory; })) {
        setSelectedCategory("all");
      }
    }, [categories, selectedCategory]);

    useEffect(function () {
      if (productDraft.category && !categories.some(function (category) { return category.id === productDraft.category; })) {
        setProductDraft(function (currentDraft) {
          return Object.assign({}, currentDraft, {
            category: categories[0] ? categories[0].id : ""
          });
        });
      }
    }, [categories, productDraft.category]);

    useEffect(function () {
      var validComponentIds = (productDraft.componentIds || []).filter(function (componentId) {
        return components.some(function (component) { return component.id === componentId; });
      });

      if (validComponentIds.length !== (productDraft.componentIds || []).length) {
        setProductDraft(function (currentDraft) {
          return Object.assign({}, currentDraft, {
            componentIds: validComponentIds
          });
        });
      }
    }, [components, productDraft.componentIds]);

    useEffect(function () {
      if (!paymentMenuOpen) {
        return undefined;
      }

      function closePaymentMenu() {
        setPaymentMenuOpen(false);
      }

      window.addEventListener("click", closePaymentMenu);
      return function () {
        window.removeEventListener("click", closePaymentMenu);
      };
    }, [paymentMenuOpen]);

    useEffect(function () {
      return function () {
        stopCameraScan();
      };
    }, []);

    useEffect(function () {
      if (activeView !== "pos" && cameraActive) {
        stopCameraScan();
      }
    }, [activeView, cameraActive]);

    useEffect(function () {
      if (activeView !== "pos" || !barcodeInputRef.current || cameraActive) {
        return undefined;
      }

      if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
        return undefined;
      }

      var focusTimer = window.setTimeout(function () {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 120);

      return function () {
        window.clearTimeout(focusTimer);
      };
    }, [activeView, cameraActive]);

    useEffect(function () {
      if (activeView !== "pos") {
        return undefined;
      }

      function resetHardwareScannerBuffer() {
        hardwareScanBufferRef.current = "";
        hardwareScanStartedAtRef.current = 0;
        hardwareScanLastAtRef.current = 0;
      }

      function onGlobalKeyDown(event) {
        var targetTag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : "";
        var isEditableTarget =
          targetTag === "input" ||
          targetTag === "textarea" ||
          targetTag === "select" ||
          (event.target && event.target.isContentEditable);

        if (isEditableTarget && event.target !== barcodeInputRef.current) {
          return;
        }

        if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        }

        var now = Date.now();
        if (event.key === "Enter") {
          var bufferedCode = hardwareScanBufferRef.current;
          var startedAt = hardwareScanStartedAtRef.current || now;
          var duration = now - startedAt;
          if (bufferedCode.length >= 6 && duration <= 1200) {
            event.preventDefault();
            setBarcodeInput(bufferedCode);
            handleScannedBarcode(bufferedCode);
          }
          resetHardwareScannerBuffer();
          return;
        }

        if (event.key.length !== 1) {
          return;
        }

        if (hardwareScanLastAtRef.current && now - hardwareScanLastAtRef.current > 120) {
          resetHardwareScannerBuffer();
        }

        if (!hardwareScanStartedAtRef.current) {
          hardwareScanStartedAtRef.current = now;
        }

        hardwareScanLastAtRef.current = now;
        hardwareScanBufferRef.current += event.key;
      }

      window.addEventListener("keydown", onGlobalKeyDown, true);
      return function () {
        window.removeEventListener("keydown", onGlobalKeyDown, true);
      };
    }, [activeView, handleScannedBarcode]);

    var activeOrder = orders.find(function (order) {
      return order.id === activeOrderId;
    }) || orders[0] || normalizeOrder({ createdAt: Date.now() });

    var totals = calculateOrder(activeOrder, addOns);

    var filterCategories = useMemo(function () {
      return [FILTER_ALL_CATEGORY].concat(categories);
    }, [categories]);

    var filteredProducts = useMemo(function () {
      return products.filter(function (product) {
        var category = categories.find(function (item) {
          return item.id === product.category;
        });
        var matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
        var matchesSearch = !searchTerm || (product.name + " " + product.category + " " + (category ? category.label : "") + " " + product.description)
          .toLowerCase()
          .indexOf(searchTerm.toLowerCase()) !== -1;
        return matchesCategory && matchesSearch;
      });
    }, [products, categories, selectedCategory, searchTerm]);

    var activeInvoiceTemplate = invoiceTemplates.find(function (template) {
      return template.id === selectedInvoiceTemplateId;
    }) || invoiceTemplates[0];

    var activeBarcodeTemplate = barcodeTemplates.find(function (template) {
      return template.id === selectedBarcodeTemplateId;
    }) || barcodeTemplates[0];

    var barcodePreviewProduct = products.find(function (product) {
      return product.id === selectedBarcodeProductId;
    }) || products[0] || null;

    var isAppleMobileScannerFallback = typeof navigator !== "undefined" && (
      /iPhone|iPad|iPod/i.test(navigator.userAgent || "")
      || ((navigator.platform || "") === "MacIntel" && navigator.maxTouchPoints > 1)
    );

    var cameraScanSupported = typeof window !== "undefined"
      && (
        !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (!!window.BarcodeDetector || !!window.ZXingBrowser))
        || !!window.FileReader
      );

    var dashboardMetrics = useMemo(function () {
      var todayKey = new Date().toDateString();
      var salesToday = sales.filter(function (sale) {
        return new Date(sale.createdAt).toDateString() === todayKey;
      });
      var revenueToday = salesToday.reduce(function (sum, sale) {
        return sum + sale.total;
      }, 0);
      var ordersToday = salesToday.length;
      var lowStock = products.filter(function (product) {
        return Number(product.stock) <= 10;
      });
      return {
        revenueToday: revenueToday,
        ordersToday: ordersToday,
        lowStock: lowStock,
        recentSales: clone(sales).sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, 5)
      };
    }, [products, sales]);

    var inventoryTabs = [
      { id: "stock", label: "Kiểm hàng tồn kho / Stock Check" },
      { id: "product", label: "Thêm sản phẩm / Add Product" },
      { id: "catalog", label: "Điều chỉnh danh mục / Catalog Adjustments" }
    ];

    var addOnGroupLabels = {
      sweetness: "Độ ngọt / Sweetness",
      ice: "Đá / Ice",
      extras: "Thêm topping / Extras"
    };

    function L(text) {
      return pickLanguage(text, language);
    }

    function updateActiveOrder(updater) {
      setOrders(function (currentOrders) {
        return currentOrders.map(function (order) {
          if (order.id !== activeOrderId) {
            return order;
          }

          return updater(order);
        });
      });
    }

    function findProductByBarcode(rawCode) {
      var safeCode = normalizeBarcode(rawCode);
      if (!safeCode) {
        return null;
      }

      return products.find(function (product) {
        var productBarcode = getScannableBarcode(
          product.barcode,
          [product.id, product.name, product.category, product.barcode].join("|")
        );
        var comparableValues = [
          normalizeBarcode(productBarcode),
          getBarcodeDigits(productBarcode),
          normalizeBarcode(product.barcode),
          getBarcodeDigits(product.barcode)
        ].filter(Boolean);

        return comparableValues.indexOf(safeCode) !== -1 || comparableValues.indexOf(getBarcodeDigits(safeCode)) !== -1;
      }) || null;
    }

    function handleScannedBarcode(rawCode) {
      var safeCode = normalizeBarcode(rawCode);
      if (!safeCode) {
        setScanMessage(L("Nhập hoặc quét mã barcode trước. / Enter or scan a barcode first."));
        return;
      }

      var matchedProduct = findProductByBarcode(safeCode);
      if (!matchedProduct) {
        setScanMessage(L("Không tìm thấy sản phẩm với mã này. / No product found for this barcode."));
        return;
      }

      addProductToOrder(matchedProduct);
      setBarcodeInput("");
      setScanMessage(L("Đã thêm sản phẩm từ barcode: / Added product from barcode: ") + matchedProduct.name);
    }

    function stopCameraScan() {
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      if (zxingControlsRef.current && typeof zxingControlsRef.current.stop === "function") {
        zxingControlsRef.current.stop();
        zxingControlsRef.current = null;
      }

      if (zxingReaderRef.current && typeof zxingReaderRef.current.reset === "function") {
        zxingReaderRef.current.reset();
      }

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(function (track) {
          track.stop();
        });
        cameraStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      lastScannedCodeRef.current = "";
      setCameraActive(false);
    }

    function handleDetectedCameraCode(rawValue) {
      var safeCode = normalizeBarcode(rawValue);
      if (!safeCode || lastScannedCodeRef.current === safeCode) {
        return;
      }

      lastScannedCodeRef.current = safeCode;
      setBarcodeInput(safeCode);
      handleScannedBarcode(safeCode);
      window.setTimeout(function () {
        if (lastScannedCodeRef.current === safeCode) {
          lastScannedCodeRef.current = "";
        }
      }, 1500);
    }

    function openBarcodeCaptureFallback() {
      if (!barcodeCaptureInputRef.current) {
        setScanMessage(L("Không thể mở camera chụp mã lúc này. / Unable to open barcode capture right now."));
        return;
      }

      setScanMessage(L("Mở camera để chụp mã vạch. / Opening camera to capture the barcode."));
      barcodeCaptureInputRef.current.value = "";
      barcodeCaptureInputRef.current.click();
    }

    function decodeBarcodeFromImageElement(imageElement) {
      if (window.BarcodeDetector) {
        var detector = new window.BarcodeDetector({
          formats: BARCODE_DETECT_FORMATS
        });

        return detector.detect(imageElement).then(function (codes) {
          if (!codes || !codes.length) {
            return "";
          }

          return codes[0].rawValue || "";
        });
      }

      if (window.ZXingBrowser && window.ZXingBrowser.BrowserMultiFormatReader) {
        var imageReader = new window.ZXingBrowser.BrowserMultiFormatReader();
        return imageReader.decodeFromImageElement(imageElement).then(function (result) {
          if (!result) {
            return "";
          }

          return result.getText ? result.getText() : result.text || "";
        }).catch(function () {
          return "";
        });
      }

      return Promise.resolve("");
    }

    function decodeBarcodeFromImageFile(file) {
      if (!file) {
        return Promise.resolve("");
      }

      if (window.BarcodeDetector && window.createImageBitmap) {
        return window.createImageBitmap(file).then(function (bitmap) {
          var detector = new window.BarcodeDetector({
            formats: BARCODE_DETECT_FORMATS
          });

          return detector.detect(bitmap).then(function (codes) {
            if (bitmap && typeof bitmap.close === "function") {
              bitmap.close();
            }

            if (!codes || !codes.length) {
              return "";
            }

            return codes[0].rawValue || "";
          }).catch(function () {
            if (bitmap && typeof bitmap.close === "function") {
              bitmap.close();
            }
            return "";
          });
        }).catch(function () {
          return "";
        });
      }

      var objectUrl = window.URL.createObjectURL(file);
      if (window.ZXingBrowser && window.ZXingBrowser.BrowserMultiFormatReader) {
        var imageReader = new window.ZXingBrowser.BrowserMultiFormatReader();
        return imageReader.decodeFromImageUrl(objectUrl).then(function (result) {
          window.URL.revokeObjectURL(objectUrl);
          if (!result) {
            return "";
          }

          return result.getText ? result.getText() : result.text || "";
        }).catch(function () {
          window.URL.revokeObjectURL(objectUrl);
          return "";
        });
      }

      window.URL.revokeObjectURL(objectUrl);
      return Promise.resolve("");
    }

    function handleBarcodeImageCapture(event) {
      var file = event.target && event.target.files ? event.target.files[0] : null;
      if (!file) {
        return;
      }

      setScanMessage(L("Đang đọc ảnh barcode... / Reading barcode image..."));
      decodeBarcodeFromImageFile(file).then(function (rawCode) {
        if (!rawCode) {
          setScanMessage(L("Không đọc được mã từ ảnh. Hãy chụp lại rõ hơn, đủ sáng và lấy trọn mã vạch. / Could not read a barcode from the image. Please capture it more clearly with good lighting and the full barcode in frame."));
          return;
        }

        var normalizedCode = normalizeBarcode(rawCode);
        setBarcodeInput(normalizedCode);
        handleScannedBarcode(normalizedCode);
      }).catch(function () {
        setScanMessage(L("Không đọc được mã từ ảnh. Hãy chụp lại rõ hơn, đủ sáng và lấy trọn mã vạch. / Could not read a barcode from the image. Please capture it more clearly with good lighting and the full barcode in frame."));
      });
    }

    function startBarcodeDetectorScan(stream) {
      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(function () {
          return undefined;
        });
      }

      var detector = new window.BarcodeDetector({
        formats: BARCODE_DETECT_FORMATS
      });

      setCameraActive(true);
      setScanMessage(L("Camera đã sẵn sàng. Đưa mã vào khung hình. / Camera is ready. Place the barcode in view."));

      scanIntervalRef.current = window.setInterval(function () {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          return;
        }

        detector.detect(videoRef.current).then(function (codes) {
          if (!codes || !codes.length) {
            return;
          }

          handleDetectedCameraCode(codes[0].rawValue || "");
        }).catch(function () {
          return undefined;
        });
      }, 450);
    }

    function startZxingFallbackScan() {
      if (!window.ZXingBrowser || !window.ZXingBrowser.BrowserMultiFormatReader) {
        throw new Error("ZXing fallback unavailable");
      }

      if (!videoRef.current) {
        throw new Error("Video element unavailable");
      }

      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.setAttribute("webkit-playsinline", "true");
      videoRef.current.muted = true;
      videoRef.current.autoplay = true;

      zxingReaderRef.current = new window.ZXingBrowser.BrowserMultiFormatReader();
      setCameraActive(true);
      setScanMessage(L("Camera đã sẵn sàng. Đưa mã vào khung hình. / Camera is ready. Place the barcode in view."));

      return zxingReaderRef.current.decodeFromConstraints({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }, videoRef.current, function (result) {
        if (!result) {
          return;
        }

        handleDetectedCameraCode(result.getText ? result.getText() : result.text || "");
      }).then(function (controls) {
        zxingControlsRef.current = controls;
      });
    }

    function startCameraScan() {
      if (!cameraScanSupported) {
        openBarcodeCaptureFallback();
        setScanMessage(L("Thiết bị này sẽ dùng camera chụp hoặc ảnh barcode thay cho live scan. / This device will use captured barcode photos instead of live scanning."));
        return;
      }

      stopCameraScan();

      if (isAppleMobileScannerFallback) {
        openBarcodeCaptureFallback();
        return;
      }

      if (!window.BarcodeDetector && window.ZXingBrowser) {
        startZxingFallbackScan().catch(function () {
          openBarcodeCaptureFallback();
          setScanMessage(L("Live camera scan chưa ổn định trên thiết bị này. Đã chuyển sang chụp barcode. / Live camera scan is not stable on this device. Switched to barcode capture."));
          stopCameraScan();
        });
        return;
      }

      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      }).then(function (stream) {
        if (window.BarcodeDetector) {
          startBarcodeDetectorScan(stream);
          return undefined;
        }
        return undefined;
      }).catch(function () {
        openBarcodeCaptureFallback();
        setScanMessage(L("Không mở được live camera. Đã chuyển sang chụp hoặc chọn ảnh barcode. / Live camera could not be opened. Switched to capturing or choosing a barcode image."));
        stopCameraScan();
      });
    }

    function ensureAtLeastOneOrder(currentOrders) {
      if (currentOrders.length) {
        return currentOrders;
      }

      var createdFallback = createOrder(orderSequenceByDate);
      setOrderSequenceByDate(createdFallback.nextSequenceByDate);
      return [createdFallback.order];
    }

    function createNewOrder() {
      var createdOrderState = createOrder(orderSequenceByDate);
      var newOrder = createdOrderState.order;
      setOrderSequenceByDate(createdOrderState.nextSequenceByDate);
      setOrders(function (currentOrders) {
        return [newOrder].concat(currentOrders);
      });
      setActiveOrderId(newOrder.id);
      setActiveView("pos");
    }

    function addProductToOrder(product) {
      updateActiveOrder(function (order) {
        var existingItem = (order.items || []).find(function (item) {
          return item.productId === product.id && (!item.addOnIds || item.addOnIds.length === 0);
        });

        if (existingItem) {
          return Object.assign({}, order, {
            items: order.items.map(function (item) {
              return item.id === existingItem.id
                ? Object.assign({}, item, { qty: item.qty + 1 })
                : item;
            })
          });
        }

        var newItem = {
          id: uid("item"),
          productId: product.id,
          barcode: getScannableBarcode(product.barcode, [product.id, product.name, product.category].join("|")),
          name: product.name,
          price: Number(product.price) || 0,
          qty: 1,
          addOnIds: []
        };

        return Object.assign({}, order, {
          items: (order.items || []).concat(newItem)
        });
      });
    }

    function adjustItemQty(itemId, delta) {
      updateActiveOrder(function (order) {
        var nextItems = (order.items || [])
          .map(function (item) {
            if (item.id !== itemId) {
              return item;
            }

            return Object.assign({}, item, { qty: item.qty + delta });
          })
          .filter(function (item) {
            return item.qty > 0;
          });

        return Object.assign({}, order, { items: nextItems });
      });
    }

    function removeItem(itemId) {
      updateActiveOrder(function (order) {
        return Object.assign({}, order, {
          items: (order.items || []).filter(function (item) {
            return item.id !== itemId;
          })
        });
      });
    }

    function toggleAddon(itemId, addOnId) {
      updateActiveOrder(function (order) {
        return Object.assign({}, order, {
          items: (order.items || []).map(function (item) {
            if (item.id !== itemId) {
              return item;
            }

            var currentIds = item.addOnIds || [];
            var hasAddon = currentIds.indexOf(addOnId) !== -1;
            var nextIds;
            var addOn = getAddonById(addOnId, addOns);

            if (addOn && addOn.group !== "extras") {
              nextIds = currentIds.filter(function (currentId) {
                var currentAddon = getAddonById(currentId, addOns);
                return !(currentAddon && currentAddon.group === addOn.group);
              });
            } else {
              nextIds = currentIds.slice();
            }

            if (!hasAddon) {
              nextIds.push(addOnId);
            } else if (addOn && addOn.group === "extras") {
              nextIds = nextIds.filter(function (currentId) {
                return currentId !== addOnId;
              });
            } else if (hasAddon) {
              nextIds = nextIds.filter(function (currentId) {
                return currentId !== addOnId;
              });
            }

            return Object.assign({}, item, { addOnIds: nextIds });
          })
        });
      });
    }

    function getOrderProductQuantities(items) {
      return (items || []).reduce(function (quantitiesByProduct, item) {
        if (!item || !item.productId) {
          return quantitiesByProduct;
        }

        quantitiesByProduct[item.productId] = (quantitiesByProduct[item.productId] || 0) + (Number(item.qty) || 0);
        return quantitiesByProduct;
      }, {});
    }

    function holdOrder() {
      updateActiveOrder(function (order) {
        return Object.assign({}, order, { status: "held" });
      });
      createNewOrder();
    }

    function cancelOrder() {
      updateActiveOrder(function (order) {
        return Object.assign({}, order, {
          items: [],
          discountPct: 0,
          takeAway: false,
          status: "open",
          customerName: "Khách lẻ / Walk-in",
          paymentMethod: "Chuyển khoản / Bank Transfer",
          cashReceived: 0
        });
      });
    }

    function payNow() {
      if (!activeOrder.items.length) {
        window.alert(L("Đơn hiện tại chưa có món. / This order is empty."));
        return;
      }

      var requiredQtyByProduct = getOrderProductQuantities(activeOrder.items);
      var insufficientProducts = Object.keys(requiredQtyByProduct).map(function (productId) {
        var product = products.find(function (currentProduct) {
          return currentProduct.id === productId;
        });

        if (!product) {
          return {
            productId: productId,
            name: productId,
            available: 0,
            required: requiredQtyByProduct[productId]
          };
        }

        var available = Math.max(0, Number(product.stock) || 0);
        var required = Math.max(0, Number(requiredQtyByProduct[productId]) || 0);
        if (available >= required) {
          return null;
        }

        return {
          productId: productId,
          name: product.name,
          available: available,
          required: required
        };
      }).filter(Boolean);

      if (insufficientProducts.length) {
        window.alert(
          L("Không đủ tồn kho để hoàn tất đơn này: / Not enough stock to complete this sale:\n") +
          insufficientProducts.map(function (item) {
            return "- " + item.name + " (" + item.available + "/" + item.required + ")";
          }).join("\n")
        );
        return;
      }

      var orderSnapshot = clone(activeOrder);
      var saleRecord = {
        id: uid("sale"),
        orderId: activeOrder.id,
        createdAt: Date.now(),
        items: orderSnapshot.items,
        total: totals.total,
        subtotal: totals.subtotal,
        vat: totals.vat,
        discount: totals.discount,
        customerName: orderSnapshot.customerName || "",
        paymentMethod: orderSnapshot.paymentMethod || "",
        cashReceived: Number(orderSnapshot.cashReceived) || 0,
        cashierName: settings.cashierName || "",
        paymentStatus: "paid",
        orderStatus: "completed",
        note: ""
      };

      setSales(function (currentSales) {
        return [saleRecord].concat(currentSales);
      });

      setProducts(function (currentProducts) {
        return currentProducts.map(function (product) {
          var soldQty = Number(requiredQtyByProduct[product.id]) || 0;
          if (!soldQty) {
            return product;
          }

          return Object.assign({}, product, {
            stock: Math.max(0, (Number(product.stock) || 0) - soldQty)
          });
        });
      });

      setOrders(function (currentOrders) {
        var remaining = currentOrders.filter(function (order) {
          return order.id !== activeOrder.id;
        });

        if (!remaining.length) {
          var createdNextOrderState = createOrder(orderSequenceByDate);
          setOrderSequenceByDate(createdNextOrderState.nextSequenceByDate);
          return [createdNextOrderState.order];
        }

        return remaining;
      });
    }

    function printWithTemplate(type) {
      if (!activeOrder.items.length) {
        window.alert(L("Đơn hiện tại chưa có món. / This order is empty."));
        return;
      }

      var popup = window.open("", "_blank", "width=720,height=840");
      if (!popup) {
        window.alert(L("Trình duyệt đang chặn cửa sổ in hóa đơn. / Your browser blocked the print window."));
        return;
      }

      popup.document.write(buildPrintMarkup(activeOrder, totals, settings, activeInvoiceTemplate, type, language, addOns));
      popup.document.close();
      popup.focus();
      popup.print();
    }

    function previewInvoice() {
      if (!activeOrder.items.length) {
        window.alert(L("Đơn hiện tại chưa có món. / This order is empty."));
        return;
      }

      var popup = window.open("", "_blank", "width=720,height=840");
      if (!popup) {
        window.alert(L("Trình duyệt đang chặn cửa sổ xem trước hóa đơn. / Your browser blocked the invoice preview window."));
        return;
      }

      popup.document.write(buildPrintMarkup(activeOrder, totals, settings, activeInvoiceTemplate, "Xem trước hóa đơn / Preview Invoice", language, addOns));
      popup.document.close();
      popup.focus();
    }

    function previewInvoiceTemplate() {
      var sampleItems = activeOrder.items.length
        ? activeOrder.items
        : [{
            id: "sample-item",
            productId: products[0] ? products[0].id : "sample",
            name: products[0] ? products[0].name : "Cam Mat Ong",
            price: products[0] ? products[0].price : 45000,
            qty: 2,
            addOnIds: addOns.slice(0, 2).map(function (item) { return item.id; })
          }];
      var sampleOrder = {
        id: "TFH-DEMO",
        items: sampleItems
      };
      var sampleTotals = calculateOrder(sampleOrder, addOns);
      var popup = window.open("", "_blank", "width=720,height=840");
      if (!popup) {
        window.alert(L("Trình duyệt đang chặn cửa sổ xem trước hóa đơn. / Your browser blocked the invoice preview window."));
        return;
      }

      popup.document.write(buildPrintMarkup(sampleOrder, sampleTotals, settings, activeInvoiceTemplate, "Xem trước mẫu hóa đơn / Invoice Template Preview", language, addOns));
      popup.document.close();
      popup.focus();
    }

    function getProductCategoryLabel(product) {
      var category = categories.find(function (item) {
        return item.id === (product ? product.category : "");
      });

      return category ? L(category.label) : "";
    }

    function buildBarcodeLabelCardMarkup(product, template) {
      var categoryLabel = getProductCategoryLabel(product);
      var printSize = getBarcodePrintSize(template);
      var barcodeSvg = renderBarcodeMarkup(product.barcode, {
        width: printSize.widthMm >= 90 ? 2.55 : 2.15,
        height: Math.max(96, Math.round(printSize.heightMm * 3.2)),
        margin: 10,
        lineColor: "#1f1b18"
      });

      return (
        "<article class='print-label-card'>" +
        "<div class='print-label-top'>" +
        "<div class='print-label-brand-block'>" +
        (template.showStoreName ? "<div class='print-label-brand'>" + (settings.brandDisplayName || settings.storeName) + "</div>" : "") +
        (template.showName ? "<div class='print-label-name'>" + product.name + "</div>" : "") +
        "</div>" +
        (template.showPrice ? "<div class='print-label-price'>" + formatCurrency(product.price) + "</div>" : "") +
        "</div>" +
        "<div class='print-label-barcode-wrap'>" + barcodeSvg + "</div>" +
        (template.showBarcodeValue ? "<div class='print-label-code'>" + normalizeBarcode(product.barcode) + "</div>" : "") +
        (template.showCategory ? "<div class='print-label-category'>" + pickLanguage("Danh mục / Category", language) + ": " + categoryLabel + "</div>" : "") +
        "</article>"
      );
    }

    function buildBarcodeLabelDocument(productsToPrint, template, quantities) {
      var printSize = getBarcodePrintSize(template);
      var pages = (productsToPrint || []).map(function (product) {
        var repeatCount = Math.max(1, Number(quantities[product.id]) || 1);
        return Array.from({ length: repeatCount }).map(function () {
          return "<section class='print-label-page'><div class='print-label-page-inner'>" + buildBarcodeLabelCardMarkup(product, template) + "</div></section>";
        }).join("");
      }).join("");

      return (
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + L("In tem mã vạch / Print Barcode Labels") + "</title>" +
        "<link rel='preconnect' href='https://fonts.googleapis.com'>" +
        "<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>" +
        "<link href='https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;700&family=Space+Grotesk:wght@700&display=swap' rel='stylesheet'>" +
        "<style>" +
        ":root{color-scheme:light only;--label-accent:" + (template.accent || "#db5d17") + "}" +
        "@page{size:" + printSize.widthMm + "mm " + printSize.heightMm + "mm;margin:0}" +
        "html,body{margin:0;padding:0;background:#fff;color:#2d2117;font-family:'Be Vietnam Pro',Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
        "body{overflow:visible}" +
        ".print-label-page{width:" + printSize.widthMm + "mm;height:" + printSize.heightMm + "mm;margin:0;padding:0;box-sizing:border-box;page-break-after:always;break-after:page;background:#fff;overflow:hidden}" +
        ".print-label-page:last-child{page-break-after:auto;break-after:auto}" +
        ".print-label-page-inner{width:100%;height:100%}" +
        ".print-label-card{width:100%;height:100%;box-sizing:border-box;padding:4.8mm 6mm 4.2mm;background:linear-gradient(180deg,#fffdf9 0%,#fff4e7 100%);border:0.35mm solid rgba(231,194,164,0.95);border-radius:5.2mm;display:flex;flex-direction:column;justify-content:flex-start;box-shadow:none;overflow:hidden}" +
        ".print-label-top{display:flex;align-items:flex-start;justify-content:space-between;gap:3.2mm}" +
        ".print-label-brand-block{min-width:0;flex:1 1 auto}" +
        ".print-label-brand{font-size:3.7mm;line-height:1.1;color:#73685d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
        ".print-label-name{margin-top:1.1mm;font-size:5.8mm;line-height:1.06;font-weight:700;font-family:'Space Grotesk','Be Vietnam Pro',Arial,sans-serif;color:#231a14;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
        ".print-label-price{font-size:5.7mm;line-height:1.05;font-weight:700;font-family:'Space Grotesk','Be Vietnam Pro',Arial,sans-serif;color:var(--label-accent);white-space:nowrap;margin-left:2mm}" +
        ".print-label-barcode-wrap{margin-top:2.6mm;padding:1.8mm 1.8mm 1.1mm;background:#fff;display:flex;justify-content:center;align-items:center;flex:1 1 auto;min-height:22mm}" +
        ".print-label-barcode-wrap svg{width:100%;height:100%;max-height:100%;display:block}" +
        ".print-label-code{margin-top:1.3mm;text-align:center;font-size:3.45mm;letter-spacing:.16em;color:#74695d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
        ".print-label-category{margin-top:2mm;font-size:3.2mm;color:#74695d;line-height:1.2}" +
        "@media screen{body{padding:12px;background:#f2f0ea}.print-label-page{box-shadow:0 10px 25px rgba(41,29,17,0.12);margin-bottom:12px}}" +
        "@media print{.print-label-page{margin:0}}" +
        "</style></head><body>" + pages + "</body></html>"
      );
    }

    function openBarcodeLabelPrintWindow(productsToPrint, template, quantities, options) {
      var popup = window.open("", "_blank");
      if (!popup) {
        window.alert(L("Trình duyệt đang chặn cửa sổ in tem. / Your browser blocked the label print window."));
        return Promise.resolve(false);
      }

      popup.document.write(buildBarcodeLabelDocument(productsToPrint, template, quantities || {}));
      popup.document.close();

      var shouldAutoPrint = options && options.autoPrint;
      var title = options && options.title ? options.title : "";

      return new Promise(function (resolve) {
        function finishOpen() {
          try {
            popup.document.title = title || popup.document.title;
          } catch (error) {
            // Ignore title sync errors in popup contexts.
          }

          popup.focus();

          if (!shouldAutoPrint) {
            resolve(true);
            return;
          }

          window.setTimeout(function () {
            try {
              popup.focus();
              popup.print();
              resolve(true);
            } catch (error) {
              resolve(false);
            }
          }, 180);
        }

        var waitForFonts = popup.document.fonts && popup.document.fonts.ready
          ? popup.document.fonts.ready.catch(function () { return undefined; })
          : Promise.resolve();

        waitForFonts.then(function () {
          window.setTimeout(finishOpen, 120);
        });
      });
    }

    function openBlobInNewTab(blob, fallbackName, existingWindow) {
      var blobUrl = window.URL.createObjectURL(blob);
      var popup = existingWindow || window.open("", "_blank");
      if (!popup) {
        downloadBlob(blob, fallbackName);
        window.setTimeout(function () {
          window.URL.revokeObjectURL(blobUrl);
        }, 5000);
        return;
      }

      try {
        popup.location.href = blobUrl;
      } catch (error) {
        downloadBlob(blob, fallbackName);
      }

      window.setTimeout(function () {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    }

    function previewBarcodeTemplate() {
      if (!barcodePreviewProduct) {
        return;
      }

      var quantities = (function () {
        var quantities = {};
        quantities[barcodePreviewProduct.id] = Math.max(1, Number(previewLabelQuantity) || 1);
        return quantities;
      })();

      openBarcodeLabelPrintWindow([barcodePreviewProduct], activeBarcodeTemplate, quantities, {
        autoPrint: false,
        title: L("Xem trước tem mã vạch / Barcode Label Preview")
      });
    }

    function printBarcodeLabels(productsToPrint, quantities) {
      if (!productsToPrint || !productsToPrint.length) {
        window.alert(L("Chưa có sản phẩm để in tem. / No products selected for label printing."));
        return;
      }

      openBarcodeLabelPrintWindow(productsToPrint, activeBarcodeTemplate, quantities || {}, {
        autoPrint: true,
        title: L("In tem mã vạch / Print Barcode Labels")
      }).then(function (opened) {
        if (opened) {
          setScanMessage(L("Đã mở cửa sổ in tem đúng khổ 90×55mm. Hãy in ở Actual Size / Scale 100%. / Opened a 90×55mm label print window. Print using Actual Size / 100% scale."));
          return;
        }

        window.alert(L("Không thể mở cửa sổ in tem. / Could not open the label print window."));
      });
    }

    function toggleExportTable(tableName) {
      setSelectedExportTables(function (currentTables) {
        return currentTables.indexOf(tableName) === -1
          ? currentTables.concat(tableName)
          : currentTables.filter(function (currentTableName) {
              return currentTableName !== tableName;
            });
      });
    }

    function toggleAllExportTables() {
      setSelectedExportTables(function (currentTables) {
        return currentTables.length === EXPORT_TABLE_SCHEMAS.length ? [] : getExportTableNames();
      });
    }

    function isWalkInCustomerName(name) {
      var safeName = String(name || "").trim().toLowerCase();
      return !safeName || safeName.indexOf("walk-in") !== -1 || safeName.indexOf("khách lẻ") !== -1 || safeName.indexOf("khach le") !== -1;
    }

    function buildExportPayload(tableNames) {
      var now = Date.now();
      var startDate = exportFilterMode === "date_range" ? exportStartDate : "";
      var endDate = exportFilterMode === "date_range" ? exportEndDate : "";
      var exportAllTables = !tableNames || !tableNames.length;
      var selectedTablesMap = {};
      var customerMap = {};
      var customerSequence = 0;
      var userId = "user-default";
      var productLookup = {};

      products.forEach(function (product) {
        productLookup[product.id] = product;
      });

      function includeByDate(value) {
        return matchesExportDateRange(value, startDate, endDate);
      }

      function ensureCustomer(name, createdAt, totalAmount) {
        if (isWalkInCustomerName(name)) {
          return "";
        }

        var key = String(name || "").trim().toLowerCase();
        if (!customerMap[key]) {
          customerSequence += 1;
          customerMap[key] = {
            customer_id: "cust-" + padNumber(customerSequence, 4),
            customer_name: String(name || "").trim(),
            phone: "",
            email: "",
            birthday: "",
            customer_group: "regular",
            total_spent: 0,
            note: "",
            created_at: formatExportDateTime(createdAt),
            updated_at: formatExportDateTime(createdAt)
          };
        }

        customerMap[key].total_spent += Number(totalAmount) || 0;
        customerMap[key].updated_at = formatExportDateTime(createdAt);
        return customerMap[key].customer_id;
      }

      if (!exportAllTables) {
        tableNames.forEach(function (tableName) {
          selectedTablesMap[tableName] = true;
        });
      }

      var completedOrderRecords = sales
        .filter(function (sale) {
          return includeByDate(sale.createdAt);
        })
        .map(function (sale) {
          return {
            source: "sale",
            orderId: sale.orderId,
            createdAt: sale.createdAt,
            cashierName: sale.cashierName || settings.cashierName || "",
            customerName: sale.customerName || "",
            paymentMethod: sale.paymentMethod || "",
            cashReceived: Number(sale.cashReceived) || 0,
            subtotal: Number(sale.subtotal) || 0,
            discount: Number(sale.discount) || 0,
            vat: Number(sale.vat) || 0,
            total: Number(sale.total) || 0,
            paymentStatus: sale.paymentStatus || "paid",
            orderStatus: sale.orderStatus || "completed",
            note: sale.note || "",
            items: Array.isArray(sale.items) ? sale.items : []
          };
        });

      var openOrderRecords = orders
        .filter(function (order) {
          return includeByDate(order.createdAt);
        })
        .map(function (order) {
          var orderTotals = calculateOrder(order, addOns);
          return {
            source: "order",
            orderId: order.id,
            createdAt: order.createdAt,
            cashierName: settings.cashierName || "",
            customerName: order.customerName || "",
            paymentMethod: order.paymentMethod || "",
            cashReceived: Number(order.cashReceived) || 0,
            subtotal: Number(orderTotals.subtotal) || 0,
            discount: Number(orderTotals.discount) || 0,
            vat: Number(orderTotals.vat) || 0,
            total: Number(orderTotals.total) || 0,
            paymentStatus: order.items && order.items.length ? "pending" : "unpaid",
            orderStatus: order.status || "open",
            note: "",
            items: Array.isArray(order.items) ? order.items : []
          };
        });

      var exportOrderRecords = exportCompletedOrdersOnly
        ? completedOrderRecords
        : completedOrderRecords.concat(openOrderRecords);

      completedOrderRecords.forEach(function (record) {
        ensureCustomer(record.customerName, record.createdAt, record.total);
      });

      if (!exportCompletedOrdersOnly) {
        openOrderRecords.forEach(function (record) {
          ensureCustomer(record.customerName, record.createdAt, 0);
        });
      }

      var productsRows = products
        .filter(function (product) {
          return !exportActiveOnly || product.active !== false;
        })
        .map(function (product) {
          return {
            product_id: product.id,
            barcode: normalizeBarcode(product.barcode),
            sku: normalizeBarcode(product.barcode),
            product_name: product.name,
            category: getProductCategoryLabel(product),
            size_ml: "",
            price: Number(product.price) || 0,
            vat_rate: VAT_RATE,
            active: toCsvBoolean(product.active !== false),
            created_at: "",
            updated_at: ""
          };
        });

      var ingredientsRows = components
        .filter(function (component) {
          return !exportActiveOnly || component.active !== false;
        })
        .map(function (component) {
          return {
            ingredient_id: component.id,
            ingredient_name: L(component.label),
            category: "ingredient",
            unit: component.unit || "",
            cost_per_unit: 0,
            stock_qty: 0,
            min_stock: 0,
            supplier_id: "",
            active: toCsvBoolean(component.active !== false),
            created_at: "",
            updated_at: ""
          };
        });

      var activeIngredientIds = {};
      ingredientsRows.forEach(function (ingredient) {
        activeIngredientIds[ingredient.ingredient_id] = true;
      });

      var activeProductIds = {};
      productsRows.forEach(function (product) {
        activeProductIds[product.product_id] = true;
      });

      var productIngredientsRows = products.reduce(function (rows, product) {
        return rows.concat((product.componentIds || []).filter(function (componentId) {
          return (!exportActiveOnly || (activeProductIds[product.id] && activeIngredientIds[componentId]));
        }).map(function (componentId) {
          var component = components.find(function (item) {
            return item.id === componentId;
          }) || {};
          return {
            recipe_id: product.id + "-" + componentId,
            product_id: product.id,
            ingredient_id: componentId,
            qty_used: 1,
            unit: component.unit || "",
            waste_rate: 0,
            note: component.note || "",
            created_at: "",
            updated_at: ""
          };
        }));
      }, []);

      var ordersRows = exportOrderRecords.map(function (record) {
        return {
          order_id: record.orderId,
          order_code: record.orderId,
          order_date: formatExportDate(record.createdAt),
          order_time: formatExportTime(record.createdAt),
          cashier_id: userId,
          customer_id: ensureCustomer(record.customerName, record.createdAt, record.source === "sale" ? record.total : 0),
          subtotal: record.subtotal,
          discount_amount: record.discount,
          vat_amount: record.vat,
          total_amount: record.total,
          payment_status: record.paymentStatus,
          order_status: record.orderStatus,
          note: record.note,
          created_at: formatExportDateTime(record.createdAt)
        };
      });

      var orderItemsRows = exportOrderRecords.reduce(function (rows, record) {
        return rows.concat((record.items || []).map(function (item, index) {
          var product = productLookup[item.productId] || {};
          var addOnTotal = getItemAddonTotal(item, addOns);
          var unitPrice = (Number(item.price) || 0) + addOnTotal;
          var lineSubtotal = unitPrice * (Number(item.qty) || 0);
          var lineVat = lineSubtotal * VAT_RATE;
          return {
            order_item_id: item.id || record.orderId + "-item-" + padNumber(index + 1, 3),
            order_id: record.orderId,
            product_id: item.productId || "",
            barcode: normalizeBarcode(item.barcode || product.barcode || ""),
            product_name: item.name || product.name || "",
            qty: Number(item.qty) || 0,
            unit_price: unitPrice,
            discount_amount: 0,
            vat_rate: VAT_RATE,
            vat_amount: lineVat,
            line_total: lineSubtotal + lineVat,
            created_at: formatExportDateTime(record.createdAt)
          };
        }));
      }, []);

      var paymentsRows = completedOrderRecords.map(function (record, index) {
        return {
          payment_id: "payment-" + padNumber(index + 1, 4),
          order_id: record.orderId,
          payment_date: formatExportDate(record.createdAt),
          payment_time: formatExportTime(record.createdAt),
          method: L(record.paymentMethod || ""),
          amount: record.total,
          bank: /bank transfer|chuyển khoản/i.test(record.paymentMethod || "") ? "Bank Transfer" : "",
          transaction_ref: "",
          note: record.note || "",
          created_at: formatExportDateTime(record.createdAt)
        };
      });

      var customersRows = Object.keys(customerMap).map(function (key) {
        var customer = customerMap[key];
        return Object.assign({}, customer, {
          total_spent: Number(customer.total_spent) || 0
        });
      });

      var inventoryMovementsRows = completedOrderRecords.reduce(function (rows, record) {
        return rows.concat((record.items || []).map(function (item, index) {
          var product = productLookup[item.productId] || {};
          return {
            movement_id: "movement-" + record.orderId + "-" + padNumber(index + 1, 3),
            movement_date: formatExportDate(record.createdAt),
            movement_time: formatExportTime(record.createdAt),
            movement_type: "OUT",
            reference_type: "ORDER",
            reference_id: record.orderId,
            product_id: item.productId || "",
            ingredient_id: "",
            qty_in: 0,
            qty_out: Number(item.qty) || 0,
            unit: "item",
            unit_cost: "",
            total_cost: "",
            balance_after: typeof product.stock === "number" ? product.stock : "",
            note: "Auto export from completed order",
            created_at: formatExportDateTime(record.createdAt)
          };
        }));
      }, []);

      var suppliersRows = [];
      var purchaseOrdersRows = [];
      var purchaseItemsRows = [];

      var cashMovementsRows = completedOrderRecords.map(function (record, index) {
        return {
          cash_movement_id: "cash-" + padNumber(index + 1, 4),
          date: formatExportDate(record.createdAt),
          time: formatExportTime(record.createdAt),
          type: "IN",
          category: "sale",
          amount: record.total,
          payment_method: L(record.paymentMethod || ""),
          reference_id: record.orderId,
          description: "Sale payment",
          created_by: userId,
          created_at: formatExportDateTime(record.createdAt)
        };
      });

      var usersRows = [{
        user_id: userId,
        full_name: settings.cashierName || "POS User",
        role: "cashier",
        phone: settings.phone || "",
        email: "",
        active: toCsvBoolean(true),
        created_at: formatExportDateTime(now),
        updated_at: formatExportDateTime(now)
      }];

      var shiftsRows = [];
      var discountsRows = [];
      var taxSettingsRows = [{
        tax_id: "vat-8",
        tax_name: "VAT 8%",
        tax_rate: VAT_RATE,
        applies_to: "products",
        active: toCsvBoolean(true),
        effective_from: "",
        effective_to: ""
      }];

      var dailySummaryMap = {};
      completedOrderRecords.forEach(function (record) {
        var dateKey = formatExportDate(record.createdAt);
        if (!dailySummaryMap[dateKey]) {
          dailySummaryMap[dateKey] = {
            date: dateKey,
            total_orders: 0,
            total_items_sold: 0,
            gross_revenue: 0,
            discount_total: 0,
            vat_output: 0,
            net_revenue: 0,
            cash_revenue: 0,
            bank_transfer_revenue: 0,
            card_revenue: 0,
            total_cost: 0,
            gross_profit: 0,
            created_at: formatExportDateTime(record.createdAt)
          };
        }

        dailySummaryMap[dateKey].total_orders += 1;
        dailySummaryMap[dateKey].total_items_sold += (record.items || []).reduce(function (sum, item) {
          return sum + (Number(item.qty) || 0);
        }, 0);
        dailySummaryMap[dateKey].gross_revenue += record.subtotal;
        dailySummaryMap[dateKey].discount_total += record.discount;
        dailySummaryMap[dateKey].vat_output += record.vat;
        dailySummaryMap[dateKey].net_revenue += record.total - record.vat;

        if (/cash|tiền mặt/i.test(record.paymentMethod || "")) {
          dailySummaryMap[dateKey].cash_revenue += record.total;
        } else if (/bank transfer|chuyển khoản/i.test(record.paymentMethod || "")) {
          dailySummaryMap[dateKey].bank_transfer_revenue += record.total;
        } else if (/card|thẻ/i.test(record.paymentMethod || "")) {
          dailySummaryMap[dateKey].card_revenue += record.total;
        }
      });

      var dailySummaryRows = Object.keys(dailySummaryMap).sort().map(function (dateKey) {
        return dailySummaryMap[dateKey];
      });

      var settingsDescriptions = {
        storeName: "Store name for receipts and exports",
        brandLine: "Upper brand line",
        brandDisplayName: "Primary display brand",
        branchName: "Branch name",
        address: "Store address",
        phone: "Store phone number",
        taxId: "Tax identification number",
        cashierName: "Default cashier name",
        openHours: "Opening hours",
        receiptFooter: "Receipt footer text",
        vatNote: "VAT invoice note"
      };

      var settingsRows = Object.keys(settings).map(function (settingKey) {
        return {
          setting_key: settingKey,
          setting_value: settings[settingKey],
          description: settingsDescriptions[settingKey] || "",
          updated_at: formatExportDateTime(now)
        };
      }).concat([
        {
          setting_key: "selected_invoice_template_id",
          setting_value: selectedInvoiceTemplateId,
          description: "Active invoice template id",
          updated_at: formatExportDateTime(now)
        },
        {
          setting_key: "selected_barcode_template_id",
          setting_value: selectedBarcodeTemplateId,
          description: "Active barcode template id",
          updated_at: formatExportDateTime(now)
        }
      ]);

      var rowsByTable = {
        products: productsRows,
        ingredients: ingredientsRows,
        product_ingredients: productIngredientsRows,
        orders: ordersRows,
        order_items: orderItemsRows,
        payments: paymentsRows,
        customers: customersRows,
        inventory_movements: inventoryMovementsRows,
        suppliers: suppliersRows,
        purchase_orders: purchaseOrdersRows,
        purchase_items: purchaseItemsRows,
        cash_movements: cashMovementsRows,
        users: usersRows,
        shifts: shiftsRows,
        discounts: discountsRows,
        tax_settings: taxSettingsRows,
        daily_summary: dailySummaryRows,
        settings: settingsRows
      };

      var exportLog = {
        export_date: formatExportDateTime(now),
        exported_by: settings.cashierName || "POS User",
        total_rows_per_table: {},
        pos_app_version: APP_VERSION,
        date_range: exportFilterMode === "date_range"
          ? {
              start_date: exportStartDate || null,
              end_date: exportEndDate || null
            }
          : null
      };

      EXPORT_TABLE_SCHEMAS.forEach(function (tableSchema) {
        var includeTable = exportAllTables || selectedTablesMap[tableSchema.tableName];
        if (includeTable) {
          exportLog.total_rows_per_table[tableSchema.tableName] = (rowsByTable[tableSchema.tableName] || []).length;
        }
      });

      return {
        rowsByTable: rowsByTable,
        schema: EXPORT_TABLE_SCHEMAS.map(function (tableSchema) {
          return {
            table_name: tableSchema.tableName,
            columns: tableSchema.columns.map(function (column) {
              return {
                name: column.name,
                data_type: column.type,
                primary_key: !!column.primaryKey,
                foreign_key: column.foreignKey || null
              };
            })
          };
        }),
        exportLog: exportLog
      };
    }

    function downloadBlob(blob, fileName) {
      var url = window.URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () {
        window.URL.revokeObjectURL(url);
      }, 1500);
    }

    function buildBackupFileName() {
      var now = new Date();
      return "pos_database_backup_" + [
        now.getFullYear(),
        padNumber(now.getMonth() + 1, 2),
        padNumber(now.getDate(), 2)
      ].join("-") + "_" + [
        padNumber(now.getHours(), 2),
        padNumber(now.getMinutes(), 2)
      ].join("-") + ".zip";
    }

    function exportDatabaseBackup(tableNames) {
      if (!window.JSZip) {
        window.alert(L("Thiếu thư viện tạo file ZIP. Hãy mở lại trang khi có internet. / The ZIP export library is missing. Reload the page with an internet connection."));
        return;
      }

      if (exportFilterMode === "date_range" && exportStartDate && exportEndDate && exportStartDate > exportEndDate) {
        window.alert(L("Khoảng ngày export chưa hợp lệ. / The export date range is invalid."));
        return;
      }

      if (tableNames && !tableNames.length) {
        window.alert(L("Hãy chọn ít nhất 1 bảng để export. / Select at least one table to export."));
        return;
      }

      var payload = buildExportPayload(tableNames);
      var zip = new window.JSZip();
      var selectedMap = {};

      (tableNames || getExportTableNames()).forEach(function (tableName) {
        selectedMap[tableName] = true;
      });

      setExportBusy(true);

      EXPORT_TABLE_SCHEMAS.forEach(function (tableSchema) {
        if (tableNames && !selectedMap[tableSchema.tableName]) {
          return;
        }

        var csvColumns = tableSchema.columns.map(function (column) {
          return column.name;
        });
        var tableRows = payload.rowsByTable[tableSchema.tableName] || [];
        zip.file(tableSchema.tableName + ".csv", buildCsvContent(csvColumns, tableRows));
      });

      zip.file("schema.json", JSON.stringify(payload.schema.filter(function (tableSchema) {
        return !tableNames || selectedMap[tableSchema.table_name];
      }), null, 2));
      zip.file("export_log.json", JSON.stringify(payload.exportLog, null, 2));

      zip.generateAsync({ type: "blob" }).then(function (blob) {
        downloadBlob(blob, buildBackupFileName());
      }).catch(function () {
        window.alert(L("Không thể tạo file backup. / Failed to create the backup file."));
      }).finally(function () {
        setExportBusy(false);
      });
    }

    function updateProductDraft(field, value) {
      setProductDraft(function (currentDraft) {
        return Object.assign({}, currentDraft, { [field]: value });
      });
    }

    function resetProductDraft() {
      setProductDraft({
        id: null,
        name: "",
        category: categories[0] ? categories[0].id : "",
        price: 0,
        stock: 0,
        barcode: "",
        image: "🍊",
        description: "",
        componentIds: []
      });
    }

    function toggleProductDraftComponent(componentId) {
      setProductDraft(function (currentDraft) {
        var currentIds = currentDraft.componentIds || [];
        var nextIds = currentIds.indexOf(componentId) === -1
          ? currentIds.concat(componentId)
          : currentIds.filter(function (currentId) {
              return currentId !== componentId;
            });

        return Object.assign({}, currentDraft, { componentIds: nextIds });
      });
    }

    function updateCategoryDraft(field, value) {
      setCategoryDraft(function (currentDraft) {
        return Object.assign({}, currentDraft, { [field]: value });
      });
    }

    function resetCategoryDraft() {
      setCategoryDraft({
        id: null,
        labelVi: "",
        labelEn: "",
        icon: "🍊"
      });
    }

    function startEditCategory(category) {
      var labelParts = splitBilingualLabel(category.label);
      setCategoryDraft({
        id: category.id,
        labelVi: labelParts.vi,
        labelEn: labelParts.en,
        icon: category.icon || "🍊"
      });
      setActiveView("inventory");
      setInventorySection("catalog");
    }

    function submitCategory(event) {
      event.preventDefault();

      var label = buildBilingualLabel(categoryDraft.labelVi, categoryDraft.labelEn);
      if (!label.trim()) {
        window.alert(L("Nhập tên danh mục trước khi lưu. / Enter a category name before saving."));
        return;
      }

      if (categoryDraft.id) {
        setCategories(function (currentCategories) {
          return currentCategories.map(function (category) {
            return category.id === categoryDraft.id
              ? Object.assign({}, category, {
                  label: label,
                  icon: categoryDraft.icon || category.icon || "🍊"
                })
              : category;
          });
        });
      } else {
        var baseId = slugify(categoryDraft.labelEn || categoryDraft.labelVi || uid("category"));
        var nextId = baseId;

        while (categories.some(function (category) { return category.id === nextId; })) {
          nextId = baseId + "-" + Math.random().toString(36).slice(2, 5);
        }

        setCategories(function (currentCategories) {
          return currentCategories.concat({
            id: nextId,
            label: label,
            icon: categoryDraft.icon || "🍊"
          });
        });
      }

      resetCategoryDraft();
    }

    function removeCategory(categoryId) {
      if (categories.length === 1) {
        window.alert(L("Cần giữ ít nhất 1 danh mục. / Keep at least one category."));
        return;
      }

      if (!window.confirm(L("Xóa danh mục này và chuyển sản phẩm sang danh mục khác? / Remove this category and move its products to another category?"))) {
        return;
      }

      var fallbackCategory = categories.find(function (category) {
        return category.id !== categoryId;
      });

      setCategories(function (currentCategories) {
        return currentCategories.filter(function (category) {
          return category.id !== categoryId;
        });
      });

      if (fallbackCategory) {
        setProducts(function (currentProducts) {
          return currentProducts.map(function (product) {
            return product.category === categoryId
              ? Object.assign({}, product, { category: fallbackCategory.id })
              : product;
          });
        });
      }

      if (productDraft.category === categoryId) {
        setProductDraft(function (currentDraft) {
          return Object.assign({}, currentDraft, {
            category: fallbackCategory ? fallbackCategory.id : ""
          });
        });
      }

      if (categoryDraft.id === categoryId) {
        resetCategoryDraft();
      }
    }

    function updateAddOnDraft(field, value) {
      setAddOnDraft(function (currentDraft) {
        return Object.assign({}, currentDraft, { [field]: value });
      });
    }

    function resetAddOnDraft() {
      setAddOnDraft({
        id: null,
        labelVi: "",
        labelEn: "",
        price: 0,
        group: "extras"
      });
    }

    function startEditAddOn(addOn) {
      var labelParts = splitBilingualLabel(addOn.label);
      setAddOnDraft({
        id: addOn.id,
        labelVi: labelParts.vi,
        labelEn: labelParts.en,
        price: Number(addOn.price) || 0,
        group: addOn.group || "extras"
      });
      setActiveView("inventory");
      setInventorySection("catalog");
    }

    function submitAddOn(event) {
      event.preventDefault();

      var label = buildBilingualLabel(addOnDraft.labelVi, addOnDraft.labelEn);
      if (!label.trim()) {
        window.alert(L("Nhập tên add-on trước khi lưu. / Enter an add-on name before saving."));
        return;
      }

      if (addOnDraft.id) {
        setAddOns(function (currentAddOns) {
          return currentAddOns.map(function (addOn) {
            return addOn.id === addOnDraft.id
              ? Object.assign({}, addOn, {
                  label: label,
                  price: Number(addOnDraft.price) || 0,
                  group: addOnDraft.group || "extras"
                })
              : addOn;
          });
        });
      } else {
        var baseId = slugify(addOnDraft.labelEn || addOnDraft.labelVi || uid("addon"));
        var nextId = baseId;

        while (addOns.some(function (addOn) { return addOn.id === nextId; })) {
          nextId = baseId + "-" + Math.random().toString(36).slice(2, 5);
        }

        setAddOns(function (currentAddOns) {
          return currentAddOns.concat({
            id: nextId,
            label: label,
            price: Number(addOnDraft.price) || 0,
            group: addOnDraft.group || "extras"
          });
        });
      }

      resetAddOnDraft();
    }

    function removeAddOn(addOnId) {
      if (!window.confirm(L("Xóa add-on này khỏi toàn bộ hệ thống? / Remove this add-on from the whole system?"))) {
        return;
      }

      setAddOns(function (currentAddOns) {
        return currentAddOns.filter(function (addOn) {
          return addOn.id !== addOnId;
        });
      });

      setOrders(function (currentOrders) {
        return currentOrders.map(function (order) {
          return Object.assign({}, order, {
            items: (order.items || []).map(function (item) {
              return Object.assign({}, item, {
                addOnIds: (item.addOnIds || []).filter(function (currentId) {
                  return currentId !== addOnId;
                })
              });
            })
          });
        });
      });

      if (addOnDraft.id === addOnId) {
        resetAddOnDraft();
      }
    }

    function updateComponentDraft(field, value) {
      setComponentDraft(function (currentDraft) {
        return Object.assign({}, currentDraft, { [field]: value });
      });
    }

    function resetComponentDraft() {
      setComponentDraft({
        id: null,
        labelVi: "",
        labelEn: "",
        unit: "",
        note: ""
      });
    }

    function startEditComponent(component) {
      var labelParts = splitBilingualLabel(component.label);
      setComponentDraft({
        id: component.id,
        labelVi: labelParts.vi,
        labelEn: labelParts.en,
        unit: component.unit || "",
        note: component.note || ""
      });
      setActiveView("inventory");
      setInventorySection("catalog");
    }

    function submitComponent(event) {
      event.preventDefault();

      var label = buildBilingualLabel(componentDraft.labelVi, componentDraft.labelEn);
      if (!label.trim()) {
        window.alert(L("Nhập tên thành phần trước khi lưu. / Enter a component name before saving."));
        return;
      }

      if (componentDraft.id) {
        setComponents(function (currentComponents) {
          return currentComponents.map(function (component) {
            return component.id === componentDraft.id
              ? Object.assign({}, component, {
                  label: label,
                  unit: componentDraft.unit,
                  note: componentDraft.note
                })
              : component;
          });
        });
      } else {
        var baseId = slugify(componentDraft.labelEn || componentDraft.labelVi || uid("component"));
        var nextId = baseId;

        while (components.some(function (component) { return component.id === nextId; })) {
          nextId = baseId + "-" + Math.random().toString(36).slice(2, 5);
        }

        setComponents(function (currentComponents) {
          return currentComponents.concat({
            id: nextId,
            label: label,
            unit: componentDraft.unit,
            note: componentDraft.note
          });
        });
      }

      resetComponentDraft();
    }

    function removeComponent(componentId) {
      if (!window.confirm(L("Xóa thành phần này khỏi toàn bộ sản phẩm? / Remove this component from all products?"))) {
        return;
      }

      setComponents(function (currentComponents) {
        return currentComponents.filter(function (component) {
          return component.id !== componentId;
        });
      });

      setProducts(function (currentProducts) {
        return currentProducts.map(function (product) {
          return Object.assign({}, product, {
            componentIds: (product.componentIds || []).filter(function (currentId) {
              return currentId !== componentId;
            })
          });
        });
      });

      if (productDraft.componentIds && productDraft.componentIds.indexOf(componentId) !== -1) {
        setProductDraft(function (currentDraft) {
          return Object.assign({}, currentDraft, {
            componentIds: (currentDraft.componentIds || []).filter(function (currentId) {
              return currentId !== componentId;
            })
          });
        });
      }

      if (componentDraft.id === componentId) {
        resetComponentDraft();
      }
    }

    function submitProduct(event) {
      event.preventDefault();

      if (!productDraft.name.trim()) {
        window.alert(L("Nhập tên sản phẩm trước khi lưu. / Enter a product name before saving."));
        return;
      }

      if (productDraft.id) {
        setProducts(function (currentProducts) {
          return currentProducts.map(function (product) {
            return product.id === productDraft.id
              ? Object.assign({}, product, {
                  name: productDraft.name,
                  category: productDraft.category,
                  price: Number(productDraft.price) || 0,
                  stock: Number(productDraft.stock) || 0,
                  barcode: getScannableBarcode(
                    productDraft.barcode || product.barcode,
                    [productDraft.id || product.id, productDraft.name, productDraft.category].join("|")
                  ),
                  image: productDraft.image || "🍊",
                  description: productDraft.description,
                  componentIds: productDraft.componentIds || []
                })
              : product;
          });
        });

        setOrders(function (currentOrders) {
          return currentOrders.map(function (order) {
            return Object.assign({}, order, {
              items: (order.items || []).map(function (item) {
                return item.productId === productDraft.id
                  ? Object.assign({}, item, {
                      name: productDraft.name,
                      price: Number(productDraft.price) || 0
                    })
                  : item;
              })
            });
          });
        });
      } else {
        var newProduct = {
          id: uid("product"),
          name: productDraft.name,
          category: productDraft.category,
          price: Number(productDraft.price) || 0,
          stock: Number(productDraft.stock) || 0,
          barcode: getScannableBarcode(
            productDraft.barcode,
            [productDraft.name, productDraft.category, productDraft.price, productDraft.stock, Date.now()].join("|")
          ),
          image: productDraft.image || "🍊",
          description: productDraft.description,
          componentIds: productDraft.componentIds || []
        };

        setProducts(function (currentProducts) {
          return [newProduct].concat(currentProducts);
        });
        setSelectedBarcodeProductId(newProduct.id);
      }

      resetProductDraft();
    }

    function startEditProduct(product) {
      setProductDraft({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        barcode: product.barcode,
        image: product.image,
        description: product.description || "",
        componentIds: product.componentIds || []
      });
      setActiveView("inventory");
      setInventorySection("product");
    }

    function removeProduct(productId) {
      if (!window.confirm(L("Xóa sản phẩm này khỏi kho hàng? / Remove this product from inventory?"))) {
        return;
      }

      setProducts(function (currentProducts) {
        return currentProducts.filter(function (product) {
          return product.id !== productId;
        });
      });

      if (productDraft.id === productId) {
        resetProductDraft();
      }
    }

    function updateProductStock(productId, nextStock) {
      setProducts(function (currentProducts) {
        return currentProducts.map(function (product) {
          return product.id === productId
            ? Object.assign({}, product, { stock: Math.max(0, Number(nextStock) || 0) })
            : product;
        });
      });
    }

    function toggleProductSelection(productId) {
      setSelectedProductIds(function (currentIds) {
        return currentIds.indexOf(productId) === -1
          ? currentIds.concat(productId)
          : currentIds.filter(function (currentId) {
              return currentId !== productId;
            });
      });
    }

    function toggleSelectAllProducts() {
      setSelectedProductIds(function (currentIds) {
        if (currentIds.length === products.length) {
          return [];
        }

        return products.map(function (product) {
          return product.id;
        });
      });
    }

    function getLabelQuantity(productId) {
      return Math.max(1, Number(labelPrintQuantities[productId]) || 1);
    }

    function updateLabelQuantity(productId, value) {
      setLabelPrintQuantities(function (currentQuantities) {
        return Object.assign({}, currentQuantities, {
          [productId]: Math.max(1, Number(value) || 1)
        });
      });
    }

    function patchSettings(field, value) {
      setSettings(function (currentSettings) {
        return Object.assign({}, currentSettings, { [field]: value });
      });
    }

    function patchInvoiceTemplate(templateId, field, value) {
      setInvoiceTemplates(function (currentTemplates) {
        return currentTemplates.map(function (template) {
          return template.id === templateId
            ? Object.assign({}, template, { [field]: value })
            : template;
        });
      });
    }

    function patchBarcodeTemplate(templateId, field, value) {
      setBarcodeTemplates(function (currentTemplates) {
        return currentTemplates.map(function (template) {
          return template.id === templateId
            ? Object.assign({}, template, { [field]: value })
            : template;
        });
      });
    }

    function addInvoiceTemplate() {
      var newTemplate = {
        id: uid("invoice"),
        name: "New Invoice",
        title: "PHIEU THANH TOAN",
        subtitle: "Tuy chinh moi",
        footer: "Cam on quy khach.",
        showSubtitle: true,
        showAddress: true,
        showBranch: true,
        showPhone: true,
        showTaxId: true,
        showCashier: true,
        showCustomerName: true,
        showPaymentMethod: true,
        showCashReceived: true,
        showChangeDue: true,
        showOrderMeta: true
      };

      setInvoiceTemplates(function (currentTemplates) {
        return currentTemplates.concat(newTemplate);
      });
      setSelectedInvoiceTemplateId(newTemplate.id);
    }

    function removeInvoiceTemplate(templateId) {
      if (invoiceTemplates.length === 1) {
        window.alert(L("Cần giữ ít nhất 1 mẫu hóa đơn. / Keep at least one invoice template."));
        return;
      }

      setInvoiceTemplates(function (currentTemplates) {
        return currentTemplates.filter(function (template) {
          return template.id !== templateId;
        });
      });

      if (selectedInvoiceTemplateId === templateId) {
        var fallbackTemplate = invoiceTemplates.find(function (template) {
          return template.id !== templateId;
        });
        if (fallbackTemplate) {
          setSelectedInvoiceTemplateId(fallbackTemplate.id);
        }
      }
    }

    function addBarcodeTemplate() {
      var newTemplate = {
        id: uid("barcode"),
        name: "New Barcode",
        prefix: "TFH",
        suffix: "X",
        width: 180,
        height: 72,
        printWidthMm: 90,
        printHeightMm: 55,
        title: "New Barcode Label",
        subtitle: "Custom barcode label",
        showName: true,
        showPrice: true,
        showStoreName: true,
        showCategory: true,
        showBarcodeValue: true,
        accent: "#db5d17"
      };

      setBarcodeTemplates(function (currentTemplates) {
        return currentTemplates.concat(newTemplate);
      });
      setSelectedBarcodeTemplateId(newTemplate.id);
    }

    function removeBarcodeTemplate(templateId) {
      if (barcodeTemplates.length === 1) {
        window.alert(L("Cần giữ ít nhất 1 mẫu mã vạch. / Keep at least one barcode template."));
        return;
      }

      setBarcodeTemplates(function (currentTemplates) {
        return currentTemplates.filter(function (template) {
          return template.id !== templateId;
        });
      });

      if (selectedBarcodeTemplateId === templateId) {
        var fallbackTemplate = barcodeTemplates.find(function (template) {
          return template.id !== templateId;
        });
        if (fallbackTemplate) {
          setSelectedBarcodeTemplateId(fallbackTemplate.id);
        }
      }
    }

    function renderPosView() {
      var changeDue = Math.max(0, (Number(activeOrder.cashReceived) || 0) - totals.total);
      var quickCashOptions = [50000, 100000, 200000, 500000];
      return html`
        <section className="pos-layout">
          <aside className="pos-category-toolbar surface">
            <div>
              <p className="eyebrow">${L("Danh mục / Categories")}</p>
              <h2 className="section-title">${L("Loại đồ uống / Product Groups")}</h2>
            </div>
            <div className="pos-category-list">
              ${filterCategories.map(function (category) {
                return html`
                  <button
                    key=${category.id}
                    className=${"category-pill category-pill-toolbar" + (selectedCategory === category.id ? " is-active" : "")}
                    onClick=${function () {
                      setSelectedCategory(category.id);
                    }}
                  >
                    <span>${category.icon}</span>
                    <span>${L(category.label)}</span>
                  </button>
                `;
              })}
            </div>
          </aside>

          <div className="pos-main-stack">
            <section className="surface section-card pos-bill-board">
              <div className="section-top">
                <div>
                  <p className="eyebrow">${L("Đơn đang mở / Open Orders")}</p>
                  <h2 className="section-title">${L("Chọn bill đang thao tác / Pick Active Bill")}</h2>
                </div>
              </div>

              <div className="order-switcher order-switcher-board">
                ${orders.map(function (order) {
                  return html`
                    <button
                      key=${order.id}
                      className=${"order-chip order-chip-board" + (order.id === activeOrder.id ? " is-active" : "")}
                      onClick=${function () {
                        setActiveOrderId(order.id);
                      }}
                    >
                      <span>${order.id}</span>
                      <small>${order.status === "held" ? L("Tạm giữ / Held") : L("Đang mở / Open")}</small>
                    </button>
                  `;
                })}
                <button className="order-chip order-chip-create order-chip-board" onClick=${createNewOrder}>
                  <span>${L("+ Đơn mới / + New Order")}</span>
                  <small>${L("Tạo giỏ khác / Create another cart")}</small>
                </button>
              </div>
            </section>

            <section className="catalog-panel surface scanner-panel">
              <div className="section-top">
                <div>
                  <p className="eyebrow">${L("Barcode / Barcode")}</p>
                  <h2 className="section-title">${L("Quét mã sản phẩm / Scan Product Barcode")}</h2>
                </div>
              </div>

              <form className="scanner-form" onSubmit=${function (event) {
                event.preventDefault();
                handleScannedBarcode(barcodeInput);
              }}>
                <label className="field">
                  <span>${L("Mã barcode / Barcode Value")}</span>
                  <input
                    ref=${barcodeInputRef}
                    value=${barcodeInput}
                    placeholder=${L("Quét bằng máy scan hoặc nhập mã / Scan with a scanner or type the code")}
                    onInput=${function (event) {
                      setBarcodeInput(event.target.value);
                    }}
                  />
                </label>

                <div className="scanner-actions">
                  <button type="submit" className="primary-btn">${L("Thêm bằng barcode / Add by Barcode")}</button>
                  ${cameraActive
                    ? html`<button type="button" className="ghost-btn" onClick=${stopCameraScan}>${L("Dừng camera / Stop Camera")}</button>`
                    : html`<button type="button" className="ghost-btn" onClick=${startCameraScan}>${L("Mở camera / Open Camera")}</button>`}
                </div>

                <input
                  ref=${barcodeCaptureInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="scanner-capture-input"
                  onChange=${handleBarcodeImageCapture}
                />
              </form>

              <div className="scanner-helper">
                <div className="empty-state align-left">
                  ${L("Desktop: máy scan USB có thể quét trực tiếp vào POS ngay cả khi chưa click đúng ô nhập. / Desktop: a USB barcode scanner can scan directly into POS even if the barcode field is not focused.")}
                </div>
                <div className="empty-state align-left">
                  ${cameraScanSupported
                    ? L("Nút Mở camera sẽ tự quét live nếu thiết bị hỗ trợ, hoặc tự chuyển sang chụp/chọn ảnh barcode khi cần. / The Open Camera button will use live scanning when supported, or switch to capturing/choosing a barcode image when needed.")
                    : L("Nếu live camera không hỗ trợ, nút Mở camera sẽ chuyển sang chụp hoặc chọn ảnh barcode. / If live camera is unavailable, the Open Camera button will switch to capturing or choosing a barcode image.")}
                </div>
                ${scanMessage ? html`<div className="scanner-status">${scanMessage}</div>` : null}
              </div>

              ${cameraActive ? html`
                <div className="scanner-video-shell">
                  <video ref=${videoRef} className="scanner-video" playsInline muted autoplay></video>
                </div>
              ` : null}

              <div className="list-stack">
                ${(selectedCategory === "all" ? products : filteredProducts).slice(0, 6).map(function (product) {
                  return html`
                    <article key=${product.id} className="list-row list-row-actions">
                      <div>
                        <strong>${product.image} ${product.name}</strong>
                        <p>${product.barcode} · ${formatCurrency(product.price)}</p>
                      </div>
                      <div className="row-actions">
                        <span className="stock-badge">${product.stock}</span>
                        <button className="ghost-btn" onClick=${function () { addProductToOrder(product); }}>${L("Thêm / Add")}</button>
                      </div>
                    </article>
                  `;
                })}
              </div>
            </section>
          </div>

          <aside className="order-panel surface">
            <div className="order-panel-top">
              <div className="order-hero">
                <div>
                  <p className="eyebrow">${L("Đơn hiện tại / Current Order")}</p>
                  <h2 className="section-title">${activeOrder.id}</h2>
                </div>
                <div className="item-badge">#${totals.itemCount} ${L("món / items")}</div>
              </div>
              <button className="ghost-btn" onClick=${cancelOrder}>${L("Xóa / Clear")}</button>
            </div>

            <div className="order-items">
              ${activeOrder.items.length
                ? activeOrder.items.map(function (item) {
                    return html`
                      <article key=${item.id} className="order-item">
                        <div className="order-item-head">
                          <div>
                            <h3>${item.name}</h3>
                            <p>${formatCurrency(item.price)} · ${L("mỗi món / per item")}</p>
                          </div>
                          <button className="ghost-btn danger-text" onClick=${function () {
                            removeItem(item.id);
                          }}>
                            ${L("Xóa / Remove")}
                          </button>
                        </div>

                        <div className="qty-row">
                          <button className="qty-btn" onClick=${function () {
                            adjustItemQty(item.id, -1);
                          }}>-</button>
                          <strong>${item.qty}</strong>
                          <button className="qty-btn" onClick=${function () {
                            adjustItemQty(item.id, 1);
                          }}>+</button>
                          <span className="line-total">${formatCurrency((item.price + getItemAddonTotal(item, addOns)) * item.qty)}</span>
                        </div>

                        <div className="addon-row">
                          ${addOns.map(function (addOn) {
                            var active = (item.addOnIds || []).indexOf(addOn.id) !== -1;
                            return html`
                              <button
                                key=${addOn.id}
                                className=${"addon-chip" + (active ? " is-active" : "")}
                                type="button"
                                onClick=${function () {
                                  toggleAddon(item.id, addOn.id);
                                }}
                              >
                                ${L(addOn.label)}${addOn.price ? " +" + formatCurrency(addOn.price) : ""}
                              </button>
                            `;
                          })}
                        </div>
                      </article>
                    `;
                  })
                : html`<div className="empty-state">${L("Chưa có sản phẩm trong giỏ. Quét mã vạch hoặc bấm Thêm. / No items in cart yet.")}</div>`}
            </div>

            <div className="payment-grid">
              <label className="field">
                <span>${L("Tên khách hàng / Customer Name")}</span>
                <input
                  value=${activeOrder.customerName === "Khách lẻ / Walk-in" ? L("Khách lẻ / Walk-in") : (activeOrder.customerName || "")}
                  onInput=${function (event) {
                    updateActiveOrder(function (order) {
                      return Object.assign({}, order, { customerName: event.target.value });
                    });
                  }}
                />
              </label>

              <label className="field">
                <span>${L("Phương thức thanh toán / Payment Method")}</span>
                <div
                  className=${"payment-select-shell" + (paymentMenuOpen ? " is-open" : "")}
                  onClick=${function (event) {
                    event.stopPropagation();
                  }}
                >
                  <button
                    type="button"
                    className="payment-select-trigger"
                    onClick=${function (event) {
                      event.stopPropagation();
                      setPaymentMenuOpen(!paymentMenuOpen);
                    }}
                  >
                    <span>${L(activeOrder.paymentMethod || "Chuyển khoản / Bank Transfer")}</span>
                    <span className="payment-select-icon">▾</span>
                  </button>

                  ${paymentMenuOpen ? html`
                    <div className="payment-select-dropdown">
                      ${PAYMENT_METHOD_OPTIONS.map(function (option) {
                        var isActive = (activeOrder.paymentMethod || "Chuyển khoản / Bank Transfer") === option.value;
                        return html`
                          <button
                            key=${option.value}
                            type="button"
                            className=${"payment-select-option" + (isActive ? " is-active" : "")}
                            onClick=${function (event) {
                              event.stopPropagation();
                              updateActiveOrder(function (order) {
                                return Object.assign({}, order, { paymentMethod: option.value });
                              });
                              setPaymentMenuOpen(false);
                            }}
                          >
                            <span>${L(option.label)}</span>
                            <span className="payment-select-check">${isActive ? "✓" : ""}</span>
                          </button>
                        `;
                      })}
                    </div>
                  ` : null}
                </div>
              </label>
            </div>

            <div className="payment-grid payment-grid-single">
              <label className="field">
                <span>${L("Tiền khách đưa / Cash Received")}</span>
                <input
                  type="number"
                  value=${activeOrder.cashReceived || 0}
                  onInput=${function (event) {
                    updateActiveOrder(function (order) {
                      return Object.assign({}, order, { cashReceived: Number(event.target.value) || 0 });
                    });
                  }}
                />
              </label>
              <label className="field discount-box">
                <span>${L("Giảm giá / Discount (%)")}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value=${activeOrder.discountPct || 0}
                  onInput=${function (event) {
                    var nextValue = Number(event.target.value) || 0;
                    updateActiveOrder(function (order) {
                      return Object.assign({}, order, { discountPct: nextValue });
                    });
                  }}
                />
              </label>
            </div>

            <div className="quick-cash-row">
              ${quickCashOptions.map(function (amount) {
                return html`
                  <button
                    key=${amount}
                    className="cash-chip"
                    onClick=${function () {
                      updateActiveOrder(function (order) {
                        return Object.assign({}, order, { cashReceived: amount });
                      });
                    }}
                  >
                    ${formatCurrency(amount)}
                  </button>
                `;
              })}
            </div>

            <div className="summary-list">
              <div><span>${L("Số món / Items")}</span><strong>${totals.itemCount}</strong></div>
              <div><span>${L("Tạm tính / Subtotal")}</span><strong>${formatCurrency(totals.subtotal)}</strong></div>
              <div><span>${L("Giảm giá / Discount")}</span><strong>${formatCurrency(totals.discount)}</strong></div>
              <div><span>${L("Thuế / VAT")}</span><strong>${formatCurrency(totals.vat)}</strong></div>
              <div className="summary-total"><span>${L("Tổng cộng / Total")}</span><strong>${formatCurrency(totals.total)}</strong></div>
              <div><span>${L("Tiền thừa / Change")}</span><strong>${formatCurrency(changeDue)}</strong></div>
            </div>

            <div className="button-row button-row-main">
              <button className="ghost-btn preview-btn" onClick=${previewInvoice}>${L("Xem trước hóa đơn / Preview Invoice")}</button>
              <button className="primary-btn checkout-btn" onClick=${payNow}>${L("Hoàn tất bán hàng / Complete Sale")}</button>
            </div>

            <div className="button-row button-row-secondary">
              <button className="ghost-btn" onClick=${holdOrder}>${L("Tạm giữ đơn / Hold Order")}</button>
              <button className="ghost-btn" onClick=${function () { printWithTemplate("In hóa đơn / Print Bill"); }}>${L("In hóa đơn / Print Bill")}</button>
              <button className="ghost-btn" onClick=${function () { printWithTemplate("Xuất hóa đơn VAT / Issue VAT Invoice"); }}>${L("Xuất hóa đơn VAT / Issue VAT Invoice")}</button>
            </div>
          </aside>
        </section>
      `;
    }

    function renderDashboardView() {
      return html`
        <section className="stack-view">
          <div className="card-grid card-grid-4">
            <article className="metric-card surface">
              <span className="metric-label">${L("Doanh thu hôm nay / Revenue Today")}</span>
              <strong>${formatCurrency(dashboardMetrics.revenueToday)}</strong>
            </article>
            <article className="metric-card surface">
              <span className="metric-label">${L("Số đơn hôm nay / Orders Today")}</span>
              <strong>${dashboardMetrics.ordersToday}</strong>
            </article>
            <article className="metric-card surface">
              <span className="metric-label">${L("Sản phẩm / Products")}</span>
              <strong>${products.length}</strong>
            </article>
            <article className="metric-card surface">
              <span className="metric-label">${L("Sắp hết hàng / Low Stock")}</span>
              <strong>${dashboardMetrics.lowStock.length}</strong>
            </article>
          </div>

          <div className="split-grid">
            <section className="surface section-card">
              <div className="section-top">
                <div>
                  <p className="eyebrow">${L("Giao dịch gần đây / Recent Sales")}</p>
                  <h2 className="section-title">${L("Lịch sử thanh toán / Sales History")}</h2>
                </div>
              </div>
              <div className="list-stack">
                ${dashboardMetrics.recentSales.length
                  ? dashboardMetrics.recentSales.map(function (sale) {
                      return html`
                        <article key=${sale.id} className="list-row">
                          <div>
                            <strong>${sale.orderId}</strong>
                            <p>${formatDateTime(sale.createdAt)}</p>
                          </div>
                          <strong>${formatCurrency(sale.total)}</strong>
                        </article>
                      `;
                    })
                  : html`<div className="empty-state">${L("Chưa có giao dịch nào được thanh toán. / No paid transactions yet.")}</div>`}
              </div>
            </section>

            <section className="surface section-card">
              <div className="section-top">
                <div>
                  <p className="eyebrow">${L("Kho hàng / Inventory")}</p>
                  <h2 className="section-title">${L("Cảnh báo tồn kho / Stock Alerts")}</h2>
                </div>
              </div>
              <div className="list-stack">
                ${dashboardMetrics.lowStock.length
                  ? dashboardMetrics.lowStock.map(function (product) {
                      return html`
                        <article key=${product.id} className="list-row">
                          <div>
                            <strong>${product.name}</strong>
                            <p>${product.barcode}</p>
                          </div>
                          <span className="stock-badge">${product.stock} ${L("còn / left")}</span>
                        </article>
                      `;
                    })
                  : html`<div className="empty-state">${L("Tồn kho đang ổn, chưa có sản phẩm cần bổ sung gấp. / Stock levels look healthy.")}</div>`}
              </div>
            </section>
          </div>

          <section className="surface section-card export-section">
            <div className="section-top">
              <div>
                <p className="eyebrow">${L("Báo cáo & sao lưu / Reports & Backup")}</p>
                <h2 className="section-title">${L("Database Export / Database Export")}</h2>
              </div>
              <div className="row-actions">
                <button className="primary-btn" onClick=${function () {
                  exportDatabaseBackup(null);
                }} disabled=${exportBusy}>${exportBusy ? L("Đang export... / Exporting...") : L("Export Full Database Backup")}</button>
                <button className="ghost-btn" onClick=${function () {
                  exportDatabaseBackup(selectedExportTables);
                }} disabled=${exportBusy}>${L("Export Selected Tables")}</button>
              </div>
            </div>

            <div className="split-grid">
              <div className="form-card">
                <div className="field-grid">
                  <label className="field">
                    <span>${L("Phạm vi dữ liệu / Data Scope")}</span>
                    <select value=${exportFilterMode} onChange=${function (event) { setExportFilterMode(event.target.value); }}>
                      <option value="all">${L("Export all data")}</option>
                      <option value="date_range">${L("Export by date range")}</option>
                    </select>
                  </label>
                  ${exportFilterMode === "date_range" ? html`
                    <label className="field">
                      <span>${L("Từ ngày / Start Date")}</span>
                      <input type="date" value=${exportStartDate} onInput=${function (event) { setExportStartDate(event.target.value); }} />
                    </label>
                  ` : html`<div></div>`}
                  ${exportFilterMode === "date_range" ? html`
                    <label className="field">
                      <span>${L("Đến ngày / End Date")}</span>
                      <input type="date" value=${exportEndDate} onInput=${function (event) { setExportEndDate(event.target.value); }} />
                    </label>
                  ` : null}
                </div>

                <div className="toggle-grid">
                  <label className="toggle-card">
                    <input type="checkbox" checked=${exportActiveOnly} onChange=${function (event) { setExportActiveOnly(event.target.checked); }} />
                    <span>${L("Export only active products and ingredients")}</span>
                  </label>
                  <label className="toggle-card">
                    <input type="checkbox" checked=${exportCompletedOrdersOnly} onChange=${function (event) { setExportCompletedOrdersOnly(event.target.checked); }} />
                    <span>${L("Export only completed orders")}</span>
                  </label>
                </div>

                <div className="empty-state align-left">
                  ${L("ZIP backup sẽ chứa toàn bộ CSV, schema.json và export_log.json theo cấu trúc chuẩn để dùng cho Google Sheets hoặc migrate sang database sau này. / The ZIP backup will contain all CSVs, schema.json, and export_log.json so you can use it in Google Sheets now and migrate to a database later.")}
                </div>
              </div>

              <div className="form-card">
                <div className="section-top">
                  <div>
                    <p className="eyebrow">${L("Bảng dữ liệu / Tables")}</p>
                    <h3 className="template-preview-title">${selectedExportTables.length}/${EXPORT_TABLE_SCHEMAS.length} ${L("bảng được chọn / tables selected")}</h3>
                  </div>
                  <button className="ghost-btn" onClick=${toggleAllExportTables}>
                    ${selectedExportTables.length === EXPORT_TABLE_SCHEMAS.length ? L("Bỏ chọn tất cả / Clear All") : L("Chọn tất cả / Select All")}
                  </button>
                </div>
                <div className="export-table-grid">
                  ${EXPORT_TABLE_SCHEMAS.map(function (tableSchema) {
                    var checked = selectedExportTables.indexOf(tableSchema.tableName) !== -1;
                    return html`
                      <label key=${tableSchema.tableName} className=${"toggle-card export-table-card" + (checked ? " is-active" : "")}>
                        <input
                          type="checkbox"
                          checked=${checked}
                          onChange=${function () { toggleExportTable(tableSchema.tableName); }}
                        />
                        <span>${tableSchema.tableName}.csv</span>
                      </label>
                    `;
                  })}
                </div>
              </div>
            </div>
          </section>
        </section>
      `;
    }

    function renderInventoryView() {
      var totalStock = products.reduce(function (sum, product) {
        return sum + (Number(product.stock) || 0);
      }, 0);
      var lowStockProducts = products.filter(function (product) {
        return Number(product.stock) <= 10;
      });
      var allProductsSelected = products.length > 0 && selectedProductIds.length === products.length;

      return html`
        <section className="settings-layout">
          <aside className="surface settings-sidebar inventory-sidebar">
            <div>
              <p className="eyebrow">${L("Kho hàng / Inventory")}</p>
              <h2 className="section-title">${L("Quản lý sản phẩm / Product Workspace")}</h2>
            </div>
            <div className="settings-nav">
              ${inventoryTabs.map(function (tab) {
                return html`
                  <button
                    key=${tab.id}
                    className=${"settings-nav-btn" + (inventorySection === tab.id ? " is-active" : "")}
                    onClick=${function () {
                      setInventorySection(tab.id);
                    }}
                  >
                    ${L(tab.label)}
                  </button>
                `;
              })}
            </div>
          </aside>

          <div className="settings-content">
            ${inventorySection === "stock" ? html`
              <div className="stack-view">
                <div className="card-grid card-grid-4">
                  <article className="metric-card surface">
                    <span className="metric-label">${L("Sản phẩm / Products")}</span>
                    <strong>${products.length}</strong>
                  </article>
                  <article className="metric-card surface">
                    <span className="metric-label">${L("Tổng tồn kho / Total Stock")}</span>
                    <strong>${totalStock}</strong>
                  </article>
                  <article className="metric-card surface">
                    <span className="metric-label">${L("Sắp hết hàng / Low Stock")}</span>
                    <strong>${lowStockProducts.length}</strong>
                  </article>
                  <article className="metric-card surface">
                    <span className="metric-label">${L("Danh mục / Categories")}</span>
                    <strong>${categories.length}</strong>
                  </article>
                </div>

                <div className="split-grid">
                  <section className="surface section-card">
                    <div className="section-top">
                      <div>
                        <p className="eyebrow">${L("Cảnh báo / Alerts")}</p>
                        <h2 className="section-title">${L("Kiểm hàng tồn kho / Stock Check")}</h2>
                      </div>
                    </div>
                    <div className="list-stack">
                      ${lowStockProducts.length
                        ? lowStockProducts.map(function (product) {
                            var category = categories.find(function (item) {
                              return item.id === product.category;
                            });
                            return html`
                              <article key=${product.id} className="list-row list-row-actions stock-check-row">
                                <div className="stock-check-meta">
                                  <strong>${product.image} ${product.name}</strong>
                                  <p>${category ? L(category.label) : product.category} · ${product.barcode}</p>
                                </div>
                                <div className="row-actions stock-editor">
                                  <input
                                    type="number"
                                    min="0"
                                    value=${product.stock}
                                    onInput=${function (event) {
                                      updateProductStock(product.id, event.target.value);
                                    }}
                                  />
                                  <button className="ghost-btn" onClick=${function () { startEditProduct(product); }}>${L("Sửa / Edit")}</button>
                                </div>
                              </article>
                            `;
                          })
                        : html`<div className="empty-state">${L("Hiện chưa có sản phẩm nào sắp hết hàng. / No low stock items right now.")}</div>`}
                    </div>
                  </section>

                  <section className="surface section-card">
                    <div className="section-top">
                      <div>
                        <p className="eyebrow">${L("Tất cả sản phẩm / All Products")}</p>
                        <h2 className="section-title">${L("Danh sách tồn kho / Inventory List")}</h2>
                      </div>
                      <div className="row-actions selection-toolbar">
                        <span className="stock-badge">${selectedProductIds.length} ${L("đã chọn / selected")}</span>
                        <button className="ghost-btn" onClick=${toggleSelectAllProducts}>
                          ${allProductsSelected ? L("Bỏ chọn tất cả / Clear All") : L("Chọn tất cả / Select All")}
                        </button>
                        <button
                          className="ghost-btn"
                          onClick=${function () {
                            var selectedProducts = products.filter(function (product) {
                              return selectedProductIds.indexOf(product.id) !== -1;
                            });
                            var quantities = {};
                            selectedProducts.forEach(function (product) {
                              quantities[product.id] = getLabelQuantity(product.id);
                            });
                            printBarcodeLabels(selectedProducts, quantities);
                          }}
                        >
                          ${L("In tem đã chọn / Print Selected Labels")}
                        </button>
                      </div>
                    </div>
                    <div className="list-stack">
                      ${products.map(function (product) {
                        var category = categories.find(function (item) {
                          return item.id === product.category;
                        });
                        var isSelected = selectedProductIds.indexOf(product.id) !== -1;
                        return html`
                          <article key=${product.id} className=${"list-row list-row-actions" + (isSelected ? " is-selected" : "")}>
                            <div>
                              <label className="select-row">
                                <input
                                  type="checkbox"
                                  checked=${isSelected}
                                  onChange=${function () {
                                    toggleProductSelection(product.id);
                                  }}
                                />
                                <span>${L("Chọn / Select")}</span>
                              </label>
                              <strong>${product.image} ${product.name}</strong>
                              <p>${product.barcode} · ${category ? L(category.label) : product.category}</p>
                              <div className="barcode-inline-card">
                                <${BarcodeGraphic}
                                  value=${product.barcode}
                                  className="barcode-inline"
                                  options=${{
                                    width: 1.2,
                                    height: 30,
                                    lineColor: "#2f2116"
                                  }}
                                />
                              </div>
                            </div>
                            <div className="row-actions">
                              <span className="stock-badge">${product.stock}</span>
                              <label className="label-qty-field">
                                <span>${L("Số tem / Qty")}</span>
                                <input
                                  type="number"
                                  min="1"
                                  value=${getLabelQuantity(product.id)}
                                  onInput=${function (event) {
                                    updateLabelQuantity(product.id, event.target.value);
                                  }}
                                />
                              </label>
                              <button className="ghost-btn" onClick=${function () { startEditProduct(product); }}>${L("Sửa / Edit")}</button>
                              <button className="ghost-btn danger-text" onClick=${function () { removeProduct(product.id); }}>${L("Xóa / Remove")}</button>
                            </div>
                          </article>
                        `;
                      })}
                    </div>
                  </section>
                </div>
              </div>
            ` : null}

            ${inventorySection === "product" ? html`
              <div className="split-grid">
                <form className="surface section-card form-card" onSubmit=${submitProduct}>
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Sản phẩm / Product")}</p>
                      <h2 className="section-title">${productDraft.id ? L("Cập nhật sản phẩm / Update Product") : L("Thêm sản phẩm mới / Add Product")}</h2>
                    </div>
                    ${productDraft.id
                      ? html`<button type="button" className="ghost-btn" onClick=${resetProductDraft}>${L("Hủy / Cancel")}</button>`
                      : null}
                  </div>

                  <div className="field-grid">
                    <label className="field">
                      <span>${L("Tên sản phẩm / Product Name")}</span>
                      <input value=${productDraft.name} onInput=${function (event) { updateProductDraft("name", event.target.value); }} />
                    </label>
                    <label className="field">
                      <span>${L("Danh mục / Category")}</span>
                      <select value=${productDraft.category} onChange=${function (event) { updateProductDraft("category", event.target.value); }}>
                        ${categories.map(function (item) {
                          return html`<option key=${item.id} value=${item.id}>${L(item.label)}</option>`;
                        })}
                      </select>
                    </label>
                    <label className="field">
                      <span>${L("Giá bán / Price")}</span>
                      <input type="number" value=${productDraft.price} onInput=${function (event) { updateProductDraft("price", event.target.value); }} />
                    </label>
                    <label className="field">
                      <span>${L("Tồn kho / Stock")}</span>
                      <input type="number" value=${productDraft.stock} onInput=${function (event) { updateProductDraft("stock", event.target.value); }} />
                    </label>
                    <label className="field">
                      <span>${L("Mã vạch / Barcode")}</span>
                      <input value=${productDraft.barcode} onInput=${function (event) { updateProductDraft("barcode", event.target.value); }} />
                      <small>${L("Có thể để trống, hệ thống sẽ tự tạo mã số chuẩn dễ quét để in tem và scan trên desktop/mobile. / Leave blank to auto-generate a scannable numeric code for printing and scanning on desktop/mobile.")}</small>
                    </label>
                    <label className="field">
                      <span>${L("Biểu tượng / Icon")}</span>
                      <input value=${productDraft.image} onInput=${function (event) { updateProductDraft("image", event.target.value); }} />
                    </label>
                  </div>

                  <label className="field">
                    <span>${L("Mô tả ngắn / Short Description")}</span>
                    <textarea rows="4" value=${productDraft.description} onInput=${function (event) { updateProductDraft("description", event.target.value); }}></textarea>
                  </label>

                  <div className="field">
                    <span>${L("Thành phần sản phẩm / Product Components")}</span>
                    <div className="addon-row">
                      ${components.map(function (component) {
                        var isActive = (productDraft.componentIds || []).indexOf(component.id) !== -1;
                        return html`
                          <button
                            key=${component.id}
                            type="button"
                            className=${"addon-chip" + (isActive ? " is-active" : "")}
                            onClick=${function () {
                              toggleProductDraftComponent(component.id);
                            }}
                          >
                            ${L(component.label)}
                          </button>
                        `;
                      })}
                    </div>
                  </div>

                  <button type="submit" className="primary-btn">${productDraft.id ? L("Lưu thay đổi / Save Changes") : L("Thêm vào kho / Add to Inventory")}</button>
                </form>

                <section className="surface section-card">
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Thông tin tham chiếu / Reference")}</p>
                      <h2 className="section-title">${L("Sản phẩm và thành phần / Product Components")}</h2>
                    </div>
                  </div>
                  <div className="list-stack">
                    ${products.map(function (product) {
                      var productComponents = (product.componentIds || []).map(function (componentId) {
                        var component = components.find(function (item) { return item.id === componentId; });
                        return component ? L(component.label) : "";
                      }).filter(Boolean);
                      return html`
                        <article key=${product.id} className="list-row list-row-actions">
                          <div>
                            <strong>${product.image} ${product.name}</strong>
                            <p>${productComponents.length ? productComponents.join(", ") : L("Chưa gắn thành phần / No components assigned")}</p>
                          </div>
                          <div className="row-actions">
                            <button className="ghost-btn" onClick=${function () { startEditProduct(product); }}>${L("Sửa / Edit")}</button>
                          </div>
                        </article>
                      `;
                    })}
                  </div>
                </section>
              </div>
            ` : null}

            ${inventorySection === "catalog" ? html`
              <div className="stack-view">
                <div className="split-grid">
                  <section className="surface section-card form-card">
                    <div className="section-top">
                      <div>
                        <p className="eyebrow">${L("Danh mục / Categories")}</p>
                        <h2 className="section-title">${L("Thêm hoặc sửa danh mục / Add or Edit Categories")}</h2>
                      </div>
                      ${categoryDraft.id ? html`<button type="button" className="ghost-btn" onClick=${resetCategoryDraft}>${L("Hủy / Cancel")}</button>` : null}
                    </div>
                    <form className="form-card" onSubmit=${submitCategory}>
                      <div className="field-grid">
                        <label className="field"><span>${L("Tên tiếng Việt / Vietnamese Name")}</span><input value=${categoryDraft.labelVi} onInput=${function (event) { updateCategoryDraft("labelVi", event.target.value); }} /></label>
                        <label className="field"><span>${L("Tên tiếng Anh / English Name")}</span><input value=${categoryDraft.labelEn} onInput=${function (event) { updateCategoryDraft("labelEn", event.target.value); }} /></label>
                        <label className="field"><span>${L("Icon / Icon")}</span><input value=${categoryDraft.icon} onInput=${function (event) { updateCategoryDraft("icon", event.target.value); }} /></label>
                      </div>
                      <button type="submit" className="primary-btn">${categoryDraft.id ? L("Lưu danh mục / Save Category") : L("Thêm danh mục / Add Category")}</button>
                    </form>
                    <div className="management-list">
                      ${categories.map(function (category) {
                        return html`
                          <article key=${category.id} className="list-row list-row-actions">
                            <div>
                              <strong>${category.icon} ${L(category.label)}</strong>
                              <p>${category.id}</p>
                            </div>
                            <div className="row-actions">
                              <button className="ghost-btn" onClick=${function () { startEditCategory(category); }}>${L("Sửa / Edit")}</button>
                              <button className="ghost-btn danger-text" onClick=${function () { removeCategory(category.id); }}>${L("Xóa / Remove")}</button>
                            </div>
                          </article>
                        `;
                      })}
                    </div>
                  </section>

                  <section className="surface section-card form-card">
                    <div className="section-top">
                      <div>
                        <p className="eyebrow">${L("Add-ons")}</p>
                        <h2 className="section-title">${L("Điều chỉnh add-ons / Edit Add-ons")}</h2>
                      </div>
                      ${addOnDraft.id ? html`<button type="button" className="ghost-btn" onClick=${resetAddOnDraft}>${L("Hủy / Cancel")}</button>` : null}
                    </div>
                    <form className="form-card" onSubmit=${submitAddOn}>
                      <div className="field-grid">
                        <label className="field"><span>${L("Tên tiếng Việt / Vietnamese Name")}</span><input value=${addOnDraft.labelVi} onInput=${function (event) { updateAddOnDraft("labelVi", event.target.value); }} /></label>
                        <label className="field"><span>${L("Tên tiếng Anh / English Name")}</span><input value=${addOnDraft.labelEn} onInput=${function (event) { updateAddOnDraft("labelEn", event.target.value); }} /></label>
                        <label className="field"><span>${L("Giá cộng thêm / Extra Price")}</span><input type="number" value=${addOnDraft.price} onInput=${function (event) { updateAddOnDraft("price", event.target.value); }} /></label>
                        <label className="field">
                          <span>${L("Nhóm / Group")}</span>
                          <select value=${addOnDraft.group} onChange=${function (event) { updateAddOnDraft("group", event.target.value); }}>
                            ${Object.keys(addOnGroupLabels).map(function (groupKey) {
                              return html`<option key=${groupKey} value=${groupKey}>${L(addOnGroupLabels[groupKey])}</option>`;
                            })}
                          </select>
                        </label>
                      </div>
                      <button type="submit" className="primary-btn">${addOnDraft.id ? L("Lưu add-on / Save Add-on") : L("Thêm add-on / Add Add-on")}</button>
                    </form>
                    <div className="management-list">
                      ${addOns.map(function (addOn) {
                        return html`
                          <article key=${addOn.id} className="list-row list-row-actions">
                            <div>
                              <strong>${L(addOn.label)}</strong>
                              <p>${L(addOnGroupLabels[addOn.group] || "Khác / Other")} · ${addOn.price ? "+" + formatCurrency(addOn.price) : L("Không phụ phí / No extra fee")}</p>
                            </div>
                            <div className="row-actions">
                              <button className="ghost-btn" onClick=${function () { startEditAddOn(addOn); }}>${L("Sửa / Edit")}</button>
                              <button className="ghost-btn danger-text" onClick=${function () { removeAddOn(addOn.id); }}>${L("Xóa / Remove")}</button>
                            </div>
                          </article>
                        `;
                      })}
                    </div>
                  </section>
                </div>

                <section className="surface section-card form-card">
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Thành phần sản phẩm / Product Components")}</p>
                      <h2 className="section-title">${L("Thêm, sửa, xóa thành phần / Add, Edit, Remove Components")}</h2>
                    </div>
                    ${componentDraft.id ? html`<button type="button" className="ghost-btn" onClick=${resetComponentDraft}>${L("Hủy / Cancel")}</button>` : null}
                  </div>
                  <form className="form-card" onSubmit=${submitComponent}>
                    <div className="field-grid">
                      <label className="field"><span>${L("Tên tiếng Việt / Vietnamese Name")}</span><input value=${componentDraft.labelVi} onInput=${function (event) { updateComponentDraft("labelVi", event.target.value); }} /></label>
                      <label className="field"><span>${L("Tên tiếng Anh / English Name")}</span><input value=${componentDraft.labelEn} onInput=${function (event) { updateComponentDraft("labelEn", event.target.value); }} /></label>
                      <label className="field"><span>${L("Đơn vị / Unit")}</span><input value=${componentDraft.unit} onInput=${function (event) { updateComponentDraft("unit", event.target.value); }} /></label>
                      <label className="field"><span>${L("Ghi chú / Note")}</span><input value=${componentDraft.note} onInput=${function (event) { updateComponentDraft("note", event.target.value); }} /></label>
                    </div>
                    <button type="submit" className="primary-btn">${componentDraft.id ? L("Lưu thành phần / Save Component") : L("Thêm thành phần / Add Component")}</button>
                  </form>
                  <div className="management-list">
                    ${components.map(function (component) {
                      return html`
                        <article key=${component.id} className="list-row list-row-actions">
                          <div>
                            <strong>${L(component.label)}</strong>
                            <p>${component.unit || L("Chưa có đơn vị / No unit")} · ${component.note || L("Chưa có ghi chú / No note")}</p>
                          </div>
                          <div className="row-actions">
                            <button className="ghost-btn" onClick=${function () { startEditComponent(component); }}>${L("Sửa / Edit")}</button>
                            <button className="ghost-btn danger-text" onClick=${function () { removeComponent(component.id); }}>${L("Xóa / Remove")}</button>
                          </div>
                        </article>
                      `;
                    })}
                  </div>
                </section>
              </div>
            ` : null}
          </div>
        </section>
      `;
    }

    function renderSettingsView() {
      var settingsTabs = [
        { id: "general", label: "Chung / General" },
        { id: "invoice", label: "Hóa đơn / Invoice" },
        { id: "product", label: "Điều chỉnh sản phẩm / Product Adjustments" }
      ];
      var totalStock = products.reduce(function (sum, product) {
        return sum + (Number(product.stock) || 0);
      }, 0);
      var lowStockCount = products.filter(function (product) {
        return Number(product.stock) <= 10;
      }).length;

      return html`
        <section className="settings-layout">
          <aside className="surface settings-sidebar">
            <div>
              <p className="eyebrow">${L("Cài đặt / Settings")}</p>
              <h2 className="section-title">${L("Quản lý cửa hàng / Control Center")}</h2>
            </div>
            <div className="settings-nav">
              ${settingsTabs.map(function (tab) {
                return html`
                  <button
                    key=${tab.id}
                    className=${"settings-nav-btn" + (settingsSection === tab.id ? " is-active" : "")}
                    onClick=${function () {
                      setSettingsSection(tab.id);
                    }}
                  >
                    ${L(tab.label)}
                  </button>
                `;
              })}
            </div>
          </aside>

          <div className="settings-content">
            ${settingsSection === "general" ? html`
              <section className="surface section-card form-card settings-pane">
                <div className="section-top">
                  <div>
                    <p className="eyebrow">${L("Cài đặt cửa hàng / Shop Settings")}</p>
                    <h2 className="section-title">${L("Thông tin chung / General Details")}</h2>
                  </div>
                </div>
                <div className="field-grid">
                  <label className="field"><span>${L("Dòng thương hiệu / Brand Line")}</span><input value=${settings.brandLine || ""} onInput=${function (event) { patchSettings("brandLine", event.target.value); }} /></label>
                  <label className="field"><span>${L("Tên thương hiệu hiển thị / Display Brand Name")}</span><input value=${settings.brandDisplayName || ""} onInput=${function (event) { patchSettings("brandDisplayName", event.target.value); }} /></label>
                  <label className="field"><span>${L("Tên cửa hàng trên hóa đơn / Store Name on Invoice")}</span><input value=${settings.storeName} onInput=${function (event) { patchSettings("storeName", event.target.value); }} /></label>
                  <label className="field"><span>${L("Chi nhánh / Branch")}</span><input value=${settings.branchName} onInput=${function (event) { patchSettings("branchName", event.target.value); }} /></label>
                  <label className="field"><span>${L("Thu ngân / Cashier")}</span><input value=${settings.cashierName} onInput=${function (event) { patchSettings("cashierName", event.target.value); }} /></label>
                  <label className="field"><span>${L("Điện thoại / Phone")}</span><input value=${settings.phone} onInput=${function (event) { patchSettings("phone", event.target.value); }} /></label>
                  <label className="field"><span>${L("Mã số thuế / Tax ID")}</span><input value=${settings.taxId} onInput=${function (event) { patchSettings("taxId", event.target.value); }} /></label>
                  <label className="field"><span>${L("Giờ mở cửa / Open Hours")}</span><input value=${settings.openHours} onInput=${function (event) { patchSettings("openHours", event.target.value); }} /></label>
                </div>
                <label className="field"><span>${L("Địa chỉ / Address")}</span><textarea rows="3" value=${settings.address} onInput=${function (event) { patchSettings("address", event.target.value); }}></textarea></label>
                <label className="field"><span>${L("Chân hóa đơn / Receipt Footer")}</span><textarea rows="3" value=${settings.receiptFooter} onInput=${function (event) { patchSettings("receiptFooter", event.target.value); }}></textarea></label>
                <div className="template-preview brand-preview">
                  <p className="eyebrow">${settings.brandLine || settings.storeName}</p>
                  <h3>${settings.brandDisplayName || settings.storeName}</h3>
                  <small>${settings.branchName} · ${settings.phone}</small>
                </div>
                <div className="list-stack">
                  <div className="empty-state align-left">
                    ${L("Mọi thay đổi đang được lưu tự động trong trình duyệt hiện tại. / Changes are saved automatically in this browser.")}
                  </div>
                  <div className="empty-state align-left">
                    ${L("Muốn đồng bộ desktop và mobile thì cần thêm backend hoặc database online. / To sync desktop and mobile, connect a backend or online database.")}
                  </div>
                </div>
              </section>
            ` : null}

            ${settingsSection === "invoice" ? html`
              <div className="stack-view settings-pane">
                <section className="surface section-card">
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Mẫu hóa đơn / Invoice Templates")}</p>
                      <h2 className="section-title">${L("Chỉnh mẫu hóa đơn / Edit Invoice Templates")}</h2>
                    </div>
                    <button className="ghost-btn" onClick=${addInvoiceTemplate}>${L("Thêm mẫu / Add Template")}</button>
                  </div>

                  <label className="field">
                    <span>${L("Mẫu đang dùng / Active Template")}</span>
                    <select value=${selectedInvoiceTemplateId} onChange=${function (event) { setSelectedInvoiceTemplateId(event.target.value); }}>
                      ${invoiceTemplates.map(function (template) {
                        return html`<option key=${template.id} value=${template.id}>${template.name}</option>`;
                      })}
                    </select>
                  </label>

                  ${activeInvoiceTemplate ? html`
                    <div className="field-grid">
                      <label className="field"><span>${L("Tên mẫu / Template Name")}</span><input value=${activeInvoiceTemplate.name} onInput=${function (event) { patchInvoiceTemplate(activeInvoiceTemplate.id, "name", event.target.value); }} /></label>
                      <label className="field"><span>${L("Tiêu đề / Title")}</span><input value=${activeInvoiceTemplate.title} onInput=${function (event) { patchInvoiceTemplate(activeInvoiceTemplate.id, "title", event.target.value); }} /></label>
                    </div>
                    <label className="field"><span>${L("Phụ đề / Subtitle")}</span><input value=${activeInvoiceTemplate.subtitle} onInput=${function (event) { patchInvoiceTemplate(activeInvoiceTemplate.id, "subtitle", event.target.value); }} /></label>
                    <label className="field"><span>${L("Chân trang / Footer")}</span><textarea rows="3" value=${activeInvoiceTemplate.footer} onInput=${function (event) { patchInvoiceTemplate(activeInvoiceTemplate.id, "footer", event.target.value); }}></textarea></label>
                    <div className="toggle-grid">
                      ${[
                        ["showSubtitle", "Hiện phụ đề / Show subtitle"],
                        ["showAddress", "Hiện địa chỉ / Show address"],
                        ["showBranch", "Hiện chi nhánh / Show branch"],
                        ["showPhone", "Hiện số điện thoại / Show phone"],
                        ["showTaxId", "Hiện mã số thuế / Show tax ID"],
                        ["showCashier", "Hiện thu ngân / Show cashier"],
                        ["showCustomerName", "Hiện khách hàng / Show customer"],
                        ["showPaymentMethod", "Hiện thanh toán / Show payment"],
                        ["showCashReceived", "Hiện tiền khách đưa / Show cash received"],
                        ["showChangeDue", "Hiện tiền thừa / Show change"],
                        ["showOrderMeta", "Hiện mã đơn & thời gian / Show order meta"]
                      ].map(function (item) {
                        return html`
                          <label key=${item[0]} className="toggle-card">
                            <input
                              type="checkbox"
                              checked=${activeInvoiceTemplate[item[0]]}
                              onChange=${function (event) {
                                patchInvoiceTemplate(activeInvoiceTemplate.id, item[0], event.target.checked);
                              }}
                            />
                            <span>${L(item[1])}</span>
                          </label>
                        `;
                      })}
                    </div>
                    <div className="template-preview">
                      <p className="eyebrow">${settings.brandLine || settings.storeName}</p>
                      <h3>${settings.brandDisplayName || settings.storeName}</h3>
                      <small>${L(activeInvoiceTemplate.title)}</small>
                      <p>${L(activeInvoiceTemplate.subtitle)}</p>
                      <small>${settings.storeName} · ${settings.phone}</small>
                    </div>
                    <div className="button-row button-row-secondary">
                      <button className="ghost-btn" onClick=${previewInvoiceTemplate}>${L("Xem trước mẫu / Preview Template")}</button>
                      <button className="ghost-btn danger-text" onClick=${function () { removeInvoiceTemplate(activeInvoiceTemplate.id); }}>${L("Xóa mẫu này / Remove Template")}</button>
                    </div>
                  ` : null}
                </section>

                <section className="surface section-card">
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Mẫu mã vạch / Barcode Templates")}</p>
                      <h2 className="section-title">${L("Điều chỉnh tem mã vạch / Edit Barcode Templates")}</h2>
                    </div>
                    <button className="ghost-btn" onClick=${addBarcodeTemplate}>${L("Thêm mẫu / Add Template")}</button>
                  </div>

                  <label className="field">
                    <span>${L("Mẫu đang dùng / Active Template")}</span>
                    <select value=${selectedBarcodeTemplateId} onChange=${function (event) { setSelectedBarcodeTemplateId(event.target.value); }}>
                      ${barcodeTemplates.map(function (template) {
                        return html`<option key=${template.id} value=${template.id}>${template.name}</option>`;
                      })}
                    </select>
                  </label>

                  ${activeBarcodeTemplate ? html`
                    <div className="field-grid">
                      <label className="field"><span>${L("Tên mẫu / Template Name")}</span><input value=${activeBarcodeTemplate.name} onInput=${function (event) { patchBarcodeTemplate(activeBarcodeTemplate.id, "name", event.target.value); }} /></label>
                      <label className="field"><span>${L("Màu nhấn / Accent Color")}</span><input value=${activeBarcodeTemplate.accent} onInput=${function (event) { patchBarcodeTemplate(activeBarcodeTemplate.id, "accent", event.target.value); }} /></label>
                      <label className="field"><span>${L("Tiêu đề / Title")}</span><input value=${activeBarcodeTemplate.title || ""} onInput=${function (event) { patchBarcodeTemplate(activeBarcodeTemplate.id, "title", event.target.value); }} /></label>
                      <label className="field"><span>${L("Phụ đề / Subtitle")}</span><input value=${activeBarcodeTemplate.subtitle || ""} onInput=${function (event) { patchBarcodeTemplate(activeBarcodeTemplate.id, "subtitle", event.target.value); }} /></label>
                      <label className="field"><span>Prefix</span><input value=${activeBarcodeTemplate.prefix} onInput=${function (event) { patchBarcodeTemplate(activeBarcodeTemplate.id, "prefix", event.target.value); }} /></label>
                      <label className="field"><span>Suffix</span><input value=${activeBarcodeTemplate.suffix} onInput=${function (event) { patchBarcodeTemplate(activeBarcodeTemplate.id, "suffix", event.target.value); }} /></label>
                      <label className="field"><span>${L("Chiều rộng preview / Preview Width")}</span><input type="number" value=${activeBarcodeTemplate.width} onInput=${function (event) { patchBarcodeTemplate(activeBarcodeTemplate.id, "width", Number(event.target.value) || 0); }} /></label>
                      <label className="field"><span>${L("Chiều cao preview / Preview Height")}</span><input type="number" value=${activeBarcodeTemplate.height} onInput=${function (event) { patchBarcodeTemplate(activeBarcodeTemplate.id, "height", Number(event.target.value) || 0); }} /></label>
                      <label className="field"><span>${L("Khổ in ngang (mm) / Print Width (mm)")}</span><input type="number" min="35" value=${activeBarcodeTemplate.printWidthMm || 90} onInput=${function (event) { patchBarcodeTemplate(activeBarcodeTemplate.id, "printWidthMm", Math.max(35, Number(event.target.value) || 0)); }} /></label>
                      <label className="field"><span>${L("Khổ in dọc (mm) / Print Height (mm)")}</span><input type="number" min="25" value=${activeBarcodeTemplate.printHeightMm || 55} onInput=${function (event) { patchBarcodeTemplate(activeBarcodeTemplate.id, "printHeightMm", Math.max(25, Number(event.target.value) || 0)); }} /></label>
                    </div>
                    <div className="toggle-grid">
                      ${[
                        ["showStoreName", "Hiện tên cửa hàng / Show store name"],
                        ["showName", "Hiện tên sản phẩm / Show product name"],
                        ["showPrice", "Hiện giá bán / Show price"],
                        ["showCategory", "Hiện danh mục / Show category"],
                        ["showBarcodeValue", "Hiện mã barcode / Show barcode value"]
                      ].map(function (item) {
                        return html`
                          <label key=${item[0]} className="toggle-card">
                            <input
                              type="checkbox"
                              checked=${activeBarcodeTemplate[item[0]]}
                              onChange=${function (event) {
                                patchBarcodeTemplate(activeBarcodeTemplate.id, item[0], event.target.checked);
                              }}
                            />
                            <span>${L(item[1])}</span>
                          </label>
                        `;
                      })}
                    </div>

                    <label className="field">
                      <span>${L("Sản phẩm xem trước / Preview Product")}</span>
                      <select value=${selectedBarcodeProductId} onChange=${function (event) { setSelectedBarcodeProductId(event.target.value); }}>
                        ${products.map(function (product) {
                          return html`<option key=${product.id} value=${product.id}>${product.name}</option>`;
                        })}
                      </select>
                    </label>

                    <label className="field">
                      <span>${L("Số lượng tem / Label Quantity")}</span>
                      <input
                        type="number"
                        min="1"
                        value=${previewLabelQuantity}
                        onInput=${function (event) {
                          setPreviewLabelQuantity(Math.max(1, Number(event.target.value) || 1));
                        }}
                      />
                    </label>

                    ${barcodePreviewProduct ? html`
                      <div className="barcode-preview" style=${{
                        "--barcode-accent": activeBarcodeTemplate.accent,
                        width: "100%",
                        minHeight: "auto"
                      }}>
                        <small className="barcode-preview-size">${L("Khổ tem in / Print size")}: ${activeBarcodeTemplate.printWidthMm || 90}mm × ${activeBarcodeTemplate.printHeightMm || 55}mm</small>
                        <div className="barcode-sample-card">
                          <div className="barcode-sample-top">
                            <div>
                              ${activeBarcodeTemplate.showStoreName ? html`<div className="barcode-sample-store">${settings.brandDisplayName || settings.storeName}</div>` : null}
                              ${activeBarcodeTemplate.showName ? html`<div className="barcode-sample-name">${barcodePreviewProduct.name}</div>` : null}
                            </div>
                            ${activeBarcodeTemplate.showPrice ? html`<div className="barcode-sample-price">${formatCurrency(barcodePreviewProduct.price)}</div>` : null}
                          </div>
                          <div className="barcode-sample-art">
                            <${BarcodeGraphic}
                              value=${barcodePreviewProduct.barcode}
                              className="barcode-live-preview"
                              options=${{
                                width: 1.9,
                                height: 64,
                                lineColor: "#1f1b18"
                              }}
                            />
                          </div>
                          ${activeBarcodeTemplate.showBarcodeValue ? html`<div className="barcode-sample-code">${normalizeBarcode(barcodePreviewProduct.barcode)}</div>` : null}
                          ${activeBarcodeTemplate.showCategory ? html`<div className="barcode-sample-category">${L("Danh mục / Category")}: ${getProductCategoryLabel(barcodePreviewProduct)}</div>` : null}
                        </div>
                      </div>
                    ` : null}

                    <div className="button-row button-row-secondary">
                      <button className="ghost-btn" onClick=${previewBarcodeTemplate}>${L("Xem trước tem / Preview Label")}</button>
                      <button className="ghost-btn" onClick=${function () {
                        if (!barcodePreviewProduct) {
                          return;
                        }
                        var quantities = {};
                        quantities[barcodePreviewProduct.id] = Math.max(1, Number(previewLabelQuantity) || 1);
                        printBarcodeLabels([barcodePreviewProduct], quantities);
                      }}>${L("In tem / Print Labels")}</button>
                      <button className="ghost-btn danger-text" onClick=${function () { removeBarcodeTemplate(activeBarcodeTemplate.id); }}>${L("Xóa mẫu này / Remove Template")}</button>
                    </div>
                  ` : null}
                </section>
              </div>
            ` : null}

            ${settingsSection === "product" ? html`
              <div className="stack-view settings-pane">
                <div className="card-grid card-grid-4">
                  <article className="metric-card surface">
                    <span className="metric-label">${L("Danh mục / Categories")}</span>
                    <strong>${categories.length}</strong>
                  </article>
                  <article className="metric-card surface">
                    <span className="metric-label">${L("Add-ons")}</span>
                    <strong>${addOns.length}</strong>
                  </article>
                  <article className="metric-card surface">
                    <span className="metric-label">${L("Tổng tồn kho / Total Stock")}</span>
                    <strong>${totalStock}</strong>
                  </article>
                  <article className="metric-card surface">
                    <span className="metric-label">${L("Sắp hết hàng / Low Stock")}</span>
                    <strong>${lowStockCount}</strong>
                  </article>
                </div>

                <div className="split-grid">
                  <section className="surface section-card form-card">
                    <div className="section-top">
                      <div>
                        <p className="eyebrow">${L("Danh mục / Categories")}</p>
                        <h2 className="section-title">${L("Thêm hoặc sửa danh mục / Add or Edit Categories")}</h2>
                      </div>
                      ${categoryDraft.id ? html`<button type="button" className="ghost-btn" onClick=${resetCategoryDraft}>${L("Hủy / Cancel")}</button>` : null}
                    </div>
                    <form className="form-card" onSubmit=${submitCategory}>
                      <div className="field-grid">
                        <label className="field"><span>${L("Tên tiếng Việt / Vietnamese Name")}</span><input value=${categoryDraft.labelVi} onInput=${function (event) { updateCategoryDraft("labelVi", event.target.value); }} /></label>
                        <label className="field"><span>${L("Tên tiếng Anh / English Name")}</span><input value=${categoryDraft.labelEn} onInput=${function (event) { updateCategoryDraft("labelEn", event.target.value); }} /></label>
                        <label className="field"><span>${L("Icon / Icon")}</span><input value=${categoryDraft.icon} onInput=${function (event) { updateCategoryDraft("icon", event.target.value); }} /></label>
                      </div>
                      <button type="submit" className="primary-btn">${categoryDraft.id ? L("Lưu danh mục / Save Category") : L("Thêm danh mục / Add Category")}</button>
                    </form>
                    <div className="management-list">
                      ${categories.map(function (category) {
                        return html`
                          <article key=${category.id} className="list-row list-row-actions">
                            <div>
                              <strong>${category.icon} ${L(category.label)}</strong>
                              <p>${category.id}</p>
                            </div>
                            <div className="row-actions">
                              <button className="ghost-btn" onClick=${function () { startEditCategory(category); }}>${L("Sửa / Edit")}</button>
                              <button className="ghost-btn danger-text" onClick=${function () { removeCategory(category.id); }}>${L("Xóa / Remove")}</button>
                            </div>
                          </article>
                        `;
                      })}
                    </div>
                  </section>

                  <section className="surface section-card form-card">
                    <div className="section-top">
                      <div>
                        <p className="eyebrow">${L("Add-ons")}</p>
                        <h2 className="section-title">${L("Điều chỉnh add-ons / Edit Add-ons")}</h2>
                      </div>
                      ${addOnDraft.id ? html`<button type="button" className="ghost-btn" onClick=${resetAddOnDraft}>${L("Hủy / Cancel")}</button>` : null}
                    </div>
                    <form className="form-card" onSubmit=${submitAddOn}>
                      <div className="field-grid">
                        <label className="field"><span>${L("Tên tiếng Việt / Vietnamese Name")}</span><input value=${addOnDraft.labelVi} onInput=${function (event) { updateAddOnDraft("labelVi", event.target.value); }} /></label>
                        <label className="field"><span>${L("Tên tiếng Anh / English Name")}</span><input value=${addOnDraft.labelEn} onInput=${function (event) { updateAddOnDraft("labelEn", event.target.value); }} /></label>
                        <label className="field"><span>${L("Giá cộng thêm / Extra Price")}</span><input type="number" value=${addOnDraft.price} onInput=${function (event) { updateAddOnDraft("price", event.target.value); }} /></label>
                        <label className="field">
                          <span>${L("Nhóm / Group")}</span>
                          <select value=${addOnDraft.group} onChange=${function (event) { updateAddOnDraft("group", event.target.value); }}>
                            ${Object.keys(addOnGroupLabels).map(function (groupKey) {
                              return html`<option key=${groupKey} value=${groupKey}>${L(addOnGroupLabels[groupKey])}</option>`;
                            })}
                          </select>
                        </label>
                      </div>
                      <button type="submit" className="primary-btn">${addOnDraft.id ? L("Lưu add-on / Save Add-on") : L("Thêm add-on / Add Add-on")}</button>
                    </form>
                    <div className="management-list">
                      ${addOns.map(function (addOn) {
                        return html`
                          <article key=${addOn.id} className="list-row list-row-actions">
                            <div>
                              <strong>${L(addOn.label)}</strong>
                              <p>${L(addOnGroupLabels[addOn.group] || "Khác / Other")} · ${addOn.price ? "+" + formatCurrency(addOn.price) : L("Không phụ phí / No extra fee")}</p>
                            </div>
                            <div className="row-actions">
                              <button className="ghost-btn" onClick=${function () { startEditAddOn(addOn); }}>${L("Sửa / Edit")}</button>
                              <button className="ghost-btn danger-text" onClick=${function () { removeAddOn(addOn.id); }}>${L("Xóa / Remove")}</button>
                            </div>
                          </article>
                        `;
                      })}
                    </div>
                  </section>
                </div>

                <section className="surface section-card">
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Tồn kho / Inventory")}</p>
                      <h2 className="section-title">${L("Điều chỉnh nhanh tồn kho / Quick Inventory Adjustments")}</h2>
                    </div>
                  </div>
                  <div className="management-list">
                    ${products.map(function (product) {
                      var category = categories.find(function (item) {
                        return item.id === product.category;
                      });
                      return html`
                        <article key=${product.id} className="list-row list-row-actions">
                          <div>
                            <strong>${product.image} ${product.name}</strong>
                            <p>${category ? L(category.label) : product.category}</p>
                          </div>
                          <div className="row-actions stock-editor">
                            <input
                              type="number"
                              min="0"
                              value=${product.stock}
                              onInput=${function (event) {
                                updateProductStock(product.id, event.target.value);
                              }}
                            />
                            <button className="ghost-btn" onClick=${function () { startEditProduct(product); }}>${L("Sửa chi tiết / Edit Details")}</button>
                          </div>
                        </article>
                      `;
                    })}
                  </div>
                </section>
              </div>
            ` : null}
          </div>
        </section>
      `;
    }

    return html`
      <div className="app-shell">
        <${MenuDrawer}
          open=${menuOpen}
          activeView=${activeView}
          storeName=${settings.storeName}
          language=${language}
          onClose=${function () { setMenuOpen(false); }}
          onSelect=${function (viewId) {
            setActiveView(viewId);
            setMenuOpen(false);
          }}
        />

        <header className="topbar surface">
          <div className="topbar-main">
            <button className="menu-btn" onClick=${function () { setMenuOpen(true); }} aria-label=${L("Mở menu / Open menu")}>
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div className="brand-block">
              <div>
                <p className="eyebrow">${settings.brandLine || settings.storeName}</p>
                <h1 className="brand-name">${settings.brandDisplayName || settings.storeName}</h1>
              </div>
            </div>
          </div>

          <div className="search-box">
            <input
              placeholder=${L("Tìm theo tên sản phẩm hoặc loại / Search by product or type")}
              value=${searchTerm}
              onInput=${function (event) { setSearchTerm(event.target.value); }}
            />
          </div>

          <div className="lang-switch surface">
            ${LANGUAGE_OPTIONS.map(function (item) {
              return html`
                <button
                  key=${item.id}
                  className=${"lang-btn" + (language === item.id ? " is-active" : "")}
                  onClick=${function () { setLanguage(item.id); }}
                >
                  ${item.label}
                </button>
              `;
            })}
          </div>
        </header>

        <main className="page-body">
          ${activeView === "pos" ? renderPosView() : null}
          ${activeView === "dashboard" ? renderDashboardView() : null}
          ${activeView === "inventory" ? renderInventoryView() : null}
          ${activeView === "settings" ? renderSettingsView() : null}
        </main>
      </div>
    `;
  }

  var appElement = html`<${App} />`;

  if (window.ReactDOM.createRoot) {
    window.ReactDOM.createRoot(root).render(appElement);
  } else {
    window.ReactDOM.render(appElement, root);
  }
})();
