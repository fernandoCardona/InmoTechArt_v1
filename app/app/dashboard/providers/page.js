import ProvidersClient from './ProvidersClient';
import { cookies } from 'next/headers';
import { decrypt } from '../../../lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Proveedores | InmoTechArt',
  description: 'Gestión de proveedores de activos (Servicers, Bancos, etc.)',
};

export default async function ProvidersPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  
  if (!sessionToken) {
    redirect('/login');
  }
  
  const payload = await decrypt(sessionToken);
  if (!payload || payload.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  return <ProvidersClient />;
}
