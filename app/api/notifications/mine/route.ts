import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";
import { getNotificationsForUser } from "@/lib/notificationStore";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  const user = cookie ? decodeSession(cookie.value) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = getNotificationsForUser(user.email);
  return NextResponse.json(notifications);
}
