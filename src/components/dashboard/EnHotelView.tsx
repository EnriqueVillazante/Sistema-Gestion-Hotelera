import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { ReservaConDetalle, ConsumoReserva, CatalogoServicio } from '../../types/database';
import {
  BedDouble,
  Receipt,
  Plus,
  UtensilsCrossed,
  Wine,
  Shirt,
  Sparkles,
  LogOut,
  Coffee,
  GlassWater,
  Droplets,
  Cookie,
  AlertCircle,
  FileCheck,
  X,
  CreditCard,
  Car,
  Compass,
  RefreshCw,
} from 'lucide-react';

interface EnHotelViewProps {
  reserva: ReservaConDetalle;
  onAgregarConsumo: (nuevoConsumo: ConsumoReserva & { catalogo_servicios?: CatalogoServicio | null }) => Promise<void>;
  onRealizarCheckOut: () => Promise<void>;
  cargando: boolean;
}

export const EnHotelView: React.FC<EnHotelViewProps> = ({
  reserva,
  onAgregarConsumo,
  onRealizarCheckOut,
  cargando,
}) => {
  const [servicios, setServicios] = useState<CatalogoServicio[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [servicioSeleccionado, setServicioSeleccionado] = useState<CatalogoServicio | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [modalCheckOutAbierto, setModalCheckOutAbierto] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Cargar catálogo de servicios real desde la base de datos de Supabase
  const cargarServiciosDesdeSupabase = async () => {
    try {
      setCargandoCatalogo(true);
      const { data, error } = await supabase
        .from('catalogo_servicios')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) {
        console.error('[EnHotelView] Error al consultar catalogo_servicios:', error.message);
      } else if (data) {
        setServicios(data);
      }
    } catch (err) {
      console.error('[EnHotelView] Excepción cargando servicios:', err);
    } finally {
      setCargandoCatalogo(false);
    }
  };

  useEffect(() => {
    cargarServiciosDesdeSupabase();
  }, []);

  // Etiquetas legibles para las categorías de la base de datos
  const NOMBRES_CATEGORIAS: Record<string, string> = {
    todos: 'Todos los Servicios',
    alimentos_bebidas: '🍽️ Restaurante y Bar',
    minibar: '🍾 Minibar',
    lavanderia: '🧺 Lavandería',
    servicio_extra: '✨ Servicios Extra',
    transporte: '🚗 Transporte',
    tour: '🏔️ Tours y Paseos',
  };

  // Extraer las categorías únicas existentes en la base de datos
  const categoriasDisponibles = [
    'todos',
    ...Array.from(new Set(servicios.map((s) => s.categoria))),
  ];

  // Filtrar servicios
  const serviciosFiltrados =
    categoriaFiltro === 'todos'
      ? servicios
      : servicios.filter((s) => s.categoria === categoriaFiltro);

  // Cálculo del Folio de la Habitación
  const totalAlojamiento = Number(reserva.total_alojamiento) || 0;
  const consumos = reserva.consumos || [];
  const totalConsumos = consumos.reduce((acc, c) => acc + Number(c.subtotal || 0), 0);
  const totalPagos = (reserva.pagos || []).reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const saldoPendiente = totalAlojamiento + totalConsumos - totalPagos;

  // Iconos asignados según el tipo y nombre del producto en la base de datos
  const renderIconoServicio = (nombre: string, categoria: string) => {
    const n = nombre.toLowerCase();
    const c = categoria.toLowerCase();
    if (n.includes('café') || n.includes('desayuno')) return <Coffee className="w-5 h-5 text-amber-400" />;
    if (n.includes('té') || n.includes('coca') || n.includes('agua')) return <GlassWater className="w-5 h-5 text-blue-400" />;
    if (n.includes('cerveza') || n.includes('vino') || n.includes('singani') || n.includes('cóctel') || n.includes('chuflay')) return <Wine className="w-5 h-5 text-rose-400" />;
    if (n.includes('sándwich') || n.includes('salteña') || n.includes('silpancho') || n.includes('sopa') || n.includes('marraqueta') || c.includes('alimentos')) return <UtensilsCrossed className="w-5 h-5 text-amber-400" />;
    if (n.includes('lavandería') || n.includes('planchado') || c.includes('lavanderia')) return <Shirt className="w-5 h-5 text-cyan-400" />;
    if (n.includes('oxigeno') || n.includes('soroche')) return <Droplets className="w-5 h-5 text-emerald-400" />;
    if (c.includes('transporte') || n.includes('traslado') || n.includes('aeropuerto')) return <Car className="w-5 h-5 text-indigo-400" />;
    if (c.includes('tour') || n.includes('teleférico')) return <Compass className="w-5 h-5 text-amber-300" />;
    if (c.includes('minibar') || n.includes('papas') || n.includes('chocolate') || n.includes('red bull')) return <Cookie className="w-5 h-5 text-amber-300" />;
    return <Sparkles className="w-5 h-5 text-amber-400" />;
  };

  // Solicitar consumo a la habitación persistido en Supabase
  const handleConfirmarConsumo = async () => {
    if (!servicioSeleccionado) return;

    const subtotal = Number(servicioSeleccionado.precio_unitario) * cantidad;
    const nuevoConsumo: ConsumoReserva & { catalogo_servicios?: CatalogoServicio | null } = {
      id: crypto.randomUUID(),
      reserva_id: reserva.id,
      servicio_id: servicioSeleccionado.id, // UUID real de la tabla catalogo_servicios
      cantidad: cantidad,
      precio_unitario: Number(servicioSeleccionado.precio_unitario),
      subtotal: subtotal,
      fecha_consumo: new Date().toISOString(),
      catalogo_servicios: servicioSeleccionado,
    };

    await onAgregarConsumo(nuevoConsumo);
    setNotificacion(`¡${servicioSeleccionado.nombre} agregado al folio de tu habitación!`);
    setServicioSeleccionado(null);
    setCantidad(1);

    setTimeout(() => {
      setNotificacion(null);
    }, 4000);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Alerta de notificación temporal */}
      {notificacion && (
        <div className="fixed top-24 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/30 animate-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-semibold">{notificacion}</span>
        </div>
      )}

      {/* Banner de Llave Digital y Estado Activo */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 p-6 sm:p-8 text-slate-950 shadow-2xl border border-amber-400/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center p-3 shadow-xl border border-amber-400/40">
            <BedDouble className="w-10 h-10" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Estancia Activa • En el Hotel</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-black text-white tracking-tight">
              Habitación {reserva.habitaciones?.numero || '302'}
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 font-medium">
              {reserva.habitaciones?.tipos_habitacion?.nombre || 'Suite Presidencial Illimani'} • Llave Digital Activa
            </p>
          </div>
        </div>

        {/* Acciones de la Estancia */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setModalCheckOutAbierto(true)}
            className="px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-amber-400/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Check-out Express</span>
          </button>
        </div>
      </div>

      {/* Layout de Contenido: Catálogo de Servicios y Folio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columnas 1 y 2: Catálogo de Servicios de Supabase */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                  Servicios y Productos del Hotel
                </h2>
                <button
                  onClick={cargarServiciosDesdeSupabase}
                  title="Recargar catálogo de Supabase"
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cargandoCatalogo ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pide directamente a tu habitación con cargo directo a tu folio de cuenta oficial
              </p>
            </div>

            {/* Filtros de Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categoriasDisponibles.map((catKey) => {
                const label = NOMBRES_CATEGORIAS[catKey] || catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => setCategoriaFiltro(catKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      categoriaFiltro === catKey
                        ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Servicios Reales desde Supabase */}
          {cargandoCatalogo ? (
            <div className="p-12 text-center text-slate-400 rounded-3xl bg-slate-900/40 border border-slate-800">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
              <span>Cargando servicios oficiales desde Supabase...</span>
            </div>
          ) : serviciosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-500 rounded-3xl bg-slate-900/40 border border-slate-800">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>No hay servicios disponibles en esta categoría en la base de datos.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {serviciosFiltrados.map((servicio) => (
                <div
                  key={servicio.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2.5 rounded-xl bg-slate-800 group-hover:scale-105 transition-transform">
                        {renderIconoServicio(servicio.nombre, servicio.categoria)}
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                        {NOMBRES_CATEGORIAS[servicio.categoria] || servicio.categoria}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      {servicio.nombre}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-base font-extrabold text-white">
                      Bs. {Number(servicio.precio_unitario).toFixed(2)}
                    </span>

                    <button
                      onClick={() => {
                        setServicioSeleccionado(servicio);
                        setCantidad(1);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-amber-500/30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pedir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna 3: Folio / Cuenta de la Habitación en Tiempo Real */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-serif font-bold text-white">
                  Folio de Cuenta
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {reserva.codigo_reserva}
              </span>
            </div>

            {/* Resumen de Valores */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Hospedaje ({reserva.fecha_entrada} al {reserva.fecha_salida})</span>
                <span className="font-semibold text-white">
                  Bs. {totalAlojamiento.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Consumos de Habitación ({consumos.length})</span>
                <span className="font-semibold text-white">
                  Bs. {totalConsumos.toFixed(2)}
                </span>
              </div>

              {totalPagos > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Anticipos / Pagos Realizados</span>
                  <span>- Bs. {totalPagos.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-amber-400">Saldo Total Pendiente:</span>
                <span className="text-xl font-black text-white">
                  Bs. {saldoPendiente.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Detalle de Consumos Cargados */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Consumos Realizados
              </h4>

              {consumos.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                  Aún no has solicitado consumos. Elige del menú de la izquierda para pedir a tu cuarto.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
                  {consumos.map((item) => (
                    <div
                      key={item.id}
                      className="pt-2 flex items-center justify-between text-xs text-slate-300"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-white block truncate">
                          {item.catalogo_servicios?.nombre || 'Servicio'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {item.cantidad} x Bs. {Number(item.precio_unitario).toFixed(2)}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-400 flex-shrink-0">
                        Bs. {Number(item.subtotal).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Confirmar Pedido de Servicio */}
      {servicioSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-white space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                  {NOMBRES_CATEGORIAS[servicioSeleccionado.categoria] || servicioSeleccionado.categoria}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {servicioSeleccionado.nombre}
                </h3>
              </div>
              <button
                onClick={() => setServicioSeleccionado(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Precio Unitario:</span>
                <span className="font-bold text-white">
                  Bs. {Number(servicioSeleccionado.precio_unitario).toFixed(2)}
                </span>
              </div>

              {/* Selector de Cantidad */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-sm text-slate-400">Cantidad:</span>
                <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="text-slate-400 hover:text-white font-bold px-1"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm w-4 text-center">{cantidad}</span>
                  <button
                    onClick={() => setCantidad(cantidad + 1)}
                    className="text-slate-400 hover:text-white font-bold px-1"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total a Pagar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-sm">
                <span className="font-semibold text-amber-400">Total a Cargar:</span>
                <span className="text-lg font-black text-amber-400">
                  Bs. {(Number(servicioSeleccionado.precio_unitario) * cantidad).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Se cargará al folio oficial de la Habitación {reserva.habitaciones?.numero}.</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setServicioSeleccionado(null)}
                className="py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarConsumo}
                className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-amber-500/20"
              >
                Confirmar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Check-out Express */}
      {modalCheckOutAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-white space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                  Fin de Estancia
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Check-out de Habitación
                </h3>
              </div>
              <button
                onClick={() => setModalCheckOutAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Hospedaje:</span>
                <span>Bs. {totalAlojamiento.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Consumos ({consumos.length}):</span>
                <span>Bs. {totalConsumos.toFixed(2)}</span>
              </div>
              {totalPagos > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Pagos Registrados:</span>
                  <span>- Bs. {totalPagos.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                <span>Saldo por Liquidar:</span>
                <span className="text-amber-400">Bs. {saldoPendiente.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Al confirmar tu salida, la llave digital se desactivará y se notificará a Recepción y Housekeeping para la inspección y limpieza de la habitación.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModalCheckOutAbierto(false)}
                className="py-3 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Permanecer en Habitación
              </button>
              <button
                onClick={async () => {
                  setModalCheckOutAbierto(false);
                  await onRealizarCheckOut();
                }}
                disabled={cargando}
                className="py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {cargando ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Confirmar Check-out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
