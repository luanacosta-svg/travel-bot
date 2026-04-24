import { NextRequest, NextResponse } from "next/server";
import { getAllReimbursements } from "@/lib/reimbursementStore";
import { getAllInvoices } from "@/lib/invoiceStore";
import { sendMonthlyReport } from "@/lib/email";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = new Date();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const reimbursements = getAllReimbursements().filter((r) => {
    const d = new Date(r.createdAt);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const invoices = getAllInvoices().filter((i) => {
    const d = new Date(i.createdAt);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  await sendMonthlyReport(reimbursements, invoices, month, year);

  return NextResponse.json({
    success: true,
    month,
    year,
    reimbCount: reimbursements.length,
    invCount: invoices.length,
  });
}
