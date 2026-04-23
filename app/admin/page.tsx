"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import type { TravelRequest } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export default function AdminPage() {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "options_sent" | "purchased">("all");

  const fetchRequests = useCallback(async () => {
    const res = await fetch("/api/requests");
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    options_sent: requests.filter((r) => r.status === "options_sent").length,
    purchased: requests.filter((r) => r.status === "purchased").length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header isAdmin title="Painel Admin" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { key: "all", label: "Total", color: "bg-slate-800 text-white" },
            { key: "pending", label: "Pendentes", color: "bg-amber-500 text-white" },
            { key: "options_sent", label: "Com opções", color: "bg-blue-600 text-white" },
            { key: "purchased", label: "Compradas", color: "bg-green-600 text-white" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key as typeof filter)}
              className={`rounded-2xl p-5 text-left transition-all ${s.color} ${
                filter === s.key ? "ring-2 ring-offset-2 ring-slate-400 scale-[1.02]" : "opacity-90 hover:opacity-100"
              }`}
            >
              <p className="text-3xl font-bold">{counts[s.key as keyof typeof counts]}</p>
              <p className="text-sm font-medium mt-1 opacity-90">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            {filter === "all" ? "Todas as solicitações" :
             filter === "pending" ? "Pendentes" :
             filter === "options_sent" ? "Com opções enviadas" : "Compradas"}
          </h2>
          <button onClick={fetchRequests} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Atualizar
          </button>
        </div>

        {loading && <div className="text-center py-12 text-slate-400">Carregando...</div>}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-500">Nenhuma solicitação aqui.</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((req) => (
            <a
              key={req.id}
              href={`/admin/solicitacao/${req.id}`}
              className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <StatusBadge status={req.status} />
                    <span className="text-xs text-slate-400">
                      {req.travel.type === "flight" ? "✈ Passagem"
                        : req.travel.type === "event" ? "🎟 Ingresso"
                        : "✈🎟 Passagem + Ingresso"}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">
                    {req.requester.name}
                    <span className="font-normal text-slate-400 ml-2 text-sm">
                      {req.travel.origin ? `${req.travel.origin} → ` : ""}
                      {req.travel.destination}
                      {req.travel.eventName ? ` · ${req.travel.eventName}` : ""}
                    </span>
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {req.requester.email}
                    {req.travel.departureDate ? ` · ${req.travel.departureDate}` : ""}
                    {" · "}{formatDate(req.createdAt)}
                  </p>
                </div>
                <span className="text-slate-300 group-hover:text-blue-400 transition mt-1">→</span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
