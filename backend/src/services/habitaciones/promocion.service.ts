import { AppError } from "../../utils/AppError";

const db = require("../../models");
const { Promocion, CarritoItem } = db;

interface CreatePromocionData {
  nombre: string;
  tipo_descuento: "porcentaje" | "monto_fijo";
  valor_descuento: number;
  aplica_a?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  activa?: boolean;
}

type UpdatePromocionData = Partial<CreatePromocionData>;

const validateDates = (fechaInicio: string, fechaFin: string) => {
  if (fechaFin <= fechaInicio) {
    throw new AppError(422, "FECHAS_INVALIDAS", "La fecha de fin debe ser posterior a la fecha de inicio");
  }
};

const validateDiscount = (tipoDescuento: string, valorDescuento: number) => {
  if (tipoDescuento === "porcentaje" && valorDescuento > 100) {
    throw new AppError(422, "VALOR_DESCUENTO_INVALIDO", "El porcentaje no puede superar 100");
  }
};

export const getAllPromociones = async () => Promocion.findAll({ order: [["id", "ASC"]] });

export const getPromocionById = async (id: number) => {
  const promocion = await Promocion.findByPk(id);
  if (!promocion) throw new AppError(404, "PROMOCION_NOT_FOUND", "La promoción no fue encontrada");
  return promocion;
};

export const createPromocion = async (data: CreatePromocionData) => {
  validateDates(data.fecha_inicio, data.fecha_fin);
  validateDiscount(data.tipo_descuento, data.valor_descuento);
  return Promocion.create(data);
};

export const updatePromocion = async (id: number, data: UpdatePromocionData) => {
  const promocion = await getPromocionById(id);
  const fechaInicio = data.fecha_inicio ?? promocion.fecha_inicio;
  const fechaFin = data.fecha_fin ?? promocion.fecha_fin;
  validateDates(fechaInicio, fechaFin);
  validateDiscount(data.tipo_descuento ?? promocion.tipo_descuento, data.valor_descuento ?? promocion.valor_descuento);
  await promocion.update(data);
  return promocion;
};

export const deletePromocion = async (id: number) => {
  const promocion = await getPromocionById(id);
  const carritoItem = await CarritoItem.findOne({ where: { promocion_id: id } });
  if (carritoItem) {
    throw new AppError(409, "PROMOCION_EN_USO", "No se puede eliminar la promoción porque está siendo usada en un carrito");
  }
  await promocion.destroy();
  return promocion;
};
