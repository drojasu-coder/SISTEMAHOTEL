import { Router } from "express";
import * as controller from "../../controllers/restaurante/restaurante.controller";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { idParamSchema } from "../../validators/common.validator";
import {
  createProductoMenuSchema,
  listRestaurantesQuerySchema,
  menuQuerySchema,
  productoIdParamSchema,
  updateProductoMenuSchema,
} from "../../validators/restaurante/restaurante.validator";

const router = Router();
const gestionMenu = [authMiddleware, requireRole(ROLES.ADMIN, ROLES.GERENTE_RESTAURANTE)];

/**
 * @openapi
 * /api/restaurantes:
 *   get:
 *     tags: [Restaurantes]
 *     summary: Restaurantes activos (público), con resumen de mesas
 *     parameters:
 *       - { in: query, name: sucursal_id, schema: { type: integer } }
 *     responses:
 *       200: { description: Lista de restaurantes }
 */
router.get("/", validateQuery(listRestaurantesQuerySchema), controller.getAll);

/**
 * @openapi
 * /api/restaurantes/productos/{productoId}:
 *   patch:
 *     tags: [Restaurantes]
 *     summary: Actualizar un producto del menú (admin, gerente_restaurante)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: productoId, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Producto actualizado }
 */
router.patch(
  "/productos/:productoId",
  ...gestionMenu,
  validateParams(productoIdParamSchema),
  validateBody(updateProductoMenuSchema),
  controller.updateProducto
);

/**
 * @openapi
 * /api/restaurantes/{id}:
 *   get:
 *     tags: [Restaurantes]
 *     summary: Detalle público del restaurante con su menú disponible
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Restaurante y menú }
 *       404: { description: No existe o no está activo }
 */
router.get("/:id", validateParams(idParamSchema), controller.getById);

/**
 * @openapi
 * /api/restaurantes/{id}/menu:
 *   get:
 *     tags: [Restaurantes]
 *     summary: Menú público (solo productos disponibles)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: query, name: categoria, schema: { type: string, enum: [desayuno, entrada, plato_fuerte, postre, bebida] } }
 *       - { in: query, name: incluir_no_disponibles, schema: { type: string, enum: ["true", "false"] }, description: "Incluye productos con disponible=false para mostrarlos marcados" }
 *     responses:
 *       200: { description: Productos del menú }
 */
router.get("/:id/menu", validateParams(idParamSchema), validateQuery(menuQuerySchema), controller.getMenu);

/**
 * @openapi
 * /api/restaurantes/{id}/productos:
 *   get:
 *     tags: [Restaurantes]
 *     summary: Todos los productos, incluidos los no disponibles (admin, gerente_restaurante)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Productos }
 *   post:
 *     tags: [Restaurantes]
 *     summary: Crear un producto del menú (admin, gerente_restaurante)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Producto creado }
 */
router.get("/:id/productos", ...gestionMenu, validateParams(idParamSchema), controller.getProductosAdmin);
router.post(
  "/:id/productos",
  ...gestionMenu,
  validateParams(idParamSchema),
  validateBody(createProductoMenuSchema),
  controller.createProducto
);

export default router;
