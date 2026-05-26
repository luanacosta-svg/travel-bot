import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // ── Cloudflare Authenticated Origin Pulls ──────────────────────────────────
  // Em produção, se CF_ORIGIN_SECRET estiver definido, só aceita requisições
  // que carreguem o header "cf-origin-secret" com o valor correto.
  // No Cloudflare: Transform Rules → Request Header → add "cf-origin-secret: <valor>"
  if (process.env.NODE_ENV === "production") {
    const cfSecret = process.env.CF_ORIGIN_SECRET;
    if (cfSecret) {
      const incoming = req.headers.get("cf-origin-secret");
      if (incoming !== cfSecret) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  const { pathname } = req.nextUrl;
  const userCookie  = req.cookies.get("tb_user");
  const adminCookie = req.cookies.get("tb_admin");

  if (pathname === "/") {
    if (adminCookie) return NextResponse.redirect(new URL("/admin",     req.url));
    if (userCookie)  return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!adminCookie) return NextResponse.redirect(new URL("/login?admin=1", req.url));
    return NextResponse.next();
  }

  if (["/dashboard", "/solicitar", "/minhas-solicitacoes", "/reembolso", "/notas-fiscais", "/perfil"].includes(pathname)) {
    if (!userCookie) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/solicitar", "/minhas-solicitacoes", "/admin/:path*", "/perfil",
            "/dashboard", "/reembolso", "/notas-fiscais"],
};
