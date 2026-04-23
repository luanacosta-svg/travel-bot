import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "49 Educação · Solicitação de Viagens",
  description: "Sistema de solicitação de passagens e ingressos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
