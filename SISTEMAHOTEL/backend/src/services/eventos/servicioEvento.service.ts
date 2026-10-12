import { AppError } from "../../utils/AppError";

const db = require("../../models");

const {
  ServicioEvento,
  ReservaEventoServicio,
} = db;

interface CreateServicioEventoData {
  nombre: string;
  precio: number;
}

interface UpdateServicioEventoData {
  nombre?: string;
  precio?: number;
}

export const getAll = async () => {
  const servicios = await ServicioEvento.findAll({
    order: [["nombre", "ASC"]],
  });

  return servicios;
};

export const getById = async (
  id: number
) => {
  const servicio = await ServicioEvento.findByPk(id);

  if (!servicio) {
    throw new AppError(
      404,
      "EVENT_SERVICE_NOT_FOUND",
      "El servicio de evento solicitado no existe"
    );
  }

  return servicio;
};

export const create = async (
  data: CreateServicioEventoData
) => {
  const servicio = await ServicioEvento.create({
    nombre: data.nombre,
    precio: data.precio,
  });

  return servicio;
};

export const update = async (
  id: number,
  data: UpdateServicioEventoData
) => {
  const servicio = await getById(id);

  await servicio.update(data);

  return servicio;
};

export const remove = async (
  id: number
) => {
  const servicio = await getById(id);

  // Evitamos destruir información histórica.
  const usos = await ReservaEventoServicio.count({
    where: {
      servicio_evento_id: id,
    },
  });

  if (usos > 0) {
    throw new AppError(
      409,
      "EVENT_SERVICE_IN_USE",
      "El servicio no puede eliminarse porque está asociado a una o más reservas de eventos"
    );
  }

  await servicio.destroy();
};

