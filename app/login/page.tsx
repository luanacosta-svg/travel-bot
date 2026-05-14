"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "1";

  const [mode, setMode] = useState<"user" | "admin">(isAdmin ? "admin" : "user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Touch tracking for inline validation
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  useEffect(() => {
    setName(localStorage.getItem("49pay_name") ?? "");
    setEmail(localStorage.getItem("49pay_email") ?? "");
  }, []);

  useEffect(() => {
    if (isAdmin) setMode("admin");
  }, [isAdmin]);

  // Reset touched on mode switch
  useEffect(() => {
    setTouched({ name: false, email: false, password: false });
    setServerError("");
  }, [mode]);

  const nameValid = name.trim().length >= 3;
  const emailValid = /^[^\s@]+@49educacao\.com\.br$/i.test(email.trim());
  const passwordValid = password.length >= 6;

  const nameError  = touched.name     && !nameValid     && mode === "user" ? "Informe seu nome completo (mín. 3 caracteres)" : null;
  const emailError = touched.email    && !emailValid                        ? "Use seu e-mail @49educacao.com.br"              : null;
  const passError  = touched.password && !passwordValid && mode === "admin" ? "Senha mínima de 6 caracteres"                  : null;

  const canSubmit = mode === "admin"
    ? emailValid && passwordValid
    : nameValid && emailValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!canSubmit) return;

    setLoading(true);
    setServerError("");

    const endpoint = mode === "admin" ? "/api/auth/admin-login" : "/api/auth/login";
    const body     = mode === "admin" ? { password } : { name, email };

    const res  = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setServerError(data.error); return; }
    if (mode === "user") {
      localStorage.setItem("49pay_name",  name);
      localStorage.setItem("49pay_email", email);
    }
    router.push(mode === "admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  function inputStyle(valid: boolean, error: string | null) {
    if (error) return { borderColor: "#DC2626" };
    if (valid) return { borderColor: "#16A34A" };
    return {};
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #FB8423 0%, #F97316 40%, #EA580C 100%)" }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-28 -left-28 w-80 h-80 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="absolute -bottom-40 -right-40 w-[460px] h-[460px] rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.06)" }} />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-7">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}
          >
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
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${
                  mode === m
                    ? "bg-white shadow-sm text-slate-800"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {m === "user" ? "Sou da equipe" : "Administrador"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field (user mode only) */}
            {mode === "user" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Nome completo</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  placeholder="Seu nome completo"
                  className="w-full border-[1.5px] rounded-xl px-3.5 py-3 text-sm focus:outline-none transition"
                  style={inputStyle(nameValid && touched.name, nameError)}
                  onFocus={(e) => (e.target.style.borderColor = "#F97316")}
                />
                {nameError && <p className="text-xs text-red-600 flex items-center gap-1">⚠ {nameError}</p>}
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                {mode === "admin" ? "E-mail administrativo" : "E-mail corporativo"}
              </label>
              {!emailError && (
                <p className="text-xs text-slate-400">Use o domínio @49educacao.com.br</p>
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="nome@49educacao.com.br"
                className="w-full border-[1.5px] rounded-xl px-3.5 py-3 text-sm focus:outline-none transition"
                style={inputStyle(emailValid && touched.email, emailError)}
                onFocus={(e) => { if (!emailError) e.target.style.borderColor = "#F97316"; }}
              />
              {emailError && <p className="text-xs text-red-600 flex items-center gap-1">⚠ {emailError}</p>}
            </div>

            {/* Password field (admin mode only) */}
            {mode === "admin" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Senha de administrador</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="••••••••"
                  className="w-full border-[1.5px] rounded-xl px-3.5 py-3 text-sm focus:outline-none transition"
                  style={inputStyle(passwordValid && touched.password, passError)}
                  onFocus={(e) => { if (!passError) e.target.style.borderColor = "#F97316"; }}
                />
                {passError && <p className="text-xs text-red-600 flex items-center gap-1">⚠ {passError}</p>}
                <div className="text-right">
                  <a href="#" className="text-xs text-orange-500 font-semibold hover:text-orange-700">
                    Esqueci minha senha
                  </a>
                </div>
              </div>
            )}

            {/* Server error */}
            {serverError && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-bold py-3.5 rounded-xl transition-all text-sm mt-2"
              style={{
                background: canSubmit ? "#F97316" : "#FDBA74",
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar →"
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
            Ao entrar você concorda com os termos de uso da 49 Educação.
          </p>
        </div>

        <p className="text-center mt-5 text-white/80 text-sm">
          Dúvidas?{" "}
          <a href="https://wa.me/5548996843058" target="_blank" rel="noopener noreferrer" className="text-white font-bold underline underline-offset-2">
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
