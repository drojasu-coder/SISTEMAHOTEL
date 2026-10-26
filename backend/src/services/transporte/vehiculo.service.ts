import { Op } from "sequelize";

import { AppError }
  from "../../utils/AppError";

const db = require("../../models");

const {
  sequelize,
  Vehiculo,
  ReservaTransporte,
} = db;

interface CreateVehiculoData {
  tipo:
    | "shuttle"
    | "van"
    | "sedan";

  capacidad: number;

  placa?: string | null;
}

interface UpdateVehiculoData {
  tipo?:
    | "shuttle"
    | "van"
    | "sedan";

  capacidad?: number;

  placa?: string | null;
}

export const getAll = async () => {
  return Vehiculo.findAll({
    order: [
      ["tipo", "ASC"],
      ["id", "ASC"],
    ],
  });
};

export const getById = async (
  id: number
) => {
  const vehiculo =
    await Vehiculo.findByPk(id);

  if (!vehiculo) {
    throw new AppError(
      404,
      "VEHICLE_NOT_FOUND",
      "El vehículo solicitado no existe"
    );
  }

  return vehiculo;
};

export const create = async (
  data: CreateVehiculoData
) => {
  return Vehiculo.create({
    tipo:
      data.tipo,

    capacidad:
      data.capacidad,

    placa:
      data.placa ?? null,
  });
};

export const update = async (
  id: number,
  data: UpdateVehiculoData
) => {
  return sequelize.transaction(
    async (transaction: any) => {
      const vehiculo =
        await Vehiculo.findByPk(id, {
          transaction,
          lock:
            transaction.LOCK.UPDATE,
        });

      if (!vehiculo) {
        throw new AppError(
          404,
          "VEHICLE_NOT_FOUND",
          "El vehículo solicitado no existe"
        );
      }

      if (
        typeof data.capacidad ===
          "number" &&
        data.capacidad <
          vehiculo.capacidad
      ) {
        const conflictingReservation =
          await ReservaTransporte.findOne({
            attributes: [
              "id",
              "numero_pasajeros",
            ],
            where: {
              vehiculo_id: id,
              estado:
                "confirmada",
              fecha_hora: {
                [Op.gt]:
                  new Date(),
              },
              numero_pasajeros: {
                [Op.gt]:
                  data.capacidad,
              },
            },
            transaction,
          });

        if (conflictingReservation) {
          throw new AppError(
            409,
            "VEHICLE_CAPACITY_CONFLICT",
            "No se puede reducir la capacidad del vehículo porque tiene reservas futuras confirmadas que superan la nueva capacidad"
          );
        }
      }

      await vehiculo.update(data, {
        transaction,
      });

      return vehiculo;
    }
  );
};

export const remove = async (
  id: number
) => {
  const vehiculo =
    await Vehiculo.findByPk(id);

  if (!vehiculo) {
    throw new AppError(
      404,
      "VEHICLE_NOT_FOUND",
      "El vehículo solicitado no existe"
    );
  }

  const reservas =
    await ReservaTransporte.count({
      where: {
        vehiculo_id: id,
      },
    });

  if (reservas > 0) {
    throw new AppError(
      409,
      "VEHICLE_HAS_RESERVATIONS",
      "El vehículo no puede eliminarse porque tiene reservas de transporte asociadas"
    );
  }

  await vehiculo.destroy();
};
