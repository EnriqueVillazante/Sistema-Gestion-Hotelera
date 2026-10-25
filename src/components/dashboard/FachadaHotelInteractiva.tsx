import React, { useState } from 'react';
import {
  HABITACIONES_SEED,
  TIPOS_HABITACION_SEED,
  type HabitacionMock,
  type TipoHabitacionMock,
  type VistaFachada,
} from '../../data/hotelData';
import {
  Info,
  CheckCircle,
  Building2,
  Image as ImageIcon,
  DoorOpen,
  MapPin,
  Sparkles,
  Sun,
  BedDouble,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface FachadaHotelInteractivaProps {
  onSeleccionarHabitacion: (
    habitacion: HabitacionMock,
    tipo: TipoHabitacionMock
  ) => void;
  habitacionPreseleccionada?: HabitacionMock | null;
  onMarcarHabitacion?: (habitacion: HabitacionMock) => void;
  onLimpiarSeleccion?: () => void;
  habitaciones?: HabitacionMock[];
}

export const FachadaHotelInteractiva: React.FC<FachadaHotelInteractivaProps> = ({
  onSeleccionarHabitacion,
  habitacionPreseleccionada,
  onMarcarHabitacion,
  onLimpiarSeleccion,
  habitaciones,
}) => {
  const [habitacionHover, setHabitacionHover] = useState<HabitacionMock | null>(null);
  const [modoVista, setModoVista] = useState<VistaFachada>('frontal');
  const [filtroPiso, setFiltroPiso] = useState<number | 'todos'>('todos');
  const [mostrarInfoTerraza, setMostrarInfoTerraza] = useState(false);
  const [mostrarInfoLobby, setMostrarInfoLobby] = useState(false);

  const listaHabitaciones = habitaciones || HABITACIONES_SEED;

  // Imagen según la vista activa
  const imagenFachada =
    modoVista === 'frontal'
      ? '/fachada_frontal.jpg'
      : modoVista === 'lateral_izq'
      ? '/fachada_lateral_izq.jpg'
      : '/fachada_lateral_der.jpg';

  // Filtrar estrictamente solo las habitaciones que pertenecen a la vista activa
  const habitacionesMostradas = listaHabitaciones.filter((hab) => {
    const coords = hab.coordenadasPorVista?.[modoVista];
    if (!coords) return false;
    if (filtroPiso !== 'todos' && hab.piso !== filtroPiso) return false;
    return true;
  });

  // Obtener información del tipo de habitación
  const obtenerTipo = (tipoId: string): TipoHabitacionMock => {
    return (
      TIPOS_HABITACION_SEED.find((t) => t.id === tipoId) ||
      TIPOS_HABITACION_SEED[0]
    );
  };

  const handleClicHabitacion = (hab: HabitacionMock) => {
    if (hab.estado !== 'disponible') return;
    const tipo = obtenerTipo(hab.tipo_id);

    // Si ya estaba marcada en la fachada, el siguiente clic abre la confirmación de fechas
    if (habitacionPreseleccionada?.id === hab.id) {
      onSeleccionarHabitacion(hab, tipo);
    } else if (onMarcarHabitacion) {
      // Primer clic: marcar visualmente sobre la fachada
      onMarcarHabitacion(hab);
    } else {
      onSeleccionarHabitacion(hab, tipo);
    }
  };

  const tipoHabMarcada = habitacionPreseleccionada
    ? obtenerTipo(habitacionPreseleccionada.tipo_id)
    : null;

  return (
    <div className="w-full space-y-6">
      {/* Barra de Controles de la Fachada Interactiva */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Boceto Interactivo de la Fachada
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Haz Clic para Marcar</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Toca directamente sobre la ventana o balcón donde deseas hospedarte
            </p>
          </div>
        </div>

        {/* Controles: Selector de Fachada y Filtros de Piso */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de las 3 Vistas Reales del Hotel */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => {
                setModoVista('frontal');
                setHabitacionHover(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                modoVista === 'frontal'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Frontal</span>
            </button>

            <button
              onClick={() => {
                setModoVista('lateral_izq');
                setHabitacionHover(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                modoVista === 'lateral_izq'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Lateral Izquierdo</span>
            </button>

            <button
              onClick={() => {
                setModoVista('lateral_der');
                setHabitacionHover(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                modoVista === 'lateral_der'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Lateral Derecho</span>
            </button>
          </div>

          {/* Filtro por Pisos */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shadow-inner">
            <button
              onClick={() => setFiltroPiso('todos')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filtroPiso === 'todos'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroPiso(3)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filtroPiso === 3
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Piso 3
            </button>
            <button
              onClick={() => setFiltroPiso(2)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filtroPiso === 2
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Piso 2
            </button>
            <button
              onClick={() => setFiltroPiso(1)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filtroPiso === 1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Piso 1
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor Principal de la Fachada Interactiva */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-800 bg-slate-950 select-none group/fachada">
        {/* Barra superior de información rápida al pasar el cursor (Hover) - sin tapar las ventanas */}
        <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none flex items-center justify-between">
          <div className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-white">
              {modoVista === 'frontal' ? 'Fachada Frontal Principal' : modoVista === 'lateral_izq' ? 'Fachada Lateral Izquierda' : 'Fachada Lateral Derecha'}
            </span>
          </div>

          {habitacionHover && (
            <div className="px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-amber-500/50 text-xs text-white flex items-center gap-2 shadow-xl animate-in fade-in duration-150">
              <span className="font-mono font-black text-amber-400">Hab. {habitacionHover.numero}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-200">{obtenerTipo(habitacionHover.tipo_id).nombre}</span>
              <span className="text-slate-400">•</span>
              <span className="font-extrabold text-amber-300">Bs. {obtenerTipo(habitacionHover.tipo_id).precio_base_noche}/noche</span>
            </div>
          )}
        </div>

        {/* Fotografía de la Fachada Activa */}
        <div className="relative w-full aspect-[16/9]">
          <img
            src={imagenFachada}
            alt={`Fachada ${modoVista === 'frontal' ? 'Frontal' : modoVista === 'lateral_izq' ? 'Lateral Izquierdo' : 'Lateral Derecho'} Gran Hotel Illimani`}
            className="w-full h-full object-cover select-none pointer-events-none"
          />

          {/* Sombra de contraste para destacar los hotspots */}
          <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />

          {/* Zonas Interactivas: Hotspots sobre ventanas y balcones */}
          {habitacionesMostradas.map((hab) => {
            const coords = hab.coordenadasPorVista?.[modoVista];
            if (!coords) return null;

            const tipo = obtenerTipo(hab.tipo_id);
            const esSeleccionada = habitacionPreseleccionada?.id === hab.id;
            const esHover = habitacionHover?.id === hab.id;
            const estaDisponible = hab.estado === 'disponible';

            return (
              <div
                key={hab.id}
                style={{
                  left: `${coords.x}%`,
                  top: `${coords.y}%`,
                  width: `${coords.w}%`,
                  height: `${coords.h}%`,
                }}
                onMouseEnter={() => setHabitacionHover(hab)}
                onMouseLeave={() => setHabitacionHover(null)}
                onClick={() => handleClicHabitacion(hab)}
                className={`absolute rounded-xl transition-all duration-200 flex flex-col items-center justify-center p-1 cursor-pointer select-none ${
                  esSeleccionada
                    ? 'ring-4 ring-amber-400 bg-amber-500/40 shadow-2xl z-30 scale-105'
                    : estaDisponible
                    ? esHover
                      ? 'ring-2 ring-emerald-400 bg-emerald-500/30 shadow-lg z-20 scale-102'
                      : 'border-2 border-emerald-400/60 bg-emerald-950/15 hover:bg-emerald-500/25'
                    : 'border-2 border-rose-500/60 bg-rose-950/40 cursor-not-allowed opacity-75'
                }`}
                title={`Habitación ${hab.numero} - ${tipo.nombre}`}
              >
                {/* Placa compacta con número y punto de estado - no desborda ni colisiona */}
                <div
                  className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-black shadow-md border flex items-center justify-center gap-1.5 transition-transform ${
                    esSeleccionada
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-white/60 scale-110'
                      : estaDisponible
                      ? 'bg-slate-950/90 text-emerald-300 border-emerald-400/50'
                      : 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      esSeleccionada
                        ? 'bg-slate-950 animate-ping'
                        : estaDisponible
                        ? 'bg-emerald-400'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span>{hab.numero}</span>
                </div>

                {/* Badge flotante animado de habitación marcada */}
                {esSeleccionada && (
                  <div className="mt-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-md">
                    <MapPin className="w-2.5 h-2.5 fill-slate-950" />
                    <span>Tu Elección</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Zona Especial: Terraza Solárium (Solo en Lateral Derecho) */}
          {modoVista === 'lateral_der' && (
            <div
              style={{
                left: '42.5%',
                top: '13.5%',
                width: '15.0%',
                height: '15.0%',
              }}
              onClick={() => setMostrarInfoTerraza(!mostrarInfoTerraza)}
              className="absolute rounded-xl border border-dashed border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/25 transition-all flex flex-col items-center justify-center p-1 cursor-pointer z-10"
              title="Terraza Panorámica Illimani - Espacio Común de Descanso"
            >
              <div className="bg-slate-950/90 text-amber-300 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-amber-400/30 flex items-center gap-1 shadow-md">
                <Sun className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Terraza /</span>
                <span>Mirador</span>
              </div>
            </div>
          )}

          {/* Zona Especial: Recepción Central y Lobby */}
          {modoVista === 'frontal' ? (
            <div
              style={{
                left: '44.8%',
                top: '65.5%',
                width: '10.4%',
                height: '25.5%',
              }}
              onClick={() => setMostrarInfoLobby(!mostrarInfoLobby)}
              className="absolute rounded-2xl border-2 border-amber-400/60 bg-amber-950/20 hover:bg-amber-500/30 transition-all flex flex-col items-center justify-end p-2 cursor-pointer z-10"
              title="Puerta Principal y Recepción Central - Abierto 24 Horas"
            >
              <div className="bg-slate-950/90 text-amber-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-amber-400/40 flex items-center gap-1 shadow-lg">
                <DoorOpen className="w-3 h-3" />
                <span className="hidden sm:inline">Lobby /</span>
                <span>Recepción</span>
              </div>
            </div>
          ) : (
            <div
              style={{
                left: '78.5%',
                top: '68.0%',
                width: '10.0%',
                height: '26.5%',
              }}
              onClick={() => setMostrarInfoLobby(!mostrarInfoLobby)}
              className="absolute rounded-2xl border-2 border-amber-400/50 bg-amber-950/20 hover:bg-amber-500/30 transition-all flex flex-col items-center justify-end p-2 cursor-pointer z-10"
              title="Acceso Lateral al Hotel - 24 Horas"
            >
              <div className="bg-slate-950/90 text-amber-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-amber-400/40 flex items-center gap-1 shadow-lg">
                <DoorOpen className="w-3 h-3" />
                <span>Acceso</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal informativo flotante de Terraza */}
        {mostrarInfoTerraza && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-amber-500/50 p-4 shadow-2xl text-white max-w-sm w-full animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                Terraza Mirador Illimani
              </span>
              <button
                onClick={() => setMostrarInfoTerraza(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Área común al aire libre en el tercer piso con solárium y vista despejada a la cordillera. Disponible sin costo adicional para todos nuestros huéspedes.
            </p>
          </div>
        )}

        {/* Modal informativo flotante de Lobby */}
        {mostrarInfoLobby && (
          <div className="absolute bottom-4 right-4 z-40 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-amber-500/50 p-4 shadow-2xl text-white max-w-sm w-full animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <DoorOpen className="w-4 h-4 text-amber-400" />
                Hall y Recepción Central
              </span>
              <button
                onClick={() => setMostrarInfoLobby(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Atención personalizada las 24 horas del día. Servicio de concierge, custodia de equipaje y asistencia para tours en La Paz.
            </p>
          </div>
        )}
      </div>

      {/* TARJETA DESTACADA: HABITACIÓN MARCADA EN LA FACHADA */}
      {habitacionPreseleccionada && tipoHabMarcada && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/15 border-2 border-amber-500/60 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 flex flex-col items-center justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wider">HAB.</span>
                <span className="text-2xl font-mono leading-none">{habitacionPreseleccionada.numero}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Habitación Marcada en Fachada</span>
                  </span>
                  <span className="text-xs text-slate-400">Piso {habitacionPreseleccionada.piso}</span>
                </div>

                <h4 className="text-xl font-serif font-black text-white tracking-tight">
                  {tipoHabMarcada.nombre}
                </h4>

                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{habitacionPreseleccionada.caracteristicas.join(' • ')}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="text-left md:text-right">
                <span className="text-2xl font-black text-amber-400 block font-serif">
                  Bs. {tipoHabMarcada.precio_base_noche}
                </span>
                <span className="text-xs text-slate-400">por noche (impuestos incl.)</span>
              </div>

              <div className="flex items-center gap-2">
                {onLimpiarSeleccion && (
                  <button
                    type="button"
                    onClick={onLimpiarSeleccion}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Desmarcar y elegir otra ventana"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSeleccionarHabitacion(habitacionPreseleccionada, tipoHabMarcada)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <BedDouble className="w-4 h-4" />
                  <span>Hospedarme en Hab. {habitacionPreseleccionada.numero}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda de Referencia de la Fachada */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-emerald-500/40 border border-emerald-400" />
            <span className="text-slate-300">Habitación Libre (Toca para marcar)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-amber-400 border border-amber-300 ring-2 ring-amber-400/40" />
            <span className="text-amber-300 font-semibold">Tu Habitación Marcada</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-rose-600/40 border border-rose-500" />
            <span className="text-slate-300">Ocupada</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Balcones coloniales en madera noble tallada en los pisos 2 y 3</span>
        </div>
      </div>
    </div>
  );
};
