"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import type { Employee } from "@/types";

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
const SHIRT_SIZES = ["PP", "P", "M", "G", "GG", "XGG"];

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

export default function EditarColaboradorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data,        setData]       = useState<Partial<Employee>>({});
  const [loading,     setLoading]    = useState(true);
  const [saving,      setSaving]     = useState(false);
  const [toast,       setToast]      = useState<{ msg: string; ok: boolean } | null>(null);
  const [cepLoading,  setCepLoading] = useState(false);
  const [customRole,  setCustomRole] = useState("");
  const [customSquad, setCustomSquad] = useState("");

  useEffect(() => {
    fetch(`/api/employees/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d ?? {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  function set(field: keyof Employee, value: string | boolean) {
    setData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "contractStart" && typeof value === "string" && value) {
        const start = new Date(value);
        start.setFullYear(start.getFullYear() + 1);
        updated.contractEnd = start.toISOString().split("T")[0];
      }
      return updated;
    });
  }

  async function lookupCep(cep: string) {
    const raw = cep.replace(/\D/g, "");
    if (raw.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const json = await res.json();
      if (!json.erro) {
        setData((prev) => ({
          ...prev,
          address: `${json.logradouro}${json.bairro ? ", " + json.bairro : ""}`,
          city: `${json.localidade} - ${json.uf}`,
        }));
      }
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setToast({ msg: "Dados salvos com sucesso!", ok: true });
        setTimeout(() => router.push(`/admin/colaboradores/${id}`), 1500);
      } else {
        setToast({ msg: "Erro ao salvar. Tente novamente.", ok: false });
      }
    } catch {
      setToast({ msg: "Erro de conexão.", ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <Header isAdmin />
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-40 animate-pulse" />)}
        </div>
      </div>
    );
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
          href={`/admin/colaboradores/${id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 font-semibold hover:text-orange-500 transition mb-6"
        >
          ← Voltar para perfil
        </a>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Editar colaborador</h1>
            <p className="text-sm text-slate-500 mt-0.5">{data.name ?? "—"}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Dados pessoais */}
          <Section title="Dados pessoais">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome completo" required>
                <input className={inputCls()} value={data.name ?? ""} onChange={(e) => set("name", e.target.value)} required />
              </Field>
              <Field label="E-mail corporativo" required>
                <input className={inputCls()} type="email" value={data.email ?? ""} onChange={(e) => set("email", e.target.value)} required />
              </Field>
              <Field label="E-mail pessoal">
                <input className={inputCls()} type="email" value={data.personalEmail ?? ""} onChange={(e) => set("personalEmail", e.target.value)} />
              </Field>
              <Field label="Telefone">
                <input className={inputCls()} type="tel" value={data.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="(48) 99999-9999" />
              </Field>
              <Field label="CPF">
                <input className={inputCls()} value={data.cpf ?? ""} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" />
              </Field>
              <Field label="RG">
                <input className={inputCls()} value={data.rg ?? ""} onChange={(e) => set("rg", e.target.value)} />
              </Field>
              <Field label="Data de nascimento">
                <input className={inputCls()} type="date" value={data.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Endereço */}
          <Section title="Endereço">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="CEP" hint="Preenchimento automático ao sair do campo">
                <input
                  className={inputCls(cepLoading ? "opacity-60" : "")}
                  value={data.cep ?? ""}
                  onChange={(e) => set("cep", e.target.value)}
                  onBlur={(e) => lookupCep(e.target.value)}
                  placeholder="00000-000"
                />
              </Field>
              <Field label="Cidade">
                <input className={inputCls()} value={data.city ?? ""} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Endereço completo">
                  <input className={inputCls()} value={data.address ?? ""} onChange={(e) => set("address", e.target.value)} />
                </Field>
              </div>
            </div>
          </Section>

          {/* Empresa */}
          <Section title="Empresa">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cargo">
                <select
                  className={inputCls()}
                  value={ROLES.includes(data.role ?? "") ? (data.role ?? "") : (data.role ? "Outro" : "")}
                  onChange={(e) => {
                    if (e.target.value === "Outro") { set("role", customRole || "Outro"); }
                    else { set("role", e.target.value); setCustomRole(""); }
                  }}
                >
                  <option value="">Selecione…</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {(data.role === "Outro" || (data.role && !ROLES.includes(data.role))) && (
                  <input
                    className={inputCls("mt-2")}
                    placeholder="Digite o cargo..."
                    value={ROLES.includes(data.role ?? "") ? customRole : (data.role ?? "")}
                    onChange={(e) => { setCustomRole(e.target.value); set("role", e.target.value); }}
                  />
                )}
              </Field>
              <Field label="Squad">
                <select
                  className={inputCls()}
                  value={SQUADS.includes(data.squad ?? "") ? (data.squad ?? "") : (data.squad ? "Outro" : "")}
                  onChange={(e) => {
                    if (e.target.value === "Outro") { set("squad", customSquad || "Outro"); }
                    else { set("squad", e.target.value); setCustomSquad(""); }
                  }}
                >
                  <option value="">Selecione…</option>
                  {SQUADS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {(data.squad === "Outro" || (data.squad && !SQUADS.includes(data.squad))) && (
                  <input
                    className={inputCls("mt-2")}
                    placeholder="Digite o squad/área..."
                    value={SQUADS.includes(data.squad ?? "") ? customSquad : (data.squad ?? "")}
                    onChange={(e) => { setCustomSquad(e.target.value); set("squad", e.target.value); }}
                  />
                )}
              </Field>
              <Field label="Data de entrada">
                <input className={inputCls()} type="date" value={data.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} />
              </Field>
              <Field label="Gestor direto">
                <input className={inputCls()} value={data.manager ?? ""} onChange={(e) => set("manager", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Contrato */}
          <Section title="Contrato">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Início do contrato atual">
                <input className={inputCls()} type="date" value={data.contractStart ?? ""} onChange={(e) => set("contractStart", e.target.value)} />
              </Field>
              <Field label="Vencimento do contrato">
                <input className={inputCls()} type="date" value={data.contractEnd ?? ""} onChange={(e) => set("contractEnd", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Formação */}
          <Section title="Formação">
            <Field label="Formação acadêmica">
              <textarea
                className={inputCls("resize-none")}
                rows={3}
                value={data.education ?? ""}
                onChange={(e) => set("education", e.target.value)}
                placeholder="Ex: Bacharelado em Design pela UFSC (2018)"
              />
            </Field>
          </Section>

          {/* PJ & PIX */}
          <Section title="Dados PJ & PIX">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Razão social">
                <input className={inputCls()} value={data.razaoSocial ?? ""} onChange={(e) => set("razaoSocial", e.target.value)} />
              </Field>
              <Field label="CNPJ">
                <input className={inputCls()} value={data.cnpj ?? ""} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
              </Field>
              <Field label="PIX (CNPJ)">
                <input className={inputCls()} value={data.pixCnpj ?? ""} onChange={(e) => set("pixCnpj", e.target.value)} />
              </Field>
              <Field label="PIX (PF)">
                <input className={inputCls()} value={data.pixPf ?? ""} onChange={(e) => set("pixPf", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Extras */}
          <Section title="Extras">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Contato de emergência — nome">
                <input className={inputCls()} value={data.emergencyName ?? ""} onChange={(e) => set("emergencyName", e.target.value)} />
              </Field>
              <Field label="Contato de emergência — telefone">
                <input className={inputCls()} type="tel" value={data.emergencyPhone ?? ""} onChange={(e) => set("emergencyPhone", e.target.value)} />
              </Field>
              <Field label="Tamanho de camiseta">
                <div className="flex gap-2 flex-wrap">
                  {SHIRT_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("shirtSize", s)}
                      className={`w-12 h-12 rounded-xl text-sm font-bold border-2 transition ${
                        data.shirtSize === s
                          ? "border-orange-500 bg-orange-50 text-orange-600"
                          : "border-slate-200 text-slate-500 hover:border-orange-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="LinkedIn">
                <input className={inputCls()} value={data.linkedin ?? ""} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/usuario" />
              </Field>
            </div>
          </Section>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 pb-8">
            <a
              href={`/admin/colaboradores/${id}`}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm"
            >
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
