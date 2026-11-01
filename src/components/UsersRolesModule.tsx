import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Shield, UserPlus, Check, X, Trash2 } from 'lucide-react';
import { AppUser, UserRole } from '../types/inventory';
import { getRoleLabel } from '../utils/inventoryLogic';

interface UsersRolesModuleProps {
  users: AppUser[];
  currentUser: AppUser;
  canManageUsers: boolean;
  onAddUser: (user: Omit<AppUser, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateRole: (userId: string, role: UserRole) => void;
  onDeleteUser: (userId: string) => void;
}

export const UsersRolesModule: React.FC<UsersRolesModuleProps> = ({
  users,
  currentUser,
  canManageUsers,
  onAddUser,
  onUpdateRole,
  onDeleteUser,
}) => {
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    role: 'almacenista' as UserRole,
    department: 'Coordinación de Almacén y Suministros',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) return;
    onAddUser({
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      password: form.password.trim(),
      email: form.email.trim() || `${form.username.trim()}@sanfrancisco.gob.ve`,
      role: form.role,
      department: form.department.trim(),
      active: true,
    });
    setForm({
      name: '',
      username: '',
      password: '',
      email: '',
      role: 'almacenista',
      department: 'Coordinación de Almacén y Suministros',
    });
    Swal.fire({
      icon: 'success',
      title: 'Usuario creado con éxito',
      text: 'El funcionario ya puede ingresar con su usuario y contraseña y tiene permisos asignados en Firebase.',
      timer: 1800,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Matriz de Permisos por Rol (RBAC) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="mb-4">
          <div className="text-xs font-medium text-[#C8102E]">
            Seguridad Basada en Roles · Firebase Auth & Firestore Rules
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Matriz Institucional de Permisos por Rol
          </h2>
          <p className="text-xs text-slate-500">
            Tus permisos actuales están activos como <strong>{getRoleLabel(currentUser.role)}</strong> ({currentUser.email}).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 px-3">Módulo / Privilegio del Sistema</th>
                <th className="py-2.5 px-3 text-center">Administrador General</th>
                <th className="py-2.5 px-3 text-center">Jefe de Almacén</th>
                <th className="py-2.5 px-3 text-center">Ingeniero de Obras</th>
                <th className="py-2.5 px-3 text-center">Auditor / Consulta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[
                ['Crear y editar productos, categorías, proveedores y beneficiarios', true, true, false, false],
                ['Registrar entradas y salidas de stock (Kardex)', true, true, true, false],
                ['Registrar y actualizar avances físicos/financieros de obras', true, false, true, false],
                ['Exportar reportes a Excel (.XLSX) y consultar alertas', true, true, true, true],
                ['Sincronizar base de datos con Google Sheets / Apps Script', true, true, false, false],
                ['Administrar usuarios, contraseñas y eliminar registros', true, false, false, false],
              ].map(([label, adm, alm, ing, con], idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-medium text-slate-800">{label as string}</td>
                  {[adm, alm, ing, con].map((allowed, i) => (
                    <td key={i} className="py-2.5 px-3 text-center">
                      {allowed ? (
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gestión de Usuarios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {canManageUsers && (
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-3.5 h-fit"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#003B73]" />
              <h3 className="text-base font-bold text-slate-900">
                Crear Nuevo Usuario del Sistema
              </h3>
            </div>
            <div>
              <label htmlFor="usr-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellido del Funcionario
              </label>
              <input
                id="usr-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ing. Ana Morales"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="usr-username" className="block text-xs font-semibold text-slate-700 mb-1">
                  Usuario Login
                </label>
                <input
                  id="usr-username"
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="amorales"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="usr-pass" className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="usr-pass"
                  type="text"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="clave2026"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label htmlFor="usr-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico (Vinculación Firebase)
              </label>
              <input
                id="usr-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="amorales@sanfrancisco.gob.ve"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="usr-role" className="block text-xs font-semibold text-slate-700 mb-1">
                Rol y Nivel de Acceso
              </label>
              <select
                id="usr-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="admin">Administrador General</option>
                <option value="almacenista">Jefe de Almacén y Despacho</option>
                <option value="ingeniero_obras">Ingeniero Inspector de Obras</option>
                <option value="consulta">Auditor / Consulta Institucional</option>
              </select>
            </div>
            <div>
              <label htmlFor="usr-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                Coordinación / Unidad Adscrita
              </label>
              <input
                id="usr-dept"
                type="text"
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg cursor-pointer"
            >
              Registrar Funcionario y Asignar Rol
            </button>
          </form>
        )}

        <div className={`${canManageUsers ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-xl p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#003B73]" />
            <h3 className="text-base font-bold text-slate-900">
              Funcionarios Autorizados en el Sistema
            </h3>
          </div>

          <div className="divide-y divide-slate-200">
            {users.map((u) => (
              <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {u.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-[#003B73]">@{u.username}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{u.email}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{u.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canManageUsers ? (
                    <select
                      aria-label={`Cambiar rol de ${u.name}`}
                      value={u.role}
                      onChange={(e) => onUpdateRole(u.id, e.target.value as UserRole)}
                      className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-[#003B73]"
                    >
                      <option value="admin">Administrador General</option>
                      <option value="almacenista">Jefe de Almacén</option>
                      <option value="ingeniero_obras">Ingeniero de Obras</option>
                      <option value="consulta">Auditor / Consulta</option>
                    </select>
                  ) : (
                    <span className="text-xs font-semibold text-[#003B73]">
                      {getRoleLabel(u.role)}
                    </span>
                  )}

                  {canManageUsers && u.username !== 'admin' && (
                    <button
                      type="button"
                      aria-label={`Eliminar usuario ${u.name}`}
                      onClick={() => onDeleteUser(u.id)}
                      className="p-1.5 text-slate-400 hover:text-[#C8102E] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
