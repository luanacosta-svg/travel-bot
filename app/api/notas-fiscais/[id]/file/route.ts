import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getInvoice } from "@/lib/invoiceStore";
import { getFilePath, fileExists } from "@/lib/fileUpload";

type Ctx = { params: Promise<{ id: string }> };

function isAdmin(req: NextRequest) {
  const c = req.cookies.get("tb_admin");
  return c && c.value === process.env.ADMIN_SECRET;
}

function sanitize(str: string) {
  return str.replace(/[/\\?%*:|"<>]/g, "").trim();
}

function formatDateBR(iso: string) {
  // iso = "2026-04-25" → "25-04-2026"
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const inv = getInvoice(id);
  if (!inv) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const storedFile = inv.invoice.invoiceFile;
  if (!fileExists(storedFile)) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  const ext = storedFile.split(".").pop()?.toLowerCase() ?? "pdf";

  // Monta o nome amigável: "Luana Costa - 25-04-2026 - NF 38.pdf"
  const namePart = sanitize(inv.requester.name);
  const datePart = inv.invoice.invoiceDate ? formatDateBR(inv.invoice.invoiceDate) : inv.createdAt.slice(0, 10).split("-").reverse().join("-");
  const nfPart = inv.invoice.invoiceNumber ? `NF ${inv.invoice.invoiceNumber}` : "Nota Fiscal";
  const friendlyName = `${namePart} - ${datePart} - ${sanitize(nfPart)}.${ext}`;

  const buffer = fs.readFileSync(getFilePath(storedFile));

  const contentType =
    ext === "pdf" ? "application/pdf" :
    ext === "png" ? "image/png" :
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
    ext === "xml" ? "application/xml" :
    "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${friendlyName}"`,
    },
  });
}
