import { z } from "zod";

const estadosHabitacion = [
  "disponible",
  "ocupada",
  "mantenimiento",
  "limpieza",
] as const;

const habitacionFields = {
  sucursal_id: z
    .number()
    .int("El ID de la sucursal debe ser un número entero")
    .positive("El ID de la sucursal debe ser positivo"),

  tipo_habitacion_id: z
    .number()
    .int("El ID del tipo de habitación debe ser un número entero")
    .positive("El ID del tipo de habitación debe ser positivo"),

  numero: z
    .string()
    .trim()
    .min(1, "El número de habitación es obligatorio")
    .max(10, "El número de habitación no puede superar 10 caracteres"),

  estado: z
    .enum(estadosHabitacion, {
      message:
        "El estado debe ser disponible, ocupada, mantenimiento o limpieza",
    })
    .optional(),
};

export const createHabitacionSchema = z
  .object(habitacionFields)
  .strict();

export const updateHabitacionSchema = z
  .object(habitacionFields)
  .partial()
  .strict();

export const habitacionIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "El ID debe contener únicamente dígitos")
    .transform(Number)
    .refine((id) => id > 0, "El ID debe ser un número positivo"),
}).strict();

const fecha = z
  .string()
  .trim()
  .min(1, "La fecha no puede estar vacía")
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "La fecha debe tener el formato AAAA-MM-DD"
  )
  .refine(
    (value) => {
      const parsedDate = new Date(`${value}T00:00:00Z`);
      return (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === value
      );
    },
    "La fecha no es válida"
  );

export const disponibilidadHabitacionQuerySchema = z
  .object({
    sucursal_id: z
      .string()
      .trim()
      .min(1, "sucursal_id no puede estar vacío")
      .regex(/^\d+$/, "El ID de la sucursal debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID de la sucursal debe ser un número positivo"),

    fecha_entrada: fecha,

    fecha_salida: fecha,

    numero_huespedes: z
      .string()
      .trim()
      .min(1, "numero_huespedes no puede estar vacío")
      .regex(/^\d+$/, "El número de huéspedes debe contener únicamente dígitos")
      .transform(Number)
      .refine((n) => n > 0, "El número de huéspedes debe ser mayor que cero"),

    tipo_habitacion_id: z
      .string()
      .trim()
      .min(1, "tipo_habitacion_id no puede estar vacío")
      .regex(/^\d+$/, "El ID del tipo de habitación debe contener únicamente dígitos")
      .transform(Number)
      .refine((id) => id > 0, "El ID del tipo de habitación debe ser un número positivo")
      .optional(),
  })
  .strict();
