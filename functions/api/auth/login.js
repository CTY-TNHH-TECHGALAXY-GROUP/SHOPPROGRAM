import { json, badRequest, readJson, hashPassword, createSignedToken } from "../_lib.js";

const SALT = "shopprogram_salt_2026";

const ACCOUNTS = {
  "admin@shopprogram.local": {
    role: "admin",
    hash: "9e19e51e88c9fcf0beffff3c723e9b400117df6c841505a8725632ad74c3ecb8",
  },
  "manager@shopprogram.local": {
    role: "manager",
    hash: "38dff1c3dda8345352245ce53a4ebe764b87470f8c8ad43d805f5096129b235d",
  },
  "cashier@shopprogram.local": {
    role: "cashier",
    hash: "edae5c97f5aa3b493ddee3164ef2a046b101aa241cdee00f3c8afc3aafc0b24a",
  },
  "inventory@shopprogram.local": {
    role: "inventory",
    hash: "1f2c46ca072a2dad5ff1449d38177edd4cbd2d1c6a2c8bfae123f1b8f2c0212c",
  },
  "accountant@shopprogram.local": {
    role: "accountant",
    hash: "004c7ef32e73a8852e845d26b9d6eeebf9f80c5eab1d3dffe6cd6d925aea07c2",
  },
};

export const onRequestPost = async ({ request, env }) => {
  const body = await readJson(request);
  if (!body || !body.email || !body.password) {
    return badRequest("Email and password are required");
  }

  const email = String(body.email).trim().toLowerCase();
  const password = String(body.password);

  const account = ACCOUNTS[email];
  if (!account) {
    return badRequest("Invalid credentials");
  }

  const inputHash = await hashPassword(password, SALT);
  if (inputHash !== account.hash) {
    return badRequest("Invalid credentials");
  }

  // Create session payload with 24h expiration
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const token = await createSignedToken({ email, role: account.role, exp }, env.TOKEN_SECRET);

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `session_token=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; Max-Age=86400; SameSite=Lax`
  );

  return json({
    ok: true,
    user: {
      email,
      role: account.role,
    },
  }, { headers });
};
