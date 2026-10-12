import { AppError } from "../../utils/AppError";

const db = require("../../models");

const {
  Salon,
  Sucursal,
  ReservaEvento,
} = db;

interface CreateSalonData {
  sucursal_id: number;
  nombre: string;
  capacidad_maxima: number;
  tarifa_base: number;
  descripcion?: string | null;
}

interface UpdateSalonData {
  sucursal_id?: number;
  nombre?: string;
  capacidad_maxima?: number;
  tarifa_base?: number;
  descripcion?: string | null;
}

const validateSucursal = async (
  sucursalId: number
) => {
  const sucursal = await Sucursal.findByPk(
    sucursalId
  );

  if (!sucursal) {
    throw new AppError(
      404,
      "BRANCH_NOT_FOUND",
      "La sucursal indicada no existe"
    );
  }

  if (!sucursal.activa) {
    throw new AppError(
      422,
      "BRANCH_INACTIVE",
      "No se puede asignar el salón a una sucursal inactiva"
    );
  }

  return sucursal;
};

export const getAll = async () => {
  return Salon.findAll({
    include: [
      {
        model: Sucursal,
        attributes: [
          "id",
          "nombre",
          "ciudad",
          "activa",
        ],
      },
    ],
    order: [["nombre", "ASC"]],
  });
};

export const getById = async (
  id: number
) => {
  const salon = await Salon.findByPk(id, {
    include: [
      {
        model: Sucursal,
        attributes: [
          "id",
          "nombre",
          "ciudad",
          "activa",
        ],
      },
    ],
  });

  if (!salon) {
    throw new AppError(
      404,
      "EVENT_ROOM_NOT_FOUND",
      "El salón solicitado no existe"
    );
  }

  return salon;
};

export const create = async (
  data: CreateSalonData
) => {
  await validateSucursal(
    data.sucursal_id
  );

  return Salon.create({
    sucursal_id: data.sucursal_id,
    nombre: data.nombre,
    capacidad_maxima:
      data.capacidad_maxima,
    tarifa_base: data.tarifa_base,
    descripcion:
      data.descripcion ?? null,
  });
};

export const update = async (
  id: number,
  data: UpdateSalonData
) => {
  const salon = await Salon.findByPk(id);

  if (!salon) {
    throw new AppError(
      404,
      "EVENT_ROOM_NOT_FOUND",
      "El salón solicitado no existe"
    );
  }

  if (
    data.sucursal_id !== undefined
  ) {
    await validateSucursal(
      data.sucursal_id
    );
  }

  await salon.update(data);

  return getById(id);
};

export const remove = async (
  id: number
) => {
  const salon = await Salon.findByPk(id);

  if (!salon) {
    throw new AppError(
      404,
      "EVENT_ROOM_NOT_FOUND",
      "El salón solicitado no existe"
    );
  }

  const reservas = await ReservaEvento.count({
    where: {
      salon_id: id,
    },
  });

  if (reservas > 0) {
    throw new AppError(
      409,
      "EVENT_ROOM_IN_USE",
      "El salón no puede eliminarse porque tiene reservas asociadas"
    );
  }

  await salon.destroy();
};