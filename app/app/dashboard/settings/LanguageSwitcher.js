'use client';

import { useState } from 'react';
import { updateUserLocale } from './actions';
import { LuGlobe } from 'react-icons/lu';
import { useRouter } from 'next/navigation';

export default function LanguageSwitcher({ currentLocale }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLanguageChange = async (locale) => {
    setLoading(true);
    await updateUserLocale(locale);
    // Forzamos un refresh de Next.js para recargar las traducciones en Server Components
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden p-6 mt-8 font-inter">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
          <LuGlobe size={20} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Preferencias de Idioma / Preferències d&apos;Idioma</h3>
          <p className="text-xs text-slate-400">Selecciona el idioma por defecto para tu interfaz (ES/CA).</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          disabled={loading}
          onClick={() => handleLanguageChange('es')}
          className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-300 font-medium text-sm ${
            currentLocale === 'es' 
              ? 'bg-violet-600 border-violet-500 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]' 
              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Español (ES)
        </button>
        <button
          disabled={loading}
          onClick={() => handleLanguageChange('ca')}
          className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-300 font-medium text-sm ${
            currentLocale === 'ca' 
              ? 'bg-violet-600 border-violet-500 text-white shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]' 
              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Català (CA)
        </button>
      </div>
    </div>
  );
}
