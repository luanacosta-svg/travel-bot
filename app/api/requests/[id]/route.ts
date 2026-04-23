import { NextRequest, NextResponse } from "next/server";
import { getRequest } from "@/lib/store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCookie = req.cookies.get("tb_admin");
  if (!adminCookie || adminCookie.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const request = getRequest(id);
  if (!request) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(request);
}
