// ==============================================================================
// SISTEMA DE GESTIÓN HOTELERA - UTILIDAD DE CACHÉ LOCAL CON EXPIRACIÓN (TTL)
// ==============================================================================

interface CacheItem<T> {
  value: T;
  expiry: number; // Marca de tiempo unix en milisegundos
}

const DEFAULT_TTL_MINUTES = 60; // 1 hora por defecto

export const cache = {
  /**
   * Guarda un valor en el almacenamiento local con tiempo de expiración
   */
  set: <T>(key: string, value: T, ttlMinutes = DEFAULT_TTL_MINUTES): void => {
    try {
      const now = new Date();
      const item: CacheItem<T> = {
        value,
        expiry: now.getTime() + ttlMinutes * 60 * 1000,
      };
      localStorage.setItem(`sagh_cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn(`[Caché] Error guardando clave "${key}":`, error);
    }
  },

  /**
   * Obtiene un valor de la caché. Si expiró o no existe, retorna null.
   */
  get: <T>(key: string): T | null => {
    try {
      const itemStr = localStorage.getItem(`sagh_cache_${key}`);
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      const now = new Date().getTime();

      if (now > item.expiry) {
        localStorage.removeItem(`sagh_cache_${key}`);
        return null;
      }

      return item.value;
    } catch (error) {
      console.warn(`[Caché] Error leyendo clave "${key}":`, error);
      return null;
    }
  },

  /**
   * Elimina un elemento específico de la caché
   */
  remove: (key: string): void => {
    try {
      localStorage.removeItem(`sagh_cache_${key}`);
    } catch (error) {
      console.warn(`[Caché] Error eliminando clave "${key}":`, error);
    }
  },

  /**
   * Limpia toda la caché que pertenezca al sistema SAGH
   */
  clearAll: (): void => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sagh_cache_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (error) {
      console.warn('[Caché] Error limpiando la caché:', error);
    }
  },
};
