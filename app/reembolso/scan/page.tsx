"use client";
export const dynamic = "force-dynamic";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import type { UserSession } from "@/types";

const CATEGORIAS = ["Alimentação", "Transporte", "Hospedagem", "Material", "Serviço", "Outro"];

interface ScannedItem {
  fileName: string;
  ok: boolean;
  file?: File;
  data: {
    valor: number | null;
    data: string | null;
    descricao: string | null;
    estabelecimento: string | null;
    categoria: string;
  };
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ReembolsoScanPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [step, setStep] = useState<"upload" | "reviewing" | "submitting">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setUser(d.user ?? null));
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const valid = files.filter(f =>
      f.type.startsWith("image/") || f.type === "application/pdf" ||
      f.name.endsWith(".pdf") || f.name.endsWith(".xml")
    ).slice(0, 20);

    if (!valid.length) return;

    setScanning(true);
    setScanProgress(0);
    setStep("reviewing");

    // Manda em lotes de 5 para mostrar progresso
    const BATCH = 5;
    const allResults: ScannedItem[] = [];

    for (let i = 0; i < valid.length; i += BATCH) {
      const batch = valid.slice(i, i + BATCH);
      const fd = new FormData();
      batch.forEach(f => fd.append("files", f));

      try {
        const res = await fetch("/api/reembolso/scan", { method: "POST", body: fd });
        const json = await res.json();
        if (res.ok && json.results) {
          json.results.forEach((r: ScannedItem, idx: number) => {
            allResults.push({ ...r, file: batch[idx] });
          });
        }
      } catch {
        batch.forEach((f, idx) => {
          allResults.push({
            fileName: f.name,
            ok: false,
            file: batch[idx],
            data: { valor: null, data: null, descricao: f.name, estabelecimento: null, categoria: "Outro" },
          });
        });
      }

      setScanProgress(Math.round(((i + batch.length) / valid.length) * 100));
    }

    setItems(allResults);
    setScanning(false);
  }, []);

  function updateItem(idx: number, field: keyof ScannedItem["data"], value: string | number | null) {
    setItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, data: { ...item.data, [field]: value } } : item
    ));
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  const total = items.reduce((sum, it) => sum + (Number(it.data.valor) || 0), 0);

  async function handleSubmit() {
    setSubmitError("");
    setStep("submitting");

    try {
      const fd = new FormData();
      fd.append("itemCount", String(items.length));

      items.forEach((item, i) => {
        fd.append(`description_${i}`, item.data.descricao || item.fileName);
        fd.append(`amount_${i}`, String(item.data.valor ?? 0));
        fd.append(`date_${i}`, item.data.data ?? "");
        fd.append(`category_${i}`, item.data.categoria ?? "Outro");
        fd.append(`establishment_${i}`, item.data.estabelecimento ?? "");
        if (item.file) fd.append(`file_${i}`, item.file);
      });

      const res = await fetch("/api/reembolso/submit", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setSubmitError(d.error ?? "Erro ao enviar"); setStep("reviewing"); return; }
      router.push("/minhas-solicitacoes?novo=1");
    } catch {
      setSubmitError("Erro de conexão. Tente novamente.");
      setStep("reviewing");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Reembolso" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reembolso inteligente</h1>
            <p className="text-slate-500 text-sm mt-1">Envie os comprovantes e a IA organiza tudo automaticamente</p>
          </div>
          <a href="/reembolso" className="text-sm text-slate-500 hover:text-orange-500 font-semibold transition">
            ← Formulário manual
          </a>
        </div>

        {/* STEP 1 — Upload */}
        {step === "upload" && (
          <div
            className={`border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center transition cursor-pointer ${
              dragOver ? "border-orange-500 bg-orange-50 scale-[1.01]" : "border-slate-200 hover:border-orange-300 hover:bg-orange-50/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(Array.from(e.dataTransfer.files));
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
            />
            <span className="text-5xl mb-4">{dragOver ? "📂" : "🧾"}</span>
            <p className="text-lg font-bold text-slate-700 mb-1">
              {dragOver ? "Solte os comprovantes aqui" : "Arraste os comprovantes aqui"}
            </p>
            <p className="text-sm text-slate-400 mb-4">ou clique para selecionar · até 20 arquivos · PDF, JPG, PNG</p>
            <div className="flex items-center gap-2 bg-orange-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl">
              ✨ Analisar com IA
            </div>
          </div>
        )}

        {/* STEP 2 — Scanning progress */}
        {step === "reviewing" && scanning && (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center space-y-4">
            <div className="text-4xl animate-bounce">🤖</div>
            <p className="font-bold text-slate-800 text-lg">Analisando comprovantes...</p>
            <p className="text-sm text-slate-500">Claude está lendo cada comprovante e extraindo os dados</p>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="text-sm font-semibold text-orange-600">{scanProgress}%</p>
          </div>
        )}

        {/* STEP 2 — Review table */}
        {step === "reviewing" && !scanning && items.length > 0 && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-orange-700">
                ✅ {items.length} comprovente{items.length > 1 ? "s" : ""} analisado{items.length > 1 ? "s" : ""} — revise e ajuste se precisar
              </p>
              <p className="text-sm font-bold text-orange-800">Total: {formatCurrency(total)}</p>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className={`bg-white border rounded-2xl p-4 space-y-3 ${item.ok ? "border-slate-100" : "border-amber-200 bg-amber-50"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{item.ok ? "📄" : "⚠️"}</span>
                      <p className="text-xs text-slate-400 truncate">{item.fileName}</p>
                    </div>
                    <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-400 transition shrink-0 text-lg">✕</button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.data.valor ?? ""}
                        onChange={(e) => updateItem(idx, "valor", parseFloat(e.target.value) || null)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Data</label>
                      <input
                        type="date"
                        value={item.data.data ?? ""}
                        onChange={(e) => updateItem(idx, "data", e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
                      <select
                        value={item.data.categoria}
                        onChange={(e) => updateItem(idx, "categoria", e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                      >
                        {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Estabelecimento</label>
                      <input
                        value={item.data.estabelecimento ?? ""}
                        onChange={(e) => updateItem(idx, "estabelecimento", e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                        placeholder="Ex: Uber, iFood..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição</label>
                    <input
                      value={item.data.descricao ?? ""}
                      onChange={(e) => updateItem(idx, "descricao", e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                      placeholder="Descrição da despesa"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Adicionar mais */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 hover:border-orange-300 rounded-2xl py-4 text-sm font-semibold text-slate-400 hover:text-orange-500 transition"
            >
              + Adicionar mais comprovantes
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
            />

            {submitError && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">{submitError}</div>
            )}

            <div className="flex gap-3 pt-2 pb-8">
              <button
                onClick={() => { setItems([]); setStep("upload"); }}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold py-3.5 rounded-xl hover:border-slate-300 transition text-sm"
              >
                Recomeçar
              </button>
              <button
                onClick={handleSubmit}
                disabled={items.length === 0 || total === 0}
                className="flex-[2] bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm"
              >
                Enviar lote — {formatCurrency(total)}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Submitting */}
        {step === "submitting" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center space-y-3">
            <div className="text-4xl animate-spin">⏳</div>
            <p className="font-bold text-slate-800">Enviando solicitação...</p>
          </div>
        )}
      </main>
    </div>
  );
}
