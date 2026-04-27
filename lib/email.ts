import nodemailer from "nodemailer";
import fs from "fs";
import type { TravelRequest, ReimbursementRequest, InvoiceUpload } from "@/types";

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
import { getFilePath, fileExists } from "@/lib/fileUpload";

function createTransport() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr>
          <td style="background:#2563eb;padding:24px 32px;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">✈ 49 Educação · Viagens</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 20px;color:#1e293b;font-size:18px;">${title}</h2>
            ${body}
            <p style="margin:32px 0 0;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;">
              49 Educação · Sistema de Solicitação de Viagens
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendNewRequestNotification(req: TravelRequest): Promise<void> {
  const transport = createTransport();
  const { requester, travel } = req;

  const travelType =
    travel.type === "flight" ? "Passagem aérea"
    : travel.type === "event" ? "Ingresso"
    : "Passagem + Ingresso";

  const flightButton = req.flightSearchUrl
    ? `<div style="margin-top:20px;">
        <a href="${req.flightSearchUrl}"
           style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
          🔍 Ver voos no Google Flights
        </a>
       </div>`
    : "";

  const eventSection =
    travel.type !== "flight" && travel.eventName
      ? `<div style="background:#eff6ff;border-radius:8px;padding:16px;margin-top:16px;">
           <strong>Evento:</strong> ${travel.eventName}
         </div>`
      : "";

  const body = `
    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 8px;"><strong>Solicitante:</strong> ${requester.name} &lt;${requester.email}&gt;${requester.phone ? ` · ${requester.phone}` : ""}</p>
      <p style="margin:0 0 8px;"><strong>Tipo:</strong> ${travelType}</p>
      ${travel.origin ? `<p style="margin:0 0 8px;"><strong>Origem:</strong> ${travel.origin}</p>` : ""}
      <p style="margin:0 0 8px;"><strong>Destino:</strong> ${travel.destination}</p>
      ${travel.departureDate ? `<p style="margin:0 0 8px;"><strong>Data de ida:</strong> ${travel.departureDate}</p>` : ""}
      ${travel.returnDate ? `<p style="margin:0 0 8px;"><strong>Data de volta:</strong> ${travel.returnDate}</p>` : ""}
      ${travel.preferredTimes ? `<p style="margin:0 0 8px;"><strong>Horários preferidos:</strong> ${travel.preferredTimes}</p>` : ""}
      <p style="margin:0 0 8px;"><strong>Passageiros:</strong> ${travel.passengers}</p>
      ${travel.notes ? `<p style="margin:0;"><strong>Observações:</strong> ${travel.notes}</p>` : ""}
    </div>
    ${eventSection}
    ${flightButton}
    <div style="margin-top:16px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin"
         style="background:#64748b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        Abrir painel admin
      </a>
    </div>`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: process.env.MANAGER_EMAIL,
    cc: requester.email,
    subject: `[Nova solicitação] ${requester.name} → ${travel.destination}`,
    html: baseTemplate(`Nova solicitação de ${requester.name}`, body),
  });
}

export async function sendOptionsToRequester(
  req: TravelRequest,
  managerMessage: string,
  attachFile?: string
): Promise<void> {
  const transport = createTransport();

  const body = `
    <p style="color:#374151;">Olá, <strong>${req.requester.name}</strong>!</p>
    <p style="color:#374151;">Sua solicitação de viagem para <strong>${req.travel.destination}</strong> foi analisada.</p>
    ${managerMessage ? `<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;color:#374151;">${managerMessage}</div>` : ""}
    ${req.travel.eventName ? `<div style="background:#eff6ff;border-radius:8px;padding:16px;margin-top:16px;"><strong>Evento:</strong> ${req.travel.eventName}</div>` : ""}
    ${attachFile ? `<p style="color:#374151;margin-top:16px;">📎 Documento em anexo neste e-mail.</p>` : ""}
    <p style="color:#374151;margin-top:20px;">Em breve você receberá a confirmação da compra. Qualquer dúvida, entre em contato.</p>`;

  const attachments: { filename: string; content: Buffer }[] = [];
  if (attachFile && fileExists(attachFile)) {
    attachments.push({
      filename: `documento-viagem.${attachFile.split(".").pop()}`,
      content: fs.readFileSync(getFilePath(attachFile)),
    });
  }

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: req.requester.email,
    subject: `Sua solicitação de viagem — ${req.travel.destination} ✈`,
    html: baseTemplate(`Atualização da sua viagem — ${req.travel.destination}`, body),
    attachments,
  });
}

export async function sendPurchaseConfirmation(req: TravelRequest, attachFile?: string): Promise<void> {
  const transport = createTransport();

  const body = `
    <p style="color:#374151;">Olá, <strong>${req.requester.name}</strong>!</p>
    <p style="color:#374151;">Boa notícia! Sua viagem para <strong>${req.travel.destination}</strong> foi confirmada. 🎉</p>
    ${req.purchaseInfo
      ? `<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;color:#374151;">
           <p style="margin:0;font-weight:600;color:#15803d;margin-bottom:4px;">✓ Confirmação de compra</p>
           <p style="margin:0;">${req.purchaseInfo}</p>
         </div>`
      : ""}
    ${attachFile ? `<p style="color:#374151;margin-top:16px;">📎 Comprovante/bilhete em anexo neste e-mail.</p>` : ""}
    <p style="color:#374151;margin-top:20px;">Qualquer dúvida, entre em contato com a equipe. Boa viagem!</p>`;

  const attachments: { filename: string; content: Buffer }[] = [];
  if (attachFile && fileExists(attachFile)) {
    attachments.push({
      filename: `confirmacao-${req.travel.destination.replace(/\s+/g, "-")}.${attachFile.split(".").pop()}`,
      content: fs.readFileSync(getFilePath(attachFile)),
    });
  }

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: req.requester.email,
    subject: `✓ Viagem confirmada — ${req.travel.destination}`,
    html: baseTemplate(`Viagem confirmada — ${req.travel.destination}`, body),
    attachments,
  });
}

export async function sendReimbursementBatchNotification(items: ReimbursementRequest[]): Promise<void> {
  const transport = createTransport();
  const requester = items[0].requester;
  const total = items.reduce((s, r) => s + r.expense.amount, 0);
  const totalFmt = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const rows = items.map((item) => {
    const amt = item.expense.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${item.expense.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-transform:capitalize;">${item.expense.category}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${item.expense.date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${amt}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.expense.receiptFile ? "📎" : "—"}</td>
    </tr>`;
  }).join("");

  const body = `
    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 8px;"><strong>Solicitante:</strong> ${requester.name} &lt;${requester.email}&gt;</p>
      <p style="margin:0;"><strong>${items.length} despesa${items.length > 1 ? "s" : ""} · Total: ${totalFmt}</strong></p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#374151;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:600;">Descrição</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:600;">Categoria</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:600;">Data</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e2e8f0;font-weight:600;">Valor</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0;font-weight:600;">Anexo</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#f8fafc;">
          <td colspan="3" style="padding:10px 12px;font-weight:700;color:#1e293b;">Total</td>
          <td style="padding:10px 12px;font-weight:700;color:#1e293b;text-align:right;">${totalFmt}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    <div style="margin-top:20px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin"
         style="background:#64748b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        Abrir painel admin
      </a>
    </div>`;

  const attachments: { filename: string; content: Buffer }[] = [];
  for (const item of items) {
    if (item.expense.receiptFile && fileExists(item.expense.receiptFile)) {
      attachments.push({
        filename: `comprovante-${item.expense.description.replace(/\s+/g, "-").slice(0, 30)}.${item.expense.receiptFile.split(".").pop()}`,
        content: fs.readFileSync(getFilePath(item.expense.receiptFile)),
      });
    }
  }

  const subject = items.length === 1
    ? `[Reembolso] ${requester.name} · ${items[0].expense.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
    : `[Reembolso] ${requester.name} · ${items.length} despesas · ${totalFmt}`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: process.env.MANAGER_EMAIL,
    cc: requester.email,
    subject,
    html: baseTemplate(`Solicitação de reembolso — ${requester.name}`, body),
    attachments,
  });
}

export async function sendReimbursementStatusUpdate(req: ReimbursementRequest): Promise<void> {
  const transport = createTransport();
  const amount = req.expense.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const approved = req.status === "approved";

  const body = `
    <p style="color:#374151;">Olá, <strong>${req.requester.name}</strong>!</p>
    <p style="color:#374151;">Sua solicitação de reembolso foi <strong>${approved ? "aprovada ✓" : "recusada"}</strong>.</p>
    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;"><strong>Descrição:</strong> ${req.expense.description}</p>
      <p style="margin:0 0 8px;"><strong>Valor:</strong> ${amount}</p>
      ${req.adminNote ? `<p style="margin:0;"><strong>Observação:</strong> ${req.adminNote}</p>` : ""}
    </div>
    ${approved
      ? `<p style="color:#374151;">O valor será processado em breve. Qualquer dúvida, entre em contato.</p>`
      : `<p style="color:#374151;">Para mais informações, entre em contato com a equipe.</p>`}`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: req.requester.email,
    subject: `${approved ? "✓ Reembolso aprovado" : "Reembolso recusado"} — ${req.expense.description}`,
    html: baseTemplate(`Reembolso ${approved ? "aprovado" : "recusado"} — ${req.requester.name}`, body),
  });
}

export async function sendReimbursementPaidNotification(req: ReimbursementRequest): Promise<void> {
  const transport = createTransport();
  const amount = req.expense.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const body = `
    <p style="color:#374151;">Olá, <strong>${req.requester.name}</strong>!</p>
    <p style="color:#374151;">O pagamento do seu reembolso foi <strong>realizado ✓</strong>.</p>
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <p style="margin:0 0 8px;font-weight:600;color:#15803d;">💸 Pagamento efetuado</p>
      <p style="margin:0 0 6px;"><strong>Descrição:</strong> ${req.expense.description}</p>
      <p style="margin:0;"><strong>Valor:</strong> ${amount}</p>
    </div>
    <p style="color:#374151;">Qualquer dúvida, entre em contato com a equipe.</p>`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: req.requester.email,
    subject: `💸 Reembolso pago — ${req.expense.description}`,
    html: baseTemplate(`Reembolso pago — ${req.requester.name}`, body),
  });
}

export async function sendInvoiceNotification(req: InvoiceUpload): Promise<void> {
  const transport = createTransport();
  const amount = req.invoice.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const body = `
    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 8px;"><strong>Enviado por:</strong> ${req.requester.name} &lt;${req.requester.email}&gt;</p>
      <p style="margin:0 0 8px;"><strong>Descrição:</strong> ${req.invoice.description}</p>
      <p style="margin:0 0 8px;"><strong>Empresa:</strong> ${req.invoice.companyName}</p>
      ${req.invoice.cnpj ? `<p style="margin:0 0 8px;"><strong>CNPJ:</strong> ${req.invoice.cnpj}</p>` : ""}
      <p style="margin:0;"><strong>Valor:</strong> ${amount}</p>
    </div>
    <p style="color:#374151;">📎 Nota fiscal em anexo neste e-mail.</p>
    <div style="margin-top:20px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin"
         style="background:#64748b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        Abrir painel admin
      </a>
    </div>`;

  const attachments = [];
  if (fileExists(req.invoice.invoiceFile)) {
    attachments.push({
      filename: `nota-fiscal-${req.invoice.companyName.replace(/\s+/g, "-")}.${req.invoice.invoiceFile.split(".").pop()}`,
      content: fs.readFileSync(getFilePath(req.invoice.invoiceFile)),
    });
  }

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: process.env.MANAGER_EMAIL,
    cc: req.requester.email,
    subject: `[Nota Fiscal] ${req.requester.name} · ${req.invoice.companyName}`,
    html: baseTemplate(`Nota fiscal enviada — ${req.requester.name}`, body),
    attachments,
  });
}

export async function sendInvoicePaidNotification(req: InvoiceUpload): Promise<void> {
  const transport = createTransport();
  const amount = req.invoice.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const body = `
    <p style="color:#374151;">Olá, <strong>${req.requester.name}</strong>!</p>
    <p style="color:#374151;">O pagamento da sua nota fiscal foi <strong>realizado ✓</strong>.</p>
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
      <p style="margin:0 0 8px;font-weight:600;color:#15803d;">💰 Pagamento efetuado</p>
      <p style="margin:0 0 6px;"><strong>Descrição:</strong> ${req.invoice.description}</p>
      <p style="margin:0 0 6px;"><strong>Empresa:</strong> ${req.invoice.companyName}</p>
      <p style="margin:0;"><strong>Valor:</strong> ${amount}</p>
    </div>
    <p style="color:#374151;">Qualquer dúvida, entre em contato com a equipe.</p>`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: req.requester.email,
    cc: process.env.MANAGER_EMAIL,
    subject: `💰 Nota fiscal paga — ${req.invoice.description}`,
    html: baseTemplate(`Nota fiscal paga — ${req.requester.name}`, body),
  });
}

export async function sendInvoiceStatusUpdate(req: InvoiceUpload): Promise<void> {
  const transport = createTransport();
  const amount = req.invoice.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const received = req.status === "received";

  const body = `
    <p style="color:#374151;">Olá, <strong>${req.requester.name}</strong>!</p>
    <p style="color:#374151;">Sua nota fiscal foi <strong>${received ? "recebida e confirmada ✓" : "recusada"}</strong>.</p>
    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;"><strong>Descrição:</strong> ${req.invoice.description}</p>
      <p style="margin:0 0 8px;"><strong>Empresa:</strong> ${req.invoice.companyName}</p>
      <p style="margin:0;"><strong>Valor:</strong> ${amount}</p>
      ${req.adminNote ? `<p style="margin:8px 0 0;"><strong>Observação:</strong> ${req.adminNote}</p>` : ""}
    </div>
    ${received
      ? `<p style="color:#374151;">O pagamento será processado em breve. Qualquer dúvida, entre em contato.</p>`
      : `<p style="color:#374151;">Para mais informações, entre em contato com a equipe.</p>`}`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: req.requester.email,
    cc: process.env.MANAGER_EMAIL,
    subject: `${received ? "✓ Nota fiscal recebida" : "Nota fiscal recusada"} — ${req.invoice.description}`,
    html: baseTemplate(`Nota fiscal ${received ? "recebida" : "recusada"} — ${req.requester.name}`, body),
  });
}

export async function sendMonthlyReport(
  reimbursements: ReimbursementRequest[],
  invoices: InvoiceUpload[],
  month: number,
  year: number
): Promise<void> {
  const transport = createTransport();
  const monthName = `${MONTH_NAMES[month]} ${year}`;
  const reimbTotal = reimbursements.reduce((s, r) => s + r.expense.amount, 0);
  const invTotal = invoices.reduce((s, i) => s + i.invoice.amount, 0);
  const grandTotal = reimbTotal + invTotal;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const reimbRows = reimbursements.map((r) => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${r.requester.name}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${r.expense.description}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-transform:capitalize;">${r.expense.category}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(r.expense.amount)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${r.status === "approved" ? "✓ Aprovado" : r.status === "rejected" ? "Recusado" : "Pendente"}</td>
    </tr>`).join("") || `<tr><td colspan="5" style="padding:10px;color:#94a3b8;text-align:center;">Nenhum reembolso no período</td></tr>`;

  const invRows = invoices.map((i) => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${i.requester.name}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${i.invoice.description}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${i.invoice.companyName}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(i.invoice.amount)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;">${i.status === "received" ? "✓ Recebido" : "Pendente"}</td>
    </tr>`).join("") || `<tr><td colspan="5" style="padding:10px;color:#94a3b8;text-align:center;">Nenhuma nota fiscal no período</td></tr>`;

  const tableStyle = `width:100%;border-collapse:collapse;font-size:13px;color:#374151;margin-bottom:24px;`;
  const thStyle = `padding:8px 10px;text-align:left;border-bottom:2px solid #e2e8f0;font-weight:600;background:#f8fafc;`;

  const body = `
    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#1e293b;">Resumo de ${monthName}</p>
      <p style="margin:0;color:#64748b;">Reembolsos: <strong>${fmt(reimbTotal)}</strong> &nbsp;·&nbsp; Notas fiscais: <strong>${fmt(invTotal)}</strong> &nbsp;·&nbsp; Total: <strong style="color:#2563eb;">${fmt(grandTotal)}</strong></p>
    </div>

    <h3 style="color:#1e293b;font-size:15px;margin:0 0 10px;">💸 Reembolsos (${reimbursements.length})</h3>
    <table style="${tableStyle}">
      <thead><tr>
        <th style="${thStyle}">Solicitante</th><th style="${thStyle}">Descrição</th>
        <th style="${thStyle}">Categoria</th><th style="${thStyle}">Valor</th><th style="${thStyle}">Status</th>
      </tr></thead>
      <tbody>${reimbRows}</tbody>
      <tfoot><tr>
        <td colspan="3" style="padding:8px 10px;font-weight:700;">Total reembolsos</td>
        <td style="padding:8px 10px;font-weight:700;text-align:right;">${fmt(reimbTotal)}</td><td></td>
      </tr></tfoot>
    </table>

    <h3 style="color:#1e293b;font-size:15px;margin:0 0 10px;">🧾 Notas Fiscais (${invoices.length})</h3>
    <table style="${tableStyle}">
      <thead><tr>
        <th style="${thStyle}">Solicitante</th><th style="${thStyle}">Descrição</th>
        <th style="${thStyle}">Empresa</th><th style="${thStyle}">Valor</th><th style="${thStyle}">Status</th>
      </tr></thead>
      <tbody>${invRows}</tbody>
      <tfoot><tr>
        <td colspan="3" style="padding:8px 10px;font-weight:700;">Total notas fiscais</td>
        <td style="padding:8px 10px;font-weight:700;text-align:right;">${fmt(invTotal)}</td><td></td>
      </tr></tfoot>
    </table>

    <div style="background:#eff6ff;border-radius:8px;padding:16px;margin-top:8px;">
      <p style="margin:0;font-weight:700;color:#1e40af;font-size:16px;">Total geral: ${fmt(grandTotal)}</p>
    </div>
    <div style="margin-top:20px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin"
         style="background:#64748b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        Abrir painel admin
      </a>
    </div>`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: process.env.MANAGER_EMAIL,
    subject: `[Relatório Mensal] ${monthName} · Total ${fmt(grandTotal)}`,
    html: baseTemplate(`Relatório de ${monthName}`, body),
  });
}
