import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Huesped } from '../../types/database';
import {
  UserCheck,
  ShieldCheck,
  Mail,
  Phone,
  FileText,
  Globe,
  LogOut,
  Calendar,
  Sparkles,
  Loader2
} from 'lucide-react';

interface PerfilUsuarioProps {
  onVerDiagnostico?: () => void;
}

export const PerfilUsuario: React.FC<PerfilUsuarioProps> = ({ onVerDiagnostico }) => {
  const { user, perfil, rol, logout } = useAuth();
  const [datosHuesped, setDatosHuesped] = useState<Huesped | null>(null);
  const [cargandoHuesped, setCargandoHuesped] = useState(false);

  useEffect(() => {
    async function cargarFichaHuesped() {
      if (!user?.id) return;
      setCargandoHuesped(true);
      try {
        const { data, error } = await supabase
          .from('huespedes')
          .select('*')
          .eq('usuario_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setDatosHuesped(data);
        }
      } catch (err) {
        console.error('Error cargando ficha de huésped:', err);
      } finally {
        setCargandoHuesped(false);
      }
    }

    if (rol === 'huesped') {
      cargarFichaHuesped();
    }
  }, [user, rol]);

  return (
    <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Cabecera del Perfil */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 px-6 sm:px-8 py-7 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 block mb-0.5">
                Gran Hotel Illimani ★★★★★
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {perfil?.nombre_completo || 'Huésped Registrado'}
              </h2>
              <p className="text-xs text-indigo-200 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            {rol || 'Huésped'}
          </span>
        </div>
      </div>

      {/* Contenido / Detalles del Huésped */}
      <div className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ficha de Huésped
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Cuenta Activa</span>
          </div>
        </div>

        {cargandoHuesped ? (
          <div className="py-6 flex items-center justify-center text-slate-400 gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Consultando ficha de huésped...</span>
          </div>
        ) : datosHuesped ? (
          <div className="grid grid-cols-2 gap-3.5 text-sm">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1">Documento de Identidad</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                {datosHuesped.tipo_documento}: {datosHuesped.documento_identidad}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1">Nacionalidad</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                {datosHuesped.nacionalidad || 'No indicada'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1">Teléfono de Contacto</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" />
                {datosHuesped.telefono || 'Sin teléfono'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 block mb-1">Fecha de Registro</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {new Date(datosHuesped.creado_en).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
            <p>
              Estás conectado con el correo <strong>{user?.email}</strong>. Tu rol en el SAGH es <strong>{rol || 'huesped'}</strong>.
            </p>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900 leading-relaxed">
          <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <span>
            Bienvenido al portal del huésped. Próximamente podrás revisar el catálogo de habitaciones, ver tus reservas activas y solicitar consumos a la habitación.
          </span>
        </div>

        {/* Acciones */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {onVerDiagnostico && (
            <button
              onClick={onVerDiagnostico}
              className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Verificar Conexión BD
            </button>
          )}

          <button
            onClick={() => logout()}
            className="w-full sm:flex-1 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-rose-200/60"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
