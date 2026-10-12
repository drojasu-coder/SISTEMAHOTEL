import { AppError } from "../../utils/AppError";
const db = require("../../models");

const { RecursoActividad, Sucursal, ReservaActividad } = db;

interface CreateRecursoData {
  sucursal_id: number;
  tipo: string;
  nombre: string;
}

interface UpdateRecursoData {
  tipo?: string;
  nombre?: string;
}

export const getAll = async () => {
  const recursos = await RecursoActividad.findAll({
    include: [{ model: Sucursal, attributes: ['nombre'] }],
    order: [["tipo", "ASC"], ["nombre", "ASC"]],
  });
  return recursos;
};

export const getById = async (id: number) => {
  const recurso = await RecursoActividad.findByPk(id);
  if (!recurso) {
    throw new AppError(404, "ACTIVITY_RESOURCE_NOT_FOUND", "El recurso de actividad no existe");
  }
  return recurso;
};

export const create = async (data: CreateRecursoData) => {
  const sucursal = await Sucursal.findByPk(data.sucursal_id);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal indicada no existe");
  }

  return await RecursoActividad.create(data);
};

export const update = async (id: number, data: UpdateRecursoData) => {
  const recurso = await getById(id);
  await recurso.update(data);
  return recurso;
};

export const remove = async (id: number) => {
  const recurso = await getById(id);

  const usos = await ReservaActividad.count({ where: { recurso_id: id } });
  if (usos > 0) {
    throw new AppError(409, "RESOURCE_IN_USE", "El recurso no puede eliminarse porque tiene reservas asociadas");
  }

  await recurso.destroy();
};