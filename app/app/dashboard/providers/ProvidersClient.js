'use client';

import { useState, useEffect } from 'react';
import { LuBuilding2, LuPlus, LuSave, LuX } from 'react-icons/lu';

export default function ProvidersClient() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [newProvider, setNewProvider] = useState({
    name: '',
    code: '',
    contactEmail: '',
    notes: ''
  });

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      const json = await res.json();
      if (json.success) {
        setProviders(json.data);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchProviders();
    };
    init();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider)
      });
      const json = await res.json();
      if (json.success) {
        setProviders([json.data, ...providers]);
        setIsCreating(false);
        setNewProvider({ name: '', code: '', contactEmail: '', notes: '' });
        setError('');
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-inter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-dm-sans">Gestión de Proveedores</h1>
          <p className="text-sm text-slate-400 mt-1">Configura las fuentes de origen (Servicers, Inmobiliarias) para clasificar las importaciones.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded-xl transition-colors shadow-lg shadow-amber-500/20"
        >
          {isCreating ? <LuX size={18} /> : <LuPlus size={18} />}
          {isCreating ? 'Cancelar' : 'Nuevo Proveedor'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Añadir Nuevo Proveedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Comercial</label>
              <input 
                required
                type="text" 
                value={newProvider.name}
                onChange={e => setNewProvider({...newProvider, name: e.target.value})}
                placeholder="Ej. Welcome Capital"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Código Único (Prefijo)</label>
              <input 
                required
                type="text" 
                value={newProvider.code}
                onChange={e => setNewProvider({...newProvider, code: e.target.value})}
                placeholder="Ej. WANTOKU5"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email de Contacto</label>
              <input 
                type="email" 
                value={newProvider.contactEmail}
                onChange={e => setNewProvider({...newProvider, contactEmail: e.target.value})}
                placeholder="soporte@proveedor.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Notas / Detalles Adicionales</label>
              <input 
                type="text" 
                value={newProvider.notes}
                onChange={e => setNewProvider({...newProvider, notes: e.target.value})}
                placeholder="Tipo de cartera, SLA..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white font-medium rounded-xl transition-colors"
            >
              <LuSave size={18} />
              {loading ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !isCreating && providers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 animate-pulse">Cargando proveedores...</div>
        ) : providers.map(provider => (
          <div key={provider.id} className="group relative bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 rounded-2xl p-6 shadow-xl hover:border-amber-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <LuBuilding2 size={24} />
              </div>
              <span className={`px-2 py-1 text-[10px] font-medium rounded uppercase tracking-wider ${provider.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {provider.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-200 truncate">{provider.name}</h3>
            <p className="text-xs text-amber-400 font-mono mt-1 mb-4">CODE: {provider.code}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span className="text-slate-500">ID del Proveedor:</span>
                <span className="text-slate-300 font-mono text-[10px] truncate max-w-[120px]" title={provider.id}>{provider.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-2">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-300 truncate max-w-[150px]">{provider.contactEmail || '--'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
