import { NextRequest, NextResponse } from "next/server";
import { getAllReimbursements } from "@/lib/reimbursementStore";
import { getFilePath, fileExists } from "@/lib/fileUpload";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";

type Ctx = { params: Promise<{ batchId: string }> };

function isAdmin(req: NextRequest) {
  const c = req.cookies.get("tb_admin");
  return c && c.value === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { batchId } = await params;
  const all = getAllReimbursements();
  const items = all.filter((r) => r.batchId === batchId);

  if (items.length === 0) {
    return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ── Página 1: Resumo ──────────────────────────────────────────────────────
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 48;
  let y = height - margin;

  // Cabeçalho
  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: rgb(0.145, 0.388, 0.922) });
  page.drawText("49 Educação · Viagens", { x: margin, y: height - 44, size: 18, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Relatório de Reembolso", { x: margin, y: height - 64, size: 11, font: fontRegular, color: rgb(0.8, 0.87, 1) });

  y = height - 100;

  // Info do solicitante
  const requester = items[0].requester;
  const total = items.reduce((s, r) => s + r.expense.amount, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

  page.drawText(`Solicitante: ${requester.name}`, { x: margin, y, size: 11, font: fontBold, color: rgb(0.12, 0.18, 0.27) });
  y -= 16;
  page.drawText(`Email: ${requester.email}`, { x: margin, y, size: 10, font: fontRegular, color: rgb(0.35, 0.43, 0.54) });
  y -= 16;
  page.drawText(`Gerado em: ${today}  ·  ${items.length} despesa${items.length > 1 ? "s" : ""}  ·  Total: ${fmt(total)}`, {
    x: margin, y, size: 10, font: fontRegular, color: rgb(0.35, 0.43, 0.54),
  });
  y -= 28;

  // Divisor
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.88, 0.9, 0.94) });
  y -= 18;

  // Cabeçalho da tabela
  const cols = { desc: margin, cat: 260, date: 360, amt: 460, file: 530 };
  const rowH = 22;

  page.drawRectangle({ x: margin - 4, y: y - 4, width: width - margin * 2 + 8, height: rowH, color: rgb(0.97, 0.98, 0.99) });
  page.drawText("Descrição", { x: cols.desc, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  page.drawText("Categoria", { x: cols.cat, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  page.drawText("Data", { x: cols.date, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  page.drawText("Valor", { x: cols.amt, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  page.drawText("Anexo", { x: cols.file, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  y -= rowH;

  // Linhas da tabela
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const bg = i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.99, 1);
    page.drawRectangle({ x: margin - 4, y: y - 4, width: width - margin * 2 + 8, height: rowH, color: bg });

    const descText = item.expense.description.length > 28 ? item.expense.description.slice(0, 28) + "…" : item.expense.description;
    const catText = item.expense.category.charAt(0).toUpperCase() + item.expense.category.slice(1);
    const statusLabel = item.status === "paid" ? "Pago ✓" : item.status === "approved" ? "Aprovado" : item.status === "rejected" ? "Recusado" : "Pendente";

    page.drawText(descText, { x: cols.desc, y: y + 5, size: 9, font: fontRegular, color: rgb(0.12, 0.18, 0.27) });
    page.drawText(catText, { x: cols.cat, y: y + 5, size: 9, font: fontRegular, color: rgb(0.12, 0.18, 0.27) });
    page.drawText(item.expense.date, { x: cols.date, y: y + 5, size: 9, font: fontRegular, color: rgb(0.12, 0.18, 0.27) });
    page.drawText(fmt(item.expense.amount), { x: cols.amt, y: y + 5, size: 9, font: fontBold, color: rgb(0.12, 0.18, 0.27) });
    page.drawText(item.expense.receiptFile ? "Sim" : "—", { x: cols.file, y: y + 5, size: 9, font: fontRegular, color: item.expense.receiptFile ? rgb(0.13, 0.55, 0.13) : rgb(0.6, 0.6, 0.6) });
    y -= rowH;

    // Status abaixo da linha, em tom menor
    page.drawText(`Status: ${statusLabel}`, { x: cols.desc, y: y + 7, size: 7.5, font: fontRegular, color: rgb(0.5, 0.55, 0.65) });
    y -= 4;
  }

  // Linha total
  y -= 6;
  page.drawLine({ start: { x: margin, y: y + 14 }, end: { x: width - margin, y: y + 14 }, thickness: 1, color: rgb(0.88, 0.9, 0.94) });
  y -= 2;
  page.drawText("TOTAL", { x: cols.desc, y: y + 5, size: 10, font: fontBold, color: rgb(0.12, 0.18, 0.27) });
  page.drawText(fmt(total), { x: cols.amt, y: y + 5, size: 10, font: fontBold, color: rgb(0.145, 0.388, 0.922) });

  // ── Páginas dos comprovantes ──────────────────────────────────────────────
  for (const item of items) {
    if (!item.expense.receiptFile) continue;
    const filePath = getFilePath(item.expense.receiptFile);
    if (!fileExists(item.expense.receiptFile)) continue;

    const ext = item.expense.receiptFile.split(".").pop()?.toLowerCase() ?? "";
    const fileBytes = fs.readFileSync(filePath);

    if (ext === "pdf") {
      // Incorpora páginas do PDF do comprovante
      try {
        const subDoc = await PDFDocument.load(fileBytes);
        const copiedPages = await pdfDoc.copyPages(subDoc, subDoc.getPageIndices());
        // Adiciona cabeçalho de identificação na primeira página copiada
        if (copiedPages.length > 0) {
          const firstCopy = copiedPages[0];
          const ph = firstCopy.getHeight();
          firstCopy.drawRectangle({ x: 0, y: ph - 28, width: firstCopy.getWidth(), height: 28, color: rgb(0.97, 0.98, 0.99) });
          firstCopy.drawText(`Comprovante: ${item.expense.description} · ${fmt(item.expense.amount)}`, {
            x: 12, y: ph - 18, size: 9, font: fontRegular, color: rgb(0.35, 0.43, 0.54),
          });
          pdfDoc.addPage(firstCopy);
          for (let i = 1; i < copiedPages.length; i++) pdfDoc.addPage(copiedPages[i]);
        }
      } catch {
        // PDF inválido — pula
      }
    } else if (ext === "jpg" || ext === "jpeg" || ext === "png") {
      // Incorpora imagem numa nova página A4
      try {
        const img = ext === "png" ? await pdfDoc.embedPng(fileBytes) : await pdfDoc.embedJpg(fileBytes);
        const imgPage = pdfDoc.addPage([595, 842]);
        const { width: pw, height: ph } = imgPage.getSize();
        const headerH = 36;

        // Mini cabeçalho
        imgPage.drawRectangle({ x: 0, y: ph - headerH, width: pw, height: headerH, color: rgb(0.97, 0.98, 0.99) });
        imgPage.drawText(`Comprovante: ${item.expense.description} · ${fmt(item.expense.amount)}`, {
          x: 12, y: ph - 22, size: 9, font: fontRegular, color: rgb(0.35, 0.43, 0.54),
        });

        // Imagem centralizada no restante da página
        const availH = ph - headerH - 24;
        const availW = pw - 48;
        const scale = Math.min(availW / img.width, availH / img.height, 1);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const imgX = (pw - drawW) / 2;
        const imgY = (ph - headerH - drawH) / 2 - 12;

        imgPage.drawImage(img, { x: imgX, y: imgY, width: drawW, height: drawH });
      } catch {
        // Imagem inválida — pula
      }
    }
  }

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reembolso-lote-${batchId.slice(0, 8)}.pdf"`,
    },
  });
}
