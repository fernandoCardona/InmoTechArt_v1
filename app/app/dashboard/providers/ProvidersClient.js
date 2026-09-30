'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DataGridClient from '../DataGridClient';
import { LuBuilding2, LuPlus, LuSave, LuX, LuPencil, LuPower, LuPowerOff } from 'react-icons/lu';

export default function ProvidersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProviderId = searchParams.get('providerId');
  const [deletingAssets, setDeletingAssets] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tableRefreshKey, setTableRefreshKey] = useState(0);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for creating
  const [isCreating, setIsCreating] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '', code: '', contactEmail: '', notes: ''
  });

  // State for editing
  const [editingId, setEditingId] = useState(null);
  const [editProvider, setEditProvider] = useState(null);

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
    fetchProviders();
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProvider)
      });
      const json = await res.json();
      if (json.success) {
        setProviders(providers.map(p => p.id === json.data.id ? json.data : p));
        setEditingId(null);
        setEditProvider(null);
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

  const startEditing = (provider) => {
    setError('');
    setIsCreating(false);
    setEditingId(provider.id);
    setEditProvider({ ...provider });
  };

  
  const handleDeleteAssetsClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAssets = async () => {
    setDeletingAssets(true);
    try {
      const res = await fetch(`/api/properties?providerId=${selectedProviderId}`, { method: 'DELETE' });
      if (res.ok) {
        setShowDeleteModal(false);
        // Incrementar el key fuerza al DataGridClient a desmontarse y volverse a montar (re-fetch)
        setTableRefreshKey(prev => prev + 1);
      } else {
        alert('Error al borrar');
      }
    } catch (e) {
      console.error(e);
      alert('Error interno');
    } finally {
      setDeletingAssets(false);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditProvider(null);
    setError('');
  };

  return (
    <div className="space-y-6 animate-fade-in font-inter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-dm-sans">Gestión de Proveedores</h1>
          <p className="text-sm text-slate-400 mt-1">Configura las fuentes de origen (Servicers, Inmobiliarias) para clasificar las importaciones.</p>
        </div>
        <button 
          onClick={() => {
            if (isCreating) {
              setIsCreating(false);
            } else {
              cancelEditing();
              setIsCreating(true);
            }
          }}
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

      {/* FORMULARIO DE CREACIÓN */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl animate-fade-in-up">
          <h3 className="text-lg font-semibold text-white mb-4">Añadir Nuevo Proveedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Comercial</label>
              <input required type="text" value={newProvider.name} onChange={e => setNewProvider({...newProvider, name: e.target.value})} placeholder="Ej. Welcome Capital" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Código Único (Prefijo)</label>
              <input required type="text" value={newProvider.code} onChange={e => setNewProvider({...newProvider, code: e.target.value})} placeholder="Ej. WANTOKU5" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all uppercase" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email de Contacto</label>
              <input type="email" value={newProvider.contactEmail} onChange={e => setNewProvider({...newProvider, contactEmail: e.target.value})} placeholder="soporte@proveedor.com" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Notas / Detalles Adicionales</label>
              <input type="text" value={newProvider.notes} onChange={e => setNewProvider({...newProvider, notes: e.target.value})} placeholder="Tipo de cartera, SLA..." className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white font-medium rounded-xl transition-colors">
              <LuSave size={18} /> {loading ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      )}

      {/* FORMULARIO DE EDICIÓN */}
      {editingId && (
        <form onSubmit={handleUpdate} className="bg-slate-900/50 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 shadow-xl shadow-amber-500/5 animate-fade-in-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Editando Proveedor: <span className="text-amber-500">{editProvider.name}</span></h3>
            <button type="button" onClick={cancelEditing} className="text-slate-400 hover:text-white"><LuX size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Comercial</label>
              <input required type="text" value={editProvider.name} onChange={e => setEditProvider({...editProvider, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Código Único (Prefijo)</label>
              <input required type="text" value={editProvider.code} onChange={e => setEditProvider({...editProvider, code: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all uppercase" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email de Contacto</label>
              <input type="email" value={editProvider.contactEmail || ''} onChange={e => setEditProvider({...editProvider, contactEmail: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Notas</label>
              <input type="text" value={editProvider.notes || ''} onChange={e => setEditProvider({...editProvider, notes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all" />
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={editProvider.isActive} 
                onChange={e => setEditProvider({...editProvider, isActive: e.target.checked})}
                className="hidden"
              />
              <div className={`w-10 h-6 rounded-full flex items-center transition-colors ${editProvider.isActive ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${editProvider.isActive ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </div>
              <span className={`text-sm font-medium ${editProvider.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {editProvider.isActive ? 'Proveedor Activo' : 'Proveedor Inactivo'}
              </span>
            </label>
            
            <div className="flex gap-3">
              <button type="button" onClick={cancelEditing} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">Cancelar</button>
              <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-900 font-medium rounded-xl transition-colors">
                <LuSave size={18} /> {loading ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* GRID DE PROVEEDORES COMPACTO Y NAVEGABLE */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading && !isCreating && !editingId && providers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 animate-pulse">Cargando proveedores...</div>
        ) : providers.map(provider => (
          <div 
            key={provider.id} 
            onClick={() => router.push(`/dashboard/providers?providerId=${selectedProviderId === provider.id ? '' : provider.id}`)}
            className={`group relative backdrop-blur-md border rounded-xl p-4 shadow-lg transition-all cursor-pointer flex flex-col justify-between min-h-[140px] ${selectedProviderId === provider.id ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/50' : 'bg-white/5 dark:bg-slate-900/40 border-white/10 dark:border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/60'}`}
          >
            
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <LuBuilding2 size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-200 truncate max-w-[120px]" title={provider.name}>{provider.name}</h3>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${provider.isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-rose-400'}`} title={provider.isActive ? 'Activo' : 'Inactivo'}></div>
                
                {/* BOTÓN DE EDICIÓN FLOTANTE */}
                <button 
                  onClick={(e) => { e.stopPropagation(); startEditing(provider); }}
                  className="p-1 text-slate-500 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Editar Proveedor"
                >
                  <LuPencil size={14} />
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-[10px] text-amber-400 font-mono mb-2">CODE: {provider.code}</p>
              
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>ID:</span>
                  <span className="font-mono truncate max-w-[90px] text-slate-500" title={provider.id}>{provider.id.split('-')[0]}...</span>
                </div>
                {provider.contactEmail && (
                  <div className="flex justify-between items-center text-slate-400">
                    <span>@:</span>
                    <span className="truncate max-w-[100px] text-slate-500" title={provider.contactEmail}>{provider.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProviderId && (
        <div className="mt-12 space-y-6 animate-fade-in-up bg-slate-900/30 p-6 rounded-2xl border border-slate-800/50">
          <div className="flex justify-between items-end border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Activos del Proveedor</h2>
              <p className="text-slate-400 text-sm mt-1">
                Visualizando la cartera de <span className="text-amber-500 font-semibold">{providers.find(p => p.id === selectedProviderId)?.name || 'Seleccionado'}</span>
              </p>
            </div>
            <button 
              onClick={handleDeleteAssetsClick}
              disabled={deletingAssets}
              className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LuX size={16} /> {deletingAssets ? 'Borrando...' : 'Borrar TODOS los activos'}
            </button>
          </div>
          
          <div className="bg-slate-950/50 rounded-xl p-1">
            <DataGridClient key={tableRefreshKey} />
          </div>
        </div>
      )}


      {/* MODAL DE SEGURIDAD PARA BORRAR ACTIVOS */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-rose-500/10">
            <div className="flex items-center gap-4 text-rose-500 mb-6">
              <LuPowerOff size={32} className="p-1.5 bg-rose-500/10 rounded-lg" />
              <h3 className="text-xl font-bold text-white">¿Borrar TODOS los activos?</h3>
            </div>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
              Estás a punto de eliminar de forma irreversible absolutamente todos los activos asociados a este proveedor en la base de datos.
              <br/><br/>
              <span className="font-semibold text-amber-500">Esta acción no se puede deshacer.</span> ¿Estás completamente seguro?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAssets}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteAssets}
                disabled={deletingAssets}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                {deletingAssets ? 'Destruyendo...' : 'Sí, Borrar Activos'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
