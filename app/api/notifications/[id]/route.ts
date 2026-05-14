import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";
import { markOneRead } from "@/lib/notificationStore";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookie = req.cookies.get("tb_user");
  const user = cookie ? decodeSession(cookie.value) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  markOneRead(id);
  return NextResponse.json({ ok: true });
}
