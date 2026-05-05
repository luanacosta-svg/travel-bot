import { NextRequest, NextResponse } from "next/server";
import { getReimbursement, saveReimbursement } from "@/lib/reimbursementStore";
import { saveUploadedFile } from "@/lib/fileUpload";

type Ctx = { params: Promise<{ id: string }> };

function isAdmin(req: NextRequest) {
  const c = req.cookies.get("tb_admin");
  return c && c.value === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const item = getReimbursement(id);
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const filename = await saveUploadedFile(file, `reimb-${id}`);
    item.expense.receiptFile = filename;
    saveReimbursement(item);

    return NextResponse.json({ success: true, filename });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar arquivo" }, { status: 500 });
  }
}
