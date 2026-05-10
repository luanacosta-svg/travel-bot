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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header simples */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/login" className="flex items-center gap-2">
            <Image src="/logo-49.png" alt="49Pay" width={32} height={32} className="rounded-lg object-cover" />
            <span className="font-bold text-slate-800">49Pay</span>
          </a>
          <a
            href="/login"
            className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl transition"
          >
            Acessar plataforma →
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-orange-500 rounded-2xl p-7 text-white">
          <p className="text-orange-100 text-sm mb-1">Bem-vindo(a) à equipe 👋</p>
          <h1 className="text-3xl font-bold leading-tight">Tudo que você precisa saber para começar</h1>
          <p className="text-orange-100 text-sm mt-3 leading-relaxed">
            Aqui você encontra seus benefícios, como enviar nota fiscal, solicitar reembolsos e viagens — tudo feito direto pelo 49Pay.
          </p>
        </div>

        {/* Benefícios */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">🎁 Seus benefícios</h2>
          <div className="grid grid-cols-2 gap-3">
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
          <p className="text-xs text-slate-400 mt-3 px-1">
            Dúvidas sobre ativação dos benefícios? Fale com o time de Pessoas.
          </p>
        </section>

        {/* Como receber */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">💳 Como receber seu pagamento</h2>
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            <div className="p-5 flex gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🧾</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">Apenas Nota Fiscal</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Você pode receber somente via NF emitida para a 49 Educação.
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
                  Se combinado com o time, parte do pagamento pode ser via Caju (benefício flexível).
                </p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📅</span>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">Calendário de pagamento</h3>
              </div>
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
                NF enviada depois do dia 25 será processada no mês seguinte.
              </p>
            </div>
          </div>
        </section>

        {/* Reembolsos */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">💸 Reembolsos</h2>
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            <div className="p-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">O que reembolsamos</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Deslocamento</p>
                    <p className="text-xs text-slate-500">Uber, táxi, ônibus, combustível e pedágio a trabalho</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">O que não reembolsamos</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-500 text-xs font-bold">✕</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Alimentação</p>
                    <p className="text-xs text-slate-500">Refeições e lanches não são reembolsáveis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Viagens a trabalho */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">✈️ Viagens a trabalho</h2>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Em viagens a trabalho, <strong className="text-slate-800">passagem e hospedagem são sempre compradas e enviadas pela empresa</strong>. Você não precisa adiantar nenhum valor.
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
                💡 Solicite sua viagem pelo 49Pay com antecedência para garantir as melhores opções.
              </p>
            </div>
          </div>
        </section>

        {/* 49 Pay CTA */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">📱 Acesse o 49Pay</h2>
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo-49.png" alt="49Pay" width={40} height={40} className="rounded-xl object-cover" />
              <div>
                <p className="font-bold">49Pay</p>
                <p className="text-slate-400 text-xs">Notas fiscais, reembolsos e viagens</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-5">
              Todas as suas solicitações — nota fiscal, reembolso e viagem — são feitas direto pelo 49Pay.
            </p>
            <a
              href="/login"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition text-sm text-center"
            >
              Acessar o 49Pay →
            </a>
          </div>
        </section>

        {/* Tour guiado */}
        <section>
          <div className="flex items-center justify-between mb-3">
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
            <div className="space-y-3">
              {TOUR_STEPS.map((step) => {
                const isOpen = activeTourStep === step.id;
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
                  <div
                    key={step.id}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all ${isOpen ? activeBorder[step.color] + " border-2" : "border-slate-200"}`}
                  >
                    <button
                      className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition"
                      onClick={() => setActiveTourStep(isOpen ? null : step.id)}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border ${colorMap[step.color]}`}>
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{step.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{step.description}</p>
                      </div>
                      <span className="text-slate-400 text-lg flex-shrink-0">
                        {isOpen ? "⌃" : "⌄"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 space-y-4">
                        <div className="space-y-3">
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
                          <p className="text-xs font-medium leading-relaxed">
                            💡 {step.tip}
                          </p>
                        </div>

                        <a
                          href="/login"
                          className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition text-sm text-center"
                        >
                          {step.id === 1 ? "Enviar minha nota fiscal →" : step.id === 2 ? "Solicitar reembolso →" : "Solicitar viagem →"}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center py-6 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            49Pay · 49 Educação · Dúvidas? Fale com o time de Pessoas
          </p>
        </footer>
      </main>
    </div>
  );
}
