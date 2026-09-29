import SidebarClient from './SidebarClient';
import { getTranslations } from '../../lib/i18n';
import { cookies } from 'next/headers';
import { decrypt } from '../../lib/auth';

export default async function DashboardLayout({ children }) {
  // Cargamos las traducciones en el servidor para el Dashboard
  const t = await getTranslations('dashboard');

  // Obtenemos el rol del usuario activo para controlar el menú
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  let userRole = 'AGENT';
  if (sessionToken) {
    const payload = await decrypt(sessionToken);
    if (payload && payload.role) {
      userRole = payload.role;
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-inter">
      
      {/* Sidebar Client-Side Animado con Control de Roles */}
      <SidebarClient t={t.Sidebar} userRole={userRole} />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/4 h-[300px] w-[600px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        
        <div className="w-full h-full px-4 md:px-6 py-6 md:py-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
