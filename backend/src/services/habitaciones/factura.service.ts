import { AppError } from "../../utils/AppError";
import { getIvaValue } from "../configuracion.service";
import { ROLES, Role } from "../../constants/roles";

const db = require("../../models");
const { Factura, FacturaItem, Usuario } = db;

interface CreateFacturaData {
  usuario_id: number;
  nit: string;
  nombre_fiscal: string;
  direccion_fiscal?: string | null;
  subtotal: number;
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

const getFacturaByIdOrFail = async (id: number) => {
  const factura = await Factura.findByPk(id);
  if (!factura) {
    throw new AppError(404, "FACTURA_NOT_FOUND", "La factura no fue encontrada");
  }
  return factura;
};

export const getAllFacturas = async (requestingUser: RequestingUser) =>
  Factura.findAll({
    where:
      requestingUser.rol === ROLES.CLIENTE
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
      ...(requestingUser.rol === ROLES.CLIENTE
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
    estado: "pendiente",
  });
};

export const updateFactura = async (id: number, data: UpdateFacturaData) => {
  const factura = await getFacturaByIdOrFail(id);
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

export const recalcularTotales = async (facturaId: number) => {
  const factura = await getFacturaByIdOrFail(facturaId);
  const facturaItems = await FacturaItem.findAll({
    where: { factura_id: facturaId },
  });
  const subtotal = facturaItems.reduce(
    (sum: number, item: any) => sum + Number(item.subtotal),
    0
  );

  await factura.update(
    calculateTotals(
      Math.round(subtotal * 100) / 100,
      Number(factura.porcentaje_iva)
    )
  );
  return factura;
};
