export default function MockupPage() {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <title>Mockup — 49Pay</title>
        <script src="https://cdn.tailwindcss.com" />
        <style>{`
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; }
          .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 12px; }
          .col-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .06em; text-align: center; margin-bottom: 8px; }
          @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
          .skeleton { background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
        `}</style>
      </head>
      <body className="p-8">
        <div className="max-w-5xl mx-auto space-y-16">

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-3">
              49Pay — Prévia das melhorias visuais
            </div>
            <p className="text-slate-500 text-sm">Comparativo Antes × Depois para as 4 mudanças propostas</p>
          </div>

          {/* 1. BORDA LATERAL */}
          <section>
            <p className="section-title">① Borda lateral colorida nos cards</p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="col-label">ANTES</p>
                <div className="space-y-3">
                  {[
                    { badge: "bg-amber-100 text-amber-800", label: "Pendente", name: "Luana Costa", desc: "Almoço com cliente", val: "R$ 85,00", date: "10/05/2026" },
                    { badge: "bg-blue-100 text-blue-800", label: "Aprovado ✓", name: "Marcos Lima", desc: "Uber para evento", val: "R$ 42,00", date: "08/05/2026" },
                    { badge: "bg-green-100 text-green-800", label: "Pago ✓", name: "Ana Souza", desc: "Material de escritório", val: "R$ 120,00", date: "05/05/2026" },
                    { badge: "bg-red-100 text-red-800", label: "Recusado", name: "Pedro Rocha", desc: "NF 102", val: "R$ 3.200,00", date: "02/05/2026", nf: true },
                  ].map((c) => (
                    <div key={c.name} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.badge}`}>{c.label}</span>
                        <span className="text-xs text-slate-400">{c.nf ? "🧾 Nota Fiscal" : "💸 Reembolso"}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{c.name} <span className="font-normal text-slate-400 text-sm">· {c.desc}</span></p>
                      <p className="text-sm text-slate-400">{c.val} · {c.date}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="col-label">DEPOIS</p>
                <div className="space-y-3">
                  {[
                    { border: "bg-amber-400", badge: "bg-amber-100 text-amber-800", label: "Pendente", name: "Luana Costa", desc: "Almoço com cliente", val: "R$ 85,00", date: "10/05/2026" },
                    { border: "bg-blue-500", badge: "bg-blue-100 text-blue-800", label: "Aprovado ✓", name: "Marcos Lima", desc: "Uber para evento", val: "R$ 42,00", date: "08/05/2026" },
                    { border: "bg-green-500", badge: "bg-green-100 text-green-800", label: "Pago ✓", name: "Ana Souza", desc: "Material de escritório", val: "R$ 120,00", date: "05/05/2026" },
                    { border: "bg-red-500", badge: "bg-red-100 text-red-800", label: "Recusado", name: "Pedro Rocha", desc: "NF 102", val: "R$ 3.200,00", date: "02/05/2026", nf: true },
                  ].map((c) => (
                    <div key={c.name} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
                      <div className={`w-1 ${c.border} flex-shrink-0`} />
                      <div className="p-5 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.badge}`}>{c.label}</span>
                          <span className="text-xs text-slate-400">{c.nf ? "🧾 Nota Fiscal" : "💸 Reembolso"}</span>
                        </div>
                        <p className="font-semibold text-slate-800">{c.name} <span className="font-normal text-slate-400 text-sm">· {c.desc}</span></p>
                        <p className="text-sm text-slate-400">{c.val} · {c.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 2. SKELETON */}
          <section>
            <p className="section-title">② Skeleton loading</p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="col-label">ANTES</p>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex items-center justify-center">
                  <p className="text-slate-400 text-sm">Carregando...</p>
                </div>
              </div>
              <div>
                <p className="col-label">DEPOIS</p>
                <div className="space-y-3">
                  {[0,1,2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
                      <div className="w-1 skeleton flex-shrink-0" style={{minHeight: 72}} />
                      <div className="p-5 flex-1 space-y-2">
                        <div className="flex gap-2">
                          <div className="skeleton h-5 rounded-full" style={{width: i === 0 ? 80 : i === 1 ? 96 : 64}} />
                          <div className="skeleton h-5 rounded-full" style={{width: i === 0 ? 64 : i === 1 ? 56 : 80}} />
                        </div>
                        <div className="skeleton h-4 rounded" style={{width: i === 0 ? "75%" : i === 1 ? "65%" : "80%"}} />
                        <div className="skeleton h-3 rounded" style={{width: i === 0 ? "50%" : i === 1 ? "40%" : "55%"}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 3. BADGES */}
          <section>
            <p className="section-title">③ Status badges com ícone + texto</p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="col-label">ANTES</p>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap gap-3 items-center">
                  {[
                    { cls: "bg-amber-100 text-amber-800", t: "Pendente" },
                    { cls: "bg-blue-100 text-blue-800", t: "Aprovado ✓" },
                    { cls: "bg-green-100 text-green-800", t: "Pago ✓" },
                    { cls: "bg-red-100 text-red-800", t: "Recusado" },
                    { cls: "bg-orange-100 text-orange-700", t: "Com opções" },
                    { cls: "bg-blue-100 text-blue-800", t: "Recebido ✓" },
                    { cls: "bg-green-100 text-green-800", t: "Comprado ✓" },
                  ].map((b) => (
                    <span key={b.t} className={`text-xs font-medium px-2.5 py-1 rounded-full ${b.cls}`}>{b.t}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="col-label">DEPOIS</p>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap gap-3 items-center">
                  {[
                    { cls: "bg-amber-100 text-amber-800", t: "⏳ Em análise" },
                    { cls: "bg-blue-100 text-blue-800", t: "✓ Aprovado" },
                    { cls: "bg-green-100 text-green-800", t: "💸 Pago" },
                    { cls: "bg-red-100 text-red-800", t: "✕ Recusado" },
                    { cls: "bg-orange-100 text-orange-700", t: "📋 Com opções" },
                    { cls: "bg-blue-100 text-blue-800", t: "📥 Recebido" },
                    { cls: "bg-green-100 text-green-800", t: "🎟 Comprado" },
                  ].map((b) => (
                    <span key={b.t} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${b.cls}`}>{b.t}</span>
                  ))}
                </div>
                <div className="mt-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
                  <div className="w-1 bg-green-500 flex-shrink-0" />
                  <div className="p-5 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800">💸 Pago</span>
                      <span className="text-xs text-slate-400">💸 Reembolso</span>
                    </div>
                    <p className="font-semibold text-slate-800">Ana Souza <span className="font-normal text-slate-400 text-sm">· Material de escritório</span></p>
                    <p className="text-sm text-slate-400">R$ 120,00 · 05/05/2026</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. AVATAR */}
          <section>
            <p className="section-title">④ Avatar com iniciais coloridas por pessoa</p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="col-label">ANTES</p>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
                  <p className="text-xs text-slate-400 mb-4">Todos os avatares com a mesma cor laranja:</p>
                  <div className="flex items-center gap-5 flex-wrap">
                    {["Luana Costa","Marcos Lima","Ana Souza","Pedro Rocha","Julia Mendes","Rafael Torres"].map((n) => (
                      <div key={n} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 text-xs font-bold">{n[0]}</span>
                        </div>
                        <span className="text-sm text-slate-600">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="col-label">DEPOIS</p>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
                  <p className="text-xs text-slate-400 mb-4">Cor gerada por hash do nome — única por pessoa:</p>
                  <div className="flex items-center gap-5 flex-wrap">
                    {[
                      { name: "Luana Costa",   bg: "#ede9fe", color: "#7c3aed" },
                      { name: "Marcos Lima",   bg: "#dbeafe", color: "#1d4ed8" },
                      { name: "Ana Souza",     bg: "#dcfce7", color: "#15803d" },
                      { name: "Pedro Rocha",   bg: "#fce7f3", color: "#be185d" },
                      { name: "Julia Mendes",  bg: "#fef3c7", color: "#b45309" },
                      { name: "Rafael Torres", bg: "#cffafe", color: "#0e7490" },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: p.bg }}>
                          <span className="text-xs font-bold" style={{ color: p.color }}>{p.name[0]}</span>
                        </div>
                        <span className="text-sm text-slate-600">{p.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-3">Como fica no Header:</p>
                    <div className="bg-white border border-slate-200 rounded-xl px-4 h-12 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">49</span>
                        </div>
                        <span className="font-bold text-slate-800 text-sm">49Pay</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#ede9fe" }}>
                          <span className="text-xs font-bold" style={{ color: "#7c3aed" }}>L</span>
                        </div>
                        <span className="text-sm text-slate-600">Luana Costa</span>
                        <button className="text-xs text-slate-400">Sair</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="text-center text-xs text-slate-400 pb-4">49Pay · Prévia de melhorias visuais · 2026</div>
        </div>
      </body>
    </html>
  );
}
