import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  CheckCircle2,
  Clock,
  Sparkles,
  Wrench,
  RefreshCw,
  Search,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Habitacion, EstadoHabitacion } from '../../types/database';

export const RackHabitacionesAdmin: React.FC = () => {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroPiso, setFiltroPiso] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

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
      console.warn('[RackHabitaciones] Error cargando habitaciones:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHabitaciones();
  }, []);

  const cambiarEstadoHabitacion = async (id: string, nuevoEstado: EstadoHabitacion) => {
    setActualizandoId(id);
    // Optimista
    setHabitaciones((prev) =>
      prev.map((h) => (h.id === id ? { ...h, estado: nuevoEstado } : h))
    );

    try {
      await supabase
        .from('habitaciones')
        .update({ estado: nuevoEstado })
        .eq('id', id);
    } catch (err) {
      console.error('[RackHabitaciones] Error actualizando estado:', err);
    } finally {
      setActualizandoId(null);
    }
  };

  // Filtrado
  const habitacionesFiltradas = habitaciones.filter((h) => {
    const coincidePiso = filtroPiso === 'todos' || h.piso.toString() === filtroPiso;
    const coincideEstado = filtroEstado === 'todos' || h.estado === filtroEstado;
    const coincideBusqueda = h.numero.includes(busqueda);
    return coincidePiso && coincideEstado && coincideBusqueda;
  });

  // Conteo de estados
  const libres = habitaciones.filter((h) => h.estado === 'disponible').length;
  const ocupadas = habitaciones.filter((h) => h.estado === 'ocupada').length;
  const limpieza = habitaciones.filter((h) => h.estado === 'limpieza').length;
  const mantenimiento = habitaciones.filter((h) => h.estado === 'mantenimiento').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <BedDouble className="w-3.5 h-3.5" />
            Rack Operativo en Tiempo Real
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Control y Rack de Habitaciones
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Supervisa el estado de las 23 habitaciones del hotel, cambia disponibilidades y coordina con recepción y limpieza en tiempo real.
          </p>
        </div>

        <button
          onClick={cargarHabitaciones}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          <span>Actualizar Rack</span>
        </button>
      </div>

      {/* Tarjetas de Estados */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          <div className="flex items-center justify-between text-xs font-semibold uppercase">
            <span>Disponibles</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold mt-2 text-white">{libres}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Listas para reservar</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
          <div className="flex items-center justify-between text-xs font-semibold uppercase">
            <span>Ocupadas</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold mt-2 text-white">{ocupadas}</div>
          <div className="text-[11px] text-rose-400/80 mt-0.5">Huéspedes alojados</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <div className="flex items-center justify-between text-xs font-semibold uppercase">
            <span>En Limpieza</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold mt-2 text-white">{limpieza}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Housekeeping en curso</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300">
          <div className="flex items-center justify-between text-xs font-semibold uppercase">
            <span>Mantenimiento</span>
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-3xl font-bold mt-2 text-white">{mantenimiento}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Revisión técnica</div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por número de habitación (ej. 301)..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filtroPiso}
            onChange={(e) => setFiltroPiso(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="todos">Todos los Pisos</option>
            <option value="3">Piso 3 (Superior)</option>
            <option value="2">Piso 2 (Intermedio)</option>
            <option value="1">Piso 1 (Planta Baja)</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="disponible">Disponibles</option>
            <option value="ocupada">Ocupadas</option>
            <option value="limpieza">En Limpieza</option>
            <option value="mantenimiento">Mantenimiento</option>
          </select>
        </div>
      </div>

      {/* Grid de Habitaciones del Rack */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {habitacionesFiltradas.map((hab) => {
          const configEstado = {
            disponible: {
              border: 'border-emerald-500/40 hover:border-emerald-500',
              bg: 'bg-emerald-950/20',
              tag: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              label: 'Libre',
              dot: 'bg-emerald-400 shadow-emerald-400/50',
            },
            ocupada: {
              border: 'border-rose-500/40 hover:border-rose-500',
              bg: 'bg-rose-950/20',
              tag: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
              label: 'Ocupada',
              dot: 'bg-rose-400 shadow-rose-400/50',
            },
            limpieza: {
              border: 'border-amber-500/40 hover:border-amber-500',
              bg: 'bg-amber-950/20',
              tag: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              label: 'Limpieza',
              dot: 'bg-amber-400 shadow-amber-400/50',
            },
            mantenimiento: {
              border: 'border-slate-600 hover:border-slate-500',
              bg: 'bg-slate-900/40',
              tag: 'bg-slate-700 text-slate-300 border-slate-600',
              label: 'Mantenimiento',
              dot: 'bg-slate-400 shadow-slate-400/50',
            },
          }[hab.estado];

          return (
            <div
              key={hab.id}
              className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between ${configEstado.bg} ${configEstado.border}`}
            >
              {/* Encabezado de la habitación */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${configEstado.dot} shadow-sm`} />
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Piso {hab.piso}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${configEstado.tag}`}
                >
                  {configEstado.label}
                </span>
              </div>

              {/* Número de Habitación */}
              <div className="my-1">
                <div className="text-xl font-mono font-black text-white">
                  Hab. {hab.numero}
                </div>
              </div>

              {/* Selector de Estado Rápido */}
              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">
                  Cambiar Estado:
                </label>
                <select
                  value={hab.estado}
                  disabled={actualizandoId === hab.id}
                  onChange={(e) =>
                    cambiarEstadoHabitacion(hab.id, e.target.value as EstadoHabitacion)
                  }
                  className="w-full text-[11px] font-medium bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="disponible">🟢 Disponible</option>
                  <option value="ocupada">🔴 Ocupada</option>
                  <option value="limpieza">🟡 En Limpieza</option>
                  <option value="mantenimiento">⚪ Mantenimiento</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
