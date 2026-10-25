import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Wine,
  Sparkles,
  Shirt,
  RefreshCw,
  Power,
  Search,
  Check,
  Tag,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CatalogoServicio } from '../../types/database';

export const CatalogoServiciosAdmin: React.FC = () => {
  const [servicios, setServicios] = useState<CatalogoServicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [editandoPrecioId, setEditandoPrecioId] = useState<string | null>(null);
  const [nuevoPrecio, setNuevoPrecio] = useState<number>(0);

  const cargarServicios = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('catalogo_servicios')
        .select('*')
        .order('categoria', { ascending: true });

      if (!error && data) {
        setServicios(data);
      }
    } catch (err) {
      console.warn('[CatalogoServicios] Error cargando:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  const handleToggleActivo = async (id: string, activoActual: boolean) => {
    const nuevo = !activoActual;
    setServicios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, activo: nuevo } : s))
    );

    try {
      await supabase
        .from('catalogo_servicios')
        .update({ activo: nuevo })
        .eq('id', id);
    } catch (err) {
      console.error('[CatalogoServicios] Error toggling:', err);
    }
  };

  const guardarPrecio = async (id: string) => {
    if (nuevoPrecio <= 0) return;

    setServicios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, precio_unitario: nuevoPrecio } : s))
    );
    setEditandoPrecioId(null);

    try {
      await supabase
        .from('catalogo_servicios')
        .update({ precio_unitario: nuevoPrecio })
        .eq('id', id);
    } catch (err) {
      console.error('[CatalogoServicios] Error actualizando precio:', err);
    }
  };

  const serviciosFiltrados = servicios.filter((s) => {
    const coincideTexto = s.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCat = filtroCategoria === 'todos' || s.categoria === filtroCategoria;
    return coincideTexto && coincideCat;
  });

  const getCategoriaIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'restaurante':
        return <UtensilsCrossed className="w-4 h-4 text-amber-400" />;
      case 'minibar':
        return <Wine className="w-4 h-4 text-purple-400" />;
      case 'lavandería':
      case 'lavanderia':
        return <Shirt className="w-4 h-4 text-blue-400" />;
      case 'spa & relax':
      case 'spa':
        return <Sparkles className="w-4 h-4 text-teal-400" />;
      default:
        return <Tag className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Gastronomía, Bar y Spa 5 Estrellas
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            Catálogo de Servicios y Tarifas
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Gestiona los servicios adicionales disponibles para los huéspedes: restaurante gourmet, minibar, lavandería express y circuito de spa.
          </p>
        </div>

        <button
          onClick={cargarServicios}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          <span>Actualizar Lista</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar servicio (ej. Cena, Masaje, Vino)..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-3 py-2 text-xs font-medium bg-slate-900/80 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="todos">Todas las Categorías</option>
          <option value="Restaurante">Restaurante Gourmet</option>
          <option value="Minibar">Minibar & Cava</option>
          <option value="Lavandería">Lavandería Express</option>
          <option value="Spa & Relax">Spa & Relax Andino</option>
        </select>
      </div>

      {/* Tabla de Servicios */}
      <div className="overflow-hidden rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-xl">
        <table className="w-full text-left text-sm text-slate-200">
          <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
            <tr>
              <th className="py-3.5 px-4 sm:px-6 font-semibold">Servicio / Experiencia</th>
              <th className="py-3.5 px-4 font-semibold">Categoría</th>
              <th className="py-3.5 px-4 font-semibold">Precio Unitario</th>
              <th className="py-3.5 px-4 font-semibold text-center">Disponibilidad</th>
              <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {cargando ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                  Cargando catálogo...
                </td>
              </tr>
            ) : serviciosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No se encontraron servicios registrados.
                </td>
              </tr>
            ) : (
              serviciosFiltrados.map((servicio) => (
                <tr
                  key={servicio.id}
                  className={`hover:bg-slate-700/30 transition-colors ${
                    !servicio.activo ? 'opacity-50 bg-slate-900/30' : ''
                  }`}
                >
                  {/* Nombre */}
                  <td className="py-4 px-4 sm:px-6 font-medium text-white">
                    {servicio.nombre}
                  </td>

                  {/* Categoría */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-700">
                      {getCategoriaIcon(servicio.categoria)}
                      <span>{servicio.categoria}</span>
                    </span>
                  </td>

                  {/* Precio */}
                  <td className="py-4 px-4">
                    {editandoPrecioId === servicio.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          value={nuevoPrecio}
                          onChange={(e) => setNuevoPrecio(parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-xs bg-slate-900 border border-amber-500 rounded text-white font-mono"
                        />
                        <button
                          onClick={() => guardarPrecio(servicio.id)}
                          className="p-1 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditandoPrecioId(servicio.id);
                          setNuevoPrecio(servicio.precio_unitario);
                        }}
                        className="font-mono font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1 group"
                        title="Clic para editar precio"
                      >
                        <span>Bs. {Number(servicio.precio_unitario).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          ✏️
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Activo / Inactivo */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleActivo(servicio.id, servicio.activo)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        servicio.activo
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {servicio.activo ? 'Activo' : 'Pausado'}
                    </button>
                  </td>

                  {/* Acción rápida */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <button
                      onClick={() => {
                        setEditandoPrecioId(servicio.id);
                        setNuevoPrecio(servicio.precio_unitario);
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      Modificar Precio
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
