import type { UserSession } from "@/types";

export function encodeSession(session: UserSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64");
}

export function decodeSession(value: string): UserSession | null {
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}
