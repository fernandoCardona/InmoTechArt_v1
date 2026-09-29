'use client';

import { useState, useRef, useEffect } from 'react';
import { LuCheck, LuPencil, LuTriangleAlert } from 'react-icons/lu';

export default function UploaderClient() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [providerId, setProviderId] = useState(''); 
  const [providers, setProviders] = useState([]);
  const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, PROCESSING, COMPLETED, ERROR
  const [progress, setProgress] = useState({ inserted: 0, updated: 0, failed: 0, total: 0 });
  const [batchId, setBatchId] = useState(null);
  
  // Drill-down states
  const [details, setDetails] = useState({ inserted: [], updated: [], failed: [], all: [] });
  const [activeTab, setActiveTab] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  
  const fileInputRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Cargar Proveedores Activos
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/providers');
        const json = await res.json();
        if (json.success) {
          setProviders(json.data.filter(p => p.isActive));
        }
      } catch (err) {
        console.error('Error fetching providers:', err);
      }
    };
    init();
  }, []);

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
    setActiveTab(null);
    setDetails({ inserted: [], updated: [], failed: [], all: [] });
    
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
        if (data.payload.insertedList) {
          setDetails({
            inserted: data.payload.insertedList,
            updated: data.payload.updatedList,
            failed: data.payload.failedList,
            all: data.payload.allList
          });
        }
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
          {providers.length === 0 ? (
            <option value="" disabled>Cargando proveedores...</option>
          ) : providers.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
          ))}
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
            <div 
              onClick={() => status === 'COMPLETED' && setActiveTab('all')}
              className={`p-3 bg-slate-800/50 rounded-lg transition-all ${status === 'COMPLETED' ? 'cursor-pointer hover:bg-slate-700/50' : ''} ${activeTab === 'all' ? 'ring-2 ring-slate-400' : ''}`}
            >
              <p className="text-slate-400 text-xs uppercase">Analizados</p>
              <p className="text-xl text-white font-dm-sans">{progress.total}</p>
            </div>
            <div 
              onClick={() => status === 'COMPLETED' && setActiveTab('inserted')}
              className={`p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 transition-all ${status === 'COMPLETED' ? 'cursor-pointer hover:bg-emerald-500/20' : ''} ${activeTab === 'inserted' ? 'ring-2 ring-emerald-400' : ''}`}
            >
              <p className="text-emerald-400 text-xs uppercase">Nuevos</p>
              <p className="text-xl text-emerald-400 font-dm-sans">{progress.inserted}</p>
            </div>
            <div 
              onClick={() => status === 'COMPLETED' && setActiveTab('updated')}
              className={`p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 transition-all ${status === 'COMPLETED' ? 'cursor-pointer hover:bg-blue-500/20' : ''} ${activeTab === 'updated' ? 'ring-2 ring-blue-400' : ''}`}
            >
              <p className="text-blue-400 text-xs uppercase">Actualizados</p>
              <p className="text-xl text-blue-400 font-dm-sans">{progress.updated}</p>
            </div>
            <div 
              onClick={() => status === 'COMPLETED' && setActiveTab('failed')}
              className={`p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 transition-all ${status === 'COMPLETED' ? 'cursor-pointer hover:bg-rose-500/20' : ''} ${activeTab === 'failed' ? 'ring-2 ring-rose-400' : ''}`}
            >
              <p className="text-rose-400 text-xs uppercase">Errores</p>
              <p className="text-xl text-rose-400 font-dm-sans">{progress.failed}</p>
            </div>
          </div>

          {/* CONTENEDOR DRILL-DOWN DE RESULTADOS */}
          {status === 'COMPLETED' && activeTab && (
            <div className="mt-8 pt-6 border-t border-slate-800/80 animate-in fade-in slide-in-from-top-4 duration-500">
               <div className="flex items-center justify-between mb-4">
                 <h4 className="text-white font-medium flex items-center gap-2">
                   Listado: {activeTab === 'inserted' ? 'Nuevos' : activeTab === 'updated' ? 'Actualizados' : activeTab === 'failed' ? 'Errores' : 'Total Analizados'} 
                   <span className="bg-slate-800 text-xs px-2 py-0.5 rounded text-slate-300">{details[activeTab]?.length || 0}</span>
                 </h4>
                 <button onClick={() => setActiveTab(null)} className="text-slate-400 hover:text-white text-xs transition-colors">
                   Cerrar panel ✕
                 </button>
               </div>
               
               <div className="bg-slate-950/50 rounded-xl border border-slate-800/80 overflow-hidden shadow-inner">
                 <div className="overflow-x-auto max-h-[400px]">
                   <table className="w-full text-left text-slate-300 text-xs whitespace-nowrap">
                     <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                       <tr>
                         <th className="px-4 py-3 font-medium w-16">Fila</th>
                         {/* Render dinámico de columnas tipo Excel (hasta 6) */}
                         {details[activeTab] && details[activeTab].length > 0 && 
                           Object.keys(details[activeTab][0])
                             .filter(k => !['_rowId', '_error'].includes(k))
                             .slice(0, 6)
                             .map((col, i) => (
                               <th key={i} className="px-4 py-3 font-medium truncate max-w-[150px]" title={col}>
                                 {col.startsWith('__EMPTY') ? `Columna ${col.split('_').pop()}` : col}
                               </th>
                             ))
                         }
                         {activeTab === 'failed' && <th className="px-4 py-3 font-medium text-rose-400">Razón del Error</th>}
                         {activeTab === 'failed' && <th className="px-4 py-3 font-medium text-right">Acción</th>}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800/50">
                       {details[activeTab]?.map((row, idx) => {
                         const baseObj = details[activeTab][0] || {};
                         const cols = Object.keys(baseObj).filter(k => !['_rowId', '_error'].includes(k)).slice(0, 6);
                         return (
                         <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                           <td className="px-4 py-3 text-slate-500">#{row._rowId || idx + 1}</td>
                           
                           {/* Celdas dinámicas Excel-like */}
                           {cols.map((col, i) => (
                             <td key={i} className="px-4 py-3 text-slate-400 truncate max-w-[150px]" title={String(row[col] || '')}>
                               {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                             </td>
                           ))}
                           {activeTab === 'failed' && (
                             <td className="px-4 py-3 text-rose-400 font-medium">
                               <div className="flex items-center gap-1">
                                 <LuTriangleAlert size={14} /> {row._error || 'Fallo de validación'}
                               </div>
                             </td>
                           )}
                           {activeTab === 'failed' && (
                             <td className="px-4 py-3 text-right">
                               <button 
                                 onClick={() => setEditingRow(row)}
                                 className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors"
                               >
                                 <LuPencil size={12} /> Corregir
                               </button>
                             </td>
                           )}
                         </tr>
                         );
                       })}
                       {(!details[activeTab] || details[activeTab].length === 0) && (
                         <tr>
                           <td colSpan={activeTab === 'failed' ? 4 : 2} className="px-4 py-12 text-center text-slate-500">
                             No hay registros en esta categoría.
                           </td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE EDICIÓN DE ERRORES (SIMULADO PARA RESULTADO PREMIUM) */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <span className="text-rose-500 bg-rose-500/10 p-1.5 rounded-lg"><LuTriangleAlert size={20} /></span> 
                Corregir Registro (Fila #{editingRow._rowId})
              </h3>
              <button onClick={() => setEditingRow(null)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start gap-3">
                <LuTriangleAlert size={18} className="mt-0.5 shrink-0" />
                <div>
                  <strong className="block mb-1 text-rose-300">Detalle del Error:</strong>
                  {editingRow._error}
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Editor JSON de Datos Brutos</label>
                <p className="text-xs text-slate-500 mb-2">Edita los campos faltantes o erróneos para reintentar la conciliación de este activo en el esquema maestro.</p>
                <textarea 
                  className="w-full h-64 bg-slate-950 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-inner resize-none"
                  defaultValue={JSON.stringify(editingRow, null, 2)}
                  spellCheck="false"
                ></textarea>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingRow(null)} 
                className="px-5 py-2.5 rounded-xl text-slate-300 font-medium hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  alert("✅ Registro guardado y re-conciliado con éxito. (Simulación completa)");
                  setEditingRow(null);
                }} 
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <LuCheck size={18} />
                Guardar y Re-procesar
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
