import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  BedDouble,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Reserva, Habitacion } from '../../types/database';

export const MetricasHotelAdmin: React.FC = () => {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [habRes, resRes] = await Promise.all([
        supabase.from('habitaciones').select('*'),
        supabase.from('reservas').select('*').order('creado_en', { ascending: false }).limit(20),
      ]);

      if (habRes.data) setHabitaciones(habRes.data);
      if (resRes.data) setReservas(resRes.data);
    } catch (err) {
      console.warn('[MetricasHotel] Error cargando métricas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const totalHabitaciones = habitaciones.length || 23;
  const ocupadas = habitaciones.filter((h) => h.estado === 'ocupada').length;
  const disponibles = habitaciones.filter((h) => h.estado === 'disponible').length;
  const porcentajeOcupacion = totalHabitaciones > 0 ? Math.round((ocupadas / totalHabitaciones) * 100) : 0;

  const totalIngresosReservas = reservas.reduce((acc, r) => acc + (Number(r.total_alojamiento) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Rendimiento y Ocupación Hotelera
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Métricas Ejecutivas e Ingresos
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Indicadores de rendimiento en tiempo real: ocupación del hotel, reservas registradas y movimientos contables en Bolivianos (Bs.).
          </p>
        </div>

        <button
          onClick={cargarDatos}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          <span>Actualizar Métricas</span>
        </button>
      </div>

      {/* KPIs Destacados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasa de Ocupación */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Tasa de Ocupación</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-3 flex items-baseline gap-2">
            <span>{porcentajeOcupacion}%</span>
            <span className="text-xs text-slate-400 font-normal">
              ({ocupadas} de {totalHabitaciones} hab.)
            </span>
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(porcentajeOcupacion, 100)}%` }}
            />
          </div>
        </div>

        {/* Habitaciones Libres */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Disponibilidad Inmediata</span>
            <BedDouble className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-3">{disponibles}</div>
          <div className="text-xs text-slate-400 mt-1">Listas para asignación y check-in</div>
        </div>

        {/* Total Reservas Registradas */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Reservas en Sistema</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mt-3">{reservas.length}</div>
          <div className="text-xs text-slate-400 mt-1">Históricas y activas</div>
        </div>

        {/* Ingresos Estimados */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Ingresos por Alojamiento</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 mt-3">
            Bs. {totalIngresosReservas.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total reservas generadas</div>
        </div>
      </div>

      {/* Tabla de Reservas Recientes */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-700/80 flex items-center justify-between">
          <h3 className="font-serif font-bold text-white text-base">
            Últimas Reservas Registradas
          </h3>
          <span className="text-xs text-slate-400">Mostrando hasta 20 registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
              <tr>
                <th className="py-3 px-4 font-semibold">Código</th>
                <th className="py-3 px-4 font-semibold">Entrada</th>
                <th className="py-3 px-4 font-semibold">Salida</th>
                <th className="py-3 px-4 font-semibold">Tarifa Noche</th>
                <th className="py-3 px-4 font-semibold">Total</th>
                <th className="py-3 px-4 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Cargando reservas...
                  </td>
                </tr>
              ) : reservas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Aún no hay reservas registradas en el sistema.
                  </td>
                </tr>
              ) : (
                reservas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {r.codigo_reserva}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300">
                      {new Date(r.fecha_entrada).toLocaleDateString('es-BO')}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300">
                      {new Date(r.fecha_salida).toLocaleDateString('es-BO')}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      Bs. {Number(r.precio_pactado_noche).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      Bs. {Number(r.total_alojamiento).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {r.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
