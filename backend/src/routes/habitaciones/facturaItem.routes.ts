import { Router } from "express";
import { ROLES } from "../../constants/roles";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";
import * as facturaItemController from "../../controllers/habitaciones/facturaItem.controller";
import {
  createFacturaItemSchema,
  facturaItemIdSchema,
  updateFacturaItemSchema,
} from "../../validators/habitaciones/facturaItem.validator";

const router = Router();
const rolesGestionFacturas = [
  ROLES.ADMIN,
  ROLES.RECEPCIONISTA,
  ROLES.GERENTE_HABITACIONES,
];

/**
 * @openapi
 * /api/factura-items:
 *   get:
 *     tags: [Items de Factura]
 *     summary: Listar items de factura
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Items de factura obtenidos correctamente }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get("/", authMiddleware, facturaItemController.getAllFacturaItems);

/**
 * @openapi
 * /api/factura-items/{id}:
 *   get:
 *     tags: [Items de Factura]
 *     summary: Obtener un item de factura por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Item de factura obtenido correctamente }
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Item de factura no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get(
  "/:id",
  authMiddleware,
  validateParams(facturaItemIdSchema),
  facturaItemController.getFacturaItemById
);

/**
 * @openapi
 * /api/factura-items:
 *   post:
 *     tags: [Items de Factura]
 *     summary: Crear un item de factura
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [factura_id, descripcion, cantidad, precio_unitario]
 *             properties:
 *               factura_id: { type: integer, minimum: 1 }
 *               descripcion: { type: string, maxLength: 255 }
 *               cantidad: { type: integer, minimum: 1 }
 *               precio_unitario: { type: number, minimum: 0 }
 *     responses:
 *       201: { description: Item de factura creado correctamente }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Factura no encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  "/",
  authMiddleware,
  requireRole(...rolesGestionFacturas),
  validateBody(createFacturaItemSchema),
  facturaItemController.createFacturaItem
);

/**
 * @openapi
 * /api/factura-items/{id}:
 *   patch:
 *     tags: [Items de Factura]
 *     summary: Actualizar un item de factura
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
 *             properties:
 *               factura_id: { type: integer, minimum: 1 }
 *               descripcion: { type: string, maxLength: 255 }
 *               cantidad: { type: integer, minimum: 1 }
 *               precio_unitario: { type: number, minimum: 0 }
 *     responses:
 *       200: { description: Item de factura actualizado correctamente }
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Item o factura no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionFacturas),
  validateParams(facturaItemIdSchema),
  validateBody(updateFacturaItemSchema),
  facturaItemController.updateFacturaItem
);

/**
 * @openapi
 * /api/factura-items/{id}:
 *   delete:
 *     tags: [Items de Factura]
 *     summary: Eliminar un item de factura
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Item de factura eliminado correctamente }
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Item de factura no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionFacturas),
  validateParams(facturaItemIdSchema),
  facturaItemController.deleteFacturaItem
);

export default router;
