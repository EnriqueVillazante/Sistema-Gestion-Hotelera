import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { cache } from '../../lib/cache';
import type { ReservaConDetalle, ConsumoReserva, CatalogoServicio } from '../../types/database';
import { HuespedNavbar } from './HuespedNavbar';
import { SinReservaView } from './SinReservaView';
import { ReservaConfirmadaView } from './ReservaConfirmadaView';
import { EnHotelView } from './EnHotelView';
import { PerfilUsuario } from './PerfilUsuario';
import { CheckCircle2, X } from 'lucide-react';

const CACHE_RESERVA_KEY = 'huesped_reserva_activa';

interface DashboardHuespedProps {
  onIrAPanelAdmin?: () => void;
}

export const DashboardHuesped: React.FC<DashboardHuespedProps> = ({ onIrAPanelAdmin }) => {
  const { user } = useAuth();
  const [reservaActiva, setReservaActiva] = useState<ReservaConDetalle | null>(() => {
    return cache.get<ReservaConDetalle>(CACHE_RESERVA_KEY);
  });
  const [cargando, setCargando] = useState(false);
  const [mostrarModalPerfil, setMostrarModalPerfil] = useState(false);
  const [comprobanteCheckOut, setComprobanteCheckOut] = useState<{
    codigo: string;
    habitacion: string;
    total: number;
  } | null>(null);

  // Consultar reserva activa del huésped en Supabase
  const cargarReserva = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Obtener el id de huésped asociado al usuario
      const { data: huespedData } = await supabase
        .from('huespedes')
        .select('id')
        .eq('usuario_id', user.id)
        .maybeSingle();

      const huespedId = huespedData?.id;

      if (huespedId) {
        // 2. Buscar reservas con estado confirmada o en_curso
        const { data: rawReserva, error } = await supabase
          .from('reservas')
          .select('*, habitaciones(*, tipos_habitacion(*)), consumos_reserva(*, catalogo_servicios(*)), pagos(*)')
          .eq('huesped_id', huespedId)
          .in('estado', ['confirmada', 'en_curso'])
          .order('creado_en', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && rawReserva) {
          const raw = rawReserva as unknown as Record<string, any>;
          const resFormat: ReservaConDetalle = {
            ...(raw as any),
            consumos: Array.isArray(raw.consumos_reserva) ? raw.consumos_reserva : [],
            habitaciones: raw.habitaciones || null,
            pagos: Array.isArray(raw.pagos) ? raw.pagos : [],
          };
          setReservaActiva(resFormat);
          cache.set(CACHE_RESERVA_KEY, resFormat, 60);
          return;
        }
      }
    } catch (err) {
      console.warn('[DashboardHuesped] Usando reserva local/caché:', err);
    }
  }, [user]);

  useEffect(() => {
    cargarReserva();
  }, [cargarReserva]);

  // 1. Crear Reserva (cuando no tiene reserva)
  const handleCrearReserva = async (nuevaReserva: ReservaConDetalle) => {
    setCargando(true);
    try {
      // Guardar en estado local y caché para respuesta inmediata
      setReservaActiva(nuevaReserva);
      cache.set(CACHE_RESERVA_KEY, nuevaReserva, 60);

      // Intentar persistir en Supabase si el huésped existe
      if (user?.id) {
        const { data: huesped } = await supabase
          .from('huespedes')
          .select('id')
          .eq('usuario_id', user.id)
          .maybeSingle();

        if (huesped?.id) {
          // Buscar en Supabase la habitación específica por su número
          const numHab = nuevaReserva.habitaciones?.numero;
          const { data: habDB } = await supabase
            .from('habitaciones')
            .select('id')
            .eq('numero', numHab || '')
            .maybeSingle();

          const habIdParaInsertar = habDB?.id || null;

          if (habIdParaInsertar) {
            await supabase.from('reservas').insert({
              codigo_reserva: nuevaReserva.codigo_reserva,
              huesped_id: huesped.id,
              habitacion_id: habIdParaInsertar,
              fecha_entrada: nuevaReserva.fecha_entrada,
              fecha_salida: nuevaReserva.fecha_salida,
              precio_pactado_noche: nuevaReserva.precio_pactado_noche,
              total_alojamiento: nuevaReserva.total_alojamiento,
              estado: 'confirmada',
              observaciones: nuevaReserva.observaciones,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[DashboardHuesped] Error persistiendo reserva:', err);
    } finally {
      setCargando(false);
    }
  };

  // 2. Realizar Check-in (Pasa de 'confirmada' a 'en_curso')
  const handleCheckIn = async () => {
    if (!reservaActiva) return;
    setCargando(true);
    try {
      const ahora = new Date().toISOString();
      const reservaActualizada: ReservaConDetalle = {
        ...reservaActiva,
        estado: 'en_curso',
        check_in_real: ahora,
      };

      setReservaActiva(reservaActualizada);
      cache.set(CACHE_RESERVA_KEY, reservaActualizada, 60);

      // En Supabase: marcar reserva en curso y habitación como ocupada
      await supabase
        .from('reservas')
        .update({ estado: 'en_curso', check_in_real: ahora })
        .eq('codigo_reserva', reservaActiva.codigo_reserva);

      if (reservaActiva.habitacion_id && !reservaActiva.habitacion_id.startsWith('hab-')) {
        await supabase
          .from('habitaciones')
          .update({ estado: 'ocupada' })
          .eq('id', reservaActiva.habitacion_id);
      }
    } catch (err) {
      console.warn('[DashboardHuesped] Error en check-in:', err);
    } finally {
      setCargando(false);
    }
  };

  // 3. Agregar Consumo a la Habitación
  const handleAgregarConsumo = async (
    nuevoConsumo: ConsumoReserva & { catalogo_servicios?: CatalogoServicio | null }
  ) => {
    if (!reservaActiva) return;

    const consumosActuales = reservaActiva.consumos || [];
    const reservaActualizada: ReservaConDetalle = {
      ...reservaActiva,
      consumos: [nuevoConsumo, ...consumosActuales],
    };

    setReservaActiva(reservaActualizada);
    cache.set(CACHE_RESERVA_KEY, reservaActualizada, 60);

    // Intentar registrar en Supabase
    try {
      await supabase.from('consumos_reserva').insert({
        reserva_id: reservaActiva.id,
        servicio_id: nuevoConsumo.servicio_id,
        cantidad: nuevoConsumo.cantidad,
        precio_unitario: nuevoConsumo.precio_unitario,
      });
    } catch (err) {
      console.warn('[DashboardHuesped] Error guardando consumo en BD:', err);
    }
  };

  // 4. Realizar Check-out (Finalizar estancia -> Habitación a 'limpieza')
  const handleCheckOut = async () => {
    if (!reservaActiva) return;
    setCargando(true);
    try {
      const ahora = new Date().toISOString();
      const totalConsumos = (reservaActiva.consumos || []).reduce(
        (acc, c) => acc + Number(c.subtotal || 0),
        0
      );
      const totalFinal = Number(reservaActiva.total_alojamiento) + totalConsumos;

      // Guardar datos para el comprobante de salida
      setComprobanteCheckOut({
        codigo: reservaActiva.codigo_reserva,
        habitacion: reservaActiva.habitaciones?.numero || '302',
        total: totalFinal,
      });

      // 1. En Supabase: Marcar reserva como finalizada
      await supabase
        .from('reservas')
        .update({ estado: 'finalizada', check_out_real: ahora })
        .eq('codigo_reserva', reservaActiva.codigo_reserva);

      // 2. LA HABITACIÓN PASA A ESTADO 'limpieza'
      if (reservaActiva.habitacion_id && !reservaActiva.habitacion_id.startsWith('hab-')) {
        await supabase
          .from('habitaciones')
          .update({ estado: 'limpieza' })
          .eq('id', reservaActiva.habitacion_id);

        // 3. Registrar en historial_limpieza
        await supabase.from('historial_limpieza').insert({
          habitacion_id: reservaActiva.habitacion_id,
          fecha_inicio: ahora,
          observaciones: `Check-out de reserva ${reservaActiva.codigo_reserva}. Requiere cambio de blancos y desinfección.`,
        });
      }

      // 4. Limpiar reserva activa local
      setReservaActiva(null);
      cache.remove(CACHE_RESERVA_KEY);
    } catch (err) {
      console.warn('[DashboardHuesped] Error en check-out:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-amber-500 selection:text-white">
      {/* Fondo con textura sutil y sombras de lujo */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-1/4 w-[36rem] h-[36rem] bg-amber-500 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 left-10 w-[30rem] h-[30rem] bg-indigo-700 rounded-full blur-[160px]" />
      </div>

      {/* Barra de Navegación del Huésped */}
      <HuespedNavbar
        reservaActiva={reservaActiva}
        onVerPerfil={() => setMostrarModalPerfil(true)}
        onIrAPanelAdmin={onIrAPanelAdmin}
      />

      {/* Contenido Principal con las 3 Condiciones de Negocio */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {!reservaActiva ? (
          /* Condición 1: No tiene reserva -> Solo le sale hacer reserva */
          <SinReservaView
            onCrearReserva={handleCrearReserva}
            cargando={cargando}
          />
        ) : reservaActiva.estado === 'confirmada' ? (
          /* Condición 2: Tiene reserva confirmada -> Detalle de reserva y check-in */
          <ReservaConfirmadaView
            reserva={reservaActiva}
            onHacerCheckIn={handleCheckIn}
            cargando={cargando}
          />
        ) : (
          /* Condición 3: Está en el hotel (estado 'en_curso') -> Servicios, comidas, folio y check-out */
          <EnHotelView
            reserva={reservaActiva}
            onAgregarConsumo={handleAgregarConsumo}
            onRealizarCheckOut={handleCheckOut}
            cargando={cargando}
          />
        )}
      </main>

      {/* Modal de Comprobante / Despedida tras Check-out */}
      {comprobanteCheckOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                Gran Hotel Illimani
              </span>
              <h3 className="text-2xl font-serif font-black text-white">
                ¡Gracias por tu Estancia!
              </h3>
              <p className="text-xs text-slate-400">
                Tu Check-out de la Habitación {comprobanteCheckOut.habitacion} ha sido completado con éxito.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2 text-left">
              <div className="flex justify-between text-slate-400">
                <span>Código de Reserva:</span>
                <span className="font-mono text-white font-bold">{comprobanteCheckOut.codigo}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estado de Habitación:</span>
                <span className="text-amber-400 font-semibold">En Limpieza (Housekeeping)</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                <span className="text-slate-300">Total Liquidado:</span>
                <span className="text-white text-base">Bs. {comprobanteCheckOut.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setComprobanteCheckOut(null)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Volver al Portal
            </button>
          </div>
        </div>
      )}

      {/* Modal de Ficha y Perfil del Huésped */}
      {mostrarModalPerfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-lg w-full">
            <button
              onClick={() => setMostrarModalPerfil(false)}
              className="absolute -top-3 -right-3 z-10 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg border border-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <PerfilUsuario />
          </div>
        </div>
      )}

      {/* Pie de Página */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        Gran Hotel Illimani ★★★★★ • La Paz, Bolivia • Sistema de Administración y Gestión Empresarial
      </footer>
    </div>
  );
};
