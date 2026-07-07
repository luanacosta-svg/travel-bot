import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getAllReimbursements } from "@/lib/reimbursementStore";
import { getFilePath, fileExists } from "@/lib/fileUpload";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Nenhum item selecionado" }, { status: 400 });
  }

  const all = getAllReimbursements();
  const items = all.filter((r) => ids.includes(r.id));

  if (items.length === 0) {
    return NextResponse.json({ error: "Nenhum item encontrado" }, { status: 404 });
  }

  // Ordena por data de criação
  items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  // Remove caracteres fora do WinAnsi (emojis/símbolos) que derrubariam o drawText (500)
  const san = (s: string) => s.replace(/[^\x00-\xFF]/g, "");
  const total = items.reduce((s, r) => s + r.expense.amount, 0);

  // Agrupa por solicitante para exibir no cabeçalho
  const uniqueRequesters = [...new Set(items.map(r => r.requester.name))];
  const requesterLabel = uniqueRequesters.length === 1
    ? uniqueRequesters[0]
    : `${uniqueRequesters.length} colaboradores`;

  // ── Página de resumo ──────────────────────────────────────────────────────
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const margin = 48;
  let y = height - margin;

  // Cabeçalho azul
  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: rgb(0.145, 0.388, 0.922) });
  page.drawText("49Pay · 49 Educação", { x: margin, y: height - 44, size: 18, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText("Relatório de Reembolso — Seleção manual", { x: margin, y: height - 64, size: 11, font: fontRegular, color: rgb(0.8, 0.87, 1) });

  y = height - 100;

  page.drawText(`Solicitante(s): ${san(requesterLabel)}`, { x: margin, y, size: 11, font: fontBold, color: rgb(0.12, 0.18, 0.27) });
  y -= 16;
  page.drawText(`Gerado em: ${today}  ·  ${items.length} despesa${items.length > 1 ? "s" : ""}  ·  Total: ${fmt(total)}`, {
    x: margin, y, size: 10, font: fontRegular, color: rgb(0.35, 0.43, 0.54),
  });
  y -= 28;

  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.88, 0.9, 0.94) });
  y -= 18;

  // Cabeçalho da tabela
  const cols = { solicitante: margin, desc: 150, cat: 290, date: 370, amt: 450, file: 520 };
  const rowH = 22;

  page.drawRectangle({ x: margin - 4, y: y - 4, width: width - margin * 2 + 8, height: rowH, color: rgb(0.97, 0.98, 0.99) });
  page.drawText("Solicitante", { x: cols.solicitante, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  page.drawText("Descrição", { x: cols.desc, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  page.drawText("Categoria", { x: cols.cat, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  page.drawText("Data", { x: cols.date, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  page.drawText("Valor", { x: cols.amt, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  page.drawText("Anexo", { x: cols.file, y: y + 5, size: 9, font: fontBold, color: rgb(0.35, 0.43, 0.54) });
  y -= rowH;

  const REIMB_STATUS_LABELS: Record<string, string> = {
    pending: "Pendente", approved: "Aprovado", rejected: "Recusado", paid: "Pago",
  };

  for (let i = 0; i < items.length; i++) {
    // Nova página se necessário
    if (y < 80) {
      const newPage = pdfDoc.addPage([595, 842]);
      y = newPage.getHeight() - margin;
    }

    const item = items[i];
    const bg = i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.98, 0.99, 1);
    page.drawRectangle({ x: margin - 4, y: y - 4, width: width - margin * 2 + 8, height: rowH, color: bg });

    const rawName = san(item.requester.name);
    const rawDesc = san(item.expense.description);
    const nameText = rawName.length > 14 ? rawName.slice(0, 14) + "…" : rawName;
    const descText = rawDesc.length > 18 ? rawDesc.slice(0, 18) + "…" : rawDesc;
    const catText  = san(item.expense.category.charAt(0).toUpperCase() + item.expense.category.slice(1));
    const statusLabel = REIMB_STATUS_LABELS[item.status] ?? item.status;

    page.drawText(nameText, { x: cols.solicitante, y: y + 5, size: 9, font: fontRegular, color: rgb(0.12, 0.18, 0.27) });
    page.drawText(descText, { x: cols.desc, y: y + 5, size: 9, font: fontRegular, color: rgb(0.12, 0.18, 0.27) });
    page.drawText(catText,  { x: cols.cat,  y: y + 5, size: 9, font: fontRegular, color: rgb(0.12, 0.18, 0.27) });
    page.drawText(item.expense.date, { x: cols.date, y: y + 5, size: 9, font: fontRegular, color: rgb(0.12, 0.18, 0.27) });
    page.drawText(fmt(item.expense.amount), { x: cols.amt, y: y + 5, size: 9, font: fontBold, color: rgb(0.12, 0.18, 0.27) });
    page.drawText(item.expense.receiptFile ? "Sim" : "—", {
      x: cols.file, y: y + 5, size: 9, font: fontRegular,
      color: item.expense.receiptFile ? rgb(0.13, 0.55, 0.13) : rgb(0.6, 0.6, 0.6),
    });
    y -= rowH;
    page.drawText(`Status: ${statusLabel}`, { x: cols.solicitante, y: y + 7, size: 7.5, font: fontRegular, color: rgb(0.5, 0.55, 0.65) });
    y -= 4;
  }

  // Total
  y -= 6;
  page.drawLine({ start: { x: margin, y: y + 14 }, end: { x: width - margin, y: y + 14 }, thickness: 1, color: rgb(0.88, 0.9, 0.94) });
  y -= 2;
  page.drawText("TOTAL", { x: cols.solicitante, y: y + 5, size: 10, font: fontBold, color: rgb(0.12, 0.18, 0.27) });
  page.drawText(fmt(total), { x: cols.amt, y: y + 5, size: 10, font: fontBold, color: rgb(0.145, 0.388, 0.922) });

  // ── Comprovantes ──────────────────────────────────────────────────────────
  for (const item of items) {
    if (!item.expense.receiptFile) continue;
    if (!fileExists(item.expense.receiptFile)) continue;

    const ext = item.expense.receiptFile.split(".").pop()?.toLowerCase() ?? "";
    const filePath = getFilePath(item.expense.receiptFile);
    const fileBytes = fs.readFileSync(filePath);

    if (ext === "pdf") {
      try {
        const subDoc = await PDFDocument.load(fileBytes);
        const copiedPages = await pdfDoc.copyPages(subDoc, subDoc.getPageIndices());
        if (copiedPages.length > 0) {
          const firstCopy = copiedPages[0];
          const ph = firstCopy.getHeight();
          firstCopy.drawRectangle({ x: 0, y: ph - 28, width: firstCopy.getWidth(), height: 28, color: rgb(0.97, 0.98, 0.99) });
          firstCopy.drawText(`${san(item.requester.name)} — ${san(item.expense.description)} · ${fmt(item.expense.amount)}`, {
            x: 12, y: ph - 18, size: 9, font: fontRegular, color: rgb(0.35, 0.43, 0.54),
          });
          pdfDoc.addPage(firstCopy);
          for (let i = 1; i < copiedPages.length; i++) pdfDoc.addPage(copiedPages[i]);
        }
      } catch { /* PDF inválido */ }
    } else if (["jpg","jpeg","png"].includes(ext)) {
      try {
        const img = ext === "png" ? await pdfDoc.embedPng(fileBytes) : await pdfDoc.embedJpg(fileBytes);
        const imgPage = pdfDoc.addPage([595, 842]);
        const { width: pw, height: ph } = imgPage.getSize();
        const headerH = 36;
        imgPage.drawRectangle({ x: 0, y: ph - headerH, width: pw, height: headerH, color: rgb(0.97, 0.98, 0.99) });
        imgPage.drawText(`${san(item.requester.name)} — ${san(item.expense.description)} · ${fmt(item.expense.amount)}`, {
          x: 12, y: ph - 22, size: 9, font: fontRegular, color: rgb(0.35, 0.43, 0.54),
        });
        const availH = ph - headerH - 24;
        const availW = pw - 48;
        const scale  = Math.min(availW / img.width, availH / img.height, 1);
        imgPage.drawImage(img, {
          x: (pw - img.width * scale) / 2,
          y: (ph - headerH - img.height * scale) / 2 - 12,
          width: img.width * scale,
          height: img.height * scale,
        });
      } catch { /* imagem inválida */ }
    }
  }

  const pdfBytes = await pdfDoc.save();

  const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const refDate = new Date(items[0].createdAt);
  const monthLabel = `${MONTH_NAMES[refDate.getMonth()]} ${refDate.getFullYear()}`;
  const safeName = requesterLabel.replace(/[/\\?%*:|"<>]/g, "").trim();
  const friendlyName = `${safeName} - ${monthLabel} - Reembolsos.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${friendlyName}"`,
    },
  });
}
