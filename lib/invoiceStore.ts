import fs from "fs";
import path from "path";
import type { InvoiceUpload } from "@/types";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "invoices.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf-8");
}

export function getAllInvoices(): InvoiceUpload[] {
  ensureFile();
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

export function getInvoice(id: string): InvoiceUpload | undefined {
  return getAllInvoices().find((i) => i.id === id);
}

export function saveInvoice(item: InvoiceUpload): void {
  ensureFile();
  const all = getAllInvoices();
  const idx = all.findIndex((i) => i.id === item.id);
  if (idx >= 0) all[idx] = item;
  else all.unshift(item);
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2), "utf-8");
}
