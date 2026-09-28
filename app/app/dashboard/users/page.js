import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decrypt } from '../../../lib/auth';
import UsersClient from './UsersClient';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  
  if (!sessionToken) {
    redirect('/login');
  }

  const payload = await decrypt(sessionToken);
  
  // Protección estricta: Solo SuperAdmin
  if (payload?.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-dm-sans text-white">Gestión de Usuarios</h1>
          <p className="text-slate-400 text-sm mt-1">
            Administración centralizada de identidades y accesos
          </p>
        </div>
      </div>
      
      <UsersClient />
    </div>
  );
}
