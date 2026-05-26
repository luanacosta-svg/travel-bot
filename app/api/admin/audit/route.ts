import { NextRequest, NextResponse } from "next/server";
import { logAudit, readAuditLog } from "@/lib/auditLog";

function getAdminId(req: NextRequest): string | null {
  const cookie = req.cookies.get("tb_admin");
  return cookie ? "admin" : null;
}

// GET /api/admin/audit — lista entradas do log (admin only)
export async function GET(req: NextRequest) {
  if (!getAdminId(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const url    = new URL(req.url);
  const limit  = Math.min(parseInt(url.searchParams.get("limit") ?? "200"), 500);
  const entries = readAuditLog(limit);
  return NextResponse.json(entries);
}

// POST /api/admin/audit — registra uma ação (ex: reveal de campo mascarado)
export async function POST(req: NextRequest) {
  if (!getAdminId(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ip = req.headers.get("cf-connecting-ip") ??
             req.headers.get("x-forwarded-for")?.split(",")[0] ??
             "unknown";

  try {
    const body = await req.json();
    const { action, target, detail } = body;
    if (!action) return NextResponse.json({ error: "action obrigatório" }, { status: 400 });

    logAudit({ action, actor: "admin", target, detail, ip });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
}
