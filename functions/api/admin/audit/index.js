import { json } from "../../_lib.js";

const ALLOWED_EVENT_TYPES = new Set(["login", "logout", "open_shift", "close_shift"]);

function parseLimit(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 200;
  return Math.min(Math.floor(n), 500);
}

export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const from = Number(url.searchParams.get("from")) || 0;
  const to = Number(url.searchParams.get("to")) || Date.now();
  const account = String(url.searchParams.get("account") || "").trim().toLowerCase();
  const eventType = String(url.searchParams.get("event_type") || "").trim();
  const limit = parseLimit(url.searchParams.get("limit"));

  const where = ["created_at BETWEEN ? AND ?"];
  const binds = [from, to];

  if (account) {
    where.push("LOWER(COALESCE(actor_email, '')) LIKE ?");
    binds.push("%" + account + "%");
  }

  if (eventType && ALLOWED_EVENT_TYPES.has(eventType)) {
    where.push("event_type = ?");
    binds.push(eventType);
  }

  const { results: logs } = await env.DB.prepare(
    `SELECT id, event_type, actor_email, actor_role, target, metadata_json, created_at
     FROM audit_logs
     WHERE ${where.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT ?`
  ).bind(...binds, limit).all();

  const { results: summaryRows } = await env.DB.prepare(
    `SELECT event_type, COUNT(*) AS count
     FROM audit_logs
     WHERE ${where.join(" AND ")}
     GROUP BY event_type`
  ).bind(...binds).all();

  const summary = { login: 0, logout: 0, open_shift: 0, close_shift: 0 };
  for (const row of summaryRows || []) {
    if (Object.prototype.hasOwnProperty.call(summary, row.event_type)) {
      summary[row.event_type] = Number(row.count) || 0;
    }
  }

  return json({
    ok: true,
    filters: { from, to, account, eventType: eventType || "", limit },
    summary,
    logs: (logs || []).map((row) => {
      let metadata = {};
      try { metadata = row.metadata_json ? JSON.parse(row.metadata_json) : {}; } catch {}
      return {
        id: row.id,
        eventType: row.event_type,
        actorEmail: row.actor_email,
        actorRole: row.actor_role,
        target: row.target,
        metadata,
        createdAt: Number(row.created_at) || 0,
      };
    }),
  });
};
