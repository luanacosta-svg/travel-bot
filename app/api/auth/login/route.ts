import { NextRequest, NextResponse } from "next/server";
import { encodeSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { name, email } = await req.json();

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }

  const session = encodeSession({ name: name.trim(), email: email.trim().toLowerCase() });

  const res = NextResponse.json({ success: true });
  res.cookies.set("tb_user", session, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
