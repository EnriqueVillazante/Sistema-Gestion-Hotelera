import React, { useState } from 'react';
import type { ReservaConDetalle, ConsumoReserva, CatalogoServicio } from '../../types/database';
import { SERVICIOS_SEED, type ServicioMock } from '../../data/hotelData';
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
  Sandwich,
  GlassWater,
  Droplets,
  Cookie,
  AlertCircle,
  FileCheck,
  X,
  CreditCard
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
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todos');
  const [servicioSeleccionado, setServicioSeleccionado] = useState<ServicioMock | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [modalCheckOutAbierto, setModalCheckOutAbierto] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Filtrar servicios del catálogo
  const categorias = ['Todos', 'Restaurante', 'Minibar', 'Lavandería', 'Spa & Relax'];
  const serviciosFiltrados =
    categoriaFiltro === 'Todos'
      ? SERVICIOS_SEED
      : SERVICIOS_SEED.filter((s) => s.categoria === categoriaFiltro);

  // Cálculo del Folio de la Habitación
  const totalAlojamiento = Number(reserva.total_alojamiento) || 0;
  const consumos = reserva.consumos || [];
  const totalConsumos = consumos.reduce((acc, c) => acc + Number(c.subtotal || 0), 0);
  const totalPagos = (reserva.pagos || []).reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const saldoPendiente = totalAlojamiento + totalConsumos - totalPagos;

  // Renderizar icono por categoría/servicio
  const renderIcono = (iconoNombre: string) => {
    switch (iconoNombre) {
      case 'UtensilsCrossed':
        return <UtensilsCrossed className="w-5 h-5" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5" />;
      case 'Sandwich':
        return <Sandwich className="w-5 h-5" />;
      case 'Wine':
        return <Wine className="w-5 h-5" />;
      case 'GlassWater':
        return <GlassWater className="w-5 h-5" />;
      case 'Droplets':
        return <Droplets className="w-5 h-5" />;
      case 'Cookie':
        return <Cookie className="w-5 h-5" />;
      case 'Shirt':
        return <Shirt className="w-5 h-5" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  // Solicitar consumo a la habitación
  const handleConfirmarConsumo = async () => {
    if (!servicioSeleccionado) return;

    const subtotal = servicioSeleccionado.precio_unitario * cantidad;
    const nuevoConsumo: ConsumoReserva & { catalogo_servicios?: CatalogoServicio | null } = {
      id: `cons-${Date.now()}`,
      reserva_id: reserva.id,
      servicio_id: servicioSeleccionado.id,
      cantidad: cantidad,
      precio_unitario: servicioSeleccionado.precio_unitario,
      subtotal: subtotal,
      fecha_consumo: new Date().toISOString(),
      catalogo_servicios: {
        id: servicioSeleccionado.id,
        nombre: servicioSeleccionado.nombre,
        categoria: servicioSeleccionado.categoria,
        precio_unitario: servicioSeleccionado.precio_unitario,
        activo: true,
        creado_en: new Date().toISOString(),
      },
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
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Finalizar Estancia (Check-out)</span>
          </button>
        </div>
      </div>

      {/* Layout de dos columnas: Servicios a la Habitación vs Folio de Cuenta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna 1 y 2: Catálogo de Servicios y Comidas (TODO LO QUE OFRECEMOS) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-400" />
                <span>Servicios, Room Service y Minibar</span>
              </h2>
              <p className="text-xs text-slate-400">
                Pide alimentos gourmet, bebidas o aseo directo a tu habitación
              </p>
            </div>

            {/* Filtros de Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaFiltro(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    categoriaFiltro === cat
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Servicios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {serviciosFiltrados.map((servicio) => (
              <div
                key={servicio.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400 group-hover:scale-105 transition-transform">
                      {renderIcono(servicio.icono)}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                      {servicio.categoria}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    {servicio.nombre}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {servicio.descripcion}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-base font-extrabold text-white">
                    Bs. {servicio.precio_unitario}
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
                          {item.cantidad} x Bs. {item.precio_unitario}
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
                  {servicioSeleccionado.categoria}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {servicioSeleccionado.nombre}
                </h3>
              </div>
              <button
                onClick={() => setServicioSeleccionado(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {servicioSeleccionado.descripcion}
            </p>

            {/* Selector de Cantidad */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold">Cantidad:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-200 cursor-pointer"
                >
                  -
                </button>
                <span className="font-bold text-sm text-white w-4 text-center">
                  {cantidad}
                </span>
                <button
                  type="button"
                  onClick={() => setCantidad(cantidad + 1)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-slate-200 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total a Cargar */}
            <div className="flex justify-between items-baseline pt-2 text-sm font-bold">
              <span className="text-slate-400">Total a Cargar:</span>
              <span className="text-xl text-amber-400">
                Bs. {(servicioSeleccionado.precio_unitario * cantidad).toFixed(2)}
              </span>
            </div>

            {/* Botón de Confirmación */}
            <button
              onClick={handleConfirmarConsumo}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Confirmar y Enviar al Cuarto</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Finalización de Estancia (Check-out) */}
      {modalCheckOutAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-white space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                <LogOut className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white tracking-tight">
                ¿Deseas Realizar el Check-out?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Al confirmar, se dará por finalizada tu estancia en la{' '}
                <strong className="text-white">Habitación {reserva.habitaciones?.numero}</strong>. 
                La habitación pasará inmediatamente a{' '}
                <strong className="text-amber-400">estado de limpieza</strong> para el personal de camareras.
              </p>
            </div>

            {/* Resumen de Liquidación */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Alojamiento:</span>
                <span className="font-semibold text-white">Bs. {totalAlojamiento.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Consumos Habitación:</span>
                <span className="font-semibold text-white">Bs. {totalConsumos.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
                <span className="text-amber-400">Saldo a Liquidar:</span>
                <span className="text-white text-base">Bs. {saldoPendiente.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Puedes liquidar tu saldo en recepción en efectivo, tarjeta o QR al momento de entregar tu tarjeta física.
              </span>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalCheckOutAbierto(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Seguir en el Hotel
              </button>

              <button
                type="button"
                disabled={cargando}
                onClick={async () => {
                  await onRealizarCheckOut();
                  setModalCheckOutAbierto(false);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <CreditCard className="w-4 h-4" />
                <span>{cargando ? 'Procesando...' : 'Confirmar Check-out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
