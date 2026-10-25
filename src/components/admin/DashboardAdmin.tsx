import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogoHotel } from '../common/LogoHotel';
import {
  Users,
  BedDouble,
  UtensilsCrossed,
  TrendingUp,
  LogOut,
  ChevronDown,
  Crown,
  Eye,
} from 'lucide-react';
import { GestionTrabajadores } from './GestionTrabajadores';
import { RackHabitacionesAdmin } from './RackHabitacionesAdmin';
import { CatalogoServiciosAdmin } from './CatalogoServiciosAdmin';
import { MetricasHotelAdmin } from './MetricasHotelAdmin';

export type PestanaAdmin = 'trabajadores' | 'rack' | 'servicios' | 'metricas';

interface DashboardAdminProps {
  onIrAVistaHuesped?: () => void;
  onIrAVista?: (vista: 'recepcion' | 'limpieza' | 'huesped') => void;
}

export const DashboardAdmin: React.FC<DashboardAdminProps> = ({
  onIrAVistaHuesped,
  onIrAVista,
}) => {
  const { user, perfil, logout } = useAuth();
  const [pestanaActiva, setPestanaActiva] = useState<PestanaAdmin>('trabajadores');
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuPerfilAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nombreAdmin = perfil?.nombre_completo || 'Administrador General';
  const emailAdmin = user?.email || perfil?.email || 'admin@hotelillimani.bo';

  const iniciales = nombreAdmin
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-white">
      {/* ==================================================================== */}
      {/* NAVBAR SUPERIOR DE ADMINISTRACIÓN */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo y Título de Gerencia */}
            <div className="flex items-center gap-4">
              <LogoHotel tamano="sm" mostrarSubtitulo={false} />
              <div className="hidden sm:block h-8 w-[1px] bg-slate-800" />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  Panel de Administración
                </span>
                <span className="text-[11px] text-slate-400">
                  Gran Hotel Illimani ★★★★★
                </span>
              </div>
            </div>

            {/* Acciones del Administrador */}
            <div className="flex items-center gap-3">
              {/* Selector de vistas operativas */}
              {onIrAVista && (
                <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Vista:</span>
                  <button
                    onClick={() => onIrAVista('recepcion')}
                    className="px-2.5 py-1 rounded-lg text-blue-300 hover:text-white hover:bg-blue-600/30 transition-colors cursor-pointer font-medium"
                    title="Ver cómo opera el recepcionista"
                  >
                    🛎️ Recepción
                  </button>
                  <button
                    onClick={() => onIrAVista('limpieza')}
                    className="px-2.5 py-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-600/30 transition-colors cursor-pointer font-medium"
                    title="Ver cómo operan las camareras de limpieza"
                  >
                    🧹 Limpieza
                  </button>
                  <button
                    onClick={() => onIrAVista('huesped')}
                    className="px-2.5 py-1 rounded-lg text-amber-300 hover:text-white hover:bg-amber-600/30 transition-colors cursor-pointer font-medium"
                    title="Ver fachada y catálogo del huésped"
                  >
                    🏨 Huésped
                  </button>
                </div>
              )}

              {/* Botón para alternar a Vista Huésped (móvil o si no está onIrAVista) */}
              {!onIrAVista && onIrAVistaHuesped && (
                <button
                  onClick={onIrAVistaHuesped}
                  title="Ver cómo ven la fachada y catálogo los huéspedes"
                  className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver Portal Huésped</span>
                </button>
              )}

              {/* Dropdown del Administrador */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                    {iniciales || 'AD'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      {nombreAdmin}
                    </span>
                    <span className="text-[10px] text-amber-400/90 font-semibold uppercase tracking-wider">
                      Administrador
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      menuPerfilAbierto ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Menú desplegable */}
                {menuPerfilAbierto && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 border-b border-slate-800 mb-1">
                      <div className="text-xs font-bold text-white">{nombreAdmin}</div>
                      <div className="text-[11px] text-slate-400 truncate">{emailAdmin}</div>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        👑 Administrador General
                      </span>
                    </div>

                    {onIrAVistaHuesped && (
                      <button
                        onClick={() => {
                          setMenuPerfilAbierto(false);
                          onIrAVistaHuesped();
                        }}
                        className="w-full flex md:hidden items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span>Ver Portal Huésped</span>
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        setMenuPerfilAbierto(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* PESTAÑAS DE NAVEGACIÓN PRINCIPAL */}
          {/* ==================================================================== */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 border-t border-slate-800/80 -mb-[1px]">
            {/* Pestaña: Gestión de Trabajadores */}
            <button
              onClick={() => setPestanaActiva('trabajadores')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                pestanaActiva === 'trabajadores'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Personal y Trabajadores</span>
            </button>

            {/* Pestaña: Rack de Habitaciones */}
            <button
              onClick={() => setPestanaActiva('rack')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                pestanaActiva === 'rack'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BedDouble className="w-4 h-4" />
              <span>Rack de Habitaciones</span>
            </button>

            {/* Pestaña: Catálogo de Servicios */}
            <button
              onClick={() => setPestanaActiva('servicios')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                pestanaActiva === 'servicios'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Catálogo de Servicios</span>
            </button>

            {/* Pestaña: Métricas y Reservas */}
            <button
              onClick={() => setPestanaActiva('metricas')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                pestanaActiva === 'metricas'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Métricas & Reservas</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* CUERPO PRINCIPAL */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pestanaActiva === 'trabajadores' && <GestionTrabajadores />}
        {pestanaActiva === 'rack' && <RackHabitacionesAdmin />}
        {pestanaActiva === 'servicios' && <CatalogoServiciosAdmin />}
        {pestanaActiva === 'metricas' && <MetricasHotelAdmin />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-serif">
            Gran Hotel Illimani ★★★★★ &bull; La Paz, Bolivia
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Sistema de Administración y Gestión Empresarial Hotelera (SAGH) &bull; Módulo de Control Gerencial
          </p>
        </div>
      </footer>
    </div>
  );
};
