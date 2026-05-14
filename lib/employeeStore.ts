import fs from "fs";
import path from "path";
import type { Employee, ContractStatus, ContractStatusKey } from "@/types";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "employees.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf-8");
}

export function getAllEmployees(): Employee[] {
  ensureFile();
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

export function getEmployee(id: string): Employee | undefined {
  return getAllEmployees().find((e) => e.id === id);
}

export function getEmployeeByEmail(email: string): Employee | undefined {
  return getAllEmployees().find((e) => e.email.toLowerCase() === email.toLowerCase());
}

export function saveEmployee(emp: Employee): void {
  ensureFile();
  const all = getAllEmployees();
  const idx = all.findIndex((e) => e.id === emp.id);
  const now = new Date().toISOString();
  const enriched = { ...emp, updatedAt: now, completion: calcCompletion(emp) };
  if (idx >= 0) all[idx] = enriched;
  else all.unshift({ ...enriched, createdAt: enriched.createdAt ?? now });
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2), "utf-8");
}

export function deleteEmployee(id: string): void {
  ensureFile();
  const all = getAllEmployees().filter((e) => e.id !== id);
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2), "utf-8");
}

// ─── Helpers ──────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof Employee)[] = [
  "name", "email", "personalEmail", "phone", "cpf", "birthDate",
  "role", "squad", "startDate", "city", "address", "cep",
  "contractStart", "contractEnd", "education",
  "razaoSocial", "cnpj", "pixCnpj", "pixPf",
  "emergencyName", "emergencyPhone",
];

export function calcCompletion(emp: Employee): number {
  const filled = REQUIRED_FIELDS.filter((f) => {
    const v = emp[f];
    return v !== undefined && v !== null && String(v).trim() !== "";
  }).length;
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

export function contractStatus(contractEnd?: string): ContractStatus {
  if (!contractEnd) {
    return { key: "ok", days: 999, label: "Sem data", color: "green" };
  }
  const end = new Date(contractEnd);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return { key: "vencido", days: diff, label: `Vencido há ${Math.abs(diff)}d`, color: "red" };
  }
  if (diff <= 15) {
    return { key: "vencendo", days: diff, label: `${diff}d`, color: "amber" };
  }
  if (diff <= 60) {
    return { key: "atencao", days: diff, label: `${diff}d`, color: "blue" };
  }
  return { key: "ok", days: diff, label: `${diff}d`, color: "green" };
}
