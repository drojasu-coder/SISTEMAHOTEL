import { AppError } from "../../utils/AppError";
const db = require("../../models");

const { ServicioSpa, CitaSpa } = db;

export const getAll = async () => {
  return await ServicioSpa.findAll({ order: [["nombre", "ASC"]] });
};

export const getById = async (id: number) => {
  const servicio = await ServicioSpa.findByPk(id);
  if (!servicio) {
    throw new AppError(404, "SPA_SERVICE_NOT_FOUND", "El servicio de spa solicitado no existe");
  }
  return servicio;
};

export const create = async (data: any) => {
  return await ServicioSpa.create(data);
};

export const update = async (id: number, data: any) => {
  const servicio = await getById(id);
  await servicio.update(data);
  return servicio;
};

export const remove = async (id: number) => {
  const servicio = await getById(id);
  const usos = await CitaSpa.count({ where: { servicio_spa_id: id } });
  if (usos > 0) {
    throw new AppError(409, "SPA_SERVICE_IN_USE", "El servicio está asociado a citas existentes y no puede eliminarse");
  }
  await servicio.destroy();
};