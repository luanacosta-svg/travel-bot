"use client";

import { useState, useEffect, useMemo } from "react";
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

type ContractKey = "vencido" | "vencendo" | "atencao" | "ok";

interface EnrichedEmployee extends Employee {
  _key:  ContractKey;
  _days: number;
}

function getContractInfo(contractEnd?: string): { key: ContractKey; days: number; label: string; pill: string } {
  if (!contractEnd) return { key: "ok", days: 999, label: "Sem data", pill: "pill--slate" };
  const end = new Date(contractEnd);
  const now = new Date(); now.setHours(0,0,0,0); end.setHours(0,0,0,0);
  const diff = Math.round((end.getTime() - now.getTime()) / 86400000);
  if (diff < 0)  return { key: "vencido",  days: diff, label: `Vencido há ${Math.abs(diff)}d`, pill: "pill--red"   };
  if (diff <= 15) return { key: "vencendo", days: diff, label: `${diff}d`,                       pill: "pill--amber" };
  if (diff <= 60) return { key: "atencao",  days: diff, label: `${diff}d`,                       pill: "pill--blue"  };
  return              { key: "ok",      days: diff, label: `${diff}d`,                       pill: "pill--green" };
}

function formatBR(dateStr?: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function exportContratosCSV(employees: EnrichedEmployee[], filterLabel: string) {
  const headers = ["Nome", "E-mail", "Cargo", "Squad", "Cidade", "Início contrato", "Vencimento contrato", "Dias restantes", "Status"];
  const statusLabel: Record<string, string> = {
    vencido: "Vencido", vencendo: "Vencendo", atencao: "Atenção", ok: "Em dia",
  };
  const rows = employees.map((e) => [
    e.name, e.email, e.role ?? "", e.squad ?? "", e.city ?? "",
    e.contractStart ?? "", e.contractEnd ?? "",
    String(e._days < 0 ? `Vencido há ${Math.abs(e._days)}d` : `${e._days}d`),
    statusLabel[e._key] ?? e._key,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contratos-${filterLabel}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ContratosPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<string>("vencendo");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => { setEmployees(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const enriched = useMemo<EnrichedEmployee[]>(() =>
    employees.map((e) => {
      const info = getContractInfo(e.contractEnd);
      return { ...e, _key: info.key, _days: info.days };
    }),
    [employees]
  );

  const buckets = useMemo(() => ({
    vencido:  enriched.filter((e) => e._key === "vencido"),
    vencendo: enriched.filter((e) => e._key === "vencendo"),
    atencao:  enriched.filter((e) => e._key === "atencao"),
    ok:       enriched.filter((e) => e._key === "ok"),
  }), [enriched]);

  const displayed = useMemo(() => {
    if (filter === "todos") return [...enriched].sort((a, b) => a._days - b._days);
    if (filter === "vencendo") return [...buckets.vencido, ...buckets.vencendo].sort((a, b) => a._days - b._days);
    return (buckets[filter as keyof typeof buckets] ?? []).slice().sort((a, b) => a._days - b._days);
  }, [filter, buckets, enriched]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header isAdmin user={{ name: "Admin", email: "admin@49educacao.com.br" }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Contratos</h1>
        <p className="text-sm text-slate-500 mb-8">Acompanhe vencimentos e dispare aditivos antes que vire problema.</p>

        {/* Bucket cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { key: "vencido",  label: "Vencidos",       value: buckets.vencido.length,  sub: "aditivo urgente",    cls: "stat-card--red"    },
            { key: "vencendo", label: "Vencendo",        value: buckets.vencendo.length, sub: "em até 15 dias",     cls: "stat-card--amber"  },
            { key: "atencao",  label: "Atenção",         value: buckets.atencao.length,  sub: "em 16–60 dias",      cls: "stat-card--blue"   },
            { key: "ok",       label: "Em dia",          value: buckets.ok.length,       sub: "sem ações",          cls: "stat-card--green"  },
          ].map((b) => (
            <button
              key={b.key}
              className={`stat-card ${b.cls} rounded-2xl text-left cursor-pointer hover:opacity-90 transition ring-0 ${filter === b.key ? "ring-2 ring-offset-2 ring-orange-400" : ""}`}
              onClick={() => setFilter(b.key)}
            >
              <p className="text-xs font-extrabold uppercase tracking-wider mb-1 opacity-70">{b.label}</p>
              <p className="text-2xl font-extrabold">{loading ? "—" : b.value}</p>
              <p className="text-xs mt-0.5 opacity-70">{b.sub}</p>
            </button>
          ))}
        </div>

        {/* Tabs row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex bg-slate-100 rounded-full p-1 gap-1 self-start flex-wrap">
            {[
              { id: "vencendo", label: `🔴 Urgentes (${buckets.vencido.length + buckets.vencendo.length})` },
              { id: "atencao",  label: `🟡 Atenção (${buckets.atencao.length})`  },
              { id: "ok",       label: `🟢 Em dia (${buckets.ok.length})`        },
              { id: "todos",    label: "Todos"                                    },
            ].map((t) => (
              <button
                key={t.id}
                className={`px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap ${
                  filter === t.id ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
                onClick={() => setFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportContratosCSV(displayed, filter)}
            className="text-sm border border-slate-200 text-slate-600 font-semibold px-4 py-2 rounded-xl hover:border-slate-300 transition self-start sm:self-auto"
          >
            ↓ Exportar relatório
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-24 animate-pulse" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl text-center py-16">
            <p className="text-3xl mb-3">🎉</p>
            <p className="text-slate-400 text-sm font-medium">Tudo certo aqui! Nenhum contrato nesta categoria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((e) => {
              const info = getContractInfo(e.contractEnd);
              const { bg, text } = avatarColor(e.name);
              return (
                <div key={e.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0" style={{ background: bg, color: text }}>
                      {avatarInitials(e.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">{e.name}</span>
                        <span className={`pill text-xs ${info.pill}`}>{info.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{e.role} · {e.squad} · {e.city}</p>
                    </div>
                  </div>

                  {/* Date info */}
                  <div className="sm:w-40 flex-shrink-0">
                    <p className="text-xs text-slate-400 mb-0.5">Vencimento</p>
                    <p className="font-bold text-slate-800 text-sm">{formatBR(e.contractEnd)}</p>
                    <p className={`text-xs mt-0.5 ${
                      info.key === "vencido"  ? "text-red-600"   :
                      info.key === "vencendo" ? "text-amber-600" :
                      info.key === "atencao"  ? "text-blue-600"  : "text-green-600"
                    }`}>
                      {info.days < 0 ? `${Math.abs(info.days)} dias atrás` : `em ${info.days} dias`}
                    </p>
                  </div>

                  {/* Meter */}
                  <div className="sm:w-44 flex-shrink-0">
                    <ContractMeter contractEnd={e.contractEnd} />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={`/admin/colaboradores/${e.id}`}
                      className="text-sm border border-slate-200 text-slate-600 font-semibold px-3 py-1.5 rounded-xl hover:border-orange-300 transition">
                      Ver
                    </a>
                    {(info.key === "vencendo" || info.key === "vencido") && (
                      <a
                        href={`/admin/colaboradores/${e.id}/editar#contrato`}
                        className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        Iniciar aditivo
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
