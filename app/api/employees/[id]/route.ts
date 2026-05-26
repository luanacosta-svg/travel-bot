import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { decodeSession } from "@/lib/session";
import { getEmployee, saveEmployee, deleteEmployee, calcCompletion } from "@/lib/employeeStore";
import { logAudit } from "@/lib/auditLog";

function getAuth(req: NextRequest) {
  const isAdmin = isAdminRequest(req);
  const userCookie = req.cookies.get("tb_user");
  const user = userCookie ? decodeSession(userCookie.value) : null;
  return { isAdmin, user };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isAdmin, user } = getAuth(req);
  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emp = getEmployee(id);
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // A2: usuário só pode ver o próprio perfil
  if (!isAdmin && emp.email !== user?.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Audit: loga quando admin acessa dados pessoais de colaborador
  if (isAdmin) {
    const ip = req.headers.get("cf-connecting-ip") ??
               req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    logAudit({ action: "pii_view", actor: "admin", target: id, detail: emp.name, ip });
  }

  return NextResponse.json(emp);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isAdmin, user } = getAuth(req);
  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emp = getEmployee(id);
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // A2: usuário só pode editar o próprio perfil
  if (!isAdmin && emp.email !== user?.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawBody = await req.json();

  // A4: campos protegidos não podem ser sobrescritos via API
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, email: _email, createdAt: _ca, passwordHash: _ph, completion: _comp, ...safeBody } =
    rawBody as Record<string, unknown>;

  const updated = { ...emp, ...safeBody, id, email: emp.email, updatedAt: new Date().toISOString() };
  updated.completion = calcCompletion(updated);
  saveEmployee(updated);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isAdmin } = getAuth(req);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  deleteEmployee(id);
  return NextResponse.json({ ok: true });
}
