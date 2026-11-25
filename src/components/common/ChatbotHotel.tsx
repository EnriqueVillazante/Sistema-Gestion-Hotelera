import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  Sparkles,
  Trash2,
  RefreshCw,
  Square,
  Wifi,
  WifiOff,
  User as UserIcon,
  BedDouble,
  UtensilsCrossed,
  MapPin,
  CalendarCheck2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { construirSystemPromptHotel, obtenerDatosVivosHotel } from '../../data/hotelKnowledge';
import {
  verificarEstadoOllama,
  enviarMensajeOllamaStream,
  type EstadoOllama,
  type MensajeOllama,
} from '../../services/ollamaService';

interface MensajeUI {
  id: string;
  rol: 'user' | 'assistant';
  contenido: string;
  hora: string;
  esError?: boolean;
}

const PREGUNTAS_RAPIDAS = [
  {
    texto: '¿Qué tipos de habitaciones y tarifas tienen?',
    etiqueta: 'Habitaciones y tarifas',
    icono: BedDouble,
    color: 'text-amber-300',
  },
  {
    texto: '¿Cuántas habitaciones hay disponibles ahora?',
    etiqueta: 'Disponibilidad en vivo',
    icono: CalendarCheck2,
    color: 'text-emerald-300',
  },
  {
    texto: '¿Qué servicios de restaurante y spa ofrecen?',
    etiqueta: 'Restaurante y Spa',
    icono: UtensilsCrossed,
    color: 'text-sky-300',
  },
  {
    texto: '¿Horarios de check-in, ubicación y contacto?',
    etiqueta: 'Check-in y ubicación',
    icono: MapPin,
    color: 'text-rose-300',
  },
];

function obtenerHoraActual(): string {
  return new Date().toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Dibujo SVG de cuerpo completo de un Osito Cariñoso conserje (sin burbuja alrededor)
 * con pancita de corazón, orejitas tiernas, ojitos que parpadean y bracito saludando.
 */
const OsitoCarinosoSVG: React.FC = () => (
  <svg
    viewBox="0 0 110 124"
    className="w-24 h-28 sm:w-28 sm:h-32 drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)] overflow-visible"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="osoCuerpo" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#d9a06c" />
        <stop offset="60%" stopColor="#b8763e" />
        <stop offset="100%" stopColor="#945828" />
      </linearGradient>
      <linearGradient id="osoGorroFull" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="55%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="osoCorazon" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="100%" stopColor="#e11d48" />
      </linearGradient>
    </defs>

    {/* Sombra suave en el suelo */}
    <ellipse cx="55" cy="117" rx="30" ry="5.5" fill="rgba(0,0,0,0.35)" />

    {/* Bracito izquierdo descansando */}
    <ellipse
      cx="27"
      cy="77"
      rx="10.5"
      ry="14"
      transform="rotate(24 27 77)"
      fill="url(#osoCuerpo)"
      stroke="#74421a"
      strokeWidth="1.6"
    />

    {/* Bracito derecho levantado saludando con movimiento */}
    <g className="animate-chatbot-wave" style={{ transformOrigin: '78px 72px' }}>
      <ellipse
        cx="88"
        cy="61"
        rx="10"
        ry="15"
        transform="rotate(34 88 61)"
        fill="url(#osoCuerpo)"
        stroke="#74421a"
        strokeWidth="1.6"
      />
      <circle cx="91" cy="54" r="4.2" fill="#f7dec8" />
    </g>

    {/* Cuerpito gordito y tierno */}
    <ellipse
      cx="55"
      cy="84"
      rx="26"
      ry="27"
      fill="url(#osoCuerpo)"
      stroke="#74421a"
      strokeWidth="1.8"
    />

    {/* Pancita crema de Osito Cariñoso */}
    <ellipse cx="55" cy="86" rx="18" ry="19" fill="#fdf0e2" />

    {/* Corazoncito en la pancita */}
    <path
      d="M55 95 C55 95, 44.5 88.2, 44.5 81.8 C44.5 78.3, 47.2 76, 50.2 76 C52.4 76, 54.1 77.3, 55 79 C55.9 77.3, 57.6 76, 59.8 76 C62.8 76, 65.5 78.3, 65.5 81.8 C65.5 88.2, 55 95, 55 95 Z"
      fill="url(#osoCorazon)"
      stroke="#fecdd3"
      strokeWidth="1"
    />
    {/* Destellito en el corazón */}
    <circle cx="49.5" cy="80.5" r="1.5" fill="#ffffff" opacity="0.8" />

    {/* Patitas sentadito */}
    <ellipse
      cx="37"
      cy="107"
      rx="12.5"
      ry="9"
      transform="rotate(-14 37 107)"
      fill="url(#osoCuerpo)"
      stroke="#74421a"
      strokeWidth="1.6"
    />
    <ellipse
      cx="37"
      cy="107.5"
      rx="7"
      ry="4.8"
      transform="rotate(-14 37 107.5)"
      fill="#f7dec8"
    />
    <ellipse
      cx="73"
      cy="107"
      rx="12.5"
      ry="9"
      transform="rotate(14 73 107)"
      fill="url(#osoCuerpo)"
      stroke="#74421a"
      strokeWidth="1.6"
    />
    <ellipse
      cx="73"
      cy="107.5"
      rx="7"
      ry="4.8"
      transform="rotate(14 73 107.5)"
      fill="#f7dec8"
    />

    {/* Orejitas redondas */}
    <circle cx="31" cy="24" r="11" fill="url(#osoCuerpo)" stroke="#74421a" strokeWidth="1.6" />
    <circle cx="31" cy="24" r="5.8" fill="#f7dec8" />
    <circle cx="79" cy="24" r="11" fill="url(#osoCuerpo)" stroke="#74421a" strokeWidth="1.6" />
    <circle cx="79" cy="24" r="5.8" fill="#f7dec8" />

    {/* Cabecita redonda */}
    <circle cx="55" cy="43" r="26" fill="url(#osoCuerpo)" stroke="#74421a" strokeWidth="1.8" />

    {/* Gorrito dorado chiquito de hotel 5 estrellas */}
    <g transform="rotate(-7 55 18)">
      <path
        d="M44 20 C44 12, 66 12, 66 20 L68 25 L42 25 Z"
        fill="url(#osoGorroFull)"
        stroke="#fef3c7"
        strokeWidth="1.3"
      />
      <rect x="40.5" y="23.5" width="29" height="3.8" rx="1.9" fill="#92400e" />
      <circle cx="55" cy="17.8" r="2.1" fill="#fffbeb" />
    </g>

    {/* Mejillas rosaditas */}
    <ellipse cx="39" cy="48.5" rx="4.4" ry="2.8" fill="#fda4af" opacity="0.7" />
    <ellipse cx="71" cy="48.5" rx="4.4" ry="2.8" fill="#fda4af" opacity="0.7" />

    {/* Ojitos grandes y tiernos con parpadeo */}
    <g className="animate-chatbot-blink">
      <circle cx="44.5" cy="41.5" r="4" fill="#1e1b18" />
      <circle cx="65.5" cy="41.5" r="4" fill="#1e1b18" />
      <circle cx="45.8" cy="40" r="1.5" fill="#ffffff" />
      <circle cx="66.8" cy="40" r="1.5" fill="#ffffff" />
      <circle cx="43.5" cy="42.8" r="0.7" fill="#ffffff" opacity="0.8" />
      <circle cx="64.5" cy="42.8" r="0.7" fill="#ffffff" opacity="0.8" />
    </g>

    {/* Hociquito crema */}
    <ellipse cx="55" cy="52" rx="11.5" ry="8.5" fill="#fdf0e2" />

    {/* Naricita tierna en forma de corazoncito */}
    <ellipse cx="55" cy="48.2" rx="4.2" ry="2.9" fill="#4e2f1e" />
    <ellipse cx="53.8" cy="47.4" rx="1.2" ry="0.7" fill="#ffffff" opacity="0.65" />

    {/* Sonrisa dulce */}
    <line x1="55" y1="51" x2="55" y2="55.2" stroke="#5d3a24" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M49.5 54.5 Q55 59 60.5 54.5"
      fill="none"
      stroke="#5d3a24"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Avatar tierno y animado de un osito conserje del Gran Hotel Illimani
 * con orejitas redondas, gorrito dorado, ojitos que parpadean y patita saludando.
 */
const AvatarOsito: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dimensiones =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';

  return (
    <svg
      viewBox="0 0 64 64"
      className={`${dimensiones} shrink-0 drop-shadow-md overflow-visible`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ositoPelaje" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c68b59" />
          <stop offset="100%" stopColor="#8d5524" />
        </linearGradient>
        <linearGradient id="ositoGorro" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* Orejitas redondas del osito */}
      <circle cx="17" cy="21" r="8.5" fill="url(#ositoPelaje)" stroke="#6b3e18" strokeWidth="1.4" />
      <circle cx="17" cy="21" r="4.5" fill="#f3d5b5" />
      <circle cx="47" cy="21" r="8.5" fill="url(#ositoPelaje)" stroke="#6b3e18" strokeWidth="1.4" />
      <circle cx="47" cy="21" r="4.5" fill="#f3d5b5" />

      {/* Cabecita redonda y esponjosa */}
      <circle cx="32" cy="36" r="21" fill="url(#ositoPelaje)" stroke="#6b3e18" strokeWidth="1.6" />

      {/* Gorrito dorado chiquito de conserje 5 estrellas */}
      <g transform="rotate(-7 32 16)">
        <path
          d="M23 18 C23 11, 41 11, 41 18 L42.5 22 L21.5 22 Z"
          fill="url(#ositoGorro)"
          stroke="#fef3c7"
          strokeWidth="1.2"
        />
        <rect x="20" y="20.5" width="24" height="3.2" rx="1.6" fill="#92400e" />
        <circle cx="32" cy="15.8" r="1.8" fill="#fffbeb" />
      </g>

      {/* Mejillas rosaditas tiernas */}
      <ellipse cx="19.5" cy="40.5" rx="3.4" ry="2.2" fill="#fda4af" opacity="0.65" />
      <ellipse cx="44.5" cy="40.5" rx="3.4" ry="2.2" fill="#fda4af" opacity="0.65" />

      {/* Ojitos brillantes con parpadeo suave */}
      <g className="animate-chatbot-blink">
        <circle cx="24" cy="34.5" r="3.1" fill="#1e1b18" />
        <circle cx="40" cy="34.5" r="3.1" fill="#1e1b18" />
        <circle cx="25" cy="33.4" r="1.15" fill="#ffffff" />
        <circle cx="41" cy="33.4" r="1.15" fill="#ffffff" />
      </g>

      {/* Hociquito crema */}
      <ellipse cx="32" cy="43.5" rx="9.5" ry="7.2" fill="#fae5d3" />

      {/* Naricita tierna */}
      <ellipse cx="32" cy="40.2" rx="3.5" ry="2.4" fill="#3e2723" />
      <ellipse cx="31" cy="39.5" rx="1" ry="0.6" fill="#ffffff" opacity="0.6" />

      {/* Sonrisa amigable */}
      <path
        d="M28 45.2 Q32 48.8 36 45.2"
        fill="none"
        stroke="#4e342e"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <line x1="32" y1="42.5" x2="32" y2="46.2" stroke="#4e342e" strokeWidth="1.6" strokeLinecap="round" />

      {/* Patita saludando con movimiento */}
      <g className="animate-chatbot-wave" style={{ transformOrigin: '52px 48px' }}>
        <ellipse cx="55" cy="44" rx="5.2" ry="6.2" transform="rotate(24 55 44)" fill="url(#ositoPelaje)" stroke="#6b3e18" strokeWidth="1.3" />
        <circle cx="55.3" cy="44.2" r="2.2" fill="#f3d5b5" />
      </g>
    </svg>
  );
};

/**
 * Renderiza texto con soporte seguro para **negritas** y saltos de línea,
 * sin inyectar HTML crudo.
 */
function renderizarContenidoMensaje(texto: string): React.ReactNode {
  const lineas = texto.split('\n');
  return lineas.map((linea, idxLinea) => {
    const partes = linea.split(/(\*\*[^*]+\*\*)/g);
    return (
      <React.Fragment key={idxLinea}>
        {partes.map((parte, idxParte) => {
          if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
            return (
              <strong key={idxParte} className="font-bold text-amber-200">
                {parte.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={idxParte}>{parte}</React.Fragment>;
        })}
        {idxLinea < lineas.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export const ChatbotHotel: React.FC = () => {
  const { perfil, rol } = useAuth();

  const [abierto, setAbierto] = useState(false);
  const [mostrarSaludoFlotante, setMostrarSaludoFlotante] = useState(true);
  const [entrada, setEntrada] = useState('');
  const [generando, setGenerando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [estadoOllama, setEstadoOllama] = useState<EstadoOllama>({
    online: false,
    modeloActivo: import.meta.env.VITE_OLLAMA_MODEL || 'qwen3.5',
    modelosDisponibles: [],
  });

  const primerNombre = perfil?.nombre_completo?.trim().split(' ')[0];
  const mensajeBienvenida: MensajeUI = {
    id: 'bienvenida',
    rol: 'assistant',
    contenido: `${
      primerNombre
        ? `¡Hola, **${primerNombre}**! Qué gusto saludarte.`
        : '¡Hola! Qué gusto saludarte.'
    } Soy **Illi**, tu Conserje Virtual del **Gran Hotel Illimani ★★★★★**.\n\nPregúntame lo que necesites sobre habitaciones, precios, disponibilidad en vivo, restaurante, spa o turismo en La Paz.`,
    hora: 'Ahora',
  };

  const [mensajes, setMensajes] = useState<MensajeUI[]>([]);

  const finMensajesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inicializadoRef = useRef(false);
  const contadorIdRef = useRef(0);

  // Verificar estado de Ollama y precargar datos del hotel al abrir el chat
  const comprobarConexion = useCallback(async (forzarDatos = false) => {
    setVerificando(true);
    try {
      const [estado] = await Promise.all([
        verificarEstadoOllama(),
        obtenerDatosVivosHotel(forzarDatos),
      ]);
      setEstadoOllama((prev) => ({
        ...estado,
        modeloActivo:
          prev.modeloActivo && estado.modelosDisponibles.includes(prev.modeloActivo)
            ? prev.modeloActivo
            : estado.modeloActivo,
      }));
    } finally {
      setVerificando(false);
    }
  }, []);

  useEffect(() => {
    if (abierto && !inicializadoRef.current) {
      inicializadoRef.current = true;
      comprobarConexion(false);
    }
    if (abierto) {
      window.setTimeout(() => inputRef.current?.focus(), 140);
    }
  }, [abierto, comprobarConexion]);

  // Auto-scroll hacia el último mensaje
  useEffect(() => {
    finMensajesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, abierto]);

  // Limpiar abort controller al desmontar
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const abrirChat = () => {
    setAbierto(true);
    setMostrarSaludoFlotante(false);
  };

  const detenerGeneracion = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setGenerando(false);
  };

  const reiniciarConversacion = () => {
    detenerGeneracion();
    setMensajes([]);
  };

  const enviarConsulta = async (textoDirecto?: string) => {
    const texto = (textoDirecto ?? entrada).trim();
    if (!texto || generando) return;

    setEntrada('');

    contadorIdRef.current += 1;
    const idUsuario = `user-${contadorIdRef.current}`;
    contadorIdRef.current += 1;
    const idRespuesta = `assistant-${contadorIdRef.current}`;

    const msgUsuario: MensajeUI = {
      id: idUsuario,
      rol: 'user',
      contenido: texto,
      hora: obtenerHoraActual(),
    };

    const msgAsistenteVacio: MensajeUI = {
      id: idRespuesta,
      rol: 'assistant',
      contenido: '',
      hora: obtenerHoraActual(),
    };

    const historialPrevio = mensajes.filter((m) => !m.esError);
    setMensajes((prev) => [...prev, msgUsuario, msgAsistenteVacio]);
    setGenerando(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const systemPrompt = await construirSystemPromptHotel({
        nombre: perfil?.nombre_completo,
        rol,
      });

      const ventanaHistorial: MensajeOllama[] = historialPrevio.slice(-10).map((m) => ({
        role: m.rol,
        content: m.contenido,
      }));

      const payloadMensajes: MensajeOllama[] = [
        { role: 'system', content: systemPrompt },
        ...ventanaHistorial,
        { role: 'user', content: texto },
      ];

      const respuestaFinal = await enviarMensajeOllamaStream({
        modelo: estadoOllama.modeloActivo,
        mensajes: payloadMensajes,
        signal: controller.signal,
        onToken: (textoAcumulado) => {
          setMensajes((prev) =>
            prev.map((m) => (m.id === idRespuesta ? { ...m, contenido: textoAcumulado } : m))
          );
        },
      });

      setEstadoOllama((prev) => (prev.online ? prev : { ...prev, online: true, error: undefined }));

      if (!respuestaFinal) {
        setMensajes((prev) =>
          prev.map((m) =>
            m.id === idRespuesta
              ? {
                  ...m,
                  contenido:
                    'Disculpa, no recibí contenido del asistente. ¿Podrías reformular tu consulta?',
                }
              : m
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMensajes((prev) =>
          prev.map((m) =>
            m.id === idRespuesta && !m.contenido
              ? { ...m, contenido: 'Respuesta detenida.' }
              : m
          )
        );
      } else {
        const mensajeError =
          err instanceof Error
            ? err.message
            : 'No fue posible conectar con Ollama local en este momento.';

        setEstadoOllama((prev) => ({
          ...prev,
          online: false,
          error: mensajeError,
        }));

        setMensajes((prev) =>
          prev.map((m) =>
            m.id === idRespuesta
              ? {
                  ...m,
                  esError: true,
                  contenido: `No pude conectar con **Ollama (${estadoOllama.modeloActivo})**. Verifica que Ollama esté ejecutándose en tu equipo y que el modelo esté descargado.\n\nSi necesitas asistencia inmediata, comunícate con Recepción 24h al **+591 (2) 244-8000**.`,
                }
              : m
          )
        );
      }
    } finally {
      abortControllerRef.current = null;
      setGenerando(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enviarConsulta();
  };

  const mostrarSugerencias = mensajes.length === 0 && !generando;
  const mensajesVisibles = [mensajeBienvenida, ...mensajes];

  return (
    <div
      className={`fixed z-50 flex flex-col items-end font-sans ${
        abierto ? 'bottom-5 right-5' : 'bottom-0 right-0'
      }`}
    >
      {/* Ventana del Chatbot con entrada elástica */}
      {abierto && (
        <div
          role="dialog"
          aria-label="Conserje Virtual del Gran Hotel Illimani"
          className="animate-chatbot-pop mb-3.5 w-[calc(100vw-2rem)] sm:w-[410px] h-[565px] max-h-[calc(100vh-7rem)] rounded-[28px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 backdrop-blur-2xl border border-amber-400/35 shadow-[0_24px_70px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden"
        >
          {/* Cabecera cálida y amigable */}
          <div className="relative px-4 py-3.5 bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 border-b border-amber-500/25 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex items-center justify-center rounded-2xl bg-amber-500/15 p-1 border border-amber-400/35 shadow-inner">
                <AvatarOsito size="md" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                    estadoOllama.online ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif font-bold text-sm text-white truncate">
                    ¡Hola! ¿Tienes dudas?
                  </h3>
                  <span className="animate-chatbot-wave text-sm" aria-hidden="true">
                    👋
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-0.5">
                  {estadoOllama.online ? (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 font-semibold">Listo para ayudarte</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="text-rose-300 font-semibold">Sin conexión</span>
                    </>
                  )}
                  <span className="text-slate-600">·</span>
                  {estadoOllama.modelosDisponibles.length > 1 ? (
                    <select
                      aria-label="Seleccionar modelo de Ollama"
                      value={estadoOllama.modeloActivo}
                      onChange={(e) =>
                        setEstadoOllama((prev) => ({ ...prev, modeloActivo: e.target.value }))
                      }
                      className="bg-slate-900/90 text-amber-300 text-[10px] font-mono rounded-md px-1.5 py-0.5 border border-amber-500/30 focus:outline-none focus:border-amber-400 max-w-[115px] truncate cursor-pointer"
                    >
                      {estadoOllama.modelosDisponibles.map((modelo) => (
                        <option key={modelo} value={modelo}>
                          {modelo}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-mono text-[10px] text-amber-300/90 truncate">
                      {estadoOllama.modeloActivo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones de cabecera */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => comprobarConexion(true)}
                disabled={verificando}
                title="Reconectar con Ollama y actualizar disponibilidad"
                className="p-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${verificando ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={reiniciarConversacion}
                title="Nueva conversación"
                className="p-2 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                title="Minimizar chat"
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Aviso discreto si Ollama está sin conexión */}
          {!estadoOllama.online && !verificando && (
            <div className="px-4 py-2 bg-rose-950/45 border-b border-rose-500/20 flex items-center justify-between gap-2 text-[11px] text-rose-200">
              <span className="truncate">
                Inicia Ollama local para activar a Illi ({estadoOllama.modeloActivo}).
              </span>
              <button
                type="button"
                onClick={() => comprobarConexion(false)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-100 font-semibold shrink-0 cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Área de conversación */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.06),_transparent_55%)]">
            {mensajesVisibles.map((m) => {
              const esUsuario = m.rol === 'user';
              return (
                <div
                  key={m.id}
                  className={`animate-chatbot-msg flex items-end gap-2 ${
                    esUsuario ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!esUsuario && (
                    <div className="mb-1">
                      <AvatarOsito size="sm" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
                      esUsuario
                        ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-medium rounded-br-sm shadow-amber-500/15'
                        : m.esError
                        ? 'bg-rose-950/60 border border-rose-500/30 text-rose-100 rounded-bl-sm'
                        : 'bg-slate-900/95 border border-amber-500/15 text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    {m.contenido ? (
                      <div className="whitespace-pre-wrap break-words">
                        {esUsuario ? m.contenido : renderizarContenidoMensaje(m.contenido)}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-1 text-amber-300">
                        <span className="text-[11px] font-medium text-amber-200/90">
                          Illi está escribiendo
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.25s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.12s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                        </span>
                      </div>
                    )}
                    <div
                      className={`text-[9px] mt-1.5 text-right ${
                        esUsuario ? 'text-slate-950/70 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {m.hora}
                    </div>
                  </div>

                  {esUsuario && (
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-amber-500/25 flex items-center justify-center text-amber-300 shrink-0 mb-1">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Tarjetas de preguntas rápidas */}
            {mostrarSugerencias && (
              <div className="animate-chatbot-msg pt-1 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300/80 px-1">
                  <Sparkles className="w-3 h-3" />
                  <span>¿En qué te puedo ayudar hoy?</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PREGUNTAS_RAPIDAS.map((item) => {
                    const Icono = item.icono;
                    return (
                      <button
                        key={item.texto}
                        type="button"
                        onClick={() => enviarConsulta(item.texto)}
                        className="group text-left p-2.5 rounded-2xl bg-slate-900/90 hover:bg-amber-500/15 border border-slate-800 hover:border-amber-400/45 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex items-start gap-2 shadow-sm"
                      >
                        <Icono
                          className={`w-4 h-4 shrink-0 mt-0.5 ${item.color} group-hover:scale-110 transition-transform`}
                        />
                        <span className="text-[11px] font-medium text-slate-200 group-hover:text-amber-100 leading-snug">
                          {item.etiqueta}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div ref={finMensajesRef} />
          </div>

          {/* Barra de escritura */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-slate-900/95 border-t border-amber-500/20 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escríbele a Illi cualquier duda..."
              disabled={generando}
              className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none transition-all disabled:opacity-60"
            />
            {generando ? (
              <button
                type="button"
                onClick={detenerGeneracion}
                title="Detener respuesta"
                className="w-10 h-10 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 flex items-center justify-center transition-all shrink-0 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!entrada.trim()}
                title="Enviar mensaje"
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Osito Cariñoso asomándose desde la esquina inferior derecha + globito de diálogo */}
      {!abierto ? (
        <div className="flex flex-col items-end overflow-visible">
          {/* Globito de diálogo saliendo del osito asomado */}
          {mostrarSaludoFlotante && (
            <div className="animate-chatbot-pop mb-0.5 mr-6 relative max-w-[235px] rounded-2xl rounded-br-sm bg-white/95 text-slate-900 px-4 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)] border-2 border-amber-400">
              <button
                type="button"
                onClick={() => setMostrarSaludoFlotante(false)}
                aria-label="Ocultar saludo"
                className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-slate-900 hover:bg-slate-700 border border-amber-400/60 text-amber-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={abrirChat}
                className="text-left w-full cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700 group-hover:text-amber-600 transition-colors">
                  <span className="animate-chatbot-wave text-sm" aria-hidden="true">
                    👋
                  </span>
                  <span>
                    {primerNombre ? `¡Hola, ${primerNombre}! ¿Tienes dudas?` : '¡Hola! ¿Tienes dudas?'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 mt-0.5 leading-snug font-medium">
                  ¡Haz clic en mí! Te ayudo con habitaciones, precios y servicios del hotel.
                </p>
              </button>

              {/* Piquito del globo apuntando a la cabecita del osito */}
              <div className="absolute -bottom-2 right-6 w-3.5 h-3.5 rotate-45 bg-white border-r-2 border-b-2 border-amber-400" />
            </div>
          )}

          {/* El Osito Cariñoso asomándose desde la esquina inferior derecha */}
          <button
            type="button"
            onClick={abrirChat}
            aria-label="Abrir chat con el osito conserje"
            className="animate-chatbot-peek relative bg-transparent border-0 p-0 cursor-pointer transition-transform duration-300 active:scale-95 focus:outline-none"
          >
            <OsitoCarinosoSVG />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Cerrar Conserje Virtual"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 shadow-xl font-bold text-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <X className="w-4 h-4" />
          <span>Cerrar chat</span>
        </button>
      )}
    </div>
  );
};
