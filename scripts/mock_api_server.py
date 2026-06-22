"""
Mock API & Static File Server for local POS testing without Node.js or Cloudflare Wrangler.
Saves sales and orders locally/mocked to prevent network and JSON parsing errors.
Includes full authentication, RBAC, and cost sanitization matching the JS backend.
"""

import http.server
import socketserver
import json
import os
import uuid
import datetime
import hashlib
import base64
import time
import re
from urllib.parse import urlparse, parse_qs

PORT = 8085

TOKEN_SECRET = "shopprogram_jwt_secret_key_2026"
SALT = "shopprogram_salt_2026"

# ─── Crypto helpers (produce the SAME tokens as the JS backend) ───

def hash_password(password, salt=""):
    """SHA-256 hex digest of password+salt, identical to JS hashPassword."""
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()

def create_signed_token(payload):
    """
    base64(json(payload)) + "." + sha256(base64_payload + "." + TOKEN_SECRET).hex()
    Matches the JS createSignedToken exactly.
    """
    payload_json = json.dumps(payload, separators=(",", ":"))
    payload_b64 = base64.b64encode(payload_json.encode("utf-8")).decode("ascii")
    data = (payload_b64 + "." + TOKEN_SECRET).encode("utf-8")
    signature = hashlib.sha256(data).hexdigest()
    return payload_b64 + "." + signature

def verify_token(token):
    """
    Split on ".", verify SHA-256 signature, decode payload, check expiry.
    Returns the payload dict or None.
    """
    if not token:
        return None
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        data = (payload_b64 + "." + TOKEN_SECRET).encode("utf-8")
        expected = hashlib.sha256(data).hexdigest()
        if signature != expected:
            return None
        payload = json.loads(base64.b64decode(payload_b64).decode("utf-8"))
        if payload.get("exp") and time.time() * 1000 > payload["exp"]:
            return None
        return payload
    except Exception:
        return None

# ─── Account definitions (same hashes as JS backend) ───

ACCOUNTS = {
    "admin@shopprogram.local": {
        "role": "admin",
        "hash": hash_password("admin123", SALT),
    },
    "manager@shopprogram.local": {
        "role": "manager",
        "hash": hash_password("manager123", SALT),
    },
    "cashier@shopprogram.local": {
        "role": "cashier",
        "hash": hash_password("cashier123", SALT),
    },
    "inventory@shopprogram.local": {
        "role": "inventory",
        "hash": hash_password("inventory123", SALT),
    },
    "accountant@shopprogram.local": {
        "role": "accountant",
        "hash": hash_password("accountant123", SALT),
    },
}

# ─── Cookie parsing ───

def parse_cookie(cookie_header):
    """Parse Cookie header string and return dict of name→value."""
    cookies = {}
    if not cookie_header:
        return cookies
    for pair in cookie_header.split(";"):
        pair = pair.strip()
        if "=" in pair:
            k, v = pair.split("=", 1)
            cookies[k.strip()] = v.strip()
    return cookies

# ─── RBAC (mirrors JS _middleware.js isAuthorized) ───

def is_authorized(role, path, method):
    if role == "admin":
        return True

    # Auth and health endpoints are always public
    if path.startswith("/api/auth/") or path == "/api/health":
        return True

    # Cashier
    if role == "cashier":
        if path.startswith("/api/sales") and method in ("POST", "GET"):
            return True
        if path.startswith("/api/orders") and method in ("POST", "GET"):
            return True
        if path == "/api/products" and method == "GET":
            return True
        if path.startswith("/api/categories") and method == "GET":
            return True
        if path.startswith("/api/addons") and method == "GET":
            return True
        if path.startswith("/api/sync/pull") and method == "GET":
            return True
        return False

    # Inventory
    if role == "inventory":
        if any(path.startswith(p) for p in (
            "/api/inventory", "/api/components",
            "/api/production-recipes", "/api/production-batches",
            "/api/purchase-requests", "/api/purchases", "/api/suppliers"
        )):
            return True
        if any(path.startswith(p) for p in (
            "/api/products", "/api/categories", "/api/addons", "/api/sync/pull"
        )) and method == "GET":
            return True
        return False

    # Accountant
    if role == "accountant":
        if path.startswith("/api/reports") and method == "GET":
            return True
        if path.startswith("/api/sales") and method == "GET":
            return True
        if path.startswith("/api/sync/pull") and method == "GET":
            return True
        if any(path.startswith(p) for p in (
            "/api/products", "/api/categories", "/api/addons"
        )) and method == "GET":
            return True
        return False

    # Manager
    if role == "manager":
        if path.startswith("/api/settings") and method != "GET":
            return False
        return True

    return False

# ─── Cost sanitization (for cashier role) ───

COST_KEYS = {"costprice", "cost_price", "costperunit", "cost_per_unit",
             "totalinputcost", "total_input_cost"}

def sanitize_costs(obj):
    """Recursively set cost-related keys to 0, matching JS sanitizeCosts."""
    if isinstance(obj, list):
        for item in obj:
            sanitize_costs(item)
    elif isinstance(obj, dict):
        for k in list(obj.keys()):
            if k.lower() in COST_KEYS:
                obj[k] = 0
            else:
                sanitize_costs(obj[k])

# ─── Mock data ───

mock_products = [
    {
        "id": "ORIA61015",
        "name": "B.OREO KEM V.QUAT110.4/105G",
        "price": 22000,
        "stock": 100,
        "category_id": "combo",
        "is_active": 1,
        "inventory_mode": "stock",
        "unit": "package",
    },
    {
        "id": "ORIA62002",
        "name": "N.T.KHIET DASANI 350ML*1CH",
        "price": 5000,
        "stock": 250,
        "category_id": "beverages",
        "is_active": 1,
        "inventory_mode": "stock",
        "unit": "bottle",
    },
    {
        "id": "ORIA62015",
        "name": "CACAO MILO 3IN1 22G",
        "price": 6000,
        "stock": 14,
        "category_id": "beverages",
        "is_active": 1,
        "inventory_mode": "stock",
        "unit": "g",
    },
]

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Op-Id",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
}


class MockAPIHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress logging to keep console clean
        pass

    # ─── Helpers ───

    def _send_cors_headers(self):
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)

    def _send_json(self, data, status=200, extra_headers=None):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return None
        raw = self.rfile.read(content_length).decode("utf-8")
        return json.loads(raw)

    def _get_user_from_cookie(self):
        """Extract and verify session_token from Cookie header."""
        cookie_header = self.headers.get("Cookie", "")
        cookies = parse_cookie(cookie_header)
        token = cookies.get("session_token")
        if token:
            # URL-decode if needed (JS encodeURIComponent)
            from urllib.parse import unquote
            token = unquote(token)
        return verify_token(token)

    def _enforce_auth(self, path, method):
        """
        Enforce authentication and RBAC.
        Returns the user payload if authorized, or sends an error response and returns None.
        """
        is_public = path.startswith("/api/auth/") or path == "/api/health"

        user = self._get_user_from_cookie()

        if not is_public:
            if not user:
                self._send_json({"ok": False, "error": "Unauthorized", "code": "UNAUTHORIZED"}, 401)
                return None
            if not is_authorized(user["role"], path, method):
                self._send_json({"ok": False, "error": "Forbidden", "code": "FORBIDDEN"}, 403)
                return None

        return user

    def _maybe_sanitize(self, user, data):
        """Sanitize cost fields if user is a cashier."""
        if user and user.get("role") == "cashier":
            sanitize_costs(data)
        return data

    # ─── OPTIONS (CORS preflight) ───

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    # ─── GET ───

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if not path.startswith("/api/"):
            # Static file fallback
            super().do_GET()
            return

        user = self._enforce_auth(path, "GET")
        if user is None and not (path.startswith("/api/auth/") or path == "/api/health"):
            return  # error already sent

        # GET /api/auth/me
        if path == "/api/auth/me":
            if user:
                self._send_json({"ok": True, "user": {"email": user["email"], "role": user["role"]}})
            else:
                self._send_json({"ok": False, "error": "Unauthorized"}, 401)
            return

        # GET /api/health
        if path == "/api/health":
            self._send_json({"ok": True, "status": "healthy"})
            return

        # GET /api/products
        if path.startswith("/api/products"):
            data = {"ok": True, "products": mock_products}
            self._send_json(self._maybe_sanitize(user, data))
            return

        # GET /api/sync/pull
        if path.startswith("/api/sync/pull"):
            data = {
                "ok": True,
                "serverTime": int(datetime.datetime.now().timestamp() * 1000),
                "categories": [
                    {"id": "combo", "label": "Combo / Packages", "icon": "📦", "sort_order": 1, "is_active": 1},
                    {"id": "beverages", "label": "Đồ uống / Beverages", "icon": "🧃", "sort_order": 2, "is_active": 1},
                ],
                "addOns": [],
                "components": [],
                "products": mock_products,
                "inventory": [],
                "settings": [],
                "recentSales": [],
                "productionRecipes": [],
                "productionBatches": [],
            }
            self._send_json(self._maybe_sanitize(user, data))
            return

        # Fallback: not found
        self._send_json({"ok": False, "error": "Not found"}, 404)

    # ─── POST ───

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if not path.startswith("/api/"):
            self._send_json({"ok": False, "error": "Not found"}, 404)
            return

        # Auth endpoints (public, no RBAC enforcement yet)
        if path == "/api/auth/login":
            self._handle_login()
            return

        if path == "/api/auth/logout":
            self._handle_logout()
            return

        # All other POST endpoints require auth
        user = self._enforce_auth(path, "POST")
        if user is None:
            return  # error already sent

        # POST /api/orders/next
        if path.startswith("/api/orders/next"):
            now = datetime.datetime.now()
            date_str = now.strftime("%Y%m%d")
            order_date_str = now.strftime("%d/%m/%Y")
            uid_suffix = uuid.uuid4().hex[:3].upper()
            sale_id = f"HD-{date_str}-{uid_suffix}"
            order_id = f"{order_date_str}-{uid_suffix}"
            data = {"ok": True, "saleId": sale_id, "orderId": order_id}
            self._send_json(self._maybe_sanitize(user, data))
            return

        # POST /api/sales
        if path.startswith("/api/sales"):
            payload = self._read_json_body() or {}
            data = {
                "ok": True,
                "id": payload.get("id") or "HD-MOCK-ID",
                "orderId": payload.get("orderId") or "MOCK-ORDER-ID",
                "serverTotal": payload.get("total", 0),
                "serverSubtotal": payload.get("subtotal", 0),
                "serverVat": payload.get("vatAmount", 0),
                "change": payload.get("changeAmount", 0),
            }
            self._send_json(self._maybe_sanitize(user, data))
            return

        self._send_json({"ok": False, "error": "Not found"}, 404)

    # ─── Auth handlers ───

    def _handle_login(self):
        body = self._read_json_body()
        if not body or not body.get("email") or not body.get("password"):
            self._send_json({"ok": False, "error": "Email and password are required"}, 400)
            return

        email = body["email"].strip().lower()
        password = str(body["password"])

        account = ACCOUNTS.get(email)
        if not account:
            self._send_json({"ok": False, "error": "Invalid credentials"}, 400)
            return

        input_hash = hash_password(password, SALT)
        if input_hash != account["hash"]:
            self._send_json({"ok": False, "error": "Invalid credentials"}, 400)
            return

        # Create token with 24h expiry (milliseconds, matching JS Date.now())
        exp = int(time.time() * 1000) + 24 * 60 * 60 * 1000
        token = create_signed_token({"email": email, "role": account["role"], "exp": exp})

        cookie_value = f"session_token={token}; Path=/; HttpOnly; Secure; Max-Age=86400; SameSite=Lax"
        self._send_json(
            {"ok": True, "user": {"email": email, "role": account["role"]}},
            extra_headers={"Set-Cookie": cookie_value},
        )

    def _handle_logout(self):
        cookie_value = "session_token=; Path=/; HttpOnly; Secure; Max-Age=0; SameSite=Lax"
        self._send_json(
            {"ok": True},
            extra_headers={"Set-Cookie": cookie_value},
        )


if __name__ == "__main__":
    # Change working directory to project root if run from scripts
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MockAPIHandler) as httpd:
        print(f"Mock API & Static Server running at http://localhost:{PORT}")
        print(f"Auth enabled – login via POST /api/auth/login")
        print(f"Accounts: {', '.join(ACCOUNTS.keys())}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
