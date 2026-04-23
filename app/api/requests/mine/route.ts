import { NextRequest, NextResponse } from "next/server";
import { getAllRequests } from "@/lib/store";
import { decodeSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  if (!cookie) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const session = decodeSession(cookie.value);
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const all = getAllRequests();
  const mine = all.filter((r) => r.requester.email === session.email);
  return NextResponse.json(mine);
}
