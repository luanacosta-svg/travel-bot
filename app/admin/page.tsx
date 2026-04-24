"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import type { TravelRequest, ReimbursementRequest, InvoiceUpload } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const REIMB_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-800" },
  approved: { label: "Aprovado ✓", color: "bg-green-100 text-green-800" },
  rejected: { label: "Recusado", color: "bg-red-100 text-red-800" },
};

const INV_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-800" },
  received: { label: "Recebido ✓", color: "bg-green-100 text-green-800" },
};

type Tab = "travels" | "reimbursements" | "invoices";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("travels");
  const [travels, setTravels] = useState<TravelRequest[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [invoices, setInvoices] = useState<InvoiceUpload[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [t, r, i] = await Promise.all([
      fetch("/api/requests").then((res) => res.ok ? res.json() : []),
      fetch("/api/reembolso/all").then((res) => res.ok ? res.json() : []),
      fetch("/api/notas-fiscais/all").then((res) => res.ok ? res.json() : []),
    ]);
    setTravels(Array.isArray(t) ? t : []);
    setReimbursements(Array.isArray(r) ? r : []);
    setInvoices(Array.isArray(i) ? i : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const tabs = [
    { key: "travels" as Tab, label: "Viagens", count: travels.length, pending: travels.filter((r) => r.status === "pending").length },
    { key: "reimbursements" as Tab, label: "Reembolsos", count: reimbursements.length, pending: reimbursements.filter((r) => r.status === "pending").length },
    { key: "invoices" as Tab, label: "Notas Fiscais", count: invoices.length, pending: invoices.filter((i) => i.status === "pending").length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header isAdmin title="Painel Admin" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-2xl p-5 text-left transition-all bg-white border-2 ${tab === t.key ? "border-orange-500 shadow-md" : "border-slate-200 hover:border-orange-300"}`}
            >
              <p className="text-3xl font-bold text-slate-800">{t.count}</p>
              <p className="text-sm font-semibold text-slate-600 mt-1">{t.label}</p>
              {t.pending > 0 && (
                <p className="text-xs text-amber-600 mt-1 font-medium">{t.pending} pendente(s)</p>
              )}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
            >
              {t.label}
              {t.pending > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">{t.pending}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-end mb-3">
          <button onClick={fetchAll} className="text-sm text-orange-500 hover:text-orange-600 font-medium">Atualizar</button>
        </div>

        {loading && <div className="text-center py-12 text-slate-400">Carregando...</div>}

        {/* Viagens */}
        {tab === "travels" && !loading && (
          <div className="space-y-3">
            {travels.length === 0 && <Empty />}
            {travels.map((req) => (
              <div key={req.id} className="relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
                <a href={`/admin/solicitacao/${req.id}`} className="block p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <StatusBadge status={req.status} />
                        <span className="text-xs text-slate-400">{req.travel.type === "flight" ? "✈ Passagem" : req.travel.type === "event" ? "🎟 Ingresso" : "✈🎟 Ambos"}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{req.requester.name} <span className="font-normal text-slate-400 text-sm">→ {req.travel.destination}{req.travel.eventName ? ` · ${req.travel.eventName}` : ""}</span></p>
                      <p className="text-sm text-slate-400 mt-0.5">{req.requester.email}{req.travel.departureDate ? ` · ${req.travel.departureDate}` : ""} · {formatDate(req.createdAt)}</p>
                    </div>
                    <span className="text-slate-300 group-hover:text-orange-400 transition mt-1">→</span>
                  </div>
                </a>
                <DeleteButton onDelete={async () => { await fetch(`/api/requests/${req.id}`, { method: "DELETE" }); fetchAll(); }} />
              </div>
            ))}
          </div>
        )}

        {/* Reembolsos */}
        {tab === "reimbursements" && !loading && (
          <div className="space-y-3">
            {reimbursements.length === 0 && <Empty />}
            {reimbursements.map((req) => (
              <ReimbursementCard key={req.id} req={req} onUpdate={fetchAll} />
            ))}
          </div>
        )}

        {/* Notas Fiscais */}
        {tab === "invoices" && !loading && (
          <div className="space-y-3">
            {invoices.length === 0 && <Empty />}
            {invoices.map((inv) => (
              <InvoiceCard key={inv.id} inv={inv} onUpdate={fetchAll} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
      <p className="text-4xl mb-3">📭</p>
      <p className="text-slate-500">Nenhum item aqui.</p>
    </div>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <div className="absolute top-3 right-3 flex gap-1">
      <button onClick={onDelete} className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg font-medium">Confirmar</button>
      <button onClick={() => setConfirm(false)} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-lg font-medium">Cancelar</button>
    </div>
  );
  return (
    <button onClick={() => setConfirm(true)} className="absolute top-3 right-3 text-slate-300 hover:text-red-400 transition text-lg leading-none" title="Excluir">🗑</button>
  );
}

function ReimbursementCard({ req, onUpdate }: { req: ReimbursementRequest; onUpdate: () => void; }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(req.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const s = REIMB_STATUS[req.status];

  async function updateStatus(status: string) {
    setSaving(true);
    await fetch(`/api/reembolso/${req.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: note }),
    });
    setSaving(false);
    onUpdate();
  }

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <DeleteButton onDelete={async () => { await fetch(`/api/reembolso/${req.id}`, { method: "DELETE" }); onUpdate(); }} />
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left p-5 hover:bg-slate-50 transition">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
              <span className="text-xs text-slate-400">💸 Reembolso</span>
            </div>
            <p className="font-semibold text-slate-800">{req.requester.name} <span className="font-normal text-slate-400 text-sm">· {req.expense.description}</span></p>
            <p className="text-sm text-slate-400">{req.requester.email} · {formatCurrency(req.expense.amount)} · {req.expense.date}</p>
          </div>
          <span className="text-slate-300 pr-6">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">Categoria:</span> <span className="text-slate-700 capitalize">{req.expense.category}</span></div>
            <div><span className="text-slate-400">Data:</span> <span className="text-slate-700">{req.expense.date}</span></div>
            <div><span className="text-slate-400">Valor:</span> <span className="text-slate-700 font-semibold">{formatCurrency(req.expense.amount)}</span></div>
          </div>

          {req.expense.receiptFile && (
            <a href={`/api/files/${req.expense.receiptFile}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
              📎 Ver comprovante
            </a>
          )}

          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Observação (opcional)..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />

          <div className="flex gap-2">
            <button onClick={() => updateStatus("approved")} disabled={saving || req.status === "approved"}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
              ✓ Aprovar
            </button>
            <button onClick={() => updateStatus("rejected")} disabled={saving || req.status === "rejected"}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
              ✗ Recusar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InvoiceCard({ inv, onUpdate }: { inv: InvoiceUpload; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const s = INV_STATUS[inv.status];

  async function markReceived() {
    setSaving(true);
    await fetch(`/api/notas-fiscais/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "received" }),
    });
    setSaving(false);
    onUpdate();
  }

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <DeleteButton onDelete={async () => { await fetch(`/api/notas-fiscais/${inv.id}`, { method: "DELETE" }); onUpdate(); }} />
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left p-5 hover:bg-slate-50 transition">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
              <span className="text-xs text-slate-400">🧾 Nota Fiscal</span>
            </div>
            <p className="font-semibold text-slate-800">{inv.requester.name} <span className="font-normal text-slate-400 text-sm">· {inv.invoice.description}</span></p>
            <p className="text-sm text-slate-400">{inv.invoice.companyName} · {formatCurrency(inv.invoice.amount)} · {formatDate(inv.createdAt)}</p>
          </div>
          <span className="text-slate-300 pr-6">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">Empresa:</span> <span className="text-slate-700">{inv.invoice.companyName}</span></div>
            {inv.invoice.cnpj && <div><span className="text-slate-400">CNPJ:</span> <span className="text-slate-700">{inv.invoice.cnpj}</span></div>}
            <div><span className="text-slate-400">Valor:</span> <span className="text-slate-700 font-semibold">{formatCurrency(inv.invoice.amount)}</span></div>
          </div>

          <a href={`/api/files/${inv.invoice.invoiceFile}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
            📄 Ver nota fiscal
          </a>

          {inv.status === "pending" && (
            <button onClick={markReceived} disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
              ✓ Confirmar recebimento
            </button>
          )}
        </div>
      )}
    </div>
  );
}
