'use client';

import { X } from 'lucide-react';

export default function PropertyDrawer({ property, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay Oscuro / Backdrop blur */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
        
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
          <h2 className="text-lg font-dm-sans font-bold text-white tracking-tight">Detalle del Activo</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {property ? (
          <div className="p-6 space-y-6 text-sm font-inter">
            {/* Header / ID */}
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Ref. Catastral</p>
              <p className="text-slate-200 font-medium font-dm-sans text-lg">{property.cadastralReference || 'Sin Catastro'}</p>
            </div>

            {/* Badges de Estado */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {property.assetCategory}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                property.occupancyStatus === 'LIBRE' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {property.occupancyStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-slate-500 text-xs uppercase mb-1">Precio</p>
                <p className="text-slate-200 font-dm-sans">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(property.pricePvp || 0)}</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-xl">
                <p className="text-slate-500 text-xs uppercase mb-1">Tipo</p>
                <p className="text-slate-200 font-dm-sans">{property.assetType}</p>
              </div>
            </div>

            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Dirección</p>
              <p className="text-slate-300 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50">
                {property.address}<br/>
                {property.municipality}, {property.province} ({property.postalCode})
              </p>
            </div>

            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Metadatos Raw (JSON)</p>
              <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-400 overflow-x-auto border border-slate-800/50">
                {JSON.stringify(property.rawMetadata, null, 2)}
              </pre>
            </div>

          </div>
        ) : (
          <div className="p-6 text-slate-500 text-sm text-center">Cargando...</div>
        )}
      </div>
    </>
  );
}
