import { NextRequest, NextResponse } from "next/server";
import { getAllRequests } from "@/lib/store";
import { getAllReimbursements } from "@/lib/reimbursementStore";
import { getAllInvoices } from "@/lib/invoiceStore";
import fs from "fs";
import path from "path";

function isAdmin(req: NextRequest) {
  const c = req.cookies.get("tb_admin");
  return c && c.value === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
  const uploadsDir = path.join(DATA_DIR, "uploads");
  let uploadFiles: string[] = [];
  try {
    uploadFiles = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
  } catch {}

  const backup = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    stats: {
      requests: getAllRequests().length,
      reimbursements: getAllReimbursements().length,
      invoices: getAllInvoices().length,
      uploadFiles: uploadFiles.length,
    },
    data: {
      requests: getAllRequests(),
      reimbursements: getAllReimbursements(),
      invoices: getAllInvoices(),
    },
    uploads: uploadFiles,
  };

  const json = JSON.stringify(backup, null, 2);
  const filename = `backup-49pay-${new Date().toISOString().split("T")[0]}.json`;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
