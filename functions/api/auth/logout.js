import { json } from "../_lib.js";
import { logAuditEvent } from "../_audit.js";

export const onRequestPost = async ({ env, data }) => {
  const user = data && data.user;
  if (user) {
    await logAuditEvent(env, {
      eventType: "logout",
      actorEmail: user.email,
      actorRole: user.role,
      target: user.email,
    });
  }

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    "session_token=; Path=/; HttpOnly; Secure; Max-Age=0; SameSite=None"
  );
  return json({ ok: true }, { headers });
};
