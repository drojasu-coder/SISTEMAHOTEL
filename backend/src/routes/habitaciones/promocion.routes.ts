import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { ROLES } from "../../constants/roles";
import * as promocionController from "../../controllers/habitaciones/promocion.controller";
import { createPromocionSchema, updatePromocionSchema, promocionIdSchema } from "../../validators/habitaciones/promocion.validator";

const router = Router();
const rolesGestionHabitaciones = [ROLES.ADMIN, ROLES.RECEPCIONISTA, ROLES.GERENTE_HABITACIONES];

/**
 * @openapi
 * /api/promociones:
 *   get:
 *     tags: [Promociones]
 *     summary: Listar promociones
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Promociones obtenidas correctamente }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get("/", authMiddleware, promocionController.getAllPromociones);

/**
 * @openapi
 * /api/promociones/{id}:
 *   get:
 *     tags: [Promociones]
 *     summary: Obtener una promoción por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Promoción obtenida correctamente }
 *       400:
 *         description: ID inválido
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       404:
 *         description: Promoción no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get("/:id", authMiddleware, validateParams(promocionIdSchema), promocionController.getPromocionById);

/**
 * @openapi
 * /api/promociones:
 *   post:
 *     tags: [Promociones]
 *     summary: Crear una promoción
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin]
 *             properties:
 *               nombre: { type: string, maxLength: 150 }
 *               tipo_descuento: { type: string, enum: [porcentaje, monto_fijo] }
 *               valor_descuento: { type: number, minimum: 0 }
 *               aplica_a: { type: string, nullable: true, maxLength: 50 }
 *               fecha_inicio: { type: string, format: date }
 *               fecha_fin: { type: string, format: date }
 *               activa: { type: boolean }
 *     responses:
 *       201: { description: Promoción creada correctamente }
 *       400:
 *         description: Datos inválidos
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       403:
 *         description: Usuario sin permisos
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       422:
 *         description: Fechas inválidas
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.post("/", authMiddleware, requireRole(...rolesGestionHabitaciones), validateBody(createPromocionSchema), promocionController.createPromocion);

/**
 * @openapi
 * /api/promociones/{id}:
 *   patch:
 *     tags: [Promociones]
 *     summary: Actualizar una promoción
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
 *               nombre: { type: string, maxLength: 150 }
 *               tipo_descuento: { type: string, enum: [porcentaje, monto_fijo] }
 *               valor_descuento: { type: number, minimum: 0 }
 *               aplica_a: { type: string, nullable: true, maxLength: 50 }
 *               fecha_inicio: { type: string, format: date }
 *               fecha_fin: { type: string, format: date }
 *               activa: { type: boolean }
 *     responses:
 *       200: { description: Promoción actualizada correctamente }
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
 *         description: Promoción no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       422:
 *         description: Fechas inválidas
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.patch("/:id", authMiddleware, requireRole(...rolesGestionHabitaciones), validateParams(promocionIdSchema), validateBody(updatePromocionSchema), promocionController.updatePromocion);

/**
 * @openapi
 * /api/promociones/{id}:
 *   delete:
 *     tags: [Promociones]
 *     summary: Eliminar una promoción
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Promoción eliminada correctamente }
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
 *         description: Promoción no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       409:
 *         description: Promoción en uso
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.delete("/:id", authMiddleware, requireRole(...rolesGestionHabitaciones), validateParams(promocionIdSchema), promocionController.deletePromocion);

export default router;
