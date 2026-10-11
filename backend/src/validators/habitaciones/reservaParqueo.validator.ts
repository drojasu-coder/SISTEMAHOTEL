import { z } from "zod";

/**
 * Aceptamos dos formatos:
 *
 * YYYY-MM-DD
 *
 * o
 *
 * fecha/hora ISO:
 * YYYY-MM-DDTHH:mm
 * YYYY-MM-DDTHH:mm:ss
 * YYYY-MM-DDTHH:mm:ssZ
 * YYYY-MM-DDTHH:mm:ss-06:00
 */
const fecha = z
  .string()
  .refine(
    (value) => {
      const match =
        value.match(
          /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/
        );

      if (!match) {
        return false;
      }

      const year =
        Number(match[1]);

      const month =
        Number(match[2]);

      const day =
        Number(match[3]);

      /**
       * Primero comprobamos que
       * la parte de calendario exista.
       *
       * Evita valores como:
       * 2026-02-30
       */
      const calendarDate =
        new Date(
          Date.UTC(
            year,
            month - 1,
            day
          )
        );

      if (
        calendarDate.getUTCFullYear() !==
          year ||
        calendarDate.getUTCMonth() !==
          month - 1 ||
        calendarDate.getUTCDate() !==
          day
      ) {
        return false;
      }

      /**
       * Fecha simple.
       */
      if (
        value.length ===
        10
      ) {
        return true;
      }

      /**
       * Si lleva hora, debe usar
       * estructura ISO.
       */
      const dateTimeRegex =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;

      if (
        !dateTimeRegex.test(
          value
        )
      ) {
        return false;
      }

      const parsedDate =
        new Date(value);

      return !Number.isNaN(
        parsedDate.getTime()
      );
    },
    "La fecha no es válida. Use YYYY-MM-DD o una fecha/hora ISO 8601"
  );

const reservaParqueoFields = {
  reserva_habitacion_id: z
    .number()
    .int(
      "El ID de la reserva de habitación debe ser un número entero"
    )
    .positive(
      "El ID de la reserva de habitación debe ser positivo"
    )
    .nullable()
    .optional(),

  parqueo_id: z
    .number()
    .int(
      "El ID del parqueo debe ser un número entero"
    )
    .positive(
      "El ID del parqueo debe ser positivo"
    ),

  fecha_entrada:
    fecha,

  fecha_salida:
    fecha
      .nullable()
      .optional(),
};

export const createReservaParqueoSchema =
  z
    .object({
      reserva_habitacion_id:
        reservaParqueoFields.reserva_habitacion_id,

      parqueo_id:
        reservaParqueoFields.parqueo_id,

      fecha_entrada:
        reservaParqueoFields.fecha_entrada,

      fecha_salida:
        reservaParqueoFields.fecha_salida,
    })
    .strict();

export const updateReservaParqueoSchema =
  z
    .object(
      reservaParqueoFields
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

export const reservaParqueoIdSchema =
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
