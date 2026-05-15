import { NextRequest, NextResponse } from "next/server";
import { encodeSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { name, email } = body as Record<string, unknown>;

  if (typeof name !== "string" || typeof email !== "string") {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }

  const cleanName  = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName || cleanName.length < 2 || cleanName.length > 200) {
    return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
  }
  if (!cleanEmail || !cleanEmail.includes("@") || cleanEmail.length > 200) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const session = encodeSession({ name: cleanName, email: cleanEmail });

  const res = NextResponse.json({ success: true });
  res.cookies.set("tb_user", session, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   60 * 60 * 24 * 7, // 7 dias (era 30)
    path:     "/",
  });
  return res;
}
