"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import type { UserSession } from "@/types";

const CATEGORIES = ["Alimentação", "Transporte", "Hospedagem", "Material", "Outros"];

interface ExpenseItem {
  id: number;
  description: string;
  category: string;
  date: string;
  amount: string;
  file: File | null;
  fileName: string;
}

function newItem(id: number): ExpenseItem {
  return { id, description: "", category: "alimentação", date: "", amount: "", file: null, fileName: "" };
}

export default function ReembolsoPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [items, setItems] = useState<ExpenseItem[]>([newItem(1)]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null));
  }, []);

  function updateItem(id: number, updates: Partial<ExpenseItem>) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  }

  function addItem() {
    setItems((prev) => [...prev, newItem(Date.now())]);
  }

  function removeItem(id: number) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      for (const item of items) {
        const formData = new FormData();
        formData.append("description", item.description);
        formData.append("category", item.category);
        formData.append("date", item.date);
        formData.append("amount", item.amount);
        if (item.file) formData.append("receiptFile", item.file);

        const res = await fetch("/api/reembolso/submit", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Erro ao enviar item");
      }
      router.push("/minhas-solicitacoes?novo=1");
    } catch {
      setError("Erro ao enviar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Reembolso" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Solicitar reembolso</h1>
          <p className="text-slate-500 text-sm mt-1">Adicione uma ou mais despesas de uma vez.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Despesa {items.length > 1 ? index + 1 : ""}
                </span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(item.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition font-medium">
                    ✕ Remover
                  </button>
                )}
              </div>

              <div className="px-5 pb-5 space-y-3">
                {/* Descrição + upload lado a lado */}
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Descrição *</label>
                    <input
                      required
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Ex: Almoço com cliente, Uber..."
                    />
                  </div>

                  {/* Upload comprovante */}
                  <div className="flex-shrink-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Comprovante</label>
                    <label className={`flex flex-col items-center justify-center w-20 h-[38px] border-2 border-dashed rounded-xl cursor-pointer transition text-center
                      ${item.fileName ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-orange-300 hover:bg-orange-50"}`}>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          updateItem(item.id, { file: f, fileName: f?.name ?? "" });
                        }}
                      />
                      <span className="text-lg leading-none">{item.fileName ? "📎" : "📤"}</span>
                    </label>
                    {item.fileName && (
                      <p className="text-xs text-orange-600 mt-1 w-20 truncate">{item.fileName}</p>
                    )}
                  </div>
                </div>

                {/* Categoria, Data, Valor */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Categoria *</label>
                    <select
                      required
                      value={item.category}
                      onChange={(e) => updateItem(item.id, { category: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c.toLowerCase()}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Data *</label>
                    <input
                      type="date"
                      required
                      value={item.date}
                      onChange={(e) => updateItem(item.id, { date: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={item.amount}
                      onChange={(e) => updateItem(item.id, { amount: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Botão adicionar */}
          <button
            type="button"
            onClick={addItem}
            className="w-full border-2 border-dashed border-slate-300 hover:border-orange-400 hover:bg-orange-50 text-slate-500 hover:text-orange-600 font-semibold py-3 rounded-2xl transition text-sm flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Adicionar outra despesa
          </button>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3.5 rounded-xl transition text-sm"
          >
            {loading ? "Enviando..." : `Enviar ${items.length > 1 ? `${items.length} despesas` : "solicitação"}`}
          </button>
        </form>
      </main>
    </div>
  );
}
