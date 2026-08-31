"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import type { UserSession } from "@/types";

export default function NotasFiscaisPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Campos controlados (preenchidos pela IA ao subir o arquivo)
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [amount, setAmount] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null));
  }, []);

  // ── IA: lê a NF e preenche os campos ──────────────────────────────
  async function scanFile(file: File) {
    setScanning(true);
    setScanMsg("🤖 Lendo a nota fiscal...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/notas-fiscais/scan", { method: "POST", body: fd });
      const json = await res.json();
      const d = json?.data ?? {};
      const filled: string[] = [];
      if (d.numero)      { setInvoiceNumber(String(d.numero)); filled.push("número"); }
      if (d.dataEmissao) { setInvoiceDate(d.dataEmissao);      filled.push("data"); }
      if (d.valor != null && !isNaN(d.valor)) { setAmount(String(d.valor)); filled.push("valor"); }
      setScanMsg(filled.length > 0
        ? `✅ Preenchido automaticamente: ${filled.join(", ")} — confira antes de enviar!`
        : "Não consegui ler os dados — preencha manualmente.");
    } catch {
      setScanMsg("Não consegui ler os dados — preencha manualmente.");
    } finally {
      setScanning(false);
      setTimeout(() => setScanMsg(""), 8000);
    }
  }

  function handleFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    scanFile(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/notas-fiscais/submit", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao enviar. Tente novamente.");
      return;
    }
    router.push("/minhas-solicitacoes?novo=1");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Nota Fiscal" />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Enviar nota fiscal</h1>
          <p className="text-slate-500 text-sm mt-1">Suba o arquivo — a IA preenche os dados pra você conferir.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Upload NF (primeiro: subiu, IA preenche o resto) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Arquivo da nota fiscal *</h2>
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition cursor-pointer ${
                dragOver
                  ? "border-orange-500 bg-orange-100 scale-[1.01]"
                  : scanning
                  ? "border-orange-300 bg-orange-50"
                  : fileName
                  ? "border-orange-400 bg-orange-50"
                  : "border-slate-200 hover:border-orange-300 hover:bg-orange-50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file && fileInputRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  fileInputRef.current.files = dt.files;
                  handleFile(file);
                }
              }}
            >
              <input
                ref={fileInputRef}
                name="invoiceFile"
                type="file"
                accept="image/*,.pdf,.xml"
                required
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              {scanning ? (
                <>
                  <span className="text-3xl mb-2 animate-pulse">🤖</span>
                  <p className="text-sm font-semibold text-orange-600">{scanMsg}</p>
                  <p className="text-xs text-slate-400 mt-1">{fileName}</p>
                </>
              ) : fileName ? (
                <>
                  <span className="text-3xl mb-2">📄</span>
                  <p className="text-sm font-semibold text-orange-600">{fileName}</p>
                  <p className="text-xs text-slate-400 mt-1">Clique ou arraste para trocar</p>
                </>
              ) : (
                <>
                  <span className="text-3xl mb-2">{dragOver ? "📂" : "✨"}</span>
                  <p className="text-sm font-semibold text-slate-600">
                    {dragOver ? "Solte o arquivo aqui" : "Arraste a NF aqui — a IA preenche os dados"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, XML, JPG ou PNG · máx. 10MB</p>
                </>
              )}
            </div>
            {!scanning && scanMsg && (
              <p className="mt-3 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">{scanMsg}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Dados da nota fiscal</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número da NF *</label>
                <input
                  name="invoiceNumber"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: 38"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data de emissão *</label>
                <input
                  name="invoiceDate"
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor da NF (R$) *</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0,00"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

          <button
            type="submit"
            disabled={loading || scanning}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3.5 rounded-xl transition text-sm"
          >
            {loading ? "Enviando..." : "Enviar nota fiscal"}
          </button>
        </form>
      </main>
    </div>
  );
}
