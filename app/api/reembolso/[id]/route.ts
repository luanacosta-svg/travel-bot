import { NextRequest, NextResponse } from "next/server";
import { getReimbursement, saveReimbursement } from "@/lib/reimbursementStore";
import { getAllReimbursements } from "@/lib/reimbursementStore";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCookie = req.cookies.get("tb_admin");
  if (!adminCookie || adminCookie.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  if (id === "all") return NextResponse.json(getAllReimbursements());
  const item = getReimbursement(id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCookie = req.cookies.get("tb_admin");
  if (!adminCookie || adminCookie.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const item = getReimbursement(id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const { status, adminNote } = await req.json();
  if (status) item.status = status;
  if (adminNote !== undefined) item.adminNote = adminNote;
  saveReimbursement(item);
  return NextResponse.json({ success: true });
}
