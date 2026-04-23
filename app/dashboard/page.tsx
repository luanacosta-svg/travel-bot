"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import type { TravelRequest, UserSession } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null));

    fetch("/api/requests/mine")
      .then((r) => r.json())
      .then((d) => { setRequests(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const pending = requests.filter((r) => r.status === "pending").length;
  const optionsSent = requests.filter((r) => r.status === "options_sent").length;
  const purchased = requests.filter((r) => r.status === "purchased").length;
  const recent = requests.slice(0, 3);

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Início" />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Boas-vindas */}
        <div className="bg-orange-500 rounded-2xl p-6 text-white">
          <p className="text-orange-100 text-sm mb-1">Olá, {firstName}! 👋</p>
          <h1 className="text-2xl font-bold">Sistema de Viagens</h1>
          <p className="text-orange-100 text-sm mt-1">49 Educação</p>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/solicitar"
            className="bg-white border-2 border-orange-500 rounded-2xl p-5 flex flex-col gap-2 hover:bg-orange-50 transition group"
          >
            <span className="text-2xl">✈</span>
            <p className="font-semibold text-slate-800">Nova passagem</p>
            <p className="text-xs text-slate-400">Solicitar voo</p>
          </a>
          <a
            href="/solicitar"
            className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex flex-col gap-2 hover:border-orange-300 transition"
            onClick={() => sessionStorage.setItem("defaultType", "event")}
          >
            <span className="text-2xl">🎟</span>
            <p className="font-semibold text-slate-800">Novo ingresso</p>
            <p className="text-xs text-slate-400">Solicitar evento</p>
          </a>
        </div>

        {/* Stats */}
        {!loading && requests.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Em análise", value: pending, icon: "🕐", color: "bg-amber-50 text-amber-700 border-amber-100" },
              { label: "Com opções", value: optionsSent, icon: "📋", color: "bg-orange-50 text-orange-600 border-orange-100" },
              { label: "Compradas", value: purchased, icon: "✅", color: "bg-green-50 text-green-700 border-green-100" },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
                <p className="text-xl mb-1">{s.icon}</p>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Solicitações recentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800">Solicitações recentes</h2>
            <a href="/minhas-solicitacoes" className="text-sm text-orange-500 font-medium hover:text-orange-600">
              Ver todas →
            </a>
          </div>

          {loading && <p className="text-slate-400 text-sm">Carregando...</p>}

          {!loading && requests.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-3xl mb-2">✈</p>
              <p className="text-slate-500 text-sm">Nenhuma solicitação ainda.</p>
              <a
                href="/solicitar"
                className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
              >
                Fazer primeira solicitação
              </a>
            </div>
          )}

          <div className="space-y-3">
            {recent.map((req) => (
              <a
                key={req.id}
                href="/minhas-solicitacoes"
                className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 hover:border-orange-200 hover:shadow-sm transition group"
              >
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  {req.travel.type === "event" ? "🎟" : "✈"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {req.travel.origin ? `${req.travel.origin} → ` : ""}
                    {req.travel.destination}
                    {req.travel.eventName ? ` · ${req.travel.eventName}` : ""}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(req.createdAt)}</p>
                </div>
                <StatusBadge status={req.status} />
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
