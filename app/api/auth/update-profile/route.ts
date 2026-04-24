import { NextRequest, NextResponse } from "next/server";
import { decodeSession, encodeSession } from "@/lib/session";

export async function PATCH(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  if (!cookie) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const session = decodeSession(cookie.value);
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const { name, phone } = await req.json();
  const updated = {
    ...session,
    name: name?.trim() || session.name,
    phone: phone?.trim() || undefined,
  };

  const newSession = encodeSession(updated);
  const res = NextResponse.json({ success: true, user: updated });
  res.cookies.set("tb_user", newSession, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
