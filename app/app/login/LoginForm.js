'use client';

import { useState, useEffect } from 'react';
import fpPromise from '@fingerprintjs/fingerprintjs';
import { submitLogin } from './actions';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generamos el Device Fingerprint silenciosamente al cargar el componente
  useEffect(() => {
    async function loadFingerprint() {
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (err) {
        console.error('Error generando fingerprint:', err);
        setError('El sistema antifraude no pudo validar tu dispositivo. Desactiva tu bloqueador de scripts y recarga.');
      }
    }
    loadFingerprint();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!fingerprint) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.target);
    formData.append('deviceFingerprint', fingerprint);

    try {
      const result = await submitLogin(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('¡Acceso concedido! Redirigiendo...');
        // Redirigir al dashboard tras 1 segundo para mostrar el mensaje de éxito
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else if (result.pending) {
        setError('Tu credencial es correcta, pero tu dispositivo NO está autorizado todavía. Un SuperAdmin debe aprobarlo.');
      }
    } catch (err) {
      setError('Error interno del servidor. Por favor, inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5 font-inter">
      {error && (
        <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-in fade-in duration-300">
          ⚠️ {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-in fade-in duration-300">
          ✅ {success}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Corporativo</label>
        <input 
          type="email" 
          name="email"
          required 
          className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-200 outline-none transition-all duration-300 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 placeholder:text-slate-600 shadow-inner shadow-black/20"
          placeholder="admin@neretxaus.local"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
        <input 
          type="password" 
          name="password"
          required 
          className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-200 outline-none transition-all duration-300 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 placeholder:text-slate-600 shadow-inner shadow-black/20"
          placeholder="••••••••••••"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading || !fingerprint}
        className="w-full mt-4 px-4 py-3 rounded-xl bg-violet-600 text-white font-medium transition-all duration-300 ease-in-out hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="animate-pulse">Autenticando dispositivo...</span>
        ) : fingerprint ? (
          'Acceder a la plataforma'
        ) : (
          <span className="animate-pulse">Analizando seguridad...</span>
        )}
      </button>
    </form>
  );
}
