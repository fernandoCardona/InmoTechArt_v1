import AdminClient from './AdminClient';

export const metadata = {
  title: 'Panel de Control | SuperAdmin',
};

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-dm-sans font-bold text-white tracking-tight flex items-center gap-3">
          <span className="text-rose-500">🛡️</span> Centro de Seguridad & Auditoría
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Aprobación de credenciales (Fingerprinting), auditoría de accesos y protección perimetral del sistema. Área restringida a SuperAdmins.
        </p>
      </header>

      {/* Toda la lógica interactiva de Seguridad */}
      <AdminClient />
      
    </div>
  );
}
