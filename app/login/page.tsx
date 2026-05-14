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
  const [showForgot, setShowForgot] = useState(false);

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
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs text-orange-500 font-semibold hover:text-orange-700 transition"
                  >
                    Esqueci minha senha
                  </button>
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

      {/* Modal: Esqueci minha senha */}
      {showForgot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowForgot(false)}
        >
          <div
            className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔑</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-800">Recuperar acesso</h2>
              <p className="text-sm text-slate-500 mt-1.5">
                A senha de administrador é definida pelo time de TI. Para redefini-la, entre em contato:
              </p>
            </div>
            <a
              href="https://wa.me/5548996843058"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.214a.75.75 0 00.93.93l5.355-1.476A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.705 9.705 0 01-4.953-1.357l-.355-.211-3.676 1.013 1.013-3.676-.211-.355A9.705 9.705 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
              </svg>
              Falar no WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setShowForgot(false)}
              className="mt-3 w-full text-sm text-slate-400 hover:text-slate-600 transition font-semibold py-2"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
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
