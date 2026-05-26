import { NextRequest, NextResponse } from "next/server";
import { encodeSession } from "@/lib/session";
import { getEmployeeByEmail, saveEmployee, hashPassword, verifyPassword } from "@/lib/employeeStore";
import { ALLOWED_EMAILS } from "@/lib/allowedEmails";
import { randomUUID } from "crypto";

// Rate limiting: 10 tentativas por IP a cada 5 minutos
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return false;
  }
  entry.count++;
  return entry.count > 10;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") ??
             req.headers.get("x-real-ip") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 5 minutos." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { email, password, confirmPassword } = body as Record<string, unknown>;

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (!ALLOWED_EMAILS.has(cleanEmail)) {
    return NextResponse.json(
      { error: "E-mail não autorizado. Fale com o RH." },
      { status: 401 }
    );
  }

  let employee = getEmployeeByEmail(cleanEmail);

  // Primeiro acesso: cria registro mínimo automaticamente
  if (!employee) {
    const now = new Date().toISOString();
    employee = {
      id:        randomUUID(),
      name:      cleanEmail.split("@")[0].replace(".", " ").replace(/\b\w/g, c => c.toUpperCase()),
      email:     cleanEmail,
      createdAt: now,
      updatedAt: now,
      completion: 0,
    };
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Senha deve ter pelo menos 8 caracteres" }, { status: 400 });
  }

  if (employee.passwordHash) {
    // Usuário já tem senha — verificar
    if (!verifyPassword(password, employee.passwordHash)) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }
  } else {
    // Primeiro login — criar senha
    if (typeof confirmPassword !== "string" || confirmPassword !== password) {
      return NextResponse.json({ error: "As senhas não coincidem" }, { status: 400 });
    }
    employee.passwordHash = hashPassword(password);
    employee.updatedAt    = new Date().toISOString();
    saveEmployee(employee);
  }

  const session = encodeSession({ name: employee.name, email: employee.email });

  const res = NextResponse.json({ success: true });
  res.cookies.set("tb_user", session, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   60 * 60 * 24 * 7,
    path:     "/",
  });
  return res;
}
