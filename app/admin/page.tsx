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
  pending:  { label: "Pendente",    color: "bg-amber-100 text-amber-800" },
  approved: { label: "Aprovado ✓",  color: "bg-blue-100 text-blue-800" },
  rejected: { label: "Recusado",    color: "bg-red-100 text-red-800" },
  paid:     { label: "Pago ✓",      color: "bg-green-100 text-green-800" },
};
const INV_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pendente",        color: "bg-amber-100 text-amber-800" },
  received: { label: "Recebido ✓",      color: "bg-blue-100 text-blue-800" },
  rejected: { label: "Recusado",        color: "bg-red-100 text-red-800" },
  paid:     { label: "Pago ✓",          color: "bg-green-100 text-green-800" },
};

type Tab = "travels" | "reimbursements" | "invoices";
type PayFilter = "all" | "topay" | "paid";

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function getMonthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function getMonthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}
function groupByMonth<T extends { createdAt: string }>(items: T[]): { key: string; label: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = getMonthKey(item.createdAt);
    const g = map.get(k) ?? [];
    g.push(item);
    map.set(k, g);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({ key, label: getMonthLabel(key), items }));
}

function MonthSection({ label, count, total, defaultOpen, children }: {
  label: string; count: number; total?: string; defaultOpen: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 hover:bg-slate-100 transition">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">📅 {label}</span>
          <span className="text-xs text-slate-400">{count} item{count !== 1 ? "s" : ""}{total ? ` · ${total}` : ""}</span>
        </div>
        <span className="text-slate-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="divide-y divide-slate-100">{children}</div>}
    </div>
  );
}

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
  const [payFilter, setPayFilter] = useState<PayFilter>("all");
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

  // Reset pay filter when switching tabs
  useEffect(() => { setPayFilter("all"); }, [tab]);

  function matchesFilter(name: string, email: string, createdAt: string) {
    const q = search.toLowerCase();
    if (q && !name.toLowerCase().includes(q) && !email.toLowerCase().includes(q)) return false;
    if (dateFrom && createdAt < dateFrom) return false;
    if (dateTo && createdAt > dateTo + "T23:59:59") return false;
    return true;
  }

  const filteredTravels = useMemo(
    () => travels.filter((r) => matchesFilter(r.requester.name, r.requester.email, r.createdAt)),
    [travels, search, dateFrom, dateTo]
  );

  const filteredReimb = useMemo(() => {
    let items = reimbursements.filter((r) => matchesFilter(r.requester.name, r.requester.email, r.createdAt));
    if (payFilter === "topay") items = items.filter((r) => r.status === "approved");
    if (payFilter === "paid")  items = items.filter((r) => r.status === "paid");
    return items;
  }, [reimbursements, search, dateFrom, dateTo, payFilter]);

  const filteredInv = useMemo(() => {
    let items = invoices.filter((i) => matchesFilter(i.requester.name, i.requester.email, i.createdAt));
    if (payFilter === "topay") items = items.filter((i) => i.status === "received");
    if (payFilter === "paid")  items = items.filter((i) => i.status === "paid");
    return items;
  }, [invoices, search, dateFrom, dateTo, payFilter]);

  const reimbTotal = filteredReimb.reduce((s, r) => s + r.expense.amount, 0);
  const invTotal   = filteredInv.reduce((s, i) => s + i.invoice.amount, 0);

  const toPayReimb = reimbursements.filter((r) => r.status === "approved").length;
  const toPayInv   = invoices.filter((i) => i.status === "received").length;

  const tabs = [
    { key: "travels"        as Tab, label: "Viagens",      count: travels.length,       pending: travels.filter((r) => r.status === "pending").length },
    { key: "reimbursements" as Tab, label: "Reembolsos",   count: reimbursements.length, pending: reimbursements.filter((r) => r.status === "pending").length },
    { key: "invoices"       as Tab, label: "Notas Fiscais", count: invoices.length,      pending: invoices.filter((i) => i.status === "pending").length },
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

  // Group reimbursements by batchId for PDF button
  const reimbGroups = useMemo(() => {
    const groups: Map<string, ReimbursementRequest[]> = new Map();
    const singles: ReimbursementRequest[] = [];
    for (const r of filteredReimb) {
      if (r.batchId) {
        const g = groups.get(r.batchId) ?? [];
        g.push(r);
        groups.set(r.batchId, g);
      } else {
        singles.push(r);
      }
    }
    return { groups, singles };
  }, [filteredReimb]);

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
              {t.key === "reimbursements" && toPayReimb > 0 && <p className="text-xs text-blue-600 mt-0.5 font-medium">{toPayReimb} a pagar</p>}
              {t.key === "invoices" && toPayInv > 0 && <p className="text-xs text-blue-600 mt-0.5 font-medium">{toPayInv} a pagar</p>}
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

        {/* Filtro A pagar / Pago — só para reembolsos e notas fiscais */}
        {(tab === "reimbursements" || tab === "invoices") && (
          <div className="flex gap-2 mb-4">
            {(["all", "topay", "paid"] as PayFilter[]).map((f) => {
              const labels: Record<PayFilter, string> = { all: "Todos", topay: "A pagar", paid: "Pagos" };
              const counts: Record<PayFilter, number> = tab === "reimbursements"
                ? { all: reimbursements.length, topay: toPayReimb, paid: reimbursements.filter((r) => r.status === "paid").length }
                : { all: invoices.length,       topay: toPayInv,   paid: invoices.filter((i) => i.status === "paid").length };
              return (
                <button key={f} onClick={() => setPayFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${payFilter === f ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"}`}>
                  {labels[f]} {counts[f] > 0 && <span className="opacity-70">({counts[f]})</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Filtros de data/busca */}
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
                {payFilter === "all" && (
                  <> · A pagar: <span className="font-semibold text-blue-700">{formatCurrency(reimbursements.filter(r => r.status === "approved").reduce((s,r) => s + r.expense.amount, 0))}</span>
                   · Pagos: <span className="font-semibold text-green-700">{formatCurrency(reimbursements.filter(r => r.status === "paid").reduce((s,r) => s + r.expense.amount, 0))}</span></>
                )}
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
            {groupByMonth(filteredTravels).map((group, gi) => (
              <MonthSection key={group.key} label={group.label} count={group.items.length} defaultOpen={gi === 0}>
                {group.items.map((req) => (
                  <div key={req.id} className="relative bg-white hover:bg-slate-50 transition-all group">
                    <a href={`/admin/solicitacao/${req.id}`} className="block px-5 py-4">
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
              </MonthSection>
            ))}
          </div>
        )}

        {/* Reembolsos */}
        {tab === "reimbursements" && !loading && (
          <div className="space-y-3">
            {filteredReimb.length === 0 && <Empty />}
            {groupByMonth(filteredReimb).map((group, gi) => {
              const monthTotal = formatCurrency(group.items.reduce((s, r) => s + r.expense.amount, 0));
              // grupos por batch dentro do mês
              const batchMap = new Map<string, ReimbursementRequest[]>();
              const singles: ReimbursementRequest[] = [];
              for (const r of group.items) {
                if (r.batchId) { const g = batchMap.get(r.batchId) ?? []; g.push(r); batchMap.set(r.batchId, g); }
                else singles.push(r);
              }
              return (
                <MonthSection key={group.key} label={group.label} count={group.items.length} total={monthTotal} defaultOpen={gi === 0}>
                  {/* Lotes */}
                  {Array.from(batchMap.entries()).map(([batchId, items]) => (
                    <div key={batchId} className="border-b border-slate-100 last:border-0">
                      <div className="px-5 py-2.5 bg-blue-50 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Lote · {items.length} despesas</span>
                          <span className="ml-2 text-xs text-slate-500">{items[0].requester.name} · {formatCurrency(items.reduce((s, r) => s + r.expense.amount, 0))}</span>
                        </div>
                        <a href={`/api/reembolso/pdf/${batchId}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 bg-white rounded-lg px-3 py-1 transition hover:bg-blue-50">
                          📄 Gerar PDF
                        </a>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {items.map((req) => <ReimbursementCard key={req.id} req={req} onUpdate={fetchAll} nested />)}
                      </div>
                    </div>
                  ))}
                  {/* Individuais */}
                  {singles.map((req) => <ReimbursementCard key={req.id} req={req} onUpdate={fetchAll} nested />)}
                </MonthSection>
              );
            })}
          </div>
        )}

        {/* Notas Fiscais */}
        {tab === "invoices" && !loading && (
          <div className="space-y-3">
            {filteredInv.length === 0 && <Empty />}
            {groupByMonth(filteredInv).map((group, gi) => {
              const monthTotal = formatCurrency(group.items.reduce((s, i) => s + i.invoice.amount, 0));
              return (
                <MonthSection key={group.key} label={group.label} count={group.items.length} total={monthTotal} defaultOpen={gi === 0}>
                  {group.items.map((inv) => <InvoiceCard key={inv.id} inv={inv} onUpdate={fetchAll} nested />)}
                </MonthSection>
              );
            })}
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

function ReimbursementCard({ req, onUpdate, nested }: { req: ReimbursementRequest; onUpdate: () => void; nested?: boolean }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(req.adminNote ?? "");
  const [dueDate, setDueDate] = useState(req.paymentDueDate ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const s = REIMB_STATUS[req.status] ?? { label: req.status, color: "bg-slate-100 text-slate-600" };

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    await fetch(`/api/reembolso/${req.id}/upload`, { method: "POST", body: fd });
    setUploading(false);
    onUpdate();
  }

  async function updateStatus(status: string) {
    setSaving(true);
    await fetch(`/api/reembolso/${req.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: note, paymentDueDate: dueDate }),
    });
    setSaving(false);
    onUpdate();
  }

  return (
    <div className={`relative bg-white ${nested ? "" : "rounded-2xl border border-slate-200 shadow-sm"} overflow-hidden`}>
      {!nested && <DeleteButton onDelete={async () => { await fetch(`/api/reembolso/${req.id}`, { method: "DELETE" }); onUpdate(); }} />}
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
          <span className={`text-slate-300 ${nested ? "" : "pr-6"}`}>{open ? "▲" : "▼"}</span>
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

          <div className="flex items-center gap-3 flex-wrap">
            {req.expense.receiptFile && (
              <a href={`/api/files/${req.expense.receiptFile}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
                📎 Ver comprovante
              </a>
            )}
            <label className={`inline-flex items-center gap-1.5 text-sm font-medium cursor-pointer border rounded-lg px-3 py-1.5 transition ${uploading ? "text-slate-400 border-slate-200" : "text-blue-600 border-blue-200 hover:bg-blue-50"}`}>
              {uploading ? "Enviando..." : req.expense.receiptFile ? "🔄 Substituir comprovante" : "📎 Anexar comprovante"}
              <input type="file" accept="image/*,.pdf" className="hidden"
                disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
            </label>
          </div>

          {req.status !== "paid" && (
            <>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                placeholder="Observação (opcional)..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500 whitespace-nowrap">📅 Previsão de pagamento</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => updateStatus("approved")} disabled={saving || req.status === "approved"}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                  ✓ Aprovar
                </button>
                <button onClick={() => updateStatus("rejected")} disabled={saving || req.status === "rejected"}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                  ✗ Recusar
                </button>
                {req.status === "approved" && (
                  <button onClick={() => updateStatus("paid")} disabled={saving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                    💸 Marcar como pago
                  </button>
                )}
              </div>
            </>
          )}

          {req.paymentDueDate && req.status !== "paid" && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
              <span>📅</span>
              <span>Previsão de pagamento: <strong>{new Date(req.paymentDueDate + "T12:00:00").toLocaleDateString("pt-BR")}</strong></span>
            </div>
          )}

          {req.status === "paid" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <span className="text-green-600 text-lg">✓</span>
              <p className="text-sm text-green-700 font-medium">Reembolso pago</p>
            </div>
          )}

          {req.adminNote && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">Observação</p>
              <p className="text-sm text-slate-700">{req.adminNote}</p>
            </div>
          )}

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

function InvoiceCard({ inv, onUpdate, nested }: { inv: InvoiceUpload; onUpdate: () => void; nested?: boolean }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(inv.adminNote ?? "");
  const [dueDate, setDueDate] = useState(inv.paymentDueDate ?? "");
  const [saving, setSaving] = useState(false);
  const s = INV_STATUS[inv.status] ?? { label: inv.status, color: "bg-slate-100 text-slate-600" };

  async function updateStatus(status: string) {
    setSaving(true);
    await fetch(`/api/notas-fiscais/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: note, paymentDueDate: dueDate }),
    });
    setSaving(false);
    onUpdate();
  }

  return (
    <div className={`relative bg-white ${nested ? "" : "rounded-2xl border border-slate-200 shadow-sm"} overflow-hidden`}>
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
            <div><span className="text-slate-400">Enviado:</span> <span className="text-slate-700">{formatDate(inv.createdAt)}</span></div>
          </div>

          <div>
            <a href={`/api/files/${inv.invoice.invoiceFile}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
              📄 Ver nota fiscal
            </a>
          </div>

          {inv.status !== "paid" && (
            <>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                placeholder="Observação para o solicitante (opcional)..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500 whitespace-nowrap">📅 Previsão de pagamento</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <div className="flex gap-2 flex-wrap">
                {inv.status === "pending" && (
                  <>
                    <button onClick={() => updateStatus("received")} disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                      ✓ Confirmar recebimento
                    </button>
                    <button onClick={() => updateStatus("rejected")} disabled={saving}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                      ✗ Recusar
                    </button>
                  </>
                )}
                {inv.status === "received" && (
                  <button onClick={() => updateStatus("paid")} disabled={saving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                    💰 Marcar como pago
                  </button>
                )}
              </div>
            </>
          )}

          {inv.paymentDueDate && inv.status !== "paid" && (
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
              <span>📅</span>
              <span>Previsão de pagamento: <strong>{new Date(inv.paymentDueDate + "T12:00:00").toLocaleDateString("pt-BR")}</strong></span>
            </div>
          )}

          {inv.status === "paid" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <span className="text-green-600 text-lg">✓</span>
              <p className="text-sm text-green-700 font-medium">Nota fiscal paga</p>
            </div>
          )}

          {inv.adminNote && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">Observação</p>
              <p className="text-sm text-slate-700">{inv.adminNote}</p>
            </div>
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
