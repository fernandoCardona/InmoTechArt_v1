'use client';

import { useState, useRef, useEffect } from 'react';

export default function UploaderClient() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [providerId, setProviderId] = useState(''); // Mapeo ficticio para UI inicial
  const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, PROCESSING, COMPLETED, ERROR
  const [progress, setProgress] = useState({ inserted: 0, updated: 0, failed: 0, total: 0 });
  const [batchId, setBatchId] = useState(null);
  
  const fileInputRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Limpiar EventSource al desmontar
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const startUpload = async () => {
    if (!file || !providerId) return;
    setStatus('UPLOADING');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('providerId', providerId);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error al subir fichero');
      
      setBatchId(data.batchId);
      setStatus('PROCESSING');
      setProgress({ inserted: 0, updated: 0, failed: 0, total: data.totalRows || 100 });
      
      // Iniciar escucha SSE
      startSSE(data.batchId);

    } catch (error) {
      console.error(error);
      setStatus('ERROR');
    }
  };

  const startSSE = (id) => {
    // Si ya había uno, lo cerramos
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/import/progress?batchId=${id}`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'PROGRESS') {
        setProgress(prev => ({ ...prev, ...data.payload }));
      } else if (data.type === 'COMPLETED') {
        setStatus('COMPLETED');
        sse.close();
      } else if (data.type === 'ERROR') {
        setStatus('ERROR');
        sse.close();
      }
    };

    sse.onerror = () => {
      console.error('SSE Error connection lost');
      sse.close();
    };
  };

  // Cálculo de progreso visual
  const percent = progress.total > 0 ? Math.round(((progress.inserted + progress.updated + progress.failed) / progress.total) * 100) : 0;

  return (
    <div className="space-y-6 text-sm">
      
      {/* Selector de Proveedor */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">1. Seleccionar Proveedor</label>
        <select 
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-200 outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
        >
          <option value="" disabled>-- Elige un origen de datos --</option>
          <option value="test-uuid-prinex">SABADELL (Prinex)</option>
          <option value="test-uuid-welcome">CERBERUS (Welcome)</option>
        </select>
      </div>

      {/* Zona de Drop */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">2. Subir Fichero Maestro (.xlsx, .csv)</label>
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ease-in-out ${
            isDragging ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".csv, .xlsx, .xls"
            className="hidden" 
          />
          <div className="text-4xl mb-3">📁</div>
          {file ? (
            <div>
              <p className="text-violet-400 font-medium">{file.name}</p>
              <p className="text-slate-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div>
              <p className="text-slate-300 font-medium">Arrastra tu fichero aquí o haz clic para explorar</p>
              <p className="text-slate-500 text-xs mt-1">Soporta CSV, XLSX hasta 50MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Botón de Acción */}
      {status === 'IDLE' && (
        <button 
          onClick={startUpload}
          disabled={!file || !providerId}
          className="px-6 py-3 rounded-xl bg-violet-600 text-white font-medium transition-all duration-300 ease-in-out hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Iniciar Importación y Conciliación
        </button>
      )}

      {/* Panel de Progreso (SSE) */}
      {(status === 'PROCESSING' || status === 'COMPLETED' || status === 'UPLOADING') && (
        <div className="mt-8 p-6 rounded-xl bg-slate-900 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            {status === 'COMPLETED' ? '✅ Conciliación Finalizada' : '⚙️ Procesando Datos en Tiempo Real...'}
          </h3>
          
          <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
            <div className="bg-violet-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${percent}%` }}></div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 text-center mt-6">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-slate-400 text-xs uppercase">Analizados</p>
              <p className="text-xl text-white font-dm-sans">{progress.total}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <p className="text-emerald-400 text-xs uppercase">Nuevos</p>
              <p className="text-xl text-emerald-400 font-dm-sans">{progress.inserted}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-blue-400 text-xs uppercase">Actualizados</p>
              <p className="text-xl text-blue-400 font-dm-sans">{progress.updated}</p>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
              <p className="text-rose-400 text-xs uppercase">Errores</p>
              <p className="text-xl text-rose-400 font-dm-sans">{progress.failed}</p>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
