import { NextRequest, NextResponse } from "next/server";
import { getRequest, updateStatus } from "@/lib/store";
import { sendOptionsToRequester } from "@/lib/email";

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { requestId, managerMessage } = await req.json();

    const travelRequest = getRequest(requestId);
    if (!travelRequest) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
    }

    await sendOptionsToRequester(travelRequest, managerMessage ?? "");
    updateStatus(requestId, "options_sent");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
