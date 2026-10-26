import { AppError } from "../../utils/AppError";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";

const db = require("../../models");

const { Amenidad, Sucursal, ReservaAmenidad } = db;

interface CreateAmenidadData {
  sucursal_id: number;
  nombre: string;
  aforo_maximo: number;
  imagen_key?: string | null;
}

interface UpdateAmenidadData {
  nombre?: string;
  aforo_maximo?: number;
  imagen_key?: string | null;
}

export async function serializeAmenidad(amenidad: any): Promise<any> {
  if (!amenidad) return null;
  const plain = typeof amenidad.get === "function" ? amenidad.get({ plain: true }) : { ...amenidad };
  const mediaResult = await s3Service.resolveMediaUrlWithExpiry(plain.imagen_key);
  plain.imagen_url = mediaResult.url;
  plain.imagen_expires_at = mediaResult.expiresAt;
  plain.imagen_creditos = getAssetCredits(plain.imagen_key);
  return plain;
}

export const getAll = async () => {
  const amenidades = await Amenidad.findAll({
    include: [{ model: Sucursal, attributes: ['id', 'nombre'] }],
    order: [["nombre", "ASC"]],
  });
  return Promise.all(amenidades.map(serializeAmenidad));
};

export const getById = async (id: number) => {
  const amenidad = await Amenidad.findByPk(id, {
    include: [{ model: Sucursal, attributes: ['id', 'nombre'] }],
  });
  if (!amenidad) {
    throw new AppError(404, "AMENITY_NOT_FOUND", "La amenidad solicitada no existe");
  }
  return serializeAmenidad(amenidad);
};

export const create = async (data: CreateAmenidadData) => {
  const sucursal = await Sucursal.findByPk(data.sucursal_id);
  if (!sucursal) {
    throw new AppError(404, "BRANCH_NOT_FOUND", "La sucursal indicada no existe");
  }

  const amenidad = await Amenidad.create(data);
  return serializeAmenidad(amenidad);
};

export const update = async (id: number, data: UpdateAmenidadData) => {
  const amenidad = await Amenidad.findByPk(id);
  if (!amenidad) {
    throw new AppError(404, "AMENITY_NOT_FOUND", "La amenidad solicitada no existe");
  }
  await amenidad.update(data);
  return serializeAmenidad(amenidad);
};

export const remove = async (id: number) => {
  const amenidad = await Amenidad.findByPk(id);
  if (!amenidad) {
    throw new AppError(404, "AMENITY_NOT_FOUND", "La amenidad solicitada no existe");
  }

  const usos = await ReservaAmenidad.count({ where: { amenidad_id: id } });
  if (usos > 0) {
    throw new AppError(409, "AMENITY_IN_USE", "La amenidad no puede eliminarse porque tiene reservas asociadas");
  }

  await amenidad.destroy();
};
