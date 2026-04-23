import fs from "fs";
import path from "path";
import type { TravelRequest } from "@/types";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "requests.json");

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

export function getAllRequests(): TravelRequest[] {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

export function getRequest(id: string): TravelRequest | undefined {
  return getAllRequests().find((r) => r.id === id);
}

export function saveRequest(request: TravelRequest): void {
  ensureFile();
  const all = getAllRequests();
  const idx = all.findIndex((r) => r.id === request.id);
  if (idx >= 0) all[idx] = request;
  else all.unshift(request);
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
}

export function updateStatus(id: string, status: TravelRequest["status"]): void {
  const all = getAllRequests();
  const req = all.find((r) => r.id === id);
  if (req) {
    req.status = status;
    ensureFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  }
}
