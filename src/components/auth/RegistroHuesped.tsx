import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SelectorPais } from './SelectorPais';
import { type Pais } from '../../data/paises';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

interface RegistroHuespedProps {
  onIrALogin: () => void;
}

export const RegistroHuesped: React.FC<RegistroHuespedProps> = ({ onIrALogin }) => {
  const { registro } = useAuth();

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    tipo_documento: 'CI',
    documento_identidad: '',
    nacionalidad: 'Boliviana',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registroExitoso, setRegistroExitoso] = useState<boolean>(false);
  const [requiereVerificacion, setRequiereVerificacion] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSeleccionarPais = (pais: Pais) => {
    setFormData((prev) => ({
      ...prev,
      nacionalidad: pais.gentilicio,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      setErrorMsg('Por favor ingresa tus nombres y apellidos.');
      return;
    }

    if (!formData.documento_identidad.trim()) {
      setErrorMsg('El documento de identidad es obligatorio para registrar la ficha de huésped.');
      return;
    }

    if (!formData.email.trim() || !formData.password) {
      setErrorMsg('El correo y la contraseña son requeridos.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    const res = await registro({
      email: formData.email,
      password: formData.password,
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      tipo_documento: formData.tipo_documento,
      documento_identidad: formData.documento_identidad,
      nacionalidad: formData.nacionalidad,
      telefono: formData.telefono,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Ocurrió un error al registrar la cuenta.');
    } else {
      setRegistroExitoso(true);
      if (res.requireVerification) {
        setRequiereVerificacion(true);
      }
    }
  };

  if (registroExitoso) {
    return (
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/80 p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          ¡Cuenta de Huésped Creada!
        </h2>

        {requiereVerificacion ? (
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Hemos enviado un enlace de confirmación a tu correo{' '}
            <strong className="text-slate-900">{formData.email}</strong>. Por favor revisa tu bandeja de entrada para activar tu cuenta.
          </p>
        ) : (
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Tu registro como <strong className="text-indigo-600">Huésped</strong> se ha completado correctamente en el SAGH. Tu sesión ya está activa.
          </p>
        )}

        <div className="mt-8 flex justify-center">
          <button
            onClick={onIrALogin}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            Continuar al Sistema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/80 p-8 sm:p-9">
      {/* Botón Volver a Iniciar Sesión */}
      <button
        type="button"
        onClick={onIrALogin}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-5 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Ya tengo cuenta • Iniciar Sesión</span>
      </button>

      {/* Cabecera del Formulario */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-amber-600 block mb-0.5">
            Gran Hotel Illimani
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registro de Huésped</h2>
          <p className="text-xs text-slate-500">Crea tu cuenta para reservas y consumos</p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Rol: Huésped</span>
        </div>
      </div>

      {/* Mensaje de Error */}
      {errorMsg && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-700 text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombres y Apellidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Nombres *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="nombres"
                required
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Ej. Rodrigo"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Apellidos *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="apellidos"
                required
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Ej. Morales Vega"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Tipo de Documento y Número */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Tipo Doc. *
            </label>
            <select
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 cursor-pointer"
            >
              <option value="CI">CI (Cédula)</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="DNI">DNI</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Número de Identidad *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="documento_identidad"
                required
                value={formData.documento_identidad}
                onChange={handleChange}
                placeholder="Ej. 6849201 LP"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Nacionalidad con banderas y Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Nacionalidad (País) *
            </label>
            <SelectorPais
              valorSeleccionado={formData.nacionalidad}
              alSeleccionar={handleSeleccionarPais}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Teléfono / WhatsApp
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej. +591 71234567"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Correo Electrónico */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Correo Electrónico (Usuario) *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="huesped@correo.com"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
            />
          </div>
        </div>

        {/* Contraseña y Confirmar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Confirmar Contraseña *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite la contraseña"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creando cuenta de Huésped...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Completar Registro</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
