import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { decodeSession } from "@/lib/session";
import { getAllEmployees, saveEmployee, getEmployeeByEmail, calcCompletion } from "@/lib/employeeStore";
import type { Employee } from "@/types";
import { randomUUID } from "crypto";

function getAuth(req: NextRequest) {
  const isAdmin = isAdminRequest(req);
  const userCookie = req.cookies.get("tb_user");
  const user = userCookie ? decodeSession(userCookie.value) : null;
  return { isAdmin, user };
}

export async function GET(req: NextRequest) {
  const { isAdmin } = getAuth(req);
  // Listagem completa (com PII) é restrita a admin
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const all = getAllEmployees();
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const { isAdmin, user } = getAuth(req);
  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await req.json();
  const now = new Date().toISOString();
  const email = isAdmin ? rawBody.email : user!.email;
  const existing = getEmployeeByEmail(email);

  // A4: strip campos protegidos para evitar mass assignment
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, email: _e, createdAt: _ca, passwordHash: _ph, completion: _comp, ...safeBody } =
    rawBody as Record<string, unknown>;

  const emp = {
    ...existing,
    ...(safeBody as Partial<Employee>),
    id: existing?.id ?? randomUUID(),
    email,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    completion: 0,
  } as Employee;
  emp.completion = calcCompletion(emp);
  saveEmployee(emp);
  return NextResponse.json(emp);
}
