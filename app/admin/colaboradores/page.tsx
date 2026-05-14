"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ContractMeter from "@/components/ContractMeter";
import type { Employee } from "@/types";

const SQUADS = [
  "Design", "Tecnologia", "Produto", "Marketing", "Financeiro",
  "Comercial", "Operações", "RH", "Gestão",
];

function avatarInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(name: string) {
  const palette = [
    { bg: "#ede9fe", text: "#7c3aed" },
    { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#dcfce7", text: "#15803d" },
    { bg: "#fce7f3", text: "#be185d" },
    { bg: "#fef3c7", text: "#b45309" },
    { bg: "#cffafe", text: "#0e7490" },
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function contractStatusKey(contractEnd?: string): string {
  if (!contractEnd) return "ok";
  const end = new Date(contractEnd);
  const now = new Date(); now.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - now.getTime()) / 86400000);
  if (diff < 0)  return "vencido";
  if (diff <= 15) return "vencendo";
  if (diff <= 60) return "atencao";
  return "ok";
}

export default function ColaboradoresPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [squad,     setSquad]     = useState("Todos");
  const [statusFil, setStatusFil] = useState("Todos");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => { setEmployees(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => employees.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) return false;
    }
    if (squad !== "Todos" && e.squad !== squad) return false;
    if (statusFil !== "Todos") {
      const key = contractStatusKey(e.contractEnd);
      if (statusFil === "Vencendo" && key !== "vencendo" && key !== "vencido") return false;
      if (statusFil === "Incompleto" && (e.completion ?? 0) >= 100) return false;
    }
    return true;
  }), [employees, search, squad, statusFil]);

  const total       = employees.length;
  const vencendo    = employees.filter((e) => ["vencendo","vencido"].includes(contractStatusKey(e.contractEnd))).length;
  const atencao     = employees.filter((e) => contractStatusKey(e.contractEnd) === "atencao").length;
  const emDia       = total - vencendo - atencao;
  const incompletos = employees.filter((e) => (e.completion ?? 0) < 100).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header isAdmin user={{ name: "Admin", email: "admin@49educacao.com.br" }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Colaboradores</h1>
            <p className="text-sm text-slate-500 mt-0.5">Substitui a planilha. Tudo aqui, sempre atualizado.</p>
          </div>
          <div className="flex gap-2">
            <button className="text-sm border border-slate-200 text-slate-600 font-semibold px-4 py-2 rounded-xl hover:border-slate-300 hover:bg-white transition">
              ↓ Exportar CSV
            </button>
            <a href="/admin/colaboradores/novo" className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl transition">
              + Convidar colaborador
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="stat-card stat-card--orange rounded-2xl">
            <p className="text-xs font-extrabold uppercase tracking-wider text-orange-700 mb-1">Total</p>
            <p className="text-2xl font-extrabold text-orange-600">{total}</p>
            <p className="text-xs text-orange-700 mt-0.5">colaboradores ativos</p>
          </div>
          <a href="/admin/contratos" className="stat-card stat-card--amber rounded-2xl cursor-pointer hover:opacity-90 transition block">
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800 mb-1">Contratos vencendo</p>
            <p className="text-2xl font-extrabold text-amber-600">{vencendo}</p>
            <p className="text-xs text-amber-800 mt-0.5">em até 15 dias</p>
          </a>
          <div className="stat-card stat-card--blue rounded-2xl">
            <p className="text-xs font-extrabold uppercase tracking-wider text-blue-800 mb-1">Atenção</p>
            <p className="text-2xl font-extrabold text-blue-600">{atencao}</p>
            <p className="text-xs text-blue-800 mt-0.5">vencem em 16–60 dias</p>
          </div>
          <div className="stat-card stat-card--green rounded-2xl">
            <p className="text-xs font-extrabold uppercase tracking-wider text-green-800 mb-1">Em dia</p>
            <p className="text-2xl font-extrabold text-green-600">{emDia}</p>
            <p className="text-xs text-green-800 mt-0.5">{incompletos > 0 ? `${incompletos} c/ cadastro incompleto` : "tudo certo"}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
              <input
                className="w-full border-[1.5px] border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition"
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border-[1.5px] border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition sm:w-48"
              value={squad}
              onChange={(e) => setSquad(e.target.value)}
            >
              <option>Todos</option>
              {SQUADS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              className="border-[1.5px] border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition sm:w-44"
              value={statusFil}
              onChange={(e) => setStatusFil(e.target.value)}
            >
              {["Todos","Vencendo","Incompleto"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4].map((i) => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🔎</p>
              <p className="text-slate-400 text-sm font-medium">Nenhum colaborador encontrado com esses filtros.</p>
            </div>
          ) : (
            <table className="pay-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Squad / Cargo</th>
                  <th>Cidade</th>
                  <th>Contrato</th>
                  <th>Cadastro</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const { bg, text } = avatarColor(e.name);
                  const comp = e.completion ?? 0;
                  return (
                    <tr key={e.id} className="cursor-pointer" onClick={() => window.location.href = `/admin/colaboradores/${e.id}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0" style={{ background: bg, color: text }}>
                            {avatarInitials(e.name)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{e.name}</p>
                            <p className="text-xs text-slate-400">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-semibold text-slate-700 text-sm">{e.squad ?? "—"}</p>
                        <p className="text-xs text-slate-400">{e.role ?? "—"}</p>
                      </td>
                      <td className="text-sm text-slate-500">{e.city ?? "—"}</td>
                      <td>
                        <div className="min-w-[150px]">
                          <ContractMeter contractEnd={e.contractEnd} />
                          {e.contractEnd && (
                            <p className="text-xs text-slate-400 mt-1">
                              Vence {e.contractEnd.split("-").reverse().join("/")}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        {comp >= 100
                          ? <span className="pill pill--green">100% ✓</span>
                          : <span className="pill pill--amber">{comp}% · pendente</span>}
                      </td>
                      <td className="text-right">
                        <button className="text-sm text-orange-500 font-bold hover:text-orange-700 transition px-2 py-1 rounded-lg hover:bg-orange-50">
                          Ver →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-slate-400 text-right mt-3">
          Mostrando {filtered.length} de {total} colaboradores
        </p>
      </main>
    </div>
  );
}
