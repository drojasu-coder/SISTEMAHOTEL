import { AppError } from "../../utils/AppError";

const db = require("../../models");
const { Parqueo, Sucursal, ReservaParqueo } = db;

interface CreateParqueoData {
  sucursal_id: number;
  numero: string;
  estado?: "disponible" | "ocupado" | "mantenimiento";
}

interface UpdateParqueoData {
  sucursal_id?: number;
  numero?: string;
  estado?: "disponible" | "ocupado" | "mantenimiento";
}

export const getAllParqueos = async () =>
  await Parqueo.findAll({ order: [["id", "ASC"]] });

export const getParqueoById = async (id: number) => {
  const parqueo = await Parqueo.findByPk(id);
  if (!parqueo) {
    throw new AppError(404, "PARQUEO_NOT_FOUND", "El parqueo no fue encontrado");
  }
  return parqueo;
};

const validateSucursal = async (sucursalId: number) => {
  const sucursal = await Sucursal.findByPk(sucursalId);
  if (!sucursal) {
    throw new AppError(404, "SUCURSAL_NOT_FOUND", "La sucursal no fue encontrada");
  }
};

const validateDuplicate = async (
  sucursalId: number,
  numero: string,
  id?: number
) => {
  const parqueoExistente = await Parqueo.findOne({
    where: { sucursal_id: sucursalId, numero },
  });
  if (parqueoExistente && parqueoExistente.id !== id) {
    throw new AppError(
      409,
      "PARQUEO_NUMBER_ALREADY_EXISTS",
      "Ya existe un parqueo con ese número en la sucursal"
    );
  }
};

export const createParqueo = async (data: CreateParqueoData) => {
  await validateSucursal(data.sucursal_id);
  await validateDuplicate(data.sucursal_id, data.numero);
  return await Parqueo.create(data);
};

export const updateParqueo = async (id: number, data: UpdateParqueoData) => {
  const parqueo = await Parqueo.findByPk(id);
  if (!parqueo) {
    throw new AppError(404, "PARQUEO_NOT_FOUND", "El parqueo no fue encontrado");
  }

  if (data.sucursal_id !== undefined) {
    await validateSucursal(data.sucursal_id);
  }
  if (data.sucursal_id !== undefined || data.numero !== undefined) {
    await validateDuplicate(
      data.sucursal_id ?? parqueo.sucursal_id,
      data.numero ?? parqueo.numero,
      id
    );
  }

  await parqueo.update(data);
  return parqueo;
};

export const deleteParqueo = async (id: number) => {
  const parqueo = await Parqueo.findByPk(id);
  if (!parqueo) {
    throw new AppError(404, "PARQUEO_NOT_FOUND", "El parqueo no fue encontrado");
  }

  const reservaParqueo = await ReservaParqueo.findOne({
    where: { parqueo_id: id },
  });
  if (reservaParqueo) {
    throw new AppError(
      409,
      "PARQUEO_CON_RESERVAS",
      "No se puede eliminar el parqueo porque tiene reservas asociadas"
    );
  }

  await parqueo.destroy();
  return parqueo;
};
