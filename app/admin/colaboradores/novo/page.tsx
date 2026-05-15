"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const ROLES = [
  "CEO",
  "Gerente de Projetos",
  "Head Comercial",
  "Head de Produto",
  "Head de Tecnologia",
  "Analista de Marketing",
  "Analista de Tecnologia",
  "Assistente de Marketing",
  "Coordenadora Financeira",
  "Customer Success",
  "Partnerships & CS Analyst",
  "BDR",
  "SDR",
  "Closer",
  "Desenvolvedor Pleno",
  "Outro",
];
const SQUADS = [
  "Diretoria",
  "Gestão & Finanças",
  "Corporate",
  "Produto",
  "Tecnologia",
  "Marketing",
  "Vendas B2C",
  "Outro",
];

function inputCls(extra = "") {
  return `w-full border-[1.5px] border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 transition bg-white ${extra}`;
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
      <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider pb-2 border-b border-slate-50">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function NovoColaboradorPage() {
  const router = useRouter();

  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [role,        setRole]        = useState("");
  const [customRole,  setCustomRole]  = useState("");
  const [squad,       setSquad]       = useState("");
  const [customSquad, setCustomSquad] = useState("");
  const [manager,     setManager]     = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd,   setContractEnd]   = useState("");

  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; ok: boolean } | null>(null);

  function handleContractStart(val: string) {
    setContractStart(val);
    if (val) {
      const d = new Date(val);
      d.setFullYear(d.getFullYear() + 1);
      setContractEnd(d.toISOString().split("T")[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name,
      email,
      role: role === "Outro" ? customRole : role,
      squad: squad === "Outro" ? customSquad : squad,
      manager,
      contractStart,
      contractEnd,
    };

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const emp = await res.json();
        setToast({ msg: "Colaborador cadastrado com sucesso!", ok: true });
        setTimeout(() => router.push(`/admin/colaboradores/${emp.id}`), 1500);
      } else {
        const err = await res.json();
        setToast({ msg: err.error ?? "Erro ao cadastrar. Tente novamente.", ok: false });
      }
    } catch {
      setToast({ msg: "Erro de conexão.", ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header isAdmin />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold flex items-center gap-2.5 transition-all ${
          toast.ok ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.ok ? "✅" : "❌"} {toast.msg}
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 py-8">
        <a
          href="/admin/colaboradores"
          className="inline-flex items-center gap-1 text-sm text-slate-500 font-semibold hover:text-orange-500 transition mb-6"
        >
          ← Voltar para colaboradores
        </a>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Novo colaborador</h1>
            <p className="text-sm text-slate-500 mt-0.5">Preencha os dados para cadastrar um novo membro da equipe</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados básicos */}
          <Section title="Dados básicos">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome completo" required>
                <input
                  className={inputCls()}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                />
              </Field>
              <Field label="E-mail corporativo" required hint="Domínio @49educacao.com.br">
                <input
                  className={inputCls()}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@49educacao.com.br"
                  required
                />
              </Field>
            </div>
          </Section>

          {/* Cargo e squad */}
          <Section title="Empresa">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cargo">
                <select
                  className={inputCls()}
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value !== "Outro") setCustomRole("");
                  }}
                >
                  <option value="">Selecione…</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {role === "Outro" && (
                  <input
                    className={inputCls("mt-2")}
                    placeholder="Digite o cargo..."
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Squad">
                <select
                  className={inputCls()}
                  value={squad}
                  onChange={(e) => {
                    setSquad(e.target.value);
                    if (e.target.value !== "Outro") setCustomSquad("");
                  }}
                >
                  <option value="">Selecione…</option>
                  {SQUADS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {squad === "Outro" && (
                  <input
                    className={inputCls("mt-2")}
                    placeholder="Digite o squad/área..."
                    value={customSquad}
                    onChange={(e) => setCustomSquad(e.target.value)}
                  />
                )}
              </Field>
              <Field label="Gestor direto">
                <input
                  className={inputCls()}
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="Nome do gestor"
                />
              </Field>
            </div>
          </Section>

          {/* Contrato */}
          <Section title="Contrato">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Início do contrato" hint="O vencimento é calculado automaticamente (+1 ano)">
                <input
                  className={inputCls()}
                  type="date"
                  value={contractStart}
                  onChange={(e) => handleContractStart(e.target.value)}
                />
              </Field>
              <Field label="Vencimento do contrato">
                <input
                  className={inputCls()}
                  type="date"
                  value={contractEnd}
                  onChange={(e) => setContractEnd(e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* Info */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-4 flex items-start gap-3">
            <span className="text-orange-400 mt-0.5 text-base">ℹ️</span>
            <p className="text-sm text-orange-700">
              O colaborador poderá completar o próprio perfil (dados pessoais, endereço, formação, PJ/PIX etc.)
              após o primeiro acesso em <strong>/perfil</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <a
              href="/admin/colaboradores"
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={saving || !name || !email}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm"
            >
              {saving ? "Cadastrando…" : "Cadastrar colaborador"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
