import { AppError } from "../../utils/AppError";
const db = require("../../models");

const { Amenidad, Sucursal, ReservaAmenidad } = db;

interface CreateAmenidadData {
  sucursal_id: number;
  nombre: string;
  aforo_maximo: number;
}

interface UpdateAmenidadData {
  nombre?: string;
  aforo_maximo?: number;
}

export const getAll = async () => {
  return await Amenidad.findAll({
    include: [{ model: Sucursal, attributes: ['nombre'] }],
    order: [["nombre", "ASC"]],
  });
};

export const getById = async (id: number) => {
  const amenidad = await Amenidad.findByPk(id);
  if (!amenidad) {
    throw new AppError(404, "AMENITY_NOT_FOUND", "La amenidad solicitada no existe");
  }
  return amenidad;
};

export const create = async (data: CreateAmenidadData) => {
  const sucursal = await Sucursal.findByPk(data.sucursal_id);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal indicada no existe");
  }

  return await Amenidad.create(data);
};

export const update = async (id: number, data: UpdateAmenidadData) => {
  const amenidad = await getById(id);
  await amenidad.update(data);
  return amenidad;
};

export const remove = async (id: number) => {
  const amenidad = await getById(id);

  const usos = await ReservaAmenidad.count({ where: { amenidad_id: id } });
  if (usos > 0) {
    throw new AppError(409, "AMENITY_IN_USE", "La amenidad no puede eliminarse porque tiene reservas asociadas");
  }

  await amenidad.destroy();
};