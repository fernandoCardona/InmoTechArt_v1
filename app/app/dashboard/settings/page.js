import SettingsClient from './SettingsClient';
import LanguageSwitcher from './LanguageSwitcher';
import { getLocale } from '../../../lib/i18n';
import { cookies } from 'next/headers';
import { decrypt } from '../../../lib/auth';
import { LuSettings } from 'react-icons/lu';

export const metadata = {
  title: 'Configuración de Perfil | Neretxaus',
};

export default async function SettingsPage() {
  const currentLocale = await getLocale();
  
  // Extraemos datos del usuario (Email, Nombre) desde el JWT
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  let userData = null;
  
  if (sessionToken) {
    userData = await decrypt(sessionToken);
  }

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-3xl font-dm-sans font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <LuSettings size={28} className="text-violet-500" /> Configuración y Perfil
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Gestiona tus datos personales, preferencias de interfaz, idioma y seguridad de cuenta.
        </p>
      </header>

      {/* Componente Interactivo de Configuración */}
      <SettingsClient initialData={userData} />

      {/* Selector de Idioma (Multidioma) */}
      <LanguageSwitcher currentLocale={currentLocale} />
      
    </div>
  );
}
