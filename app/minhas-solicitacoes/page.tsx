"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import type { TravelRequest, ReimbursementRequest, InvoiceUpload, UserSession } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo",
  });
}
function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Em análise", options_sent: "Com opções", purchased: "Comprado ✓",
  approved: "Aprovado ✓", rejected: "Recusado", received: "Recebido ✓",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  options_sent: "bg-orange-100 text-orange-700",
  purchased: "bg-green-100 text-green-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  received: "bg-green-100 text-green-800",
};

function TravelCard({ req, onDelete }: { req: TravelRequest; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/requests/${req.id}`, { method: "DELETE" });
    onDelete();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left p-5 hover:bg-slate-50 transition">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <StatusBadge status={req.status} />
              <span className="text-xs text-slate-400">✈ {req.travel.type === "event" ? "Ingresso" : "Passagem"}</span>
            </div>
            <p className="font-semibold text-slate-800 truncate">
              {req.travel.origin ? `${req.travel.origin} → ` : ""}{req.travel.destination}
              {req.travel.eventName ? ` · ${req.travel.eventName}` : ""}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">
              {req.travel.departureDate ? `Ida: ${req.travel.departureDate} · ` : ""}
              Solicitado em {formatDate(req.createdAt)}
            </p>
          </div>
          <span className="text-slate-300 mt-1">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-3">
          {req.travel.preferredTimes && <p className="text-sm"><span className="text-slate-400">Horários:</span> {req.travel.preferredTimes}</p>}
          {req.travel.notes && <p className="text-sm"><span className="text-slate-400">Obs:</span> {req.travel.notes}</p>}
          {req.managerMessage && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-500 mb-1">Resposta da equipe</p>
              <p className="text-sm text-slate-700">{req.managerMessage}</p>
            </div>
          )}
          {req.purchaseInfo && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-600 mb-1">✓ Compra confirmada</p>
              <p className="text-sm text-slate-700">{req.purchaseInfo}</p>
            </div>
          )}
          {req.status === "pending" && (
            <div className="space-y-2">
              <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
                Sua solicitação está sendo analisada. Em breve você receberá um e-mail.
              </p>
              <div className="flex gap-2">
                <a href={`/solicitar?edit=${req.id}`} className="text-xs font-medium text-orange-500 hover:text-orange-600 border border-orange-200 rounded-lg px-3 py-1.5 transition">✏ Editar</a>
                {confirming ? (
                  <>
                    <button onClick={handleDelete} className="text-xs font-medium bg-red-500 text-white rounded-lg px-3 py-1.5">Confirmar exclusão</button>
                    <button onClick={() => setConfirming(false)} className="text-xs font-medium text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5">Cancelar</button>
                  </>
                ) : (
                  <button onClick={() => setConfirming(true)} className="text-xs font-medium text-red-400 hover:text-red-600 border border-red-100 rounded-lg px-3 py-1.5 transition">🗑 Excluir</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReimbursementCard({ req, onDelete }: { req: ReimbursementRequest; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const s = STATUS_LABEL[req.status];
  const sc = STATUS_COLOR[req.status];

  async function handleDelete() {
    await fetch(`/api/reembolso/${req.id}`, { method: "DELETE" });
    onDelete();
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left p-5 hover:bg-slate-50 transition">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc}`}>{s}</span>
              <span className="text-xs text-slate-400">💸 Reembolso</span>
            </div>
            <p className="font-semibold text-slate-800 truncate">{req.expense.description}</p>
            <p className="text-sm text-slate-400 mt-0.5">{formatCurrency(req.expense.amount)} · {req.expense.date} · {formatDate(req.createdAt)}</p>
          </div>
          <span className="text-slate-300 mt-1">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-2 text-sm">
          <p><span className="text-slate-400">Categoria:</span> <span className="capitalize">{req.expense.category}</span></p>
          <p><span className="text-slate-400">Valor:</span> <span className="font-semibold">{formatCurrency(req.expense.amount)}</span></p>
          {req.adminNote && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-2">
              <p className="text-xs font-semibold text-blue-600 mb-1">Observação</p>
              <p className="text-slate-700">{req.adminNote}</p>
            </div>
          )}
          {req.status === "pending" && (
            <div className="flex gap-2 mt-1">
              {confirming ? (
                <>
                  <button onClick={handleDelete} className="text-xs font-medium bg-red-500 text-white rounded-lg px-3 py-1.5">Confirmar exclusão</button>
                  <button onClick={() => setConfirming(false)} className="text-xs font-medium text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5">Cancelar</button>
                </>
              ) : (
                <button onClick={() => setConfirming(true)} className="text-xs font-medium text-red-400 hover:text-red-600 border border-red-100 rounded-lg px-3 py-1.5 transition">🗑 Excluir</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InvoiceCard({ inv, onDelete }: { inv: InvoiceUpload; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const s = STATUS_LABEL[inv.status];
  const sc = STATUS_COLOR[inv.status];

  async function handleDelete() {
    await fetch(`/api/notas-fiscais/${inv.id}`, { method: "DELETE" });
    onDelete();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left p-5 hover:bg-slate-50 transition">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc}`}>{s}</span>
              <span className="text-xs text-slate-400">🧾 Nota Fiscal</span>
            </div>
            <p className="font-semibold text-slate-800 truncate">{inv.invoice.description}</p>
            <p className="text-sm text-slate-400 mt-0.5">{inv.invoice.companyName} · {formatCurrency(inv.invoice.amount)} · {formatDate(inv.createdAt)}</p>
          </div>
          <span className="text-slate-300 mt-1">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-2 text-sm">
          <p><span className="text-slate-400">Empresa:</span> {inv.invoice.companyName}</p>
          {inv.invoice.cnpj && <p><span className="text-slate-400">CNPJ:</span> {inv.invoice.cnpj}</p>}
          <p><span className="text-slate-400">Valor:</span> <span className="font-semibold">{formatCurrency(inv.invoice.amount)}</span></p>
          {inv.status === "pending" && (
            <div className="flex gap-2 mt-1">
              {confirming ? (
                <>
                  <button onClick={handleDelete} className="text-xs font-medium bg-red-500 text-white rounded-lg px-3 py-1.5">Confirmar exclusão</button>
                  <button onClick={() => setConfirming(false)} className="text-xs font-medium text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5">Cancelar</button>
                </>
              ) : (
                <button onClick={() => setConfirming(true)} className="text-xs font-medium text-red-400 hover:text-red-600 border border-red-100 rounded-lg px-3 py-1.5 transition">🗑 Excluir</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type TabKey = "all" | "travels" | "reimbursements" | "invoices";

function Content() {
  const searchParams = useSearchParams();
  const novo = searchParams.get("novo") === "1";

  const [user, setUser] = useState<UserSession | null>(null);
  const [travels, setTravels] = useState<TravelRequest[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [invoices, setInvoices] = useState<InvoiceUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("all");

  function refresh() {
    Promise.all([
      fetch("/api/requests/mine").then((r) => r.json()),
      fetch("/api/reembolso/mine").then((r) => r.json()),
      fetch("/api/notas-fiscais/mine").then((r) => r.json()),
    ]).then(([t, r, i]) => {
      setTravels(Array.isArray(t) ? t : []);
      setReimbursements(Array.isArray(r) ? r : []);
      setInvoices(Array.isArray(i) ? i : []);
    });
  }

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null));
    Promise.all([
      fetch("/api/requests/mine").then((r) => r.json()),
      fetch("/api/reembolso/mine").then((r) => r.json()),
      fetch("/api/notas-fiscais/mine").then((r) => r.json()),
    ]).then(([t, r, i]) => {
      setTravels(Array.isArray(t) ? t : []);
      setReimbursements(Array.isArray(r) ? r : []);
      setInvoices(Array.isArray(i) ? i : []);
      setLoading(false);
    });
  }, []);

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "Tudo", count: travels.length + reimbursements.length + invoices.length },
    { key: "travels", label: "✈ Viagens", count: travels.length },
    { key: "reimbursements", label: "💸 Reembolsos", count: reimbursements.length },
    { key: "invoices", label: "🧾 NFs", count: invoices.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Minhas solicitações" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {novo && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">Enviado com sucesso!</p>
              <p className="text-sm text-green-700">Você receberá uma cópia por e-mail.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-800">Minhas solicitações</h1>
          <a href="/solicitar" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">+ Nova</a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 whitespace-nowrap py-2 px-3 rounded-lg text-xs font-medium transition-all ${tab === t.key ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label} {t.count > 0 && <span className="ml-1 opacity-60">{t.count}</span>}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-12 text-slate-400">Carregando...</div>}

        {!loading && (tab === "all" || tab === "travels") && travels.length > 0 && (
          <div className="space-y-3 mb-3">
            {tab === "all" && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">Viagens</p>}
            {travels.map((r) => <TravelCard key={r.id} req={r} onDelete={refresh} />)}
          </div>
        )}
        {!loading && (tab === "all" || tab === "reimbursements") && reimbursements.length > 0 && (
          <div className="space-y-3 mb-3">
            {tab === "all" && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mt-4">Reembolsos</p>}
            {reimbursements.map((r) => <ReimbursementCard key={r.id} req={r} onDelete={refresh} />)}
          </div>
        )}
        {!loading && (tab === "all" || tab === "invoices") && invoices.length > 0 && (
          <div className="space-y-3 mb-3">
            {tab === "all" && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mt-4">Notas Fiscais</p>}
            {invoices.map((i) => <InvoiceCard key={i.id} inv={i} onDelete={refresh} />)}
          </div>
        )}

        {!loading && travels.length === 0 && reimbursements.length === 0 && invoices.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-slate-700 mb-1">Nenhuma solicitação ainda</p>
            <a href="/solicitar" className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">Começar agora</a>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MinhasSolicitacoesPage() {
  return <Suspense><Content /></Suspense>;
}
