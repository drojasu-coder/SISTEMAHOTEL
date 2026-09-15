import { AppError }
  from "../../utils/AppError";

const db = require("../../models");

const {
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
  const vehiculo =
    await Vehiculo.findByPk(id);

  if (!vehiculo) {
    throw new AppError(
      404,
      "VEHICLE_NOT_FOUND",
      "El vehículo solicitado no existe"
    );
  }

  await vehiculo.update(data);

  return vehiculo;
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