import { getRuntimeDb } from "./_supabase_db.js";
import { verifyToken, getCookie } from "./_lib.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Op-Id",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
};

function isAuthorized(role, path, method) {
  if (role === "admin") return true;

  // Auth and health endpoints are always public
  if (path.startsWith("/api/auth/") || path === "/api/health") {
    return true;
  }

  // Cashier:
  // - Allowed: POS checkout, sync, and listing catalogues.
  if (role === "cashier") {
    if (path.startsWith("/api/sales") && (method === "POST" || method === "GET")) return true;
    if (path.startsWith("/api/orders") && (method === "POST" || method === "GET")) return true;
    if (path === "/api/products" && method === "GET") return true;
    if (path.startsWith("/api/categories") && method === "GET") return true;
    if (path.startsWith("/api/addons") && method === "GET") return true;
    if (path.startsWith("/api/sync/pull") && method === "GET") return true;
    return false;
  }

  // Inventory:
  // - Allowed: Adjust stocks, components, recipes, prep batches, purchase orders, suppliers.
  if (role === "inventory") {
    if (
      path.startsWith("/api/inventory") ||
      path.startsWith("/api/components") ||
      path.startsWith("/api/production-recipes") ||
      path.startsWith("/api/production-batches") ||
      path.startsWith("/api/purchase-requests") ||
      path.startsWith("/api/purchases") ||
      path.startsWith("/api/suppliers")
    ) {
      return true;
    }
    if (
      (path.startsWith("/api/products") ||
       path.startsWith("/api/categories") ||
       path.startsWith("/api/addons") ||
       path.startsWith("/api/sync/pull")) &&
      method === "GET"
    ) {
      return true;
    }
    return false;
  }

  // Accountant:
  // - Allowed: Reports, sales logs, sync pulls, catalogue lists.
  if (role === "accountant") {
    if (path.startsWith("/api/reports") && method === "GET") return true;
    if (path.startsWith("/api/sales") && method === "GET") return true;
    if (path.startsWith("/api/sync/pull") && method === "GET") return true;
    if (
      (path.startsWith("/api/products") ||
       path.startsWith("/api/categories") ||
       path.startsWith("/api/addons")) &&
      method === "GET"
    ) {
      return true;
    }
    return false;
  }

  // Manager:
  // - Allowed: View/modify inventory, products, components, recipes, view reports.
  // - Forbidden: Modify system settings.
  if (role === "manager") {
    if (path.startsWith("/api/settings") && method !== "GET") return false;
    return true;
  }

  return false;
}

function sanitizeCosts(obj) {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach(sanitizeCosts);
    return;
  }
  for (const k of Object.keys(obj)) {
    const keyLower = k.toLowerCase();
    if (
      keyLower === "costprice" ||
      keyLower === "cost_price" ||
      keyLower === "costperunit" ||
      keyLower === "cost_per_unit" ||
      keyLower === "totalinputcost" ||
      keyLower === "total_input_cost"
    ) {
      obj[k] = 0;
    } else {
      sanitizeCosts(obj[k]);
    }
  }
}

export const onRequest = async (context) => {
  const { request, next } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Initialize context data
  context.data = context.data || {};
  context.data.user = null;

  // 1. Authenticate user session token
  const cookieHeader = request.headers.get("Cookie") || "";
  const token = getCookie(cookieHeader, "session_token");
  if (token) {
    const payload = await verifyToken(token, context.env.TOKEN_SECRET);
    if (payload) {
      context.data.user = payload;
    }
  }

  // 2. Resolve request path
  const url = new URL(request.url);
  const path = url.pathname;

  // 3. Exclude public authentication and health routes from validation
  const isPublicRoute = path.startsWith("/api/auth/") || path === "/api/health";
  if (!isPublicRoute) {
    if (!context.data.user) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }),
        {
          status: 401,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    // 4. Enforce Role-Based Access Control (RBAC)
    const role = context.data.user.role;
    if (!isAuthorized(role, path, request.method)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Forbidden", code: "FORBIDDEN" }),
        {
          status: 403,
          headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }
  }

  try {
    context.env.DB = getRuntimeDb(context.env);
    let response = await next();

    // 5. Intercept and Sanitize Sensitive Cost Data for Cashiers
    if (context.data.user && context.data.user.role === "cashier") {
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const bodyText = await response.text();
        try {
          const data = JSON.parse(bodyText);
          sanitizeCosts(data);
          response = new Response(JSON.stringify(data), {
            status: response.status,
            headers: response.headers,
          });
        } catch {
          // Fallback to original text if parsing fails
          response = new Response(bodyText, {
            status: response.status,
            headers: response.headers,
          });
        }
      }
    }

    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      headers.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err && err.message ? err.message : String(err),
      }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
};
