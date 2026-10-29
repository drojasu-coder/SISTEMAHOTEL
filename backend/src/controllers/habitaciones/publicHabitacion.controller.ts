import {
  NextFunction,
  Request,
  Response,
} from "express";

import * as habitacionService from "../../services/habitaciones/habitacion.service";
import * as tipoHabitacionService from "../../services/habitaciones/tipoHabitacion.service";
import { AppError } from "../../utils/AppError";

/** Nombre visible: el comercial ("Deluxe King") si existe; el interno solo en tipos anteriores. */
const nombreComercial = (tipo: any) => tipo.nombre_comercial ?? tipo.nombre;

/** sucursal_id opcional del query; un valor presente debe ser un entero positivo. */
const parseSucursalId = (value: unknown): number | undefined => {
  if (value === undefined || value === "") return undefined;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new AppError(400, "VALIDATION_ERROR", "sucursal_id debe ser un entero positivo");
  }
  return id;
};

/**
 * Serializa una habitación para exposición pública.
 * No expone datos internos ni operativos: número de habitación, estado,
 * claves de imagen internas ni identificadores internos de sucursal/tipo
 * salvo aquellos necesarios para la operación de reserva (id de habitación).
 */
const serializePublicHabitacion = async (h: any): Promise<any> => {
  const plain = typeof h.get === "function" ? h.get({ plain: true }) : { ...h };

  const tipo = plain.TipoHabitacion
    ? {
        id: plain.TipoHabitacion.id,
        nombre: nombreComercial(plain.TipoHabitacion),
        sucursal_id: plain.TipoHabitacion.sucursal_id ?? null,
        descripcion: plain.TipoHabitacion.descripcion ?? null,
        capacidad_maxima: plain.TipoHabitacion.capacidad_maxima,
        tarifa_noche: Number(plain.TipoHabitacion.tarifa_noche).toFixed(2),
        imagen_url: plain.TipoHabitacion.imagen_url ?? null,
        imagen_expires_at: plain.TipoHabitacion.imagen_expires_at ?? null,
        imagen_creditos: plain.TipoHabitacion.imagen_creditos ?? null,
      }
    : null;

  const sucursal = plain.Sucursal
    ? {
        id: plain.Sucursal.id,
        nombre: plain.Sucursal.nombre,
      }
    : null;

  return {
    id: plain.id,
    tipo,
    sucursal,
    imagen_url: plain.imagen_url ?? null,
    // Vencimiento de una URL prefirmada: el portal la renueva antes de que caduque.
    imagen_expires_at: plain.imagen_expires_at ?? null,
    imagen_creditos: plain.imagen_creditos ?? null,
    ...(plain.noches !== undefined && { noches: plain.noches }),
    ...(plain.tarifa_noche !== undefined && {
      tarifa_noche: plain.tarifa_noche,
    }),
    ...(plain.total_estimado !== undefined && {
      total_estimado: plain.total_estimado,
    }),
  };
};

export const getPublicHabitaciones = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sucursalId = parseSucursalId(req.query.sucursal_id);
    // Las sedes desactivadas conservan sus habitaciones, pero no se publican.
    const todas = (await habitacionService.getAllHabitaciones())
      .filter((h: any) => h.Sucursal?.activa === true);
    const habitaciones = sucursalId === undefined
      ? todas
      : todas.filter((h: any) => h.sucursal_id === sucursalId);
    const publicData = await Promise.all(
      habitaciones.map(serializePublicHabitacion)
    );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Habitaciones obtenidas correctamente",
      data: publicData,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicHabitacionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habitacion = await habitacionService.getHabitacionById(
      Number(req.params.id)
    );
    if (habitacion.Sucursal?.activa !== true) {
      throw new AppError(404, "HABITACION_NOT_FOUND", "La habitación no fue encontrada");
    }
    const publicData = await serializePublicHabitacion(habitacion);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Habitación obtenida correctamente",
      data: publicData,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicHabitacionesDisponibles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const habitaciones = await habitacionService.getHabitacionesDisponibles(
      req.query as unknown as habitacionService.DisponibilidadHabitacionQueryData
    );
    const publicData = await Promise.all(
      habitaciones.map(serializePublicHabitacion)
    );
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Habitaciones disponibles obtenidas correctamente",
      data: publicData,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicTipoHabitaciones = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Solo categorías comerciales con sede e inventario; opcionalmente de una sede.
    const tipos = await tipoHabitacionService.getPublicCatalog(parseSucursalId(req.query.sucursal_id));
    const publicData = tipos.map((t: any) => ({
      id: t.id,
      nombre: nombreComercial(t),
      sucursal_id: t.sucursal_id,
      sucursal: t.Sucursal ? { id: t.Sucursal.id, nombre: t.Sucursal.nombre } : null,
      habitacion_referencia_id: t.habitacion_referencia_id,
      descripcion: t.descripcion ?? null,
      capacidad_maxima: t.capacidad_maxima,
      tarifa_noche: Number(t.tarifa_noche).toFixed(2),
      imagen_url: t.imagen_url ?? null,
      imagen_creditos: t.imagen_creditos ?? null,
    }));
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Tipos de habitación obtenidos correctamente",
      data: publicData,
    });
  } catch (error) {
    next(error);
  }
};
