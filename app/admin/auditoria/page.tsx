"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import type { AuditEntry } from "@/lib/auditLog";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  pii_view:        { label: "Visualização PII",    color: "pill--blue"   },
  pii_reveal:      { label: "Campo revelado",       color: "pill--amber"  },
  file_download:   { label: "Download arquivo",     color: "pill--slate"  },
  password_reset:  { label: "Senha resetada",       color: "pill--red"    },
  employee_edit:   { label: "Dados editados",       color: "pill--orange" },
  employee_create: { label: "Colaborador criado",   color: "pill--green"  },
};

function formatTS(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function AuditoriaPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("Todos");

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((d) => { setEntries(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "Todos"
    ? entries
    : entries.filter((e) => e.action === filter);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header isAdmin user={{ name: "Admin", email: "admin@49educacao.com.br" }} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Log de auditoria</h1>
            <p className="text-sm text-slate-500 mt-1">Registro de acessos a dados pessoais (LGPD) — últimas 500 entradas.</p>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white"
          >
            <option value="Todos">Todos os eventos</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1,2,3,4,5].map((i) => <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-slate-400 text-sm font-medium">Nenhuma entrada no log ainda.</p>
            </div>
          ) : (
            <table className="pay-table">
              <thead>
                <tr>
                  <th>Data / hora</th>
                  <th>Evento</th>
                  <th>Ator</th>
                  <th>Alvo</th>
                  <th>Detalhe</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => {
                  const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, color: "pill--slate" };
                  return (
                    <tr key={i}>
                      <td className="text-xs text-slate-500 whitespace-nowrap">{formatTS(entry.ts)}</td>
                      <td><span className={`pill text-xs ${meta.color}`}>{meta.label}</span></td>
                      <td className="text-sm text-slate-700 font-medium">{entry.actor}</td>
                      <td className="text-sm text-slate-500 font-mono text-xs">{entry.target ?? "—"}</td>
                      <td className="text-sm text-slate-500">{entry.detail ?? "—"}</td>
                      <td className="text-xs text-slate-400 font-mono">{entry.ip ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-slate-400 text-right mt-3">
          {filtered.length} evento{filtered.length !== 1 ? "s" : ""} exibido{filtered.length !== 1 ? "s" : ""}
        </p>
      </main>
    </div>
  );
}
