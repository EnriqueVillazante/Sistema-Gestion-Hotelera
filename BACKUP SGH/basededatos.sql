-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.perfiles (
  id uuid NOT NULL,
  nombre_completo character varying NOT NULL,
  telefono character varying,
  rol USER-DEFINED NOT NULL DEFAULT 'recepcionista'::rol_usuario,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT perfiles_pkey PRIMARY KEY (id),
  CONSTRAINT perfiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.tipos_habitacion (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  capacidad_adultos integer NOT NULL DEFAULT 1,
  capacidad_ninos integer NOT NULL DEFAULT 0,
  precio_base_noche numeric NOT NULL CHECK (precio_base_noche >= 0::numeric),
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipos_habitacion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.habitaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  numero character varying NOT NULL UNIQUE,
  piso integer NOT NULL,
  tipo_id uuid NOT NULL,
  estado USER-DEFINED NOT NULL DEFAULT 'disponible'::estado_habitacion,
  fila_grid integer NOT NULL DEFAULT 1,
  columna_grid integer NOT NULL DEFAULT 1,
  caracteristicas ARRAY,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  coordenadas_por_vista jsonb,
  CONSTRAINT habitaciones_pkey PRIMARY KEY (id),
  CONSTRAINT habitaciones_tipo_id_fkey FOREIGN KEY (tipo_id) REFERENCES public.tipos_habitacion(id)
);
CREATE TABLE public.historial_limpieza (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  habitacion_id uuid NOT NULL,
  empleado_id uuid,
  fecha_inicio timestamp with time zone NOT NULL DEFAULT now(),
  fecha_fin timestamp with time zone,
  observaciones text,
  CONSTRAINT historial_limpieza_pkey PRIMARY KEY (id),
  CONSTRAINT historial_limpieza_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id),
  CONSTRAINT historial_limpieza_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.perfiles(id)
);
CREATE TABLE public.huespedes (
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
  CONSTRAINT huespedes_pkey PRIMARY KEY (id),
  CONSTRAINT huespedes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id)
);
CREATE TABLE public.turnos_caja (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  recepcionista_id uuid NOT NULL,
  fecha_apertura timestamp with time zone NOT NULL DEFAULT now(),
  monto_inicial numeric NOT NULL DEFAULT 0.00 CHECK (monto_inicial >= 0::numeric),
  fecha_cierre timestamp with time zone,
  monto_final_declarado numeric,
  observaciones text,
  CONSTRAINT turnos_caja_pkey PRIMARY KEY (id),
  CONSTRAINT turnos_caja_recepcionista_id_fkey FOREIGN KEY (recepcionista_id) REFERENCES public.perfiles(id)
);
CREATE TABLE public.reservas (
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
  estado USER-DEFINED NOT NULL DEFAULT 'confirmada'::estado_reserva,
  observaciones text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reservas_pkey PRIMARY KEY (id),
  CONSTRAINT reservas_huesped_id_fkey FOREIGN KEY (huesped_id) REFERENCES public.huespedes(id),
  CONSTRAINT reservas_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id),
  CONSTRAINT reservas_recepcionista_id_fkey FOREIGN KEY (recepcionista_id) REFERENCES public.perfiles(id)
);
CREATE TABLE public.catalogo_servicios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  categoria character varying NOT NULL,
  precio_unitario numeric NOT NULL CHECK (precio_unitario >= 0::numeric),
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT catalogo_servicios_pkey PRIMARY KEY (id)
);
CREATE TABLE public.consumos_reserva (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reserva_id uuid NOT NULL,
  servicio_id uuid NOT NULL,
  cantidad integer NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario numeric NOT NULL CHECK (precio_unitario >= 0::numeric),
  subtotal numeric DEFAULT ((cantidad)::numeric * precio_unitario),
  fecha_consumo timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT consumos_reserva_pkey PRIMARY KEY (id),
  CONSTRAINT consumos_reserva_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id),
  CONSTRAINT consumos_reserva_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.catalogo_servicios(id)
);
CREATE TABLE public.pagos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reserva_id uuid NOT NULL,
  turno_caja_id uuid,
  monto numeric NOT NULL CHECK (monto > 0::numeric),
  metodo USER-DEFINED NOT NULL,
  tipo USER-DEFINED NOT NULL DEFAULT 'pago_final'::tipo_pago,
  comprobante_ref character varying,
  registrado_por uuid,
  fecha_pago timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pagos_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reservas(id),
  CONSTRAINT pagos_turno_caja_id_fkey FOREIGN KEY (turno_caja_id) REFERENCES public.turnos_caja(id),
  CONSTRAINT pagos_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES public.perfiles(id)
);