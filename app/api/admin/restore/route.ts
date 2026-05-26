import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import fs from "fs";
import path from "path";

// C3: Schema mínimo para validar os dados do backup antes de gravar em disco
function isValidRequest(r: unknown): boolean {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return typeof o.id === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.status === "string" &&
    typeof o.requester === "object" && o.requester !== null;
}

function isValidReimbursement(r: unknown): boolean {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return typeof o.id === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.status === "string" &&
    typeof o.requester === "object" && o.requester !== null &&
    typeof o.expense === "object" && o.expense !== null;
}

function isValidInvoice(r: unknown): boolean {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return typeof o.id === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.status === "string" &&
    typeof o.requester === "object" && o.requester !== null &&
    typeof o.invoice === "object" && o.invoice !== null;
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
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

  // C3: Valida schema de cada item antes de escrever em disco
  if (Array.isArray(backup.data.requests)) {
    const invalid = backup.data.requests.filter((r) => !isValidRequest(r));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `${invalid.length} solicitação(ões) com formato inválido no backup` }, { status: 400 });
    }
  }
  if (Array.isArray(backup.data.reimbursements)) {
    const invalid = backup.data.reimbursements.filter((r) => !isValidReimbursement(r));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `${invalid.length} reembolso(s) com formato inválido no backup` }, { status: 400 });
    }
  }
  if (Array.isArray(backup.data.invoices)) {
    const invalid = backup.data.invoices.filter((r) => !isValidInvoice(r));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `${invalid.length} nota(s) fiscal(is) com formato inválido no backup` }, { status: 400 });
    }
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const results: Record<string, number> = {};

  if (Array.isArray(backup.data.requests)) {
    fs.writeFileSync(path.join(DATA_DIR, "requests.json"), JSON.stringify(backup.data.requests, null, 2), "utf-8");
    results.requests = backup.data.requests.length;
  }
  if (Array.isArray(backup.data.reimbursements)) {
    fs.writeFileSync(path.join(DATA_DIR, "reimbursements.json"), JSON.stringify(backup.data.reimbursements, null, 2), "utf-8");
    results.reimbursements = backup.data.reimbursements.length;
  }
  if (Array.isArray(backup.data.invoices)) {
    fs.writeFileSync(path.join(DATA_DIR, "invoices.json"), JSON.stringify(backup.data.invoices, null, 2), "utf-8");
    results.invoices = backup.data.invoices.length;
  }

  return NextResponse.json({ ok: true, restoredAt: new Date().toISOString(), records: results });
}
