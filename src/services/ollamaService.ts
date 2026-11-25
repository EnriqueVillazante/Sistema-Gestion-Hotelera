// ==============================================================================
// SERVICIO DE CONEXIÓN LOCAL CON OLLAMA (QWEN 3.5)
// Maneja detección automática del modelo, streaming rápido de respuestas
// y limpieza de etiquetas de pensamiento para una experiencia fluida.
// ==============================================================================

export interface MensajeOllama {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface EstadoOllama {
  online: boolean;
  modeloActivo: string;
  modelosDisponibles: string[];
  error?: string;
}

interface ModeloTagOllama {
  name: string;
}

// URL base por defecto usa el proxy de Vite (/api/ollama -> http://127.0.0.1:11434)
const OLLAMA_BASE_URL = (import.meta.env.VITE_OLLAMA_URL || '/api/ollama').replace(/\/+$/, '');
const MODELO_PREFERIDO = (import.meta.env.VITE_OLLAMA_MODEL || 'qwen3.5').trim();

/**
 * Selecciona el nombre exacto del modelo instalado en Ollama que mejor coincide
 * con Qwen 3.5 (por ejemplo: qwen3.5:latest, qwen3.5:4b, qwen3.5:9b, etc.).
 */
function seleccionarMejorModelo(modelos: string[]): string {
  if (modelos.length === 0) return MODELO_PREFERIDO;

  const preferidoLower = MODELO_PREFERIDO.toLowerCase();

  // 1. Coincidencia exacta
  const exacto = modelos.find((m) => m.toLowerCase() === preferidoLower);
  if (exacto) return exacto;

  // 2. Coincidencia con etiqueta (:latest, :4b, :9b, etc.)
  const porPrefijo = modelos.find((m) => m.toLowerCase().startsWith(`${preferidoLower}:`));
  if (porPrefijo) return porPrefijo;

  // 3. Cualquier variante que contenga qwen3.5
  const varianteQwen35 = modelos.find((m) => m.toLowerCase().includes('qwen3.5'));
  if (varianteQwen35) return varianteQwen35;

  // 4. Cualquier variante de qwen disponible
  const varianteQwen = modelos.find((m) => m.toLowerCase().includes('qwen'));
  if (varianteQwen) return varianteQwen;

  // 5. Fallback al primer modelo instalado
  return modelos[0];
}

/**
 * Verifica si Ollama está activo localmente y lista los modelos instalados.
 */
export async function verificarEstadoOllama(): Promise<EstadoOllama> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        online: false,
        modeloActivo: MODELO_PREFERIDO,
        modelosDisponibles: [],
        error: `Ollama respondió con estado ${res.status}.`,
      };
    }

    const data = (await res.json()) as { models?: ModeloTagOllama[] };
    const modelos = (data.models || []).map((m) => m.name).filter(Boolean);
    const modeloActivo = seleccionarMejorModelo(modelos);

    if (modelos.length === 0) {
      return {
        online: true,
        modeloActivo: MODELO_PREFERIDO,
        modelosDisponibles: [],
        error: `Ollama está activo pero no se detectaron modelos descargados. Ejecuta: ollama pull ${MODELO_PREFERIDO}`,
      };
    }

    return {
      online: true,
      modeloActivo,
      modelosDisponibles: modelos,
    };
  } catch {
    return {
      online: false,
      modeloActivo: MODELO_PREFERIDO,
      modelosDisponibles: [],
      error: 'No se pudo conectar con Ollama en tu equipo local (puerto 11434).',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

/**
 * Elimina cualquier bloque <think>...</think> si el modelo llega a emitirlo,
 * manteniendo únicamente la respuesta visible para el huésped.
 */
function limpiarBloquesPensamiento(texto: string): string {
  // Eliminar bloques cerrados <think>...</think>
  let limpio = texto.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Si hay un bloque <think> todavía abierto durante el streaming, ocultarlo temporalmente
  const idxAbierto = limpio.toLowerCase().indexOf('<think>');
  if (idxAbierto !== -1) {
    limpio = limpio.slice(0, idxAbierto);
  }
  return limpio.trimStart();
}

/**
 * Envía el historial de conversación a Ollama con streaming activado para
 * respuestas rápidas y progresivas.
 */
export async function enviarMensajeOllamaStream(params: {
  modelo: string;
  mensajes: MensajeOllama[];
  onToken: (textoAcumulado: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { modelo, mensajes, onToken, signal } = params;

  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: modelo,
      messages: mensajes,
      stream: true,
      // Desactivar razonamiento largo en Qwen 3.5 para respuestas rápidas de conserjería
      think: false,
      keep_alive: '10m',
      options: {
        temperature: 0.25,
        top_p: 0.85,
        num_predict: 350,
      },
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    if (res.status === 404) {
      throw new Error(
        `El modelo "${modelo}" no está instalado en Ollama. Descárgalo con: ollama pull ${modelo}`
      );
    }
    throw new Error(
      `No se pudo obtener respuesta de Ollama (${res.status}). ${detalle ? detalle.slice(0, 140) : ''}`
    );
  }

  if (!res.body) {
    throw new Error('La respuesta de Ollama no incluyó flujo de datos.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let acumuladoCrudo = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lineas = buffer.split('\n');
    buffer = lineas.pop() || '';

    for (const linea of lineas) {
      const recortada = linea.trim();
      if (!recortada) continue;

      try {
        const chunk = JSON.parse(recortada) as {
          message?: { content?: string };
          error?: string;
        };

        if (chunk.error) {
          throw new Error(chunk.error);
        }

        if (chunk.message?.content) {
          acumuladoCrudo += chunk.message.content;
          onToken(limpiarBloquesPensamiento(acumuladoCrudo));
        }
      } catch (err) {
        if (err instanceof SyntaxError) {
          // Línea parcial, ignorar hasta completar
          continue;
        }
        throw err;
      }
    }
  }

  // Procesar resto del buffer si existiera
  if (buffer.trim()) {
    try {
      const chunk = JSON.parse(buffer.trim()) as { message?: { content?: string } };
      if (chunk.message?.content) {
        acumuladoCrudo += chunk.message.content;
      }
    } catch {
      // Ignorar fragmento final incompleto
    }
  }

  const resultadoFinal = limpiarBloquesPensamiento(acumuladoCrudo).trim();
  onToken(resultadoFinal);
  return resultadoFinal;
}
