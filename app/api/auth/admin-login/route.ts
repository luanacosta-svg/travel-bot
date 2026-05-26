import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { encodeAdminToken } from "@/lib/session";


export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rl = rateLimit("admin-login", ip, 5, 300);
  if (!rl.allowed) return NextResponse.json({ error: "Muitas tentativas. Aguarde 5 minutos." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { password } = body as Record<string, unknown>;

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Senha obrigatória" }, { status: 400 });
  }

  if (password !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const token = encodeAdminToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set("tb_admin", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   60 * 60 * 8, // 8h
    path:     "/",
  });
  return res;
}
