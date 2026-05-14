"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AppNotification {
  id: string;
  icon: string;
  tone: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const days = Math.floor(diff / 86400);
  return days === 1 ? "ontem" : `${days}d`;
}

const toneCls: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  blue:  "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  red:   "bg-red-100 text-red-700",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open,  setOpen]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/mine");
      if (res.ok) setNotifications(await res.json());
    } catch {}
  }, []);

  // Busca inicial + polling a cada 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function toggle() {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      // Marca todas como lidas ao abrir
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-extrabold text-slate-800 text-sm">Notificações</span>
            {unread > 0 && (
              <button
                className="text-xs text-orange-500 font-bold hover:text-orange-700 transition"
                onClick={markAllRead}
              >
                Marcar tudo como lido
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-slate-400 font-medium">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer ${!n.read ? "bg-orange-50/40" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${toneCls[n.tone] ?? "bg-slate-100 text-slate-600"}`}>
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2 mb-0.5">
                      <span className={`text-sm truncate ${n.read ? "font-medium text-slate-700" : "font-bold text-slate-800"}`}>{n.title}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">{n.body}</p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 bg-slate-50 text-center">
            <a href="/minhas-solicitacoes" className="text-sm text-orange-500 font-bold hover:text-orange-700 transition">
              Ver todas as solicitações →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
