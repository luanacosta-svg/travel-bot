export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          Solicitação enviada!
        </h1>
        <p className="text-slate-500 mb-8">
          Sua solicitação foi recebida. Em breve você receberá um e-mail com as
          opções de viagem disponíveis.
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
        >
          Nova solicitação
        </a>
      </div>
    </main>
  );
}
