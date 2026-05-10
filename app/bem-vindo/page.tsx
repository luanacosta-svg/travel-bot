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

type Tab = "home" | "beneficios" | "pagamento" | "reembolsos" | "viagens" | "guia";

const TABS: { id: Tab; label: string }[] = [
  { id: "home", label: "Início" },
  { id: "beneficios", label: "Benefícios" },
  { id: "pagamento", label: "Pagamento" },
  { id: "reembolsos", label: "Reembolsos" },
  { id: "viagens", label: "Viagens" },
  { id: "guia", label: "Guia" },
];

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

export default function BemVindoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [activeTourStep, setActiveTourStep] = useState<number | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  function goTo(tab: Tab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", tab === "home" ? "/bem-vindo" : `/bem-vindo#${tab}`);
  }

  function toggleExpandAll() {
    if (expandAll) {
      setActiveTourStep(null);
      setExpandAll(false);
    } else {
      setExpandAll(true);
      setActiveTourStep(-1); // sentinel: all open
    }
  }

  function isStepOpen(id: number) {
    return expandAll || activeTourStep === id;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => goTo("home")} className="flex items-center gap-2">
            <Image src="/logo-49.png" alt="49Pay" width={32} height={32} className="rounded-lg object-cover" />
            <span className="font-bold text-slate-800">49Pay</span>
          </button>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeTab === tab.id
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Mobile tabs */}
          <div className="flex md:hidden items-center gap-1 overflow-x-auto max-w-xs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <a
            href="/login"
            className="hidden md:block text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl transition"
          >
            Acessar →
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* HOME */}
        {activeTab === "home" && (
          <div className="space-y-10">
            {/* Hero */}
            <div className="bg-orange-500 rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <p className="text-orange-100 text-sm mb-2">Bem-vindo(a) à equipe 👋</p>
                <h1 className="text-3xl md:text-4xl font-bold leading-tight">Tudo que você precisa saber para começar</h1>
                <p className="text-orange-100 text-sm mt-4 leading-relaxed max-w-lg">
                  Benefícios, pagamentos, reembolsos e viagens — tudo feito direto pelo 49Pay.
                </p>
              </div>
              <div className="flex gap-3 md:flex-col md:items-end">
                <a href="/login" className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-xl hover:bg-orange-50 transition text-sm text-center">
                  Acessar o 49Pay →
                </a>
                <button
                  onClick={() => goTo("guia")}
                  className="inline-block bg-orange-400 hover:bg-orange-300 text-white font-semibold px-6 py-3 rounded-xl transition text-sm text-center"
                >
                  Ver guia rápido
                </button>
              </div>
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { tab: "beneficios" as Tab, icon: "🎁", title: "Benefícios", desc: "Gympass e Conexa Saúde" },
                { tab: "pagamento" as Tab, icon: "💳", title: "Pagamento", desc: "NF até dia 25, recebe dia 5" },
                { tab: "reembolsos" as Tab, icon: "💸", title: "Reembolsos", desc: "Deslocamento a trabalho" },
                { tab: "viagens" as Tab, icon: "✈️", title: "Viagens", desc: "Passagem e hotel pela empresa" },
              ].map((c) => (
                <button
                  key={c.tab}
                  onClick={() => goTo(c.tab)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-orange-400 hover:bg-orange-50 transition group"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <p className="font-semibold text-slate-800 text-sm mt-3">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
                  <p className="text-xs text-orange-500 font-medium mt-3 group-hover:underline">Ver mais →</p>
                </button>
              ))}
            </div>

            {/* CTA final */}
            <div className="bg-slate-900 rounded-2xl p-8 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4 flex-1">
                <Image src="/logo-49.png" alt="49Pay" width={48} height={48} className="rounded-xl object-cover flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">49Pay</p>
                  <p className="text-slate-400 text-sm mt-0.5">Notas fiscais, reembolsos e viagens — tudo em um só lugar</p>
                </div>
              </div>
              <a href="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl transition text-sm text-center whitespace-nowrap">
                Acessar o 49Pay →
              </a>
            </div>
          </div>
        )}

        {/* BENEFÍCIOS */}
        {activeTab === "beneficios" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">🎁 Seus benefícios</h2>
              <p className="text-slate-500 text-sm mt-1">Benefícios disponíveis para todos os colaboradores da 49 Educação.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🏋️</span>
                </div>
                <h3 className="font-bold text-slate-800">Gympass</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Acesso a academias, estúdios de pilates, yoga, crossfit e muito mais em todo o Brasil. Escolha o plano que melhor se encaixa na sua rotina.
                </p>
                <a
                  href="https://gympass.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-4 text-sm text-green-600 font-medium hover:text-green-700 transition"
                >
                  Acessar Gympass →
                </a>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-2xl">🩺</span>
                </div>
                <h3 className="font-bold text-slate-800">Conexa Saúde</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Consultas médicas online com especialistas de diversas áreas, disponível 24 horas por dia, 7 dias por semana, direto pelo aplicativo.
                </p>
                <a
                  href="https://conexasaude.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-4 text-sm text-blue-600 font-medium hover:text-blue-700 transition"
                >
                  Acessar Conexa Saúde →
                </a>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <p className="text-sm text-amber-800 font-medium">📬 Dúvidas sobre ativação dos benefícios?</p>
              <p className="text-sm text-amber-700 mt-1">
                Fale com nosso time pelo{" "}
                <a
                  href="https://wa.me/5548996843058"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-amber-900 transition"
                >
                  🧡 WhatsApp
                </a>
                {" "}— vamos te ajudar a ativar e configurar cada benefício.
              </p>
            </div>
          </div>
        )}

        {/* PAGAMENTO */}
        {activeTab === "pagamento" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">💳 Como receber seu pagamento</h2>
              <p className="text-slate-500 text-sm mt-1">Entenda as formas de recebimento e o calendário mensal.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🧾</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Apenas Nota Fiscal</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Emita a NF para a 49 Educação com o valor combinado e envie pelo 49Pay.
                  </p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💜</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Nota Fiscal + Caju</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Se combinado com o time, parte do pagamento pode ser feita via Caju, o benefício flexível.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-800 mb-4">📅 Calendário de pagamento</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-center">
                  <p className="text-4xl font-bold text-amber-600">25</p>
                  <p className="text-sm text-amber-700 font-medium mt-1">Prazo para enviar a NF</p>
                  <p className="text-xs text-amber-500 mt-1">de cada mês</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-center">
                  <p className="text-4xl font-bold text-green-600">05</p>
                  <p className="text-sm text-green-700 font-medium mt-1">Dia do pagamento</p>
                  <p className="text-xs text-green-500 mt-1">do mês seguinte</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-sm text-slate-600">
                  ⚠️ NF enviada depois do dia 25 será processada e paga no mês seguinte.
                </p>
              </div>
            </div>
            <a
              href="/login"
              className="block w-full md:w-auto md:inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl transition text-sm text-center"
            >
              Enviar minha nota fiscal →
            </a>
          </div>
        )}

        {/* REEMBOLSOS */}
        {activeTab === "reembolsos" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">💸 Reembolsos</h2>
              <p className="text-slate-500 text-sm mt-1">O que é reembolsável e como solicitar.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-green-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-4">✅ Reembolsamos</h3>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Deslocamento</p>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">Uber, táxi, ônibus, combustível e pedágio utilizados a trabalho.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-red-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-4">❌ Não reembolsamos</h3>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-500 text-sm font-bold">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Alimentação</p>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">Refeições, lanches e delivery não são reembolsáveis.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-800 mb-3">Como solicitar reembolso</h3>
              <div className="space-y-3">
                {["Acesse o 49Pay e toque em Reembolso", "Selecione a categoria de despesa", "Informe o valor e a data", "Anexe o comprovante (foto ou PDF)", "Envie — acompanhe o status em Minhas solicitações"].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-sm text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <a
              href="/login"
              className="block w-full md:w-auto md:inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl transition text-sm text-center"
            >
              Solicitar reembolso →
            </a>
          </div>
        )}

        {/* VIAGENS */}
        {activeTab === "viagens" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">✈️ Viagens a trabalho</h2>
              <p className="text-slate-500 text-sm mt-1">Como funciona o processo de viagens corporativas.</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
              <p className="text-lg font-semibold text-slate-800 leading-relaxed">
                Em viagens a trabalho, <span className="text-orange-600">passagem e hospedagem são sempre compradas e enviadas pela empresa</span>. Você não precisa adiantar nenhum valor.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex gap-4">
                <span className="text-3xl">🎫</span>
                <div>
                  <h3 className="font-bold text-slate-800">Passagem</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Aérea ou terrestre, pesquisada e comprada pelo time da 49 Educação.</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex gap-4">
                <span className="text-3xl">🏨</span>
                <div>
                  <h3 className="font-bold text-slate-800">Hospedagem</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">Hotel selecionado e reservado pela empresa — você só precisa se hospedar.</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-800 mb-3">Como solicitar uma viagem</h3>
              <div className="space-y-3">
                {[
                  "Acesse o 49Pay e toque em Viagem",
                  "Informe origem, destino e datas",
                  "Detalhe o evento ou motivo da viagem",
                  "Adicione preferências de horário ou hotel (opcional)",
                  "Nossa equipe retorna com as opções de passagem e hospedagem",
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-sm text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <a
              href="/login"
              className="block w-full md:w-auto md:inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl transition text-sm text-center"
            >
              Solicitar viagem →
            </a>
          </div>
        )}

        {/* GUIA */}
        {activeTab === "guia" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">🗺️ Guia rápido do 49Pay</h2>
                <p className="text-slate-500 text-sm mt-1">Passo a passo para as principais ações na plataforma.</p>
              </div>
              <button
                onClick={toggleExpandAll}
                className="whitespace-nowrap text-sm font-medium text-slate-500 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 transition hover:bg-slate-50 flex-shrink-0"
              >
                {expandAll ? "Recolher todos ▲" : "Expandir todos ▼"}
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {TOUR_STEPS.map((step) => {
                const isOpen = isStepOpen(step.id);
                return (
                  <div
                    key={step.id}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all ${isOpen ? activeBorder[step.color] + " border-2" : "border-slate-200"}`}
                  >
                    <button
                      className="w-full flex items-center gap-3 p-5 text-left hover:bg-slate-50 transition"
                      onClick={() => {
                        if (expandAll) return; // em expandAll individual click não faz nada
                        setActiveTourStep(isOpen ? null : step.id);
                      }}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${colorMap[step.color]}`}>
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{step.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{step.description}</p>
                      </div>
                      {!expandAll && <span className="text-slate-400 flex-shrink-0">{isOpen ? "▲" : "▼"}</span>}
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
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-8 mt-12 border-t border-slate-200 space-y-2">
          <p className="text-xs text-slate-400">
            49Pay · 49 Educação
          </p>
          <p className="text-xs text-slate-400">
            Dúvidas?{" "}
            <a
              href="https://wa.me/5548996843058"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600 font-medium transition"
            >
              🧡 Fale com nosso time no WhatsApp
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
