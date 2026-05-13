import type { RequestStatus, ReimbursementStatus, InvoiceStatus } from "@/types";

type AnyStatus = RequestStatus | ReimbursementStatus | InvoiceStatus;

const config: Record<string, { label: string; className: string; border: string }> = {
  // Travel
  pending:      { label: "⏳ Em análise",   className: "bg-amber-100 text-amber-800",   border: "bg-amber-400" },
  options_sent: { label: "📋 Com opções",   className: "bg-orange-100 text-orange-700", border: "bg-orange-400" },
  purchased:    { label: "🎟 Comprado",     className: "bg-green-100 text-green-800",   border: "bg-green-500" },
  // Reimbursement / Invoice shared
  approved:     { label: "✓ Aprovado",      className: "bg-blue-100 text-blue-800",     border: "bg-blue-500"  },
  rejected:     { label: "✕ Recusado",      className: "bg-red-100 text-red-800",       border: "bg-red-500"   },
  paid:         { label: "💸 Pago",         className: "bg-green-100 text-green-800",   border: "bg-green-500" },
  // Invoice-specific
  received:     { label: "📥 Recebido",     className: "bg-blue-100 text-blue-800",     border: "bg-blue-500"  },
};

export function getStatusBorder(status: string): string {
  return config[status]?.border ?? "bg-slate-300";
}

export default function StatusBadge({ status }: { status: AnyStatus }) {
  const c = config[status] ?? { label: status, className: "bg-slate-100 text-slate-600", border: "bg-slate-300" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${c.className}`}>
      {c.label}
    </span>
  );
}
