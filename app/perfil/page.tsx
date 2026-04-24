"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import type { UserSession } from "@/types";

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      const u = d.user ?? null;
      setUser(u);
      if (u) { setName(u.name); setPhone(u.phone ?? ""); }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/auth/update-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user ?? undefined} title="Perfil" />
      <main className="max-w-md mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Meu perfil</h1>
        <p className="text-slate-500 text-sm mb-6">Seus dados são preenchidos automaticamente nos formulários.</p>

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nome completo *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
            <input
              value={user?.email ?? ""}
              disabled
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">O e-mail não pode ser alterado.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Telefone / WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="(51) 99999-9999"
            />
          </div>

          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              ✓ Perfil atualizado com sucesso!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition text-sm"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-400 hover:text-slate-600 transition"
          >
            ← Voltar
          </button>
        </div>
      </main>
    </div>
  );
}
