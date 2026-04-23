import { NextRequest, NextResponse } from "next/server";
import { getAllInvoices } from "@/lib/invoiceStore";
import { decodeSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  if (!cookie) return NextResponse.json([]);
  const session = decodeSession(cookie.value);
  if (!session) return NextResponse.json([]);
  return NextResponse.json(getAllInvoices().filter((i) => i.requester.email === session.email));
}
