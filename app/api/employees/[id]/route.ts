import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";
import { getEmployee, saveEmployee, deleteEmployee, calcCompletion } from "@/lib/employeeStore";
import { logAudit } from "@/lib/auditLog";

function getAuth(req: NextRequest) {
  const adminCookie = req.cookies.get("tb_admin");
  const isAdmin = !!adminCookie?.value;
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

  const body = await req.json();
  const updated = { ...emp, ...body, id, updatedAt: new Date().toISOString() };
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
