import Link from 'next/link';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-inter">
      
      {/* Sidebar (ChatGPT Style) */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 hidden md:flex">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-xl font-dm-sans font-bold text-white tracking-tight">InmoTechArt</h2>
          <p className="text-xs text-slate-500 mt-1">IA Co-Pilot</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li>
              <Link href="/dashboard" className="flex items-center px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                <span className="mr-3 text-lg">📊</span> Vista General
              </Link>
            </li>
            <li>
              <Link href="/dashboard/import" className="flex items-center px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all bg-slate-800/50 text-white font-medium">
                <span className="mr-3 text-lg">📥</span> Importar Datos
              </Link>
            </li>
            <li>
              <Link href="/dashboard/ai" className="flex items-center px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                <span className="mr-3 text-lg">🤖</span> Asistente Legal RAG
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin" className="flex items-center px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all">
                <span className="mr-3 text-lg">⚙️</span> Configuración
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button className="flex w-full items-center px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
            <span className="mr-3">🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/4 h-[300px] w-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto p-6 md:p-10 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
