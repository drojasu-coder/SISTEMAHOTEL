import { z } from "zod";
import { horaOperacionSchema } from "../../utils/franjasHorarias";

const tarifa = z
  .number()
  .finite("La tarifa debe ser un numero valido")
  .nonnegative("La tarifa no puede ser negativa");

const modalidadFields = {
  modalidad: z.enum(["por_hora", "experiencia"]).optional(),
  duracion_minutos: z.number().int().min(30).max(720).nullable().optional(),
  cupo_maximo: z.number().int().positive().max(500).nullable().optional(),
  precio_persona: tarifa.nullable().optional(),
  hora_apertura: horaOperacionSchema,
  hora_cierre: horaOperacionSchema,
};

/** Una experiencia necesita duración, cupo y precio por persona. */
export const assertExperienciaCompleta = (data: {
  modalidad?: string;
  duracion_minutos?: number | null;
  cupo_maximo?: number | null;
  precio_persona?: number | string | null;
}) =>
  data.modalidad !== "experiencia" ||
  (data.duracion_minutos != null && data.cupo_maximo != null && data.precio_persona != null);

const experienciaMessage = {
  message: "Una experiencia requiere duracion_minutos, cupo_maximo y precio_persona",
  path: ["modalidad"],
};

export const salidasQuerySchema = z
  .object({
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD"),
    // Opcional: excluye las franjas que chocarían con otras clases del instructor elegido.
    instructor_id: z.coerce.number().int().positive().optional(),
  })
  .strict();

export const createRecursoActividadSchema = z
  .object({
    sucursal_id: z
      .number()
      .int("El ID de la sucursal debe ser un numero entero")
      .positive("El ID de la sucursal debe ser positivo"),
    tipo: z
      .string()
      .trim()
      .min(1, "El tipo no puede estar vacio")
      .max(30, "El tipo no puede superar 30 caracteres"), // Ej: golf, tenis, billar
    nombre: z
      .string()
      .trim()
      .min(1, "El nombre no puede estar vacio")
      .max(100, "El nombre no puede superar 100 caracteres"), // Ej: Cancha 1
    precio_hora: tarifa.optional(),
    precio_equipo: tarifa.optional(),
    precio_instructor_hora: tarifa.optional(),
    ...modalidadFields,
  })
  .strict()
  .refine(assertExperienciaCompleta, experienciaMessage);

export const updateRecursoActividadSchema = z
  .object({
    tipo: z.string().trim().min(1).max(30).optional(),
    nombre: z.string().trim().min(1).max(100).optional(),
    precio_hora: tarifa.optional(),
    precio_equipo: tarifa.optional(),
    precio_instructor_hora: tarifa.optional(),
    ...modalidadFields,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });
