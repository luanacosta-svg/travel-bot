"use client";

import { useState, useEffect, useCallback } from "react";
import type { TravelRequest } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  options_sent: "Respondido",
  purchased: "Comprado",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  options_sent: "bg-blue-100 text-blue-800",
  purchased: "bg-green-100 text-green-800",
};

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

function RequestCard({ req, adminKey }: { req: TravelRequest; adminKey: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(req.status === "options_sent");

  const type =
    req.travel.type === "flight" ? "Passagem"
    : req.travel.type === "event" ? "Ingresso"
    : "Passagem + Ingresso";

  async function handleSend() {
    setSending(true);
    const res = await fetch("/api/send-options", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({ requestId: req.id, managerMessage: message }),
    });
    setSending(false);
    if (res.ok) setSent(true);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-semibold text-slate-800">{req.requester.name}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status]}`}>
              {STATUS_LABEL[req.status]}
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {type}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {req.travel.origin && `${req.travel.origin} → `}
            {req.travel.destination}
            {req.travel.departureDate && ` · ${req.travel.departureDate}`}
            {req.travel.eventName && ` · ${req.travel.eventName}`}
            {" · "}{formatDate(req.createdAt)}
          </p>
        </div>
        <span className="text-slate-400 text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-5">
          {/* Detalhes */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-slate-500">E-mail:</span>{" "}
              <a href={`mailto:${req.requester.email}`} className="text-blue-600">
                {req.requester.email}
              </a>
            </div>
            {req.requester.phone && (
              <div><span className="text-slate-500">Telefone:</span> {req.requester.phone}</div>
            )}
            {req.travel.preferredTimes && (
              <div><span className="text-slate-500">Horários:</span> {req.travel.preferredTimes}</div>
            )}
            <div><span className="text-slate-500">Passageiros:</span> {req.travel.passengers}</div>
            {req.travel.notes && (
              <div className="col-span-2">
                <span className="text-slate-500">Obs:</span> {req.travel.notes}
              </div>
            )}
          </div>

          {/* Link Google Flights */}
          {req.flightSearchUrl && (
            <a
              href={req.flightSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm px-4 py-3 rounded-lg transition-colors"
            >
              🔍 Ver voos no Google Flights
            </a>
          )}

          {/* Responder */}
          {!sent ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Mensagem para {req.requester.name}:
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Descreva as opções encontradas, valores, horários... (após comprar, informe o número do bilhete)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
              >
                {sending ? "Enviando..." : "Enviar por e-mail"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3 font-medium">
              ✓ Resposta enviada para {req.requester.email}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async (adminKey: string) => {
    setLoading(true);
    const res = await fetch("/api/requests", {
      headers: { "x-admin-key": adminKey },
    });
    setLoading(false);
    if (res.status === 401) { setError("Senha incorreta."); return; }
    setAuthenticated(true);
    setRequests(await res.json());
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    await fetchRequests(key);
  }

  useEffect(() => {
    if (authenticated) {
      const interval = setInterval(() => fetchRequests(key), 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, key, fetchRequests]);

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-slate-800 mb-6">🔒 Painel Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Senha de acesso"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Solicitações de viagem</h1>
            <p className="text-slate-500 text-sm mt-1">{requests.length} solicitação(ões)</p>
          </div>
          <button onClick={() => fetchRequests(key)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Atualizar
          </button>
        </div>

        {loading && <p className="text-slate-500 text-sm">Carregando...</p>}

        {requests.length === 0 && !loading && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📭</p>
            <p>Nenhuma solicitação ainda.</p>
          </div>
        )}

        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard key={req.id} req={req} adminKey={key} />
          ))}
        </div>
      </div>
    </main>
  );
}
