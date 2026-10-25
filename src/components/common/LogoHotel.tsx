import React, { useState } from 'react';

interface LogoHotelProps {
  tamano?: 'sm' | 'md' | 'lg';
  mostrarSubtitulo?: boolean;
  variante?: 'oscuro' | 'claro';
}

export const LogoHotel: React.FC<LogoHotelProps> = ({
  tamano = 'md',
  mostrarSubtitulo = true,
  variante = 'oscuro',
}) => {
  const [errorImagen, setErrorImagen] = useState(false);

  const alturaLogo =
    tamano === 'sm' ? 'h-14' : tamano === 'md' ? 'h-24 sm:h-28' : 'h-32 sm:h-36';
  const tamanoTitulo =
    tamano === 'sm'
      ? 'text-sm font-bold'
      : tamano === 'md'
      ? 'text-xl sm:text-2xl font-extrabold'
      : 'text-2xl sm:text-3xl font-extrabold';
  const tamanoSubtitulo = tamano === 'sm' ? 'text-[9px]' : 'text-[11px]';

  return (
    <div className="flex flex-col items-center text-center">
      {!errorImagen ? (
        <div className="flex items-center justify-center mb-3">
          <img
            src="/logo.png"
            alt="Gran Hotel Illimani Logo"
            className={`${alturaLogo} w-auto object-contain drop-shadow-md select-none transition-transform hover:scale-105 duration-300`}
            onError={() => setErrorImagen(true)}
          />
        </div>
      ) : (
        /* Fallback SVG elegante en caso de que logo.png no cargue */
        <div className="w-14 h-14 relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-xl shadow-amber-500/20 mb-3">
          <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center p-2">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-amber-400"
            >
              <path d="M6 36L17 18L24 28L32 14L42 36H6Z" fill="url(#goldGradient)" opacity="0.9" />
              <path d="M17 18L20 23L17 25L14 23L17 18Z" fill="#FFFFFF" />
              <path d="M32 14L35 19L32 21L29 19L32 14Z" fill="#FFFFFF" />
              <circle cx="24" cy="8" r="2.2" fill="#FBBF24" />
              <circle cx="16" cy="11" r="1.5" fill="#FCD34D" />
              <circle cx="32" cy="11" r="1.5" fill="#FCD34D" />
              <path d="M8 38H40" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="goldGradient" x1="6" y1="14" x2="42" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FDE68A" />
                  <stop offset="0.5" stopColor="#F59E0B" />
                  <stop offset="1" stopColor="#B45309" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}

      {/* Título y estrellas de prestigio */}
      <div className="space-y-0.5">
        <h1
          className={`${tamanoTitulo} tracking-tight uppercase ${
            variante === 'oscuro' ? 'text-slate-900' : 'text-white'
          }`}
        >
          <span className="font-serif font-black tracking-wider bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 bg-clip-text text-transparent">
            Gran Hotel Illimani
          </span>
        </h1>

        {mostrarSubtitulo && (
          <p
            className={`${tamanoSubtitulo} uppercase tracking-[0.2em] font-semibold text-slate-400 mt-0.5`}
          >
            ★★★★★ • La Paz, Bolivia
          </p>
        )}
      </div>
    </div>
  );
};
