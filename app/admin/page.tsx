"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import type { TravelRequest, ReimbursementRequest, InvoiceUpload } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}
function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
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

function exportCSV(rows: string[][], filename: string) {
  const content = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("travels");
  const [travels, setTravels] = useState<TravelRequest[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [invoices, setInvoices] = useState<InvoiceUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  function matchesFilter(name: string, email: string, createdAt: string) {
    const q = search.toLowerCase();
    if (q && !name.toLowerCase().includes(q) && !email.toLowerCase().includes(q)) return false;
    if (dateFrom && createdAt < dateFrom) return false;
    if (dateTo && createdAt > dateTo + "T23:59:59") return false;
    return true;
  }

  const filteredTravels = useMemo(() => travels.filter((r) => matchesFilter(r.requester.name, r.requester.email, r.createdAt)), [travels, search, dateFrom, dateTo]);
  const filteredReimb = useMemo(() => reimbursements.filter((r) => matchesFilter(r.requester.name, r.requester.email, r.createdAt)), [reimbursements, search, dateFrom, dateTo]);
  const filteredInv = useMemo(() => invoices.filter((i) => matchesFilter(i.requester.name, i.requester.email, i.createdAt)), [invoices, search, dateFrom, dateTo]);

  const reimbTotal = filteredReimb.reduce((s, r) => s + r.expense.amount, 0);
  const invTotal = filteredInv.reduce((s, i) => s + i.invoice.amount, 0);

  const tabs = [
    { key: "travels" as Tab, label: "Viagens", count: travels.length, pending: travels.filter((r) => r.status === "pending").length },
    { key: "reimbursements" as Tab, label: "Reembolsos", count: reimbursements.length, pending: reimbursements.filter((r) => r.status === "pending").length },
    { key: "invoices" as Tab, label: "Notas Fiscais", count: invoices.length, pending: invoices.filter((i) => i.status === "pending").length },
  ];

  function handleExport() {
    if (tab === "reimbursements") {
      exportCSV(
        [["Nome", "Email", "Descrição", "Categoria", "Data", "Valor", "Status", "Observação", "Enviado em"],
         ...filteredReimb.map((r) => [r.requester.name, r.requester.email, r.expense.description, r.expense.category, r.expense.date, r.expense.amount.toFixed(2), r.status, r.adminNote ?? "", formatDateShort(r.createdAt)])],
        `reembolsos-${new Date().toISOString().slice(0,10)}.csv`
      );
    } else if (tab === "invoices") {
      exportCSV(
        [["Nome", "Email", "Descrição", "Empresa", "CNPJ", "Valor", "Status", "Enviado em"],
         ...filteredInv.map((i) => [i.requester.name, i.requester.email, i.invoice.description, i.invoice.companyName, i.invoice.cnpj ?? "", i.invoice.amount.toFixed(2), i.status, formatDateShort(i.createdAt)])],
        `notas-fiscais-${new Date().toISOString().slice(0,10)}.csv`
      );
    } else {
      exportCSV(
        [["Nome", "Email", "Destino", "Evento", "Tipo", "Data ida", "Status", "Enviado em"],
         ...filteredTravels.map((r) => [r.requester.name, r.requester.email, r.travel.destination, r.travel.eventName ?? "", r.travel.type, r.travel.departureDate ?? "", r.status, formatDateShort(r.createdAt)])],
        `viagens-${new Date().toISOString().slice(0,10)}.csv`
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header isAdmin title="Painel Admin" />
      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-2xl p-5 text-left transition-all bg-white border-2 ${tab === t.key ? "border-orange-500 shadow-md" : "border-slate-200 hover:border-orange-300"}`}>
              <p className="text-3xl font-bold text-slate-800">{t.count}</p>
              <p className="text-sm font-semibold text-slate-600 mt-1">{t.label}</p>
              {t.pending > 0 && <p className="text-xs text-amber-600 mt-1 font-medium">{t.pending} pendente(s)</p>}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
              {t.pending > 0 && <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5">{t.pending}</span>}
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-slate-500 mb-1">Buscar por nome ou email</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex: João, joao@empresa.com..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">De</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Até</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          {(search || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}
              className="text-sm text-slate-400 hover:text-slate-600 transition">✕ Limpar</button>
          )}
        </div>

        {/* Total + ações */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-500">
            {tab === "reimbursements" && filteredReimb.length > 0 && (
              <span>
                {filteredReimb.length} item(ns) · Total: <span className="font-semibold text-slate-800">{formatCurrency(reimbTotal)}</span>
                {" · "}Aprovados: <span className="font-semibold text-green-700">{formatCurrency(filteredReimb.filter(r => r.status === "approved").reduce((s,r) => s + r.expense.amount, 0))}</span>
              </span>
            )}
            {tab === "invoices" && filteredInv.length > 0 && (
              <span>{filteredInv.length} item(ns) · Total: <span className="font-semibold text-slate-800">{formatCurrency(invTotal)}</span></span>
            )}
            {tab === "travels" && filteredTravels.length > 0 && (
              <span>{filteredTravels.length} solicitação(ões)</span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="text-sm text-green-600 hover:text-green-700 font-medium border border-green-200 rounded-lg px-3 py-1.5 transition">
              ↓ Exportar CSV
            </button>
            <button onClick={fetchAll} className="text-sm text-orange-500 hover:text-orange-600 font-medium">Atualizar</button>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-slate-400">Carregando...</div>}

        {/* Viagens */}
        {tab === "travels" && !loading && (
          <div className="space-y-3">
            {filteredTravels.length === 0 && <Empty />}
            {filteredTravels.map((req) => (
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
                    <span className="text-slate-300 group-hover:text-orange-400 transition mt-1 pr-6">→</span>
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
            {filteredReimb.length === 0 && <Empty />}
            {filteredReimb.map((req) => <ReimbursementCard key={req.id} req={req} onUpdate={fetchAll} />)}
          </div>
        )}

        {/* Notas Fiscais */}
        {tab === "invoices" && !loading && (
          <div className="space-y-3">
            {filteredInv.length === 0 && <Empty />}
            {filteredInv.map((inv) => <InvoiceCard key={inv.id} inv={inv} onUpdate={fetchAll} />)}
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
    <div className="absolute top-3 right-3 flex gap-1 z-10">
      <button onClick={onDelete} className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg font-medium">Confirmar</button>
      <button onClick={() => setConfirm(false)} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-lg font-medium">Cancelar</button>
    </div>
  );
  return (
    <button onClick={() => setConfirm(true)} className="absolute top-3 right-3 text-slate-300 hover:text-red-400 transition text-lg leading-none z-10" title="Excluir">🗑</button>
  );
}

function ReimbursementCard({ req, onUpdate }: { req: ReimbursementRequest; onUpdate: () => void }) {
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
          <div className="flex-1 min-w-0">
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
            <div><span className="text-slate-400">Enviado:</span> <span className="text-slate-700">{formatDate(req.createdAt)}</span></div>
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

          {req.history && req.history.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Histórico</p>
              <div className="space-y-1">
                {req.history.map((h, i) => (
                  <p key={i} className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{h.action}</span> por {h.by} · {formatDate(h.date)}
                  </p>
                ))}
              </div>
            </div>
          )}
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
          <div className="flex-1 min-w-0">
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
          {inv.history && inv.history.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Histórico</p>
              <div className="space-y-1">
                {inv.history.map((h, i) => (
                  <p key={i} className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{h.action}</span> por {h.by} · {formatDate(h.date)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
