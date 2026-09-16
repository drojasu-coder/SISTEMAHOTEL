import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { ROLES } from "../../constants/roles";
import * as reservaHabitacionController from "../../controllers/habitaciones/reservaHabitacion.controller";
import {
  createReservaHabitacionSchema,
  updateReservaHabitacionSchema,
  reservaHabitacionIdSchema,
} from "../../validators/habitaciones/reservaHabitacion.validator";

const router = Router();
const rolesGestionHabitaciones = [
  ROLES.ADMIN,
  ROLES.RECEPCIONISTA,
  ROLES.GERENTE_HABITACIONES,
];

/**
 * @openapi
 * /api/reservas-habitacion:
 *   get:
 *     tags: ['Reservas de Habitación']
 *     summary: Listar reservas de habitación
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Reservas obtenidas correctamente }
 *       401:
 *         description: Usuario no autenticado
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.get("/", authMiddleware, reservaHabitacionController.getAllReservaHabitaciones);

/**
 * @openapi
 * /api/reservas-habitacion/{id}:
 *   get:
 *     tags: ['Reservas de Habitación']
 *     summary: Obtener una reserva de habitación
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
router.get("/:id", authMiddleware, validateParams(reservaHabitacionIdSchema), reservaHabitacionController.getReservaHabitacionById);

/**
 * @openapi
 * /api/reservas-habitacion:
 *   post:
 *     tags: ['Reservas de Habitación']
 *     summary: Crear una reserva de habitación
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [usuario_id, habitacion_id, fecha_entrada, fecha_salida, numero_huespedes]
 *             properties:
 *               usuario_id: { type: integer, minimum: 1, example: 1 }
 *               habitacion_id: { type: integer, minimum: 1, example: 1 }
 *               fecha_entrada: { type: string, format: date, example: '2026-10-01' }
 *               fecha_salida: { type: string, format: date, example: '2026-10-05' }
 *               numero_huespedes: { type: integer, minimum: 1, example: 2 }
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
 *         description: Usuario o habitación no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       409:
 *         description: Habitación no disponible
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.post(
  "/",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateBody(createReservaHabitacionSchema),
  reservaHabitacionController.createReservaHabitacion
);

/**
 * @openapi
 * /api/reservas-habitacion/{id}:
 *   patch:
 *     tags: ['Reservas de Habitación']
 *     summary: Actualizar una reserva de habitación
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
 *               habitacion_id: { type: integer, minimum: 1 }
 *               fecha_entrada: { type: string, format: date }
 *               fecha_salida: { type: string, format: date }
 *               numero_huespedes: { type: integer, minimum: 1 }
 *               estado: { type: string, enum: [pendiente, confirmada, cancelada, finalizada, expirada] }
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
 *         description: Reserva, usuario o habitación no encontrada
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 *       409:
 *         description: Habitación no disponible
 *         content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateParams(reservaHabitacionIdSchema),
  validateBody(updateReservaHabitacionSchema),
  reservaHabitacionController.updateReservaHabitacion
);

/**
 * @openapi
 * /api/reservas-habitacion/{id}:
 *   delete:
 *     tags: ['Reservas de Habitación']
 *     summary: Cancelar una reserva de habitación
 *     description: Cancela la reserva mediante estado cancelada y conserva su historial.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200: { description: Reserva cancelada; se conserva el historial }
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
router.delete(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateParams(reservaHabitacionIdSchema),
  reservaHabitacionController.deleteReservaHabitacion
);

export default router;
