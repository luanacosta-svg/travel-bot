import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getReimbursement, saveReimbursement } from "@/lib/reimbursementStore";
import { sendBulkReimbursementStatusUpdate } from "@/lib/email";
import { createNotification } from "@/lib/notificationStore";
import type { ReimbursementRequest } from "@/types";

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { ids, status, paymentDueDate } = await req.json() as {
    ids: string[]; status: string; paymentDueDate?: string;
  };

  if (!Array.isArray(ids) || ids.length === 0 || !status) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const labelMap: Record<string, string> = {
    approved: "Aprovado", rejected: "Recusado", paid: "Pago",
  };

  const updated: ReimbursementRequest[] = [];

  for (const id of ids) {
    const item = getReimbursement(id);
    if (!item) continue;
    const prevStatus = item.status;
    if (item.status === "paid") continue; // não retrocede

    item.status = status as ReimbursementRequest["status"];
    if (paymentDueDate) item.paymentDueDate = paymentDueDate;

    if (status !== prevStatus) {
      if (!item.history) item.history = [];
      item.history.push({
        date: new Date().toISOString(),
        action: labelMap[status] ?? status,
        by: "Admin (lote)",
      });
    }

    saveReimbursement(item);
    updated.push(item);
  }

  // Agrupa por email e envia 1 email por pessoa
  const byEmail = new Map<string, ReimbursementRequest[]>();
  for (const item of updated) {
    const g = byEmail.get(item.requester.email) ?? [];
    g.push(item);
    byEmail.set(item.requester.email, g);
  }

  for (const [, items] of byEmail) {
    // Notificação in-app por item
    for (const item of items) {
      const notifMap: Record<string, { icon: string; tone: "green"|"blue"|"amber"|"red"; title: string; body: string }> = {
        approved: { icon: "✓", tone: "green", title: "Reembolso aprovado", body: `"${item.expense.description}" foi aprovado.` },
        rejected: { icon: "✕", tone: "red",   title: "Reembolso recusado", body: `"${item.expense.description}" foi recusado.` },
        paid:     { icon: "💸", tone: "green", title: "Reembolso pago!",   body: `"${item.expense.description}" foi pago.` },
      };
      if (notifMap[status]) createNotification(item.requester.email, notifMap[status]);
    }

    // 1 email consolidado por pessoa
    sendBulkReimbursementStatusUpdate(items, status, paymentDueDate).catch(e =>
      console.error("Bulk email error:", e)
    );
  }

  return NextResponse.json({ updated: updated.length });
}
