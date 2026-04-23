import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(
  process.env.DATA_DIR ?? path.join(process.cwd(), "data"),
  "uploads"
);

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function saveUploadedFile(file: File, id: string): Promise<string> {
  ensureUploadsDir();
  const ext = file.name.split(".").pop() ?? "bin";
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
