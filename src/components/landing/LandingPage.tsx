import React, { useState, useEffect } from 'react';
import {
  Wind,
  Droplets,
  Mountain,
  ArrowRight,
  UtensilsCrossed,
  Sparkles,
  Wine,
  HeartPulse,
  ChevronRight,
  Star,
  CheckCircle2,
  Globe,
  MapPin,
  BedDouble,
  Phone,
  Mail,
  LogIn,
  Camera,
  Compass,
  Navigation,
  Clock,
} from 'lucide-react';

interface LandingPageProps {
  onIniciarSesion: () => void;
  onRegistrarse: () => void;
  onAccesoStaff?: () => void;
}

// Tipo para datos de clima en vivo
interface ClimaLaPaz {
  temperatura: number;
  sensacion: number;
  humedad: number;
  viento: number;
  codigoClima: number;
  descripcion: string;
  icono: string;
  cargando: boolean;
}

// Tipos de habitaciones destacadas
interface HabitacionDestacada {
  id: string;
  nombre: string;
  subtitulo: string;
  precioBOB: number;
  capacidad: string;
  tamano: string;
  imagen: string;
  amenidades: string[];
  destacada?: boolean;
}

const HABITACIONES_SHOWCASE: HabitacionDestacada[] = [
  {
    id: 'suite-presidencial',
    nombre: 'Suite Presidencial Illimani',
    subtitulo: 'La cúspide del lujo andino con balcón panorámico hacia la cumbre nevada.',
    precioBOB: 1250,
    capacidad: 'Hasta 3 Huéspedes',
    tamano: '85 m²',
    imagen: '/fachada_terraza.jpg',
    amenidades: ['Balcón Privado al Nevado', 'Jacuzzi Hidromasaje', 'Cama King 800 Hilos', 'Mayordomo 24h', 'WiFi 6'],
    destacada: true,
  },
  {
    id: 'suite-matrimonial-deluxe',
    nombre: 'Suite Matrimonial Deluxe',
    subtitulo: 'Confort superior, tina de mármol y ventanales acústicos con vista a la ciudad.',
    precioBOB: 780,
    capacidad: '2 Huéspedes',
    tamano: '52 m²',
    imagen: '/fachada_frontal.jpg',
    amenidades: ['Cama King Premium', 'Tina Panorámica', 'Desayuno Buffet Incluido', 'Cafetera Nespresso', 'Smart TV 65"'],
  },
  {
    id: 'junior-suite-ejecutiva',
    nombre: 'Junior Suite Ejecutiva',
    subtitulo: 'Diseñada para el viajero de negocios de alto nivel con espacio de trabajo ergonómico.',
    precioBOB: 590,
    capacidad: '1 - 2 Huéspedes',
    tamano: '42 m²',
    imagen: '/fachada_lateral_der.jpg',
    amenidades: ['Escritorio Ergonómico', 'Internet Starlink 300 Mbps', 'Coffee Station', 'Sala Lounge Privada', 'Calefacción Central'],
  },
  {
    id: 'habitacion-doble-familiar',
    nombre: 'Habitación Doble Familiar Andina',
    subtitulo: 'Amplitud, calidez y todos los servicios para disfrutar La Paz en familia.',
    precioBOB: 480,
    capacidad: 'Hasta 4 Huéspedes',
    tamano: '48 m²',
    imagen: '/fachada.jpg',
    amenidades: ['2 Camas Queen', 'Minibar Gourmet', 'Climatización Inteligente', 'Caja Fuerte Digital', 'Room Service 24h'],
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onIniciarSesion,
  onRegistrarse,
}) => {
  // Estado de moneda seleccionada para cotización
  const [moneda, setMoneda] = useState<'BOB' | 'USD' | 'EUR'>('BOB');
  const [tasasCambio, setTasasCambio] = useState<{ [key: string]: number }>({
    USD: 1,
    BOB: 6.96,
    EUR: 0.92,
  });

  // Estado del clima en vivo
  const [clima, setClima] = useState<ClimaLaPaz>({
    temperatura: 14,
    sensacion: 13,
    humedad: 55,
    viento: 8,
    codigoClima: 1,
    descripcion: 'Parcialmente soleado · Excelente visibilidad al Illimani',
    icono: '☀️',
    cargando: true,
  });

  // Estado de cotizador interactivo
  const [cotizadorNoches, setCotizadorNoches] = useState<number>(2);
  const [cotizadorHabitacion, setCotizadorHabitacion] = useState<string>(HABITACIONES_SHOWCASE[0].id);

  // 1. Cargar Clima en Vivo de La Paz vía Open-Meteo
  useEffect(() => {
    let montado = true;
    const cargarClima = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=-16.5000&longitude=-68.1500&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=America%2FLa_Paz'
        );
        if (!res.ok) throw new Error('Error al consultar clima');
        const data = await res.json();
        if (!montado) return;

        const c = data.current;
        const code = c.weather_code;

        let desc = 'Cielo Despejado · Vista radiante al Nevado Illimani';
        let icon = '☀️';

        if (code === 0) {
          desc = 'Cielo Totalmente Despejado · Vista Radiante al Illimani';
          icon = '☀️';
        } else if (code >= 1 && code <= 3) {
          desc = 'Cielo Parcialmente Nuboso · Brisa Andina Suave';
          icon = '🌤️';
        } else if (code === 45 || code === 48) {
          desc = 'Niebla de Montaña · Aclimatación Agradable';
          icon = '🌫️';
        } else if (code >= 51 && code <= 67) {
          desc = 'Lluvia Andina Ligera · Ambiente Cálido en Hotel';
          icon = '🌧️';
        } else if (code >= 71) {
          desc = 'Nieve en Cumbres Altas · Vista Majestuosa';
          icon = '❄️';
        }

        setClima({
          temperatura: Math.round(c.temperature_2m),
          sensacion: Math.round(c.apparent_temperature),
          humedad: Math.round(c.relative_humidity_2m),
          viento: Math.round(c.wind_speed_10m),
          codigoClima: code,
          descripcion: desc,
          icono: icon,
          cargando: false,
        });
      } catch (err) {
        console.warn('[LandingPage] No se pudo cargar clima en vivo, usando datos nominales de La Paz:', err);
        if (montado) {
          setClima((prev) => ({ ...prev, cargando: false }));
        }
      }
    };

    cargarClima();
    return () => {
      montado = false;
    };
  }, []);

  // 2. Cargar Tasas de Cambio en Vivo vía Open Exchange Rates
  useEffect(() => {
    let montado = true;
    const cargarDivisas = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('Error al consultar tasas');
        const data = await res.json();
        if (!montado) return;

        if (data && data.rates) {
          setTasasCambio({
            USD: 1,
            BOB: data.rates.BOB || 6.96,
            EUR: data.rates.EUR || 0.92,
          });
        }
      } catch (err) {
        console.warn('[LandingPage] Error cargando divisas en vivo, usando paridad oficial:', err);
      }
    };

    cargarDivisas();
    return () => {
      montado = false;
    };
  }, []);

  // Convertidor de precios BOB a divisa seleccionada
  const formatearPrecio = (montoEnBOB: number): string => {
    const tasaBOBporUSD = tasasCambio.BOB || 6.96;
    if (moneda === 'BOB') {
      return `Bs. ${montoEnBOB.toLocaleString('es-BO')}`;
    }
    if (moneda === 'USD') {
      const montoUSD = montoEnBOB / tasaBOBporUSD;
      return `$ ${montoUSD.toFixed(0)} USD`;
    }
    if (moneda === 'EUR') {
      const tasaEURporUSD = tasasCambio.EUR || 0.92;
      const montoEUR = (montoEnBOB / tasaBOBporUSD) * tasaEURporUSD;
      return `€ ${montoEUR.toFixed(0)} EUR`;
    }
    return `Bs. ${montoEnBOB}`;
  };

  // Habitación seleccionada en el cotizador
  const habSeleccionada =
    HABITACIONES_SHOWCASE.find((h) => h.id === cotizadorHabitacion) || HABITACIONES_SHOWCASE[0];
  const totalCotizado = habSeleccionada.precioBOB * cotizadorNoches;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-white">
      {/* ==================================================================== */}
      {/* 1. BARRA SUPERIOR ELEGANTE (HEADER CON GLASSMORPHISM) */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-amber-500/20 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo y Nombre */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Gran Hotel Illimani"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-lg"
              />
              <div className="flex flex-col">
                <span className="font-serif font-black tracking-wider text-base sm:text-lg text-white">
                  GRAN HOTEL ILLIMANI
                </span>
                <span className="text-[10px] sm:text-xs text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span>★★★★★</span>
                  <span className="text-slate-400 font-normal">| La Paz, Bolivia</span>
                </span>
              </div>
            </div>

            {/* Controles del Header: Selector de Moneda y Botón Único de Ingresar */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Selector de Moneda */}
              <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <span className="text-slate-400 px-2 text-[10px] uppercase font-bold hidden sm:flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Moneda:
                </span>
                {(['BOB', 'USD', 'EUR'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMoneda(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${moneda === m
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                  >
                    {m === 'BOB' ? 'Bs.' : m}
                  </button>
                ))}
              </div>

              {/* Botón Único: Ingresar */}
              <button
                onClick={onIniciarSesion}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Ingresar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION CON FONDO MAJESTUOSO Y CLIMA EN VIVO */}
      {/* ==================================================================== */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Imagen de fondo de alta resolución */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-pulse duration-[10000ms]"
          style={{ backgroundImage: `url('/Fondo.jpg')` }}
        />
        {/* Capas de gradiente para legibilidad y elegancia */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center flex flex-col items-center">
          {/* Badge 5 Estrellas */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold uppercase tracking-widest mb-6 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Hospitalidad de Altura & Lujo Andino ★★★★★</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight text-white max-w-4xl leading-[1.1] mb-6 drop-shadow-2xl">
            La Majestad del Illimani frente a tu Balcón
          </h1>

          {/* Subtítulo */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed mb-8 drop-shadow">
            Bienvenido al epicentro del lujo en La Paz, Bolivia. Suites de diseño contemporáneo,
            gastronomía andina de autor y el servicio personalizado que mereces a 3.640 metros sobre el nivel del mar.
          </p>

          {/* WIDGET DEL CLIMA EN VIVO (API OPEN-METEO) */}
          <div className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl mb-10 text-left">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Información meteorológica */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner">
                  {clima.icono}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl sm:text-3xl font-mono font-bold text-white">
                      {clima.temperatura}°C
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      (Sensación: {clima.sensacion}°C)
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Clima en Vivo La Paz
                    </span>
                  </div>
                  <p className="text-xs text-amber-300 font-medium mt-0.5">
                    {clima.descripcion}
                  </p>
                </div>
              </div>

              {/* Métricas de Altitud y Viento */}
              <div className="flex items-center justify-around sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800 text-xs text-slate-300">
                <div className="text-center sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 justify-center sm:justify-end">
                    <Mountain className="w-3.5 h-3.5 text-amber-400" /> Altitud
                  </span>
                  <span className="font-mono font-bold text-white">3.640 msnm</span>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 justify-center sm:justify-end">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" /> Humedad
                  </span>
                  <span className="font-mono font-bold text-white">{clima.humedad}%</span>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1 justify-center sm:justify-end">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" /> Viento
                  </span>
                  <span className="font-mono font-bold text-white">{clima.viento} km/h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onRegistrarse}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/30 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <span>Reservar Mi Estadía Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#habitaciones"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 transition-all cursor-pointer"
            >
              <BedDouble className="w-4 h-4 text-amber-400" />
              <span>Explorar Suites & Tarifas</span>
            </a>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. COTIZADOR RÁPIDO CONVERSOR MULTI-DIVISA (API DE DIVISAS) */}
      {/* ==================================================================== */}
      <section className="relative z-20 -mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-1">
                Cotización Instantánea Multi-Moneda
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                Planifica tu Estadía en La Paz
              </h3>
            </div>

            {/* Selector de Moneda en el Cotizador */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Cotizar en:</span>
              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                {(['BOB', 'USD', 'EUR'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMoneda(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${moneda === m
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    {m === 'BOB' ? 'Bs. Boliviano' : m === 'USD' ? '$ Dólar USD' : '€ Euro'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* 1. Selector de Habitación */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Selecciona Tipo de Suite
              </label>
              <select
                value={cotizadorHabitacion}
                onChange={(e) => setCotizadorHabitacion(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {HABITACIONES_SHOWCASE.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.nombre} ({formatearPrecio(h.precioBOB)}/noche)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Selector de Noches */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                Número de Noches
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={cotizadorNoches}
                  onChange={(e) => setCotizadorNoches(parseInt(e.target.value) || 1)}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <span className="font-mono font-bold text-amber-400 text-base px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                  {cotizadorNoches} {cotizadorNoches === 1 ? 'noche' : 'noches'}
                </span>
              </div>
            </div>

            {/* 3. Total Calculado & Botón Reservar */}
            <div className="flex items-center justify-between sm:justify-end gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Total Estimado:
                </span>
                <span className="text-2xl font-mono font-black text-amber-300">
                  {formatearPrecio(totalCotizado)}
                </span>
              </div>
              <button
                onClick={onRegistrarse}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                Reservar Ya
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. ESCAPARATE DE HABITACIONES Y SUITES DE LUJO */}
      {/* ==================================================================== */}
      <section id="habitaciones" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
            Colección de Alojamiento Exclusivo
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-black text-white mb-4">
            Suites Diseñadas para el Descanso Absoluto
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Cada habitación del Gran Hotel Illimani ha sido orientada estratégicamente para ofrecer
            las mejores vistas panorámicas de la Cordillera Real y el majestuoso Nevado Illimani.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {HABITACIONES_SHOWCASE.map((h) => (
            <div
              key={h.id}
              className={`group rounded-3xl overflow-hidden bg-slate-900 border transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-amber-500/10 ${h.destacada
                  ? 'border-amber-500/50 ring-1 ring-amber-500/30'
                  : 'border-slate-800 hover:border-slate-700'
                }`}
            >
              {/* Imagen con badge */}
              <div className="relative h-64 sm:h-72 overflow-hidden">
                <img
                  src={h.imagen}
                  alt={h.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                {h.destacada && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Suite Insignia
                  </span>
                )}

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-xs font-mono text-slate-300 border border-slate-800">
                    {h.tamano} · {h.capacidad}
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Tarifa por noche</span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-amber-400">
                      {formatearPrecio(h.precioBOB)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-xl font-serif font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                    {h.nombre}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {h.subtitulo}
                  </p>
                </div>

                {/* Amenidades */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Servicios Incluidos:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {h.amenidades.map((a, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 text-[11px] border border-slate-800"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{a}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Botón de Reserva */}
                <button
                  onClick={onRegistrarse}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-amber-500 text-slate-200 hover:text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-lg"
                >
                  <span>Reservar esta Suite</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. EXPERIENCIAS & GASTRONOMÍA 5 ESTRELLAS */}
      {/* ==================================================================== */}
      <section className="py-20 bg-slate-900/60 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-2">
              Servicios Exclusivos
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-white">
              Mucho más que un Hospedaje
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Diseñado para brindar tranquilidad física, placer gastronómico y máxima seguridad en el corazón de La Paz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Restaurante */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-white">
                Restaurante Cumbres del Illimani
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cocina andina de vanguardia con ingredientes orgánicos de los valles y Yungas. Desayuno buffet artesanal incluido en todas las tarifas.
              </p>
            </div>

            {/* Skyline Lounge */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Wine className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-white">
                Skyline Lounge Bar en Terraza
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Coctelería de autor con Singani de altura y la mejor selección de vinos de Tarija. Vista panorámica 360° al atardecer paceño.
              </p>
            </div>

            {/* Spa & Oxigenoterapia */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-white">
                Spa & Bienestar Andino
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Salas de aclimatación con infusiones de coca y muña de cortesía, sauna seco y vapor, masajes descontracturantes para el descanso pleno.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. GUÍA TURÍSTICA DE LA PAZ (CONSERJERÍA DIGITAL Y DESTINOS TOP) */}
      {/* ==================================================================== */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>Conserjería de Lujo 24/7 & Turismo Paceño</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-black text-white leading-tight">
              Atracciones Imperdibles a Minutos del Hotel
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
            La Paz es una ciudad de contrastes cósmicos y belleza sobrecogedora. Nuestro equipo de
            conserjería coordina transfers ejecutivos, pases prioritarios y guías expertos bilingües.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              nombre: 'Red Mi Teleférico Panorámico',
              subtitulo: 'Líneas del Cielo · Vuelo sobre los Cañones Urbanos',
              badge: '★ EXPERIENCIA Nº 1 DE LA PAZ',
              distancia: 'A 5 min (Estación Sopocachi)',
              tiempo: '5 min en transfer',
              altitud: '3.600 a 4.090 msnm',
              mejorHora: 'Atardecer (17:30 - 18:30)',
              icono: '🚠',
              imagen: '/fachada_terraza.jpg',
              desc: 'La red de transporte por cable más alta y moderna del planeta. Disfruta de un recorrido aéreo inigualable surcando las nubes con el imponente Nevado Illimani en el horizonte.',
              puntos: ['Línea Amarilla y Celeste con vista 360°', 'Cabinas vidriadas de última generación', 'Tarjeta prepago de cortesía en recepción'],
            },
            {
              nombre: 'Valle de la Luna (Moon Valley)',
              subtitulo: 'Maravilla Geológica · Esculturas de Arcilla Milenarias',
              badge: '🌕 PAISAJE LUNAR ÚNICO',
              distancia: 'A 15 min en transfer privado (Mallasa)',
              tiempo: '15 min en transfer',
              altitud: '3.400 msnm (Ideal Aclimatación)',
              mejorHora: 'Mañanas soleadas (10:00 - 13:00)',
              icono: '🌕',
              imagen: '/fachada_lateral_der.jpg',
              desc: 'Un paisaje de otro mundo formado por la erosión de millones de años. Camina entre obeliscos y cañones arcillosos en senderos seguros con temperaturas cálidas.',
              puntos: ['Senderos señalizados de baja exigencia', 'Microclima templado en el sur paceño', 'Servicio de transfer privado con chofer'],
            },
            {
              nombre: 'Mirador Killi Killi 360°',
              subtitulo: 'El Balcón Sagrado · La Panorámica Definitiva',
              badge: '📸 FOTO POSTAL DEL ILLIMANI',
              distancia: 'A 12 min del hotel (Villa Pabón)',
              tiempo: '12 min en transfer',
              altitud: '3.740 msnm',
              mejorHora: 'Mediodía o Anochecer',
              icono: '🏔️',
              imagen: '/Fondo.jpg',
              desc: 'El punto de observación más fotogénico de Sudamérica. Toda la cuenca paceña se despliega en forma de anfiteatro andino con el coloso nevado de 6.438 metros vigilando.',
              puntos: ['Panorámica de 360 grados sin obstáculos', 'Vista nocturna brillante como un manto estelar', 'Punto recomendado por National Geographic'],
            },
            {
              nombre: 'Calle Jaén & Mercado de las Brujas',
              subtitulo: 'Casco Histórico · Tradición, Oro y Misticismo Andino',
              badge: '✨ PATRIMONIO CULTURAL VIVO',
              distancia: 'A 10 min del hotel (Centro Histórico)',
              tiempo: '10 min en transfer',
              altitud: '3.630 msnm',
              mejorHora: 'Tarde cultural (14:30 - 18:00)',
              icono: '🏛️',
              imagen: '/fachada_frontal.jpg',
              desc: 'Pasea por la calle colonial mejor preservada de La Paz con arquitectura del siglo XVIII y 4 museos de oro precolombino, junto al legendario mercado de cosmovisión y artesanías finas de alpaca.',
              puntos: ['Textiles de baby alpaca y orfebrería en plata', 'Museos de Metales Preciosos y Costumbrista', 'Cafeterías de autor con café de altura de Yungas'],
            },
          ].map((t, idx) => (
            <div
              key={idx}
              className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all duration-500 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-amber-500/10"
            >
              {/* Imagen con Overlay de Gradiente */}
              <div className="relative h-64 sm:h-72 overflow-hidden">
                <img
                  src={t.imagen}
                  alt={t.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75 group-hover:brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

                {/* Badge Superior */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-500/30 shadow-lg flex items-center gap-1.5">
                    <span>{t.icono}</span>
                    <span>{t.badge}</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-600/90 text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>{t.tiempo}</span>
                  </span>
                </div>

                {/* Información en la base de la imagen */}
                <div className="absolute bottom-4 left-6 right-6">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 block mb-1">
                    {t.subtitulo}
                  </span>
                  <h3 className="text-2xl font-serif font-black text-white group-hover:text-amber-300 transition-colors">
                    {t.nombre}
                  </h3>
                </div>
              </div>

              {/* Contenido Detallado */}
              <div className="p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {t.desc}
                </p>

                {/* Datos Prácticos de Viaje */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mountain className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Altitud</span>
                      <span className="font-mono font-bold text-white text-[11px]">{t.altitud}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mejor Hora</span>
                      <span className="font-semibold text-white text-[11px]">{t.mejorHora}</span>
                    </div>
                  </div>
                </div>

                {/* Lista de Highlights */}
                <div className="space-y-1.5">
                  {t.puntos.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>

                {/* Botón de Coordinación en Conserjería */}
                <div className="pt-2">
                  <button
                    onClick={onIniciarSesion}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Consultar Excursión en Recepción</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Banner Inferior de Conserjería 24/7 */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-serif font-bold text-white">
                ¿Deseas una visita guiada personalizada por La Paz?
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Nuestro equipo de conserjería organiza itinerarios privados con chofer bilingüe,
                oxígeno a bordo, traslados desde el hotel y boletos directos sin filas para el teleférico.
              </p>
            </div>
          </div>
          <button
            onClick={onIniciarSesion}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            Reservar con Conserjería
          </button>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. FOOTER HOTELERO CON INFORMACIÓN Y ACCESOS */}
      {/* ==================================================================== */}
      <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            {/* Columna 1: Hotel */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo Hotel" className="h-10 w-auto" />
                <span className="font-serif font-bold text-white text-sm">GRAN HOTEL ILLIMANI</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                El referente indiscutible de la alta hotelería en Bolivia. Excelencia, discreción y servicio 5 estrellas.
              </p>
              <div className="text-amber-400 text-xs font-bold">★★★★★ Hotel Oficial La Paz</div>
            </div>

            {/* Columna 2: Ubicación & Contacto */}
            <div className="space-y-3 text-xs text-slate-400">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Contacto & Recepción</h5>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Av. del Libertador s/n, Sopocachi - La Paz, Bolivia</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+591 (2) 244-8000 · Front Desk 24 Horas</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span>reservas@hotelillimani.bo</span>
              </div>
            </div>

            {/* Columna 3: Enlaces Rápidos */}
            <div className="space-y-2 text-xs text-slate-400">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Navegación</h5>
              <div>
                <a href="#habitaciones" className="hover:text-amber-400 transition-colors">Suites & Habitaciones</a>
              </div>
              <div>
                <button onClick={onRegistrarse} className="hover:text-amber-400 transition-colors cursor-pointer text-left">
                  Crear Cuenta de Huésped
                </button>
              </div>
              <div>
                <button onClick={onIniciarSesion} className="hover:text-amber-400 transition-colors cursor-pointer text-left">
                  Ingreso a Mi Reserva
                </button>
              </div>
            </div>

            {/* Columna 4: Compromiso de Calidad 5 Estrellas */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" /> Excelencia Certificada
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Miembro oficial de la Red de Hoteles de Lujo de Bolivia. Protocolos de bioseguridad, servicio de conserjería 24/7 y asistencia médica en altitud.
              </p>
              <button
                onClick={onIniciarSesion}
                className="w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all cursor-pointer"
              >
                Ingreso al Sistema Hotelero
              </button>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div>
              © {new Date().getFullYear()} Gran Hotel Illimani ★★★★★. Todos los derechos reservados.
            </div>
            <div className="text-[11px] text-slate-400">
              Sistema de Gestión Hotelera Integral (SAGH)
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
