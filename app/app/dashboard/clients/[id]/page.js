import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { clients, clientSearchProfiles, assetMatches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ClientProfile from './ClientProfile';

export const metadata = {
  title: 'Perfil de Cliente | Neretxaus',
  description: 'Gestión detallada de cliente y cruce de datos IA',
};

export default async function ClientDetailPage({ params }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const sessionUser = sessionToken ? await decrypt(sessionToken) : null;
  const session = sessionUser ? { user: sessionUser } : null;
  
  if (!session) redirect('/login');
  
  const { id } = await params;

  // Si el ID es 'new', renderizamos el formulario de creación (placeholder por ahora)
  if (id === 'new') {
    return (
      <div className="min-h-screen bg-slate-950 p-6 md:p-8 lg:p-12 text-slate-200">
        <div className="max-w-2xl mx-auto bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-6">Añadir Nuevo Cliente</h1>
          <p className="text-slate-400 mb-6">El formulario interactivo para registrar un nuevo cliente se implementará en la siguiente iteración.</p>
          <div className="flex justify-end">
            <a href="/dashboard/clients" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
              Volver
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Si no es 'new', validamos que sea un UUID válido para evitar crasheos de PostgreSQL
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    redirect('/dashboard/clients');
  }

  // 1. Obtener Datos Personales
  const clientResult = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  const clientData = clientResult[0];

  if (!clientData) {
    redirect('/dashboard/clients');
  }

  // Protección de Privacidad: Si no es SUPERADMIN, verificar que el agente es dueño del cliente.
  if (session.user.role !== 'SUPERADMIN' && clientData.agentId !== session.user.id) {
    redirect('/dashboard/clients');
  }

  // 2. Obtener Perfil de Búsqueda
  const searchResult = await db.select().from(clientSearchProfiles).where(eq(clientSearchProfiles.clientId, id)).limit(1);
  const searchProfile = searchResult[0] || null;

  // 3. Obtener Matches Sugeridos
  const matches = await db.select().from(assetMatches).where(eq(assetMatches.clientId, id));

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 lg:p-12 text-slate-200">
      <div className="max-w-5xl mx-auto">
        <ClientProfile 
          clientData={clientData} 
          searchProfile={searchProfile} 
          matches={matches} 
        />
      </div>
    </div>
  );
}
