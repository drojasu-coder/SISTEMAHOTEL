import { Op } from "sequelize";

import { AppError }
  from "../../utils/AppError";

import { env }
  from "../../config/env";

import {
  ROLES,
  Role,
} from "../../constants/roles";

const db = require("../../models");

const {
  sequelize,
  ReservaTransporte,
  Usuario,
  Chofer,
  Vehiculo,
} = db;

interface ReservaTransporteData {
  origen: string;
  destino: string;
  fecha_hora: string;
  numero_pasajeros: number;
}

const getDate = (
  fechaHora: string | Date
) => {
  const date =
    fechaHora instanceof Date
      ? fechaHora
      : new Date(fechaHora);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new AppError(
      400,
      "INVALID_DATETIME",
      "La fecha y hora enviadas no son válidas"
    );
  }

  return date;
};

const validateFutureDate = (
  fechaHora: string | Date
) => {
  const date =
    getDate(fechaHora);

  if (
    date.getTime() <=
    Date.now()
  ) {
    throw new AppError(
      422,
      "TRANSPORT_DATE_IN_PAST",
      "La fecha y hora del traslado deben ser futuras"
    );
  }

  return date;
};

const validateRoute = (
  origen: string,
  destino: string
) => {
  if (
    origen.trim().toLowerCase() ===
    destino.trim().toLowerCase()
  ) {
    throw new AppError(
      422,
      "SAME_TRANSPORT_ORIGIN_DESTINATION",
      "El origen y el destino no pueden ser iguales"
    );
  }
};

const getBlockingRange = (
  fechaHora: string | Date
) => {
  const start =
    getDate(fechaHora);

  const blockMs =
    env.TRANSPORT_BLOCK_MINUTES *
    60 *
    1000;

  const end =
    new Date(
      start.getTime() +
        blockMs
    );

  const lowerBound =
    new Date(
      start.getTime() -
        blockMs
    );

  return {
    start,
    end,
    lowerBound,
  };
};

const getBlockedResourceIds =
  async (
    fechaHora: string | Date,
    transaction: any,
    excludeReservationId?: number
  ) => {
    const {
      end,
      lowerBound,
    } =
      getBlockingRange(
        fechaHora
      );

    const where: any = {
      estado: "confirmada",

      fecha_hora: {
        [Op.gt]:
          lowerBound,

        [Op.lt]:
          end,
      },
    };

    if (
      excludeReservationId !==
      undefined
    ) {
      where.id = {
        [Op.ne]:
          excludeReservationId,
      };
    }

    const reservas =
      await ReservaTransporte.findAll({
        where,

        attributes: [
          "chofer_id",
          "vehiculo_id",
        ],

        transaction,
      });

    const choferIds =
      reservas
        .map(
          (r: any) =>
            r.chofer_id
        )
        .filter(
          (
            id: number | null
          ): id is number =>
            id !== null
        );

    const vehiculoIds =
      reservas
        .map(
          (r: any) =>
            r.vehiculo_id
        )
        .filter(
          (
            id: number | null
          ): id is number =>
            id !== null
        );

    return {
      choferIds,
      vehiculoIds,
    };
  };

  const assignResources = async (
  numeroPasajeros: number,
  fechaHora: string | Date,
  transaction: any,
  excludeReservationId?: number
) => {
  /*
   * Primero comprobamos que la flota tenga
   * AL MENOS un vehículo con capacidad suficiente.
   */
  const suitableVehicleCount =
    await Vehiculo.count({
      where: {
        capacidad: {
          [Op.gte]:
            numeroPasajeros,
        },
      },

      transaction,
    });

  if (
    suitableVehicleCount === 0
  ) {
    throw new AppError(
      422,
      "NO_VEHICLE_WITH_REQUIRED_CAPACITY",
      "No existe un vehículo con capacidad suficiente para el número de pasajeros indicado"
    );
  }

  const {
    choferIds,
    vehiculoIds,
  } =
    await getBlockedResourceIds(
      fechaHora,
      transaction,
      excludeReservationId
    );

  const vehicleWhere: any = {
    capacidad: {
      [Op.gte]:
        numeroPasajeros,
    },
  };

  if (
    vehiculoIds.length > 0
  ) {
    vehicleWhere.id = {
      [Op.notIn]:
        vehiculoIds,
    };
  }

  const driverWhere: any = {
    activo: true,
  };

  if (
    choferIds.length > 0
  ) {
    driverWhere.id = {
      [Op.notIn]:
        choferIds,
    };
  }

  /*
   * Escogemos el vehículo más pequeño
   * que todavía tenga capacidad suficiente.
   */
  const vehiculo =
    await Vehiculo.findOne({
      where:
        vehicleWhere,

      order: [
        ["capacidad", "ASC"],
        ["id", "ASC"],
      ],

      transaction,

      lock:
        transaction.LOCK.UPDATE,

      skipLocked: true,
    });

  const chofer =
    await Chofer.findOne({
      where:
        driverWhere,

      order: [
        ["id", "ASC"],
      ],

      transaction,

      lock:
        transaction.LOCK.UPDATE,

      skipLocked: true,
    });

  /*
   * Si alguno no está disponible,
   * dejamos la solicitud pendiente.
   */
  if (
    !vehiculo ||
    !chofer
  ) {
    return null;
  }

  return {
    chofer_id:
      chofer.id,

    vehiculo_id:
      vehiculo.id,
  };
};

export const getAll = async (
  requesterId: number,
  requesterRole: Role
) => {
  const where =
    requesterRole ===
    ROLES.ADMIN
      ? {}
      : {
          usuario_id:
            requesterId,
        };

  return ReservaTransporte.findAll({
    where,

    include: [
      {
        model: Usuario,

        attributes: [
          "id",
          "nombre",
          "email",
        ],
      },

      {
        model: Chofer,

        attributes: [
          "id",
          "nombre",
          "licencia",
          "activo",
        ],

        required: false,
      },

      {
        model: Vehiculo,

        attributes: [
          "id",
          "tipo",
          "capacidad",
          "placa",
        ],

        required: false,
      },
    ],

    order: [
      ["fecha_hora", "ASC"],
    ],
  });
};

export const getById = async (
  id: number,
  requesterId: number,
  requesterRole: Role
) => {
  const reserva =
    await ReservaTransporte.findByPk(
      id,
      {
        include: [
          {
            model:
              Usuario,

            attributes: [
              "id",
              "nombre",
              "email",
            ],
          },

          {
            model:
              Chofer,

            attributes: [
              "id",
              "nombre",
              "licencia",
              "activo",
            ],

            required: false,
          },

          {
            model:
              Vehiculo,

            attributes: [
              "id",
              "tipo",
              "capacidad",
              "placa",
            ],

            required: false,
          },
        ],
      }
    );

  if (!reserva) {
    throw new AppError(
      404,
      "TRANSPORT_RESERVATION_NOT_FOUND",
      "La reserva de transporte solicitada no existe"
    );
  }

  if (
    requesterRole !==
      ROLES.ADMIN &&
    reserva.usuario_id !==
      requesterId
  ) {
    throw new AppError(
      403,
      "INSUFFICIENT_PERMISSIONS",
      "No tiene permisos para consultar esta reserva"
    );
  }

  return reserva;
};

export const create = async (
  usuarioId: number,
  data: ReservaTransporteData
) => {
  const reservaId =
    await sequelize.transaction(
      async (
        transaction: any
      ) => {
        validateFutureDate(
          data.fecha_hora
        );

        validateRoute(
          data.origen,
          data.destino
        );

        const assignment =
          await assignResources(
            data.numero_pasajeros,
            data.fecha_hora,
            transaction
          );

        const reserva =
          await ReservaTransporte.create(
            {
              usuario_id:
                usuarioId,

              chofer_id:
                assignment
                  ?.chofer_id ??
                null,

              vehiculo_id:
                assignment
                  ?.vehiculo_id ??
                null,

              origen:
                data.origen,

              destino:
                data.destino,

              fecha_hora:
                getDate(
                  data.fecha_hora
                ),

              numero_pasajeros:
                data.numero_pasajeros,

              estado:
                assignment
                  ? "confirmada"
                  : "pendiente",
            },
            {
              transaction,
            }
          );

        return reserva.id;
      }
    );

  return getById(
    reservaId,
    usuarioId,
    ROLES.ADMIN
  );
};

export const update = async (
  id: number,
  data:
    Partial<ReservaTransporteData>,
  requesterId: number,
  requesterRole: Role
) => {
  await sequelize.transaction(
    async (
      transaction: any
    ) => {
      const reserva =
        await ReservaTransporte.findByPk(
          id,
          {
            transaction,

            lock:
              transaction.LOCK.UPDATE,
          }
        );

      if (!reserva) {
        throw new AppError(
          404,
          "TRANSPORT_RESERVATION_NOT_FOUND",
          "La reserva de transporte solicitada no existe"
        );
      }

      if (
        requesterRole !==
          ROLES.ADMIN &&
        reserva.usuario_id !==
          requesterId
      ) {
        throw new AppError(
          403,
          "INSUFFICIENT_PERMISSIONS",
          "No tiene permisos para modificar esta reserva"
        );
      }

      if (
        reserva.estado !==
        "pendiente"
      ) {
        throw new AppError(
          409,
          "TRANSPORT_RESERVATION_NOT_EDITABLE",
          "Solo las reservas pendientes pueden modificarse"
        );
      }

      const candidate = {
        origen:
          data.origen ??
          reserva.origen,

        destino:
          data.destino ??
          reserva.destino,

        fecha_hora:
          data.fecha_hora ??
          reserva.fecha_hora,

        numero_pasajeros:
          data.numero_pasajeros ??
          reserva.numero_pasajeros,
      };

      validateFutureDate(
        candidate.fecha_hora
      );

      validateRoute(
        candidate.origen,
        candidate.destino
      );

      const assignment =
        await assignResources(
          candidate.numero_pasajeros,
          candidate.fecha_hora,
          transaction,
          id
        );

      await reserva.update(
        {
          ...candidate,

          fecha_hora:
            getDate(
              candidate.fecha_hora
            ),

          chofer_id:
            assignment
              ?.chofer_id ??
            null,

          vehiculo_id:
            assignment
              ?.vehiculo_id ??
            null,

          estado:
            assignment
              ? "confirmada"
              : "pendiente",
        },
        {
          transaction,
        }
      );
    }
  );

  return getById(
    id,
    requesterId,
    requesterRole
  );
};

export const retryAssignment =
  async (
    id: number
  ) => {
    await sequelize.transaction(
      async (
        transaction: any
      ) => {
        const reserva =
          await ReservaTransporte.findByPk(
            id,
            {
              transaction,

              lock:
                transaction.LOCK.UPDATE,
            }
          );

        if (!reserva) {
          throw new AppError(
            404,
            "TRANSPORT_RESERVATION_NOT_FOUND",
            "La reserva de transporte solicitada no existe"
          );
        }

        if (
          reserva.estado !==
          "pendiente"
        ) {
          throw new AppError(
            409,
            "TRANSPORT_RESERVATION_NOT_PENDING",
            "Solo las reservas pendientes pueden intentar asignarse nuevamente"
          );
        }

        validateFutureDate(
          reserva.fecha_hora
        );

        const assignment =
          await assignResources(
            reserva.numero_pasajeros,
            reserva.fecha_hora,
            transaction,
            id
          );

        if (!assignment) {
          throw new AppError(
            409,
            "TRANSPORT_RESOURCES_UNAVAILABLE",
            "Todavía no hay un chofer y vehículo disponibles para este traslado"
          );
        }

        await reserva.update(
          {
            ...assignment,
            estado:
              "confirmada",
          },
          {
            transaction,
          }
        );
      }
    );

    return getById(
      id,
      0,
      ROLES.ADMIN
    );
  };

export const cancel = async (
  id: number,
  requesterId: number,
  requesterRole: Role
) => {
  const reserva =
    await ReservaTransporte.findByPk(
      id
    );

  if (!reserva) {
    throw new AppError(
      404,
      "TRANSPORT_RESERVATION_NOT_FOUND",
      "La reserva de transporte solicitada no existe"
    );
  }

  if (
    requesterRole !==
      ROLES.ADMIN &&
    reserva.usuario_id !==
      requesterId
  ) {
    throw new AppError(
      403,
      "INSUFFICIENT_PERMISSIONS",
      "No tiene permisos para cancelar esta reserva"
    );
  }

  if (
    reserva.estado ===
    "cancelada"
  ) {
    throw new AppError(
      409,
      "TRANSPORT_RESERVATION_ALREADY_CANCELLED",
      "La reserva de transporte ya se encuentra cancelada"
    );
  }

  await reserva.update({
    estado: "cancelada",
  });

  return getById(
    id,
    requesterId,
    requesterRole
  );
};