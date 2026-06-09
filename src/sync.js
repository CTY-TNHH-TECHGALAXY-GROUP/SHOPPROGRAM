/*
 * ShopFlow POS — client sync engine.
 *
 * Exposes a small global `window.ShopFlowSync` API used by app.js:
 *
 *   ShopFlowSync.init({ onPulled, onStatusChange })
 *   ShopFlowSync.enqueue({ endpoint, method, body, opType })
 *       -> returns clientOpId. Tries to send immediately when online,
 *          stores in outbox otherwise.
 *   ShopFlowSync.pull(since)
 *       -> GET /api/sync/pull?since=<ts>
 *   ShopFlowSync.api(path, opts)
 *       -> low level fetch wrapper returning JSON.
 *   ShopFlowSync.getStatus()
 *       -> { online, pending, lastSyncAt, lastError }
 *
 * Offline-first design: every mutation MUST include a `clientOpId` (we add one
 * automatically) so server-side `sync_log` table deduplicates replays.
 *
 * Storage keys:
 *   shopflow-outbox        — array of pending ops
 *   shopflow-last-sync-at  — last successful pull timestamp
 */

(function () {
  var OUTBOX_KEY    = "shopflow-outbox";
  var LAST_SYNC_KEY = "shopflow-last-sync-at";
  var API_BASE      = "/api";

  // ---------- storage helpers ----------
  function readOutbox() {
    try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]") || []; }
    catch (_) { return []; }
  }
  function writeOutbox(list) {
    try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(list)); } catch (_) {}
  }
  function getLastSyncAt() {
    return Number(localStorage.getItem(LAST_SYNC_KEY)) || 0;
  }
  function setLastSyncAt(ts) {
    try { localStorage.setItem(LAST_SYNC_KEY, String(ts)); } catch (_) {}
  }

  // ---------- ids ----------
  function genOpId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return (
      "op-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  // ---------- fetch wrapper ----------
  function api(path, opts) {
    var init = opts || {};
    return fetch(API_BASE + path, {
      method: init.method || "GET",
      headers: init.body
        ? { "Content-Type": "application/json", ...(init.headers || {}) }
        : init.headers || {},
      body: init.body ? JSON.stringify(init.body) : undefined,
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || data.ok === false) {
          var err = new Error((data && data.error) || ("HTTP " + res.status));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  // ---------- listeners ----------
  // status   — fires on online/offline + pending count changes
  // pulled   — fires on every successful /sync/pull (delta or full snapshot)
  // success  — fires when an outbox op confirms 200 OK; payload = {endpoint, opType, body, response}
  // failure  — fires when an outbox op fails 4xx/5xx/network; payload = {endpoint, opType, body, error}
  var listeners = { status: [], pulled: [], success: [], failure: [] };
  function emit(type, payload) {
    (listeners[type] || []).forEach(function (fn) {
      try { fn(payload); } catch (_) {}
    });
  }

  // ---------- state ----------
  var state = {
    online: typeof navigator !== "undefined" ? navigator.onLine !== false : true,
    pending: readOutbox().length,
    flushing: false,
    lastSyncAt: getLastSyncAt(),
    lastError: null,
  };
  function setStatus(patch) {
    Object.assign(state, patch || {});
    emit("status", getStatus());
  }
  function getStatus() {
    return {
      online: state.online,
      pending: readOutbox().length,
      lastSyncAt: state.lastSyncAt,
      lastError: state.lastError,
    };
  }

  // ---------- outbox ----------
  function enqueue(op) {
    if (!op || !op.endpoint) throw new Error("ShopFlowSync.enqueue requires { endpoint }");
    var clientOpId = (op.body && op.body.clientOpId) || genOpId();
    var record = {
      clientOpId: clientOpId,
      endpoint: op.endpoint,
      method: op.method || "POST",
      body: Object.assign({ clientOpId: clientOpId }, op.body || {}),
      opType: op.opType || "unknown",
      enqueuedAt: Date.now(),
      retries: 0,
    };
    var list = readOutbox();
    list.push(record);
    writeOutbox(list);
    setStatus({ pending: list.length });

    // Try to flush right now (fire and forget).
    flush().catch(function () {});

    return clientOpId;
  }

  function flush() {
    if (state.flushing) return Promise.resolve();
    var list = readOutbox();
    if (!list.length) return Promise.resolve();
    if (!state.online) return Promise.resolve();

    state.flushing = true;
    setStatus({});

    var next = list[0];
    return api(next.endpoint, { method: next.method, body: next.body })
      .then(function (data) {
        // success — drop head
        var current = readOutbox();
        var remaining = current.filter(function (item) {
          return item.clientOpId !== next.clientOpId;
        });
        writeOutbox(remaining);
        setStatus({
          pending: remaining.length,
          lastError: null,
        });
        // Emit so the UI can show a "Saved" toast.
        emit("success", {
          endpoint: next.endpoint,
          opType: next.opType,
          body: next.body,
          response: data,
        });
        // Continue flushing the next one.
        state.flushing = false;
        if (remaining.length) return flush();
      })
      .catch(function (err) {
        // Network / server error — leave in outbox, back off later.
        state.flushing = false;
        var current = readOutbox();
        if (current[0] && current[0].clientOpId === next.clientOpId) {
          current[0].retries = (current[0].retries || 0) + 1;
          current[0].lastError = err && err.message ? err.message : String(err);
          writeOutbox(current);
        }
        setStatus({ lastError: err && err.message ? err.message : String(err) });

        emit("failure", {
          endpoint: next.endpoint,
          opType: next.opType,
          body: next.body,
          error: err && err.message ? err.message : String(err),
        });

        // If it's a 4xx server validation error we should NOT keep retrying
        // forever — drop after 5 attempts.
        if (err && err.status && err.status >= 400 && err.status < 500 && current[0]) {
          if ((current[0].retries || 0) >= 3) {
            current.shift();
            writeOutbox(current);
            setStatus({ pending: current.length });
          }
        }
        throw err;
      });
  }

  // ---------- pull ----------
  function pull(since) {
    var ts = since != null ? since : 0; // full snapshot first time
    return api("/sync/pull?since=" + ts).then(function (data) {
      state.lastSyncAt = data.serverTime || Date.now();
      setLastSyncAt(state.lastSyncAt);
      setStatus({ lastError: null });
      emit("pulled", data);
      return data;
    }).catch(function (err) {
      setStatus({ lastError: err && err.message ? err.message : String(err) });
      throw err;
    });
  }

  // ---------- init / online listeners ----------
  var pullTimer = null;
  function init(opts) {
    opts = opts || {};
    if (opts.onPulled)        listeners.pulled.push(opts.onPulled);
    if (opts.onStatusChange)  listeners.status.push(opts.onStatusChange);
    if (opts.onSuccess)       listeners.success.push(opts.onSuccess);
    if (opts.onFailure)       listeners.failure.push(opts.onFailure);

    window.addEventListener("online", function () {
      setStatus({ online: true });
      flush().catch(function () {});
    });
    window.addEventListener("offline", function () {
      setStatus({ online: false });
    });

    // First pull when API is reachable.
    pull(state.lastSyncAt || 0).catch(function () {});
    // Background pull every 30s when online + flush.
    pullTimer = setInterval(function () {
      if (!state.online) return;
      pull(state.lastSyncAt).catch(function () {});
      flush().catch(function () {});
    }, 30000);

    // Try flushing now in case there is something pending from last session.
    flush().catch(function () {});
  }

  window.ShopFlowSync = {
    init: init,
    enqueue: enqueue,
    flush: flush,
    pull: pull,
    api: api,
    getStatus: getStatus,
    on: function (event, fn) {
      if (listeners[event]) listeners[event].push(fn);
    },
    _outbox: readOutbox, // for debugging
  };
})();
