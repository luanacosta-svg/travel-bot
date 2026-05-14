"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { AIRPORTS } from "@/lib/airports";
import type { UserSession, TravelRequest } from "@/types";

type TravelType = "flight" | "event" | "both";

function SolicitarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [user,       setUser]       = useState<UserSession | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(!!editId);
  const [error,      setError]      = useState("");
  const [type,       setType]       = useState<TravelType>("flight");

  // Controlled fields (needed for edit pre-fill)
  const [origin,          setOrigin]          = useState("");
  const [destination,     setDestination]     = useState("");
  const [departureDate,   setDepartureDate]   = useState("");
  const [returnDate,      setReturnDate]      = useState("");
  const [preferredTimes,  setPreferredTimes]  = useState("");
  const [passengers,      setPassengers]      = useState("1");
  const [eventName,       setEventName]       = useState("");
  const [notes,           setNotes]           = useState("");
  const [phone,           setPhone]           = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null));
  }, []);

  // Load existing request for edit mode
  useEffect(() => {
    if (!editId) return;
    fetch("/api/requests/mine")
      .then((r) => r.json())
      .then((list: TravelRequest[]) => {
        const req = list.find((r) => r.id === editId);
        if (req && req.status === "pending") {
          const t = req.travel;
          setType((t.type as TravelType) ?? "flight");
          setOrigin(t.origin ?? "");
          setDestination(t.destination ?? "");
          setDepartureDate(t.departureDate ?? "");
          setReturnDate(t.returnDate ?? "");
          setPreferredTimes(t.preferredTimes ?? "");
          setPassengers(String(t.passengers ?? 1));
          setEventName(t.eventName ?? "");
          setNotes(t.notes ?? "");
          setPhone(req.requester.phone ?? "");
        } else if (req && req.status !== "pending") {
          setError("Só é possível editar solicitações com status 'Em análise'.");
        }
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [editId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      type,
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone,
      origin,
      destination,
      departureDate,
      returnDate,
      preferredTimes,
      passengers,
      eventName,
      notes,
    };

    let res: Response;
    if (editId) {
      // Update existing request
      res = await fetch(`/api/requests/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ travel: payload }),
      });
    } else {
      res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setLoading(false);
    if (!res.ok) { setError("Ocorreu um erro. Tente novamente."); return; }
    router.push("/minhas-solicitacoes?novo=1");
  }

  const needsFlight = type === "flight" || type === "both";
  const needsEvent = type === "event" || type === "both";

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header user={user ?? undefined} title={editId ? "Editar solicitação" : "Nova solicitação"} />
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-32 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title={editId ? "Editar solicitação" : "Nova solicitação"} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          {editId && (
            <a href="/minhas-solicitacoes" className="inline-flex items-center gap-1 text-sm text-slate-500 font-semibold hover:text-orange-500 transition mb-3 block">
              ← Voltar para minhas solicitações
            </a>
          )}
          <h1 className="text-2xl font-bold text-slate-800">
            {editId ? "Editar solicitação" : "Nova solicitação"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {editId
              ? "Atualize os dados abaixo. Só é possível editar enquanto a solicitação estiver em análise."
              : "Preencha os dados e a equipe de compras entrará em contato."}
          </p>
        </div>

        {/* Datalist de aeroportos */}
        <datalist id="airports">
          {AIRPORTS.map((a) => <option key={a} value={a} />)}
        </datalist>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Tipo de solicitação
            </h2>
            <input type="hidden" name="type" value={type} />
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { value: "flight", icon: "✈", label: "Passagem" },
                  { value: "event", icon: "🎟", label: "Ingresso" },
                  { value: "both", icon: "🗓", label: "Ambos" },
                ] as { value: TravelType; icon: string; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    type === opt.value
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Seus dados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  required
                  value={user?.name ?? ""}
                  readOnly
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={user?.email ?? ""}
                  readOnly
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  WhatsApp
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Voo */}
          {needsFlight && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Dados da viagem
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cidade / aeroporto de origem *
                  </label>
                  <input
                    required={needsFlight}
                    list="airports"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: GRU – São Paulo (Guarulhos)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Destino *
                  </label>
                  <input
                    required
                    list="airports"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: BSB – Brasília"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de ida *
                  </label>
                  <input
                    type="date"
                    required={needsFlight}
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de volta
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Horários preferidos
                  </label>
                  <input
                    value={preferredTimes}
                    onChange={(e) => setPreferredTimes(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: manhã, após 14h"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Passageiros *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    required={needsFlight}
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Evento */}
          {needsEvent && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Dados do evento
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome do evento *
                  </label>
                  <input
                    required={needsEvent}
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Nome completo do evento"
                  />
                </div>
                {!needsFlight && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Cidade do evento *
                    </label>
                    <input
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observações
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Preferências, restrições alimentares, bagagem, necessidades especiais..."
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3.5 rounded-xl transition text-sm"
          >
            {loading
              ? "Enviando..."
              : editId ? "Salvar alterações" : "Enviar solicitação"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function SolicitarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    }>
      <SolicitarForm />
    </Suspense>
  );
}
