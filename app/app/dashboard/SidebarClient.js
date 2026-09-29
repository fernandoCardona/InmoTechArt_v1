'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LuLayoutDashboard, 
  LuUpload, 
  LuBot, 
  LuShieldCheck,
  LuSettings,
  LuLogOut, 
  LuChevronLeft, 
  LuChevronRight,
  LuHistory,
  LuSearch,
  LuChevronDown,
  LuUsers,
  LuBuilding2
} from 'react-icons/lu';
import { logout } from '../../lib/actions';
import { getMySearchHistory } from '../../lib/search-actions';

export default function SidebarClient({ t, userRole }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const pathname = usePathname();

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await getMySearchHistory();
      if (res.success) {
        setSearchHistory(res.data.slice(0, 5)); // Solo 5
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000); // Poll cada 15s
    return () => clearInterval(interval);
  }, []);

  // Filtrar los elementos por rol
  const allMenuItems = [
    { href: '/dashboard', icon: LuLayoutDashboard, label: t.overview, roles: ['SUPERADMIN', 'ADMIN', 'AGENT', 'READONLY'] },
    { href: '/dashboard/import', icon: LuUpload, label: t.import, roles: ['SUPERADMIN', 'ADMIN', 'AGENT'] },
    { href: '/dashboard/ai', icon: LuBot, label: t.rag, roles: ['SUPERADMIN', 'ADMIN', 'AGENT', 'READONLY'] },
    { href: '/dashboard/admin', icon: LuShieldCheck, label: t.admin, roles: ['SUPERADMIN'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole || 'AGENT'));

  return (
    <motion.aside
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative hidden md:flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/80 shadow-2xl h-full font-inter z-50"
    >
      {/* Toggle Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-violet-600 text-white rounded-full p-1.5 shadow-lg hover:bg-violet-500 hover:scale-110 transition-all z-50"
      >
        {isCollapsed ? <LuChevronRight size={14} /> : <LuChevronLeft size={14} />}
      </button>

      {/* Header Logo */}
      <div className="p-5 border-b border-slate-800/50 flex items-center h-20 overflow-hidden whitespace-nowrap">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-violet-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-inner">
          <span className="text-white font-bold font-dm-sans text-xl">I</span>
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="ml-4"
            >
              <h2 className="text-lg font-dm-sans font-bold text-white tracking-tight">{t.title}</h2>
              <p className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">{t.subtitle}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`relative flex items-center px-3 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-violet-600/10 text-violet-400' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <motion.div 
                  layoutId="active-nav-glow"
                  className="absolute inset-0 bg-violet-600/10 rounded-xl border border-violet-500/20"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className="relative z-10 flex items-center w-full">
                <Icon size={20} className={`flex-shrink-0 ${isActive ? 'text-violet-400' : 'group-hover:text-emerald-400 transition-colors'}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-4 text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}

        {/* Sección Especial: Historial Reciente */}
        <div className="pt-4 mt-4 border-t border-slate-800/50">
          <button
            onClick={() => {
              if (isCollapsed) setIsCollapsed(false);
              setIsHistoryOpen(!isHistoryOpen);
            }}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors group"
          >
            <div className="flex items-center">
              <LuHistory size={20} className="flex-shrink-0 group-hover:text-amber-400 transition-colors" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-4 text-sm font-medium whitespace-nowrap overflow-hidden text-left"
                  >
                    Búsquedas Recientes
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {!isCollapsed && (
              <LuChevronDown size={16} className={`transform transition-transform duration-300 ${isHistoryOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          <AnimatePresence>
            {!isCollapsed && isHistoryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pl-9 pr-3 py-2 space-y-1">
                  {searchHistory.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">No hay historial</p>
                  ) : (
                    searchHistory.map((query, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-colors truncate"
                      >
                        <LuSearch size={12} className="flex-shrink-0" />
                        <span className="truncate" title={query}>{query}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </nav>

      {/* Footer (Configuración + Logout) */}
      <div className="p-3 border-t border-slate-800/50 mb-2 space-y-1">
        
        {userRole === 'SUPERADMIN' && (
          <>
            <Link 
              href="/dashboard/providers"
              className={`relative w-full flex items-center px-3 py-3 rounded-xl transition-all duration-300 group ${
                pathname === '/dashboard/providers'
                  ? 'bg-amber-500/10 text-amber-400' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              {pathname === '/dashboard/providers' && (
                <motion.div 
                  layoutId="active-nav-glow-footer-providers"
                  className="absolute inset-0 bg-amber-500/10 rounded-xl border border-amber-500/20"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center w-full">
                <LuBuilding2 size={20} className="flex-shrink-0 group-hover:text-amber-400 transition-colors" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-4 text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      Proveedores
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>

            <Link 
              href="/dashboard/users"
              className={`relative w-full flex items-center px-3 py-3 rounded-xl transition-all duration-300 group ${
                pathname === '/dashboard/users'
                  ? 'bg-amber-500/10 text-amber-400' 
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              {pathname === '/dashboard/users' && (
                <motion.div 
                  layoutId="active-nav-glow-footer-users"
                  className="absolute inset-0 bg-amber-500/10 rounded-xl border border-amber-500/20"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center w-full">
                <LuUsers size={20} className="flex-shrink-0 group-hover:text-amber-400 transition-colors" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-4 text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      Usuarios
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          </>
        )}

        <Link 
          href="/dashboard/settings"
          className={`relative w-full flex items-center px-3 py-3 rounded-xl transition-all duration-300 group ${
            pathname === '/dashboard/settings'
              ? 'bg-violet-600/10 text-violet-400' 
              : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          {pathname === '/dashboard/settings' && (
            <motion.div 
              layoutId="active-nav-glow-footer"
              className="absolute inset-0 bg-violet-600/10 rounded-xl border border-violet-500/20"
              initial={false}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <div className="relative z-10 flex items-center w-full">
            <LuSettings size={20} className="flex-shrink-0 group-hover:text-violet-400 transition-colors" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-4 text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  {t.settings}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>

        <button 
          onClick={() => logout()}
          className="relative w-full flex items-center px-3 py-3 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 group"
        >
          <LuLogOut size={20} className="flex-shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4 text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {t.logout}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
