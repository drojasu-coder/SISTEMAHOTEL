import { z } from 'zod';
import type { CreateMesaInput, UpdateMesaInput } from '../types';

/**
 * Reglas de validación espejo del backend real:
 * - `backend/src/validators/restaurante/mesa.validator.ts` (createMesaSchema / updateMesaSchema).
 *
 * El formulario trabaja con cadenas (igual que el módulo de sedes) y la conversión a
 * números ocurre al construir el payload, para que los mensajes de error sean del
 * cliente y los límites coincidan con los del servidor.
 */

export type MensajesMesa = typeof mensajesMesa;

export const mensajesMesa = {
  sede: 'Seleccione la sede donde se ubicará la mesa.',
  zonaVacia: 'La zona no puede estar vacía',
  zonaLarga: 'La zona no puede superar los 30 caracteres',
  capacidadVacia: 'La capacidad es obligatoria',
  capacidadInvalida: 'La capacidad debe ser un número entero mayor a 0',
  estadoLargo: 'El estado no puede superar los 20 caracteres',
  estadoVacioEnEdicion: 'Conserve el estado actual o ingrese otro valor.',
};

export const mensajesMesaEn: MensajesMesa = {
  sede: 'Select the site where the table will be located.',
  zonaVacia: 'The area cannot be empty',
  zonaLarga: 'The area cannot exceed 30 characters',
  capacidadVacia: 'Capacity is required',
  capacidadInvalida: 'Capacity must be a whole number greater than 0',
  estadoLargo: 'The status cannot exceed 20 characters',
  estadoVacioEnEdicion: 'Keep the current status or enter another value.',
};

/** Esquema del formulario con los mensajes del idioma activo. */
export function createMesaFormSchema(m: MensajesMesa = mensajesMesa) {
const zonas = z
  .string({ required_error: m.zonaVacia })
  .trim()
  .min(1, m.zonaVacia)
  .max(30, m.zonaLarga);

const capacidades = z
  .string({ required_error: m.capacidadVacia })
  .trim()
  .min(1, m.capacidadVacia)
  .refine(
    (value) => /^\d+$/.test(value) && Number(value) > 0,
    m.capacidadInvalida,
  );

const estados = z.string().trim().max(20, m.estadoLargo);

const sedes = z
  .string({ required_error: m.sede })
  .trim()
  .min(1, m.sede)
  .refine(
    (value) => /^\d+$/.test(value) && Number(value) > 0,
    m.sede,
  );

return z
  .object({
    sucursal_id: sedes,
    zona: zonas,
    capacidad: capacidades,
    estado: estados,
    originalEstado: z.string(),
  })
  .superRefine((data, ctx) => {
    const original = data.originalEstado.trim();
    if (original.length > 0 && data.estado.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['estado'],
        message: m.estadoVacioEnEdicion,
      });
    }
  });
}

/**
 * Un único esquema para alta y edición.
 *
 * `originalEstado` es un auxiliar de validación (no se envía al servidor): permite
 * impedir que en edición se vacíe un estado existente, porque omitirlo en el PATCH
 * lo conservaría en el servidor y se vería como un borrado que nunca ocurrió.
 */
export const mesaFormSchema = createMesaFormSchema();

export type MesaFormValues = z.infer<typeof mesaFormSchema>;

/** Campos que el backend reconoce, para asignar los errores de validación del servidor. */
export const CAMPOS_MESA = ['sucursal_id', 'zona', 'capacidad', 'estado'] as const;


/** Payload de alta: `estado` se omite cuando el campo quedó vacío. */
export function sanitizeCreateMesa(values: MesaFormValues): CreateMesaInput {
  const estado = values.estado.trim();
  return {
    sucursal_id: Number(values.sucursal_id),
    zona: values.zona.trim(),
    capacidad: Number(values.capacidad),
    ...(estado.length > 0 ? { estado } : {}),
  };
}

/**
 * Payload de edición: solo zona, capacidad y estado (el PATCH no admite `sucursal_id`).
 * `estado` se omite únicamente cuando la mesa no tenía estado y el campo sigue vacío.
 */
export function sanitizeUpdateMesa(values: MesaFormValues): UpdateMesaInput {
  const estado = values.estado.trim();
  return {
    zona: values.zona.trim(),
    capacidad: Number(values.capacidad),
    ...(estado.length > 0 ? { estado } : {}),
  };
}
