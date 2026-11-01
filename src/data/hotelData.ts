// ==============================================================================
// DEFINICIONES DE TIPOS Y UTILIDADES DE VISTA DE FACHADA
// Gran Hotel Illimani - Fotografías reales y coordenadas vinculadas a Supabase
// ==============================================================================

export type VistaFachada = 'frontal' | 'lateral_izq' | 'lateral_der';

export const IMAGENES_FACHADA: Record<VistaFachada, string> = {
  frontal: '/fachada_frontal.jpg',
  lateral_der: '/fachada_lateral_der.jpg',
  lateral_izq: '/fachada_lateral_izq.jpg',
};

export const NOMBRES_VISTA_FACHADA: Record<VistaFachada, string> = {
  frontal: 'Fachada Frontal Principal',
  lateral_der: 'Fachada Lateral Derecha',
  lateral_izq: 'Fachada Lateral Izquierda',
};

export interface CoordenadasHotspot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type CoordenadasPorVista = Partial<Record<VistaFachada, CoordenadasHotspot>>;

/**
 * Función auxiliar para extraer de manera segura las coordenadas de hotspot
 * desde el campo JSONB 'coordenadas_por_vista' de la tabla 'habitaciones' de Supabase.
 */
export function extraerCoordenadasHotspot(
  coordenadasRaw: unknown,
  vista: VistaFachada
): CoordenadasHotspot | null {
  if (!coordenadasRaw) return null;

  try {
    let mapa: Record<string, unknown> | null = null;
    if (typeof coordenadasRaw === 'string') {
      mapa = JSON.parse(coordenadasRaw);
    } else if (typeof coordenadasRaw === 'object' && coordenadasRaw !== null) {
      mapa = coordenadasRaw as Record<string, unknown>;
    }

    if (!mapa) return null;

    const coords = mapa[vista] as CoordenadasHotspot | undefined;
    if (
      coords &&
      typeof coords.x === 'number' &&
      typeof coords.y === 'number' &&
      typeof coords.w === 'number' &&
      typeof coords.h === 'number'
    ) {
      return coords;
    }
  } catch (err) {
    console.warn('[hotelData] Error extrayendo coordenadas de vista:', err);
  }

  return null;
}

/**
 * Determina cuál es la vista de fachada principal donde se encuentra ubicada la habitación
 */
export function obtenerVistaPrincipalHabitacion(coordenadasRaw: unknown): VistaFachada {
  if (!coordenadasRaw) return 'frontal';

  try {
    let mapa: Record<string, unknown> | null = null;
    if (typeof coordenadasRaw === 'string') {
      mapa = JSON.parse(coordenadasRaw);
    } else if (typeof coordenadasRaw === 'object' && coordenadasRaw !== null) {
      mapa = coordenadasRaw as Record<string, unknown>;
    }

    if (mapa) {
      if (mapa.frontal) return 'frontal';
      if (mapa.lateral_der) return 'lateral_der';
      if (mapa.lateral_izq) return 'lateral_izq';
    }
  } catch {}

  return 'frontal';
}

/**
 * Devuelve la ruta de la fotografía real de la fachada correspondiente a la habitación
 */
export function obtenerImagenRealHabitacion(coordenadasRaw: unknown): string {
  const vista = obtenerVistaPrincipalHabitacion(coordenadasRaw);
  return IMAGENES_FACHADA[vista] || '/fachada_frontal.jpg';
}

/**
 * Devuelve el nombre amigable de la fachada donde se sitúa la habitación
 */
export function obtenerNombreVistaHabitacion(coordenadasRaw: unknown): string {
  const vista = obtenerVistaPrincipalHabitacion(coordenadasRaw);
  return NOMBRES_VISTA_FACHADA[vista] || 'Fachada Frontal';
}

/**
 * Fotografías de referencia del interior de las habitaciones (suites, dormitorios, camas y espacios)
 * para el catálogo de selección del huésped.
 */
export const FOTOS_INTERIOR_HABITACIONES: Record<string, string[]> = {
  presidencial: [
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
  ],
  matrimonial: [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
  ],
  doble_ejecutiva: [
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80',
  ],
  confort: [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
  ],
};

/**
 * Devuelve la fotografía de referencia de la habitación por dentro
 * según su tipología de habitación y número.
 */
export function obtenerFotoInteriorHabitacion(nombreTipo?: string, numero?: string): string {
  const nom = (nombreTipo || '').toLowerCase();
  const num = parseInt(numero || '0', 10);

  if (nom.includes('presidencial')) {
    const list = FOTOS_INTERIOR_HABITACIONES.presidencial;
    return list[num % list.length];
  }
  if (nom.includes('matrimonial') || nom.includes('deluxe')) {
    const list = FOTOS_INTERIOR_HABITACIONES.matrimonial;
    return list[num % list.length];
  }
  if (nom.includes('doble') || nom.includes('twin') || nom.includes('ejecutiva')) {
    const list = FOTOS_INTERIOR_HABITACIONES.doble_ejecutiva;
    return list[num % list.length];
  }
  const list = FOTOS_INTERIOR_HABITACIONES.confort;
  return list[num % list.length];
}
