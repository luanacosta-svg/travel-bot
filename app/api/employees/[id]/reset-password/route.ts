import { NextRequest, NextResponse } from "next/server";
import { getEmployee, saveEmployee } from "@/lib/employeeStore";

function isAdmin(req: NextRequest) {
  const c = req.cookies.get("tb_admin");
  return c && c.value === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) {
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

  return NextResponse.json({ ok: true });
}
