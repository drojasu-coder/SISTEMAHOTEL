import { AppError } from "../../utils/AppError";
const db = require("../../models");

const { Instructor, ReservaActividad } = db;

interface CreateInstructorData {
  nombre: string;
  especialidad?: string;
  activo?: boolean;
}

interface UpdateInstructorData {
  nombre?: string;
  especialidad?: string;
  activo?: boolean;
}

export const getAll = async () => {
  return await Instructor.findAll({ order: [["nombre", "ASC"]] });
};

export const getById = async (id: number) => {
  const instructor = await Instructor.findByPk(id);
  if (!instructor) {
    throw new AppError(404, "INSTRUCTOR_NOT_FOUND", "El instructor solicitado no existe");
  }
  return instructor;
};

export const create = async (data: CreateInstructorData) => {
  return await Instructor.create({
    nombre: data.nombre,
    especialidad: data.especialidad,
    activo: data.activo !== undefined ? data.activo : true,
  });
};

export const update = async (id: number, data: UpdateInstructorData) => {
  const instructor = await getById(id);
  await instructor.update(data);
  return instructor;
};

export const remove = async (id: number) => {
  const instructor = await getById(id);

  const usos = await ReservaActividad.count({ where: { instructor_id: id } });
  if (usos > 0) {
    throw new AppError(409, "INSTRUCTOR_IN_USE", "El instructor tiene citas y no puede eliminarse");
  }

  await instructor.destroy();
};