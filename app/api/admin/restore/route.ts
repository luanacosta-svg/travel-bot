import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function isAdmin(req: NextRequest) {
  const c = req.cookies.get("tb_admin");
  return c && c.value === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

  let backup: {
    version: string;
    data: {
      requests: unknown[];
      reimbursements: unknown[];
      invoices: unknown[];
    };
  };

  try {
    backup = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!backup?.data) {
    return NextResponse.json({ error: "Formato de backup inválido" }, { status: 400 });
  }

  // Garante que a pasta existe
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Escreve cada arquivo
  const results: Record<string, number> = {};

  if (Array.isArray(backup.data.requests)) {
    fs.writeFileSync(
      path.join(DATA_DIR, "requests.json"),
      JSON.stringify(backup.data.requests, null, 2),
      "utf-8"
    );
    results.requests = backup.data.requests.length;
  }

  if (Array.isArray(backup.data.reimbursements)) {
    fs.writeFileSync(
      path.join(DATA_DIR, "reimbursements.json"),
      JSON.stringify(backup.data.reimbursements, null, 2),
      "utf-8"
    );
    results.reimbursements = backup.data.reimbursements.length;
  }

  if (Array.isArray(backup.data.invoices)) {
    fs.writeFileSync(
      path.join(DATA_DIR, "invoices.json"),
      JSON.stringify(backup.data.invoices, null, 2),
      "utf-8"
    );
    results.invoices = backup.data.invoices.length;
  }

  return NextResponse.json({
    ok: true,
    restoredAt: new Date().toISOString(),
    records: results,
  });
}
