import React, { useState } from 'react';
import { Lock, User, LogIn, ShieldCheck, KeyRound } from 'lucide-react';
import { AppUser } from '../types/inventory';
import { getRoleLabel } from '../utils/inventoryLogic';

interface LoginViewProps {
  users: AppUser[];
  onCredentialLogin: (username: string, password: string) => void;
  onGoogleLogin: () => void;
  authError: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onCredentialLogin,
  onGoogleLogin,
  authError,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCredentialLogin(username, password);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Franja Superior Institucional */}
      <div className="h-2 w-full bg-gradient-to-r from-[#FFD100] via-[#003B73] to-[#C8102E]" />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Columna Izquierda: Identidad Institucional Alcaldía de San Francisco */}
          <div className="lg:col-span-6 p-8 lg:p-10 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
            <div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-center mb-6">
                {!logoError ? (
                  <img
                    src="/assets/aistudio/471cce7e-210d-48d6-83c4-06056dedbbd1_b2bb86b0.jpg"
                    alt="Alcaldía Bolivariana de San Francisco - Dirección de Vivienda y Hábitat"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                    className="max-h-48 w-auto object-contain"
                  />
                ) : (
                  <div className="text-center py-6">
                    <div className="text-xl font-bold text-[#003B73]">
                      ALCALDÍA BOLIVARIANA DE SAN FRANCISCO
                    </div>
                    <div className="text-sm font-bold text-[#C8102E] mt-1">
                      DIRECCIÓN DE VIVIENDA Y HÁBITAT
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs font-medium text-[#C8102E] mb-1">
                Estado Zulia · Municipio San Francisco · Una Nueva Etapa
              </div>
              <h1 className="text-2xl font-bold text-[#003B73] tracking-tight">
                Sistema Integral de Inventario, Almacén y Control de Obras (SIVYH)
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Plataforma oficial para el control de entradas y salidas de materiales de construcción, auditoría Kardex, seguimiento de obras habitacionales en las 7 parroquias e integración con Firebase y Google Sheets.
              </p>
            </div>

            {/* Accesos Rápidos por Rol para Pruebas e Inspección */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-3">
                <KeyRound className="w-3.5 h-3.5 text-[#003B73]" />
                <span>Credenciales de Acceso por Rol (Autocompletar):</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {users.slice(0, 4).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickFill(u.username, u.password || 'admin123')}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      username === u.username
                        ? 'border-[#003B73] bg-blue-50/60 text-slate-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-[#003B73] truncate">
                      {getRoleLabel(u.role)}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                      Usuario: {u.username} · Clave: {u.password || 'admin123'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Formulario de Autenticación */}
          <div className="lg:col-span-6 p-8 lg:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Iniciar Sesión en el Sistema
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa tu usuario y contraseña institucional o autentícate con Firebase Google Auth.
              </p>
            </div>

            {authError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
              >
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Usuario o Correo Institucional
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. admin, almacen, obras, auditor"
                    className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003B73]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full pl-10 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003B73]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#003B73] hover:bg-[#002850] rounded-lg transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Ingresar al Sistema SIVYH
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-500">
                  O autenticación en la nube con Firebase
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onGoogleLogin}
              className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#C8102E]" />
              Autenticar con Cuenta Google (Firebase Auth RBAC)
            </button>

            <div className="mt-6 pt-5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Seguridad de Roles RBAC Activa</span>
              <span>Alcaldía de San Francisco · Zulia</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        Alcaldía Bolivariana de San Francisco · Dirección de Vivienda y Hábitat · Sistema de Inventario y Control de Obras
      </footer>
    </div>
  );
};
