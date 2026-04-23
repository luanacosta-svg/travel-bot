import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  if (!cookie) return NextResponse.json({ user: null });
  return NextResponse.json({ user: decodeSession(cookie.value) });
}
