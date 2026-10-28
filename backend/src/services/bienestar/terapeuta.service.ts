import { AppError } from "../../utils/AppError";
import { assertSucursalExists } from "./servicioSpa.service";
const db = require("../../models");

const {
  Terapeuta,
  CitaBienestar,
  Sucursal,
} = db;

const sucursalInclude = { model: Sucursal, attributes: ["id", "nombre"] };

export const getAll = async (filters: { sucursalId?: number } = {}, scopeWhere: Record<string | symbol, unknown> = {}) => {
  return await Terapeuta.findAll({
    where: { ...scopeWhere, ...(filters.sucursalId !== undefined ? { sucursal_id: filters.sucursalId } : {}) },
    include: [sucursalInclude],
    order: [["nombre", "ASC"]],
  });
};

export const getById = async (id: number) => {
  const terapeuta = await Terapeuta.findByPk(id, { include: [sucursalInclude] });
  if (!terapeuta) {
    throw new AppError(404, "THERAPIST_NOT_FOUND", "El terapeuta solicitado no existe");
  }
  return terapeuta;
};

export const create = async (
  data: any
) => {
  await assertSucursalExists(data.sucursal_id);
  const terapeuta = await Terapeuta.create({
    nombre: data.nombre,
    activo:
      data.activo !== undefined
        ? data.activo
        : true,
    sucursal_id: data.sucursal_id ?? null,
  });
  return getById(terapeuta.id);
};

export const update = async (id: number, data: any) => {
  const terapeuta = await getById(id);
  await assertSucursalExists(data.sucursal_id);
  await terapeuta.update(data);
  return getById(id);
};

export const remove = async (
  id: number
) => {
  const terapeuta =
    await getById(id);

  const usos =
    await CitaBienestar.count({
      where: {
        terapeuta_id: id,
      },
    });

  if (usos > 0) {
    throw new AppError(
      409,
      "THERAPIST_IN_USE",
      "El terapeuta tiene citas asociadas y no puede eliminarse"
    );
  }

  await terapeuta.destroy();
};