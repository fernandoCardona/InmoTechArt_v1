'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuUser, LuTarget, LuFlame, LuMail, LuPhone, LuMapPin, LuSend, LuBuilding, LuCircleCheck } from 'react-icons/lu';

export default function ClientProfile({ clientData, searchProfile, matches }) {
  const [activeTab, setActiveTab] = useState('matches'); // Pongo matches por defecto para impresionar
  const [sendingMatchId, setSendingMatchId] = useState(null);

  const tabs = [
    { id: 'data', label: 'Datos Personales', icon: LuUser },
    { id: 'search', label: 'Expectativas IA', icon: LuTarget },
    { id: 'matches', label: 'Sugerencias', icon: LuFlame },
  ];

  const triggerMailerWebhook = async (matchId) => {
    setSendingMatchId(matchId);
    try {
      // Simulación o llamada real a n8n
      await fetch('/api/matches/send', { // Reutilizamos un endpoint o creamos uno nuevo, aquí es pseudocódigo hasta crear la ruta real
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId })
      });
      // Simulamos latencia de red
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMatchId(null);
    }
  };

  return (
    <div className="w-full">
      {/* HEADER CLIENTE */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 mb-8 shadow-2xl flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            <span className="text-2xl font-bold text-white">
              {clientData.firstName.charAt(0)}{clientData.lastName.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{clientData.firstName} {clientData.lastName}</h1>
            <div className="flex gap-4 mt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1"><LuMail size={14} className="text-violet-400"/> {clientData.email}</span>
              {clientData.phone && <span className="flex items-center gap-1"><LuPhone size={14} className="text-amber-400"/> {clientData.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN TABS */}
      <div className="flex gap-2 p-1 bg-slate-900/50 backdrop-blur-md rounded-xl w-fit mb-6 border border-slate-800/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-client-tab"
                className="absolute inset-0 bg-violet-600/20 border border-violet-500/30 rounded-lg"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <tab.icon size={16} className={activeTab === tab.id ? 'text-violet-400' : ''} />
              {tab.label}
              {tab.id === 'matches' && matches?.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs border border-amber-500/30">
                  {matches.length}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* CONTENIDO TABS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'data' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Información de Contacto</h2>
              <p className="text-sm text-slate-400">Las notas y configuraciones manuales del cliente aparecerán aquí en futuras iteraciones.</p>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none" />
              <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2 relative z-10">
                <LuTarget className="text-amber-400" /> Perfil de Búsqueda IA
              </h2>
              <div className="p-5 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-4 relative z-10 shadow-inner">
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Prompt del Motor de Inteligencia Artificial</p>
                <p className="text-slate-300 italic text-sm leading-relaxed border-l-2 border-amber-500/50 pl-4">
                  {searchProfile?.descripcionIA || "El cliente aún no tiene un perfil descriptivo. Configúralo para que n8n busque por ti."}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 relative z-10">
                 <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                   <p className="text-xs text-slate-500">Provincia</p>
                   <p className="font-semibold text-slate-300">{searchProfile?.provincia || 'Cualquiera'}</p>
                 </div>
                 <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                   <p className="text-xs text-slate-500">Presupuesto Máx.</p>
                   <p className="font-semibold text-emerald-400">{searchProfile?.presupuestoMaximo ? `${searchProfile.presupuestoMaximo} €` : 'Sin límite'}</p>
                 </div>
                 <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                   <p className="text-xs text-slate-500">Tipo Preferido</p>
                   <p className="font-semibold text-slate-300">{searchProfile?.tipoActivo || 'Todos'}</p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!matches || matches.length === 0 ? (
                <div className="col-span-full py-16 flex flex-col items-center text-center text-slate-500 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                    <LuFlame size={32} className="text-slate-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-400">Sin Sugerencias Activas</h3>
                  <p className="text-sm mt-2 max-w-md">El motor IA (Ollama + n8n) cruzará los datos automáticamente en la próxima importación masiva de activos.</p>
                </div>
              ) : (
                matches.map(match => (
                  <motion.div 
                    key={match.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all shadow-xl hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] flex flex-col"
                  >
                    {/* Badge Afinidad */}
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/90 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-md">
                      <LuFlame size={12} />
                      {match.matchScore || '95'}% Match
                    </div>

                    {/* Imagen Ficticia / Gradient placeholder */}
                    <div className="h-40 w-full bg-slate-800 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10" />
                      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80')] bg-cover bg-center" />
                      
                      <div className="absolute bottom-3 left-3 z-20">
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-300 bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-md border border-slate-700">
                          <LuBuilding size={12} className="text-violet-400" /> Residencial
                        </span>
                      </div>
                    </div>

                    {/* Cuerpo de la Tarjeta */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-semibold text-white mb-1 leading-tight">Activo #{match.propertyId?.substring(0,8) || 'Desconocido'}</h3>
                      <p className="flex items-center gap-1 text-sm text-slate-400 mb-3">
                        <LuMapPin size={14} className="text-amber-400" /> Alicante, España
                      </p>
                      
                      <div className="text-xs text-slate-300 mb-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex-1 italic">
                        "{match.matchReason || 'Ideal por presupuesto y zona geográfica seleccionada en el perfil del cliente.'}"
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/80">
                        <div className="text-emerald-400 font-bold text-lg">
                          185.000 <span className="text-sm font-normal text-slate-500">€</span>
                        </div>
                        <button 
                          onClick={() => triggerMailerWebhook(match.id)}
                          disabled={sendingMatchId === match.id || match.status === 'SENT'}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            match.status === 'SENT' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-not-allowed'
                              : sendingMatchId === match.id
                                ? 'bg-slate-700 text-slate-300 animate-pulse'
                                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                          }`}
                        >
                          {match.status === 'SENT' ? (
                            <><LuCircleCheck size={16} /> Enviado</>
                          ) : sendingMatchId === match.id ? (
                            'Enviando...'
                          ) : (
                            <><LuSend size={16} /> Recomendar</>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
