import { NextRequest, NextResponse } from "next/server";
import { getInvoice, saveInvoice, getAllInvoices } from "@/lib/invoiceStore";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCookie = req.cookies.get("tb_admin");
  if (!adminCookie || adminCookie.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  if (id === "all") return NextResponse.json(getAllInvoices());
  const item = getInvoice(id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCookie = req.cookies.get("tb_admin");
  if (!adminCookie || adminCookie.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const item = getInvoice(id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const { status, adminNote } = await req.json();
  if (status) item.status = status;
  if (adminNote !== undefined) item.adminNote = adminNote;
  saveInvoice(item);
  return NextResponse.json({ success: true });
}
