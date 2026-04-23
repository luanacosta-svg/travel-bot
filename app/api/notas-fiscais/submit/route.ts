import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { saveInvoice } from "@/lib/invoiceStore";
import { saveUploadedFile } from "@/lib/fileUpload";
import { sendInvoiceNotification } from "@/lib/email";
import { decodeSession } from "@/lib/session";
import type { InvoiceUpload } from "@/types";

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  if (!cookie) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const session = decodeSession(cookie.value);
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  try {
    const formData = await req.formData();
    const id = uuidv4();

    const file = formData.get("invoiceFile") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }
    const invoiceFile = await saveUploadedFile(file, `nf-${id}`);

    const item: InvoiceUpload = {
      id,
      createdAt: new Date().toISOString(),
      status: "pending",
      requester: { name: session.name, email: session.email },
      invoice: {
        description: String(formData.get("description") ?? ""),
        companyName: String(formData.get("companyName") ?? ""),
        cnpj: String(formData.get("cnpj") ?? "") || undefined,
        amount: parseFloat(String(formData.get("amount") ?? "0")),
        invoiceFile,
      },
    };

    saveInvoice(item);
    sendInvoiceNotification(item).catch((e) => console.error("Email error:", e));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao processar envio" }, { status: 500 });
  }
}
