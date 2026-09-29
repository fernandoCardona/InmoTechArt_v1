import LoginForm from './LoginForm';

export const metadata = {
  title: 'Acceso Seguro | Neretxaus v1',
  description: 'Área segura de gestión inmobiliaria e inteligencia artificial.',
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 overflow-hidden">
      
      {/* Fondo Premium: Luces difuminadas de fondo */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-2xl bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-dm-sans font-bold tracking-tight text-white mb-2">
            Neretxaus <span className="text-violet-500">v1</span>
          </h1>
          <p className="text-slate-400 text-sm font-inter">
            Autenticación de dispositivo requerida
          </p>
        </div>

        {/* Client Component con toda la lógica de FingerprintJS */}
        <LoginForm />
        
        <div className="mt-8 text-center text-xs text-slate-500 font-inter">
          <p>Conexión segura encriptada punto a punto.</p>
        </div>
      </div>
    </div>
  );
}
