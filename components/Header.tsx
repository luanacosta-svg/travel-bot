"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import type { UserSession } from "@/types";

interface HeaderProps {
  user?: UserSession;
  isAdmin?: boolean;
  title?: string;
}

function avatarColor(name: string): { bg: string; text: string } {
  const palette = [
    { bg: "#ede9fe", text: "#7c3aed" },
    { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#dcfce7", text: "#15803d" },
    { bg: "#fce7f3", text: "#be185d" },
    { bg: "#fef3c7", text: "#b45309" },
    { bg: "#cffafe", text: "#0e7490" },
    { bg: "#fee2e2", text: "#b91c1c" },
    { bg: "#f0fdf4", text: "#166534" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function Header({ user, isAdmin, title }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    if (!confirm("Tem certeza que deseja sair?")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const userNavLinks = [
    { href: "/dashboard",          label: "Início" },
    { href: "/solicitar",          label: "Viagem" },
    { href: "/reembolso",          label: "Reembolso" },
    { href: "/notas-fiscais",      label: "Nota Fiscal" },
    { href: "/minhas-solicitacoes", label: "Minhas solicitações" },
    { href: "/perfil",             label: "Perfil" },
  ];

  const adminNavLinks = [
    { href: "/admin",                    label: "Solicitações" },
    { href: "/admin/colaboradores",      label: "Colaboradores" },
    { href: "/admin/contratos",          label: "Contratos" },
  ];

  const navLinks = isAdmin ? adminNavLinks : userNavLinks;

  function isActive(href: string) {
    if (isAdmin) {
      if (href === "/admin") return pathname === "/admin";
      return pathname.startsWith(href);
    }
    return pathname === href;
  }

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <a href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-extrabold text-sm leading-none">49</span>
            </div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight">49Pay</span>
          </a>
          {title && <span className="text-slate-300 text-sm font-normal">/ {title}</span>}
        </div>

        {/* Desktop nav */}
        {(user || isAdmin) && (
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`text-sm px-3 py-1.5 rounded-full font-semibold transition ${
                  isActive(l.href)
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notification bell (users only) */}
          {user && !isAdmin && <NotificationBell />}

          {/* Avatar + name */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-700 text-xs font-extrabold">A</span>
              </div>
            ) : (
              (() => {
                const name = user?.name ?? "?";
                const { bg, text } = avatarColor(name);
                return (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}
                  >
                    <span className="text-xs font-extrabold" style={{ color: text }}>
                      {name[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                );
              })()
            )}
            <span className="text-sm font-semibold text-slate-700 hidden sm:block">
              {isAdmin ? "Admin" : user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-red-500 transition ml-1 font-medium"
            >
              Sair
            </button>
          </div>

          {/* Mobile hamburger */}
          {(user || isAdmin) && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition ml-1"
            >
              <div className="space-y-1.5">
                <div className="w-5 h-0.5 bg-slate-600" />
                <div className="w-5 h-0.5 bg-slate-600" />
                <div className="w-5 h-0.5 bg-slate-600" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (user || isAdmin) && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`block text-sm px-3 py-2.5 rounded-xl font-semibold transition ${
                isActive(l.href)
                  ? "bg-orange-50 text-orange-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
