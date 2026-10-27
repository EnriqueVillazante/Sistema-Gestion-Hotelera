import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { Login } from './components/auth/Login';
import { RegistroHuesped } from './components/auth/RegistroHuesped';
import { DashboardHuesped } from './components/dashboard/DashboardHuesped';
import { DashboardAdmin } from './components/admin/DashboardAdmin';
import { DashboardRecepcion } from './components/recepcion/DashboardRecepcion';
import { DashboardLimpieza } from './components/limpieza/DashboardLimpieza';

export type TipoVistaUsuario = 'admin' | 'recepcion' | 'limpieza' | 'huesped';

function AppContent() {
  const { user, rol } = useAuth();
  // Vistas para usuario no autenticado: inicia en 'landing' pública
  const [modoAuth, setModoAuth] = useState<'landing' | 'login' | 'registro'>('landing');
  // Estado para alternar entre vistas operativas
  const [vistaActiva, setVistaActiva] = useState<TipoVistaUsuario | null>(null);

  // Asegurar que al cerrar sesión retorne a la Landing Page y resetee vistas
  useEffect(() => {
    if (!user) {
      setModoAuth('landing');
      setVistaActiva(null);
    }
  }, [user]);

  // Si el usuario está autenticado, determinar la vista según su rol estricto
  if (user) {
    const esAdmin = rol === 'admin';

    // Determinar la vista por defecto según su rol en la base de datos
    const rolPorDefecto: TipoVistaUsuario =
      rol === 'admin'
        ? 'admin'
        : rol === 'recepcionista'
        ? 'recepcion'
        : rol === 'limpieza'
        ? 'limpieza'
        : 'huesped';

    // SEGURIDAD: Solo un usuario con rol 'admin' puede cambiar de vista para supervisión.
    // Un huésped, recepcionista o personal de limpieza NUNCA puede acceder al panel de administración.
    const vistaEfectiva: TipoVistaUsuario = esAdmin
      ? (vistaActiva ?? 'admin')
      : rolPorDefecto;

    if (vistaEfectiva === 'admin') {
      return (
        <DashboardAdmin
          onIrAVistaHuesped={() => setVistaActiva('huesped')}
          onIrAVista={(v) => setVistaActiva(v)}
        />
      );
    }

    if (vistaEfectiva === 'recepcion') {
      return (
        <DashboardRecepcion
          onIrAVista={esAdmin ? (v) => setVistaActiva(v) : undefined}
        />
      );
    }

    if (vistaEfectiva === 'limpieza') {
      return (
        <DashboardLimpieza
          onIrAVista={esAdmin ? (v) => setVistaActiva(v) : undefined}
        />
      );
    }

    // Portal del Huésped: Únicamente el Administrador en modo supervisión tiene el botón de volver al admin
    return (
      <DashboardHuesped
        onIrAPanelAdmin={esAdmin ? () => setVistaActiva('admin') : undefined}
      />
    );
  }

  // 1. Si no está autenticado y está en modo 'landing': Portal 5 Estrellas
  if (modoAuth === 'landing') {
    return (
      <LandingPage
        onIniciarSesion={() => setModoAuth('login')}
        onRegistrarse={() => setModoAuth('registro')}
        onAccesoStaff={() => setModoAuth('login')}
      />
    );
  }

  // 2. Pantalla de Login / Registro con botón para volver al portal del hotel
  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative selection:bg-amber-500 selection:text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/Fondo.jpg')` }}
    >
      {/* Capa oscura sofisticada para resaltar el formulario con legibilidad óptima */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[3px] pointer-events-none" />

      {/* Botón superior para volver al portal principal */}
      <div className="relative z-20 w-full max-w-md flex justify-start mb-4">
        <button
          onClick={() => setModoAuth('landing')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          <span>← Volver al Portal del Hotel</span>
        </button>
      </div>

      {/* Contenedor Centrado */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        {modoAuth === 'login' ? (
          <Login onIrARegistro={() => setModoAuth('registro')} />
        ) : (
          <RegistroHuesped onIrALogin={() => setModoAuth('login')} />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}