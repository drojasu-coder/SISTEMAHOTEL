export type Rol =
  | "admin"
  | "recepcionista"
  | "gerente_restaurante"
  | "gerente_habitaciones"
  | "empleado_operativo"
  | "cliente";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: Rol;
}

export interface Sucursal { id: number; nombre: string; direccion?: string; ciudad?: string; telefono?: string; activa: boolean }
export interface TipoHabitacion { id: number; nombre: string; capacidad_maxima: number; tarifa_noche: string; descripcion?: string | null }
export interface Habitacion {
  id: number; sucursal_id: number; tipo_habitacion_id: number; numero: string;
  estado: "disponible" | "ocupada" | "mantenimiento" | "limpieza";
  TipoHabitacion?: TipoHabitacion; Sucursal?: Sucursal;
}
export interface ReservaHabitacion {
  id: number; usuario_id: number; habitacion_id: number; fecha_entrada: string; fecha_salida: string;
  numero_huespedes: number; estado: string; total: string;
}
export interface Salon { id: number; sucursal_id: number; nombre: string; capacidad_maxima: number; tarifa_base: string; descripcion?: string | null }
export interface ServicioEvento { id: number; nombre: string; precio: string }
export interface ReservaEvento {
  id: number; salon_id: number; tipo_evento: string; fecha: string; hora_inicio: string; hora_fin: string;
  numero_invitados: number; estado: string; anticipo: string; total: string;
}
export interface Mesa { id: number; sucursal_id: number; zona: "interior" | "terraza" | "bar"; capacidad: number; estado: string }
export interface RecursoActividad { id: number; sucursal_id: number; tipo: string; nombre: string }
export interface Instructor { id: number; nombre: string; especialidad?: string | null; activo: boolean }
export interface Amenidad { id: number; sucursal_id: number; nombre: string; aforo_maximo: number }
export interface Terapeuta { id: number; nombre: string; activo: boolean }
export interface ServicioSpa { id: number; nombre: string; duracion_minutos: number; precio: string }
export interface BoletoParque { id: number; fecha_visita: string; tipo_boleto: string; precio: string; codigo_qr: string; estado: string }
export interface ReservaTransporte {
  id: number; origen: string; destino: string; fecha_hora: string; numero_pasajeros: number; estado: string;
}

export interface Carrito { id: number; usuario_id: number; estado: string; creado_en: string; expira_en: string | null }
export type TipoItem = "habitacion" | "evento" | "mesa" | "actividad" | "amenidad" | "bienestar" | "boleto_parque" | "transporte";
export interface CarritoItem {
  id: number; carrito_id: number; tipo_item: TipoItem; referencia_id: number;
  descripcion: string | null; precio: string; cantidad: number;
}
export interface Pago {
  id: number; carrito_id: number | null; monto: string; metodo: string; tipo_pago: string;
  estado: string; moneda: string; creado_en?: string;
}
export interface ResumenPago { total: number; anticipo_requerido: number; aprobado: number; saldo: number }
