"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import type { TravelRequest, UserSession } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function RequestCard({ req }: { req: TravelRequest }) {
  const [open, setOpen] = useState(false);
  const typeLabel =
    req.travel.type === "flight" ? "✈ Passagem"
    : req.travel.type === "event" ? "🎟 Ingresso"
    : "✈🎟 Passagem + Ingresso";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-5 hover:bg-slate-50 transition"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={req.status} />
              <span className="text-xs text-slate-400">{typeLabel}</span>
            </div>
            <p className="font-semibold text-slate-800 truncate">
              {req.travel.origin ? `${req.travel.origin} → ` : ""}
              {req.travel.destination}
              {req.travel.eventName ? ` · ${req.travel.eventName}` : ""}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              {req.travel.departureDate
                ? `Ida: ${req.travel.departureDate}`
                : ""}
              {req.travel.returnDate ? ` · Volta: ${req.travel.returnDate}` : ""}
              {" · "}Solicitado em {formatDate(req.createdAt)}
            </p>
          </div>
          <span className="text-slate-300 mt-1">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {req.travel.preferredTimes && (
              <div>
                <span className="text-slate-400">Horários:</span>{" "}
                <span className="text-slate-700">{req.travel.preferredTimes}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400">Passageiros:</span>{" "}
              <span className="text-slate-700">{req.travel.passengers}</span>
            </div>
            {req.travel.notes && (
              <div className="col-span-2">
                <span className="text-slate-400">Obs:</span>{" "}
                <span className="text-slate-700">{req.travel.notes}</span>
              </div>
            )}
          </div>

          {/* Mensagem do admin */}
          {req.managerMessage && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-500 mb-1">
                Resposta da equipe de compras
              </p>
              <p className="text-sm text-slate-700">{req.managerMessage}</p>
            </div>
          )}

          {/* Confirmação de compra */}
          {req.purchaseInfo && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-600 mb-1">
                ✓ Compra confirmada
              </p>
              <p className="text-sm text-slate-700">{req.purchaseInfo}</p>
            </div>
          )}

          {req.status === "pending" && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
              Sua solicitação está sendo analisada. Em breve você receberá um e-mail.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MinhasSolicitacoesContent() {
  const searchParams = useSearchParams();
  const novo = searchParams.get("novo") === "1";

  const [user, setUser] = useState<UserSession | null>(null);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null));
  }, []);

  useEffect(() => {
    fetch("/api/requests/mine")
      .then((r) => r.json())
      .then((d) => { setRequests(Array.isArray(d) ? d : []); setLoading(false); });

    const interval = setInterval(() => {
      fetch("/api/requests/mine")
        .then((r) => r.json())
        .then((d) => setRequests(Array.isArray(d) ? d : []));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const pending = requests.filter((r) => r.status === "pending").length;
  const optionsSent = requests.filter((r) => r.status === "options_sent").length;
  const purchased = requests.filter((r) => r.status === "purchased").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Minhas viagens" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {novo && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">Solicitação enviada!</p>
              <p className="text-sm text-green-700">
                Você receberá um e-mail com as opções em breve.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        {requests.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Pendentes", value: pending, color: "text-amber-600 bg-amber-50" },
              { label: "Com opções", value: optionsSent, color: "text-orange-500 bg-orange-50" },
              { label: "Compradas", value: purchased, color: "text-green-600 bg-green-50" },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800">Minhas solicitações</h1>
          <a
            href="/solicitar"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            + Nova
          </a>
        </div>

        {loading && (
          <div className="text-center py-12 text-slate-400">Carregando...</div>
        )}

        {!loading && requests.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-4xl mb-3">✈</p>
            <p className="font-semibold text-slate-700 mb-1">Nenhuma solicitação ainda</p>
            <p className="text-slate-400 text-sm mb-5">Clique em Nova para começar</p>
            <a
              href="/solicitar"
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition inline-block"
            >
              Fazer solicitação
            </a>
          </div>
        )}

        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function MinhasSolicitacoesPage() {
  return (
    <Suspense>
      <MinhasSolicitacoesContent />
    </Suspense>
  );
}
