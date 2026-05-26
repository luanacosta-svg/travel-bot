/**
 * Validação de arquivos por magic bytes (não confia apenas no Content-Type do cliente).
 * Allowlist de tipos e extensões aceitos no upload.
 */

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp", "xml"]);

export const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg":      "jpg",
  "image/png":       "png",
  "image/webp":      "webp",
  "application/xml": "xml",
  "text/xml":        "xml",
};

/** Detecta o tipo real do arquivo pelos primeiros bytes (magic bytes). */
export async function detectMagicType(file: File): Promise<string | null> {
  const buf = Buffer.from(await file.slice(0, 12).arrayBuffer());

  // PDF: %PDF (25 50 44 46)
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";

  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "image/png";

  // WebP: RIFF????WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";

  // XML: começa com "<?", "<N", "<n", ou BOM UTF-8 (EF BB BF)
  if ((buf[0] === 0x3C && (buf[1] === 0x3F || buf[1] === 0x4E || buf[1] === 0x6E)) ||
      (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF)) return "application/xml";

  return null;
}

interface ValidationResult {
  ok:     boolean;
  error?: string;
  mime?:  string;
}

/**
 * Valida um arquivo de upload:
 * 1. Tamanho
 * 2. Extensão na allowlist
 * 3. Magic bytes confirmam o tipo declarado
 */
export async function validateUploadFile(
  file: File,
  maxBytes = 10 * 1024 * 1024, // 10 MB padrão
): Promise<ValidationResult> {
  if (!file || file.size === 0) return { ok: false, error: "Arquivo vazio" };

  if (file.size > maxBytes) {
    return { ok: false, error: `Arquivo muito grande. Máximo ${Math.round(maxBytes / 1024 / 1024)} MB.` };
  }

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, error: "Extensão não permitida. Use PDF, JPG, PNG, WEBP ou XML." };
  }

  const mime = await detectMagicType(file);
  if (!mime || !MIME_TO_EXT[mime]) {
    return { ok: false, error: "Conteúdo do arquivo não reconhecido ou não permitido." };
  }

  // Garante que extensão e conteúdo são compatíveis (evita .pdf com bytes de imagem etc.)
  const expectedExt = MIME_TO_EXT[mime];
  const isCompatible =
    ext === expectedExt ||
    (expectedExt === "jpg"  && ext === "jpeg") ||
    (expectedExt === "xml"  && ext === "xml");

  if (!isCompatible) {
    return { ok: false, error: "Extensão e conteúdo do arquivo não correspondem." };
  }

  return { ok: true, mime };
}
