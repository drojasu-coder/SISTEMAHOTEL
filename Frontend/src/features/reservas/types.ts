import type { components, paths } from "@/api/generated/schema";

type Schemas = components["schemas"];

export const ESTADOS_RESERVA_HABITACION = [
  "pendiente",
  "confirmada",
  "cancelada",
  "finalizada",
  "expirada",
] as const;

export type EstadoReservaHabitacion = Schemas["ReservaHabitacion"]["estado"];

export type ReservaHabitacionUsuario = Schemas["ReservaHabitacionUsuario"];
export type ReservaHabitacionTipo = Schemas["ReservaHabitacionTipo"] & {
  imagen_key?: string | null;
  imagen_url?: string | null;
  imagen_expires_at?: number | null;
  imagen_creditos?: {
    autor?: string;
    fuente?: string;
    licencia?: string;
    url?: string;
  } | null;
};
export type ReservaHabitacionSucursal = Schemas["ReservaHabitacionSucursal"];
export type ReservaHabitacionHabitacion = Schemas["ReservaHabitacionHabitacion"];

/**
 * Modelo representativo de una reserva de habitación en el sistema.
 */
/** Huésped sin cuenta de una reserva presencial registrada en recepción. */
export interface HuespedPresencial {
  id: number;
  nombre_completo: string;
  telefono?: string | null;
  email?: string | null;
}

export type ReservaHabitacion = Schemas["ReservaHabitacion"] & {
  /** Titular sin cuenta (reserva presencial); excluyente con Usuario. */
  huesped_id?: number | null;
  Huesped?: HuespedPresencial | null;
};

/** Nombre y contacto del titular, tenga cuenta de cliente o sea un huésped sin cuenta. */
export function titularReserva(reserva: Pick<ReservaHabitacion, "Usuario" | "Huesped">) {
  if (reserva.Usuario) return { nombre: reserva.Usuario.nombre, email: reserva.Usuario.email ?? null, telefono: reserva.Usuario.telefono ?? null, sinCuenta: false };
  if (reserva.Huesped) return { nombre: reserva.Huesped.nombre_completo, email: reserva.Huesped.email ?? null, telefono: reserva.Huesped.telefono ?? null, sinCuenta: true };
  return null;
}

/**
 * Parámetros para la consulta de disponibilidad de habitaciones (GET /api/habitaciones/disponibles).
 */
export type DisponibilidadHabitacionQuery =
  paths["/api/habitaciones/disponibles"]["get"]["parameters"]["query"];

/**
 * Estructura de habitación devuelta por la consulta de disponibilidad por fechas.
 */
export type HabitacionDisponible = Schemas["HabitacionDisponible"] & {
  imagen_key?: string | null;
  imagen_url?: string | null;
  imagen_expires_at?: number | null;
  imagen_creditos?: {
    autor?: string;
    fuente?: string;
    licencia?: string;
    url?: string;
  } | null;
  TipoHabitacion?: ReservaHabitacionTipo;
};

export type CreateReservaHabitacionRequest =
  Schemas["CreateReservaHabitacionRequest"];

/**
 * Payload para que un cliente cree su reserva (POST /api/reservas-habitacion).
 * El cliente NUNCA envía usuario_id (se obtiene del JWT), ni estado, ni total, ni tarifa.
 */
export type CreateReservaHabitacionInput = Omit<
  CreateReservaHabitacionRequest,
  "usuario_id"
> & {
  /** Solo clientes: el servidor vincula la reserva al carrito en la misma operación. */
  agregar_al_carrito?: boolean;
};

/** Reserva registrada por recepción: titular con cuenta (usuario_id) o huésped sin cuenta (huesped). */
export type CreateReservaHuespedInput = Omit<CreateReservaHabitacionRequest, "usuario_id"> & (
  | { usuario_id: number; huesped?: never }
  | { usuario_id?: never; huesped: { nombre_completo: string; telefono?: string; email?: string } }
);

/** Saldo de una reserva calculado por el servidor para recepción. */
export interface SaldoReservaRecepcion {
  reserva_id: number;
  estado: string;
  total: number;
  aprobado: number;
  en_proceso: number;
  saldo: number;
}

/** Cuenta de cliente devuelta por la búsqueda de huéspedes de recepción. */
export interface HuespedBusqueda {
  id: number;
  nombre: string;
  email: string;
  telefono?: string | null;
}

/** Vínculo de una reserva pendiente con el carrito (respuesta de POST con agregar_al_carrito). */
export interface ReservaCarritoVinculo {
  vinculada: boolean;
  carrito_id: number | null;
  item_id: number | null;
  /** Vencimiento real del carrito (ISO). Nunca se reinicia ni se amplía al abrir o recargar el carrito. */
  expira_en: string | null;
}

// Envoltorios de respuesta de la API REST
export type ReservaHabitacionResponse = Schemas["ReservaHabitacionResponse"];
export type ReservaHabitacionCreatedResponse =
  Schemas["ReservaHabitacionCreatedResponse"];
export type ReservasHabitacionResponse = Schemas["ReservasHabitacionResponse"];
export type DisponibilidadHabitacionesResponse =
  Schemas["DisponibilidadHabitacionesResponse"];

export type ReservaHabitacionConCarrito = ReservaHabitacion & {
  reutilizada?: boolean;
  carrito?: ReservaCarritoVinculo;
};


/** Contrato de GET /reservas-habitacion/:id/estado-pago, pendiente de regenerar OpenAPI. */
export interface EstadoPagoReserva {
  estado: 'pagable' | 'pagada' | 'no_disponible' | 'incierto' | 'reanudable';
  pago_id: number | null;
  carrito_id: number | null;
}
