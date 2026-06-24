(function () {
  var state = {
    activeTab: "request",
    products: [],
    components: [],
    suppliers: [],
    requests: [],
    selectedRequestId: "",
    requestLines: [],
    receiveLines: [],
    requestFilters: { from: "", to: "", item: "", sort: "date_desc" },
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

  function normalizeSearchText(value) {
    var text = String(value || "").toLowerCase();
    try {
      text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch (_) {}
    return text.replace(/đ/g, "d").replace(/[^a-z0-9 ]+/g, " ").trim();
  }

  function dateInputStart(value) {
    if (!value) return 0;
    var parsed = new Date(value + "T00:00:00").getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function dateInputEnd(value) {
    if (!value) return 0;
    var parsed = new Date(value + "T23:59:59.999").getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function unitKey(value) {
    var unit = String(value || "").trim().toLowerCase();
    if (unit === "g" || unit === "gram" || unit === "grams") return "gram";
    if (unit === "kg" || unit === "kilogram" || unit === "kilograms") return "kg";
    if (unit === "ml" || unit === "milliliter" || unit === "millilitre") return "ml";
    if (unit === "l" || unit === "lit" || unit === "liter" || unit === "litre") return "l";
    if (unit === "cái" || unit === "cai" || unit === "piece" || unit === "pcs") return "piece";
    if (unit === "hộp" || unit === "hop" || unit === "box") return "box";
    if (unit === "chai" || unit === "bottle") return "bottle";
    return unit || "piece";
  }

  function preferredPurchaseUnit(baseUnit) {
    var unit = unitKey(baseUnit);
    if (unit === "gram") return "kg";
    if (unit === "ml") return "l";
    return unit || "piece";
  }

  function unitOptions(baseUnit) {
    var unit = unitKey(baseUnit);
    if (unit === "gram" || unit === "kg") return ["kg", "gram"];
    if (unit === "ml" || unit === "l") return ["l", "ml"];
    if (unit === "box") return ["box"];
    if (unit === "bottle") return ["bottle"];
    return ["piece"];
  }

  function isFractionalUnit(unit) {
    var normalized = unitKey(unit);
    return normalized === "kg" || normalized === "gram" || normalized === "l" || normalized === "ml";
  }

  function normalizeQtyForUnit(value, unit) {
    var qty = Math.max(0, numberValue(value));
    if (isFractionalUnit(unit)) {
      return Math.round(qty * 1000) / 1000;
    }
    return Math.floor(qty);
  }

  function convertQty(qty, fromUnit, toUnit) {
    var value = numberValue(qty);
    var from = unitKey(fromUnit);
    var to = unitKey(toUnit);
    if (!from || !to || from === to) return value;
    if (from === "gram" && to === "kg") return value / 1000;
    if (from === "kg" && to === "gram") return value * 1000;
    if (from === "ml" && to === "l") return value / 1000;
    if (from === "l" && to === "ml") return value * 1000;
    return value;
  }

  function formatQtyInput(value) {
    var rounded = Math.round(numberValue(value) * 1000) / 1000;
    if (rounded === 0) return "0";
    return String(rounded).replace(/\.?0+$/, "");
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

  function selectedRequest() {
    return state.requests.find(function (request) { return request.id === state.selectedRequestId; }) || null;
  }

  function requestCreatedAt(request) {
    var value = request && (request.createdAt || request.created_at || request.updatedAt || request.updated_at);
    if (!value) return 0;
    if (typeof value === "number") return value;
    var parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function requestItemNames(request) {
    return (request.items || []).map(function (item) {
      return [
        item.name,
        item.itemId || item.productId || item.componentId,
        item.unit
      ].filter(Boolean).join(" ");
    }).join(", ");
  }

  function requestSearchText(request) {
    return [
      request.id,
      request.requestTitle,
      request.requesterName,
      request.note,
      requestItemNames(request)
    ].join(" ");
  }

  function filteredRequests() {
    var from = dateInputStart(state.requestFilters.from);
    var to = dateInputEnd(state.requestFilters.to);
    var query = normalizeSearchText(state.requestFilters.item);
    var list = state.requests.filter(function (request) {
      var createdAt = requestCreatedAt(request);
      if (from && createdAt && createdAt < from) return false;
      if (to && createdAt && createdAt > to) return false;
      if (query && normalizeSearchText(requestSearchText(request)).indexOf(query) === -1) return false;
      return true;
    }).slice();
    list.sort(function (a, b) {
      var mode = state.requestFilters.sort || "date_desc";
      if (mode === "date_asc") return requestCreatedAt(a) - requestCreatedAt(b);
      if (mode === "item_asc" || mode === "item_desc") {
        var aName = normalizeSearchText(requestItemNames(a) || a.requestTitle || a.id);
        var bName = normalizeSearchText(requestItemNames(b) || b.requestTitle || b.id);
        var result = aName.localeCompare(bName);
        return mode === "item_desc" ? -result : result;
      }
      return requestCreatedAt(b) - requestCreatedAt(a);
    });
    return list;
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
      if (options.showRequestedQty && numberValue(line.requestedQty) > 0) {
        var badge = document.createElement("span");
        badge.className = "request-qty-badge";
        badge.textContent = "Yêu cầu " + formatter.format(numberValue(line.requestedQty)) + (line.unit ? " " + line.unit : "");
        node.querySelector(".line-main").appendChild(badge);
      }
      var qtyInput = node.querySelector(".line-qty");
      var unitField = node.querySelector(".line-unit-field");
      var unitSelect = node.querySelector(".line-unit");
      var costInput = node.querySelector(".line-cost");
      qtyInput.parentNode.firstChild.nodeValue = options.qtyLabel + " ";
      qtyInput.value = line.qty;
      costInput.value = line.unitCost;
      if (options.allowPurchaseUnit && unitField && unitSelect) {
        line.purchaseUnit = line.purchaseUnit || preferredPurchaseUnit(line.unit);
        unitSelect.innerHTML = "";
        unitOptions(line.unit).forEach(function (unit) {
          var option = document.createElement("option");
          option.value = unit;
          option.textContent = unit;
          unitSelect.appendChild(option);
        });
        unitSelect.value = line.purchaseUnit;
        unitSelect.addEventListener("change", function () {
          var oldUnit = line.purchaseUnit || line.unit;
          var nextUnit = unitSelect.value;
          line.qty = formatQtyInput(convertQty(line.qty, oldUnit, nextUnit));
          line.purchaseUnit = nextUnit;
          qtyInput.value = line.qty;
          updateLineSubtotal(node, line);
          updateLineTotals(options.boxId);
        });
      } else if (unitField) {
        unitField.style.display = "none";
      }
      updateLineSubtotal(node, line);
      qtyInput.addEventListener("input", function () {
        line.qty = qtyInput.value;
        updateLineSubtotal(node, line);
        updateLineTotals(options.boxId);
      });
      costInput.addEventListener("input", function () {
        line.unitCost = costInput.value;
        updateLineSubtotal(node, line);
        updateLineTotals(options.boxId);
      });
      qtyInput.addEventListener("blur", function () {
        normalizeNumberInput(qtyInput, line, "qty", false);
        updateLineSubtotal(node, line);
        updateLineTotals(options.boxId);
      });
      costInput.addEventListener("blur", function () {
        normalizeNumberInput(costInput, line, "unitCost", true);
        updateLineSubtotal(node, line);
        updateLineTotals(options.boxId);
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

  function updateLineSubtotal(node, line) {
    node.querySelector(".line-subtotal").textContent = money(numberValue(line.qty) * numberValue(line.unitCost));
  }

  function normalizeNumberInput(input, line, field, roundValue) {
    if (input.value.trim() === "") {
      line[field] = "";
      return;
    }
    var value = Math.max(0, numberValue(input.value));
    if (roundValue) value = Math.round(value);
    if (!roundValue && field === "qty") {
      value = normalizeQtyForUnit(value, line.purchaseUnit || line.unit);
    }
    line[field] = value;
    input.value = String(value);
  }

  function updateLineTotals(boxId) {
    if (boxId === "receiveLines") {
      updateReceiveTotals();
    } else if (boxId === "requestDraftLines") {
      updateRequestTotals();
    }
  }

  function updateRequestTotals() {
    var total = totals(state.requestLines);
    $("requestLineCount").textContent = String(state.requestLines.length);
    $("requestQtyTotal").textContent = formatter.format(total.qty);
  }

  function updateReceiveTotals() {
    var total = totals(state.receiveLines.filter(function (line) { return numberValue(line.qty) > 0; }));
    $("lineCount").textContent = String(state.receiveLines.length);
    $("qtyTotal").textContent = formatter.format(total.qty);
    $("amountTotal").textContent = money(total.amount);
    $("savePurchaseBtn").disabled = state.saving || !state.receiveLines.some(function (line) {
      return numberValue(line.qty) > 0;
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
    updateRequestTotals();
  }

  function renderReceiveLines() {
    renderLineList({
      boxId: "receiveLines",
      lines: state.receiveLines,
      qtyLabel: "SL nhận",
      emptyText: "Chưa có sản phẩm nào đang được yêu cầu.",
      lockRemove: true,
      allowPurchaseUnit: true,
      showRequestedQty: true,
    });
    updateReceiveTotals();
  }

  function renderRequestSummary() {
    var box = $("requestSummaryList");
    if (!box) return;
    var requests = filteredRequests();
    box.innerHTML = "";
    box.classList.toggle("empty", state.requests.length === 0);
    if (!state.requests.length) {
      box.textContent = "Chưa có yêu cầu đang mở.";
      return;
    }
    if (!requests.length) {
      box.classList.add("empty");
      box.textContent = "Không có đơn yêu cầu phù hợp bộ lọc.";
      return;
    }
    box.classList.remove("empty");
    requests.forEach(function (request) {
      var itemCount = (request.items || []).length;
      var qty = (request.items || []).reduce(function (sum, item) {
        return sum + numberValue(item.requestedQty);
      }, 0);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "request-item" + (request.id === state.selectedRequestId ? " is-active" : "");
      card.innerHTML = '<div class="request-item-main"><strong></strong><small></small></div><span class="request-qty-badge"></span>';
      card.querySelector("strong").textContent = (request.requestTitle || request.id) + " · " + itemCount + " dòng";
      card.querySelector("small").textContent = [
        request.requestTitle ? "Mã: " + request.id : "",
        request.createdAt ? "Ngày: " + new Date(request.createdAt).toLocaleDateString("vi-VN") : "",
        request.requesterName ? "NV kho: " + request.requesterName : "NV kho",
        requestItemNames(request),
        "SL yêu cầu " + formatter.format(qty),
        request.note || "",
      ].filter(Boolean).join(" · ");
      card.querySelector(".request-qty-badge").textContent = formatter.format(qty) + " yêu cầu";
      card.addEventListener("click", function () {
        state.selectedRequestId = request.id;
        syncReceiveLines();
        render();
      });
      box.appendChild(card);
    });
  }

  function syncReceiveLines() {
    var previous = new Map(state.receiveLines.map(function (line) { return [line.key, line]; }));
    var grouped = new Map();
    var request = selectedRequest();
    if (!request && state.requests.length) {
      state.selectedRequestId = state.requests[0].id;
      request = selectedRequest();
    }
    if (!request) {
      state.selectedRequestId = "";
      state.receiveLines = [];
      return;
    }

    (request.items || []).forEach(function (requestItem) {
      var itemType = requestItem.itemType === "component" ? "component" : "product";
      var itemId = requestItem.itemId || requestItem.productId || requestItem.componentId;
      if (!itemId) return;
      var key = lineKey(itemType, itemId);
      var catalogItem = findCatalogItem(itemType, itemId) || {};
      if (!grouped.has(key)) {
        var old = previous.get(key);
        var baseUnit = requestItem.unit || catalogItem.unit || "";
        var purchaseUnit = old ? old.purchaseUnit : preferredPurchaseUnit(baseUnit);
        grouped.set(key, {
          key: key,
          itemType: itemType,
          itemId: itemId,
          name: requestItem.name || catalogItem.name || itemId,
          unit: baseUnit,
          requestedQty: 0,
          qty: old ? old.qty : 0,
          unitCost: old ? old.unitCost : numberValue(catalogItem.unitCost),
          purchaseUnit: purchaseUnit,
          sourceRequestIds: [],
          meta: "",
        });
      }
      var line = grouped.get(key);
      line.requestedQty += numberValue(requestItem.requestedQty);
      line.sourceRequestIds = [request.id];
      if (!previous.has(key)) line.qty = 0;
    });
    state.receiveLines = Array.from(grouped.values()).map(function (line) {
      line.meta = "Còn yêu cầu " + formatter.format(line.requestedQty) + " " + line.unit + " · " + (request.requestTitle || request.id);
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
      requestTitle: $("requestTitle").value.trim(),
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
        $("requestTitle").value = "";
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
    var request = selectedRequest();
    var receiptItems = lines.map(function (line) {
      return {
        itemType: line.itemType,
        itemId: line.itemId,
        productId: line.itemType === "product" ? line.itemId : undefined,
        componentId: line.itemType === "component" ? line.itemId : undefined,
        receivedQty: convertQty(numberValue(line.qty), line.purchaseUnit || line.unit, line.unit),
      };
    });
    var fullyReceived = isRequestFullyReceived(request, receiptItems);
    return {
      clientOpId: genClientOpId(),
      supplierId: supplier.id || undefined,
      supplierName: supplier.name || undefined,
      paymentMethod: $("paymentMethod").value,
      paidAmount: $("paidAmount").value === "" ? Math.round(total.amount) : Math.round(numberValue($("paidAmount").value)),
      note: $("purchaseNote").value.trim(),
      status: "pending_verification",
      requiresVerification: true,
      selectedRequestId: request ? request.id : "",
      requestFullyReceived: fullyReceived,
      requestReceiptItems: receiptItems,
      sourceRequestIds: fullyReceived && request ? [request.id] : [],
      items: lines.map(function (line) {
        if (line.itemType === "component") {
          return {
            itemType: "component",
            componentId: line.itemId,
            componentName: line.name,
            qty: numberValue(line.qty),
            unit: line.purchaseUnit || line.unit,
            baseUnit: line.unit,
            purchaseQty: numberValue(line.qty),
            purchaseUnit: line.purchaseUnit || line.unit,
            purchaseUnitCost: Math.round(numberValue(line.unitCost)),
            unitCost: Math.round(numberValue(line.unitCost)),
          };
        }
        return {
          itemType: "product",
          productId: line.itemId,
          productName: line.name,
          qty: normalizeQtyForUnit(line.qty, line.purchaseUnit || line.unit),
          purchaseQty: normalizeQtyForUnit(line.qty, line.purchaseUnit || line.unit),
          purchaseUnit: line.purchaseUnit || line.unit || "piece",
          purchaseUnitCost: Math.round(numberValue(line.unitCost)),
          unitCost: Math.round(numberValue(line.unitCost)),
        };
      }),
    };
  }

  function isRequestFullyReceived(request, receiptItems) {
    if (!request) return false;
    var received = new Map();
    (receiptItems || []).forEach(function (item) {
      var key = lineKey(item.itemType, item.itemId || item.productId || item.componentId);
      received.set(key, (received.get(key) || 0) + numberValue(item.receivedQty));
    });
    return (request.items || []).every(function (item) {
      var itemType = item.itemType === "component" ? "component" : "product";
      var itemId = item.itemId || item.productId || item.componentId;
      var need = numberValue(item.requestedQty);
      var got = received.get(lineKey(itemType, itemId)) || 0;
      return got + 0.000001 >= need;
    });
  }

  function validatePurchasePayload(payload) {
    if (!payload.paymentMethod) return "Vui lòng chọn phương thức thanh toán.";
    if (!payload.selectedRequestId) return "Vui lòng chọn một đơn yêu cầu trước khi nhập hàng.";
    if (!payload.items.length) return "Chưa có dòng hàng nào có số lượng nhận.";
    var invalidQty = payload.items.find(function (item) { return numberValue(item.qty) <= 0; });
    if (invalidQty) return "Số lượng nhận phải lớn hơn 0.";
    var invalidCost = payload.items.find(function (item) { return numberValue(item.unitCost) <= 0; });
    if (invalidCost) return "Vui lòng nhập giá tiền cho từng sản phẩm được nhận.";
    return "";
  }

  function applySelectedRequestReceipt(payload, purchaseId) {
    return api("/purchase-requests", {
      method: "POST",
      body: {
        action: "apply_receipt",
        id: payload.selectedRequestId,
        purchaseId: purchaseId,
        fulfilledBy: selectedSupplier().name || "purchase-user",
        receivedItems: payload.requestReceiptItems,
      },
    }).then(loadRequests);
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
        setMessage("saveMessage", "Đã gửi phiếu nhập " + (data.id || "") + ". POS chính cần xác nhận trước khi cộng kho.", "success");
        return applySelectedRequestReceipt(payload, data.id);
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
        if (state.activeTab === "receive") syncReceiveLines();
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
    ["requestFromDate", "requestToDate", "requestItemFilter", "requestSortMode"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener("input", function () {
        state.requestFilters = {
          from: $("requestFromDate") ? $("requestFromDate").value : "",
          to: $("requestToDate") ? $("requestToDate").value : "",
          item: $("requestItemFilter") ? $("requestItemFilter").value : "",
          sort: $("requestSortMode") ? $("requestSortMode").value : "date_desc",
        };
        renderRequestSummary();
      });
      el.addEventListener("change", function () {
        state.requestFilters = {
          from: $("requestFromDate") ? $("requestFromDate").value : "",
          to: $("requestToDate") ? $("requestToDate").value : "",
          item: $("requestItemFilter") ? $("requestItemFilter").value : "",
          sort: $("requestSortMode") ? $("requestSortMode").value : "date_desc",
        };
        renderRequestSummary();
      });
    });
    if ($("clearRequestFiltersBtn")) {
      $("clearRequestFiltersBtn").addEventListener("click", function () {
        state.requestFilters = { from: "", to: "", item: "", sort: "date_desc" };
        if ($("requestFromDate")) $("requestFromDate").value = "";
        if ($("requestToDate")) $("requestToDate").value = "";
        if ($("requestItemFilter")) $("requestItemFilter").value = "";
        if ($("requestSortMode")) $("requestSortMode").value = "date_desc";
        renderRequestSummary();
      });
    }
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
