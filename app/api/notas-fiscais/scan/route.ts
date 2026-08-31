import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { decodeSession } from "@/lib/session";
import { detectMagicType } from "@/lib/validateFile";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function isValidImage(type: string): type is MediaType {
  return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(type);
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const EMPTY = { numero: null, dataEmissao: null, valor: null };

/** Extrai dados de NFe/NFSe em XML sem precisar de IA. */
function parseXml(text: string) {
  const num  = text.match(/<nNF>(\d+)<\/nNF>/)?.[1]
            ?? text.match(/<Numero>(\d+)<\/Numero>/i)?.[1] ?? null;
  const date = text.match(/<dhEmi>(\d{4}-\d{2}-\d{2})/)?.[1]
            ?? text.match(/<DataEmissao>(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;
  const val  = text.match(/<vNF>([\d.]+)<\/vNF>/)?.[1]
            ?? text.match(/<ValorServicos>([\d.]+)<\/ValorServicos>/i)?.[1] ?? null;
  return { numero: num, dataEmissao: date, valor: val ? parseFloat(val) : null };
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  if (!cookie) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const session = decodeSession(cookie.value);
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const rl = rateLimit("nf-scan", session.email, 30, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "Limite de scans atingido. Tente novamente em 1 hora." }, { status: 429 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ data: EMPTY });
    }

    const detectedMime = await detectMagicType(file);

    // XML: parse direto, sem IA
    if (detectedMime === "application/xml") {
      const text = await file.text();
      return NextResponse.json({ data: parseXml(text) });
    }

    const isPdf = detectedMime === "application/pdf";
    const isImage = detectedMime && isValidImage(detectedMime);
    if (!isPdf && !isImage) {
      return NextResponse.json({ data: EMPTY });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const contentBlock = isPdf
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } }
      : { type: "image"    as const, source: { type: "base64" as const, media_type: detectedMime as MediaType, data: base64 } };

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: [
          contentBlock,
          {
            type: "text",
            text: `Esta é uma nota fiscal brasileira (NFe ou NFSe). Extraia em JSON com exatamente estas chaves:
{
  "numero": string com o número da nota fiscal (apenas dígitos, sem zeros à esquerda),
  "dataEmissao": string no formato YYYY-MM-DD (data de emissão),
  "valor": número com o valor total/líquido da nota em reais (ex: 3500.00)
}

Responda APENAS com o JSON, sem explicações. Se não conseguir ler algum campo, use null.`,
          },
        ],
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return NextResponse.json({ data: parsed ?? EMPTY });
  } catch (err) {
    console.error("NF scan error:", err);
    return NextResponse.json({ data: EMPTY });
  }
}
