import Link from 'next/link';
import { ArrowRight, Database, ShieldCheck, Cpu } from 'lucide-react';

export const metadata = {
  title: 'Neretxaus | Gestión Inteligente de Activos',
  description: 'Plataforma premium para la gestión y análisis avanzado de activos inmobiliarios.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden font-inter selection:bg-violet-500/30">
      
      {/* Background Decorativo Estilo Aurora/Premium */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[150px] mix-blend-screen" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        
        {/* Badge / Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-2xl">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">Sistema Online v1.0</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white font-dm-sans tracking-tight mb-6 drop-shadow-2xl">
          El futuro de los activos <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400">
            inmobiliarios.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          Neretxaus fusiona Inteligencia Artificial generativa, bases de datos vectoriales y control de acceso Zero-Trust para gobernar tu portfolio con precisión milimétrica.
        </p>

        {/* CTA (Call To Action) */}
        <Link 
          href="/login" 
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-950 font-semibold rounded-2xl overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
        >
          <span className="relative z-10 flex items-center gap-2">
            Acceder al Sistema <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {/* Features Minimalistas / Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full">
          {[
            { icon: Database, title: 'Gestión Masiva', desc: 'Sincronización y validación de miles de registros en tiempo real.' },
            { icon: Cpu, title: 'Motor RAG IA', desc: 'Asistente legal conectado a Qdrant y Ollama para consultas exactas.' },
            { icon: ShieldCheck, title: 'Zero-Trust Auth', desc: 'Fingerprinting criptográfico de dispositivos y auditoría inmutable.' },
          ].map((feat, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md text-left transition-colors hover:bg-white/10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-violet-400 mb-4 shadow-inner">
                <feat.icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

      </main>

      {/* Footer minimalista */}
      <footer className="absolute bottom-6 text-slate-500 text-xs font-medium tracking-wide">
        &copy; {new Date().getFullYear()} NERETXAUS. TODOS LOS DERECHOS RESERVADOS.
      </footer>
    </div>
  );
}
