"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import type { UserSession, Employee } from "@/types";

const SECTIONS = [
  { id: "pessoal",   label: "Dados pessoais",    icon: "👤" },
  { id: "contato",   label: "Contato & endereço", icon: "✉️" },
  { id: "empresa",   label: "Empresa",            icon: "🏢" },
  { id: "contrato",  label: "Contrato",           icon: "📝" },
  { id: "formacao",  label: "Formação",           icon: "🎓" },
  { id: "pj",        label: "Dados PJ & PIX",     icon: "💸" },
  { id: "extras",    label: "Extras",             icon: "✨" },
];

const ROLES = [
  "Designer", "Desenvolvedor(a)", "Product Manager", "Marketing",
  "Financeiro", "Comercial", "Operações", "RH / Pessoas", "Outro",
];

const SQUADS = [
  "Design", "Tecnologia", "Produto", "Marketing", "Financeiro",
  "Comercial", "Operações", "RH", "Gestão",
];

const REQUIRED_FIELDS: (keyof Employee)[] = [
  "name", "email", "personalEmail", "phone", "cpf", "birthDate",
  "role", "squad", "startDate", "city", "address", "cep",
  "contractStart", "contractEnd", "education",
  "razaoSocial", "cnpj", "pixCnpj", "pixPf",
  "emergencyName", "emergencyPhone",
];

function calcCompletion(emp: Partial<Employee>): number {
  const filled = REQUIRED_FIELDS.filter((f) => {
    const v = emp[f as keyof Employee];
    return v !== undefined && v !== null && String(v).trim() !== "";
  }).length;
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

function formatBR(dateStr?: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function addDays(dateStr?: string, days?: number): string {
  if (!dateStr || days === undefined) return "—";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function inputCls(extra = "") {
  return `w-full border-[1.5px] border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition bg-white ${extra}`;
}

export default function PerfilPage() {
  const [user,    setUser]    = useState<UserSession | null>(null);
  const [data,    setData]    = useState<Partial<Employee>>({});
  const [active,  setActive]  = useState("pessoal");
  const [saving,  setSaving]  = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [toast,   setToast]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const completion = calcCompletion(data);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null));
    fetch("/api/employees/me")
      .then((r) => r.json())
      .then((emp) => { if (emp) setData(emp); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Scroll spy
  useEffect(() => {
    const handler = () => {
      for (const sec of SECTIONS) {
        const el = document.getElementById(`section-${sec.id}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top < 200 && rect.bottom > 100) { setActive(sec.id); break; }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) window.scrollTo({ top: el.offsetTop - 96, behavior: "smooth" });
    setActive(id);
  }, []);

  const set = useCallback((key: keyof Employee, value: string | boolean) => {
    setData((d) => ({ ...d, [key]: value }));
  }, []);

  async function lookupCEP(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const d = await r.json();
      if (!d.erro) {
        set("address", `${d.logradouro}${d.complemento ? ", " + d.complemento : ""} · ${d.bairro}`);
        set("city", `${d.localidade}, ${d.uf}`);
      }
    } catch {}
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/employees/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const emp = await res.json();
      setData(emp);
      setSavedAt(new Date());
      setToast("Cadastro atualizado com sucesso!");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast("Erro ao salvar. Tente novamente.");
      setTimeout(() => setToast(null), 3000);
    }
    setSaving(false);
  }

  const sizes = ["PP", "P", "M", "G", "GG", "XGG"];

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <Header user={user ?? undefined} title="Perfil" />
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          {[1,2,3].map((i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-40 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header user={user ?? undefined} title="Perfil" />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-6"
          style={{ background: "linear-gradient(135deg, #FFF7ED 0%, white 60%)" }}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div>
              <p className="text-xs font-extrabold text-orange-600 uppercase tracking-widest mb-2">📋 Meu cadastro</p>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
                Olá, {data.name?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "…"}!
              </h1>
              <p className="text-sm text-slate-500">
                {completion === 100
                  ? "Seu cadastro está completo. Edite os dados sempre que precisar."
                  : "Complete seu cadastro para a equipe ter tudo em um só lugar."}
              </p>
            </div>
            <div className="sm:min-w-[200px] sm:text-right">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Cadastro</p>
              <p className="text-4xl font-extrabold text-orange-500 leading-none mb-2">{completion}%</p>
              <div className="progress-bar mb-2">
                <div className="progress-bar__fill" style={{ width: `${completion}%` }} />
              </div>
              {savedAt && (
                <p className="text-xs text-slate-400">
                  Salvo {savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="grid gap-8" style={{ gridTemplateColumns: "220px 1fr" }}>

          {/* Sidebar */}
          <div className="side-nav">
            {SECTIONS.map((sec, i) => (
              <button
                key={sec.id}
                className={`side-nav__item ${active === sec.id ? "side-nav__item--active" : ""}`}
                onClick={() => scrollTo(sec.id)}
              >
                <span className="side-nav__num">{i + 1}</span>
                <span className="text-left">{sec.label}</span>
              </button>
            ))}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <button
                onClick={save}
                disabled={saving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold px-4 py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando...</>
                  : "💾 Salvar tudo"}
              </button>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-6">

            {/* 1. Dados pessoais */}
            <section id="section-pessoal" className="bg-white border border-slate-100 rounded-2xl p-6 scroll-mt-24">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Dados pessoais</h2>
                <p className="text-sm text-slate-400">Informações básicas e foto</p>
              </div>
              {/* Photo */}
              <div className="photo-uploader mb-5">
                <div className="photo-uploader__circle">
                  {data.photoUrl
                    ? <img src={data.photoUrl} alt="" />
                    : <span>{data.name?.[0]?.toUpperCase() ?? user?.name?.[0]?.toUpperCase() ?? "?"}</span>}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-800 mb-1">Foto de perfil</p>
                  <p className="text-xs text-slate-400 mb-3">JPG ou PNG · 1 MB máx · ideal 800×800 px</p>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" className="text-sm border border-slate-200 hover:border-orange-400 text-slate-600 font-semibold px-3 py-1.5 rounded-xl transition">
                      📸 Enviar foto
                    </button>
                    {data.photoUrl && (
                      <button type="button" onClick={() => set("photoUrl", "")} className="text-sm text-red-500 font-semibold px-3 py-1.5 rounded-xl hover:bg-red-50 transition">
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* LGPD */}
              <div className="consent-box mb-5">
                <input type="checkbox" id="photo-consent" checked={data.photoConsent ?? false} onChange={(e) => set("photoConsent", e.target.checked)} />
                <label htmlFor="photo-consent" className="cursor-pointer leading-snug">
                  <strong>Autorizo o uso da minha foto</strong> em comunicações internas e externas da 49 Educação
                  (LinkedIn, site, materiais de divulgação). Posso revogar a qualquer momento.
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nome completo" required>
                  <input className={inputCls()} value={data.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="Seu nome completo" />
                </Field>
                <Field label="CPF" required hint="Validamos o dígito verificador">
                  <input className={inputCls()} value={data.cpf ?? ""} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" />
                </Field>
                <Field label="Data de nascimento" required>
                  <input className={inputCls()} type="date" value={data.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value)} />
                </Field>
                <Field label="RG (opcional)">
                  <input className={inputCls()} value={data.rg ?? ""} onChange={(e) => set("rg", e.target.value)} placeholder="00.000.000-0" />
                </Field>
              </div>
            </section>

            {/* 2. Contato */}
            <section id="section-contato" className="bg-white border border-slate-100 rounded-2xl p-6 scroll-mt-24">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Contato & endereço</h2>
                <p className="text-sm text-slate-400">Como te encontrar</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="E-mail corporativo" hint="@49educacao.com.br — não pode ser alterado">
                  <input className={inputCls("bg-slate-50 text-slate-400 cursor-not-allowed")} value={data.email ?? user?.email ?? ""} disabled />
                </Field>
                <Field label="E-mail pessoal" required>
                  <input className={inputCls()} type="email" value={data.personalEmail ?? ""} onChange={(e) => set("personalEmail", e.target.value)} placeholder="seu@gmail.com" />
                </Field>
                <Field label="Telefone / WhatsApp" required>
                  <input className={inputCls()} value={data.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="(00) 00000-0000" />
                </Field>
                <Field label="CEP" required hint="Buscamos o endereço automaticamente">
                  <input className={inputCls()} value={data.cep ?? ""} onChange={(e) => { set("cep", e.target.value); lookupCEP(e.target.value); }} placeholder="00000-000" />
                </Field>
              </div>
              <div className="mt-4 space-y-4">
                <Field label="Endereço completo" required>
                  <input className={inputCls()} value={data.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número, complemento, bairro" />
                </Field>
                <Field label="Cidade / Estado" required>
                  <input className={inputCls()} value={data.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="Porto Alegre, RS" />
                </Field>
              </div>
            </section>

            {/* 3. Empresa */}
            <section id="section-empresa" className="bg-white border border-slate-100 rounded-2xl p-6 scroll-mt-24">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Empresa</h2>
                <p className="text-sm text-slate-400">Sua função e squad na 49 Educação</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Cargo" required>
                  <select className={inputCls()} value={data.role ?? ""} onChange={(e) => set("role", e.target.value)}>
                    <option value="">Selecione...</option>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Squad / Área" required>
                  <select className={inputCls()} value={data.squad ?? ""} onChange={(e) => set("squad", e.target.value)}>
                    <option value="">Selecione...</option>
                    {SQUADS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Data de entrada na empresa" required>
                  <input className={inputCls()} type="date" value={data.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} />
                </Field>
                <Field label="Gestor direto (opcional)" hint="Squad lead ou responsável imediato">
                  <input className={inputCls()} value={data.manager ?? ""} onChange={(e) => set("manager", e.target.value)} placeholder="Nome do gestor" />
                </Field>
              </div>
            </section>

            {/* 4. Contrato */}
            <section id="section-contrato" className="bg-white border border-slate-100 rounded-2xl p-6 scroll-mt-24">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Contrato</h2>
                <p className="text-sm text-slate-400">Cada contrato tem 1 ano de validade. Avisaremos 15 dias antes do vencimento.</p>
              </div>
              {data.contractEnd && (
                <div className="pay-banner pay-banner--orange rounded-xl mb-5">
                  <span className="text-lg flex-shrink-0">⏰</span>
                  <div>
                    <p className="font-bold text-sm mb-0.5">Lembrete automático em {formatBR(addDays(data.contractEnd, -15))}</p>
                    <p className="text-sm opacity-90">
                      15 dias antes do vencimento ({formatBR(data.contractEnd)}), você e o time de Pessoas receberão um e-mail.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Data de assinatura do contrato atual" required>
                  <input className={inputCls()} type="date" value={data.contractStart ?? ""} onChange={(e) => set("contractStart", e.target.value)} />
                </Field>
                <Field label="Data de vencimento" required hint="Calculada como assinatura + 1 ano">
                  <input className={inputCls()} type="date" value={data.contractEnd ?? ""} onChange={(e) => set("contractEnd", e.target.value)} />
                </Field>
              </div>
            </section>

            {/* 5. Formação */}
            <section id="section-formacao" className="bg-white border border-slate-100 rounded-2xl p-6 scroll-mt-24">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Formação acadêmica</h2>
                <p className="text-sm text-slate-400">Sua trajetória educacional</p>
              </div>
              <Field label="Formação principal" required hint="Curso, instituição e ano de conclusão (ou cursando)">
                <textarea
                  className={inputCls("min-h-[80px] resize-y")}
                  value={data.education ?? ""}
                  onChange={(e) => set("education", e.target.value)}
                  placeholder="Ex: Bacharel em Ciência da Computação — UFRGS (2021)"
                  rows={3}
                />
              </Field>
            </section>

            {/* 6. PJ & PIX */}
            <section id="section-pj" className="bg-white border border-slate-100 rounded-2xl p-6 scroll-mt-24">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Dados PJ & PIX</h2>
                <p className="text-sm text-slate-400">Para emissão de NFs e pagamentos via 49Pay</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <Field label="Razão social" required>
                  <input className={inputCls()} value={data.razaoSocial ?? ""} onChange={(e) => set("razaoSocial", e.target.value)} placeholder="Nome da sua empresa ME" />
                </Field>
                <Field label="CNPJ" required hint="Validamos o dígito verificador">
                  <input className={inputCls()} value={data.cnpj ?? ""} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
                </Field>
              </div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Chaves PIX</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="PIX vinculado ao CNPJ" required hint="Para receber pagamentos da NF">
                  <input className={inputCls()} value={data.pixCnpj ?? ""} onChange={(e) => set("pixCnpj", e.target.value)} placeholder="CNPJ, e-mail ou chave aleatória" />
                </Field>
                <Field label="PIX vinculado à conta PF" required hint="Para reembolsos">
                  <input className={inputCls()} value={data.pixPf ?? ""} onChange={(e) => set("pixPf", e.target.value)} placeholder="CPF, e-mail, celular ou aleatória" />
                </Field>
              </div>
            </section>

            {/* 7. Extras */}
            <section id="section-extras" className="bg-white border border-slate-100 rounded-2xl p-6 scroll-mt-24">
              <div className="mb-5">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Extras</h2>
                <p className="text-sm text-slate-400">Contato de emergência, kits e redes</p>
              </div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Contato de emergência</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Field label="Nome e parentesco" required>
                  <input className={inputCls()} value={data.emergencyName ?? ""} onChange={(e) => set("emergencyName", e.target.value)} placeholder="Ana Costa (mãe)" />
                </Field>
                <Field label="Telefone" required>
                  <input className={inputCls()} value={data.emergencyPhone ?? ""} onChange={(e) => set("emergencyPhone", e.target.value)} placeholder="(00) 00000-0000" />
                </Field>
              </div>
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Tamanho de camiseta
                  <span className="ml-1 text-xs text-slate-400 font-normal">(para kits, swags e eventos)</span>
                </p>
                <div className="size-picker">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`size-picker__btn ${data.shirtSize === s ? "size-picker__btn--active" : ""}`}
                      onClick={() => set("shirtSize", s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="LinkedIn / portfólio (opcional)" hint="Usamos em divulgações e onboarding">
                <input className={inputCls()} value={data.linkedin ?? ""} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/seu-perfil" />
              </Field>
            </section>

            {/* Save footer */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-800 mb-0.5">Pronto para salvar?</p>
                <p className="text-sm text-slate-400">Suas alterações ficam disponíveis para o time de Pessoas e Financeiro.</p>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold px-6 py-3 rounded-xl transition text-sm flex items-center gap-2"
              >
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Salvando...</>
                  : "Tudo certo, salvar"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="pay-toast">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-sm text-white">✓</div>
          {toast}
        </div>
      )}
    </div>
  );
}
