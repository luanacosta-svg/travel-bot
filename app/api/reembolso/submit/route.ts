import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { saveReimbursement } from "@/lib/reimbursementStore";
import { saveUploadedFile } from "@/lib/fileUpload";
import { sendReimbursementNotification } from "@/lib/email";
import { decodeSession } from "@/lib/session";
import type { ReimbursementRequest } from "@/types";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  if (!cookie) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const session = decodeSession(cookie.value);
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  try {
    const formData = await req.formData();
    const id = uuidv4();

    let receiptFile: string | undefined;
    const file = formData.get("receiptFile") as File | null;
    if (file && file.size > 0) {
      receiptFile = await saveUploadedFile(file, `reimb-${id}`);
    }

    const item: ReimbursementRequest = {
      id,
      createdAt: new Date().toISOString(),
      status: "pending",
      requester: { name: session.name, email: session.email },
      expense: {
        description: String(formData.get("description") ?? ""),
        category: String(formData.get("category") ?? "outros"),
        date: String(formData.get("date") ?? ""),
        amount: parseFloat(String(formData.get("amount") ?? "0")),
        receiptFile,
      },
    };

    saveReimbursement(item);
    sendReimbursementNotification(item).catch((e) => console.error("Email error:", e));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 });
  }
}
