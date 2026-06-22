(function () {
  // Layer 2 Security: Disable DevTools shortcuts and right-click context menu
  window.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    alert("Tính năng này đã bị vô hiệu hóa trên hệ thống. / This feature has been disabled on the system.");
  });

  window.addEventListener("keydown", function (e) {
    var isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    var isF12 = e.key === "F12" || e.keyCode === 123;
    var isInspect = (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.keyCode === 73)) || 
                    (isMac && e.metaKey && e.altKey && (e.key === "I" || e.key === "i" || e.keyCode === 73));
    var isConsole = (e.ctrlKey && e.shiftKey && (e.key === "J" || e.key === "j" || e.keyCode === 74)) || 
                    (isMac && e.metaKey && e.altKey && (e.key === "J" || e.key === "j" || e.keyCode === 74));
    var isElement = (e.ctrlKey && e.shiftKey && (e.key === "C" || e.key === "c" || e.keyCode === 67)) || 
                    (isMac && e.metaKey && e.altKey && (e.key === "C" || e.key === "c" || e.keyCode === 67));
    var isViewSource = (e.ctrlKey && (e.key === "U" || e.key === "u" || e.keyCode === 85)) ||
                       (isMac && e.metaKey && (e.key === "U" || e.key === "u" || e.keyCode === 85));

    if (isF12 || isInspect || isConsole || isElement || isViewSource) {
      e.preventDefault();
      alert("Tính năng này đã bị vô hiệu hóa trên hệ thống. / This feature has been disabled on the system.");
    }
  });
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

  function isKnownTechnicalTestSale(record) {
    if (!record) return false;
    var id = String(record.id || record.serverId || record.server_id || "");
    var orderId = String(record.orderId || record.order_id || "");
    var note = String(record.note || "");
    return id === "HD-20260612-002" ||
      orderId.indexOf("CODEX-LIVE-SYNC-TEST") !== -1 ||
      orderId.indexOf("DEBUG-VN-DATE") !== -1 ||
      note.toLowerCase().indexOf("temporary live sync test") !== -1 ||
      note.toLowerCase().indexOf("temporary debug sale") !== -1;
  }

  function repairKnownLocalPaymentIssues() {
    var targetOrderId = "09/06/2026-019";
    var targetPaid = 61000;

    function isTargetSale(record) {
      if (!record) return false;
      return record.orderId === targetOrderId ||
        record.order_id === targetOrderId ||
        record.id === targetOrderId ||
        record.id === "HD-20260609-019";
    }

    function repairSale(record) {
      if (!isTargetSale(record)) return record;
      var total = Number(record.total) || 0;
      return Object.assign({}, record, {
        paid: targetPaid,
        cashReceived: targetPaid,
        cash_received: targetPaid,
        changeAmount: Math.max(0, targetPaid - total),
        change_amount: Math.max(0, targetPaid - total),
        paymentMethod: "cash",
        payment_method: "cash",
        paymentStatus: "paid",
        payment_status: "paid"
      });
    }

    try {
      var rawState = window.localStorage.getItem(STORAGE_KEY);
      if (rawState) {
        var state = JSON.parse(rawState);
        var changed = false;
        if (Array.isArray(state.sales)) {
          var originalSalesLength = state.sales.length;
          state.sales = state.sales.filter(function (sale) {
            return !isKnownTechnicalTestSale(sale);
          }).map(function (sale) {
            var repaired = repairSale(sale);
            if (repaired !== sale) changed = true;
            return repaired;
          });
          if (state.sales.length !== originalSalesLength) changed = true;
        }
        if (Array.isArray(state.orders)) {
          var originalOrdersLength = state.orders.length;
          state.orders = state.orders.filter(function (order) {
            return !isKnownTechnicalTestSale(order);
          }).map(function (order) {
            if (!order || order.id !== targetOrderId) return order;
            changed = true;
            return Object.assign({}, order, {
              cashReceived: targetPaid,
              paymentMethod: "cash"
            });
          });
          if (state.orders.length !== originalOrdersLength) changed = true;
        }
        if (changed) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
      }
    } catch (error) {}

    try {
      var rawOutbox = window.localStorage.getItem("shopflow-outbox");
      if (rawOutbox) {
        var outbox = JSON.parse(rawOutbox);
        var outboxChanged = false;
        if (Array.isArray(outbox)) {
          var originalOutboxLength = outbox.length;
          outbox = outbox.filter(function (entry) {
            return !isKnownTechnicalTestSale(entry && entry.body);
          }).map(function (entry) {
            if (!entry || !entry.body || !isTargetSale(entry.body)) return entry;
            var body = repairSale(entry.body);
            outboxChanged = true;
            return Object.assign({}, entry, { body: body });
          });
          if (outbox.length !== originalOutboxLength) outboxChanged = true;
        }
        if (outboxChanged) {
          window.localStorage.setItem("shopflow-outbox", JSON.stringify(outbox));
        }
      }
    } catch (error) {}
  }

  repairKnownLocalPaymentIssues();

  // Bump this version to force a full re-sync for all clients when data structure changes
  var CACHE_VERSION = 9;
  if (window.localStorage && window.localStorage.getItem("shopflow-cache-version") !== String(CACHE_VERSION)) {
    window.localStorage.removeItem("shopflow-last-sync-at");
    window.localStorage.removeItem("shopflow-categories");
    window.localStorage.setItem("shopflow-cache-version", String(CACHE_VERSION));
  }
  var APP_VERSION = "3.6.0";
  var VAT_RATE = 0.08;
  var LANGUAGE_OPTIONS = [
    { id: "vi", label: "VI" },
    { id: "en", label: "EN" }
  ];
  var PAYMENT_METHOD_DEFAULT = "";
  var PAYMENT_METHOD_PLACEHOLDER = "Chọn / Select";
  var PAYMENT_METHOD_OPTIONS = [
    { value: "cash", label: "Tiền mặt / Cash" },
    { value: "card", label: "Thẻ / Card" },
    { value: "bank_transfer", label: "Chuyển khoản / Bank Transfer" },
    { value: "ewallet", label: "Ví điện tử / E-wallet" }
  ];
  var PAYMENT_METHOD_OTHER = { value: "other", label: "Khác / Other" };
  var POS_ORDER_STATUS_FILTERS = [
    { id: "all", label: "Tất cả / All" },
    { id: "new", label: "Mới / New" },
    { id: "preparing", label: "Đang chuẩn bị / Preparing" },
    { id: "held", label: "Tạm giữ / Held" },
    { id: "needs_action", label: "Cần xử lí / Needs Action" },
    { id: "completed", label: "Hoàn thành / Completed" }
  ];
  var ORDER_BOARD_COLLAPSED_LIMIT = 6;
  var CATEGORY_ICON_OPTIONS = [
    { value: "🛒", label: "Tất cả / All" },
    { value: "🍎", label: "Trái cây / Fruits" },
    { value: "🍊", label: "Nước ép / Juices" },
    { value: "🥤", label: "Sinh tố / Smoothies" },
    { value: "🧃", label: "Đồ uống / Beverages" },
    { value: "💪", label: "Dinh dưỡng / Nutritious" },
    { value: "🥛", label: "Sữa & ngũ cốc / Milk & Cereals" },
    { value: "🍿", label: "Đồ ăn vặt / Snacks" },
    { value: "🥫", label: "Nguyên liệu khô / Pantry" },
    { value: "📦", label: "Hộp & combo / Boxes" },
    { value: "🥡", label: "Bao bì / Packaging" },
    { value: "🧴", label: "Chăm sóc / Personal Care" },
    { value: "🧹", label: "Gia dụng / Household" },
    { value: "✨", label: "Khác / Other" }
  ];
  var COMPONENT_ITEM_TYPE_OPTIONS = [
    { value: "raw_material", label: "Nguyên liệu thô / Raw Material" },
    { value: "semi_finished", label: "Bán thành phẩm / Semi-finished" },
    { value: "packaging", label: "Bao bì / Packaging" },
    { value: "retail_product", label: "Hàng bán lẻ / Retail Product" }
  ];

  function stripVietnameseAccents(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

  function normalizePaymentMethod(value) {
    if (!value) {
      return PAYMENT_METHOD_DEFAULT;
    }

    var raw = String(value).trim();
    if (!raw) {
      return PAYMENT_METHOD_DEFAULT;
    }
    var key = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    var text = stripVietnameseAccents(raw);

    if (key === "cash" || /\bcash\b/.test(text) || text.indexOf("tien mat") !== -1) {
      return "cash";
    }
    if (key === "card" || /\bcard\b/.test(text) || /\bthe\b/.test(text)) {
      return "card";
    }
    if (
      key === "bank_transfer" ||
      key === "banktransfer" ||
      key === "transfer" ||
      text.indexOf("bank transfer") !== -1 ||
      text.indexOf("chuyen khoan") !== -1
    ) {
      return "bank_transfer";
    }
    if (
      key === "ewallet" ||
      key === "e_wallet" ||
      key === "wallet" ||
      text.indexOf("e-wallet") !== -1 ||
      text.indexOf("e wallet") !== -1 ||
      text.indexOf("vi dien tu") !== -1 ||
      text.indexOf("wallet") !== -1
    ) {
      return "ewallet";
    }

    return "other";
  }

  function getPaymentMethodOption(value) {
    var method = normalizePaymentMethod(value);
    return PAYMENT_METHOD_OPTIONS.find(function (option) {
      return option.value === method;
    }) || PAYMENT_METHOD_OTHER;
  }

  function getPaymentMethodLabel(value) {
    if (!normalizePaymentMethod(value)) {
      return PAYMENT_METHOD_PLACEHOLDER;
    }
    return getPaymentMethodOption(value).label;
  }

  function isCashPaymentMethod(value) {
    return normalizePaymentMethod(value) === "cash";
  }

  function normalizeComponentItemType(value) {
    var type = String(value || "raw_material").trim();
    return COMPONENT_ITEM_TYPE_OPTIONS.some(function (option) { return option.value === type; })
      ? type
      : "raw_material";
  }

  function getComponentItemTypeLabel(value) {
    var type = normalizeComponentItemType(value);
    var option = COMPONENT_ITEM_TYPE_OPTIONS.find(function (item) { return item.value === type; });
    return option ? option.label : COMPONENT_ITEM_TYPE_OPTIONS[0].label;
  }

  var FILTER_ALL_CATEGORY = { id: "all", label: "Tất cả / All", icon: "🛒" };
  // Master category list — matches database/cloudflare/migrations/0004_oria_master.sql.
  // Source of truth is the remote API database; this default only seeds first-time
  // localStorage so the app is usable before the initial /api/sync/pull lands.
  var DEFAULT_CATEGORY_OPTIONS = [
    // Level 1
    { id: "fruits",            code: "10000", parentId: null,         level: 1, label: "Trái cây / Fruits",                                   icon: "🍎" },
    { id: "smoothies",         code: "20000", parentId: null,         level: 1, label: "Sinh tố / Smoothies",                                 icon: "🥤" },
    { id: "juices",            code: "30000", parentId: null,         level: 1, label: "Nước ép / Juices",                                    icon: "🍊" },
    { id: "nutritious-drinks", code: "40000", parentId: null,         level: 1, label: "Thức uống dinh dưỡng / Nutritious Drinks",            icon: "💪" },
    { id: "refreshing-drinks", code: "50000", parentId: null,         level: 1, label: "Thức uống giải khát / Refreshing Beverages",          icon: "🧃" },
    { id: "essentials",        code: "60000", parentId: null,         level: 1, label: "Nhu yếu phẩm / Essentials & Convenience Goods",       icon: "🛒" },
    // Level 2 (children of essentials)
    { id: "snacks",        code: "61000", parentId: "essentials", level: 2, label: "Đồ ăn nhanh và đồ ăn vặt / Fast Food & Snacks",                                         icon: "🍿" },
    { id: "beverages",     code: "62000", parentId: "essentials", level: 2, label: "Thức uống, sữa, ngũ cốc / Beverages, Milk & Cereals",                                   icon: "🥛" },
    { id: "pantry",        code: "63000", parentId: "essentials", level: 2, label: "Nguyên liệu khô và thực phẩm thiết yếu trong bếp / Pantry & Kitchen Staples",           icon: "🥫" },
    { id: "personal-care", code: "64000", parentId: "essentials", level: 2, label: "Chăm sóc cá nhân & vệ sinh / Personal Care & Hygiene",                                  icon: "🧴" },
    { id: "household",     code: "65000", parentId: "essentials", level: 2, label: "Đồ gia dụng, vệ sinh nhà cửa và hàng thiết yếu / Household, Cleaning & Home Essentials", icon: "🧹" },
    { id: "packaging",     code: "66000", parentId: "essentials", level: 2, label: "Dụng cụ, bao bì, đồ dùng một lần / Utensils, Packaging & Disposable Food Ware",         icon: "🥡" }
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
    { id: "orange", label: "Cam / Orange", unit: "trái / fruits", note: "Nguyên liệu nước ép cam / Juice base", stockQty: 0, minStock: 0, active: true },
    { id: "watermelon", label: "Dưa hấu / Watermelon", unit: "gram", note: "Nguyên liệu lạnh / Chilled prep", stockQty: 0, minStock: 0, active: true },
    { id: "mint", label: "Lá bạc hà / Mint", unit: "lá / leaves", note: "Trang trí và tạo mùi / Garnish", stockQty: 0, minStock: 0, active: true },
    { id: "honey", label: "Mật ong / Honey", unit: "ml", note: "Tăng vị ngọt / Sweetener", stockQty: 0, minStock: 0, active: true },
    { id: "yogurt-base", label: "Sữa chua / Yogurt", unit: "gram", note: "Base cho smoothie / Smoothie base", stockQty: 0, minStock: 0, active: true },
    { id: "chia-base", label: "Hạt chia / Chia Seeds", unit: "gram", note: "Topping mặc định / Default topping", stockQty: 0, minStock: 0, active: true }
  ];

  // Demo/seed product list — only used the very first time the app loads on
  // a device that has no localStorage AND can't reach the remote API.
  // Once /api/sync/pull lands, these are replaced by the live master list.
  // (The legacy "p-*" demo products below are kept for offline first-run
  //  demo only; they are soft-deactivated in D1 by migration 0004.)
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
    storeName: "OriaFarm",
    brandLine: "ORIAFARM",
    brandDisplayName: "OriaFarm",
    branchName: "Quầy Linh Trần",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    phone: "0909 123 456",
    taxId: "0312345678",
    cashierName: "Linh Tran",
    openHours: "07:00 - 22:00",
    receiptFooter: "Cảm ơn quý khách đã ghé OriaFarm. / Thank you for visiting OriaFarm.",
    vatNote: "Giá đã bao gồm VAT / Prices include VAT",
    // Logo URLs. Two separate fields:
    //   - logoUrl       — color logo, used in app UI brand preview
    //   - logoPrintUrl  — pure-B/W high-contrast version optimised for
    //                     thermal receipt printers. Falls back to logoUrl
    //                     when empty.
    logoUrl: "/logo.png",
    logoPrintUrl: "/logo-thermal.png",
    firebaseSyncEnabled: false,
    firebaseApiKey: "",
    firebaseAuthDomain: "",
    firebaseProjectId: "",
    firebaseStorageBucket: "",
    firebaseMessagingSenderId: "",
    firebaseAppId: "",
    firebaseMeasurementId: "",
    firebaseSyncCollection: "posStores",
    firebaseSyncDocument: "main"
  };

  var DEFAULT_INVOICE_TEMPLATES = [
    {
      id: "invoice-classic",
      name: "Mẫu A — Cổ điển 80mm / Classic 80mm",
      title: "HÓA ĐƠN BÁN HÀNG / SALES RECEIPT",
      subtitle: "Mẫu A — Logo + địa chỉ + tổng (giá đã bao gồm VAT) / Logo + address + total (VAT included)",
      footer: "Cảm ơn quý khách đã ghé OriaFarm. / Thank you for visiting OriaFarm.",
      showSubtitle: true,
      showAddress: true,
      showBranch: true,
      showPhone: true,
      showTaxId: true,
      showCashier: true,
      showCustomerName: true,
      showPaymentMethod: true,
      showUnitPrice: true,
      showCashReceived: true,
      showChangeDue: true,
      showOrderMeta: true
    },
    {
      id: "invoice-vat",
      name: "FnB VAT Invoice",
      title: "HÓA ĐƠN VAT / VAT INVOICE",
      subtitle: "Dùng cho khách doanh nghiệp và xuất VAT / For business customers and VAT requests",
      footer: "Vui lòng đối chiếu thông tin doanh nghiệp trước khi xuất hóa đơn VAT. / Please verify business details before issuing the VAT invoice.",
      showSubtitle: true,
      showAddress: true,
      showBranch: true,
      showPhone: true,
      showTaxId: true,
      showCashier: true,
      showCustomerName: true,
      showPaymentMethod: true,
      showUnitPrice: true,
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

  function safeJsonParse(text, fallback) {
    try { return text ? JSON.parse(text) : fallback; }
    catch (e) { return fallback; }
  }

  // Vietnamese-accent-insensitive normaliser for search inputs.
  // "Cam Mật Ong" → "cam mat ong" → user can type "mat" and still match.
  // Uses NFD decomposition then strips combining marks; also folds đ/Đ.
  function normalizeSearchText(s) {
    if (!s) return "";
    var str = String(s).toLowerCase();
    try {
      str = str.normalize("NFD").replace(/[̀-ͯ]/g, "");
    } catch (_) { /* old browser: best-effort */ }
    return str.replace(/đ/g, "d").replace(/[^a-z0-9 ]+/g, " ").trim();
  }
  function productMatchesQuery(product, normalizedQuery) {
    if (!normalizedQuery) return true;
    var hay = normalizeSearchText(
      (product.name || "") + " " +
      (product.barcode || "") + " " +
      (product.skuCode || product.id || "") + " " +
      (product.description || "")
    );
    // AND-of-tokens: every space-separated word in the query must appear.
    var tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    for (var i = 0; i < tokens.length; i++) {
      if (hay.indexOf(tokens[i]) === -1) return false;
    }
    return true;
  }

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

  var BARCODE_DETECT_FORMATS = ["ean_13"];

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

    return createEan13Barcode(seed || normalizedValue);
  }

  function getBarcodeFormat(value) {
    return "EAN13";
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

  function getFirebaseSyncConfig(sourceSettings) {
    var safeSettings = sourceSettings || {};
    return {
      enabled: !!safeSettings.firebaseSyncEnabled,
      apiKey: String(safeSettings.firebaseApiKey || "").trim(),
      authDomain: String(safeSettings.firebaseAuthDomain || "").trim(),
      projectId: String(safeSettings.firebaseProjectId || "").trim(),
      storageBucket: String(safeSettings.firebaseStorageBucket || "").trim(),
      messagingSenderId: String(safeSettings.firebaseMessagingSenderId || "").trim(),
      appId: String(safeSettings.firebaseAppId || "").trim(),
      measurementId: String(safeSettings.firebaseMeasurementId || "").trim(),
      collection: String(safeSettings.firebaseSyncCollection || "posStores").trim() || "posStores",
      document: String(safeSettings.firebaseSyncDocument || "main").trim() || "main"
    };
  }

  function isFirebaseSyncConfigured(syncConfig) {
    var safeConfig = syncConfig || {};
    return !!(safeConfig.apiKey && safeConfig.authDomain && safeConfig.projectId && safeConfig.appId);
  }

  function buildFirebaseAppName(syncConfig) {
    return "fruit-house-pos-" + String((syncConfig && syncConfig.projectId) || "default").replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
  }

  function getFirebaseLocalSettings(sourceSettings) {
    var safeSettings = sourceSettings || {};
    return {
      firebaseSyncEnabled: !!safeSettings.firebaseSyncEnabled,
      firebaseApiKey: safeSettings.firebaseApiKey || "",
      firebaseAuthDomain: safeSettings.firebaseAuthDomain || "",
      firebaseProjectId: safeSettings.firebaseProjectId || "",
      firebaseStorageBucket: safeSettings.firebaseStorageBucket || "",
      firebaseMessagingSenderId: safeSettings.firebaseMessagingSenderId || "",
      firebaseAppId: safeSettings.firebaseAppId || "",
      firebaseMeasurementId: safeSettings.firebaseMeasurementId || "",
      firebaseSyncCollection: safeSettings.firebaseSyncCollection || "posStores",
      firebaseSyncDocument: safeSettings.firebaseSyncDocument || "main"
    };
  }

  function stripFirebaseSettings(sourceSettings) {
    var nextSettings = Object.assign({}, sourceSettings || {});
    delete nextSettings.firebaseSyncEnabled;
    delete nextSettings.firebaseApiKey;
    delete nextSettings.firebaseAuthDomain;
    delete nextSettings.firebaseProjectId;
    delete nextSettings.firebaseStorageBucket;
    delete nextSettings.firebaseMessagingSenderId;
    delete nextSettings.firebaseAppId;
    delete nextSettings.firebaseMeasurementId;
    delete nextSettings.firebaseSyncCollection;
    delete nextSettings.firebaseSyncDocument;
    return nextSettings;
  }

  function mapDocsById(docs) {
    return (docs || []).reduce(function (result, doc) {
      result[doc.id] = doc.data;
      return result;
    }, {});
  }

  function normalizeFirebaseValue(value) {
    if (value === undefined) {
      return null;
    }

    if (Array.isArray(value)) {
      return value.map(normalizeFirebaseValue);
    }

    if (value && typeof value === "object") {
      return Object.keys(value).reduce(function (result, key) {
        result[key] = normalizeFirebaseValue(value[key]);
        return result;
      }, {});
    }

    return value;
  }

  function buildFirebaseDoc(id, data) {
    return {
      id: String(id || ""),
      data: normalizeFirebaseValue(data || {})
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
        createdAt: createdAt,
        orderNumberSource: "local"
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
      discountAmount: Number(baseOrder.discountAmount) || 0,
      status: baseOrder.status || "open",
      syncError: baseOrder.syncError || baseOrder.sync_error || "",
      syncRetryCount: Number(baseOrder.syncRetryCount || baseOrder.sync_retry_count) || 0,
      createdAt: baseOrder.createdAt || Date.now(),
      customerName: baseOrder.customerName || "Khách lẻ / Walk-in",
      paymentMethod: normalizePaymentMethod(baseOrder.paymentMethod),
      cashReceived: Number(baseOrder.cashReceived) || 0,
      orderNumberSource: baseOrder.orderNumberSource || baseOrder.order_number_source || "local",
      reservedSaleId: baseOrder.reservedSaleId || baseOrder.reserved_sale_id || ""
    };
  }

  function isOrderNumberLocked(order) {
    return !!(order && (order.reservedSaleId || order.orderNumberSource === "server"));
  }

  function canonicalOrderIdFromSaleId(saleId) {
    var match = String(saleId || "").match(/^HD-(\d{4})(\d{2})(\d{2})-(\d+)$/i);
    if (!match) return "";
    return match[3] + "/" + match[2] + "/" + match[1] + "-" + String(Number(match[4]) || 0).padStart(3, "0");
  }

  function normalizeSaleRecord(sale) {
    var baseSale = sale || {};
    var isKnownPaymentFix =
      baseSale.orderId === "09/06/2026-019" ||
      baseSale.order_id === "09/06/2026-019" ||
      baseSale.id === "09/06/2026-019" ||
      baseSale.id === "HD-20260609-019";
    var fixedPaid = isKnownPaymentFix ? 61000 : (Number(baseSale.paid) || 0);
    var fixedPaymentMethod = isKnownPaymentFix ? "cash" : normalizePaymentMethod(baseSale.paymentMethod || baseSale.payment_method);
    var normalizedTotal = Number(baseSale.total) || 0;
    var normalizedId = baseSale.id || uid("sale");
    var canonicalOrderId = canonicalOrderIdFromSaleId(normalizedId);
    var rawSyncStatus = baseSale.syncStatus || baseSale.sync_status || "";
    var normalizedSyncStatus = rawSyncStatus || (/^HD-/i.test(String(normalizedId)) ? "synced" : "pending");
    return Object.assign({}, baseSale, {
      id: normalizedId,
      orderId: canonicalOrderId || baseSale.orderId || baseSale.order_id || "",
      clientOpId: baseSale.clientOpId || baseSale.client_op_id || "",
      serverId: baseSale.serverId || baseSale.server_id || (/^HD-/i.test(String(normalizedId)) ? normalizedId : ""),
      syncStatus: normalizedSyncStatus,
      syncError: baseSale.syncError || baseSale.sync_error || "",
      createdAt: Number(baseSale.createdAt || baseSale.created_at) || 0,
      total: normalizedTotal,
      subtotal: Number(baseSale.subtotal) || 0,
      discount: Number(baseSale.discount) || 0,
      vat: Number(baseSale.vat || baseSale.vatAmount || baseSale.vat_amount) || 0,
      vatAmount: Number(baseSale.vatAmount || baseSale.vat_amount || baseSale.vat) || 0,
      paid: fixedPaid,
      changeAmount: isKnownPaymentFix ? Math.max(0, fixedPaid - normalizedTotal) : (Number(baseSale.changeAmount || baseSale.change_amount) || 0),
      paymentMethod: fixedPaymentMethod,
      customerName: baseSale.customerName || baseSale.customer_name || "",
      cashReceived: isKnownPaymentFix ? fixedPaid : (Number(baseSale.cashReceived || baseSale.paid) || 0),
      cashierName: baseSale.cashierName || baseSale.cashier_name || "",
      paymentStatus: isKnownPaymentFix ? "paid" : (baseSale.paymentStatus || baseSale.payment_status || "paid"),
      orderStatus: baseSale.orderStatus || baseSale.order_status || "completed",
      note: baseSale.note || "",
      items: Array.isArray(baseSale.items) ? baseSale.items : [],
      itemCount: Number(baseSale.itemCount || baseSale.item_count) || 0
    });
  }

  function isSaleRevenueEligible(sale) {
    var total = Number(sale && (sale.total || sale.total_amount)) || 0;
    var paid = Number(sale && (sale.paid || sale.cashReceived || sale.cash_received)) || 0;
    var orderStatus = String((sale && (sale.orderStatus || sale.order_status)) || "completed").toLowerCase();
    var paymentStatus = String((sale && (sale.paymentStatus || sale.payment_status)) || "paid").toLowerCase();
    var syncStatus = String((sale && (sale.syncStatus || sale.sync_status)) || "").toLowerCase();
    if (total <= 0) return false;
    if (orderStatus && orderStatus !== "completed") return false;
    if (paymentStatus && paymentStatus !== "paid") return false;
    if (syncStatus !== "synced") return false;
    if (!isServerSaleRecord(sale)) return false;
    return paid >= total;
  }

  function isServerSaleRecord(sale) {
    return /^HD-/i.test(String((sale && (sale.serverId || sale.server_id || sale.id)) || ""));
  }

  function dedupeSalesByOrderId(saleList) {
    var byKey = {};
    (saleList || []).map(normalizeSaleRecord).forEach(function (sale) {
      var key = sale.orderId || sale.id;
      var existing = byKey[key];
      if (!existing) {
        byKey[key] = sale;
        return;
      }

      var saleIsServer = isServerSaleRecord(sale);
      var existingIsServer = isServerSaleRecord(existing);
      if (saleIsServer && !existingIsServer) {
        byKey[key] = sale;
        return;
      }
      if (saleIsServer === existingIsServer && (Number(sale.createdAt) || 0) > (Number(existing.createdAt) || 0)) {
        byKey[key] = sale;
      }
    });
    return Object.keys(byKey).map(function (key) { return byKey[key]; });
  }

  function getSaleStatusMeta(sale) {
    var syncStatus = String((sale && (sale.syncStatus || sale.sync_status)) || "").toLowerCase();
    if (isSaleRevenueEligible(sale)) {
      return { label: "Hoàn thành / Completed", tone: "success" };
    }
    if (syncStatus === "error" || syncStatus === "needs_action" || !isServerSaleRecord(sale)) {
      return { label: "Cần xử lí / Needs Action", tone: "danger" };
    }
    return { label: "Đang chờ đồng bộ / Pending Sync", tone: "warning" };
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

  function getItemLineGross(item, addOnOptions) {
    var basePrice = Number(item && item.price) || 0;
    var qty = Number(item && item.qty) || 0;
    var linePrice = basePrice + (Number(getItemAddonTotal(item || {}, addOnOptions)) || 0);
    return Math.max(0, Math.round(linePrice * qty));
  }

  function getItemDiscountAmount(item, addOnOptions) {
    var gross = getItemLineGross(item, addOnOptions);
    var rawValue = Number(item && item.discountValue) || 0;
    if (!rawValue || gross <= 0) return 0;
    var discountType = item && item.discountType === "amount" ? "amount" : "percent";
    var discount = discountType === "amount"
      ? rawValue
      : gross * (Math.min(Math.max(rawValue, 0), 100) / 100);
    return Math.min(gross, Math.max(0, Math.round(discount)));
  }

  function getItemLineNet(item, addOnOptions) {
    return Math.max(0, getItemLineGross(item, addOnOptions) - getItemDiscountAmount(item, addOnOptions));
  }

  function calculateOrder(order, addOnOptions) {
    var safeOrder = order || normalizeOrder({ createdAt: Date.now() });
    var subtotal = (safeOrder.items || []).reduce(function (sum, item) {
      // B6: coerce numbers to avoid string concatenation if localStorage
      // restored strings.
      return sum + getItemLineGross(item, addOnOptions);
    }, 0);
    subtotal = Math.round(subtotal);
    var itemDiscount = (safeOrder.items || []).reduce(function (sum, item) {
      return sum + getItemDiscountAmount(item, addOnOptions);
    }, 0);
    var discount = itemDiscount + (Number(safeOrder.discountAmount) || 0);
    // Tương thích ngược với đơn hàng cũ còn dùng discountPct
    if (!discount && safeOrder.discountPct) {
      discount = Math.round(subtotal * (Number(safeOrder.discountPct) / 100));
    }
    // Prices are VAT-INCLUSIVE: the price printed on the product / shown in
    // POS already contains the tax. So `total` = subtotal - discount (no
    // additional VAT row). VAT is computed BACKWARDS purely for accounting
    // export — never added to what the customer pays.
    //   gross = net + vat   ⇒   net = gross / (1+rate),   vat = gross - net
    var total = Math.max(0, subtotal - discount);
    var vat = VAT_RATE > 0 ? Math.round(total - (total / (1 + VAT_RATE))) : 0;
    var itemCount = (safeOrder.items || []).reduce(function (sum, item) {
      return sum + (Number(item.qty) || 0);
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

  function formatQuantity(value, maximumFractionDigits) {
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: maximumFractionDigits == null ? 2 : maximumFractionDigits
    }).format(Number(value) || 0);
  }

  function normalizeQtyUnit(value) {
    var unit = String(value || "").trim().toLowerCase();
    if (unit === "kg" || unit === "kilogram" || unit === "kilograms") return "kg";
    if (unit === "g" || unit === "gram" || unit === "grams") return "gram";
    if (unit === "l" || unit === "liter" || unit === "litre" || unit === "lit") return "l";
    if (unit === "ml" || unit === "milliliter" || unit === "milliliters") return "ml";
    if (unit === "cái" || unit === "cai" || unit === "piece" || unit === "pieces" || unit === "pcs") return "piece";
    return unit;
  }

  function allowsFractionalQty(unit) {
    var normalized = normalizeQtyUnit(unit);
    return normalized === "kg" || normalized === "gram" || normalized === "l" || normalized === "ml";
  }

  function qtyInputStep(unit) {
    return allowsFractionalQty(unit) ? "0.001" : "1";
  }

  function qtyInputMin(unit) {
    return allowsFractionalQty(unit) ? "0.001" : "1";
  }

  function normalizeQtyForUnit(value, unit) {
    var qty = Number(value);
    if (!Number.isFinite(qty)) return 0;
    qty = Math.max(0, qty);
    if (allowsFractionalQty(unit)) {
      return Math.round(qty * 1000) / 1000;
    }
    return Math.floor(qty);
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

  function hydrateStoredState(stored) {
    var safeStored = stored || {};
    var storedSequenceByDate = Object.assign({}, safeStored.orderSequenceByDate || {});
    var normalizedOrders = Array.isArray(safeStored.orders) && safeStored.orders.length
      ? safeStored.orders.map(function (order) {
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
      categories: Array.isArray(safeStored.categories) && safeStored.categories.length ? safeStored.categories : clone(DEFAULT_CATEGORY_OPTIONS),
      addOns: Array.isArray(safeStored.addOns) && safeStored.addOns.length ? safeStored.addOns : clone(DEFAULT_ADD_ON_OPTIONS),
      components: Array.isArray(safeStored.components) && safeStored.components.length ? safeStored.components.map(normalizeComponent) : clone(DEFAULT_COMPONENT_OPTIONS).map(normalizeComponent),
      products: Array.isArray(safeStored.products) && safeStored.products.length ? safeStored.products.map(normalizeProduct) : clone(DEFAULT_PRODUCTS).map(normalizeProduct),
      productionRecipes: Array.isArray(safeStored.productionRecipes) ? safeStored.productionRecipes.map(normalizeProductionRecipe) : [],
      productionBatches: Array.isArray(safeStored.productionBatches) ? safeStored.productionBatches.map(normalizeProductionBatch) : [],
      sales: Array.isArray(safeStored.sales)
        ? safeStored.sales.filter(function (sale) { return !isKnownTechnicalTestSale(sale); }).map(normalizeSaleRecord)
        : [],
      orders: normalizedOrders,
      activeOrderId: safeStored.activeOrderId || null,
      language: safeStored.language || "vi",
      orderSequenceByDate: storedSequenceByDate,
      settings: Object.assign({}, DEFAULT_SETTINGS, safeStored.settings || {}),
      invoiceTemplates: Array.isArray(safeStored.invoiceTemplates) && safeStored.invoiceTemplates.length
        ? safeStored.invoiceTemplates.map(function (template, index) {
            return normalizeInvoiceTemplate(template, DEFAULT_INVOICE_TEMPLATES[index] || DEFAULT_INVOICE_TEMPLATES[0]);
          })
        : clone(DEFAULT_INVOICE_TEMPLATES),
      barcodeTemplates: Array.isArray(safeStored.barcodeTemplates) && safeStored.barcodeTemplates.length
        ? safeStored.barcodeTemplates.map(function (template, index) {
            return normalizeBarcodeTemplate(template, DEFAULT_BARCODE_TEMPLATES[index] || DEFAULT_BARCODE_TEMPLATES[0]);
          })
        : clone(DEFAULT_BARCODE_TEMPLATES),
      selectedInvoiceTemplateId: safeStored.selectedInvoiceTemplateId || DEFAULT_INVOICE_TEMPLATES[0].id,
      selectedBarcodeTemplateId: safeStored.selectedBarcodeTemplateId || DEFAULT_BARCODE_TEMPLATES[0].id
    };
  }

  function buildInitialState() {
    var stored = readStorage();
    var emptySequenceByDate = {};

    if (stored) {
      return hydrateStoredState(stored);
    }

    var firstOrderState = createOrder(emptySequenceByDate);
    var firstOrder = firstOrderState.order;

    return {
      categories: clone(DEFAULT_CATEGORY_OPTIONS),
      addOns: clone(DEFAULT_ADD_ON_OPTIONS),
      components: clone(DEFAULT_COMPONENT_OPTIONS).map(normalizeComponent),
      products: clone(DEFAULT_PRODUCTS).map(normalizeProduct),
      productionRecipes: [],
      productionBatches: [],
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

  function normalizeWastePercent(value) {
    var n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.min(99, Math.max(0, n));
  }

  function getRecipeEntryWastePercent(entry) {
    var safeEntry = entry || {};
    if (safeEntry.wastePercent !== undefined) return normalizeWastePercent(safeEntry.wastePercent);
    if (safeEntry.waste_percent !== undefined) return normalizeWastePercent(safeEntry.waste_percent);
    if (safeEntry.wasteRate !== undefined) {
      var wasteRate = Number(safeEntry.wasteRate);
      return normalizeWastePercent(wasteRate > 0 && wasteRate <= 1 ? wasteRate * 100 : wasteRate);
    }
    if (safeEntry.waste_rate !== undefined) {
      var snakeWasteRate = Number(safeEntry.waste_rate);
      return normalizeWastePercent(snakeWasteRate > 0 && snakeWasteRate <= 1 ? snakeWasteRate * 100 : snakeWasteRate);
    }
    return 0;
  }

  function normalizeRecipeEntry(entry) {
    if (typeof entry === "string") {
      return { id: entry, qty: 1, unit: "", wastePercent: 0, note: "" };
    }
    var safeEntry = entry || {};
    return {
      id: safeEntry.id || safeEntry.componentId || safeEntry.component_id || "",
      qty: safeEntry.qty === undefined || safeEntry.qty === null
        ? 1
        : Math.max(0, Number(safeEntry.qty) || 0),
      unit: safeEntry.unit || "",
      wastePercent: getRecipeEntryWastePercent(safeEntry),
      note: safeEntry.note || ""
    };
  }

  function getRecipeEntryStockQty(entry) {
    var normalizedEntry = normalizeRecipeEntry(entry);
    var netQty = Math.max(0, Number(normalizedEntry.qty) || 0);
    var usableRate = 1 - (normalizeWastePercent(normalizedEntry.wastePercent) / 100);
    if (usableRate <= 0) usableRate = 0.01;
    return netQty / usableRate;
  }

  function isProductImageUrl(value) {
    var imageValue = String(value || "").trim();
    return /^(https?:\/\/|data:image\/|blob:|\.\/|\/|assets\/|images\/)/i.test(imageValue);
  }

  function truncateWords(str, maxWords) {
    if (!str) return "";
    var words = str.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return str;
    return words.slice(0, maxWords).join(" ") + "...";
  }

  function normalizeProduct(product) {
    var baseProduct = product || {};
    var explicitInventoryMode = baseProduct.inventoryMode || baseProduct.inventory_mode || "";
    var normalizedInventoryMode = explicitInventoryMode === "recipe" || explicitInventoryMode === "stock"
      ? explicitInventoryMode
      : "";
    var rawImage = baseProduct.imageUrl || baseProduct.image_url || baseProduct.photoUrl || baseProduct.photo_url || baseProduct.image || "";
    var normalizedBarcode = getScannableBarcode(
      baseProduct.barcode,
      [baseProduct.id, baseProduct.name, baseProduct.category, baseProduct.barcode].join("|")
    );
    return Object.assign({}, baseProduct, {
      barcode: normalizedBarcode,
      image: rawImage,
      imageUrl: isProductImageUrl(rawImage) ? rawImage : "",
      imageIcon: isProductImageUrl(rawImage) ? "" : (rawImage || "🍊"),
      componentIds: Array.isArray(baseProduct.componentIds)
        ? baseProduct.componentIds.map(normalizeRecipeEntry).filter(function (entry) { return entry.id; })
        : [],
      inventoryMode: normalizedInventoryMode,
      unit: baseProduct.unit || "",
      skuCode: baseProduct.skuCode || baseProduct.sku_code || baseProduct.id
    });
  }

  function normalizeComponent(component) {
    var baseComponent = component || {};
    return Object.assign({}, baseComponent, {
      stockQty: Math.max(0, Number(baseComponent.stockQty != null ? baseComponent.stockQty : baseComponent.stock_qty) || 0),
      minStock: Math.max(0, Number(baseComponent.minStock != null ? baseComponent.minStock : baseComponent.min_stock) || 0),
      itemType: normalizeComponentItemType(baseComponent.itemType || baseComponent.item_type),
      costPerUnit: Math.max(0, Math.round(Number(baseComponent.costPerUnit != null ? baseComponent.costPerUnit : baseComponent.cost_per_unit) || 0)),
      isUnlimitedStock: baseComponent.isUnlimitedStock === true ||
        baseComponent.is_unlimited_stock === true ||
        Number(baseComponent.isUnlimitedStock != null ? baseComponent.isUnlimitedStock : baseComponent.is_unlimited_stock) === 1,
      active: baseComponent.active !== false && baseComponent.is_active !== 0
    });
  }

  function safeInputsArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        var parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }
    return [];
  }

  function normalizeProductionRecipe(recipe) {
    var base = recipe || {};
    return {
      id: base.id || "",
      name: base.name || "",
      outputComponentId: base.outputComponentId || base.output_component_id || "",
      outputLabel: base.outputLabel || base.output_label || "",
      plannedOutputQty: Math.max(0, Number(base.plannedOutputQty != null ? base.plannedOutputQty : base.planned_output_qty) || 0),
      outputUnit: base.outputUnit || base.output_unit || "",
      inputs: safeInputsArray(base.inputs || base.inputs_json).map(function (item) {
        return {
          componentId: item.componentId || item.component_id || "",
          qty: Math.max(0, Number(item.qty) || 0),
          unit: item.unit || ""
        };
      }).filter(function (item) { return item.componentId; }),
      note: base.note || "",
      isActive: base.isActive !== false && base.is_active !== 0,
      updatedAt: Number(base.updatedAt != null ? base.updatedAt : base.updated_at) || 0
    };
  }

  function normalizeProductionBatch(batch) {
    var base = batch || {};
    var addOns = [];
    if (Array.isArray(base.addOns)) {
      addOns = base.addOns;
    } else if (Array.isArray(base.addons)) {
      addOns = base.addons;
    } else if (typeof base.addonsJson === "string" || typeof base.addons_json === "string") {
      try {
        addOns = JSON.parse(base.addonsJson || base.addons_json || "[]");
      } catch (error) {
        addOns = [];
      }
    }
    return {
      id: base.id || "",
      recipeId: base.recipeId || base.recipe_id || "",
      recipeName: base.recipeName || base.recipe_name || "",
      outputComponentId: base.outputComponentId || base.output_component_id || "",
      outputLabel: base.outputLabel || base.output_label || "",
      plannedOutputQty: Math.max(0, Number(base.plannedOutputQty != null ? base.plannedOutputQty : base.planned_output_qty) || 0),
      actualOutputQty: Math.max(0, Number(base.actualOutputQty != null ? base.actualOutputQty : base.actual_output_qty) || 0),
      outputUnit: base.outputUnit || base.output_unit || "",
      totalInputCost: Math.max(0, Number(base.totalInputCost != null ? base.totalInputCost : base.total_input_cost) || 0),
      actualCostPerUnit: Math.max(0, Number(base.actualCostPerUnit != null ? base.actualCostPerUnit : base.actual_cost_per_unit) || 0),
      addOns: addOns.map(function (addOn) {
        if (typeof addOn === "string") return { id: addOn, label: addOn, price: 0, group: "extras" };
        return {
          id: addOn.id || addOn.addOnId || "",
          label: addOn.label || "",
          price: Math.max(0, Number(addOn.price) || 0),
          group: addOn.group || addOn.groupKey || "extras"
        };
      }).filter(function (addOn) { return !!addOn.id; }),
      note: base.note || "",
      createdAt: Number(base.createdAt != null ? base.createdAt : base.created_at) || 0
    };
  }

  function getEffectiveInventoryMode(product, categoryList) {
    if (product && product.inventoryMode === "recipe") return "recipe";
    if (product && product.inventoryMode === "stock") return "stock";
    return "";
  }

  function isRecipeTrackedProduct(product, categoryList) {
    return getEffectiveInventoryMode(product, categoryList) === "recipe";
  }

  function getRecipeEntries(product) {
    if (!product || !Array.isArray(product.componentIds)) return [];
    return product.componentIds.map(function (entry) {
      return normalizeRecipeEntry(entry);
    }).filter(function (entry) {
      return !!entry.id;
    });
  }

  function calculateRecipeStock(product, componentList) {
    var recipeEntries = getRecipeEntries(product);
    if (!recipeEntries.length) return 0;
    var minPossible = Infinity;
    for (var i = 0; i < recipeEntries.length; i += 1) {
      var entry = recipeEntries[i];
      var sourceComponent = (componentList || []).find(function (component) { return component.id === entry.id; });
      if (!sourceComponent) return 0;
      if (sourceComponent.isUnlimitedStock) continue;
      var qtyNeeded = Math.max(0.0001, getRecipeEntryStockQty(entry) || 1);
      var available = Math.max(0, Number(sourceComponent.stockQty) || 0);
      var possible = Math.floor(available / qtyNeeded);
      if (possible < minPossible) minPossible = possible;
    }
    return minPossible === Infinity ? 999999 : Math.max(0, minPossible);
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

  // Build a print/preview document optimized for 80mm thermal receipt printers
  // (Xprinter / Star / Epson TM-T82 etc.). Layout = "Mẫu A — Cổ điển":
  //
  //         [ LOGO image ]
  //        TÊN CỬA HÀNG
  //         Địa chỉ, ĐT, MST
  //   ─────────────────────────
  //      HÓA ĐƠN BÁN HÀNG
  //   Số / Ngày / Thu ngân / Khách
  //   ─────────────────────────
  //   Tên SP
  //     SL × đơn giá        tổng
  //   ─────────────────────────
  //   TỔNG CỘNG          XX,XXX
  //   (Giá đã bao gồm VAT 8%)
  //   Khách đưa          YY,YYY
  //   Tiền thừa          ZZ,ZZZ
  //   ─────────────────────────
  //        Cảm ơn quý khách
  //
  // Paper width 80mm; we render at 72mm so it always fits with margin.
  // Thermal heads can print images (in B/W via dithering) — so the customer
  // logo file at /logo.png is referenced directly. If not reachable, the
  // browser falls back to alt text which is still readable.
  function buildPrintMarkup(order, totals, settings, template, type, language, addOnOptions) {
    function esc(s) { return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

    var cashReceived = Number(order.cashReceived) || 0;
    var totalAmount = Number(totals.total) || 0;
    var changeDue = Math.max(0, cashReceived - totalAmount);
    var showUnitPrice = template.showUnitPrice !== false;

    // Each item: 2 lines (name + addons / qty×price → line total).
    var lineItems = (order.items || []).map(function (item) {
      var addons = (item.addOnIds || []).map(function (id) {
        var a = getAddonById(id, addOnOptions);
        return a ? pickLanguage(a.label, language) : "";
      }).filter(Boolean).join(", ");
      var unitPrice = (Number(item.price) || 0) + getItemAddonTotal(item, addOnOptions);
      var qty = Number(item.qty) || 0;
      var lineTotal = unitPrice * qty;
      var addonRow = addons ? "<div class='addon'>+ " + esc(addons) + "</div>" : "";
      var noteRow = item.note ? "<div class='addon'>Ghi chú: " + esc(item.note) + "</div>" : "";
      var unitText = showUnitPrice
        ? (qty + " × " + formatCurrency(unitPrice))
        : ("SL " + qty);
      return (
        "<div class='item'>" +
          "<div class='item-name'>" + esc(item.name) + "</div>" +
          addonRow +
          noteRow +
          "<div class='item-row'>" +
            "<span>" + esc(unitText) + "</span>" +
            "<strong>" + formatCurrency(lineTotal) + "</strong>" +
          "</div>" +
        "</div>"
      );
    }).join("");

    // Logo source priority for receipts:
    //   1. settings.logoPrintUrl — B/W thermal-optimised
    //   2. settings.logoUrl      — colour fallback
    //   3. /logo-thermal.png     — bundled default
    //
    // CRITICAL: when this HTML is injected into a popup opened as
    // `about:blank`, a relative URL like "/logo.png" resolves against
    // about:blank, NOT the parent origin — so the image fails to load and
    // print prints a broken-image icon. We MUST convert to an absolute
    // URL using the parent origin before injecting.
    var rawLogo = settings.logoPrintUrl || settings.logoUrl || "/logo-thermal.png";
    var logoUrl = rawLogo;
    if (rawLogo && rawLogo.indexOf("//") === -1 && typeof window !== "undefined" && window.location) {
      // Resolve a relative path against the current page's origin.
      logoUrl = window.location.origin + (rawLogo.charAt(0) === "/" ? "" : "/") + rawLogo;
    }
    var logoHtml = logoUrl
      ? "<img class='logo' src='" + esc(logoUrl) + "' alt='" + esc(settings.brandDisplayName || settings.storeName) + "' />"
      : "";

    // Address block (single column, centered).
    var addressLines = [];
    if (settings.address) addressLines.push(esc(settings.address));
    var contactInline = [];
    if (settings.phone) contactInline.push("ĐT: " + esc(settings.phone));
    if (settings.taxId) contactInline.push("MST: " + esc(settings.taxId));
    if (contactInline.length) addressLines.push(contactInline.join("  ·  "));
    if (settings.branchName) addressLines.push(esc(pickLanguage("Chi nhánh / Branch", language)) + ": " + esc(settings.branchName));
    var addressHtml = addressLines.length
      ? "<div class='address'>" + addressLines.join("<br>") + "</div>"
      : "";

    // Order meta (số, ngày, thu ngân, khách, thanh toán).
    var metaRows = [];
    if (template.showOrderMeta !== false) {
      metaRows.push("<div class='meta-row'><span>" + esc(pickLanguage("Số / No", language)) + ":</span><strong>" + esc(order.id) + "</strong></div>");
      metaRows.push("<div class='meta-row'><span>" + esc(pickLanguage("Ngày / Date", language)) + ":</span><span>" + esc(formatDateTime(order.createdAt || Date.now())) + "</span></div>");
    }
    if (template.showCashier !== false && settings.cashierName)
      metaRows.push("<div class='meta-row'><span>" + esc(pickLanguage("Thu ngân / Cashier", language)) + ":</span><span>" + esc(settings.cashierName) + "</span></div>");
    if (template.showCustomerName !== false)
      metaRows.push("<div class='meta-row'><span>" + esc(pickLanguage("Khách / Cust", language)) + ":</span><span>" + esc(order.customerName || pickLanguage("Khách lẻ / Walk-in", language)) + "</span></div>");
    if (template.showPaymentMethod !== false && order.paymentMethod)
      metaRows.push("<div class='meta-row'><span>" + esc(pickLanguage("TT / Pay", language)) + ":</span><span>" + esc(pickLanguage(getPaymentMethodLabel(order.paymentMethod), language)) + "</span></div>");
    var metaHtml = metaRows.join("");

    // CSS: screen preview wraps the 80mm sheet in a soft background; print
    // strips it down to bare receipt at the real paper width.
    var css =
      "* { box-sizing: border-box; }" +
      "html, body { margin: 0; padding: 0; }" +
      "body { font-family: 'Courier New', Consolas, 'Liberation Mono', monospace; color: #000; background: #f3eee6; }" +
      ".sheet { width: 72mm; margin: 14px auto; background: #fff; padding: 5mm 4mm; font-size: 12px; line-height: 1.4; box-shadow: 0 8px 20px rgba(0,0,0,0.08); }" +
      ".center { text-align: center; }" +
      // Force max contrast on the logo: any colour pixel collapses toward
      // black for thermal heads. Even if the user uploaded a colour PNG,
      // these filters make it print 3-4x darker than the raw image.
      ".logo { display: block; max-width: 56mm; max-height: 22mm; margin: 0 auto 4px; object-fit: contain; " +
        "filter: grayscale(100%) contrast(2.5) brightness(0.55); " +
        "-webkit-print-color-adjust: exact; print-color-adjust: exact; }" +
      ".shop-name { font-size: 15px; font-weight: 700; letter-spacing: 0.4px; text-align: center; margin: 0; }" +
      ".address { font-size: 11px; line-height: 1.5; text-align: center; margin-top: 2px; }" +
      "hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }" +
      ".doc-title { font-size: 13px; font-weight: 700; text-align: center; letter-spacing: 1px; margin: 2px 0; }" +
      ".meta { font-size: 11px; margin: 2px 0; }" +
      ".meta-row { display: flex; justify-content: space-between; gap: 8px; line-height: 1.5; }" +
      ".meta-row span:first-child { color: #333; }" +
      ".item { margin: 4px 0; }" +
      ".item-name { font-weight: 700; word-wrap: break-word; }" +
      ".addon { font-size: 11px; padding-left: 8px; color: #333; }" +
      ".item-row { display: flex; justify-content: space-between; gap: 6px; font-size: 12px; }" +
      ".totals { font-size: 12px; line-height: 1.6; }" +
      ".totals .row { display: flex; justify-content: space-between; gap: 8px; }" +
      ".grand-row { font-size: 15px; font-weight: 700; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }" +
      ".vat-note { font-size: 10.5px; font-style: italic; text-align: center; margin: 2px 0 4px; color: #222; }" +
      ".footer { text-align: center; font-size: 11px; margin-top: 6px; }" +
      "@media print {" +
        "@page { size: 80mm auto; margin: 0; }" +
        "body { background: #fff; }" +
        ".sheet { width: 100%; margin: 0; padding: 2mm 3mm; box-shadow: none; }" +
        ".no-print { display: none; }" +
      "}";

    // <base href> makes any future relative URL inside the popup resolve
    // against the parent app — not against about:blank — so if anyone adds
    // <img src="something"> later it still works.
    var baseHref = (typeof window !== "undefined" && window.location)
      ? window.location.origin + "/"
      : "/";

    return (
      "<!DOCTYPE html><html><head><meta charset='utf-8'>" +
      "<base href='" + esc(baseHref) + "'>" +
      "<title>" + esc(template.title || pickLanguage(type, language)) + " — " + esc(order.id) + "</title>" +
      "<style>" + css + "</style></head>" +
      "<body>" +
        "<div class='sheet'>" +
          // Header: logo + shop name + address
          logoHtml +
          "<div class='shop-name'>" + esc(settings.brandDisplayName || settings.storeName) + "</div>" +
          addressHtml +
          "<hr>" +
          // Doc title
          "<div class='doc-title'>" + esc(pickLanguage(template.title || "HÓA ĐƠN BÁN HÀNG / RECEIPT", language)) + "</div>" +
          (metaHtml ? "<div class='meta'>" + metaHtml + "</div>" : "") +
          "<hr>" +
          // Items
          "<div class='items'>" + lineItems + "</div>" +
          "<hr>" +
          // Totals: single grand total + VAT-inclusive note
          "<div class='totals'>" +
            (totals.discount ? "<div class='row'><span>" + esc(pickLanguage("Giảm / Discount", language)) + "</span><span>-" + formatCurrency(totals.discount) + "</span></div>" : "") +
            "<div class='row grand-row'><span>" + esc(pickLanguage("TỔNG CỘNG / TOTAL", language)) + "</span><span>" + formatCurrency(totalAmount) + "</span></div>" +
            "<div class='vat-note'>" + esc(pickLanguage("(Giá đã bao gồm VAT) / (VAT included)", language)) + "</div>" +
            (template.showCashReceived !== false && cashReceived > 0 ? "<div class='row'><span>" + esc(pickLanguage("Khách đưa / Cash", language)) + "</span><span>" + formatCurrency(cashReceived) + "</span></div>" : "") +
            (template.showChangeDue !== false && cashReceived > 0 ? "<div class='row'><span>" + esc(pickLanguage("Tiền thừa / Change", language)) + "</span><span>" + formatCurrency(changeDue) + "</span></div>" : "") +
          "</div>" +
          "<hr>" +
          (template.footer ? "<p class='footer'>" + esc(pickLanguage(template.footer, language)) + "</p>" : "") +
          "<p class='footer'>" + esc(pickLanguage("★ Cảm ơn quý khách ★ / ★ Thank you ★", language)) + "</p>" +
        "</div>" +
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

    if (props.user) {
      var role = props.user.role;
      items = items.filter(function (item) {
        if (role === "admin") return true;
        if (role === "manager") {
          return item.id !== "settings";
        }
        if (role === "cashier") {
          return item.id === "pos";
        }
        if (role === "inventory") {
          return item.id === "inventory";
        }
        if (role === "accountant") {
          return item.id === "dashboard";
        }
        return false;
      });
    }

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



  // -----------------------------------------------------------------
  // Remote API sync bridge.
  // window.ShopFlowSync is provided by sync.js (loaded before app.js).
  // We guard every call so the app still works if sync.js failed to load
  // or the API is offline.
  // -----------------------------------------------------------------
  function syncEnqueue(payload) {
    try {
      if (window.ShopFlowSync && typeof window.ShopFlowSync.enqueue === "function") {
        return window.ShopFlowSync.enqueue(payload);
      }
    } catch (err) {
      // Never let sync errors block UI flows.
      if (window && window.console) console.warn("syncEnqueue failed", err);
    }
    return null;
  }

  function syncApi(path, opts) {
    if (!window.ShopFlowSync || typeof window.ShopFlowSync.api !== "function") {
      return Promise.reject(new Error("sync not ready"));
    }
    return window.ShopFlowSync.api(path, opts);
  }

  function LocalNumberInput(props) {
    var useEffect = window.React.useEffect;
    var useRef = window.React.useRef;
    
    var inputRef = useRef(null);
    var focused = useRef(false);

    useEffect(function() {
      if (inputRef.current && !focused.current) {
        var strVal = props.value == null ? "" : String(props.value);
        if (inputRef.current.value !== strVal) {
          inputRef.current.value = strVal;
        }
      }
    }, [props.value]);

    return html`
      <input
        ref=${inputRef}
        type="number"
        min=${props.min}
        max=${props.max}
        step=${props.step}
        className=${props.className ? props.className + " no-spinners" : "no-spinners"}
        style=${props.style}
        defaultValue=${props.value == null ? "" : props.value}
        onFocus=${function(e) {
          focused.current = true;
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur=${function(e) {
          focused.current = false;
          if (props.onBlur) props.onBlur(e);
        }}
        onInput=${function(e) {
          if (props.onChange) {
            props.onChange(e.target.value === "" ? "" : Number(e.target.value));
          }
        }}
        onKeyDown=${function(e) {
          if (e.key === "Enter") {
             e.target.blur();
          }
          if (props.onKeyDown) props.onKeyDown(e);
        }}
      />
    `;
  }

  function App() {
    var initialState = useMemo(buildInitialState, []);
    var [nowTick, setNowTick] = useState(Date.now());
    var [categories, setCategories] = useState(initialState.categories);
    var [addOns, setAddOns] = useState(initialState.addOns);
    var [components, setComponents] = useState(initialState.components);
    var [productionRecipes, setProductionRecipes] = useState(initialState.productionRecipes || []);
    var [productionBatches, setProductionBatches] = useState(initialState.productionBatches || []);
    var [rawProducts, setProducts] = useState(initialState.products);
    var products = useMemo(function () {
      return rawProducts.map(function(product) {
        var inventoryMode = getEffectiveInventoryMode(product, categories);
        var isMixedDrink = inventoryMode === "recipe";
        var effectiveStock = isMixedDrink
          ? calculateRecipeStock(product, components)
          : (Number(product.stock) || 0);

        return Object.assign({}, product, {
          inventoryMode: inventoryMode,
          isMixedDrink: isMixedDrink,
          rawStock: Number(product.stock) || 0,
          stock: isMixedDrink ? effectiveStock : product.stock
        });
      });
    }, [rawProducts, categories, components]);
    function findProductById(productId) {
      return products.find(function (product) { return product.id === productId; });
    }
    function getOrderItemUnit(item) {
      var product = item && item.productId ? findProductById(item.productId) : null;
      return (item && item.unit) || (product && product.unit) || "";
    }
    var [sales, setSales] = useState(initialState.sales);
    var [orders, setOrders] = useState(initialState.orders);
    var [activeOrderId, setActiveOrderId] = useState(initialState.activeOrderId || initialState.orders[0].id);
    var [completedSaleDetail, setCompletedSaleDetail] = useState(null);
    var [language, setLanguage] = useState(initialState.language || "vi");
    var [orderSequenceByDate, setOrderSequenceByDate] = useState(initialState.orderSequenceByDate || {});
    var [settings, setSettings] = useState(initialState.settings);
    var [invoiceTemplates, setInvoiceTemplates] = useState(initialState.invoiceTemplates);
    var [barcodeTemplates, setBarcodeTemplates] = useState(initialState.barcodeTemplates);
    var [selectedInvoiceTemplateId, setSelectedInvoiceTemplateId] = useState(initialState.selectedInvoiceTemplateId);
    var [selectedBarcodeTemplateId, setSelectedBarcodeTemplateId] = useState(initialState.selectedBarcodeTemplateId);
    var [activeView, setActiveView] = useState("pos");
    var [menuOpen, setMenuOpen] = useState(false);

    // ---- Remote API sync state ----------------------------------
    var [syncStatus, setSyncStatus] = useState({ online: true, pending: 0, lastSyncAt: 0, lastError: null });
    var [checkoutSaving, setCheckoutSaving] = useState(false);
    // Toast queue — array of { id, kind: "success"|"error"|"info", text, ts }.
    // Auto-dismissed by the renderer after ~3.5s.
    var [toasts, setToasts] = useState([]);
    function pushToast(kind, text) {
      var id = "t-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      setToasts(function (cur) { return cur.concat([{ id: id, kind: kind, text: text, ts: Date.now() }]); });
      window.setTimeout(function () {
        setToasts(function (cur) { return cur.filter(function (t) { return t.id !== id; }); });
      }, 3500);
    }

    var [currentUser, setCurrentUser] = useState(null);
    var [authLoading, setAuthLoading] = useState(true);
    var [loginEmail, setLoginEmail] = useState("");
    var [loginPassword, setLoginPassword] = useState("");
    var [loginError, setLoginError] = useState("");
    var [loginSubmitting, setLoginSubmitting] = useState(false);

    useEffect(function () {
      fetch("/api/auth/me")
        .then(function (res) {
          if (res.ok) {
            return res.json().then(function (data) {
              if (data.ok && data.user) {
                setCurrentUser(data.user);
              }
              setAuthLoading(false);
            });
          }
          setAuthLoading(false);
        })
        .catch(function () {
          setAuthLoading(false);
        });
    }, []);

    function getFirstAllowedView(role) {
      if (role === "inventory") return "inventory";
      if (role === "accountant") return "dashboard";
      return "pos";
    }

    function handleLoginSubmit(e) {
      e.preventDefault();
      if (!loginEmail || !loginPassword) {
        setLoginError("Vui lòng nhập đầy đủ thông tin. / Please fill in all fields.");
        return;
      }
      setLoginError("");
      setLoginSubmitting(true);
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            setLoginSubmitting(false);
            if (res.ok && data.ok && data.user) {
              setCurrentUser(data.user);
              setActiveView(getFirstAllowedView(data.user.role));
              setLoginEmail("");
              setLoginPassword("");
            } else {
              setLoginError(data.error || "Login failed");
            }
          });
        })
        .catch(function () {
          setLoginSubmitting(false);
          setLoginError("Network error. Please try again.");
        });
    }

    function handleLogout() {
      fetch("/api/auth/logout", { method: "POST" })
        .then(function () {
          setCurrentUser(null);
        })
        .catch(function () {
          setCurrentUser(null);
        });
    }

    var [suppliers, setSuppliers] = useState([]);
    var [purchases, setPurchases] = useState([]);
    var [issues, setIssues] = useState([]);
    var [movements, setMovements] = useState([]);
    // Drafts for nhập/xuất views
    var [purchaseDraft, setPurchaseDraft] = useState({ supplierId: "", supplierName: "", paymentMethod: "cash", note: "", items: [] });
    var [purchaseItemType, setPurchaseItemType] = useState("product");
    var [purchaseProductSearch, setPurchaseProductSearch] = useState("");
    var [purchaseDetail, setPurchaseDetail] = useState(null);
    var [issueDraft, setIssueDraft] = useState({ reason: "damaged", note: "", items: [] });
    var [issueItemType, setIssueItemType] = useState("product");
    var [issueItemSearch, setIssueItemSearch] = useState("");
    var [issueDetail, setIssueDetail] = useState(null);
    var [supplierDraft, setSupplierDraft] = useState({ id: null, name: "", phone: "", address: "", note: "" });
    var [warehouseTab, setWarehouseTab] = useState("stock"); // stock | ledger | stocktake
    var [stockOpsMode, setStockOpsMode] = useState("in"); // in | out
    var [stockCheckTab, setStockCheckTab] = useState("check"); // check | ledger | stocktake
    var [componentWorkspaceMode, setComponentWorkspaceMode] = useState("edit"); // edit | convert
    var [stocktakeDraft, setStocktakeDraft] = useState({}); // productId -> actual qty
    // Search boxes for product lookup in Kho hàng (Inventory) and Lưu kho
    // (Warehouse) views. Plain string; we run productMatchesQuery() on top.
    var [inventorySearchTerm, setInventorySearchTerm] = useState("");
    var [warehouseSearchTerm, setWarehouseSearchTerm] = useState("");
    // Dashboard date-range filter — preset or custom range
    var [dashboardRange, setDashboardRange] = useState("today"); // today|week|month|year|custom
    var [dashboardCustomFrom, setDashboardCustomFrom] = useState("");
    var [dashboardCustomTo, setDashboardCustomTo] = useState("");
    var [dashboardRevenueMode, setDashboardRevenueMode] = useState("chart");
    // POS category sidebar: which parent categories are currently expanded.
    // Object map { [parentId]: true }. Starts empty (all collapsed).
    var [expandedCategories, setExpandedCategories] = useState({});
    var [expandedProducts, setExpandedProducts] = useState({});
    function toggleProductExpanded(name) {
      setExpandedProducts(function (cur) {
        var next = Object.assign({}, cur);
        if (next[name]) delete next[name]; else next[name] = true;
        return next;
      });
    }
    // Quick-add category form toggle on POS sidebar
    var [showQuickCategoryForm, setShowQuickCategoryForm] = useState(false);
    var [orderStatusFilter, setOrderStatusFilter] = useState("all");
    var [orderBoardExpanded, setOrderBoardExpanded] = useState(false);
    var [posOrderPicked, setPosOrderPicked] = useState(false);
    var [checkoutPanelOpen, setCheckoutPanelOpen] = useState(false);
    var [productCustomizer, setProductCustomizer] = useState(null);
    function toggleCategoryExpanded(id) {
      setExpandedCategories(function (cur) {
        var next = Object.assign({}, cur);
        if (next[id]) delete next[id]; else next[id] = true;
        return next;
      });
    }
    var [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
    var [selectedCategory, setSelectedCategory] = useState("all");
    var [searchTerm, setSearchTerm] = useState("");
    var [functionSearchTerm, setFunctionSearchTerm] = useState("");
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
    var [firebaseSyncStatus, setFirebaseSyncStatus] = useState("local");
    var [firebaseLastSyncedAt, setFirebaseLastSyncedAt] = useState("");
    var [firebaseSyncError, setFirebaseSyncError] = useState("");
    var [barcodeInput, setBarcodeInput] = useState("");
    var [scanMessage, setScanMessage] = useState("");
    var [cameraActive, setCameraActive] = useState(false);
    var [productDraft, setProductDraft] = useState({
      id: null,
      customId: "",
      skuCode: "",
      skuTouched: false,
      idTouched: false,
      name: "",
      category: initialState.categories[0] ? initialState.categories[0].id : "",
      inventoryMode: "",
      inventoryModeTouched: false,
      price: 0,
      stock: 0,
      barcode: "",
      image: "🍊",
      description: "",
      componentIds: [],
      minStock: 0,
      unit: ""
    });
    var [categoryDraft, setCategoryDraft] = useState({
      id: null,
      code: "",
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
      note: "",
      itemType: "raw_material",
      costPerUnit: 0,
      stockQty: 0,
      minStock: 0,
      isUnlimitedStock: false
    });
    var [productionRecipeDraft, setProductionRecipeDraft] = useState({
      id: null,
      name: "",
      outputComponentId: "",
      plannedOutputQty: 0,
      outputUnit: "",
      inputs: [],
      note: "",
      isActive: true
    });
    var [productionBatchDraft, setProductionBatchDraft] = useState({
      recipeId: "",
      actualOutputQty: "",
      addOnIds: [],
      note: ""
    });
    var [lastProductionResult, setLastProductionResult] = useState(null);
    var [conversionDraft, setConversionDraft] = useState({
      productId: "",
      productQty: 1,
      componentMode: "existing",
      componentId: "",
      componentLabelVi: "",
      componentLabelEn: "",
      componentUnit: "",
      componentQty: "",
      expiryDays: 1,
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
    var firebaseAppRef = useRef(null);
    var firestoreRef = useRef(null);
    var firestoreDocRef = useRef(null);
    var firestoreUnsubscribeRef = useRef(null);
    var lastSyncedPayloadRef = useRef("");
    var applyingRemoteSnapshotRef = useRef(false);
    var syncDebounceRef = useRef(null);
    var orderNumberReservationsRef = useRef({});
    var initialOrderReservationStartedRef = useRef(false);
    var lastSyncedOrderStatesRef = useRef({});

    useEffect(function () {
      var timer = window.setInterval(function () {
        setNowTick(Date.now());
      }, 30000);
      return function () {
        window.clearInterval(timer);
      };
    }, []);

    useEffect(function () {
      if (initialOrderReservationStartedRef.current) return;
      initialOrderReservationStartedRef.current = true;
      orders.forEach(function (order) {
        if (order && order.orderNumberSource !== "server") {
          reserveServerOrderNumber(order.id);
        }
      });
    }, []);

    function buildPersistedStateSnapshot(includeFirebaseSettings) {
      var nextSettings = includeFirebaseSettings === false
        ? stripFirebaseSettings(settings)
        : settings;

      return {
        categories: categories,
        addOns: addOns,
        components: components,
        productionRecipes: productionRecipes,
        productionBatches: productionBatches,
        products: products,
        sales: sales,
        orders: orders,
        activeOrderId: activeOrderId,
        language: language,
        orderSequenceByDate: orderSequenceByDate,
        settings: nextSettings,
        invoiceTemplates: invoiceTemplates,
        barcodeTemplates: barcodeTemplates,
        selectedInvoiceTemplateId: selectedInvoiceTemplateId,
        selectedBarcodeTemplateId: selectedBarcodeTemplateId
      };
    }

    function applyPersistedStateSnapshot(snapshot) {
      var hydrated = hydrateStoredState(snapshot || {});
      var localFirebaseSettings = getFirebaseLocalSettings(settings);
      setCategories(hydrated.categories);
      setAddOns(hydrated.addOns);
      setComponents(hydrated.components);
      setProductionRecipes(hydrated.productionRecipes || []);
      setProductionBatches(hydrated.productionBatches || []);
      setProducts(hydrated.products);
      setSales(hydrated.sales);
      setOrders(hydrated.orders);
      setActiveOrderId(hydrated.activeOrderId || (hydrated.orders[0] ? hydrated.orders[0].id : ""));
      setLanguage(hydrated.language || "vi");
      setOrderSequenceByDate(hydrated.orderSequenceByDate || {});
      setSettings(Object.assign({}, hydrated.settings, localFirebaseSettings));
      setInvoiceTemplates(hydrated.invoiceTemplates);
      setBarcodeTemplates(hydrated.barcodeTemplates);
      setSelectedInvoiceTemplateId(hydrated.selectedInvoiceTemplateId);
      setSelectedBarcodeTemplateId(hydrated.selectedBarcodeTemplateId);
    }

    function getFirebaseSyncMeta() {
      return getFirebaseSyncConfig(settings);
    }

    function pushStateToFirebase(syncReason) {
      if (!firestoreDocRef.current || !window.firebase || !window.firebase.firestore) {
        if (syncReason === "manual") {
          window.alert(L("Hãy nhập cấu hình Firebase và bật đồng bộ trước. / Enter your Firebase config and enable sync first."));
        }
        return Promise.resolve(false);
      }

      var payload = buildPersistedStateSnapshot(false);
      var payloadJson = JSON.stringify(payload);

      if (payloadJson === lastSyncedPayloadRef.current && syncReason !== "manual") {
        return Promise.resolve(false);
      }

      setFirebaseSyncStatus("syncing");
      setFirebaseSyncError("");

      return firestoreDocRef.current.set({
        payload: payload,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: settings.cashierName || "POS User",
        appVersion: APP_VERSION
      }, { merge: true }).then(function () {
        lastSyncedPayloadRef.current = payloadJson;
        setFirebaseSyncStatus("synced");
        setFirebaseLastSyncedAt(formatDateTime(Date.now()));
        return true;
      }).catch(function (error) {
        setFirebaseSyncStatus("error");
        setFirebaseSyncError(error && error.message ? error.message : "Firebase sync failed");
        return false;
      });
    }

    function pullStateFromFirebase() {
      if (!firestoreDocRef.current) {
        window.alert(L("Chưa kết nối Firebase. / Firebase is not connected yet."));
        return;
      }

      setFirebaseSyncStatus("syncing");
      setFirebaseSyncError("");

      firestoreDocRef.current.get().then(function (snapshot) {
        if (!snapshot.exists || !snapshot.data() || !snapshot.data().payload) {
          return pushStateToFirebase("manual");
        }

        var remotePayload = snapshot.data().payload;
        var hydratedPayload = hydrateStoredState(remotePayload);
        var payloadJson = JSON.stringify(Object.assign({}, hydratedPayload, {
          settings: stripFirebaseSettings(hydratedPayload.settings)
        }));
        lastSyncedPayloadRef.current = payloadJson;
        applyingRemoteSnapshotRef.current = true;
        applyPersistedStateSnapshot(remotePayload);
        setFirebaseSyncStatus("synced");
        setFirebaseLastSyncedAt(formatDateTime(Date.now()));
        return true;
      }).catch(function (error) {
        setFirebaseSyncStatus("error");
        setFirebaseSyncError(error && error.message ? error.message : "Firebase pull failed");
      });
    }

    // Dirty refs for debounced D1 settings/template persistence.
    // Declared up here so handlePulled() (called from sync engine) can flip
    // them to false BEFORE applying server-driven state — preventing the
    // pull from triggering a write-back loop.
    var settingsDirtyRef = useRef(false);
    var invoiceTemplatesDirtyRef = useRef(false);
    var barcodeTemplatesDirtyRef = useRef(false);
    // Per-product timers for debounced inline stock adjustments.
    // Key = productId, value = setTimeout handle.
    var stockEditTimersRef = useRef({});

    useEffect(function () {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedStateSnapshot(true)));
      } catch (error) {
        // Keep the POS working even when storage is unavailable.
      }
    }, [
      categories,
      addOns,
      components,
      productionRecipes,
      productionBatches,
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
      var syncConfig = getFirebaseSyncMeta();

      if (firestoreUnsubscribeRef.current) {
        firestoreUnsubscribeRef.current();
        firestoreUnsubscribeRef.current = null;
      }

      firestoreRef.current = null;
      firestoreDocRef.current = null;

      if (!syncConfig.enabled) {
        setFirebaseSyncStatus("local");
        setFirebaseSyncError("");
        return undefined;
      }

      if (!window.firebase || !window.firebase.firestore) {
        setFirebaseSyncStatus("error");
        setFirebaseSyncError("Firebase SDK not loaded");
        return undefined;
      }

      if (!isFirebaseSyncConfigured(syncConfig)) {
        setFirebaseSyncStatus("incomplete");
        setFirebaseSyncError("");
        return undefined;
      }

      setFirebaseSyncStatus("connecting");
      setFirebaseSyncError("");

      try {
        var appName = buildFirebaseAppName(syncConfig);
        var firebaseApp = (window.firebase.apps || []).find(function (app) {
          return app.name === appName;
        });

        if (!firebaseApp) {
          firebaseApp = window.firebase.initializeApp({
            apiKey: syncConfig.apiKey,
            authDomain: syncConfig.authDomain,
            projectId: syncConfig.projectId,
            storageBucket: syncConfig.storageBucket || undefined,
            messagingSenderId: syncConfig.messagingSenderId || undefined,
            appId: syncConfig.appId,
            measurementId: syncConfig.measurementId || undefined
          }, appName);
        }

        firebaseAppRef.current = firebaseApp;
        firestoreRef.current = firebaseApp.firestore();
        firestoreDocRef.current = firestoreRef.current.collection(syncConfig.collection).doc(syncConfig.document);

        firestoreUnsubscribeRef.current = firestoreDocRef.current.onSnapshot(function (snapshot) {
          if (!snapshot.exists || !snapshot.data() || !snapshot.data().payload) {
            pushStateToFirebase("seed");
            return;
          }

          var remotePayload = snapshot.data().payload;
          var hydratedPayload = hydrateStoredState(remotePayload);
          var payloadJson = JSON.stringify(Object.assign({}, hydratedPayload, {
            settings: stripFirebaseSettings(hydratedPayload.settings)
          }));

          if (payloadJson === lastSyncedPayloadRef.current) {
            setFirebaseSyncStatus("synced");
            return;
          }

          applyingRemoteSnapshotRef.current = true;
          lastSyncedPayloadRef.current = payloadJson;
          applyPersistedStateSnapshot(remotePayload);
          setFirebaseSyncStatus("synced");
          setFirebaseLastSyncedAt(formatDateTime(Date.now()));
        }, function (error) {
          setFirebaseSyncStatus("error");
          setFirebaseSyncError(error && error.message ? error.message : "Firebase listener failed");
        });
      } catch (error) {
        setFirebaseSyncStatus("error");
        setFirebaseSyncError(error && error.message ? error.message : "Firebase initialization failed");
      }

      return function () {
        if (firestoreUnsubscribeRef.current) {
          firestoreUnsubscribeRef.current();
          firestoreUnsubscribeRef.current = null;
        }
      };
    }, [
      settings.firebaseSyncEnabled,
      settings.firebaseApiKey,
      settings.firebaseAuthDomain,
      settings.firebaseProjectId,
      settings.firebaseStorageBucket,
      settings.firebaseMessagingSenderId,
      settings.firebaseAppId,
      settings.firebaseMeasurementId,
      settings.firebaseSyncCollection,
      settings.firebaseSyncDocument
    ]);

    useEffect(function () {
      var syncConfig = getFirebaseSyncMeta();

      if (!syncConfig.enabled || !isFirebaseSyncConfigured(syncConfig) || !firestoreDocRef.current) {
        return undefined;
      }

      if (applyingRemoteSnapshotRef.current) {
        applyingRemoteSnapshotRef.current = false;
        lastSyncedPayloadRef.current = JSON.stringify(buildPersistedStateSnapshot(false));
        return undefined;
      }

      if (syncDebounceRef.current) {
        window.clearTimeout(syncDebounceRef.current);
      }

      syncDebounceRef.current = window.setTimeout(function () {
        pushStateToFirebase("auto");
      }, 900);

      return function () {
        if (syncDebounceRef.current) {
          window.clearTimeout(syncDebounceRef.current);
          syncDebounceRef.current = null;
        }
      };
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

    function buildOpenOrderSalePayload(orderSnapshot) {
      var saleTotals = calculateOrder(orderSnapshot, addOns);
      var payload = buildSalePayload(orderSnapshot, saleTotals, uid("open-sync-op"));
      payload.orderStatus = getOrderWorkflowStatus(orderSnapshot); // "new", "preparing", "held", "needs_action"
      
      var originalNote = orderSnapshot.note || "";
      var cleanedNote = originalNote.replace(/^\[status:[a-zA-Z0-9_-]+\]\s*/, "");
      payload.note = "[status:" + payload.orderStatus + "]" + (cleanedNote ? " " + cleanedNote : "");
      
      payload.paymentMethod = "other";
      payload.paid = 0;
      return payload;
    }

    function syncOpenOrder(order) {
      if (!order.reservedSaleId) return Promise.resolve(null);
      var payload = buildOpenOrderSalePayload(order);
      return syncApi("/sales", {
        method: "POST",
        body: payload
      }).catch(function (err) {
        if (window && window.console) {
          window.console.warn("syncOpenOrder failed for order " + order.id, err);
        }
      });
    }

    var openOrderSyncDebounceRef = useRef({});

    useEffect(function () {
      if (!window.ShopFlowSync) return undefined;

      // 1. Detect removed orders (cancelled/deleted)
      var currentOrderIds = new Set(orders.map(function (o) { return o.id; }));
      Object.keys(lastSyncedOrderStatesRef.current).forEach(function (orderId) {
        if (!currentOrderIds.has(orderId)) {
          var lastStateStr = lastSyncedOrderStatesRef.current[orderId];
          try {
            var lastState = JSON.parse(lastStateStr);
            if (lastState && lastState.reservedSaleId) {
              var isCompleted = sales.some(function (s) {
                return s.id === lastState.reservedSaleId || s.orderId === orderId;
              });
              if (!isCompleted) {
                syncApi("/sales", {
                  method: "POST",
                  body: {
                    id: lastState.reservedSaleId,
                    orderId: orderId,
                    orderStatus: "cancelled",
                    items: []
                  }
                }).catch(function (err) {
                  if (window && window.console) {
                    window.console.warn("Could not cancel deleted order on server", err);
                  }
                });
              }
            }
          } catch (_) {}
          delete lastSyncedOrderStatesRef.current[orderId];
        }
      });

      // 2. Detect created or modified orders to sync
      orders.forEach(function (order) {
        if (!order.reservedSaleId) return;

        var orderStr = JSON.stringify(order);
        var lastSyncedStr = lastSyncedOrderStatesRef.current[order.id] || "";

        if (orderStr !== lastSyncedStr) {
          if (openOrderSyncDebounceRef.current[order.id]) {
            window.clearTimeout(openOrderSyncDebounceRef.current[order.id]);
          }

          openOrderSyncDebounceRef.current[order.id] = window.setTimeout(function () {
            var syncingStr = orderStr;
            syncOpenOrder(order).then(function () {
              lastSyncedOrderStatesRef.current[order.id] = syncingStr;
            });
            delete openOrderSyncDebounceRef.current[order.id];
          }, 1000);
        }
      });

      return function () {
        Object.keys(openOrderSyncDebounceRef.current).forEach(function (orderId) {
          if (openOrderSyncDebounceRef.current[orderId]) {
            window.clearTimeout(openOrderSyncDebounceRef.current[orderId]);
          }
        });
      };
    }, [orders, sales]);

    // ---------- Remote API sync wiring ----------
    useEffect(function () {
      if (!window.ShopFlowSync) return undefined;

      function handlePulled(data) {
        function mapHeldSaleToOrder(row) {
          var items = [];
          if (row.items_json) {
            try {
              var parsed = Array.isArray(row.items_json) ? row.items_json : JSON.parse(row.items_json);
              if (Array.isArray(parsed)) {
                items = parsed.map(function (it) {
                  var addOnIds = [];
                  var addonsJson = it.addonsJson || it.addons_json;
                  if (addonsJson) {
                    try {
                      var parsedAddons = typeof addonsJson === "string" ? JSON.parse(addonsJson) : addonsJson;
                      if (Array.isArray(parsedAddons)) {
                        addOnIds = parsedAddons.map(function (a) { return a.id; }).filter(Boolean);
                      }
                    } catch (_) {}
                  }
                  return {
                    productId: it.productId || it.product_id,
                    name: it.name || it.product_name,
                    qty: Number(it.qty) || 0,
                    price: Number(it.price || it.unit_price) || 0,
                    unit: it.unit || "",
                    addOnIds: addOnIds,
                    note: it.note || ""
                  };
                });
              }
            } catch (_) {}
          }
          
          var note = row.note || "";
          var status = "open";
          var match = note.match(/^\[status:([a-zA-Z0-9_-]+)\]/);
          if (match) {
            var parsedStatus = match[1];
            if (parsedStatus === "new") status = "open";
            else if (parsedStatus === "preparing") status = "preparing";
            else if (parsedStatus === "held") status = "held";
            else if (parsedStatus === "needs_action") status = "needs_action";
            else if (parsedStatus === "ready") status = "ready";
          }
          var cleanedNote = note.replace(/^\[status:[a-zA-Z0-9_-]+\]\s*/, "");
          
          return {
            id: row.order_id || row.orderId || "",
            items: items,
            takeAway: false,
            discountAmount: Number(row.discount) || 0,
            status: status,
            syncError: "",
            syncRetryCount: 0,
            createdAt: Number(row.created_at) || Date.now(),
            customerName: row.customer_name || "Khách lẻ / Walk-in",
            paymentMethod: normalizePaymentMethod(row.payment_method) || "",
            cashReceived: Number(row.paid) || 0,
            orderNumberSource: "server",
            reservedSaleId: row.id,
            note: cleanedNote
          };
        }

        // Merge products + inventory from server. Server is source of truth
        // for stock numbers; local edits are pushed via outbox, so by the
        // time we pull again, server already has them.
        if (Array.isArray(data.products) && data.products.length) {
          // Read pending stock edits from localStorage. Any product with an
          // unflushed edit must keep its LOCAL stock value — otherwise a pull
          // that runs before the outbox sends the adjustment would clobber
          // the user's typed value with stale server data.
          var pendingStockEdits = {};
          var pendingKey = "shopflow-pending-stock-edits";
          try {
            pendingStockEdits = JSON.parse(
              window.localStorage.getItem(pendingKey) || "{}"
            ) || {};
          } catch (_) {}

          // For each pending entry whose server value now matches the desired
          // newQty (i.e. our adjust has landed), or that's been stuck >30min
          // (escape hatch), CLEAR the guard so future pulls trust the server.
          var clearedAny = false;
          Object.keys(pendingStockEdits).forEach(function (pid) {
            var entry = pendingStockEdits[pid];
            var serverRow = data.products.find(function (r) { return r.id === pid; });
            if (serverRow && Number(serverRow.stock) === Number(entry.newQty)) {
              delete pendingStockEdits[pid];
              clearedAny = true;
            } else if (entry.sentAt && Date.now() - entry.sentAt > 30 * 60 * 1000) {
              // Stuck > 30 min — assume the op failed permanently; give up
              // the guard so we don't loop forever showing stale local data.
              delete pendingStockEdits[pid];
              clearedAny = true;
            }
          });
          if (clearedAny) {
            try {
              window.localStorage.setItem(pendingKey, JSON.stringify(pendingStockEdits));
            } catch (_) {}
          }

          // If this is a full snapshot (since=0), trust the server: drop any
          // local product that's not in the snapshot. Otherwise merge.
          var isFullSnapshot = !data.since;

          setProducts(function (current) {
            var byId = {};
            if (!isFullSnapshot) {
              current.forEach(function (p) { byId[p.id] = p; });
            }
            data.products.forEach(function (row) {
              // Mirror server soft-deletes locally.
              if (row.is_active === 0) { delete byId[row.id]; return; }
              var prev = byId[row.id] || {};
              var hasPendingEdit = Object.prototype.hasOwnProperty.call(pendingStockEdits, row.id);
              var resolvedStock = hasPendingEdit
                ? (Number(prev.stock) || Number(pendingStockEdits[row.id].newQty) || 0)
                : (Number(row.stock) || 0);
              byId[row.id] = normalizeProduct(Object.assign({}, prev, {
                id: row.id,
                name: row.name,
                category: row.category_id,
                price: Number(row.price) || 0,
                costPrice: Number(row.cost_price) || 0,
                stock: resolvedStock,
                barcode: row.barcode || prev.barcode || "",
                image: row.image || prev.image || "🛒",
                description: row.description || "",
                componentIds: row.component_ids ? safeJsonParse(row.component_ids, []) : (prev.componentIds || []),
                inventoryMode: row.inventory_mode === "recipe" || row.inventory_mode === "stock"
                  ? row.inventory_mode
                  : (prev.inventoryMode === "recipe" || prev.inventoryMode === "stock" ? prev.inventoryMode : ""),
                minStock: Number(row.min_stock) || 0,
                unit: row.unit || prev.unit || "",
                skuCode: row.sku_code || prev.skuCode || row.id
              }));
            });
            return Object.keys(byId).map(function (id) { return byId[id]; });
          });
        }
        if (Array.isArray(data.categories) && data.categories.length) {
          var isCatFullSnapshot = !data.since;
          setCategories(function (current) {
            var byId = {};
            if (!isCatFullSnapshot) {
              current.forEach(function (c) { byId[c.id] = c; });
            }
            data.categories.forEach(function (row) {
              if (row.is_active === 0) { delete byId[row.id]; return; }
              byId[row.id] = {
                id: row.id,
                label: row.label,
                icon: row.icon || "🛒",
                parentId: row.parent_id || null,
                level: Number(row.level) || 1,
                code: row.code || null,
                sortOrder: Number(row.sort_order) || 0
              };
            });
            var result = Object.keys(byId).map(function (id) { return byId[id]; });
            // Guard: never return empty — keep at least local data
            return result.length ? result : current;
          });
        }
        if (Array.isArray(data.addOns) && data.addOns.length) {
          var isAddonFullSnapshot = !data.since;
          setAddOns(function (current) {
            var byId = {};
            if (!isAddonFullSnapshot) {
              current.forEach(function (a) { byId[a.id] = a; });
            }
            data.addOns.forEach(function (row) {
              if (row.is_active === 0) { delete byId[row.id]; return; }
              byId[row.id] = { id: row.id, label: row.label, price: Number(row.price) || 0, group: row.group_key };
            });
            var result = Object.keys(byId).map(function (id) { return byId[id]; });
            return result.length ? result : current;
          });
        }
        if (Array.isArray(data.components) && data.components.length) {
          var isComponentFullSnapshot = !data.since;
          setComponents(function (current) {
            var byId = {};
            if (!isComponentFullSnapshot) {
              current.forEach(function (component) { byId[component.id] = component; });
            }
            data.components.forEach(function (row) {
              if (row.is_active === 0) { delete byId[row.id]; return; }
              byId[row.id] = normalizeComponent(Object.assign({}, byId[row.id] || {}, {
                id: row.id,
                label: row.label,
                unit: row.unit || "",
                note: row.note || "",
                stockQty: Number(row.stock_qty) || 0,
                minStock: Number(row.min_stock) || 0,
                itemType: row.item_type || "raw_material",
                costPerUnit: Number(row.cost_per_unit) || 0,
                isUnlimitedStock: Number(row.is_unlimited_stock) === 1 || row.is_unlimited_stock === true,
                active: row.is_active !== 0
              }));
            });
            var result = Object.keys(byId).map(function (id) { return byId[id]; });
            return result.length ? result : current;
          });
        }
        if (Array.isArray(data.productionRecipes) && data.productionRecipes.length) {
          var isProductionRecipeFullSnapshot = !data.since;
          setProductionRecipes(function (current) {
            var byId = {};
            if (!isProductionRecipeFullSnapshot) {
              current.forEach(function (recipe) { byId[recipe.id] = recipe; });
            }
            data.productionRecipes.forEach(function (row) {
              if (row.is_active === 0) { delete byId[row.id]; return; }
              byId[row.id] = normalizeProductionRecipe(row);
            });
            return Object.keys(byId).map(function (id) { return byId[id]; });
          });
        }
        if (Array.isArray(data.productionBatches) && data.productionBatches.length) {
          setProductionBatches(function (current) {
            var byId = {};
            current.forEach(function (batch) { byId[batch.id] = batch; });
            data.productionBatches.forEach(function (row) {
              byId[row.id] = normalizeProductionBatch(row);
            });
            return Object.keys(byId).map(function (id) { return byId[id]; }).sort(function (a, b) {
              return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
            });
          });
        }

        // Hydrate settings + templates from the server. We mark the
        // *DirtyRef = false BEFORE applying the state update so the
        // debounced-persistence effects above won't bounce the server data
        // right back.
        if (Array.isArray(data.settings) && data.settings.length) {
          data.settings.forEach(function (row) {
            var parsed;
            try { parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value; }
            catch (e) { parsed = null; }
            if (!parsed) return;
            if (row.key === "shop") {
              settingsDirtyRef.current = false;
              setSettings(function (prev) { return Object.assign({}, prev, parsed); });
            } else if (row.key === "invoice_templates" && Array.isArray(parsed.templates)) {
              invoiceTemplatesDirtyRef.current = false;
              setInvoiceTemplates(parsed.templates.map(function (t, i) {
                return normalizeInvoiceTemplate(t, DEFAULT_INVOICE_TEMPLATES[i] || DEFAULT_INVOICE_TEMPLATES[0]);
              }));
              if (parsed.selectedId) setSelectedInvoiceTemplateId(parsed.selectedId);
            } else if (row.key === "barcode_templates" && Array.isArray(parsed.templates)) {
              barcodeTemplatesDirtyRef.current = false;
              setBarcodeTemplates(parsed.templates.map(function (t, i) {
                return normalizeBarcodeTemplate(t, DEFAULT_BARCODE_TEMPLATES[i] || DEFAULT_BARCODE_TEMPLATES[0]);
              }));
              if (parsed.selectedId) setSelectedBarcodeTemplateId(parsed.selectedId);
            }
          });
        }

        if (Array.isArray(data.recentSales) && data.recentSales.length) {
          setSales(function (current) {
            var byId = {};
            current.forEach(function (s) {
              if (!isKnownTechnicalTestSale(s)) byId[s.id] = s;
            });
            data.recentSales.filter(function (row) {
              return !isKnownTechnicalTestSale(row) && row.order_status === "completed";
            }).forEach(function (row) {
              var items = [];
              if (row.items_json) {
                try {
                  var parsed = Array.isArray(row.items_json)
                    ? row.items_json
                    : JSON.parse(row.items_json);
                  if (Array.isArray(parsed)) {
                    items = parsed.map(function (it) {
                      return {
                        id: it.id,
                        productId: it.productId || it.product_id,
                        name: it.name || it.product_name,
                        qty: Number(it.qty) || 0,
                        price: Number(it.price || it.unit_price) || 0,
                        unit: it.unit || "",
                        addonsJson: it.addonsJson || it.addons_json,
                        addonsTotal: Number(it.addonsTotal || it.addons_total) || 0,
                        lineTotal: Number(it.lineTotal || it.line_total) || 0
                      };
                    });
                  }
                } catch (e) {}
              }

              byId[row.id] = normalizeSaleRecord(Object.assign({}, byId[row.id] || {}, {
                id: row.id,
                orderId: row.order_id || row.orderId || (byId[row.id] && byId[row.id].orderId) || "",
                createdAt: Number(row.created_at) || (byId[row.id] && byId[row.id].createdAt) || 0,
                total: Number(row.total) || 0,
                subtotal: Number(row.subtotal) || 0,
                discount: Number(row.discount) || 0,
                vat: Number(row.vat_amount) || 0,
                vatAmount: Number(row.vat_amount) || 0,
                paid: Number(row.paid) || 0,
                changeAmount: Number(row.change_amount) || 0,
                paymentMethod: normalizePaymentMethod(row.payment_method),
                customerName: row.customer_name || "Khách lẻ / Walk-in",
                cashierName: row.cashier_name || "",
                paymentStatus: row.payment_status || "paid",
                orderStatus: row.order_status || "completed",
                syncStatus: "synced",
                serverId: row.id,
                note: row.note || "",
                items: items.length > 0 ? items : (byId[row.id] ? byId[row.id].items : []),
                itemCount: Number(row.item_count) || (byId[row.id] ? Number(byId[row.id].itemCount) || 0 : 0)
              }));
            });
            var merged = Object.keys(byId).map(function (id) { return byId[id]; }).filter(function (sale) {
              return !isKnownTechnicalTestSale(sale);
            });
            merged.sort(function (a, b) { return b.createdAt - a.createdAt; });
            return merged.slice(0, 1000); // Keep last 1000 sales
          });

          // ----- Sync Open/Held Orders -----
          var heldSales = data.recentSales.filter(function (row) { return row.order_status === "held"; });
          var nonHeldSales = data.recentSales.filter(function (row) { return row.order_status === "completed" || row.order_status === "cancelled"; });

          var pulledOpenOrders = heldSales.map(mapHeldSaleToOrder);

          var completedOrCancelledSaleIds = new Set();
          var completedOrCancelledOrderIds = new Set();
          nonHeldSales.forEach(function (row) {
            completedOrCancelledSaleIds.add(row.id);
            if (row.order_id) completedOrCancelledOrderIds.add(row.order_id);
          });

          setOrders(function (currentOrders) {
            var updatedOrders = currentOrders.filter(function (order) {
              if (order.reservedSaleId && completedOrCancelledSaleIds.has(order.reservedSaleId)) return false;
              if (completedOrCancelledOrderIds.has(order.id)) return false;
              return true;
            });

            pulledOpenOrders.forEach(function (pulled) {
              var existingIdx = updatedOrders.findIndex(function (o) {
                return o.id === pulled.id || (o.reservedSaleId && o.reservedSaleId === pulled.reservedSaleId);
              });

              if (existingIdx !== -1) {
                var existing = updatedOrders[existingIdx];
                var localStateStr = JSON.stringify(existing);
                var lastSyncedStr = lastSyncedOrderStatesRef.current[existing.id] || "";
                if (localStateStr === lastSyncedStr) {
                  updatedOrders[existingIdx] = pulled;
                  lastSyncedOrderStatesRef.current[pulled.id] = JSON.stringify(pulled);
                }
              } else {
                updatedOrders.push(pulled);
                lastSyncedOrderStatesRef.current[pulled.id] = JSON.stringify(pulled);
              }
            });

            return ensureAtLeastOneOrder(updatedOrders);
          });
        }
      }

      function handleStatus(status) { setSyncStatus(status); }

      // Friendly Vietnamese labels by endpoint, so the toast says exactly
      // WHAT was saved (e.g. "Đã lưu tồn kho").
      function labelForOp(payload) {
        var ep = payload && payload.endpoint || "";
        var op = payload && payload.opType || "";
        if (ep.indexOf("/inventory/adjust") !== -1) return L("Đã lưu tồn kho / Stock saved");
        if (ep.indexOf("/inventory/convert") !== -1) return L("Đã chuyển tồn sang thành phần / Stock converted to component");
        if (ep.indexOf("/products") !== -1)        return L("Đã lưu sản phẩm / Product saved");
        if (ep.indexOf("/sales") !== -1)           return L("Đã lưu hóa đơn / Sale saved");
        if (ep.indexOf("/purchases") !== -1)       return L("Đã lưu phiếu nhập / Purchase saved");
        if (ep.indexOf("/issues") !== -1)          return L("Đã lưu phiếu xuất / Issue saved");
        if (ep.indexOf("/suppliers") !== -1)       return L("Đã lưu NCC / Supplier saved");
        if (ep.indexOf("/settings") !== -1)        return L("Đã lưu cài đặt / Settings saved");
        if (ep.indexOf("/categories") !== -1)      return L("Đã lưu danh mục / Category saved");
        if (ep.indexOf("/addons") !== -1)          return L("Đã lưu add-on / Add-on saved");
        return L("Đã lưu / Saved");
      }
      function handleSuccess(payload) {
        // Skip "no-op" adjust responses (delta=0) — these aren't real saves.
        if (payload && payload.response && payload.response.delta === 0) return;
        if (payload && payload.endpoint && payload.endpoint.indexOf("/sales") !== -1) {
          var responseId = payload.response && payload.response.id;
          var body = payload.body || {};
          setSales(function (currentSales) {
            var updated = currentSales.map(function (sale) {
              var sameClientOp = body.clientOpId && sale.clientOpId === body.clientOpId;
              var sameOrder = body.orderId && sale.orderId === body.orderId;
              if (!sameClientOp && !sameOrder) return sale;
              return normalizeSaleRecord(Object.assign({}, sale, {
                id: responseId || sale.id,
                serverId: responseId || sale.serverId || "",
                syncStatus: "synced",
                syncError: "",
                paymentStatus: "paid",
                orderStatus: "completed"
              }));
            });
            var cleaned = updated.filter(function (sale) {
              return !isKnownTechnicalTestSale(sale);
            });
            cleaned.sort(function (a, b) { return b.createdAt - a.createdAt; });
            return cleaned;
          });
        }
        pushToast("success", labelForOp(payload));
      }
      function handleFailure(payload) {
        var failureBody = payload && payload.body ? payload.body : {};
        var failureError = String(payload && payload.error || "");
        var isRecipeStockAdjustFailure =
          payload &&
          payload.endpoint &&
          payload.endpoint.indexOf("/inventory/adjust") !== -1 &&
          failureError.indexOf("recipe-based product stock is derived from components") !== -1;
        if (isRecipeStockAdjustFailure) {
          try {
            var outbox = JSON.parse(window.localStorage.getItem("shopflow-outbox") || "[]");
            if (Array.isArray(outbox)) {
              var nextOutbox = outbox.filter(function (op) {
                return op.clientOpId !== failureBody.clientOpId;
              });
              window.localStorage.setItem("shopflow-outbox", JSON.stringify(nextOutbox));
            }
            var pendingKey = "shopflow-pending-stock-edits";
            var pending = JSON.parse(window.localStorage.getItem(pendingKey) || "{}");
            if (failureBody.productId && pending[failureBody.productId]) {
              delete pending[failureBody.productId];
              window.localStorage.setItem(pendingKey, JSON.stringify(pending));
            }
          } catch (_) {}
          return;
        }
        if (payload && payload.endpoint && payload.endpoint.indexOf("/sales") !== -1) {
          setSales(function (currentSales) {
            return currentSales.map(function (sale) {
              var sameClientOp = failureBody.clientOpId && sale.clientOpId === failureBody.clientOpId;
              var sameOrder = failureBody.orderId && sale.orderId === failureBody.orderId;
              if (!sameClientOp && !sameOrder) return sale;
              return normalizeSaleRecord(Object.assign({}, sale, {
                syncStatus: "error",
                syncError: payload.error || L("Không đồng bộ được / Could not sync")
              }));
            });
          });
        }
        pushToast("error",
          L("Chưa lưu được — sẽ thử lại / Save failed — will retry") +
          (payload && payload.error ? " (" + payload.error + ")" : "")
        );
      }

      window.ShopFlowSync.init({
        onPulled: handlePulled,
        onStatusChange: handleStatus,
        onSuccess: handleSuccess,
        onFailure: handleFailure,
      });
      return undefined;
    }, []);

    // Helpers to refetch the "operations" data shown in nhập/xuất/kho views.
    function refreshSuppliers() {
      return syncApi("/suppliers").then(function (data) {
        setSuppliers(data.suppliers || []);
      }).catch(function () {});
    }
    function refreshPurchases() {
      return syncApi("/purchases?limit=100").then(function (data) {
        setPurchases(data.purchases || []);
      }).catch(function () {});
    }
    function refreshIssues() {
      return syncApi("/issues?limit=100").then(function (data) {
        setIssues(data.issues || []);
      }).catch(function () {});
    }
    function refreshMovements(productId) {
      var qs = productId ? ("?productId=" + encodeURIComponent(productId) + "&limit=200") : "?limit=200";
      return syncApi("/inventory/movements" + qs).then(function (data) {
        setMovements(data.movements || []);
      }).catch(function () {});
    }
    // Auto refresh when relevant views open.
    useEffect(function () {
      if (activeView === "dashboard") {
        refreshPurchases();
        if (window.ShopFlowSync && typeof window.ShopFlowSync.pull === "function") {
          // Dashboard must reconcile from the full server snapshot so payment
          // history cannot miss bills that were created on another device.
          window.ShopFlowSync.pull(0).catch(function () {});
        }
        return;
      }
      if (activeView !== "inventory") return;
      if (inventorySection === "stock_ops") {
        refreshSuppliers();
        refreshPurchases();
        refreshIssues();
      }
      if (inventorySection === "stock" && stockCheckTab === "ledger") { refreshMovements(); }
    }, [activeView, inventorySection, stockCheckTab]);

    // ---------- Debounced persistence of settings / templates to D1 ----------
    // We don't want to flood /api/settings with one request per keystroke,
    // so each watcher waits 800ms of idle before pushing.
    // The first render of the app shouldn't trigger a write either (we'd be
    // saving the defaults back over the server snapshot), so skip the first
    // pass with a ref. Each ref is also reset to false in handlePulled() so
    // server-driven state changes don't echo back as writes.
    useEffect(function () {
      if (!settingsDirtyRef.current) { settingsDirtyRef.current = true; return; }
      var t = window.setTimeout(function () {
        syncApi("/settings", {
          method: "POST",
          body: { key: "shop", value: settings }
        }).catch(function () { /* offline – will retry next change */ });
      }, 800);
      return function () { window.clearTimeout(t); };
    }, [settings]);

    var invoiceTemplatesDirtyRef = useRef(false);
    useEffect(function () {
      if (!invoiceTemplatesDirtyRef.current) { invoiceTemplatesDirtyRef.current = true; return; }
      var t = window.setTimeout(function () {
        syncApi("/settings", {
          method: "POST",
          body: {
            key: "invoice_templates",
            value: { templates: invoiceTemplates, selectedId: selectedInvoiceTemplateId }
          }
        }).catch(function () {});
      }, 800);
      return function () { window.clearTimeout(t); };
    }, [invoiceTemplates, selectedInvoiceTemplateId]);

    var barcodeTemplatesDirtyRef = useRef(false);
    useEffect(function () {
      if (!barcodeTemplatesDirtyRef.current) { barcodeTemplatesDirtyRef.current = true; return; }
      var t = window.setTimeout(function () {
        syncApi("/settings", {
          method: "POST",
          body: {
            key: "barcode_templates",
            value: { templates: barcodeTemplates, selectedId: selectedBarcodeTemplateId }
          }
        }).catch(function () {});
      }, 800);
      return function () { window.clearTimeout(t); };
    }, [barcodeTemplates, selectedBarcodeTemplateId]);

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
      if (settingsSection === "product") {
        setSettingsSection("general");
      }
    }, [settingsSection]);

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
      // Recipe entries are now { id, qty, unit, note } objects (legacy data
      // may still be plain strings — we accept both). Drop any entry whose
      // component no longer exists in the catalog.
      var raw = productDraft.componentIds || [];
      var validEntries = raw.filter(function (entry) {
        var componentId = (entry && typeof entry === "object") ? entry.id : entry;
        return components.some(function (component) { return component.id === componentId; });
      });

      if (validEntries.length !== raw.length) {
        setProductDraft(function (currentDraft) {
          return Object.assign({}, currentDraft, {
            componentIds: validEntries
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
      // Sort: level-1 parents first, then their children indented underneath.
      // This keeps the POS sidebar grouped — "Nhu yếu phẩm" at top of its
      // family, then snacks/beverages/pantry/etc indented one level.
      var ordered = [];
      var byParent = {};
      categories.forEach(function (c) {
        var pid = c.parentId || "_root";
        if (!byParent[pid]) byParent[pid] = [];
        byParent[pid].push(c);
      });
      function walk(parentId, depth) {
        (byParent[parentId] || []).forEach(function (c) {
          ordered.push(Object.assign({}, c, { _depth: depth }));
          walk(c.id, depth + 1);
        });
      }
      walk("_root", 0);
      return [FILTER_ALL_CATEGORY].concat(ordered);
    }, [categories]);

    // Recursive parent ↔ children category matching. Click "Nhu yếu phẩm"
    // (parent) → match products whose category is essentials OR any of its
    // children (snacks/beverages/pantry/personal-care/household/packaging).
    // Click a child directly → only that child.
    function categoryMatchesSelected(productCategoryId, selected, allCategories) {
      if (!selected || selected === "all") return true;
      if (productCategoryId === selected) return true;
      // If selected is a parent, walk children
      var cat = allCategories.find(function (c) { return c.id === productCategoryId; });
      while (cat && cat.parentId) {
        if (cat.parentId === selected) return true;
        cat = allCategories.find(function (c) { return c.id === cat.parentId; });
      }
      return false;
    }

    var filteredProducts = useMemo(function () {
      return products.filter(function (product) {
        var category = categories.find(function (item) {
          return item.id === product.category;
        });
        var matchesCategory = categoryMatchesSelected(product.category, selectedCategory, categories);
        var matchesSearch = !searchTerm || (product.name + " " + product.category + " " + (category ? category.label : "") + " " + product.description)
          .toLowerCase()
          .indexOf(searchTerm.toLowerCase()) !== -1;
        return matchesCategory && matchesSearch;
      });
    }, [products, categories, selectedCategory, searchTerm]);

    // ---------- Low-stock awareness ----------
    // A product is "low" when its on-hand qty is at or below the configured
    // min_stock. Products with min_stock === 0 are NOT low even at 0 — that's
    // the "I don't track this" sentinel.
    var lowStockProducts = useMemo(function () {
      return products.filter(function (p) {
        var qty = Number(p.stock) || 0;
        var min = Number(p.minStock) || 0;
        return min > 0 && qty <= min;
      });
    }, [products]);
    var lowStockComponents = useMemo(function () {
      return components.filter(function (component) {
        if (component.isUnlimitedStock) return false;
        var qty = Number(component.stockQty) || 0;
        var min = Number(component.minStock) || 0;
        return min > 0 && qty <= min && component.active !== false;
      });
    }, [components]);
    var lowStockAlerts = useMemo(function () {
      return lowStockProducts.map(function (product) {
        return {
          id: "product-" + product.id,
          type: "product",
          label: product.name,
          unit: product.unit || "",
          qty: Number(product.stock) || 0,
          min: Number(product.minStock) || 0,
          meta: product.barcode || product.id
        };
      }).concat(lowStockComponents.map(function (component) {
        return {
          id: "component-" + component.id,
          type: "component",
          label: L(component.label),
          unit: component.unit || "",
          qty: Number(component.stockQty) || 0,
          min: Number(component.minStock) || 0,
          meta: L(getComponentItemTypeLabel(component.itemType)) || component.id
        };
      }));
    }, [lowStockProducts, lowStockComponents, language]);
    var lowStockCount = lowStockAlerts.length;

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

    // Compute a [from, to] millisecond range from the user-chosen preset.
    function getDashboardRangeBounds() {
      var now = new Date();
      var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      var endOfDay = startOfToday + 24 * 60 * 60 * 1000 - 1;
      switch (dashboardRange) {
        case "today":
          return { from: startOfToday, to: endOfDay, label: "Hôm nay / Today" };
        case "week": {
          // Last 7 days including today
          var from = startOfToday - 6 * 24 * 60 * 60 * 1000;
          return { from: from, to: endOfDay, label: "7 ngày qua / Last 7 days" };
        }
        case "month": {
          var from = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          var to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
          return { from: from, to: to, label: "Tháng này / This month" };
        }
        case "year": {
          var from = new Date(now.getFullYear(), 0, 1).getTime();
          var to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
          return { from: from, to: to, label: "Năm nay / This year" };
        }
        case "custom": {
          var f = dashboardCustomFrom ? new Date(dashboardCustomFrom + "T00:00:00").getTime() : 0;
          var t = dashboardCustomTo
            ? new Date(dashboardCustomTo + "T23:59:59.999").getTime()
            : Date.now();
          return { from: f, to: t, label: "Tùy chọn / Custom" };
        }
        default:
          return { from: startOfToday, to: endOfDay, label: "Hôm nay / Today" };
      }
    }

    var dashboardMetrics = useMemo(function () {
      var range = getDashboardRangeBounds();
      var displaySales = (sales || []).map(normalizeSaleRecord).filter(function (sale) {
        return !isKnownTechnicalTestSale(sale);
      });
      var revenueSales = dedupeSalesByOrderId(displaySales);
      var salesInRange = displaySales.filter(function (sale) {
        var t = Number(sale.createdAt) || 0;
        return t >= range.from && t <= range.to;
      });
      var revenueSalesInRange = revenueSales.filter(function (sale) {
        var t = Number(sale.createdAt) || 0;
        return t >= range.from && t <= range.to;
      });
      var paidSalesInRange = revenueSalesInRange.filter(isSaleRevenueEligible);
      var rangeDuration = Math.max(1, (Number(range.to) || Date.now()) - (Number(range.from) || 0) + 1);
      var previousRange = {
        from: Math.max(0, (Number(range.from) || 0) - rangeDuration),
        to: Math.max(0, (Number(range.from) || 0) - 1)
      };
      var previousPaidSales = revenueSales.filter(function (sale) {
        var t = Number(sale.createdAt) || 0;
        return t >= previousRange.from && t <= previousRange.to && isSaleRevenueEligible(sale);
      });
      var revenue = paidSalesInRange.reduce(function (sum, sale) { return sum + (Number(sale.total) || 0); }, 0);
      var previousRevenue = previousPaidSales.reduce(function (sum, sale) { return sum + (Number(sale.total) || 0); }, 0);
      var ordersCount = paidSalesInRange.length;
      var previousOrdersCount = previousPaidSales.length;
      // Average ticket
      var avgTicket = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;
      var previousAvgTicket = previousOrdersCount > 0 ? Math.round(previousRevenue / previousOrdersCount) : 0;
      var lowStock = lowStockAlerts;
      function getDelta(current, previous) {
        if (!previous && !current) return 0;
        if (!previous) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 1000) / 10;
      }
      function getSeriesKey(timestamp) {
        var date = new Date(timestamp);
        if (dashboardRange === "year") {
          return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
        }
        if (dashboardRange === "month") {
          return String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth() + 1).padStart(2, "0");
        }
        return String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth() + 1).padStart(2, "0");
      }
      // Group by day for chart
      var byDay = {};
      paidSalesInRange.forEach(function (s) {
        var key = getSeriesKey(s.createdAt);
        if (!byDay[key]) byDay[key] = { day: key, revenue: 0, orders: 0, sort: Number(s.createdAt) || 0 };
        byDay[key].revenue += Number(s.total) || 0;
        byDay[key].orders += 1;
      });
      var daySeries = Object.keys(byDay).map(function (k) { return byDay[k]; }).sort(function (a, b) {
        return a.sort - b.sort;
      });
      var byPaymentMethod = {};
      paidSalesInRange.forEach(function (sale) {
        var method = normalizePaymentMethod(sale.paymentMethod || sale.payment_method);
        if (!byPaymentMethod[method]) {
          byPaymentMethod[method] = {
            method: method,
            label: getPaymentMethodLabel(method),
            orders: 0,
            revenue: 0
          };
        }
        byPaymentMethod[method].orders += 1;
        byPaymentMethod[method].revenue += Number(sale.total) || 0;
      });
      var paymentBreakdown = Object.values(byPaymentMethod).sort(function (a, b) {
        return b.revenue - a.revenue;
      }).map(function (item) {
        return Object.assign({}, item, {
          percent: revenue > 0 ? Math.round(item.revenue / revenue * 1000) / 10 : 0
        });
      });
      // Top selling products in range
      var byProduct = {};
      paidSalesInRange.forEach(function (s) {
        (s.items || []).forEach(function (it) {
          var key = it.productId || it.name;
          var product = products.find(function (p) { return p.id === it.productId; });
          if (!byProduct[key]) byProduct[key] = { name: it.name, qty: 0, revenue: 0, image: product && (product.imageIcon || product.image || product.imageUrl) };
          byProduct[key].qty += Number(it.qty) || 0;
          byProduct[key].revenue += (Number(it.qty) || 0) * (Number(it.price) || 0);
        });
      });
      var topProducts = Object.values(byProduct).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 6);
      var statusMap = {};
      function addStatus(id, label, tone, amount) {
        if (!statusMap[id]) {
          statusMap[id] = { id: id, label: label, tone: tone, orders: 0, revenue: 0 };
        }
        statusMap[id].orders += 1;
        statusMap[id].revenue += Number(amount) || 0;
      }
      paidSalesInRange.forEach(function (sale) {
        addStatus("completed", "Hoàn thành / Completed", "success", sale.total);
      });
      (orders || []).forEach(function (order) {
        var t = Number(order.createdAt) || Date.now();
        if (t < range.from || t > range.to) return;
        var status = getOrderWorkflowStatus(order);
        if (status === "completed") return;
        var label = status === "needs_action"
          ? "Cần xử lí / Needs Action"
          : status === "preparing"
            ? "Đang chuẩn bị / Preparing"
            : status === "held"
              ? "Tạm giữ / Held"
              : "Mới / New";
        var tone = status === "needs_action" ? "danger" : (status === "preparing" ? "warning" : "info");
        addStatus(status, label, tone, calculateOrder(order, addOns).total);
      });
      var statusBreakdown = Object.values(statusMap).sort(function (a, b) { return b.orders - a.orders; });
      var recentOrders = paidSalesInRange.map(function (sale) {
        return {
          id: sale.id,
          orderId: sale.orderId || sale.id,
          customerName: sale.customerName || sale.customer_name || L("Khách lẻ / Walk-in"),
          total: Number(sale.total) || 0,
          createdAt: Number(sale.createdAt) || 0,
          paymentMethod: normalizePaymentMethod(sale.paymentMethod || sale.payment_method),
          statusLabel: "Hoàn thành / Completed",
          statusTone: "success",
          sale: sale
        };
      }).concat((orders || []).filter(function (order) {
        var t = Number(order.createdAt) || Date.now();
        return t >= range.from && t <= range.to;
      }).map(function (order) {
        var status = getOrderWorkflowStatus(order);
        return {
          id: order.id,
          orderId: order.id,
          customerName: order.customerName || L("Khách lẻ / Walk-in"),
          total: calculateOrder(order, addOns).total,
          createdAt: Number(order.createdAt) || Date.now(),
          paymentMethod: normalizePaymentMethod(order.paymentMethod),
          statusLabel: "",
          statusTone: status === "needs_action" ? "danger" : (status === "preparing" || status === "held" ? "warning" : "info"),
          orderStatus: status,
          order: order
        };
      })).sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, 8);
      recentOrders = recentOrders.map(function (entry) {
        if (entry.statusLabel) return entry;
        var status = entry.orderStatus || "new";
        var label = status === "needs_action"
          ? "Cần xử lí / Needs Action"
          : status === "preparing"
            ? "Đang chuẩn bị / Preparing"
            : status === "held"
              ? "Tạm giữ / Held"
              : "Mới / New";
        return Object.assign({}, entry, { statusLabel: label });
      });
      var pendingPurchases = (purchases || []).filter(function (po) {
        return (po.verification_status || po.verificationStatus) === "pending_verification";
      });
      var pendingPurchaseTotal = pendingPurchases.reduce(function (sum, po) {
        return sum + (Number(po.total_amount || po.totalAmount) || 0);
      }, 0);

      return {
        range: range,
        revenue: revenue,
        ordersCount: ordersCount,
        ordersDelta: getDelta(ordersCount, previousOrdersCount),
        avgTicket: avgTicket,
        avgTicketDelta: getDelta(avgTicket, previousAvgTicket),
        revenueDelta: getDelta(revenue, previousRevenue),
        lowStock: lowStock,
        bestSellerCount: topProducts.length,
        statusBreakdown: statusBreakdown,
        daySeries: daySeries,
        paymentBreakdown: paymentBreakdown,
        topProducts: topProducts,
        pendingPurchases: pendingPurchases,
        pendingPurchaseTotal: pendingPurchaseTotal,
        recentOrders: recentOrders,
        recentSales: clone(salesInRange).sort(function (a, b) { return b.createdAt - a.createdAt; })
      };
    }, [products, sales, orders, purchases, addOns, dashboardRange, dashboardCustomFrom, dashboardCustomTo, lowStockAlerts]);

    var inventoryTabs = [
      { id: "stock", label: "Kiểm hàng tồn kho / Stock Check" },
      { id: "stock_ops", label: "Phiếu nhập / xuất / Stock In-Out" },
      { id: "components", label: "Thành phần / Components" },
      { id: "production", label: "Sơ chế / Production" },
      { id: "product", label: "Thêm sản phẩm / Add Product" },
      { id: "catalog", label: "Điều chỉnh, sửa / Adjust & Edit" }
    ];

    var functionDestinations = [
      { label: "Bán hàng / POS", help: "Quầy POS, scan mã, hoàn tất đơn / Counter checkout", view: "pos", keywords: "ban hang pos quay quet scan barcode thanh toan" },
      { label: "Tổng quan / Dashboard", help: "Doanh thu, lịch sử thanh toán / Revenue and sales history", view: "dashboard", keywords: "tong quan dashboard doanh thu lich su thanh toan bao cao" },
      { label: "Kiểm hàng tồn kho / Stock Check", help: "Sản phẩm, số tồn, in tem / Products, stock and barcode labels", view: "inventory", inventory: "stock", stockTab: "check", keywords: "kiem hang ton kho stock product san pham in tem" },
      { label: "Sổ cái kho / Stock Ledger", help: "Lịch sử chuyển động kho / Inventory movement ledger", view: "inventory", inventory: "stock", stockTab: "ledger", keywords: "so cai kho ledger movement chuyen dong" },
      { label: "Kiểm kê / Stocktake", help: "Ghi nhận số lượng thực tế / Count real stock", view: "inventory", inventory: "stock", stockTab: "stocktake", keywords: "kiem ke stocktake thuc te" },
      { label: "Phiếu nhập / Stock In", help: "Nhập sản phẩm hoặc thành phần / Receive product or component stock", view: "inventory", inventory: "stock_ops", stockOps: "in", keywords: "phieu nhap nhap hang stock in purchase nha cung cap" },
      { label: "Phiếu xuất / Stock Out", help: "Xuất hủy, mẫu, nội bộ / Issue damaged, sample or internal stock", view: "inventory", inventory: "stock_ops", stockOps: "out", keywords: "phieu xuat xuat hang stock out huy mau noi bo" },
      { label: "Thành phần / Components", help: "Thêm/sửa nguyên liệu, tồn thành phần / Edit ingredients and component stock", view: "inventory", inventory: "components", componentMode: "edit", keywords: "thanh phan component nguyen lieu ingredient them sua" },
      { label: "Chuyển thành phần / Convert Stock", help: "Chuyển hàng retail sang thành phần / Convert retail stock to component", view: "inventory", inventory: "components", componentMode: "convert", keywords: "chuyen thanh phan convert retail component" },
      { label: "Sơ chế / Production", help: "Công thức và mẻ bán thành phẩm / Prep recipes and batches", view: "inventory", inventory: "production", keywords: "so che production recipe cong thuc ban thanh pham" },
      { label: "Thêm sản phẩm / Add Product", help: "Tạo/sửa sản phẩm và công thức / Add products and BOM", view: "inventory", inventory: "product", keywords: "them san pham add product sua product barcode sku" },
      { label: "Điều chỉnh, sửa / Adjust & Edit", help: "Danh mục và add-ons / Categories and add-ons", view: "inventory", inventory: "catalog", keywords: "dieu chinh sua danh muc category addon add on" },
      { label: "Cài đặt chung / General Settings", help: "Thông tin cửa hàng / Shop details", view: "settings", settings: "general", keywords: "cai dat chung setting shop cua hang thong tin" },
      { label: "Mẫu hóa đơn / Invoice Templates", help: "Mẫu bill, VAT, FnB invoice / Receipt and VAT templates", view: "settings", settings: "invoice", keywords: "hoa don invoice bill vat mau template" },
      { label: "Mẫu tem mã vạch / Barcode Templates", help: "Tem barcode, khổ in 90x55 / Barcode label templates", view: "settings", settings: "barcode", keywords: "barcode ma vach tem label 90x55 in tem" },
      { label: "Xuất dữ liệu / Export Backup", help: "CSV/ZIP backup cho Google Sheets/database / Database export backup", view: "dashboard", keywords: "export backup data database csv zip google sheets" }
    ];

    var functionSearchResults = useMemo(function () {
      var query = normalizeSearchText(functionSearchTerm);
      if (!query) return [];
      return functionDestinations.filter(function (item) {
        return normalizeSearchText([item.label, item.help, item.keywords].join(" ")).indexOf(query) !== -1;
      }).slice(0, 7);
    }, [functionSearchTerm, language, inventorySection, settingsSection]);

    function openFunctionDestination(item) {
      if (!item) return;
      setActiveView(item.view);
      if (item.inventory) setInventorySection(item.inventory);
      if (item.stockTab) setStockCheckTab(item.stockTab);
      if (item.stockOps) setStockOpsMode(item.stockOps);
      if (item.componentMode) setComponentWorkspaceMode(item.componentMode);
      if (item.settings) setSettingsSection(item.settings);
      setFunctionSearchTerm("");
    }

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

          var nextOrder = updater(order);
          if (order.status === "needs_action" && nextOrder && nextOrder.status === "needs_action") {
            return nextOrder;
          }
          if (order.status === "needs_action" && nextOrder) {
            return Object.assign({}, nextOrder, {
              status: "open",
              syncError: "",
              syncRetryCount: 0
            });
          }
          return nextOrder;
        });
      });
    }

    function markOrderNeedsAction(orderId, message) {
      setOrders(function (currentOrders) {
        return currentOrders.map(function (order) {
          if (order.id !== orderId) return order;
          return Object.assign({}, order, {
            status: "needs_action",
            syncError: message || L("Không lưu được đơn hàng. / Could not save this order."),
            syncRetryCount: 1
          });
        });
      });
      setActiveOrderId(orderId);
      setActiveView("pos");
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

      handleProductAdd(matchedProduct);
      setBarcodeInput("");
      setScanMessage(L("Đã chọn sản phẩm từ barcode: / Selected product from barcode: ") + matchedProduct.name);
    }

    // Unified product-lookup handler used by the merged POS input.
    // Order of precedence:
    //   1. Exact barcode match (also handles ORIA-style SKU codes)
    //   2. Substring match on product name (case-insensitive)
    // If multiple name matches → add first, surface count in scanMessage.
    // If no match → leave input as-is so the catalog list can show partial hits.
    function handleUnifiedLookup(rawValue) {
      var value = String(rawValue || "").trim();
      if (!value) {
        setScanMessage(L("Nhập tên sản phẩm hoặc mã barcode. / Type a product name or barcode."));
        return false;
      }
      // 1. Try barcode / SKU / id exact match.
      var byCode = findProductByBarcode(value);
      if (!byCode) {
        var lc = value.toLowerCase();
        byCode = products.find(function (p) {
          return (p.id && p.id.toLowerCase() === lc)
              || (p.skuCode && String(p.skuCode).toLowerCase() === lc);
        }) || null;
      }
      if (byCode) {
        handleProductAdd(byCode);
        setBarcodeInput("");
        setScanMessage(L("Đã chọn / Selected") + ": " + byCode.name);
        return true;
      }
      // 2. Substring match on name.
      var lc2 = value.toLowerCase();
      var hits = products.filter(function (p) {
        return p.name && p.name.toLowerCase().indexOf(lc2) !== -1;
      });
      if (hits.length === 0) {
        setScanMessage(L("Không tìm thấy sản phẩm: ") + value + " / No product matched: " + value);
        return false;
      }
      handleProductAdd(hits[0]);
      setBarcodeInput("");
      setScanMessage(
        L("Đã chọn / Selected") + ": " + hits[0].name +
        (hits.length > 1 ? " (" + hits.length + " " + L("kết quả / matches") + ")" : "")
      );
      return true;
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

    function reserveServerOrderNumber(localOrderId) {
      if (!localOrderId || orderNumberReservationsRef.current[localOrderId]) {
        return Promise.resolve(null);
      }
      var currentOrder = orders.find(function (order) { return order.id === localOrderId; });
      if (isOrderNumberLocked(currentOrder)) {
        return Promise.resolve(null);
      }
      orderNumberReservationsRef.current[localOrderId] = true;
      return syncApi("/orders/next", { method: "POST", body: {} }).then(function (response) {
        if (!response || !response.orderId || !response.saleId) {
          throw new Error("Server did not return a reserved bill number");
        }
        setOrders(function (currentOrders) {
          return currentOrders.map(function (order) {
            if (order.id !== localOrderId) return order;
            if (isOrderNumberLocked(order)) return order;
            return Object.assign({}, order, {
              id: response.orderId,
              reservedSaleId: response.saleId,
              orderNumberSource: "server"
            });
          });
        });
        setActiveOrderId(function (currentId) {
          return currentId === localOrderId ? response.orderId : currentId;
        });
        delete orderNumberReservationsRef.current[localOrderId];
        return response;
      }).catch(function (error) {
        delete orderNumberReservationsRef.current[localOrderId];
        if (window && window.console) {
          window.console.warn("Could not reserve a shared bill number; checkout will allocate one.", error);
        }
        return null;
      });
    }

    function createNewOrder() {
      var createdOrderState = createOrder(orderSequenceByDate);
      var newOrder = createdOrderState.order;
      setOrderSequenceByDate(createdOrderState.nextSequenceByDate);
      setOrders(function (currentOrders) {
        return [newOrder].concat(currentOrders);
      });
      setActiveOrderId(newOrder.id);
      setPosOrderPicked(true);
      setCheckoutPanelOpen(false);
      setOrderStatusFilter("new");
      setActiveView("pos");
      reserveServerOrderNumber(newOrder.id);
    }

    function normalizeAddOnOption(option) {
      if (typeof option === "string") {
        return getAddonById(option, addOns) || { id: option, label: option, price: 0, group: "extras" };
      }
      var safeOption = option || {};
      var optionId = safeOption.id || safeOption.addOnId || safeOption.addon_id || "";
      var existing = optionId ? getAddonById(optionId, addOns) : null;
      return Object.assign({}, existing || {}, {
        id: optionId,
        label: safeOption.label || safeOption.name || (existing && existing.label) || optionId,
        price: Number(safeOption.price != null ? safeOption.price : (existing && existing.price)) || 0,
        group: safeOption.group || safeOption.groupKey || (existing && existing.group) || "extras"
      });
    }

    function getProductAddonOptions(product) {
      var productOptions = [];
      if (product && Array.isArray(product.addOns)) productOptions = product.addOns;
      if (product && Array.isArray(product.addons)) productOptions = product.addons;
      if (productOptions.length) {
        return productOptions.map(normalizeAddOnOption).filter(function (option) { return !!option.id; });
      }
      return (addOns || []).slice();
    }

    function shouldCustomizeProduct(product) {
      if (!product || !product.id) return false;
      if (product.inventoryMode === "recipe" || product.isMixedDrink) return true;
      return getProductAddonOptions(product).length > 0 && product.inventoryMode !== "stock";
    }

    function openProductCustomizer(product) {
      if (!product || !product.id) return;
      if (!posOrderPicked) {
        window.alert(L("Chọn một đơn trước khi thêm sản phẩm. / Pick an order before adding products."));
        return;
      }
      setProductCustomizer({
        product: product,
        addOnIds: [],
        note: ""
      });
    }

    function handleProductAdd(product) {
      if (shouldCustomizeProduct(product)) {
        openProductCustomizer(product);
        return;
      }
      addProductToOrder(product);
    }

    function toggleCustomizerAddon(addOnId) {
      setProductCustomizer(function (current) {
        if (!current) return current;
        var currentIds = current.addOnIds || [];
        var hasAddon = currentIds.indexOf(addOnId) !== -1;
        var nextIds;
        var addOn = getAddonById(addOnId, getProductAddonOptions(current.product)) || getAddonById(addOnId, addOns);

        if (addOn && addOn.group !== "extras") {
          nextIds = currentIds.filter(function (currentId) {
            var currentAddon = getAddonById(currentId, getProductAddonOptions(current.product)) || getAddonById(currentId, addOns);
            return !(currentAddon && currentAddon.group === addOn.group);
          });
        } else {
          nextIds = currentIds.slice();
        }

        if (!hasAddon) {
          nextIds.push(addOnId);
        } else {
          nextIds = nextIds.filter(function (currentId) {
            return currentId !== addOnId;
          });
        }

        return Object.assign({}, current, { addOnIds: nextIds });
      });
    }

    function addCustomizedProductToOrder() {
      if (!productCustomizer || !productCustomizer.product) return;
      var product = productCustomizer.product;
      var safeNote = String(productCustomizer.note || "").trim();
      var safeAddOnIds = (productCustomizer.addOnIds || []).slice();

      updateActiveOrder(function (order) {
        var newItem = {
          id: uid("item"),
          productId: product.id,
          barcode: getScannableBarcode(product.barcode, [product.id, product.name, product.category].join("|")),
          name: product.name,
          unit: product.unit || "",
          price: Number(product.price) || 0,
          qty: 1,
          addOnIds: safeAddOnIds,
          note: safeNote,
          discountType: "percent",
          discountValue: 0
        };

        return Object.assign({}, order, {
          status: order.status === "preparing" ? "preparing" : "open",
          items: (order.items || []).concat(newItem)
        });
      });

      setProductCustomizer(null);
    }

    function addProductToOrder(product) {
      if (!product || !product.id) return;
      if (!posOrderPicked) {
        window.alert(L("Chọn một đơn trước khi thêm sản phẩm. / Pick an order before adding products."));
        return;
      }
      updateActiveOrder(function (order) {
        var existingItem = (order.items || []).find(function (item) {
          return item.productId === product.id && (!item.addOnIds || item.addOnIds.length === 0);
        });

        if (existingItem) {
          return Object.assign({}, order, {
            status: order.status === "preparing" ? "preparing" : "open",
            items: order.items.map(function (item) {
              return item.id === existingItem.id
                // B6: Number() guards against string concat from stale state.
                ? Object.assign({}, item, { qty: (Number(item.qty) || 0) + 1 })
                : item;
            })
          });
        }

        var newItem = {
          id: uid("item"),
          productId: product.id,
          barcode: getScannableBarcode(product.barcode, [product.id, product.name, product.category].join("|")),
          name: product.name,
          unit: product.unit || "",
          price: Number(product.price) || 0,
          qty: 1,
          addOnIds: [],
          note: "",
          discountType: "percent",
          discountValue: 0
        };

        return Object.assign({}, order, {
          status: order.status === "preparing" ? "preparing" : "open",
          items: (order.items || []).concat(newItem)
        });
      });
    }

    function adjustItemQty(itemId, delta) {
      var deltaNum = Number(delta) || 0;
      updateActiveOrder(function (order) {
        var nextItems = (order.items || [])
          .map(function (item) {
            if (item.id !== itemId) {
              return item;
            }

            return Object.assign({}, item, { qty: (Number(item.qty) || 0) + deltaNum });
          })
          .filter(function (item) {
            return (Number(item.qty) || 0) > 0;
          });

        return Object.assign({}, order, { items: nextItems });
      });
    }

    // Direct qty edit (used by the new POS input box).
    function setItemQty(itemId, qty) {
      updateActiveOrder(function (order) {
        var nextItems = (order.items || [])
          .map(function (item) {
            var q = normalizeQtyForUnit(qty, getOrderItemUnit(item));
            return item.id === itemId ? Object.assign({}, item, { qty: q }) : item;
          })
          .filter(function (item) { return (Number(item.qty) || 0) > 0; });
        return Object.assign({}, order, { items: nextItems });
      });
    }

    // Note: barcode + name + SKU lookup is now consolidated into
    // handleUnifiedLookup() above. The separate findProductByQuery /
    // addProductByQuery helpers were removed when the two input forms were
    // merged into a single POS input.

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

    function updateItemDiscount(itemId, field, value) {
      updateActiveOrder(function (order) {
        return Object.assign({}, order, {
          items: (order.items || []).map(function (item) {
            if (item.id !== itemId) return item;
            var nextValue = field === "discountType"
              ? (value === "amount" ? "amount" : "percent")
              : Math.max(0, Number(value) || 0);
            return Object.assign({}, item, {
              discountType: field === "discountType" ? nextValue : (item.discountType || "percent"),
              discountValue: field === "discountValue" ? nextValue : (Number(item.discountValue) || 0)
            });
          })
        });
      });
    }

    function getOrderStockRequirements(items) {
      var quantitiesByProduct = {};
      var quantitiesByComponent = {};
      (items || []).forEach(function (item) {
        if (!item || !item.productId) return;
        var qty = Number(item.qty) || 0;
        if (qty <= 0) return;
        
        var product = products.find(function(p) { return p.id === item.productId; });
        if (product && product.isMixedDrink) {
          var recipeEntries = getRecipeEntries(product);
          if (recipeEntries.length > 0) {
            recipeEntries.forEach(function(entry) {
              var component = components.find(function (item) { return item.id === entry.id; });
              if (component && component.isUnlimitedStock) return;
              var compQty = getRecipeEntryStockQty(entry) || 1;
              quantitiesByComponent[entry.id] = (quantitiesByComponent[entry.id] || 0) + (compQty * qty);
            });
          }
        } else {
          quantitiesByProduct[item.productId] = (quantitiesByProduct[item.productId] || 0) + qty;
        }
      });
      return {
        products: quantitiesByProduct,
        components: quantitiesByComponent
      };
    }

    function orderHasRecipeItems(order) {
      return ((order && order.items) || []).some(function (item) {
        var product = products.find(function (currentProduct) {
          return currentProduct.id === item.productId;
        });
        return !!(product && product.isMixedDrink);
      });
    }

    function getOrderWorkflowStatus(order) {
      var status = order && order.status ? order.status : "open";
      if (status === "saving") return "preparing";
      if (status === "needs_action") return "needs_action";
      if (status === "held") return "held";
      if (status === "preparing") return "preparing";
      if (status === "ready") return "ready";
      if (status === "completed") return "completed";
      return "new";
    }

    function receiveActiveOrder() {
      if (!activeOrder || !activeOrder.items || !activeOrder.items.length) {
        window.alert(L("Chọn đơn có món trước khi nhận đơn. / Pick an order with items before accepting it."));
        return;
      }
      if (activeOrder.status === "needs_action" || activeOrder.status === "saving") return;

      var hasRecipeItems = orderHasRecipeItems(activeOrder);
      updateActiveOrder(function (order) {
        return Object.assign({}, order, {
          status: hasRecipeItems ? "preparing" : "ready",
          syncError: ""
        });
      });
      if (!hasRecipeItems) {
        setCheckoutPanelOpen(true);
      }
      pushToast(
        "info",
        hasRecipeItems
          ? L("Đã nhận đơn pha chế. / Preparation started.")
          : L("Đơn bán lẻ chuyển thẳng sang thanh toán. / Retail order moved to checkout.")
      );
    }

    function finishPreparingOrder() {
      if (!activeOrder || activeOrder.status !== "preparing") return;
      updateActiveOrder(function (order) {
        return Object.assign({}, order, { status: "ready" });
      });
      pushToast("success", L("Đơn đã chuẩn bị xong. / Order is ready."));
    }

    function holdOrder() {
      updateActiveOrder(function (order) {
        return Object.assign({}, order, { status: "held" });
      });
      createNewOrder();
    }

    // "Xóa" button behavior — three branches:
    //   1. Order has items → confirm, then clear items + reset state (keeps id).
    //   2. Order is empty + there ARE other open orders → DELETE this order
    //      from the list and switch active to a sibling.
    //   3. Order is empty + it's the ONLY one → NO-OP. We refuse to silently
    //      consume a sequence number by recreating it. The user should press
    //      "+ Đơn mới" if they actually want another order. This used to
    //      auto-create which made the visible order id jump (e.g. 001 → 002)
    //      with no items added — confusing.
    function cancelOrder() {
      var hasItems = (activeOrder.items || []).length > 0;

      if (hasItems) {
        if (!window.confirm(L("Xóa toàn bộ món trong đơn này? / Clear every item in this order?"))) {
          return;
        }
        updateActiveOrder(function (order) {
          return Object.assign({}, order, {
            items: [],
            discountAmount: 0,
            takeAway: false,
            status: "open",
            customerName: "Khách lẻ / Walk-in",
            paymentMethod: "",
            cashReceived: 0
          });
        });
        return;
      }

      // Order is empty.
      if (orders.length <= 1) {
        // Only one open order left — nothing useful to do. The UI also
        // hides the Xóa button in this state but we keep this guard so
        // hardware keyboard shortcuts can't trigger the regression.
        return;
      }

      // Multiple orders → remove the empty one and switch active.
      setOrders(function (currentOrders) {
        var remaining = currentOrders.filter(function (o) { return o.id !== activeOrder.id; });
        if (remaining.length === 0) return currentOrders; // safety net
        setActiveOrderId(remaining[0].id);
        return remaining;
      });
    }

    function buildSalePayload(orderSnapshot, saleTotals, saleClientOpId) {
      return {
        clientOpId: saleClientOpId,
        id: orderSnapshot.reservedSaleId || undefined,
        orderId: orderSnapshot.id,
        customerName: orderSnapshot.customerName || "",
        subtotal: saleTotals.subtotal,
        vatAmount: saleTotals.vat,
        discount: saleTotals.discount,
        total: saleTotals.total,
        paid: Number(orderSnapshot.cashReceived) || 0,
        changeAmount: Math.max(0, (Number(orderSnapshot.cashReceived) || 0) - (Number(saleTotals.total) || 0)),
        paymentMethod: normalizePaymentMethod(orderSnapshot.paymentMethod),
        cashierName: settings.cashierName || "",
        items: (orderSnapshot.items || []).map(function (item) {
          var addonTotal = getItemAddonTotal(item, addOns);
          var unitPrice = (Number(item.price) || 0) + addonTotal;
          var qty = Number(item.qty) || 0;
          var itemDiscount = getItemDiscountAmount(item, addOns);
          return {
            productId: item.productId,
            productName: item.name,
            qty: qty,
            unit: item.unit || "",
            unitPrice: unitPrice,
            addonsTotal: addonTotal,
            discountAmount: itemDiscount,
            lineTotal: Math.max(0, Math.round((unitPrice * qty) - itemDiscount)),
            note: item.note || "",
            addons: (item.addOnIds || []).map(function (id) {
              var a = getAddonById(id, addOns);
              return a ? { id: a.id, label: a.label, price: a.price } : { id: id };
            })
          };
        })
      };
    }

    function saveSaleWithOneRetry(payload) {
      return syncApi("/sales", {
        method: "POST",
        body: payload
      }).catch(function (firstError) {
        return syncApi("/sales", {
          method: "POST",
          body: payload
        }).catch(function (secondError) {
          secondError.firstError = firstError;
          throw secondError;
        });
      });
    }

    function payNow() {
      if (checkoutSaving) {
        return;
      }
      if (!activeOrder.items.length) {
        window.alert(L("Đơn hiện tại chưa có món. / This order is empty."));
        return;
      }
      if (!normalizePaymentMethod(activeOrder.paymentMethod)) {
        window.alert(L("Vui lòng chọn phương thức thanh toán trước khi hoàn tất bán hàng. / Please select a payment method before completing the sale."));
        setPaymentMenuOpen(true);
        return;
      }

      // Payment must be fully entered before a completed sale is recorded.
      var totalDue = Number(totals.total) || 0;
      var cashReceivedRaw = activeOrder.cashReceived;
      var hasPaymentAmount = cashReceivedRaw !== "" && cashReceivedRaw !== null && cashReceivedRaw !== undefined;
      var cashReceivedNumber = Number(cashReceivedRaw);
      if (totalDue > 0 && (!hasPaymentAmount || !Number.isFinite(cashReceivedNumber) || cashReceivedNumber <= 0)) {
        window.alert(L("Vui lòng nhập tiền khách đưa trước khi hoàn tất bán hàng. / Please enter the amount received before completing the sale."));
        return;
      }
      if (totalDue > 0 && cashReceivedNumber < totalDue) {
        var shortBy = totalDue - cashReceivedNumber;
        window.alert(
          L("Tiền khách đưa chưa đủ để thanh toán đơn hàng. / Amount received is less than the total payment.") +
          "\n" + L("Còn thiếu / Short by") + ": " + formatCurrency(shortBy)
        );
        return;
      }

      var stockRequirements = getOrderStockRequirements(activeOrder.items);
      var requiredQtyByProduct = stockRequirements.products;
      var requiredQtyByComponent = stockRequirements.components;
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
      var insufficientComponents = Object.keys(requiredQtyByComponent).map(function (componentId) {
        var component = components.find(function (currentComponent) {
          return currentComponent.id === componentId;
        });

        if (!component) {
          return {
            productId: componentId,
            name: componentId,
            available: 0,
            required: requiredQtyByComponent[componentId]
          };
        }

        var available = Math.max(0, Number(component.stockQty) || 0);
        var required = Math.max(0, Number(requiredQtyByComponent[componentId]) || 0);
        if (available >= required) {
          return null;
        }

        return {
          productId: componentId,
          name: L(component.label),
          available: available,
          required: required
        };
      }).filter(Boolean);
      var insufficientItems = insufficientProducts.concat(insufficientComponents);

      if (insufficientItems.length) {
        // Local stock can be stale when another device just verified stock-in.
        // Do not block held orders here; the server/Supabase stock guard below
        // is the source of truth and will reject only if inventory is truly short.
        if (window && window.console) {
          window.console.warn("Local stock looked short; server will verify before saving sale.", insufficientItems);
        }
      }

      var orderSnapshot = clone(activeOrder);
      var saleClientOpId = uid("sale-op");
      var salePayload = buildSalePayload(orderSnapshot, totals, saleClientOpId);

      setCheckoutSaving(true);
      setOrders(function (currentOrders) {
        return currentOrders.map(function (order) {
          return order.id === orderSnapshot.id
            ? Object.assign({}, order, { status: "saving", syncError: "", syncRetryCount: 0 })
            : order;
        });
      });

      saveSaleWithOneRetry(salePayload).then(function (response) {
        var serverId = response && response.id;
        if (!serverId) {
          throw new Error(L("Server chưa trả mã hóa đơn. / Server did not return a sale ID."));
        }

        var saleRecord = {
          id: serverId,
          orderId: response.orderId || canonicalOrderIdFromSaleId(serverId) || orderSnapshot.id,
          clientOpId: saleClientOpId,
          serverId: serverId,
          syncStatus: "synced",
          syncError: "",
          createdAt: Date.now(),
          items: orderSnapshot.items,
          total: Number(response.serverTotal) || totals.total,
          subtotal: Number(response.serverSubtotal) || totals.subtotal,
          vat: Number(response.serverVat) || totals.vat,
          discount: totals.discount,
          customerName: orderSnapshot.customerName || "",
          paymentMethod: normalizePaymentMethod(orderSnapshot.paymentMethod),
          cashReceived: Number(orderSnapshot.cashReceived) || 0,
          cashierName: settings.cashierName || "",
          paymentStatus: "paid",
          orderStatus: "completed",
          note: ""
        };

        setSales(function (currentSales) {
          return [normalizeSaleRecord(saleRecord)].concat(currentSales.filter(function (sale) {
            return sale.orderId !== orderSnapshot.id && sale.id !== serverId;
          }));
        });

        // Only decrement local stock after the server confirms the sale.
        var newlyLow = [];
        setProducts(function (currentProducts) {
          return currentProducts.map(function (product) {
            var soldQty = Number(requiredQtyByProduct[product.id]) || 0;
            if (!soldQty) return product;
            var oldQty = Number(product.stock) || 0;
            var newQty = Math.max(0, oldQty - soldQty);
            var min = Number(product.minStock) || 0;
            if (min > 0 && oldQty > min && newQty <= min) {
              newlyLow.push({ name: product.name, newQty: newQty, min: min });
            }
            return Object.assign({}, product, { stock: newQty });
          });
        });
        setComponents(function (currentComponents) {
          return currentComponents.map(function (component) {
            if (component.isUnlimitedStock) return component;
            var usedQty = Number(requiredQtyByComponent[component.id]) || 0;
            if (!usedQty) return component;
            var oldQty = Number(component.stockQty) || 0;
            var newQty = Math.max(0, oldQty - usedQty);
            var min = Number(component.minStock) || 0;
            if (min > 0 && oldQty > min && newQty <= min) {
              newlyLow.push({ name: L(component.label), newQty: newQty, min: min });
            }
            return Object.assign({}, component, { stockQty: newQty });
          });
        });

        if (newlyLow.length) {
          window.setTimeout(function () {
            window.alert(
              L("⚠ Cảnh báo tồn kho thấp / Low stock alert") + ":\n\n" +
              newlyLow.map(function (p) {
                return "• " + p.name + " — " + L("còn") + " " + p.newQty + " / " + L("min") + " " + p.min;
              }).join("\n") +
              "\n\n" + L("Vui lòng tạo phiếu nhập hàng sớm. / Please create a Purchase Order soon.")
            );
          }, 200);
        }

        setOrders(function (currentOrders) {
          var remaining = currentOrders.filter(function (order) {
            return order.id !== orderSnapshot.id;
          });
          if (!remaining.length) {
            var createdNextOrderState = createOrder(orderSequenceByDate);
            setOrderSequenceByDate(createdNextOrderState.nextSequenceByDate);
            return [createdNextOrderState.order];
          }
          return remaining;
        });
        setCheckoutPanelOpen(false);
        setPosOrderPicked(false);
        pushToast("success", L("Đã lưu hóa đơn / Sale saved"));
      }).catch(function (error) {
        var message = error && error.data && error.data.error
          ? error.data.error
          : (error && error.message ? error.message : L("Không lưu được đơn hàng. / Could not save this order."));
        if (error && error.data && error.data.code === "INSUFFICIENT_STOCK" && Array.isArray(error.data.insufficient)) {
          message = L("Không đủ tồn kho để hoàn tất đơn này. / Not enough stock to complete this sale.") +
            "\n" + error.data.insufficient.map(function (item) {
              return "- " + (item.name || item.productId) + " (" + item.available + "/" + item.required + ")";
            }).join("\n");
        }
        markOrderNeedsAction(orderSnapshot.id, message);
        pushToast("error", L("Đơn chưa được lưu. Cần xử lí trước khi hoàn tất. / Sale was not saved. Needs action before checkout."));
      }).finally(function () {
        setCheckoutSaving(false);
      });
    }

    // Open a popup, write the receipt HTML, wait for the logo image to
    // finish loading, then optionally auto-trigger window.print().
    //
    // Why this complexity? Two real-world bugs:
    //   1. popup.print() that runs immediately after document.write() fires
    //      BEFORE the logo image has downloaded — so prints come out with a
    //      broken-image icon.
    //   2. Some browsers (esp. Safari/iOS) silently kill `document.write`
    //      after `document.close()`. We close LAST.
    //
    // The injected HTML carries an inline <script> that waits for
    // window.onload (which fires only after images decode) and then either
    // calls print() or shows a "Đã sẵn sàng" hint depending on autoPrint.
    function openReceiptPopup(markup, autoPrint, errorLabel) {
      var popup = window.open("", "_blank", "width=720,height=840");
      if (!popup) {
        window.alert(L(errorLabel || "Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup. / Your browser blocked the print window. Please allow popups."));
        return null;
      }
      var autoScript = autoPrint
        ? "<script>window.addEventListener('load',function(){setTimeout(function(){window.focus();window.print();},150);});</script>"
        : "";
      popup.document.open();
      popup.document.write(markup + autoScript);
      popup.document.close();
      popup.focus();
      return popup;
    }

    function printWithTemplate(type) {
      if (!activeOrder.items.length) {
        window.alert(L("Đơn hiện tại chưa có món. / This order is empty."));
        return;
      }
      var markup = buildPrintMarkup(activeOrder, totals, settings, activeInvoiceTemplate, type, language, addOns);
      openReceiptPopup(markup, true, "Trình duyệt đang chặn cửa sổ in hóa đơn. Hãy cho phép popup. / Your browser blocked the print window. Please allow popups.");
    }

    function previewInvoice() {
      if (!activeOrder.items.length) {
        window.alert(L("Đơn hiện tại chưa có món. / This order is empty."));
        return;
      }
      var markup = buildPrintMarkup(activeOrder, totals, settings, activeInvoiceTemplate, "Xem trước hóa đơn / Preview Invoice", language, addOns);
      openReceiptPopup(markup, false, "Trình duyệt đang chặn cửa sổ xem trước hóa đơn. / Your browser blocked the invoice preview window.");
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
      var markup = buildPrintMarkup(sampleOrder, sampleTotals, settings, activeInvoiceTemplate, "Xem trước mẫu hóa đơn / Invoice Template Preview", language, addOns);
      openReceiptPopup(markup, false, "Trình duyệt đang chặn cửa sổ xem trước hóa đơn. / Your browser blocked the invoice preview window.");
    }

    // Reprint a historical sale.
    //
    // We accept either an in-memory sale object (from this device's `sales`
    // state) OR just an id — in the latter case we fetch it from /api/sales/:id
    // so reprint also works for sales that occurred on other devices.
    //
    // The print markup needs an "order"-shaped object so we map sale_items
    // back to order.items shape (productId, name, price, qty, addOnIds).
    function reprintSale(saleOrId, autoPrint) {
      var saleId = typeof saleOrId === "string" ? saleOrId : (saleOrId && saleOrId.id);
      if (!saleId) {
        window.alert(L("Không tìm thấy hóa đơn / Sale not found"));
        return;
      }

      function renderFrom(saleObj, items) {
        var order = {
          id: saleObj.orderId || saleObj.order_id || saleObj.id,
          createdAt: saleObj.createdAt || saleObj.created_at,
          customerName: saleObj.customerName || saleObj.customer_name || "",
          paymentMethod: normalizePaymentMethod(saleObj.paymentMethod || saleObj.payment_method),
          cashReceived: Number(saleObj.cashReceived || saleObj.paid || 0),
          items: (items || []).map(function (it) {
            // Re-decode addons stored as JSON; default to empty list
            var addonIds = [];
            try {
              var addons = it.addons_json ? JSON.parse(it.addons_json) : (it.addons || []);
              addonIds = (Array.isArray(addons) ? addons : []).map(function (a) { return a.id || a; });
            } catch (_) {}
            return {
              id: it.id || (it.product_id || "") + Math.random().toString(36).slice(2, 6),
              productId: it.product_id || it.productId,
              name: it.product_name || it.productName || it.name || "",
              price: Number(it.unit_price || it.unitPrice || it.price || 0)
                     - Number(it.addons_total || it.addonsTotal || 0),
              qty: Number(it.qty || 1),
              addOnIds: addonIds
            };
          })
        };
        var totals = {
          subtotal: Number(saleObj.subtotal) || 0,
          discount: Number(saleObj.discount) || 0,
          vat: Number(saleObj.vat_amount || saleObj.vat) || 0,
          total: Number(saleObj.total) || 0,
          itemCount: (items || []).reduce(function (s, it) { return s + (Number(it.qty) || 0); }, 0),
          vatRate: VAT_RATE
        };
        var label = "In lại / Reprint  HD: " + (saleObj.id || saleId);
        var markup = buildPrintMarkup(order, totals, settings, activeInvoiceTemplate, label, language, addOns);
        openReceiptPopup(markup, !!autoPrint, "Trình duyệt đang chặn cửa sổ in. / Print window blocked.");
      }

      // Prefer the in-memory sale (has full items if it was created on this
      // device). Otherwise fetch from D1.
      var local = sales.find(function (s) { return s.id === saleId; });
      if (local && Array.isArray(local.items) && local.items.length) {
        renderFrom(local, local.items);
        pushToast("info", L("Đã mở bản in / Reprint opened"));
        return;
      }

      syncApi("/sales/" + encodeURIComponent(saleId))
        .then(function (data) {
          if (!data || !data.sale) {
            window.alert(L("Không tìm thấy hóa đơn / Sale not found"));
            return;
          }
          renderFrom(data.sale, data.items || []);
          pushToast("info", L("Đã mở bản in / Reprint opened"));
        })
        .catch(function (err) {
          window.alert(L("Không tải được hóa đơn / Failed to load sale") +
            (err && err.message ? " (" + err.message + ")" : ""));
        });
    }

    function openCompletedSaleDetail(sale) {
      if (!sale) return;
      var normalized = normalizeSaleRecord(sale);
      var localItems = Array.isArray(normalized.items) ? normalized.items : [];
      setCompletedSaleDetail({
        loading: localItems.length === 0,
        sale: normalized,
        items: localItems,
        error: ""
      });
      if (localItems.length) return;

      var saleId = normalized.serverId || normalized.id;
      if (!saleId) {
        setCompletedSaleDetail({
          loading: false,
          sale: normalized,
          items: [],
          error: L("Không tìm thấy mã hóa đơn. / Sale ID is missing.")
        });
        return;
      }

      syncApi("/sales/" + encodeURIComponent(saleId))
        .then(function (data) {
          if (!data || !data.sale) throw new Error(L("Không tìm thấy hóa đơn. / Sale not found."));
          setCompletedSaleDetail({
            loading: false,
            sale: normalizeSaleRecord(data.sale),
            items: Array.isArray(data.items) ? data.items : [],
            error: ""
          });
        })
        .catch(function (error) {
          setCompletedSaleDetail({
            loading: false,
            sale: normalized,
            items: [],
            error: (error && error.message) || L("Không tải được chi tiết hóa đơn. / Failed to load sale detail.")
          });
        });
    }

    function getCompletedSaleItemAddons(item) {
      var rawAddons = item && (item.addons_json || item.addons || item.addOns);
      var parsed = [];
      try {
        parsed = typeof rawAddons === "string" ? JSON.parse(rawAddons) : (Array.isArray(rawAddons) ? rawAddons : []);
      } catch (_) {
        parsed = [];
      }
      if (!parsed.length && item && Array.isArray(item.addOnIds)) {
        parsed = item.addOnIds.map(function (id) {
          var addOn = getAddonById(id, addOns);
          return addOn || { id: id, label: id, price: 0 };
        });
      }
      return parsed.map(function (addOn) {
        if (typeof addOn === "string") {
          var matched = getAddonById(addOn, addOns);
          return matched || { id: addOn, label: addOn, price: 0 };
        }
        return addOn || {};
      });
    }

    function renderCompletedSaleDetailModal() {
      if (!completedSaleDetail) return null;
      var sale = completedSaleDetail.sale || {};
      var items = completedSaleDetail.items || [];
      return html`
        <div className="detail-modal-backdrop" role="presentation" onClick=${function () { setCompletedSaleDetail(null); }}>
          <section className="detail-modal surface completed-sale-modal" role="dialog" aria-modal="true" onClick=${function (event) { event.stopPropagation(); }}>
            <div className="detail-modal-head">
              <div>
                <p className="eyebrow">${L("Chi tiết đơn hoàn thành / Completed Order Detail")}</p>
                <h3 className="section-title">${sale.orderId || sale.order_id || sale.id}</h3>
                <small>${formatDateTime(sale.createdAt || sale.created_at)}</small>
              </div>
              <div className="row-actions">
                <button className="ghost-btn" onClick=${function () { reprintSale(sale, false); }}>${L("Xem hóa đơn / Preview Receipt")}</button>
                <button className="ghost-btn" onClick=${function () { setCompletedSaleDetail(null); }}>${L("Đóng / Close")}</button>
              </div>
            </div>

            ${completedSaleDetail.loading ? html`<div className="empty-state align-left">${L("Đang tải chi tiết... / Loading detail...")}</div>` : null}
            ${completedSaleDetail.error ? html`<div className="empty-state align-left danger-text">${completedSaleDetail.error}</div>` : null}

            ${!completedSaleDetail.loading ? html`
              <div className="detail-summary-grid completed-sale-summary">
                <div><span>${L("Khách hàng / Customer")}</span><strong>${sale.customerName || sale.customer_name || L("Khách lẻ / Walk-in")}</strong></div>
                <div><span>${L("Thanh toán / Payment")}</span><strong>${L(getPaymentMethodLabel(sale.paymentMethod || sale.payment_method))}</strong></div>
                <div><span>${L("Đã nhận / Paid")}</span><strong>${formatCurrency(sale.paid || sale.cashReceived || 0)}</strong></div>
                <div><span>${L("Tiền thừa / Change")}</span><strong>${formatCurrency(sale.changeAmount || sale.change_amount || 0)}</strong></div>
                <div><span>${L("Tạm tính / Subtotal")}</span><strong>${formatCurrency(sale.subtotal || 0)}</strong></div>
                <div><span>${L("Giảm giá / Discount")}</span><strong>${formatCurrency(sale.discount || 0)}</strong></div>
                <div><span>${L("VAT")}</span><strong>${formatCurrency(sale.vatAmount || sale.vat_amount || sale.vat || 0)}</strong></div>
                <div><span>${L("Tổng cộng / Total")}</span><strong>${formatCurrency(sale.total || 0)}</strong></div>
              </div>
              <div className="completed-sale-items">
                ${items.length ? items.map(function (item, index) {
                  var qty = Number(item.qty) || 0;
                  var addons = getCompletedSaleItemAddons(item);
                  var addonsTotal = Number(item.addons_total || item.addonsTotal) || addons.reduce(function (sum, addOn) {
                    return sum + (Number(addOn.price) || 0);
                  }, 0);
                  var unitPrice = item.unit_price != null
                    ? Number(item.unit_price) || 0
                    : item.unitPrice != null
                      ? Number(item.unitPrice) || 0
                      : (Number(item.price) || 0) + addonsTotal;
                  var lineTotal = Number(item.line_total || item.lineTotal) || (qty * unitPrice);
                  return html`
                    <article key=${item.id || index} className="completed-sale-item">
                      <div>
                        <strong>${index + 1}. ${item.product_name || item.productName || item.name || L("Không rõ món / Unknown item")}</strong>
                        <small>${addons.length ? addons.map(function (addOn) {
                          return (addOn.label || addOn.name || addOn.id || "") + (Number(addOn.price) ? " +" + formatCurrency(addOn.price) : "");
                        }).join(" · ") : L("Không có add-ons / No add-ons")}</small>
                      </div>
                      <div className="completed-sale-item-metric"><span>${L("SL / Qty")}</span><strong>${formatQuantity(qty, 3)}${item.unit ? " " + item.unit : ""}</strong></div>
                      <div className="completed-sale-item-metric"><span>${L("Đơn giá / Unit Price")}</span><strong>${formatCurrency(unitPrice)}</strong></div>
                      <div className="completed-sale-item-metric"><span>${L("Thành tiền / Amount")}</span><strong>${formatCurrency(lineTotal)}</strong></div>
                    </article>
                  `;
                }) : html`<div className="empty-state align-left">${L("Hóa đơn chưa có chi tiết món. / No item detail is available.")}</div>`}
              </div>
            ` : null}
          </section>
        </div>
      `;
    }

    function retrySaleFromHistory(sale) {
      if (!sale) return;
      var saleRecord = normalizeSaleRecord(sale);
      var retryItems = (saleRecord.items || []).map(function (it) {
        var addonIds = [];
        try {
          var addons = it.addons_json ? JSON.parse(it.addons_json) : (it.addons || it.addOns || []);
          addonIds = (Array.isArray(addons) ? addons : []).map(function (addon) {
            return addon && typeof addon === "object" ? (addon.id || addon.addOnId || "") : addon;
          }).filter(Boolean);
        } catch (_) {}
        var addonTotal = Number(it.addons_total || it.addonsTotal) || 0;
        return {
          id: it.id || uid("retry-item"),
          productId: it.productId || it.product_id || "",
          name: it.name || it.productName || it.product_name || "",
          price: Math.max(0, Number(it.price || it.unitPrice || it.unit_price) - addonTotal),
          qty: Number(it.qty) || 1,
          addOnIds: addonIds
        };
      }).filter(function (item) {
        return item.productId || item.name;
      });

      if (!retryItems.length) {
        window.alert(L("Không có món để thử lại đơn này. / This sale has no items to retry."));
        return;
      }

      var retryOrder = normalizeOrder({
        id: saleRecord.orderId || saleRecord.id,
        createdAt: saleRecord.createdAt || Date.now(),
        items: retryItems,
        customerName: saleRecord.customerName || "Khách lẻ / Walk-in",
        paymentMethod: normalizePaymentMethod(saleRecord.paymentMethod),
        cashReceived: Number(saleRecord.cashReceived || saleRecord.paid) || 0,
        discountAmount: Number(saleRecord.discount) || 0,
        status: "needs_action",
        syncError: saleRecord.syncError || L("Đơn cần xử lí. Kiểm tra lại rồi bấm Thử lại. / Needs action. Review then retry.")
      });

      setOrders(function (currentOrders) {
        var others = currentOrders.filter(function (order) {
          return order.id !== retryOrder.id;
        });
        return [retryOrder].concat(others);
      });
      setActiveOrderId(retryOrder.id);
      setActiveView("pos");
      pushToast("info", L("Đã đưa đơn về POS để thử lại / Moved sale back to POS for retry"));
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
            paymentMethod: normalizePaymentMethod(sale.paymentMethod),
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
            paymentMethod: normalizePaymentMethod(order.paymentMethod),
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
            category: component.itemType || "raw_material",
            unit: component.unit || "",
            cost_per_unit: Number(component.costPerUnit) || 0,
            stock_qty: Number(component.stockQty) || 0,
            min_stock: Number(component.minStock) || 0,
            is_unlimited_stock: toCsvBoolean(!!component.isUnlimitedStock),
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
        return rows.concat(getRecipeEntries(product).filter(function (entry) {
          return (!exportActiveOnly || (activeProductIds[product.id] && activeIngredientIds[entry.id]));
        }).map(function (entry) {
          var component = components.find(function (item) {
            return item.id === entry.id;
          }) || {};
          return {
            recipe_id: product.id + "-" + entry.id,
            product_id: product.id,
            ingredient_id: entry.id,
            qty_used: Number(entry.qty) || 1,
            unit: entry.unit || component.unit || "",
            waste_rate: normalizeWastePercent(entry.wastePercent) / 100,
            note: entry.note || component.note || "",
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
          method: normalizePaymentMethod(record.paymentMethod),
          amount: record.total,
          bank: normalizePaymentMethod(record.paymentMethod) === "bank_transfer" ? "Bank Transfer" : "",
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
          payment_method: normalizePaymentMethod(record.paymentMethod),
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

        var normalizedRecordPaymentMethod = normalizePaymentMethod(record.paymentMethod);
        if (normalizedRecordPaymentMethod === "cash") {
          dailySummaryMap[dateKey].cash_revenue += record.total;
        } else if (normalizedRecordPaymentMethod === "bank_transfer") {
          dailySummaryMap[dateKey].bank_transfer_revenue += record.total;
        } else if (normalizedRecordPaymentMethod === "card") {
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
        vatNote: "VAT invoice note",
        firebaseSyncEnabled: "Enable Firebase synchronization",
        firebaseApiKey: "Firebase web API key",
        firebaseAuthDomain: "Firebase auth domain",
        firebaseProjectId: "Firebase project id",
        firebaseStorageBucket: "Firebase storage bucket",
        firebaseMessagingSenderId: "Firebase messaging sender id",
        firebaseAppId: "Firebase app id",
        firebaseMeasurementId: "Firebase measurement id",
        firebaseSyncCollection: "Firestore collection for POS sync",
        firebaseSyncDocument: "Firestore document id for POS sync"
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

    function parseFirebaseFieldValue(value, fieldType) {
      if (value === undefined || value === null || value === "") {
        return fieldType === "boolean" ? false : null;
      }

      if (fieldType === "integer" || fieldType === "decimal") {
        return Number(value) || 0;
      }

      if (fieldType === "boolean") {
        if (typeof value === "boolean") {
          return value;
        }

        if (typeof value === "string") {
          return value.toUpperCase() === "TRUE";
        }

        return !!value;
      }

      return value;
    }

    function buildFirestoreDocsFromRows(tableSchema, rows) {
      var primaryKeyColumn = tableSchema.columns.find(function (column) {
        return column.primaryKey;
      });
      var fallbackPrefix = tableSchema.tableName + "-row";

      return (rows || []).map(function (row, index) {
        var documentId = primaryKeyColumn && row[primaryKeyColumn.name]
          ? String(row[primaryKeyColumn.name])
          : fallbackPrefix + "-" + padNumber(index + 1, 4);

        var documentData = tableSchema.columns.reduce(function (result, column) {
          result[column.name] = parseFirebaseFieldValue(row[column.name], column.type);
          return result;
        }, {});

        return buildFirebaseDoc(documentId, documentData);
      });
    }

    function buildFirebaseSeedPayload(tableNames) {
      var now = Date.now();
      var exportPayload = buildExportPayload(tableNames);
      var categoryLookup = {};
      var addOnLookup = {};
      var componentLookup = {};
      var productLookup = {};

      categories.forEach(function (category) {
        categoryLookup[category.id] = category;
      });
      addOns.forEach(function (addOn) {
        addOnLookup[addOn.id] = addOn;
      });
      components.forEach(function (component) {
        componentLookup[component.id] = component;
      });
      products.forEach(function (product) {
        productLookup[product.id] = product;
      });

      function getCategoryDoc(category) {
        var labelParts = splitBilingualLabel(category.label);
        return buildFirebaseDoc(category.id, {
          category_id: category.id,
          label: category.label,
          label_vi: labelParts.vi,
          label_en: labelParts.en,
          icon: category.icon || "",
          active: true
        });
      }

      function getAddOnDoc(addOn) {
        var labelParts = splitBilingualLabel(addOn.label);
        return buildFirebaseDoc(addOn.id, {
          add_on_id: addOn.id,
          label: addOn.label,
          label_vi: labelParts.vi,
          label_en: labelParts.en,
          price: Number(addOn.price) || 0,
          group: addOn.group || "extras",
          active: addOn.active !== false
        });
      }

      function getComponentDoc(component) {
        var labelParts = splitBilingualLabel(component.label);
        return buildFirebaseDoc(component.id, {
          component_id: component.id,
          label: component.label,
          label_vi: labelParts.vi,
          label_en: labelParts.en,
          unit: component.unit || "",
          note: component.note || "",
          stock_qty: Number(component.stockQty) || 0,
          min_stock: Number(component.minStock) || 0,
          is_unlimited_stock: !!component.isUnlimitedStock,
          active: component.active !== false
        });
      }

      function getProductDoc(product) {
        var category = categoryLookup[product.category] || {};
        var categoryLabelParts = splitBilingualLabel(category.label || "");
        return buildFirebaseDoc(product.id, {
          product_id: product.id,
          name: product.name || "",
          category_id: product.category || "",
          category_label: category.label || "",
          category_label_vi: categoryLabelParts.vi,
          category_label_en: categoryLabelParts.en,
          price: Number(product.price) || 0,
          stock: Number(product.stock) || 0,
          inventory_mode: getEffectiveInventoryMode(product, categories),
          barcode: normalizeBarcode(product.barcode || ""),
          image: product.image || "",
          description: product.description || "",
          component_ids: Array.isArray(product.componentIds) ? product.componentIds.slice() : [],
          active: product.active !== false,
          created_at: null,
          updated_at: null
        });
      }

      function getInvoiceTemplateDoc(template) {
        return buildFirebaseDoc(template.id, Object.assign({}, template, {
          selected: template.id === selectedInvoiceTemplateId
        }));
      }

      function getBarcodeTemplateDoc(template) {
        return buildFirebaseDoc(template.id, Object.assign({}, template, {
          selected: template.id === selectedBarcodeTemplateId
        }));
      }

      function serializeOrderItem(item) {
        var product = productLookup[item.productId] || {};
        return {
          id: item.id || "",
          product_id: item.productId || "",
          product_name: item.name || product.name || "",
          barcode: normalizeBarcode(item.barcode || product.barcode || ""),
          quantity: Number(item.qty) || 0,
          unit_price: Number(item.price) || 0,
          add_on_ids: Array.isArray(item.addOnIds) ? item.addOnIds.slice() : [],
          add_ons: (item.addOnIds || []).map(function (addOnId) {
            var addOn = addOnLookup[addOnId] || {};
            var labelParts = splitBilingualLabel(addOn.label || "");
            return {
              id: addOnId,
              label: addOn.label || "",
              label_vi: labelParts.vi,
              label_en: labelParts.en,
              price: Number(addOn.price) || 0,
              group: addOn.group || ""
            };
          }),
          note: item.note || ""
        };
      }

      function getOpenOrderDoc(order) {
        var totals = calculateOrder(order, addOns);
        return buildFirebaseDoc(order.id, {
          order_id: order.id,
          customer_name: order.customerName || "",
          payment_method: normalizePaymentMethod(order.paymentMethod),
          cash_received: Number(order.cashReceived) || 0,
          status: order.status || "open",
          created_at: formatExportDateTime(order.createdAt),
          subtotal: Number(totals.subtotal) || 0,
          discount_amount: Number(totals.discount) || 0,
          vat_amount: Number(totals.vat) || 0,
          total_amount: Number(totals.total) || 0,
          items: (order.items || []).map(serializeOrderItem)
        });
      }

      function getCompletedSaleDoc(sale, index) {
        return buildFirebaseDoc(sale.orderId || "sale-" + padNumber(index + 1, 4), {
          sale_id: sale.orderId || "sale-" + padNumber(index + 1, 4),
          order_id: sale.orderId || "",
          customer_name: sale.customerName || "",
          payment_method: normalizePaymentMethod(sale.paymentMethod),
          cash_received: Number(sale.cashReceived) || 0,
          cashier_name: sale.cashierName || "",
          subtotal: Number(sale.subtotal) || 0,
          discount_amount: Number(sale.discount) || 0,
          vat_amount: Number(sale.vat) || 0,
          total_amount: Number(sale.total) || 0,
          payment_status: sale.paymentStatus || "paid",
          order_status: sale.orderStatus || "completed",
          created_at: formatExportDateTime(sale.createdAt),
          items: (sale.items || []).map(serializeOrderItem)
        });
      }

      var appCollections = {
        app_config: [
          buildFirebaseDoc("store", Object.assign({}, settings, {
            selected_invoice_template_id: selectedInvoiceTemplateId,
            selected_barcode_template_id: selectedBarcodeTemplateId,
            default_language: language,
            app_version: APP_VERSION
          })),
          buildFirebaseDoc("runtime", {
            active_order_id: activeOrderId || "",
            order_sequence_by_date: Object.assign({}, orderSequenceByDate || {}),
            exported_at: formatExportDateTime(now),
            source_storage_key: STORAGE_KEY
          })
        ],
        categories: categories.map(getCategoryDoc),
        add_ons: addOns.map(getAddOnDoc),
        components: components
          .filter(function (component) {
            return !exportActiveOnly || component.active !== false;
          })
          .map(getComponentDoc),
        products: products
          .filter(function (product) {
            return !exportActiveOnly || product.active !== false;
          })
          .map(getProductDoc),
        invoice_templates: invoiceTemplates.map(getInvoiceTemplateDoc),
        barcode_templates: barcodeTemplates.map(getBarcodeTemplateDoc),
        open_orders: exportCompletedOrdersOnly
          ? []
          : orders.filter(function (order) {
              return matchesExportDateRange(order.createdAt, exportFilterMode === "date_range" ? exportStartDate : "", exportFilterMode === "date_range" ? exportEndDate : "");
            }).map(getOpenOrderDoc),
        completed_sales: sales.filter(function (sale) {
          return matchesExportDateRange(sale.createdAt, exportFilterMode === "date_range" ? exportStartDate : "", exportFilterMode === "date_range" ? exportEndDate : "");
        }).map(getCompletedSaleDoc)
      };

      var relationalCollections = {};
      var relationalTables = {};
      var relationalSchema = [];
      EXPORT_TABLE_SCHEMAS.forEach(function (tableSchema) {
        if (tableNames && tableNames.length && tableNames.indexOf(tableSchema.tableName) === -1) {
          return;
        }

        relationalTables[tableSchema.tableName] = exportPayload.rowsByTable[tableSchema.tableName] || [];
        relationalSchema.push((exportPayload.schema || []).find(function (schemaItem) {
          return schemaItem.table_name === tableSchema.tableName;
        }));
        relationalCollections[tableSchema.tableName] = buildFirestoreDocsFromRows(
          tableSchema,
          exportPayload.rowsByTable[tableSchema.tableName] || []
        );
      });

      var firestoreCollections = Object.assign({}, appCollections, relationalCollections);
      var realtimeDatabase = Object.keys(firestoreCollections).reduce(function (result, collectionName) {
        result[collectionName] = mapDocsById(firestoreCollections[collectionName]);
        return result;
      }, {});

      return {
        meta: {
          format: "firebase-seed-v1",
          exported_at: formatExportDateTime(now),
          app_version: APP_VERSION,
          source_storage_key: STORAGE_KEY,
          export_filters: {
            filter_mode: exportFilterMode,
            start_date: exportFilterMode === "date_range" ? (exportStartDate || null) : null,
            end_date: exportFilterMode === "date_range" ? (exportEndDate || null) : null,
            active_only: exportActiveOnly,
            completed_orders_only: exportCompletedOrdersOnly,
            selected_relational_tables: tableNames && tableNames.length ? tableNames.slice() : getExportTableNames()
          }
        },
        firestore: {
          collections: firestoreCollections
        },
        realtimeDatabase: realtimeDatabase,
        relationalTables: relationalTables,
        relationalSchema: relationalSchema.filter(Boolean),
        exportLog: exportPayload.exportLog
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

    function buildFirebaseSeedFileName() {
      var now = new Date();
      return "firebase_seed_" + [
        now.getFullYear(),
        padNumber(now.getMonth() + 1, 2),
        padNumber(now.getDate(), 2)
      ].join("-") + "_" + [
        padNumber(now.getHours(), 2),
        padNumber(now.getMinutes(), 2)
      ].join("-") + ".json";
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

    function exportFirebaseSeed(tableNames) {
      if (exportFilterMode === "date_range" && exportStartDate && exportEndDate && exportStartDate > exportEndDate) {
        window.alert(L("Khoảng ngày export chưa hợp lệ. / The export date range is invalid."));
        return;
      }

      setExportBusy(true);

      window.setTimeout(function () {
        try {
          var payload = buildFirebaseSeedPayload(tableNames);
          var jsonBlob = new window.Blob([
            JSON.stringify(payload, null, 2)
          ], { type: "application/json;charset=utf-8" });
          downloadBlob(jsonBlob, buildFirebaseSeedFileName());
        } catch (error) {
          window.alert(L("Không thể tạo file Firebase seed. / Failed to create the Firebase seed file."));
        } finally {
          setExportBusy(false);
        }
      }, 0);
    }

    function updateProductDraft(field, value) {
      setProductDraft(function (currentDraft) {
        var next = Object.assign({}, currentDraft, { [field]: value });
        // Auto-suggest ID khi user đang tạo SP MỚI và đổi category.
        // Chỉ chạy nếu chưa có ID + chưa từng gõ ID tay (customId trống/auto).
        if (field === "category" && !next.id && !next.idTouched) {
          var suggestion = suggestOriaIdForCategory(value);
          if (suggestion) {
            next.customId = suggestion;
            if (!next.skuTouched) next.skuCode = suggestion;
          }
        }
        if (field === "inventoryMode") next.inventoryModeTouched = true;
        // Đánh dấu user đã gõ tay customId → không auto override nữa
        if (field === "customId" && value) next.idTouched = true;
        return next;
      });
    }

    // Generate the next ORIA-style ID for a given category by looking at
    // existing products of that category and finding max suffix + 1.
    // Returns null if the category doesn't have a known ORIA prefix (e.g.
    // user added a custom category).
    function suggestOriaIdForCategory(categoryId) {
      // Map app slug -> ORIA 2-digit code (matches database/cloudflare/migrations/0004_oria_master.sql)
      var CAT_TO_CODE = {
        fruits: "10", smoothies: "20", juices: "30",
        "nutritious-drinks": "40", "refreshing-drinks": "50",
        essentials: "60",
        snacks: "61", beverages: "62", pantry: "63",
        "personal-care": "64", household: "65", packaging: "66",
      };
      var code = CAT_TO_CODE[categoryId];
      if (!code) return null;
      var prefix = "ORIA" + code;
      var maxNum = 0;
      products.forEach(function (p) {
        if (typeof p.id === "string" && p.id.indexOf(prefix) === 0) {
          var suffix = p.id.slice(prefix.length);
          var n = parseInt(suffix, 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      });
      var next = maxNum + 1;
      return prefix + String(next).padStart(3, "0");
    }

    function resetProductDraft() {
      // Seed the empty draft with an auto-suggested ID for the first
      // category so the user sees what's coming even before they touch
      // anything. They can clear or override.
      var firstCat = categories[0] ? categories[0].id : "";
      var suggested = suggestOriaIdForCategory(firstCat) || "";
      setProductDraft({
        id: null,
        customId: suggested,
        skuCode: suggested,
        skuTouched: false,
        idTouched: false,
        name: "",
        category: firstCat,
        inventoryMode: "",
        inventoryModeTouched: false,
        price: 0,
        stock: 0,
        barcode: "",
        image: "🍊",
        description: "",
        componentIds: [],
        minStock: 0,
        unit: ""
      });
    }

    // The recipe (BOM) for a product is stored as an array of entries shaped
    //   { id, qty, unit, wastePercent, note }
    // backed by the JSON `products.component_ids` column. We keep the legacy
    // name `componentIds` so the old toggle/printing code still works — each
    // entry's `id` matches `components.id`.
    //
    // recipeUpsert(productDraft, componentId, patch?)  →  upsert entry
    // recipeRemove(productDraft, componentId)         →  drop entry
    function recipeEntriesFromDraft(draft) {
      var raw = draft.componentIds;
      if (!Array.isArray(raw)) return [];
      return raw.map(function (it) {
        return normalizeRecipeEntry(it);
      });
    }
    function toggleProductDraftComponent(componentId) {
      setProductDraft(function (currentDraft) {
        var entries = recipeEntriesFromDraft(currentDraft);
        var idx = entries.findIndex(function (e) { return e.id === componentId; });
        if (idx === -1) {
          var comp = components.find(function (c) { return c.id === componentId; });
          entries.push({
            id: componentId,
            qty: 1,
            unit: comp ? (comp.unit || "") : "",
            wastePercent: 0,
            note: ""
          });
        } else {
          entries.splice(idx, 1);
        }
        return Object.assign({}, currentDraft, { componentIds: entries });
      });
    }
    function updateRecipeEntry(componentId, field, value) {
      setProductDraft(function (currentDraft) {
        var entries = recipeEntriesFromDraft(currentDraft).map(function (e) {
          if (e.id !== componentId) return e;
          var next = Object.assign({}, e);
          if (field === "qty") next.qty = Number(value) || 0;
          else if (field === "wastePercent") next.wastePercent = normalizeWastePercent(value);
          else next[field] = value;
          return next;
        });
        return Object.assign({}, currentDraft, { componentIds: entries });
      });
    }
    function isComponentInRecipe(draft, componentId) {
      return recipeEntriesFromDraft(draft).some(function (e) { return e.id === componentId; });
    }

    function updateCategoryDraft(field, value) {
      setCategoryDraft(function (currentDraft) {
        return Object.assign({}, currentDraft, { [field]: value });
      });
    }

    function resetCategoryDraft() {
      setCategoryDraft({
        id: null,
        code: "",
        labelVi: "",
        labelEn: "",
        icon: "🍊"
      });
    }

    function startEditCategory(category) {
      var labelParts = splitBilingualLabel(category.label);
      setCategoryDraft({
        id: category.id,
        code: category.code || "",
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

      var syncId;
      var syncIcon;

      if (categoryDraft.id) {
        syncId = categoryDraft.id;
        syncIcon = categoryDraft.icon;
        setCategories(function (currentCategories) {
          return currentCategories.map(function (category) {
            return category.id === categoryDraft.id
              ? Object.assign({}, category, {
                  label: label,
                  code: categoryDraft.code || category.code || "",
                  icon: categoryDraft.icon || category.icon || "🍊"
                })
              : category;
          });
        });
      } else {
        var baseId = slugify(categoryDraft.code || categoryDraft.labelEn || categoryDraft.labelVi || uid("category"));
        var nextId = baseId;

        while (categories.some(function (category) { return category.id === nextId; })) {
          nextId = baseId + "-" + Math.random().toString(36).slice(2, 5);
        }

        syncId = nextId;
        syncIcon = categoryDraft.icon || "🍊";
        setCategories(function (currentCategories) {
          return currentCategories.concat({
            id: nextId,
            code: categoryDraft.code || "",
            label: label,
            icon: categoryDraft.icon || "🍊"
          });
        });
      }

      // Sync to remote API
      syncEnqueue({
        endpoint: "/categories",
        method: "POST",
        opType: "category",
        body: { id: syncId, label: label, icon: syncIcon || "🍊", code: categoryDraft.code || "" }
      });

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

      // Sync soft-delete to remote API
      syncEnqueue({
        endpoint: "/categories",
        method: "DELETE",
        opType: "category",
        body: { id: categoryId }
      });
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

      var nextId = addOnDraft.id;
      if (!nextId) {
        var baseId = slugify(addOnDraft.labelEn || addOnDraft.labelVi || uid("addon"));
        nextId = baseId;
        while (addOns.some(function (addOn) { return addOn.id === nextId; })) {
          nextId = baseId + "-" + Math.random().toString(36).slice(2, 5);
        }
      }
      var payload = {
        id: nextId,
        label: label,
        price: Number(addOnDraft.price) || 0,
        group: addOnDraft.group || "extras"
      };

      syncApi("/addons", {
        method: "POST",
        body: payload
      }).catch(function () {
        syncEnqueue({
          endpoint: "/addons",
          method: "POST",
          opType: "addon",
          body: payload
        });
      });

      if (addOnDraft.id) {
        setAddOns(function (currentAddOns) {
          return currentAddOns.map(function (addOn) {
            return addOn.id === addOnDraft.id
              ? Object.assign({}, addOn, {
                  label: payload.label,
                  price: payload.price,
                  group: payload.group
                })
              : addOn;
          });
        });
      } else {
        setAddOns(function (currentAddOns) {
          return currentAddOns.concat(payload);
        });
      }

      resetAddOnDraft();
      pushToast("success", L("Đã lưu add-on. / Add-on saved."));
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
        note: "",
        itemType: "raw_material",
        costPerUnit: 0,
        stockQty: 0,
        minStock: 0,
        isUnlimitedStock: false
      });
    }

    function startEditComponent(component) {
      var labelParts = splitBilingualLabel(component.label);
      setComponentDraft({
        id: component.id,
        labelVi: labelParts.vi,
        labelEn: labelParts.en,
        unit: component.unit || "",
        note: component.note || "",
        itemType: normalizeComponentItemType(component.itemType),
        costPerUnit: Number(component.costPerUnit) || 0,
        stockQty: Number(component.stockQty) || 0,
        minStock: Number(component.minStock) || 0,
        isUnlimitedStock: !!component.isUnlimitedStock
      });
      setActiveView("inventory");
      setInventorySection("components");
      setComponentWorkspaceMode("edit");
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
                  note: componentDraft.note,
                  itemType: normalizeComponentItemType(componentDraft.itemType),
                  costPerUnit: Math.max(0, Math.round(Number(componentDraft.costPerUnit) || 0)),
                  stockQty: Math.max(0, Number(componentDraft.stockQty) || 0),
                  minStock: Math.max(0, Number(componentDraft.minStock) || 0),
                  isUnlimitedStock: !!componentDraft.isUnlimitedStock,
                  active: true
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
            note: componentDraft.note,
            itemType: normalizeComponentItemType(componentDraft.itemType),
            costPerUnit: Math.max(0, Math.round(Number(componentDraft.costPerUnit) || 0)),
            stockQty: Math.max(0, Number(componentDraft.stockQty) || 0),
            minStock: Math.max(0, Number(componentDraft.minStock) || 0),
            isUnlimitedStock: !!componentDraft.isUnlimitedStock,
            active: true
          });
        });

        syncEnqueue({
          endpoint: "/components",
          method: "POST",
          opType: "component",
          body: {
            id: nextId,
            label: label,
            unit: componentDraft.unit || "",
            note: componentDraft.note || "",
            itemType: normalizeComponentItemType(componentDraft.itemType),
            costPerUnit: Math.max(0, Math.round(Number(componentDraft.costPerUnit) || 0)),
            stockQty: Math.max(0, Number(componentDraft.stockQty) || 0),
            minStock: Math.max(0, Number(componentDraft.minStock) || 0),
            isUnlimitedStock: !!componentDraft.isUnlimitedStock
          }
        });
        resetComponentDraft();
        return;
      }

      syncEnqueue({
        endpoint: "/components",
        method: "POST",
        opType: "component",
        body: {
          id: componentDraft.id,
          label: label,
          unit: componentDraft.unit || "",
          note: componentDraft.note || "",
          itemType: normalizeComponentItemType(componentDraft.itemType),
          costPerUnit: Math.max(0, Math.round(Number(componentDraft.costPerUnit) || 0)),
          stockQty: Math.max(0, Number(componentDraft.stockQty) || 0),
          minStock: Math.max(0, Number(componentDraft.minStock) || 0),
          isUnlimitedStock: !!componentDraft.isUnlimitedStock
        }
      });

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
              var currentComponentId = typeof currentId === "string" ? currentId : currentId.id;
              return currentComponentId !== componentId;
            })
          });
        });
      });

      if (recipeEntriesFromDraft(productDraft).some(function (entry) { return entry.id === componentId; })) {
        setProductDraft(function (currentDraft) {
          return Object.assign({}, currentDraft, {
            componentIds: (currentDraft.componentIds || []).filter(function (currentId) {
              var currentComponentId = typeof currentId === "string" ? currentId : currentId.id;
              return currentComponentId !== componentId;
            })
          });
        });
      }

      if (componentDraft.id === componentId) {
        resetComponentDraft();
      }

      syncEnqueue({
        endpoint: "/components",
        method: "DELETE",
        opType: "component",
        body: { id: componentId }
      });
    }

    function resetProductionRecipeDraft() {
      setProductionRecipeDraft({
        id: null,
        name: "",
        outputComponentId: "",
        plannedOutputQty: 0,
        outputUnit: "",
        inputs: [],
        note: "",
        isActive: true
      });
    }

    function updateProductionRecipeDraft(field, value) {
      setProductionRecipeDraft(function (currentDraft) {
        var next = Object.assign({}, currentDraft, { [field]: value });
        if (field === "outputComponentId") {
          var output = components.find(function (component) { return component.id === value; });
          next.outputUnit = output ? output.unit || "" : "";
        }
        return next;
      });
    }

    function addProductionRecipeInput() {
      var firstInput = components.find(function (component) {
        return component.id !== productionRecipeDraft.outputComponentId;
      });
      if (!firstInput) {
        window.alert(L("Cần có ít nhất một thành phần input. / Add at least one input component first."));
        return;
      }
      setProductionRecipeDraft(function (currentDraft) {
        return Object.assign({}, currentDraft, {
          inputs: (currentDraft.inputs || []).concat([{
            componentId: firstInput.id,
            qty: 1,
            unit: firstInput.unit || ""
          }])
        });
      });
    }

    function updateProductionRecipeInput(index, field, value) {
      setProductionRecipeDraft(function (currentDraft) {
        var inputs = (currentDraft.inputs || []).map(function (input, currentIndex) {
          if (currentIndex !== index) return input;
          var nextInput = Object.assign({}, input, { [field]: field === "qty" ? Number(value) || 0 : value });
          if (field === "componentId") {
            var component = components.find(function (item) { return item.id === value; });
            nextInput.unit = component ? component.unit || "" : "";
          }
          return nextInput;
        });
        return Object.assign({}, currentDraft, { inputs: inputs });
      });
    }

    function removeProductionRecipeInput(index) {
      setProductionRecipeDraft(function (currentDraft) {
        return Object.assign({}, currentDraft, {
          inputs: (currentDraft.inputs || []).filter(function (_, currentIndex) { return currentIndex !== index; })
        });
      });
    }

    function startEditProductionRecipe(recipe) {
      setProductionRecipeDraft(normalizeProductionRecipe(recipe));
      setInventorySection("production");
    }

    function submitProductionRecipe(event) {
      event.preventDefault();
      var output = components.find(function (component) { return component.id === productionRecipeDraft.outputComponentId; });
      if (!productionRecipeDraft.name.trim()) {
        window.alert(L("Nhập tên công thức sơ chế. / Enter a production recipe name."));
        return;
      }
      if (!output || output.itemType !== "semi_finished") {
        window.alert(L("Output phải là thành phần loại Bán thành phẩm. / Output must be a Semi-finished component."));
        return;
      }
      if (!(Number(productionRecipeDraft.plannedOutputQty) > 0)) {
        window.alert(L("Sản lượng dự kiến phải lớn hơn 0. / Planned output must be greater than 0."));
        return;
      }
      if (!(productionRecipeDraft.inputs || []).length) {
        window.alert(L("Thêm ít nhất một input. / Add at least one input."));
        return;
      }
      var payload = {
        id: productionRecipeDraft.id || undefined,
        name: productionRecipeDraft.name.trim(),
        outputComponentId: output.id,
        plannedOutputQty: Number(productionRecipeDraft.plannedOutputQty) || 0,
        outputUnit: output.unit || productionRecipeDraft.outputUnit || "",
        inputs: (productionRecipeDraft.inputs || []).map(function (input) {
          var component = components.find(function (item) { return item.id === input.componentId; });
          return {
            componentId: input.componentId,
            qty: Number(input.qty) || 0,
            unit: component ? component.unit || "" : input.unit || ""
          };
        }),
        note: productionRecipeDraft.note || "",
        isActive: productionRecipeDraft.isActive !== false
      };
      fetch("/api/production-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.ok) throw new Error(data.error || "Cannot save production recipe");
          var saved = normalizeProductionRecipe(Object.assign({}, payload, { id: data.id, updatedAt: Date.now() }));
          setProductionRecipes(function (current) {
            var exists = current.some(function (recipe) { return recipe.id === saved.id; });
            return exists
              ? current.map(function (recipe) { return recipe.id === saved.id ? saved : recipe; })
              : current.concat([saved]);
          });
          resetProductionRecipeDraft();
          pushToast("success", L("Đã lưu công thức sơ chế. / Production recipe saved."));
        });
      }).catch(function (error) {
        window.alert(error && error.message ? error.message : L("Không thể lưu công thức. / Cannot save recipe."));
      });
    }

    function removeProductionRecipe(recipeId) {
      if (!window.confirm(L("Ẩn công thức sơ chế này? / Deactivate this production recipe?"))) return;
      fetch("/api/production-recipes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recipeId })
      }).then(function () {
        setProductionRecipes(function (current) {
          return current.filter(function (recipe) { return recipe.id !== recipeId; });
        });
      });
    }

    function updateProductionBatchDraft(field, value) {
      setProductionBatchDraft(function (currentDraft) {
        var next = Object.assign({}, currentDraft, { [field]: value });
        if (field === "recipeId") {
          var recipe = productionRecipes.find(function (item) { return item.id === value; });
          next.actualOutputQty = recipe ? recipe.plannedOutputQty : "";
        }
        return next;
      });
    }

    function toggleProductionBatchAddOn(addOnId) {
      setProductionBatchDraft(function (currentDraft) {
        var currentIds = Array.isArray(currentDraft.addOnIds) ? currentDraft.addOnIds : [];
        var exists = currentIds.indexOf(addOnId) !== -1;
        return Object.assign({}, currentDraft, {
          addOnIds: exists
            ? currentIds.filter(function (id) { return id !== addOnId; })
            : currentIds.concat([addOnId])
        });
      });
    }

    function submitProductionBatch(event) {
      event.preventDefault();
      var recipe = productionRecipes.find(function (item) { return item.id === productionBatchDraft.recipeId; });
      if (!recipe) {
        window.alert(L("Chọn công thức sơ chế trước. / Select a production recipe first."));
        return;
      }
      var actualOutputQty = Number(productionBatchDraft.actualOutputQty) || 0;
      if (actualOutputQty <= 0) {
        window.alert(L("Sản lượng thực tế phải lớn hơn 0. / Actual output must be greater than 0."));
        return;
      }
      var outputComponent = components.find(function (component) { return component.id === recipe.outputComponentId; });
      var nowForConfirmation = Date.now();
      var inputSummary = (recipe.inputs || []).map(function (input) {
        var component = components.find(function (item) { return item.id === input.componentId; });
        return "- " + (component ? L(component.label) : input.componentId) + ": " + input.qty + " " + input.unit;
      }).join("\n");
      var confirmMessage = [
        L("Xác nhận tạo mẻ sơ chế? / Confirm production batch?"),
        "",
        L("Thời gian / Time") + ": " + formatDateTime(nowForConfirmation),
        L("Công thức / Recipe") + ": " + recipe.name,
        L("Output / Output") + ": " + (outputComponent ? L(outputComponent.label) : recipe.outputComponentId) + " +" + actualOutputQty + " " + recipe.outputUnit,
        "",
        L("Inputs sẽ trừ / Inputs to deduct") + ":",
        inputSummary || L("Không có input / No inputs")
      ].join("\n");
      if (!window.confirm(confirmMessage)) return;
      fetch("/api/production-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productionRecipeId: recipe.id,
          actualOutputQuantity: actualOutputQty,
          addOnIds: [],
          note: productionBatchDraft.note || "",
          clientOpId: uid("op")
        })
      }).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data.ok) throw new Error(data.error || "Cannot produce batch");
          var outputComponentId = data.outputComponentId;
          var deducted = data.deductedInputs || [];
          setComponents(function (current) {
            return current.map(function (component) {
              var input = deducted.find(function (item) { return item.componentId === component.id; });
              if (input) {
                if (component.isUnlimitedStock || input.isUnlimitedStock) return component;
                return Object.assign({}, component, {
                  stockQty: Math.max(0, (Number(component.stockQty) || 0) - (Number(input.qty) || 0))
                });
              }
              if (component.id === outputComponentId) {
                return Object.assign({}, component, {
                  stockQty: (Number(component.stockQty) || 0) + actualOutputQty,
                  costPerUnit: Number(data.actualCostPerUnit) || Number(component.costPerUnit) || 0
                });
              }
              return component;
            });
          });
          var outputComponentForBatch = components.find(function (item) { return item.id === outputComponentId; });
          var batch = normalizeProductionBatch(Object.assign({}, data, {
            recipeId: recipe.id,
            recipeName: recipe.name,
            outputLabel: outputComponentForBatch ? outputComponentForBatch.label : outputComponentId,
            createdAt: data.createdAt || Date.now()
          }));
          setProductionBatches(function (current) { return [batch].concat(current).slice(0, 100); });
          setLastProductionResult(data);
          setProductionBatchDraft({ recipeId: recipe.id, actualOutputQty: recipe.plannedOutputQty, addOnIds: [], note: "" });
          pushToast("success", L("Đã tạo mẻ sơ chế. / Production batch completed."));
        });
      }).catch(function (error) {
        window.alert(error && error.message ? error.message : L("Không thể tạo mẻ sơ chế. / Cannot produce batch."));
      });
    }

    function updateConversionDraft(field, value) {
      setConversionDraft(function (currentDraft) {
        var next = Object.assign({}, currentDraft, { [field]: value });
        if (field === "componentMode" && value === "new") {
          next.componentId = "";
          next.componentUnit = currentDraft.componentUnit || "gram";
        }
        if (field === "componentMode" && value !== "new") {
          next.componentUnit = "";
        }
        return next;
      });
    }

    function getConvertibleProducts() {
      return products.filter(function (product) {
        return product.inventoryMode === "stock" && (Number(product.rawStock != null ? product.rawStock : product.stock) || 0) > 0;
      });
    }

    function getConversionProduct() {
      var candidates = getConvertibleProducts();
      var productId = conversionDraft.productId || (candidates[0] && candidates[0].id) || "";
      return candidates.find(function (product) { return product.id === productId; }) || null;
    }

    function getConversionComponent() {
      if (conversionDraft.componentMode === "new") return null;
      var componentId = conversionDraft.componentId || (components[0] && components[0].id) || "";
      return components.find(function (component) { return component.id === componentId; }) || null;
    }

    function resetConversionDraft(keepTarget) {
      setConversionDraft(function (currentDraft) {
        return {
          productId: keepTarget ? currentDraft.productId : "",
          productQty: 1,
          componentMode: currentDraft.componentMode || "existing",
          componentId: keepTarget ? currentDraft.componentId : "",
          componentLabelVi: "",
          componentLabelEn: "",
          componentUnit: currentDraft.componentMode === "new" ? (currentDraft.componentUnit || "gram") : "",
          componentQty: "",
          expiryDays: 1,
          note: ""
        };
      });
    }

    function submitStockConversion(event) {
      event.preventDefault();
      var sourceProduct = getConversionProduct();
      if (!sourceProduct) {
        window.alert(L("Chọn sản phẩm retail còn tồn để chuyển. / Select an in-stock retail product to convert."));
        return;
      }

      var productQty = Math.max(0, Number(conversionDraft.productQty) || 0);
      if (productQty <= 0) {
        window.alert(L("Nhập số lượng sản phẩm cần chuyển. / Enter product quantity to convert."));
        return;
      }
      var currentStock = Number(sourceProduct.rawStock != null ? sourceProduct.rawStock : sourceProduct.stock) || 0;
      if (productQty > currentStock) {
        window.alert(L("Số lượng chuyển lớn hơn tồn hiện tại. / Convert quantity is higher than current stock."));
        return;
      }

      var componentId = "";
      var componentLabel = "";
      var componentUnit = conversionDraft.componentUnit || "";
      var existingComponent = null;
      if (conversionDraft.componentMode === "new") {
        componentLabel = buildBilingualLabel(conversionDraft.componentLabelVi, conversionDraft.componentLabelEn);
        if (!componentLabel.trim()) {
          window.alert(L("Nhập tên thành phần mới. / Enter the new component name."));
          return;
        }
        var baseId = slugify(conversionDraft.componentLabelEn || conversionDraft.componentLabelVi || uid("component"));
        componentId = baseId;
        var suffix = 1;
        while (components.some(function (component) { return component.id === componentId; })) {
          componentId = baseId + "-" + suffix;
          suffix += 1;
        }
      } else {
        existingComponent = getConversionComponent();
        if (!existingComponent) {
          window.alert(L("Chọn thành phần nhận tồn. / Select a target component."));
          return;
        }
        componentId = existingComponent.id;
        componentLabel = existingComponent.label;
        componentUnit = existingComponent.unit || componentUnit;
      }

      var componentQty = Math.max(0, Number(conversionDraft.componentQty) || productQty);
      if (componentQty <= 0) {
        window.alert(L("Nhập lượng thành phần nhận được. / Enter received component quantity."));
        return;
      }

      var expiryDays = Math.max(0, Number(conversionDraft.expiryDays) || 0);
      var expiryNote = expiryDays
        ? (expiryDays + " " + L("ngày dùng sau chuyển đổi / days usable after conversion"))
        : L("Dùng trong ngày / Same-day use");
      var note = [
        L("Chuyển từ thành phẩm retail sang nguyên liệu / Converted from retail product"),
        conversionDraft.note || "",
        expiryNote
      ].filter(Boolean).join(" · ");
      var nextProductStock = Math.max(0, currentStock - productQty);

      setProducts(function (currentProducts) {
        return currentProducts.map(function (product) {
          return product.id === sourceProduct.id
            ? Object.assign({}, product, { stock: nextProductStock, rawStock: nextProductStock })
            : product;
        });
      });

      setComponents(function (currentComponents) {
        var found = false;
        var updated = currentComponents.map(function (component) {
          if (component.id !== componentId) return component;
          found = true;
          if (component.isUnlimitedStock) {
            return Object.assign({}, component, {
              unit: component.unit || componentUnit,
              note: component.note || note,
              active: true
            });
          }
          return Object.assign({}, component, {
            stockQty: (Number(component.stockQty) || 0) + componentQty,
            unit: component.unit || componentUnit,
            note: component.note || note,
            active: true
          });
        });
        if (!found) {
          updated.push({
            id: componentId,
            label: componentLabel,
            unit: componentUnit,
            note: note,
            stockQty: componentQty,
            minStock: 0,
            isUnlimitedStock: false,
            active: true
          });
        }
        return updated;
      });

      syncEnqueue({
        endpoint: "/inventory/convert",
        method: "POST",
        opType: "inventory-convert",
        body: {
          productId: sourceProduct.id,
          productQty: productQty,
          componentId: componentId,
          componentLabel: componentLabel,
          componentUnit: componentUnit,
          componentQty: componentQty,
          expiryNote: expiryNote,
          note: conversionDraft.note || "",
          reason: "Retail to component conversion"
        }
      });

      pushToast("success", L("Đã chuyển tồn sang thành phần / Stock converted to component"));
      resetConversionDraft(true);
    }

    function submitProduct(event) {
      event.preventDefault();

      if (!productDraft.name.trim()) {
        window.alert(L("Nhập tên sản phẩm trước khi lưu. / Enter a product name before saving."));
        return;
      }
      var selectedInventoryMode = productDraft.inventoryMode === "recipe" || productDraft.inventoryMode === "stock"
        ? productDraft.inventoryMode
        : "";
      if (!selectedInventoryMode) {
        window.alert(L("Chọn loại hàng trước khi lưu: Hàng bán lẻ hoặc Đồ pha chế. / Choose a product type before saving: Direct Stock or Recipe."));
        return;
      }
      var draftCategory = categories.find(function (category) {
        return category.id === productDraft.category;
      });
      var productImageValue = String(productDraft.image || "").trim() || (draftCategory && draftCategory.icon) || "🛒";

      // Validate any user-typed ID — both for new products AND when
      // editing existing (rename).
      var typedId = (productDraft.customId || "").trim().toUpperCase();
      if (typedId) {
        if (!/^[A-Z0-9_-]{2,40}$/.test(typedId)) {
          window.alert(L("Mã SP chỉ chứa A-Z 0-9 _ -  (2-40 ký tự). / ID may contain A-Z 0-9 _ - (2-40 chars)."));
          return;
        }
        // Collision check — exclude ourselves when editing.
        var clash = products.find(function (p) {
          return p.id === typedId && p.id !== productDraft.id;
        });
        if (clash) {
          window.alert(
            L("Mã SP đã tồn tại / Product ID already exists: ") + typedId + " — " + clash.name
          );
          return;
        }
      }

      // If editing an existing SP AND the user changed the ID, fire a rename
      // BEFORE doing the field upsert so foreign keys cascade.
      var renamedFromOldId = null;
      if (productDraft.id && typedId && typedId !== productDraft.id) {
        renamedFromOldId = productDraft.id;
        var newId = typedId;
        // Optimistically rewrite local state's id so the form's "current ID"
        // hint and the upsert below all reference the new value.
        setProducts(function (currentProducts) {
          return currentProducts.map(function (p) {
            return p.id === renamedFromOldId ? Object.assign({}, p, { id: newId, skuCode: newId }) : p;
          });
        });
        setOrders(function (currentOrders) {
          return currentOrders.map(function (order) {
            return Object.assign({}, order, {
              items: (order.items || []).map(function (item) {
                return item.productId === renamedFromOldId
                  ? Object.assign({}, item, { productId: newId })
                  : item;
              })
            });
          });
        });
        setProductDraft(function (d) {
          return Object.assign({}, d, { id: newId, customId: newId, skuCode: d.skuCode || newId });
        });
        // Send the rename to the server (cascades FK on D1 side).
        syncEnqueue({
          endpoint: "/products/rename",
          method: "POST",
          opType: "product-rename",
          body: { oldId: renamedFromOldId, newId: newId }
        });
      }

      // The "current" ID for downstream lookups:
      //   • if we just renamed → use the new typed id
      //   • else editing existing → original id
      //   • else creating new → typed id (or auto later)
      var effectiveId = renamedFromOldId ? typedId : (productDraft.id || typedId);

      if (productDraft.id) {
        setProducts(function (currentProducts) {
          return currentProducts.map(function (product) {
            return product.id === effectiveId
              ? Object.assign({}, product, {
                  name: productDraft.name,
                  category: productDraft.category,
                  inventoryMode: selectedInventoryMode,
                  price: Number(productDraft.price) || 0,
                  stock: selectedInventoryMode === "recipe" ? 0 : (Number(productDraft.stock) || 0),
                  barcode: getScannableBarcode(
                    productDraft.barcode || product.barcode,
                    [effectiveId, productDraft.name, productDraft.category].join("|")
                  ),
                  image: productImageValue,
                  description: productDraft.description,
                  componentIds: productDraft.componentIds || [],
                  minStock: Math.max(0, Number(productDraft.minStock) || 0),
                  unit: productDraft.unit || "",
                  skuCode: (productDraft.skuCode || effectiveId || "").toUpperCase()
                })
              : product;
          });
        });

        setOrders(function (currentOrders) {
          return currentOrders.map(function (order) {
            return Object.assign({}, order, {
              items: (order.items || []).map(function (item) {
                return item.productId === effectiveId
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
        // Honour the user-provided custom ID if any, else fall back to auto.
        var newId = (productDraft.customId || "").trim().toUpperCase() || uid("product");
        // SKU defaults to ID, but if user explicitly set a different SKU, use it.
        var newSku = (productDraft.skuCode || newId || "").toUpperCase();
        var newProduct = {
          id: newId,
          name: productDraft.name,
          category: productDraft.category,
          inventoryMode: selectedInventoryMode,
          price: Number(productDraft.price) || 0,
          stock: selectedInventoryMode === "recipe" ? 0 : (Number(productDraft.stock) || 0),
          barcode: getScannableBarcode(
            productDraft.barcode,
            [newId, productDraft.name, productDraft.category, productDraft.price, productDraft.stock, Date.now()].join("|")
          ),
          image: productImageValue,
          description: productDraft.description,
          componentIds: productDraft.componentIds || [],
          minStock: Math.max(0, Number(productDraft.minStock) || 0),
          unit: productDraft.unit || "",
          skuCode: newSku
        };

        setProducts(function (currentProducts) {
          return [newProduct].concat(currentProducts);
        });
        setSelectedBarcodeProductId(newProduct.id);
      }

      // Push product upsert to D1 (non-blocking).
      var saved = effectiveId
        ? products.find(function (p) { return p.id === effectiveId; })
        : null;
      // Resolve the actual ID used:
      //   • Just renamed → new typed ID
      //   • Editing existing without rename → original id
      //   • Creating new → typed or auto
      var productId = effectiveId
        || (typeof newProduct !== "undefined" ? newProduct.id : ("p-" + Math.random().toString(36).slice(2, 10)));
      var newStockValue = selectedInventoryMode === "recipe" ? 0 : Math.max(0, Number(productDraft.stock) || 0);
      var oldStockValue = saved ? Number(saved.rawStock != null ? saved.rawStock : saved.stock) || 0 : 0;

      var payload = {
        id: productId,
        name: productDraft.name,
        category: productDraft.category,
        inventoryMode: selectedInventoryMode,
        price: Number(productDraft.price) || 0,
        barcode: productDraft.barcode || "",
        image: productImageValue,
        description: productDraft.description || "",
        componentIds: productDraft.componentIds || [],
        minStock: Math.max(0, Number(productDraft.minStock) || 0),
        unit: productDraft.unit || "",
        skuCode: (productDraft.skuCode || productId || "").toUpperCase()
      };
      syncEnqueue({ endpoint: "/products", method: "POST", opType: "product", body: payload });

      // ⚠ /api/products ONLY updates the products table — it does NOT touch
      // inventory.qty_on_hand. If the user changed the Stock field in the
      // form we must ALSO enqueue a /inventory/adjust so the on-hand qty
      // actually persists to D1. Without this, toast says "Saved" but F5
      // shows the old stock value.
      if (selectedInventoryMode === "stock" && newStockValue !== oldStockValue) {
        // Track via pendingStockEdits so handlePulled guards against the
        // pull-race the same way inline edits do.
        try {
          var pendingKey = "shopflow-pending-stock-edits";
          var pending = JSON.parse(window.localStorage.getItem(pendingKey) || "{}");
          pending[productId] = { newQty: newStockValue, at: Date.now() };
          window.localStorage.setItem(pendingKey, JSON.stringify(pending));
        } catch (_) {}
        syncEnqueue({
          endpoint: "/inventory/adjust",
          method: "POST",
          opType: "adjust",
          body: {
            productId: productId,
            newQty: newStockValue,
            reason: "Cap nhat tu Form sua SP"
          }
        });
      } else if (selectedInventoryMode === "recipe") {
        try {
          var pendingKey = "shopflow-pending-stock-edits";
          var pending = JSON.parse(window.localStorage.getItem(pendingKey) || "{}");
          if (pending[productId]) {
            delete pending[productId];
            window.localStorage.setItem(pendingKey, JSON.stringify(pending));
          }
        } catch (_) {}
      }

      resetProductDraft();
    }

    function startEditProduct(product) {
      setProductDraft({
        id: product.id,
        customId: product.id,
        skuCode: product.skuCode || product.id,
        skuTouched: true,   // editing an existing one — never auto-overwrite SKU
        inventoryModeTouched: true,
        name: product.name,
        category: product.category,
        inventoryMode: getEffectiveInventoryMode(product, categories),
        price: product.price,
        stock: product.rawStock != null ? product.rawStock : product.stock,
        barcode: product.barcode,
        image: product.image,
        description: product.description || "",
        componentIds: product.componentIds || [],
        minStock: Number(product.minStock) || 0,
        unit: product.unit || ""
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

      // Soft-delete in D1.
      if (window.ShopFlowSync && window.ShopFlowSync.api) {
        window.ShopFlowSync.api("/products/" + encodeURIComponent(productId), { method: "DELETE" })
          .catch(function () { /* offline -> ignore */ });
      }
    }

    // updateProductStock — inline stock editor with race-free persistence.
    //
    // Earlier we debounced the API call by 700ms. That caused F5-during-typing
    // to lose the edit: the timer was cancelled, no API call was sent, and
    // when the page reloaded the next /sync/pull would overwrite the optimistic
    // local value with stale server data.
    //
    // Fix: persist the pending edit to localStorage IMMEDIATELY. Then:
    //   • debounce the actual /inventory/adjust API call (~500ms) so the
    //     ledger doesn't fill with one ADJUST row per keystroke
    //   • on every app boot, drain the pending-edits store into the outbox
    //   • on beforeunload (page refresh / close), enqueue any in-flight
    //     timers right away
    //
    // The "pendingStockEdits" store survives F5 because it's localStorage,
    // and the outbox (also localStorage) survives offline too, so even if
    // the user is offline + F5s, the edit reaches D1 on next online session.
    function updateProductStock(productId, nextStock) {
      var targetProduct = products.find(function (product) { return product.id === productId; });
      if (targetProduct && targetProduct.inventoryMode !== "stock") {
        return;
      }
      var target = normalizeQtyForUnit(nextStock, targetProduct ? targetProduct.unit : "");

      // 1. Optimistic local UI update.
      setProducts(function (currentProducts) {
        return currentProducts.map(function (product) {
          return product.id === productId
            ? Object.assign({}, product, { stock: target })
            : product;
        });
      });

      // 2. Stash the pending edit so a page-reload mid-debounce doesn't lose it.
      try {
        var pendingKey = "shopflow-pending-stock-edits";
        var pending = JSON.parse(window.localStorage.getItem(pendingKey) || "{}");
        pending[productId] = { newQty: target, at: Date.now() };
        window.localStorage.setItem(pendingKey, JSON.stringify(pending));
      } catch (_) {}

      // 3. Debounced flush to outbox.
      if (!stockEditTimersRef.current) stockEditTimersRef.current = {};
      if (stockEditTimersRef.current[productId]) {
        window.clearTimeout(stockEditTimersRef.current[productId]);
      }
      stockEditTimersRef.current[productId] = window.setTimeout(function () {
        flushPendingStockEdit(productId);
      }, 500);
    }

    // Drain ONE product's pending edit into the sync outbox.
    //
    // CRITICAL: we do NOT delete the entry from localStorage here. The API
    // POST is asynchronous — if we cleared the guard immediately, a /sync/pull
    // that fires before the POST lands at D1 would see "no pending" and
    // overwrite our optimistic value with stale server data.
    //
    // Instead we mark it as "in-flight" (status: "sent") and leave the guard
    // in place. handlePulled() clears the guard only when it sees the server
    // confirm the value matches (or the entry is older than 30 minutes, an
    // escape hatch for stuck ops).
    function flushPendingStockEdit(productId) {
      try {
        delete stockEditTimersRef.current[productId];
      } catch (_) {}

      var pendingKey = "shopflow-pending-stock-edits";
      var pending = {};
      try { pending = JSON.parse(window.localStorage.getItem(pendingKey) || "{}"); }
      catch (_) {}
      var entry = pending[productId];
      if (!entry) return;

      var targetProduct = products.find(function (product) { return product.id === productId; });
      if (!targetProduct || targetProduct.inventoryMode !== "stock") {
        delete pending[productId];
        try { window.localStorage.setItem(pendingKey, JSON.stringify(pending)); }
        catch (_) {}
        return;
      }

      // Already in-flight? Don't double-enqueue.
      if (entry.status === "sent") return;

      // Mark as sent BEFORE enqueueing so we don't accidentally double-send if
      // this function is invoked multiple times in quick succession.
      entry.status = "sent";
      entry.sentAt = Date.now();
      pending[productId] = entry;
      try { window.localStorage.setItem(pendingKey, JSON.stringify(pending)); }
      catch (_) {}

      syncEnqueue({
        endpoint: "/inventory/adjust",
        method: "POST",
        opType: "adjust",
        body: {
          productId: productId,
          newQty: Number(entry.newQty) || 0,
          reason: "Chinh tay tu Inventory UI"
        }
      });
    }

    function pruneRecipeStockAdjustments() {
      var recipeIds = products
        .filter(function (product) { return product.inventoryMode === "recipe"; })
        .map(function (product) { return product.id; });
      if (!recipeIds.length) return;
      var recipeSet = {};
      recipeIds.forEach(function (id) { recipeSet[id] = true; });

      try {
        var pendingKey = "shopflow-pending-stock-edits";
        var pending = JSON.parse(window.localStorage.getItem(pendingKey) || "{}");
        var pendingChanged = false;
        recipeIds.forEach(function (id) {
          if (pending[id]) {
            delete pending[id];
            pendingChanged = true;
          }
        });
        if (pendingChanged) {
          window.localStorage.setItem(pendingKey, JSON.stringify(pending));
        }
      } catch (_) {}

      try {
        var outbox = JSON.parse(window.localStorage.getItem("shopflow-outbox") || "[]");
        if (!Array.isArray(outbox)) return;
        var nextOutbox = outbox.filter(function (op) {
          var endpoint = String(op && op.endpoint || "");
          var productId = op && op.body ? op.body.productId : "";
          return !(endpoint.indexOf("/inventory/adjust") !== -1 && recipeSet[productId]);
        });
        if (nextOutbox.length !== outbox.length) {
          window.localStorage.setItem("shopflow-outbox", JSON.stringify(nextOutbox));
          if (window.ShopFlowSync && typeof window.ShopFlowSync.getStatus === "function") {
            setSyncStatus(window.ShopFlowSync.getStatus());
          }
        }
      } catch (_) {}
    }

    // Drain ALL pending stock edits — called once at startup and on
    // beforeunload, so nothing gets stranded if a user closes the tab
    // mid-debounce on the previous session.
    function flushAllPendingStockEdits() {
      var pendingKey = "shopflow-pending-stock-edits";
      var pending = {};
      try { pending = JSON.parse(window.localStorage.getItem(pendingKey) || "{}"); }
      catch (_) {}
      Object.keys(pending).forEach(function (pid) {
        flushPendingStockEdit(pid);
      });
    }

    useEffect(function () {
      // Pick up edits from the previous session that never got enqueued.
      flushAllPendingStockEdits();

      // Make absolutely sure in-flight debounces get fired before the page
      // goes away.
      function onBeforeUnload() {
        Object.keys(stockEditTimersRef.current || {}).forEach(function (pid) {
          window.clearTimeout(stockEditTimersRef.current[pid]);
          flushPendingStockEdit(pid);
        });
      }
      window.addEventListener("beforeunload", onBeforeUnload);
      return function () { window.removeEventListener("beforeunload", onBeforeUnload); };
    }, []);

    useEffect(function () {
      pruneRecipeStockAdjustments();
    }, [products]);

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
        name: "FnB Custom Invoice",
        title: "HÓA ĐƠN BÁN HÀNG / SALES RECEIPT",
        subtitle: "Mẫu hóa đơn FnB mới / New FnB invoice template",
        footer: "Cảm ơn quý khách đã dùng sản phẩm tại OriaFarm. / Thank you for enjoying OriaFarm.",
        showSubtitle: true,
        showAddress: true,
        showBranch: true,
        showPhone: true,
        showTaxId: true,
        showCashier: true,
        showCustomerName: true,
        showPaymentMethod: true,
        showUnitPrice: true,
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

    function renderProductMedia(product) {
      var imageUrl = product && product.imageUrl;
      var icon = imageUrl ? "" : ((product && (product.imageIcon || product.image)) || "🍊");
      return html`
        <div className="pos-product-media">
          ${imageUrl ? html`
            <img
              src=${imageUrl}
              alt=${product.name || ""}
              loading="lazy"
              onError=${function (event) {
                event.currentTarget.style.display = "none";
              }}
            />
          ` : null}
          ${icon ? html`<span>${icon}</span>` : null}
        </div>
      `;
    }

    function renderProductCustomizerModal() {
      if (!productCustomizer || !productCustomizer.product) return null;
      var product = productCustomizer.product;
      var availableAddOns = getProductAddonOptions(product);
      var selectedIds = productCustomizer.addOnIds || [];
      var selectedTotal = selectedIds.reduce(function (sum, addOnId) {
        var addOn = getAddonById(addOnId, availableAddOns) || getAddonById(addOnId, addOns);
        return sum + (addOn ? Number(addOn.price) || 0 : 0);
      }, 0);
      var unitTotal = (Number(product.price) || 0) + selectedTotal;

      return html`
        <div className="detail-modal-backdrop" role="presentation" onClick=${function () { setProductCustomizer(null); }}>
          <section className="detail-modal surface product-customizer-modal" role="dialog" aria-modal="true" onClick=${function (event) { event.stopPropagation(); }}>
            <div className="detail-modal-head">
              <div>
                <p className="eyebrow">${L("Tùy chỉnh món / Customize Item")}</p>
                <h2>${product.imageIcon || ""} ${product.name}</h2>
                <small>${formatCurrency(product.price)} · ${product.inventoryMode === "recipe" ? L("món pha chế / prepared item") : L("sản phẩm / product")}</small>
              </div>
              <button type="button" className="ghost-btn" onClick=${function () { setProductCustomizer(null); }}>×</button>
            </div>

            <div className="customizer-summary">
              <span>${L("Tạm tính món / Item subtotal")}</span>
              <strong>${formatCurrency(unitTotal)}</strong>
            </div>

            <div className="customizer-section">
              <div className="section-top compact">
                <div>
                  <p className="eyebrow">${L("Add-ons")}</p>
                  <h3>${L("Chọn thêm cho món / Select add-ons")}</h3>
                </div>
              </div>
              ${availableAddOns.length ? html`
                <div className="customizer-addon-grid">
                  ${availableAddOns.map(function (addOn) {
                    var active = selectedIds.indexOf(addOn.id) !== -1;
                    return html`
                      <button
                        key=${addOn.id}
                        type="button"
                        className=${"addon-chip customizer-addon-chip" + (active ? " is-active" : "")}
                        onClick=${function () { toggleCustomizerAddon(addOn.id); }}
                      >
                        <span>${L(addOn.label)}</span>
                        ${addOn.price ? html`<strong>+${formatCurrency(addOn.price)}</strong>` : null}
                      </button>
                    `;
                  })}
                </div>
              ` : html`
                <div className="empty-state align-left">${L("Món này chưa có add-ons. / No add-ons configured for this item.")}</div>
              `}
            </div>

            <label className="field customizer-note-field">
              <span>${L("Ghi chú cho món / Item note")}</span>
              <textarea
                rows="3"
                placeholder=${L("Ví dụ: ít ngọt, không đá, giao trước... / Example: less sweet, no ice, serve first...")}
                value=${productCustomizer.note || ""}
                onInput=${function (event) {
                  var value = event.target.value;
                  setProductCustomizer(function (current) {
                    return current ? Object.assign({}, current, { note: value }) : current;
                  });
                }}
              ></textarea>
            </label>

            <div className="button-row button-row-main customizer-actions">
              <button type="button" className="ghost-btn" onClick=${function () { setProductCustomizer(null); }}>${L("Hủy / Cancel")}</button>
              <button type="button" className="primary-btn" onClick=${addCustomizedProductToOrder}>
                ${L("Thêm vào đơn / Add to Order")}
              </button>
            </div>
          </section>
        </div>
      `;
    }

    function renderPosView() {
      var changeDue = Math.max(0, (Number(activeOrder.cashReceived) || 0) - totals.total);
      var quickCashOptions = [50000, 100000, 200000, 500000];
      var orderNeedsAction = activeOrder.status === "needs_action";
      var orderSaving = activeOrder.status === "saving" || checkoutSaving;
      var activeOrderPicked = posOrderPicked && orders.some(function (order) { return order.id === activeOrderId; });
      var checkoutDisabled = orderSaving || !activeOrderPicked;
      var activeOrderHasRecipeItems = orderHasRecipeItems(activeOrder);
      var activeWorkflowStatus = getOrderWorkflowStatus(activeOrder);
      var recipeAwaitingAccept = activeOrderHasRecipeItems
        && activeWorkflowStatus !== "preparing"
        && activeWorkflowStatus !== "ready"
        && activeWorkflowStatus !== "needs_action"
        && activeWorkflowStatus !== "completed";
      var recipePreparing = activeOrderHasRecipeItems && activeWorkflowStatus === "preparing";
      function handleCheckoutPrimaryAction() {
        if (orderNeedsAction) {
          payNow();
          return;
        }
        if (recipeAwaitingAccept) {
          receiveActiveOrder();
          setCheckoutPanelOpen(false);
          return;
        }
        if (recipePreparing) {
          finishPreparingOrder();
          setCheckoutPanelOpen(false);
          return;
        }
        if (!activeOrderHasRecipeItems) {
          payNow();
          return;
        }
        if (checkoutPanelOpen) {
          payNow();
          return;
        }
        setCheckoutPanelOpen(true);
      }
      function getCheckoutPrimaryLabel() {
        if (orderSaving) return L("Đang lưu... / Saving...");
        if (orderNeedsAction) return L("Thử lại / Retry");
        if (recipeAwaitingAccept) return L("Xác nhận đơn / Accept Order");
        if (recipePreparing) return L("Hoàn tất chuẩn bị / Mark Ready");
        if (checkoutPanelOpen) return L("Xác nhận thanh toán / Confirm Payment");
        return L("Thanh toán / Checkout") + " (" + formatCurrency(totals.total) + ")";
      }
      var startOfToday = new Date();
      startOfToday = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate()).getTime();
      var endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;
      var completedSalesToday = dedupeSalesByOrderId((sales || []).map(normalizeSaleRecord).filter(function (sale) {
        var createdAt = Number(sale.createdAt) || 0;
        return !isKnownTechnicalTestSale(sale) &&
          isSaleRevenueEligible(sale) &&
          createdAt >= startOfToday &&
          createdAt <= endOfToday;
      })).sort(function (a, b) {
        var createdDiff = (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
        if (createdDiff) return createdDiff;
        return String(b.orderId || b.id || "").localeCompare(String(a.orderId || a.id || ""));
      });
      var filteredOrders = orders.filter(function (order) {
        var workflowStatus = getOrderWorkflowStatus(order);
        return orderStatusFilter === "all" || (orderStatusFilter !== "completed" && workflowStatus === orderStatusFilter);
      });
      var completedSaleCards = (orderStatusFilter === "all" || orderStatusFilter === "completed")
        ? completedSalesToday
        : [];
      var collapseOrderBoard = orderStatusFilter === "all" && !orderBoardExpanded;
      var visibleOrderLimit = collapseOrderBoard ? ORDER_BOARD_COLLAPSED_LIMIT : Infinity;
      var displayedOrders = collapseOrderBoard ? filteredOrders.slice(0, visibleOrderLimit) : filteredOrders;
      var remainingSaleSlots = collapseOrderBoard ? Math.max(0, visibleOrderLimit - displayedOrders.length) : Infinity;
      var displayedCompletedSaleCards = collapseOrderBoard ? completedSaleCards.slice(0, remainingSaleSlots) : completedSaleCards;
      var totalBoardCards = filteredOrders.length + completedSaleCards.length;
      var displayedBoardCards = displayedOrders.length + displayedCompletedSaleCards.length;
      var hiddenBoardCards = Math.max(0, totalBoardCards - displayedBoardCards);
      var statusCounts = orders.reduce(function (counts, order) {
        var status = getOrderWorkflowStatus(order);
        counts[status] = (counts[status] || 0) + 1;
        counts.all += 1;
        return counts;
      }, { all: completedSalesToday.length, new: 0, preparing: 0, held: 0, needs_action: 0, completed: completedSalesToday.length });
      function getOpenOrderStatusLabel(order) {
        if (order.status === "needs_action") return L("Cần xử lí / Needs Action");
        if (order.status === "saving") return L("Đang lưu / Saving");
        if (order.status === "preparing") return L("Đang chuẩn bị / Preparing");
        if (order.status === "ready") return L("Sẵn sàng / Ready");
        if (order.status === "completed") return L("Hoàn thành / Completed");
        if (order.status === "held") return L("Tạm giữ / Held");
        return L("Mới / New");
      }
      function getOrderStatusClass(order) {
        return " order-chip-status-" + getOrderWorkflowStatus(order);
      }
      function getOrderCardActionLabel(order) {
        if (order.id === activeOrder.id && activeOrderPicked) return L("Đang chọn / Selected");
        var status = getOrderWorkflowStatus(order);
        if (status === "held" || status === "preparing") return L("Tiếp tục / Continue");
        return L("Chọn đơn / Select Order");
      }
      function getCompletedSaleItemCount(sale) {
        var items = (sale && sale.items) || [];
        if (!items.length) return Number(sale && (sale.itemCount || sale.item_count)) || 0;
        return items.reduce(function (sum, item) {
          return sum + (allowsFractionalQty(item.unit) ? 1 : (Number(item.qty) || 0));
        }, 0);
      }
      var catalogProducts = (barcodeInput
        ? products.filter(function (p) {
            var q = barcodeInput.toLowerCase();
            return (p.name && p.name.toLowerCase().indexOf(q) !== -1)
                || (p.id && p.id.toLowerCase().indexOf(q) !== -1)
                || (p.barcode && p.barcode.toLowerCase().indexOf(q) !== -1)
                || (p.skuCode && String(p.skuCode).toLowerCase().indexOf(q) !== -1);
          })
        : filteredProducts
      ).slice(0, 40);
      return html`
        <section className=${"pos-layout" + (activeOrderPicked ? "" : " is-order-overview")}>
          ${activeOrderPicked ? html`<aside className="pos-category-toolbar surface">
            <div>
              <p className="eyebrow">${L("Danh mục / Categories")}</p>
              <h2 className="section-title">${L("Loại đồ uống / Product Groups")}</h2>
            </div>
            <div className="pos-category-list">
              ${(function () {
                // Build a quick lookup of which parents have children, so we
                // can show a chevron + only render children when expanded.
                var hasChildren = {};
                categories.forEach(function (c) {
                  if (c.parentId) hasChildren[c.parentId] = true;
                });
                // Auto-treat a category as expanded if one of its children is
                // currently the active filter — keeps the highlight visible.
                function isAncestorOfActive(parentId) {
                  var cat = categories.find(function (c) { return c.id === selectedCategory; });
                  while (cat && cat.parentId) {
                    if (cat.parentId === parentId) return true;
                    cat = categories.find(function (c) { return c.id === cat.parentId; });
                  }
                  return false;
                }

                return filterCategories.filter(function (cat) {
                  // Always show "all" pseudo + top-level (depth 0).
                  if (cat.id === "all") return true;
                  var depth = Number(cat._depth) || 0;
                  if (depth === 0) return true;
                  // Show child only if its parent is expanded OR descendant of active
                  var p = cat.parentId;
                  return !!(expandedCategories[p] || isAncestorOfActive(p) || selectedCategory === cat.id);
                }).map(function (category) {
                  var depth = Number(category._depth) || 0;
                  var parentExpand = !!hasChildren[category.id];
                  var isOpen = !!expandedCategories[category.id];
                  var childStyle = depth > 0 ? {
                    width: "calc(100% - " + (depth * 18) + "px)",
                    marginLeft: (depth * 18) + "px",
                    fontSize: 12.5,
                    padding: "10px 14px",
                    borderLeft: "3px solid #f2dcc6",
                    borderRadius: "0 999px 999px 0",
                    background: "rgba(255, 248, 240, 0.88)"
                  } : {};

                  return html`
                    <button
                      key=${category.id}
                      className=${"category-pill category-pill-toolbar" + (selectedCategory === category.id ? " is-active" : "")}
                      onClick=${function () {
                        setSelectedCategory(category.id);
                        // Click parent → also toggle the dropdown for it
                        if (parentExpand) toggleCategoryExpanded(category.id);
                      }}
                      style=${childStyle}
                    >
                      <span>${category.icon}</span>
                      <span style=${{ flex: 1, textAlign: "left" }}>
                        ${depth > 0 ? "↳ " : ""}${L(category.label)}
                      </span>
                      ${parentExpand
                        ? html`<span style=${{ fontSize: 11, opacity: 0.7 }}>${isOpen ? "▾" : "▸"}</span>`
                        : null}
                    </button>
                  `;
                });
              })()}
            </div>
          </aside>` : null}

          <div className="pos-main-stack">
            <section className="surface section-card pos-bill-board">
              <div className="section-top">
                <div>
                  <p className="eyebrow">${L("Đơn đang mở / Open Orders")}</p>
                  <h2 className="section-title">${L("Chọn bill đang thao tác / Pick Active Bill")}</h2>
                </div>
              </div>

              <div className="pos-status-filter">
                ${POS_ORDER_STATUS_FILTERS.map(function (filter) {
                  var active = orderStatusFilter === filter.id;
                  return html`
                    <button
                      key=${filter.id}
                      className=${"status-filter-btn status-filter-" + filter.id + (active ? " is-active" : "")}
                      onClick=${function () {
                        setOrderStatusFilter(filter.id);
                        setOrderBoardExpanded(false);
                      }}
                    >
                      ${L(filter.label)}
                      <span className="status-filter-count">${statusCounts[filter.id] || 0}</span>
                    </button>
                  `;
                })}
              </div>

              <div className="order-switcher order-switcher-board">
                ${(orderStatusFilter === "all" || orderStatusFilter === "new") ? html`
                  <button className="order-chip order-chip-create order-chip-board" onClick=${createNewOrder}>
                    <span>${L("+ Đơn mới / + New Order")}</span>
                    <small>${L("Tạo giỏ khác / Create another cart")}</small>
                  </button>
                ` : null}
                ${displayedOrders.length ? displayedOrders.map(function (order) {
                  var itemCount = (order.items || []).reduce(function (sum, item) {
                    return sum + (Number(item.qty) || 0);
                  }, 0);
                  return html`
                    <button
                      key=${order.id}
                      className=${"order-chip order-chip-board" + getOrderStatusClass(order) + (order.id === activeOrder.id && activeOrderPicked ? " is-active" : "")}
                      onClick=${function () {
                        setActiveOrderId(order.id);
                        setPosOrderPicked(true);
                        setCheckoutPanelOpen(false);
                      }}
                    >
                      <span className="order-chip-id">${order.id}</span>
                      <small className=${order.status === "needs_action" ? "needs-action-chip" : ""}>${getOpenOrderStatusLabel(order)}</small>
                      <small>${formatQuantity(itemCount, 2)} ${L("món / items")}</small>
                      <span className="order-card-action">${getOrderCardActionLabel(order)}</span>
                    </button>
                  `;
                }) : null}
                ${displayedCompletedSaleCards.map(function (sale) {
                  var saleId = sale.serverId || sale.id || sale.orderId || "";
                  return html`
                    <button
                      type="button"
                      key=${"completed-" + saleId}
                      className="order-chip order-chip-board order-chip-status-completed"
                      title=${L("Hóa đơn đã hoàn thành trong ngày / Completed sale today")}
                      onClick=${function () { openCompletedSaleDetail(sale); }}
                    >
                      <span className="order-chip-id">${sale.orderId || saleId}</span>
                      <small>${L("Hoàn thành / Completed")}</small>
                      <small>${formatCurrency(sale.total)} · ${formatQuantity(getCompletedSaleItemCount(sale), 2)} ${L("món / items")}</small>
                      <span className="order-card-action order-card-action-success">${L("Xem chi tiết / View Details")}</span>
                    </button>
                  `;
                })}
                ${(!displayedOrders.length && !displayedCompletedSaleCards.length) ? html`
                  <div className="empty-state align-left">
                    ${L("Không có đơn trong trạng thái này. / No orders in this status.")}
                  </div>
                ` : null}
                ${orderStatusFilter === "all" && totalBoardCards > ORDER_BOARD_COLLAPSED_LIMIT ? html`
                  <button type="button" className="order-board-more-btn" onClick=${function () { setOrderBoardExpanded(!orderBoardExpanded); }}>
                    ${orderBoardExpanded
                      ? L("Thu gọn / Collapse")
                      : L("Xem thêm / Show More") + " +" + hiddenBoardCards}
                  </button>
                ` : null}
              </div>
            </section>

            ${activeOrderPicked ? html`<section className="catalog-panel surface pos-catalog-panel">
              <form className="pos-catalog-tools" onSubmit=${function (event) {
                event.preventDefault();
                handleUnifiedLookup(barcodeInput);
              }}>
                <label className="pos-search-field">
                  <span>⌕</span>
                  <input
                    ref=${barcodeInputRef}
                    value=${barcodeInput}
                    placeholder=${L("Tìm sản phẩm: tên món, thành phần, mã... / Search product: name, ingredient, code...")}
                    onInput=${function (event) {
                      setBarcodeInput(event.target.value);
                    }}
                  />
                </label>

                <button type="submit" className="ghost-btn pos-tool-btn">⌗ ${L("Quét mã / Scan")}</button>
                ${cameraActive
                  ? html`<button type="button" className="ghost-btn pos-tool-btn" onClick=${stopCameraScan}>${L("Dừng camera / Stop")}</button>`
                  : html`<button type="button" className="ghost-btn pos-tool-btn" onClick=${startCameraScan}>📷 ${L("Mở camera / Camera")}</button>`}
                ${barcodeInput ? html`<button type="button" className="ghost-btn pos-tool-btn" onClick=${function () { setBarcodeInput(""); setScanMessage(""); }}>${L("Xóa / Clear")}</button>` : null}

                <input
                  ref=${barcodeCaptureInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="scanner-capture-input"
                  onChange=${handleBarcodeImageCapture}
                />
              </form>

              ${scanMessage ? html`<div className="scanner-status pos-scan-status">${scanMessage}</div>` : null}

              ${cameraActive ? html`
                <div className="scanner-video-shell">
                  <video ref=${videoRef} className="scanner-video" playsInline muted autoplay></video>
                </div>
              ` : null}

              <div className="pos-product-grid">
                ${catalogProducts.length ? catalogProducts.map(function (product) {
                  return html`
                    <article key=${product.id} className="pos-product-card">
                      ${renderProductMedia(product)}
                      <div className="pos-product-copy">
                        <h3>${product.name}</h3>
                        <p>${product.description || product.barcode || product.skuCode || ""}</p>
                      </div>
                      <div className="pos-product-meta">
                        <strong>${formatCurrency(product.price)}</strong>
                        <small
                          title=${product.inventoryMode === "recipe" ? L("Tồn khả dụng tính từ nguyên liệu / Available units based on ingredients") : L("Tồn kho thật / Direct stock")}
                        >
                          ${product.inventoryMode === "recipe" ? L("Có thể bán / Available") : L("Tồn / Stock")}: ${formatQuantity(product.stock, 2)}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="pos-add-btn"
                        aria-label=${L("Thêm / Add") + " " + product.name}
                        onClick=${function () { handleProductAdd(product); }}
                      >
                        +
                      </button>
                    </article>
                  `;
                }) : html`
                  <div className="empty-state align-left">${L("Không tìm thấy sản phẩm phù hợp. / No matching products.")}</div>
                `}
              </div>
            </section>` : null}
          </div>

          ${activeOrderPicked && checkoutPanelOpen ? html`
          <div
            className="pos-payment-backdrop"
            onClick=${function () {
              setCheckoutPanelOpen(false);
              setPaymentMenuOpen(false);
            }}
          ></div>` : null}
          ${activeOrderPicked ? html`
          <aside className=${"order-panel surface" + (checkoutPanelOpen ? " pos-payment-panel" : "")}>
            ${checkoutPanelOpen ? html`
              <div className="pos-payment-title">
                <strong>${L("Thanh toán đơn hàng / Checkout")}</strong>
                <button
                  type="button"
                  className="pos-payment-close"
                  aria-label=${L("Đóng thanh toán / Close payment")}
                  onClick=${function () {
                    setCheckoutPanelOpen(false);
                    setPaymentMenuOpen(false);
                  }}
                >×</button>
              </div>
            ` : null}
            <div className="order-panel-top">
              <div className="order-hero">
                <div>
                  <p className="eyebrow">${L("Đơn hiện tại / Current Order")}</p>
                  <h2 className="section-title">${activeOrder.id}</h2>
                  ${orderNeedsAction ? html`
                    <div className="status-pill status-danger needs-action-pill" style=${{ marginTop: 8 }}>
                      ${L("Cần xử lí / Needs Action")}
                    </div>
                  ` : null}
                  ${orderSaving ? html`
                    <div className="status-pill status-warning" style=${{ marginTop: 8 }}>
                      ${L("Đang lưu vào Supabase... / Saving to Supabase...")}
                    </div>
                  ` : null}
                  ${activeWorkflowStatus === "preparing" && !orderSaving ? html`
                    <div className="status-pill status-warning" style=${{ marginTop: 8 }}>
                      ${L("Đang chuẩn bị / Preparing")}
                    </div>
                  ` : null}
                  ${activeWorkflowStatus === "completed" && !orderSaving ? html`
                    <div className="status-pill status-success" style=${{ marginTop: 8 }}>
                      ${L("Hoàn thành / Completed")}
                    </div>
                  ` : null}
                  ${!activeOrderPicked ? html`
                    <div className="status-pill" style=${{ marginTop: 8 }}>
                      ${L("Chưa chọn bill / No bill selected")}
                    </div>
                  ` : null}
                </div>
                <div className="item-badge">#${totals.itemCount} ${L("món / items")}</div>
              </div>
              ${(activeOrder.items && activeOrder.items.length > 0)
                ? (activeOrderPicked ? html`
                    ${activeOrder.status === "preparing" ? html`
                      <button className="primary-btn" onClick=${finishPreparingOrder}>${L("Hoàn tất chuẩn bị / Mark Ready")}</button>
                    ` : (activeOrder.status !== "needs_action" && activeOrder.status !== "saving" && activeOrder.status !== "ready" ? html`
                      <button className="primary-btn" disabled=${checkoutDisabled} onClick=${handleCheckoutPrimaryAction}>
                        ${getCheckoutPrimaryLabel()}
                      </button>
                    ` : null)}
                    <button className="ghost-btn" onClick=${cancelOrder}>${L("Xóa món / Clear Items")}</button>
                  ` : null)
                : (orders.length > 1
                    ? html`<button className="ghost-btn" onClick=${cancelOrder}>${L("Xóa đơn / Remove Order")}</button>`
                    : null)}
            </div>

            <div className="order-items">
              ${activeOrder.items.length
                ? activeOrder.items.map(function (item) {
                    var itemUnit = getOrderItemUnit(item);
                    var itemDiscountType = item.discountType === "amount" ? "amount" : "percent";
                    var itemDiscountValue = Number(item.discountValue) || 0;
                    var itemDiscount = getItemDiscountAmount(item, addOns);
                    var itemNetTotal = getItemLineNet(item, addOns);
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
                          <${LocalNumberInput}
                            min=${qtyInputMin(itemUnit)}
                            step=${qtyInputStep(itemUnit)}
                            style=${{
                              width: "50px",
                              textAlign: "center",
                              border: "none",
                              background: "transparent",
                              fontSize: "1rem",
                              fontWeight: "bold",
                              color: "inherit",
                              padding: "0"
                            }}
                            value=${item.qty}
                            onChange=${function(val) {
                              var normalized = val === "" ? "" : normalizeQtyForUnit(val, itemUnit);
                              updateActiveOrder(function(order) {
                                var newItems = order.items.map(function(it) {
                                  if (it.id === item.id) return Object.assign({}, it, { qty: normalized });
                                  return it;
                                });
                                return Object.assign({}, order, { items: newItems });
                              });
                            }}
                            onBlur=${function(e) {
                              if (e.target.value === "" || Number(e.target.value) <= 0) {
                                updateActiveOrder(function(order) {
                                  var newItems = order.items.map(function(it) {
                                    if (it.id === item.id) return Object.assign({}, it, { qty: normalizeQtyForUnit(qtyInputMin(itemUnit), itemUnit) });
                                    return it;
                                  });
                                  return Object.assign({}, order, { items: newItems });
                                });
                              }
                            }}
                          />
                          <button className="qty-btn" onClick=${function () {
                            adjustItemQty(item.id, 1);
                          }}>+</button>
                          <span className="line-total">${formatCurrency(itemNetTotal)}</span>
                        </div>

                        <div className="item-discount-row">
                          <span>${L("Giảm giá món / Item discount")}</span>
                          <div className="discount-mode-toggle">
                            <button
                              type="button"
                              className=${"discount-mode-btn" + (itemDiscountType === "percent" ? " is-active" : "")}
                              onClick=${function () { updateItemDiscount(item.id, "discountType", "percent"); }}
                            >%</button>
                            <button
                              type="button"
                              className=${"discount-mode-btn" + (itemDiscountType === "amount" ? " is-active" : "")}
                              onClick=${function () { updateItemDiscount(item.id, "discountType", "amount"); }}
                            >đ</button>
                          </div>
                          <${LocalNumberInput}
                            min="0"
                            step=${itemDiscountType === "percent" ? "1" : "1000"}
                            value=${itemDiscountValue}
                            onChange=${function (val) { updateItemDiscount(item.id, "discountValue", val); }}
                          />
                          <strong>${itemDiscount ? "-" + formatCurrency(itemDiscount) : formatCurrency(0)}</strong>
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
                        ${item.note ? html`
                          <div className="order-item-note">
                            <strong>${L("Ghi chú / Note")}:</strong>
                            <span>${item.note}</span>
                          </div>
                        ` : null}
                      </article>
                    `;
                  })
                : html`<div className="empty-state">${L("Chưa có sản phẩm trong giỏ. Quét mã vạch hoặc bấm Thêm. / No items in cart yet.")}</div>`}
            </div>

            ${orderNeedsAction ? html`
              <div className="empty-state align-left" style=${{ borderColor: "#f0b6aa", background: "#fff1eb", color: "#8f351d" }}>
                <strong>${L("Đơn chưa được lưu vào dữ liệu. / This sale has not been saved.")}</strong>
                <div>${activeOrder.syncError || L("Vui lòng kiểm tra tồn kho, số tiền thanh toán hoặc kết nối mạng. / Check stock, payment amount, or connection.")}</div>
                <small>${L("Sửa lại bill để mở khóa nút hoàn tất. / Edit the bill to unlock checkout.")}</small>
              </div>
            ` : null}

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
                    className=${"payment-select-trigger" + (!normalizePaymentMethod(activeOrder.paymentMethod) ? " is-placeholder" : "")}
                    onClick=${function (event) {
                      event.stopPropagation();
                      setPaymentMenuOpen(!paymentMenuOpen);
                    }}
                  >
                    <span>${L(getPaymentMethodLabel(activeOrder.paymentMethod))}</span>
                    <span className="payment-select-icon">▾</span>
                  </button>

                  ${paymentMenuOpen ? html`
                    <div className="payment-select-dropdown">
                      ${PAYMENT_METHOD_OPTIONS.map(function (option) {
                        var isActive = normalizePaymentMethod(activeOrder.paymentMethod) === option.value;
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
                <${LocalNumberInput}
                  value=${activeOrder.cashReceived}
                  onChange=${function (val) {
                    updateActiveOrder(function (order) {
                      return Object.assign({}, order, { cashReceived: val });
                    });
                  }}
                />
              </label>
              <label className="field discount-box">
                <span>${L("Giảm giá / Discount")}</span>
                <${LocalNumberInput}
                  min="0"
                  value=${activeOrder.discountAmount}
                  onChange=${function (val) {
                    updateActiveOrder(function (order) {
                      return Object.assign({}, order, { discountAmount: val });
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

            <!-- Prices are VAT-inclusive, so we don't show a separate "Thuế"
                 row anymore. The displayed amount IS what the customer pays. -->
            <div className="summary-list">
              <div><span>${L("Số món / Items")}</span><strong>${totals.itemCount}</strong></div>
              ${totals.discount > 0
                ? html`<div><span>${L("Giảm giá / Discount")}</span><strong>-${formatCurrency(totals.discount)}</strong></div>`
                : null}
              <div className="summary-total"><span>${L("Tổng cộng / Total")}</span><strong>${formatCurrency(totals.total)}</strong></div>
              <div style=${{ fontSize: 11, fontStyle: "italic", color: "#7b6b5d", marginTop: -4 }}>
                ${L("(Giá đã bao gồm VAT) / (VAT included)")}
              </div>
              <div><span>${L("Tiền thừa / Change")}</span><strong>${formatCurrency(changeDue)}</strong></div>
            </div>

            <div className="button-row button-row-main">
              <button className="ghost-btn preview-btn" onClick=${previewInvoice}>${L("Xem trước hóa đơn / Preview Invoice")}</button>
              <button
                className="primary-btn checkout-btn"
                disabled=${checkoutDisabled}
                onClick=${handleCheckoutPrimaryAction}
                title=${orderNeedsAction ? L("Thử lưu lại đơn này sau khi đã chỉnh sửa. / Retry saving this order after edits.") : ""}
              >
                ${getCheckoutPrimaryLabel()}
              </button>
            </div>

            <div className="button-row button-row-secondary">
              <button className="ghost-btn" onClick=${holdOrder}>${L("Tạm giữ đơn / Hold Order")}</button>
              <button className="ghost-btn" onClick=${function () { printWithTemplate("In hóa đơn / Print Bill"); }}>${L("In hóa đơn / Print Bill")}</button>
              <button className="ghost-btn" onClick=${function () { printWithTemplate("Xuất hóa đơn VAT / Issue VAT Invoice"); }}>${L("Xuất hóa đơn VAT / Issue VAT Invoice")}</button>
            </div>
          </aside>` : null}
          ${renderProductCustomizerModal()}
          ${renderCompletedSaleDetailModal()}
        </section>
      `;
    }

    function renderDashboardView() {
      // Dynamic payment donut gradient
      var paymentColors = {
        cash: "#f05a16",
        card: "#ff9c45",
        bank_transfer: "#7acb91",
        ewallet: "#6686ff",
        other: "#c6c0b8"
      };
      var activePayments = (dashboardMetrics.paymentBreakdown || []).filter(function (item) {
        return item.orders > 0 || item.revenue > 0;
      });
      var totalPaymentValue = activePayments.reduce(function (sum, item) {
        return sum + (Number(item.revenue) || 0);
      }, 0);
      var paymentGradient = "conic-gradient(#efedea 0 100%)";
      if (totalPaymentValue > 0) {
        var segments = [];
        var currentPercent = 0;
        activePayments.forEach(function (item) {
          var val = Number(item.revenue) || 0;
          if (val <= 0) return;
          var pct = (val / totalPaymentValue) * 100;
          var nextPercent = currentPercent + pct;
          var color = paymentColors[item.method] || paymentColors.other;
          segments.push(color + " " + currentPercent.toFixed(2) + "% " + nextPercent.toFixed(2) + "%");
          currentPercent = nextPercent;
        });
        if (segments.length > 0) {
          paymentGradient = "conic-gradient(" + segments.join(", ") + ")";
        }
      }

      // Dynamic status donut gradient
      var statusColors = {
        completed: "#35b86b",
        preparing: "#f05a16",
        held: "#a86a18",
        needs_action: "#bf4f39",
        new: "#6686ff",
        other: "#c6c0b8"
      };
      var activeStatuses = (dashboardMetrics.statusBreakdown || []).filter(function (item) {
        return item.orders > 0;
      });
      var totalStatusOrders = activeStatuses.reduce(function (sum, item) {
        return sum + (Number(item.orders) || 0);
      }, 0);
      var statusGradient = "conic-gradient(#efedea 0 100%)";
      if (totalStatusOrders > 0) {
        var segments = [];
        var currentPercent = 0;
        activeStatuses.forEach(function (item) {
          var val = Number(item.orders) || 0;
          if (val <= 0) return;
          var pct = (val / totalStatusOrders) * 100;
          var nextPercent = currentPercent + pct;
          var color = statusColors[item.id] || statusColors.other;
          segments.push(color + " " + currentPercent.toFixed(2) + "% " + nextPercent.toFixed(2) + "%");
          currentPercent = nextPercent;
        });
        if (segments.length > 0) {
          statusGradient = "conic-gradient(" + segments.join(", ") + ")";
        }
      }

      var rangeOptions = [
        { id: "today",  label: "Theo ngày / Daily" },
        { id: "month",  label: "Theo tháng / Monthly" },
        { id: "year",   label: "Theo năm / Yearly" },
        { id: "custom", label: "Tùy chọn / Custom" }
      ];
      function renderDelta(value) {
        var positive = Number(value) >= 0;
        return html`<span className=${"dashboard-delta " + (positive ? "is-up" : "is-down")}>
          ${positive ? "↑" : "↓"} ${Math.abs(Number(value) || 0)}%
        </span>`;
      }
      function statusStyle(tone) {
        if (tone === "success") return { background: "#e6f7ea", color: "#168034" };
        if (tone === "danger") return { background: "#ffe8e1", color: "#bf4f39" };
        if (tone === "warning") return { background: "#fff3d8", color: "#a86a18" };
        return { background: "#eaf2ff", color: "#2d68d8" };
      }
      return html`
        <section className="stack-view dashboard-shell">
          <section className="surface section-card dashboard-control-card">
            <div className="dashboard-range-tabs">
              ${rangeOptions.map(function (opt) {
                var active = dashboardRange === opt.id;
                return html`
                  <button
                    key=${opt.id}
                    className=${"dashboard-range-btn" + (active ? " is-active" : "")}
                    onClick=${function () { setDashboardRange(opt.id); }}
                  >${L(opt.label)}</button>
                `;
              })}
            </div>
            ${dashboardRange === "custom" ? html`
              <div className="field-grid dashboard-custom-range">
                <label className="field">
                  <span>${L("Từ ngày / From")}</span>
                  <input type="date" value=${dashboardCustomFrom} onInput=${function (e) { setDashboardCustomFrom(e.target.value); }} />
                </label>
                <label className="field">
                  <span>${L("Đến ngày / To")}</span>
                  <input type="date" value=${dashboardCustomTo} onInput=${function (e) { setDashboardCustomTo(e.target.value); }} />
                </label>
              </div>
            ` : null}

            <div className="dashboard-kpi-grid">
              <article className="dashboard-kpi-card">
                <span className="dashboard-kpi-icon">◎</span>
                <div>
                  <p>${L("Doanh thu / Revenue")}</p>
                  <strong>${formatCurrency(dashboardMetrics.revenue)}</strong>
                  <small>${renderDelta(dashboardMetrics.revenueDelta)} ${L("so với kỳ trước / vs previous")}</small>
                </div>
              </article>
              <article className="dashboard-kpi-card">
                <span className="dashboard-kpi-icon">▣</span>
                <div>
                  <p>${L("Đơn hàng / Orders")}</p>
                  <strong>${dashboardMetrics.ordersCount}</strong>
                  <small>${renderDelta(dashboardMetrics.ordersDelta)} ${L("so với kỳ trước / vs previous")}</small>
                </div>
              </article>
              <article className="dashboard-kpi-card">
                <span className="dashboard-kpi-icon">▤</span>
                <div>
                  <p>${L("Trung bình giá đơn / Avg Ticket")}</p>
                  <strong>${formatCurrency(dashboardMetrics.avgTicket)}</strong>
                  <small>${renderDelta(dashboardMetrics.avgTicketDelta)} ${L("so với kỳ trước / vs previous")}</small>
                </div>
              </article>
              <article className="dashboard-kpi-card">
                <span className="dashboard-kpi-icon">□</span>
                <div>
                  <p>${L("Sản phẩm bán chạy / Best Sellers")}</p>
                  <strong>${dashboardMetrics.bestSellerCount}</strong>
                  <small>${L("trong khoảng lọc / in selected range")}</small>
                </div>
              </article>
              <article className="dashboard-kpi-card">
                <span className="dashboard-kpi-icon dashboard-warn">△</span>
                <div>
                  <p>${L("Sản phẩm sắp hết / Low Stock")}</p>
                  <strong>${dashboardMetrics.lowStock.length}</strong>
                  <small>${L("cần nhập thêm / needs restock")}</small>
                </div>
              </article>
            </div>
          </section>

          ${dashboardMetrics.pendingPurchases.length ? html`
            <section className="surface section-card dashboard-alert-card">
              <div>
                <p className="eyebrow">${L("Cần xác thực / Needs Verification")}</p>
                <h2 className="section-title">${dashboardMetrics.pendingPurchases.length} ${L("phiếu nhập kho chờ xác nhận / stock-in documents pending")}</h2>
                <p>${L("Tổng giá trị chờ nhập / Pending value")}: ${formatCurrency(dashboardMetrics.pendingPurchaseTotal)}</p>
              </div>
              <button className="primary-btn" onClick=${function () {
                setActiveView("inventory");
                setInventorySection("stock_ops");
                setStockOpsMode("in");
                refreshPurchases();
              }}>${L("Xem & xác nhận / Review & Verify")}</button>
            </section>
          ` : null}

          <section className="dashboard-grid-main">
            <article className="surface section-card dashboard-revenue-card">
              <div className="section-top">
                <div>
                  <h2 className="section-title">${L("Doanh thu theo thời gian / Revenue Trend")}</h2>
                  <p className="muted-copy">${L(dashboardMetrics.range.label)}</p>
                </div>
                <div className="dashboard-segment">
                  <button className=${dashboardRevenueMode === "chart" ? "is-active" : ""} onClick=${function () { setDashboardRevenueMode("chart"); }}>${L("Biểu đồ / Chart")}</button>
                  <button className=${dashboardRevenueMode === "table" ? "is-active" : ""} onClick=${function () { setDashboardRevenueMode("table"); }}>${L("Bảng / Table")}</button>
                </div>
              </div>
              ${dashboardMetrics.daySeries.length ? html`
                ${dashboardRevenueMode === "chart" ? html`
                  <div className="dashboard-line-chart">
                    ${(function () {
                      var max = Math.max.apply(null, dashboardMetrics.daySeries.map(function (d) { return d.revenue; }));
                      return dashboardMetrics.daySeries.map(function (d) {
                        var height = max > 0 ? Math.max(8, Math.round(d.revenue / max * 100)) : 8;
                        return html`
                          <div className="dashboard-chart-column" key=${d.day}>
                            <div className="dashboard-chart-bar" style=${{ height: height + "%" }} title=${formatCurrency(d.revenue)}></div>
                            <small>${d.day}</small>
                          </div>
                        `;
                      });
                    })()}
                  </div>
                ` : html`
                  <div className="list-stack">
                    ${dashboardMetrics.daySeries.map(function (d) {
                      return html`
                        <article className="list-row" key=${d.day}>
                          <div><strong>${d.day}</strong><p>${d.orders} ${L("đơn / orders")}</p></div>
                          <strong>${formatCurrency(d.revenue)}</strong>
                        </article>
                      `;
                    })}
                  </div>
                `}
              ` : html`<div className="empty-state">${L("Chưa có doanh thu trong khoảng này. / No revenue in this range.")}</div>`}
            </article>

            <article className="surface section-card dashboard-top-products">
              <div className="section-top">
                <div>
                  <h2 className="section-title">${L("Sản phẩm bán chạy / Best Sellers")}</h2>
                </div>
              </div>
              ${dashboardMetrics.topProducts.length ? html`
                <div className="dashboard-product-podium">
                  ${dashboardMetrics.topProducts.slice(0, 3).map(function (p, i) {
                    return html`
                      <article className="dashboard-product-tile" key=${p.name + i}>
                        <span className="dashboard-rank">${i + 1}</span>
                        <div className="dashboard-product-image">
                          ${isProductImageUrl(p.image) ? html`<img src=${p.image} alt=${p.name} />` : html`<span>${p.image || "🛒"}</span>`}
                        </div>
                        <strong
                          style=${{ cursor: "pointer", wordBreak: "break-word", overflowWrap: "anywhere" }}
                          onClick=${function () { toggleProductExpanded(p.name); }}
                          title=${L("Bấm để xem đầy đủ / Click to see full name")}
                        >
                          ${expandedProducts[p.name] ? p.name : truncateWords(p.name, 4)}
                        </strong>
                        <small>${L("Đã bán / Sold")} ${formatQuantity(p.qty, 2)}</small>
                      </article>
                    `;
                  })}
                </div>
                <div className="list-stack compact-list">
                  ${dashboardMetrics.topProducts.slice(3).map(function (p, i) {
                    return html`
                      <article className="list-row" key=${p.name + i}>
                        <div><strong>#${i + 4} ${p.name}</strong><p>${formatQuantity(p.qty, 2)} ${L("đã bán / sold")}</p></div>
                        <strong>${formatCurrency(p.revenue)}</strong>
                      </article>
                    `;
                  })}
                </div>
              ` : html`<div className="empty-state">${L("Chưa có sản phẩm bán chạy trong khoảng này. / No best sellers in this range.")}</div>`}
            </article>

            <article className="surface section-card dashboard-order-history">
              <div className="section-top">
                <div>
                  <h2 className="section-title">${L("Lịch sử đơn hàng / Order History")}</h2>
                </div>
              </div>
              <div className="dashboard-timeline">
                ${dashboardMetrics.recentOrders.length ? dashboardMetrics.recentOrders.map(function (entry) {
                  return html`
                    <article className="dashboard-order-line" key=${entry.id + entry.orderId}>
                      <time>${formatDateTime(entry.createdAt).split(" ")[0]}</time>
                      <div>
                        <strong>${entry.orderId}</strong>
                        <p>${entry.customerName}</p>
                      </div>
                      <strong>${formatCurrency(entry.total)}</strong>
                      <span className="dashboard-status-chip" style=${statusStyle(entry.statusTone)}>${L(entry.statusLabel)}</span>
                      ${entry.sale ? html`
                        <button className="ghost-btn" onClick=${function () { reprintSale(entry.sale, false); }}>${L("Xem / View")}</button>
                      ` : html`
                        <button className="ghost-btn" onClick=${function () {
                          setActiveView("pos");
                          setActiveOrderId(entry.orderId);
                          setPosOrderPicked(true);
                        }}>${L("Mở / Open")}</button>
                      `}
                    </article>
                  `;
                }) : html`<div className="empty-state">${L("Chưa có đơn trong khoảng này. / No orders in this range.")}</div>`}
              </div>
            </article>
          </section>

          <section className="dashboard-grid-secondary">
            <article className="surface section-card">
              <h2 className="section-title">${L("Phương thức thanh toán / Payment Methods")}</h2>
              ${dashboardMetrics.paymentBreakdown.length ? html`
                <div className="dashboard-breakdown">
                  <div className="dashboard-donut" style=${{
                    background: paymentGradient
                  }}>
                    <strong>${dashboardMetrics.ordersCount}</strong>
                    <small>${L("Tổng đơn / Orders")}</small>
                  </div>
                  <div className="list-stack compact-list">
                    ${dashboardMetrics.paymentBreakdown.map(function (item) {
                      var color = paymentColors[item.method] || paymentColors.other;
                      return html`
                        <article className="dashboard-breakdown-row" key=${item.method}>
                          <span style=${{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <span style=${{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }}></span>
                            ${L(item.label)}
                          </span>
                          <strong>${item.percent}%</strong>
                          <small>${item.orders} ${L("đơn / orders")}</small>
                        </article>
                      `;
                    })}
                  </div>
                </div>
              ` : html`<div className="empty-state">${L("Chưa có thanh toán trong khoảng này. / No payments in this range.")}</div>`}
            </article>

            <article className="surface section-card">
              <h2 className="section-title">${L("Trạng thái đơn hàng / Order Status")}</h2>
              ${dashboardMetrics.statusBreakdown.length ? html`
                <div className="dashboard-breakdown">
                  <div className="dashboard-donut dashboard-donut-status" style=${{
                    background: statusGradient
                  }}>
                    <strong>${dashboardMetrics.statusBreakdown.reduce(function (sum, item) { return sum + item.orders; }, 0)}</strong>
                    <small>${L("Tổng đơn / Orders")}</small>
                  </div>
                  <div className="list-stack compact-list">
                    ${dashboardMetrics.statusBreakdown.map(function (item) {
                      var totalStatusOrders = dashboardMetrics.statusBreakdown.reduce(function (sum, current) { return sum + current.orders; }, 0);
                      var pct = totalStatusOrders ? Math.round(item.orders / totalStatusOrders * 1000) / 10 : 0;
                      var color = statusColors[item.id] || statusColors.other;
                      return html`
                        <article className="dashboard-breakdown-row" key=${item.id}>
                          <span style=${{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <span style=${{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }}></span>
                            ${L(item.label)}
                          </span>
                          <strong>${pct}%</strong>
                          <small>${item.orders} ${L("đơn / orders")}</small>
                        </article>
                      `;
                    })}
                  </div>
                </div>
              ` : html`<div className="empty-state">${L("Chưa có trạng thái đơn trong khoảng này. / No order statuses in this range.")}</div>`}
            </article>
          </section>

          ${dashboardMetrics.lowStock.length ? html`
            <section className="surface section-card">
              <div className="section-top">
                <div>
                  <p className="eyebrow">${L("Kho hàng / Inventory")}</p>
                  <h2 className="section-title">${L("Cảnh báo tồn kho / Stock Alerts")}</h2>
                </div>
              </div>
              <div className="list-stack">
                ${dashboardMetrics.lowStock.map(function (item) {
                  return html`
                    <article key=${item.id} className="list-row">
                      <div>
                        <strong>${item.type === "component" ? L("Nguyên liệu / Ingredient") : L("Sản phẩm / Product")}: ${item.label}</strong>
                        <p>${item.meta} · ${L("min")}: ${formatQuantity(item.min, 2)} ${item.unit || ""}</p>
                      </div>
                      <span className="stock-badge" style=${{ color: "#c0392b" }}>${formatQuantity(item.qty, 2)} ${item.unit || ""} ${L("còn / left")}</span>
                    </article>
                  `;
                })}
              </div>
            </section>
          ` : null}

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
              </div>
            </div>

            <div className="empty-state align-left">
              ${L("Nút này xuất một file ZIP sao lưu đầy đủ gồm CSV, schema.json và export_log.json. / This exports one full backup ZIP with CSV files, schema.json, and export_log.json.")}
            </div>
          </section>
        </section>
      `;
    }

    function renderInventoryView() {
      var totalStock = products.reduce(function (sum, product) {
        return sum + (Number(product.stock) || 0);
      }, 0);
      // Previously this filter was a hardcoded `stock <= 10`, which caused a
      // confusing bug: if you typed 11+ into a product's stock input it would
      // INSTANTLY disappear from this list (it no longer matched the filter).
      // Now we use the same rule as the global low-stock badge:
      //   • only show products with min_stock > 0 (admin has set a threshold)
      //   • and current stock at/below that threshold
      // Products without a min_stock are NEVER hidden here.
      var lowStockAlertsForCheck = lowStockAlerts;
      var allProductsSelected = products.length > 0 && selectedProductIds.length === products.length;
      var convertibleProducts = getConvertibleProducts();
      var conversionProduct = getConversionProduct();
      var conversionComponent = getConversionComponent();
      var conversionProductQty = Math.max(0, Number(conversionDraft.productQty) || 0);
      var conversionComponentQty = Math.max(0, Number(conversionDraft.componentQty) || conversionProductQty);
      var conversionSourceStock = conversionProduct
        ? (Number(conversionProduct.rawStock != null ? conversionProduct.rawStock : conversionProduct.stock) || 0)
        : 0;
      var conversionComponentStock = conversionComponent ? (Number(conversionComponent.stockQty) || 0) : 0;
      var semiFinishedComponents = components.filter(function (component) {
        return component.itemType === "semi_finished";
      });
      var selectedProductionRecipe = productionRecipes.find(function (recipe) {
        return recipe.id === productionBatchDraft.recipeId;
      }) || null;
      var selectedProductionBatchAddOnIds = Array.isArray(productionBatchDraft.addOnIds)
        ? productionBatchDraft.addOnIds
        : [];
      var selectedProductCategory = categories.find(function (category) {
        return category.id === productDraft.category;
      }) || null;

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
            ${inventorySection === "stock_ops" ? renderStockOperationsView() : null}

            ${inventorySection === "stock" ? html`
              <div className="settings-nav" style=${{ marginBottom: 16 }}>
                <button
                  type="button"
                  className=${"settings-nav-btn" + (stockCheckTab === "check" ? " is-active" : "")}
                  onClick=${function () { setStockCheckTab("check"); }}
                >${L("Kiểm hàng / Stock Check")}</button>
                <button
                  type="button"
                  className=${"settings-nav-btn" + (stockCheckTab === "ledger" ? " is-active" : "")}
                  onClick=${function () { setStockCheckTab("ledger"); refreshMovements(); }}
                >${L("Sổ cái / Ledger")}</button>
                <button
                  type="button"
                  className=${"settings-nav-btn" + (stockCheckTab === "stocktake" ? " is-active" : "")}
                  onClick=${function () { setStockCheckTab("stocktake"); }}
                >${L("Kiểm kê / Stocktake")}</button>
              </div>
            ` : null}

            ${inventorySection === "stock" && stockCheckTab === "check" ? html`
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
                    <strong>${lowStockAlertsForCheck.length}</strong>
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
                      ${lowStockAlertsForCheck.length
                        ? lowStockAlertsForCheck.map(function (item) {
                            if (item.type === "component") {
                              var component = components.find(function (currentComponent) {
                                return "component-" + currentComponent.id === item.id;
                              }) || {};
                              return html`
                                <article key=${item.id} className="list-row list-row-actions stock-check-row">
                                  <div className="stock-check-meta">
                                    <strong>🧺 ${item.label}</strong>
                                    <p>${L("Nguyên liệu / Ingredient")} · ${item.meta}</p>
                                  </div>
                                  <div className="row-actions stock-editor">
                                    <span className="stock-badge" style=${{ color: "#c0392b" }}>${formatQuantity(item.qty, 2)} ${item.unit || ""} / ${formatQuantity(item.min, 2)}</span>
                                    <button className="ghost-btn" onClick=${function () { startEditComponent(component); }}>${L("Sửa / Edit")}</button>
                                  </div>
                                </article>
                              `;
                            }
                            var product = products.find(function (currentProduct) {
                              return "product-" + currentProduct.id === item.id;
                            }) || {};
                            var category = categories.find(function (item) {
                              return item.id === product.category;
                            });
                            return html`
                              <article key=${item.id} className="list-row list-row-actions stock-check-row">
                                <div className="stock-check-meta">
                                  <strong>${product.imageIcon || "🛒"} ${product.name}</strong>
                                  <p>${category ? L(category.label) : product.category} · ${product.barcode}</p>
                                </div>
                                <div className="row-actions stock-editor">
                                  ${product.inventoryMode === "recipe" ? html`<span className="stock-badge" title="Tồn ảo / Virtual stock" style=${{ background: "#f0f0f0", color: "#555" }}>${product.stock}</span>` : product.inventoryMode === "stock" ? html`<${LocalNumberInput}
                                    min="0"
                                    step=${qtyInputStep(product.unit)}
                                    value=${product.stock}
                                    onChange=${function (val) {
                                      updateProductStock(product.id, val);
                                    }}
                                    onBlur=${function () { flushPendingStockEdit(product.id); }}
                                  />` : html`<span className="stock-badge" style=${{ background: "#fff3d8", color: "#a86a18" }}>${L("Chưa chọn loại / Unclassified")}</span>`}
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

                    <!-- Search box: name / barcode / SKU, accent-insensitive -->
                    <div className="field" style=${{ marginBottom: 12 }}>
                      <input
                        type="search"
                        value=${inventorySearchTerm}
                        placeholder=${L("Tìm tên SP / barcode / SKU... (gõ không dấu cũng được) / Search name / barcode / SKU (accent-insensitive)")}
                        onInput=${function (e) { setInventorySearchTerm(e.target.value); }}
                        style=${{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #e5d5c7", fontSize: 14 }}
                      />
                      ${inventorySearchTerm
                        ? html`<small style=${{ color: "#7b6b5d", marginTop: 4, display: "block" }}>
                            ${(function () {
                              var nq = normalizeSearchText(inventorySearchTerm);
                              var n = products.filter(function (p) { return productMatchesQuery(p, nq); }).length;
                              return n + " " + L("kết quả / matches");
                            })()}
                            · <a href="#" onClick=${function (e) { e.preventDefault(); setInventorySearchTerm(""); }}>${L("Xóa / Clear")}</a>
                          </small>`
                        : null}
                    </div>

                    <div className="list-stack">
                      ${(function () {
                        var nq = normalizeSearchText(inventorySearchTerm);
                        return products.filter(function (p) { return productMatchesQuery(p, nq); });
                      })().map(function (product) {
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
                              <strong>${product.imageIcon || "🛒"} ${product.name}</strong>
                              <p>
                                ${product.barcode} · ${category ? L(category.label) : product.category}
                                ${product.inventoryMode === "recipe"
                                  ? " · " + L("Pha chế / Recipe-based")
                                  : product.inventoryMode === "stock"
                                    ? " · " + L("Bán lẻ / Direct Stock")
                                    : " · " + L("Chưa chọn loại / Unclassified")}
                              </p>
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
                              <span className="stock-badge" title=${product.inventoryMode === "recipe" ? L("Tồn khả dụng tính theo nguyên liệu / Available stock based on ingredients") : L("Tồn kho thật / Direct stock")}>
                                ${product.inventoryMode === "recipe" ? L("Có thể bán / Available") + ": " : L("Tồn / Stock") + ": "}${product.stock}
                              </span>
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

            ${inventorySection === "stock" && stockCheckTab === "ledger" ? html`
              <section className="surface section-card">
                <div className="section-top">
                  <h2 className="section-title">${L("Sổ cái chuyển động kho / Stock Movement Ledger")}</h2>
                  <button className="ghost-btn" onClick=${function () { refreshMovements(); }}>${L("Tải lại / Reload")}</button>
                </div>
                <div className="management-list">
                  ${movements.length === 0
                    ? html`<p style=${{ color: "#7b6b5d" }}>${L("Chưa có chuyển động. / No movements yet.")}</p>`
                    : movements.map(function (m) {
                        var sign = m.qty_change > 0 ? "+" : "";
                        return html`
                          <article key=${m.id} className="list-row list-row-actions">
                            <div>
                              <strong>${m.product_name || m.product_id}</strong>
                              <p>${formatMovementType(m.movement_type)} · ${formatDateTime(m.created_at)} ${m.ref_id ? " · " + m.ref_id : ""}</p>
                            </div>
                            <strong style=${{ color: m.qty_change > 0 ? "#1f8a3a" : "#c0392b" }}>${sign}${m.qty_change}</strong>
                          </article>
                        `;
                      })}
                </div>
              </section>
            ` : null}

            ${inventorySection === "stock" && stockCheckTab === "stocktake" ? html`
              <section className="surface section-card">
                <h2 className="section-title">${L("Kiểm kê / Stocktake")}</h2>
                <p style=${{ color: "#7b6b5d" }}>${L("Nhập số lượng thực tế. Hệ thống sẽ tự sinh phiếu điều chỉnh tăng/giảm. / Enter actual quantity. The system will create adjustment entries.")}</p>
                <div className="management-list">
                  ${products.map(function (p) {
                    var actual = stocktakeDraft[p.id];
                    var diff = (actual === undefined || actual === "") ? null : normalizeQtyForUnit(actual, p.unit) - (Number(p.stock) || 0);
                    return html`
                      <article key=${p.id} className="list-row list-row-actions">
                        <div>
                          <strong>${p.image} ${p.name}</strong>
                          <p>${L("Tồn hệ thống / System stock")}: ${p.stock || 0}</p>
                        </div>
                        <div className="row-actions">
                          <label className="field" style=${{ width: 110 }}>
                            <span>${L("Thực tế / Actual")}</span>
                            <input type="number" min="0" step=${qtyInputStep(p.unit)} value=${actual === undefined ? "" : actual} onInput=${function (e) {
                              var val = e.target.value;
                              setStocktakeDraft(function (cur) { var next = Object.assign({}, cur); next[p.id] = val; return next; });
                            }} />
                          </label>
                          ${diff !== null && diff !== 0
                            ? html`<strong style=${{ color: diff > 0 ? "#1f8a3a" : "#c0392b" }}>${diff > 0 ? "+" : ""}${diff}</strong>`
                            : null}
                        </div>
                      </article>
                    `;
                  })}
                </div>
                <div className="section-top" style=${{ marginTop: 18 }}>
                  <button className="ghost-btn" onClick=${function () { setStocktakeDraft({}); }}>${L("Xóa nháp / Clear draft")}</button>
                  <button className="primary-btn" onClick=${submitStocktake}>${L("Ghi nhận kiểm kê / Submit Stocktake")}</button>
                </div>
              </section>
            ` : null}

            ${inventorySection === "components" && componentWorkspaceMode === "convert" ? html`
              <div className="stack-view">
                <section className="surface section-card form-card">
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Chuyển đổi tồn kho / Stock Conversion")}</p>
                      <h2 className="section-title">${L("Chuyển hộp retail sang thành phần / Convert Retail Stock to Component")}</h2>
                      <p className="muted-copy">
                        ${L("Dùng khi trái cây cắt sẵn/hộp bán lẻ còn tồn nhưng cần chuyển sang nguyên liệu pha chế trong ngày. / Use this when pre-cut retail boxes should become same-day prep ingredients.")}
                      </p>
                    </div>
                  </div>

                  <form className="conversion-board" onSubmit=${submitStockConversion}>
                    <article className="conversion-panel">
                      <span className="conversion-step">1</span>
                      <h3>${L("Chọn hàng retail / Select Retail Stock")}</h3>
                      <label className="field">
                        <span>${L("Sản phẩm còn tồn / In-stock Product")}</span>
                        <select
                          value=${conversionDraft.productId || (convertibleProducts[0] && convertibleProducts[0].id) || ""}
                          onChange=${function (event) { updateConversionDraft("productId", event.target.value); }}
                        >
                          ${convertibleProducts.map(function (product) {
                            var category = categories.find(function (item) { return item.id === product.category; });
                            var stock = Number(product.rawStock != null ? product.rawStock : product.stock) || 0;
                            return html`
                              <option key=${product.id} value=${product.id}>
                                ${product.name} · ${stock} ${product.unit || L("món")}
                                ${category ? " · " + L(category.label) : ""}
                              </option>
                            `;
                          })}
                        </select>
                        ${!convertibleProducts.length ? html`
                          <small>${L("Chưa có sản phẩm retail nào còn tồn để chuyển. / No in-stock retail products available to convert.")}</small>
                        ` : null}
                      </label>
                      <label className="field">
                        <span>${L("Số lượng chuyển / Quantity to Convert")}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value=${conversionDraft.productQty}
                          onInput=${function (event) { updateConversionDraft("productQty", event.target.value); }}
                        />
                        <small>
                          ${conversionProduct
                            ? L("Tồn hiện tại / Current stock") + ": " + conversionSourceStock + (conversionProduct.unit ? " " + conversionProduct.unit : "")
                            : L("Chọn sản phẩm trước. / Select a product first.")}
                        </small>
                      </label>
                    </article>

                    <article className="conversion-panel">
                      <span className="conversion-step">2</span>
                      <h3>${L("Chọn thành phần nhận / Select Target Component")}</h3>
                      <div className="toggle-grid">
                        <button
                          type="button"
                          className=${"ghost-btn" + (conversionDraft.componentMode !== "new" ? " active-toggle" : "")}
                          onClick=${function () { updateConversionDraft("componentMode", "existing"); }}
                        >
                          ${L("Có sẵn / Existing")}
                        </button>
                        <button
                          type="button"
                          className=${"ghost-btn" + (conversionDraft.componentMode === "new" ? " active-toggle" : "")}
                          onClick=${function () { updateConversionDraft("componentMode", "new"); }}
                        >
                          ${L("Tạo mới / New")}
                        </button>
                      </div>

                      ${conversionDraft.componentMode === "new" ? html`
                        <div className="field-grid">
                          <label className="field">
                            <span>${L("Tên TV / Vietnamese Name")}</span>
                            <input
                              value=${conversionDraft.componentLabelVi}
                              placeholder=${L("VD: Xoài cắt sẵn")}
                              onInput=${function (event) { updateConversionDraft("componentLabelVi", event.target.value); }}
                            />
                          </label>
                          <label className="field">
                            <span>${L("Tên EN / English Name")}</span>
                            <input
                              value=${conversionDraft.componentLabelEn}
                              placeholder="Cut mango prep"
                              onInput=${function (event) { updateConversionDraft("componentLabelEn", event.target.value); }}
                            />
                          </label>
                        </div>
                      ` : html`
                        <label className="field">
                          <span>${L("Thành phần / Component")}</span>
                          <select
                            value=${conversionDraft.componentId || (components[0] && components[0].id) || ""}
                            onChange=${function (event) { updateConversionDraft("componentId", event.target.value); }}
                          >
                            ${components.map(function (component) {
                              return html`
                                <option key=${component.id} value=${component.id}>
                                  ${L(component.label)} · ${component.isUnlimitedStock ? L("Không giới hạn / Unlimited") : ((Number(component.stockQty) || 0) + " " + (component.unit || ""))}
                                </option>
                              `;
                            })}
                          </select>
                        </label>
                      `}

                      <div className="field-grid">
                        <label className="field">
                          <span>${L("Lượng nhận / Received Qty")}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value=${conversionDraft.componentQty}
                            placeholder=${String(conversionProductQty || 1)}
                            onInput=${function (event) { updateConversionDraft("componentQty", event.target.value); }}
                          />
                        </label>
                        <label className="field">
                          <span>${L("Đơn vị / Unit")}</span>
                          <input
                            value=${conversionDraft.componentUnit || (conversionComponent && conversionComponent.unit) || ""}
                            placeholder=${L("gram, ml, phần...")}
                            onInput=${function (event) { updateConversionDraft("componentUnit", event.target.value); }}
                          />
                        </label>
                      </div>

                      <div className="field-grid">
                        <label className="field">
                          <span>${L("Hạn dùng sau chuyển / Use Within")}</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value=${conversionDraft.expiryDays}
                            onInput=${function (event) { updateConversionDraft("expiryDays", event.target.value); }}
                          />
                          <small>${L("0 = dùng trong ngày. / 0 = same-day use.")}</small>
                        </label>
                        <label className="field">
                          <span>${L("Ghi chú / Note")}</span>
                          <input
                            value=${conversionDraft.note}
                            placeholder=${L("VD: chuyển từ hộp gần hết hạn")}
                            onInput=${function (event) { updateConversionDraft("note", event.target.value); }}
                          />
                        </label>
                      </div>
                    </article>

                    <aside className="conversion-summary">
                      <p className="eyebrow">${L("Xem trước / Preview")}</p>
                      <h3>${L("Sau khi chuyển / After Conversion")}</h3>
                      <div className="conversion-preview-row">
                        <span>${conversionProduct ? conversionProduct.name : L("Sản phẩm")}</span>
                        <strong>${formatQuantity(conversionSourceStock)} → ${formatQuantity(Math.max(0, conversionSourceStock - conversionProductQty))}</strong>
                      </div>
                      <div className="conversion-preview-row">
                        <span>
                          ${conversionDraft.componentMode === "new"
                            ? (buildBilingualLabel(conversionDraft.componentLabelVi, conversionDraft.componentLabelEn) || L("Thành phần mới / New component"))
                            : (conversionComponent ? L(conversionComponent.label) : L("Thành phần / Component"))}
                        </span>
                        <strong>
                          ${formatQuantity(conversionDraft.componentMode === "new" ? 0 : conversionComponentStock)}
                          → ${formatQuantity((conversionDraft.componentMode === "new" ? 0 : conversionComponentStock) + conversionComponentQty)}
                        </strong>
                      </div>
                      <p className="muted-copy">
                        ${L("Hệ thống sẽ ghi sổ chuyển đổi và giữ báo cáo tồn kho rõ ràng. / The system records the conversion so stock reports stay clean.")}
                      </p>
                      <button type="submit" className="primary-btn" disabled=${!convertibleProducts.length}>
                        ${L("Chuyển sang thành phần / Convert to Component")}
                      </button>
                    </aside>
                  </form>
                </section>
              </div>
            ` : null}

            ${inventorySection === "production" ? html`
              <div className="stack-view">
                <div className="split-grid">
                  <section className="surface section-card form-card">
                    <div className="section-top">
                      <div>
                        <p className="eyebrow">${L("Công thức sơ chế / Production Recipes")}</p>
                        <h2 className="section-title">${productionRecipeDraft.id ? L("Sửa công thức sơ chế / Edit Prep Recipe") : L("Tạo công thức sơ chế / Create Prep Recipe")}</h2>
                      </div>
                      ${productionRecipeDraft.id ? html`<button type="button" className="ghost-btn" onClick=${resetProductionRecipeDraft}>${L("Hủy / Cancel")}</button>` : null}
                    </div>
                    <form className="form-card" onSubmit=${submitProductionRecipe}>
                      <div className="field-grid">
                        <label className="field">
                          <span>${L("Tên công thức / Recipe Name")}</span>
                          <input value=${productionRecipeDraft.name} onInput=${function (event) { updateProductionRecipeDraft("name", event.target.value); }} placeholder="Sugar Syrup" />
                        </label>
                        <label className="field">
                          <span>${L("Output bán thành phẩm / Semi-finished Output")}</span>
                          <select value=${productionRecipeDraft.outputComponentId} onChange=${function (event) { updateProductionRecipeDraft("outputComponentId", event.target.value); }}>
                            <option value="">${L("Chọn output / Select output")}</option>
                            ${semiFinishedComponents.map(function (component) {
                              return html`<option key=${component.id} value=${component.id}>${L(component.label)} · ${component.unit || ""}</option>`;
                            })}
                          </select>
                          <small>${L("Output phải được đánh dấu là Bán thành phẩm trong Thành phần. / Output must be marked Semi-finished in Components.")}</small>
                        </label>
                        <label className="field">
                          <span>${L("Sản lượng dự kiến / Planned Output")}</span>
                          <input type="number" min="0" step="0.1" value=${productionRecipeDraft.plannedOutputQty} onInput=${function (event) { updateProductionRecipeDraft("plannedOutputQty", event.target.value); }} />
                        </label>
                        <label className="field">
                          <span>${L("Đơn vị output / Output Unit")}</span>
                          <input value=${productionRecipeDraft.outputUnit} readOnly />
                        </label>
                      </div>

                      <div className="section-top" style=${{ marginTop: 8 }}>
                        <div>
                          <p className="eyebrow">${L("Inputs / Inputs")}</p>
                          <h3 className="template-preview-title">${L("Nguyên liệu đầu vào / Input Items")}</h3>
                        </div>
                        <button type="button" className="ghost-btn" onClick=${addProductionRecipeInput}>+ ${L("Thêm input / Add Input")}</button>
                      </div>

                      <div className="list-stack">
                        ${(productionRecipeDraft.inputs || []).length ? productionRecipeDraft.inputs.map(function (input, index) {
                          var inputComponent = components.find(function (component) { return component.id === input.componentId; });
                          return html`
                            <article key=${index} className="list-row list-row-actions" style=${{ flexWrap: "wrap" }}>
                              <label className="field" style=${{ flex: "2 1 220px", margin: 0 }}>
                                <span>${L("Thành phần / Component")}</span>
                                <select value=${input.componentId} onChange=${function (event) { updateProductionRecipeInput(index, "componentId", event.target.value); }}>
                                  ${components.filter(function (component) {
                                    return component.id !== productionRecipeDraft.outputComponentId;
                                  }).map(function (component) {
                                    return html`<option key=${component.id} value=${component.id}>${L(component.label)} · ${L(getComponentItemTypeLabel(component.itemType))}</option>`;
                                  })}
                                </select>
                              </label>
                              <label className="field" style=${{ width: 120, margin: 0 }}>
                                <span>${L("SL / Qty")}</span>
                                <input type="number" min="0" step="0.1" value=${input.qty} onInput=${function (event) { updateProductionRecipeInput(index, "qty", event.target.value); }} />
                              </label>
                              <label className="field" style=${{ width: 120, margin: 0 }}>
                                <span>${L("Đơn vị / Unit")}</span>
                                <input value=${(inputComponent && inputComponent.unit) || input.unit || ""} readOnly />
                              </label>
                              <button type="button" className="ghost-btn danger-text" onClick=${function () { removeProductionRecipeInput(index); }}>${L("Xóa / Remove")}</button>
                            </article>
                          `;
                        }) : html`<div className="empty-state align-left">${L("Chưa có input. / No inputs yet.")}</div>`}
                      </div>

                      <label className="field">
                        <span>${L("Ghi chú / Note")}</span>
                        <input value=${productionRecipeDraft.note} onInput=${function (event) { updateProductionRecipeDraft("note", event.target.value); }} />
                      </label>
                      <button type="submit" className="primary-btn">${productionRecipeDraft.id ? L("Lưu công thức / Save Recipe") : L("Tạo công thức / Create Recipe")}</button>
                    </form>
                  </section>

                  <section className="surface section-card">
                    <div className="section-top">
                      <div>
                        <p className="eyebrow">${L("Danh sách / List")}</p>
                        <h2 className="section-title">${L("Công thức đang dùng / Active Production Recipes")}</h2>
                      </div>
                    </div>
                    <div className="list-stack">
                      ${productionRecipes.length ? productionRecipes.map(function (recipe) {
                        var output = components.find(function (component) { return component.id === recipe.outputComponentId; });
                        return html`
                          <article key=${recipe.id} className="list-row list-row-actions">
                            <div>
                              <strong>${recipe.name}</strong>
                              <p>${L("Output")}: ${output ? L(output.label) : recipe.outputComponentId} · ${recipe.plannedOutputQty} ${recipe.outputUnit}</p>
                              <p>${(recipe.inputs || []).length} ${L("inputs / inputs")}</p>
                            </div>
                            <div className="row-actions">
                              <button className="ghost-btn" onClick=${function () { startEditProductionRecipe(recipe); }}>${L("Sửa / Edit")}</button>
                              <button className="ghost-btn danger-text" onClick=${function () { removeProductionRecipe(recipe.id); }}>${L("Ẩn / Deactivate")}</button>
                            </div>
                          </article>
                        `;
                      }) : html`<div className="empty-state">${L("Chưa có công thức sơ chế. / No production recipes yet.")}</div>`}
                    </div>
                  </section>
                </div>

                <section className="surface section-card form-card">
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Tạo mẻ / Produce Batch")}</p>
                      <h2 className="section-title">${L("Sơ chế bán thành phẩm / Produce Semi-finished Item")}</h2>
                    </div>
                  </div>
                  <form className="form-card" onSubmit=${submitProductionBatch}>
                    <div className="field-grid">
                      <label className="field">
                        <span>${L("Công thức / Recipe")}</span>
                        <select value=${productionBatchDraft.recipeId || ""} onChange=${function (event) { updateProductionBatchDraft("recipeId", event.target.value); }}>
                          <option value="">${L("Chọn công thức / Select recipe")}</option>
                          ${productionRecipes.map(function (recipe) {
                            return html`<option key=${recipe.id} value=${recipe.id}>${recipe.name}</option>`;
                          })}
                        </select>
                      </label>
                      <label className="field">
                        <span>${L("Sản lượng thực tế / Actual Output")}</span>
                        <input type="number" min="0" step="0.1" value=${productionBatchDraft.actualOutputQty} placeholder=${selectedProductionRecipe ? String(selectedProductionRecipe.plannedOutputQty) : ""} onInput=${function (event) { updateProductionBatchDraft("actualOutputQty", event.target.value); }} />
                      </label>
                      <label className="field">
                        <span>${L("Ghi chú / Note")}</span>
                        <input value=${productionBatchDraft.note} onInput=${function (event) { updateProductionBatchDraft("note", event.target.value); }} />
                      </label>
                    </div>

                    <div className="empty-state align-left">
                      <strong>${L("Ngày giờ tạo mẻ / Batch time")}:</strong> ${formatDateTime(nowTick)}
                    </div>

                    ${selectedProductionRecipe ? html`
                      <div className="split-grid">
                        <div className="empty-state align-left">
                          <strong>${L("Output / Output")}:</strong>
                          ${(function () {
                            var output = components.find(function (component) { return component.id === selectedProductionRecipe.outputComponentId; });
                            return " " + (output ? L(output.label) : selectedProductionRecipe.outputComponentId) + " · " + selectedProductionRecipe.plannedOutputQty + " " + selectedProductionRecipe.outputUnit;
                          })()}
                        </div>
                        <div className="empty-state align-left">
                          <strong>${L("Inputs / Inputs")}:</strong>
                          ${(selectedProductionRecipe.inputs || []).map(function (input) {
                            var component = components.find(function (item) { return item.id === input.componentId; });
                            return (component ? L(component.label) : input.componentId) + " " + input.qty + input.unit;
                          }).join(", ")}
                        </div>
                      </div>
                    ` : null}

                    <button type="submit" className="primary-btn" disabled=${!productionRecipes.length}>${L("Produce / Save Batch")}</button>
                  </form>

                  ${lastProductionResult ? html`
                    <div className="empty-state align-left">
                      <strong>${L("Mẻ vừa tạo / Last Batch")}:</strong> ${lastProductionResult.id}<br/>
                      ${L("Tổng cost input / Total input cost")}: ${formatCurrency(lastProductionResult.totalInputCost || 0)} ·
                      ${L("Cost thực tế / Actual cost per unit")}: ${formatCurrency(lastProductionResult.actualCostPerUnit || 0)}
                    </div>
                  ` : null}
                </section>

                <section className="surface section-card">
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Lịch sử / History")}</p>
                      <h2 className="section-title">${L("Mẻ sơ chế gần đây / Recent Production Batches")}</h2>
                    </div>
                  </div>
                  <div className="list-stack">
                    ${productionBatches.length ? productionBatches.slice(0, 20).map(function (batch) {
                      var output = components.find(function (component) { return component.id === batch.outputComponentId; });
                      return html`
                        <article key=${batch.id} className="list-row">
                          <div>
                            <strong>${batch.recipeName || batch.recipeId}</strong>
                            <p>${formatDateTime(batch.createdAt)} · ${(output ? L(output.label) : batch.outputComponentId)} +${batch.actualOutputQty} ${batch.outputUnit}</p>
                            ${(batch.addOns || []).length ? html`
                              <p>${L("Add-ons / Add-ons")}: ${(batch.addOns || []).map(function (addOn) {
                                return L(addOn.label || addOn.id);
                              }).join(", ")}</p>
                            ` : null}
                          </div>
                          <strong>${formatCurrency(batch.actualCostPerUnit || 0)} / ${batch.outputUnit}</strong>
                        </article>
                      `;
                    }) : html`<div className="empty-state">${L("Chưa có mẻ sơ chế. / No production batches yet.")}</div>`}
                  </div>
                </section>
              </div>
            ` : null}

            ${inventorySection === "product" ? html`
              <div className="stack-view" style=${{ gap: 16 }}>
                <form
                  className="surface section-card form-card"
                  style=${{ alignSelf: "start" }}
                  onSubmit=${submitProduct}
                >
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Sản phẩm / Product")}</p>
                      <h2 className="section-title">${productDraft.id ? L("Cập nhật sản phẩm / Update Product") : L("Thêm sản phẩm mới / Add Product")}</h2>
                      <small style=${{ color: "#7b6b5d" }}>
                        ${productDraft.id
                          ? L("Đang sửa SP có ID này / Editing product with this ID")
                          : L("Điền các trường rồi nhấn 'Thêm vào kho' / Fill the fields and submit")}
                      </small>
                    </div>
                    ${productDraft.id
                      ? html`<button type="button" className="ghost-btn" onClick=${resetProductDraft}>${L("Hủy / Cancel")}</button>`
                      : null}
                  </div>

                  <!-- Group: Identity -->
                  <fieldset style=${{ border: "1px dashed #e5d5c7", borderRadius: 14, padding: "12px 16px 16px", margin: 0 }}>
                    <legend style=${{ padding: "0 8px", color: "#8a7565", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>${L("Định danh / Identity")}</legend>

                    <!-- ID nội bộ — editable cả khi tạo mới VÀ khi sửa SP cũ.
                         Khi save, nếu ID đã đổi so với ID cũ → client gọi
                         /api/products/rename trước, rồi mới upsert fields. -->
                    <label className="field" style=${{ marginBottom: 12 }}>
                      <span>
                        ${L("ID nội bộ / Internal ID")}
                        ${productDraft.id ? html`<span style=${{ fontSize: 10, marginLeft: 6, padding: "2px 6px", background: "#fff8e0", borderRadius: 8, color: "#a47218" }}>✎ ${L("Sửa được / Editable")}</span>` : null}
                      </span>
                      <input
                        value=${productDraft.customId !== undefined ? productDraft.customId : (productDraft.id || "")}
                        placeholder=${L("Ví dụ ORIA61050 (để trống = tự sinh) / e.g. ORIA61050 (blank = auto)")}
                        onInput=${function (event) {
                          var cleaned = String(event.target.value || "")
                            .toUpperCase()
                            .replace(/[^A-Z0-9_-]/g, "");
                          updateProductDraft("customId", cleaned);
                          updateProductDraft("idTouched", true);
                          // Khi đang tạo mới, nếu user chưa sửa SKU thì auto đồng bộ SKU = ID
                          if (!productDraft.id && (!productDraft.skuTouched)) {
                            updateProductDraft("skuCode", cleaned);
                          }
                        }}
                      />
                      <small>
                        ${productDraft.id
                          ? html`${L("⚠ Đổi ID sẽ cập nhật toàn bộ liên kết hóa đơn/tồn kho/sổ cái sang ID mới. / Renaming the ID will cascade-update every invoice / inventory / ledger reference.")}<br/>
                            <strong>${L("ID hiện tại / Current")}: ${productDraft.id}</strong>`
                          : html`${L("Hệ thống tự đề xuất mã ORIA theo danh mục bạn chọn. / Auto-suggested ORIA code based on category.")}
                            ${(function () {
                              var s = suggestOriaIdForCategory(productDraft.category);
                              return s ? html` <strong style=${{ color: "#a45318" }}>→ ${L("gợi ý / suggested")}: ${s}</strong>` : null;
                            })()}`}
                      </small>
                    </label>

                    <!-- SKU (business code — printed on barcode, can change anytime) -->
                    <label className="field" style=${{ marginBottom: 12 }}>
                      <span>${L("Mã SP / SKU code")}</span>
                      <input
                        value=${productDraft.skuCode || ""}
                        placeholder=${L("Mã in tem (vd ORIA61050) / Code shown on label (e.g. ORIA61050)")}
                        onInput=${function (event) {
                          updateProductDraft("skuCode", String(event.target.value || "").toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
                          updateProductDraft("skuTouched", true);
                        }}
                      />
                      <small>
                        ${L("Mã in tem barcode, có thể đổi bất kỳ lúc nào. Mặc định = ID nội bộ. / Code printed on labels — changeable anytime. Defaults to Internal ID.")}
                      </small>
                    </label>

                    <div className="field-grid">
                      <label className="field" style=${{ gridColumn: "1 / -1" }}>
                        <span>${L("Tên sản phẩm / Product Name")}</span>
                        <input value=${productDraft.name} onInput=${function (event) { updateProductDraft("name", event.target.value); }} required />
                      </label>
                      <label className="field">
                        <span>${L("Danh mục / Category")}</span>
                        <select value=${productDraft.category} onChange=${function (event) { updateProductDraft("category", event.target.value); }}>
                          ${categories.map(function (item) {
                            return html`<option key=${item.id} value=${item.id}>${item.icon || "🛒"} ${L(item.label)}</option>`;
                          })}
                        </select>
                      </label>
                      <label className="field">
                        <span>${L("URL ảnh sản phẩm / Product Image URL")}</span>
                        <input
                          value=${productDraft.image}
                          placeholder=${L("Dán URL ảnh để hiện trong Bán hàng / Paste image URL for POS")}
                          onInput=${function (event) { updateProductDraft("image", event.target.value); }}
                        />
                        <small>
                          ${L("Nếu để trống URL, hệ thống sẽ dùng icon danh mục. / Leave blank to use a category icon instead.")}
                        </small>
                      </label>
                      <label className="field">
                        <span>${L("Icon thay thế / Fallback Icon")}</span>
                        <select
                          value=${isProductImageUrl(productDraft.image) ? (selectedProductCategory ? selectedProductCategory.icon || "🛒" : "🛒") : (productDraft.image || (selectedProductCategory ? selectedProductCategory.icon || "🛒" : "🛒"))}
                          onChange=${function (event) { updateProductDraft("image", event.target.value); }}
                        >
                          ${productDraft.image && !isProductImageUrl(productDraft.image) && !CATEGORY_ICON_OPTIONS.some(function (item) { return item.value === productDraft.image; })
                            ? html`<option value=${productDraft.image}>${productDraft.image} ${L("Icon hiện tại / Current Icon")}</option>`
                            : null}
                          ${CATEGORY_ICON_OPTIONS.map(function (item) {
                            return html`<option key=${item.value} value=${item.value}>${item.value} ${L(item.label)}</option>`;
                          })}
                        </select>
                        <small>${L("Dùng khi sản phẩm chưa có URL ảnh. / Used when the product has no image URL.")}</small>
                      </label>
                      <div className="product-image-preview">
                        ${isProductImageUrl(productDraft.image)
                          ? html`<img src=${productDraft.image} alt=${productDraft.name || ""} />`
                          : html`<span>${productDraft.image || (selectedProductCategory && selectedProductCategory.icon) || "🛒"}</span>`}
                        <small>${L("Preview POS / POS Preview")}</small>
                      </div>
                      <div className="row-actions" style=${{ alignSelf: "end", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="ghost-btn"
                          disabled=${!selectedProductCategory}
                          onClick=${function () {
                            if (selectedProductCategory) updateProductDraft("image", selectedProductCategory.icon || "🛒");
                          }}
                        >
                          ${L("Dùng icon danh mục / Use Category Icon")}
                        </button>
                      </div>
                    </div>
                  </fieldset>

                  <!-- Group: Price + stock -->
                  <fieldset style=${{ border: "1px dashed #e5d5c7", borderRadius: 14, padding: "12px 16px 16px", margin: 0 }}>
                    <legend style=${{ padding: "0 8px", color: "#8a7565", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>${L("Giá & Tồn kho / Pricing & Stock")}</legend>
                    <div className="toggle-grid" style=${{ marginBottom: 12 }}>
                      <button
                        type="button"
                        className=${"ghost-btn" + (productDraft.inventoryMode === "stock" ? " active-toggle" : "")}
                        onClick=${function () { updateProductDraft("inventoryMode", "stock"); }}
                      >
                        ${L("Hàng bán lẻ / Direct Stock")}
                      </button>
                      <button
                        type="button"
                        className=${"ghost-btn" + (productDraft.inventoryMode === "recipe" ? " active-toggle" : "")}
                        onClick=${function () { updateProductDraft("inventoryMode", "recipe"); }}
                      >
                        ${L("Đồ pha chế / Track by Ingredients")}
                      </button>
                    </div>
                    <div className="field-grid">
                      <label className="field">
                        <span>${L("Giá bán / Price")}</span>
                        <input type="number" min="0" value=${productDraft.price} onInput=${function (event) { updateProductDraft("price", event.target.value); }} />
                      </label>
                      <label className="field">
                        <span>${L("Đơn vị / Unit")}</span>
                        <input
                          value=${productDraft.unit || ""}
                          placeholder=${L("VD: Gói, Chai, Lon, Cái... / e.g. Pack, Bottle, Can")}
                          onInput=${function (event) { updateProductDraft("unit", event.target.value); }}
                        />
                      </label>
                      <label className="field">
                        <span>${L("Tồn kho / Stock")}</span>
                        <input
                          type="number"
                          min="0"
                          disabled=${productDraft.inventoryMode !== "stock"}
                          value=${productDraft.inventoryMode === "recipe" ? 0 : productDraft.stock}
                          onInput=${function (event) { updateProductDraft("stock", event.target.value); }}
                        />
                        <small>
                          ${productDraft.inventoryMode === "recipe"
                            ? L("Món pha chế không có tồn kho riêng; tồn được tính từ thành phần bên dưới. / Prepared items do not keep direct stock; stock is derived from recipe ingredients below.")
                            : productDraft.inventoryMode === "stock"
                              ? L("Số tồn hiện tại; thường để hệ thống cập nhật qua Nhập/Xuất. / Usually updated via Stock-In/Out.")
                              : L("Chọn loại hàng trước: Hàng bán lẻ mới nhập tồn trực tiếp. / Choose a product type first; only Direct Stock keeps on-hand inventory.")}
                        </small>
                      </label>
                      <label className="field">
                        <span>${L("Mức cảnh báo / Min Stock Alert")}</span>
                        <input
                          type="number"
                          min="0"
                          value=${productDraft.minStock}
                          onInput=${function (event) { updateProductDraft("minStock", event.target.value); }}
                        />
                        <small>${L("Nếu tồn ≤ mức này, hệ thống sẽ cảnh báo. Đặt 0 để tắt. / Warn when on-hand ≤ this level. 0 to disable.")}</small>
                      </label>
                    </div>
                  </fieldset>

                  <!-- Group: Barcode + description -->
                  <fieldset style=${{ border: "1px dashed #e5d5c7", borderRadius: 14, padding: "12px 16px 16px", margin: 0 }}>
                    <legend style=${{ padding: "0 8px", color: "#8a7565", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>${L("Mã vạch & Mô tả / Barcode & Description")}</legend>
                    <label className="field">
                      <span>${L("Mã vạch / Barcode")}</span>
                      <input value=${productDraft.barcode} onInput=${function (event) { updateProductDraft("barcode", event.target.value); }} />
                      <small>${L("Có thể để trống, hệ thống tự tạo mã EAN-13 dễ quét. / Leave blank to auto-generate scannable EAN-13.")}</small>
                    </label>
                    <label className="field">
                      <span>${L("Mô tả ngắn / Short Description")}</span>
                      <textarea rows="3" value=${productDraft.description} onInput=${function (event) { updateProductDraft("description", event.target.value); }}></textarea>
                    </label>
                  </fieldset>

                  <!-- Group: Recipe / BOM with quantities + units -->
                  <fieldset style=${{ border: "1px dashed #e5d5c7", borderRadius: 14, padding: "12px 16px 16px", margin: 0 }}>
                    <legend style=${{ padding: "0 8px", color: "#8a7565", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>${L("Công thức / Recipe (BOM)")}</legend>

                    ${components.length === 0 ? html`
                      <div style=${{ color: "#7b6b5d", fontSize: 13, padding: "8px 0" }}>
                        ${L("Chưa có nguyên liệu nào trong danh mục. Vào tab \"Thành phần\" để thêm. / No components defined. Add them in the \"Components\" tab.")}
                      </div>
                    ` : html`
                      <!-- Chip palette to toggle ingredients in/out of recipe -->
                      <div style=${{ marginBottom: 12 }}>
                        <p style=${{ margin: "0 0 6px", fontSize: 12, color: "#8a7565" }}>
                          ${L("Bấm để thêm/bỏ nguyên liệu: / Tap to add/remove ingredients:")}
                        </p>
                        <div className="addon-row">
                          ${components.map(function (component) {
                            var inRecipe = isComponentInRecipe(productDraft, component.id);
                            return html`
                              <button
                                key=${component.id}
                                type="button"
                                className=${"addon-chip" + (inRecipe ? " is-active" : "")}
                                onClick=${function () { toggleProductDraftComponent(component.id); }}
                              >
                                ${inRecipe ? "✓ " : "+ "}${L(component.label)}
                              </button>
                            `;
                          })}
                        </div>
                      </div>

                      <!-- Per-line recipe editor: qty + unit + note -->
                      ${(function () {
                        var entries = recipeEntriesFromDraft(productDraft);
                        if (!entries.length) {
                          return html`
                            <div style=${{ color: "#7b6b5d", fontSize: 13, padding: "8px 0", fontStyle: "italic" }}>
                              ${L("Chưa chọn nguyên liệu nào cho món này. / No ingredients selected yet.")}
                            </div>
                          `;
                        }
                        return html`
                          <div className="list-stack" style=${{ marginTop: 8 }}>
                            ${entries.map(function (entry) {
                              var comp = components.find(function (c) { return c.id === entry.id; });
                              return html`
                                <article key=${entry.id} className="list-row" style=${{
                                  flexWrap: "wrap", alignItems: "center", gap: 8,
                                  padding: 10, background: "#fff8f1", borderRadius: 12
                                }}>
                                  <div style=${{ flex: "1 1 160px", minWidth: 140 }}>
                                    <strong>${comp ? L(comp.label) : entry.id}</strong>
                                    ${comp && comp.note ? html`<p style=${{ margin: 0, fontSize: 11, color: "#7b6b5d" }}>${L(comp.note)}</p>` : null}
                                  </div>
                                  <label className="field" style=${{ width: 90, margin: 0 }}>
                                    <span style=${{ fontSize: 11 }}>${L("SL / Qty")}</span>
                                    <input type="number" min="0" step="0.1" value=${entry.qty}
                                      onInput=${function (e) { updateRecipeEntry(entry.id, "qty", e.target.value); }}
                                    />
                                  </label>
                                  <label className="field" style=${{ width: 110, margin: 0 }}>
                                    <span style=${{ fontSize: 11 }}>${L("ĐV / Unit")}</span>
                                    <input value=${entry.unit || ""}
                                      placeholder=${comp && comp.unit ? comp.unit : L("vd: gram, ml")}
                                      onInput=${function (e) { updateRecipeEntry(entry.id, "unit", e.target.value); }}
                                    />
                                  </label>
                                  <label className="field" style=${{ width: 120, margin: 0 }}>
                                    <span style=${{ fontSize: 11 }}>${L("% khấu hao / Waste %")}</span>
                                    <input type="number" min="0" max="99" step="0.1" value=${entry.wastePercent || 0}
                                      onInput=${function (e) { updateRecipeEntry(entry.id, "wastePercent", e.target.value); }}
                                    />
                                  </label>
                                  <label className="field" style=${{ flex: "2 1 200px", margin: 0 }}>
                                    <span style=${{ fontSize: 11 }}>${L("Ghi chú / Note")}</span>
                                    <input value=${entry.note || ""}
                                      placeholder=${L("vd: xay nhuyễn, để lạnh... / e.g. blended, chilled...")}
                                      onInput=${function (e) { updateRecipeEntry(entry.id, "note", e.target.value); }}
                                    />
                                  </label>
                                  <small style=${{ flex: "1 1 100%", color: "#8a7565" }}>
                                    ${L("Dùng được / Net used")}: ${Number(entry.qty) || 0} ${entry.unit || (comp && comp.unit) || ""} ·
                                    ${L("Trừ kho / Deduct stock")}: ${formatQuantity(getRecipeEntryStockQty(entry), 2)} ${entry.unit || (comp && comp.unit) || ""}
                                    ${entry.wastePercent ? " (" + entry.wastePercent + "% " + L("khấu hao / waste") + ")" : ""}
                                  </small>
                                  <button type="button" className="ghost-btn danger-text"
                                    style=${{ alignSelf: "flex-end" }}
                                    onClick=${function () { toggleProductDraftComponent(entry.id); }}
                                  >${L("Xóa / Remove")}</button>
                                </article>
                              `;
                            })}
                          </div>
                        `;
                      })()}
                    `}
                  </fieldset>

                  <button type="submit" className="primary-btn" style=${{ alignSelf: "stretch" }}>
                    ${productDraft.id ? L("Lưu thay đổi / Save Changes") : L("Thêm vào kho / Add to Inventory")}
                  </button>
                </form>
              </div>
            ` : null}

            ${inventorySection === "components" ? html`
              <div className="settings-nav component-workspace-switch">
                <button
                  type="button"
                  className=${"settings-nav-btn" + (componentWorkspaceMode === "edit" ? " is-active" : "")}
                  onClick=${function () { setComponentWorkspaceMode("edit"); }}
                >${L("Thêm / Sửa thành phần / Add & Edit Components")}</button>
                <button
                  type="button"
                  className=${"settings-nav-btn" + (componentWorkspaceMode === "convert" ? " is-active" : "")}
                  onClick=${function () { setComponentWorkspaceMode("convert"); }}
                >${L("Chuyển thành phần / Convert to Component")}</button>
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
                        <label className="field"><span>${L("Mã danh mục / Category Code")}</span><input placeholder="VD: ORIA7000" value=${categoryDraft.code} onInput=${function (event) { updateCategoryDraft("code", event.target.value); }} /></label>
                        <label className="field"><span>${L("Tên tiếng Việt / Vietnamese Name")}</span><input value=${categoryDraft.labelVi} onInput=${function (event) { updateCategoryDraft("labelVi", event.target.value); }} /></label>
                        <label className="field"><span>${L("Tên tiếng Anh / English Name")}</span><input value=${categoryDraft.labelEn} onInput=${function (event) { updateCategoryDraft("labelEn", event.target.value); }} /></label>
                        <label className="field">
                          <span>${L("Icon / Icon")}</span>
                          <select value=${categoryDraft.icon || "🛒"} onChange=${function (event) { updateCategoryDraft("icon", event.target.value); }}>
                            ${categoryDraft.icon && !CATEGORY_ICON_OPTIONS.some(function (item) { return item.value === categoryDraft.icon; })
                              ? html`<option value=${categoryDraft.icon}>${categoryDraft.icon} ${L("Icon hiện tại / Current Icon")}</option>`
                              : null}
                            ${CATEGORY_ICON_OPTIONS.map(function (item) {
                              return html`<option key=${item.value} value=${item.value}>${item.value} ${L(item.label)}</option>`;
                            })}
                          </select>
                        </label>
                      </div>
                      <button type="submit" className="primary-btn">${categoryDraft.id ? L("Lưu danh mục / Save Category") : L("Thêm danh mục / Add Category")}</button>
                    </form>
                    <div className="management-list">
                      ${categories.map(function (category) {
                        return html`
                          <article key=${category.id} className="list-row list-row-actions">
                            <div>
                              <strong>${category.icon} ${L(category.label)}</strong>
                              <p>${category.code ? category.code + " · " : ""}${category.id}</p>
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
              </div>
            ` : null}

            ${inventorySection === "components" && componentWorkspaceMode === "edit" ? html`
              <div className="stack-view">
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
                      <label className="field">
                        <span>${L("Loại tồn kho / Inventory Item Type")}</span>
                        <select value=${componentDraft.itemType} onChange=${function (event) { updateComponentDraft("itemType", event.target.value); }}>
                          ${COMPONENT_ITEM_TYPE_OPTIONS.map(function (option) {
                            return html`<option key=${option.value} value=${option.value}>${L(option.label)}</option>`;
                          })}
                        </select>
                      </label>
                      <label className="field"><span>${L("Tồn kho thật / Real Stock")}</span><input type="number" min="0" step="0.1" value=${componentDraft.stockQty} onInput=${function (event) { updateComponentDraft("stockQty", event.target.value); }} /></label>
                      <label className="field"><span>${L("Cost / đơn vị / Cost per Unit")}</span><input type="number" min="0" step="1" value=${componentDraft.costPerUnit} onInput=${function (event) { updateComponentDraft("costPerUnit", event.target.value); }} /></label>
                      <label className="field"><span>${L("Mức cảnh báo / Min Stock")}</span><input type="number" min="0" step="0.1" value=${componentDraft.minStock} onInput=${function (event) { updateComponentDraft("minStock", event.target.value); }} /></label>
                      <label className="toggle-card" style=${{ alignSelf: "end" }}>
                        <input
                          type="checkbox"
                          checked=${!!componentDraft.isUnlimitedStock}
                          onChange=${function (event) { updateComponentDraft("isUnlimitedStock", event.target.checked); }}
                        />
                        <span>${L("Không giới hạn tồn kho / Unlimited Stock")}</span>
                        <small>${L("Dùng cho nước lọc, nước sôi, đá: không cảnh báo thiếu và không trừ tồn. / For water, boiled water, ice: no low-stock warning and no deduction.")}</small>
                      </label>
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
                              <p>
                                ${L(getComponentItemTypeLabel(component.itemType))} · ${component.unit || L("Chưa có đơn vị / No unit")} ·
                                ${component.isUnlimitedStock
                                  ? L("Tồn không giới hạn / Unlimited stock")
                                  : L("Tồn thực / Real stock") + ": " + (Number(component.stockQty) || 0)}
                                · ${L("Cost")}: ${formatCurrency(component.costPerUnit || 0)}
                              </p>
                              ${component.note ? html`<p>${component.note}</p>` : null}
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

    // ==================================================================
    // NHẬP HÀNG / STOCK IN
    // ==================================================================
    function purchaseLineKey(itemType, itemId) {
      return (itemType || "product") + ":" + itemId;
    }
    function addPurchaseLine(itemId, itemType) {
      var type = itemType === "component" ? "component" : "product";
      var key = purchaseLineKey(type, itemId);
      var product = type === "product" ? products.find(function (p) { return p.id === itemId; }) : null;
      var component = type === "component" ? components.find(function (c) { return c.id === itemId; }) : null;
      setPurchaseDraft(function (current) {
        var existing = current.items.find(function (it) {
          return (it.lineKey || purchaseLineKey(it.itemType || "product", it.itemId || it.productId || it.componentId)) === key;
        });
        if (existing) {
          return Object.assign({}, current, {
            items: current.items.map(function (it) {
              var currentKey = it.lineKey || purchaseLineKey(it.itemType || "product", it.itemId || it.productId || it.componentId);
              return currentKey === key
                ? Object.assign({}, it, { qty: (Number(it.qty) || 0) + 1 })
                : it;
            })
          });
        }
        return Object.assign({}, current, {
          items: current.items.concat([{
            lineKey: key,
            itemType: type,
            itemId: itemId,
            productId: type === "product" ? itemId : "",
            componentId: type === "component" ? itemId : "",
            productName: product ? product.name : (component ? L(component.label) : itemId),
            itemName: product ? product.name : (component ? L(component.label) : itemId),
            unit: type === "component" && component ? component.unit || "" : (product ? product.unit || "" : ""),
            qty: 1,
            unitCost: product ? Number(product.costPrice) || 0 : 0
          }])
        });
      });
    }
    function updatePurchaseLine(lineKey, field, value) {
      setPurchaseDraft(function (current) {
        return Object.assign({}, current, {
          items: current.items.map(function (it) {
            var currentKey = it.lineKey || purchaseLineKey(it.itemType || "product", it.itemId || it.productId || it.componentId);
            if (currentKey !== lineKey) return it;
            var v = (field === "qty" || field === "unitCost") ? Number(value) || 0 : value;
            return Object.assign({}, it, { [field]: v });
          })
        });
      });
    }
    function removePurchaseLine(lineKey) {
      setPurchaseDraft(function (current) {
        return Object.assign({}, current, {
          items: current.items.filter(function (it) {
            var currentKey = it.lineKey || purchaseLineKey(it.itemType || "product", it.itemId || it.productId || it.componentId);
            return currentKey !== lineKey;
          })
        });
      });
    }
    function resetPurchaseDraft() {
      setPurchaseDraft({ supplierId: "", supplierName: "", paymentMethod: "cash", note: "", items: [] });
    }
    function isPurchasePendingVerification(po) {
      return po && (po.verification_status || po.verificationStatus) === "pending_verification";
    }
    function isPurchaseNeedsRevision(po) {
      return po && (po.verification_status || po.verificationStatus) === "needs_revision";
    }
    function purchaseStatusLabel(po) {
      if (isPurchasePendingVerification(po)) return "Chờ xác nhận / Pending Verification";
      if (isPurchaseNeedsRevision(po)) return "Cần sửa / Needs Revision";
      if ((po.verification_status || po.verificationStatus) === "rejected") return "Đã từ chối / Rejected";
      if ((po.status || "") === "completed") return "Đã nhập kho / Verified";
      return "Nháp / Draft";
    }
    function viewPurchaseDetail(po) {
      if (!po || !po.id) return;
      setPurchaseDetail({ loading: true, id: po.id, purchase: po, items: [] });
      syncApi("/purchases/" + encodeURIComponent(po.id))
        .then(function (data) {
          setPurchaseDetail({
            loading: false,
            id: po.id,
            purchase: data.purchase || po,
            items: Array.isArray(data.items) ? data.items : []
          });
        })
        .catch(function (err) {
          setPurchaseDetail({
            loading: false,
            id: po.id,
            purchase: po,
            items: [],
            error: (err && err.message) || L("Không tải được chi tiết phiếu nhập. / Could not load purchase detail.")
          });
        });
    }
    function refreshAfterPurchaseVerification() {
      refreshPurchases();
      if (window.ShopFlowSync && typeof window.ShopFlowSync.pull === "function") {
        window.ShopFlowSync.pull(0).catch(function () {});
      }
    }
    function verifyPurchase(po, action) {
      if (!po || !po.id) return;
      var labels = {
        verify: L("Xác nhận nhập kho phiếu này? Sau khi xác nhận, tồn kho sẽ được cộng. / Verify this stock-in? Inventory will be added."),
        needs_revision: L("Trả phiếu này về để người mua hàng sửa? / Send this purchase back for revision?"),
        reject: L("Từ chối phiếu nhập này? Tồn kho sẽ không thay đổi. / Reject this purchase? Inventory will not change.")
      };
      if (!window.confirm(labels[action] || labels.verify)) return;
      syncApi("/purchases/" + encodeURIComponent(po.id), {
        method: "POST",
        body: {
          action: action || "verify",
          verifiedBy: "POS",
        }
      }).then(function () {
        window.alert(action === "verify"
          ? L("Đã xác nhận nhập kho. / Stock-in verified.")
          : L("Đã cập nhật trạng thái phiếu. / Purchase status updated."));
        refreshAfterPurchaseVerification();
      }).catch(function (err) {
        window.alert(L("Không xử lý được phiếu nhập. / Could not update purchase.") + "\n" + ((err && err.message) || ""));
      });
    }
    function submitPurchase() {
      if (!purchaseDraft.items.length) {
        window.alert(L("Chưa có dòng hàng nào. / Add at least one line first."));
        return;
      }
      var total = purchaseDraft.items.reduce(function (s, it) {
        return s + (Number(it.qty) || 0) * (Number(it.unitCost) || 0);
      }, 0);
      // Optimistic: bump local stock immediately.
      setProducts(function (current) {
        return current.map(function (p) {
          var line = purchaseDraft.items.find(function (it) {
            return (it.itemType || "product") !== "component" && it.productId === p.id;
          });
          if (!line) return p;
          var qty = normalizeQtyForUnit(line.qty, line.unit || p.unit || "");
          var nextStock = (Number(p.rawStock != null ? p.rawStock : p.stock) || 0) + qty;
          return Object.assign({}, p, { stock: nextStock, rawStock: nextStock });
        });
      });
      setComponents(function (current) {
        return current.map(function (component) {
          var line = purchaseDraft.items.find(function (it) {
            return it.itemType === "component" && (it.componentId || it.itemId) === component.id;
          });
          if (!line) return component;
          if (component.isUnlimitedStock) {
            return Object.assign({}, component, { unit: component.unit || line.unit || "" });
          }
          return Object.assign({}, component, {
            stockQty: (Number(component.stockQty) || 0) + (Number(line.qty) || 0),
            unit: component.unit || line.unit || ""
          });
        });
      });
      syncEnqueue({
        endpoint: "/purchases",
        method: "POST",
        opType: "purchase",
        body: {
          supplierId: purchaseDraft.supplierId || null,
          supplierName: purchaseDraft.supplierName || null,
          paymentMethod: normalizePaymentMethod(purchaseDraft.paymentMethod),
          paidAmount: total,
          note: purchaseDraft.note || null,
          items: purchaseDraft.items.map(function (it) {
            if (it.itemType === "component") {
              return {
                itemType: "component",
                componentId: it.componentId || it.itemId,
                componentName: it.itemName || it.productName,
                productName: it.itemName || it.productName,
                unit: it.unit || "",
                qty: Number(it.qty) || 0,
                unitCost: Number(it.unitCost) || 0
              };
            }
            return {
              itemType: "product",
              productId: it.productId,
              productName: it.productName,
              unit: it.unit || "",
              qty: Number(it.qty) || 0,
              unitCost: Number(it.unitCost) || 0
            };
          })
        }
      });
      window.alert(L("Đã lưu phiếu nhập. / Purchase saved."));
      resetPurchaseDraft();
      // Refresh shortly after to pick up server-assigned PN-id.
      setTimeout(refreshPurchases, 800);
    }
    function submitSupplier(event) {
      if (event && event.preventDefault) event.preventDefault();
      if (!supplierDraft.name.trim()) {
        window.alert(L("Nhập tên nhà cung cấp. / Enter supplier name."));
        return;
      }
      syncApi("/suppliers", {
        method: "POST",
        body: {
          id: supplierDraft.id || undefined,
          name: supplierDraft.name.trim(),
          phone: supplierDraft.phone || null,
          address: supplierDraft.address || null,
          note: supplierDraft.note || null
        }
      }).then(function () {
        setSupplierDraft({ id: null, name: "", phone: "", address: "", note: "" });
        refreshSuppliers();
      }).catch(function (err) {
        window.alert(L("Không lưu được nhà cung cấp. / Could not save supplier.") + "\n" + (err && err.message ? err.message : ""));
      });
    }

    // ==================================================================
    // XUẤT HÀNG / STOCK OUT
    // ==================================================================
    var ISSUE_REASONS = [
      { value: "damaged",  label: "Hư hỏng / Damaged" },
      { value: "sample",   label: "Hàng mẫu / Sample" },
      { value: "internal", label: "Sử dụng nội bộ / Internal use" },
      { value: "transfer", label: "Chuyển kho / Transfer" },
      { value: "other",    label: "Khác / Other" }
    ];
    function viewIssueDetail(px) {
      if (!px || !px.id) return;
      setIssueDetail({ loading: true, id: px.id, issue: px, items: [] });
      syncApi("/issues/" + encodeURIComponent(px.id))
        .then(function (data) {
          setIssueDetail({
            loading: false,
            id: px.id,
            issue: data.issue || px,
            items: Array.isArray(data.items) ? data.items : []
          });
        })
        .catch(function (err) {
          setIssueDetail({
            loading: false,
            id: px.id,
            issue: px,
            items: [],
            error: (err && err.message) || L("Không tải được chi tiết phiếu xuất. / Could not load issue detail.")
          });
        });
    }
    function issueLineKey(itemType, itemId) {
      return (itemType === "component" ? "component:" : "product:") + itemId;
    }
    function addIssueLine(itemId, itemType) {
      var type = itemType === "component" ? "component" : "product";
      var key = issueLineKey(type, itemId);
      var product = type === "product" ? products.find(function (p) { return p.id === itemId; }) : null;
      var component = type === "component" ? components.find(function (c) { return c.id === itemId; }) : null;
      setIssueDraft(function (current) {
        var existing = current.items.find(function (it) {
          return (it.lineKey || issueLineKey(it.itemType || "product", it.itemId || it.productId || it.componentId)) === key;
        });
        if (existing) {
          return Object.assign({}, current, {
            items: current.items.map(function (it) {
              var currentKey = it.lineKey || issueLineKey(it.itemType || "product", it.itemId || it.productId || it.componentId);
              return currentKey === key
                ? Object.assign({}, it, { qty: (Number(it.qty) || 0) + 1 })
                : it;
            })
          });
        }
        return Object.assign({}, current, {
          items: current.items.concat([{
            lineKey: key,
            itemType: type,
            itemId: itemId,
            productId: type === "product" ? itemId : "",
            componentId: type === "component" ? itemId : "",
            productName: type === "component" ? (component ? L(component.label) : itemId) : (product ? product.name : itemId),
            qty: 1,
            maxStock: type === "component"
              ? (component && component.isUnlimitedStock ? Number.POSITIVE_INFINITY : (component ? Number(component.stockQty) || 0 : 0))
              : (product ? Number(product.stock) || 0 : 0)
          }])
        });
      });
    }
    function updateIssueLine(lineKey, qty) {
      setIssueDraft(function (current) {
        return Object.assign({}, current, {
          items: current.items.map(function (it) {
            var currentKey = it.lineKey || issueLineKey(it.itemType || "product", it.itemId || it.productId || it.componentId);
            return currentKey === lineKey
              ? Object.assign({}, it, { qty: Number(qty) || 0 })
              : it;
          })
        });
      });
    }
    function removeIssueLine(lineKey) {
      setIssueDraft(function (current) {
        return Object.assign({}, current, {
          items: current.items.filter(function (it) {
            var currentKey = it.lineKey || issueLineKey(it.itemType || "product", it.itemId || it.productId || it.componentId);
            return currentKey !== lineKey;
          })
        });
      });
    }
    function resetIssueDraft() {
      setIssueDraft({ reason: "damaged", note: "", items: [] });
    }
    function submitIssue() {
      if (!issueDraft.items.length) {
        window.alert(L("Chưa có dòng hàng nào. / Add at least one line first."));
        return;
      }
      var insufficient = issueDraft.items.filter(function (it) {
        if (it.itemType === "component") {
          var c = components.find(function (x) { return x.id === it.componentId; });
          if (c && c.isUnlimitedStock) return false;
          var componentStock = c ? Number(c.stockQty) || 0 : 0;
          return (Number(it.qty) || 0) > componentStock;
        }
        var p = products.find(function (x) { return x.id === it.productId; });
        var stock = p ? Number(p.stock) || 0 : 0;
        return (Number(it.qty) || 0) > stock;
      });
      if (insufficient.length) {
        var msg = insufficient.map(function (it) {
          if (it.itemType === "component") {
            var c = components.find(function (x) { return x.id === it.componentId; });
            return "- " + (c ? L(c.label) : it.componentId) + " (" + (c ? c.stockQty : 0) + "/" + it.qty + ")";
          }
          var p = products.find(function (x) { return x.id === it.productId; });
          return "- " + (p ? p.name : it.productId) + " (" + (p ? p.stock : 0) + "/" + it.qty + ")";
        }).join("\n");
        if (!window.confirm(L("Một số mặt hàng xuất quá tồn. Vẫn lưu? / Some lines exceed stock. Continue?") + "\n" + msg)) return;
      }
      // Optimistic local decrement.
      setProducts(function (current) {
        return current.map(function (p) {
          var line = issueDraft.items.find(function (it) { return it.itemType !== "component" && it.productId === p.id; });
          if (!line) return p;
          return Object.assign({}, p, { stock: Math.max(0, (Number(p.stock) || 0) - (Number(line.qty) || 0)) });
        });
      });
      setComponents(function (current) {
        return current.map(function (component) {
          if (component.isUnlimitedStock) return component;
          var line = issueDraft.items.find(function (it) { return it.itemType === "component" && it.componentId === component.id; });
          if (!line) return component;
          return Object.assign({}, component, { stockQty: Math.max(0, (Number(component.stockQty) || 0) - (Number(line.qty) || 0)) });
        });
      });
      syncEnqueue({
        endpoint: "/issues",
        method: "POST",
        opType: "issue",
        body: {
          reason: issueDraft.reason,
          note: issueDraft.note || null,
          items: issueDraft.items.map(function (it) {
            if (it.itemType === "component") {
              return {
                itemType: "component",
                componentId: it.componentId,
                componentName: it.productName,
                qty: Number(it.qty) || 0
              };
            }
            return { itemType: "product", productId: it.productId, productName: it.productName, qty: Number(it.qty) || 0 };
          })
        }
      });
      window.alert(L("Đã lưu phiếu xuất. / Issue saved."));
      resetIssueDraft();
      setTimeout(refreshIssues, 800);
    }

    // ==================================================================
    // KIỂM KÊ / STOCKTAKE  (sinh ADJUST movement cho chênh lệch)
    // ==================================================================
    function submitStocktake() {
      var adjustItems = [];
      products.forEach(function (p) {
        var raw = stocktakeDraft[p.id];
        if (raw === undefined || raw === "") return;
        var actual = Number(raw);
        actual = normalizeQtyForUnit(raw, p.unit);
        if (!Number.isFinite(actual)) return;
        var diff = actual - (Number(p.stock) || 0);
        if (diff === 0) return;
        adjustItems.push({ productId: p.id, productName: p.name, diff: diff, actual: actual });
      });
      if (!adjustItems.length) {
        window.alert(L("Không có chênh lệch tồn. / No stock differences."));
        return;
      }
      // For each adjustment we either push an IN (positive diff) or OUT (negative)
      // through the existing endpoints — keeps the ledger clean.
      adjustItems.forEach(function (it) {
        if (it.diff > 0) {
          syncEnqueue({
            endpoint: "/purchases",
            method: "POST",
            opType: "stocktake-in",
            body: {
              supplierName: "Kiểm kê / Stocktake",
              paymentMethod: "Internal",
              note: "Kiem ke - dieu chinh tang",
              items: [{ productId: it.productId, productName: it.productName, qty: it.diff, unitCost: 0 }]
            }
          });
        } else {
          syncEnqueue({
            endpoint: "/issues",
            method: "POST",
            opType: "stocktake-out",
            body: {
              reason: "other",
              note: "Kiem ke - dieu chinh giam",
              allowNegativeStock: true,
              items: [{ productId: it.productId, productName: it.productName, qty: Math.abs(it.diff) }]
            }
          });
        }
      });
      // Optimistic local update.
      setProducts(function (current) {
        return current.map(function (p) {
          var line = adjustItems.find(function (it) { return it.productId === p.id; });
          return line ? Object.assign({}, p, { stock: line.actual }) : p;
        });
      });
      setStocktakeDraft({});
      window.alert(L("Đã ghi nhận kiểm kê. / Stocktake recorded."));
      setTimeout(function () { refreshMovements(); }, 1000);
    }

    function formatMovementType(type) {
      var map = {
        IN:     "Nhập / Stock In",
        OUT:    "Xuất / Stock Out",
        SALE:   "Bán / Sale",
        ADJUST: "Kiểm kê / Adjust",
        RETURN: "Trả / Return"
      };
      return L(map[type] || type);
    }

    function getStockDetailItemName(item) {
      if (!item) return "";
      return item.display_name || item.displayName ||
        item.item_name || item.itemName ||
        item.product_name || item.productName ||
        item.component_name || item.componentName ||
        item.ingredient_name || item.ingredientName ||
        item.name || item.label ||
        item.product_id || item.productId ||
        item.component_id || item.componentId ||
        item.ingredient_id || item.ingredientId ||
        L("Không rõ mặt hàng / Unknown item");
    }

    function getStockDetailItemType(item) {
      if (!item) return "product";
      if (item.item_type === "component" || item.itemType === "component" || item.component_id || item.componentId) {
        return "component";
      }
      return "product";
    }

    function getStockDetailUnit(item) {
      return (item && (item.purchase_unit || item.purchaseUnit || item.unit || item.stock_unit || item.stockUnit || item.base_unit || item.baseUnit)) || "";
    }

    function getStockDetailQty(item, preferPurchaseQty) {
      if (!item) return 0;
      var value = preferPurchaseQty
        ? (item.purchase_qty != null ? item.purchase_qty : item.purchaseQty)
        : (item.qty != null ? item.qty : item.quantity);
      if (value == null) {
        value = item.base_qty != null ? item.base_qty : item.baseQty;
      }
      if (value == null) {
        value = item.purchase_qty != null ? item.purchase_qty : item.purchaseQty;
      }
      return Number(value) || 0;
    }

    function getStockDetailUnitCost(item) {
      if (!item) return 0;
      return Number(
        item.purchase_unit_cost != null ? item.purchase_unit_cost :
        item.purchaseUnitCost != null ? item.purchaseUnitCost :
        item.unit_cost != null ? item.unit_cost :
        item.unitCost != null ? item.unitCost :
        item.price != null ? item.price :
        item.cost != null ? item.cost : 0
      ) || 0;
    }

    function getStockDetailLineTotal(item) {
      if (!item) return 0;
      var explicit = item.subtotal != null ? item.subtotal :
        item.line_total != null ? item.line_total :
        item.lineTotal != null ? item.lineTotal :
        item.total_cost != null ? item.total_cost :
        item.totalCost;
      if (explicit != null) return Number(explicit) || 0;
      return getStockDetailQty(item, true) * getStockDetailUnitCost(item);
    }

    function renderStockDetailLine(item, index, options) {
      var opts = options || {};
      var type = getStockDetailItemType(item);
      var qty = getStockDetailQty(item, opts.preferPurchaseQty);
      var unit = getStockDetailUnit(item);
      var unitCost = getStockDetailUnitCost(item);
      var total = getStockDetailLineTotal(item);
      var hasPrice = unitCost > 0 || total > 0;
      var stockQty = getStockDetailQty(item, false);
      var showStockQty = opts.showStockQty && stockQty && stockQty !== qty;
      var itemCode = (item && (item.barcode || item.sku || item.product_id || item.productId || item.component_id || item.componentId)) || "";
      return html`
        <article key=${(item && item.id) || index} className="stock-detail-line">
          <div className="stock-detail-main">
            <span className="stock-badge">${type === "component" ? L("Thành phần / Component") : L("Sản phẩm / Product")}</span>
            <strong>${getStockDetailItemName(item)}</strong>
            <small>
              ${itemCode ? itemCode + " · " : ""}
              ${L("Số lượng / Qty")}: ${formatQuantity(qty, 3)}${unit ? " " + unit : ""}
              ${showStockQty ? " · " + L("Quy đổi tồn / Stock qty") + ": " + formatQuantity(stockQty, 3) + ((item.unit || "") ? " " + item.unit : "") : ""}
            </small>
          </div>
          <div className="stock-detail-money">
            <small>${L("Đơn giá / Unit price")}</small>
            <strong>${hasPrice ? formatCurrency(unitCost) : "—"}</strong>
          </div>
          <div className="stock-detail-money">
            <small>${L("Thành tiền / Amount")}</small>
            <strong>${hasPrice ? formatCurrency(total) : "—"}</strong>
          </div>
        </article>
      `;
    }

    function renderPurchaseDetailModal() {
      if (!purchaseDetail) return null;
      var purchase = purchaseDetail.purchase || {};
      return html`
        <div className="detail-modal-backdrop" role="presentation" onClick=${function () { setPurchaseDetail(null); }}>
          <section className="detail-modal surface" role="dialog" aria-modal="true" onClick=${function (event) { event.stopPropagation(); }}>
            <div className="detail-modal-head">
              <div>
                <p className="eyebrow">${L("Chi tiết phiếu nhập / Purchase Detail")}</p>
                <h3 className="section-title">${purchaseDetail.id}</h3>
                <small>${formatDateTime(purchase.created_at)}</small>
              </div>
              <button className="ghost-btn" onClick=${function () { setPurchaseDetail(null); }}>${L("Đóng / Close")}</button>
            </div>

            ${purchaseDetail.loading ? html`<div className="empty-state align-left">${L("Đang tải chi tiết... / Loading detail...")}</div>` : null}
            ${purchaseDetail.error ? html`<div className="empty-state align-left" style=${{ color: "#c0392b" }}>${purchaseDetail.error}</div>` : null}

            ${!purchaseDetail.loading ? html`
              <div className="detail-summary-grid">
                <div><span>${L("Nhà cung cấp / Supplier")}</span><strong>${purchase.supplier_name || purchase.supplierName || L("Không rõ / Unknown")}</strong></div>
                <div><span>${L("Thanh toán / Payment")}</span><strong>${L(getPaymentMethodLabel(purchase.payment_method || purchase.paymentMethod))}</strong></div>
                <div><span>${L("Trạng thái / Status")}</span><strong>${L(purchaseStatusLabel(purchase))}</strong></div>
                <div><span>${L("Tổng / Total")}</span><strong>${formatCurrency(purchase.total_amount || purchase.totalAmount || 0)}</strong></div>
              </div>
              <div className="stock-detail-list">
                ${(purchaseDetail.items || []).length
                  ? purchaseDetail.items.map(function (item, index) {
                      return renderStockDetailLine(item, index, { preferPurchaseQty: true, showStockQty: true });
                    })
                  : html`<div className="empty-state align-left">${L("Phiếu chưa có dòng hàng. / No line items.")}</div>`}
              </div>
            ` : null}
          </section>
        </div>
      `;
    }

    function renderIssueDetailModal() {
      if (!issueDetail) return null;
      var issue = issueDetail.issue || {};
      return html`
        <div className="detail-modal-backdrop" role="presentation" onClick=${function () { setIssueDetail(null); }}>
          <section className="detail-modal surface" role="dialog" aria-modal="true" onClick=${function (event) { event.stopPropagation(); }}>
            <div className="detail-modal-head">
              <div>
                <p className="eyebrow">${L("Chi tiết phiếu xuất / Issue Detail")}</p>
                <h3 className="section-title">${issueDetail.id}</h3>
                <small>${formatDateTime(issue.created_at)}</small>
              </div>
              <button className="ghost-btn" onClick=${function () { setIssueDetail(null); }}>${L("Đóng / Close")}</button>
            </div>

            ${issueDetail.loading ? html`<div className="empty-state align-left">${L("Đang tải chi tiết... / Loading detail...")}</div>` : null}
            ${issueDetail.error ? html`<div className="empty-state align-left" style=${{ color: "#c0392b" }}>${issueDetail.error}</div>` : null}

            ${!issueDetail.loading ? html`
              <div className="detail-summary-grid">
                <div><span>${L("Lý do / Reason")}</span><strong>${issue.reason || ""}</strong></div>
                <div><span>${L("Trạng thái / Status")}</span><strong>${issue.status || ""}</strong></div>
                <div><span>${L("Ngày tạo / Created")}</span><strong>${formatDateTime(issue.created_at)}</strong></div>
                <div><span>${L("Ghi chú / Note")}</span><strong>${issue.note || L("Không có / None")}</strong></div>
              </div>
              <div className="stock-detail-list">
                ${(issueDetail.items || []).length
                  ? issueDetail.items.map(function (item, index) {
                      return renderStockDetailLine(item, index, { preferPurchaseQty: false });
                    })
                  : html`<div className="empty-state align-left">${L("Phiếu chưa có dòng hàng. / No line items.")}</div>`}
              </div>
            ` : null}
          </section>
        </div>
      `;
    }

    // ==================================================================
    // RENDER: NHẬP HÀNG VIEW
    // ==================================================================
    function renderStockOperationsView() {
      return html`
        <section className="page-section">
          <header className="page-header surface">
            <div>
              <p className="eyebrow">${L("Phiếu kho / Stock Documents")}</p>
              <h1 className="section-title">${L("Nhập và xuất hàng chung một trang / Stock In-Out in One Workspace")}</h1>
              <small style=${{ color: "#7b6b5d" }}>
                ${L("Chọn loại phiếu để đổi form. Nhập và xuất đều hỗ trợ sản phẩm hoặc thành phần. / Choose document type to switch templates. Both stock-in and stock-out support products or components.")}
              </small>
            </div>
            <div className="row-actions">
              <span className="eyebrow">${L("Trạng thái / Status")}: ${syncStatus.online ? "🟢" : "🔴"} ${syncStatus.pending ? ("⏳" + syncStatus.pending) : ""}</span>
            </div>
          </header>

          <div className="settings-nav" style=${{ marginBottom: 16 }}>
            <button
              type="button"
              className=${"settings-nav-btn" + (stockOpsMode === "in" ? " is-active" : "")}
              onClick=${function () { setStockOpsMode("in"); refreshSuppliers(); refreshPurchases(); }}
            >
              ${L("Nhập hàng / Stock In")}
            </button>
            <button
              type="button"
              className=${"settings-nav-btn" + (stockOpsMode === "out" ? " is-active" : "")}
              onClick=${function () { setStockOpsMode("out"); refreshIssues(); }}
            >
              ${L("Xuất hàng / Stock Out")}
            </button>
          </div>

          ${stockOpsMode === "in" ? renderPurchasesView(true) : renderIssuesView(true)}
        </section>
      `;
    }

    function renderPurchasesView(embedded) {
      var total = purchaseDraft.items.reduce(function (s, it) {
        return s + (Number(it.qty) || 0) * (Number(it.unitCost) || 0);
      }, 0);
      return html`
        <section className="page-section">
          ${embedded ? null : html`<header className="page-header surface">
            <div>
              <p className="eyebrow">${L("Nhập hàng / Stock In")}</p>
              <h1 className="section-title">${L("Tạo phiếu nhập / Create Purchase Order")}</h1>
              <small style=${{ color: "#7b6b5d" }}>${L("Phiếu nhập sẽ ghi vào Supabase/API + tự cộng tồn kho. / Purchase writes to Supabase/API and adds to stock.")}</small>
            </div>
            <div className="row-actions">
              <span className="eyebrow">${L("Trạng thái / Status")}: ${syncStatus.online ? "🟢" : "🔴"} ${syncStatus.pending ? ("⏳" + syncStatus.pending) : ""}</span>
            </div>
          </header>`}

          <div className="grid-2">
            <section className="surface section-card form-card">
              <h2 className="section-title">${L("Thông tin phiếu / PO Info")}</h2>
              <div className="field-grid">
                <label className="field">
                  <span>${L("Nhà cung cấp / Supplier")}</span>
                  <select value=${purchaseDraft.supplierId} onChange=${function (e) {
                    var sid = e.target.value;
                    var s = suppliers.find(function (x) { return x.id === sid; });
                    setPurchaseDraft(function (cur) { return Object.assign({}, cur, { supplierId: sid, supplierName: s ? s.name : "" }); });
                  }}>
                    <option value="">${L("— Chọn / Select —")}</option>
                    ${suppliers.map(function (s) {
                      return html`<option key=${s.id} value=${s.id}>${s.name}</option>`;
                    })}
                  </select>
                </label>
                <label className="field">
                  <span>${L("Thanh toán / Payment")}</span>
                  <select value=${normalizePaymentMethod(purchaseDraft.paymentMethod)} onChange=${function (e) {
                    setPurchaseDraft(function (cur) { return Object.assign({}, cur, { paymentMethod: e.target.value }); });
                  }}>
                    ${PAYMENT_METHOD_OPTIONS.map(function (opt) {
                      return html`<option key=${opt.value} value=${opt.value}>${L(opt.label)}</option>`;
                    })}
                  </select>
                </label>
                <label className="field" style=${{ gridColumn: "1 / -1" }}>
                  <span>${L("Ghi chú / Note")}</span>
                  <input value=${purchaseDraft.note} onInput=${function (e) {
                    setPurchaseDraft(function (cur) { return Object.assign({}, cur, { note: e.target.value }); });
                  }} />
                </label>
              </div>

              <h3 className="section-title" style=${{ marginTop: 24 }}>${L("Thêm mặt hàng / Add Stock Item")}</h3>
              <div className="toggle-grid" style=${{ marginBottom: 12 }}>
                <button
                  type="button"
                  className=${"ghost-btn" + (purchaseItemType === "product" ? " active-toggle" : "")}
                  onClick=${function () { setPurchaseItemType("product"); setPurchaseProductSearch(""); }}
                >
                  ${L("Sản phẩm bán lẻ / Retail Product")}
                </button>
                <button
                  type="button"
                  className=${"ghost-btn" + (purchaseItemType === "component" ? " active-toggle" : "")}
                  onClick=${function () { setPurchaseItemType("component"); setPurchaseProductSearch(""); }}
                >
                  ${L("Thành phần / Component")}
                </button>
              </div>
              <input
                placeholder=${purchaseItemType === "component"
                  ? L("Tìm thành phần/nguyên liệu... / Search component or ingredient...")
                  : L("Tìm sản phẩm theo tên, mã vạch... / Search product by name, barcode...")}
                value=${purchaseProductSearch}
                onInput=${function (e) { setPurchaseProductSearch(e.target.value); }}
                style=${{ marginBottom: "10px" }}
              />
              ${purchaseProductSearch.trim() ? html`
                <div className="management-list" style=${{ maxHeight: "240px", overflowY: "auto", marginBottom: "12px" }}>
                  ${(function () {
                    var nq = normalizeSearchText(purchaseProductSearch);
                    if (purchaseItemType === "component") {
                      var matchedComponents = components.filter(function (component) {
                        var haystack = normalizeSearchText([
                          component.id,
                          component.label,
                          L(component.label),
                          component.unit,
                          component.note
                        ].join(" "));
                        return haystack.indexOf(nq) !== -1;
                      }).slice(0, 20);
                      if (!matchedComponents.length) return html`<p style=${{ color: "#7b6b5d", padding: "8px" }}>${L("Không tìm thấy thành phần. / No components found.")}</p>`;
                      return matchedComponents.map(function (component) {
                        return html`
                          <button
                            key=${component.id}
                            type="button"
                            className="list-row"
                            onClick=${function () { addPurchaseLine(component.id, "component"); setPurchaseProductSearch(""); }}
                            style=${{ cursor: "pointer", width: "100%", textAlign: "left", border: "1px solid rgba(111,84,41,0.08)", background: "rgba(255,255,255,0.78)", borderRadius: "14px", padding: "12px 16px", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}
                          >
                            <div>
                              <strong>🧺 ${L(component.label)}</strong>
                              <p style=${{ margin: "4px 0 0", color: "#7b6b5d", fontSize: "0.88rem" }}>
                                ${component.id} · ${L("tồn")}: ${component.isUnlimitedStock ? L("Không giới hạn / Unlimited") : ((Number(component.stockQty) || 0) + " " + (component.unit || ""))}
                              </p>
                            </div>
                            <span style=${{ color: "#de631d", fontWeight: 700, flexShrink: 0 }}>+ ${L("Thêm / Add")}</span>
                          </button>
                        `;
                      });
                    }
                    var matched = products.filter(function (p) {
                      return p.inventoryMode === "stock" && productMatchesQuery(p, nq);
                    }).slice(0, 20);
                    if (!matched.length) return html`<p style=${{ color: "#7b6b5d", padding: "8px" }}>${L("Không tìm thấy hàng bán lẻ. Nếu sản phẩm có tồn thật, hãy vào Sửa sản phẩm và chọn Hàng bán lẻ. / No direct-stock product found. If this item keeps real stock, edit it and choose Direct Stock.")}</p>`;
                    return matched.map(function (p) {
                      return html`
                        <button
                          key=${p.id}
                          type="button"
                          className="list-row"
                          onClick=${function () { addPurchaseLine(p.id, "product"); setPurchaseProductSearch(""); }}
                          style=${{ cursor: "pointer", width: "100%", textAlign: "left", border: "1px solid rgba(111,84,41,0.08)", background: "rgba(255,255,255,0.78)", borderRadius: "14px", padding: "12px 16px", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}
                        >
                          <div>
                            <strong>${p.image || ""} ${p.name}</strong>
                            <p style=${{ margin: "4px 0 0", color: "#7b6b5d", fontSize: "0.88rem" }}>${p.barcode || ""} · ${L("tồn")}: ${p.stock || 0}</p>
                          </div>
                          <span style=${{ color: "#de631d", fontWeight: 700, flexShrink: 0 }}>+ ${L("Thêm / Add")}</span>
                        </button>
                      `;
                    });
                  })()}
                </div>
              ` : null}

              <div className="management-list" style=${{ marginTop: 16 }}>
                ${purchaseDraft.items.length === 0
                  ? html`<p style=${{ color: "#7b6b5d" }}>${L("Chưa có dòng hàng. / No lines yet.")}</p>`
                  : purchaseDraft.items.map(function (it) {
                      var lineKey = it.lineKey || purchaseLineKey(it.itemType || "product", it.itemId || it.productId || it.componentId);
                      var isComponentLine = it.itemType === "component";
                      var lineStep = isComponentLine && !it.unit ? "0.001" : qtyInputStep(it.unit);
                      var lineMin = isComponentLine && !it.unit ? "0.001" : qtyInputMin(it.unit);
                      return html`
                        <article key=${lineKey} className="list-row list-row-actions">
                          <div>
                            <strong>${it.productName || it.itemName}</strong>
                            <p>
                              <span className="stock-badge" style=${{ marginRight: 8 }}>
                                ${isComponentLine ? L("Thành phần / Component") : L("Sản phẩm / Product")}
                              </span>
                              ${formatCurrency((Number(it.qty) || 0) * (Number(it.unitCost) || 0))}
                              ${it.unit ? " · " + L("Đơn vị / Unit") + ": " + it.unit : ""}
                            </p>
                          </div>
                          <div className="row-actions">
                            <label className="field" style=${{ width: 90 }}>
                              <span>${L("SL / Qty")}</span>
                              <input
                                type="number"
                                min=${lineMin}
                                step=${lineStep}
                                value=${it.qty}
                                onInput=${function (e) { updatePurchaseLine(lineKey, "qty", e.target.value); }}
                              />
                            </label>
                            ${isComponentLine ? html`
                              <label className="field" style=${{ width: 110 }}>
                                <span>${L("Đơn vị / Unit")}</span>
                                <input value=${it.unit || ""} onInput=${function (e) { updatePurchaseLine(lineKey, "unit", e.target.value); }} />
                              </label>
                            ` : null}
                            <label className="field" style=${{ width: 130 }}>
                              <span>${L("Giá nhập / Cost")}</span>
                              <input type="number" min="0" value=${it.unitCost} onInput=${function (e) { updatePurchaseLine(lineKey, "unitCost", e.target.value); }} />
                            </label>
                            <button className="ghost-btn danger-text" onClick=${function () { removePurchaseLine(lineKey); }}>${L("Xóa / Remove")}</button>
                          </div>
                        </article>
                      `;
                    })}
              </div>

              <div className="section-top" style=${{ marginTop: 18 }}>
                <strong style=${{ fontSize: 18 }}>${L("Tổng / Total")}: ${formatCurrency(total)}</strong>
                <div className="row-actions">
                  <button className="ghost-btn" onClick=${resetPurchaseDraft}>${L("Hủy / Cancel")}</button>
                  <button className="primary-btn" onClick=${submitPurchase} disabled=${!purchaseDraft.items.length}>${L("Lưu phiếu nhập / Save Purchase")}</button>
                </div>
              </div>
            </section>

            <section className="surface section-card form-card">
              <h2 className="section-title">${L("Nhà cung cấp / Suppliers")}</h2>
              <form className="form-card" onSubmit=${submitSupplier}>
                <div className="field-grid">
                  <label className="field"><span>${L("Tên / Name")}</span><input value=${supplierDraft.name} onInput=${function (e) { setSupplierDraft(Object.assign({}, supplierDraft, { name: e.target.value })); }} /></label>
                  <label className="field"><span>${L("Điện thoại / Phone")}</span><input value=${supplierDraft.phone} onInput=${function (e) { setSupplierDraft(Object.assign({}, supplierDraft, { phone: e.target.value })); }} /></label>
                  <label className="field" style=${{ gridColumn: "1 / -1" }}><span>${L("Địa chỉ / Address")}</span><input value=${supplierDraft.address} onInput=${function (e) { setSupplierDraft(Object.assign({}, supplierDraft, { address: e.target.value })); }} /></label>
                </div>
                <button type="submit" className="primary-btn">${supplierDraft.id ? L("Lưu / Save") : L("Thêm nhà cung cấp / Add Supplier")}</button>
              </form>
              <div className="management-list" style=${{ marginTop: 12 }}>
                ${suppliers.length === 0
                  ? html`<p style=${{ color: "#7b6b5d" }}>${L("Chưa có nhà cung cấp. / No suppliers yet.")}</p>`
                  : suppliers.map(function (s) {
                      return html`
                        <article key=${s.id} className="list-row list-row-actions">
                          <div>
                            <strong>${s.name}</strong>
                            <p>${s.phone || ""} ${s.address ? " · " + s.address : ""}</p>
                          </div>
                          <div className="row-actions">
                            <button className="ghost-btn" onClick=${function () { setSupplierDraft({ id: s.id, name: s.name, phone: s.phone || "", address: s.address || "", note: s.note || "" }); }}>${L("Sửa / Edit")}</button>
                          </div>
                        </article>
                      `;
                    })}
              </div>
            </section>
          </div>

          <section className="surface section-card" style=${{ marginTop: 24 }}>
            <h2 className="section-title">${L("Lịch sử phiếu nhập / Purchase History")}</h2>
            <div className="management-list">
              ${purchases.length === 0
                ? html`<p style=${{ color: "#7b6b5d" }}>${L("Chưa có phiếu nhập. / No purchases yet.")}</p>`
                : purchases.map(function (po) {
                    var pendingVerify = isPurchasePendingVerification(po);
                    var statusLabel = purchaseStatusLabel(po);
                    return html`
                      <article key=${po.id} className="list-row list-row-actions">
                        <div>
                          <strong>${po.id}</strong>
                          <p>${po.supplier_name || L("Không rõ NCC / Unknown supplier")} · ${po.item_count} ${L("dòng / lines")} · ${formatDateTime(po.created_at)}</p>
                          <p>
                            <span className="stock-badge" style=${{
                              background: pendingVerify ? "#fff3d8" : "#e6f7ea",
                              color: pendingVerify ? "#a86a18" : "#1f8a3a"
                            }}>${L(statusLabel)}</span>
                          </p>
                        </div>
                        <div className="row-actions">
                          <strong>${formatCurrency(po.total_amount)}</strong>
                          <button className="ghost-btn" onClick=${function () { viewPurchaseDetail(po); }}>${L("Xem chi tiết / Details")}</button>
                          ${pendingVerify ? html`
                            <button className="primary-btn" onClick=${function () { verifyPurchase(po, "verify"); }}>${L("Xác nhận / Verify")}</button>
                            <button className="ghost-btn" onClick=${function () { verifyPurchase(po, "needs_revision"); }}>${L("Yêu cầu sửa / Revise")}</button>
                            <button className="ghost-btn danger-text" onClick=${function () { verifyPurchase(po, "reject"); }}>${L("Từ chối / Reject")}</button>
                          ` : null}
                        </div>
                      </article>
                    `;
                  })}
            </div>
          </section>
          ${renderPurchaseDetailModal()}
        </section>
      `;
    }

    // ==================================================================
    // RENDER: XUẤT HÀNG VIEW
    // ==================================================================
    function renderIssuesView(embedded) {
      return html`
        <section className="page-section">
          ${embedded ? null : html`<header className="page-header surface">
            <div>
              <p className="eyebrow">${L("Xuất hàng / Stock Out")}</p>
              <h1 className="section-title">${L("Tạo phiếu xuất (không phải bán) / Create Issue (non-sale)")}</h1>
              <small style=${{ color: "#7b6b5d" }}>${L("Dùng cho xuất hủy, hàng mẫu, sử dụng nội bộ. / Use for damages, samples, internal use.")}</small>
            </div>
            <div className="row-actions">
              <span className="eyebrow">${L("Trạng thái / Status")}: ${syncStatus.online ? "🟢" : "🔴"} ${syncStatus.pending ? ("⏳" + syncStatus.pending) : ""}</span>
            </div>
          </header>`}

          <section className="surface section-card form-card">
            <div className="field-grid">
              <label className="field">
                <span>${L("Lý do / Reason")}</span>
                <select value=${issueDraft.reason} onChange=${function (e) {
                  setIssueDraft(Object.assign({}, issueDraft, { reason: e.target.value }));
                }}>
                  ${ISSUE_REASONS.map(function (r) {
                    return html`<option key=${r.value} value=${r.value}>${L(r.label)}</option>`;
                  })}
                </select>
              </label>
              <label className="field" style=${{ gridColumn: "1 / -1" }}>
                <span>${L("Ghi chú / Note")}</span>
                <input value=${issueDraft.note} onInput=${function (e) {
                  setIssueDraft(Object.assign({}, issueDraft, { note: e.target.value }));
                }} />
              </label>
            </div>

            <h3 className="section-title" style=${{ marginTop: 16 }}>${L("Thêm mặt hàng / Add Item")}</h3>
            <div className="toggle-grid" style=${{ marginBottom: 12 }}>
              <button
                type="button"
                className=${"ghost-btn" + (issueItemType === "product" ? " active-toggle" : "")}
                onClick=${function () { setIssueItemType("product"); setIssueItemSearch(""); }}
              >
                ${L("Sản phẩm / Product")}
              </button>
              <button
                type="button"
                className=${"ghost-btn" + (issueItemType === "component" ? " active-toggle" : "")}
                onClick=${function () { setIssueItemType("component"); setIssueItemSearch(""); }}
              >
                ${L("Thành phần / Component")}
              </button>
            </div>
            <input
              placeholder=${issueItemType === "component"
                ? L("Tìm thành phần/nguyên liệu... / Search component or ingredient...")
                : L("Tìm sản phẩm... / Search product...")}
              value=${issueItemSearch}
              onInput=${function (e) { setIssueItemSearch(e.target.value); }}
              style=${{ marginBottom: "10px" }}
            />
            ${issueItemSearch.trim() ? html`
              <div className="management-list" style=${{ maxHeight: "240px", overflowY: "auto", marginBottom: "12px" }}>
                ${(function () {
                  var nq = normalizeSearchText(issueItemSearch);
                  if (issueItemType === "component") {
                    var matchedComponents = components.filter(function (component) {
                      var haystack = normalizeSearchText([
                        component.id,
                        component.label,
                        L(component.label),
                        component.unit,
                        component.note
                      ].join(" "));
                      return haystack.indexOf(nq) !== -1;
                    }).slice(0, 20);
                    if (!matchedComponents.length) return html`<p style=${{ color: "#7b6b5d", padding: "8px" }}>${L("Không tìm thấy thành phần. / No components found.")}</p>`;
                    return matchedComponents.map(function (component) {
                      return html`
                        <button
                          key=${component.id}
                          type="button"
                          className="list-row"
                          onClick=${function () { addIssueLine(component.id, "component"); setIssueItemSearch(""); }}
                          style=${{ cursor: "pointer", width: "100%", textAlign: "left", border: "1px solid rgba(111,84,41,0.08)", background: "rgba(255,255,255,0.78)", borderRadius: "14px", padding: "12px 16px", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}
                        >
                          <div>
                            <strong>🧺 ${L(component.label)}</strong>
                            <p style=${{ margin: "4px 0 0", color: "#7b6b5d", fontSize: "0.88rem" }}>
                              ${component.id} · ${L("tồn")}: ${component.isUnlimitedStock ? L("Không giới hạn / Unlimited") : ((Number(component.stockQty) || 0) + " " + (component.unit || ""))}
                            </p>
                          </div>
                          <span style=${{ color: "#de631d", fontWeight: 700, flexShrink: 0 }}>+ ${L("Thêm / Add")}</span>
                        </button>
                      `;
                    });
                  }
                  var matchedProducts = products.filter(function (p) { return productMatchesQuery(p, nq); }).slice(0, 20);
                  if (!matchedProducts.length) return html`<p style=${{ color: "#7b6b5d", padding: "8px" }}>${L("Không tìm thấy sản phẩm. / No products found.")}</p>`;
                  return matchedProducts.map(function (p) {
                    return html`
                      <button
                        key=${p.id}
                        type="button"
                        className="list-row"
                        onClick=${function () { addIssueLine(p.id, "product"); setIssueItemSearch(""); }}
                        style=${{ cursor: "pointer", width: "100%", textAlign: "left", border: "1px solid rgba(111,84,41,0.08)", background: "rgba(255,255,255,0.78)", borderRadius: "14px", padding: "12px 16px", marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}
                      >
                        <div>
                          <strong>${p.image || ""} ${p.name}</strong>
                          <p style=${{ margin: "4px 0 0", color: "#7b6b5d", fontSize: "0.88rem" }}>${p.barcode || ""} · ${L("tồn")}: ${p.stock || 0}</p>
                        </div>
                        <span style=${{ color: "#de631d", fontWeight: 700, flexShrink: 0 }}>+ ${L("Thêm / Add")}</span>
                      </button>
                    `;
                  });
                })()}
              </div>
            ` : null}

            <div className="management-list" style=${{ marginTop: 16 }}>
              ${issueDraft.items.length === 0
                ? html`<p style=${{ color: "#7b6b5d" }}>${L("Chưa có dòng hàng. / No lines yet.")}</p>`
                : issueDraft.items.map(function (it) {
                    var lineKey = it.lineKey || issueLineKey(it.itemType || "product", it.itemId || it.productId || it.componentId);
                    var isComponentLine = it.itemType === "component";
                    var p = isComponentLine ? null : products.find(function (x) { return x.id === it.productId; });
                    var c = isComponentLine ? components.find(function (x) { return x.id === it.componentId; }) : null;
                    var issueUnit = isComponentLine ? (c ? c.unit : "") : (p ? p.unit : "");
                    var stock = isComponentLine ? (c ? Number(c.stockQty) || 0 : 0) : (p ? Number(p.stock) || 0 : 0);
                    var unlimitedLine = isComponentLine && c && c.isUnlimitedStock;
                    var over = !unlimitedLine && (Number(it.qty) || 0) > stock;
                    return html`
                      <article key=${lineKey} className="list-row list-row-actions">
                        <div>
                          <strong>${it.productName}</strong>
                          <p style=${{ color: over ? "#c0392b" : "#7b6b5d" }}>
                            <span className="stock-badge" style=${{ marginRight: 8 }}>
                              ${isComponentLine ? L("Thành phần / Component") : L("Sản phẩm / Product")}
                            </span>
                            ${L("Tồn")}: ${unlimitedLine ? L("Không giới hạn / Unlimited") : stock}${over ? " ⚠ " + L("vượt tồn / over stock") : ""}
                          </p>
                        </div>
                        <div className="row-actions">
                          <label className="field" style=${{ width: 100 }}>
                            <span>${L("SL / Qty")}</span>
                            <input
                              type="number"
                              min=${isComponentLine && !issueUnit ? "0.001" : qtyInputMin(issueUnit)}
                              step=${isComponentLine && !issueUnit ? "0.001" : qtyInputStep(issueUnit)}
                              value=${it.qty}
                              onInput=${function (e) { updateIssueLine(lineKey, e.target.value); }}
                            />
                          </label>
                          <button className="ghost-btn danger-text" onClick=${function () { removeIssueLine(lineKey); }}>${L("Xóa / Remove")}</button>
                        </div>
                      </article>
                    `;
                  })}
            </div>

            <div className="section-top" style=${{ marginTop: 18 }}>
              <strong>${L("Tổng dòng / Total lines")}: ${issueDraft.items.length}</strong>
              <div className="row-actions">
                <button className="ghost-btn" onClick=${resetIssueDraft}>${L("Hủy / Cancel")}</button>
                <button className="primary-btn" onClick=${submitIssue} disabled=${!issueDraft.items.length}>${L("Lưu phiếu xuất / Save Issue")}</button>
              </div>
            </div>
          </section>

          <section className="surface section-card" style=${{ marginTop: 24 }}>
            <h2 className="section-title">${L("Lịch sử phiếu xuất / Issue History")}</h2>
            <div className="management-list">
              ${issues.length === 0
                ? html`<p style=${{ color: "#7b6b5d" }}>${L("Chưa có phiếu xuất. / No issues yet.")}</p>`
                : issues.map(function (px) {
                    return html`
                      <article key=${px.id} className="list-row list-row-actions">
                        <div>
                          <strong>${px.id}</strong>
                          <p>${L("Lý do")}: ${px.reason} · ${px.item_count} ${L("dòng / lines")} · ${px.total_qty || 0} ${L("món / items")} · ${formatDateTime(px.created_at)}</p>
                        </div>
                        <div className="row-actions">
                          <button className="ghost-btn" onClick=${function () { viewIssueDetail(px); }}>${L("Xem chi tiết / Details")}</button>
                        </div>
                      </article>
                    `;
                  })}
            </div>
          </section>
          ${renderIssueDetailModal()}
        </section>
      `;
    }

    // ==================================================================
    // RENDER: LƯU KHO VIEW (warehouse)
    // ==================================================================
    function renderWarehouseView() {
      var tabs = [
        { id: "stock",     label: "Tồn hiện tại / Current Stock" },
        { id: "ledger",    label: "Sổ cái / Movement Ledger" },
        { id: "stocktake", label: "Kiểm kê / Stocktake" }
      ];
      // Use the shared lowStockAlerts (above) so this count matches the
      // topbar badge + POS banner.  (Avoids the previous min=0 false positive.)

      return html`
        <section className="page-section">
          <header className="page-header surface">
            <div>
              <p className="eyebrow">${L("Lưu kho / Warehouse")}</p>
              <h1 className="section-title">${L("Quản lý kho hàng / Inventory Management")}</h1>
              <small style=${{ color: "#7b6b5d" }}>${L("Đồng bộ với Supabase/API. / Synced with Supabase/API.")}</small>
            </div>
            <div className="row-actions">
              ${lowStockCount > 0 ? html`<span className="eyebrow" style=${{ color: "#c0392b" }}>⚠ ${lowStockCount} ${L("mục sắp hết / low-stock items")}</span>` : null}
              <span className="eyebrow">${syncStatus.online ? "🟢" : "🔴"} ${syncStatus.pending ? ("⏳" + syncStatus.pending) : ""}</span>
            </div>
          </header>

          <div className="settings-nav" style=${{ marginBottom: 16 }}>
            ${tabs.map(function (tab) {
              return html`
                <button key=${tab.id}
                  className=${"settings-nav-btn" + (warehouseTab === tab.id ? " is-active" : "")}
                  onClick=${function () {
                    setWarehouseTab(tab.id);
                    if (tab.id === "ledger") refreshMovements();
                  }}>${L(tab.label)}</button>
              `;
            })}
          </div>

          ${warehouseTab === "stock" ? html`
            <section className="surface section-card">
              <div className="section-top">
                <h2 className="section-title">${L("Tồn hiện tại / On-Hand Quantity")}</h2>
              </div>
              <!-- Search box (accent-insensitive name / barcode / SKU) -->
              <div className="field" style=${{ marginBottom: 12 }}>
                <input
                  type="search"
                  value=${warehouseSearchTerm}
                  placeholder=${L("Tìm tên SP / barcode / SKU... / Search name / barcode / SKU")}
                  onInput=${function (e) { setWarehouseSearchTerm(e.target.value); }}
                  style=${{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #e5d5c7", fontSize: 14 }}
                />
                ${warehouseSearchTerm
                  ? html`<small style=${{ color: "#7b6b5d", marginTop: 4, display: "block" }}>
                      ${(function () {
                        var nq = normalizeSearchText(warehouseSearchTerm);
                        var n = products.filter(function (p) { return productMatchesQuery(p, nq); }).length;
                        return n + " " + L("kết quả / matches");
                      })()}
                      · <a href="#" onClick=${function (e) { e.preventDefault(); setWarehouseSearchTerm(""); }}>${L("Xóa / Clear")}</a>
                    </small>`
                  : null}
              </div>
              <div className="management-list">
                ${(function () {
                  var nq = normalizeSearchText(warehouseSearchTerm);
                  return products.filter(function (p) { return productMatchesQuery(p, nq); });
                })().map(function (p) {
                  var qty = Number(p.stock) || 0;
                  var min = Number(p.minStock) || 0;
                  // Match the shared rule: only "low" when a min is set.
                  var low = min > 0 && qty <= min;
                  return html`
                    <article key=${p.id} className="list-row list-row-actions">
                      <div>
                        <strong>${p.image} ${p.name}</strong>
                        <p style=${{ color: low ? "#c0392b" : "#7b6b5d" }}>${L("Tồn")}: ${qty}${p.unit ? " " + p.unit : ""} ${low ? " ⚠ " + L("dưới mức tối thiểu / below min") : ""} · ${L("Giá vốn")}: ${formatCurrency(p.costPrice || 0)} · SKU: ${p.skuCode || p.id}</p>
                      </div>
                    </article>
                  `;
                })}
              </div>
            </section>
          ` : null}

          ${warehouseTab === "ledger" ? html`
            <section className="surface section-card">
              <div className="section-top">
                <h2 className="section-title">${L("Sổ cái chuyển động kho / Stock Movement Ledger")}</h2>
                <button className="ghost-btn" onClick=${function () { refreshMovements(); }}>${L("Tải lại / Reload")}</button>
              </div>
              <div className="management-list">
                ${movements.length === 0
                  ? html`<p style=${{ color: "#7b6b5d" }}>${L("Chưa có chuyển động. / No movements yet.")}</p>`
                  : movements.map(function (m) {
                      var sign = m.qty_change > 0 ? "+" : "";
                      return html`
                        <article key=${m.id} className="list-row list-row-actions">
                          <div>
                            <strong>${m.product_name || m.product_id}</strong>
                            <p>${formatMovementType(m.movement_type)} · ${formatDateTime(m.created_at)} ${m.ref_id ? " · " + m.ref_id : ""}</p>
                          </div>
                          <strong style=${{ color: m.qty_change > 0 ? "#1f8a3a" : "#c0392b" }}>${sign}${m.qty_change}</strong>
                        </article>
                      `;
                    })}
              </div>
            </section>
          ` : null}

          ${warehouseTab === "stocktake" ? html`
            <section className="surface section-card">
              <h2 className="section-title">${L("Kiểm kê / Stocktake")}</h2>
              <p style=${{ color: "#7b6b5d" }}>${L("Nhập số lượng thực tế. Hệ thống sẽ tự sinh phiếu điều chỉnh tăng/giảm. / Enter actual quantity. The system will create adjustment entries.")}</p>
              <div className="management-list">
                ${products.map(function (p) {
                  var actual = stocktakeDraft[p.id];
                  var diff = (actual === undefined || actual === "") ? null : normalizeQtyForUnit(actual, p.unit) - (Number(p.stock) || 0);
                  return html`
                    <article key=${p.id} className="list-row list-row-actions">
                      <div>
                        <strong>${p.image} ${p.name}</strong>
                        <p>${L("Tồn hệ thống / System stock")}: ${p.stock || 0}</p>
                      </div>
                      <div className="row-actions">
                        <label className="field" style=${{ width: 110 }}>
                          <span>${L("Thực tế / Actual")}</span>
                          <input type="number" min="0" step=${qtyInputStep(p.unit)} value=${actual === undefined ? "" : actual} onInput=${function (e) {
                            var val = e.target.value;
                            setStocktakeDraft(function (cur) { var next = Object.assign({}, cur); next[p.id] = val; return next; });
                          }} />
                        </label>
                        ${diff !== null && diff !== 0
                          ? html`<strong style=${{ color: diff > 0 ? "#1f8a3a" : "#c0392b" }}>${diff > 0 ? "+" : ""}${diff}</strong>`
                          : null}
                      </div>
                    </article>
                  `;
                })}
              </div>
              <div className="section-top" style=${{ marginTop: 18 }}>
                <button className="ghost-btn" onClick=${function () { setStocktakeDraft({}); }}>${L("Xóa nháp / Clear draft")}</button>
                <button className="primary-btn" onClick=${submitStocktake}>${L("Ghi nhận kiểm kê / Submit Stocktake")}</button>
              </div>
            </section>
          ` : null}
        </section>
      `;
    }

    function renderSettingsView() {
      var settingsTabs = [
        { id: "general", label: "Chung / General" },
        { id: "invoice", label: "Hóa đơn / Invoice" }
      ];
      var firebaseStatusLabelMap = {
        local: "Chỉ lưu máy này / Local only",
        incomplete: "Thiếu cấu hình / Incomplete config",
        connecting: "Đang kết nối / Connecting",
        syncing: "Đang đồng bộ / Syncing",
        synced: "Đã đồng bộ / Synced",
        error: "Lỗi đồng bộ / Sync error"
      };

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
                <label className="field">
                  <span>${L("Logo cửa hàng (màu, dùng trên app) / Shop Logo (color, app UI)")}</span>
                  <input
                    value=${settings.logoUrl || ""}
                    placeholder="/logo.png"
                    onInput=${function (event) { patchSettings("logoUrl", event.target.value); }}
                  />
                  <small>${L("Logo màu hiển thị trong app. Mặc định /logo.png / Color logo for app UI. Default /logo.png")}</small>
                </label>
                <label className="field">
                  <span>${L("Logo in hóa đơn (B/W) / Receipt Logo (B/W)")}</span>
                  <input
                    value=${settings.logoPrintUrl || ""}
                    placeholder="/logo-thermal.png"
                    onInput=${function (event) { patchSettings("logoPrintUrl", event.target.value); }}
                  />
                  <small>${L("Phiên bản đen-trắng để in máy nhiệt đậm rõ. Trống = tự dùng logo màu. Mặc định /logo-thermal.png. / B/W version printing darker on thermal printers. Blank = use color logo. Default /logo-thermal.png.")}</small>
                </label>
                <div className="template-preview brand-preview">
                  ${settings.logoUrl
                    ? html`<img src=${settings.logoUrl} alt="logo" style=${{ maxWidth: 180, maxHeight: 80, display: "block", marginBottom: 8 }} />`
                    : null}
                  <p className="eyebrow">${settings.brandLine || settings.storeName}</p>
                  <h3>${settings.brandDisplayName || settings.storeName}</h3>
                  <small>${settings.branchName} · ${settings.phone}</small>
                </div>
                <div className="list-stack">
                  <div className="empty-state align-left">
                    ${syncStatus.online
                      ? L("Mọi thay đổi tự động lưu lên Supabase/API (1s delay). / Changes auto-save to Supabase/API (1s delay).")
                      : L("Đang offline – thay đổi sẽ đồng bộ khi có mạng lại. / Offline – changes will sync when reconnected.")}
                  </div>
                </div>
                <section className="surface section-card form-card" style=${{ marginTop: "8px" }}>
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Đồng bộ cloud / Cloud Sync")}</p>
                      <h3 className="template-preview-title">${L("Firebase Firestore")}</h3>
                    </div>
                    <span className="stock-badge">${L(firebaseStatusLabelMap[firebaseSyncStatus] || firebaseStatusLabelMap.local)}</span>
                  </div>
                  <label className="toggle-card">
                    <input
                      type="checkbox"
                      checked=${!!settings.firebaseSyncEnabled}
                      onChange=${function (event) { patchSettings("firebaseSyncEnabled", event.target.checked); }}
                    />
                    <span>${L("Bật đồng bộ nhiều máy qua Firebase / Enable multi-device sync through Firebase")}</span>
                  </label>
                  <div className="field-grid">
                    <label className="field"><span>${L("API Key")}</span><input value=${settings.firebaseApiKey || ""} onInput=${function (event) { patchSettings("firebaseApiKey", event.target.value); }} /></label>
                    <label className="field"><span>${L("Auth Domain")}</span><input value=${settings.firebaseAuthDomain || ""} onInput=${function (event) { patchSettings("firebaseAuthDomain", event.target.value); }} /></label>
                    <label className="field"><span>${L("Project ID")}</span><input value=${settings.firebaseProjectId || ""} onInput=${function (event) { patchSettings("firebaseProjectId", event.target.value); }} /></label>
                    <label className="field"><span>${L("Storage Bucket")}</span><input value=${settings.firebaseStorageBucket || ""} onInput=${function (event) { patchSettings("firebaseStorageBucket", event.target.value); }} /></label>
                    <label className="field"><span>${L("Messaging Sender ID")}</span><input value=${settings.firebaseMessagingSenderId || ""} onInput=${function (event) { patchSettings("firebaseMessagingSenderId", event.target.value); }} /></label>
                    <label className="field"><span>${L("App ID")}</span><input value=${settings.firebaseAppId || ""} onInput=${function (event) { patchSettings("firebaseAppId", event.target.value); }} /></label>
                    <label className="field"><span>${L("Measurement ID (optional)")}</span><input value=${settings.firebaseMeasurementId || ""} onInput=${function (event) { patchSettings("firebaseMeasurementId", event.target.value); }} /></label>
                    <label className="field"><span>${L("Collection")}</span><input value=${settings.firebaseSyncCollection || ""} onInput=${function (event) { patchSettings("firebaseSyncCollection", event.target.value); }} /></label>
                    <label className="field"><span>${L("Document ID")}</span><input value=${settings.firebaseSyncDocument || ""} onInput=${function (event) { patchSettings("firebaseSyncDocument", event.target.value); }} /></label>
                  </div>
                  <div className="row-actions">
                    <button type="button" className="primary-btn" onClick=${function () { pushStateToFirebase("manual"); }}>${L("Đẩy dữ liệu hiện tại lên cloud / Sync now")}</button>
                    <button type="button" className="ghost-btn" onClick=${pullStateFromFirebase}>${L("Lấy dữ liệu từ cloud / Pull cloud data")}</button>
                    ${firebaseLastSyncedAt ? html`<span className="metric-label">${L("Lần đồng bộ gần nhất / Last sync")}: ${firebaseLastSyncedAt}</span>` : null}
                  </div>
                  <div className="empty-state align-left">
                    ${L("Cloudflare và Vercel chỉ cập nhật code. Muốn nhiều máy thấy cùng dữ liệu, hãy nhập cùng cấu hình Firebase trên các máy rồi bật đồng bộ. / Cloudflare and Vercel only update code. For shared data across devices, enter the same Firebase config on each device and enable sync.")}
                  </div>
                  ${firebaseSyncError ? html`<div className="empty-state align-left danger-text">${firebaseSyncError}</div>` : null}
                </section>
              </section>
            ` : null}

            ${settingsSection === "invoice" ? html`
              <div className="stack-view settings-pane">
                <section className="surface section-card">
                  <div className="section-top">
                    <div>
                      <p className="eyebrow">${L("Mẫu hóa đơn / Invoice Templates")}</p>
                      <h2 className="section-title">${L("Mẫu hóa đơn FnB sẵn sàng bán hàng / Ready-to-sell FnB Invoices")}</h2>
                    </div>
                    <button className="ghost-btn" onClick=${addInvoiceTemplate}>${L("Thêm mẫu / Add Template")}</button>
                  </div>

                  <div className="invoice-template-grid">
                    ${invoiceTemplates.map(function (template) {
                      return html`
                        <button
                          key=${template.id}
                          className=${"invoice-template-card" + (selectedInvoiceTemplateId === template.id ? " is-active" : "")}
                          onClick=${function () {
                            setSelectedInvoiceTemplateId(template.id);
                          }}
                        >
                          <div>
                            <strong>${template.name}</strong>
                            <small>${L(template.title)}</small>
                          </div>
                          <span>${template.showTaxId ? L("Có VAT / VAT Ready") : L("Bán lẻ / Retail")}</span>
                        </button>
                      `;
                    })}
                  </div>

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
                        ["showUnitPrice", "Hiện đơn giá / Show unit price"],
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
                      <div className="invoice-preview-line">
                        <span>${L("Sinh tố bơ x2 / Avocado Smoothie x2")}</span>
                        <strong>${activeInvoiceTemplate.showUnitPrice ? "55.000 đ × 2" : "110.000 đ"}</strong>
                      </div>
                      <div className="invoice-preview-line">
                        <span>${L("Topping hạt chia / Chia topping")}</span>
                        <strong>8.000 đ</strong>
                      </div>
                      <div className="invoice-preview-total">
                        <span>${L("Tổng cộng / Total")}</span>
                        <strong>118.000 đ</strong>
                      </div>
                      <small>${settings.storeName} · ${settings.phone}</small>
                    </div>
                    <div className="button-row button-row-secondary">
                      <button className="ghost-btn" onClick=${function () { setSelectedInvoiceTemplateId(activeInvoiceTemplate.id); }}>${L("Dùng mẫu này / Use This Template")}</button>
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
                        <label className="field"><span>${L("Mã danh mục / Category Code")}</span><input placeholder="VD: ORIA7000" value=${categoryDraft.code} onInput=${function (event) { updateCategoryDraft("code", event.target.value); }} /></label>
                        <label className="field"><span>${L("Tên tiếng Việt / Vietnamese Name")}</span><input value=${categoryDraft.labelVi} onInput=${function (event) { updateCategoryDraft("labelVi", event.target.value); }} /></label>
                        <label className="field"><span>${L("Tên tiếng Anh / English Name")}</span><input value=${categoryDraft.labelEn} onInput=${function (event) { updateCategoryDraft("labelEn", event.target.value); }} /></label>
                        <label className="field">
                          <span>${L("Icon / Icon")}</span>
                          <select value=${categoryDraft.icon || "🛒"} onChange=${function (event) { updateCategoryDraft("icon", event.target.value); }}>
                            ${categoryDraft.icon && !CATEGORY_ICON_OPTIONS.some(function (item) { return item.value === categoryDraft.icon; })
                              ? html`<option value=${categoryDraft.icon}>${categoryDraft.icon} ${L("Icon hiện tại / Current Icon")}</option>`
                              : null}
                            ${CATEGORY_ICON_OPTIONS.map(function (item) {
                              return html`<option key=${item.value} value=${item.value}>${item.value} ${L(item.label)}</option>`;
                            })}
                          </select>
                        </label>
                      </div>
                      <button type="submit" className="primary-btn">${categoryDraft.id ? L("Lưu danh mục / Save Category") : L("Thêm danh mục / Add Category")}</button>
                    </form>
                    <div className="management-list">
                      ${categories.map(function (category) {
                        return html`
                          <article key=${category.id} className="list-row list-row-actions">
                            <div>
                              <strong>${category.icon} ${L(category.label)}</strong>
                              <p>${category.code ? category.code + " · " : ""}${category.id}</p>
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
                            <strong>${product.imageIcon || "🛒"} ${product.name}</strong>
                            <p>${category ? L(category.label) : product.category}</p>
                          </div>
                          <div className="row-actions stock-editor">
                            <${LocalNumberInput}
                              min="0"
                              step=${qtyInputStep(product.unit)}
                              value=${product.stock}
                              onChange=${function (val) {
                                updateProductStock(product.id, val);
                              }}
                              onBlur=${function () { flushPendingStockEdit(product.id); }}
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

    if (authLoading) {
      return html`
        <div style=${{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#fffaf4", fontFamily: "sans-serif" }}>
          <div style=${{ textAlign: "center" }}>
            <div style=${{ fontSize: 24, marginBottom: 12 }}>🍊</div>
            <div style=${{ color: "#7b6b5d", fontSize: 14 }}>${L("Đang kiểm tra thông tin đăng nhập... / Checking credentials...")}</div>
          </div>
        </div>
      `;
    }

    if (!currentUser) {
      return html`
        <div style=${{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#fffaf4", fontFamily: "sans-serif" }}>
          <form onSubmit=${handleLoginSubmit} style=${{ background: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #eedecf", width: "100%", maxWidth: "380px", boxShadow: "0 8px 24px rgba(111,84,41,0.06)" }}>
            <div style=${{ textAlign: "center", marginBottom: 24 }}>
              <div style=${{ fontSize: 36, marginBottom: 8 }}>🍊</div>
              <h2 style=${{ margin: 0, color: "#5b3a20", fontSize: "1.4rem" }}>${L("Đăng nhập POS / POS Login")}</h2>
              <p style=${{ margin: "4px 0 0", color: "#a48a73", fontSize: "0.85rem" }}>${L("Sử dụng tài khoản hệ thống của bạn / Use your store credentials")}</p>
            </div>
            
            ${loginError ? html`
              <div style=${{ background: "#fde2e0", color: "#c0392b", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: 16, border: "1px solid #f9c1b9" }}>
                ${loginError}
              </div>
            ` : null}

            <div style=${{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style=${{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style=${{ fontSize: "0.85rem", fontWeight: "bold", color: "#5b3a20" }}>${L("Email / Tài khoản")}</span>
                <input
                  type="email"
                  value=${loginEmail}
                  onInput=${function (e) { setLoginEmail(e.target.value); }}
                  placeholder="cashier@shopprogram.local"
                  required
                  style=${{ padding: "10px 12px", border: "1px solid #eedecf", borderRadius: "8px", fontSize: "0.95rem" }}
                />
              </label>
              
              <label style=${{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style=${{ fontSize: "0.85rem", fontWeight: "bold", color: "#5b3a20" }}>${L("Mật khẩu / Password")}</span>
                <input
                  type="password"
                  value=${loginPassword}
                  onInput=${function (e) { setLoginPassword(e.target.value); }}
                  placeholder="••••••••"
                  required
                  style=${{ padding: "10px 12px", border: "1px solid #eedecf", borderRadius: "8px", fontSize: "0.95rem" }}
                />
              </label>

              <button
                type="submit"
                disabled=${loginSubmitting}
                style=${{ background: "#df5d16", color: "#ffffff", border: 0, padding: "12px", borderRadius: "8px", fontSize: "0.95rem", fontWeight: "bold", cursor: "pointer", marginTop: 8 }}
              >
                ${loginSubmitting ? L("Đang đăng nhập... / Logging in...") : L("Đăng nhập / Log In")}
              </button>
            </div>
          </form>
        </div>
      `;
    }

    return html`
      <div className="app-shell">
        <${MenuDrawer}
          open=${menuOpen}
          activeView=${activeView}
          storeName=${settings.storeName}
          language=${language}
          user=${currentUser}
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
              placeholder=${L("Tìm chức năng: kho, hóa đơn, tem, thành phần... / Search functions: stock, invoice, label...")}
              value=${functionSearchTerm}
              onInput=${function (event) { setFunctionSearchTerm(event.target.value); }}
              onKeyDown=${function (event) {
                if (event.key === "Enter" && functionSearchResults.length) {
                  event.preventDefault();
                  openFunctionDestination(functionSearchResults[0]);
                }
                if (event.key === "Escape") {
                  setFunctionSearchTerm("");
                }
              }}
            />
            ${functionSearchResults.length ? html`
              <div className="function-search-panel surface">
                ${functionSearchResults.map(function (item) {
                  return html`
                    <button
                      key=${item.label}
                      type="button"
                      className="function-search-item"
                      onMouseDown=${function (event) {
                        event.preventDefault();
                        openFunctionDestination(item);
                      }}
                    >
                      <strong>${L(item.label)}</strong>
                      <small>${L(item.help)}</small>
                    </button>
                  `;
                })}
              </div>
            ` : null}
          </div>

          <div className="topbar-actions" style=${{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            ${currentUser ? html`
              <div
                className="lang-switch surface"
                style=${{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px" }}
              >
                <span style=${{ fontSize: 14 }}>👤</span>
                <small style=${{ color: "#7b6b5d", fontWeight: "bold" }}>
                  ${currentUser.email.split("@")[0]} (${currentUser.role})
                </small>
                <button
                  type="button"
                  className="ghost-btn"
                  style=${{ padding: "2px 6px", fontSize: 11, marginLeft: 4, cursor: "pointer", background: "#fde2e0", color: "#c0392b", border: "1px solid #fde2e0", borderRadius: 4 }}
                  onClick=${handleLogout}
                >
                  ${L("Đăng xuất / Logout")}
                </button>
              </div>
            ` : null}
            <div
              className="lang-switch surface"
              title=${syncStatus.lastError ? syncStatus.lastError : (syncStatus.online ? "Supabase/API online" : "Offline")}
              style=${{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px" }}
            >
            <span style=${{ fontSize: 14 }}>${syncStatus.online ? "🟢" : "🔴"}</span>
            <small style=${{ color: "#7b6b5d" }}>
              ${syncStatus.online ? "Supabase/API" : L("Ngoại tuyến / Offline")}
              ${syncStatus.pending ? " · ⏳" + syncStatus.pending : ""}
            </small>
          </div>

          ${lowStockCount > 0 ? html`
            <button
              type="button"
              className="lang-switch surface"
              title=${lowStockAlerts.slice(0, 8).map(function (item) {
                return item.label + " (" + formatQuantity(item.qty, 2) + "/" + formatQuantity(item.min, 2) + (item.unit ? " " + item.unit : "") + ")";
              }).join("\n")}
              style=${{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 12px",
                background: "#fff1eb", border: "1px solid #f5b893",
                color: "#a4451a", cursor: "pointer", fontWeight: 600
              }}
              onClick=${function () {
                setActiveView("inventory");
                setInventorySection("stock");
                setStockCheckTab("check");
              }}
            >
              <span style=${{ fontSize: 16 }}>⚠</span>
              <span>${lowStockCount} ${L("mục sắp hết / low-stock")}</span>
            </button>
          ` : null}

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
          </div>
        </header>

        <main className="page-body">
          ${activeView === "pos" ? renderPosView() : null}
          ${activeView === "dashboard" ? renderDashboardView() : null}
          ${activeView === "inventory" ? renderInventoryView() : null}
          ${activeView === "settings" ? renderSettingsView() : null}
        </main>

        <!-- Toast stack — fixed bottom-right, stacks vertically, auto-dismiss -->
        <div
          aria-live="polite"
          style=${{
            position: "fixed", bottom: 18, right: 18, zIndex: 9999,
            display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none"
          }}>
          ${toasts.map(function (t) {
            var bg = t.kind === "error"   ? "#fde2e0"
                    : t.kind === "success" ? "#e6f7ea"
                    :                        "#fff8e0";
            var bd = t.kind === "error"   ? "#c0392b"
                    : t.kind === "success" ? "#1f8a3a"
                    :                        "#a47218";
            var icon = t.kind === "error"   ? "⚠"
                      : t.kind === "success" ? "✓"
                      :                        "ℹ";
            return html`
              <div
                key=${t.id}
                style=${{
                  background: bg, color: bd, border: "1px solid " + bd,
                  borderLeft: "4px solid " + bd,
                  borderRadius: 10, padding: "10px 14px",
                  fontWeight: 600, fontSize: 13,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  minWidth: 220, maxWidth: 360,
                  display: "flex", gap: 8, alignItems: "center"
                }}>
                <span style=${{ fontSize: 16 }}>${icon}</span>
                <span>${t.text}</span>
              </div>
            `;
          })}
        </div>
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
