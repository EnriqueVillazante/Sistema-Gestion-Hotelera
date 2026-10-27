import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Crown,
  BellRing,
  Sparkles,
  RefreshCw,
  Lock,
  User,
  Power,
  Shield,
} from 'lucide-react';
import type { Perfil, RolUsuario } from '../../types/database';
import {
  obtenerTrabajadores,
  registrarNuevoTrabajador,
  alternarEstadoTrabajador,
  cambiarRolTrabajador,
} from '../../services/trabajadoresService';

export const GestionTrabajadores: React.FC = () => {
  const [trabajadores, setTrabajadores] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Estado para el modal de nuevo trabajador
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState<RolUsuario>('recepcionista');
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Estado para modal de credenciales generadas
  const [credencialesGeneradas, setCredencialesGeneradas] = useState<{
    nombre: string;
    email: string;
    password: string;
    rol: RolUsuario;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Cargar trabajadores al montar el componente
  const cargarDatos = async () => {
    setCargando(true);
    const lista = await obtenerTrabajadores();
    setTrabajadores(lista);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para autogenerar contraseña segura y amigable
  const generarPasswordSegura = () => {
    const prefijos = ['Illimani', 'Hotel', 'Andes', 'Nevado', 'Royal'];
    const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
    const numero = Math.floor(1000 + Math.random() * 9000);
    const pass = `${prefijo}${numero}*`;
    setPassword(pass);
  };

  // Autocompletar dominio corporativo
  const sugerirEmail = (nombre: string) => {
    const slug = nombre
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '.');
    if (slug) {
      setEmail(`${slug}@hotelillimani.bo`);
    }
  };

  // Manejar creación de trabajador
  const handleCrearTrabajador = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorModal(null);

    if (!nombreCompleto.trim() || !email.trim() || !password.trim()) {
      setErrorModal('Por favor completa los campos obligatorios: Nombre, Correo y Contraseña.');
      return;
    }

    if (password.length < 6) {
      setErrorModal('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setGuardando(true);
    const res = await registrarNuevoTrabajador({
      nombre_completo: nombreCompleto,
      email: email,
      password: password,
      telefono: telefono,
      rol: rolSeleccionado,
    });
    setGuardando(false);

    if (res.success && res.credenciales) {
      setCredencialesGeneradas({
        nombre: nombreCompleto,
        email: res.credenciales.email,
        password: res.credenciales.password,
        rol: res.credenciales.rol,
      });

      // Limpiar formulario y cerrar modal de registro
      setNombreCompleto('');
      setEmail('');
      setPassword('');
      setTelefono('');
      setRolSeleccionado('recepcionista');
      setModalAbierto(false);

      // Recargar lista
      cargarDatos();
    } else {
      setErrorModal(res.error || 'Ocurrió un error al registrar el trabajador.');
    }
  };

  // Copiar credenciales al portapapeles
  const copiarCredenciales = () => {
    if (!credencialesGeneradas) return;
    const texto = `*GRAN HOTEL ILLIMANI ★★★★★*\nAcceso de Personal Oficial\n\n👤 Colaborador: ${credencialesGeneradas.nombre}\n💼 Rol: ${credencialesGeneradas.rol.toUpperCase()}\n📧 Correo de Ingreso: ${credencialesGeneradas.email}\n🔑 Contraseña Inicial: ${credencialesGeneradas.password}\n\nIngresa al sistema en: ${window.location.origin}`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  // Cambiar estado activo/inactivo con sincronización a Supabase
  const handleToggleEstado = async (id: string, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    setTrabajadores((prev) =>
      prev.map((t) => (t.id === id ? { ...t, activo: nuevoEstado } : t))
    );
    const res = await alternarEstadoTrabajador(id, nuevoEstado);
    if (!res.success) {
      setTrabajadores((prev) =>
        prev.map((t) => (t.id === id ? { ...t, activo: estadoActual } : t))
      );
    }
  };

  // Cambiar rol de trabajador con sincronización a Supabase
  const handleCambiarRol = async (id: string, nuevoRol: RolUsuario) => {
    const rolAnterior = trabajadores.find((t) => t.id === id)?.rol;
    setTrabajadores((prev) =>
      prev.map((t) => (t.id === id ? { ...t, rol: nuevoRol } : t))
    );
    const res = await cambiarRolTrabajador(id, nuevoRol);
    if (!res.success && rolAnterior) {
      setTrabajadores((prev) =>
        prev.map((t) => (t.id === id ? { ...t, rol: rolAnterior } : t))
      );
    }
  };

  // Filtros de búsqueda
  const trabajadoresFiltrados = trabajadores.filter((t) => {
    const coincideTexto =
      t.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(busqueda.toLowerCase())) ||
      (t.telefono && t.telefono.includes(busqueda));

    const coincideRol = filtroRol === 'todos' || t.rol === filtroRol;
    const coincideEstado =
      filtroEstado === 'todos' ||
      (filtroEstado === 'activos' && t.activo) ||
      (filtroEstado === 'inactivos' && !t.activo);

    return coincideTexto && coincideRol && coincideEstado;
  });

  // Métricas rápidas de personal
  const conteoAdmin = trabajadores.filter((t) => t.rol === 'admin').length;
  const conteoRecepcion = trabajadores.filter((t) => t.rol === 'recepcionista').length;
  const conteoLimpieza = trabajadores.filter((t) => t.rol === 'limpieza').length;
  const conteoActivos = trabajadores.filter((t) => t.activo).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cabecera Principal y Botón de Acción */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              Control de Personal y Seguridad
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sincronizado con Supabase DB
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Gestión de Trabajadores y Perfiles
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Nómina oficial de colaboradores conectada a la base de datos de Supabase. Controla accesos, asigna roles y crea cuentas institucionales.
          </p>
        </div>

        <button
          onClick={() => {
            generarPasswordSegura();
            setModalAbierto(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>Dar de Alta Nuevo Trabajador</span>
        </button>
      </div>

      {/* Tarjetas de Métricas de Personal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Plantilla Activa
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
            {conteoActivos} <span className="text-xs text-slate-400 font-normal">de {trabajadores.length}</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Con acceso habilitado</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recepción y Caja
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <BellRing className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-400 mt-2">
            {conteoRecepcion}
          </div>
          <div className="text-xs text-slate-400 mt-1">Check-in, Check-out y Cobros</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Housekeeping / Limpieza
            </span>
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-teal-400 mt-2">
            {conteoLimpieza}
          </div>
          <div className="text-xs text-slate-400 mt-1">Aseo, Rack y Mantenimiento</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/70 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Administradores
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Crown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 mt-2">
            {conteoAdmin}
          </div>
          <div className="text-xs text-slate-400 mt-1">Control gerencial total</div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo corporativo o teléfono..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/60 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500/60 cursor-pointer"
          >
            <option value="todos">Todos los Roles</option>
            <option value="recepcionista">🛎️ Recepción</option>
            <option value="limpieza">🧹 Limpieza</option>
            <option value="admin">👑 Administrador</option>
            <option value="huesped">🏨 Huésped</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500/60 cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>

          <button
            onClick={cargarDatos}
            title="Recargar lista"
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Lista / Tabla de Trabajadores */}
      <div className="overflow-hidden rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
              <tr>
                <th className="py-3.5 px-4 sm:px-6 font-semibold">Colaborador</th>
                <th className="py-3.5 px-4 font-semibold">Contacto</th>
                <th className="py-3.5 px-4 font-semibold">Rol Asignado</th>
                <th className="py-3.5 px-4 font-semibold text-center">Estado</th>
                <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {cargando ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    Cargando nómina de trabajadores...
                  </td>
                </tr>
              ) : trabajadoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
                    No se encontraron trabajadores que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                trabajadoresFiltrados.map((trabajador) => {
                  const iniciales = trabajador.nombre_completo
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  // Configuración de estilo por rol
                  const rolConfig = {
                    admin: {
                      nombre: 'Administrador',
                      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                      icon: Crown,
                      avatarBg: 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black',
                    },
                    recepcionista: {
                      nombre: 'Recepcionista',
                      badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                      icon: BellRing,
                      avatarBg: 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold',
                    },
                    limpieza: {
                      nombre: 'Limpieza / Housekeeping',
                      badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
                      icon: Sparkles,
                      avatarBg: 'bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold',
                    },
                    huesped: {
                      nombre: 'Huésped',
                      badge: 'bg-slate-700 text-slate-300 border-slate-600',
                      icon: User,
                      avatarBg: 'bg-slate-700 text-white font-bold',
                    },
                  }[trabajador.rol] || {
                    nombre: trabajador.rol,
                    badge: 'bg-slate-700 text-slate-300 border-slate-600',
                    icon: User,
                    avatarBg: 'bg-slate-700 text-white font-bold',
                  };

                  const RolIcon = rolConfig.icon;

                  return (
                    <tr
                      key={trabajador.id}
                      className={`hover:bg-slate-700/30 transition-colors ${
                        !trabajador.activo ? 'opacity-60 bg-slate-900/30' : ''
                      }`}
                    >
                      {/* Nombre y Avatar */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-md flex-shrink-0 ${rolConfig.avatarBg}`}
                          >
                            {iniciales || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {trabajador.nombre_completo}
                              {!trabajador.activo && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {trabajador.email ? (
                                <>
                                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{trabajador.email}</span>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-500">
                                  Registrado: {new Date(trabajador.creado_en).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-4 px-4 text-xs text-slate-300">
                        {trabajador.telefono ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{trabajador.telefono}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No registrado</span>
                        )}
                      </td>

                      {/* Rol con selector rápido */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${rolConfig.badge}`}
                          >
                            <RolIcon className="w-3.5 h-3.5" />
                            {rolConfig.nombre}
                          </span>

                          <select
                            value={trabajador.rol}
                            onChange={(e) =>
                              handleCambiarRol(trabajador.id, e.target.value as RolUsuario)
                            }
                            title="Cambiar rol"
                            className="bg-slate-900/70 border border-slate-700 hover:border-amber-500/50 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none transition-colors cursor-pointer"
                          >
                            <option value="recepcionista">Recepción</option>
                            <option value="limpieza">Limpieza</option>
                            <option value="admin">Admin</option>
                            <option value="huesped">Huésped</option>
                          </select>
                        </div>
                      </td>

                      {/* Estado con botón toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleEstado(trabajador.id, trabajador.activo)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            trabajador.activo
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {trabajador.activo ? 'Activo' : 'Desactivado'}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => {
                            setCredencialesGeneradas({
                              nombre: trabajador.nombre_completo,
                              email: trabajador.email || `ID: ${trabajador.id}`,
                              password: '(Gestionada en Supabase Auth)',
                              rol: trabajador.rol,
                            });
                          }}
                          title="Ver y copiar formato de acceso"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-medium transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Ficha</span>
                        </button>
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
      {/* MODAL: DAR DE ALTA NUEVO TRABAJADOR */}
      {/* ==================================================================== */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1 border border-amber-500/25">
                  <UserPlus className="w-3.5 h-3.5" />
                  Alta Oficial de Personal
                </div>
                <h3 className="text-xl font-serif font-bold text-white">
                  Registrar Nuevo Colaborador
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Crea su perfil y credenciales. Al iniciar sesión ingresará directamente a su módulo.
                </p>
              </div>

              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error del formulario */}
            {errorModal && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{errorModal}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleCrearTrabajador} className="mt-5 space-y-4">
              {/* Selector Visual de Rol */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Rol y Permisos en el Hotel *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Recepcionista */}
                  <button
                    type="button"
                    onClick={() => setRolSeleccionado('recepcionista')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      rolSeleccionado === 'recepcionista'
                        ? 'bg-blue-500/20 border-blue-500 text-white ring-2 ring-blue-500/30'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <BellRing
                      className={`w-5 h-5 mb-2 ${
                        rolSeleccionado === 'recepcionista' ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    />
                    <div className="text-xs font-bold">Recepción</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Check-in y Caja</div>
                  </button>

                  {/* Limpieza */}
                  <button
                    type="button"
                    onClick={() => setRolSeleccionado('limpieza')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      rolSeleccionado === 'limpieza'
                        ? 'bg-teal-500/20 border-teal-500 text-white ring-2 ring-teal-500/30'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Sparkles
                      className={`w-5 h-5 mb-2 ${
                        rolSeleccionado === 'limpieza' ? 'text-teal-400' : 'text-slate-400'
                      }`}
                    />
                    <div className="text-xs font-bold">Limpieza</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Housekeeping</div>
                  </button>

                  {/* Administrador */}
                  <button
                    type="button"
                    onClick={() => setRolSeleccionado('admin')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      rolSeleccionado === 'admin'
                        ? 'bg-amber-500/20 border-amber-500 text-white ring-2 ring-amber-500/30'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Crown
                      className={`w-5 h-5 mb-2 ${
                        rolSeleccionado === 'admin' ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    />
                    <div className="text-xs font-bold">Admin</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Control Total</div>
                  </button>
                </div>
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={nombreCompleto}
                    onChange={(e) => {
                      setNombreCompleto(e.target.value);
                      if (!email) sugerirEmail(e.target.value);
                    }}
                    placeholder="Ej. Juan Pérez"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Correo Electrónico Corporativo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Correo Electrónico (Login) *
                  </label>
                  <button
                    type="button"
                    onClick={() => sugerirEmail(nombreCompleto)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Sugerir @hotelillimani.bo
                  </button>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre.apellido@hotelillimani.bo"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Contraseña Inicial */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Contraseña Inicial *
                  </label>
                  <button
                    type="button"
                    onClick={generarPasswordSegura}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Generar segura
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Teléfono / WhatsApp */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Teléfono / WhatsApp (Opcional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+591 71234567"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Botones de acción del Modal */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 stroke-[2.5]" />
                      <span>Registrar Trabajador</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREDENCIALES CREADAS EXITOSAMENTE */}
      {/* ==================================================================== */}
      {credencialesGeneradas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h3 className="text-xl font-serif font-bold text-white">
              ¡Trabajador Dado de Alta!
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Las credenciales oficiales han sido generadas. Entrégale estos datos al colaborador para que inicie sesión en el sistema:
            </p>

            {/* Ficha de Credenciales */}
            <div className="my-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-left font-mono text-xs space-y-2">
              <div className="text-slate-400 flex justify-between">
                <span>Colaborador:</span>
                <span className="text-white font-sans font-semibold">
                  {credencialesGeneradas.nombre}
                </span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Rol:</span>
                <span className="text-amber-400 uppercase font-bold">
                  {credencialesGeneradas.rol}
                </span>
              </div>
              <div className="pt-1 border-t border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase">Correo de Acceso:</span>
                <span className="text-white font-bold select-all">
                  {credencialesGeneradas.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Contraseña Inicial:</span>
                <span className="text-amber-300 font-bold select-all bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 inline-block">
                  {credencialesGeneradas.password}
                </span>
              </div>
            </div>

            {/* Botón de Copiar */}
            <div className="flex flex-col gap-2">
              <button
                onClick={copiarCredenciales}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡Credenciales Copiadas!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.5]" />
                    <span>Copiar Credenciales para Enviar</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCredencialesGeneradas(null)}
                className="w-full py-2.5 px-4 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
