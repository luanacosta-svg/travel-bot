"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ─── Gerador de senha forte ───────────────────────────────────────
function generatePassword(): string {
  const upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
  const special = "@#$%&*!";
  const all     = upper + lower + digits + special;

  let pass = "";
  pass += upper  [Math.floor(Math.random() * upper.length)];
  pass += lower  [Math.floor(Math.random() * lower.length)];
  pass += digits [Math.floor(Math.random() * digits.length)];
  pass += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 8; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }
  return pass.split("").sort(() => Math.random() - 0.5).join("");
}

// ─── Indicador de força ───────────────────────────────────────────
function passwordStrength(p: string): { label: string; color: string; width: string } {
  let score = 0;
  if (p.length >= 8)  score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { label: "Fraca",  color: "#EF4444", width: "25%" };
  if (score <= 2) return { label: "Média",  color: "#F59E0B", width: "50%" };
  if (score <= 3) return { label: "Boa",    color: "#3B82F6", width: "75%" };
  return             { label: "Forte", color: "#22C55E", width: "100%" };
}

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isAdmin      = searchParams.get("admin") === "1";

  const [mode, setMode] = useState<"user" | "admin">(isAdmin ? "admin" : "user");

  // ── User flow ──
  type Step = "email" | "password" | "create";
  const [step,            setStep]            = useState<Step>("email");
  const [email,           setEmail]           = useState("");
  const [employeeName,    setEmployeeName]     = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [checkingEmail,   setCheckingEmail]   = useState(false);

  // ── Admin ──
  const [adminEmail,    setAdminEmail]    = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");
  const [copied,      setCopied]      = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmail(localStorage.getItem("49pay_email") ?? "");
  }, []);

  useEffect(() => {
    if (isAdmin) setMode("admin");
  }, [isAdmin]);

  useEffect(() => {
    setStep("email");
    setPassword("");
    setConfirmPassword("");
    setServerError("");
    setEmployeeName("");
  }, [mode]);

  const strength = passwordStrength(password);

  function inputCls(error = false) {
    return `w-full border-[1.5px] rounded-xl px-3.5 py-3 text-sm focus:outline-none transition pr-10 ${
      error ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-orange-400"
    }`;
  }

  // ── Etapa 1: verificar email ──
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setServerError("Informe um e-mail válido");
      return;
    }
    setCheckingEmail(true);
    try {
      const res  = await fetch(`/api/auth/check-email?email=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!data.exists) {
        setServerError("E-mail não cadastrado. Fale com o RH para ser adicionado ao sistema.");
        return;
      }
      setEmployeeName(data.name);
      setStep(data.hasPassword ? "password" : "create");
      setTimeout(() => passwordRef.current?.focus(), 100);
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    } finally {
      setCheckingEmail(false);
    }
  }

  // ── Etapa 2: entrar / criar senha ──
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    if (password.length < 8) {
      setServerError("Senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (step === "create" && password !== confirmPassword) {
      setServerError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { email: email.trim().toLowerCase(), password };
      if (step === "create") body.confirmPassword = confirmPassword;

      const res  = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error); return; }

      localStorage.setItem("49pay_email", email.trim().toLowerCase());
      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ── Admin login ──
  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error); return; }
      router.push("/admin");
      router.refresh();
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleGeneratePassword() {
    const p = generatePassword();
    setPassword(p);
    setConfirmPassword(p);
    setShowPass(true);
    setShowConfirm(true);
  }

  function handleCopyPassword() {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #FB8423 0%, #F97316 40%, #EA580C 100%)" }}
    >
      <div className="absolute -top-28 -left-28 w-80 h-80 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="absolute -bottom-40 -right-40 w-[460px] h-[460px] rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.06)" }} />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <span className="text-white font-extrabold text-3xl leading-none">49</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1.5">49Pay</h1>
          <p className="text-white/90 text-sm">Cadastro, reembolsos, NFs e viagens</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-7" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>

          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-full p-1 mb-6">
            {(["user", "admin"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                  mode === m ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600"
                }`}>
                {m === "user" ? "Sou da equipe" : "Administrador"}
              </button>
            ))}
          </div>

          {/* ── USER FLOW ── */}
          {mode === "user" && (
            <>
              {/* Etapa 1 — E-mail */}
              {step === "email" && (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">E-mail corporativo</label>
                    <p className="text-xs text-slate-400">Use o domínio @49educacao.com.br</p>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@49educacao.com.br"
                      className={inputCls(!!serverError)}
                      autoFocus
                    />
                  </div>
                  {serverError && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{serverError}</div>
                  )}
                  <button type="submit" disabled={checkingEmail || !email}
                    className="w-full text-white font-bold py-3.5 rounded-xl transition-all text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                    {checkingEmail ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Verificando...
                      </span>
                    ) : "Continuar →"}
                  </button>
                </form>
              )}

              {/* Etapa 2a — Entrar com senha */}
              {step === "password" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                      {employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{employeeName}</p>
                      <p className="text-xs text-slate-400">{email}</p>
                    </div>
                    <button type="button" onClick={() => { setStep("email"); setPassword(""); setServerError(""); }}
                      className="ml-auto text-xs text-orange-500 font-semibold hover:text-orange-700">
                      Trocar
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Senha</label>
                    <div className="relative">
                      <input ref={passwordRef} type={showPass ? "text" : "password"} value={password}
                        onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                        className={inputCls(!!serverError)} />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold">
                        {showPass ? "Ocultar" : "Ver"}
                      </button>
                    </div>
                  </div>

                  {serverError && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{serverError}</div>
                  )}
                  <button type="submit" disabled={loading || password.length < 8}
                    className="w-full text-white font-bold py-3.5 rounded-xl transition-all text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Entrando...
                      </span>
                    ) : "Entrar →"}
                  </button>
                </form>
              )}

              {/* Etapa 2b — Criar senha (primeiro acesso) */}
              {step === "create" && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                    <p className="text-sm font-bold text-orange-700">👋 Olá, {employeeName.split(" ")[0]}!</p>
                    <p className="text-xs text-orange-600 mt-0.5">É seu primeiro acesso. Crie uma senha para continuar.</p>
                  </div>

                  {/* Gerador de senha */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600">Sugestão de senha forte</p>
                      <button type="button" onClick={handleGeneratePassword}
                        className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-lg transition">
                        🔑 Gerar
                      </button>
                    </div>
                    {password && (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 select-all">
                          {showPass ? password : "•".repeat(password.length)}
                        </code>
                        <button type="button" onClick={handleCopyPassword}
                          className="text-xs text-slate-500 hover:text-orange-500 font-semibold whitespace-nowrap transition">
                          {copied ? "✓ Copiado" : "Copiar"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Senha */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Crie sua senha</label>
                    <div className="relative">
                      <input ref={passwordRef} type={showPass ? "text" : "password"} value={password}
                        onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                        className={inputCls(!!serverError)} />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold">
                        {showPass ? "Ocultar" : "Ver"}
                      </button>
                    </div>
                    {/* Barra de força */}
                    {password.length > 0 && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300"
                            style={{ width: strength.width, background: strength.color }} />
                        </div>
                        <p className="text-xs font-semibold" style={{ color: strength.color }}>
                          Senha {strength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirmação */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">Confirme sua senha</label>
                    <div className="relative">
                      <input type={showConfirm ? "text" : "password"} value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha"
                        className={inputCls(!!serverError || (confirmPassword.length > 0 && confirmPassword !== password))} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold">
                        {showConfirm ? "Ocultar" : "Ver"}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && confirmPassword !== password && (
                      <p className="text-xs text-red-500 font-semibold">As senhas não coincidem</p>
                    )}
                  </div>

                  {serverError && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{serverError}</div>
                  )}

                  <button type="submit"
                    disabled={loading || password.length < 8 || password !== confirmPassword}
                    className="w-full text-white font-bold py-3.5 rounded-xl transition-all text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Criando conta...
                      </span>
                    ) : "Criar senha e entrar →"}
                  </button>

                  <p className="text-xs text-slate-400 text-center">
                    Guarde sua senha em local seguro. Não compartilhe com ninguém.
                  </p>
                </form>
              )}
            </>
          )}

          {/* ── ADMIN FLOW ── */}
          {mode === "admin" && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">E-mail administrativo</label>
                <p className="text-xs text-slate-400">Use o domínio @49educacao.com.br</p>
                <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="nome@49educacao.com.br"
                  className={inputCls(false)} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Senha de administrador</label>
                <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls(!!serverError)} />
              </div>
              {serverError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{serverError}</div>
              )}
              <button type="submit" disabled={loading || !adminPassword}
                className="w-full text-white font-bold py-3.5 rounded-xl transition-all text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : "Entrar →"}
              </button>
            </form>
          )}

          <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
            Ao entrar você concorda com os termos de uso da 49 Educação.
          </p>
        </div>

        <p className="text-center mt-5 text-white/80 text-sm">
          Dúvidas?{" "}
          <a href="https://wa.me/5548996843058" target="_blank" rel="noopener noreferrer"
            className="text-white font-bold underline underline-offset-2">
            Fale com nosso time no WhatsApp
          </a>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
