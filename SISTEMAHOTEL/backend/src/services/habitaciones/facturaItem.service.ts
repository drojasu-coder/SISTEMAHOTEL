import { AppError } from "../../utils/AppError";
import { recalcularTotales } from "./factura.service";

const db = require("../../models");
const { Factura, FacturaItem } = db;

interface CreateFacturaItemData {
  factura_id: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
}

type UpdateFacturaItemData = Partial<CreateFacturaItemData>;

const facturaNotFound = () =>
  new AppError(404, "FACTURA_NOT_FOUND", "La factura no fue encontrada");

const validateFactura = async (facturaId: number) => {
  const factura = await Factura.findByPk(facturaId);
  if (!factura) {
    throw facturaNotFound();
  }
};

const calculateSubtotal = (cantidad: number, precioUnitario: number) =>
  Math.round(cantidad * precioUnitario * 100) / 100;

const getFacturaItemByIdOrFail = async (id: number) => {
  const facturaItem = await FacturaItem.findByPk(id);
  if (!facturaItem) {
    throw new AppError(
      404,
      "FACTURA_ITEM_NOT_FOUND",
      "El item de factura no fue encontrado"
    );
  }
  return facturaItem;
};

export const getAllFacturaItems = async () =>
  FacturaItem.findAll({ order: [["id", "ASC"]] });

export const getFacturaItemById = (id: number) => getFacturaItemByIdOrFail(id);

export const createFacturaItem = async (data: CreateFacturaItemData) => {
  await validateFactura(data.factura_id);
  const subtotal = calculateSubtotal(data.cantidad, data.precio_unitario);
  const facturaItem = await FacturaItem.create({
    factura_id: data.factura_id,
    descripcion: data.descripcion,
    cantidad: data.cantidad,
    precio_unitario: data.precio_unitario,
    subtotal,
  });
  await recalcularTotales(data.factura_id);
  return facturaItem;
};

export const updateFacturaItem = async (
  id: number,
  data: UpdateFacturaItemData
) => {
  const facturaItem = await getFacturaItemByIdOrFail(id);
  const oldFacturaId = Number(facturaItem.factura_id);
  const newFacturaId = data.factura_id ?? oldFacturaId;

  if (data.factura_id !== undefined) {
    await validateFactura(data.factura_id);
  }

  const cantidad = data.cantidad ?? Number(facturaItem.cantidad);
  const precioUnitario =
    data.precio_unitario ?? Number(facturaItem.precio_unitario);
  await facturaItem.update({
    ...data,
    subtotal: calculateSubtotal(cantidad, precioUnitario),
  });

  await recalcularTotales(oldFacturaId);
  if (newFacturaId !== oldFacturaId) {
    await recalcularTotales(newFacturaId);
  }
  return facturaItem;
};

export const deleteFacturaItem = async (id: number) => {
  const facturaItem = await getFacturaItemByIdOrFail(id);
  const facturaId = Number(facturaItem.factura_id);
  await facturaItem.destroy();
  await recalcularTotales(facturaId);
  return facturaItem;
};
