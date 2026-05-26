import { NextRequest, NextResponse } from "next/server";

// ── Helpers Edge-compatible (Web Crypto API) ───────────────────────────────
function getSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
}

async function isValidAdminTokenEdge(token: string): Promise<boolean> {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx < 0) return false;
    const b64 = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // base64url → base64 padrão
    const base64Sig = sig.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (base64Sig.length % 4)) % 4);
    const sigBytes = Uint8Array.from(atob(base64Sig + padding), (c) => c.charCodeAt(0));
    const dataBytes = new TextEncoder().encode(b64);

    const valid = await crypto.subtle.verify("HMAC", keyMaterial, sigBytes, dataBytes);
    if (!valid) return false;

    const base64Payload = b64.replace(/-/g, "+").replace(/_/g, "/");
    const paddingP = "=".repeat((4 - (base64Payload.length % 4)) % 4);
    const payload = JSON.parse(atob(base64Payload + paddingP));
    return payload.role === "admin" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// ── Cloudflare Authenticated Origin Pulls ──────────────────────────────────
function checkCloudflareOrigin(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const cfSecret = process.env.CF_ORIGIN_SECRET;
  if (!cfSecret) return true;
  return req.headers.get("cf-origin-secret") === cfSecret;
}

// ── M2: Nonce-based CSP ────────────────────────────────────────────────────
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}'`;

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export async function middleware(req: NextRequest) {
  // Cloudflare origin check
  if (!checkCloudflareOrigin(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { pathname } = req.nextUrl;
  const userCookie  = req.cookies.get("tb_user");
  const adminCookie = req.cookies.get("tb_admin");

  // ── Auth redirects ──
  if (pathname === "/") {
    if (adminCookie && await isValidAdminTokenEdge(adminCookie.value)) return NextResponse.redirect(new URL("/admin", req.url));
    if (userCookie)  return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!adminCookie || !(await isValidAdminTokenEdge(adminCookie.value))) {
      return NextResponse.redirect(new URL("/login?admin=1", req.url));
    }
  }

  if (["/dashboard", "/solicitar", "/minhas-solicitacoes", "/reembolso", "/notas-fiscais", "/perfil"].includes(pathname)) {
    if (!userCookie) return NextResponse.redirect(new URL("/login", req.url));
  }

  // ── Nonce CSP (Web Crypto — Edge compatible) ──
  const nonceArray = new Uint8Array(16);
  crypto.getRandomValues(nonceArray);
  const nonce = btoa(String.fromCharCode(...nonceArray));
  const csp   = buildCsp(nonce);

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set("Content-Security-Policy", csp);

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|manifest|.*\\.(?:png|ico|svg|webp|jpg|jpeg)).*)",
  ],
};
