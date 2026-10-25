// ==============================================================================
// DATOS MAESTROS Y SERVICIOS INICIALES - GRAN HOTEL ILLIMANI
// ==============================================================================

export interface TipoHabitacionMock {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad_adultos: number;
  capacidad_ninos: number;
  precio_base_noche: number;
  imagen: string;
  amenidades: string[];
}

export type VistaFachada = 'frontal' | 'lateral_izq' | 'lateral_der';

export interface CoordenadasHotspot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HabitacionMock {
  id: string;
  numero: string;
  piso: number;
  tipo_id: string;
  estado: 'disponible' | 'ocupada' | 'limpieza' | 'mantenimiento';
  caracteristicas: string[];
  coordenadasPorVista: Partial<Record<VistaFachada, CoordenadasHotspot>>;
}

export interface ServicioMock {
  id: string;
  nombre: string;
  categoria: 'Restaurante' | 'Minibar' | 'Lavandería' | 'Spa & Relax';
  descripcion: string;
  precio_unitario: number;
  icono: string;
}

export const TIPOS_HABITACION_SEED: TipoHabitacionMock[] = [
  {
    id: 'tipo-suite-presidencial',
    nombre: 'Suite Presidencial Illimani',
    descripcion: 'Lujo supremo con vista panorámica ininterrumpida al nevado Illimani, jacuzzi privado, cama King California y sala de estar ejecutiva.',
    capacidad_adultos: 2,
    capacidad_ninos: 2,
    precio_base_noche: 850,
    imagen: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    amenidades: ['Vista Panorámica al Illimani', 'Jacuzzi Hidromasaje', 'Cama King Size', 'Wi-Fi 6 de Alta Velocidad', 'Cafetera Nespresso', 'Smart TV 65" 4K', 'Desayuno Buffet Incluido'],
  },
  {
    id: 'tipo-matrimonial-deluxe',
    nombre: 'Habitación Matrimonial Deluxe con Balcón',
    descripcion: 'Diseño contemporáneo con balcón colonial de madera noble tallada, cama Queen y cálida iluminación andina.',
    capacidad_adultos: 2,
    capacidad_ninos: 1,
    precio_base_noche: 480,
    imagen: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    amenidades: ['Balcón Colonial Tallado', 'Cama Queen Size', 'Climatización Inteligente', 'Minibar Premium', 'Baño en Mármol', 'Caja Fuerte Digital'],
  },
  {
    id: 'tipo-doble-ejecutiva',
    nombre: 'Doble Ejecutiva Twin con Balcón',
    descripcion: 'Espaciosa y funcional, ideal para viajes corporativos o en pareja, con dos camas de plaza y media y balcón con flores.',
    capacidad_adultos: 2,
    capacidad_ninos: 1,
    precio_base_noche: 390,
    imagen: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    amenidades: ['Dos Camas Twin', 'Balcón con Jardineras', 'Escritorio de Trabajo', 'Wi-Fi 6', 'Ducha Española', 'Servicio a la Habitación 24/7'],
  },
  {
    id: 'tipo-simple-confort',
    nombre: 'Habitación Confort Planta Baja',
    descripcion: 'Espacio cálido y silencioso en planta baja, con ventanal colonial de ladrillo visto y todas las comodidades modernas.',
    capacidad_adultos: 1,
    capacidad_ninos: 0,
    precio_base_noche: 260,
    imagen: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    amenidades: ['Cama de 1.5 Plazas', 'Smart TV', 'Insonorización Acústica', 'Fácil acceso sin gradas', 'Wi-Fi de Alta Velocidad'],
  },
];

// Inventario exacto correspondiente a las fachadas Frontal, Lateral Izquierdo y Lateral Derecho del Gran Hotel Illimani
export const HABITACIONES_SEED: HabitacionMock[] = [
  // ================= PISO 3 (Nivel Superior) =================
  {
    id: 'hab-301',
    numero: '301',
    piso: 3,
    tipo_id: 'tipo-suite-presidencial',
    estado: 'disponible',
    caracteristicas: ['Piso 3', 'Fachada Frontal', 'Balcón Colonial con Flores', 'Vista al Illimani'],
    coordenadasPorVista: {
      frontal: { x: 12.8, y: 13.0, w: 10.4, h: 19.5 },
    },
  },
  {
    id: 'hab-302',
    numero: '302',
    piso: 3,
    tipo_id: 'tipo-matrimonial-deluxe',
    estado: 'disponible',
    caracteristicas: ['Piso 3', 'Fachada Frontal', 'Balcón Colonial', 'Cálida iluminación'],
    coordenadasPorVista: {
      frontal: { x: 28.8, y: 13.0, w: 10.4, h: 19.5 },
    },
  },
  {
    id: 'hab-303',
    numero: '303',
    piso: 3,
    tipo_id: 'tipo-suite-presidencial',
    estado: 'disponible',
    caracteristicas: ['Piso 3', 'Suite Central Illimani', 'Bajo Letrero Principal', 'Vista Panorámica'],
    coordenadasPorVista: {
      frontal: { x: 44.8, y: 13.0, w: 10.4, h: 19.5 },
    },
  },
  {
    id: 'hab-304',
    numero: '304',
    piso: 3,
    tipo_id: 'tipo-matrimonial-deluxe',
    estado: 'disponible',
    caracteristicas: ['Piso 3', 'Fachada Frontal', 'Balcón Colonial', 'Silenciosa'],
    coordenadasPorVista: {
      frontal: { x: 61.2, y: 13.0, w: 10.4, h: 19.5 },
    },
  },
  {
    id: 'hab-306',
    numero: '306',
    piso: 3,
    tipo_id: 'tipo-suite-presidencial',
    estado: 'disponible',
    caracteristicas: ['Piso 3', 'Suite Esquina', 'Balcón y Vista Illimani'],
    coordenadasPorVista: {
      lateral_der: { x: 14.5, y: 12.5, w: 9.8, h: 14.5 },
      lateral_izq: { x: 12.8, y: 13.5, w: 10.4, h: 19.5 },
    },
  },
  {
    id: 'hab-307',
    numero: '307',
    piso: 3,
    tipo_id: 'tipo-matrimonial-deluxe',
    estado: 'disponible',
    caracteristicas: ['Piso 3', 'Ventana Colonial', 'Junto a Terraza'],
    coordenadasPorVista: {
      lateral_der: { x: 29.8, y: 12.5, w: 9.8, h: 14.5 },
      lateral_izq: { x: 44.8, y: 13.5, w: 10.4, h: 19.5 },
    },
  },
  {
    id: 'hab-308',
    numero: '308',
    piso: 3,
    tipo_id: 'tipo-suite-presidencial',
    estado: 'disponible',
    caracteristicas: ['Piso 3', 'Balcón con Flores', 'Suite Esquina Este'],
    coordenadasPorVista: {
      lateral_izq: { x: 77.0, y: 13.5, w: 10.4, h: 19.5 },
    },
  },
  {
    id: 'hab-309',
    numero: '309',
    piso: 3,
    tipo_id: 'tipo-matrimonial-deluxe',
    estado: 'disponible',
    caracteristicas: ['Piso 3', 'Balcón con Flores', 'Vista Panorámica Despejada'],
    coordenadasPorVista: {
      lateral_der: { x: 61.2, y: 12.5, w: 10.5, h: 21.0 },
    },
  },
  {
    id: 'hab-310',
    numero: '310',
    piso: 3,
    tipo_id: 'tipo-suite-presidencial',
    estado: 'disponible',
    caracteristicas: ['Piso 3', 'Suite Esquina', 'Balcón Colonial y Jardinera'],
    coordenadasPorVista: {
      frontal: { x: 77.0, y: 13.0, w: 10.4, h: 19.5 },
      lateral_der: { x: 77.0, y: 12.5, w: 10.5, h: 21.0 },
    },
  },

  // ================= PISO 2 (Nivel Medio con Balcones de Madera) =================
  {
    id: 'hab-201',
    numero: '201',
    piso: 2,
    tipo_id: 'tipo-matrimonial-deluxe',
    estado: 'disponible',
    caracteristicas: ['Piso 2', 'Fachada Frontal', 'Balcón Colonial de Madera', 'Flores'],
    coordenadasPorVista: {
      frontal: { x: 12.8, y: 38.5, w: 10.4, h: 20.0 },
    },
  },
  {
    id: 'hab-202',
    numero: '202',
    piso: 2,
    tipo_id: 'tipo-doble-ejecutiva',
    estado: 'disponible',
    caracteristicas: ['Piso 2', 'Fachada Frontal', 'Balcón Colonial de Madera'],
    coordenadasPorVista: {
      frontal: { x: 28.8, y: 38.5, w: 10.4, h: 20.0 },
    },
  },
  {
    id: 'hab-203',
    numero: '203',
    piso: 2,
    tipo_id: 'tipo-suite-presidencial',
    estado: 'disponible',
    caracteristicas: ['Piso 2', 'Balcón Central Frontal', 'Acabados en Madera Noble'],
    coordenadasPorVista: {
      frontal: { x: 44.8, y: 38.5, w: 10.4, h: 20.0 },
    },
  },
  {
    id: 'hab-204',
    numero: '204',
    piso: 2,
    tipo_id: 'tipo-doble-ejecutiva',
    estado: 'disponible',
    caracteristicas: ['Piso 2', 'Fachada Frontal', 'Balcón Colonial de Madera'],
    coordenadasPorVista: {
      frontal: { x: 61.2, y: 38.5, w: 10.4, h: 20.0 },
    },
  },
  {
    id: 'hab-205',
    numero: '205',
    piso: 2,
    tipo_id: 'tipo-matrimonial-deluxe',
    estado: 'disponible',
    caracteristicas: ['Piso 2', 'Fachada Frontal', 'Balcón Colonial con Flores Rojas'],
    coordenadasPorVista: {
      frontal: { x: 77.0, y: 38.5, w: 10.4, h: 20.0 },
    },
  },
  {
    id: 'hab-206',
    numero: '206',
    piso: 2,
    tipo_id: 'tipo-matrimonial-deluxe',
    estado: 'disponible',
    caracteristicas: ['Piso 2', 'Balcón Colonial de Madera', 'Flores'],
    coordenadasPorVista: {
      lateral_der: { x: 12.8, y: 40.5, w: 10.8, h: 20.5 },
      lateral_izq: { x: 12.8, y: 39.5, w: 10.4, h: 20.5 },
    },
  },
  {
    id: 'hab-207',
    numero: '207',
    piso: 2,
    tipo_id: 'tipo-doble-ejecutiva',
    estado: 'disponible',
    caracteristicas: ['Piso 2', 'Balcón Colonial de Madera', 'Vista Lateral'],
    coordenadasPorVista: {
      lateral_der: { x: 28.8, y: 40.5, w: 10.8, h: 20.5 },
      lateral_izq: { x: 44.8, y: 39.5, w: 10.4, h: 20.5 },
    },
  },
  {
    id: 'hab-208',
    numero: '208',
    piso: 2,
    tipo_id: 'tipo-suite-presidencial',
    estado: 'disponible',
    caracteristicas: ['Piso 2', 'Balcón Central', 'Acabados Nobles'],
    coordenadasPorVista: {
      lateral_der: { x: 45.0, y: 40.5, w: 10.8, h: 20.5 },
      lateral_izq: { x: 77.0, y: 39.5, w: 10.4, h: 20.5 },
    },
  },
  {
    id: 'hab-209',
    numero: '209',
    piso: 2,
    tipo_id: 'tipo-doble-ejecutiva',
    estado: 'ocupada',
    caracteristicas: ['Piso 2', 'Balcón Colonial', 'Cerca a escaleras'],
    coordenadasPorVista: {
      lateral_der: { x: 61.2, y: 40.5, w: 10.8, h: 20.5 },
    },
  },
  {
    id: 'hab-210',
    numero: '210',
    piso: 2,
    tipo_id: 'tipo-matrimonial-deluxe',
    estado: 'disponible',
    caracteristicas: ['Piso 2', 'Balcón Colonial con Flores', 'Lado Este'],
    coordenadasPorVista: {
      lateral_der: { x: 77.2, y: 40.5, w: 10.8, h: 20.5 },
    },
  },

  // ================= PISO 1 (Planta Baja) =================
  {
    id: 'hab-101',
    numero: '101',
    piso: 1,
    tipo_id: 'tipo-simple-confort',
    estado: 'disponible',
    caracteristicas: ['Piso 1', 'Planta Baja', 'Acceso directo sin gradas'],
    coordenadasPorVista: {
      frontal: { x: 13.0, y: 66.5, w: 10.4, h: 16.5 },
      lateral_der: { x: 13.0, y: 69.5, w: 10.2, h: 16.5 },
      lateral_izq: { x: 13.0, y: 69.5, w: 10.2, h: 16.5 },
    },
  },
  {
    id: 'hab-102',
    numero: '102',
    piso: 1,
    tipo_id: 'tipo-doble-ejecutiva',
    estado: 'disponible',
    caracteristicas: ['Piso 1', 'Planta Baja', 'Silenciosa'],
    coordenadasPorVista: {
      frontal: { x: 28.8, y: 66.5, w: 10.4, h: 16.5 },
      lateral_der: { x: 29.0, y: 69.5, w: 10.2, h: 16.5 },
      lateral_izq: { x: 29.0, y: 69.5, w: 10.2, h: 16.5 },
    },
  },
  {
    id: 'hab-103',
    numero: '103',
    piso: 1,
    tipo_id: 'tipo-simple-confort',
    estado: 'disponible',
    caracteristicas: ['Piso 1', 'Planta Baja', 'Ventana Colonial'],
    coordenadasPorVista: {
      frontal: { x: 61.2, y: 66.5, w: 10.4, h: 16.5 },
      lateral_der: { x: 45.2, y: 69.5, w: 10.2, h: 16.5 },
      lateral_izq: { x: 45.2, y: 69.5, w: 10.2, h: 16.5 },
    },
  },
  {
    id: 'hab-104',
    numero: '104',
    piso: 1,
    tipo_id: 'tipo-matrimonial-deluxe',
    estado: 'disponible',
    caracteristicas: ['Piso 1', 'Planta Baja', 'Cerca a Hall de Entrada'],
    coordenadasPorVista: {
      frontal: { x: 77.0, y: 66.5, w: 10.4, h: 16.5 },
      lateral_der: { x: 61.5, y: 69.5, w: 10.2, h: 16.5 },
      lateral_izq: { x: 61.2, y: 69.5, w: 10.2, h: 16.5 },
    },
  },
];

export const SERVICIOS_SEED: ServicioMock[] = [
  // Restaurante & Room Service
  {
    id: 'serv-cena-illimani',
    nombre: 'Cena Gourmet Illimani (3 Tiempos)',
    categoria: 'Restaurante',
    descripcion: 'Entrada de trucha del Titicaca, medallón de res a la pimienta andina y postre de chocolate amazónico.',
    precio_unitario: 145,
    icono: 'UtensilsCrossed',
  },
  {
    id: 'serv-desayuno-americano',
    nombre: 'Desayuno Americano a la Habitación',
    categoria: 'Restaurante',
    descripcion: 'Huevos revueltos, tocino crocante, jugo de naranja recién exprimido, tostadas artesanales y café de altura.',
    precio_unitario: 55,
    icono: 'Coffee',
  },
  {
    id: 'serv-sandwich-club',
    nombre: 'Club Sándwich Tradicional con Papas',
    categoria: 'Restaurante',
    descripcion: 'Pollo desmenuzado, jamón ahumado, queso, lechuga, tomate y papas fritas rústicas.',
    precio_unitario: 48,
    icono: 'Sandwich',
  },

  // Minibar
  {
    id: 'serv-vino-tarija',
    nombre: 'Botella de Vino Tinto Gran Reserva (Tarija)',
    categoria: 'Minibar',
    descripcion: 'Vino de altura premiado internacionalmente del Valle de Tarija.',
    precio_unitario: 160,
    icono: 'Wine',
  },
  {
    id: 'serv-cerveza-huari',
    nombre: 'Cerveza Huari Tradicional (Pack x2)',
    categoria: 'Minibar',
    descripcion: 'Cerveza de origen andino elaborada con agua de vertiente.',
    precio_unitario: 35,
    icono: 'Beer',
  },
  {
    id: 'serv-snack-artesanal',
    nombre: 'Mix de Frutos Secos y Chocolates Para Ti',
    categoria: 'Minibar',
    descripcion: 'Nueces de la Amazonía, pasas y bombones de Sucre.',
    precio_unitario: 28,
    icono: 'Cookie',
  },

  // Lavandería
  {
    id: 'serv-lavanderia-completa',
    nombre: 'Servicio de Lavado y Planchado Express (Carga 5kg)',
    categoria: 'Lavandería',
    descripcion: 'Entrega en 4 horas con aromatizado andino y doblado impecable.',
    precio_unitario: 75,
    icono: 'Shirt',
  },
  {
    id: 'serv-planchado-traje',
    nombre: 'Planchado de Traje Ejecutivo o Vestido',
    categoria: 'Lavandería',
    descripcion: 'Tratamiento especial para prendas formales.',
    precio_unitario: 40,
    icono: 'Sparkles',
  },

  // Spa & Relax
  {
    id: 'serv-masaje-andino',
    nombre: 'Masaje Relajante con Piedras Calientes Andinas (60 min)',
    categoria: 'Spa & Relax',
    descripcion: 'Alivio total del cansancio y mal de altura con aceites esenciales de coca y eucalipto.',
    precio_unitario: 190,
    icono: 'HeartPulse',
  },
  {
    id: 'serv-sauna-vapor',
    nombre: 'Sesión Privada de Sauna Seco y Vapor (45 min)',
    categoria: 'Spa & Relax',
    descripcion: 'Incluye toallas aromatizadas e infusión caliente de hierbas medicinales.',
    precio_unitario: 90,
    icono: 'Flame',
  },
];
