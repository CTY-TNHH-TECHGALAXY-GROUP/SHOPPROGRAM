(function () {
  var state = {
    activeTab: "request",
    products: [],
    components: [],
    suppliers: [],
    requests: [],
    requestLines: [],
    receiveLines: [],
    itemType: "product",
    search: "",
    saving: false,
  };

  var $ = function (id) { return document.getElementById(id); };
  var formatter = new Intl.NumberFormat("vi-VN");

  function money(value) {
    return formatter.format(Math.round(Number(value) || 0)) + " đ";
  }

  function numberValue(value) {
    var num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  function genClientOpId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "purchase-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function api(path, opts) {
    var apiBase = String(window.SHOPFLOW_API_BASE || "").replace(/\/+$/, "");
    if (!apiBase && window.ShopFlowSync && typeof window.ShopFlowSync.api === "function") {
      return window.ShopFlowSync.api(path, opts);
    }
    var init = opts || {};
    return fetch((apiBase || "/api") + path, {
      method: init.method || "GET",
      headers: init.body ? { "Content-Type": "application/json" } : {},
      body: init.body ? JSON.stringify(init.body) : undefined,
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || data.ok === false) {
          throw new Error((data && data.error) || "Không gọi được API");
        }
        return data;
      });
    });
  }

  function setStatus(text, mode) {
    var el = $("syncStatus");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-error", mode === "error");
  }

  function setMessage(id, text, mode) {
    var el = $(id);
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("is-success", mode === "success");
    el.classList.toggle("is-error", mode === "error");
  }

  function normalizeProduct(product) {
    return {
      type: "product",
      id: product.id,
      name: product.name || product.id,
      category: product.category || "",
      barcode: product.barcode || "",
      sku: product.skuCode || product.sku_code || product.id,
      unit: product.unit || "cái",
      stock: numberValue(product.stock),
      unitCost: numberValue(product.costPrice || product.cost_price),
      inventoryMode: product.inventoryMode || product.inventory_mode || "",
      icon: product.image || "📦",
    };
  }

  function normalizeComponent(component) {
    return {
      type: "component",
      id: component.id,
      name: component.label || component.name || component.id,
      category: component.item_type || component.category || "component",
      barcode: component.barcode || "",
      sku: component.id,
      unit: component.unit || "unit",
      stock: numberValue(component.stock_qty || component.stockQty),
      unitCost: numberValue(component.cost_per_unit || component.costPerUnit),
      inventoryMode: "component",
      icon: "🥣",
    };
  }

  function findCatalogItem(itemType, itemId) {
    var list = itemType === "component" ? state.components : state.products;
    return list.find(function (item) { return item.id === itemId; }) || null;
  }

  function activeItems() {
    var list = state.itemType === "component" ? state.components : state.products;
    if (state.itemType === "product") {
      list = list.filter(function (item) { return item.inventoryMode === "stock"; });
    }
    var query = state.search.trim().toLowerCase();
    if (!query) return list.slice(0, 40);
    return list.filter(function (item) {
      return [item.name, item.id, item.barcode, item.sku, item.category]
        .join(" ")
        .toLowerCase()
        .indexOf(query) >= 0;
    }).slice(0, 60);
  }

  function lineKey(itemType, itemId) {
    return itemType + ":" + itemId;
  }

  function addRequestLine(item) {
    var key = lineKey(item.type, item.id);
    var existing = state.requestLines.find(function (line) { return line.key === key; });
    if (existing) {
      existing.qty += item.type === "component" ? 0.5 : 1;
    } else {
      state.requestLines.push({
        key: key,
        itemType: item.type,
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        qty: item.type === "component" ? 1 : 1,
        unitCost: item.unitCost || 0,
        meta: (item.type === "component" ? "Thành phần" : "Hàng bán lẻ") + " · Tồn " + formatter.format(item.stock) + " " + item.unit,
      });
    }
    state.search = "";
    $("itemSearch").value = "";
    render();
  }

  function removeRequestLine(key) {
    state.requestLines = state.requestLines.filter(function (line) { return line.key !== key; });
    render();
  }

  function totals(lines) {
    return (lines || []).reduce(function (acc, line) {
      var qty = numberValue(line.qty);
      acc.qty += qty;
      acc.amount += qty * numberValue(line.unitCost);
      return acc;
    }, { qty: 0, amount: 0 });
  }

  function selectedSupplier() {
    var supplierId = $("supplierSelect").value;
    var supplier = state.suppliers.find(function (item) { return item.id === supplierId; });
    var typedName = $("supplierName").value.trim();
    return {
      id: supplier ? supplier.id : "",
      name: typedName || (supplier ? supplier.name : ""),
    };
  }

  function renderSuppliers() {
    var select = $("supplierSelect");
    if (!select) return;
    var current = select.value;
    select.innerHTML = '<option value="">Chọn nhà cung cấp hoặc nhập mới</option>';
    state.suppliers.forEach(function (supplier) {
      var option = document.createElement("option");
      option.value = supplier.id;
      option.textContent = supplier.name;
      select.appendChild(option);
    });
    select.value = current;
  }

  function renderWorkflowTabs() {
    document.querySelectorAll(".workflow-tab").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.workflow === state.activeTab);
    });
    document.querySelectorAll(".workflow-panel").forEach(function (panel) {
      panel.classList.toggle("is-hidden", panel.dataset.panel !== state.activeTab);
    });
  }

  function renderTypeTabs() {
    document.querySelectorAll(".type-tab").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.type === state.itemType);
    });
  }

  function renderResults() {
    var box = $("itemResults");
    var template = $("resultTemplate");
    if (!box || !template) return;
    box.innerHTML = "";
    var items = activeItems();
    if (!items.length) {
      var empty = document.createElement("div");
      empty.className = "draft-lines empty";
      empty.textContent = "Không tìm thấy hàng phù hợp.";
      box.appendChild(empty);
      return;
    }
    items.forEach(function (item) {
      var node = template.content.firstElementChild.cloneNode(true);
      node.querySelector(".result-icon").textContent = item.icon;
      node.querySelector(".result-name").textContent = item.name;
      node.querySelector(".result-meta").textContent = [
        item.id,
        item.barcode ? "Barcode " + item.barcode : "",
        item.unit ? "Đơn vị " + item.unit : "",
      ].filter(Boolean).join(" · ");
      node.querySelector(".result-stock").textContent = "Tồn " + formatter.format(item.stock);
      node.addEventListener("click", function () { addRequestLine(item); });
      box.appendChild(node);
    });
  }

  function renderLineList(options) {
    var box = $(options.boxId);
    var template = $("lineTemplate");
    if (!box || !template) return;
    var lines = options.lines || [];
    box.innerHTML = "";
    box.classList.toggle("empty", lines.length === 0);
    if (!lines.length) {
      box.textContent = options.emptyText;
      return;
    }
    lines.forEach(function (line) {
      var node = template.content.firstElementChild.cloneNode(true);
      node.querySelector(".line-name").textContent = line.name;
      node.querySelector(".line-meta").textContent = line.meta + (line.unit ? " · " + line.unit : "");
      var qtyInput = node.querySelector(".line-qty");
      var costInput = node.querySelector(".line-cost");
      qtyInput.parentNode.firstChild.nodeValue = options.qtyLabel + " ";
      qtyInput.value = line.qty;
      costInput.value = line.unitCost;
      node.querySelector(".line-subtotal").textContent = money(numberValue(line.qty) * numberValue(line.unitCost));
      qtyInput.addEventListener("input", function () {
        line.qty = Math.max(0, numberValue(qtyInput.value));
        render();
      });
      costInput.addEventListener("input", function () {
        line.unitCost = Math.max(0, Math.round(numberValue(costInput.value)));
        render();
      });
      var removeBtn = node.querySelector(".line-remove");
      if (options.lockRemove) {
        removeBtn.textContent = "Theo yêu cầu";
        removeBtn.disabled = true;
      } else {
        removeBtn.addEventListener("click", function () { removeRequestLine(line.key); });
      }
      box.appendChild(node);
    });
  }

  function renderRequestDraft() {
    renderLineList({
      boxId: "requestDraftLines",
      lines: state.requestLines,
      qtyLabel: "SL yêu cầu",
      emptyText: "Tìm hàng ở bên trái để tạo list yêu cầu mua hàng.",
      lockRemove: false,
    });
    var total = totals(state.requestLines);
    $("requestLineCount").textContent = String(state.requestLines.length);
    $("requestQtyTotal").textContent = formatter.format(total.qty);
  }

  function renderReceiveLines() {
    renderLineList({
      boxId: "receiveLines",
      lines: state.receiveLines,
      qtyLabel: "SL nhận",
      emptyText: "Chưa có sản phẩm nào đang được yêu cầu.",
      lockRemove: true,
    });
    var total = totals(state.receiveLines.filter(function (line) { return numberValue(line.qty) > 0; }));
    $("lineCount").textContent = String(state.receiveLines.length);
    $("qtyTotal").textContent = formatter.format(total.qty);
    $("amountTotal").textContent = money(total.amount);
    $("savePurchaseBtn").disabled = state.saving || !state.receiveLines.some(function (line) {
      return numberValue(line.qty) > 0;
    });
  }

  function renderRequestSummary() {
    var box = $("requestSummaryList");
    if (!box) return;
    box.innerHTML = "";
    box.classList.toggle("empty", state.requests.length === 0);
    if (!state.requests.length) {
      box.textContent = "Chưa có yêu cầu đang mở.";
      return;
    }
    state.requests.forEach(function (request) {
      var itemCount = (request.items || []).length;
      var qty = (request.items || []).reduce(function (sum, item) {
        return sum + numberValue(item.requestedQty);
      }, 0);
      var card = document.createElement("article");
      card.className = "request-item";
      card.innerHTML = '<div class="request-item-main"><strong></strong><small></small></div>';
      card.querySelector("strong").textContent = request.id + " · " + itemCount + " dòng";
      card.querySelector("small").textContent = [
        request.requesterName ? "NV kho: " + request.requesterName : "NV kho",
        "SL yêu cầu " + formatter.format(qty),
        request.note || "",
      ].filter(Boolean).join(" · ");
      box.appendChild(card);
    });
  }

  function syncReceiveLines() {
    var previous = new Map(state.receiveLines.map(function (line) { return [line.key, line]; }));
    var grouped = new Map();
    state.requests.forEach(function (request) {
      (request.items || []).forEach(function (requestItem) {
        var itemType = requestItem.itemType === "component" ? "component" : "product";
        var itemId = requestItem.itemId || requestItem.productId || requestItem.componentId;
        if (!itemId) return;
        var key = lineKey(itemType, itemId);
        var catalogItem = findCatalogItem(itemType, itemId) || {};
        if (!grouped.has(key)) {
          var old = previous.get(key);
          grouped.set(key, {
            key: key,
            itemType: itemType,
            itemId: itemId,
            name: requestItem.name || catalogItem.name || itemId,
            unit: requestItem.unit || catalogItem.unit || "",
            requestedQty: 0,
            qty: old ? old.qty : 0,
            unitCost: old ? old.unitCost : numberValue(catalogItem.unitCost),
            sourceRequestIds: [],
            meta: "",
          });
        }
        var line = grouped.get(key);
        line.requestedQty += numberValue(requestItem.requestedQty);
        if (line.sourceRequestIds.indexOf(request.id) === -1) {
          line.sourceRequestIds.push(request.id);
        }
        if (!previous.has(key)) line.qty = line.requestedQty;
      });
    });
    state.receiveLines = Array.from(grouped.values()).map(function (line) {
      line.meta = "Đang yêu cầu " + formatter.format(line.requestedQty) + " " + line.unit + " · " + line.sourceRequestIds.length + " phiếu";
      return line;
    });
  }

  function render() {
    renderWorkflowTabs();
    renderTypeTabs();
    renderResults();
    renderRequestDraft();
    renderRequestSummary();
    renderReceiveLines();
  }

  function buildRequestPayload() {
    return {
      requesterName: $("requesterName").value.trim(),
      note: $("requestNote").value.trim(),
      items: state.requestLines.map(function (line) {
        return {
          itemType: line.itemType,
          itemId: line.itemId,
          name: line.name,
          unit: line.unit,
          requestedQty: numberValue(line.qty),
        };
      }),
    };
  }

  function createPurchaseRequest() {
    var payload = buildRequestPayload();
    if (!payload.items.length) {
      setMessage("requestMessage", "Vui lòng thêm hàng vào list yêu cầu.", "error");
      return;
    }
    var invalid = payload.items.find(function (item) { return numberValue(item.requestedQty) <= 0; });
    if (invalid) {
      setMessage("requestMessage", "Số lượng yêu cầu phải lớn hơn 0.", "error");
      return;
    }
    setMessage("requestMessage", "Đang lưu yêu cầu...");
    api("/purchase-requests", { method: "POST", body: payload })
      .then(function (data) {
        setMessage("requestMessage", "Đã lưu yêu cầu " + (data.id || "") + ".", "success");
        $("requestNote").value = "";
        state.requestLines = [];
        return loadRequests();
      })
      .catch(function (err) {
        setMessage("requestMessage", (err && err.message) || "Không thể lưu yêu cầu.", "error");
      })
      .finally(render);
  }

  function buildPurchasePayload() {
    var supplier = selectedSupplier();
    var lines = state.receiveLines.filter(function (line) { return numberValue(line.qty) > 0; });
    var total = totals(lines);
    return {
      clientOpId: genClientOpId(),
      supplierId: supplier.id || undefined,
      supplierName: supplier.name || undefined,
      paymentMethod: $("paymentMethod").value,
      paidAmount: $("paidAmount").value === "" ? Math.round(total.amount) : Math.round(numberValue($("paidAmount").value)),
      note: $("purchaseNote").value.trim(),
      sourceRequestIds: unique(lines.flatMap(function (line) { return line.sourceRequestIds || []; })),
      items: lines.map(function (line) {
        if (line.itemType === "component") {
          return {
            itemType: "component",
            componentId: line.itemId,
            componentName: line.name,
            qty: numberValue(line.qty),
            unit: line.unit,
            unitCost: Math.round(numberValue(line.unitCost)),
          };
        }
        return {
          itemType: "product",
          productId: line.itemId,
          productName: line.name,
          qty: Math.floor(numberValue(line.qty)),
          unitCost: Math.round(numberValue(line.unitCost)),
        };
      }),
    };
  }

  function unique(list) {
    return Array.from(new Set((list || []).filter(Boolean)));
  }

  function validatePurchasePayload(payload) {
    if (!payload.paymentMethod) return "Vui lòng chọn phương thức thanh toán.";
    if (!payload.items.length) return "Chưa có dòng hàng nào có số lượng nhận.";
    var invalidQty = payload.items.find(function (item) { return numberValue(item.qty) <= 0; });
    if (invalidQty) return "Số lượng nhận phải lớn hơn 0.";
    var invalidCost = payload.items.find(function (item) { return numberValue(item.unitCost) <= 0; });
    if (invalidCost) return "Vui lòng nhập giá tiền cho từng sản phẩm được nhận.";
    return "";
  }

  function fulfillRequestIds(requestIds, purchaseId) {
    var ids = unique(requestIds);
    return Promise.all(ids.map(function (id) {
      return api("/purchase-requests", {
        method: "POST",
        body: {
          action: "fulfill",
          id: id,
          purchaseId: purchaseId,
          fulfilledBy: selectedSupplier().name || "purchase-user",
        },
      });
    })).then(loadRequests);
  }

  function savePurchase() {
    if (state.saving) return;
    var payload = buildPurchasePayload();
    var error = validatePurchasePayload(payload);
    if (error) {
      setMessage("saveMessage", error, "error");
      return;
    }
    state.saving = true;
    setMessage("saveMessage", "Đang lưu phiếu nhập...");
    renderReceiveLines();

    api("/purchases", { method: "POST", body: payload })
      .then(function (data) {
        setMessage("saveMessage", "Đã lưu phiếu nhập " + (data.id || "") + ". Kho chính đã cập nhật.", "success");
        return fulfillRequestIds(payload.sourceRequestIds, data.id);
      })
      .then(function () {
        $("paidAmount").value = "";
        return loadData(true);
      })
      .catch(function (err) {
        setMessage("saveMessage", (err && err.message) || "Không thể lưu phiếu nhập.", "error");
      })
      .finally(function () {
        state.saving = false;
        render();
      });
  }

  function clearRequestDraft() {
    state.requestLines = [];
    setMessage("requestMessage", "");
    render();
  }

  function bindEvents() {
    document.querySelectorAll(".workflow-tab").forEach(function (button) {
      button.addEventListener("click", function () {
        state.activeTab = button.dataset.workflow;
        render();
      });
    });
    document.querySelectorAll(".type-tab").forEach(function (button) {
      button.addEventListener("click", function () {
        state.itemType = button.dataset.type;
        state.search = "";
        $("itemSearch").value = "";
        render();
      });
    });
    $("itemSearch").addEventListener("input", function (event) {
      state.search = event.target.value;
      renderResults();
    });
    $("clearRequestBtn").addEventListener("click", clearRequestDraft);
    $("savePurchaseBtn").addEventListener("click", savePurchase);
    $("createRequestBtn").addEventListener("click", createPurchaseRequest);
    $("refreshRequestsBtn").addEventListener("click", function () {
      loadRequests().then(render).catch(function (err) {
        setMessage("saveMessage", (err && err.message) || "Không tải được yêu cầu.", "error");
      });
    });
    $("supplierSelect").addEventListener("change", function () {
      var supplier = state.suppliers.find(function (item) { return item.id === $("supplierSelect").value; });
      if (supplier && !$("supplierName").value.trim()) $("supplierName").value = supplier.name;
    });
  }

  function loadData(quiet) {
    if (!quiet) setStatus("Đang tải data...");
    return Promise.all([
      api("/products?all=1"),
      api("/components"),
      api("/suppliers"),
      api("/purchase-requests?status=open"),
    ]).then(function (results) {
      state.products = (results[0].products || []).map(normalizeProduct);
      state.components = (results[1].components || []).map(normalizeComponent);
      state.suppliers = results[2].suppliers || [];
      state.requests = results[3].requests || [];
      syncReceiveLines();
      renderSuppliers();
      setStatus("Đã nối kho chính");
      render();
    }).catch(function (err) {
      setStatus("Lỗi kết nối kho", "error");
      setMessage("saveMessage", (err && err.message) || "Không tải được dữ liệu.", "error");
      render();
    });
  }

  function loadRequests() {
    return api("/purchase-requests?status=open").then(function (data) {
      state.requests = data.requests || [];
      syncReceiveLines();
      return data;
    });
  }

  function init() {
    bindEvents();
    render();
    loadData(false);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
