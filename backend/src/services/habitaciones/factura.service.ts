import { AppError } from "../../utils/AppError";
import { getIvaValue } from "../configuracion.service";
import { ROLES, Role } from "../../constants/roles";
import { splitInclusivePrice } from "./inclusivePrices";

const db = require("../../models");
const { Factura, FacturaItem, Usuario } = db;

interface CreateFacturaData {
  usuario_id: number;
  nit: string;
  nombre_fiscal: string;
  direccion_fiscal?: string | null;
  subtotal: number;
  precios_incluyen_impuestos?: boolean;
  fecha_emision?: string;
}

type UpdateFacturaData = Partial<CreateFacturaData> & {
  estado?: "pendiente" | "pagada" | "anulada";
};

interface RequestingUser {
  id: number;
  rol: Role;
}

const validateUsuario = async (usuarioId: number) => {
  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario) {
    throw new AppError(404, "USUARIO_NOT_FOUND", "El usuario no fue encontrado");
  }
};

const calculateTotals = (subtotal: number, porcentajeIva: number) => {
  const iva = Math.round(subtotal * (porcentajeIva / 100) * 100) / 100;
  const total = Math.round((subtotal + iva) * 100) / 100;
  return { subtotal, iva, total, porcentaje_iva: porcentajeIva };
};

const getFacturaByIdOrFail = async (id: number, transaction?: any) => {
  const factura = await Factura.findByPk(id, { transaction });
  if (!factura) {
    throw new AppError(404, "FACTURA_NOT_FOUND", "La factura no fue encontrada");
  }
  return factura;
};

export const getAllFacturas = async (requestingUser: RequestingUser) =>
  Factura.findAll({
    where:
      requestingUser.rol !== ROLES.ADMIN
        ? { usuario_id: requestingUser.id }
        : undefined,
    order: [["id", "ASC"]],
  });

export const getFacturaById = async (
  id: number,
  requestingUser: RequestingUser
) => {
  const factura = await Factura.findOne({
    where: {
      id,
      ...(requestingUser.rol !== ROLES.ADMIN
        ? { usuario_id: requestingUser.id }
        : {}),
    },
  });
  if (!factura) {
    throw new AppError(404, "FACTURA_NOT_FOUND", "La factura no fue encontrada");
  }
  return factura;
};

export const createFactura = async (data: CreateFacturaData) => {
  await validateUsuario(data.usuario_id);
  const porcentajeIva = await getIvaValue();
  return Factura.create({
    usuario_id: data.usuario_id,
    nit: data.nit,
    nombre_fiscal: data.nombre_fiscal,
    direccion_fiscal: data.direccion_fiscal,
    fecha_emision: data.fecha_emision,
    ...calculateTotals(data.subtotal, porcentajeIva),
    precios_incluyen_impuestos: data.precios_incluyen_impuestos ?? false,
    porcentaje_inguat: data.precios_incluyen_impuestos ? 10 : 0,
    inguat: 0,
    estado: "pendiente",
  });
};

export const updateFactura = async (id: number, data: UpdateFacturaData) => {
  const factura = await getFacturaByIdOrFail(id);
  if (factura.precios_incluyen_impuestos && data.subtotal !== undefined) {
    throw new AppError(422, "INVOICE_TOTAL_DERIVED", "El importe de esta factura se calcula a partir de sus conceptos");
  }
  if (data.usuario_id !== undefined) {
    await validateUsuario(data.usuario_id);
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.subtotal !== undefined) {
    Object.assign(
      updateData,
      calculateTotals(data.subtotal, Number(factura.porcentaje_iva))
    );
  }
  delete updateData.iva;
  delete updateData.total;
  delete updateData.porcentaje_iva;

  await factura.update(updateData);
  return factura;
};

export const deleteFactura = async (id: number) => {
  const factura = await getFacturaByIdOrFail(id);
  const facturaItem = await FacturaItem.findOne({ where: { factura_id: id } });
  if (facturaItem) {
    throw new AppError(
      409,
      "FACTURA_CON_ITEMS",
      "No se puede eliminar la factura porque tiene items asociados"
    );
  }

  await factura.destroy();
  return factura;
};

export const recalcularTotales = async (facturaId: number, transaction?: any) => {
  const factura = await getFacturaByIdOrFail(facturaId, transaction);
  const facturaItems = await FacturaItem.findAll({
    where: { factura_id: facturaId },
    transaction,
  });
  if (factura.precios_incluyen_impuestos) {
    const cents = { subtotal: 0, iva: 0, inguat: 0, total: 0 };
    for (const item of facturaItems) {
      const split = splitInclusivePrice(Number(item.subtotal), Number(factura.porcentaje_iva), item.tipo_concepto === "hospedaje" ? Number(factura.porcentaje_inguat) : 0);
      for (const key of Object.keys(cents) as Array<keyof typeof cents>) cents[key] += Math.round(split[key] * 100);
    }
    await factura.update(Object.fromEntries(Object.entries(cents).map(([key, value]) => [key, value / 100])), { transaction });
    return factura;
  }
  const subtotal = facturaItems.reduce(
    (sum: number, item: any) => sum + Number(item.subtotal),
    0
  );

  await factura.update(
    calculateTotals(
      Math.round(subtotal * 100) / 100,
      Number(factura.porcentaje_iva)
    ),
    { transaction }
  );
  return factura;
};
