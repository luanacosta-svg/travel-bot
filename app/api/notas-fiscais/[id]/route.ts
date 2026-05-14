import { NextRequest, NextResponse } from "next/server";
import { getInvoice, saveInvoice, deleteInvoice } from "@/lib/invoiceStore";
import { decodeSession } from "@/lib/session";
import { sendInvoiceStatusUpdate, sendInvoicePaidNotification } from "@/lib/email";
import { createNotification } from "@/lib/notificationStore";

type Ctx = { params: Promise<{ id: string }> };

function isAdmin(req: NextRequest) {
  const c = req.cookies.get("tb_admin");
  return c && c.value === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const item = getInvoice(id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const item = getInvoice(id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const userCookie = req.cookies.get("tb_user");
  const session = userCookie ? decodeSession(userCookie.value) : null;
  const admin = isAdmin(req);

  if (!admin && (!session || session.email !== item.requester.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const prevStatus = item.status;

  if (admin) {
    if (body.status) item.status = body.status;
    if (body.adminNote !== undefined) item.adminNote = body.adminNote;
    if (body.paymentDueDate !== undefined) item.paymentDueDate = body.paymentDueDate || undefined;

    if (body.status && body.status !== prevStatus) {
      if (!item.history) item.history = [];
      const label = body.status === "received" ? "Recebido" : body.status === "rejected" ? "Recusado" : body.status === "paid" ? "Pago" : body.status;
      item.history.push({ date: new Date().toISOString(), action: label, by: "Admin" });
      if (body.status === "paid") {
        sendInvoicePaidNotification(item).catch((e) => console.error("Email error:", e));
        createNotification(item.requester.email, {
          icon: "💸", tone: "green",
          title: "NF paga!",
          body: `"${item.invoice.description}" · R$ ${item.invoice.amount.toFixed(2).replace(".", ",")} foi paga.`,
        });
      } else {
        sendInvoiceStatusUpdate(item).catch((e) => console.error("Email error:", e));
        const notifMap: Record<string, { icon: string; tone: "green"|"blue"|"amber"|"red"; title: string; body: string }> = {
          received: { icon: "📥", tone: "blue",  title: "NF recebida pelo time",  body: `"${item.invoice.description}" foi recebida e está em análise.` },
          rejected: { icon: "✕",  tone: "red",   title: "NF recusada",            body: `"${item.invoice.description}" foi recusada. Veja o painel para mais detalhes.` },
        };
        if (notifMap[body.status]) {
          createNotification(item.requester.email, notifMap[body.status]);
        }
      }
    }
  }

  saveInvoice(item);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const item = getInvoice(id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const userCookie = req.cookies.get("tb_user");
  const session = userCookie ? decodeSession(userCookie.value) : null;
  const admin = isAdmin(req);

  if (!admin && (!session || session.email !== item.requester.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!admin && item.status !== "pending" && item.status !== "rejected") {
    return NextResponse.json({ error: "Só é possível excluir itens pendentes ou recusados" }, { status: 403 });
  }

  deleteInvoice(id);
  return NextResponse.json({ success: true });
}
