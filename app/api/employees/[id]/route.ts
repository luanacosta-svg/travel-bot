import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getEmployee, saveEmployee, deleteEmployee, calcCompletion } from "@/lib/employeeStore";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isAdmin && !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emp = getEmployee(id);
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(emp);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isAdmin && !session.user) {
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

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  deleteEmployee(id);
  return NextResponse.json({ ok: true });
}
