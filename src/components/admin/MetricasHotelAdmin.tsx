import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  BedDouble,
  RefreshCw,
  Building2,
  UtensilsCrossed,
  Search,
  Eye,
  X,
  FileSpreadsheet,
  Receipt,
  User,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Habitacion } from '../../types/database';

interface ConsumoDetalle {
  id: string;
  servicio_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number | null;
  fecha_consumo: string;
  catalogo_servicios?: {
    id: string;
    nombre: string;
    categoria: string;
    precio_unitario: number;
  } | null;
}

interface ReservaConTodo {
  id: string;
  codigo_reserva: string;
  huesped_id: string;
  habitacion_id: string;
  fecha_entrada: string;
  fecha_salida: string;
  precio_pactado_noche: number;
  total_alojamiento: number;
  estado: string;
  observaciones?: string | null;
  creado_en: string;
  habitaciones?: {
    id: string;
    numero: string;
    piso: number;
    tipos_habitacion?: {
      nombre: string;
    } | null;
  } | null;
  huespedes?: {
    id: string;
    nombres: string;
    apellidos: string;
    documento_identidad: string;
    tipo_documento: string;
    telefono?: string | null;
    email?: string | null;
  } | null;
  consumos_reserva?: ConsumoDetalle[];
}

export const MetricasHotelAdmin: React.FC = () => {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [reservas, setReservas] = useState<ReservaConTodo[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros de la tabla
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroConsumo, setFiltroConsumo] = useState<'todos' | 'con_consumo' | 'sin_consumo'>('todos');

  // Modal de Detalle / Folio de Cuenta
  const [reservaModal, setReservaModal] = useState<ReservaConTodo | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [habRes, resRes] = await Promise.all([
        supabase
          .from('habitaciones')
          .select('*')
          .order('numero', { ascending: true }),
        supabase
          .from('reservas')
          .select(`
            *,
            habitaciones:habitaciones(
              id,
              numero,
              piso,
              tipos_habitacion:tipos_habitacion(nombre)
            ),
            huespedes:huespedes(
              id,
              nombres,
              apellidos,
              documento_identidad,
              tipo_documento,
              telefono,
              email
            ),
            consumos_reserva:consumos_reserva(
              id,
              servicio_id,
              cantidad,
              precio_unitario,
              subtotal,
              fecha_consumo,
              catalogo_servicios:catalogo_servicios(
                id,
                nombre,
                categoria,
                precio_unitario
              )
            )
          `)
          .order('creado_en', { ascending: false }),
      ]);

      if (habRes.data) setHabitaciones(habRes.data);
      if (resRes.data) setReservas(resRes.data as unknown as ReservaConTodo[]);
    } catch (err) {
      console.warn('[MetricasHotelAdmin] Error cargando métricas e ingresos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Función auxiliar para calcular consumos de una reserva
  const calcularConsumosReserva = (consumos?: ConsumoDetalle[]): number => {
    if (!consumos || !Array.isArray(consumos)) return 0;
    return consumos.reduce((total, c) => {
      const sub = Number(c.subtotal);
      if (!isNaN(sub) && sub > 0) return total + sub;
      const calc = (Number(c.cantidad) || 0) * (Number(c.precio_unitario) || 0);
      return total + calc;
    }, 0);
  };

  // KPIs Globales
  const totalHabitaciones = habitaciones.length || 23;
  const ocupadas = habitaciones.filter((h) => h.estado === 'ocupada').length;
  const disponibles = habitaciones.filter((h) => h.estado === 'disponible').length;
  const porcentajeOcupacion =
    totalHabitaciones > 0 ? Math.round((ocupadas / totalHabitaciones) * 100) : 0;

  // Totales Financieros
  const totalIngresosAlojamiento = useMemo(() => {
    return reservas.reduce((acc, r) => acc + (Number(r.total_alojamiento) || 0), 0);
  }, [reservas]);

  const totalIngresosConsumos = useMemo(() => {
    return reservas.reduce(
      (acc, r) => acc + calcularConsumosReserva(r.consumos_reserva),
      0
    );
  }, [reservas]);

  const granTotalFacturado = totalIngresosAlojamiento + totalIngresosConsumos;

  const totalItemsConsumidos = useMemo(() => {
    return reservas.reduce(
      (acc, r) =>
        acc +
        (r.consumos_reserva?.reduce((sum, c) => sum + (Number(c.cantidad) || 1), 0) || 0),
      0
    );
  }, [reservas]);

  // Filtrado de reservas
  const reservasFiltradas = useMemo(() => {
    return reservas.filter((r) => {
      // Búsqueda por texto
      const q = busqueda.toLowerCase().trim();
      const matchCodigo = r.codigo_reserva.toLowerCase().includes(q);
      const matchHab = r.habitaciones?.numero.toLowerCase().includes(q) || false;
      const matchHuesped =
        (r.huespedes?.nombres && r.huespedes.nombres.toLowerCase().includes(q)) ||
        (r.huespedes?.apellidos && r.huespedes.apellidos.toLowerCase().includes(q)) ||
        (r.huespedes?.documento_identidad &&
          r.huespedes.documento_identidad.toLowerCase().includes(q)) ||
        false;

      const coincideTexto = !q || matchCodigo || matchHab || matchHuesped;

      // Filtro de estado
      const coincideEstado = filtroEstado === 'todos' || r.estado === filtroEstado;

      // Filtro de consumo
      const totalCons = calcularConsumosReserva(r.consumos_reserva);
      let coincideConsumo = true;
      if (filtroConsumo === 'con_consumo') {
        coincideConsumo = totalCons > 0;
      } else if (filtroConsumo === 'sin_consumo') {
        coincideConsumo = totalCons === 0;
      }

      return coincideTexto && coincideEstado && coincideConsumo;
    });
  }, [reservas, busqueda, filtroEstado, filtroConsumo]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ==================================================================== */}
      {/* CABECERA PRINCIPAL */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Control Financiero & Operativo en Tiempo Real
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Métricas Ejecutivas e Ingresos Integrales
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Supervisión integral de facturación hotelera: seguimiento simultáneo del importe de estancia en habitación y todos los consumos extras (restaurante, minibar, lavandería y servicios).
          </p>
        </div>

        <button
          onClick={cargarDatos}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-md self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TARJETAS DE KPIs (FINANCIERAS Y OPERATIVAS) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tasa de Ocupación */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Ocupación Actual</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-3 flex items-baseline gap-2">
            <span>{porcentajeOcupacion}%</span>
            <span className="text-xs text-slate-400 font-normal">
              ({ocupadas} de {totalHabitaciones} habs.)
            </span>
          </div>
          <div className="w-full bg-slate-700/60 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-blue-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(porcentajeOcupacion, 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {disponibles} habitaciones disponibles para reserva inmediata
          </div>
        </div>

        {/* KPI 2: Ingresos por Alojamiento */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Ingresos por Alojamiento</span>
            <BedDouble className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 mt-3">
            Bs. {totalIngresosAlojamiento.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Tarifas pactadas por noches ({reservas.length} reservas)</span>
          </div>
        </div>

        {/* KPI 3: Consumos Extras de Habitación */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400">
            <span>Consumos a la Habitación</span>
            <UtensilsCrossed className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-rose-400 mt-3">
            Bs. {totalIngresosConsumos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400/80" />
            <span>{totalItemsConsumidos} pedidos en restaurante, minibar y extras</span>
          </div>
        </div>

        {/* KPI 4: TOTAL COMPLETO FACTURADO */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-amber-950/30 border-2 border-emerald-500/50 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs font-bold uppercase text-emerald-400">
            <span>Gran Total Facturado</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-white mt-3 tracking-tight">
            Bs. {granTotalFacturado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-300/90 mt-2 font-medium">
            Alojamiento + Todos los Consumos
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código de reserva (#RES-...), n° habitación o huésped..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros Dropdowns */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          {/* Filtro Estado */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-slate-900">Todos los Estados</option>
              <option value="en_curso" className="bg-slate-900">En Curso (Hospedados)</option>
              <option value="confirmada" className="bg-slate-900">Confirmadas</option>
              <option value="finalizada" className="bg-slate-900">Finalizadas</option>
              <option value="cancelada" className="bg-slate-900">Canceladas</option>
            </select>
          </div>

          {/* Filtro Consumo */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={filtroConsumo}
              onChange={(e) => setFiltroConsumo(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-slate-900">Todos los Consumos</option>
              <option value="con_consumo" className="bg-slate-900">Con Consumos Extras</option>
              <option value="sin_consumo" className="bg-slate-900">Solo Alojamiento</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TABLA PRINCIPAL DE RESERVAS CON DESGLOSE COMPLETO */}
      {/* ==================================================================== */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-serif font-bold text-white text-base">
                Detalle Financiero por Habitación y Reserva
              </h3>
              <p className="text-[11px] text-slate-400">
                Mostrando {reservasFiltradas.length} reservas registradas con desglose de alojamiento y consumos
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Valores expresados en Bolivianos (Bs.)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Reserva / Fecha</th>
                <th className="py-3.5 px-4 font-semibold">Habitación & Huésped</th>
                <th className="py-3.5 px-4 font-semibold">Estadía</th>
                <th className="py-3.5 px-4 font-semibold text-right">Alojamiento</th>
                <th className="py-3.5 px-4 font-semibold text-right">Consumos Extras</th>
                <th className="py-3.5 px-4 font-semibold text-right bg-slate-900/60">Total Completo</th>
                <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                <th className="py-3.5 px-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {cargando ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    Cargando reservas y consumos desde la base de datos...
                  </td>
                </tr>
              ) : reservasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No se encontraron reservas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                reservasFiltradas.map((r) => {
                  const alojamiento = Number(r.total_alojamiento) || 0;
                  const consumosTotal = calcularConsumosReserva(r.consumos_reserva);
                  const totalCompleto = alojamiento + consumosTotal;
                  const cantidadConsumos = r.consumos_reserva?.length || 0;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Código de Reserva */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-amber-400 text-xs">
                          {r.codigo_reserva}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(r.creado_en).toLocaleDateString('es-BO')}
                        </div>
                      </td>

                      {/* Habitación & Huésped */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold text-xs">
                            Hab. {r.habitaciones?.numero || 'S/N'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Piso {r.habitaciones?.piso || '-'} &bull; {r.habitaciones?.tipos_habitacion?.nombre || 'Estándar'}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-white mt-1 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>
                            {r.huespedes
                              ? `${r.huespedes.nombres} ${r.huespedes.apellidos}`
                              : 'Huésped no registrado'}
                          </span>
                        </div>
                        {r.huespedes?.documento_identidad && (
                          <div className="text-[10px] text-slate-400">
                            {r.huespedes.tipo_documento}: {r.huespedes.documento_identidad}
                          </div>
                        )}
                      </td>

                      {/* Fechas de Estadía */}
                      <td className="py-3 px-4 text-xs">
                        <div className="text-slate-200">
                          {new Date(r.fecha_entrada).toLocaleDateString('es-BO')} &rarr;{' '}
                          {new Date(r.fecha_salida).toLocaleDateString('es-BO')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Bs. {Number(r.precio_pactado_noche).toFixed(2)} / noche
                        </div>
                      </td>

                      {/* Monto Alojamiento */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-200">
                        Bs. {alojamiento.toFixed(2)}
                      </td>

                      {/* Consumos Extras */}
                      <td className="py-3 px-4 text-right">
                        {consumosTotal > 0 ? (
                          <div>
                            <div className="font-mono font-bold text-rose-300 text-xs">
                              + Bs. {consumosTotal.toFixed(2)}
                            </div>
                            <button
                              onClick={() => setReservaModal(r)}
                              className="inline-flex items-center gap-1 text-[10px] text-rose-400/90 hover:text-rose-300 hover:underline cursor-pointer mt-0.5"
                            >
                              <span>{cantidadConsumos} consumo(s)</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono text-xs text-slate-400">Bs. 0.00</span>
                            <span className="block text-[10px] text-slate-400">Sin consumos</span>
                          </div>
                        )}
                      </td>

                      {/* Total Completo (Alojamiento + Consumos) */}
                      <td className="py-3 px-4 text-right bg-slate-900/60">
                        <div className="font-mono font-black text-amber-400 text-sm">
                          Bs. {totalCompleto.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          (Hab: {alojamiento.toFixed(0)} + Cons: {consumosTotal.toFixed(0)})
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            r.estado === 'en_curso'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : r.estado === 'confirmada'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : r.estado === 'finalizada'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {r.estado === 'en_curso'
                            ? 'En Estadía'
                            : r.estado === 'confirmada'
                            ? 'Confirmada'
                            : r.estado === 'finalizada'
                            ? 'Completada'
                            : r.estado}
                        </span>
                      </td>

                      {/* Botón Ver Folio Completo */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setReservaModal(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700 hover:border-amber-500 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                          title="Ver Folio de Cuenta Completo con Consumos"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Folio</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL DETALLE DE FOLIO / ESTADO DE CUENTA DE LA HABITACIÓN */}
      {/* ==================================================================== */}
      {reservaModal && (() => {
        const alojamiento = Number(reservaModal.total_alojamiento) || 0;
        const consumosTotal = calcularConsumosReserva(reservaModal.consumos_reserva);
        const granTotal = alojamiento + consumosTotal;
        const consumos = reservaModal.consumos_reserva || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              {/* Encabezado del Modal */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-white text-lg sm:text-xl">
                      Folio de Cuenta y Consumos de Habitación
                    </h3>
                    <p className="text-xs text-slate-400">
                      Reserva <span className="font-mono text-amber-400 font-bold">{reservaModal.codigo_reserva}</span> &bull; Gran Hotel Illimani
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setReservaModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido con Scroll */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Datos del Huésped y Habitación */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Huésped Titular</div>
                    <div className="font-bold text-white text-sm mt-1">
                      {reservaModal.huespedes
                        ? `${reservaModal.huespedes.nombres} ${reservaModal.huespedes.apellidos}`
                        : 'Huésped no registrado'}
                    </div>
                    {reservaModal.huespedes?.documento_identidad && (
                      <div className="text-slate-400 mt-0.5">
                        {reservaModal.huespedes.tipo_documento}: {reservaModal.huespedes.documento_identidad}
                      </div>
                    )}
                    {reservaModal.huespedes?.telefono && (
                      <div className="text-emerald-400 mt-0.5">Tel: {reservaModal.huespedes.telefono}</div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Habitación Asignada</div>
                    <div className="font-bold text-amber-400 text-sm mt-1">
                      Habitación {reservaModal.habitaciones?.numero || 'S/N'}
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      Piso {reservaModal.habitaciones?.piso || '-'} &bull; {reservaModal.habitaciones?.tipos_habitacion?.nombre || 'Estándar'}
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        Estado: {reservaModal.estado}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Fechas de Estancia</div>
                    <div className="font-semibold text-white mt-1">
                      In: {new Date(reservaModal.fecha_entrada).toLocaleDateString('es-BO')}
                    </div>
                    <div className="font-semibold text-white">
                      Out: {new Date(reservaModal.fecha_salida).toLocaleDateString('es-BO')}
                    </div>
                    <div className="text-slate-400 mt-0.5 font-mono">
                      Bs. {Number(reservaModal.precio_pactado_noche).toFixed(2)} / noche
                    </div>
                  </div>
                </div>

                {/* Sección 1: Desglose de Alojamiento */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-amber-400" />
                      <span>1. Cargo por Alojamiento (Estancia)</span>
                    </h4>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      Bs. {alojamiento.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300 text-xs">
                    <span>Estadía completa pactada en recepción / web</span>
                    <span className="font-mono">Bs. {alojamiento.toFixed(2)}</span>
                  </div>
                </div>

                {/* Sección 2: Desglose de Consumos Extras */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-rose-400" />
                      <span>2. Consumos Extras Cargados a la Habitación ({consumos.length})</span>
                    </h4>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      Bs. {consumosTotal.toFixed(2)}
                    </span>
                  </div>

                  {consumos.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 italic">
                      Esta habitación no tiene consumos de minibar, restaurante o servicios extras registrados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-2">Servicio / Producto</th>
                            <th className="py-2 px-2">Categoría</th>
                            <th className="py-2 px-2 text-center">Cant.</th>
                            <th className="py-2 px-2 text-right">P. Unitario</th>
                            <th className="py-2 px-2 text-right">Subtotal</th>
                            <th className="py-2 px-2 text-right">Fecha Registro</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {consumos.map((c) => {
                            const sub = Number(c.subtotal) || (Number(c.cantidad) * Number(c.precio_unitario));
                            return (
                              <tr key={c.id} className="hover:bg-slate-900/60">
                                <td className="py-2 px-2 font-semibold text-white">
                                  {c.catalogo_servicios?.nombre || 'Consumo Registrado'}
                                </td>
                                <td className="py-2 px-2 text-slate-400">
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px]">
                                    {c.catalogo_servicios?.categoria || 'Servicio'}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-center font-bold text-slate-200">
                                  {c.cantidad}
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-slate-300">
                                  Bs. {Number(c.precio_unitario).toFixed(2)}
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-rose-300">
                                  Bs. {sub.toFixed(2)}
                                </td>
                                <td className="py-2 px-2 text-right text-slate-400 text-[11px]">
                                  {new Date(c.fecha_consumo).toLocaleDateString('es-BO')}{' '}
                                  {new Date(c.fecha_consumo).toLocaleTimeString('es-BO', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Resumen Final de Cuenta */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-950 border-2 border-emerald-500/40 space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Subtotal Habitación (Alojamiento):</span>
                    <span className="font-mono">Bs. {alojamiento.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Subtotal Consumos Extras a la Habitación:</span>
                    <span className="font-mono text-rose-300">+ Bs. {consumosTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-700/80 pt-2 flex justify-between items-center">
                    <span className="font-bold text-white uppercase tracking-wider text-xs">
                      TOTAL INTEGRAL DE LA CUENTA:
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-xl">
                      Bs. {granTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de Cierre */}
              <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setReservaModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cerrar Folio
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
