import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "49Pay",
  description: "Reembolsos, notas fiscais e solicitações de viagem — 49 Educação",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "49Pay",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Lê o nonce gerado pelo middleware para o CSP nonce-based (M2)
  const hdrs  = await headers();
  const nonce = hdrs.get("x-nonce") ?? "";

  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body
        className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased"
        {...(nonce ? { "data-nonce": nonce } : {})}
      >
        {children}
      </body>
    </html>
  );
}
