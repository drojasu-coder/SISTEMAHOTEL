import { AppError } from "../../utils/AppError";

const db = require("../../models");

const { Proveedor, ProveedorProducto, CuentaPorPagar } = db;

interface CreateProveedorData {
  nombre: string;
  nit?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
}

type UpdateProveedorData = Partial<CreateProveedorData>;

export const getAllProveedores = async () =>
  Proveedor.findAll({ order: [["id", "ASC"]] });

export const getProveedorById = async (id: number) => {
  const proveedor = await Proveedor.findByPk(id);
  if (!proveedor) {
    throw new AppError(404, "PROVEEDOR_NOT_FOUND", "El proveedor no fue encontrado");
  }
  return proveedor;
};

export const createProveedor = async (data: CreateProveedorData) =>
  Proveedor.create(data);

export const updateProveedor = async (
  id: number,
  data: UpdateProveedorData
) => {
  const proveedor = await getProveedorById(id);
  await proveedor.update(data);
  return proveedor;
};

export const deleteProveedor = async (id: number) => {
  const proveedor = await getProveedorById(id);
  const producto = await ProveedorProducto.findOne({
    where: { proveedor_id: id },
  });
  const cuentaPorPagar = await CuentaPorPagar.findOne({
    where: { proveedor_id: id },
  });

  if (producto || cuentaPorPagar) {
    throw new AppError(
      409,
      "PROVEEDOR_EN_USO",
      "No se puede eliminar el proveedor porque tiene productos o cuentas por pagar asociadas"
    );
  }

  await proveedor.destroy();
  return proveedor;
};
