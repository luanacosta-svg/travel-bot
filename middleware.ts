import { NextRequest, NextResponse } from "next/server";
import { isValidAdminToken } from "@/lib/session";
import { randomBytes } from "crypto";

// ── Cloudflare Authenticated Origin Pulls ──────────────────────────────────
// Em produção, só aceita requisições com o header cf-origin-secret correto.
// Configure no Cloudflare: Transform Rules → Request Headers → adicionar
// "cf-origin-secret: <CF_ORIGIN_SECRET>" em todas as requisições.
function checkCloudflareOrigin(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const cfSecret = process.env.CF_ORIGIN_SECRET;
  if (!cfSecret) return true; // não configurado — permite (aviso em logs)
  return req.headers.get("cf-origin-secret") === cfSecret;
}

// ── M2: Nonce-based CSP ────────────────────────────────────────────────────
// Gera um nonce por requisição para remover unsafe-inline do script-src.
// O layout lê o nonce via header x-nonce e o aplica nos <Script> components.
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`   // HMR precisa de eval em dev
    : `script-src 'self' 'nonce-${nonce}'`;                 // produção: sem unsafe-inline, sem unsafe-eval

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",   // Tailwind CSS inline ainda necessário
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function middleware(req: NextRequest) {
  // Cloudflare origin check
  if (!checkCloudflareOrigin(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { pathname } = req.nextUrl;
  const userCookie  = req.cookies.get("tb_user");
  const adminCookie = req.cookies.get("tb_admin");

  // ── Auth redirects ──
  if (pathname === "/") {
    if (adminCookie && isValidAdminToken(adminCookie.value)) return NextResponse.redirect(new URL("/admin", req.url));
    if (userCookie)  return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!adminCookie || !isValidAdminToken(adminCookie.value)) {
      return NextResponse.redirect(new URL("/login?admin=1", req.url));
    }
  }

  if (["/dashboard", "/solicitar", "/minhas-solicitacoes", "/reembolso", "/notas-fiscais", "/perfil"].includes(pathname)) {
    if (!userCookie) return NextResponse.redirect(new URL("/login", req.url));
  }

  // ── Nonce CSP ──
  const nonce = Buffer.from(randomBytes(16)).toString("base64");
  const csp   = buildCsp(nonce);

  // Passa o nonce para server components via header de request
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set("Content-Security-Policy", csp);

  // Mantém outros security headers (os do next.config.ts cobrem o resto)
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|manifest|.*\\.(?:png|ico|svg|webp|jpg|jpeg)).*)",
  ],
};
