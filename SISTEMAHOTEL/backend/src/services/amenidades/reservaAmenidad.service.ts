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

// ======================================================
// VALIDAR FECHA
// ======================================================

const validateDate = (
  fecha: string
) => {
  const hoy =
    new Date();

  hoy.setHours(
    0,
    0,
    0,
    0
  );

  const fechaReserva =
    new Date(
      `${fecha}T00:00:00`
    );

  if (
    Number.isNaN(
      fechaReserva.getTime()
    )
  ) {
    throw new AppError(
      400,
      "INVALID_AMENITY_DATE",
      "La fecha de la reserva no es válida"
    );
  }

  if (
    fechaReserva < hoy
  ) {
    throw new AppError(
      422,
      "AMENITY_DATE_IN_PAST",
      "La fecha de la reserva de amenidad no puede estar en el pasado"
    );
  }
};

// ======================================================
// NORMALIZAR Y VALIDAR FRANJA HORARIA
// ======================================================

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
) => {
  /*
   * Aceptamos:
   * 08:00-10:00
   * 08:00 - 10:00
   *
   * Pero guardamos siempre:
   * 08:00-10:00
   */
  const normalized =
    franja
      .replace(
        /\s+/g,
        ""
      )
      .trim();

  const [
    inicio,
    fin,
  ] =
    normalized.split("-");

  if (
    !inicio ||
    !fin
  ) {
    throw new AppError(
      400,
      "INVALID_AMENITY_TIME_SLOT",
      "La franja horaria no es válida"
    );
  }

  if (
    timeToMinutes(inicio) >=
    timeToMinutes(fin)
  ) {
    throw new AppError(
      400,
      "INVALID_AMENITY_TIME_SLOT",
      "La hora de inicio debe ser anterior a la hora de fin"
    );
  }

  return `${inicio}-${fin}`;
};

// ======================================================
// LISTAR
// ======================================================

export const getAll =
  async () => {
    return ReservaAmenidad.findAll({
      include: [
        {
          model:
            Amenidad,

          attributes: [
            "id",
            "nombre",
            "aforo_maximo",
          ],
        },

        {
          model:
            Usuario,

          attributes: [
            "id",
            "nombre",
            "email",
          ],
        },
      ],

      order: [
        [
          "fecha",
          "DESC",
        ],
        [
          "franja_horaria",
          "ASC",
        ],
      ],
    });
  };

// ======================================================
// OBTENER POR ID
// ======================================================

export const getById =
  async (
    id: number
  ) => {
    const reserva =
      await ReservaAmenidad.findByPk(
        id,
        {
          include: [
            {
              model:
                Amenidad,

              attributes: [
                "id",
                "nombre",
                "aforo_maximo",
              ],
            },

            {
              model:
                Usuario,

              attributes: [
                "id",
                "nombre",
                "email",
              ],
            },
          ],
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

// ======================================================
// CREAR
// ======================================================

export const create =
  async (
    data:
      CreateReservaAmenidadData
  ) => {
    validateDate(
      data.fecha
    );

    const franjaHoraria =
      normalizeTimeSlot(
        data.franja_horaria
      );

    const reservaId =
      await sequelize.transaction(
        async (
          transaction: any
        ) => {
          /*
           * Bloqueamos la amenidad durante
           * validación de aforo + creación.
           *
           * Dos solicitudes simultáneas para
           * la misma amenidad no podrán superar
           * el aforo entre ambas.
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

          /*
           * Un mismo usuario no debe reservar
           * dos veces la misma amenidad en la
           * misma fecha y franja.
           */
          const reservaUsuario =
            await ReservaAmenidad
              .findOne({
                where: {
                  usuario_id:
                    data.usuario_id,

                  amenidad_id:
                    data.amenidad_id,

                  fecha:
                    data.fecha,

                  franja_horaria:
                    franjaHoraria,

                  estado:
                    "confirmada",
                },

                transaction,
              });

          if (
            reservaUsuario
          ) {
            throw new AppError(
              409,
              "AMENITY_RESERVATION_ALREADY_EXISTS",
              "El usuario ya posee una reserva para esta amenidad, fecha y franja horaria"
            );
          }

          /*
           * Cada reserva actual equivale a
           * una persona porque el modelo no
           * dispone de numero_personas.
           */
          const ocupacionActual =
            await ReservaAmenidad.count({
              where: {
                amenidad_id:
                  data.amenidad_id,

                fecha:
                  data.fecha,

                franja_horaria:
                  franjaHoraria,

                estado:
                  "confirmada",
              },

              transaction,
            });

          if (
            ocupacionActual >=
            amenidad.aforo_maximo
          ) {
            throw new AppError(
              409,
              "AMENITY_CAPACITY_FULL",
              `El aforo máximo de ${amenidad.aforo_maximo} personas ya está completo para esta franja horaria`
            );
          }

          /*
           * UUID aleatorio.
           * El frontend puede transformar este
           * texto en una imagen QR.
           */
          const codigoQr =
            `AMENITY-${randomUUID()}`;

          const reserva =
            await ReservaAmenidad
              .create(
                {
                  usuario_id:
                    data.usuario_id,

                  amenidad_id:
                    data.amenidad_id,

                  fecha:
                    data.fecha,

                  franja_horaria:
                    franjaHoraria,

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

// ======================================================
// ACTUALIZAR ESTADO
// ======================================================

export const updateStatus =
  async (
    id: number,
    estado:
      ReservaAmenidadEstado
  ) => {
    const reserva =
      await ReservaAmenidad.findByPk(
        id
      );

    if (!reserva) {
      throw new AppError(
        404,
        "AMENITY_RESERVATION_NOT_FOUND",
        "La reserva de amenidad solicitada no existe"
      );
    }

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

    /*
     * Una reserva cancelada o usada es final.
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

    await reserva.update({
      estado,
    });

    return getById(id);
  };