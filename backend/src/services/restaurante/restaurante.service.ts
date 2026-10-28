import { AppError } from "../../utils/AppError";
import { CATEGORIAS_MENU } from "../../validators/restaurante/restaurante.validator";
import * as s3Service from "../storage/s3.service";
import { getAssetCredits } from "../storage/credits";
import { SedeScope, assertSedeAccess } from "../../utils/sedeScope";

const db = require("../../models");
const { Restaurante, ProductoMenu, Mesa, Sucursal, sequelize } = db;

type CategoriaMenu = (typeof CATEGORIAS_MENU)[number];

const ordenMenu = [
  [sequelize.literal(`CASE "categoria" ${CATEGORIAS_MENU.map((c, i) => `WHEN '${c}' THEN ${i}`).join(" ")} END`), "ASC"],
  ["orden", "ASC"],
  ["nombre", "ASC"],
];

const productoAttributes = ["id", "restaurante_id", "categoria", "nombre", "descripcion", "precio", "disponible", "orden", "imagen_key"];

/** Fotografía del producto resuelta por la capa de medios (CloudFront o firma temporal). */
const serializeProducto = async (producto: any) => {
  const plain = typeof producto.get === "function" ? producto.get({ plain: true }) : { ...producto };
  const media = await s3Service.resolveMediaUrlWithExpiry(plain.imagen_key);
  plain.imagen_url = media.url;
  plain.imagen_expires_at = media.expiresAt;
  plain.imagen_creditos = getAssetCredits(plain.imagen_key);
  return plain;
};

/** Resumen de mesas: el detalle y la disponibilidad siguen en /api/mesas y /api/reservas-mesa. */
const resumenMesas = async (restauranteId: number) => {
  const mesas = await Mesa.findAll({ where: { restaurante_id: restauranteId }, attributes: ["capacidad"], raw: true });
  return {
    total: mesas.length,
    plazas: mesas.reduce((sum: number, m: any) => sum + Number(m.capacidad), 0),
  };
};

const serializeRestaurante = async (restaurante: any) => {
  const plain = restaurante.get({ plain: true });
  plain.mesas = await resumenMesas(plain.id);
  return plain;
};

const getActiveOrFail = async (id: number) => {
  const restaurante = await Restaurante.findOne({
    where: { id, activo: true },
    include: [{ model: Sucursal, attributes: ["id", "nombre", "ciudad"] }],
  });
  if (!restaurante) {
    throw new AppError(404, "RESTAURANT_NOT_FOUND", "El restaurante solicitado no existe");
  }
  return restaurante;
};

export const getAll = async (filters: { sucursalId?: number } = {}) => {
  const restaurantes = await Restaurante.findAll({
    where: { activo: true, ...(filters.sucursalId !== undefined && { sucursal_id: filters.sucursalId }) },
    include: [{ model: Sucursal, attributes: ["id", "nombre", "ciudad"] }],
    order: [["sucursal_id", "ASC"]],
  });
  return Promise.all(restaurantes.map(serializeRestaurante));
};

/** Menú público: por defecto solo productos disponibles. */
export const getMenu = async (id: number, categoria?: CategoriaMenu, incluirNoDisponibles = false) => {
  await getActiveOrFail(id);
  const productos = await ProductoMenu.findAll({
    where: { restaurante_id: id, ...(!incluirNoDisponibles && { disponible: true }), ...(categoria && { categoria }) },
    attributes: productoAttributes,
    order: ordenMenu,
  });
  return Promise.all(productos.map(serializeProducto));
};

export const getById = async (id: number) => {
  const restaurante = await getActiveOrFail(id);
  const plain = await serializeRestaurante(restaurante);
  plain.menu = await getMenu(id);
  return plain;
};

/** Vista de gestión: incluye productos no disponibles. */
// La gestión del menú se limita a las sedes del solicitante (ver utils/sedeScope).
const GLOBAL_SCOPE: SedeScope = { global: true };

export const getProductosAdmin = async (id: number, scope: SedeScope = GLOBAL_SCOPE) => {
  const restaurante = await Restaurante.findByPk(id);
  if (!restaurante) {
    throw new AppError(404, "RESTAURANT_NOT_FOUND", "El restaurante solicitado no existe");
  }
  assertSedeAccess(scope, restaurante.sucursal_id);
  const productos = await ProductoMenu.findAll({ where: { restaurante_id: id }, attributes: productoAttributes, order: ordenMenu });
  return Promise.all(productos.map(serializeProducto));
};

const assertNombreLibre = async (restauranteId: number, nombre: string, exceptId?: number) => {
  const existente = await ProductoMenu.findOne({ where: { restaurante_id: restauranteId, nombre } });
  if (existente && existente.id !== exceptId) {
    throw new AppError(409, "MENU_PRODUCT_DUPLICATED", "Ya existe un producto con ese nombre en este restaurante");
  }
};

export const createProducto = async (restauranteId: number, data: any, scope: SedeScope = GLOBAL_SCOPE) => {
  const restaurante = await Restaurante.findByPk(restauranteId);
  if (!restaurante) {
    throw new AppError(404, "RESTAURANT_NOT_FOUND", "El restaurante solicitado no existe");
  }
  await assertNombreLibre(restauranteId, data.nombre);
  assertSedeAccess(scope, restaurante.sucursal_id);
  const producto = await ProductoMenu.create({ ...data, restaurante_id: restauranteId });
  return ProductoMenu.findByPk(producto.id, { attributes: productoAttributes });
};

export const updateProducto = async (productoId: number, data: any, scope: SedeScope = GLOBAL_SCOPE) => {
  const producto = await ProductoMenu.findByPk(productoId);
  if (!producto) {
    throw new AppError(404, "MENU_PRODUCT_NOT_FOUND", "El producto solicitado no existe");
  }
  const restaurante = await Restaurante.findByPk(producto.restaurante_id, { attributes: ["id", "sucursal_id"] });
  assertSedeAccess(scope, restaurante?.sucursal_id);
  if (data.nombre !== undefined) await assertNombreLibre(producto.restaurante_id, data.nombre, producto.id);
  await producto.update(data);
  return ProductoMenu.findByPk(producto.id, { attributes: productoAttributes });
};
