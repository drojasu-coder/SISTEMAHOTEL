import { Router } from "express";

import {
  authMiddleware,
} from "../../middlewares/auth.middleware";

import {
  requireRole,
} from "../../middlewares/role.middleware";

import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";

import {
  ROLES,
} from "../../constants/roles";

import * as reservaParqueoController from "../../controllers/habitaciones/reservaParqueo.controller";

import {
  createReservaParqueoSchema,
  updateReservaParqueoSchema,
  reservaParqueoIdSchema,
} from "../../validators/habitaciones/reservaParqueo.validator";

const router =
  Router();

const rolesGestionHabitaciones = [
  ROLES.ADMIN,
  ROLES.RECEPCIONISTA,
  ROLES.GERENTE_HABITACIONES,
];

/**
 * @openapi
 * /api/reservas-parqueo:
 *   get:
 *     tags:
 *       - Reservas de Parqueo
 *     summary: Listar reservas de parqueo
 *     description: Operación administrativa para consultar todas las reservas de parqueo.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservas obtenidas correctamente
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos administrativos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  authMiddleware,
  requireRole(
    ...rolesGestionHabitaciones
  ),
  reservaParqueoController.getAllReservaParqueos
);

/**
 * @openapi
 * /api/reservas-parqueo/{id}:
 *   get:
 *     tags:
 *       - Reservas de Parqueo
 *     summary: Obtener una reserva de parqueo
 *     description: Operación administrativa.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Reserva obtenida correctamente
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos administrativos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  authMiddleware,
  requireRole(
    ...rolesGestionHabitaciones
  ),
  validateParams(
    reservaParqueoIdSchema
  ),
  reservaParqueoController.getReservaParqueoById
);

/**
 * @openapi
 * /api/reservas-parqueo:
 *   post:
 *     tags:
 *       - Reservas de Parqueo
 *     summary: Crear una reserva de parqueo
 *     description: Operación administrativa. La asociación con una reserva de habitación es opcional.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parqueo_id
 *               - fecha_entrada
 *             properties:
 *               reserva_habitacion_id:
 *                 type: integer
 *                 minimum: 1
 *                 nullable: true
 *                 description: Reserva de habitación asociada. Puede omitirse o ser null.
 *               parqueo_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               fecha_entrada:
 *                 type: string
 *                 example: '2027-01-10T14:00:00-06:00'
 *                 description: Acepta YYYY-MM-DD o fecha/hora ISO 8601.
 *               fecha_salida:
 *                 type: string
 *                 nullable: true
 *                 example: '2027-01-12T11:00:00-06:00'
 *                 description: Opcional. Puede ser null para una ocupación sin salida definida.
 *     responses:
 *       201:
 *         description: Reserva creada correctamente
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos administrativos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Parqueo o reserva de habitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Parqueo no disponible o parqueo en mantenimiento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Fechas inválidas o fecha de entrada en el pasado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  authMiddleware,
  requireRole(
    ...rolesGestionHabitaciones
  ),
  validateBody(
    createReservaParqueoSchema
  ),
  reservaParqueoController.createReservaParqueo
);

/**
 * @openapi
 * /api/reservas-parqueo/{id}:
 *   patch:
 *     tags:
 *       - Reservas de Parqueo
 *     summary: Actualizar una reserva de parqueo
 *     description: Operación administrativa. Un PATCH vacío es rechazado y reserva_habitacion_id puede enviarse como null para desvincular la reserva.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               reserva_habitacion_id:
 *                 type: integer
 *                 minimum: 1
 *                 nullable: true
 *               parqueo_id:
 *                 type: integer
 *                 minimum: 1
 *               fecha_entrada:
 *                 type: string
 *                 description: Acepta YYYY-MM-DD o fecha/hora ISO 8601.
 *               fecha_salida:
 *                 type: string
 *                 nullable: true
 *                 description: Puede enviarse como null.
 *     responses:
 *       200:
 *         description: Reserva actualizada correctamente
 *       400:
 *         description: Datos inválidos o body vacío
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos administrativos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reserva, parqueo o reserva de habitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Parqueo no disponible o parqueo en mantenimiento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Fechas inválidas o fecha de entrada en el pasado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(
    ...rolesGestionHabitaciones
  ),
  validateParams(
    reservaParqueoIdSchema
  ),
  validateBody(
    updateReservaParqueoSchema
  ),
  reservaParqueoController.updateReservaParqueo
);

/**
 * @openapi
 * /api/reservas-parqueo/{id}:
 *   delete:
 *     tags:
 *       - Reservas de Parqueo
 *     summary: Eliminar una reserva de parqueo
 *     description: Actualmente elimina físicamente la reserva porque el modelo no dispone de un estado de cancelación.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Reserva eliminada correctamente
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos administrativos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(
    ...rolesGestionHabitaciones
  ),
  validateParams(
    reservaParqueoIdSchema
  ),
  reservaParqueoController.deleteReservaParqueo
);

export default router;