'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { getAllUsers, createNewUser, updateUserAccess, deleteUser } from '../../../lib/user-actions';

export default function UsersClient() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States para crear usuario
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'AGENT' });
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      if (res.success) {
        setUsersList(res.data);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchUsers();
    };
    init();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    const res = await createNewUser(newUser);
    if (res.success) {
      setNewUser({ fullName: '', email: '', password: '', role: 'AGENT' });
      fetchUsers();
    } else {
      alert(res.error);
    }
    setIsCreating(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    await updateUserAccess(userId, { role: newRole });
    fetchUsers();
  };

  const handleToggleActive = async (userId, currentStatus) => {
    await updateUserAccess(userId, { isActive: !currentStatus });
    fetchUsers();
  };

  const handleDeleteUser = async (userId, role) => {
    if (role === 'SUPERADMIN') {
      alert('No se puede eliminar a un Super Admin.');
      return;
    }
    
    if (window.confirm('¿Estás seguro de que quieres eliminar a este usuario de forma permanente? Esta acción no se puede deshacer.')) {
      const res = await deleteUser(userId);
      if (res.success) {
        fetchUsers();
      } else {
        alert(res.error);
      }
    }
  };

  if (loading) {
    return <div className="text-slate-500 animate-pulse mt-10">Cargando base de datos de usuarios...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 mt-10 flex items-center gap-3">
        <ShieldAlert /> {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-inter mt-8">
      {/* Formulario Crear Usuario */}
      <div className="rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden p-6 h-fit sticky top-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <UserPlus size={16}/>
          </div>
          Alta de Usuario
        </h3>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nombre completo</label>
            <input type="text" placeholder="Ej. Juan Pérez" required value={newUser.fullName} onChange={e=>setNewUser({...newUser, fullName: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Correo electrónico</label>
            <input type="email" placeholder="ejemplo@neretxaus.es" required value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña inicial</label>
            <input type="password" placeholder="Mínimo 8 caracteres" required minLength={8} value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nivel de Acceso</label>
            <select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all cursor-pointer">
              <option value="AGENT">AGENTE (Estándar)</option>
              <option value="ADMIN">ADMIN (Gestor)</option>
              <option value="READONLY">SOLO LECTURA (Consultor)</option>
              <option value="SUPERADMIN">SUPER ADMIN (Dios)</option>
            </select>
          </div>
          <button type="submit" disabled={isCreating} className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-2.5 rounded-lg transition-colors text-sm shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)] disabled:opacity-50">
            {isCreating ? 'Creando...' : 'Registrar Usuario'}
          </button>
        </form>
      </div>

      {/* Lista de Usuarios */}
      <div className="md:col-span-2 rounded-2xl bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/80">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Users size={18} className="text-violet-400" /> Directorio Activo
          </h3>
          <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-mono">{usersList.length} cuentas</span>
        </div>
        <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
          {usersList.length === 0 ? (
             <div className="p-8 text-slate-500 text-center">No se encontraron usuarios.</div>
          ) : usersList.map(u => (
            <div key={u.id} className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${u.isActive ? 'hover:bg-slate-800/30' : 'bg-slate-900/80 opacity-60'}`}>
              
              <div className="flex items-start gap-4">
                {/* Switch Toggle Habilitar/Deshabilitar */}
                <button 
                  onClick={() => handleToggleActive(u.id, u.isActive)}
                  title={u.isActive ? "Deshabilitar cuenta" : "Habilitar cuenta"}
                  className="mt-1 flex-shrink-0"
                >
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${u.isActive ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700/50 border border-slate-600/50'}`}>
                    <div className={`w-4 h-4 rounded-full transition-transform duration-300 ${u.isActive ? 'bg-emerald-400 translate-x-4' : 'bg-slate-500 translate-x-0'}`} />
                  </div>
                </button>

                <div>
                  <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    {u.fullName}
                    {!u.isActive && <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Deshabilitado</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{u.email}</p>
                  <p className="text-[10px] text-slate-600 mt-1">Registrado el {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select 
                  value={u.role} 
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className={`text-xs font-bold rounded-lg px-3 py-1.5 outline-none border cursor-pointer appearance-none ${
                    u.role === 'SUPERADMIN' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                    u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  <option value="AGENT">AGENTE</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="READONLY">LECTURA</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>

                {/* Botón Borrar (Solo si no es SUPERADMIN) */}
                {u.role !== 'SUPERADMIN' ? (
                  <button 
                    onClick={() => handleDeleteUser(u.id, u.role)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Eliminar usuario permanentemente"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : (
                  <div className="w-8" /> /* Spacer */
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
