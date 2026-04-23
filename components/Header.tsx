"use client";

import { useRouter } from "next/navigation";
import type { UserSession } from "@/types";

interface HeaderProps {
  user?: UserSession;
  isAdmin?: boolean;
  title?: string;
}

export default function Header({ user, isAdmin, title }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">✈</span>
          </div>
          <div>
            <span className="font-bold text-slate-800">49 Educação</span>
            {title && (
              <span className="text-slate-400 text-sm ml-2">/ {title}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isAdmin && user && (
            <nav className="hidden sm:flex items-center gap-1">
              <a
                href="/solicitar"
                className="text-sm px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition font-medium"
              >
                Nova solicitação
              </a>
              <a
                href="/minhas-solicitacoes"
                className="text-sm px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition font-medium"
              >
                Minhas viagens
              </a>
            </nav>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 text-xs font-bold">
                {isAdmin ? "A" : user?.name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <span className="text-sm text-slate-600 hidden sm:block">
              {isAdmin ? "Admin" : user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-red-500 transition ml-1"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
