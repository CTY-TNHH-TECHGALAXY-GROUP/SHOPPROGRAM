import { json } from "./_lib.js";

export const onRequestGet = async ({ env, data }) => {
  // Only expose detailed diagnostics to admin users
  const isAdmin = data && data.user && data.user.role === "admin";

  let ok = true;
  try {
    await env.DB.prepare("SELECT 1").first();
  } catch {
    ok = false;
  }

  // Non-admin / unauthenticated: return only ok status
  if (!isAdmin) {
    return json({ ok, serverTime: Date.now() });
  }

  // Admin: return full diagnostics
  return json({
    ok,
    serverTime: Date.now(),
    dbBinding: Boolean(env.DB),
  }, { status: ok ? 200 : 500 });
};
