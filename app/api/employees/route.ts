import { NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/session";
import { getAllEmployees, saveEmployee, getEmployeeByEmail, calcCompletion } from "@/lib/employeeStore";
import type { Employee } from "@/types";
import { randomUUID } from "crypto";

function getAuth(req: NextRequest) {
  const adminCookie = req.cookies.get("tb_admin");
  const isAdmin = !!adminCookie?.value;
  const userCookie = req.cookies.get("tb_user");
  const user = userCookie ? decodeSession(userCookie.value) : null;
  return { isAdmin, user };
}

export async function GET(req: NextRequest) {
  const { isAdmin, user } = getAuth(req);
  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const all = getAllEmployees();
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const { isAdmin, user } = getAuth(req);
  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const now = new Date().toISOString();
  const email = isAdmin ? body.email : user!.email;
  const existing = getEmployeeByEmail(email);

  const emp: Employee = {
    ...existing,
    ...body,
    id: existing?.id ?? randomUUID(),
    email,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    completion: 0,
  };
  emp.completion = calcCompletion(emp);
  saveEmployee(emp);
  return NextResponse.json(emp);
}
