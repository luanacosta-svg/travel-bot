import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";
import { getEmployeeByEmail, saveEmployee, calcCompletion } from "@/lib/employeeStore";
import type { Employee } from "@/types";
import { randomUUID } from "crypto";

function getUser(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  return cookie ? decodeSession(cookie.value) : null;
}

/** GET  /api/employees/me */
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const emp = getEmployeeByEmail(user.email);
  return NextResponse.json(emp ?? null);
}

/** PUT  /api/employees/me */
export async function PUT(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const now = new Date().toISOString();
  const existing = getEmployeeByEmail(user.email);

  const emp: Employee = {
    ...existing,
    ...body,
    id: existing?.id ?? randomUUID(),
    email: user.email,
    name: body.name ?? user.name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    completion: 0,
  };
  emp.completion = calcCompletion(emp);
  saveEmployee(emp);
  return NextResponse.json(emp);
}
