"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import type { UserSession } from "@/types";

const CATEGORIES = ["Alimentação", "Transporte", "Hospedagem", "Material", "Outros"];

export default function ReembolsoPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/reembolso/submit", {
      method: "POST",
      body: formData,
    });

    setLoading(false);
    if (!res.ok) { setError("Erro ao enviar. Tente novamente."); return; }
    router.push("/minhas-solicitacoes?novo=1");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Reembolso" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Solicitar reembolso</h1>
          <p className="text-slate-500 text-sm mt-1">Preencha os dados da despesa e anexe o comprovante.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Dados da despesa</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
              <input
                name="description"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: Almoço com cliente, Uber para reunião..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
                <select
                  name="category"
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c.toLowerCase()}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
                <input
                  name="date"
                  type="date"
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$) *</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Upload comprovante */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Comprovante de pagamento</h2>
            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition ${fileName ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-orange-300 hover:bg-orange-50"}`}>
              <input
                name="receiptFile"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
              {fileName ? (
                <>
                  <span className="text-2xl mb-2">📎</span>
                  <p className="text-sm font-medium text-orange-600">{fileName}</p>
                  <p className="text-xs text-slate-400 mt-1">Clique para trocar</p>
                </>
              ) : (
                <>
                  <span className="text-2xl mb-2">📤</span>
                  <p className="text-sm font-medium text-slate-600">Clique para anexar</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, JPG ou PNG · máx. 10MB</p>
                </>
              )}
            </label>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

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
