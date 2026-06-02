import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getInvoice, saveInvoice } from "@/lib/invoiceStore";
import { sendBulkInvoiceStatusUpdate } from "@/lib/email";
import { createNotification } from "@/lib/notificationStore";
import type { InvoiceUpload } from "@/types";

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { ids, status, paymentDueDate } = await req.json() as {
    ids: string[]; status: string; paymentDueDate?: string;
  };

  if (!Array.isArray(ids) || ids.length === 0 || !status) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const labelMap: Record<string, string> = {
    received: "Recebido", rejected: "Recusado", paid: "Pago",
  };

  const updated: InvoiceUpload[] = [];

  for (const id of ids) {
    const item = getInvoice(id);
    if (!item) continue;
    const prevStatus = item.status;
    if (item.status === "paid") continue;

    item.status = status as InvoiceUpload["status"];
    if (paymentDueDate) item.paymentDueDate = paymentDueDate;

    if (status !== prevStatus) {
      if (!item.history) item.history = [];
      item.history.push({
        date: new Date().toISOString(),
        action: labelMap[status] ?? status,
        by: "Admin (lote)",
      });
    }

    saveInvoice(item);
    updated.push(item);
  }

  // Agrupa por email e envia 1 email por pessoa
  const byEmail = new Map<string, InvoiceUpload[]>();
  for (const item of updated) {
    const g = byEmail.get(item.requester.email) ?? [];
    g.push(item);
    byEmail.set(item.requester.email, g);
  }

  for (const [, items] of byEmail) {
    for (const item of items) {
      const notifMap: Record<string, { icon: string; tone: "green"|"blue"|"amber"|"red"; title: string; body: string }> = {
        received: { icon: "✓",  tone: "blue",  title: "NF recebida",  body: `"${item.invoice.description}" foi confirmada.` },
        rejected: { icon: "✕",  tone: "red",   title: "NF recusada",  body: `"${item.invoice.description}" foi recusada.` },
        paid:     { icon: "💰", tone: "green", title: "NF paga!",     body: `"${item.invoice.description}" foi paga.` },
      };
      if (notifMap[status]) createNotification(item.requester.email, notifMap[status]);
    }

    sendBulkInvoiceStatusUpdate(items, status, paymentDueDate).catch(e =>
      console.error("Bulk invoice email error:", e)
    );
  }

  return NextResponse.json({ updated: updated.length });
}
