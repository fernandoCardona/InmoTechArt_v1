'use client';

import { useState } from 'react';
import { LuUser, LuLock, LuMoon, LuSun, LuPalette, LuCircleCheck, LuCircleX } from 'react-icons/lu';
import { updateUserProfile, updateUserPassword } from '../../../lib/user-actions';

export default function SettingsClient({ initialData }) {
  const [theme, setTheme] = useState('dark');
  
  // Perfil State
  const [profileData, setProfileData] = useState({ fullName: initialData?.fullName || '', email: initialData?.email || '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Password State
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    const res = await updateUserProfile(profileData);
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Perfil actualizado correctamente.' });
      setIsEditingProfile(false);
    } else {
      setProfileMsg({ type: 'error', text: res.error });
    }
    setProfileLoading(false);
    setTimeout(() => setProfileMsg(null), 3000);
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return setPassMsg({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
    }
    if (passData.newPassword.length < 8) {
      return setPassMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    setPassLoading(true);
    setPassMsg(null);
    const res = await updateUserPassword({
      currentPassword: passData.currentPassword,
      newPassword: passData.newPassword
    });
    if (res.success) {
      setPassMsg({ type: 'success', text: 'Contraseña actualizada de forma segura.' });
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPassMsg({ type: 'error', text: res.error });
    }
    setPassLoading(false);
    setTimeout(() => setPassMsg(null), 4000);
  };

  const renderMessage = (msg) => {
    if (!msg) return null;
    return (
      <div className={`flex items-center gap-2 p-3 mt-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
        {msg.type === 'success' ? <LuCircleCheck size={16} /> : <LuCircleX size={16} />}
        {msg.text}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 font-inter">
      
      {/* TARJETA DE PERFIL Y DATOS */}
      <div className="rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <LuUser size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-200">Datos Personales</h3>
              <p className="text-xs text-slate-400">Tu información de perfil y contacto</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              value={profileData.fullName}
              onChange={(e) => { setProfileData({...profileData, fullName: e.target.value}); setIsEditingProfile(true); }}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico (Login ID)</label>
            <input 
              type="email"
              value={profileData.email}
              onChange={(e) => { setProfileData({...profileData, email: e.target.value}); setIsEditingProfile(true); }}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Rol Asignado (Solo Lectura)</label>
            <div className="inline-block px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              {initialData?.role || 'SUPERADMIN'}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => {
                setProfileData({ fullName: initialData?.fullName || '', email: initialData?.email || '' });
                setIsEditingProfile(false);
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-lg transition-colors border border-slate-700"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={profileLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {profileLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
        {renderMessage(profileMsg)}
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

        <form onSubmit={handlePassSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña Actual</label>
            <input 
              type="password" 
              required
              value={passData.currentPassword}
              onChange={(e) => setPassData({...passData, currentPassword: e.target.value})}
              placeholder="••••••••"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nueva Contraseña</label>
              <input 
                type="password"
                required
                value={passData.newPassword}
                onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                placeholder="Mín. 8 caracteres"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Repetir Nueva</label>
              <input 
                type="password" 
                required
                value={passData.confirmPassword}
                onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                placeholder="Mín. 8 caracteres"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
             <button 
              type="button"
              onClick={() => {
                setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-lg transition-colors border border-slate-700"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={passLoading}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {passLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
        {renderMessage(passMsg)}
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
