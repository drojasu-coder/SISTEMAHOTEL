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
  ReservaEvento,
  Salon,
  Sucursal,
  Usuario,
} = db;

interface ReservaEventoData {
  salon_id: number;
  tipo_evento: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  numero_invitados: number;
}

const blockingStates = [
  "cotizacion",
  "confirmada",
];

const roundMoney = (
  value: number
) =>
  Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;

const validateEventDate = (
  fecha: string
) => {
  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const eventDate = new Date(
    `${fecha}T00:00:00`
  );

  if (eventDate < today) {
    throw new AppError(
      422,
      "EVENT_DATE_IN_PAST",
      "La fecha del evento no puede estar en el pasado"
    );
  }
};

const validateTimeRange = (
  horaInicio: string,
  horaFin: string
) => {
  if (horaInicio >= horaFin) {
    throw new AppError(
      422,
      "INVALID_EVENT_TIME_RANGE",
      "La hora de finalización debe ser posterior a la hora de inicio"
    );
  }
};

const getSalonForReservation =
  async (
    salonId: number,
    transaction: any
  ) => {
    const salon =
      await Salon.findByPk(
        salonId,
        {
          transaction,
          lock:
            transaction.LOCK.UPDATE,
        }
      );

    if (!salon) {
      throw new AppError(
        404,
        "EVENT_ROOM_NOT_FOUND",
        "El salón solicitado no existe"
      );
    }

    const sucursal =
      await Sucursal.findByPk(
        salon.sucursal_id,
        { transaction }
      );

    if (!sucursal) {
      throw new AppError(
        404,
        "BRANCH_NOT_FOUND",
        "La sucursal asociada al salón no existe"
      );
    }

    if (!sucursal.activa) {
      throw new AppError(
        422,
        "BRANCH_INACTIVE",
        "No se pueden realizar reservas en una sucursal inactiva"
      );
    }

    return salon;
  };

const validateAvailability = async (
  salonId: number,
  fecha: string,
  horaInicio: string,
  horaFin: string,
  transaction: any,
  excludeReservationId?: number
) => {
  const where: any = {
    salon_id: salonId,

    fecha,

    estado: {
      [Op.in]:
        blockingStates,
    },

    hora_inicio: {
      [Op.lt]: horaFin,
    },

    hora_fin: {
      [Op.gt]: horaInicio,
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

  const conflict =
    await ReservaEvento.findOne({
      where,
      transaction,
    });

  if (conflict) {
    throw new AppError(
      409,
      "EVENT_ROOM_NOT_AVAILABLE",
      "El salón ya se encuentra reservado en el horario solicitado"
    );
  }
};

const validateCapacity = (
  salon: any,
  numeroInvitados: number
) => {
  if (
    numeroInvitados >
    salon.capacidad_maxima
  ) {
    throw new AppError(
      422,
      "EVENT_CAPACITY_EXCEEDED",
      `El salón admite un máximo de ${salon.capacidad_maxima} invitados`
    );
  }
};

const calculateAmounts = (
  salon: any
) => {
  const total = roundMoney(
    Number(salon.tarifa_base)
  );

  const anticipo =
    roundMoney(
      total *
        (
          env.EVENT_DEPOSIT_PERCENTAGE /
          100
        )
    );

  return {
    total,
    anticipo,
  };
};

export const getAll = async (
  requesterId: number,
  requesterRole: Role
) => {
  const where =
    requesterRole === ROLES.ADMIN
      ? {}
      : {
          usuario_id:
            requesterId,
        };

  return ReservaEvento.findAll({
    where,

    include: [
      {
        model: Salon,
        attributes: [
          "id",
          "nombre",
          "capacidad_maxima",
          "tarifa_base",
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
    ],

    order: [
      ["fecha", "ASC"],
      ["hora_inicio", "ASC"],
    ],
  });
};

export const getById = async (
  id: number,
  requesterId: number,
  requesterRole: Role
) => {
  const reserva =
    await ReservaEvento.findByPk(
      id,
      {
        include: [
          {
            model: Salon,
            attributes: [
              "id",
              "nombre",
              "capacidad_maxima",
              "tarifa_base",
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
        ],
      }
    );

  if (!reserva) {
    throw new AppError(
      404,
      "EVENT_RESERVATION_NOT_FOUND",
      "La reserva de evento solicitada no existe"
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
  data: ReservaEventoData
) => {
  return sequelize.transaction(
    async (transaction: any) => {
      validateEventDate(
        data.fecha
      );

      validateTimeRange(
        data.hora_inicio,
        data.hora_fin
      );

      const salon =
        await getSalonForReservation(
          data.salon_id,
          transaction
        );

      validateCapacity(
        salon,
        data.numero_invitados
      );

      await validateAvailability(
        data.salon_id,
        data.fecha,
        data.hora_inicio,
        data.hora_fin,
        transaction
      );

      const {
        total,
        anticipo,
      } =
        calculateAmounts(
          salon
        );

      return ReservaEvento.create(
        {
          usuario_id:
            usuarioId,

          salon_id:
            data.salon_id,

          tipo_evento:
            data.tipo_evento,

          fecha:
            data.fecha,

          hora_inicio:
            data.hora_inicio,

          hora_fin:
            data.hora_fin,

          numero_invitados:
            data.numero_invitados,

          estado:
            "cotizacion",

          total,

          anticipo,
        },
        {
          transaction,
        }
      );
    }
  );
};

export const update = async (
  id: number,
  data:
    Partial<ReservaEventoData>,
  requesterId: number,
  requesterRole: Role
) => {
  return sequelize.transaction(
    async (transaction: any) => {
      const reserva =
        await ReservaEvento.findByPk(
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
          "EVENT_RESERVATION_NOT_FOUND",
          "La reserva de evento solicitada no existe"
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
        "cotizacion"
      ) {
        throw new AppError(
          409,
          "EVENT_RESERVATION_NOT_EDITABLE",
          "Solo las reservas en estado de cotización pueden modificarse"
        );
      }

      const candidate = {
        salon_id:
          data.salon_id ??
          reserva.salon_id,

        tipo_evento:
          data.tipo_evento ??
          reserva.tipo_evento,

        fecha:
          data.fecha ??
          reserva.fecha,

        hora_inicio:
          data.hora_inicio ??
          reserva.hora_inicio,

        hora_fin:
          data.hora_fin ??
          reserva.hora_fin,

        numero_invitados:
          data.numero_invitados ??
          reserva.numero_invitados,
      };

      validateEventDate(
        candidate.fecha
      );

      validateTimeRange(
        candidate.hora_inicio,
        candidate.hora_fin
      );

      const salon =
        await getSalonForReservation(
          candidate.salon_id,
          transaction
        );

      validateCapacity(
        salon,
        candidate.numero_invitados
      );

      await validateAvailability(
        candidate.salon_id,
        candidate.fecha,
        candidate.hora_inicio,
        candidate.hora_fin,
        transaction,
        id
      );

      const {
        total,
        anticipo,
      } =
        calculateAmounts(
          salon
        );

      await reserva.update(
        {
          ...candidate,
          total,
          anticipo,
        },
        {
          transaction,
        }
      );

      return reserva;
    }
  );
};

export const cancel = async (
  id: number,
  requesterId: number,
  requesterRole: Role
) => {
  const reserva =
    await ReservaEvento.findByPk(
      id
    );

  if (!reserva) {
    throw new AppError(
      404,
      "EVENT_RESERVATION_NOT_FOUND",
      "La reserva de evento solicitada no existe"
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
      "EVENT_RESERVATION_ALREADY_CANCELLED",
      "La reserva ya se encuentra cancelada"
    );
  }

  if (
    reserva.estado ===
    "expirada"
  ) {
    throw new AppError(
      409,
      "EVENT_RESERVATION_EXPIRED",
      "Una reserva expirada no puede cancelarse"
    );
  }

  await reserva.update({
    estado: "cancelada",
  });

  return reserva;
};