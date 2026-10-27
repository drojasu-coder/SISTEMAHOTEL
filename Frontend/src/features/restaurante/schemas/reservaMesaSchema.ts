import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const reservaMesaFormSchema = z.object({
  mesa_id: z
    .number({
      required_error: "Debe seleccionar una mesa",
      invalid_type_error: "Debe seleccionar una mesa válida",
    })
    .int("El identificador de mesa debe ser un número entero")
    .positive("Debe seleccionar una mesa válida"),

  fecha: z
    .string({
      required_error: "Debe ingresar la fecha de la reserva",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
    .refine((val) => {
      const parts = val.split("-").map(Number);
      if (parts.length !== 3) return false;
      const [year, month, day] = parts;
      const d = new Date(Date.UTC(year, month - 1, day));
      return (
        d.getUTCFullYear() === year &&
        d.getUTCMonth() === month - 1 &&
        d.getUTCDate() === day
      );
    }, "La fecha ingresada no es válida"),

  hora: z
    .string({
      required_error: "Debe seleccionar el horario de la reserva",
    })
    .regex(timeRegex, "La hora debe tener formato HH:MM (ej. 13:00)"),

  numero_comensales: z
    .number({
      required_error: "Debe ingresar el número de comensales",
      invalid_type_error: "El número de comensales debe ser un número entero",
    })
    .int("El número de comensales debe ser un número entero")
    .min(1, "Debe ser al menos 1 persona"),
});

export type ReservaMesaFormData = z.infer<typeof reservaMesaFormSchema>;
