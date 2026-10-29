import { z } from "zod";

const estadosReserva = [
  "pendiente",
  "confirmada",
  "cancelada",
  "finalizada",
  "expirada",
] as const;

const fecha = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "La fecha debe tener el formato AAAA-MM-DD"
  )
  .refine(
    (value) => {
      const parsedDate =
        new Date(
          `${value}T00:00:00Z`
        );

      return (
        !Number.isNaN(
          parsedDate.getTime()
        ) &&
        parsedDate
          .toISOString()
          .slice(0, 10) ===
          value
      );
    },
    "La fecha no es válida"
  );

const reservaFields = {
  usuario_id: z
    .number()
    .int(
      "El ID del usuario debe ser un número entero"
    )
    .positive(
      "El ID del usuario debe ser positivo"
    ),

  habitacion_id: z
    .number()
    .int(
      "El ID de la habitación debe ser un número entero"
    )
    .positive(
      "El ID de la habitación debe ser positivo"
    ),

  fecha_entrada:
    fecha,

  fecha_salida:
    fecha,

  numero_huespedes: z
    .number()
    .int(
      "El número de huéspedes debe ser un número entero"
    )
    .positive(
      "El número de huéspedes debe ser mayor que cero"
    ),

  estado: z
    .enum(
      estadosReserva
    )
    .optional(),
};

export const createReservaHabitacionSchema =
  z
    .object({
      /**
       * Para cliente se obtiene desde JWT.
       * Para administración se solicita
       * explícitamente en el controller.
       */
      usuario_id:
        reservaFields.usuario_id.optional(),

      habitacion_id:
        reservaFields.habitacion_id,

      fecha_entrada:
        reservaFields.fecha_entrada,

      fecha_salida:
        reservaFields.fecha_salida,

      numero_huespedes:
        reservaFields.numero_huespedes,

      /** Solo personal: titular sin cuenta (excluyente con usuario_id). */
      huesped: z
        .object({
          nombre_completo: z.string().trim().min(3, "Indique el nombre completo del huésped").max(150),
          telefono: z.string().trim().regex(/^[+\d][\d\s-]{6,28}$/, "Teléfono no válido").optional().or(z.literal("")),
          email: z.string().trim().email("Correo no válido").max(150).optional().or(z.literal("")),
        })
        .strict()
        .optional(),
      /** Solo clientes: vincula la reserva al carrito en la misma operación. */
      agregar_al_carrito:
        z.boolean().optional(),
    })
    .strict();

export const updateReservaHabitacionSchema =
  z
    .object(
      reservaFields
    )
    .partial()
    .strict()
    .refine(
      (data) =>
        Object.keys(
          data
        ).length > 0,
      {
        message:
          "Debe enviar al menos un campo para actualizar",
      }
    );

export const reservaHabitacionIdSchema =
  z
    .object({
      id: z
        .string()
        .regex(
          /^\d+$/,
          "El ID debe contener únicamente dígitos"
        )
        .transform(
          Number
        )
        .refine(
          (id) =>
            id > 0,
          "El ID debe ser un número positivo"
        ),
    })
    .strict();

/** Búsqueda de huéspedes por nombre, correo o número de cuenta. */
export const searchHuespedesQuerySchema = z
  .object({
    q: z.string().trim().min(2, "Escriba al menos 2 caracteres").max(100),
  })
  .strict();

/**
 * Cobro en efectivo de recepción. efectivo_recibido debe ser true: confirmación explícita de
 * que el dinero se recibió físicamente. La clave de idempotencia evita duplicar el cobro.
 */
export const pagoEfectivoRecepcionSchema = z
  .object({
    monto: z.number().positive("El importe debe ser mayor que cero").multipleOf(0.01, "Máximo dos decimales"),
    idempotency_key: z.string().trim().min(16).max(150).regex(/^[A-Za-z0-9_-]+$/, "Clave de idempotencia no válida"),
    efectivo_recibido: z.literal(true, { message: "Confirme que recibió el efectivo" }),
  })
  .strict();
