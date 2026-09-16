import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";
import { ROLES } from "../../constants/roles";
import * as proveedorProductoController from "../../controllers/proveedores/proveedorProducto.controller";
import {
  createProveedorProductoSchema,
  updateProveedorProductoSchema,
  proveedorProductoIdSchema,
} from "../../validators/proveedores/proveedorProducto.validator";

const router = Router();
const rolesGestionProveedores = [ROLES.ADMIN, ROLES.GERENTE_RESTAURANTE];

/**
 * @openapi
 * /api/proveedor-productos:
 *   get:
 *     tags: [Productos de Proveedor]
 *     summary: Listar productos de proveedores
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Productos de proveedores obtenidos correctamente }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get(
  "/",
  authMiddleware,
  proveedorProductoController.getAllProveedorProductos,
);

/**
 * @openapi
 * /api/proveedor-productos/{id}:
 *   get:
 *     tags: [Productos de Proveedor]
 *     summary: Obtener un producto de proveedor por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Producto del proveedor obtenido correctamente }
 *       400:
 *         description: ID inválido
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       404:
 *         description: Producto del proveedor no encontrado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get(
  "/:id",
  authMiddleware,
  validateParams(proveedorProductoIdSchema),
  proveedorProductoController.getProveedorProductoById,
);

/**
 * @openapi
 * /api/proveedor-productos:
 *   post:
 *     tags: [Productos de Proveedor]
 *     summary: Crear un producto de proveedor
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proveedor_id, nombre_producto]
 *             additionalProperties: false
 *             properties:
 *               proveedor_id: { type: integer, minimum: 1 }
 *               nombre_producto: { type: string, minLength: 1, maxLength: 150 }
 *               descripcion: { type: string, nullable: true }
 *     responses:
 *       201: { description: Producto del proveedor creado correctamente }
 *       400:
 *         description: Datos inválidos
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       403:
 *         description: Usuario sin permisos
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       404:
 *         description: Proveedor no encontrado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.post(
  "/",
  authMiddleware,
  requireRole(...rolesGestionProveedores),
  validateBody(createProveedorProductoSchema),
  proveedorProductoController.createProveedorProducto,
);

/**
 * @openapi
 * /api/proveedor-productos/{id}:
 *   patch:
 *     tags: [Productos de Proveedor]
 *     summary: Actualizar un producto de proveedor
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               proveedor_id: { type: integer, minimum: 1 }
 *               nombre_producto: { type: string, minLength: 1, maxLength: 150 }
 *               descripcion: { type: string, nullable: true }
 *     responses:
 *       200: { description: Producto del proveedor actualizado correctamente }
 *       400:
 *         description: Datos inválidos
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       403:
 *         description: Usuario sin permisos
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       404:
 *         description: Producto o proveedor no encontrado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionProveedores),
  validateParams(proveedorProductoIdSchema),
  validateBody(updateProveedorProductoSchema),
  proveedorProductoController.updateProveedorProducto,
);

/**
 * @openapi
 * /api/proveedor-productos/{id}:
 *   delete:
 *     tags: [Productos de Proveedor]
 *     summary: Eliminar un producto de proveedor
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Producto del proveedor eliminado correctamente }
 *       400:
 *         description: ID inválido
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       403:
 *         description: Usuario sin permisos
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       404:
 *         description: Producto del proveedor no encontrado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionProveedores),
  validateParams(proveedorProductoIdSchema),
  proveedorProductoController.deleteProveedorProducto,
);

export default router;
