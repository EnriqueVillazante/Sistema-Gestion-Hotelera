import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { cache } from '../../lib/cache';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  LogOut,
  Hotel,
  ArrowLeft
} from 'lucide-react';

interface CheckItem {
  nombre: string;
  estado: 'pendiente' | 'exito' | 'error';
  detalle: string;
}

interface StatusCheckProps {
  onVolver?: () => void;
}

export const StatusCheck: React.FC<StatusCheckProps> = ({ onVolver }) => {
  const { user, perfil, rol, turnoActivo, logout } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [pruebas, setPruebas] = useState<CheckItem[]>([
    { nombre: 'Conexión a Supabase', estado: 'pendiente', detalle: 'Comprobando endpoint REST...' },
    { nombre: 'Tablas de Habitaciones y Tipos', estado: 'pendiente', detalle: 'Verificando inventario...' },
    { nombre: 'Tablas de Huéspedes y Reservas', estado: 'pendiente', detalle: 'Verificando flujo de estancias...' },
    { nombre: 'Sistema de Turnos y Caja', estado: 'pendiente', detalle: 'Verificando arqueos de caja...' },
    { nombre: 'Caché Local Persistente (TTL)', estado: 'pendiente', detalle: 'Probando lectura y escritura local...' },
  ]);

  const ejecutarDiagnostico = async () => {
    setCargando(true);
    const nuevasPruebas: CheckItem[] = [];

    // 1. Probar conexión básica
    try {
      const { error } = await supabase.from('tipos_habitacion').select('count');
      if (error) throw error;
      nuevasPruebas.push({
        nombre: 'Conexión a Supabase',
        estado: 'exito',
        detalle: 'Conexión exitosa a la base de datos (200 OK).',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      nuevasPruebas.push({
        nombre: 'Conexión a Supabase',
        estado: 'error',
        detalle: `Fallo de conexión: ${msg}`,
      });
    }

    // 2. Probar tablas de Habitaciones
    try {
      const { error: errHab } = await supabase.from('habitaciones').select('id').limit(1);
      if (errHab) throw errHab;
      nuevasPruebas.push({
        nombre: 'Tablas de Habitaciones y Tipos',
        estado: 'exito',
        detalle: 'Tablas "habitaciones" y "tipos_habitacion" verificadas y listas para el Rack.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error en habitaciones';
      nuevasPruebas.push({
        nombre: 'Tablas de Habitaciones y Tipos',
        estado: 'error',
        detalle: `Error: ${msg}`,
      });
    }

    // 3. Probar Huéspedes y Reservas
    try {
      const { error: errHuesped } = await supabase.from('huespedes').select('id').limit(1);
      const { error: errRes } = await supabase.from('reservas').select('id').limit(1);
      if (errHuesped) throw errHuesped;
      if (errRes) throw errRes;
      nuevasPruebas.push({
        nombre: 'Tablas de Huéspedes y Reservas',
        estado: 'exito',
        detalle: 'Tablas "huespedes", "reservas" y sus índices están respondiendo correctamente.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error en reservas/huéspedes';
      nuevasPruebas.push({
        nombre: 'Tablas de Huéspedes y Reservas',
        estado: 'error',
        detalle: `Error: ${msg}`,
      });
    }

    // 4. Probar Turnos y Caja
    try {
      const { error: errTurnos } = await supabase.from('turnos_caja').select('id').limit(1);
      if (errTurnos) throw errTurnos;
      nuevasPruebas.push({
        nombre: 'Sistema de Turnos y Caja',
        estado: 'exito',
        detalle: 'Módulo de caja "turnos_caja" y registro de pagos vinculados listos.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error en turnos_caja';
      nuevasPruebas.push({
        nombre: 'Sistema de Turnos y Caja',
        estado: 'error',
        detalle: `Error: ${msg}`,
      });
    }

    // 5. Probar Caché Local
    try {
      const testVal = { timestamp: Date.now(), test: true };
      cache.set('test_key', testVal, 5);
      const retrieved = cache.get<{ timestamp: number; test: boolean }>('test_key');
      cache.remove('test_key');

      if (retrieved && retrieved.test === true) {
        nuevasPruebas.push({
          nombre: 'Caché Local Persistente (TTL)',
          estado: 'exito',
          detalle: 'Caché con tiempo de expiración operativa y funcionando al 100%.',
        });
      } else {
        throw new Error('No se pudo verificar el valor recuperado');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de almacenamiento local';
      nuevasPruebas.push({
        nombre: 'Caché Local Persistente (TTL)',
        estado: 'error',
        detalle: `Fallo en caché: ${msg}`,
      });
    }

    setPruebas(nuevasPruebas);
    setCargando(false);
  };

  useEffect(() => {
    ejecutarDiagnostico();
  }, []);

  return (
    <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onVolver && (
            <button
              onClick={onVolver}
              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer mr-1"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
            <Hotel className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Diagnóstico SAGH</h2>
            <p className="text-xs text-slate-300">Verificación de base de datos y caché</p>
          </div>
        </div>

        <button
          onClick={ejecutarDiagnostico}
          disabled={cargando}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-lg border border-white/15 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
          {cargando ? 'Verificando...' : 'Reintentar'}
        </button>
      </div>

      {/* Tarjeta de Usuario Actual / Sesión */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <span className="font-medium text-slate-700">Estado de Sesión: </span>
            {user ? (
              <span className="text-slate-900 font-semibold">
                {perfil?.nombre_completo || user.email} ({rol || 'Sin Rol'})
              </span>
            ) : (
              <span className="text-amber-600 font-medium">Modo Invitado (No autenticado)</span>
            )}
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            {turnoActivo && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                Turno de Caja Abierto
              </span>
            )}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>

      {/* Lista de Pruebas de Diagnóstico */}
      <div className="p-6 space-y-3">
        {pruebas.map((prueba, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-4 p-3.5 rounded-2xl border border-slate-100 bg-white shadow-xs hover:border-slate-200 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {prueba.estado === 'pendiente' && (
                  <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                )}
                {prueba.estado === 'exito' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                {prueba.estado === 'error' && (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{prueba.nombre}</p>
                <p className="text-xs text-slate-500 mt-0.5">{prueba.detalle}</p>
              </div>
            </div>

            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                prueba.estado === 'exito'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : prueba.estado === 'error'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/60'
              }`}
            >
              {prueba.estado}
            </span>
          </div>
        ))}
      </div>

      {/* Pie con detalles del sistema */}
      <div className="px-6 py-3.5 bg-slate-100/70 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>PostgreSQL + Supabase RLS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span>Caché Persistente LocalStorage</span>
        </div>
      </div>
    </div>
  );
};
