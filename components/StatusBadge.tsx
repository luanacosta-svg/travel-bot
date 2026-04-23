import type { RequestStatus } from "@/types";

const config: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: "Aguardando análise", className: "bg-amber-100 text-amber-800" },
  options_sent: { label: "Opções enviadas", className: "bg-blue-100 text-blue-800" },
  purchased: { label: "Comprado ✓", className: "bg-green-100 text-green-800" },
};

export default function StatusBadge({ status }: { status: RequestStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
      {label}
    </span>
  );
}
