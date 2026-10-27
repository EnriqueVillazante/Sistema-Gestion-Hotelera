import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { cache } from '../lib/cache';
import type { Perfil, RolUsuario, TurnoCaja } from '../types/database';

export interface DatosRegistroHuesped {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  tipo_documento?: string;
  documento_identidad: string;
  nacionalidad?: string;
  telefono?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  perfil: Perfil | null;
  rol: RolUsuario | null;
  turnoActivo: TurnoCaja | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registro: (
    datos: DatosRegistroHuesped
  ) => Promise<{ success: boolean; error?: string; requireVerification?: boolean }>;
  logout: () => Promise<void>;
  refrescarPerfil: () => Promise<void>;
  refrescarTurno: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  ACTIVE_TURNO: 'active_turno',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialización instantánea con caché local para evitar parpadeos
  const cachedProfile = cache.get<Perfil>(CACHE_KEYS.USER_PROFILE);
  const cachedTurno = cache.get<TurnoCaja>(CACHE_KEYS.ACTIVE_TURNO);

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(cachedProfile);
  const [turnoActivo, setTurnoActivo] = useState<TurnoCaja | null>(cachedTurno);
  const [loading, setLoading] = useState<boolean>(true);

  // Consultar turno activo de caja (si es recepcionista o admin)
  const consultarTurnoActivo = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('turnos_caja')
        .select('*')
        .eq('recepcionista_id', userId)
        .is('fecha_cierre', null)
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setTurnoActivo(data);
        cache.set(CACHE_KEYS.ACTIVE_TURNO, data, 120);
      } else {
        setTurnoActivo(null);
        cache.remove(CACHE_KEYS.ACTIVE_TURNO);
      }
    } catch (err) {
      console.error('[Auth] Error consultando turno activo:', err);
    }
  }, []);

  // Consultar perfil de usuario desde Supabase
  const consultarPerfil = useCallback(async (userId: string): Promise<Perfil | null> => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const esAdminPrincipal = userId === '384389b5-72bc-458a-a91e-003860a67f5f';

      if (esAdminPrincipal && (!data || data.rol !== 'admin')) {
        // Asegurar automáticamente rol admin para el usuario administrador principal
        const perfilAdmin: Perfil = {
          id: userId,
          nombre_completo: data?.nombre_completo || 'Administrador General',
          telefono: data?.telefono || null,
          rol: 'admin',
          activo: true,
          creado_en: data?.creado_en || new Date().toISOString(),
          email: data?.email || 'admin@hotelillimani.bo',
        };

        try {
          const { email: _emailAdmin, ...perfilDb } = perfilAdmin;
          await supabase.from('perfiles').upsert(perfilDb);
        } catch (e) {
          console.warn('[Auth] Nota al sincronizar perfil admin:', e);
        }

        setPerfil(perfilAdmin);
        cache.set(CACHE_KEYS.USER_PROFILE, perfilAdmin, 120);
        return perfilAdmin;
      }

      if (error) {
        console.error('[Auth] Error obteniendo perfil:', error);
        return null;
      }

      if (data) {
        setPerfil(data);
        cache.set(CACHE_KEYS.USER_PROFILE, data, 120);
        return data;
      }

      return null;
    } catch (err) {
      console.error('[Auth] Excepción al consultar perfil:', err);
      return null;
    }
  }, []);

  // Recarga manual de perfil
  const refrescarPerfil = useCallback(async () => {
    if (user?.id) {
      await consultarPerfil(user.id);
    }
  }, [user, consultarPerfil]);

  // Recarga manual de turno
  const refrescarTurno = useCallback(async () => {
    if (user?.id) {
      await consultarTurnoActivo(user.id);
    }
  }, [user, consultarTurnoActivo]);

  // Sincronización inicial con la sesión de Supabase
  useEffect(() => {
    let isMounted = true;

    async function inicializarSesion() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          const p = await consultarPerfil(currentSession.user.id);
          if (p && (p.rol === 'recepcionista' || p.rol === 'admin')) {
            await consultarTurnoActivo(currentSession.user.id);
          }
        } else {
          setSession(null);
          setUser(null);
          setPerfil(null);
          setTurnoActivo(null);
          cache.remove(CACHE_KEYS.USER_PROFILE);
          cache.remove(CACHE_KEYS.ACTIVE_TURNO);
        }
      } catch (error) {
        console.error('[Auth] Error inicializando sesión:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    inicializarSesion();

    // Escuchar cambios de estado en autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          const p = await consultarPerfil(newSession.user.id);
          if (p && (p.rol === 'recepcionista' || p.rol === 'admin')) {
            await consultarTurnoActivo(newSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setPerfil(null);
          setTurnoActivo(null);
          cache.clearAll();
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [consultarPerfil, consultarTurnoActivo]);

  // Función de inicio de sesión optimizada para respuesta instantánea
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setSession(data.session);
        setUser(data.user);

        // Perfil instantáneo (de caché o metadatos de auth)
        const cached = cache.get<Perfil>(CACHE_KEYS.USER_PROFILE);
        if (cached && cached.id === data.user.id) {
          setPerfil(cached);
        } else {
          const esAdmin = data.user.id === '384389b5-72bc-458a-a91e-003860a67f5f';
          const meta = data.user.user_metadata || {};
          const perfilInicial: Perfil = {
            id: data.user.id,
            nombre_completo:
              meta.nombre_completo || (esAdmin ? 'Administrador General' : (data.user.email?.split('@')[0] || 'Huésped')),
            telefono: meta.telefono || null,
            rol: esAdmin ? 'admin' : ((meta.rol as RolUsuario) || 'huesped'),
            activo: true,
            creado_en: new Date().toISOString(),
          };
          setPerfil(perfilInicial);
          cache.set(CACHE_KEYS.USER_PROFILE, perfilInicial, 120);
        }

        // Sincronizar en segundo plano sin retrasar la navegación
        consultarPerfil(data.user.id).then((p) => {
          if (p && (p.rol === 'recepcionista' || p.rol === 'admin')) {
            consultarTurnoActivo(data.user.id);
          }
        });
      }

      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error inesperado al iniciar sesión';
      return { success: false, error: errorMsg };
    }
  };

  // Función de registro (por defecto rol 'huesped')
  const registro = async (
    datos: DatosRegistroHuesped
  ): Promise<{ success: boolean; error?: string; requireVerification?: boolean }> => {
    try {
      setLoading(true);
      const nombreCompleto = `${datos.nombres.trim()} ${datos.apellidos.trim()}`;

      // 1. Crear el usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: datos.email,
        password: datos.password,
        options: {
          data: {
            nombre_completo: nombreCompleto,
            telefono: datos.telefono || null,
            rol: 'huesped',
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'No se pudo crear la cuenta de usuario.' };
      }

      const userId = authData.user.id;

      // 2. Crear perfil con rol huésped explícito
      const { error: perfilError } = await supabase.from('perfiles').upsert({
        id: userId,
        nombre_completo: nombreCompleto,
        telefono: datos.telefono || null,
        rol: 'huesped',
        activo: true,
      });

      if (perfilError) {
        console.warn('[Auth] Perfil creado vía trigger o pendiente de política:', perfilError);
      }

      // 3. Crear registro en padrón de huéspedes
      const { error: huespedError } = await supabase.from('huespedes').insert({
        usuario_id: userId,
        nombres: datos.nombres.trim(),
        apellidos: datos.apellidos.trim(),
        tipo_documento: datos.tipo_documento || 'CI',
        documento_identidad: datos.documento_identidad.trim(),
        nacionalidad: datos.nacionalidad || 'Boliviana',
        telefono: datos.telefono || null,
        email: datos.email.trim(),
      });

      if (huespedError) {
        console.warn('[Auth] Error registrando en tabla huespedes:', huespedError);
      }

      // 4. Si la sesión ya viene activa (email confirmation deshabilitado o auto-confirmado)
      if (authData.session) {
        setUser(authData.user);
        setSession(authData.session);
        await consultarPerfil(userId);
        return { success: true, requireVerification: false };
      }

      return { success: true, requireVerification: true };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error inesperado durante el registro';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Función de cierre de sesión instantánea
  const logout = async () => {
    // 1. Limpieza inmediata del estado y caché (sin esperar la red)
    setUser(null);
    setSession(null);
    setPerfil(null);
    setTurnoActivo(null);
    cache.clearAll();

    // 2. Notificar a Supabase en segundo plano
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] Error de red al cerrar sesión:', err);
    }
  };

  const rol = perfil?.rol ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        perfil,
        rol,
        turnoActivo,
        loading,
        login,
        registro,
        logout,
        refrescarPerfil,
        refrescarTurno,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
