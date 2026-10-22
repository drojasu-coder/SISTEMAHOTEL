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
export type ReservaHabitacionTipo = Schemas["ReservaHabitacionTipo"];
export type ReservaHabitacionSucursal = Schemas["ReservaHabitacionSucursal"];
export type ReservaHabitacionHabitacion = Schemas["ReservaHabitacionHabitacion"];

/**
 * Modelo representativo de una reserva de habitación en el sistema.
 */
export type ReservaHabitacion = Schemas["ReservaHabitacion"];

/**
 * Parámetros para la consulta de disponibilidad de habitaciones (GET /api/habitaciones/disponibles).
 */
export type DisponibilidadHabitacionQuery =
  paths["/api/habitaciones/disponibles"]["get"]["parameters"]["query"];

/**
 * Estructura de habitación devuelta por la consulta de disponibilidad por fechas.
 */
export type HabitacionDisponible = Schemas["HabitacionDisponible"];

export type CreateReservaHabitacionRequest =
  Schemas["CreateReservaHabitacionRequest"];

/**
 * Payload para que un cliente cree su reserva (POST /api/reservas-habitacion).
 * El cliente NUNCA envía usuario_id (se obtiene del JWT), ni estado, ni total, ni tarifa.
 */
export type CreateReservaHabitacionInput = Omit<
  CreateReservaHabitacionRequest,
  "usuario_id"
>;

// Envoltorios de respuesta de la API REST
export type ReservaHabitacionResponse = Schemas["ReservaHabitacionResponse"];
export type ReservaHabitacionCreatedResponse =
  Schemas["ReservaHabitacionCreatedResponse"];
export type ReservasHabitacionResponse = Schemas["ReservasHabitacionResponse"];
export type DisponibilidadHabitacionesResponse =
  Schemas["DisponibilidadHabitacionesResponse"];
