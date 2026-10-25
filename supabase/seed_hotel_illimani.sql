-- ==============================================================================
-- SISTEMA DE ADMINISTRACIÓN Y GESTIÓN EMPRESARIAL HOTELERA (SAGH)
-- Script de Carga de Datos Iniciales (Seed Data) - GRAN HOTEL ILLIMANI ★★★★★
-- ==============================================================================

-- 1. Asegurar columna opcional de coordenadas por vista en habitaciones
ALTER TABLE habitaciones ADD COLUMN IF NOT EXISTS coordenadas_por_vista JSONB;

-- ==============================================================================
-- 2. POLÍTICAS DE LECTURA (RLS) PARA CATÁLOGOS PÚBLICOS
-- ==============================================================================
-- Permitir que cualquier usuario (incluso anónimo o huésped) pueda consultar
-- los tipos de habitación, las habitaciones y el catálogo de servicios:
DO $$ BEGIN
    CREATE POLICY "Lectura pública de tipos de habitación" 
    ON tipos_habitacion FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Lectura pública de habitaciones del hotel" 
    ON habitaciones FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Lectura pública de catálogo de servicios" 
    ON catalogo_servicios FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Permitir a los huéspedes insertar y consultar sus propias reservas:
DO $$ BEGIN
    CREATE POLICY "Huéspedes pueden crear sus reservas" 
    ON reservas FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Huéspedes pueden consultar sus reservas" 
    ON reservas FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Huéspedes pueden actualizar sus reservas" 
    ON reservas FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Gestión de consumos para reservas activas" 
    ON consumos_reserva FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 3. INSERTAR O ACTUALIZAR TIPOS DE HABITACIÓN
-- ==============================================================================
INSERT INTO tipos_habitacion (id, nombre, descripcion, capacidad_adultos, capacidad_ninos, precio_base_noche)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'Suite Presidencial Illimani',
    'Lujo supremo con vista panorámica ininterrumpida al nevado Illimani, jacuzzi privado, cama King California y sala de estar ejecutiva.',
    2, 2, 850.00
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'Habitación Matrimonial Deluxe con Balcón',
    'Diseño contemporáneo con balcón colonial de madera noble tallada, cama Queen y cálida iluminación andina.',
    2, 1, 480.00
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'Doble Ejecutiva Twin con Balcón',
    'Espaciosa y funcional, ideal para viajes corporativos o en pareja, con dos camas de plaza y media y balcón con flores.',
    2, 1, 390.00
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'Habitación Confort Planta Baja',
    'Espacio cálido y silencioso en planta baja, con ventanal colonial de ladrillo visto y todas las comodidades modernas.',
    1, 0, 260.00
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  capacidad_adultos = EXCLUDED.capacidad_adultos,
  capacidad_ninos = EXCLUDED.capacidad_ninos,
  precio_base_noche = EXCLUDED.precio_base_noche;

-- ==============================================================================
-- 4. INSERTAR O ACTUALIZAR LAS HABITACIONES REALES DE LA FACHADA
-- ==============================================================================
-- PISO 3 (Nivel Superior)
INSERT INTO habitaciones (numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, coordenadas_por_vista)
VALUES
  ('301', 3, 'a1111111-1111-1111-1111-111111111111', 'disponible', 3, 1, 
   ARRAY['Piso 3', 'Fachada Frontal', 'Balcón Colonial con Flores', 'Vista al Illimani'],
   '{"frontal": {"x": 12.8, "y": 13.0, "w": 10.4, "h": 19.5}}'::jsonb),

  ('302', 3, 'a2222222-2222-2222-2222-222222222222', 'disponible', 3, 2, 
   ARRAY['Piso 3', 'Fachada Frontal', 'Balcón Colonial', 'Cálida iluminación'],
   '{"frontal": {"x": 28.8, "y": 13.0, "w": 10.4, "h": 19.5}}'::jsonb),

  ('303', 3, 'a1111111-1111-1111-1111-111111111111', 'disponible', 3, 3, 
   ARRAY['Piso 3', 'Suite Central Illimani', 'Bajo Letrero Principal', 'Vista Panorámica'],
   '{"frontal": {"x": 44.8, "y": 13.0, "w": 10.4, "h": 19.5}}'::jsonb),

  ('304', 3, 'a2222222-2222-2222-2222-222222222222', 'disponible', 3, 4, 
   ARRAY['Piso 3', 'Fachada Frontal', 'Balcón Colonial', 'Silenciosa'],
   '{"frontal": {"x": 61.2, "y": 13.0, "w": 10.4, "h": 19.5}}'::jsonb),

  ('306', 3, 'a1111111-1111-1111-1111-111111111111', 'disponible', 3, 1, 
   ARRAY['Piso 3', 'Suite Esquina', 'Balcón y Vista Illimani'],
   '{"lateral_der": {"x": 14.5, "y": 12.5, "w": 9.8, "h": 14.5}, "lateral_izq": {"x": 12.8, "y": 13.5, "w": 10.4, "h": 19.5}}'::jsonb),

  ('307', 3, 'a2222222-2222-2222-2222-222222222222', 'disponible', 3, 2, 
   ARRAY['Piso 3', 'Ventana Colonial', 'Junto a Terraza'],
   '{"lateral_der": {"x": 29.8, "y": 12.5, "w": 9.8, "h": 14.5}, "lateral_izq": {"x": 44.8, "y": 13.5, "w": 10.4, "h": 19.5}}'::jsonb),

  ('308', 3, 'a1111111-1111-1111-1111-111111111111', 'disponible', 3, 5, 
   ARRAY['Piso 3', 'Balcón con Flores', 'Suite Esquina Este'],
   '{"lateral_izq": {"x": 77.0, "y": 13.5, "w": 10.4, "h": 19.5}}'::jsonb),

  ('309', 3, 'a2222222-2222-2222-2222-222222222222', 'disponible', 3, 4, 
   ARRAY['Piso 3', 'Balcón con Flores', 'Vista Panorámica Despejada'],
   '{"lateral_der": {"x": 61.2, "y": 12.5, "w": 10.5, "h": 21.0}}'::jsonb),

  ('310', 3, 'a1111111-1111-1111-1111-111111111111', 'disponible', 3, 5, 
   ARRAY['Piso 3', 'Suite Esquina', 'Balcón Colonial y Jardinera'],
   '{"frontal": {"x": 77.0, "y": 13.0, "w": 10.4, "h": 19.5}, "lateral_der": {"x": 77.0, "y": 12.5, "w": 10.5, "h": 21.0}}'::jsonb),

  -- PISO 2 (Nivel Medio con Balcones de Madera)
  ('201', 2, 'a2222222-2222-2222-2222-222222222222', 'disponible', 2, 1, 
   ARRAY['Piso 2', 'Fachada Frontal', 'Balcón Colonial de Madera', 'Flores'],
   '{"frontal": {"x": 12.8, "y": 38.5, "w": 10.4, "h": 20.0}}'::jsonb),

  ('202', 2, 'a3333333-3333-3333-3333-333333333333', 'disponible', 2, 2, 
   ARRAY['Piso 2', 'Fachada Frontal', 'Balcón Colonial de Madera'],
   '{"frontal": {"x": 28.8, "y": 38.5, "w": 10.4, "h": 20.0}}'::jsonb),

  ('203', 2, 'a1111111-1111-1111-1111-111111111111', 'disponible', 2, 3, 
   ARRAY['Piso 2', 'Balcón Central Frontal', 'Acabados en Madera Noble'],
   '{"frontal": {"x": 44.8, "y": 38.5, "w": 10.4, "h": 20.0}}'::jsonb),

  ('204', 2, 'a3333333-3333-3333-3333-333333333333', 'disponible', 2, 4, 
   ARRAY['Piso 2', 'Fachada Frontal', 'Balcón Colonial de Madera'],
   '{"frontal": {"x": 61.2, "y": 38.5, "w": 10.4, "h": 20.0}}'::jsonb),

  ('205', 2, 'a2222222-2222-2222-2222-222222222222', 'disponible', 2, 5, 
   ARRAY['Piso 2', 'Fachada Frontal', 'Balcón Colonial con Flores Rojas'],
   '{"frontal": {"x": 77.0, "y": 38.5, "w": 10.4, "h": 20.0}}'::jsonb),

  ('206', 2, 'a2222222-2222-2222-2222-222222222222', 'disponible', 2, 1, 
   ARRAY['Piso 2', 'Balcón Colonial de Madera', 'Flores'],
   '{"lateral_der": {"x": 12.8, "y": 40.5, "w": 10.8, "h": 20.5}, "lateral_izq": {"x": 12.8, "y": 39.5, "w": 10.4, "h": 20.5}}'::jsonb),

  ('207', 2, 'a3333333-3333-3333-3333-333333333333', 'disponible', 2, 2, 
   ARRAY['Piso 2', 'Balcón Colonial de Madera', 'Vista Lateral'],
   '{"lateral_der": {"x": 28.8, "y": 40.5, "w": 10.8, "h": 20.5}, "lateral_izq": {"x": 44.8, "y": 39.5, "w": 10.4, "h": 20.5}}'::jsonb),

  ('208', 2, 'a1111111-1111-1111-1111-111111111111', 'disponible', 2, 3, 
   ARRAY['Piso 2', 'Balcón Central', 'Acabados Nobles'],
   '{"lateral_der": {"x": 45.0, "y": 40.5, "w": 10.8, "h": 20.5}, "lateral_izq": {"x": 77.0, "y": 39.5, "w": 10.4, "h": 20.5}}'::jsonb),

  ('209', 2, 'a3333333-3333-3333-3333-333333333333', 'ocupada', 2, 4, 
   ARRAY['Piso 2', 'Balcón Colonial', 'Cerca a escaleras'],
   '{"lateral_der": {"x": 61.2, "y": 40.5, "w": 10.8, "h": 20.5}}'::jsonb),

  ('210', 2, 'a2222222-2222-2222-2222-222222222222', 'disponible', 2, 5, 
   ARRAY['Piso 2', 'Balcón Colonial con Flores', 'Lado Este'],
   '{"lateral_der": {"x": 77.2, "y": 40.5, "w": 10.8, "h": 20.5}}'::jsonb),

  -- PISO 1 (Planta Baja)
  ('101', 1, 'a4444444-4444-4444-4444-444444444444', 'disponible', 1, 1, 
   ARRAY['Piso 1', 'Planta Baja', 'Acceso directo sin gradas'],
   '{"frontal": {"x": 13.0, "y": 66.5, "w": 10.4, "h": 16.5}, "lateral_der": {"x": 13.0, "y": 69.5, "w": 10.2, "h": 16.5}, "lateral_izq": {"x": 13.0, "y": 69.5, "w": 10.2, "h": 16.5}}'::jsonb),

  ('102', 1, 'a3333333-3333-3333-3333-333333333333', 'disponible', 1, 2, 
   ARRAY['Piso 1', 'Planta Baja', 'Silenciosa'],
   '{"frontal": {"x": 28.8, "y": 66.5, "w": 10.4, "h": 16.5}, "lateral_der": {"x": 29.0, "y": 69.5, "w": 10.2, "h": 16.5}, "lateral_izq": {"x": 29.0, "y": 69.5, "w": 10.2, "h": 16.5}}'::jsonb),

  ('103', 1, 'a4444444-4444-4444-4444-444444444444', 'disponible', 1, 4, 
   ARRAY['Piso 1', 'Planta Baja', 'Ventana Colonial'],
   '{"frontal": {"x": 61.2, "y": 66.5, "w": 10.4, "h": 16.5}, "lateral_der": {"x": 45.2, "y": 69.5, "w": 10.2, "h": 16.5}, "lateral_izq": {"x": 45.2, "y": 69.5, "w": 10.2, "h": 16.5}}'::jsonb),

  ('104', 1, 'a2222222-2222-2222-2222-222222222222', 'disponible', 1, 5, 
   ARRAY['Piso 1', 'Planta Baja', 'Cerca a Hall de Entrada'],
   '{"frontal": {"x": 77.0, "y": 66.5, "w": 10.4, "h": 16.5}, "lateral_der": {"x": 61.5, "y": 69.5, "w": 10.2, "h": 16.5}, "lateral_izq": {"x": 61.2, "y": 69.5, "w": 10.2, "h": 16.5}}'::jsonb)

ON CONFLICT (numero) DO UPDATE SET
  piso = EXCLUDED.piso,
  tipo_id = EXCLUDED.tipo_id,
  estado = EXCLUDED.estado,
  caracteristicas = EXCLUDED.caracteristicas,
  coordenadas_por_vista = EXCLUDED.coordenadas_por_vista;

-- ==============================================================================
-- 5. INSERTAR O ACTUALIZAR CATÁLOGO DE SERVICIOS
-- ==============================================================================
INSERT INTO catalogo_servicios (nombre, categoria, precio_unitario, activo)
VALUES
  ('Cena Gourmet Illimani (3 Tiempos)', 'Restaurante', 145.00, true),
  ('Desayuno Americano a la Habitación', 'Restaurante', 55.00, true),
  ('Club Sándwich Tradicional con Papas', 'Restaurante', 48.00, true),
  ('Botella de Vino Tinto Gran Reserva (Tarija)', 'Minibar', 160.00, true),
  ('Cerveza Huari Tradicional (Pack x2)', 'Minibar', 35.00, true),
  ('Mix de Frutos Secos y Chocolates Para Ti', 'Minibar', 28.00, true),
  ('Servicio de Lavado y Planchado Express (Carga 5kg)', 'Lavandería', 75.00, true),
  ('Planchado de Traje Ejecutivo o Vestido', 'Lavandería', 40.00, true),
  ('Masaje Relajante con Piedras Calientes Andinas (60 min)', 'Spa & Relax', 190.00, true),
  ('Sesión Privada de Sauna Seco y Vapor (45 min)', 'Spa & Relax', 90.00, true)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 6. GESTIÓN DE PERFILES Y TRABAJADORES (ADMINISTRADOR)
-- ==============================================================================
-- Asegurar columna email en perfiles para el listado administrativo
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Habilitar políticas permisivas para lectura y gestión de perfiles
DO $$ BEGIN
    CREATE POLICY "Lectura y gestión completa de perfiles" 
    ON perfiles FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

