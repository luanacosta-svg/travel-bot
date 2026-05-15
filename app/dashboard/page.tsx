"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import ContractMeter from "@/components/ContractMeter";
import StatusBadge from "@/components/StatusBadge";
import type { TravelRequest, ReimbursementRequest, InvoiceUpload, UserSession, Employee } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo",
  });
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatBR(dateStr?: string) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function DashboardPage() {
  const [user,           setUser]           = useState<UserSession | null>(null);
  const [employee,       setEmployee]       = useState<Employee | null>(null);
  const [travels,        setTravels]        = useState<TravelRequest[]>([]);
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([]);
  const [invoices,       setInvoices]       = useState<InvoiceUpload[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [activityFilter, setActivityFilter] = useState<"all" | "travel" | "reimb" | "inv">("all");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null));
    fetch("/api/employees/me").then((r) => r.json()).then((d) => setEmployee(d ?? null)).catch(() => {});
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

  const firstName    = user?.name?.split(" ")[0] ?? "";
  const completion   = employee?.completion ?? 0;
  const contractEnd  = employee?.contractEnd;

  const totalPagoReimb = reimbursements.filter((r) => r.status === "paid").reduce((s, r) => s + r.expense.amount, 0);
  const totalPagoInv   = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.invoice.amount, 0);
  const totalAPagar    = reimbursements.filter((r) => r.status === "approved").reduce((s, r) => s + r.expense.amount, 0)
                       + invoices.filter((i) => i.status === "received").reduce((s, i) => s + i.invoice.amount, 0);

  const allItems = useMemo(() => [
    ...travels.map((r) => ({
      id: r.id, type: "travel" as const, icon: "✈️",
      title: `${r.travel.origin ? r.travel.origin + " → " : ""}${r.travel.destination}${r.travel.eventName ? " · " + r.travel.eventName : ""}`,
      date: r.createdAt, status: r.status as string, extra: undefined as string | undefined,
    })),
    ...reimbursements.map((r) => ({
      id: r.id, type: "reimb" as const, icon: "💸",
      title: r.expense.description, date: r.createdAt, status: r.status as string,
      extra: formatCurrency(r.expense.amount),
    })),
    ...invoices.map((i) => ({
      id: i.id, type: "inv" as const, icon: "🧾",
      title: i.invoice.description, date: i.createdAt, status: i.status as string,
      extra: formatCurrency(i.invoice.amount),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [travels, reimbursements, invoices]);

  const recentAll = useMemo(() => {
    const filtered = activityFilter === "all" ? allItems : allItems.filter((i) => i.type === activityFilter);
    return filtered.slice(0, 8);
  }, [allItems, activityFilter]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header user={user ?? undefined} />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        {/* ── Welcome banner ── */}
        <div
          className="rounded-2xl p-6 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #FB8423 0%, #F97316 100%)" }}
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.07)" }} />
          <p className="text-white/90 text-sm mb-1">Olá, {firstName || "…"}! 👋 Bem-vindo de volta</p>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">49Pay</h1>
          <p className="text-white/80 text-sm">
            Notas fiscais, reembolsos, viagens e seu cadastro — tudo em um só lugar.
          </p>
        </div>

        {/* ── Auto-fill hint (profile complete) ── */}
        {employee && completion === 100 && (
          <div className="pay-banner pay-banner--green rounded-2xl">
            <span className="text-xl flex-shrink-0">✨</span>
            <div className="flex-1">
              <p className="font-bold text-sm mb-0.5">Seus dados estão prontos!</p>
              <p className="text-sm opacity-90">
                Toda nova solicitação já vem com nome, e-mail, telefone, CNPJ e PIX preenchidos do seu perfil.
              </p>
            </div>
          </div>
        )}

        {/* ── Profile completion banner (if incomplete) ── */}
        {employee && completion < 100 && (
          <div className="pay-banner pay-banner--orange rounded-2xl">
            <span className="text-xl flex-shrink-0">📋</span>
            <div className="flex-1">
              <p className="font-bold text-sm mb-0.5">Complete seu cadastro ({completion}%)</p>
              <p className="text-sm opacity-90">
                Mantemos seus dados aqui para você não precisar reenviar a cada nova NF, viagem ou reembolso.
              </p>
            </div>
            <a
              href="/perfil"
              className="flex-shrink-0 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
            >
              Continuar →
            </a>
          </div>
        )}

        {/* ── No profile yet banner ── */}
        {!loading && !employee && (
          <div className="pay-banner pay-banner--amber rounded-2xl">
            <span className="text-xl flex-shrink-0">📝</span>
            <div className="flex-1">
              <p className="font-bold text-sm mb-0.5">Cadastro ainda não preenchido</p>
              <p className="text-sm opacity-90">
                Preencha seu perfil para agilizar todas as solicitações.
              </p>
            </div>
            <a
              href="/perfil"
              className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
            >
              Preencher agora
            </a>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/solicitar",     icon: "✈️", label: "Passagem",    sub: "ou ingresso" },
            { href: "/reembolso",     icon: "💸", label: "Reembolso",   sub: "despesas",   highlight: true },
            { href: "/notas-fiscais", icon: "🧾", label: "Nota Fiscal", sub: "upload NF"   },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="bg-white border rounded-2xl p-5 flex flex-col gap-2 hover:shadow-md transition text-left group"
              style={{
                borderColor: a.highlight ? "var(--orange-200)" : "var(--border-soft)",
                background: a.highlight ? "var(--orange-50)" : "white",
              }}
            >
              <span className="text-3xl">{a.icon}</span>
              <p className="font-extrabold text-slate-800">{a.label}</p>
              <p className="text-xs text-slate-400">{a.sub}</p>
            </a>
          ))}
        </div>

        {/* ── Profile card shortcut ── */}
        <a
          href="/perfil"
          className="bg-white border rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition"
          style={{ borderColor: "var(--border-soft)" }}
        >
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl flex-shrink-0">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-slate-800">Meu Perfil</span>
              {completion > 0 && (
                <span
                  className={`pill text-xs ${completion === 100 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                >
                  {completion}%
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 truncate">
              Dados pessoais, contrato, PJ, PIX e contato de emergência
            </p>
          </div>
          <span className="text-slate-300 text-lg flex-shrink-0">→</span>
        </a>

        {/* ── Financial summary ── */}
        {!loading && (reimbursements.length > 0 || invoices.length > 0) && (
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card stat-card--blue rounded-2xl">
              <p className="text-xs font-extrabold uppercase tracking-wider mb-1" style={{ color: "var(--blue-ink)" }}>A receber</p>
              <p className="text-2xl font-extrabold" style={{ color: "var(--blue)" }}>{formatCurrency(totalAPagar)}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--blue-ink)" }}>aprovados/confirmados</p>
            </div>
            <div className="stat-card stat-card--green rounded-2xl">
              <p className="text-xs font-extrabold uppercase tracking-wider mb-1" style={{ color: "var(--green-ink)" }}>Reembolsos pagos</p>
              <p className="text-2xl font-extrabold" style={{ color: "var(--green)" }}>{formatCurrency(totalPagoReimb)}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--green-ink)" }}>{reimbursements.filter((r) => r.status === "paid").length} pagamento(s)</p>
            </div>
            <div className="stat-card stat-card--green rounded-2xl">
              <p className="text-xs font-extrabold uppercase tracking-wider mb-1" style={{ color: "var(--green-ink)" }}>NFs pagas</p>
              <p className="text-2xl font-extrabold" style={{ color: "var(--green)" }}>{formatCurrency(totalPagoInv)}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--green-ink)" }}>{invoices.filter((i) => i.status === "paid").length} nota(s)</p>
            </div>
          </div>
        )}

        {/* ── Contract reminder (if employee has contract) ── */}
        {contractEnd && (
          <div
            className="bg-white border rounded-2xl p-4 flex items-center gap-4"
            style={{ borderColor: "var(--border-soft)" }}
          >
            <span className="text-2xl flex-shrink-0">📅</span>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">Seu contrato vence em {formatBR(contractEnd)}</p>
              <p className="text-xs text-slate-400 mt-0.5">Você receberá um lembrete 15 dias antes.</p>
            </div>
            <div className="w-40 flex-shrink-0">
              <ContractMeter contractEnd={contractEnd} />
            </div>
          </div>
        )}

        {/* ── Recent activity ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-extrabold text-slate-800 text-lg tracking-tight">Atividade recente</h2>
            <a href="/minhas-solicitacoes" className="text-sm text-orange-500 font-bold hover:text-orange-700">
              Ver tudo →
            </a>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {([
              { key: "all",    label: "Tudo",         count: allItems.length },
              { key: "travel", label: "✈️ Viagens",   count: travels.length },
              { key: "reimb",  label: "💸 Reembolsos", count: reimbursements.length },
              { key: "inv",    label: "🧾 Notas",      count: invoices.length },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setActivityFilter(f.key)}
                className={`whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  activityFilter === f.key
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-slate-500 border-slate-200 hover:border-orange-300"
                }`}
              >
                {f.label}{f.count > 0 && ` (${f.count})`}
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 px-4 py-3 h-16 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && allItems.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-slate-400 text-sm mb-4 font-medium">Nenhuma solicitação ainda.</p>
              <a
                href={activityFilter === "reimb" ? "/reembolso" : activityFilter === "inv" ? "/notas-fiscais" : "/solicitar"}
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
              >
                Começar agora
              </a>
            </div>
          )}

          <div className="space-y-2">
            {recentAll.map((item) => (
              <a
                key={item.id}
                href="/minhas-solicitacoes"
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3 hover:border-orange-200 hover:shadow-sm transition"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-lg flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(item.date)}{item.extra ? ` · ${item.extra}` : ""}
                  </p>
                </div>
                <StatusBadge status={item.status as any} />
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
