import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { LogoHotel } from '../common/LogoHotel';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Wrench,
  RefreshCw,
  LogOut,
  ChevronDown,
  AlertTriangle,
  ClipboardCheck,
  Check,
  Filter,
} from 'lucide-react';
import type { Habitacion } from '../../types/database';

interface DashboardLimpiezaProps {
  onIrAVista?: (vista: 'admin' | 'recepcion' | 'huesped') => void;
}

export const DashboardLimpieza: React.FC<DashboardLimpiezaProps> = ({ onIrAVista }) => {
  const { user, perfil, logout } = useAuth();
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroPiso, setFiltroPiso] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal para reportar falla o avería
  const [modalAveriaAbierto, setModalAveriaAbierto] = useState(false);
  const [habitacionAveriaId, setHabitacionAveriaId] = useState<string>('');
  const [observacionAveria, setObservacionAveria] = useState('');

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuPerfilAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar habitaciones
  const cargarHabitaciones = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('habitaciones')
        .select('*')
        .order('numero', { ascending: true });

      if (!error && data) {
        setHabitaciones(data);
      }
    } catch (err) {
      console.warn('[DashboardLimpieza] Error cargando habitaciones:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHabitaciones();
  }, []);

  // Operación: Completar limpieza y marcar DISPONIBLE
  const completarLimpieza = async (habId: string, habNumero: string) => {
    setProcesandoId(habId);
    const ahora = new Date().toISOString();

    // Actualización optimista
    setHabitaciones((prev) =>
      prev.map((h) => (h.id === habId ? { ...h, estado: 'disponible' } : h))
    );

    try {
      // 1. Pasar habitación a disponible
      await supabase
        .from('habitaciones')
        .update({ estado: 'disponible' })
        .eq('id', habId);

      // 2. Registrar fin de limpieza
      await supabase.from('historial_limpieza').insert({
        habitacion_id: habId,
        empleado_id: user?.id || null,
        fecha_inicio: ahora,
        fecha_fin: ahora,
        observaciones: `Limpieza y desinfección 5 estrellas completada por personal de piso. Habitación ${habNumero} lista para nuevo huésped.`,
      });
    } catch (err) {
      console.error('[DashboardLimpieza] Error completando limpieza:', err);
    } finally {
      setProcesandoId(null);
    }
  };

  // Operación: Pasar a estado Limpieza en Proceso o solicitar limpieza
  const marcarEnLimpieza = async (habId: string) => {
    setProcesandoId(habId);
    setHabitaciones((prev) =>
      prev.map((h) => (h.id === habId ? { ...h, estado: 'limpieza' } : h))
    );

    try {
      await supabase
        .from('habitaciones')
        .update({ estado: 'limpieza' })
        .eq('id', habId);
    } catch (err) {
      console.error('[DashboardLimpieza] Error marcando en limpieza:', err);
    } finally {
      setProcesandoId(null);
    }
  };

  // Operación: Reportar avería y mandar a Mantenimiento
  const reportarAveria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitacionAveriaId) return;

    setProcesandoId(habitacionAveriaId);
    setHabitaciones((prev) =>
      prev.map((h) => (h.id === habitacionAveriaId ? { ...h, estado: 'mantenimiento' } : h))
    );

    try {
      await supabase
        .from('habitaciones')
        .update({ estado: 'mantenimiento' })
        .eq('id', habitacionAveriaId);

      await supabase.from('historial_limpieza').insert({
        habitacion_id: habitacionAveriaId,
        empleado_id: user?.id || null,
        fecha_inicio: new Date().toISOString(),
        observaciones: `Reporte de Housekeeping para mantenimiento: ${observacionAveria || 'Requiere inspección técnica urgente.'}`,
      });

      setModalAveriaAbierto(false);
      setObservacionAveria('');
      setHabitacionAveriaId('');
    } catch (err) {
      console.error('[DashboardLimpieza] Error reportando avería:', err);
    } finally {
      setProcesandoId(null);
    }
  };

  // Filtrado
  const habitacionesFiltradas = habitaciones.filter((h) => {
    const coincidePiso = filtroPiso === 'todos' || h.piso.toString() === filtroPiso;
    const coincideEstado = filtroEstado === 'todos' || h.estado === filtroEstado;
    return coincidePiso && coincideEstado;
  });

  // Métricas
  const pendientesLimpieza = habitaciones.filter((h) => h.estado === 'limpieza').length;
  const disponibles = habitaciones.filter((h) => h.estado === 'disponible').length;
  const ocupadas = habitaciones.filter((h) => h.estado === 'ocupada').length;
  const mantenimiento = habitaciones.filter((h) => h.estado === 'mantenimiento').length;

  const nombrePersonal = perfil?.nombre_completo || 'Colaborador de Housekeeping';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* ==================================================================== */}
      {/* NAVBAR SUPERIOR DE HOUSEKEEPING */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-teal-900/40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo y Módulo */}
            <div className="flex items-center gap-4">
              <LogoHotel tamano="sm" mostrarSubtitulo={false} />
              <div className="hidden sm:block h-8 w-[1px] bg-slate-800" />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs uppercase tracking-widest text-teal-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Housekeeping & Camareras de Piso
                </span>
                <span className="text-[11px] text-slate-400">
                  Gran Hotel Illimani ★★★★★
                </span>
              </div>
            </div>

            {/* Acciones y Perfil */}
            <div className="flex items-center gap-3">
              {/* Selector de vistas para desarrollo / pruebas */}
              {onIrAVista && (
                <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
                  <button
                    onClick={() => onIrAVista('admin')}
                    className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  >
                    👑 Admin
                  </button>
                  <button
                    onClick={() => onIrAVista('recepcion')}
                    className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  >
                    🛎️ Recepción
                  </button>
                  <button
                    onClick={() => onIrAVista('huesped')}
                    className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  >
                    🏨 Huésped
                  </button>
                </div>
              )}

              {/* Menú de Usuario Housekeeping */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {nombrePersonal.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-white group-hover:text-teal-400 transition-colors">
                      {nombrePersonal}
                    </span>
                    <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">
                      Housekeeping Oficial
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      menuPerfilAbierto ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Desplegable */}
                {menuPerfilAbierto && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 border-b border-slate-800 mb-1">
                      <div className="text-xs font-bold text-white">{nombrePersonal}</div>
                      <div className="text-[11px] text-slate-400">{user?.email}</div>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/15 text-teal-400 border border-teal-500/30">
                        🧹 Módulo Limpieza 5 Estrellas
                      </span>
                    </div>

                    {onIrAVista && (
                      <div className="py-1 border-b border-slate-800 lg:hidden space-y-1">
                        <button
                          onClick={() => onIrAVista('admin')}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                        >
                          👑 Panel Administrador
                        </button>
                        <button
                          onClick={() => onIrAVista('recepcion')}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                        >
                          🛎️ Panel Recepción
                        </button>
                        <button
                          onClick={() => onIrAVista('huesped')}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                        >
                          🏨 Portal Huésped
                        </button>
                      </div>
                    )}

                    <button
                      onClick={async () => {
                        setMenuPerfilAbierto(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* CUERPO PRINCIPAL HOUSEKEEPING */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera y Actualización */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Control de Limpieza y Habitaciones
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Marca las habitaciones higienizadas para que recepción pueda asignarlas inmediatamente a los nuevos huéspedes.
            </p>
          </div>

          <button
            onClick={cargarHabitaciones}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Actualizar Habitaciones</span>
          </button>
        </div>

        {/* Tarjetas de Estados Housekeeping */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pendientes de Limpieza (Urgentes) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300">
            <div className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Por Limpiar (Check-outs)</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold mt-2 text-white">{pendientesLimpieza}</div>
            <div className="text-xs text-amber-400/90 mt-1">Requieren cambio de blancos</div>
          </div>

          {/* Listas y Disponibles */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <div className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Limpias y Listas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold mt-2 text-white">{disponibles}</div>
            <div className="text-xs text-emerald-400/90 mt-1">Inspeccionadas para huéspedes</div>
          </div>

          {/* Ocupadas */}
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <div className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>Ocupadas (En Estadía)</span>
              <Clock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-bold mt-2 text-white">{ocupadas}</div>
            <div className="text-xs text-rose-400/90 mt-1">Huéspedes actualmente alojados</div>
          </div>

          {/* En Mantenimiento */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300">
            <div className="flex items-center justify-between text-xs font-semibold uppercase">
              <span>En Mantenimiento</span>
              <Wrench className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-bold mt-2 text-white">{mantenimiento}</div>
            <div className="text-xs text-slate-400 mt-1">Averías reportadas</div>
          </div>
        </div>

        {/* Filtros por Piso y Estado */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Filtrar por:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filtroPiso}
              onChange={(e) => setFiltroPiso(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="todos">Todos los Pisos</option>
              <option value="3">Piso 3 (Superior)</option>
              <option value="2">Piso 2 (Intermedio)</option>
              <option value="1">Piso 1 (Planta Baja)</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="todos">Todos los Estados</option>
              <option value="limpieza">🟡 Pendientes de Limpieza</option>
              <option value="disponible">🟢 Disponibles</option>
              <option value="ocupada">🔴 Ocupadas</option>
              <option value="mantenimiento">⚪ Mantenimiento</option>
            </select>
          </div>
        </div>

        {/* Grid de Habitaciones de Limpieza */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {habitacionesFiltradas.map((hab) => {
            const esLimpieza = hab.estado === 'limpieza';
            const esDisponible = hab.estado === 'disponible';
            const esOcupada = hab.estado === 'ocupada';
            const esMantenimiento = hab.estado === 'mantenimiento';

            return (
              <div
                key={hab.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
                  esLimpieza
                    ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : esDisponible
                    ? 'bg-slate-900/70 border-emerald-500/30'
                    : esOcupada
                    ? 'bg-slate-900/50 border-rose-500/20 opacity-70'
                    : 'bg-slate-900 border-slate-700'
                }`}
              >
                {/* Cabecera de la Habitación */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Piso {hab.piso} &bull; {hab.caracteristicas?.[0] || 'Habitación'}
                    </span>
                    {esLimpieza && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 animate-pulse">
                        ¡Requiere Aseo!
                      </span>
                    )}
                    {esDisponible && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Lista
                      </span>
                    )}
                    {esOcupada && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Ocupada
                      </span>
                    )}
                    {esMantenimiento && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300">
                        Avería
                      </span>
                    )}
                  </div>

                  <div className="text-2xl font-mono font-black text-white mt-2">
                    Hab. {hab.numero}
                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    {hab.caracteristicas?.join(' • ') || 'Estándar Illimani'}
                  </p>
                </div>

                {/* Acciones de Limpieza */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  {esLimpieza && (
                    <button
                      disabled={procesandoId === hab.id}
                      onClick={() => completarLimpieza(hab.id, hab.numero)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{procesandoId === hab.id ? 'Guardando...' : 'Marcar Limpia y Lista'}</span>
                    </button>
                  )}

                  {esDisponible && (
                    <button
                      disabled={procesandoId === hab.id}
                      onClick={() => marcarEnLimpieza(hab.id)}
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                    >
                      Mandar a Repaso de Limpieza
                    </button>
                  )}

                  {/* Botón para reportar avería técnica */}
                  {!esMantenimiento && (
                    <button
                      onClick={() => {
                        setHabitacionAveriaId(hab.id);
                        setModalAveriaAbierto(true);
                      }}
                      className="w-full text-center text-[11px] text-slate-500 hover:text-amber-400 transition-colors pt-1 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>Reportar Avería o Mantenimiento</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ==================================================================== */}
        {/* CHECKLIST ESTÁNDAR 5 ESTRELLAS */}
        {/* ==================================================================== */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardCheck className="w-6 h-6 text-teal-400" />
            <div>
              <h3 className="font-serif font-bold text-white text-base">
                Protocolo Oficial de Housekeeping 5 Estrellas
              </h3>
              <p className="text-xs text-slate-400">
                Estándares de higiene y presentación para el Gran Hotel Illimani
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
              <span className="p-1 rounded bg-teal-500/20 text-teal-400 flex-shrink-0">✓</span>
              <div>
                <span className="font-bold text-white block">Camas y Blancos</span>
                <span>Cambio integral de sábanas y toallas con fragancia andina.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
              <span className="p-1 rounded bg-teal-500/20 text-teal-400 flex-shrink-0">✓</span>
              <div>
                <span className="font-bold text-white block">Amenities & Minibar</span>
                <span>Reposición de jabones artesanales, shampoo y bebidas frías.</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
              <span className="p-1 rounded bg-teal-500/20 text-teal-400 flex-shrink-0">✓</span>
              <div>
                <span className="font-bold text-white block">Ventanales y Balcón</span>
                <span>Cristales pulidos sin marcas para la vista frontal y lateral.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* MODAL: REPORTAR AVERÍA TÉCNICA */}
      {/* ==================================================================== */}
      {modalAveriaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white">
                  Reportar Avería o Falla
                </h3>
                <p className="text-xs text-slate-400">
                  La habitación pasará a estado Mantenimiento hasta su reparación.
                </p>
              </div>
            </div>

            <form onSubmit={reportarAveria} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Descripción del Problema *
                </label>
                <textarea
                  rows={3}
                  required
                  value={observacionAveria}
                  onChange={(e) => setObservacionAveria(e.target.value)}
                  placeholder="Ej. Fuga en lavamanos, foco quemado en balcón, chapa floja..."
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAveriaAbierto(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoId === habitacionAveriaId}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg disabled:opacity-50"
                >
                  Enviar Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
