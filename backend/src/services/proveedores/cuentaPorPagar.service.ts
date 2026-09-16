import { AppError } from "../../utils/AppError";

const db = require("../../models");

const { Proveedor, CuentaPorPagar } = db;

interface CreateCuentaPorPagarData {
  proveedor_id: number;
  monto: number;
  fecha_vencimiento: string;
  estado?: "pendiente" | "pagado" | "vencido";
  factura_referencia?: string | null;
}

type UpdateCuentaPorPagarData = Partial<CreateCuentaPorPagarData>;

const validateProveedor = async (proveedorId: number) => {
  const proveedor = await Proveedor.findByPk(proveedorId);
  if (!proveedor) {
    throw new AppError(
      404,
      "PROVEEDOR_NOT_FOUND",
      "El proveedor no fue encontrado",
    );
  }
};

export const getAllCuentasPorPagar = async () =>
  CuentaPorPagar.findAll({ order: [["id", "ASC"]] });

export const getCuentaPorPagarById = async (id: number) => {
  const cuentaPorPagar = await CuentaPorPagar.findByPk(id);
  if (!cuentaPorPagar) {
    throw new AppError(
      404,
      "CUENTA_POR_PAGAR_NOT_FOUND",
      "La cuenta por pagar no fue encontrada",
    );
  }
  return cuentaPorPagar;
};

export const createCuentaPorPagar = async (data: CreateCuentaPorPagarData) => {
  await validateProveedor(data.proveedor_id);
  return CuentaPorPagar.create(data);
};

export const updateCuentaPorPagar = async (
  id: number,
  data: UpdateCuentaPorPagarData,
) => {
  const cuentaPorPagar = await getCuentaPorPagarById(id);
  if (data.proveedor_id !== undefined) {
    await validateProveedor(data.proveedor_id);
  }
  await cuentaPorPagar.update(data);
  return cuentaPorPagar;
};

export const deleteCuentaPorPagar = async (id: number) => {
  const cuentaPorPagar = await getCuentaPorPagarById(id);
  await cuentaPorPagar.destroy();
  return cuentaPorPagar;
};
