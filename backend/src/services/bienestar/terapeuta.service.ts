import { AppError } from "../../utils/AppError";
const db = require("../../models");

const { Terapeuta, CitaSpa } = db;

export const getAll = async () => {
  return await Terapeuta.findAll({ order: [["nombre", "ASC"]] });
};

export const getById = async (id: number) => {
  const terapeuta = await Terapeuta.findByPk(id);
  if (!terapeuta) {
    throw new AppError(404, "THERAPIST_NOT_FOUND", "El terapeuta solicitado no existe");
  }
  return terapeuta;
};

export const create = async (data: any) => {
  return await Terapeuta.create({
    nombre: data.nombre,
    especialidad: data.especialidad,
    activo: data.activo !== undefined ? data.activo : true,
  });
};

export const update = async (id: number, data: any) => {
  const terapeuta = await getById(id);
  await terapeuta.update(data);
  return terapeuta;
};

export const remove = async (id: number) => {
  const terapeuta = await getById(id);
  const usos = await CitaSpa.count({ where: { terapeuta_id: id } });
  if (usos > 0) {
    throw new AppError(409, "THERAPIST_IN_USE", "El terapeuta tiene citas asignadas y no puede eliminarse");
  }
  await terapeuta.destroy();
};