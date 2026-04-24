import { NextRequest, NextResponse } from "next/server";
import { getRequest, saveRequest } from "@/lib/store";
import { saveUploadedFile } from "@/lib/fileUpload";
import { sendPurchaseConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  const adminCookie = req.cookies.get("tb_admin");
  if (!adminCookie || adminCookie.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const requestId = String(formData.get("requestId") ?? "");
  const purchaseInfo = String(formData.get("purchaseInfo") ?? "");

  const travelRequest = getRequest(requestId);
  if (!travelRequest) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  let attachFile: string | undefined;
  const file = formData.get("file") as File | null;
  if (file && file.size > 0) {
    attachFile = await saveUploadedFile(file, `purchase-${requestId}`);
    travelRequest.purchaseFile = attachFile;
  }

  travelRequest.status = "purchased";
  travelRequest.purchaseInfo = purchaseInfo;
  saveRequest(travelRequest);

  await sendPurchaseConfirmation(travelRequest, attachFile);
  return NextResponse.json({ success: true });
}
