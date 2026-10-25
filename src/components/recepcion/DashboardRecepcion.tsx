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
      ]);

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

      if (habitacionId && !habitacionId.startsWith('hab-')) {
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
      if (habitacionId && !habitacionId.startsWith('hab-')) {
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

      // 2. Crear o asociar huésped
      let huespedId: string = crypto.randomUUID();
      const { data: hData } = await supabase
        .from('huespedes')
        .insert({
          nombres: walkinNombres.trim(),
          apellidos: walkinApellidos.trim(),
          tipo_documento: walkinTipoDoc,
          documento_identidad: walkinDocumento.trim(),
          telefono: walkinTelefono.trim() || null,
        })
        .select()
        .maybeSingle();

      if (hData) huespedId = hData.id;

      // 3. Crear reserva
      const { data: resData } = await supabase
        .from('reservas')
        .insert({
          codigo_reserva: codigoReserva,
          huesped_id: huespedId,
          habitacion_id: walkinHabitacionId,
          recepcionista_id: user?.id || null,
          fecha_entrada: ahora,
          fecha_salida: salida.toISOString(),
          check_in_real: ahora,
          precio_pactado_noche: precioNoche,
          total_alojamiento: total,
          estado: 'en_curso', // Entra de inmediato
          observaciones: 'Reserva directa en Front Desk (Walk-in).',
        })
        .select()
        .maybeSingle();

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

  // Abrir turno de caja
  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setGuardandoCaja(true);
    try {
      await supabase.from('turnos_caja').insert({
        recepcionista_id: user.id,
        monto_inicial: Number(montoApertura) || 0,
        fecha_apertura: new Date().toISOString(),
      });
      await refrescarTurno();
      setModalCajaAbierto(false);
    } catch (err) {
      console.error('[DashboardRecepcion] Error al abrir caja:', err);
    } finally {
      setGuardandoCaja(false);
    }
  };

  // Cerrar turno de caja
  const handleCerrarCaja = async () => {
    if (!turnoActivo) return;
    setGuardandoCaja(true);
    try {
      await supabase
        .from('turnos_caja')
        .update({
          fecha_cierre: new Date().toISOString(),
        })
        .eq('id', turnoActivo.id);
      await refrescarTurno();
    } catch (err) {
      console.error('[DashboardRecepcion] Error al cerrar caja:', err);
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
                onClick={() => setModalNuevaReserva(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
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
              onClick={() => setPestana('frontdesk')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${pestana === 'frontdesk'
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Check-in & Check-out</span>
            </button>

            <button
              onClick={() => setPestana('rack')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${pestana === 'rack'
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <BedDouble className="w-4 h-4" />
              <span>Rack de Habitaciones</span>
            </button>

            <button
              onClick={() => setPestana('consumos')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${pestana === 'consumos'
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Cargar Consumo a Habitación</span>
            </button>

            <button
              onClick={() => setPestana('caja')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${pestana === 'caja'
                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Turno de Caja</span>
              {turnoActivo ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Caja Abierta"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" title="Caja Cerrada"></span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* CUERPO PRINCIPAL */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
                              {esConfirmada && (
                                <button
                                  onClick={() => realizarCheckIn(r.id, r.habitacion_id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Entregar Habitación</span>
                                </button>
                              )}

                              {esEnCurso && (
                                <button
                                  onClick={() => abrirCobroCheckOut(r)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>Check-out & Cobro</span>
                                </button>
                              )}

                              {esFinalizada && (
                                <span className="text-xs text-slate-500 italic">
                                  Liquidada
                                </span>
                              )}
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
            <h3 className="text-xl font-serif font-bold text-white">Rack de Habitaciones en Vivo</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {habitaciones.map((h) => {
                const conf = {
                  disponible: { bg: 'bg-emerald-950/20 border-emerald-500/40', text: 'text-emerald-400', label: 'Disponible' },
                  ocupada: { bg: 'bg-rose-950/20 border-rose-500/40', text: 'text-rose-400', label: 'Ocupada' },
                  limpieza: { bg: 'bg-amber-950/20 border-amber-500/40', text: 'text-amber-400', label: 'Limpieza' },
                  mantenimiento: { bg: 'bg-slate-900 border-slate-700', text: 'text-slate-400', label: 'Mantenimiento' },
                }[h.estado];

                return (
                  <div key={h.id} className={`p-3.5 rounded-2xl border ${conf.bg} flex flex-col justify-between`}>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                      <span>Piso {h.piso}</span>
                      <span className={conf.text}>{conf.label}</span>
                    </div>
                    <div className="text-xl font-mono font-black text-white my-2">
                      Hab. {h.numero}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {h.caracteristicas?.[0] || 'Vista Illimani'}
                    </div>
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
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block mb-1">
                    Control de Arqueo y Turno
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white">
                    Caja Registradora Front Desk
                  </h3>
                </div>

                {turnoActivo ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Turno Activo en Curso
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Caja Cerrada
                  </span>
                )}
              </div>

              {turnoActivo ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                      <div className="text-xs text-slate-400">Fondo Inicial Apertura</div>
                      <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                        Bs. {Number(turnoActivo.monto_inicial || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                      <div className="text-xs text-slate-400">Hora de Apertura</div>
                      <div className="text-sm font-semibold text-white mt-2">
                        {new Date(turnoActivo.fecha_apertura).toLocaleTimeString('es-BO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(turnoActivo.fecha_apertura).toLocaleDateString('es-BO')}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                      <div className="text-xs text-slate-400">Operador a Cargo</div>
                      <div className="text-sm font-bold text-white mt-2 truncate">
                        {nombreRecepcionista}
                      </div>
                      <div className="text-[11px] text-blue-400">Recepcionista Oficial</div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleCerrarCaja}
                      disabled={guardandoCaja}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                    >
                      {guardandoCaja ? 'Cerrando turno...' : 'Cerrar Turno de Caja'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">No tienes un turno de caja abierto</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Abre tu turno de caja registradora con un fondo inicial para registrar cobros en efectivo, QR y tarjeta.
                    </p>
                  </div>
                  <button
                    onClick={() => setModalCajaAbierto(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Abrir Turno de Caja Ahora</span>
                  </button>
                </div>
              )}
            </div>
          </div>
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

      {/* MODAL: CARGAR CONSUMO */}
      {modalConsumoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-serif font-bold text-white mb-1">Cargar Consumo a Habitación</h3>
            <p className="text-xs text-slate-400 mb-4">Selecciona habitación hospedada y servicio a registrar.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!reservaSeleccionada || !servicioSeleccionado || cantidadConsumo <= 0) return;
              setGuardandoConsumo(true);
              try {
                const s = servicios.find((ser) => ser.id === servicioSeleccionado);
                if (s) {
                  const p = Number(s.precio_unitario);
                  await supabase.from('consumos_reserva').insert({
                    reserva_id: reservaSeleccionada,
                    servicio_id: servicioSeleccionado,
                    cantidad: cantidadConsumo,
                    precio_unitario: p,
                  });
                  setModalConsumoAbierto(false);
                  setReservaSeleccionada('');
                  setServicioSeleccionado('');
                  await cargarDatos();
                }
              } finally {
                setGuardandoConsumo(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Habitación *</label>
                <select
                  required
                  value={reservaSeleccionada}
                  onChange={(e) => setReservaSeleccionada(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">Selecciona...</option>
                  {reservas.filter((r) => r.estado === 'en_curso').map((r) => (
                    <option key={r.id} value={r.id}>
                      Hab. {r.habitaciones?.numero} - {r.huespedes?.nombres} {r.huespedes?.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Servicio *</label>
                <select
                  required
                  value={servicioSeleccionado}
                  onChange={(e) => setServicioSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">Selecciona servicio...</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.categoria}] {s.nombre} - Bs. {Number(s.precio_unitario).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={cantidadConsumo}
                  onChange={(e) => setCantidadConsumo(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button type="button" onClick={() => setModalConsumoAbierto(false)} className="px-4 py-2 text-xs text-slate-300">
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoConsumo} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-lg">
                  {guardandoConsumo ? 'Cargando...' : 'Guardar Consumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
};
