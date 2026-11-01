import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FachadaHotelInteractiva } from './FachadaHotelInteractiva';
import {
  obtenerNombreVistaHabitacion,
  obtenerFotoInteriorHabitacion,
} from '../../data/hotelData';
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
  Search,
  Check,
  Database as DatabaseIcon,
  Loader2,
  Eye,
} from 'lucide-react';
import type { HabitacionConTipo, TipoHabitacion } from '../../types/database';

export interface DatosNuevaReserva {
  habitacionId: string;
  fechaEntrada: string;
  fechaSalida: string;
  precioPactadoNoche: number;
  totalAlojamiento: number;
  observaciones?: string | null;
  habitacion: HabitacionConTipo;
}

interface SinReservaViewProps {
  onCrearReserva: (datos: DatosNuevaReserva) => Promise<void>;
  cargando: boolean;
}

export const SinReservaView: React.FC<SinReservaViewProps> = ({
  onCrearReserva,
  cargando,
}) => {
  const [pestañaSeleccion, setPestañaSeleccion] = useState<'fachada' | 'catalogo'>('fachada');
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<HabitacionConTipo | null>(null);

  // Estados para el catálogo y la fachada vinculados directamente a Supabase
  const [habitacionesBD, setHabitacionesBD] = useState<HabitacionConTipo[]>([]);
  const [cargandoHabitaciones, setCargandoHabitaciones] = useState<boolean>(true);
  const [filtroPisoCatalogo, setFiltroPisoCatalogo] = useState<number | 'todos'>('todos');
  const [filtroEstadoCatalogo, setFiltroEstadoCatalogo] = useState<'todos' | 'disponible'>('todos');
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [conectadoBD, setConectadoBD] = useState(false);

  // Cargar habitaciones reales directamente desde Supabase
  const sincronizarDesdeSupabase = async () => {
    setCargandoHabitaciones(true);
    try {
      const { data: habsDB, error } = await supabase
        .from('habitaciones')
        .select('*, tipos_habitacion(*)')
        .order('piso', { ascending: false })
        .order('numero', { ascending: true });

      if (!error && habsDB) {
        setConectadoBD(true);
        setHabitacionesBD(habsDB as unknown as HabitacionConTipo[]);
      } else {
        setHabitacionesBD([]);
      }
    } catch (err) {
      console.error('[SinReservaView] Error consultando habitaciones en Supabase:', err);
      setHabitacionesBD([]);
    } finally {
      setCargandoHabitaciones(false);
    }
  };

  useEffect(() => {
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

  // Tipo de habitación de la habitación actualmente seleccionada
  const tipoSeleccionado: TipoHabitacion | null =
    habitacionSeleccionada?.tipos_habitacion || null;

  // Cálculo de noches y tarifa
  const fEntrada = new Date(fechaEntrada);
  const fSalida = new Date(fechaSalida);
  const diffTiempo = Math.max(1, fSalida.getTime() - fEntrada.getTime());
  const noches = Math.max(1, Math.ceil(diffTiempo / (1000 * 60 * 60 * 24)));
  const precioNoche = Number(tipoSeleccionado?.precio_base_noche || 0);
  const totalAlojamiento = precioNoche * noches;

  const handleConfirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitacionSeleccionada || !tipoSeleccionado) return;

    await onCrearReserva({
      habitacionId: habitacionSeleccionada.id,
      fechaEntrada,
      fechaSalida,
      precioPactadoNoche: precioNoche,
      totalAlojamiento,
      observaciones: observaciones.trim() || null,
      habitacion: habitacionSeleccionada,
    });

    setHabitacionSeleccionada(null);
  };

  // Filtrar habitaciones para el catálogo
  const habitacionesFiltradasCatalogo = habitacionesBD.filter((hab) => {
    // Filtro por piso
    if (filtroPisoCatalogo !== 'todos' && hab.piso !== filtroPisoCatalogo) {
      return false;
    }
    // Filtro por estado
    if (filtroEstadoCatalogo === 'disponible' && hab.estado !== 'disponible') {
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
  });

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-300">
      {/* Banner Hero Principal */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20 bg-slate-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/Fondo.jpg')`,
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
            registradas en la base de datos de Supabase.
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
              <span>Ver Catálogo ({habitacionesBD.length} Habitaciones)</span>
            </button>
          </div>
        </div>
      </div>

      {cargandoHabitaciones ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-sm">Cargando habitaciones desde la Base de Datos...</span>
        </div>
      ) : habitacionesBD.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-8 space-y-3">
          <BedDouble className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            No se encontraron habitaciones registradas
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            La tabla <code className="text-amber-400 font-mono">habitaciones</code> en Supabase aún no tiene registros o se encuentra vacía.
          </p>
          <button
            onClick={sincronizarDesdeSupabase}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Reintentar Conexión
          </button>
        </div>
      ) : (
        <>
          {/* VISTA 1: BOCETO INTERACTIVO DE LA FACHADA */}
          {pestañaSeleccion === 'fachada' && (
            <div className="space-y-4">
              <FachadaHotelInteractiva
                habitaciones={habitacionesBD}
                habitacionPreseleccionada={habitacionSeleccionada}
                onMarcarHabitacion={(hab) => setHabitacionSeleccionada(hab)}
                onSeleccionarHabitacion={(hab) => setHabitacionSeleccionada(hab)}
                onLimpiarSeleccion={() => setHabitacionSeleccionada(null)}
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
                          : 'Consultando Supabase'}
                      </span>
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-white tracking-tight">
                    Catálogo de Habitaciones
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Habitaciones del Gran Hotel Illimani registradas con sus características, ubicación y tarifas
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

              {/* Grid de Todas las Habitaciones de Supabase */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {habitacionesFiltradasCatalogo.map((hab) => {
                  const estaDisponible = hab.estado === 'disponible';
                  const precio = hab.tipos_habitacion?.precio_base_noche || 0;
                  const nombreTipo =
                    hab.tipos_habitacion?.nombre || 'Habitación Illimani';
                  const imgInterior = obtenerFotoInteriorHabitacion(nombreTipo, hab.numero);
                  const nombreVista = obtenerNombreVistaHabitacion(hab.coordenadas_por_vista);

                  return (
                    <div
                      key={hab.id}
                      className={`group bg-slate-900/90 rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl ${
                        estaDisponible
                          ? 'border-slate-800 hover:border-amber-500/50 hover:shadow-amber-500/10'
                          : 'border-slate-800/60 opacity-80'
                      }`}
                    >
                      {/* Imagen de Referencia de la Habitación y Placa */}
                      <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-950">
                        <img
                          src={imgInterior}
                          alt={`Interior de la Habitación ${hab.numero} - ${nombreTipo}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                        {/* Placa Dorada con Número de Habitación y Fachada */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                          <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-xl border border-amber-500/40 text-white flex items-center gap-2 shadow-lg">
                            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                              HAB.
                            </span>
                            <span className="text-base font-mono font-black text-amber-300">
                              {hab.numero}
                            </span>
                          </div>
                          <span className="bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-700 text-[10px] text-amber-300 font-semibold flex items-center gap-1 shadow">
                            <Building2 className="w-3 h-3 text-amber-400" />
                            <span>{nombreVista}</span>
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
                            {estaDisponible ? 'Libre' : hab.estado}
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

                          {/* Características */}
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

                        {/* Botones de Acción */}
                        <div className="pt-2 space-y-2">
                          {estaDisponible ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setHabitacionSeleccionada(hab)}
                                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <BedDouble className="w-4 h-4" />
                                <span>Reservar Hab. {hab.numero}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setHabitacionSeleccionada(hab);
                                  setPestañaSeleccion('fachada');
                                }}
                                className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 font-semibold text-[11px] rounded-xl border border-slate-700 hover:border-amber-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-400" />
                                <span>Ver ventana en {nombreVista}</span>
                              </button>
                            </>
                          ) : (
                            <div className="w-full py-2.5 px-4 bg-slate-800 text-slate-500 font-bold text-xs rounded-xl text-center select-none cursor-not-allowed capitalize">
                              Habitación {hab.estado}
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
        </>
      )}

      {/* Modal / Formulario de Reserva */}
      {habitacionSeleccionada && tipoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-white animate-in zoom-in-95 duration-200">
            {/* Cabecera del Modal con Fotografía Real de la Fachada */}
            {/* Cabecera del Modal con Fotografía de Referencia de la Habitación */}
            <div className="relative h-36 overflow-hidden border-b border-slate-800 bg-slate-950">
              <img
                src={obtenerFotoInteriorHabitacion(tipoSeleccionado.nombre, habitacionSeleccionada.numero)}
                alt={`Habitación ${habitacionSeleccionada.numero}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              
              <button
                onClick={() => setHabitacionSeleccionada(null)}
                className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-950/70 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-0.5">
                  Confirmación de Reserva • Gran Hotel Illimani
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {tipoSeleccionado.nombre}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-xs shadow">
                      HAB. {habitacionSeleccionada.numero}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 text-[10px] font-semibold border border-slate-700">
                      Piso {habitacionSeleccionada.piso} • {obtenerNombreVistaHabitacion(habitacionSeleccionada.coordenadas_por_vista)}
                    </span>
                  </div>
                </div>
              </div>
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
                    Bs. {precioNoche}
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
                  <span>Procesando Reserva en Base de Datos...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Confirmar Reserva (Hab. {habitacionSeleccionada.numero} • {tipoSeleccionado.nombre})
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
