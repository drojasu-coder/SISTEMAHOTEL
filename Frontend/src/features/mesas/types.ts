/**
 * Modelo de datos de una mesa según el backend real.
 *
 * Verificado contra:
 * - backend/src/models/mesa.js (columnas y association)
 * - backend/src/services/restaurante/mesa.service.ts (include de Sucursal con `attributes: ['nombre']`)
 * - backend/src/controllers/restaurante/mesa.controller.ts (envoltorio `{ status: 'success', data }`)
 *
 * OpenAPI no documenta los esquemas de respuesta de mesas (`content?: never` en el
 * schema generado), por lo que el contrato se declara aquí de forma explícita.
 * Mismo criterio que el módulo de sedes.
 */

/** Asociación incluida por el listado: el backend incluye solo el nombre de la sede. */
export interface MesaSucursal {
  nombre: string;
}

export interface Mesa {
  id: number;
  sucursal_id: number;
  zona: string;
  capacidad: number;
  /** Texto libre de hasta 20 caracteres (contrato del backend). Nunca es null en la base. */
  estado: string;
  createdAt?: string;
  updatedAt?: string;
  /** Presente en el listado (`GET /api/mesas`); puede no venir en la ficha individual. */
  Sucursal?: MesaSucursal | null;
}

/** Envoltorio de éxito usado por el controlador de mesas. */
export interface MesaResponse {
  status: 'success';
  data: Mesa;
}

export interface MesasResponse {
  status: 'success';
  data: Mesa[];
}

/** Alta: el backend valida `sucursal_id`, `zona`, `capacidad` y `estado` (opcional). */
export interface CreateMesaInput {
  sucursal_id: number;
  zona: string;
  capacidad: number;
  estado?: string;
}

/**
 * Edición: el backend NO admite `sucursal_id` en el PATCH
 * (`updateMesaSchema` es `.strict()` y solo contempla zona, capacidad y estado).
 */
export interface UpdateMesaInput {
  zona?: string;
  capacidad?: number;
  estado?: string;
}
