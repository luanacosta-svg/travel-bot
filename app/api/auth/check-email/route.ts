import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { getEmployeeByEmail } from "@/lib/employeeStore";
import { ALLOWED_EMAILS } from "@/lib/allowedEmails";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") ??
             req.headers.get("x-real-ip") ?? "unknown";
  const rl = rateLimit("check-email", ip, 20, 300);
  if (!rl.allowed) return NextResponse.json({ error: "Muitas tentativas. Aguarde 5 minutos." }, { status: 429 });

  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ exists: false });

  const emp = getEmployeeByEmail(email);

  // Autorizado se está na allowlist OU se foi cadastrado como colaborador pelo admin
  if (!emp && !ALLOWED_EMAILS.has(email)) {
    return NextResponse.json({ exists: false });
  }

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
