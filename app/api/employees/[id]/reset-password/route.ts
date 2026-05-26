import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getEmployee, saveEmployee } from "@/lib/employeeStore";
import { logAudit } from "@/lib/auditLog";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const emp = getEmployee(id);
  if (!emp) {
    return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
  }

  // Remove a senha — no próximo login vai criar uma nova
  const { passwordHash: _, ...empSemSenha } = emp;
  saveEmployee(empSemSenha as typeof emp);

  const ip = req.headers.get("cf-connecting-ip") ??
             req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  logAudit({ action: "password_reset", actor: "admin", target: id, detail: emp.name, ip });

  return NextResponse.json({ ok: true });
}
