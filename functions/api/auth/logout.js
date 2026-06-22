import { json } from "../_lib.js";

export const onRequestPost = async () => {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    "session_token=; Path=/; HttpOnly; Secure; Max-Age=0; SameSite=Lax"
  );
  return json({ ok: true }, { headers });
};
