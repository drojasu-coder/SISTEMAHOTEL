import { AppError } from "../utils/AppError";

const db = require("../models");
const { Configuracion } = db;

const defaultPorcentajeIva = 12;

export const getCurrentIva = async () => {
  let configuracion = await Configuracion.findOne({ order: [["id", "ASC"]] });

  if (!configuracion) {
    configuracion = await Configuracion.create({
      porcentaje_iva: defaultPorcentajeIva,
    });
  }

  return configuracion;
};

export const updateIva = async (porcentajeIva: number) => {
  const configuracion = await getCurrentIva();
  await configuracion.update({ porcentaje_iva: porcentajeIva });
  return configuracion;
};

export const getIvaValue = async () => {
  const configuracion = await getCurrentIva();
  const porcentajeIva = Number(configuracion.porcentaje_iva);

  if (!Number.isFinite(porcentajeIva)) {
    throw new AppError(500, "IVA_CONFIGURATION_INVALID", "La configuración del IVA no es válida");
  }

  return porcentajeIva;
};
