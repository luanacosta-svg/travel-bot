import nodemailer from "nodemailer";
import type { TravelRequest, ReimbursementRequest, InvoiceUpload } from "@/types";

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
  managerMessage: string
): Promise<void> {
  const transport = createTransport();

  const body = `
    <p style="color:#374151;">Olá, <strong>${req.requester.name}</strong>!</p>
    <p style="color:#374151;">Sua solicitação de viagem para <strong>${req.travel.destination}</strong> foi analisada.</p>
    ${managerMessage ? `<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;color:#374151;">${managerMessage}</div>` : ""}
    ${req.travel.eventName ? `<div style="background:#eff6ff;border-radius:8px;padding:16px;margin-top:16px;"><strong>Evento:</strong> ${req.travel.eventName}</div>` : ""}
    <p style="color:#374151;margin-top:20px;">Em breve você receberá a confirmação da compra. Qualquer dúvida, entre em contato.</p>`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: req.requester.email,
    subject: `Sua solicitação de viagem — ${req.travel.destination} ✈`,
    html: baseTemplate(`Atualização da sua viagem — ${req.travel.destination}`, body),
  });
}

export async function sendPurchaseConfirmation(req: TravelRequest): Promise<void> {
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
    <p style="color:#374151;margin-top:20px;">Qualquer dúvida, entre em contato com a equipe. Boa viagem!</p>`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: req.requester.email,
    subject: `✓ Viagem confirmada — ${req.travel.destination}`,
    html: baseTemplate(`Viagem confirmada — ${req.travel.destination}`, body),
  });
}

export async function sendReimbursementNotification(req: ReimbursementRequest): Promise<void> {
  const transport = createTransport();
  const amount = req.expense.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const body = `
    <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="margin:0 0 8px;"><strong>Solicitante:</strong> ${req.requester.name} &lt;${req.requester.email}&gt;</p>
      <p style="margin:0 0 8px;"><strong>Descrição:</strong> ${req.expense.description}</p>
      <p style="margin:0 0 8px;"><strong>Categoria:</strong> ${req.expense.category}</p>
      <p style="margin:0 0 8px;"><strong>Data:</strong> ${req.expense.date}</p>
      <p style="margin:0;"><strong>Valor:</strong> ${amount}</p>
    </div>
    ${req.expense.receiptFile
      ? `<p style="color:#374151;">📎 Comprovante anexado — acesse o painel para visualizar.</p>`
      : ""}
    <div style="margin-top:20px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin"
         style="background:#64748b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        Abrir painel admin
      </a>
    </div>`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: process.env.MANAGER_EMAIL,
    cc: req.requester.email,
    subject: `[Reembolso] ${req.requester.name} · ${amount}`,
    html: baseTemplate(`Solicitação de reembolso — ${req.requester.name}`, body),
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
    <p style="color:#374151;">📎 Nota fiscal anexada — acesse o painel para visualizar.</p>
    <div style="margin-top:20px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin"
         style="background:#64748b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        Abrir painel admin
      </a>
    </div>`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: process.env.MANAGER_EMAIL,
    cc: req.requester.email,
    subject: `[Nota Fiscal] ${req.requester.name} · ${req.invoice.companyName}`,
    html: baseTemplate(`Nota fiscal enviada — ${req.requester.name}`, body),
  });
}
