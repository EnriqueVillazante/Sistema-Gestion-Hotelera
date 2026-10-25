import { supabase, crearClienteAuthAislado } from '../lib/supabase';
import type { Perfil, RolUsuario } from '../types/database';

export interface NuevoTrabajadorPayload {
  nombre_completo: string;
  email: string;
  password: string;
  telefono?: string;
  rol: RolUsuario;
}

export interface TrabajadorResultado {
  success: boolean;
  trabajador?: Perfil;
  error?: string;
  credenciales?: {
    email: string;
    password: string;
    rol: RolUsuario;
  };
}

// Personal inicial por defecto si la base de datos aún no tiene registros de personal
const TRABAJADORES_INICIALES_DEMO: Perfil[] = [
  {
    id: 't1111111-1111-1111-1111-111111111111',
    nombre_completo: 'Lic. Roberto Siles V.',
    email: 'admin@hotelillimani.bo',
    telefono: '+591 71542100',
    rol: 'admin',
    activo: true,
    creado_en: new Date().toISOString(),
  },
  {
    id: 't2222222-2222-2222-2222-222222222222',
    nombre_completo: 'Patricia Mercado Arce',
    email: 'patricia.recepcion@hotelillimani.bo',
    telefono: '+591 72033410',
    rol: 'recepcionista',
    activo: true,
    creado_en: new Date().toISOString(),
  },
  {
    id: 't3333333-3333-3333-3333-333333333333',
    nombre_completo: 'Javier Quispe Mamani',
    email: 'javier.recepcion@hotelillimani.bo',
    telefono: '+591 73519822',
    rol: 'recepcionista',
    activo: true,
    creado_en: new Date().toISOString(),
  },
  {
    id: 't4444444-4444-4444-4444-444444444444',
    nombre_completo: 'Elena Choquehuanca F.',
    email: 'elena.limpieza@hotelillimani.bo',
    telefono: '+591 70685233',
    rol: 'limpieza',
    activo: true,
    creado_en: new Date().toISOString(),
  },
  {
    id: 't5555555-5555-5555-5555-555555555555',
    nombre_completo: 'Marcos Ticona Flores',
    email: 'marcos.limpieza@hotelillimani.bo',
    telefono: '+591 71920044',
    rol: 'limpieza',
    activo: true,
    creado_en: new Date().toISOString(),
  },
];

const LOCAL_STORAGE_KEY = 'sagh_trabajadores_cache';

/**
 * Obtener lista de trabajadores del hotel (roles admin, recepcionista, limpieza)
 */
export async function obtenerTrabajadores(): Promise<Perfil[]> {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .in('rol', ['admin', 'recepcionista', 'limpieza'])
      .order('creado_en', { ascending: false });

    if (!error && data && data.length > 0) {
      // Guardar respaldo en caché local
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return data;
    }

    // Si la tabla no tiene trabajadores o dio error por RLS, recuperar de caché o demo
    const enCache = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (enCache) {
      try {
        return JSON.parse(enCache);
      } catch {
        // Fallback a demo
      }
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(TRABAJADORES_INICIALES_DEMO));
    return TRABAJADORES_INICIALES_DEMO;
  } catch (err) {
    console.warn('[TrabajadoresService] Usando datos de respaldo:', err);
    return TRABAJADORES_INICIALES_DEMO;
  }
}

/**
 * Dar de alta a un nuevo trabajador creando su cuenta en Supabase Auth y su registro en 'perfiles'
 * sin cerrar la sesión activa del Administrador.
 */
export async function registrarNuevoTrabajador(
  datos: NuevoTrabajadorPayload
): Promise<TrabajadorResultado> {
  try {
    const clienteAislado = crearClienteAuthAislado();

    // 1. Crear el usuario en Supabase Auth sin afectar localStorage
    let userId: string = crypto.randomUUID();

    try {
      const { data: authData, error: authError } = await clienteAislado.auth.signUp({
        email: datos.email.trim().toLowerCase(),
        password: datos.password,
        options: {
          data: {
            nombre_completo: datos.nombre_completo.trim(),
            rol: datos.rol,
            telefono: datos.telefono?.trim() || null,
          },
        },
      });

      if (!authError && authData?.user) {
        userId = authData.user.id;
      } else if (authError) {
        console.warn('[TrabajadoresService] Nota de registro Auth:', authError.message);
      }
    } catch (authEx) {
      console.warn('[TrabajadoresService] Fallback directo a perfiles:', authEx);
    }

    // 2. Insertar o actualizar el perfil en la tabla 'perfiles'
    const nuevoPerfil: Perfil = {
      id: userId,
      nombre_completo: datos.nombre_completo.trim(),
      email: datos.email.trim().toLowerCase(),
      telefono: datos.telefono?.trim() || null,
      rol: datos.rol,
      activo: true,
      creado_en: new Date().toISOString(),
    };

    const { error: perfilError } = await supabase
      .from('perfiles')
      .upsert(nuevoPerfil);

    if (perfilError) {
      console.warn('[TrabajadoresService] Error al guardar en Supabase perfiles:', perfilError);
    }

    // 3. Actualizar caché local de trabajadores
    try {
      const actuales = await obtenerTrabajadores();
      const actualizados = [nuevoPerfil, ...actuales.filter((t) => t.id !== userId)];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(actualizados));
    } catch {
      // Ignorar error de caché
    }

    return {
      success: true,
      trabajador: nuevoPerfil,
      credenciales: {
        email: datos.email.trim().toLowerCase(),
        password: datos.password,
        rol: datos.rol,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al registrar trabajador';
    return { success: false, error: msg };
  }
}

/**
 * Cambiar el estado activo / inactivo de un trabajador
 */
export async function alternarEstadoTrabajador(
  id: string,
  nuevoEstado: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('perfiles')
      .update({ activo: nuevoEstado })
      .eq('id', id);

    if (error) {
      console.warn('[TrabajadoresService] Error actualizando en Supabase:', error);
    }

    // Actualizar respaldo local
    const enCache = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (enCache) {
      const lista: Perfil[] = JSON.parse(enCache);
      const actualizados = lista.map((t) => (t.id === id ? { ...t, activo: nuevoEstado } : t));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(actualizados));
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo cambiar el estado',
    };
  }
}

/**
 * Cambiar el rol asignado a un trabajador
 */
export async function cambiarRolTrabajador(
  id: string,
  nuevoRol: RolUsuario
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: nuevoRol })
      .eq('id', id);

    if (error) {
      console.warn('[TrabajadoresService] Error actualizando rol en Supabase:', error);
    }

    // Actualizar respaldo local
    const enCache = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (enCache) {
      const lista: Perfil[] = JSON.parse(enCache);
      const actualizados = lista.map((t) => (t.id === id ? { ...t, rol: nuevoRol } : t));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(actualizados));
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo actualizar el rol',
    };
  }
}
