import fs from "fs";
import path from "path";
import { validateUploadFile, detectMagicType, MIME_TO_EXT } from "@/lib/validateFile";
import convertHeic from "heic-convert";

const UPLOADS_DIR = path.join(
  process.env.DATA_DIR ?? path.join(process.cwd(), "data"),
  "uploads"
);

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Valida e salva um arquivo de upload.
 * Lança erro se o arquivo não passar na validação de magic bytes.
 * Usa sempre a extensão derivada do conteúdo real — não confia no nome do cliente.
 */
export async function saveUploadedFile(
  file: File,
  id: string,
  maxBytes = 10 * 1024 * 1024,
): Promise<string> {
  ensureUploadsDir();

  // Fotos de iPhone (HEIC) são convertidas para JPEG antes de salvar —
  // o resto do sistema (PDFs de reembolso, visualização) só entende JPG/PNG.
  const detected = await detectMagicType(file);
  if (detected === "image/heic") {
    if (file.size > maxBytes) throw new Error(`Arquivo muito grande. Máximo ${Math.round(maxBytes / 1024 / 1024)} MB.`);
    const heicBuffer = Buffer.from(await file.arrayBuffer());
    const jpegBuffer = Buffer.from(await convertHeic({ buffer: heicBuffer, format: "JPEG", quality: 0.85 }));
    const filename = `${id}.jpg`;
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), jpegBuffer);
    return filename;
  }

  const result = await validateUploadFile(file, maxBytes);
  if (!result.ok) throw new Error(result.error ?? "Arquivo inválido");

  // Extensão derivada do conteúdo real (magic bytes), não do nome do cliente
  const ext = MIME_TO_EXT[result.mime!] ?? "bin";
  const filename = `${id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return filename;
}

export function getFilePath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

export function fileExists(filename: string): boolean {
  return fs.existsSync(path.join(UPLOADS_DIR, filename));
}
