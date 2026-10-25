import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/auth/Login';
import { RegistroHuesped } from './components/auth/RegistroHuesped';
import { DashboardHuesped } from './components/dashboard/DashboardHuesped';
import { DashboardAdmin } from './components/admin/DashboardAdmin';
import { DashboardRecepcion } from './components/recepcion/DashboardRecepcion';
import { DashboardLimpieza } from './components/limpieza/DashboardLimpieza';

export type TipoVistaUsuario = 'admin' | 'recepcion' | 'limpieza' | 'huesped';

function AppContent() {
  const { user, rol } = useAuth();
  // Vistas para usuario no autenticado: siempre inicia en 'login'
  const [modoAuth, setModoAuth] = useState<'login' | 'registro'>('login');
  // Estado para alternar entre vistas operativas
  const [vistaActiva, setVistaActiva] = useState<TipoVistaUsuario | null>(null);

  // Asegurar que al cerrar sesión siempre retorne a la pantalla de Login y resetee vistas
  useEffect(() => {
    if (!user) {
      setModoAuth('login');
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

  // Pantalla de Login / Registro limpia con imagen de fondo "Fondo.jpg"
  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative selection:bg-amber-500 selection:text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/Fondo.jpg')` }}
    >
      {/* Capa oscura sofisticada para resaltar el formulario con legibilidad óptima */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[3px] pointer-events-none" />

      {/* Contenedor Centrado sin botones ruidosos ni menús */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center my-auto">
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