import { Router } from "express";
import { ROLES } from "../../constants/roles";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";
import * as cuentaPorPagarController from "../../controllers/proveedores/cuentaPorPagar.controller";
import {
  createCuentaPorPagarSchema,
  cuentaPorPagarIdSchema,
  updateCuentaPorPagarSchema,
} from "../../validators/proveedores/cuentaPorPagar.validator";

const router = Router();
const rolesGestionProveedores = [ROLES.ADMIN, ROLES.GERENTE_RESTAURANTE];

/**
 * @openapi
 * /api/cuentas-por-pagar:
 *   get:
 *     tags: [Cuentas por Pagar]
 *     summary: Listar cuentas por pagar
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cuentas por pagar obtenidas correctamente }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get("/", authMiddleware, cuentaPorPagarController.getAllCuentasPorPagar);

/**
 * @openapi
 * /api/cuentas-por-pagar/{id}:
 *   get:
 *     tags: [Cuentas por Pagar]
 *     summary: Obtener una cuenta por pagar por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Cuenta por pagar obtenida correctamente }
 *       400:
 *         description: ID inválido
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       404:
 *         description: Cuenta por pagar no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get(
  "/:id",
  authMiddleware,
  validateParams(cuentaPorPagarIdSchema),
  cuentaPorPagarController.getCuentaPorPagarById,
);

/**
 * @openapi
 * /api/cuentas-por-pagar:
 *   post:
 *     tags: [Cuentas por Pagar]
 *     summary: Crear una cuenta por pagar
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proveedor_id, monto, fecha_vencimiento]
 *             additionalProperties: false
 *             properties:
 *               proveedor_id: { type: integer, minimum: 1 }
 *               monto: { type: number, minimum: 0 }
 *               fecha_vencimiento: { type: string, format: date }
 *               estado: { type: string, enum: [pendiente, pagado, vencido] }
 *               factura_referencia: { type: string, maxLength: 100, nullable: true }
 *     responses:
 *       201: { description: Cuenta por pagar creada correctamente }
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
  validateBody(createCuentaPorPagarSchema),
  cuentaPorPagarController.createCuentaPorPagar,
);

/**
 * @openapi
 * /api/cuentas-por-pagar/{id}:
 *   patch:
 *     tags: [Cuentas por Pagar]
 *     summary: Actualizar una cuenta por pagar
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
 *               monto: { type: number, minimum: 0 }
 *               fecha_vencimiento: { type: string, format: date }
 *               estado: { type: string, enum: [pendiente, pagado, vencido] }
 *               factura_referencia: { type: string, maxLength: 100, nullable: true }
 *     responses:
 *       200: { description: Cuenta por pagar actualizada correctamente }
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
 *         description: Cuenta o proveedor no encontrado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionProveedores),
  validateParams(cuentaPorPagarIdSchema),
  validateBody(updateCuentaPorPagarSchema),
  cuentaPorPagarController.updateCuentaPorPagar,
);

/**
 * @openapi
 * /api/cuentas-por-pagar/{id}:
 *   delete:
 *     tags: [Cuentas por Pagar]
 *     summary: Eliminar una cuenta por pagar
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Cuenta por pagar eliminada correctamente }
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
 *         description: Cuenta por pagar no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionProveedores),
  validateParams(cuentaPorPagarIdSchema),
  cuentaPorPagarController.deleteCuentaPorPagar,
);

export default router;
