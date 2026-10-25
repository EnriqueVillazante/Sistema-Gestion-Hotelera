import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  TIPOS_HABITACION_SEED,
  HABITACIONES_SEED,
  type TipoHabitacionMock,
  type HabitacionMock,
} from '../../data/hotelData';
import { FachadaHotelInteractiva } from './FachadaHotelInteractiva';
import {
  Calendar,
  Users,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  BedDouble,
  Building2,
  LayoutGrid,
  MapPin,
  Search,
  Check,
  Database as DatabaseIcon,
} from 'lucide-react';
import type { ReservaConDetalle, HabitacionConTipo } from '../../types/database';

interface SinReservaViewProps {
  onCrearReserva: (nuevaReserva: ReservaConDetalle) => Promise<void>;
  cargando: boolean;
}

export const SinReservaView: React.FC<SinReservaViewProps> = ({
  onCrearReserva,
  cargando,
}) => {
  const [pestañaSeleccion, setPestañaSeleccion] = useState<'fachada' | 'catalogo'>('fachada');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoHabitacionMock | null>(null);
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<HabitacionMock | null>(null);
  const [habitaciones, setHabitaciones] = useState<HabitacionMock[]>(HABITACIONES_SEED);

  // Estados para el catálogo completo de habitaciones de la Base de Datos
  const [habitacionesBD, setHabitacionesBD] = useState<HabitacionConTipo[]>([]);
  const [filtroPisoCatalogo, setFiltroPisoCatalogo] = useState<number | 'todos'>('todos');
  const [filtroEstadoCatalogo, setFiltroEstadoCatalogo] = useState<'todos' | 'disponible'>('todos');
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [conectadoBD, setConectadoBD] = useState(false);

  // Obtener imagen según el tipo de habitación o número
  const obtenerImagenHabitacion = (nombreTipo?: string, numero?: string) => {
    if (
      nombreTipo?.toLowerCase().includes('presidencial') ||
      numero === '208' ||
      numero === '301' ||
      numero === '303' ||
      numero === '310'
    ) {
      return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
    }
    if (nombreTipo?.toLowerCase().includes('matrimonial')) {
      return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80';
    }
    if (
      nombreTipo?.toLowerCase().includes('doble') ||
      nombreTipo?.toLowerCase().includes('twin')
    ) {
      return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80';
  };

  // Generar inventario de respaldo combinando habitaciones y tipos
  const generarInventarioRespaldo = (): HabitacionConTipo[] => {
    return HABITACIONES_SEED.map((h) => {
      const tipo =
        TIPOS_HABITACION_SEED.find((t) => t.id === h.tipo_id) ||
        TIPOS_HABITACION_SEED[0];
      return {
        id: h.id,
        numero: h.numero,
        piso: h.piso,
        tipo_id: h.tipo_id,
        estado: h.estado,
        fila_grid: 1,
        columna_grid: 1,
        caracteristicas: h.caracteristicas,
        coordenadas_por_vista: h.coordenadasPorVista as unknown as import('../../types/database').Json,
        creado_en: new Date().toISOString(),
        tipos_habitacion: {
          id: tipo.id,
          nombre: tipo.nombre,
          descripcion: tipo.descripcion,
          capacidad_adultos: tipo.capacidad_adultos,
          capacidad_ninos: tipo.capacidad_ninos,
          precio_base_noche: tipo.precio_base_noche,
          creado_en: new Date().toISOString(),
        },
      };
    });
  };

  // Cargar y sincronizar TODAS las habitaciones desde Supabase
  useEffect(() => {
    async function sincronizarDesdeSupabase() {
      try {
        const { data: habsDB, error } = await supabase
          .from('habitaciones')
          .select('*, tipos_habitacion(*)')
          .order('piso', { ascending: false })
          .order('numero', { ascending: true });

        if (!error && habsDB && habsDB.length > 0) {
          setConectadoBD(true);
          const habsFormateadas = habsDB as unknown as HabitacionConTipo[];
          setHabitacionesBD(habsFormateadas);

          // Sincronizar también el estado de las habitaciones para la fachada
          setHabitaciones((prevHabs) =>
            prevHabs.map((hLocal) => {
              const hRemota = habsFormateadas.find(
                (dbH) => dbH.numero === hLocal.numero
              );
              if (hRemota) {
                return {
                  ...hLocal,
                  id: hRemota.id,
                  estado: hRemota.estado,
                  tipo_id: hRemota.tipo_id,
                  caracteristicas:
                    hRemota.caracteristicas || hLocal.caracteristicas,
                };
              }
              return hLocal;
            })
          );
        } else {
          // Si Supabase aún no tiene el seed ejecutado, cargamos el inventario completo
          setHabitacionesBD(generarInventarioRespaldo());
        }
      } catch (err) {
        console.warn('[SinReservaView] Conectando con inventario completo:', err);
        setHabitacionesBD(generarInventarioRespaldo());
      }
    }

    sincronizarDesdeSupabase();
  }, []);

  // Fechas por defecto: Check-in hoy, Check-out en 2 días
  const hoyStr = new Date().toISOString().split('T')[0];
  const pasadoManana = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [fechaEntrada, setFechaEntrada] = useState(hoyStr);
  const [fechaSalida, setFechaSalida] = useState(pasadoManana);
  const [observaciones, setObservaciones] = useState('');

  // Cálculo de noches
  const fEntrada = new Date(fechaEntrada);
  const fSalida = new Date(fechaSalida);
  const diffTiempo = Math.max(1, fSalida.getTime() - fEntrada.getTime());
  const noches = Math.max(1, Math.ceil(diffTiempo / (1000 * 60 * 60 * 24)));
  const totalAlojamiento = (tipoSeleccionado?.precio_base_noche || 0) * noches;

  // Selección directa desde la Fachada Interactiva
  const handleSeleccionarDesdeFachada = (
    hab: HabitacionMock,
    tipo: TipoHabitacionMock
  ) => {
    setHabitacionSeleccionada(hab);
    setTipoSeleccionado(tipo);
  };

  // Reservar directamente una habitación específica desde el Catálogo
  const handleReservarDesdeCatalogo = (hab: HabitacionConTipo) => {
    if (hab.estado !== 'disponible') return;

    const tipoMock: TipoHabitacionMock = {
      id: hab.tipos_habitacion?.id || hab.tipo_id,
      nombre: hab.tipos_habitacion?.nombre || 'Habitación Illimani',
      descripcion:
        hab.tipos_habitacion?.descripcion ||
        'Habitación colonial con todas las amenidades de lujo.',
      capacidad_adultos: hab.tipos_habitacion?.capacidad_adultos || 2,
      capacidad_ninos: hab.tipos_habitacion?.capacidad_ninos || 1,
      precio_base_noche: hab.tipos_habitacion?.precio_base_noche || 390,
      imagen: obtenerImagenHabitacion(
        hab.tipos_habitacion?.nombre,
        hab.numero
      ),
      amenidades: hab.caracteristicas || [],
    };

    const habMock: HabitacionMock = {
      id: hab.id,
      numero: hab.numero,
      piso: hab.piso,
      tipo_id: hab.tipo_id,
      estado: hab.estado,
      caracteristicas: hab.caracteristicas || [],
      coordenadasPorVista: {},
    };

    setHabitacionSeleccionada(habMock);
    setTipoSeleccionado(tipoMock);
  };

  const handleConfirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoSeleccionado) return;

    // Habitación asignada
    const habAsignada =
      habitacionSeleccionada ||
      habitaciones.find(
        (h) => h.tipo_id === tipoSeleccionado.id && h.estado === 'disponible'
      ) ||
      habitaciones[0];

    const randomId = Math.floor(100 + Math.random() * 900);
    const codigo = `RES-2026-${randomId}`;

    const nuevaReserva: ReservaConDetalle = {
      id: `res-${Date.now()}`,
      codigo_reserva: codigo,
      huesped_id: 'current-guest',
      habitacion_id: habAsignada.id,
      recepcionista_id: null,
      fecha_entrada: fechaEntrada,
      fecha_salida: fechaSalida,
      check_in_real: null,
      check_out_real: null,
      precio_pactado_noche: tipoSeleccionado.precio_base_noche,
      total_alojamiento: totalAlojamiento,
      estado: 'confirmada',
      observaciones: observaciones || null,
      creado_en: new Date().toISOString(),
      habitaciones: {
        id: habAsignada.id,
        numero: habAsignada.numero,
        piso: habAsignada.piso,
        tipo_id: tipoSeleccionado.id,
        estado: 'disponible',
        fila_grid: 1,
        columna_grid: 1,
        caracteristicas: habAsignada.caracteristicas,
        coordenadas_por_vista: (habAsignada.coordenadasPorVista as unknown as import('../../types/database').Json) || null,
        creado_en: new Date().toISOString(),
        tipos_habitacion: {
          id: tipoSeleccionado.id,
          nombre: tipoSeleccionado.nombre,
          descripcion: tipoSeleccionado.descripcion,
          capacidad_adultos: tipoSeleccionado.capacidad_adultos,
          capacidad_ninos: tipoSeleccionado.capacidad_ninos,
          precio_base_noche: tipoSeleccionado.precio_base_noche,
          creado_en: new Date().toISOString(),
        },
      },
      consumos: [],
      pagos: [],
    };

    await onCrearReserva(nuevaReserva);
    setTipoSeleccionado(null);
    setHabitacionSeleccionada(null);
  };

  // Filtrar habitaciones para el catálogo
  const listaHabitacionesCatalogo =
    habitacionesBD.length > 0 ? habitacionesBD : generarInventarioRespaldo();

  const habitacionesFiltradasCatalogo = listaHabitacionesCatalogo.filter(
    (hab) => {
      // Filtro por piso
      if (filtroPisoCatalogo !== 'todos' && hab.piso !== filtroPisoCatalogo) {
        return false;
      }
      // Filtro por estado
      if (
        filtroEstadoCatalogo === 'disponible' &&
        hab.estado !== 'disponible'
      ) {
        return false;
      }
      // Filtro por búsqueda
      if (busquedaCatalogo.trim()) {
        const query = busquedaCatalogo.toLowerCase();
        const coincideNumero = hab.numero.toLowerCase().includes(query);
        const coincideTipo = hab.tipos_habitacion?.nombre
          ?.toLowerCase()
          .includes(query);
        const coincideCaract = hab.caracteristicas?.some((c) =>
          c.toLowerCase().includes(query)
        );
        if (!coincideNumero && !coincideTipo && !coincideCaract) return false;
      }
      return true;
    }
  );

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-300">
      {/* Banner Hero Principal */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20 bg-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/60" />

        <div className="relative z-10 p-8 sm:p-12 lg:p-14 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Bienvenido al Gran Hotel Illimani</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-black text-white tracking-tight leading-tight">
            Elige tu Habitación en el Hotel
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Puedes hacer clic directamente sobre las fachadas del hotel (
            <strong className="text-amber-400">Frontal</strong>,{' '}
            <strong className="text-amber-400">Lateral Izquierdo</strong> y{' '}
            <strong className="text-amber-400">Lateral Derecho</strong>) para
            marcar exactamente tu ventana, o consultar el{' '}
            <strong className="text-amber-400">
              catálogo completo de todas las habitaciones
            </strong>{' '}
            registradas en la base de datos.
          </p>

          {/* Selector de Modo de Elección */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setPestañaSeleccion('fachada')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                pestañaSeleccion === 'fachada'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 font-black'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Marcar en Fachada</span>
            </button>

            <button
              onClick={() => setPestañaSeleccion('catalogo')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                pestañaSeleccion === 'catalogo'
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20 font-black'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Ver Catálogo de Habitaciones ({listaHabitacionesCatalogo.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* VISTA 1: BOCETO INTERACTIVO DE LA FACHADA */}
      {pestañaSeleccion === 'fachada' && (
        <div className="space-y-4">
          <FachadaHotelInteractiva
            onMarcarHabitacion={(hab) => setHabitacionSeleccionada(hab)}
            onSeleccionarHabitacion={handleSeleccionarDesdeFachada}
            habitacionPreseleccionada={habitacionSeleccionada}
            onLimpiarSeleccion={() => setHabitacionSeleccionada(null)}
            habitaciones={habitaciones}
          />
        </div>
      )}

      {/* VISTA 2: CATÁLOGO COMPLETO DE TODAS LAS HABITACIONES DE LA BASE DE DATOS */}
      {pestañaSeleccion === 'catalogo' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Cabecera del Catálogo e Indicador de Base de Datos */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                  Inventario Oficial
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                    conectadoBD
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <DatabaseIcon className="w-3 h-3" />
                  <span>
                    {conectadoBD
                      ? 'Base de Datos Supabase Conectada'
                      : 'Inventario de Habitaciones'}
                  </span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight">
                Catálogo Completo de Habitaciones
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Todas las habitaciones del Gran Hotel Illimani registradas con sus características, ubicación y tarifas
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Garantía de Mejor Precio Directo</span>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros del Catálogo */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Buscador de Habitación */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busquedaCatalogo}
                onChange={(e) => setBusquedaCatalogo(e.target.value)}
                placeholder="Buscar habitación (ej. 208, Suite, Balcón)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {busquedaCatalogo && (
                <button
                  onClick={() => setBusquedaCatalogo('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtros de Piso y Estado */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {/* Filtro por piso */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFiltroPisoCatalogo('todos')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    filtroPisoCatalogo === 'todos'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos los Pisos
                </button>
                <button
                  onClick={() => setFiltroPisoCatalogo(3)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    filtroPisoCatalogo === 3
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Piso 3
                </button>
                <button
                  onClick={() => setFiltroPisoCatalogo(2)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    filtroPisoCatalogo === 2
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Piso 2
                </button>
                <button
                  onClick={() => setFiltroPisoCatalogo(1)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    filtroPisoCatalogo === 1
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Piso 1
                </button>
              </div>

              {/* Filtro por estado */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFiltroEstadoCatalogo('todos')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    filtroEstadoCatalogo === 'todos'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFiltroEstadoCatalogo('disponible')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filtroEstadoCatalogo === 'disponible'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Solo Libres</span>
                </button>
              </div>
            </div>
          </div>

          {/* Conteo de Resultados */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Mostrando{' '}
              <strong className="text-amber-400">
                {habitacionesFiltradasCatalogo.length}
              </strong>{' '}
              habitaciones
            </span>
            <span className="text-[11px] text-slate-500">
              Precios por noche con desayuno e impuestos incluidos
            </span>
          </div>

          {/* Grid de Todas las Habitaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habitacionesFiltradasCatalogo.map((hab) => {
              const estaDisponible = hab.estado === 'disponible';
              const precio = hab.tipos_habitacion?.precio_base_noche || 390;
              const nombreTipo =
                hab.tipos_habitacion?.nombre || 'Habitación Illimani';
              const imgHab = obtenerImagenHabitacion(nombreTipo, hab.numero);

              return (
                <div
                  key={hab.id || `hab-${hab.numero}`}
                  className={`group bg-slate-900/90 rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col shadow-xl hover:shadow-2xl ${
                    estaDisponible
                      ? 'border-slate-800 hover:border-amber-500/50 hover:shadow-amber-500/10'
                      : 'border-slate-800/60 opacity-80'
                  }`}
                >
                  {/* Imagen y Placa de la Habitación */}
                  <div className="relative h-48 sm:h-52 overflow-hidden">
                    <img
                      src={imgHab}
                      alt={`Habitación ${hab.numero}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                    {/* Placa Dorada con Número de Habitación */}
                    <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-amber-500/40 text-white flex items-center gap-2 shadow-lg">
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                        HAB.
                      </span>
                      <span className="text-base font-mono font-black text-amber-300">
                        {hab.numero}
                      </span>
                    </div>

                    {/* Badge de Piso y Estado */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                        Piso {hab.piso}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md ${
                          estaDisponible
                            ? 'bg-emerald-500/90 text-slate-950 font-black'
                            : 'bg-rose-600/90 text-white'
                        }`}
                      >
                        {estaDisponible ? 'Libre' : 'Ocupada'}
                      </span>
                    </div>

                    {/* Tarifa por Noche */}
                    <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-xl border border-amber-500/30 text-right shadow-lg">
                      <span className="text-xs font-black text-amber-400 font-serif block">
                        Bs. {precio}
                      </span>
                      <span className="text-[9px] text-slate-400 block -mt-0.5">
                        por noche
                      </span>
                    </div>

                    {/* Capacidad */}
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-white text-[11px]">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {hab.tipos_habitacion?.capacidad_adultos || 2} Adultos
                      </span>
                      {(hab.tipos_habitacion?.capacidad_ninos || 0) > 0 && (
                        <span>
                          + {hab.tipos_habitacion?.capacidad_ninos} Niños
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Información Detallada */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400/90 block">
                        {nombreTipo}
                      </span>
                      <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors mt-0.5">
                        Habitación {hab.numero}
                      </h3>

                      {/* Características y Balcón */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {hab.caracteristicas?.map((caract, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700/60"
                          >
                            <Check className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span>{caract}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Botón de Acción Directo */}
                    <div className="pt-2">
                      {estaDisponible ? (
                        <button
                          type="button"
                          onClick={() => handleReservarDesdeCatalogo(hab)}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <BedDouble className="w-4 h-4" />
                          <span>Reservar Hab. {hab.numero}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="w-full py-2.5 px-4 bg-slate-800 text-slate-500 font-bold text-xs rounded-xl text-center select-none cursor-not-allowed">
                          Habitación No Disponible
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mensaje de ningún resultado */}
          {habitacionesFiltradasCatalogo.length === 0 && (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-8 space-y-3">
              <BedDouble className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                No se encontraron habitaciones con estos filtros
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Prueba cambiando el piso seleccionado o limpiando el texto del buscador.
              </p>
              <button
                onClick={() => {
                  setFiltroPisoCatalogo('todos');
                  setFiltroEstadoCatalogo('todos');
                  setBusquedaCatalogo('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal / Wizard de Reserva */}
      {tipoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-white animate-in zoom-in-95 duration-200">
            {/* Cabecera del Modal */}
            <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
                  Confirmación de Reserva • Gran Hotel Illimani
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {tipoSeleccionado.nombre}
                </h3>
                {habitacionSeleccionada && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    Habitación Asignada: N° {habitacionSeleccionada.numero} (Piso {habitacionSeleccionada.piso})
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setTipoSeleccionado(null);
                  setHabitacionSeleccionada(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario de Reserva */}
            <form onSubmit={handleConfirmarReserva} className="p-6 space-y-4">
              {/* Fechas de Entrada y Salida */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha de Entrada *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={hoyStr}
                      value={fechaEntrada}
                      onChange={(e) => setFechaEntrada(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Fecha de Salida *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={fechaEntrada || hoyStr}
                      value={fechaSalida}
                      onChange={(e) => setFechaSalida(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Resumen de Tarifa */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Precio por noche:</span>
                  <span className="font-semibold text-white">
                    Bs. {tipoSeleccionado.precio_base_noche}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Duración de la estadía:</span>
                  <span className="font-semibold text-white">
                    {noches} {noches === 1 ? 'noche' : 'noches'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                  <span className="font-bold text-white">
                    Total Alojamiento:
                  </span>
                  <span className="font-serif font-black text-amber-400 text-base">
                    Bs. {totalAlojamiento}
                  </span>
                </div>
              </div>

              {/* Observaciones / Peticiones Especiales */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Observaciones / Peticiones Especiales (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej. Llegada tarde, almohadas extra, cuna para bebé..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Botón de Confirmación */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {cargando ? (
                  <span>Procesando Reserva...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Confirmar Reserva (
                      {habitacionSeleccionada
                        ? `Hab. ${habitacionSeleccionada.numero}`
                        : tipoSeleccionado.nombre}
                      )
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
