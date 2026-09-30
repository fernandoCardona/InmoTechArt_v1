import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { clients, assetMatches } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';

export const metadata = {
  title: 'Mis Clientes | Neretxaus',
  description: 'Gestor de clientes y matches de Inteligencia Artificial',
};

export default async function ClientsPage() {
  
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const sessionUser = sessionToken ? await decrypt(sessionToken) : null;
  const session = sessionUser ? { user: sessionUser } : null;
  
  if (!session) redirect('/login');


  // Obtener los clientes del agente (O de toda la base de datos si es SUPERADMIN)
  let userClients = [];
  if (session.user.role === 'SUPERADMIN') {
    userClients = await db.select().from(clients).orderBy(desc(clients.createdAt));
  } else {
    userClients = await db.select().from(clients).where(eq(clients.agentId, session.user.id)).orderBy(desc(clients.createdAt));
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 lg:p-12 text-slate-200">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="bg-gradient-to-br from-violet-500 to-indigo-600 bg-clip-text text-transparent">
                Cartera de Clientes
              </span>
            </h1>
            <p className="text-slate-400 mt-2">
              Gestiona tus clientes y descubre las oportunidades cruzadas por el motor de Inteligencia Artificial.
            </p>
          </div>
          <Link 
            href="/dashboard/clients/new"
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:bg-violet-500 hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] transition-all"
          >
            + Nuevo Cliente
          </Link>
        </div>

        {/* LISTADO DE CLIENTES */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4 text-center">Matches Pendientes</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {userClients.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                      No tienes ningún cliente registrado en tu cartera.
                    </td>
                  </tr>
                ) : (
                  userClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-200">
                        {client.firstName} {client.lastName}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {client.email} <br/>
                        <span className="text-xs">{client.phone}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          0
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/dashboard/clients/${client.id}`}
                          className="text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          Ver Perfil &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
