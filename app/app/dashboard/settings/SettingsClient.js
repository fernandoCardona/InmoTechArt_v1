'use client';

import { useState } from 'react';
import { LuUser, LuLock, LuMoon, LuSun, LuPalette } from 'react-icons/lu';

export default function SettingsClient({ initialData }) {
  const [theme, setTheme] = useState('dark');
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    // En un proyecto real, mutar el localStorage y el classList de HTML
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
  };

  const handleFakeSubmit = (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setTimeout(() => setIsUpdating(false), 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 font-inter">
      
      {/* TARJETA DE PERFIL Y DATOS */}
      <div className="rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <LuUser size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">Datos Personales</h3>
            <p className="text-xs text-slate-400">Tu información de perfil</p>
          </div>
        </div>

        <form onSubmit={handleFakeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              defaultValue={initialData?.fullName || 'Super Administrador'} 
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico (Solo Lectura)</label>
            <input 
              type="email" 
              readOnly
              defaultValue={initialData?.email || 'admin@inmotechart.local'} 
              className="w-full bg-slate-800/30 border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Rol Asignado</label>
            <div className="inline-block px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              {initialData?.role || 'SUPERADMIN'}
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors border border-slate-700"
          >
            {isUpdating ? 'Guardando...' : 'Actualizar Perfil'}
          </button>
        </form>
      </div>

      {/* TARJETA DE SEGURIDAD (PASSWORD) */}
      <div className="rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
            <LuLock size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">Seguridad & Contraseña</h3>
            <p className="text-xs text-slate-400">Actualiza tus credenciales de acceso</p>
          </div>
        </div>

        <form onSubmit={handleFakeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña Actual</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nueva Contraseña</label>
              <input 
                type="password" 
                placeholder="Mín. 8 caracteres"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Repetir Nueva</label>
              <input 
                type="password" 
                placeholder="Mín. 8 caracteres"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {isUpdating ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>

      {/* TARJETA DE APARIENCIA (LIGHT / DARK) */}
      <div className="col-span-1 lg:col-span-2 rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <LuPalette size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">Apariencia de la Interfaz</h3>
            <p className="text-xs text-slate-400">Personaliza tu experiencia visual</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => toggleTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl border transition-all duration-300 font-medium ${
              theme === 'dark' 
                ? 'bg-slate-800 border-amber-500 text-white shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]' 
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <LuMoon size={20} />
            Modo Oscuro (Premium)
          </button>
          
          <button
            onClick={() => toggleTheme('light')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl border transition-all duration-300 font-medium ${
              theme === 'light' 
                ? 'bg-white border-amber-500 text-slate-900 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]' 
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LuSun size={20} />
            Modo Claro
          </button>
        </div>
      </div>

    </div>
  );
}
