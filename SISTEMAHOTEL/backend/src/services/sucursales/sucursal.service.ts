import { AppError } from "../../utils/AppError";
const db = require("../../models");

const { Sucursal, Habitacion } = db;

// 1. Interfaces para tipado estricto
interface CreateSucursalData {
  nombre: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
}

interface UpdateSucursalData {
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  activa?: boolean;
}

// 2. Funciones exportadas individualmente
export const getAll = async () => {
  const sucursales = await Sucursal.findAll({
    order: [["nombre", "ASC"]],
  });
  return sucursales;
};

export const getById = async (id: number) => {
  const sucursal = await Sucursal.findByPk(id);

  if (!sucursal) {
    throw new AppError(
      404,
      "BRANCH_NOT_FOUND",
      "La sucursal solicitada no existe"
    );
  }

  return sucursal;
};

export const create = async (data: CreateSucursalData) => {
  const sucursal = await Sucursal.create({
    nombre: data.nombre,
    direccion: data.direccion,
    ciudad: data.ciudad,
    telefono: data.telefono,
  });

  return sucursal;
};

export const update = async (id: number, data: UpdateSucursalData) => {
  const sucursal = await getById(id);
  
  await sucursal.update(data);
  
  return sucursal;
};

export const remove = async (id: number) => {
  const sucursal = await getById(id);

  // Evitamos destruir información histórica validando si tiene habitaciones
  const usos = await Habitacion.count({
    where: { sucursal_id: id },
  });

  if (usos > 0) {
    throw new AppError(
      409,
      "BRANCH_IN_USE",
      "La sucursal no puede eliminarse porque tiene habitaciones asociadas"
    );
  }

  await sucursal.destroy();
};