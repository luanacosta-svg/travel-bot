import { NextRequest, NextResponse } from "next/server";
import { getRequest, saveRequest } from "@/lib/store";
import { sendPurchaseConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  const adminCookie = req.cookies.get("tb_admin");
  if (!adminCookie || adminCookie.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { requestId, purchaseInfo } = await req.json();
  const travelRequest = getRequest(requestId);
  if (!travelRequest) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  travelRequest.status = "purchased";
  travelRequest.purchaseInfo = purchaseInfo;
  saveRequest(travelRequest);

  await sendPurchaseConfirmation(travelRequest);
  return NextResponse.json({ success: true });
}
