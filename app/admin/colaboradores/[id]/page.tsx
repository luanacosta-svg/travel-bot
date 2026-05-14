"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import ContractMeter from "@/components/ContractMeter";
import type { Employee } from "@/types";

function avatarInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(name: string) {
  const palette = [
    { bg: "#ede9fe", text: "#7c3aed" }, { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#dcfce7", text: "#15803d" }, { bg: "#fce7f3", text: "#be185d" },
    { bg: "#fef3c7", text: "#b45309" }, { bg: "#cffafe", text: "#0e7490" },
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function contractStatus(contractEnd?: string) {
  if (!contractEnd) return { key: "ok", days: 999 };
  const end = new Date(contractEnd);
  const now = new Date(); now.setHours(0,0,0,0); end.setHours(0,0,0,0);
  const diff = Math.round((end.getTime() - now.getTime()) / 86400000);
  if (diff < 0)  return { key: "vencido",  days: diff };
  if (diff <= 15) return { key: "vencendo", days: diff };
  if (diff <= 60) return { key: "atencao",  days: diff };
  return { key: "ok", days: diff };
}

function formatBR(dateStr?: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-3 border-b border-slate-50 gap-4 last:border-0">
      <span className="text-sm text-slate-400 flex-shrink-0">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right max-w-[60%] break-words">{value || "—"}</span>
    </div>
  );
}

export default function ColaboradorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [emp,     setEmp]     = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/employees/${id}`)
      .then((r) => r.json())
      .then((d) => { setEmp(d ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <Header isAdmin user={{ name: "Admin", email: "admin@49educacao.com.br" }} />
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          {[1,2,3].map((i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-40 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <Header isAdmin user={{ name: "Admin", email: "admin@49educacao.com.br" }} />
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <p className="text-3xl mb-3">🔎</p>
          <p className="text-slate-500 font-medium">Colaborador não encontrado.</p>
          <a href="/admin/colaboradores" className="mt-4 inline-block text-orange-500 font-bold hover:text-orange-700">← Voltar</a>
        </div>
      </div>
    );
  }

  const status = contractStatus(emp.contractEnd);
  const comp   = emp.completion ?? 0;
  const { bg, text } = avatarColor(emp.name);

  const contractBannerColor =
    status.key === "vencido"  ? "pay-banner--red"   :
    status.key === "vencendo" ? "pay-banner--amber"  : "";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header isAdmin user={{ name: "Admin", email: "admin@49educacao.com.br" }} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Back */}
        <a href="/admin/colaboradores" className="inline-flex items-center gap-1 text-sm text-slate-500 font-semibold hover:text-orange-500 transition mb-6">
          ← Voltar para colaboradores
        </a>

        {/* Hero card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-extrabold flex-shrink-0" style={{ background: bg, color: text }}>
                {avatarInitials(emp.name)}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">{emp.name}</h1>
                <p className="text-sm text-slate-500 mb-3">{emp.role ?? "—"} · {emp.squad ?? "—"}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="pill pill--orange text-xs">📧 {emp.email}</span>
                  {emp.phone && <span className="pill pill--slate text-xs">📱 {emp.phone}</span>}
                  <span className={`pill text-xs ${comp >= 100 ? "pill--green" : "pill--amber"}`}>
                    Cadastro {comp}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="text-sm border border-slate-200 text-slate-600 font-semibold px-4 py-2 rounded-xl hover:border-orange-300 transition">
                ✉️ Enviar lembrete
              </button>
              <a href={`/admin/colaboradores/${id}/editar`} className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl transition">
                ✏️ Editar
              </a>
            </div>
          </div>
        </div>

        {/* Contract alert banner */}
        {(status.key === "vencido" || status.key === "vencendo") && (
          <div className={`pay-banner ${contractBannerColor} rounded-2xl mb-4`}>
            <span className="text-xl flex-shrink-0">⏰</span>
            <div className="flex-1">
              <p className="font-bold text-sm mb-0.5">
                {status.key === "vencido"
                  ? `Contrato vencido há ${Math.abs(status.days)} dias`
                  : `Contrato vence em ${status.days} dias (${formatBR(emp.contractEnd)})`}
              </p>
              <p className="text-sm opacity-90">Hora de iniciar o aditivo. O lembrete automático já foi disparado.</p>
            </div>
            <button className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
              Iniciar aditivo →
            </button>
          </div>
        )}

        {/* Main 2-col grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Left: info cards */}
          <div className="sm:col-span-2 space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-3">Dados pessoais</h3>
              <InfoRow label="Nome completo"     value={emp.name} />
              <InfoRow label="CPF"               value={emp.cpf} />
              <InfoRow label="Data de nascimento" value={formatBR(emp.birthDate)} />
              <InfoRow label="E-mail pessoal"    value={emp.personalEmail} />
              <InfoRow label="Telefone"          value={emp.phone} />
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-3">Endereço</h3>
              <InfoRow label="CEP"       value={emp.cep} />
              <InfoRow label="Endereço"  value={emp.address} />
              <InfoRow label="Cidade"    value={emp.city} />
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-3">Empresa & contrato</h3>
              <InfoRow label="Cargo"                     value={emp.role} />
              <InfoRow label="Squad"                     value={emp.squad} />
              <InfoRow label="Entrada na empresa"        value={formatBR(emp.startDate)} />
              <InfoRow label="Início do contrato atual"  value={formatBR(emp.contractStart)} />
              <InfoRow label="Vencimento do contrato"    value={formatBR(emp.contractEnd)} />
              <InfoRow label="Formação"                  value={emp.education} />
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider mb-3">Dados PJ & PIX</h3>
              <InfoRow label="Razão social" value={emp.razaoSocial} />
              <InfoRow label="CNPJ"         value={emp.cnpj} />
              <InfoRow label="PIX (CNPJ)"   value={emp.pixCnpj} />
              <InfoRow label="PIX (PF)"     value={emp.pixPf} />
            </div>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Status do contrato</p>
              <ContractMeter contractEnd={emp.contractEnd} />
              <p className="text-sm text-slate-500 mt-3">
                Vence em <strong className="text-slate-800">{formatBR(emp.contractEnd)}</strong>
              </p>
            </div>

            {emp.emergencyName && (
              <div className="bg-white border border-slate-100 rounded-2xl p-4">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Emergência</p>
                <p className="font-bold text-slate-800 text-sm">{emp.emergencyName}</p>
                <p className="text-sm text-slate-400 mt-0.5">{emp.emergencyPhone}</p>
              </div>
            )}

            {emp.shirtSize && (
              <div className="bg-white border border-slate-100 rounded-2xl p-4">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Camiseta</p>
                <p className="text-3xl font-extrabold text-slate-800">{emp.shirtSize}</p>
              </div>
            )}

            {emp.linkedin && (
              <div className="bg-white border border-slate-100 rounded-2xl p-4">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">LinkedIn</p>
                <a href={`https://${emp.linkedin.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-500 font-medium hover:underline break-all">
                  {emp.linkedin}
                </a>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Histórico</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                  <span><strong className="text-slate-700">Hoje</strong> <span className="text-slate-400">· cadastro atualizado</span></span>
                </div>
                {emp.contractStart && (
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    <span><strong className="text-slate-700">{formatBR(emp.contractStart)}</strong> <span className="text-slate-400">· contrato renovado</span></span>
                  </div>
                )}
                {emp.startDate && (
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <span><strong className="text-slate-700">{formatBR(emp.startDate)}</strong> <span className="text-slate-400">· entrada na empresa</span></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
