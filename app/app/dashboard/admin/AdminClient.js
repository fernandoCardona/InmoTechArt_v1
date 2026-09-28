'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, MonitorSmartphone, Activity, Search } from 'lucide-react';
import { getAllSearchHistory } from '../../../lib/search-actions';

export default function AdminClient() {
  const [data, setData] = useState({ devices: [], logs: [] });
  const [globalHistory, setGlobalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      if (!res.ok) throw new Error('No tienes permisos de SuperAdmin.');
      const json = await res.json();
      setData(json);

      // Traer el historial global de búsquedas
      const historyRes = await getAllSearchHistory();
      if (historyRes.success) {
        setGlobalHistory(historyRes.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeviceStatus = async (deviceId, status) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, status })
      });
      if (res.ok) {
        fetchAdminData(); // Refresh UI
      }
    } catch (e) {
      console.error('Error changing device status', e);
    }
  };

  if (loading) {
    return <div className="text-slate-500 animate-pulse mt-10">Cargando centro de seguridad...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 mt-10 flex items-center gap-3">
        <ShieldAlert /> {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-inter">
      
      {/* Columna Izquierda: Dispositivos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <MonitorSmartphone size={20} className="text-violet-400" /> Control de Dispositivos
        </h2>
        
        <div className="rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
            {data.devices.length === 0 ? (
              <div className="p-6 text-slate-500 text-center">No hay dispositivos registrados.</div>
            ) : data.devices.map(dev => (
              <div key={dev.id} className="p-5 hover:bg-slate-800/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-slate-200 font-medium">{dev.userEmail}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1" title={dev.fingerprint}>
                      ID: {dev.fingerprint.substring(0, 16)}...
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${
                    dev.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    dev.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {dev.status}
                  </span>
                </div>
                
                {dev.status === 'PENDING' && (
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => handleDeviceStatus(dev.id, 'APPROVED')}
                      className="flex-1 px-3 py-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={14} /> Aprobar
                    </button>
                    <button 
                      onClick={() => handleDeviceStatus(dev.id, 'REJECTED')}
                      className="flex-1 px-3 py-1.5 text-xs bg-rose-600/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg transition-colors"
                    >
                      Denegar
                    </button>
                  </div>
                )}
                
                {dev.status === 'APPROVED' && (
                  <button 
                    onClick={() => handleDeviceStatus(dev.id, 'REJECTED')}
                    className="mt-3 text-[10px] text-rose-400 hover:text-rose-300 underline underline-offset-2"
                  >
                    Revocar acceso
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Logs de Auditoría */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <Activity size={20} className="text-blue-400" /> Auditoría de Accesos
        </h2>

        <div className="rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
            {data.logs.length === 0 ? (
              <div className="p-6 text-slate-500 text-center">No hay registros de auditoría.</div>
            ) : data.logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 font-medium truncate">
                    {log.userEmail || 'Usuario Anónimo'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded uppercase">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.ip}</span>
                  </div>
                  {!log.success && log.reason && (
                    <p className="text-[10px] text-rose-400 mt-1 truncate">Razón: {log.reason}</p>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Fila Inferior: Historial Global de Búsquedas */}
      <div className="mt-8 space-y-4 col-span-1 lg:col-span-2">
        <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <Search size={20} className="text-emerald-400" /> Historial Global de Búsquedas
        </h2>

        <div className="rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto">
            {globalHistory.length === 0 ? (
              <div className="p-6 text-slate-500 text-center">No hay búsquedas registradas en el sistema.</div>
            ) : globalHistory.map(item => (
              <div key={item.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                    <Search size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-400 font-medium truncate">
                      "{item.searchQuery}"
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Realizada por: <span className="text-slate-300">{item.userName} ({item.userEmail})</span>
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 whitespace-nowrap bg-slate-800 px-2 py-1 rounded">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
