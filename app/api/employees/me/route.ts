import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getEmployeeByEmail, saveEmployee, calcCompletion } from "@/lib/employeeStore";
import type { Employee } from "@/types";
import { randomUUID } from "crypto";

/** GET  /api/employees/me — return current user's employee profile */
export async function GET() {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const emp = getEmployeeByEmail(session.user.email);
  return NextResponse.json(emp ?? null);
}

/** PUT  /api/employees/me — upsert current user's employee profile */
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const now = new Date().toISOString();
  const existing = getEmployeeByEmail(session.user.email);

  const emp: Employee = {
    ...existing,
    ...body,
    id: existing?.id ?? randomUUID(),
    email: session.user.email,
    name: body.name ?? session.user.name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    completion: 0,
  };
  emp.completion = calcCompletion(emp);
  saveEmployee(emp);
  return NextResponse.json(emp);
}
