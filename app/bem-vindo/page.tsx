"use client";

import { useState } from "react";
import Image from "next/image";

const TOUR_STEPS = [
  {
    id: 1,
    icon: "🧾",
    title: "Enviar Nota Fiscal",
    color: "orange",
    description: "Use esta opção para enviar sua NF mensal e receber o pagamento.",
    steps: [
      { label: "Acesse", detail: "No menu principal, toque em Nota Fiscal" },
      { label: "Preencha", detail: "Descrição do serviço, nome da empresa e CNPJ" },
      { label: "Informe o valor", detail: "Digite o valor total da nota fiscal" },
      { label: "Anexe o arquivo", detail: "Faça upload do PDF, XML, JPG ou PNG da NF" },
      { label: "Envie", detail: "Toque em Enviar nota fiscal — você receberá a confirmação" },
    ],
    tip: "Envie até o dia 25 do mês para garantir o pagamento no dia 5 do mês seguinte.",
  },
  {
    id: 2,
    icon: "💸",
    title: "Solicitar Reembolso",
    color: "amber",
    description: "Reembolsamos despesas com deslocamento. Informe a despesa e o comprovante.",
    steps: [
      { label: "Acesse", detail: "No menu principal, toque em Reembolso" },
      { label: "Selecione a categoria", detail: "Escolha o tipo de despesa (ex: deslocamento)" },
      { label: "Descreva", detail: "Informe o que foi gasto e a data" },
      { label: "Informe o valor", detail: "Digite o valor exato do comprovante" },
      { label: "Anexe o comprovante", detail: "Foto ou PDF do recibo / cupom fiscal" },
      { label: "Envie", detail: "Toque em Solicitar reembolso — acompanhe o status em Minhas solicitações" },
    ],
    tip: "Reembolsamos apenas despesas com deslocamento. Alimentação não é reembolsável.",
  },
  {
    id: 3,
    icon: "✈️",
    title: "Solicitar Viagem",
    color: "blue",
    description: "Precisa viajar a trabalho? Solicite pelo app e cuidamos de tudo.",
    steps: [
      { label: "Acesse", detail: "No menu principal, toque em Viagem" },
      { label: "Informe o destino", detail: "Cidade de origem, destino e datas da viagem" },
      { label: "Detalhe o evento", detail: "Nome do evento ou motivo da viagem" },
      { label: "Adicione preferências", detail: "Preferências de horário, classe ou hotel (opcional)" },
      { label: "Envie a solicitação", detail: "Nossa equipe retorna com as opções de passagem e hospedagem" },
    ],
    tip: "Passagem e hospedagem são comprados e enviados diretamente pela empresa — você não precisa adiantar nada.",
  },
];

export default function BemVindoPage() {
  const [activeTourStep, setActiveTourStep] = useState<number | null>(null);
  const [tourOpen, setTourOpen] = useState(false);

  const colorMap: Record<string, string> = {
    orange: "bg-orange-100 text-orange-600 border-orange-200",
    amber: "bg-amber-100 text-amber-600 border-amber-200",
    blue: "bg-blue-100 text-blue-600 border-blue-200",
  };
  const activeBorder: Record<string, string> = {
    orange: "border-orange-400",
    amber: "border-amber-400",
    blue: "border-blue-400",
  };
  const badgeBg: Record<string, string> = {
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/login" className="flex items-center gap-2">
            <Image src="/logo-49.png" alt="49Pay" width={32} height={32} className="rounded-lg object-cover" />
            <span className="font-bold text-slate-800">49Pay</span>
          </a>
          <nav className="hidden md:flex items-center gap-1 text-sm text-slate-500">
            <a href="#beneficios" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">Benefícios</a>
            <a href="#pagamento" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">Pagamento</a>
            <a href="#reembolsos" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">Reembolsos</a>
            <a href="#viagens" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">Viagens</a>
            <a href="#guia" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 transition">Guia</a>
          </nav>
          <a
            href="/login"
            className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl transition"
          >
            Acessar plataforma →
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">

        {/* Hero */}
        <div className="bg-orange-500 rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-orange-100 text-sm mb-2">Bem-vindo(a) à equipe 👋</p>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">Tudo que você precisa saber para começar</h1>
            <p className="text-orange-100 text-sm mt-4 leading-relaxed max-w-lg">
              Aqui você encontra seus benefícios, como enviar nota fiscal, solicitar reembolsos e viagens — tudo feito direto pelo 49Pay.
            </p>
          </div>
          <div className="flex gap-3 md:flex-col md:items-end">
            <a href="/login" className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-xl hover:bg-orange-50 transition text-sm text-center">
              Acessar o 49Pay →
            </a>
            <button
              onClick={() => { setTourOpen(true); document.getElementById("guia")?.scrollIntoView({ behavior: "smooth" }); }}
              className="inline-block bg-orange-400 hover:bg-orange-300 text-white font-semibold px-6 py-3 rounded-xl transition text-sm text-center"
            >
              Ver guia rápido
            </button>
          </div>
        </div>

        {/* Grid principal — Benefícios + Pagamento lado a lado */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Benefícios */}
          <section id="beneficios">
            <h2 className="text-lg font-bold text-slate-800 mb-4">🎁 Seus benefícios</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-xl">🏋️</span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Gympass</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Acesso a academias e estúdios parceiros em todo o Brasil.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-xl">🩺</span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Conexa Saúde</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Consultas médicas online com especialistas, disponível 24h.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 px-1">
              Dúvidas sobre ativação? Fale com o time de Pessoas.
            </p>
          </section>

          {/* Reembolsos */}
          <section id="reembolsos">
            <h2 className="text-lg font-bold text-slate-800 mb-4">💸 Reembolsos</h2>
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 h-[calc(100%-2.5rem)]">
              <div className="p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Reembolsamos</h3>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Deslocamento</p>
                    <p className="text-xs text-slate-500 mt-0.5">Uber, táxi, ônibus, combustível e pedágio a trabalho</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Não reembolsamos</h3>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-500 text-xs font-bold">✕</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Alimentação</p>
                    <p className="text-xs text-slate-500 mt-0.5">Refeições e lanches não são reembolsáveis</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Pagamento + Viagens lado a lado */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Como receber */}
          <section id="pagamento">
            <h2 className="text-lg font-bold text-slate-800 mb-4">💳 Como receber seu pagamento</h2>
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
              <div className="p-5 flex gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🧾</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Apenas Nota Fiscal</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Emitida para a 49 Educação — envie pelo 49Pay.
                  </p>
                </div>
              </div>
              <div className="p-5 flex gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">💜</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Nota Fiscal + Caju</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Se combinado com o time, parte pode ser via Caju (benefício flexível).
                  </p>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Calendário</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">25</p>
                    <p className="text-xs text-amber-700 font-medium">prazo para enviar a NF</p>
                    <p className="text-xs text-amber-500 mt-0.5">de cada mês</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">05</p>
                    <p className="text-xs text-green-700 font-medium">dia do pagamento</p>
                    <p className="text-xs text-green-500 mt-0.5">mês seguinte</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  NF enviada depois do dia 25 entra no mês seguinte.
                </p>
              </div>
            </div>
          </section>

          {/* Viagens */}
          <section id="viagens">
            <h2 className="text-lg font-bold text-slate-800 mb-4">✈️ Viagens a trabalho</h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 h-[calc(100%-2.5rem)]">
              <p className="text-sm text-slate-600 leading-relaxed">
                Em viagens a trabalho, <strong className="text-slate-800">passagem e hospedagem são sempre compradas pela empresa</strong>. Você não precisa adiantar nenhum valor.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-xl">🎫</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Passagem</p>
                    <p className="text-xs text-slate-500 mt-0.5">Aérea ou terrestre, já comprada pela empresa</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-xl">🏨</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Hospedagem</p>
                    <p className="text-xs text-slate-500 mt-0.5">Hotel reservado e pago pela empresa</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                <p className="text-xs text-orange-700 font-medium">
                  💡 Solicite com antecedência pelo 49Pay para garantir as melhores opções.
                </p>
              </div>
              <a
                href="/login"
                className="block w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition text-sm text-center"
              >
                Solicitar viagem →
              </a>
            </div>
          </section>
        </div>

        {/* Tour guiado — largura total */}
        <section id="guia">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">🗺️ Guia rápido do 49Pay</h2>
            <button
              onClick={() => setTourOpen((v) => !v)}
              className="text-xs text-orange-500 font-semibold hover:text-orange-600 transition"
            >
              {tourOpen ? "Fechar guia" : "Ver guia"}
            </button>
          </div>

          {!tourOpen && (
            <div
              onClick={() => setTourOpen(true)}
              className="bg-white border-2 border-dashed border-orange-200 rounded-2xl p-6 flex items-center gap-4 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition"
            >
              <div className="flex gap-2">
                {TOUR_STEPS.map((s) => (
                  <div key={s.id} className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {s.icon}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Como usar o 49Pay</p>
                <p className="text-xs text-slate-500 mt-0.5">Passo a passo para NF, reembolso e viagem</p>
              </div>
            </div>
          )}

          {tourOpen && (
            <div className="grid md:grid-cols-3 gap-4">
              {TOUR_STEPS.map((step) => {
                const isOpen = activeTourStep === step.id;
                return (
                  <div
                    key={step.id}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all ${isOpen ? activeBorder[step.color] + " border-2" : "border-slate-200"}`}
                  >
                    <button
                      className="w-full flex items-center gap-3 p-5 text-left hover:bg-slate-50 transition"
                      onClick={() => setActiveTourStep(isOpen ? null : step.id)}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${colorMap[step.color]}`}>
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{step.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{step.description}</p>
                      </div>
                      <span className="text-slate-400 flex-shrink-0">{isOpen ? "▲" : "▼"}</span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                        <div className="space-y-3 pt-4">
                          {step.steps.map((s, i) => (
                            <div key={i} className="flex gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5 ${badgeBg[step.color]}`}>
                                {i + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                                <p className="text-xs text-slate-500 leading-relaxed">{s.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className={`rounded-xl px-4 py-3 border ${colorMap[step.color]}`}>
                          <p className="text-xs font-medium leading-relaxed">💡 {step.tip}</p>
                        </div>
                        <a
                          href="/login"
                          className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition text-sm text-center"
                        >
                          {step.id === 1 ? "Enviar nota fiscal →" : step.id === 2 ? "Solicitar reembolso →" : "Solicitar viagem →"}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CTA final */}
        <section>
          <div className="bg-slate-900 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <Image src="/logo-49.png" alt="49Pay" width={48} height={48} className="rounded-xl object-cover flex-shrink-0" />
              <div>
                <p className="font-bold text-white">49Pay</p>
                <p className="text-slate-400 text-sm mt-0.5">Notas fiscais, reembolsos e viagens — tudo em um só lugar</p>
              </div>
            </div>
            <a
              href="/login"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl transition text-sm text-center whitespace-nowrap"
            >
              Acessar o 49Pay →
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-4 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            49Pay · 49 Educação · Dúvidas? Fale com o time de Pessoas
          </p>
        </footer>
      </main>
    </div>
  );
}
