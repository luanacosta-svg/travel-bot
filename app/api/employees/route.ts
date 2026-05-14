import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAllEmployees, saveEmployee, getEmployeeByEmail, calcCompletion } from "@/lib/employeeStore";
import type { Employee } from "@/types";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session.isAdmin && !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const all = getAllEmployees();
  return NextResponse.json(all);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.user && !session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const now = new Date().toISOString();

  // For collaborators: use their session email, find or create
  const email = session.isAdmin ? body.email : session.user!.email;
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
