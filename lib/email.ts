import nodemailer from "nodemailer";
import type { TravelRequest, FlightOption } from "@/types";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function formatPrice(price: string, currency: string): string {
  const num = parseFloat(price);
  return num.toLocaleString("pt-BR", { style: "currency", currency });
}

function flightCard(f: FlightOption, index: number): string {
  const stopsLabel = f.stops === 0 ? "Direto" : `${f.stops} escala(s)`;
  const returnBlock = f.returnFlight
    ? `
      <tr>
        <td colspan="2" style="padding:8px 0 4px;font-weight:600;color:#1d4ed8;">✈ Volta</td>
      </tr>
      <tr>
        <td style="padding:2px 0;color:#555;">Saída</td>
        <td style="padding:2px 0;">${f.returnFlight.departure.airport} — ${formatDate(f.returnFlight.departure.time)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0;color:#555;">Chegada</td>
        <td style="padding:2px 0;">${f.returnFlight.arrival.airport} — ${formatDate(f.returnFlight.arrival.time)}</td>
      </tr>
      <tr>
        <td style="padding:2px 0;color:#555;">Duração</td>
        <td style="padding:2px 0;">${f.returnFlight.duration} · ${f.returnFlight.stops === 0 ? "Direto" : `${f.returnFlight.stops} escala(s)`}</td>
      </tr>`
    : "";

  return `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:16px;background:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-weight:700;font-size:16px;color:#1e293b;">Opção ${index + 1} · ${f.airline}</span>
        <span style="font-weight:700;font-size:18px;color:#2563eb;">${formatPrice(f.price, f.currency)}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td colspan="2" style="padding:4px 0 4px;font-weight:600;color:#1d4ed8;">✈ Ida</td>
        </tr>
        <tr>
          <td style="padding:2px 0;color:#555;width:80px;">Saída</td>
          <td style="padding:2px 0;">${f.departure.airport} — ${formatDate(f.departure.time)}</td>
        </tr>
        <tr>
          <td style="padding:2px 0;color:#555;">Chegada</td>
          <td style="padding:2px 0;">${f.arrival.airport} — ${formatDate(f.arrival.time)}</td>
        </tr>
        <tr>
          <td style="padding:2px 0;color:#555;">Duração</td>
          <td style="padding:2px 0;">${f.duration} · ${stopsLabel}</td>
        </tr>
        ${returnBlock}
      </table>
    </div>`;
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
    travel.type === "flight"
      ? "Passagem aérea"
      : travel.type === "event"
      ? "Ingresso"
      : "Passagem + Ingresso";

  const flightSection =
    travel.type !== "event" && req.flightOptions && req.flightOptions.length > 0
      ? `<h3 style="color:#1e293b;margin:24px 0 12px;">Opções de voo encontradas</h3>
         ${req.flightOptions.map((f, i) => flightCard(f, i)).join("")}`
      : travel.type !== "event"
      ? `<p style="color:#ef4444;">Nenhum voo encontrado para essa rota/data. Verifique manualmente.</p>`
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
    ${flightSection}
    ${eventSection}
    <div style="margin-top:24px;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin"
         style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
        Abrir painel admin
      </a>
    </div>`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: process.env.MANAGER_EMAIL,
    subject: `[Nova solicitação] ${requester.name} → ${travel.destination}`,
    html: baseTemplate(`Nova solicitação de ${requester.name}`, body),
  });
}

export async function sendOptionsToRequester(
  req: TravelRequest,
  selectedOptions: FlightOption[],
  managerMessage: string
): Promise<void> {
  const transport = createTransport();

  const flightSection =
    selectedOptions.length > 0
      ? `<h3 style="color:#1e293b;margin:24px 0 12px;">Opções de voo sugeridas</h3>
         ${selectedOptions.map((f, i) => flightCard(f, i)).join("")}`
      : "";

  const eventSection =
    req.travel.type !== "flight" && req.travel.eventName
      ? `<div style="background:#eff6ff;border-radius:8px;padding:16px;margin-top:16px;">
           <strong>Evento:</strong> ${req.travel.eventName}
         </div>`
      : "";

  const body = `
    <p style="color:#374151;">Olá, <strong>${req.requester.name}</strong>!</p>
    <p style="color:#374151;">Sua solicitação de viagem para <strong>${req.travel.destination}</strong> foi analisada. Confira as opções abaixo:</p>
    ${managerMessage ? `<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;color:#374151;">${managerMessage}</div>` : ""}
    ${flightSection}
    ${eventSection}
    <p style="color:#374151;margin-top:20px;">Em breve você receberá a confirmação da compra. Qualquer dúvida, entre em contato.</p>`;

  await transport.sendMail({
    from: `"49 Educação Viagens" <${process.env.GMAIL_USER}>`,
    to: req.requester.email,
    subject: `Opções de viagem para ${req.travel.destination} ✈`,
    html: baseTemplate(`Opções de viagem — ${req.travel.destination}`, body),
  });
}
