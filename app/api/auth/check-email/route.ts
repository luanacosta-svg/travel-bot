import { NextRequest, NextResponse } from "next/server";
import { getEmployeeByEmail } from "@/lib/employeeStore";
import { ALLOWED_EMAILS } from "@/lib/allowedEmails";

// Rate limiting: 20 consultas por IP a cada 5 minutos
const checkAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = checkAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    checkAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return false;
  }
  entry.count++;
  return entry.count > 20;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") ??
             req.headers.get("x-real-ip") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 5 minutos." }, { status: 429 });
  }

  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ exists: false });

  if (!ALLOWED_EMAILS.has(email)) {
    return NextResponse.json({ exists: false });
  }

  const emp = getEmployeeByEmail(email);

  if (!emp) {
    const displayName = email
      .split("@")[0]
      .replace(".", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return NextResponse.json({ exists: true, hasPassword: false, name: displayName, isNew: true });
  }

  return NextResponse.json({
    exists:      true,
    hasPassword: !!emp.passwordHash,
    name:        emp.name,
    isNew:       false,
  });
}
