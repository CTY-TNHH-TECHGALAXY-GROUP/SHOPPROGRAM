import { json, badRequest, readJson } from "../_lib.js";
import { logAuditEvent } from "../_audit.js";

const CLIENT_EVENT_TYPES = new Set(["open_shift", "close_shift"]);

export const onRequestPost = async ({ env, request, data }) => {
  const user = data && data.user;
  if (!user) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJson(request);
  const eventType = body && String(body.eventType || body.event_type || "").trim();
  if (!CLIENT_EVENT_TYPES.has(eventType)) {
    return badRequest("Unsupported audit event");
  }

  await logAuditEvent(env, {
    eventType,
    actorEmail: user.email,
    actorRole: user.role,
    target: body.target,
    metadata: body.metadata,
  });

  return json({ ok: true });
};
