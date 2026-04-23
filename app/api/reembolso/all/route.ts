import { NextRequest, NextResponse } from "next/server";
import { getAllReimbursements } from "@/lib/reimbursementStore";

export async function GET(req: NextRequest) {
  const adminCookie = req.cookies.get("tb_admin");
  if (!adminCookie || adminCookie.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  return NextResponse.json(getAllReimbursements());
}
