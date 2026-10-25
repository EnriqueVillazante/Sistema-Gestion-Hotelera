import React from 'react';
import type { ReservaConDetalle } from '../../types/database';
import {
  Calendar,
  BedDouble,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface ReservaConfirmadaViewProps {
  reserva: ReservaConDetalle;
  onHacerCheckIn: () => Promise<void>;
  cargando: boolean;
}

export const ReservaConfirmadaView: React.FC<ReservaConfirmadaViewProps> = ({
  reserva,
  onHacerCheckIn,
  cargando,
}) => {
  const fEntrada = new Date(reserva.fecha_entrada);
  const fSalida = new Date(reserva.fecha_salida);
  const noches = Math.max(
    1,
    Math.ceil((fSalida.getTime() - fEntrada.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Alerta de Estado Confirmada */}
      <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              ¡Tu Reserva está Confirmada en el Gran Hotel Illimani!
            </h3>
            <p className="text-xs text-amber-200/80">
              Código de confirmación:{' '}
              <span className="font-mono font-bold text-white">
                {reserva.codigo_reserva}
              </span>
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
          Pendiente de Llegada
        </span>
      </div>

      {/* Tarjeta de Detalle de la Estancia */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Cabecera de la Habitación Asignada */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <BedDouble className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 block mb-0.5">
                Habitación Asignada
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Habitación {reserva.habitaciones?.numero || '302'} •{' '}
                {reserva.habitaciones?.tipos_habitacion?.nombre || 'Suite Presidencial'}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Piso {reserva.habitaciones?.piso || 3} • Ala Este con Vista al Illimani</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Total Alojamiento</span>
            <span className="text-2xl font-extrabold text-white">
              Bs. {reserva.total_alojamiento}
            </span>
            <span className="text-[11px] text-slate-500 block">
              ({noches} noches • Bs. {reserva.precio_pactado_noche}/noche)
            </span>
          </div>
        </div>

        {/* Resumen de Fechas y Políticas */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-800 text-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
              Check-in (Entrada)
            </span>
            <div className="flex items-center gap-2 text-white font-bold">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{reserva.fecha_entrada}</span>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              A partir de las 14:00 hrs
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
              Check-out (Salida)
            </span>
            <div className="flex items-center gap-2 text-white font-bold">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{reserva.fecha_salida}</span>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Hasta las 12:00 hrs (Mediodía)
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
              Garantía y Servicios
            </span>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Desayuno Buffet Incluido</span>
            </div>
            <span className="text-xs text-slate-400 block">
              Acceso a Spa, Piscina y Wi-Fi 6
            </span>
          </div>
        </div>

        {/* Notificación para la llegada */}
        <div className="p-6 sm:p-8 bg-slate-950/60 space-y-6">
          <div className="flex items-start gap-3 text-xs text-slate-300 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Cuando llegues a las instalaciones del hotel, puedes realizar tu{' '}
              <strong className="text-white">Check-in</strong> directamente con nuestro recepcionista o activar tu estancia con el botón de abajo para habilitar tu llave digital y comenzar a pedir Room Service y servicios a la habitación.
            </p>
          </div>

          {/* Botón de Entrada / Check-in */}
          <div className="flex justify-end">
            <button
              onClick={onHacerCheckIn}
              disabled={cargando}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-bold text-sm rounded-xl shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>
                {cargando ? 'Procesando Check-in...' : 'Realizar Check-in (Ya estoy en el Hotel)'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
