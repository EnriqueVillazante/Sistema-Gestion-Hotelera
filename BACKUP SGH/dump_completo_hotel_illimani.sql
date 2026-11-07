-- ==============================================================================
-- SISTEMA DE ADMINISTRACIÓN Y GESTIÓN EMPRESARIAL HOTELERA (SAGH)
-- DUMP OFICIAL COMPLETO (DDL + DML) - GRAN HOTEL ILLIMANI ★★★★★
-- Asignatura: Taller de Sistemas II
-- ==============================================================================
-- Este script es 100% autoejecutable. Crea extensiones, tipos ENUM, esquemas,
-- tablas relacionales, llaves foráneas y restaura la totalidad de los datos.
-- Compatible tanto con PostgreSQL local (pgAdmin / psql) como con Supabase Cloud.
-- ==============================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. COMPATIBILIDAD CON SCHEMA AUTH (para ejecuciones en PostgreSQL estándar)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    email character varying,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. TIPOS ENUMERADOS DEL SISTEMA
DO $$ BEGIN
    CREATE TYPE rol_usuario AS ENUM ('admin', 'recepcionista', 'limpieza', 'huesped');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_habitacion AS ENUM ('disponible', 'ocupada', 'limpieza', 'mantenimiento');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_reserva AS ENUM ('pendiente', 'confirmada', 'en_curso', 'finalizada', 'cancelada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE metodo_pago AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'qr');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_pago AS ENUM ('anticipo', 'pago_final', 'garantia');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. ESTRUCTURA DE TABLAS (DDL)

CREATE TABLE IF NOT EXISTS public.perfiles (
  id uuid NOT NULL,
  nombre_completo character varying NOT NULL,
  telefono character varying,
  rol rol_usuario NOT NULL DEFAULT 'recepcionista'::rol_usuario,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT perfiles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.tipos_habitacion (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  capacidad_adultos integer NOT NULL DEFAULT 1,
  capacidad_ninos integer NOT NULL DEFAULT 0,
  precio_base_noche numeric NOT NULL CHECK (precio_base_noche >= 0::numeric),
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipos_habitacion_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.habitaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  numero character varying NOT NULL UNIQUE,
  piso integer NOT NULL,
  tipo_id uuid NOT NULL,
  estado estado_habitacion NOT NULL DEFAULT 'disponible'::estado_habitacion,
  fila_grid integer NOT NULL DEFAULT 1,
  columna_grid integer NOT NULL DEFAULT 1,
  caracteristicas text[],
  coordenadas_por_vista jsonb,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT habitaciones_pkey PRIMARY KEY (id),
  CONSTRAINT habitaciones_tipo_id_fkey FOREIGN KEY (tipo_id) REFERENCES public.tipos_habitacion(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.historial_limpieza (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  habitacion_id uuid NOT NULL,
  empleado_id uuid,
  fecha_inicio timestamp with time zone NOT NULL DEFAULT now(),
  fecha_fin timestamp with time zone,
  observaciones text,
  CONSTRAINT historial_limpieza_pkey PRIMARY KEY (id),
  CONSTRAINT historial_limpieza_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id) ON DELETE CASCADE,
  CONSTRAINT historial_limpieza_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.perfiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.huespedes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  usuario_id uuid UNIQUE,
  nombres character varying NOT NULL,
  apellidos character varying NOT NULL,
  tipo_documento character varying NOT NULL DEFAULT 'CI'::character varying,
  documento_identidad character varying NOT NULL UNIQUE,
  nacionalidad character varying DEFAULT 'Boliviana'::character varying,
  telefono character varying,
  email character varying,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT huespedes_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.turnos_caja (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  recepcionista_id uuid NOT NULL,
  fecha_apertura timestamp with time zone NOT NULL DEFAULT now(),
  monto_inicial numeric NOT NULL DEFAULT 0.00 CHECK (monto_inicial >= 0::numeric),
  fecha_cierre timestamp with time zone,
  monto_final_declarado numeric,
  observaciones text,
  CONSTRAINT turnos_caja_pkey PRIMARY KEY (id),
  CONSTRAINT turnos_caja_recepcionista_id_fkey FOREIGN KEY (recepcionista_id) REFERENCES public.perfiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.catalogo_servicios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  categoria character varying NOT NULL,
  precio_unitario numeric NOT NULL CHECK (precio_unitario >= 0::numeric),
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT catalogo_servicios_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.reservas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  codigo_reserva character varying NOT NULL UNIQUE,
  huesped_id uuid NOT NULL,
  habitacion_id uuid NOT NULL,
  recepcionista_id uuid,
  fecha_entrada date NOT NULL,
  fecha_salida date NOT NULL,
  check_in_real timestamp with time zone,
  check_out_real timestamp with time zone,
  precio_pactado_noche numeric NOT NULL CHECK (precio_pactado_noche >= 0::numeric),
  total_alojamiento numeric NOT NULL CHECK (total_alojamiento >= 0::numeric),
  estado estado_reserva NOT NULL DEFAULT 'confirmada'::estado_reserva,
  observaciones text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reservas_pkey PRIMARY KEY (id),
  CONSTRAINT reservas_huesped_id_fkey FOREIGN KEY (huesped_id) REFERENCES public.huespedes(id) ON DELETE CASCADE,
  CONSTRAINT reservas_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id) ON DELETE CASCADE,
  CONSTRAINT reservas_recepcionista_id_fkey FOREIGN KEY (recepcionista_id) REFERENCES public.perfiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.consumos_reserva (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reserva_id uuid NOT NULL,
  servicio_id uuid NOT NULL,
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario numeric NOT NULL CHECK (precio_unitario >= 0::numeric),
  subtotal numeric DEFAULT ((cantidad)::numeric * precio_unitario),
  fecha_consumo timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT consumos_reserva_pkey PRIMARY KEY (id),
  CONSTRAINT consumos_reserva_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON DELETE CASCADE,
  CONSTRAINT consumos_reserva_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.catalogo_servicios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.pagos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reserva_id uuid NOT NULL,
  turno_caja_id uuid,
  monto numeric NOT NULL CHECK (monto > 0::numeric),
  metodo metodo_pago NOT NULL,
  tipo tipo_pago NOT NULL DEFAULT 'pago_final'::tipo_pago,
  comprobante_ref character varying,
  registrado_por uuid,
  fecha_pago timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pagos_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id) ON DELETE CASCADE,
  CONSTRAINT pagos_turno_caja_id_fkey FOREIGN KEY (turno_caja_id) REFERENCES public.turnos_caja(id) ON DELETE SET NULL,
  CONSTRAINT pagos_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.perfiles(id) ON DELETE SET NULL
);

-- ==============================================================================
-- 5. CARGA DE DATOS (DML / INSERTS) EXTRAÍDOS DEL RESPALDO REAL
-- ==============================================================================

-- Asegurar usuarios base en auth.users para integridad referencial
INSERT INTO auth.users (id) VALUES ('0796e8d4-2b37-416c-a639-fddcad3a27a5') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.users (id) VALUES ('16063787-adb2-4c5c-aac6-47bb6091b670') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.users (id) VALUES ('1786a65a-3f87-4635-8de8-1cdaa40dd9e0') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.users (id) VALUES ('2ca4a8c0-b33d-424c-8c33-f872506580d8') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.users (id) VALUES ('35ddff02-5170-4e13-a20d-f316d1c30ed3') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.users (id) VALUES ('51ca6732-6cb2-45ae-a0e6-02c921276a52') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.users (id) VALUES ('5810726b-076b-4a45-be76-07017a639321') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.users (id) VALUES ('648a951c-7f36-4bc0-9b7a-210a643ea563') ON CONFLICT (id) DO NOTHING;
INSERT INTO auth.users (id) VALUES ('b201609f-2a23-4c51-807b-32a4f18fbeea') ON CONFLICT (id) DO NOTHING;

-- Datos para la tabla: perfiles (9 registros)
INSERT INTO public.perfiles (id, nombre_completo, telefono, rol, activo, creado_en) VALUES ('0796e8d4-2b37-416c-a639-fddcad3a27a5', 'Shirley Perez', '78563298', 'huesped', true, '2026-11-01 21:15:17.099289+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.perfiles (id, nombre_completo, telefono, rol, activo, creado_en) VALUES ('16063787-adb2-4c5c-aac6-47bb6091b670', 'pepito grillo', '78775696', 'recepcionista', true, '2026-11-01 21:12:01.388525+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.perfiles (id, nombre_completo, telefono, rol, activo, creado_en) VALUES ('1786a65a-3f87-4635-8de8-1cdaa40dd9e0', 'denisse Maya', '78654214', 'huesped', true, '2026-11-03 22:17:31.762144+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.perfiles (id, nombre_completo, telefono, rol, activo, creado_en) VALUES ('2ca4a8c0-b33d-424c-8c33-f872506580d8', 'juanito alanoca', '123456', 'recepcionista', true, '2026-11-03 22:29:14.024337+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.perfiles (id, nombre_completo, telefono, rol, activo, creado_en) VALUES ('35ddff02-5170-4e13-a20d-f316d1c30ed3', 'aleida', '7777777', 'limpieza', true, '2026-11-03 22:27:28.430345+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.perfiles (id, nombre_completo, telefono, rol, activo, creado_en) VALUES ('51ca6732-6cb2-45ae-a0e6-02c921276a52', 'mela mamani', '78541236', 'recepcionista', false, '2026-11-01 19:49:37.938776+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.perfiles (id, nombre_completo, telefono, rol, activo, creado_en) VALUES ('5810726b-076b-4a45-be76-07017a639321', 'juan mamani', '78596321', 'limpieza', false, '2026-11-01 19:54:57.855506+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.perfiles (id, nombre_completo, telefono, rol, activo, creado_en) VALUES ('648a951c-7f36-4bc0-9b7a-210a643ea563', 'Hugo Enrique Villazante Tantani', '78883325', 'admin', true, '2026-11-01 19:47:11.913406+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.perfiles (id, nombre_completo, telefono, rol, activo, creado_en) VALUES ('b201609f-2a23-4c51-807b-32a4f18fbeea', 'ado villa', '68046105', 'huesped', true, '2026-11-02 06:34:20.459376+00') ON CONFLICT (id) DO NOTHING;

-- Datos para la tabla: tipos_habitacion (4 registros)
INSERT INTO public.tipos_habitacion (id, nombre, descripcion, capacidad_adultos, capacidad_ninos, precio_base_noche, creado_en) VALUES ('a1111111-1111-1111-1111-111111111111', 'Suite Presidencial Illimani', 'Lujo supremo con vista panorámica ininterrumpida al nevado Illimani, jacuzzi privado, cama King California y sala de estar ejecutiva.', 2, 2, 850.00, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tipos_habitacion (id, nombre, descripcion, capacidad_adultos, capacidad_ninos, precio_base_noche, creado_en) VALUES ('a2222222-2222-2222-2222-222222222222', 'Habitación Matrimonial Deluxe con Balcón', 'Diseño contemporáneo con balcón colonial de madera noble tallada, cama Queen y cálida iluminación andina.', 2, 1, 480.00, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tipos_habitacion (id, nombre, descripcion, capacidad_adultos, capacidad_ninos, precio_base_noche, creado_en) VALUES ('a3333333-3333-3333-3333-333333333333', 'Doble Ejecutiva Twin con Balcón', 'Espaciosa y funcional, ideal para viajes corporativos o en pareja, con dos camas de plaza y media y balcón con flores.', 2, 1, 390.00, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.tipos_habitacion (id, nombre, descripcion, capacidad_adultos, capacidad_ninos, precio_base_noche, creado_en) VALUES ('a4444444-4444-4444-4444-444444444444', 'Habitación Confort Planta Baja', 'Espacio cálido y silencioso en planta baja, con ventanal colonial de ladrillo visto y todas las comodidades modernas.', 1, 0, 260.00, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;

-- Datos para la tabla: habitaciones (23 registros)
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('02346260-4150-4de0-bf8f-0176cb0eb1dd', '102', 1, 'a3333333-3333-3333-3333-333333333333', 'disponible', 1, 2, ARRAY['Piso 1', 'Planta Baja', 'Silenciosa'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":16.5,"w":10.4,"x":28.8,"y":66.5},"lateral_der":{"h":16.5,"w":10.2,"x":29,"y":69.5},"lateral_izq":{"h":16.5,"w":10.2,"x":29,"y":69.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('1309c5ff-5509-46e4-bc49-5c22cf612625', '210', 2, 'a2222222-2222-2222-2222-222222222222', 'disponible', 2, 5, ARRAY['Piso 2', 'Balcón Colonial con Flores', 'Lado Este'], '2026-10-25 19:32:09.162191+00', '{"lateral_der":{"h":20.5,"w":10.8,"x":77.2,"y":40.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('177a49d6-5989-4a79-82d0-4b2b25ee7621', '307', 3, 'a2222222-2222-2222-2222-222222222222', 'disponible', 3, 2, ARRAY['Piso 3', 'Ventana Colonial', 'Junto a Terraza'], '2026-10-25 19:32:09.162191+00', '{"lateral_der":{"h":14.5,"w":9.8,"x":29.8,"y":12.5},"lateral_izq":{"h":19.5,"w":10.4,"x":44.8,"y":13.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('231459f3-f664-41d2-a149-6706ef6734cd', '205', 2, 'a2222222-2222-2222-2222-222222222222', 'disponible', 2, 5, ARRAY['Piso 2', 'Fachada Frontal', 'Balcón Colonial con Flores Rojas'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":20,"w":10.4,"x":77,"y":38.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('32250a2f-609a-4013-a94d-cd8e54894b31', '304', 3, 'a2222222-2222-2222-2222-222222222222', 'disponible', 3, 4, ARRAY['Piso 3', 'Fachada Frontal', 'Balcón Colonial', 'Silenciosa'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":19.5,"w":10.4,"x":61.2,"y":13}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('33bff3b0-5648-49de-902b-900d6a57bb2d', '208', 2, 'a1111111-1111-1111-1111-111111111111', 'disponible', 2, 3, ARRAY['Piso 2', 'Balcón Central', 'Acabados Nobles'], '2026-10-25 19:32:09.162191+00', '{"lateral_der":{"h":20.5,"w":10.8,"x":45,"y":40.5},"lateral_izq":{"h":20.5,"w":10.4,"x":77,"y":39.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('3bd7dee3-b3d3-4918-8285-2d90bcf84b2c', '306', 3, 'a1111111-1111-1111-1111-111111111111', 'disponible', 3, 1, ARRAY['Piso 3', 'Suite Esquina', 'Balcón y Vista Illimani'], '2026-10-25 19:32:09.162191+00', '{"lateral_der":{"h":14.5,"w":9.8,"x":14.5,"y":12.5},"lateral_izq":{"h":19.5,"w":10.4,"x":12.8,"y":13.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('428fff8b-119b-4f5f-b011-335941814b66', '302', 3, 'a2222222-2222-2222-2222-222222222222', 'disponible', 3, 2, ARRAY['Piso 3', 'Fachada Frontal', 'Balcón Colonial', 'Cálida iluminación'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":19.5,"w":10.4,"x":28.8,"y":13}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('58d6a63e-ac66-49c1-9cd9-6085b522e31b', '203', 2, 'a1111111-1111-1111-1111-111111111111', 'disponible', 2, 3, ARRAY['Piso 2', 'Balcón Central Frontal', 'Acabados en Madera Noble'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":20,"w":10.4,"x":44.8,"y":38.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('5fa3a2a4-b1d3-4587-a8a9-56db850d98e7', '209', 2, 'a3333333-3333-3333-3333-333333333333', 'disponible', 2, 4, ARRAY['Piso 2', 'Balcón Colonial', 'Cerca a escaleras'], '2026-10-25 19:32:09.162191+00', '{"lateral_der":{"h":20.5,"w":10.8,"x":61.2,"y":40.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('64036814-d8c4-420e-a379-980ca5e816ac', '310', 3, 'a1111111-1111-1111-1111-111111111111', 'disponible', 3, 5, ARRAY['Piso 3', 'Suite Esquina', 'Balcón Colonial y Jardinera'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":19.5,"w":10.4,"x":77,"y":13},"lateral_der":{"h":21,"w":10.5,"x":77,"y":12.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('654853f9-2048-4bbf-9dbb-8155a9829a67', '201', 2, 'a2222222-2222-2222-2222-222222222222', 'disponible', 2, 1, ARRAY['Piso 2', 'Fachada Frontal', 'Balcón Colonial de Madera', 'Flores'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":20,"w":10.4,"x":12.8,"y":38.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('7289c8e3-60ea-4e18-9129-6121e8043384', '303', 3, 'a1111111-1111-1111-1111-111111111111', 'limpieza', 3, 3, ARRAY['Piso 3', 'Suite Central Illimani', 'Bajo Letrero Principal', 'Vista Panorámica'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":19.5,"w":10.4,"x":44.8,"y":13}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('735291e8-7e8f-4b3b-b5a0-5f262fe696ef', '104', 1, 'a2222222-2222-2222-2222-222222222222', 'disponible', 1, 5, ARRAY['Piso 1', 'Planta Baja', 'Cerca a Hall de Entrada'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":16.5,"w":10.4,"x":77,"y":66.5},"lateral_der":{"h":16.5,"w":10.2,"x":61.5,"y":69.5},"lateral_izq":{"h":16.5,"w":10.2,"x":61.2,"y":69.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('9003af64-da6e-4b35-bd76-f4c5c790a40c', '301', 3, 'a1111111-1111-1111-1111-111111111111', 'disponible', 3, 1, ARRAY['Piso 3', 'Fachada Frontal', 'Balcón Colonial con Flores', 'Vista al Illimani'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":19.5,"w":10.4,"x":12.8,"y":13}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('988e3ce0-681b-4f72-ae33-b3a4663ffa41', '103', 1, 'a4444444-4444-4444-4444-444444444444', 'disponible', 1, 4, ARRAY['Piso 1', 'Planta Baja', 'Ventana Colonial'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":16.5,"w":10.4,"x":61.2,"y":66.5},"lateral_der":{"h":16.5,"w":10.2,"x":45.2,"y":69.5},"lateral_izq":{"h":16.5,"w":10.2,"x":45.2,"y":69.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('b47a036a-4490-40bd-b0ef-88a5c6115121', '206', 2, 'a2222222-2222-2222-2222-222222222222', 'disponible', 2, 1, ARRAY['Piso 2', 'Balcón Colonial de Madera', 'Flores'], '2026-10-25 19:32:09.162191+00', '{"lateral_der":{"h":20.5,"w":10.8,"x":12.8,"y":40.5},"lateral_izq":{"h":20.5,"w":10.4,"x":12.8,"y":39.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('ce64d777-fe78-41f8-bca4-a1bf5a776c41', '308', 3, 'a1111111-1111-1111-1111-111111111111', 'disponible', 3, 5, ARRAY['Piso 3', 'Balcón con Flores', 'Suite Esquina Este'], '2026-10-25 19:32:09.162191+00', '{"lateral_izq":{"h":19.5,"w":10.4,"x":77,"y":13.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('d34296fe-c474-4897-b6f3-4865e16e4b5a', '309', 3, 'a2222222-2222-2222-2222-222222222222', 'disponible', 3, 4, ARRAY['Piso 3', 'Balcón con Flores', 'Vista Panorámica Despejada'], '2026-10-25 19:32:09.162191+00', '{"lateral_der":{"h":21,"w":10.5,"x":61.2,"y":12.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('d75422b3-425d-4475-a494-fbbc75d543d7', '202', 2, 'a3333333-3333-3333-3333-333333333333', 'disponible', 2, 2, ARRAY['Piso 2', 'Fachada Frontal', 'Balcón Colonial de Madera'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":20,"w":10.4,"x":28.8,"y":38.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('d900b47b-66d5-4baf-a91a-b74477743d4e', '101', 1, 'a4444444-4444-4444-4444-444444444444', 'disponible', 1, 1, ARRAY['Piso 1', 'Planta Baja', 'Acceso directo sin gradas'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":16.5,"w":10.4,"x":13,"y":66.5},"lateral_der":{"h":16.5,"w":10.2,"x":13,"y":69.5},"lateral_izq":{"h":16.5,"w":10.2,"x":13,"y":69.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('e2806e84-c8ba-448d-8875-23a9c75b498b', '204', 2, 'a3333333-3333-3333-3333-333333333333', 'disponible', 2, 4, ARRAY['Piso 2', 'Fachada Frontal', 'Balcón Colonial de Madera'], '2026-10-25 19:32:09.162191+00', '{"frontal":{"h":20,"w":10.4,"x":61.2,"y":38.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.habitaciones (id, numero, piso, tipo_id, estado, fila_grid, columna_grid, caracteristicas, creado_en, coordenadas_por_vista) VALUES ('f389db61-b298-431a-8880-59d30887a3aa', '207', 2, 'a3333333-3333-3333-3333-333333333333', 'disponible', 2, 2, ARRAY['Piso 2', 'Balcón Colonial de Madera', 'Vista Lateral'], '2026-10-25 19:32:09.162191+00', '{"lateral_der":{"h":20.5,"w":10.8,"x":28.8,"y":40.5},"lateral_izq":{"h":20.5,"w":10.4,"x":44.8,"y":39.5}}'::jsonb) ON CONFLICT (id) DO NOTHING;

-- Datos para la tabla: historial_limpieza (1 registros)
INSERT INTO public.historial_limpieza (id, habitacion_id, empleado_id, fecha_inicio, fecha_fin, observaciones) VALUES ('6245bba9-ec57-4d09-8fec-76b4b0af383d', '7289c8e3-60ea-4e18-9129-6121e8043384', NULL, '2026-11-02 06:59:35.683+00', NULL, 'Check-out de reserva RES-2026-3977. Requiere limpieza y preparación.') ON CONFLICT (id) DO NOTHING;

-- Datos para la tabla: huespedes (5 registros)
INSERT INTO public.huespedes (id, usuario_id, nombres, apellidos, tipo_documento, documento_identidad, nacionalidad, telefono, email, creado_en) VALUES ('06dcbc0e-2759-4014-8ece-599fb35b2905', '648a951c-7f36-4bc0-9b7a-210a643ea563', 'Hugo', 'Enrique Villazante Tantani', 'CI', 'DOC-590885', 'Boliviana', '78883325', 'enrique@gmail.com', '2026-11-02 06:56:32.719368+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.huespedes (id, usuario_id, nombres, apellidos, tipo_documento, documento_identidad, nacionalidad, telefono, email, creado_en) VALUES ('3128a1ef-50ff-4f29-a875-e43bd1ba70e5', 'b201609f-2a23-4c51-807b-32a4f18fbeea', 'ado', 'villa', 'CI', '8304320', 'Boliviana', '68046105', 'adovil66@gmail.com', '2026-11-02 06:34:20.651866+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.huespedes (id, usuario_id, nombres, apellidos, tipo_documento, documento_identidad, nacionalidad, telefono, email, creado_en) VALUES ('598edaf9-8f9c-4454-b6ea-1e67c9d73f81', '1786a65a-3f87-4635-8de8-1cdaa40dd9e0', 'denisse', 'Maya', 'CI', '8535456', 'Boliviana', '78654214', 'denisse@gmail.com', '2026-11-03 22:17:31.924899+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.huespedes (id, usuario_id, nombres, apellidos, tipo_documento, documento_identidad, nacionalidad, telefono, email, creado_en) VALUES ('5d28f726-98cd-486f-a039-57edc35bd2b2', '0796e8d4-2b37-416c-a639-fddcad3a27a5', 'Shirley', 'Perez', 'CI', '1002568', 'Boliviana', '78563298', 'shirley@gmail.com', '2026-11-01 21:15:17.427287+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.huespedes (id, usuario_id, nombres, apellidos, tipo_documento, documento_identidad, nacionalidad, telefono, email, creado_en) VALUES ('9ea925eb-96be-4f3b-a815-77d941a2fde3', NULL, 'adolfito', 'made', 'CI', '68046105', 'Boliviana', '77158785', 'adolfito@gmail.com', '2026-11-03 22:10:20.567252+00') ON CONFLICT (id) DO NOTHING;

-- Datos para la tabla: turnos_caja (2 registros)
INSERT INTO public.turnos_caja (id, recepcionista_id, fecha_apertura, monto_inicial, fecha_cierre, monto_final_declarado, observaciones) VALUES ('2be24aa0-f527-41a7-b2a4-0ea4c377c081', '51ca6732-6cb2-45ae-a0e6-02c921276a52', '2026-11-01 20:39:15.517+00', 1000.00, NULL, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.turnos_caja (id, recepcionista_id, fecha_apertura, monto_inicial, fecha_cierre, monto_final_declarado, observaciones) VALUES ('ae29f9f9-1c98-4c66-8b68-ccfe7cd11fb1', '2ca4a8c0-b33d-424c-8c33-f872506580d8', '2026-11-03 22:31:14.917+00', 500.00, NULL, NULL, NULL) ON CONFLICT (id) DO NOTHING;

-- Datos para la tabla: catalogo_servicios (53 registros)
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('0446b686-d934-49a4-9074-198a2c6291f5', 'Cóctel Yungueñito', 'alimentos_bebidas', 28.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('05fd6ce4-af5e-4fcc-9d70-616fb3e99cb5', 'Lavandería Express - Por Prenda', 'lavanderia', 15.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('0dccf06e-ff68-465b-b1fc-c0d713238de7', 'Café Americano Yungueño', 'alimentos_bebidas', 15.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('0e42e670-fe2e-40d4-843e-f9adc90cd446', 'Sesión Privada de Sauna Seco y Vapor (45 min)', 'Spa & Relax', 90.00, true, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('0f729bbf-6419-4c6d-a81c-831dd7667a2f', 'Chocolate Caliente Tradicional', 'alimentos_bebidas', 18.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('12388bf9-53da-482f-b57c-8e477e360b6a', 'Papas Fritas Lay''s', 'minibar', 12.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('167eb8f6-7a52-4981-868b-017850f8358e', 'Cerveza Huari Tradicional (330 ml)', 'minibar', 22.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('2f730547-36df-4e56-a653-be0949d1c811', 'Chocolates Para Ti Surtidos', 'minibar', 28.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('304ef9a9-93da-48d0-96ac-6058ccdf6cac', 'Cóctel Chuflay Tradicional', 'alimentos_bebidas', 30.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('326e026d-a36a-4962-9123-bcf9aa4224be', 'Traslado Terminal - Hotel', 'transporte', 45.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('357392fe-6181-45cd-80c3-51c8ca2ab1a3', 'Mix de Frutos Secos y Chocolates Para Ti', 'Minibar', 28.00, true, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('373f4701-05f2-4d6d-bfce-1f964dab0051', 'Servicio de Lavado y Planchado Express (Carga 5kg)', 'Lavandería', 75.00, true, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('3fcb2ff1-6094-44e0-97c8-f4efa7366006', 'Custodia de Equipaje Post Check-out', 'servicio_extra', 20.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('43bc88f0-855f-4f0e-9ab6-cfb54cab966d', 'Kit de Alivio Soroche', 'servicio_extra', 35.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('4e7d0635-0728-412f-ba76-1d0995b0d1fa', 'Late Check-out (Hasta las 16:00)', 'servicio_extra', 80.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('517713f4-aa8c-4498-b790-43f83a34c625', 'Salteña Paceña de Pollo', 'alimentos_bebidas', 14.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('54628538-b604-4b86-b389-784fc6d49c9e', 'Marraqueta con Queso Criollo', 'alimentos_bebidas', 15.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('5eaf57fe-2b0c-45ff-afbc-40c7066946f7', 'Gaseosa Papaya Salvietti (500 ml)', 'minibar', 10.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('609c5254-0aee-4e46-9f91-fac7eb99c70a', 'Botella de Vino Tinto Gran Reserva (Tarija)', 'Minibar', 160.00, true, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('621d0009-7e0b-4b96-a313-cc0ae531f8c0', 'Jugo Natural de Naranja', 'alimentos_bebidas', 15.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('65915b31-6a94-4ccf-946f-7bda90dc855e', 'Cerveza Paceña Pilsener (330 ml)', 'minibar', 18.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('6f671ee3-a1ed-4709-985b-1b24a63d081f', 'Café con Leche y Marraqueta', 'alimentos_bebidas', 20.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('71ec3e63-5f8d-462d-9dac-368fd51617d3', 'Cerveza Huari Tradicional (Pack x2)', 'Minibar', 35.00, true, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('72a35678-95b0-48de-ab29-620d3051287e', 'Masaje Relajante con Piedras Calientes Andinas (60 min)', 'Spa & Relax', 190.00, true, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('73447905-06d2-4535-8440-ce35283f4862', 'Agua Mineral con Gas (600 ml)', 'minibar', 8.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('78d3177e-12c7-42a9-a2ae-038476e468eb', 'Mate de Coca Tradicional', 'alimentos_bebidas', 10.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('7946b160-1ab6-4055-b4ae-26d1f3c280d4', 'Cena Gourmet Illimani (3 Tiempos)', 'Restaurante', 145.00, true, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('7a47ba33-0418-4af0-8e54-0ffd766abcfe', 'Vino Blanco Torrontés (Botella 750 ml)', 'minibar', 85.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('7bbe324e-95a1-42d6-b27f-954e650423b6', 'Plato Silpancho Cochabambino', 'alimentos_bebidas', 45.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('7c139b30-fcfe-4ac9-bf05-d3d344be4dbc', 'Gaseosa Coca-Cola (500 ml)', 'minibar', 12.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('7c4f925c-1746-4d5a-8d3d-5881334bd01b', 'Mocochinchi Casero', 'alimentos_bebidas', 10.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('7dfb35ce-c0ff-428c-b3ff-dc3b5c4e41a8', 'Té Trimate Andino', 'alimentos_bebidas', 12.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('810c5d17-75e0-421b-9d7f-b982d1890890', 'Planchado al Vapor (Por Prenda)', 'lavanderia', 12.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('8773d6ba-887b-4ed2-a564-06f356e746ae', 'Copa de Singani Los Parrales', 'alimentos_bebidas', 25.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('8d77a787-d8c2-4051-a89b-a1e8d65da0f5', 'Sándwich Caliente de Lomito', 'alimentos_bebidas', 35.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('959b7044-821f-4647-b1f9-177602be5c22', 'Api Morado con Pastel de Queso', 'alimentos_bebidas', 25.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('9b358855-f058-45c8-a35f-98f143f8a687', 'Té de Muña Digestivo', 'alimentos_bebidas', 10.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('a3ec612d-f997-4986-adfa-d12aa7e181e1', 'Early Check-in (Antes de las 10:00)', 'servicio_extra', 70.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('b53b23ea-4770-4ee3-9fce-233d36eae711', 'Sándwich de Chola Completo', 'alimentos_bebidas', 30.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('b9ec9d2e-dd0a-42b1-98ce-5ba7a2614d35', 'Lavandería Completa (Bolsa 5 kg)', 'lavanderia', 60.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('becb09f5-7267-40f8-9dfe-62ecb4c504ef', 'Energizante Red Bull (250 ml)', 'minibar', 25.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('bee280f5-1e0f-4e2f-b2ba-9f5724970660', 'Sopa de Maní Típica', 'alimentos_bebidas', 28.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('c272fa42-e862-4696-8772-417d716a08e2', 'Vino Tinto Tannat (Botella 750 ml)', 'minibar', 95.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('c391464c-cc98-4cc4-b1a5-77a4e3785e02', 'Traslado Hotel - Aeropuerto El Alto', 'transporte', 120.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('cb3682d6-2000-449a-8c80-d2e0ad141049', 'Juego Extra de Toallas', 'servicio_extra', 15.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('d61ae3ba-3e6c-44fe-b57c-f5165cf219d0', 'Planchado de Traje Ejecutivo o Vestido', 'Lavandería', 40.00, true, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('debaad3c-cab7-475a-a3af-d71c7d34dc50', 'Cerveza Paceña Centenario (330 ml)', 'minibar', 20.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('e21fc9a7-f7bb-4455-ab53-cbd41ad5e5ca', 'City Tour Teleférico (Por Huésped)', 'tour', 150.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('e5732946-e672-49f0-a3da-d83454cc57d8', 'Agua Mineral sin Gas (600 ml)', 'minibar', 8.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('e830058c-0bf0-4850-9f34-52020ddb7504', 'Desayuno Americano a la Habitación', 'Restaurante', 55.00, true, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('f4a099e9-37dc-4979-baff-65ef15295000', 'Oxigenoterapia (Sesión 1 Hora)', 'servicio_extra', 50.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('f856f800-8b18-4927-81b3-b902a76269b7', 'Salteña Paceña de Carne', 'alimentos_bebidas', 14.00, true, '2026-10-27 13:08:41.179811+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalogo_servicios (id, nombre, categoria, precio_unitario, activo, creado_en) VALUES ('fdc44cbd-8058-40bb-87cd-45559ab9fb16', 'Club Sándwich Tradicional con Papas', 'Restaurante', 48.00, true, '2026-10-25 19:32:09.162191+00') ON CONFLICT (id) DO NOTHING;

-- Datos para la tabla: reservas (4 registros)
INSERT INTO public.reservas (id, codigo_reserva, huesped_id, habitacion_id, recepcionista_id, fecha_entrada, fecha_salida, check_in_real, check_out_real, precio_pactado_noche, total_alojamiento, estado, observaciones, creado_en) VALUES ('406d95cb-9659-4533-8fa3-3a624f3757a1', 'RES-2026-6974', '3128a1ef-50ff-4f29-a875-e43bd1ba70e5', '7289c8e3-60ea-4e18-9129-6121e8043384', NULL, '2026-11-02', '2026-11-04', '2026-11-02 06:35:13.7+00', NULL, 850.00, 1700.00, 'en_curso', 'comida', '2026-11-02 06:35:09.770559+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reservas (id, codigo_reserva, huesped_id, habitacion_id, recepcionista_id, fecha_entrada, fecha_salida, check_in_real, check_out_real, precio_pactado_noche, total_alojamiento, estado, observaciones, creado_en) VALUES ('7c64293f-d0e2-419b-a200-3a8559d50adf', 'RES-2026-3004', '5d28f726-98cd-486f-a039-57edc35bd2b2', '58d6a63e-ac66-49c1-9cd9-6085b522e31b', NULL, '2026-11-01', '2026-11-03', '2026-11-01 22:47:35.508+00', NULL, 850.00, 1700.00, 'en_curso', NULL, '2026-11-01 22:47:09.421873+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reservas (id, codigo_reserva, huesped_id, habitacion_id, recepcionista_id, fecha_entrada, fecha_salida, check_in_real, check_out_real, precio_pactado_noche, total_alojamiento, estado, observaciones, creado_en) VALUES ('ee2c8629-6f92-4d33-9a70-f1810e84a103', 'RES-2026-3977', '06dcbc0e-2759-4014-8ece-599fb35b2905', '7289c8e3-60ea-4e18-9129-6121e8043384', NULL, '2026-11-02', '2026-11-04', '2026-11-02 06:56:39.218+00', '2026-11-02 06:59:35.683+00', 850.00, 1700.00, 'finalizada', NULL, '2026-11-02 06:56:32.896551+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reservas (id, codigo_reserva, huesped_id, habitacion_id, recepcionista_id, fecha_entrada, fecha_salida, check_in_real, check_out_real, precio_pactado_noche, total_alojamiento, estado, observaciones, creado_en) VALUES ('f4870727-d55f-44f4-97b0-8fe8b16314b6', 'RES-2026-6168', '598edaf9-8f9c-4454-b6ea-1e67c9d73f81', '7289c8e3-60ea-4e18-9129-6121e8043384', NULL, '2026-11-03', '2026-11-05', '2026-11-03 22:18:12.49+00', NULL, 850.00, 1700.00, 'en_curso', NULL, '2026-11-03 22:17:50.435992+00') ON CONFLICT (id) DO NOTHING;

-- Datos para la tabla: consumos_reserva (7 registros)
INSERT INTO public.consumos_reserva (id, reserva_id, servicio_id, cantidad, precio_unitario, subtotal, fecha_consumo) VALUES ('06337734-27aa-4278-9197-90cd139f6633', 'f4870727-d55f-44f4-97b0-8fe8b16314b6', '72a35678-95b0-48de-ab29-620d3051287e', 1, 190.00, 190.00, '2026-11-03 22:18:25.562444+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.consumos_reserva (id, reserva_id, servicio_id, cantidad, precio_unitario, subtotal, fecha_consumo) VALUES ('1659ef2d-9d58-44d4-942e-3daa20b28f80', '406d95cb-9659-4533-8fa3-3a624f3757a1', '0dccf06e-ff68-465b-b1fc-c0d713238de7', 1, 15.00, 15.00, '2026-11-02 06:36:38.75788+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.consumos_reserva (id, reserva_id, servicio_id, cantidad, precio_unitario, subtotal, fecha_consumo) VALUES ('4b1cac4f-5f20-4f73-8787-31541adeb0a0', '406d95cb-9659-4533-8fa3-3a624f3757a1', '0f729bbf-6419-4c6d-a81c-831dd7667a2f', 1, 18.00, 18.00, '2026-11-02 06:37:46.729309+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.consumos_reserva (id, reserva_id, servicio_id, cantidad, precio_unitario, subtotal, fecha_consumo) VALUES ('6fe28b82-c500-484b-9c3b-41be387f1365', 'f4870727-d55f-44f4-97b0-8fe8b16314b6', '959b7044-821f-4647-b1f9-177602be5c22', 1, 25.00, 25.00, '2026-11-03 22:18:19.668521+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.consumos_reserva (id, reserva_id, servicio_id, cantidad, precio_unitario, subtotal, fecha_consumo) VALUES ('c105a469-412a-486e-8274-cb45c5ddc520', '406d95cb-9659-4533-8fa3-3a624f3757a1', '959b7044-821f-4647-b1f9-177602be5c22', 1, 25.00, 25.00, '2026-11-02 06:35:26.550779+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.consumos_reserva (id, reserva_id, servicio_id, cantidad, precio_unitario, subtotal, fecha_consumo) VALUES ('ca9de1e2-52f0-4480-a122-83cbd8752d7c', '7c64293f-d0e2-419b-a200-3a8559d50adf', '959b7044-821f-4647-b1f9-177602be5c22', 1, 25.00, 25.00, '2026-11-01 22:48:01.695843+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.consumos_reserva (id, reserva_id, servicio_id, cantidad, precio_unitario, subtotal, fecha_consumo) VALUES ('f8f2dc6b-200e-4e14-afdc-9dfd191516fc', 'f4870727-d55f-44f4-97b0-8fe8b16314b6', '7c139b30-fcfe-4ac9-bf05-d3d344be4dbc', 1, 12.00, 12.00, '2026-11-03 22:18:38.837843+00') ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 6. POLÍTICAS DE ACCESO PÚBLICO / RLS
-- ==============================================================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_habitacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumos_reserva ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_limpieza ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Lectura pública de tipos de habitación" ON public.tipos_habitacion FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Lectura pública de habitaciones" ON public.habitaciones FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Lectura pública de catálogo" ON public.catalogo_servicios FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Acceso a reservas para clientes y personal" ON public.reservas FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Acceso a consumos de reservas" ON public.consumos_reserva FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Acceso a perfiles para personal autenticado" ON public.perfiles FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Acceso a turnos de caja" ON public.turnos_caja FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Acceso a historial de limpieza" ON public.historial_limpieza FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Acceso a pagos" ON public.pagos FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
