import { Op } from "sequelize";

import { AppError }
  from "../../utils/AppError";

const db = require("../../models");

const {
  sequelize,
  Chofer,
  ReservaTransporte,
} = db;

interface CreateChoferData {
  nombre: string;
  licencia?: string | null;
}

interface UpdateChoferData {
  nombre?: string;
  licencia?: string | null;
}

export const getAll = async () => {
  return Chofer.findAll({
    order: [["nombre", "ASC"]],
  });
};

export const getById = async (
  id: number
) => {
  const chofer =
    await Chofer.findByPk(id);

  if (!chofer) {
    throw new AppError(
      404,
      "DRIVER_NOT_FOUND",
      "El chofer solicitado no existe"
    );
  }

  return chofer;
};

export const create = async (
  data: CreateChoferData
) => {
  return Chofer.create({
    nombre: data.nombre,
    licencia:
      data.licencia ?? null,
    activo: true,
  });
};

export const update = async (
  id: number,
  data: UpdateChoferData
) => {
  const chofer =
    await Chofer.findByPk(id);

  if (!chofer) {
    throw new AppError(
      404,
      "DRIVER_NOT_FOUND",
      "El chofer solicitado no existe"
    );
  }

  await chofer.update(data);

  return chofer;
};

export const updateStatus = async (
  id: number,
  activo: boolean
) => {
  return sequelize.transaction(
    async (transaction: any) => {
      const chofer =
        await Chofer.findByPk(id, {
          transaction,
          lock:
            transaction.LOCK.UPDATE,
        });

      if (!chofer) {
        throw new AppError(
          404,
          "DRIVER_NOT_FOUND",
          "El chofer solicitado no existe"
        );
      }

      if (
        chofer.activo &&
        activo === false
      ) {
        const futureReservation =
          await ReservaTransporte.findOne({
            attributes: ["id"],
            where: {
              chofer_id: id,
              estado: "confirmada",
              fecha_hora: {
                [Op.gt]: new Date(),
              },
            },
            transaction,
          });

        if (futureReservation) {
          throw new AppError(
            409,
            "DRIVER_HAS_FUTURE_RESERVATIONS",
            "El chofer tiene reservas futuras confirmadas y no puede desactivarse"
          );
        }
      }

      await chofer.update(
        {
          activo,
        },
        {
          transaction,
        }
      );

      return chofer;
    }
  );
};
