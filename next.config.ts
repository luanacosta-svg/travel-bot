import type { NextConfig } from "next";

// O CSP é agora gerado dinamicamente com nonce no middleware.ts (M2).
// Aqui ficam apenas os headers estáticos que não precisam de nonce.
const securityHeaders = [
  { key: "Strict-Transport-Security",  value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options",            value: "DENY" },
  { key: "X-Content-Type-Options",     value: "nosniff" },
  { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["nodemailer", "amadeus", "@anthropic-ai/sdk", "heic-convert"],
  // Landing comercial pública: /conheca serve public/conheca/index.html
  async rewrites() {
    return [
      { source: "/conheca",  destination: "/conheca/index.html" },
      { source: "/conheca/", destination: "/conheca/index.html" },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
