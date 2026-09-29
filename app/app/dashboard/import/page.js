import UploaderClient from './UploaderClient';

export const metadata = {
  title: 'Importador Inmobiliario | Neretxaus',
};

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-dm-sans font-bold text-white tracking-tight">Importador y Conciliador</h1>
        <p className="text-slate-400 mt-2">Carga ficheros Excel o CSV de Servicers (Prinex, Welcome). El Motor IA unificará los esquemas al formato maestro.</p>
      </header>

      {/* Glassmorphism Panel */}
      <div className="rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden p-6 md:p-10">
        <UploaderClient />
      </div>
    </div>
  );
}
