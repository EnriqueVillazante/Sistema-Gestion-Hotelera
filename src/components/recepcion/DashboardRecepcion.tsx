import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { LogoHotel } from '../common/LogoHotel';
import {
  BellRing,
  BedDouble,
  Search,
  UserCheck,
  LogOut,
  UtensilsCrossed,
  RefreshCw,
  ChevronDown,
  Plus,
  DollarSign,
  Receipt,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  X,
  Lock,
  ShieldAlert,
  AlertTriangle,
  Calculator,
  History,
} from 'lucide-react';
import type {
  Habitacion,
  CatalogoServicio,
  MetodoPago,
} from '../../types/database';

export type PestanaRecepcion = 'frontdesk' | 'rack' | 'consumos' | 'caja';

interface DashboardRecepcionProps {
  onIrAVista?: (vista: 'admin' | 'limpieza' | 'huesped') => void;
}

// Función auxiliar segura para calcular consumos sin errores de tipo
const calcularTotalConsumos = (consumos: any): number => {
  if (!consumos || !Array.isArray(consumos)) return 0;
  return consumos.reduce((total: number, c: any) => total + (Number(c?.subtotal) || 0), 0);
};

export const DashboardRecepcion: React.FC<DashboardRecepcionProps> = ({ onIrAVista }) => {
  const { user, perfil, turnoActivo, logout, refrescarTurno } = useAuth();
  const [pestana, setPestana] = useState<PestanaRecepcion>('frontdesk');
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [servicios, setServicios] = useState<CatalogoServicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal de apertura de caja
  const [modalCajaAbierto, setModalCajaAbierto] = useState(false);
  const [montoApertura, setMontoApertura] = useState<number>(300);
  const [guardandoCaja, setGuardandoCaja] = useState(false);

  // Estados de control de turno global y arqueo de caja
  const [verificandoCaja, setVerificandoCaja] = useState(true);
  const [turnoAbiertoGlobal, setTurnoAbiertoGlobal] = useState<any | null>(null);
  const [modalCierreCaja, setModalCierreCaja] = useState(false);
  const [montoDeclaradoCierre, setMontoDeclaradoCierre] = useState<number>(0);
  const [observacionesCierre, setObservacionesCierre] = useState<string>('');
  const [cerrandoTurnoId, setCerrandoTurnoId] = useState<string | null>(null);
  const [pagosDelTurno, setPagosDelTurno] = useState<any[]>([]);

  // Modal de cargo de consumo
  const [modalConsumoAbierto, setModalConsumoAbierto] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<string>('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string>('');
  const [cantidadConsumo, setCantidadConsumo] = useState<number>(1);
  const [guardandoConsumo, setGuardandoConsumo] = useState(false);

  // Modal de Check-out con cobro (QR, Efectivo, Tarjeta)
  const [modalCheckOut, setModalCheckOut] = useState<{
    reserva: any;
    metodoPago: MetodoPago;
    procesando: boolean;
  } | null>(null);

  // Modal de Nueva Reserva en Mostrador (Walk-in)
  const [modalNuevaReserva, setModalNuevaReserva] = useState(false);
  const [walkinNombres, setWalkinNombres] = useState('');
  const [walkinApellidos, setWalkinApellidos] = useState('');
  const [walkinDocumento, setWalkinDocumento] = useState('');
  const [walkinTipoDoc, setWalkinTipoDoc] = useState('CI');
  const [walkinTelefono, setWalkinTelefono] = useState('');
  const [walkinHabitacionId, setWalkinHabitacionId] = useState('');
  const [walkinNoches, setWalkinNoches] = useState(1);
  const [walkinMetodoPago, setWalkinMetodoPago] = useState<MetodoPago>('qr');
  const [guardandoWalkin, setGuardandoWalkin] = useState(false);

  // Comprobante de pago exitoso
  const [comprobantePago, setComprobantePago] = useState<{
    codigo: string;
    habitacion: string;
    huesped: string;
    total: number;
    metodo: string;
    transaccion: string;
  } | null>(null);

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

  // Cargar pagos registrados en un turno específico para el arqueo
  const cargarPagosTurno = async (turnoId: string) => {
    try {
      const { data } = await supabase
        .from('pagos')
        .select('*, reservas(codigo_reserva, habitaciones(numero), huespedes(nombres, apellidos))')
        .eq('turno_caja_id', turnoId)
        .order('fecha_pago', { ascending: false });

      if (data) {
        setPagosDelTurno(data);
      }
    } catch (e) {
      console.warn('[DashboardRecepcion] Error al cargar pagos del turno:', e);
    }
  };

  // Verificar si hay algún turno de caja abierto en todo el hotel
  const verificarTurnoGlobal = async () => {
    setVerificandoCaja(true);
    try {
      const { data, error } = await supabase
        .from('turnos_caja')
        .select('*, perfiles:recepcionista_id(nombre_completo, rol, email)')
        .is('fecha_cierre', null)
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setTurnoAbiertoGlobal(data);
        if (data.recepcionista_id === user?.id) {
          await refrescarTurno();
          await cargarPagosTurno(data.id);
        } else {
          // Si es de otro recepcionista, cargar también sus pagos para el reporte de relevo
          await cargarPagosTurno(data.id);
        }
      } else {
        setTurnoAbiertoGlobal(null);
        setPagosDelTurno([]);
      }
    } catch (err) {
      console.warn('[DashboardRecepcion] Error al verificar turno global:', err);
    } finally {
      setVerificandoCaja(false);
    }
  };

  // Cargar datos operativos
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [habRes, resRes, servRes] = await Promise.all([
        supabase.from('habitaciones').select('*, tipos_habitacion(*)').order('numero', { ascending: true }),
        supabase
          .from('reservas')
          .select('*, habitaciones(*, tipos_habitacion(*)), huespedes(*), consumos_reserva(*, catalogo_servicios(*))')
          .order('creado_en', { ascending: false }),
        supabase.from('catalogo_servicios').select('*').eq('activo', true),
        verificarTurnoGlobal(),
      ]);

      if (habRes.error) console.error('[DashboardRecepcion] Error al cargar habitaciones:', habRes.error);
      if (resRes.error) console.error('[DashboardRecepcion] Error al cargar reservas:', resRes.error);
      if (servRes.error) console.error('[DashboardRecepcion] Error al cargar catálogo de servicios:', servRes.error);

      if (habRes.data) setHabitaciones(habRes.data);
      if (resRes.data) setReservas(resRes.data);
      if (servRes.data) setServicios(servRes.data);
    } catch (err) {
      console.warn('[DashboardRecepcion] Error cargando datos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Operación: Check-in de Huésped
  const realizarCheckIn = async (reservaId: string, habitacionId: string) => {
    if (!cajaPropiaAbierta) {
      alert('Debes tener tu turno de caja abierto para realizar check-in y atender en Front Desk.');
      setPestana('caja');
      return;
    }
    const ahora = new Date().toISOString();
    try {
      await supabase
        .from('reservas')
        .update({
          estado: 'en_curso',
          check_in_real: ahora,
          recepcionista_id: user?.id || null,
        })
        .eq('id', reservaId);

      if (habitacionId) {
        await supabase
          .from('habitaciones')
          .update({ estado: 'ocupada' })
          .eq('id', habitacionId);
      }

      await cargarDatos();
    } catch (err) {
      console.error('[DashboardRecepcion] Error en check-in:', err);
    }
  };

  // Abrir modal de cobro y check-out
  const abrirCobroCheckOut = (reserva: any) => {
    if (!cajaPropiaAbierta) {
      alert('Debes tener tu turno de caja abierto para procesar cobros y check-outs.');
      setPestana('caja');
      return;
    }
    setModalCheckOut({
      reserva,
      metodoPago: 'qr',
      procesando: false,
    });
  };

  // Confirmar cobro y Check-out
  const confirmarCheckOutConPago = async () => {
    if (!modalCheckOut) return;
    const { reserva, metodoPago } = modalCheckOut;
    const ahora = new Date().toISOString();
    const habitacionId = reserva.habitacion_id;
    const codigo = reserva.codigo_reserva;

    // Calcular total pendiente (alojamiento + consumos)
    const consumosTotal = calcularTotalConsumos(reserva.consumos_reserva);
    const granTotal = Number(reserva.total_alojamiento) + consumosTotal;
    const transaccion = `TRX-${Date.now().toString().slice(-6)}`;

    setModalCheckOut((prev) => (prev ? { ...prev, procesando: true } : null));

    try {
      // 1. Registrar pago en la tabla 'pagos'
      await supabase.from('pagos').insert({
        reserva_id: reserva.id,
        turno_caja_id: turnoActivo?.id || null,
        monto: granTotal,
        metodo: metodoPago,
        tipo: 'pago_final',
        comprobante_ref: transaccion,
      });

      // 2. Actualizar reserva a finalizada
      await supabase
        .from('reservas')
        .update({
          estado: 'finalizada',
          check_out_real: ahora,
        })
        .eq('id', reserva.id);

      // 3. La habitación pasa de inmediato a 'limpieza'
      if (habitacionId) {
        await supabase
          .from('habitaciones')
          .update({ estado: 'limpieza' })
          .eq('id', habitacionId);

        // 4. Registrar en historial_limpieza
        await supabase.from('historial_limpieza').insert({
          habitacion_id: habitacionId,
          fecha_inicio: ahora,
          observaciones: `Check-out Front Desk (${codigo}). Liquidado por ${metodoPago.toUpperCase()} (Ref: ${transaccion}). Lista para desinfección.`,
        });
      }

      setComprobantePago({
        codigo,
        habitacion: reserva.habitaciones?.numero || 'N/A',
        huesped: `${reserva.huespedes?.nombres} ${reserva.huespedes?.apellidos}`,
        total: granTotal,
        metodo: metodoPago.toUpperCase(),
        transaccion,
      });

      setModalCheckOut(null);
      await cargarDatos();
    } catch (err) {
      console.error('[DashboardRecepcion] Error en check-out con pago:', err);
    }
  };

  // Crear nueva reserva en mostrador (Walk-in)
  const handleGuardarWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajaPropiaAbierta) {
      alert('Debes tener tu turno de caja abierto para registrar reservas en mostrador (walk-in).');
      return;
    }
    if (!walkinNombres.trim() || !walkinDocumento.trim() || !walkinHabitacionId) return;

    setGuardandoWalkin(true);
    const ahora = new Date().toISOString();
    const salida = new Date();
    salida.setDate(salida.getDate() + walkinNoches);

    try {
      // 1. Obtener la habitación seleccionada y su tarifa
      const hab = habitaciones.find((h) => h.id === walkinHabitacionId);
      const precioNoche = Number((hab as any)?.tipos_habitacion?.precio_base_noche || 480);
      const total = precioNoche * walkinNoches;
      const codigoReserva = `WALK-${Math.floor(1000 + Math.random() * 9000)}`;
      const trx = `TRX-QR-${Date.now().toString().slice(-6)}`;

      // 2. Buscar si el huésped ya existe o crearlo en Supabase
      let huespedId: string;
      const { data: hExistente } = await supabase
        .from('huespedes')
        .select('id')
        .eq('documento_identidad', walkinDocumento.trim())
        .maybeSingle();

      if (hExistente) {
        huespedId = hExistente.id;
      } else {
        const { data: hData, error: hError } = await supabase
          .from('huespedes')
          .insert({
            nombres: walkinNombres.trim(),
            apellidos: walkinApellidos.trim(),
            tipo_documento: walkinTipoDoc,
            documento_identidad: walkinDocumento.trim(),
            telefono: walkinTelefono.trim() || null,
          })
          .select('id')
          .single();

        if (hError || !hData) {
          throw new Error(hError?.message || 'Error registrando huésped');
        }
        huespedId = hData.id;
      }

      // 3. Crear reserva en la tabla 'reservas'
      const { data: resData, error: resError } = await supabase
        .from('reservas')
        .insert({
          codigo_reserva: codigoReserva,
          huesped_id: huespedId,
          habitacion_id: walkinHabitacionId,
          recepcionista_id: user?.id || null,
          fecha_entrada: ahora.split('T')[0],
          fecha_salida: salida.toISOString().split('T')[0],
          check_in_real: ahora,
          precio_pactado_noche: precioNoche,
          total_alojamiento: total,
          estado: 'en_curso', // Entra de inmediato
          observaciones: 'Reserva directa en Front Desk (Walk-in).',
        })
        .select('id')
        .single();

      if (resError || !resData) {
        throw new Error(resError?.message || 'Error al crear la reserva');
      }

      // 4. Registrar pago
      if (resData) {
        await supabase.from('pagos').insert({
          reserva_id: resData.id,
          turno_caja_id: turnoActivo?.id || null,
          monto: total,
          metodo: walkinMetodoPago,
          tipo: 'anticipo',
          comprobante_ref: trx,
        });
      }

      // 5. La habitación pasa a ocupada
      await supabase
        .from('habitaciones')
        .update({ estado: 'ocupada' })
        .eq('id', walkinHabitacionId);

      setComprobantePago({
        codigo: codigoReserva,
        habitacion: hab?.numero || 'N/A',
        huesped: `${walkinNombres} ${walkinApellidos}`,
        total,
        metodo: walkinMetodoPago.toUpperCase(),
        transaccion: trx,
      });

      // Limpiar formulario
      setWalkinNombres('');
      setWalkinApellidos('');
      setWalkinDocumento('');
      setWalkinTelefono('');
      setWalkinHabitacionId('');
      setWalkinNoches(1);
      setModalNuevaReserva(false);
      await cargarDatos();
    } catch (err) {
      console.error('[DashboardRecepcion] Error guardando walk-in:', err);
    } finally {
      setGuardandoWalkin(false);
    }
  };

  // Evaluación del estado del turno en el hotel
  const cajaPropiaAbierta =
    Boolean(turnoActivo) || (Boolean(turnoAbiertoGlobal) && turnoAbiertoGlobal?.recepcionista_id === user?.id);

  const hayCajaAnteriorSinCerrar =
    Boolean(turnoAbiertoGlobal) && turnoAbiertoGlobal?.recepcionista_id !== user?.id;

  // Abrir turno de caja con validación estricta de turno previo
  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // VALIDACIÓN ESTRICTA: No permitir abrir si hay un turno previo sin cerrar en el hotel
    const { data: turnoPrevio } = await supabase
      .from('turnos_caja')
      .select('id, recepcionista_id, perfiles:recepcionista_id(nombre_completo)')
      .is('fecha_cierre', null)
      .limit(1)
      .maybeSingle();

    if (turnoPrevio && turnoPrevio.recepcionista_id !== user.id) {
      alert(
        `Acción Bloqueada: El turno anterior de ${
          (turnoPrevio as any)?.perfiles?.nombre_completo || 'otro recepcionista'
        } aún no ha sido cerrado. Por control contable, debe cerrarse la caja anterior antes de iniciar una nueva.`
      );
      setModalCajaAbierto(false);
      await verificarTurnoGlobal();
      return;
    }

    setGuardandoCaja(true);
    try {
      const { data, error } = await supabase
        .from('turnos_caja')
        .insert({
          recepcionista_id: user.id,
          monto_inicial: Number(montoApertura) || 0,
          fecha_apertura: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      await refrescarTurno();
      await verificarTurnoGlobal();
      if (data) {
        await cargarPagosTurno(data.id);
      }
      setModalCajaAbierto(false);
      setPestana('frontdesk');
    } catch (err: any) {
      console.error('[DashboardRecepcion] Error al abrir caja:', err);
      alert('Error al abrir turno de caja: ' + (err.message || 'Error de conexión'));
    } finally {
      setGuardandoCaja(false);
    }
  };

  // Abrir modal de cierre de caja con arqueo
  const abrirModalCierre = (turnoId: string, montoEsperado: number) => {
    setCerrandoTurnoId(turnoId);
    setMontoDeclaradoCierre(montoEsperado);
    setObservacionesCierre('');
    setModalCierreCaja(true);
  };

  // Confirmar cierre de turno y registrar arqueo
  const handleConfirmarCierreCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    const idParaCerrar = cerrandoTurnoId || turnoActivo?.id || turnoAbiertoGlobal?.id;
    if (!idParaCerrar) return;

    setGuardandoCaja(true);
    try {
      const ahora = new Date().toISOString();
      const { error } = await supabase
        .from('turnos_caja')
        .update({
          fecha_cierre: ahora,
          monto_final_declarado: Number(montoDeclaradoCierre) || 0,
          observaciones: observacionesCierre.trim() || 'Cierre de turno completado.',
        })
        .eq('id', idParaCerrar);

      if (error) throw error;

      await refrescarTurno();
      await verificarTurnoGlobal();
      setModalCierreCaja(false);
      setCerrandoTurnoId(null);
      setPestana('caja');
    } catch (err: any) {
      console.error('[DashboardRecepcion] Error al cerrar caja:', err);
      alert('Error al cerrar caja: ' + (err.message || 'Error de conexión'));
    } finally {
      setGuardandoCaja(false);
    }
  };

  // Filtrado de reservas
  const reservasFiltradas = reservas.filter((r) => {
    const texto = busqueda.toLowerCase();
    const codigoMatch = r.codigo_reserva?.toLowerCase().includes(texto);
    const habMatch = r.habitaciones?.numero?.includes(texto);
    const huespedMatch =
      r.huespedes?.nombres?.toLowerCase().includes(texto) ||
      r.huespedes?.apellidos?.toLowerCase().includes(texto);
    return codigoMatch || habMatch || huespedMatch;
  });

  const nombreRecepcionista = perfil?.nombre_completo || 'Recepcionista en Turno';
  const habitacionesDisponibles = habitaciones.filter((h) => h.estado === 'disponible');

  // Cálculos financieros del turno activo para arqueo
  const turnoReferencia = turnoActivo || turnoAbiertoGlobal;
  const fondoInicial = Number(turnoReferencia?.monto_inicial || 0);

  const pagosEfectivo = pagosDelTurno
    .filter((p) => p.metodo === 'efectivo')
    .reduce((sum, p) => sum + Number(p.monto || 0), 0);

  const pagosQR = pagosDelTurno
    .filter((p) => p.metodo === 'qr')
    .reduce((sum, p) => sum + Number(p.monto || 0), 0);

  const pagosTarjeta = pagosDelTurno
    .filter((p) => p.metodo === 'tarjeta')
    .reduce((sum, p) => sum + Number(p.monto || 0), 0);

  const totalVentasTurno = pagosEfectivo + pagosQR + pagosTarjeta;
  const totalEfectivoEsperado = fondoInicial + pagosEfectivo;
  const diferenciaArqueo = Number(montoDeclaradoCierre) - totalEfectivoEsperado;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* ==================================================================== */}
      {/* NAVBAR SUPERIOR DE RECEPCIÓN */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-blue-900/40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo y Módulo Front Desk */}
            <div className="flex items-center gap-4">
              <LogoHotel tamano="sm" mostrarSubtitulo={false} />
              <div className="hidden sm:block h-8 w-[1px] bg-slate-800" />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs uppercase tracking-widest text-blue-400 font-bold flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5" />
                  Front Desk & Recepción 24h
                </span>
                <span className="text-[11px] text-slate-400">
                  Gran Hotel Illimani ★★★★★
                </span>
              </div>
            </div>

            {/* Acciones y Perfil */}
            <div className="flex items-center gap-3">
              {/* Indicador de Estado de Caja */}
              <div className="hidden sm:flex items-center">
                {verificandoCaja ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Verificando caja...
                  </span>
                ) : cajaPropiaAbierta ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Caja Abierta · Bs. {fondoInicial.toFixed(2)}
                  </span>
                ) : hayCajaAnteriorSinCerrar ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Caja Anterior Sin Cerrar
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Caja Cerrada (Apertura Requerida)
                  </span>
                )}
              </div>

              {/* Selector de vistas para admin / pruebas */}
              {onIrAVista && (
                <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
                  <button
                    onClick={() => onIrAVista('admin')}
                    className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  >
                    👑 Admin
                  </button>
                  <button
                    onClick={() => onIrAVista('limpieza')}
                    className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  >
                    🧹 Limpieza
                  </button>
                  <button
                    onClick={() => onIrAVista('huesped')}
                    className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  >
                    🏨 Huésped
                  </button>
                </div>
              )}

              {/* Botón de Nueva Reserva Mostrador */}
              <button
                onClick={() => {
                  if (!cajaPropiaAbierta) {
                    alert('Debes tener tu turno de caja abierto para registrar reservas en mostrador (walk-in).');
                    setPestana('caja');
                    return;
                  }
                  setModalNuevaReserva(true);
                }}
                disabled={!cajaPropiaAbierta}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                  cajaPropiaAbierta
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60'
                }`}
                title={cajaPropiaAbierta ? 'Registrar nueva reserva en mostrador' : 'Abre tu turno de caja para habilitar reservas'}
              >
                {cajaPropiaAbierta ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-500/80" />}
                <span>+ Nueva Reserva Mostrador</span>
              </button>

              {/* Menú de Usuario Recepción */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {nombreRecepcionista.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      {nombreRecepcionista}
                    </span>
                    <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
                      Recepción & Caja
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${menuPerfilAbierto ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {/* Desplegable */}
                {menuPerfilAbierto && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 border-b border-slate-800 mb-1">
                      <div className="text-xs font-bold text-white">{nombreRecepcionista}</div>
                      <div className="text-[11px] text-slate-400">{user?.email}</div>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        🛎️ Front Desk Oficial
                      </span>
                    </div>

                    {onIrAVista && (
                      <div className="p-1 border-b border-slate-800 lg:hidden">
                        <div className="text-[10px] text-slate-400 px-2 py-1 font-semibold uppercase">
                          Cambiar Vista
                        </div>
                        <button
                          onClick={() => {
                            setMenuPerfilAbierto(false);
                            onIrAVista('admin');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                        >
                          👑 Panel Admin
                        </button>
                        <button
                          onClick={() => {
                            setMenuPerfilAbierto(false);
                            onIrAVista('limpieza');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                        >
                          🧹 Housekeeping
                        </button>
                        <button
                          onClick={() => {
                            setMenuPerfilAbierto(false);
                            onIrAVista('huesped');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
                        >
                          🏨 Vista Huésped
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

          {/* Navegación por pestañas */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 border-t border-slate-800/80 -mb-[1px]">
            <button
              onClick={() => {
                if (!cajaPropiaAbierta) {
                  setPestana('caja');
                  return;
                }
                setPestana('frontdesk');
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                !cajaPropiaAbierta
                  ? 'text-slate-600 bg-slate-900/40 border border-slate-800/40 cursor-not-allowed opacity-60'
                  : pestana === 'frontdesk'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25 cursor-pointer'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer'
              }`}
              title={!cajaPropiaAbierta ? 'Opción bloqueada: Abre tu turno de caja' : undefined}
            >
              {!cajaPropiaAbierta ? <Lock className="w-3.5 h-3.5 text-amber-500/70" /> : <UserCheck className="w-4 h-4" />}
              <span>Check-in & Check-out</span>
              {!cajaPropiaAbierta && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                  Bloqueado
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (!cajaPropiaAbierta) {
                  setPestana('caja');
                  return;
                }
                setPestana('rack');
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                !cajaPropiaAbierta
                  ? 'text-slate-600 bg-slate-900/40 border border-slate-800/40 cursor-not-allowed opacity-60'
                  : pestana === 'rack'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25 cursor-pointer'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer'
              }`}
              title={!cajaPropiaAbierta ? 'Opción bloqueada: Abre tu turno de caja' : undefined}
            >
              {!cajaPropiaAbierta ? <Lock className="w-3.5 h-3.5 text-amber-500/70" /> : <BedDouble className="w-4 h-4" />}
              <span>Rack de Habitaciones</span>
              {!cajaPropiaAbierta && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                  Bloqueado
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (!cajaPropiaAbierta) {
                  setPestana('caja');
                  return;
                }
                setPestana('consumos');
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                !cajaPropiaAbierta
                  ? 'text-slate-600 bg-slate-900/40 border border-slate-800/40 cursor-not-allowed opacity-60'
                  : pestana === 'consumos'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25 cursor-pointer'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer'
              }`}
              title={!cajaPropiaAbierta ? 'Opción bloqueada: Abre tu turno de caja' : undefined}
            >
              {!cajaPropiaAbierta ? <Lock className="w-3.5 h-3.5 text-amber-500/70" /> : <UtensilsCrossed className="w-4 h-4" />}
              <span>Cargar Consumo</span>
              {!cajaPropiaAbierta && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                  Bloqueado
                </span>
              )}
            </button>

            <button
              onClick={() => setPestana('caja')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                pestana === 'caja'
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25'
                  : !cajaPropiaAbierta
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold hover:bg-amber-500/25 animate-pulse'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Turno de Caja</span>
              {cajaPropiaAbierta ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Caja Abierta"></span>
              ) : hayCajaAnteriorSinCerrar ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  Anterior sin cerrar
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  Apertura Requerida
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* CUERPO PRINCIPAL */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* PANTALLA DE BLOQUEO CUANDO LA CAJA NO HA SIDO ABIERTA */}
        {!cajaPropiaAbierta ? (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200 py-6">
            {hayCajaAnteriorSinCerrar ? (
              /* CASO 1: HAY UN TURNO PREVIO ABIERTO POR OTRO OPERADOR QUE NO FUE CERRADO */
              <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border-2 border-rose-500/50 shadow-2xl space-y-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/10">
                  <ShieldAlert className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Operación Bloqueada por Auditoría
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-black text-white">
                    Turno Anterior Aún en Proceso
                  </h3>
                  <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                    No es posible operar el Front Desk ni abrir un nuevo turno de caja porque el turno previo aún no ha sido cerrado. Por control contable y arqueo de efectivo, debe cerrarse la caja anterior antes de iniciar una nueva.
                  </p>
                </div>

                {/* Ficha de la caja previa que falta cerrar */}
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 text-left max-w-lg mx-auto space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
                    <span>Detalles del Turno Pendiente de Cierre:</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Recepcionista a Cargo:</span>
                      <span className="font-bold text-white text-sm">
                        {turnoAbiertoGlobal?.perfiles?.nombre_completo || 'Recepcionista Anterior'}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {turnoAbiertoGlobal?.perfiles?.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fondo Inicial Registrado:</span>
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        Bs. {Number(turnoAbiertoGlobal?.monto_inicial || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-800">
                      <span className="text-slate-500 block">Fecha y Hora de Apertura:</span>
                      <span className="font-medium text-slate-200">
                        {new Date(turnoAbiertoGlobal?.fecha_apertura).toLocaleString('es-BO')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={verificarTurnoGlobal}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Verificar si ya la cerraron</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirModalCierre(turnoAbiertoGlobal.id, Number(turnoAbiertoGlobal.monto_inicial || 0))}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Cerrar Caja Anterior (Cierre de Relevo)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* CASO 2: NO HAY TURNOS ABIERTOS EN EL HOTEL -> DEBE ABRIR CAJA */
              <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl space-y-6 text-center">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
                  <DollarSign className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Paso 1 Obligatorio
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-black text-white">
                    Apertura de Turno de Caja Requerida
                  </h3>
                  <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                    Las opciones del Front Desk (check-in, check-out, rack de habitaciones y consumos) están bloqueadas. Para comenzar tu jornada debes abrir tu turno de caja declarando el fondo de dinero inicial para cambio.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left max-w-md mx-auto space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Caja anterior debidamente cerrada</span>
                  </div>
                  <div className="text-slate-400">
                    Estás a punto de abrir un nuevo turno de caja a nombre de{' '}
                    <strong className="text-white">{nombreRecepcionista}</strong>.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalCajaAbierto(true)}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span>Abrir Mi Turno de Caja Ahora</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* VISTAS OPERATIVAS HABILITADAS */
          <>
            {/* PESTAÑA: FRONT DESK */}
            {pestana === 'frontdesk' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Buscador y Acción */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar reserva por código (ej. RES-), habitación o nombre..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <button
                onClick={cargarDatos}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            {/* Tabla de Reservas Operativas */}
            <div className="overflow-hidden rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6 font-semibold">Reserva / Huésped</th>
                      <th className="py-3.5 px-4 font-semibold">Habitación</th>
                      <th className="py-3.5 px-4 font-semibold">Fechas</th>
                      <th className="py-3.5 px-4 font-semibold">Total a Liquidar</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                      <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Operación Front Desk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {cargando ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
                          Cargando reservas operativas...
                        </td>
                      </tr>
                    ) : reservasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No se encontraron reservas con el filtro especificado.
                        </td>
                      </tr>
                    ) : (
                      reservasFiltradas.map((r) => {
                        const esConfirmada = r.estado === 'confirmada';
                        const esEnCurso = r.estado === 'en_curso';
                        const esFinalizada = r.estado === 'finalizada';

                        const consumosTotal = calcularTotalConsumos(r.consumos_reserva);
                        const granTotal = Number(r.total_alojamiento) + consumosTotal;

                        return (
                          <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                            {/* Huésped y Código */}
                            <td className="py-4 px-4 sm:px-6">
                              <div className="font-mono font-bold text-amber-400 text-xs">
                                {r.codigo_reserva}
                              </div>
                              <div className="font-semibold text-white mt-0.5">
                                {r.huespedes?.nombres} {r.huespedes?.apellidos}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Doc: {r.huespedes?.tipo_documento} {r.huespedes?.documento_identidad}
                              </div>
                            </td>

                            {/* Habitación */}
                            <td className="py-4 px-4">
                              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 font-mono font-bold text-xs">
                                Hab. {r.habitaciones?.numero || 'N/A'}
                              </span>
                            </td>

                            {/* Fechas */}
                            <td className="py-4 px-4 text-xs text-slate-300">
                              <div>Entrada: {new Date(r.fecha_entrada).toLocaleDateString('es-BO')}</div>
                              <div className="text-slate-400">Salida: {new Date(r.fecha_salida).toLocaleDateString('es-BO')}</div>
                            </td>

                            {/* Total con consumos */}
                            <td className="py-4 px-4 font-mono font-bold text-white text-xs">
                              <div>Bs. {granTotal.toFixed(2)}</div>
                              {consumosTotal > 0 && (
                                <div className="text-[10px] text-amber-400 font-normal">
                                  (incl. Bs. {consumosTotal.toFixed(2)} en consumos)
                                </div>
                              )}
                            </td>

                            {/* Estado Badge */}
                            <td className="py-4 px-4 text-center">
                              {esConfirmada && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  Por Llegar
                                </span>
                              )}
                              {esEnCurso && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30 animate-pulse">
                                  Hospedado
                                </span>
                              )}
                              {esFinalizada && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300 border border-slate-600">
                                  Check-out Realizado
                                </span>
                              )}
                            </td>

                            {/* Botón de Acción Front Desk */}
                            <td className="py-4 px-4 sm:px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {esConfirmada && (
                                  <button
                                    onClick={() => realizarCheckIn(r.id, r.habitacion_id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                                    title="Realizar Check-in del huésped y entregar llave de habitación"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Entregar Habitación</span>
                                  </button>
                                )}

                                {esEnCurso && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReservaSeleccionada(r.id);
                                        setModalConsumoAbierto(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-amber-500/30 transition-all cursor-pointer"
                                      title="Cargar consumos de restaurante, minibar o servicios a esta habitación"
                                    >
                                      <UtensilsCrossed className="w-3.5 h-3.5" />
                                      <span>+ Consumo</span>
                                    </button>

                                    <button
                                      onClick={() => abrirCobroCheckOut(r)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                                      title="Procesar Check-out y cobro final de estancia"
                                    >
                                      <Receipt className="w-3.5 h-3.5" />
                                      <span>Check-out & Cobro</span>
                                    </button>
                                  </>
                                )}

                                {esFinalizada && (
                                  <span className="text-xs text-slate-500 italic">
                                    Liquidada
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: RACK DE HABITACIONES */}
        {pestana === 'rack' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-white">Rack de Habitaciones en Vivo</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualiza el estado de cada habitación, quién está hospedado y gestiona consumos o salidas directas.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Disponibles ({habitaciones.filter((h) => h.estado === 'disponible').length})
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Ocupadas ({habitaciones.filter((h) => h.estado === 'ocupada').length})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {habitaciones.map((h) => {
                const conf = {
                  disponible: { bg: 'bg-emerald-950/20 border-emerald-500/40', text: 'text-emerald-400', label: 'Disponible' },
                  ocupada: { bg: 'bg-rose-950/20 border-rose-500/40', text: 'text-rose-400', label: 'Ocupada' },
                  limpieza: { bg: 'bg-amber-950/20 border-amber-500/40', text: 'text-amber-400', label: 'Limpieza' },
                  mantenimiento: { bg: 'bg-slate-900 border-slate-700', text: 'text-slate-400', label: 'Mantenimiento' },
                }[h.estado];

                const resOcupada = reservas.find(
                  (r) => r.habitacion_id === h.id && (r.estado === 'en_curso' || r.estado === 'confirmada')
                );

                return (
                  <div key={h.id} className={`p-3.5 rounded-2xl border ${conf.bg} flex flex-col justify-between space-y-2`}>
                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                        <span>Piso {h.piso}</span>
                        <span className={conf.text}>{conf.label}</span>
                      </div>
                      <div className="text-xl font-mono font-black text-white mt-1">
                        Hab. {h.numero}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {h.caracteristicas?.[0] || 'Vista Illimani'}
                      </div>
                    </div>

                    {resOcupada ? (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <div
                          className="text-[11px] text-white font-semibold truncate"
                          title={`${resOcupada.huespedes?.nombres} ${resOcupada.huespedes?.apellidos}`}
                        >
                          👤 {resOcupada.huespedes?.nombres} {resOcupada.huespedes?.apellidos}
                        </div>
                        {resOcupada.estado === 'en_curso' && (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setReservaSeleccionada(resOcupada.id);
                                setModalConsumoAbierto(true);
                              }}
                              className="flex-1 py-1 px-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] border border-amber-500/30 transition-all cursor-pointer text-center"
                              title="Cargar consumo de restaurante, bar o servicios"
                            >
                              + Consumo
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirCobroCheckOut(resOcupada)}
                              className="py-1 px-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 font-bold text-[10px] border border-blue-500/40 transition-all cursor-pointer"
                              title="Check-out & Cobro"
                            >
                              Salida
                            </button>
                          </div>
                        )}
                        {resOcupada.estado === 'confirmada' && (
                          <button
                            type="button"
                            onClick={() => realizarCheckIn(resOcupada.id, resOcupada.habitacion_id)}
                            className="w-full py-1 px-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold text-[10px] border border-emerald-500/40 transition-all cursor-pointer text-center"
                            title="Entregar llave y hacer check-in"
                          >
                            Check-in
                          </button>
                        )}
                      </div>
                    ) : h.estado === 'disponible' ? (
                      <div className="pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            if (!cajaPropiaAbierta) {
                              alert('Debes tener tu turno de caja abierto para registrar reservas.');
                              setPestana('caja');
                              return;
                            }
                            setWalkinHabitacionId(h.id);
                            setModalNuevaReserva(true);
                          }}
                          className="w-full py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[10px] transition-all cursor-pointer text-center border border-slate-700"
                        >
                          + Ocupar (Walk-in)
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA: CARGAR CONSUMOS */}
        {pestana === 'consumos' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-bold text-white">Cargar Consumo a Habitación</h3>
              <button
                onClick={() => setModalConsumoAbierto(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cargar a Habitación</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicios.map((s) => (
                <div key={s.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">{s.categoria}</span>
                    <h4 className="font-semibold text-white text-sm mt-0.5">{s.nombre}</h4>
                    <span className="text-xs font-mono font-bold text-amber-400 mt-1 block">
                      Bs. {Number(s.precio_unitario).toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setServicioSeleccionado(s.id);
                      setModalConsumoAbierto(true);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: TURNO DE CAJA */}
        {pestana === 'caja' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
            {/* Tarjeta Principal de Turno y Arqueo */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block mb-1">
                    Control de Arqueo y Finanzas Front Desk
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                    Caja Registradora del Turno
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Turno Activo en Curso
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (turnoReferencia) {
                        cargarPagosTurno(turnoReferencia.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Actualizar arqueo y pagos"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid de Métricas de Arqueo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Fondo Inicial</span>
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">
                    Bs. {fondoInicial.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Declarado en apertura
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50">
                  <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
                    <span>Efectivo Cobrado</span>
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    + Bs. {pagosEfectivo.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-emerald-500/80 mt-1">
                    Entradas en metálico
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50">
                  <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
                    <span>Total Efectivo en Gaveta</span>
                    <Calculator className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-mono font-black text-amber-300">
                    Bs. {totalEfectivoEsperado.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-amber-400/80 mt-1">
                    Esperado al arqueo físico
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center justify-between text-xs text-sky-400 mb-1">
                    <span>Cobros Digitales</span>
                    <QrCode className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-sky-300">
                    Bs. {(pagosQR + pagosTarjeta).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    QR: Bs. {pagosQR.toFixed(2)} | Tarjeta: Bs. {pagosTarjeta.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Fila de Datos del Operador y Acción de Cierre */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="text-slate-400">
                    Responsable de caja:{' '}
                    <strong className="text-white">
                      {(turnoReferencia as any)?.perfiles?.nombre_completo || nombreRecepcionista}
                    </strong>
                  </div>
                  <div className="text-slate-400">
                    Apertura de turno:{' '}
                    <span className="text-slate-300">
                      {turnoReferencia?.fecha_apertura
                        ? new Date(turnoReferencia.fecha_apertura).toLocaleString('es-BO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'En curso'}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Ventas brutas del turno (todos los métodos):{' '}
                    <span className="font-mono font-bold text-emerald-400">
                      Bs. {totalVentasTurno.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (turnoReferencia) {
                      abrirModalCierre(turnoReferencia.id, totalEfectivoEsperado);
                    }
                  }}
                  disabled={guardandoCaja}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-xl shadow-rose-900/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Lock className="w-4 h-4" />
                  <span>Realizar Arqueo y Cerrar Turno</span>
                </button>
              </div>

              {/* Registro de Pagos Registrados en este Turno */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    <span>Transacciones y Cobros del Turno</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {pagosDelTurno.length} {pagosDelTurno.length === 1 ? 'pago' : 'pagos'} registrados
                  </span>
                </div>

                {pagosDelTurno.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 text-xs">
                    No hay transacciones registradas durante este turno de caja aún.
                    <br />
                    Los cobros de check-in, check-out y reservas en mostrador se registrarán automáticamente aquí.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Hora</th>
                          <th className="py-3 px-4">Reserva / Huésped</th>
                          <th className="py-3 px-4">Concepto</th>
                          <th className="py-3 px-4">Método</th>
                          <th className="py-3 px-4">Comprobante</th>
                          <th className="py-3 px-4 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {pagosDelTurno.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                              {new Date(p.fecha_pago).toLocaleTimeString('es-BO', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">
                                {p.reservas?.codigo_reserva || 'N/A'}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {p.reservas?.huespedes?.nombres} {p.reservas?.huespedes?.apellidos} (Hab. {p.reservas?.habitaciones?.numero})
                              </div>
                            </td>
                            <td className="py-3 px-4 capitalize text-slate-300">
                              {p.tipo ? p.tipo.replace('_', ' ') : 'Pago'}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  p.metodo === 'efectivo'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : p.metodo === 'qr'
                                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                }`}
                              >
                                {p.metodo}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                              {p.comprobante_ref || '-'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-white">
                              Bs. {Number(p.monto || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </main>

      {/* ==================================================================== */}
      {/* MODAL: CHECK-OUT CON COBRO POR QR / EFECTIVO / TARJETA */}
      {/* ==================================================================== */}
      {modalCheckOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-blue-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block">
                  Liquidación de Salida
                </span>
                <h3 className="text-xl font-serif font-bold text-white">
                  Check-out Habitación {modalCheckOut.reserva.habitaciones?.numero}
                </h3>
              </div>
              <button
                onClick={() => setModalCheckOut(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Resumen de la Cuenta */}
            <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Huésped:</span>
                <span className="text-white font-semibold">
                  {modalCheckOut.reserva.huespedes?.nombres} {modalCheckOut.reserva.huespedes?.apellidos}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Alojamiento:</span>
                <span className="text-white font-mono">
                  Bs. {Number(modalCheckOut.reserva.total_alojamiento).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Consumos Extras:</span>
                <span className="text-amber-400 font-mono">
                  Bs. {calcularTotalConsumos(modalCheckOut.reserva.consumos_reserva).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                <span className="text-white">Total a Cobrar:</span>
                <span className="text-lg font-mono text-emerald-400">
                  Bs. {(
                    Number(modalCheckOut.reserva.total_alojamiento) +
                    calcularTotalConsumos(modalCheckOut.reserva.consumos_reserva)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Selector de Método de Pago */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Método de Cobro en Mostrador:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setModalCheckOut({ ...modalCheckOut, metodoPago: 'qr' })}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${modalCheckOut.metodoPago === 'qr'
                    ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                  <div className="text-[11px] font-bold">Pago QR</div>
                </button>

                <button
                  type="button"
                  onClick={() => setModalCheckOut({ ...modalCheckOut, metodoPago: 'efectivo' })}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${modalCheckOut.metodoPago === 'efectivo'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                >
                  <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                  <div className="text-[11px] font-bold">Efectivo</div>
                </button>

                <button
                  type="button"
                  onClick={() => setModalCheckOut({ ...modalCheckOut, metodoPago: 'tarjeta' })}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${modalCheckOut.metodoPago === 'tarjeta'
                    ? 'bg-amber-600/20 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  <div className="text-[11px] font-bold">Tarjeta</div>
                </button>
              </div>
            </div>

            {/* Visor de Código QR de Cobro */}
            {modalCheckOut.metodoPago === 'qr' && (
              <div className="mt-4 p-4 rounded-2xl bg-white text-slate-900 text-center shadow-inner">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  <span>Gran Hotel Illimani</span>
                  <span>&bull;</span>
                  <span>QR Simple</span>
                </div>
                {/* Visualizador QR Estilizado */}
                <div className="w-40 h-40 mx-auto bg-slate-900 rounded-2xl p-2.5 flex items-center justify-center relative shadow-lg">
                  <div className="w-full h-full bg-white rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden">
                    <QrCode className="w-28 h-28 text-slate-950" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center border-2 border-white shadow">
                        GHI
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-2">
                  Monto: Bs. {(
                    Number(modalCheckOut.reserva.total_alojamiento) +
                    (modalCheckOut.reserva.consumos_reserva || []).reduce(
                      (acc: number, c: any) => acc + (Number(c.subtotal) || 0),
                      0
                    )
                  ).toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Escanea con BNB, BCP, Banco Unión o app bancaria
                </div>
              </div>
            )}

            {/* Botón de Confirmación */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setModalCheckOut(null)}
                className="w-1/3 py-2.5 text-xs text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={modalCheckOut.procesando}
                onClick={confirmarCheckOutConPago}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{modalCheckOut.procesando ? 'Procesando...' : 'Confirmar Cobro y Salida'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: NUEVA RESERVA EN MOSTRADOR (WALK-IN CON COBRO QR) */}
      {/* ==================================================================== */}
      {modalNuevaReserva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-blue-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block">
                  Front Desk Walk-in
                </span>
                <h3 className="text-xl font-serif font-bold text-white">
                  Nueva Reserva y Entrega de Habitación
                </h3>
              </div>
              <button
                onClick={() => setModalNuevaReserva(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarWalkin} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkinNombres}
                    onChange={(e) => setWalkinNombres(e.target.value)}
                    placeholder="Ej. Juan Carlos"
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkinApellidos}
                    onChange={(e) => setWalkinApellidos(e.target.value)}
                    placeholder="Ej. Mamani Flores"
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Tipo Doc *
                  </label>
                  <select
                    value={walkinTipoDoc}
                    onChange={(e) => setWalkinTipoDoc(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="CI">C.I.</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="DNI">DNI</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Nº de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={walkinDocumento}
                    onChange={(e) => setWalkinDocumento(e.target.value)}
                    placeholder="Ej. 8472910 LP"
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Habitación Disponible *
                  </label>
                  <select
                    required
                    value={walkinHabitacionId}
                    onChange={(e) => setWalkinHabitacionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecciona habitación...</option>
                    {habitacionesDisponibles.map((h) => (
                      <option key={h.id} value={h.id}>
                        Hab. {h.numero} (Piso {h.piso}) - Bs. {Number((h as any).tipos_habitacion?.precio_base_noche || 480)}/noche
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Noches de Estadía *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={walkinNoches}
                    onChange={(e) => setWalkinNoches(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              {/* Selector de Método de Pago */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Método de Cobro Anticipado:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkinMetodoPago('qr')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${walkinMetodoPago === 'qr'
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                  >
                    <QrCode className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                    <div className="text-[11px] font-bold">QR Simple</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalkinMetodoPago('efectivo')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${walkinMetodoPago === 'efectivo'
                      ? 'bg-emerald-600/20 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                  >
                    <Banknote className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <div className="text-[11px] font-bold">Efectivo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWalkinMetodoPago('tarjeta')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${walkinMetodoPago === 'tarjeta'
                      ? 'bg-amber-600/20 border-amber-500 text-white ring-1 ring-amber-500'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <div className="text-[11px] font-bold">Tarjeta</div>
                  </button>
                </div>
              </div>

              {/* Visor QR Walk-in */}
              {walkinMetodoPago === 'qr' && (
                <div className="p-3 rounded-2xl bg-white text-slate-900 text-center">
                  <QrCode className="w-24 h-24 mx-auto text-slate-900" />
                  <div className="text-xs font-mono font-bold mt-1">
                    Pago con QR Simple (Modo Simulación)
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNuevaReserva(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoWalkin}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {guardandoWalkin ? 'Registrando...' : 'Confirmar y Entregar Habitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: COMPROBANTE DE PAGO REGISTRADO */}
      {/* ==================================================================== */}
      {comprobantePago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-white mb-1">
              ¡Cobro Registrado con Éxito!
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              La transacción ha sido guardada en la base de datos de caja.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Reserva:</span>
                <span className="text-amber-400 font-bold">{comprobantePago.codigo}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Habitación:</span>
                <span className="text-white font-bold">Hab. {comprobantePago.habitacion}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Huésped:</span>
                <span className="text-white font-sans">{comprobantePago.huesped}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Método:</span>
                <span className="text-blue-400 font-bold">{comprobantePago.metodo}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Transacción:</span>
                <span className="text-slate-300">{comprobantePago.transaccion}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-emerald-400">
                <span>Monto Cobrado:</span>
                <span>Bs. {comprobantePago.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setComprobantePago(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              Cerrar Comprobante
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CARGAR CONSUMO A HABITACIÓN */}
      {/* ==================================================================== */}
      {modalConsumoAbierto && (() => {
        const reservasHospedadas = reservas.filter((r) => r.estado === 'en_curso');
        const reservasConfirmadas = reservas.filter((r) => r.estado === 'confirmada');
        const servicioObj = servicios.find((s) => s.id === servicioSeleccionado);
        const subtotalEstimado = Number(servicioObj?.precio_unitario || 0) * cantidadConsumo;
        const hayReservasDisponibles = reservasHospedadas.length > 0 || reservasConfirmadas.length > 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                      Servicios & Room Service
                    </span>
                    <h3 className="text-xl font-serif font-bold text-white">
                      Cargar Consumo a Habitación
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalConsumoAbierto(false);
                    setReservaSeleccionada('');
                    setServicioSeleccionado('');
                    setCantidadConsumo(1);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!hayReservasDisponibles ? (
                /* EXPLICACIÓN CLARA CUANDO NO HAY HUÉSPEDES HOSPEDADOS */
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-300">
                        No hay habitaciones con huéspedes hospedados
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Los consumos (restaurante, minibar, lavandería, spa) deben registrarse a nombre de una <strong>reserva activa</strong> para que el monto se sume al estado de cuenta del huésped y se cobre en su <strong>Check-out</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                    <div className="font-semibold text-slate-200">¿Cómo habilitar habitaciones para consumo?</div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                      <li>Si el huésped acaba de llegar a recepción, usa el botón <strong>+ Nueva Reserva Mostrador (Walk-in)</strong>.</li>
                      <li>Si ya tenía una reserva previa, ve a la pestaña <strong>Front Desk</strong> y pulsa <strong>Entregar Habitación (Check-in)</strong>.</li>
                    </ul>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalConsumoAbierto(false);
                        setModalNuevaReserva(true);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all text-center cursor-pointer"
                    >
                      + Registrar Reserva Mostrador (Walk-in)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalConsumoAbierto(false);
                        setPestana('frontdesk');
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all text-center cursor-pointer border border-slate-700"
                    >
                      Ir a Front Desk
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!reservaSeleccionada || !servicioSeleccionado || cantidadConsumo <= 0) {
                      alert('Por favor selecciona una habitación y un servicio.');
                      return;
                    }
                    setGuardandoConsumo(true);
                    try {
                      const s = servicios.find((ser) => ser.id === servicioSeleccionado);
                      if (!s) throw new Error('Servicio no encontrado');
                      const p = Number(s.precio_unitario);
                      const { error } = await supabase.from('consumos_reserva').insert({
                        reserva_id: reservaSeleccionada,
                        servicio_id: servicioSeleccionado,
                        cantidad: cantidadConsumo,
                        precio_unitario: p,
                      });
                      if (error) throw error;

                      setModalConsumoAbierto(false);
                      setReservaSeleccionada('');
                      setServicioSeleccionado('');
                      setCantidadConsumo(1);
                      await cargarDatos();
                      alert('¡Consumo cargado exitosamente a la habitación!');
                    } catch (err: any) {
                      console.error('[DashboardRecepcion] Error al guardar consumo:', err);
                      alert('Error al registrar consumo: ' + (err.message || 'Error de conexión'));
                    } finally {
                      setGuardandoConsumo(false);
                    }
                  }}
                  className="space-y-4"
                >
                  {/* Selector de Habitación */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Habitación y Huésped Destino *
                    </label>
                    <select
                      required
                      value={reservaSeleccionada}
                      onChange={(e) => setReservaSeleccionada(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Selecciona habitación / huésped --</option>
                      {reservasHospedadas.length > 0 && (
                        <optgroup label="🟢 Habitaciones Hospedadas (Check-in Realizado / En Curso)">
                          {reservasHospedadas.map((r) => (
                            <option key={r.id} value={r.id}>
                              Hab. {r.habitaciones?.numero || 'S/N'} - {r.huespedes?.nombres} {r.huespedes?.apellidos} ({r.codigo_reserva})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {reservasConfirmadas.length > 0 && (
                        <optgroup label="🟡 Reservas Confirmadas (Por Llegar / Check-in Pendiente)">
                          {reservasConfirmadas.map((r) => (
                            <option key={r.id} value={r.id}>
                              Hab. {r.habitaciones?.numero || 'S/N'} - {r.huespedes?.nombres} {r.huespedes?.apellidos} (Por Llegar - {r.codigo_reserva})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      El cargo se añadirá al folio de la habitación para ser liquidado en el check-out.
                    </p>
                  </div>

                  {/* Selector de Servicio */}
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                      Servicio o Producto *
                    </label>
                    <select
                      required
                      value={servicioSeleccionado}
                      onChange={(e) => setServicioSeleccionado(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Selecciona del catálogo --</option>
                      {servicios.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.categoria}] {s.nombre} - Bs. {Number(s.precio_unitario).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad y Subtotal Calculado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        required
                        value={cantidadConsumo}
                        onChange={(e) => setCantidadConsumo(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                        Subtotal a Cargar
                      </label>
                      <div className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold text-sm flex items-center justify-between">
                        <span>Bs.</span>
                        <span>{subtotalEstimado.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setModalConsumoAbierto(false);
                        setReservaSeleccionada('');
                        setServicioSeleccionado('');
                        setCantidadConsumo(1);
                      }}
                      className="px-4 py-2 text-xs text-slate-300 hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoConsumo}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      {guardandoConsumo ? 'Cargando a Habitación...' : 'Confirmar y Cargar a Cuenta'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL: APERTURA DE CAJA */}
      {modalCajaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-blue-500/40 rounded-3xl p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block">
                  Turno Front Desk
                </span>
                <h3 className="text-lg font-serif font-bold text-white">
                  Apertura de Turno de Caja
                </h3>
              </div>
              <button
                onClick={() => setModalCajaAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAbrirCaja} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Monto de Fondo Inicial (Efectivo en Caja Bs.) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={montoApertura}
                  onChange={(e) => setMontoApertura(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  placeholder="300"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Monto base para cambio y pagos en efectivo durante tu turno.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCajaAbierto(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCaja}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg cursor-pointer"
                >
                  {guardandoCaja ? 'Abriendo turno...' : 'Confirmar y Abrir Caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ARQUEO Y CIERRE DE TURNO DE CAJA */}
      {/* ==================================================================== */}
      {modalCierreCaja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 block">
                    Control Contable & Arqueo
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white">
                    Cierre de Turno de Caja
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCierreCaja(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuadro de resumen según sistema */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Resumen de Movimientos en Sistema
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400">Fondo Inicial Apertura</div>
                  <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">
                    Bs. {fondoInicial.toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400">Cobrado en Efectivo</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                    + Bs. {pagosEfectivo.toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400">Cobrado en QR / Banco</div>
                  <div className="text-sm font-mono font-bold text-sky-400 mt-0.5">
                    Bs. {pagosQR.toFixed(2)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400">Cobrado en Tarjeta</div>
                  <div className="text-sm font-mono font-bold text-indigo-400 mt-0.5">
                    Bs. {pagosTarjeta.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Efectivo total esperado en gaveta:
                </span>
                <span className="text-base font-mono font-black text-amber-400">
                  Bs. {totalEfectivoEsperado.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Formulario de Cierre y Arqueo Físico */}
            <form onSubmit={handleConfirmarCierreCaja} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Efectivo Físico Contado en Gaveta (Bs.) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                    Bs.
                  </span>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={montoDeclaradoCierre}
                    onChange={(e) => setMontoDeclaradoCierre(parseFloat(e.target.value) || 0)}
                    className="w-full pl-11 pr-4 py-2.5 text-base bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ingresa el total de billetes y monedas contados físicamente en caja.
                </p>
              </div>

              {/* Indicador en tiempo real de Cuadre / Sobrante / Faltante */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  Math.abs(diferenciaArqueo) < 0.01
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : diferenciaArqueo > 0
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {Math.abs(diferenciaArqueo) < 0.01 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span className="font-semibold">
                    {Math.abs(diferenciaArqueo) < 0.01
                      ? 'Cuadre Exacto'
                      : diferenciaArqueo > 0
                      ? 'Sobrante de Caja'
                      : 'Faltante de Caja'}
                  </span>
                </div>
                <div className="font-mono font-bold text-sm">
                  {diferenciaArqueo > 0 ? '+' : ''}Bs. {diferenciaArqueo.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Observaciones / Justificación de Cierre
                </label>
                <textarea
                  rows={2}
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  placeholder="Detalles sobre billetes deteriorados, incidencias, o notas para el siguiente turno..."
                  className="w-full p-3 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCierreCaja(false)}
                  className="px-4 py-2.5 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoCaja}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  {guardandoCaja ? 'Registrando Cierre...' : 'Confirmar y Cerrar Caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
