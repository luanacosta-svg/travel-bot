"use client";

import { useState, useRef, useEffect } from "react";

interface Notification {
  id: number;
  icon: string;
  tone: string;
  time: string;
  title: string;
  body: string;
}

const NOTIFICATIONS: Notification[] = [
  { id: 1, icon: "✓",  tone: "green", time: "agora",  title: "NF #038 aprovada",             body: "Sua NF foi aprovada para pagamento." },
  { id: 2, icon: "📅", tone: "amber", time: "2h",     title: "Contrato vence em 14 dias",    body: "Beatriz Andrade · Aditivo em 28/05/2026." },
  { id: 3, icon: "💸", tone: "blue",  time: "ontem",  title: "Reembolso recebido",            body: "R$ 33,95 · Uber Evento · aguarda análise." },
  { id: 4, icon: "✈️", tone: "blue",  time: "2d",     title: "Nova solicitação de viagem",   body: "Diego Antunes · GRU → BSB · 02-04/06." },
];

const toneBg: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  blue:  "bg-blue-100 text-blue-700",
  red:   "bg-red-100 text-red-700",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(NOTIFICATIONS.length);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle() {
    setOpen((o) => !o);
    setUnread(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition text-lg"
        aria-label="Notificações"
      >
        🔔
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-white leading-none">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-extrabold text-slate-800 text-sm">Notificações</span>
            <button
              className="text-xs text-orange-500 font-bold hover:text-orange-700 transition"
              onClick={() => setUnread(0)}
            >
              Marcar tudo como lido
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                className="flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${toneBg[n.tone] ?? "bg-slate-100 text-slate-600"}`}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 mb-0.5">
                    <span className="text-sm font-bold text-slate-800 truncate">{n.title}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{n.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2.5 bg-slate-50 text-center">
            <button className="text-sm text-orange-500 font-bold hover:text-orange-700 transition">
              Ver todas →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
