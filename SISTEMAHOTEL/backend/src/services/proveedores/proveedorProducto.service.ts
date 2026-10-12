import { AppError } from "../../utils/AppError";

const db = require("../../models");

const { Proveedor, ProveedorProducto } = db;

interface CreateProveedorProductoData {
  proveedor_id: number;
  nombre_producto: string;
  descripcion?: string | null;
}

type UpdateProveedorProductoData = Partial<CreateProveedorProductoData>;

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

export const getAllProveedorProductos = async () =>
  ProveedorProducto.findAll({ order: [["id", "ASC"]] });

export const getProveedorProductoById = async (id: number) => {
  const proveedorProducto = await ProveedorProducto.findByPk(id);
  if (!proveedorProducto) {
    throw new AppError(
      404,
      "PROVEEDOR_PRODUCTO_NOT_FOUND",
      "El producto del proveedor no fue encontrado",
    );
  }
  return proveedorProducto;
};

export const createProveedorProducto = async (
  data: CreateProveedorProductoData,
) => {
  await validateProveedor(data.proveedor_id);
  return ProveedorProducto.create(data);
};

export const updateProveedorProducto = async (
  id: number,
  data: UpdateProveedorProductoData,
) => {
  const proveedorProducto = await getProveedorProductoById(id);
  if (data.proveedor_id !== undefined) {
    await validateProveedor(data.proveedor_id);
  }
  await proveedorProducto.update(data);
  return proveedorProducto;
};

export const deleteProveedorProducto = async (id: number) => {
  const proveedorProducto = await getProveedorProductoById(id);
  await proveedorProducto.destroy();
  return proveedorProducto;
};
