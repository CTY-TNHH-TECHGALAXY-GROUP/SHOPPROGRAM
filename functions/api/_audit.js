import { uid, now } from "./_lib.js";

const AUDIT_EVENT_TYPES = new Set([
  "login",
  "logout",
  "open_shift",
  "close_shift",
]);

function safeString(value) {
  if (value == null) return null;
  return String(value).trim() || null;
}

function safeMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (item == null) continue;
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      out[key] = item;
    }
  }
  return out;
}

export async function logAuditEvent(env, event) {
  try {
    if (!env || !env.DB || !event || !AUDIT_EVENT_TYPES.has(event.eventType)) return;
    const createdAt = Number(event.createdAt) || now();
    await env.DB.prepare(
      `INSERT INTO audit_logs
       (id, event_type, actor_email, actor_role, target, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      event.id || uid("audit"),
      event.eventType,
      safeString(event.actorEmail),
      safeString(event.actorRole),
      safeString(event.target),
      JSON.stringify(safeMetadata(event.metadata)),
      createdAt
    ).run();
  } catch (err) {
    console.warn("Audit log skipped:", err && err.message ? err.message : err);
  }
}
