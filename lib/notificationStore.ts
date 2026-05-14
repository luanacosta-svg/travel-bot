import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "notifications.json");

export interface AppNotification {
  id: string;
  userEmail: string;   // destinatário
  icon: string;
  tone: "green" | "blue" | "amber" | "red";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf-8");
}

function readAll(): AppNotification[] {
  ensureFile();
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

function writeAll(items: AppNotification[]) {
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2), "utf-8");
}

export function getNotificationsForUser(email: string): AppNotification[] {
  return readAll()
    .filter((n) => n.userEmail.toLowerCase() === email.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}

export function createNotification(
  userEmail: string,
  data: Pick<AppNotification, "icon" | "tone" | "title" | "body">
): AppNotification {
  const all = readAll();
  const n: AppNotification = {
    id: randomUUID(),
    userEmail,
    ...data,
    read: false,
    createdAt: new Date().toISOString(),
  };
  all.unshift(n);
  writeAll(all);
  return n;
}

export function markAllRead(email: string): void {
  const all = readAll().map((n) =>
    n.userEmail.toLowerCase() === email.toLowerCase() ? { ...n, read: true } : n
  );
  writeAll(all);
}

export function markOneRead(id: string): void {
  const all = readAll().map((n) => (n.id === id ? { ...n, read: true } : n));
  writeAll(all);
}
