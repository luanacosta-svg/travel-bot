import { NextRequest, NextResponse } from "next/server";
import { getRequest, saveRequest, deleteRequest } from "@/lib/store";
import { decodeSession } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

function isAdmin(req: NextRequest) {
  const c = req.cookies.get("tb_admin");
  return c && c.value === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const request = getRequest(id);
  if (!request) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(request);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const item = getRequest(id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const userCookie = req.cookies.get("tb_user");
  const session = userCookie ? decodeSession(userCookie.value) : null;
  const admin = isAdmin(req);

  if (!admin && (!session || session.email !== item.requester.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  if (!admin && item.status !== "pending") {
    return NextResponse.json({ error: "Só é possível editar solicitações pendentes" }, { status: 403 });
  }

  if (admin) {
    if (body.status) item.status = body.status;
    if (body.managerMessage !== undefined) item.managerMessage = body.managerMessage;
    if (body.purchaseInfo !== undefined) item.purchaseInfo = body.purchaseInfo;
  } else {
    if (body.travel) item.travel = { ...item.travel, ...body.travel };
  }

  saveRequest(item);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const item = getRequest(id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const userCookie = req.cookies.get("tb_user");
  const session = userCookie ? decodeSession(userCookie.value) : null;
  const admin = isAdmin(req);

  if (!admin && (!session || session.email !== item.requester.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!admin && item.status !== "pending") {
    return NextResponse.json({ error: "Só é possível excluir solicitações pendentes" }, { status: 403 });
  }

  deleteRequest(id);
  return NextResponse.json({ success: true });
}
