import { appendFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR  = process.env.DATA_DIR ?? join(process.cwd(), "data");
const AUDIT_FILE = join(DATA_DIR, "audit.log");

export type AuditAction =
  | "pii_view"       // admin abriu perfil com dados pessoais
  | "pii_reveal"     // admin revelou campo mascarado (CPF / PIX)
  | "file_download"  // download de arquivo (NF, comprovante)
  | "password_reset" // senha resetada por admin
  | "employee_edit"  // dados de colaborador editados
  | "employee_create"; // novo colaborador criado

export interface AuditEntry {
  ts:      string;
  action:  AuditAction;
  actor:   string;   // e-mail de quem fez a ação
  target?: string;   // id do colaborador ou nome do arquivo
  detail?: string;   // contexto extra
  ip?:     string;
}

export function logAudit(entry: Omit<AuditEntry, "ts">) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
    appendFileSync(AUDIT_FILE, line, "utf8");
  } catch {
    // não bloqueia a requisição principal
  }
}

export function readAuditLog(limit = 500): AuditEntry[] {
  try {
    if (!existsSync(AUDIT_FILE)) return [];
    const raw = readFileSync(AUDIT_FILE, "utf8");
    return raw
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as AuditEntry)
      .reverse()
      .slice(0, limit);
  } catch {
    return [];
  }
}
