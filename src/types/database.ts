// ==============================================================================
// SISTEMA DE ADMINISTRACIÓN Y GESTIÓN EMPRESARIAL HOTELERA (SAGH)
// Definiciones de tipos TypeScript para Supabase y Modelo de Negocio
// ==============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Tipos Enumerados del Sistema
export type RolUsuario = 'admin' | 'recepcionista' | 'limpieza' | 'huesped';
export type EstadoHabitacion = 'disponible' | 'ocupada' | 'limpieza' | 'mantenimiento';
export type EstadoReserva = 'pendiente' | 'confirmada' | 'en_curso' | 'finalizada' | 'cancelada';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'qr';
export type TipoPago = 'anticipo' | 'pago_final' | 'garantia';
export type TipoDocumento = 'CI' | 'Pasaporte' | 'DNI' | 'Otro';

// ==============================================================================
// Definición de Esquema Supabase
// ==============================================================================
export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          nombre_completo: string;
          telefono: string | null;
          rol: RolUsuario;
          activo: boolean;
          creado_en: string;
          email?: string | null;
        };
        Insert: {
          id: string;
          nombre_completo: string;
          telefono?: string | null;
          rol?: RolUsuario;
          activo?: boolean;
          creado_en?: string;
          email?: string | null;
        };
        Update: {
          id?: string;
          nombre_completo?: string;
          telefono?: string | null;
          rol?: RolUsuario;
          activo?: boolean;
          creado_en?: string;
          email?: string | null;
        };
        Relationships: [];
      };
      tipos_habitacion: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          capacidad_adultos: number;
          capacidad_ninos: number;
          precio_base_noche: number;
          creado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string | null;
          capacidad_adultos?: number;
          capacidad_ninos?: number;
          precio_base_noche: number;
          creado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string | null;
          capacidad_adultos?: number;
          capacidad_ninos?: number;
          precio_base_noche?: number;
          creado_en?: string;
        };
        Relationships: [];
      };
      habitaciones: {
        Row: {
          id: string;
          numero: string;
          piso: number;
          tipo_id: string;
          estado: EstadoHabitacion;
          fila_grid: number;
          columna_grid: number;
          caracteristicas: string[] | null;
          coordenadas_por_vista?: Json | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          numero: string;
          piso: number;
          tipo_id: string;
          estado?: EstadoHabitacion;
          fila_grid?: number;
          columna_grid?: number;
          caracteristicas?: string[] | null;
          coordenadas_por_vista?: Json | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          numero?: string;
          piso?: number;
          tipo_id?: string;
          estado?: EstadoHabitacion;
          fila_grid?: number;
          columna_grid?: number;
          caracteristicas?: string[] | null;
          coordenadas_por_vista?: Json | null;
          creado_en?: string;
        };
        Relationships: [];
      };
      historial_limpieza: {
        Row: {
          id: string;
          habitacion_id: string;
          empleado_id: string | null;
          fecha_inicio: string;
          fecha_fin: string | null;
          observaciones: string | null;
        };
        Insert: {
          id?: string;
          habitacion_id: string;
          empleado_id?: string | null;
          fecha_inicio?: string;
          fecha_fin?: string | null;
          observaciones?: string | null;
        };
        Update: {
          id?: string;
          habitacion_id?: string;
          empleado_id?: string | null;
          fecha_inicio?: string;
          fecha_fin?: string | null;
          observaciones?: string | null;
        };
        Relationships: [];
      };
      huespedes: {
        Row: {
          id: string;
          usuario_id: string | null;
          nombres: string;
          apellidos: string;
          tipo_documento: string;
          documento_identidad: string;
          nacionalidad: string | null;
          telefono: string | null;
          email: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          usuario_id?: string | null;
          nombres: string;
          apellidos: string;
          tipo_documento?: string;
          documento_identidad: string;
          nacionalidad?: string | null;
          telefono?: string | null;
          email?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string | null;
          nombres?: string;
          apellidos?: string;
          tipo_documento?: string;
          documento_identidad?: string;
          nacionalidad?: string | null;
          telefono?: string | null;
          email?: string | null;
          creado_en?: string;
        };
        Relationships: [];
      };
      turnos_caja: {
        Row: {
          id: string;
          recepcionista_id: string;
          fecha_apertura: string;
          monto_inicial: number;
          fecha_cierre: string | null;
          monto_final_declarado: number | null;
          observaciones: string | null;
        };
        Insert: {
          id?: string;
          recepcionista_id: string;
          fecha_apertura?: string;
          monto_inicial?: number;
          fecha_cierre?: string | null;
          monto_final_declarado?: number | null;
          observaciones?: string | null;
        };
        Update: {
          id?: string;
          recepcionista_id?: string;
          fecha_apertura?: string;
          monto_inicial?: number;
          fecha_cierre?: string | null;
          monto_final_declarado?: number | null;
          observaciones?: string | null;
        };
        Relationships: [];
      };
      reservas: {
        Row: {
          id: string;
          codigo_reserva: string;
          huesped_id: string;
          habitacion_id: string;
          recepcionista_id: string | null;
          fecha_entrada: string;
          fecha_salida: string;
          check_in_real: string | null;
          check_out_real: string | null;
          precio_pactado_noche: number;
          total_alojamiento: number;
          estado: EstadoReserva;
          observaciones: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          codigo_reserva: string;
          huesped_id: string;
          habitacion_id: string;
          recepcionista_id?: string | null;
          fecha_entrada: string;
          fecha_salida: string;
          check_in_real?: string | null;
          check_out_real?: string | null;
          precio_pactado_noche: number;
          total_alojamiento: number;
          estado?: EstadoReserva;
          observaciones?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          codigo_reserva?: string;
          huesped_id?: string;
          habitacion_id?: string;
          recepcionista_id?: string | null;
          fecha_entrada?: string;
          fecha_salida?: string;
          check_in_real?: string | null;
          check_out_real?: string | null;
          precio_pactado_noche?: number;
          total_alojamiento?: number;
          estado?: EstadoReserva;
          observaciones?: string | null;
          creado_en?: string;
        };
        Relationships: [];
      };
      catalogo_servicios: {
        Row: {
          id: string;
          nombre: string;
          categoria: string;
          precio_unitario: number;
          activo: boolean;
          creado_en: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          categoria: string;
          precio_unitario: number;
          activo?: boolean;
          creado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          categoria?: string;
          precio_unitario?: number;
          activo?: boolean;
          creado_en?: string;
        };
        Relationships: [];
      };
      consumos_reserva: {
        Row: {
          id: string;
          reserva_id: string;
          servicio_id: string;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
          fecha_consumo: string;
        };
        Insert: {
          id?: string;
          reserva_id: string;
          servicio_id: string;
          cantidad?: number;
          precio_unitario: number;
          subtotal?: number;
          fecha_consumo?: string;
        };
        Update: {
          id?: string;
          reserva_id?: string;
          servicio_id?: string;
          cantidad?: number;
          precio_unitario?: number;
          subtotal?: number;
          fecha_consumo?: string;
        };
        Relationships: [];
      };
      pagos: {
        Row: {
          id: string;
          reserva_id: string;
          turno_caja_id: string | null;
          monto: number;
          metodo: MetodoPago;
          tipo: TipoPago;
          comprobante_ref: string | null;
          registrado_por: string | null;
          fecha_pago: string;
        };
        Insert: {
          id?: string;
          reserva_id: string;
          turno_caja_id?: string | null;
          monto: number;
          metodo: MetodoPago;
          tipo?: TipoPago;
          comprobante_ref?: string | null;
          registrado_por?: string | null;
          fecha_pago?: string;
        };
        Update: {
          id?: string;
          reserva_id?: string;
          turno_caja_id?: string | null;
          monto?: number;
          metodo?: MetodoPago;
          tipo?: TipoPago;
          comprobante_ref?: string | null;
          registrado_por?: string | null;
          fecha_pago?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      obtener_mi_rol: {
        Args: Record<PropertyKey, never>;
        Returns: RolUsuario;
      };
      es_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      rol_usuario: RolUsuario;
      estado_habitacion: EstadoHabitacion;
      estado_reserva: EstadoReserva;
      metodo_pago: MetodoPago;
      tipo_pago: TipoPago;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ==============================================================================
// Alias directos de modelos para uso rápido en vistas y componentes
// ==============================================================================
export type Perfil = Database['public']['Tables']['perfiles']['Row'];
export type PerfilInsert = Database['public']['Tables']['perfiles']['Insert'];
export type PerfilUpdate = Database['public']['Tables']['perfiles']['Update'];

export type TipoHabitacion = Database['public']['Tables']['tipos_habitacion']['Row'];
export type TipoHabitacionInsert = Database['public']['Tables']['tipos_habitacion']['Insert'];
export type TipoHabitacionUpdate = Database['public']['Tables']['tipos_habitacion']['Update'];

export type Habitacion = Database['public']['Tables']['habitaciones']['Row'];
export type HabitacionInsert = Database['public']['Tables']['habitaciones']['Insert'];
export type HabitacionUpdate = Database['public']['Tables']['habitaciones']['Update'];

export type HistorialLimpieza = Database['public']['Tables']['historial_limpieza']['Row'];
export type HistorialLimpiezaInsert = Database['public']['Tables']['historial_limpieza']['Insert'];

export type Huesped = Database['public']['Tables']['huespedes']['Row'];
export type HuespedInsert = Database['public']['Tables']['huespedes']['Insert'];
export type HuespedUpdate = Database['public']['Tables']['huespedes']['Update'];

export type TurnoCaja = Database['public']['Tables']['turnos_caja']['Row'];
export type TurnoCajaInsert = Database['public']['Tables']['turnos_caja']['Insert'];
export type TurnoCajaUpdate = Database['public']['Tables']['turnos_caja']['Update'];

export type Reserva = Database['public']['Tables']['reservas']['Row'];
export type ReservaInsert = Database['public']['Tables']['reservas']['Insert'];
export type ReservaUpdate = Database['public']['Tables']['reservas']['Update'];

export type CatalogoServicio = Database['public']['Tables']['catalogo_servicios']['Row'];
export type CatalogoServicioInsert = Database['public']['Tables']['catalogo_servicios']['Insert'];

export type ConsumoReserva = Database['public']['Tables']['consumos_reserva']['Row'];
export type ConsumoReservaInsert = Database['public']['Tables']['consumos_reserva']['Insert'];

export type Pago = Database['public']['Tables']['pagos']['Row'];
export type PagoInsert = Database['public']['Tables']['pagos']['Insert'];

// ==============================================================================
// Tipos Compuestos (con relaciones / Joins) para la interfaz de usuario
// ==============================================================================

export interface HabitacionConTipo extends Habitacion {
  tipos_habitacion?: TipoHabitacion | null;
  reserva_activa?: ReservaConDetalle | null;
}

export interface ReservaConDetalle extends Reserva {
  huespedes?: Huesped | null;
  habitaciones?: HabitacionConTipo | null;
  consumos?: (ConsumoReserva & { catalogo_servicios?: CatalogoServicio | null })[];
  pagos?: Pago[];
}
