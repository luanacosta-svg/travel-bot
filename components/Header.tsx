"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { UserSession } from "@/types";

interface HeaderProps {
  user?: UserSession;
  isAdmin?: boolean;
  title?: string;
}

export default function Header({ user, isAdmin, title }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/dashboard", label: "Início" },
    { href: "/solicitar", label: "Viagem" },
    { href: "/reembolso", label: "Reembolso" },
    { href: "/notas-fiscais", label: "Nota Fiscal" },
    { href: "/minhas-solicitacoes", label: "Minhas solicitações" },
    { href: "/perfil", label: "Perfil" },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
            <img src="/logo-49.png" alt="49Pay" className="h-8 w-8 rounded-lg object-cover" />
            <span className="font-bold text-slate-800">49Pay</span>
          </a>
          {title && <span className="text-slate-400 text-sm">/ {title}</span>}
        </div>

        {/* Desktop nav */}
        {!isAdmin && user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
                  pathname === l.href
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 text-xs font-bold">
                {isAdmin ? "A" : user?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <span className="text-sm text-slate-600 hidden sm:block">
              {isAdmin ? "Admin" : user?.name}
            </span>
            <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500 transition">
              Sair
            </button>
          </div>

          {/* Mobile menu button */}
          {!isAdmin && user && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
            >
              <div className="space-y-1">
                <div className="w-5 h-0.5 bg-slate-600" />
                <div className="w-5 h-0.5 bg-slate-600" />
                <div className="w-5 h-0.5 bg-slate-600" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && !isAdmin && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`block text-sm px-3 py-2 rounded-lg font-medium transition ${
                pathname === l.href ? "bg-orange-50 text-orange-600" : "text-slate-600 hover:bg-slate-50"
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
