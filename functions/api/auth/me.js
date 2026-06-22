import { json } from "../_lib.js";

export const onRequestGet = async (context) => {
  const user = context.data.user;
  if (!user) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return json({
    ok: true,
    user: {
      email: user.email,
      role: user.role,
    },
  });
};
