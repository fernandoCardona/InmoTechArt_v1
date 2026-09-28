import DataGridClient from './DataGridClient';

export const metadata = {
  title: 'Vista General de Activos | InmoTechArt',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-dm-sans font-bold text-white tracking-tight">Portfolio Maestro</h1>
          <p className="text-slate-400 mt-2">Visión unificada y en tiempo real de todos los activos procesados por el motor IA.</p>
        </div>
      </header>

      {/* Inyectamos la tabla React Table en Client Component */}
      <DataGridClient />
      
    </div>
  );
}
