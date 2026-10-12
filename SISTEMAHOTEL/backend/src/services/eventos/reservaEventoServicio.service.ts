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
  ReservaEventoServicio,
  ServicioEvento,
  Salon,
} = db;

const roundMoney = (
  value: number
) =>
  Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;

const validateReservationAccess = async (
  reservaId: number,
  requesterId: number,
  requesterRole: Role,
  transaction?: any,
  lock = false
) => {
  const options: any = {
    transaction,
  };

  if (
    lock &&
    transaction
  ) {
    options.lock =
      transaction.LOCK.UPDATE;
  }

  const reserva =
    await ReservaEvento.findByPk(
      reservaId,
      options
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
      "No tiene permisos para acceder a esta reserva"
    );
  }

  return reserva;
};

const validateEditableReservation = (
  reserva: any
) => {
  if (
    reserva.estado !==
    "cotizacion"
  ) {
    throw new AppError(
      409,
      "EVENT_RESERVATION_NOT_EDITABLE",
      "Los servicios solo pueden modificarse mientras la reserva esté en estado de cotización"
    );
  }
};

const recalculateReservation = async (
  reserva: any,
  transaction: any
) => {
  const salon =
    await Salon.findByPk(
      reserva.salon_id,
      {
        transaction,
      }
    );

  if (!salon) {
    throw new AppError(
      404,
      "EVENT_ROOM_NOT_FOUND",
      "El salón asociado a la reserva no existe"
    );
  }

  const servicios =
    await ReservaEventoServicio.findAll({
      where: {
        reserva_evento_id:
          reserva.id,
      },

      transaction,
    });

  const serviciosTotal =
    servicios.reduce(
      (
        total: number,
        item: any
      ) =>
        total +
        Number(item.subtotal),
      0
    );

  const total = roundMoney(
    Number(
      salon.tarifa_base
    ) +
      serviciosTotal
  );

  const anticipo =
    roundMoney(
      total *
        (
          env.EVENT_DEPOSIT_PERCENTAGE /
          100
        )
    );

  await reserva.update(
    {
      total,
      anticipo,
    },
    {
      transaction,
    }
  );

  return {
    total,
    anticipo,
  };
};

export const getAll = async (
  reservaId: number,
  requesterId: number,
  requesterRole: Role
) => {
  await validateReservationAccess(
    reservaId,
    requesterId,
    requesterRole
  );

  return ReservaEventoServicio.findAll({
    where: {
      reserva_evento_id:
        reservaId,
    },

    include: [
      {
        model: ServicioEvento,
        attributes: [
          "id",
          "nombre",
          "precio",
        ],
      },
    ],

    order: [["id", "ASC"]],
  });
};

export const getById = async (
  reservaId: number,
  id: number,
  requesterId: number,
  requesterRole: Role
) => {
  await validateReservationAccess(
    reservaId,
    requesterId,
    requesterRole
  );

  const item =
    await ReservaEventoServicio.findOne({
      where: {
        id,
        reserva_evento_id:
          reservaId,
      },

      include: [
        {
          model:
            ServicioEvento,
          attributes: [
            "id",
            "nombre",
            "precio",
          ],
        },
      ],
    });

  if (!item) {
    throw new AppError(
      404,
      "EVENT_RESERVATION_SERVICE_NOT_FOUND",
      "El servicio asociado a la reserva no existe"
    );
  }

  return item;
};

export const create = async (
  reservaId: number,
  data: {
    servicio_evento_id: number;
    cantidad: number;
  },
  requesterId: number,
  requesterRole: Role
) => {
  return sequelize.transaction(
    async (transaction: any) => {
      const reserva =
        await validateReservationAccess(
          reservaId,
          requesterId,
          requesterRole,
          transaction,
          true
        );

      validateEditableReservation(
        reserva
      );

      const servicio =
        await ServicioEvento.findByPk(
          data.servicio_evento_id,
          {
            transaction,
          }
        );

      if (!servicio) {
        throw new AppError(
          404,
          "EVENT_SERVICE_NOT_FOUND",
          "El servicio de evento solicitado no existe"
        );
      }

      const existingItem =
        await ReservaEventoServicio.findOne({
          where: {
            reserva_evento_id:
              reservaId,

            servicio_evento_id:
              data.servicio_evento_id,
          },

          transaction,
        });

      if (existingItem) {
        throw new AppError(
          409,
          "EVENT_SERVICE_ALREADY_ADDED",
          "El servicio ya se encuentra agregado a esta reserva"
        );
      }

      const subtotal =
        roundMoney(
          Number(servicio.precio) *
            data.cantidad
        );

      const item =
        await ReservaEventoServicio.create(
          {
            reserva_evento_id:
              reservaId,

            servicio_evento_id:
              data.servicio_evento_id,

            cantidad:
              data.cantidad,

            subtotal,
          },
          {
            transaction,
          }
        );

      const amounts =
        await recalculateReservation(
          reserva,
          transaction
        );

      return {
        item,
        reserva: {
          total:
            amounts.total,
          anticipo:
            amounts.anticipo,
        },
      };
    }
  );
};

export const update = async (
  reservaId: number,
  id: number,
  cantidad: number,
  requesterId: number,
  requesterRole: Role
) => {
  return sequelize.transaction(
    async (transaction: any) => {
      const reserva =
        await validateReservationAccess(
          reservaId,
          requesterId,
          requesterRole,
          transaction,
          true
        );

      validateEditableReservation(
        reserva
      );

      const item =
        await ReservaEventoServicio.findOne({
          where: {
            id,
            reserva_evento_id:
              reservaId,
          },

          transaction,
        });

      if (!item) {
        throw new AppError(
          404,
          "EVENT_RESERVATION_SERVICE_NOT_FOUND",
          "El servicio asociado a la reserva no existe"
        );
      }

      /*
       * Conservamos el precio utilizado cuando
       * el servicio fue agregado originalmente.
       *
       * subtotal anterior / cantidad anterior
       * = precio unitario de la cotización.
       */
      const precioUnitario =
        Number(item.subtotal) /
        Number(item.cantidad);

      const nuevoSubtotal =
        roundMoney(
          precioUnitario *
            cantidad
        );

      await item.update(
        {
          cantidad,
          subtotal:
            nuevoSubtotal,
        },
        {
          transaction,
        }
      );

      const amounts =
        await recalculateReservation(
          reserva,
          transaction
        );

      return {
        item,
        reserva: {
          total:
            amounts.total,
          anticipo:
            amounts.anticipo,
        },
      };
    }
  );
};

export const remove = async (
  reservaId: number,
  id: number,
  requesterId: number,
  requesterRole: Role
) => {
  return sequelize.transaction(
    async (transaction: any) => {
      const reserva =
        await validateReservationAccess(
          reservaId,
          requesterId,
          requesterRole,
          transaction,
          true
        );

      validateEditableReservation(
        reserva
      );

      const item =
        await ReservaEventoServicio.findOne({
          where: {
            id,
            reserva_evento_id:
              reservaId,
          },

          transaction,
        });

      if (!item) {
        throw new AppError(
          404,
          "EVENT_RESERVATION_SERVICE_NOT_FOUND",
          "El servicio asociado a la reserva no existe"
        );
      }

      await item.destroy({
        transaction,
      });

      await recalculateReservation(
        reserva,
        transaction
      );
    }
  );
};

