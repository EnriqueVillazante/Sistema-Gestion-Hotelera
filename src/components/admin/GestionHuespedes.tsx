import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Huesped } from '../../types/database';
import {
  Users,
  UserCheck,
  UserPlus,
  Search,
  RefreshCw,
  Phone,
  Globe,
  Calendar,
  BedDouble,
  AlertTriangle,
  Edit,
  Trash2,
  X,
  Eye,
  FileText,
} from 'lucide-react';

interface ReservaHuesped {
  id: string;
  codigo_reserva: string;
  estado: string;
  fecha_entrada: string;
  fecha_salida: string;
  total_alojamiento: number;
  habitaciones?: {
    numero: string;
    piso: number;
  } | null;
  consumos_reserva?: {
    subtotal: number | null;
    cantidad: number;
    precio_unitario: number;
  }[];
}

interface HuespedConReservas extends Huesped {
  reservas?: ReservaHuesped[];
}

export const GestionHuespedes: React.FC = () => {
  const [huespedes, setHuespedes] = useState<HuespedConReservas[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstancia, setFiltroEstancia] = useState<'todos' | 'en_curso' | 'confirmada' | 'historico'>('todos');
  const [filtroTipoDoc, setFiltroTipoDoc] = useState<string>('todos');

  // Modal Nuevo Huésped
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('CI');
  const [documentoIdentidad, setDocumentoIdentidad] = useState('');
  const [nacionalidad, setNacionalidad] = useState('Boliviana');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Modal Edición
  const [huespedEditando, setHuespedEditando] = useState<Huesped | null>(null);

  // Modal Ficha / Detalle
  const [huespedDetalle, setHuespedDetalle] = useState<HuespedConReservas | null>(null);

  // Cargar huéspedes desde Supabase
  const cargarHuespedes = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('huespedes')
        .select(`
          *,
          reservas:reservas(
            id,
            codigo_reserva,
            estado,
            fecha_entrada,
            fecha_salida,
            total_alojamiento,
            habitaciones:habitaciones(numero, piso),
            consumos_reserva:consumos_reserva(subtotal, cantidad, precio_unitario)
          )
        `)
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('[GestionHuespedes] Error cargando huéspedes:', error);
      } else if (data) {
        setHuespedes(data as unknown as HuespedConReservas[]);
      }
    } catch (err) {
      console.error('[GestionHuespedes] Excepción:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHuespedes();
  }, []);

  // Manejar creación de nuevo huésped manual
  const handleCrearHuesped = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModal(null);

    if (!nombres.trim() || !apellidos.trim() || !documentoIdentidad.trim()) {
      setErrorModal('Nombres, apellidos y documento de identidad son obligatorios.');
      return;
    }

    setGuardando(true);
    try {
      const { error } = await supabase.from('huespedes').insert({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        tipo_documento: tipoDocumento,
        documento_identidad: documentoIdentidad.trim(),
        nacionalidad: nacionalidad.trim() || 'Boliviana',
        telefono: telefono.trim() || null,
        email: email.trim().toLowerCase() || null,
      });

      if (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          setErrorModal('Ya existe un huésped con este documento de identidad.');
        } else {
          setErrorModal(error.message || 'Error al guardar el huésped');
        }
        return;
      }

      setModalNuevoAbierto(false);
      limpiarFormulario();
      await cargarHuespedes();
    } catch (err: any) {
      setErrorModal(err.message || 'Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  // Manejar actualización de datos de huésped
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!huespedEditando) return;

    setGuardando(true);
    try {
      const { error } = await supabase
        .from('huespedes')
        .update({
          nombres: huespedEditando.nombres.trim(),
          apellidos: huespedEditando.apellidos.trim(),
          tipo_documento: huespedEditando.tipo_documento,
          documento_identidad: huespedEditando.documento_identidad.trim(),
          nacionalidad: huespedEditando.nacionalidad?.trim() || 'Boliviana',
          telefono: huespedEditando.telefono?.trim() || null,
          email: huespedEditando.email?.trim().toLowerCase() || null,
        })
        .eq('id', huespedEditando.id);

      if (error) throw error;

      setHuespedEditando(null);
      await cargarHuespedes();
    } catch (err: any) {
      alert('Error al actualizar huésped: ' + (err.message || 'Error de conexión'));
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar ficha de huésped (solo si no tiene reservas activas vinculadas)
  const handleEliminarHuesped = async (huesped: HuespedConReservas) => {
    if (huesped.reservas && huesped.reservas.length > 0) {
      const tieneEnCurso = huesped.reservas.some((r) => r.estado === 'en_curso');
      if (tieneEnCurso) {
        alert('No se puede eliminar: el huésped está actualmente hospedado en el hotel.');
        return;
      }
    }

    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el registro de ${huesped.nombres} ${huesped.apellidos} (Doc: ${huesped.documento_identidad})?`
    );
    if (!confirmar) return;

    try {
      const { error } = await supabase.from('huespedes').delete().eq('id', huesped.id);
      if (error) {
        alert('No se pudo eliminar el huésped. Puede tener reservas históricas registradas en contabilidad.');
      } else {
        await cargarHuespedes();
      }
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const limpiarFormulario = () => {
    setNombres('');
    setApellidos('');
    setTipoDocumento('CI');
    setDocumentoIdentidad('');
    setNacionalidad('Boliviana');
    setTelefono('');
    setEmail('');
    setErrorModal(null);
  };

  // Filtrado de huéspedes
  const huespedesFiltrados = huespedes.filter((h) => {
    // Filtro texto
    const txt = busqueda.toLowerCase().trim();
    if (txt) {
      const matchNombre = `${h.nombres} ${h.apellidos}`.toLowerCase().includes(txt);
      const matchDoc = h.documento_identidad.toLowerCase().includes(txt);
      const matchEmail = (h.email || '').toLowerCase().includes(txt);
      const matchTel = (h.telefono || '').toLowerCase().includes(txt);
      const matchHab = h.reservas?.some((r) => r.habitaciones?.numero.includes(txt));
      if (!matchNombre && !matchDoc && !matchEmail && !matchTel && !matchHab) return false;
    }

    // Filtro por tipo de documento
    if (filtroTipoDoc !== 'todos' && h.tipo_documento !== filtroTipoDoc) {
      return false;
    }

    // Filtro por estancia
    if (filtroEstancia !== 'todos') {
      const tieneEnCurso = h.reservas?.some((r) => r.estado === 'en_curso');
      const tieneConfirmada = h.reservas?.some((r) => r.estado === 'confirmada');
      if (filtroEstancia === 'en_curso' && !tieneEnCurso) return false;
      if (filtroEstancia === 'confirmada' && !tieneConfirmada) return false;
      if (filtroEstancia === 'historico' && (tieneEnCurso || tieneConfirmada)) return false;
    }

    return true;
  });

  // Métricas
  const totalHuespedes = huespedes.length;
  const hospedadosActualmente = huespedes.filter((h) =>
    h.reservas?.some((r) => r.estado === 'en_curso')
  ).length;
  const reservasPorLlegar = huespedes.filter((h) =>
    h.reservas?.some((r) => r.estado === 'confirmada')
  ).length;
  const extranjeros = huespedes.filter(
    (h) => h.nacionalidad && h.nacionalidad.toLowerCase() !== 'boliviana'
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ==================================================================== */}
      {/* CABECERA PRINCIPAL Y ACCIÓN */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5" />
              Directorio de Huéspedes
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Tabla `public.huespedes` (Supabase)
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Directorio y Registro de Huéspedes
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Clientes registrados desde el portal web o recepción mostrador (walk-in). Consulta su documentación, datos de contacto e historial de estancias.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={cargarHuespedes}
            disabled={cargando}
            className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Recargar directorio de huéspedes"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              limpiarFormulario();
              setModalNuevoAbierto(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Registrar Nuevo Huésped</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MÉTRICAS DE HUÉSPEDES */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Huéspedes
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
            {totalHuespedes}
          </div>
          <div className="text-xs text-slate-400 mt-1">Fichas en el hotel</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              En Estadía (Hospedados)
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <BedDouble className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-300 mt-2">
            {hospedadosActualmente}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">Actualmente en habitación</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Próximas Llegadas
            </span>
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-300 mt-2">
            {reservasPorLlegar}
          </div>
          <div className="text-xs text-amber-400/80 mt-1">Con reserva confirmada</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Internacionales
            </span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Globe className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
            {extranjeros}
          </div>
          <div className="text-xs text-slate-400 mt-1">Huéspedes del exterior</div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FILTROS Y BÚSQUEDA */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, documento (CI/Pasaporte), email..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={filtroEstancia}
            onChange={(e) => setFiltroEstancia(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="todos">Todos los Estados de Estancia</option>
            <option value="en_curso">🟢 Hospedados Actualmente</option>
            <option value="confirmada">🟡 Próxima Llegada (Confirmada)</option>
            <option value="historico">⚪ Sin Estancia Activa Hoy</option>
          </select>

          <select
            value={filtroTipoDoc}
            onChange={(e) => setFiltroTipoDoc(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="todos">Todos los Documentos</option>
            <option value="CI">Cédula de Identidad (CI)</option>
            <option value="Pasaporte">Pasaporte Internacional</option>
            <option value="DNI">DNI</option>
            <option value="Otro">Otro Documento</option>
          </select>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TABLA DE HUÉSPEDES */}
      {/* ==================================================================== */}
      <div className="overflow-hidden rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Huésped</th>
                <th className="py-3.5 px-4 font-semibold">Documento de Identidad</th>
                <th className="py-3.5 px-4 font-semibold">Nacionalidad</th>
                <th className="py-3.5 px-4 font-semibold">Contacto</th>
                <th className="py-3.5 px-4 font-semibold text-center">Estado Actual</th>
                <th className="py-3.5 px-4 font-semibold text-center">Estancias</th>
                <th className="py-3.5 px-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {cargando ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
                    Cargando directorio de huéspedes desde Supabase...
                  </td>
                </tr>
              ) : huespedesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron huéspedes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                huespedesFiltrados.map((h) => {
                  const iniciales = `${h.nombres[0] || ''}${h.apellidos[0] || ''}`.toUpperCase();
                  const reservaActiva = h.reservas?.find((r) => r.estado === 'en_curso');
                  const reservaConfirmada = h.reservas?.find((r) => r.estado === 'confirmada');
                  const totalEstancias = h.reservas?.length || 0;

                  return (
                    <tr key={h.id} className="hover:bg-slate-700/30 transition-colors">
                      {/* Nombre y Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow">
                            {iniciales}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {h.nombres} {h.apellidos}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {h.email || 'Sin correo registrado'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Documento */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-200">
                          {h.documento_identidad}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-semibold uppercase">
                          {h.tipo_documento}
                        </span>
                      </td>

                      {/* Nacionalidad */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900 border border-slate-700 text-slate-300">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{h.nacionalidad || 'Boliviana'}</span>
                        </span>
                      </td>

                      {/* Contacto */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {h.telefono ? (
                            <a
                              href={`tel:${h.telefono}`}
                              className="text-slate-300 hover:text-blue-400 font-mono text-[11px] flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{h.telefono}</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Sin teléfono</span>
                          )}
                          {h.email && (
                            <span className="text-slate-400 text-[10px] block truncate max-w-[150px]">
                              {h.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado Actual */}
                      <td className="py-3.5 px-4 text-center">
                        {reservaActiva ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Hab. {reservaActiva.habitaciones?.numero} (Hospedado)
                          </span>
                        ) : reservaConfirmada ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Hab. {reservaConfirmada.habitaciones?.numero} (Por Llegar)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-500 bg-slate-900">
                            Sin estancia hoy
                          </span>
                        )}
                      </td>

                      {/* Estancias Totales */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold">
                        <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          {totalEstancias} {totalEstancias === 1 ? 'visita' : 'visitas'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setHuespedDetalle(h)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white transition-colors cursor-pointer"
                            title="Ver ficha completa e historial de reservas"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setHuespedEditando({ ...h })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white transition-colors cursor-pointer"
                            title="Editar datos del huésped"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminarHuesped(h)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Eliminar huésped"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* ==================================================================== */}
      {/* MODAL: REGISTRAR NUEVO HUÉSPED */}
      {/* ==================================================================== */}
      {modalNuevoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block">
                    Directorio Hotelero
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white">
                    Registrar Nuevo Huésped
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorModal && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{errorModal}</span>
              </div>
            )}

            <form onSubmit={handleCrearHuesped} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Carlos Andrés"
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Mamani Quispe"
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="CI">Cédula de Identidad (CI)</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="DNI">DNI Extranjero</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    N° de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentoIdentidad}
                    onChange={(e) => setDocumentoIdentidad(e.target.value)}
                    placeholder="6849102 LP"
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Nacionalidad
                  </label>
                  <input
                    type="text"
                    value={nacionalidad}
                    onChange={(e) => setNacionalidad(e.target.value)}
                    placeholder="Boliviana"
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+591 71234567"
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="huesped@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNuevoAbierto(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Huésped'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDITAR HUÉSPED */}
      {/* ==================================================================== */}
      {huespedEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                    Actualización de Ficha
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white">
                    Editar Datos del Huésped
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHuespedEditando(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={huespedEditando.nombres}
                    onChange={(e) =>
                      setHuespedEditando({ ...huespedEditando, nombres: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={huespedEditando.apellidos}
                    onChange={(e) =>
                      setHuespedEditando({ ...huespedEditando, apellidos: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Tipo Documento
                  </label>
                  <select
                    value={huespedEditando.tipo_documento}
                    onChange={(e) =>
                      setHuespedEditando({ ...huespedEditando, tipo_documento: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="CI">Cédula de Identidad (CI)</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="DNI">DNI Extranjero</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    N° de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={huespedEditando.documento_identidad}
                    onChange={(e) =>
                      setHuespedEditando({
                        ...huespedEditando,
                        documento_identidad: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Nacionalidad
                  </label>
                  <input
                    type="text"
                    value={huespedEditando.nacionalidad || ''}
                    onChange={(e) =>
                      setHuespedEditando({ ...huespedEditando, nacionalidad: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={huespedEditando.telefono || ''}
                    onChange={(e) =>
                      setHuespedEditando({ ...huespedEditando, telefono: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={huespedEditando.email || ''}
                  onChange={(e) =>
                    setHuespedEditando({ ...huespedEditando, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setHuespedEditando(null)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  {guardando ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: FICHA DETALLADA E HISTORIAL DE ESTANCIAS */}
      {/* ==================================================================== */}
      {huespedDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow">
                  {`${huespedDetalle.nombres[0] || ''}${huespedDetalle.apellidos[0] || ''}`.toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block">
                    Ficha de Huésped
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white">
                    {huespedDetalle.nombres} {huespedDetalle.apellidos}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHuespedDetalle(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos Personales y de Contacto */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400">Documento</div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {huespedDetalle.documento_identidad}
                </div>
                <div className="text-[10px] text-slate-500 uppercase">
                  {huespedDetalle.tipo_documento}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400">Nacionalidad</div>
                <div className="font-semibold text-white mt-0.5">
                  {huespedDetalle.nacionalidad || 'Boliviana'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400">Teléfono</div>
                <div className="font-mono font-semibold text-emerald-400 mt-0.5">
                  {huespedDetalle.telefono || 'No registrado'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400">Registrado en</div>
                <div className="font-semibold text-slate-300 mt-0.5">
                  {new Date(huespedDetalle.creado_en).toLocaleDateString('es-BO')}
                </div>
              </div>
            </div>

            {/* Historial de Reservas y Estancias */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Historial de Reservas y Estancias</span>
                </h4>
                <span className="text-xs text-slate-400">
                  {huespedDetalle.reservas?.length || 0} registros
                </span>
              </div>

              {!huespedDetalle.reservas || huespedDetalle.reservas.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 text-xs">
                  Este huésped aún no cuenta con reservas registradas en el sistema.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Habitación</th>
                        <th className="py-2.5 px-3">Fechas</th>
                        <th className="py-2.5 px-3 text-right">Alojamiento</th>
                        <th className="py-2.5 px-3 text-right">Consumos</th>
                        <th className="py-2.5 px-3 text-right">Total Estancia</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {huespedDetalle.reservas.map((r) => {
                        const totalAloj = Number(r.total_alojamiento || 0);
                        const totalCons = (r.consumos_reserva || []).reduce((acc, c) => {
                          const sub = Number(c.subtotal);
                          if (!isNaN(sub) && sub > 0) return acc + sub;
                          return acc + ((Number(c.cantidad) || 0) * (Number(c.precio_unitario) || 0));
                        }, 0);
                        const totalGran = totalAloj + totalCons;

                        return (
                          <tr key={r.id} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                              {r.codigo_reserva}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-white">
                              Hab. {r.habitaciones?.numero || 'N/A'} (Piso {r.habitaciones?.piso || '-'})
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {r.fecha_entrada} → {r.fecha_salida}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                              Bs. {totalAloj.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-300">
                              {totalCons > 0 ? `+ Bs. ${totalCons.toFixed(2)}` : 'Bs. 0.00'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                              Bs. {totalGran.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  r.estado === 'en_curso'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : r.estado === 'confirmada'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {r.estado}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-800">
              <button
                type="button"
                onClick={() => setHuespedDetalle(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};