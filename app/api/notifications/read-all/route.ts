import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";
import { markAllRead } from "@/lib/notificationStore";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  const user = cookie ? decodeSession(cookie.value) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  markAllRead(user.email);
  return NextResponse.json({ ok: true });
}
