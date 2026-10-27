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

/**
 * Obtener la lista real de trabajadores directamente desde la tabla 'perfiles' de Supabase
 * (Sin ningún dato de prueba ni usuarios aleatorios).
 */
export async function obtenerTrabajadores(): Promise<Perfil[]> {
  try {
    // Limpiar cualquier residuo de caché obsoleto en el navegador
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sagh_trabajadores_cache');
      localStorage.removeItem('sagh_trabajadores_emails');
    }

    const { data, error } = await supabase
      .from('perfiles')
      .select('id, nombre_completo, telefono, rol, activo, creado_en')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('[TrabajadoresService] Error al consultar perfiles en Supabase:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[TrabajadoresService] Excepción al obtener perfiles de Supabase:', err);
    return [];
  }
}

/**
 * Registrar un nuevo trabajador en Supabase Auth y en la tabla 'perfiles'
 * Asegura que se inserte en 'perfiles' con su rol correspondiente sin tocar la tabla 'huespedes'.
 */
export async function registrarNuevoTrabajador(
  datos: NuevoTrabajadorPayload
): Promise<TrabajadorResultado> {
  try {
    const emailLimpio = datos.email.trim().toLowerCase();
    const clienteAislado = crearClienteAuthAislado();

    // 1. Crear el usuario en Supabase Auth con cliente aislado (para no cerrar la sesión del admin)
    const { data: authData, error: authError } = await clienteAislado.auth.signUp({
      email: emailLimpio,
      password: datos.password,
      options: {
        data: {
          nombre_completo: datos.nombre_completo.trim(),
          rol: datos.rol,
          telefono: datos.telefono?.trim() || null,
        },
      },
    });

    if (authError) {
      console.error('[TrabajadoresService] Error en Supabase Auth:', authError.message);
      return {
        success: false,
        error: authError.message.includes('already registered')
          ? 'Este correo electrónico ya está registrado en el sistema.'
          : authError.message,
      };
    }

    const nuevoUserId = authData?.user?.id;
    if (!nuevoUserId) {
      return { success: false, error: 'No se pudo generar el usuario en Supabase Auth.' };
    }

    // 2. Obtener el token de acceso del nuevo usuario para cumplir con las políticas RLS
    let tokenAuth = authData.session?.access_token || null;

    if (!tokenAuth) {
      // Si la sesión no vino en el signUp, autenticarse en el cliente aislado para obtener el token
      const { data: loginData } = await clienteAislado.auth.signInWithPassword({
        email: emailLimpio,
        password: datos.password,
      });
      tokenAuth = loginData?.session?.access_token || null;
    }

    // 3. Datos exactos para insertar en la tabla 'perfiles' (según el esquema oficial)
    const payloadPerfil = {
      id: nuevoUserId,
      nombre_completo: datos.nombre_completo.trim(),
      telefono: datos.telefono?.trim() || null,
      rol: datos.rol,
      activo: true,
    };

    let guardadoExitoso = false;
    let mensajeError: string | null = null;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // A) Inserción directa en REST API usando el token del nuevo usuario (cumple RLS auth.uid() = id)
    if (tokenAuth && supabaseUrl && supabaseAnonKey) {
      try {
        const respuesta = await fetch(`${supabaseUrl}/rest/v1/perfiles`, {
          method: 'POST',
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${tokenAuth}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(payloadPerfil),
        });

        if (respuesta.ok) {
          guardadoExitoso = true;
        } else {
          const txt = await respuesta.text();
          console.warn('[TrabajadoresService] Inserción REST con token arrojó:', respuesta.status, txt);
          mensajeError = txt;
        }
      } catch (exRest) {
        console.warn('[TrabajadoresService] Excepción REST:', exRest);
      }
    }

    // B) Reintento con la sesión del Administrador en caso de que RLS permita inserción por admin
    if (!guardadoExitoso) {
      const { error: adminErr } = await supabase
        .from('perfiles')
        .upsert(payloadPerfil);

      if (!adminErr) {
        guardadoExitoso = true;
      } else {
        console.error('[TrabajadoresService] Inserción con cliente Admin:', adminErr.message);
        mensajeError = adminErr.message;
      }
    }

    if (!guardadoExitoso) {
      return {
        success: false,
        error: `El usuario fue creado en Auth, pero no se pudo insertar en la tabla perfiles: ${mensajeError || 'Permisos RLS insuficientes'}`,
      };
    }

    const nuevoPerfil: Perfil = {
      id: nuevoUserId,
      nombre_completo: datos.nombre_completo.trim(),
      email: emailLimpio,
      telefono: datos.telefono?.trim() || null,
      rol: datos.rol,
      activo: true,
      creado_en: new Date().toISOString(),
    };

    return {
      success: true,
      trabajador: nuevoPerfil,
      credenciales: {
        email: emailLimpio,
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
 * Actualizar el estado activo/inactivo de un trabajador en la base de datos de Supabase
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
      console.error('[TrabajadoresService] Error actualizando estado en Supabase:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión con la base de datos',
    };
  }
}

/**
 * Actualizar el rol de un trabajador en la base de datos de Supabase
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
      console.error('[TrabajadoresService] Error actualizando rol en Supabase:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error de conexión con la base de datos',
    };
  }
}
