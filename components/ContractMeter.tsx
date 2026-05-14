"use client";

interface ContractMeterProps {
  contractEnd?: string;
  showLabel?: boolean;
}

function getStatus(contractEnd?: string) {
  if (!contractEnd) return { days: 999, color: "#16A34A", pill: "bg-green-100 text-green-800", label: "—" };

  const end = new Date(contractEnd);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return {
      days: diff,
      color: "#DC2626",
      pill: "bg-red-100 text-red-800",
      label: `${Math.abs(diff)}d atrás`,
    };
  }
  if (diff <= 15) {
    return { days: diff, color: "#D97706", pill: "bg-amber-100 text-amber-800", label: `${diff}d` };
  }
  if (diff <= 60) {
    return { days: diff, color: "#2563EB", pill: "bg-blue-100 text-blue-800", label: `${diff}d` };
  }
  return { days: diff, color: "#16A34A", pill: "bg-green-100 text-green-800", label: `${diff}d` };
}

export default function ContractMeter({ contractEnd, showLabel = true }: ContractMeterProps) {
  const status = getStatus(contractEnd);

  // Progress: 0% = just started (365d left), 100% = expired
  const totalDays = 365;
  const used = totalDays - status.days;
  const pct = Math.max(0, Math.min(100, (used / totalDays) * 100));

  return (
    <div className="contract-meter">
      <div className="contract-meter__bar">
        <div
          className="contract-meter__fill"
          style={{ width: `${pct}%`, background: status.color }}
        />
      </div>
      {showLabel && (
        <span className={`pill ${status.pill} text-xs font-bold px-2 py-0.5 rounded-full`}>
          {status.label}
        </span>
      )}
    </div>
  );
}
