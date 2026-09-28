import SidebarClient from './SidebarClient';
import { getTranslations } from '../../lib/i18n';

export default async function DashboardLayout({ children }) {
  // Cargamos las traducciones en el servidor para el Dashboard
  const t = await getTranslations('dashboard');

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-inter">
      
      {/* Sidebar Client-Side Animado */}
      <SidebarClient t={t.Sidebar} />

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
