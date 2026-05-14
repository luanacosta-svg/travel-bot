import { NextRequest, NextResponse } from "next/server";
import { getEmployee } from "@/lib/employeeStore";
import nodemailer from "nodemailer";

function isAdmin(req: NextRequest) {
  const c = req.cookies.get("tb_admin");
  return c && c.value === process.env.ADMIN_SECRET;
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
          <td style="background:#F97316;padding:24px 32px;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">49Pay · 49 Educação</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 20px;color:#1e293b;font-size:18px;">${title}</h2>
            ${body}
            <p style="margin:32px 0 0;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;">
              49Pay · 49 Educação — este é um e-mail automático, não responda.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const emp = getEmployee(id);
  if (!emp) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { type } = await req.json().catch(() => ({ type: "cadastro" }));

  // Build email content based on reminder type
  let subject = "";
  let title = "";
  let bodyHtml = "";

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const firstName = emp.name.split(" ")[0];
  const comp = emp.completion ?? 0;

  if (type === "contrato") {
    // Contract expiration reminder
    const contractEnd = emp.contractEnd
      ? new Date(emp.contractEnd).toLocaleDateString("pt-BR")
      : "data não informada";

    subject = `[49Pay] Lembrete de renovação de contrato`;
    title = `Olá, ${firstName}! Seu contrato precisa de atenção.`;
    bodyHtml = `
      <p style="color:#475569;line-height:1.6;">
        Passamos para avisar que seu contrato com a 49 Educação vence em <strong>${contractEnd}</strong>.
        Entre em contato com o RH para iniciar o processo de renovação (aditivo contratual).
      </p>
      <div style="background:#fff7ed;border-left:4px solid #F97316;padding:16px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="margin:0;color:#9a3412;font-weight:600;">⚠️ Vencimento: ${contractEnd}</p>
      </div>
      <p style="color:#475569;line-height:1.6;">
        Qualquer dúvida, fale com seu gestor ou com o time de RH.
      </p>`;
  } else {
    // Profile completion reminder
    subject = `[49Pay] Complete seu cadastro no 49Pay`;
    title = `Olá, ${firstName}! Seu cadastro está ${comp}% completo.`;
    bodyHtml = `
      <p style="color:#475569;line-height:1.6;">
        Seu perfil no 49Pay ainda está incompleto (<strong>${comp}%</strong>).
        Um cadastro completo garante que seus pagamentos e reembolsos sejam processados sem atrasos.
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;color:#64748b;font-size:14px;">Progresso do cadastro</p>
        <div style="background:#e2e8f0;border-radius:99px;height:10px;overflow:hidden;">
          <div style="background:#F97316;height:10px;width:${comp}%;border-radius:99px;"></div>
        </div>
        <p style="margin:8px 0 0;color:#F97316;font-weight:700;font-size:15px;">${comp}% concluído</p>
      </div>
      <p style="color:#475569;line-height:1.6;">
        Clique no botão abaixo para acessar seu perfil e completar as informações:
      </p>
      <div style="margin-top:20px;">
        <a href="${baseUrl}/perfil"
           style="background:#F97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;font-size:15px;">
          Completar cadastro →
        </a>
      </div>`;
  }

  try {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transport.sendMail({
      from: `"49Pay" <${process.env.GMAIL_USER}>`,
      to: emp.email,
      subject,
      html: baseTemplate(title, bodyHtml),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Lembrete email error:", err);
    return NextResponse.json({ error: "Falha ao enviar e-mail" }, { status: 500 });
  }
}
