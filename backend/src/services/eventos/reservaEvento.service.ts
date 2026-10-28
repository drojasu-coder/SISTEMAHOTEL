import { Op } from "sequelize";
import { assertSedeAccess, getSedeScope, sedeWhere } from "../../utils/sedeScope";

import { AppError }
  from "../../utils/AppError";

import {
  ROLES,
  Role,
} from "../../constants/roles";

import { calculateReservationAmounts }
  from "./reservaEventoServicio.service";

import {
  assertEventReservationCanBeMutated,
  eventFinancialExposure,
} from "../pago.service";

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

const isValidCalendarDate = (
  value: string
) => {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }

  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  return (
    date.getUTCFullYear() ===
      year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() ===
      day
  );
};

const validateEventDate = (
  fecha: string
) => {
  /**
   * Defensa en profundidad:
   * aunque el validator HTTP ya debe rechazar
   * fechas inexistentes, el service también
   * protege su contrato para usos internos.
   */
  if (
    !isValidCalendarDate(
      fecha
    )
  ) {
    throw new AppError(
      400,
      "INVALID_EVENT_DATE",
      "La fecha del evento no corresponde a un día calendario válido"
    );
  }

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

export const getAll = async (
  requesterId: number,
  requesterRole: Role,
  extraWhere: Record<string | symbol, unknown> = {}
) => {
  let where: Record<string | symbol, unknown> =
    requesterRole === ROLES.ADMIN
      ? {}
      : {
          usuario_id:
            requesterId,
        };

  if (requesterRole === ROLES.GERENTE_HABITACIONES) {
    const scope = await getSedeScope({ id: requesterId, rol: requesterRole });
    const halls = await Salon.findAll({ where: sedeWhere(scope), attributes: ["id"], raw: true });
    where = { [Op.and]: [{ salon_id: { [Op.in]: halls.map((hall: { id: number }) => hall.id) } }, extraWhere] };
  }

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
          "sucursal_id",
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
  requesterRole: Role,
  transaction?: any
) => {
  const reserva =
    await ReservaEvento.findByPk(
      id,
      {
        transaction,
        include: [
          {
            model: Salon,
            attributes: [
              "id",
              "nombre",
              "capacidad_maxima",
              "tarifa_base",
          "sucursal_id",
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

  if (requesterRole === ROLES.GERENTE_HABITACIONES) {
    const hall = await Salon.findByPk(reserva.salon_id, { transaction });
    assertSedeAccess(await getSedeScope({ id: requesterId, rol: requesterRole }), hall?.sucursal_id);
  }
  if (
    requesterRole !== ROLES.GERENTE_HABITACIONES && requesterRole !==
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
        await calculateReservationAmounts(
          salon,
          transaction
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

      await assertEventReservationCanBeMutated(
        id,
        transaction,
        "La reserva de evento tiene un pago en procesamiento o confirmable y no puede modificarse"
      );

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
        total: proposedTotal,
        anticipo: proposedAnticipo,
      } =
        await calculateReservationAmounts(
          salon,
          transaction,
          reserva.id
        );

      const changesFinancialObligation =
        Math.round(
          Number(reserva.total) *
            100
        ) !==
        Math.round(
          proposedTotal * 100
        );

      if (changesFinancialObligation) {
        const exposure =
          await eventFinancialExposure(
            reserva.id,
            transaction
          );

        if (exposure.processing > 0) {
          throw new AppError(
            409,
            "RESERVATION_HAS_PROCESSING_PAYMENT",
            "La reserva tiene un pago en procesamiento y no puede modificarse económicamente"
          );
        }

        if (
          exposure.approved >
          proposedTotal
        ) {
          throw new AppError(
            409,
            "PAYMENT_EXCEEDS_NEW_TOTAL",
            "Los pagos existentes exceden el nuevo total de la reserva"
          );
        }
      }

      await reserva.update(
        {
          ...candidate,
          total:
            proposedTotal,
          anticipo:
            proposedAnticipo,
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
  /**
   * La cancelación debe ser atómica.
   *
   * Sin un bloqueo, varias solicitudes concurrentes
   * pueden leer el mismo estado antes de que alguna
   * persista "cancelada", provocando múltiples 200.
   *
   * SELECT ... FOR UPDATE serializa todas las
   * operaciones sobre la misma ReservaEvento.
   */
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
          "No tiene permisos para cancelar esta reserva"
        );
      }

      /**
       * Las validaciones se ejecutan DESPUÉS
       * de obtener el lock.
       *
       * Así, cuando una segunda petición continúa,
       * ya observa el estado que dejó la primera.
       */
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

      const exposure =
        await eventFinancialExposure(
          reserva.id,
          transaction
        );

      if (exposure.processing > 0) {
        throw new AppError(
          409,
          "RESERVATION_HAS_PROCESSING_PAYMENT",
          "La reserva tiene un pago en procesamiento y no puede cancelarse"
        );
      }

      await assertEventReservationCanBeMutated(
        id,
        transaction,
        "La reserva de evento tiene un pago en procesamiento o confirmable y no puede cancelarse"
      );

      await reserva.update(
        {
          estado:
            "cancelada",
        },
        {
          transaction,
        }
      );

      return reserva;
    }
  );
};

export const updateStatus = async (
  id: number,
  data: { estado: string },
  requesterId: number,
  requesterRole: Role
) => {
  return sequelize.transaction(async (transaction: any) => {
    const reserva = await ReservaEvento.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!reserva) {
      throw new AppError(
        404,
        "EVENT_RESERVATION_NOT_FOUND",
        "La reserva de evento solicitada no existe"
      );
    }

    if (requesterRole === ROLES.GERENTE_HABITACIONES) {
      const hall = await Salon.findByPk(reserva.salon_id, { transaction });
      assertSedeAccess(await getSedeScope({ id: requesterId, rol: requesterRole }), hall?.sucursal_id);
    } else if (requesterRole !== ROLES.ADMIN) {
      throw new AppError(
        403,
        "INSUFFICIENT_PERMISSIONS",
        "Solo los administradores pueden cambiar el estado de la reserva"
      );
    }

    const { estado } = data;
    const currentState = reserva.estado;

    if (currentState === estado) {
      return getById(id, requesterId, requesterRole, transaction);
    }

    if (currentState === "cancelada" || currentState === "expirada") {
      throw new AppError(
        409,
        "EVENT_RESERVATION_FINAL_STATE",
        `Una reserva en estado '${currentState}' no puede cambiar de estado`
      );
    }

    if (estado === "cancelada") {
      await assertEventReservationCanBeMutated(
        id,
        transaction,
        "La reserva de evento tiene un pago en procesamiento o confirmable y no puede cancelarse"
      );
    }

    if (estado === "confirmada") {
      await getSalonForReservation(reserva.salon_id, transaction);
      await validateAvailability(
        reserva.salon_id,
        reserva.fecha,
        reserva.hora_inicio,
        reserva.hora_fin,
        transaction,
        id
      );
    }

    await reserva.update({ estado }, { transaction });
    return getById(id, requesterId, requesterRole, transaction);
  });
};
