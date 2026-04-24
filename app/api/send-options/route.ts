import { NextRequest, NextResponse } from "next/server";
import { getRequest, saveRequest } from "@/lib/store";
import { saveUploadedFile } from "@/lib/fileUpload";
import { sendOptionsToRequester } from "@/lib/email";

export async function POST(req: NextRequest) {
  const adminCookie = req.cookies.get("tb_admin");
  if (!adminCookie || adminCookie.value !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const requestId = String(formData.get("requestId") ?? "");
  const managerMessage = String(formData.get("managerMessage") ?? "");

  const travelRequest = getRequest(requestId);
  if (!travelRequest) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  let attachFile: string | undefined;
  const file = formData.get("file") as File | null;
  if (file && file.size > 0) {
    attachFile = await saveUploadedFile(file, `options-${requestId}`);
    travelRequest.optionsFile = attachFile;
  }

  travelRequest.status = "options_sent";
  travelRequest.managerMessage = managerMessage;
  saveRequest(travelRequest);

  await sendOptionsToRequester(travelRequest, managerMessage, attachFile);
  return NextResponse.json({ success: true });
}
