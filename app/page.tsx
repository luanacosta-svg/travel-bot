"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TravelType = "flight" | "event" | "both";

export default function RequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<TravelType>("flight");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Erro no servidor");
      router.push("/success");
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
      setLoading(false);
    }
  }

  const needsFlight = type === "flight" || type === "both";
  const needsEvent = type === "event" || type === "both";

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-blue-600 rounded-t-2xl px-8 py-6">
          <h1 className="text-2xl font-bold text-white">✈ 49 Educação · Viagens</h1>
          <p className="text-blue-100 mt-1 text-sm">Preencha os dados da sua solicitação</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-b-2xl shadow-lg px-8 py-8 space-y-6"
        >
          {/* Dados pessoais */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Seus dados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome completo *
                </label>
                <input
                  name="name"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  E-mail *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  name="phone"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </section>

          {/* Tipo de solicitação */}
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Tipo de solicitação
            </h2>
            <input type="hidden" name="type" value={type} />
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { value: "flight", label: "✈ Passagem" },
                  { value: "event", label: "🎟 Ingresso" },
                  { value: "both", label: "✈🎟 Ambos" },
                ] as { value: TravelType; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    type === opt.value
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Dados de voo */}
          {needsFlight && (
            <section>
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
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: GRU, CGH, Guarulhos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Destino *
                  </label>
                  <input
                    name="destination"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: BSB, SDU, Brasília"
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
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Data de volta
                  </label>
                  <input
                    name="returnDate"
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Horários preferidos
                  </label>
                  <input
                    name="preferredTimes"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: manhã, depois das 14h"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nº de passageiros *
                  </label>
                  <input
                    name="passengers"
                    type="number"
                    min="1"
                    max="9"
                    defaultValue="1"
                    required={needsFlight}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Evento */}
          {needsEvent && (
            <section>
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
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome completo do evento"
                  />
                </div>
                {!needsFlight && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Destino / cidade do evento *
                    </label>
                    <input
                      name="destination"
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Observações
            </label>
            <textarea
              name="notes"
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Preferências, restrições, informações adicionais..."
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? "Enviando..." : "Enviar solicitação"}
          </button>
        </form>
      </div>
    </main>
  );
}
