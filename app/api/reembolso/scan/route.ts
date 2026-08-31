import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { decodeSession } from "@/lib/session";
import { detectMagicType } from "@/lib/validateFile";
import convertHeic from "heic-convert";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function isValidImage(type: string): type is MediaType {
  return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(type);
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB por arquivo

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("tb_user");
  if (!cookie) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const session = decodeSession(cookie.value);
  if (!session) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

  const rl = rateLimit("scan", session.email, 50, 3600);
  if (!rl.allowed) return NextResponse.json({ error: "Limite de scans atingido. Tente novamente em 1 hora." }, { status: 429 });

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }
    if (files.length > 20) {
      return NextResponse.json({ error: "Máximo de 20 arquivos por vez" }, { status: 400 });
    }

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          // A3: valida tamanho e magic bytes antes de enviar para a API
          if (file.size > MAX_FILE_SIZE) {
            return { fileName: file.name, ok: false, data: { valor: null, data: null, descricao: file.name, estabelecimento: null, categoria: "Outro" } };
          }

          let detectedMime = await detectMagicType(file);
          let buffer = Buffer.from(await file.arrayBuffer());

          // Fotos de iPhone (HEIC): converte para JPEG antes de enviar à IA
          if (detectedMime === "image/heic") {
            buffer = Buffer.from(await convertHeic({ buffer, format: "JPEG", quality: 0.85 }));
            detectedMime = "image/jpeg";
          }

          const isPdf = detectedMime === "application/pdf";
          const isImage = detectedMime && isValidImage(detectedMime);

          if (!isPdf && !isImage) {
            return { fileName: file.name, ok: false, data: { valor: null, data: null, descricao: file.name, estabelecimento: null, categoria: "Outro" } };
          }

          const base64  = buffer.toString("base64");

          const contentBlock = isPdf
            ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } }
            : { type: "image"    as const, source: { type: "base64" as const, media_type: detectedMime as MediaType, data: base64 } };

          const response = await client.messages.create({
            model: "claude-opus-4-5",
            max_tokens: 512,
            messages: [{
              role: "user",
              content: [
                contentBlock,
                {
                  type: "text",
                  text: `Analise este comprovante/nota fiscal e extraia as informações em JSON com exatamente estas chaves:
{
  "valor": número em reais (ex: 45.90),
  "data": string no formato YYYY-MM-DD,
  "descricao": string curta descrevendo o item/serviço (máx 60 chars),
  "estabelecimento": nome do estabelecimento ou fornecedor,
  "categoria": uma das opções: "Alimentação", "Transporte", "Hospedagem", "Material", "Serviço", "Outro"
}

Responda APENAS com o JSON, sem explicações. Se não conseguir ler algum campo, use null.`,
                },
              ],
            }],
          });

          const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

          return {
            fileName: file.name,
            ok: true,
            data: parsed ?? { valor: null, data: null, descricao: null, estabelecimento: null, categoria: "Outro" },
          };
        } catch (err) {
          console.error(`Erro ao processar ${file.name}:`, err);
          return { fileName: file.name, ok: false, data: { valor: null, data: null, descricao: file.name, estabelecimento: null, categoria: "Outro" } };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Erro ao processar comprovantes" }, { status: 500 });
  }
}
