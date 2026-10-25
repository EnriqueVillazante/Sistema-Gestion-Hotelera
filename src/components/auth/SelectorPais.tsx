import React, { useState, useRef, useEffect } from 'react';
import { PAISES, type Pais } from '../../data/paises';
import { ChevronDown, Search, Check } from 'lucide-react';

interface SelectorPaisProps {
  valorSeleccionado: string; // Gentilicio o nombre guardado (ej. 'Boliviana')
  alSeleccionar: (pais: Pais) => void;
}

export const SelectorPais: React.FC<SelectorPaisProps> = ({
  valorSeleccionado,
  alSeleccionar,
}) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  // Encontrar el país seleccionado actualmente
  const paisActual =
    PAISES.find(
      (p) =>
        p.gentilicio.toLowerCase() === valorSeleccionado.toLowerCase() ||
        p.nombre.toLowerCase() === valorSeleccionado.toLowerCase()
    ) || PAISES[0]; // Por defecto Bolivia

  // Filtrar países según búsqueda
  const paisesFiltrados = PAISES.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.gentilicio.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    function manejarClickAfuera(event: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target as Node)
      ) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', manejarClickAfuera);
    return () => document.removeEventListener('mousedown', manejarClickAfuera);
  }, []);

  // Foco automático en el buscador al abrir
  useEffect(() => {
    if (abierto && inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
    }
  }, [abierto]);

  return (
    <div className="relative" ref={contenedorRef}>
      {/* Botón que despliega la lista */}
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-800 cursor-pointer"
      >
        <span className="flex items-center gap-2.5 truncate">
          <span className="text-xl leading-none">{paisActual.bandera}</span>
          <span className="font-medium text-slate-800">{paisActual.nombre}</span>
          <span className="text-xs text-slate-400">({paisActual.gentilicio})</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            abierto ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Menú desplegable */}
      {abierto && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Buscador de países */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputBusquedaRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar país..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800"
              />
            </div>
          </div>

          {/* Lista scrollable de países */}
          <div className="max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-50">
            {paisesFiltrados.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No se encontró ningún país
              </div>
            ) : (
              paisesFiltrados.map((pais) => {
                const esSeleccionado =
                  pais.codigo === paisActual.codigo ||
                  pais.gentilicio.toLowerCase() === valorSeleccionado.toLowerCase();

                return (
                  <button
                    key={pais.codigo}
                    type="button"
                    onClick={() => {
                      alSeleccionar(pais);
                      setAbierto(false);
                      setBusqueda('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                      esSeleccionado
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-lg leading-none">{pais.bandera}</span>
                      <span className="font-medium">{pais.nombre}</span>
                      <span className="text-[11px] text-slate-400">({pais.gentilicio})</span>
                    </div>

                    {esSeleccionado && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
