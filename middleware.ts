import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userCookie = req.cookies.get("tb_user");
  const adminCookie = req.cookies.get("tb_admin");

  if (pathname === "/") {
    if (adminCookie) return NextResponse.redirect(new URL("/admin", req.url));
    if (userCookie) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!adminCookie) return NextResponse.redirect(new URL("/login?admin=1", req.url));
    return NextResponse.next();
  }

  if (pathname === "/dashboard" || pathname === "/solicitar" || pathname === "/minhas-solicitacoes") {
    if (!userCookie) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/solicitar", "/minhas-solicitacoes", "/admin/:path*"],
};
