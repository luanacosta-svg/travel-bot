"use client";

import { useState, useEffect } from "react";
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

export default function DashboardPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [travels, setTravels] = useState<TravelRequest[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [invoices, setInvoices] = useState<InvoiceUpload[]>([]);
  const [loading, setLoading] = useState(true);

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

  const firstName = user?.name?.split(" ")[0] ?? "";
  const pendingTravels = travels.filter((r) => r.status === "pending").length;
  const pendingReimb = reimbursements.filter((r) => r.status === "pending").length;
  const pendingInv = invoices.filter((i) => i.status === "pending").length;
  const totalPending = pendingTravels + pendingReimb + pendingInv;

  const recentAll = [
    ...travels.map((r) => ({ id: r.id, type: "travel" as const, icon: "✈", title: `${r.travel.origin ? r.travel.origin + " → " : ""}${r.travel.destination}${r.travel.eventName ? " · " + r.travel.eventName : ""}`, date: r.createdAt, status: r.status as string, extra: undefined as string | undefined })),
    ...reimbursements.map((r) => ({ id: r.id, type: "reimb" as const, icon: "💸", title: r.expense.description, date: r.createdAt, status: r.status as string, extra: formatCurrency(r.expense.amount) })),
    ...invoices.map((i) => ({ id: i.id, type: "inv" as const, icon: "🧾", title: i.invoice.description, date: i.createdAt, status: i.status as string, extra: formatCurrency(i.invoice.amount) })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const statusLabel: Record<string, string> = {
    pending: "Em análise",
    options_sent: "Com opções",
    purchased: "Comprado",
    approved: "Aprovado",
    rejected: "Recusado",
    received: "Recebido",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    options_sent: "bg-orange-100 text-orange-700",
    purchased: "bg-green-100 text-green-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    received: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Início" />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Boas-vindas */}
        <div className="bg-orange-500 rounded-2xl p-6 text-white">
          <p className="text-orange-100 text-sm mb-1">Olá, {firstName}! 👋</p>
          <h1 className="text-2xl font-bold">Sistema de Gestão</h1>
          <p className="text-orange-100 text-sm mt-1">
            {totalPending > 0 ? `${totalPending} solicitação(ões) em análise` : "Tudo em dia!"}
          </p>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/solicitar", icon: "✈", label: "Passagem", sub: "ou ingresso" },
            { href: "/reembolso", icon: "💸", label: "Reembolso", sub: "despesas" },
            { href: "/notas-fiscais", icon: "🧾", label: "Nota Fiscal", sub: "upload NF" },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-1 hover:border-orange-400 hover:bg-orange-50 transition text-center"
            >
              <span className="text-2xl">{a.icon}</span>
              <p className="font-semibold text-slate-800 text-sm">{a.label}</p>
              <p className="text-xs text-slate-400">{a.sub}</p>
            </a>
          ))}
        </div>

        {/* Stats */}
        {!loading && (travels.length > 0 || reimbursements.length > 0 || invoices.length > 0) && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Viagens", value: travels.length, icon: "✈", color: "bg-orange-50 text-orange-600 border-orange-100" },
              { label: "Reembolsos", value: reimbursements.length, icon: "💸", color: "bg-amber-50 text-amber-600 border-amber-100" },
              { label: "Notas Fiscais", value: invoices.length, icon: "🧾", color: "bg-slate-50 text-slate-600 border-slate-200" },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
                <p className="text-lg mb-1">{s.icon}</p>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800">Atividade recente</h2>
            <a href="/minhas-solicitacoes" className="text-sm text-orange-500 font-medium hover:text-orange-600">
              Ver tudo →
            </a>
          </div>

          {loading && <p className="text-slate-400 text-sm">Carregando...</p>}

          {!loading && recentAll.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-slate-500 text-sm mb-4">Nenhuma solicitação ainda.</p>
              <a href="/solicitar" className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
                Começar agora
              </a>
            </div>
          )}

          <div className="space-y-2">
            {recentAll.map((item) => (
              <a
                key={item.id}
                href="/minhas-solicitacoes"
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-orange-200 transition"
              >
                <span className="text-xl w-8 text-center">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400">{formatDate(item.date)}{item.extra ? ` · ${item.extra}` : ""}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor[item.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {statusLabel[item.status] ?? item.status}
                </span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
