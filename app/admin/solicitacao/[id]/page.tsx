"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import type { TravelRequest } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}

function FileInput({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <div className="mt-3">
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <label className={`flex items-center gap-2 w-full border-2 border-dashed rounded-xl px-4 py-2.5 cursor-pointer transition text-sm
        ${file ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-400"}`}>
        <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
        <span>{file ? "📎" : "📤"}</span>
        <span className="truncate">{file ? file.name : "Anexar documento (opcional)"}</span>
        {file && <button type="button" onClick={(e) => { e.preventDefault(); onChange(null); }}
          className="ml-auto text-orange-400 hover:text-red-500 text-xs">✕</button>}
      </label>
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<TravelRequest | null>(null);
  const [message, setMessage] = useState("");
  const [purchaseInfo, setPurchaseInfo] = useState("");
  const [optionsFile, setOptionsFile] = useState<File | null>(null);
  const [purchaseFile, setPurchaseFile] = useState<File | null>(null);
  const [sendingOptions, setSendingOptions] = useState(false);
  const [markingPurchased, setMarkingPurchased] = useState(false);
  const [optionsSent, setOptionsSent] = useState(false);
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setReq(d);
        if (d.managerMessage) setMessage(d.managerMessage);
        if (d.purchaseInfo) setPurchaseInfo(d.purchaseInfo);
        if (d.status === "options_sent") setOptionsSent(true);
        if (d.status === "purchased") setPurchased(true);
      });
  }, [id]);

  async function handleSendOptions() {
    setSendingOptions(true);
    const formData = new FormData();
    formData.append("requestId", id);
    formData.append("managerMessage", message);
    if (optionsFile) formData.append("file", optionsFile);
    const res = await fetch("/api/send-options", { method: "POST", body: formData });
    setSendingOptions(false);
    if (res.ok) { setOptionsSent(true); setReq((r) => r ? { ...r, status: "options_sent" } : r); }
  }

  async function handleMarkPurchased() {
    setMarkingPurchased(true);
    const formData = new FormData();
    formData.append("requestId", id);
    formData.append("purchaseInfo", purchaseInfo);
    if (purchaseFile) formData.append("file", purchaseFile);
    const res = await fetch("/api/mark-purchased", { method: "POST", body: formData });
    setMarkingPurchased(false);
    if (res.ok) { setPurchased(true); setReq((r) => r ? { ...r, status: "purchased" } : r); }
  }

  if (!req) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header isAdmin title="Solicitação" />
        <div className="text-center py-20 text-slate-400">Carregando...</div>
      </div>
    );
  }

  const typeLabel = req.travel.type === "flight" ? "✈ Passagem"
    : req.travel.type === "event" ? "🎟 Ingresso" : "✈🎟 Passagem + Ingresso";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header isAdmin title="Solicitação" />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin")} className="text-slate-400 hover:text-slate-600 text-sm">
            ← Voltar
          </button>
        </div>

        {/* Info do solicitante */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{req.requester.name}</h1>
              <a href={`mailto:${req.requester.email}`} className="text-orange-500 text-sm">
                {req.requester.email}
              </a>
              {req.requester.phone && (
                <p className="text-slate-500 text-sm mt-0.5">{req.requester.phone}</p>
              )}
            </div>
            <StatusBadge status={req.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm border-t border-slate-100 pt-4">
            <div><span className="text-slate-400">Tipo:</span> <span className="text-slate-700">{typeLabel}</span></div>
            {req.travel.origin && <div><span className="text-slate-400">Origem:</span> <span className="text-slate-700">{req.travel.origin}</span></div>}
            <div><span className="text-slate-400">Destino:</span> <span className="text-slate-700">{req.travel.destination}</span></div>
            {req.travel.departureDate && <div><span className="text-slate-400">Ida:</span> <span className="text-slate-700">{req.travel.departureDate}</span></div>}
            {req.travel.returnDate && <div><span className="text-slate-400">Volta:</span> <span className="text-slate-700">{req.travel.returnDate}</span></div>}
            {req.travel.preferredTimes && <div><span className="text-slate-400">Horários:</span> <span className="text-slate-700">{req.travel.preferredTimes}</span></div>}
            <div><span className="text-slate-400">Passageiros:</span> <span className="text-slate-700">{req.travel.passengers}</span></div>
            {req.travel.eventName && <div><span className="text-slate-400">Evento:</span> <span className="text-slate-700">{req.travel.eventName}</span></div>}
            {req.travel.notes && <div className="col-span-2"><span className="text-slate-400">Obs:</span> <span className="text-slate-700">{req.travel.notes}</span></div>}
            <div className="col-span-2"><span className="text-slate-400">Solicitado em:</span> <span className="text-slate-700">{formatDate(req.createdAt)}</span></div>
          </div>
        </div>

        {/* Google Flights */}
        {req.flightSearchUrl && (
          <a
            href={req.flightSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-orange-300 hover:shadow-md transition group"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🔍</div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">Ver voos no Google Flights</p>
              <p className="text-sm text-slate-400">
                {req.travel.origin} → {req.travel.destination} · {req.travel.departureDate}
                {req.travel.returnDate ? ` · volta ${req.travel.returnDate}` : ""}
              </p>
            </div>
            <span className="text-slate-300 group-hover:text-orange-400 transition">↗</span>
          </a>
        )}

        {/* Enviar opções */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Responder ao solicitante</h2>
          <p className="text-sm text-slate-400 mb-4">
            Escreva as opções encontradas e clique em enviar — {req.requester.name} receberá por e-mail.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={`Ex: Encontrei 3 opções para você:\n\n1. LATAM — R$450 · Saída 07h10 → Chegada 08h30 (direto)\n2. Azul — R$390 · Saída 14h20 → Chegada 17h45 (1 escala)\n3. GOL — R$520 · Saída 18h00 → Chegada 19h20 (direto)`}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
          <FileInput label="Anexar documento (PDF, imagem, Word)" file={optionsFile} onChange={setOptionsFile} />
          {!optionsSent ? (
            <button
              onClick={handleSendOptions}
              disabled={sendingOptions || !message.trim()}
              className="mt-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition"
            >
              {sendingOptions ? "Enviando..." : "Enviar por e-mail"}
            </button>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2.5 flex-1">
                ✓ Enviado para {req.requester.email}
              </p>
              <button onClick={() => setOptionsSent(false)} className="text-xs text-slate-400 hover:text-slate-600 px-3">
                Reenviar
              </button>
            </div>
          )}
        </div>

        {/* Marcar como comprado */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Confirmar compra</h2>
          <p className="text-sm text-slate-400 mb-4">
            Após comprar, informe os dados abaixo — {req.requester.name} receberá a confirmação.
          </p>
          <textarea
            value={purchaseInfo}
            onChange={(e) => setPurchaseInfo(e.target.value)}
            rows={3}
            placeholder="Ex: Passagem comprada! Localizador: ABC123 · LATAM · Saída 07h10 · 10/05"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <FileInput label="Anexar bilhete / comprovante (opcional)" file={purchaseFile} onChange={setPurchaseFile} />
          {!purchased ? (
            <button
              onClick={handleMarkPurchased}
              disabled={markingPurchased || !purchaseInfo.trim()}
              className="mt-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition"
            >
              {markingPurchased ? "Salvando..." : "✓ Marcar como comprado e notificar"}
            </button>
          ) : (
            <p className="mt-3 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2.5">
              ✓ Compra confirmada e {req.requester.name} foi notificado(a)
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
