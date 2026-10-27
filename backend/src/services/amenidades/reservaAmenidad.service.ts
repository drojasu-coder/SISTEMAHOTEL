import {
  randomUUID,
} from "crypto";

import {
  AppError,
} from "../../utils/AppError";

const db =
  require("../../models");

const {
  sequelize,
  ReservaAmenidad,
  Amenidad,
  Usuario,
  Sucursal,
} = db;

interface CreateReservaAmenidadData {
  usuario_id: number;
  amenidad_id: number;
  fecha: string;
  franja_horaria: string;
  mobiliario?: string | null;
}

type ReservaAmenidadEstado =
  | "cancelada"
  | "usada";

interface ParsedTimeSlot {
  inicio: number;
  fin: number;
  normalized: string;
}

const reservaAmenidadInclude = [
  {
    model: Amenidad,
    attributes: [
      "id",
      "nombre",
      "aforo_maximo",
      "sucursal_id",
    ],
    include: [
      {
        model: Sucursal,
        attributes: [
          "id",
          "nombre",
        ],
      },
    ],
  },
  {
    model: Usuario,
    attributes: [
      "id",
      "nombre",
      "email",
    ],
  },
];

const getCurrentHotelDateTime =
  () => {
    const timeZone =
      process.env.APP_TIMEZONE ||
      "America/Guatemala";

    const parts =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        }
      ).formatToParts(
        new Date()
      );

    const getPart = (
      type: string
    ) =>
      parts.find(
        (part) =>
          part.type === type
      )?.value ?? "";

    const hours =
      Number(
        getPart("hour")
      );

    const minutes =
      Number(
        getPart("minute")
      );

    const seconds =
      Number(
        getPart("second")
      );

    return {
      fecha:
        `${getPart("year")}-${getPart("month")}-${getPart("day")}`,

      seconds:
        hours * 3600 +
        minutes * 60 +
        seconds,
    };
  };

const validateDate = (
  fecha: string
) => {
  const [
    year,
    month,
    day,
  ] = fecha
    .split("-")
    .map(Number);

  const parsedDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  const validDate =
    parsedDate.getUTCFullYear() ===
      year &&
    parsedDate.getUTCMonth() ===
      month - 1 &&
    parsedDate.getUTCDate() ===
      day;

  if (!validDate) {
    throw new AppError(
      400,
      "INVALID_AMENITY_DATE",
      "La fecha de la reserva no es válida"
    );
  }

  const current =
    getCurrentHotelDateTime();

  if (
    fecha <
    current.fecha
  ) {
    throw new AppError(
      422,
      "AMENITY_DATE_IN_PAST",
      "La fecha de la reserva de amenidad no puede estar en el pasado"
    );
  }
};

const timeToMinutes = (
  time: string
) => {
  const [
    hours,
    minutes,
  ] = time
    .split(":")
    .map(Number);

  return (
    hours * 60 +
    minutes
  );
};

const normalizeTimeSlot = (
  franja: string
): ParsedTimeSlot => {
  const normalized =
    franja
      .replace(
        /\s+/g,
        ""
      )
      .trim();

  const timeSlotRegex =
    /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;

  if (
    !timeSlotRegex.test(
      normalized
    )
  ) {
    throw new AppError(
      400,
      "INVALID_AMENITY_TIME_SLOT",
      "La franja horaria no es válida"
    );
  }

  const [
    inicioText,
    finText,
  ] =
    normalized.split("-");

  const inicio =
    timeToMinutes(
      inicioText
    );

  const fin =
    timeToMinutes(
      finText
    );

  if (
    inicio >= fin
  ) {
    throw new AppError(
      400,
      "INVALID_AMENITY_TIME_SLOT",
      "La hora de inicio debe ser anterior a la hora de fin"
    );
  }

  return {
    inicio,
    fin,
    normalized:
      `${inicioText}-${finText}`,
  };
};

const validateTimeSlotNotPast = (
  fecha: string,
  inicioMinutos: number
) => {
  const current =
    getCurrentHotelDateTime();

  if (
    fecha !==
    current.fecha
  ) {
    return;
  }

  const inicioSegundos =
    inicioMinutos * 60;

  if (
    inicioSegundos <
    current.seconds
  ) {
    throw new AppError(
      422,
      "AMENITY_TIME_SLOT_IN_PAST",
      "La franja horaria de la amenidad ya comenzó"
    );
  }
};

const slotsOverlap = (
  inicioA: number,
  finA: number,
  inicioB: number,
  finB: number
) =>
  inicioA < finB &&
  finA > inicioB;

const getStoredSlot = (
  franja: string
) =>
  normalizeTimeSlot(
    franja
  );

/**
 * Comprueba el máximo de personas
 * concurrentes durante la nueva franja.
 *
 * No basta con contar todas las reservas
 * que tengan algún solapamiento, porque
 * podrían coincidir en momentos distintos.
 */
const validateCapacity = (
  reservasExistentes: any[],
  nuevaFranja: ParsedTimeSlot,
  aforoMaximo: number
) => {
  const events:
    Array<{
      time: number;
      delta: number;
    }> = [];

  for (
    const reserva of
    reservasExistentes
  ) {
    const slot =
      getStoredSlot(
        reserva.franja_horaria
      );

    if (
      !slotsOverlap(
        slot.inicio,
        slot.fin,
        nuevaFranja.inicio,
        nuevaFranja.fin
      )
    ) {
      continue;
    }

    events.push(
      {
        time:
          slot.inicio,
        delta: 1,
      },
      {
        time:
          slot.fin,
        delta: -1,
      }
    );
  }

  /**
   * Añadimos la nueva reserva,
   * que representa una persona.
   */
  events.push(
    {
      time:
        nuevaFranja.inicio,
      delta: 1,
    },
    {
      time:
        nuevaFranja.fin,
      delta: -1,
    }
  );

  /**
   * Ante la misma hora procesamos
   * primero las salidas (-1) y
   * después las entradas (+1).
   *
   * De esta forma:
   * 08:00-10:00
   * 10:00-12:00
   *
   * no se consideran simultáneas.
   */
  events.sort(
    (
      a,
      b
    ) =>
      a.time -
        b.time ||
      a.delta -
        b.delta
  );

  let ocupacion = 0;
  let maxOcupacion = 0;

  for (
    const event of events
  ) {
    ocupacion +=
      event.delta;

    maxOcupacion =
      Math.max(
        maxOcupacion,
        ocupacion
      );
  }

  if (
    maxOcupacion >
    aforoMaximo
  ) {
    throw new AppError(
      409,
      "AMENITY_CAPACITY_FULL",
      `El aforo máximo de ${aforoMaximo} personas sería excedido durante esa franja horaria`
    );
  }
};

export const getAll =
  async () => {
    return ReservaAmenidad.findAll(
      {
        include:
          reservaAmenidadInclude,

        order: [
          [
            "fecha",
            "DESC",
          ],
          [
            "franja_horaria",
            "ASC",
          ],
          [
            "id",
            "ASC",
          ],
        ],
      }
    );
  };

export const getById =
  async (
    id: number
  ) => {
    const reserva =
      await ReservaAmenidad.findByPk(
        id,
        {
          include:
            reservaAmenidadInclude,
        }
      );

    if (!reserva) {
      throw new AppError(
        404,
        "AMENITY_RESERVATION_NOT_FOUND",
        "La reserva de amenidad solicitada no existe"
      );
    }

    return reserva;
  };

export const getMine = async (
  usuarioId: number
) => {
  return ReservaAmenidad.findAll({
    where: {
      usuario_id: usuarioId,
    },
    include: reservaAmenidadInclude,
    order: [
      ["fecha", "DESC"],
      ["franja_horaria", "ASC"],
      ["id", "ASC"],
    ],
  });
};

export const getMineById = async (
  usuarioId: number,
  id: number
) => {
  const reserva =
    await ReservaAmenidad.findOne({
      where: {
        id,
        usuario_id: usuarioId,
      },
      include: reservaAmenidadInclude,
    });

  if (!reserva) {
    throw new AppError(
      404,
      "AMENITY_RESERVATION_NOT_FOUND",
      "La reserva de amenidad solicitada no existe"
    );
  }

  return reserva;
};

export const create =
  async (
    data:
      CreateReservaAmenidadData
  ) => {
    validateDate(
      data.fecha
    );

    const nuevaFranja =
      normalizeTimeSlot(
        data.franja_horaria
      );

    validateTimeSlotNotPast(
      data.fecha,
      nuevaFranja.inicio
    );

    const reservaId =
      await sequelize.transaction(
        async (
          transaction: any
        ) => {
          /**
           * Serializamos las creaciones para
           * una misma amenidad mientras se
           * comprueba disponibilidad y aforo.
           */
          const amenidad =
            await Amenidad.findByPk(
              data.amenidad_id,
              {
                transaction,

                lock:
                  transaction
                    .LOCK
                    .UPDATE,
              }
            );

          if (!amenidad) {
            throw new AppError(
              404,
              "AMENITY_NOT_FOUND",
              "La amenidad solicitada no existe"
            );
          }

          /**
           * Obtenemos las reservas que actualmente
           * consumen aforo para esa amenidad y día.
           */
          const reservasConfirmadas =
            await ReservaAmenidad.findAll(
              {
                where: {
                  amenidad_id:
                    data.amenidad_id,

                  fecha:
                    data.fecha,

                  estado:
                    "confirmada",
                },

                attributes: [
                  "id",
                  "usuario_id",
                  "franja_horaria",
                ],

                transaction,
              }
            );

          /**
           * Un mismo usuario no puede reservar
           * la misma amenidad en franjas que se
           * superpongan.
           */
          const reservaUsuario =
            reservasConfirmadas.find(
              (
                reserva: any
              ) => {
                if (
                  reserva.usuario_id !==
                  data.usuario_id
                ) {
                  return false;
                }

                const slot =
                  getStoredSlot(
                    reserva
                      .franja_horaria
                  );

                return slotsOverlap(
                  slot.inicio,
                  slot.fin,
                  nuevaFranja.inicio,
                  nuevaFranja.fin
                );
              }
            );

          if (
            reservaUsuario
          ) {
            throw new AppError(
              409,
              "AMENITY_RESERVATION_ALREADY_EXISTS",
              "El usuario ya posee una reserva para esta amenidad en una franja horaria que se superpone"
            );
          }

          /**
           * Cada reserva representa actualmente
           * una persona.
           */
          validateCapacity(
            reservasConfirmadas,
            nuevaFranja,
            Number(
              amenidad
                .aforo_maximo
            )
          );

          const codigoQr =
            `AMENITY-${randomUUID()}`;

          const reserva =
            await ReservaAmenidad.create(
              {
                usuario_id:
                  data.usuario_id,

                amenidad_id:
                  data.amenidad_id,

                fecha:
                  data.fecha,

                franja_horaria:
                  nuevaFranja.normalized,

                mobiliario:
                  data.mobiliario
                    ?.trim() ||
                  "ninguno",

                codigo_qr:
                  codigoQr,

                estado:
                  "confirmada",
              },
              {
                transaction,
              }
            );

          return reserva.id;
        }
      );

    return getById(
      reservaId
    );
  };

export const updateStatus =
  async (
    id: number,
    estado:
      ReservaAmenidadEstado
  ) => {
    /**
     * El cambio de estado debe ser atómico.
     *
     * Sin este lock, varias solicitudes concurrentes
     * pueden leer "confirmada" al mismo tiempo y todas
     * terminar actualizando la misma reserva.
     *
     * Con SELECT ... FOR UPDATE:
     * - una sola petición obtiene primero la fila;
     * - las demás esperan;
     * - cuando continúan, observan el estado terminal
     *   ya persistido por la ganadora.
     */
    const reservaId =
      await sequelize.transaction(
        async (
          transaction: any
        ) => {
          const reserva =
            await ReservaAmenidad.findByPk(
              id,
              {
                transaction,
                lock:
                  transaction
                    .LOCK
                    .UPDATE,
              }
            );

          if (!reserva) {
            throw new AppError(
              404,
              "AMENITY_RESERVATION_NOT_FOUND",
              "La reserva de amenidad solicitada no existe"
            );
          }

          /**
           * Si la reserva ya posee exactamente
           * el estado solicitado, no hay cambio.
           */
          if (
            reserva.estado ===
            estado
          ) {
            throw new AppError(
              409,
              "AMENITY_RESERVATION_STATUS_UNCHANGED",
              `La reserva ya se encuentra en estado ${estado}`
            );
          }

          /**
           * Cancelada y usada son estados finales.
           *
           * Después de que una petición gana la carrera
           * y persiste uno de estos estados, cualquier
           * otra petición concurrente quedará rechazada.
           */
          if (
            reserva.estado ===
              "cancelada" ||
            reserva.estado ===
              "usada"
          ) {
            throw new AppError(
              409,
              "AMENITY_RESERVATION_STATUS_FINAL",
              "La reserva se encuentra en un estado final y ya no puede modificarse"
            );
          }

          await reserva.update(
            {
              estado,
            },
            {
              transaction,
            }
          );

          return reserva.id;
        }
      );

    /**
     * El COMMIT ya ocurrió.
     * Recuperamos la reserva con sus asociaciones.
     */
    return getById(
      reservaId
    );
  };
