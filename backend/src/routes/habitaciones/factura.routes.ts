import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { ROLES } from "../../constants/roles";
import * as facturaController from "../../controllers/habitaciones/factura.controller";
import {
  createFacturaSchema,
  updateFacturaSchema,
  facturaIdSchema,
} from "../../validators/habitaciones/factura.validator";

const router = Router();
const rolesGestionFacturas = [
  ROLES.ADMIN,
  ROLES.RECEPCIONISTA,
  ROLES.GERENTE_HABITACIONES,
];

/**
 * @openapi
 * /api/facturas:
 *   get:
 *     tags: [Facturas]
 *     summary: Listar facturas
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Facturas obtenidas correctamente }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get("/", authMiddleware, facturaController.getAllFacturas);

/**
 * @openapi
 * /api/facturas/{id}:
 *   get:
 *     tags: [Facturas]
 *     summary: Obtener una factura por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Factura obtenida correctamente }
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
 *         description: Factura no encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get("/:id", authMiddleware, validateParams(facturaIdSchema), facturaController.getFacturaById);

/**
 * @openapi
 * /api/facturas:
 *   post:
 *     tags: [Facturas]
 *     summary: Crear una factura
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario_id, nit, nombre_fiscal, subtotal]
 *             properties:
 *               usuario_id: { type: integer, minimum: 1 }
 *               nit: { type: string, maxLength: 20 }
 *               nombre_fiscal: { type: string, maxLength: 150 }
 *               direccion_fiscal: { type: string, maxLength: 255, nullable: true }
 *               subtotal: { type: number, minimum: 0 }
 *               estado: { type: string, enum: [pendiente, pagada, anulada] }
 *               fecha_emision: { type: string, format: date-time }
 *     responses:
 *       201: { description: Factura creada correctamente }
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
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  "/",
  authMiddleware,
  requireRole(...rolesGestionFacturas),
  validateBody(createFacturaSchema),
  facturaController.createFactura
);

/**
 * @openapi
 * /api/facturas/{id}:
 *   patch:
 *     tags: [Facturas]
 *     summary: Actualizar una factura
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
 *               usuario_id: { type: integer, minimum: 1 }
 *               nit: { type: string, maxLength: 20 }
 *               nombre_fiscal: { type: string, maxLength: 150 }
 *               direccion_fiscal: { type: string, maxLength: 255, nullable: true }
 *               subtotal: { type: number, minimum: 0 }
 *               estado: { type: string, maxLength: 20 }
 *               fecha_emision: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200: { description: Factura actualizada correctamente }
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
 *         description: Factura o usuario no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionFacturas),
  validateParams(facturaIdSchema),
  validateBody(updateFacturaSchema),
  facturaController.updateFactura
);

/**
 * @openapi
 * /api/facturas/{id}:
 *   delete:
 *     tags: [Facturas]
 *     summary: Eliminar una factura
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Factura eliminada correctamente }
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
 *         description: Factura no encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: La factura tiene ítems asociados
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionFacturas),
  validateParams(facturaIdSchema),
  facturaController.deleteFactura
);

export default router;
