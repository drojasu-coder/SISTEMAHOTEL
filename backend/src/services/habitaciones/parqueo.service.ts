import { AppError } from "../../utils/AppError";
import { SedeScope, assertSedeAccess, sedeWhere } from "../../utils/sedeScope";

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

/** Las operaciones reciben el alcance por sede del solicitante (ver utils/sedeScope). */
const GLOBAL_SCOPE: SedeScope = { global: true };

export const getAllParqueos = async (scope: SedeScope = GLOBAL_SCOPE, sucursalId?: number) =>
  await Parqueo.findAll({ where: sedeWhere(scope, sucursalId), order: [["id", "ASC"]] });

const findParqueo = async (id: number, scope: SedeScope) => {
  const parqueo = await Parqueo.findByPk(id);
  if (!parqueo) {
    throw new AppError(404, "PARQUEO_NOT_FOUND", "El parqueo no fue encontrado");
  }
  assertSedeAccess(scope, parqueo.sucursal_id);
  return parqueo;
};

export const getParqueoById = async (id: number, scope: SedeScope = GLOBAL_SCOPE) =>
  findParqueo(id, scope);

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

export const createParqueo = async (data: CreateParqueoData, scope: SedeScope = GLOBAL_SCOPE) => {
  assertSedeAccess(scope, data.sucursal_id);
  await validateSucursal(data.sucursal_id);
  await validateDuplicate(data.sucursal_id, data.numero);
  return await Parqueo.create(data);
};

export const updateParqueo = async (id: number, data: UpdateParqueoData, scope: SedeScope = GLOBAL_SCOPE) => {
  // Sede actual y sede de destino deben estar autorizadas.
  const parqueo = await findParqueo(id, scope);

  if (data.sucursal_id !== undefined) {
    assertSedeAccess(scope, data.sucursal_id);
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

export const deleteParqueo = async (id: number, scope: SedeScope = GLOBAL_SCOPE) => {
  const parqueo = await findParqueo(id, scope);

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
