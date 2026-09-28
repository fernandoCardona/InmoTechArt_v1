'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LuLayoutDashboard, 
  LuUploadCloud, 
  LuBot, 
  LuShieldCheck, 
  LuLogOut, 
  LuChevronLeft, 
  LuChevronRight 
} from 'react-icons/lu';

export default function SidebarClient({ t }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', icon: LuLayoutDashboard, label: t.overview },
    { href: '/dashboard/import', icon: LuUploadCloud, label: t.import },
    { href: '/dashboard/ai', icon: LuBot, label: t.rag },
    { href: '/dashboard/admin', icon: LuShieldCheck, label: t.admin },
  ];

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
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800/50 mb-2">
        <button className="relative w-full flex items-center px-3 py-3 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 group">
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
