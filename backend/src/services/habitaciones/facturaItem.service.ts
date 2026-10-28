import { AppError } from "../../utils/AppError";
import { recalcularTotales } from "./factura.service";
import { ROLES, Role } from "../../constants/roles";

const db = require("../../models");
const { sequelize, Factura, FacturaItem } = db;

interface CreateFacturaItemData {
  factura_id: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  tipo_concepto?: "servicio" | "hospedaje";
}

type UpdateFacturaItemData = Partial<CreateFacturaItemData>;

interface RequestingUser {
  id: number;
  rol: Role;
}

const facturaNotFound = () =>
  new AppError(404, "FACTURA_NOT_FOUND", "La factura no fue encontrada");

const validateFactura = async (facturaId: number, transaction?: any) => {
  const factura = await Factura.findByPk(facturaId, { transaction, ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}) });
  if (!factura) {
    throw facturaNotFound();
  }
  return factura;
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

const facturaOwnershipJoin = (requestingUser: RequestingUser) =>
  requestingUser.rol !== ROLES.ADMIN
    ? [
        {
          model: Factura,
          attributes: [],
          required: true,
          where: { usuario_id: requestingUser.id },
        },
      ]
    : undefined;

export const getAllFacturaItems = async (requestingUser: RequestingUser) =>
  FacturaItem.findAll({
    include: facturaOwnershipJoin(requestingUser),
    order: [["id", "ASC"]],
  });

export const getFacturaItemById = async (
  id: number,
  requestingUser: RequestingUser
) => {
  const facturaItem = await FacturaItem.findOne({
    where: { id },
    include: facturaOwnershipJoin(requestingUser),
  });
  if (!facturaItem) {
    throw new AppError(
      404,
      "FACTURA_ITEM_NOT_FOUND",
      "El item de factura no fue encontrado"
    );
  }
  return facturaItem;
};

export const createFacturaItem = async (data: CreateFacturaItemData) => sequelize.transaction(async (transaction: any) => {
  await validateFactura(data.factura_id, transaction);
  const subtotal = calculateSubtotal(data.cantidad, data.precio_unitario);
  const facturaItem = await FacturaItem.create({
    factura_id: data.factura_id,
    descripcion: data.descripcion,
    cantidad: data.cantidad,
    precio_unitario: data.precio_unitario,
    subtotal,
    tipo_concepto: data.tipo_concepto ?? "servicio",
  }, { transaction });
  await recalcularTotales(data.factura_id, transaction);
  return facturaItem;
});

export const updateFacturaItem = async (
  id: number,
  data: UpdateFacturaItemData
) => {
  const discovered = await getFacturaItemByIdOrFail(id);
  const oldFacturaId = Number(discovered.factura_id);
  const newFacturaId = data.factura_id ?? oldFacturaId;
  return sequelize.transaction(async (transaction: any) => {
    // Orden fijo de padres antes del concepto: evita actualizaciones perdidas
    // y deadlocks cuando dos solicitudes trasladan conceptos entre facturas.
    for (const parentId of [...new Set([oldFacturaId, newFacturaId])].sort((a, b) => a - b)) await validateFactura(parentId, transaction);
    const facturaItem = await FacturaItem.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!facturaItem || Number(facturaItem.factura_id) !== oldFacturaId) throw new AppError(409, "INVOICE_ITEM_CHANGED", "El concepto cambió; actualice la factura antes de continuar");
    const cantidad = data.cantidad ?? Number(facturaItem.cantidad);
    const precioUnitario = data.precio_unitario ?? Number(facturaItem.precio_unitario);
    await facturaItem.update({ ...data, subtotal: calculateSubtotal(cantidad, precioUnitario) }, { transaction });
    await recalcularTotales(oldFacturaId, transaction);
    if (newFacturaId !== oldFacturaId) await recalcularTotales(newFacturaId, transaction);
    return facturaItem;
  });
};

export const deleteFacturaItem = async (id: number) => {
  const discovered = await getFacturaItemByIdOrFail(id);
  const facturaId = Number(discovered.factura_id);
  return sequelize.transaction(async (transaction: any) => {
    await validateFactura(facturaId, transaction);
    const facturaItem = await FacturaItem.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!facturaItem || Number(facturaItem.factura_id) !== facturaId) throw new AppError(409, "INVOICE_ITEM_CHANGED", "El concepto cambió; actualice la factura antes de continuar");
    await facturaItem.destroy({ transaction });
    await recalcularTotales(facturaId, transaction);
    return facturaItem;
  });
};
