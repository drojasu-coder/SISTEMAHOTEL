import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";
import { ROLES } from "../../constants/roles";
import * as proveedorController from "../../controllers/proveedores/proveedor.controller";
import {
  createProveedorSchema,
  updateProveedorSchema,
  proveedorIdSchema,
} from "../../validators/proveedores/proveedor.validator";

const router = Router();
const rolesGestionProveedores = [ROLES.ADMIN, ROLES.GERENTE_RESTAURANTE];

/**
 * @openapi
 * /api/proveedores:
 *   get:
 *     tags: [Proveedores]
 *     summary: Listar proveedores
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Proveedores obtenidos correctamente
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get("/", authMiddleware, proveedorController.getAllProveedores);

/**
 * @openapi
 * /api/proveedores/{id}:
 *   get:
 *     tags: [Proveedores]
 *     summary: Obtener un proveedor por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Proveedor obtenido correctamente }
 *       400:
 *         description: ID inválido
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       404:
 *         description: Proveedor no encontrado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get(
  "/:id",
  authMiddleware,
  validateParams(proveedorIdSchema),
  proveedorController.getProveedorById
);

/**
 * @openapi
 * /api/proveedores:
 *   post:
 *     tags: [Proveedores]
 *     summary: Crear un proveedor
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             additionalProperties: false
 *             properties:
 *               nombre: { type: string, minLength: 1, maxLength: 150 }
 *               nit: { type: string, maxLength: 20, nullable: true }
 *               contacto: { type: string, maxLength: 150, nullable: true }
 *               telefono: { type: string, maxLength: 20, nullable: true }
 *               email: { type: string, format: email, maxLength: 150, nullable: true }
 *     responses:
 *       201: { description: Proveedor creado correctamente }
 *       400:
 *         description: Datos inválidos
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       403:
 *         description: Usuario sin permisos
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.post(
  "/",
  authMiddleware,
  requireRole(...rolesGestionProveedores),
  validateBody(createProveedorSchema),
  proveedorController.createProveedor
);

/**
 * @openapi
 * /api/proveedores/{id}:
 *   patch:
 *     tags: [Proveedores]
 *     summary: Actualizar un proveedor
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
 *               nombre: { type: string, minLength: 1, maxLength: 150 }
 *               nit: { type: string, maxLength: 20, nullable: true }
 *               contacto: { type: string, maxLength: 150, nullable: true }
 *               telefono: { type: string, maxLength: 20, nullable: true }
 *               email: { type: string, format: email, maxLength: 150, nullable: true }
 *     responses:
 *       200: { description: Proveedor actualizado correctamente }
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
router.patch(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionProveedores),
  validateParams(proveedorIdSchema),
  validateBody(updateProveedorSchema),
  proveedorController.updateProveedor
);

/**
 * @openapi
 * /api/proveedores/{id}:
 *   delete:
 *     tags: [Proveedores]
 *     summary: Eliminar un proveedor
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Proveedor eliminado correctamente }
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
 *         description: Proveedor no encontrado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       409:
 *         description: Proveedor en uso
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionProveedores),
  validateParams(proveedorIdSchema),
  proveedorController.deleteProveedor
);

export default router;
