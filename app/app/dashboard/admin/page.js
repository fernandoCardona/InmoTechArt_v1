import AdminClient from './AdminClient';
import LanguageSwitcher from './LanguageSwitcher';
import { getLocale } from '../../../lib/i18n';

export const metadata = {
  title: 'Panel de Control | SuperAdmin',
};

export default async function AdminPage() {
  const currentLocale = await getLocale();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-dm-sans font-bold text-white tracking-tight flex items-center gap-3">
          <span className="text-rose-500">🛡️</span> Centro de Seguridad & Configuración
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Aprobación de credenciales (Fingerprinting), auditoría de accesos y configuración global del usuario.
        </p>
      </header>

      {/* Selector de Idioma (Multidioma) */}
      <LanguageSwitcher currentLocale={currentLocale} />

      {/* Toda la lógica interactiva de Seguridad */}
      <AdminClient />
      
    </div>
  );
}
