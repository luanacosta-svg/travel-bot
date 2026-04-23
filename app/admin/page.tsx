"use client";

import { useState, useEffect, useCallback } from "react";
import type { TravelRequest, FlightOption } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  options_sent: "Opções enviadas",
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

function formatPrice(price: string, currency: string) {
  return parseFloat(price).toLocaleString("pt-BR", { style: "currency", currency });
}

function FlightCard({
  flight,
  selected,
  onToggle,
}: {
  flight: FlightOption;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
        selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-semibold text-slate-800">{flight.airline}</span>
          <span className="ml-2 text-xs text-slate-500">
            {flight.stops === 0 ? "Direto" : `${flight.stops} escala(s)`}
          </span>
        </div>
        <span className="font-bold text-blue-600">
          {formatPrice(flight.price, flight.currency)}
        </span>
      </div>
      <div className="text-sm text-slate-600 space-y-1">
        <p>
          <span className="font-medium">Ida:</span> {flight.departure.airport}{" "}
          {formatDate(flight.departure.time)} → {flight.arrival.airport}{" "}
          {formatDate(flight.arrival.time)} · {flight.duration}
        </p>
        {flight.returnFlight && (
          <p>
            <span className="font-medium">Volta:</span>{" "}
            {flight.returnFlight.departure.airport}{" "}
            {formatDate(flight.returnFlight.departure.time)} →{" "}
            {flight.returnFlight.arrival.airport}{" "}
            {formatDate(flight.returnFlight.arrival.time)} ·{" "}
            {flight.returnFlight.duration}
          </p>
        )}
      </div>
      {selected && (
        <span className="inline-block mt-2 text-xs font-medium text-blue-600">
          ✓ Selecionado
        </span>
      )}
    </div>
  );
}

function RequestCard({ req, adminKey }: { req: TravelRequest; adminKey: string }) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function toggleFlight(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSend() {
    setSending(true);
    const res = await fetch("/api/send-options", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({
        requestId: req.id,
        selectedOptionIds: selectedIds,
        managerMessage: message,
      }),
    });
    setSending(false);
    if (res.ok) setSent(true);
  }

  const type =
    req.travel.type === "flight"
      ? "Passagem"
      : req.travel.type === "event"
      ? "Ingresso"
      : "Passagem + Ingresso";

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-semibold text-slate-800">{req.requester.name}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status]}`}
            >
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
            {" · "}
            {formatDate(req.createdAt)}
          </p>
        </div>
        <span className="text-slate-400 text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-100 pt-4 space-y-5">
          {/* Info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-slate-500">E-mail:</span>{" "}
              <a href={`mailto:${req.requester.email}`} className="text-blue-600">
                {req.requester.email}
              </a>
            </div>
            {req.requester.phone && (
              <div>
                <span className="text-slate-500">Telefone:</span> {req.requester.phone}
              </div>
            )}
            {req.travel.preferredTimes && (
              <div>
                <span className="text-slate-500">Horários:</span>{" "}
                {req.travel.preferredTimes}
              </div>
            )}
            <div>
              <span className="text-slate-500">Passageiros:</span>{" "}
              {req.travel.passengers}
            </div>
            {req.travel.notes && (
              <div className="col-span-2">
                <span className="text-slate-500">Obs:</span> {req.travel.notes}
              </div>
            )}
          </div>

          {/* Voos */}
          {req.flightOptions && req.flightOptions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Selecione as opções para enviar:
              </p>
              <div className="space-y-3">
                {req.flightOptions.map((f) => (
                  <FlightCard
                    key={f.id}
                    flight={f}
                    selected={selectedIds.includes(f.id)}
                    onToggle={() => toggleFlight(f.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {req.flightOptions?.length === 0 && req.travel.type !== "event" && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">
              Nenhum voo encontrado via API. Adicione as opções manualmente na mensagem
              abaixo.
            </p>
          )}

          {/* Mensagem + envio */}
          {!sent ? (
            <div className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Mensagem adicional para o solicitante (opcional)..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={sending}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors"
              >
                {sending ? "Enviando..." : "Enviar opções por e-mail"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3 font-medium">
              ✓ Opções enviadas para {req.requester.email}
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

  const fetchRequests = useCallback(
    async (adminKey: string) => {
      setLoading(true);
      const res = await fetch("/api/requests", {
        headers: { "x-admin-key": adminKey },
      });
      setLoading(false);
      if (res.status === 401) {
        setError("Senha incorreta.");
        return;
      }
      setAuthenticated(true);
      setRequests(await res.json());
    },
    []
  );

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
          <button
            onClick={() => fetchRequests(key)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
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
