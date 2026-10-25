import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  Calendar,
  BedDouble,
  Sparkles,
  User,
  ChevronDown,
  ShieldCheck,
  PhoneCall,
  Crown,
} from 'lucide-react';
import type { ReservaConDetalle } from '../../types/database';

interface HuespedNavbarProps {
  reservaActiva: ReservaConDetalle | null;
  onVerPerfil: () => void;
  onIrAPanelAdmin?: () => void;
}

export const HuespedNavbar: React.FC<HuespedNavbarProps> = ({
  reservaActiva,
  onVerPerfil,
  onIrAPanelAdmin,
}) => {
  const { user, perfil, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Cerrar menú desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => {
      document.removeEventListener('mousedown', handleClickFuera);
    };
  }, []);

  // Calcular iniciales a partir del nombre o correo
  const obtenerIniciales = () => {
    const nombre = perfil?.nombre_completo || user?.email?.split('@')[0] || 'H';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.slice(0, 2).toUpperCase();
  };

  const nombreUsuario =
    perfil?.nombre_completo || user?.email?.split('@')[0] || 'Huésped';

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-xl border-b border-amber-500/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Logotipo Gran Hotel Illimani */}
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="Gran Hotel Illimani"
            className="h-12 sm:h-14 w-auto object-contain drop-shadow"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <span className="text-xs sm:text-sm font-serif font-black tracking-widest uppercase bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent block">
              Gran Hotel Illimani
            </span>
            <span className="text-[10px] text-amber-500/80 tracking-[0.2em] font-semibold block uppercase">
              ★★★★★ • Portal Huésped
            </span>
          </div>
        </div>

        {/* Estado Central de la Reserva / Habitación */}
        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner">
          <div className="flex items-center gap-2 text-xs">
            {reservaActiva?.estado === 'en_curso' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Hospedado en Hab. {reservaActiva.habitaciones?.numero || '302'}
              </span>
            ) : reservaActiva?.estado === 'confirmada' ? (
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Reserva Confirmada ({reservaActiva.codigo_reserva})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium">
                <BedDouble className="w-3.5 h-3.5 text-slate-500" />
                Sin Reserva Activa
              </span>
            )}
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-[11px] text-slate-400 capitalize">{fechaHoy}</span>
        </div>

        {/* Acceso a Panel Admin estrictamente reservado para Administradores */}
        <div className="flex items-center gap-3">
          {perfil?.rol === 'admin' && onIrAPanelAdmin && (
            <button
              onClick={onIrAPanelAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all cursor-pointer shadow-sm"
              title="Ir al Panel de Administración"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panel Admin</span>
            </button>
          )}

          {/* Menú Desplegable del Avatar de Usuario */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-2xl transition-all duration-200 border cursor-pointer ${
                menuAbierto
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 hover:border-amber-500/30'
              }`}
              title="Mi Cuenta y Opciones"
            >
              {/* Avatar con la inicial del nombre */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md ring-2 ring-amber-400/40">
                {obtenerIniciales()}
              </div>

              {/* Nombre y Rol (visible en pantallas medianas y grandes) */}
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-white block truncate max-w-[120px]">
                  {nombreUsuario}
                </span>
                <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>Huésped</span>
                </span>
              </div>

              {/* Flecha indicadora de menú */}
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  menuAbierto ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {/* Menú Desplegable Flotante */}
            {menuAbierto && (
              <div className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-amber-500/30 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Encabezado del Perfil */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/20 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-amber-500/20 flex-shrink-0">
                    {obtenerIniciales()}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-bold text-white truncate">
                      {nombreUsuario}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user?.email}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                      Huésped Verificado
                    </span>
                  </div>
                </div>

                {/* Opciones del Menú */}
                <div className="mt-2 space-y-1">
                  {/* Opción Admin SOLO visible si es Administrador */}
                  {perfil?.rol === 'admin' && onIrAPanelAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuAbierto(false);
                        onIrAPanelAdmin();
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all cursor-pointer font-bold text-xs"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-white">Panel de Administración</span>
                        <span className="text-[10px] text-amber-400/80 block">Gestionar trabajadores, rack y servicios</span>
                      </div>
                    </button>
                  )}

                  {/* Opción 1: Ver Perfil */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAbierto(false);
                      onVerPerfil();
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-200 hover:text-white transition-all cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">
                        Mi Perfil y Documentación
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Ver datos personales y nacionalidad
                      </span>
                    </div>
                  </button>

                {/* Opción 2: Estado de Habitación (Informativo rápido) */}
                {reservaActiva && (
                  <div className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-left">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <BedDouble className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-emerald-300">
                        Habitación {reservaActiva.habitaciones?.numero || 'Asignada'}
                      </span>
                      <span className="text-[10px] text-slate-400 block capitalize">
                        Estado: {reservaActiva.estado === 'en_curso' ? 'En Estadía' : 'Confirmada'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Opción 3: Concierge / Contacto */}
                <div className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-slate-400 text-xs">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-300 block">
                      Recepción y Concierge 24h
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Interno 100 • Asistencia personal
                    </span>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="my-2 border-t border-slate-800" />

              {/* Opción Destacada: Cerrar Sesión */}
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 transition-all border border-rose-500/20 cursor-pointer font-bold text-xs group"
              >
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 group-hover:bg-rose-700 group-hover:text-white transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);
};
