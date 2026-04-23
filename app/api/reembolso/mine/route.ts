import { NextRequest, NextResponse } from "next/server";
import { getAllReimbursements } from "@/lib/reimbursementStore";
import { decodeSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  if (!cookie) return NextResponse.json([], { status: 200 });
  const session = decodeSession(cookie.value);
  if (!session) return NextResponse.json([]);
  const all = getAllReimbursements();
  return NextResponse.json(all.filter((r) => r.requester.email === session.email));
}
