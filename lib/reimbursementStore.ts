import fs from "fs";
import path from "path";
import type { ReimbursementRequest } from "@/types";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "reimbursements.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf-8");
}

export function getAllReimbursements(): ReimbursementRequest[] {
  ensureFile();
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

export function getReimbursement(id: string): ReimbursementRequest | undefined {
  return getAllReimbursements().find((r) => r.id === id);
}

export function deleteReimbursement(id: string): void {
  ensureFile();
  const all = getAllReimbursements().filter((r) => r.id !== id);
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2), "utf-8");
}

export function saveReimbursement(item: ReimbursementRequest): void {
  ensureFile();
  const all = getAllReimbursements();
  const idx = all.findIndex((r) => r.id === item.id);
  if (idx >= 0) all[idx] = item;
  else all.unshift(item);
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2), "utf-8");
}
