"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { AIRPORTS } from "@/lib/airports";
import type { UserSession } from "@/types";

type TravelType = "flight" | "event" | "both";

export default function SolicitarPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<TravelType>("flight");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);
    if (!res.ok) { setError("Ocorreu um erro. Tente novamente."); return; }
    router.push("/minhas-solicitacoes?novo=1");
  }

  const needsFlight = type === "flight" || type === "both";
  const needsEvent = type === "event" || type === "both";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Nova solicitação" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Nova solicitação</h1>
          <p className="text-slate-500 text-sm mt-1">
            Preencha os dados e a equipe de compras entrará em contato.
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
                  name="name"
                  required
                  defaultValue={user?.name ?? ""}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail *</label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={user?.email ?? ""}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  WhatsApp
                </label>
                <input
                  name="phone"
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
                    name="origin"
                    required={needsFlight}
                    list="airports"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: GRU – São Paulo (Guarulhos)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Destino *
                  </label>
                  <input
                    name="destination"
                    required
                    list="airports"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: BSB – Brasília"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de ida *
                  </label>
                  <input
                    name="departureDate"
                    type="date"
                    required={needsFlight}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de volta
                  </label>
                  <input
                    name="returnDate"
                    type="date"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Horários preferidos
                  </label>
                  <input
                    name="preferredTimes"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: manhã, após 14h"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Passageiros *
                  </label>
                  <input
                    name="passengers"
                    type="number"
                    min="1"
                    max="9"
                    defaultValue="1"
                    required={needsFlight}
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
                    name="eventName"
                    required={needsEvent}
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
                      name="destination"
                      required
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
              name="notes"
              rows={3}
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
            {loading ? "Enviando..." : "Enviar solicitação"}
          </button>
        </form>
      </main>
    </div>
  );
}
