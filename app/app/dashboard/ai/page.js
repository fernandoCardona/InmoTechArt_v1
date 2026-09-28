import ChatClient from './ChatClient';

export const metadata = {
  title: 'Asistente Legal RAG | InmoTechArt',
};

export default function AIPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-dm-sans font-bold text-white tracking-tight flex items-center gap-3">
          <span>🧠</span> Asistente Jurídico Copilot
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Consulta dudas normativas, leyes de ocupación (SAE) y normativas autonómicas en tiempo real apoyado por Qdrant RAG.
        </p>
      </header>

      {/* Contenedor del Chat (Glassmorphism) que ocupará el espacio restante */}
      <div className="flex-1 rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
        <ChatClient />
      </div>
    </div>
  );
}
