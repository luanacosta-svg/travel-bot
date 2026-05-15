import { createHmac, timingSafeEqual } from "crypto";
import type { UserSession } from "@/types";

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set and at least 32 characters in production");
    }
    return "dev-only-secret-not-for-production-32ch";
  }
  return s;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function encodeSession(session: UserSession): string {
  const payload = { ...session, exp: Date.now() + SESSION_TTL_MS };
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function decodeSession(token: string): UserSession | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;

    const b64 = token.slice(0, dot);
    const sig  = token.slice(dot + 1);

    // Verificação de assinatura em tempo constante (anti timing-attack)
    const expected = createHmac("sha256", getSecret()).update(b64).digest("base64url");
    const sigBuf = Buffer.from(sig,      "base64url");
    const expBuf = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

    const data = JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));

    // Valida expiração
    if (data.exp && Date.now() > data.exp) return null;

    const { exp: _exp, ...session } = data;
    return session as UserSession;
  } catch {
    return null;
  }
}
