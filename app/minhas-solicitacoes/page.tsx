"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import StatusBadge, { getStatusBorder } from "@/components/StatusBadge";
import type { TravelRequest, ReimbursementRequest, InvoiceUpload, UserSession } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo",
  });
}
function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
function getMonthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function getMonthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
}
function groupByMonth<T extends { createdAt: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = getMonthKey(item.createdAt);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({ key, label: getMonthLabel(key), items }));
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Em análise", options_sent: "Com opções", purchased: "Comprado ✓",
  approved: "Aprovado ✓", rejected: "Recusado", received: "Recebido ✓",
  paid: "Pago ✓",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  options_sent: "bg-orange-100 text-orange-700",
  purchased: "bg-green-100 text-green-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  received: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

function exportCSV(
  travels: TravelRequest[],
  reimbursements: ReimbursementRequest[],
  invoices: InvoiceUpload[]
) {
  const header = ["Tipo", "Data", "Descrição", "Valor", "Status"];
  const rows: string[][] = [header];
  travels.forEach((r) => rows.push([
    "Viagem",
    formatDate(r.createdAt),
    `${r.travel.origin ? r.travel.origin + " → " : ""}${r.travel.destination}${r.travel.eventName ? " · " + r.travel.eventName : ""}`,
    "",
    STATUS_LABEL[r.status] ?? r.status,
  ]));
  reimbursements.forEach((r) => rows.push([
    "Reembolso",
    formatDate(r.createdAt),
    r.expense.description,
    String(r.expense.amount),
    STATUS_LABEL[r.status] ?? r.status,
  ]));
  invoices.forEach((i) => rows.push([
    "Nota Fiscal",
    formatDate(i.createdAt),
    i.invoice.invoiceNumber ? `NF ${i.invoice.invoiceNumber}` : i.invoice.description,
    String(i.invoice.amount),
    STATUS_LABEL[i.status] ?? i.status,
  ]));
  const content = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `minhas-solicitacoes.csv`; a.click();
  URL.revokeObjectURL(url);
}

function printReport(
  user: UserSession | null,
  travels: TravelRequest[],
  reimbursements: ReimbursementRequest[],
  invoices: InvoiceUpload[]
) {
  const fmt = formatCurrency;
  const reimbTotal = reimbursements.reduce((s, r) => s + r.expense.amount, 0);
  const invTotal = invoices.reduce((s, i) => s + i.invoice.amount, 0);

  const travelRows = travels.map((r) => `
    <tr>
      <td>${r.travel.origin ? r.travel.origin + " → " : ""}${r.travel.destination}${r.travel.eventName ? "<br><small>" + r.travel.eventName + "</small>" : ""}</td>
      <td>${r.travel.departureDate ?? "—"}</td>
      <td>${formatDate(r.createdAt)}</td>
      <td>${STATUS_LABEL[r.status] ?? r.status}</td>
    </tr>`).join("") || `<tr><td colspan="4" style="color:#999;text-align:center;">Nenhuma viagem</td></tr>`;

  const reimbRows = reimbursements.map((r) => `
    <tr>
      <td>${r.expense.description}</td>
      <td style="text-transform:capitalize">${r.expense.category}</td>
      <td>${r.expense.date}</td>
      <td style="text-align:right">${fmt(r.expense.amount)}</td>
      <td>${STATUS_LABEL[r.status] ?? r.status}</td>
    </tr>`).join("") || `<tr><td colspan="5" style="color:#999;text-align:center;">Nenhum reembolso</td></tr>`;

  const invRows = invoices.map((i) => `
    <tr>
      <td>${i.invoice.description}</td>
      <td>${i.invoice.invoiceNumber ? `NF ${i.invoice.invoiceNumber}` : "—"}</td>
      <td>${formatDate(i.createdAt)}</td>
      <td style="text-align:right">${fmt(i.invoice.amount)}</td>
      <td>${STATUS_LABEL[i.status] ?? i.status}</td>
    </tr>`).join("") || `<tr><td colspan="5" style="color:#999;text-align:center;">Nenhuma nota fiscal</td></tr>`;

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Relatório de solicitações</title>
    <style>
      body { font-family: -apple-system, sans-serif; color: #1e293b; padding: 32px; font-size: 13px; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      .sub { color: #64748b; margin-bottom: 24px; font-size: 12px; }
      h2 { font-size: 14px; color: #f97316; margin: 24px 0 8px; border-bottom: 2px solid #fed7aa; padding-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      th { background: #f8fafc; text-align: left; padding: 6px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
      td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
      .total { background: #eff6ff; padding: 12px 16px; border-radius: 8px; margin-top: 8px; font-weight: 700; font-size: 14px; }
      small { color: #64748b; font-size: 11px; }
    </style></head><body>
    <h1>Relatório de solicitações</h1>
    <div class="sub">${user?.name ?? ""} · ${user?.email ?? ""} · Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>

    <h2>✈ Viagens (${travels.length})</h2>
    <table><thead><tr><th>Destino</th><th>Data ida</th><th>Solicitado</th><th>Status</th></tr></thead>
    <tbody>${travelRows}</tbody></table>

    <h2>💸 Reembolsos (${reimbursements.length})</h2>
    <table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead>
    <tbody>${reimbRows}</tbody>
    <tfoot><tr><td colspan="3"><strong>Total</strong></td><td style="text-align:right"><strong>${fmt(reimbTotal)}</strong></td><td></td></tr></tfoot></table>

    <h2>🧾 Notas Fiscais (${invoices.length})</h2>
    <table><thead><tr><th>Descrição</th><th>Empresa</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead>
    <tbody>${invRows}</tbody>
    <tfoot><tr><td colspan="3"><strong>Total</strong></td><td style="text-align:right"><strong>${fmt(invTotal)}</strong></td><td></td></tr></tfoot></table>

    <div class="total">Total geral (reembolsos + notas): ${fmt(reimbTotal + invTotal)}</div>
    <script>window.onload = () => window.print();</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

function MonthLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-1 pt-4 pb-1 first:pt-0">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-xs text-slate-300">({count})</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
      <div className="w-1.5 flex-shrink-0 bg-slate-200 animate-pulse" style={{minHeight: 76}} />
      <div className="p-5 flex-1 space-y-2.5">
        <div className="flex gap-2">
          <div className="h-5 w-24 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-slate-200 animate-pulse" />
        </div>
        <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}

function TravelCard({ req, onDelete }: { req: TravelRequest; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/requests/${req.id}`, { method: "DELETE" });
    onDelete();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
      <div className={`w-1.5 flex-shrink-0 ${getStatusBorder(req.status)}`} />
      <div className="flex-1 min-w-0">
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
            <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3">
              Sua solicitação está sendo analisada. Em breve você receberá um e-mail.
            </p>
          )}
          {req.status === "pending" && (
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
          )}
        </div>
      )}
      </div>
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
      <div className={`w-1.5 flex-shrink-0 ${getStatusBorder(req.status)}`} />
      <div className="flex-1 min-w-0">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left p-5 hover:bg-slate-50 transition">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc}`}>{s}</span>
              <span className="text-xs text-slate-400">💸 Reembolso</span>
              {req.paymentDueDate && req.status !== "paid" && (
                <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                  📅 {new Date(req.paymentDueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                </span>
              )}
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
          {req.paymentDueDate && req.status !== "paid" && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
              <span className="text-blue-500">📅</span>
              <div>
                <p className="text-xs font-semibold text-blue-600">Previsão de pagamento</p>
                <p className="text-sm text-slate-700">{new Date(req.paymentDueDate + "T12:00:00").toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          )}
          {req.status === "paid" && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <p className="text-sm text-green-700 font-medium">Reembolso pago!</p>
            </div>
          )}
          {req.adminNote && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mt-2">
              <p className="text-xs font-semibold text-blue-600 mb-1">Observação</p>
              <p className="text-slate-700">{req.adminNote}</p>
            </div>
          )}
          {(req.status === "pending" || req.status === "rejected") && (
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
      <div className={`w-1.5 flex-shrink-0 ${getStatusBorder(inv.status)}`} />
      <div className="flex-1 min-w-0">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left p-5 hover:bg-slate-50 transition">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sc}`}>{s}</span>
              <span className="text-xs text-slate-400">🧾 Nota Fiscal</span>
              {inv.paymentDueDate && inv.status !== "paid" && (
                <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                  📅 {new Date(inv.paymentDueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
            <p className="font-semibold text-slate-800 truncate">{inv.invoice.description}</p>
            <p className="text-sm text-slate-400 mt-0.5">{formatCurrency(inv.invoice.amount)} · {formatDate(inv.createdAt)}</p>
          </div>
          <span className="text-slate-300 mt-1">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-2 text-sm">
          {inv.invoice.invoiceNumber && <p><span className="text-slate-400">Número da NF:</span> <span className="font-semibold">{inv.invoice.invoiceNumber}</span></p>}
          {inv.invoice.invoiceDate && <p><span className="text-slate-400">Data de emissão:</span> {new Date(inv.invoice.invoiceDate + "T12:00:00").toLocaleDateString("pt-BR")}</p>}
          <p><span className="text-slate-400">Valor:</span> <span className="font-semibold">{formatCurrency(inv.invoice.amount)}</span></p>
          {inv.invoice.invoiceFile && (
            <a
              href={`/api/notas-fiscais/file/${inv.invoice.invoiceFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-2 rounded-xl transition"
            >
              📎 Ver anexo da NF
            </a>
          )}
          {inv.paymentDueDate && inv.status !== "paid" && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
              <span className="text-blue-500">📅</span>
              <div>
                <p className="text-xs font-semibold text-blue-600">Previsão de pagamento</p>
                <p className="text-sm text-slate-700">{new Date(inv.paymentDueDate + "T12:00:00").toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          )}
          {inv.status === "paid" && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <p className="text-sm text-green-700 font-medium">Nota fiscal paga!</p>
            </div>
          )}
          {(inv.status === "pending" || inv.status === "rejected") && (
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
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"date_desc" | "date_asc" | "amount_desc" | "amount_asc">("date_desc");

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

  const hasData = travels.length > 0 || reimbursements.length > 0 || invoices.length > 0;

  const q = search.toLowerCase();

  function applySort<T extends { createdAt: string }>(items: T[], getAmount?: (i: T) => number): T[] {
    return [...items].sort((a, b) => {
      if (sort === "date_desc") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "date_asc")  return a.createdAt.localeCompare(b.createdAt);
      if (getAmount) {
        if (sort === "amount_desc") return getAmount(b) - getAmount(a);
        if (sort === "amount_asc")  return getAmount(a) - getAmount(b);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  const filteredTravels = applySort(
    q ? travels.filter((r) => [r.travel.destination, r.travel.origin ?? "", r.travel.eventName ?? ""].some((s) => s.toLowerCase().includes(q))) : travels
  );
  const filteredReimbs = applySort(
    q ? reimbursements.filter((r) => r.expense.description.toLowerCase().includes(q) || r.expense.category.toLowerCase().includes(q)) : reimbursements,
    (r) => r.expense.amount
  );
  const filteredInvoices = applySort(
    q ? invoices.filter((i) => (i.invoice.description ?? "").toLowerCase().includes(q) || (i.invoice.invoiceNumber ?? "").toLowerCase().includes(q)) : invoices,
    (i) => i.invoice.amount
  );

  const travelGroups = groupByMonth(filteredTravels);
  const reimbGroups = groupByMonth(filteredReimbs);
  const invGroups = groupByMonth(filteredInvoices);

  function renderTravels(items: TravelRequest[]) {
    return groupByMonth(items).map((group) => (
      <div key={group.key}>
        <MonthLabel label={group.label} count={group.items.length} />
        <div className="space-y-2">
          {group.items.map((r) => <TravelCard key={r.id} req={r} onDelete={refresh} />)}
        </div>
      </div>
    ));
  }
  function renderReimbs(items: ReimbursementRequest[]) {
    return groupByMonth(items).map((group) => (
      <div key={group.key}>
        <MonthLabel label={group.label} count={group.items.length} />
        <div className="space-y-2">
          {group.items.map((r) => <ReimbursementCard key={r.id} req={r} onDelete={refresh} />)}
        </div>
      </div>
    ));
  }
  function renderInvoices(items: InvoiceUpload[]) {
    return groupByMonth(items).map((group) => (
      <div key={group.key}>
        <MonthLabel label={group.label} count={group.items.length} />
        <div className="space-y-2">
          {group.items.map((i) => <InvoiceCard key={i.id} inv={i} onDelete={refresh} />)}
        </div>
      </div>
    ));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Minhas solicitações" />
      <main className="max-w-5xl mx-auto px-4 py-8">
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
          <div className="flex items-center gap-2">
            {hasData && !loading && (
              <>
                <button
                  onClick={() => exportCSV(travels, reimbursements, invoices)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition"
                >
                  ↓ CSV
                </button>
                <button
                  onClick={() => printReport(user, travels, reimbursements, invoices)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition"
                >
                  🖨 PDF
                </button>
              </>
            )}
            <a href="/solicitar" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">+ Nova</a>
          </div>
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

        {/* Busca + Ordenação */}
        {hasData && !loading && (
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por destino, descrição, NF..."
                className="w-full border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition text-xs">✕</button>
              )}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
              <option value="date_desc">↓ Mais recentes</option>
              <option value="date_asc">↑ Mais antigos</option>
              <option value="amount_desc">↓ Maior valor</option>
              <option value="amount_asc">↑ Menor valor</option>
            </select>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[0,1,2,3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Tab: Tudo */}
        {!loading && tab === "all" && (
          <div className="space-y-6">
            {filteredTravels.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">✈ Viagens</p>
                <div className="space-y-1">{renderTravels(filteredTravels)}</div>
              </div>
            )}
            {filteredReimbs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">💸 Reembolsos</p>
                <div className="space-y-1">{renderReimbs(filteredReimbs)}</div>
              </div>
            )}
            {filteredInvoices.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">🧾 Notas Fiscais</p>
                <div className="space-y-1">{renderInvoices(filteredInvoices)}</div>
              </div>
            )}
            {q && filteredTravels.length === 0 && filteredReimbs.length === 0 && filteredInvoices.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">Nenhum resultado para "<strong>{search}</strong>"</p>
              </div>
            )}
          </div>
        )}

        {/* Tab: Viagens */}
        {!loading && tab === "travels" && (
          <div className="space-y-1">
            {travelGroups.length === 0
              ? <EmptyTab href="/solicitar" label="solicitação de viagem" empty={!q} />
              : renderTravels(filteredTravels)}
          </div>
        )}

        {/* Tab: Reembolsos */}
        {!loading && tab === "reimbursements" && (
          <div className="space-y-1">
            {reimbGroups.length === 0
              ? <EmptyTab href="/reembolso" label="reembolso" empty={!q} />
              : renderReimbs(filteredReimbs)}
          </div>
        )}

        {/* Tab: NFs */}
        {!loading && tab === "invoices" && (
          <div className="space-y-1">
            {invGroups.length === 0
              ? <EmptyTab href="/notas-fiscais" label="nota fiscal" empty={!q} />
              : renderInvoices(filteredInvoices)}
          </div>
        )}

        {!loading && !hasData && (
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

function EmptyTab({ href, label, empty = true }: { href: string; label: string; empty?: boolean }) {
  if (!empty) return (
    <div className="text-center py-12 text-slate-400">
      <p className="text-3xl mb-2">🔍</p>
      <p className="text-sm">Nenhum resultado encontrado.</p>
    </div>
  );
  return (
    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
      <p className="text-3xl mb-2">📭</p>
      <p className="text-slate-500 text-sm mb-4">Nenhum(a) {label} ainda.</p>
      <a href={href} className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">+ Nova solicitação</a>
    </div>
  );
}

export default function MinhasSolicitacoesPage() {
  return <Suspense><Content /></Suspense>;
}
