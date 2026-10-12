import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { ROLES } from "../../constants/roles";
import * as reservaParqueoController from "../../controllers/habitaciones/reservaParqueo.controller";
import {
  createReservaParqueoSchema,
  updateReservaParqueoSchema,
  reservaParqueoIdSchema,
} from "../../validators/habitaciones/reservaParqueo.validator";

const router = Router();
const rolesGestionHabitaciones = [
  ROLES.ADMIN,
  ROLES.RECEPCIONISTA,
  ROLES.GERENTE_HABITACIONES,
];

/**
 * @openapi
 * /api/reservas-parqueo:
 *   get:
 *     tags: ['Reservas de Parqueo']
 *     summary: Listar reservas de parqueo
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Reservas obtenidas correctamente }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get("/", authMiddleware, reservaParqueoController.getAllReservaParqueos);

/**
 * @openapi
 * /api/reservas-parqueo/{id}:
 *   get:
 *     tags: ['Reservas de Parqueo']
 *     summary: Obtener una reserva de parqueo
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Reserva obtenida correctamente }
 *       400:
 *         description: ID inválido
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       404:
 *         description: Reserva no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get("/:id", authMiddleware, validateParams(reservaParqueoIdSchema), reservaParqueoController.getReservaParqueoById);

/**
 * @openapi
 * /api/reservas-parqueo:
 *   post:
 *     tags: ['Reservas de Parqueo']
 *     summary: Crear una reserva de parqueo
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [parqueo_id, fecha_entrada]
 *             properties:
 *               reserva_habitacion_id: { type: integer, minimum: 1 }
 *               parqueo_id: { type: integer, minimum: 1, example: 1 }
 *               fecha_entrada: { type: string, format: date-time }
 *               fecha_salida: { type: string, format: date-time }
 *     responses:
 *       201: { description: Reserva creada correctamente }
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
 *         description: Parqueo o reserva de habitación no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       409:
 *         description: Parqueo no disponible
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.post("/", authMiddleware, requireRole(...rolesGestionHabitaciones), validateBody(createReservaParqueoSchema), reservaParqueoController.createReservaParqueo);

/**
 * @openapi
 * /api/reservas-parqueo/{id}:
 *   patch:
 *     tags: ['Reservas de Parqueo']
 *     summary: Actualizar una reserva de parqueo
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
 *               reserva_habitacion_id: { type: integer, minimum: 1 }
 *               parqueo_id: { type: integer, minimum: 1 }
 *               fecha_entrada: { type: string, format: date-time }
 *               fecha_salida: { type: string, format: date-time }
 *     responses:
 *       200: { description: Reserva actualizada correctamente }
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
 *         description: Reserva, parqueo o reserva de habitación no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       409:
 *         description: Parqueo no disponible
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.patch("/:id", authMiddleware, requireRole(...rolesGestionHabitaciones), validateParams(reservaParqueoIdSchema), validateBody(updateReservaParqueoSchema), reservaParqueoController.updateReservaParqueo);

/**
 * @openapi
 * /api/reservas-parqueo/{id}:
 *   delete:
 *     tags: ['Reservas de Parqueo']
 *     summary: Eliminar una reserva de parqueo
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Reserva eliminada correctamente }
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
 *         description: Reserva no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.delete("/:id", authMiddleware, requireRole(...rolesGestionHabitaciones), validateParams(reservaParqueoIdSchema), reservaParqueoController.deleteReservaParqueo);

export default router;
