import {
  Router,
} from "express";

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

import * as reservaHabitacionController from "../../controllers/habitaciones/reservaHabitacion.controller";

import {
  createReservaHabitacionSchema,
  updateReservaHabitacionSchema,
  reservaHabitacionIdSchema,
} from "../../validators/habitaciones/reservaHabitacion.validator";

const router =
  Router();

const rolesGestionHabitaciones = [
  ROLES.ADMIN,
  ROLES.RECEPCIONISTA,
  ROLES.GERENTE_HABITACIONES,
];

const rolesCreacionReservas = [
  ...rolesGestionHabitaciones,
  ROLES.CLIENTE,
];

/**
 * @openapi
 * /api/reservas-habitacion:
 *   get:
 *     tags:
 *       - Reservas de Habitación
 *     summary: Listar reservas de habitación
 *     description: El personal administrativo consulta las reservas de sus sedes autorizadas (el administrador, todas). Los clientes únicamente reciben sus propias reservas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filtra por sede. Debe estar dentro de las sedes autorizadas del usuario (403 si no); un valor inválido devuelve 400.
 *     responses:
 *       200:
 *         description: Reservas de habitación obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservasHabitacionResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  authMiddleware,
  reservaHabitacionController.getAllReservaHabitaciones
);

/**
 * @openapi
 * /api/reservas-habitacion/{id}:
 *   get:
 *     tags:
 *       - Reservas de Habitación
 *     summary: Obtener una reserva de habitación
 *     description: Los clientes únicamente pueden consultar reservas que les pertenezcan.
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
 *         description: Reserva de habitación obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservaHabitacionResponse'
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
 *         description: La reserva pertenece a otro usuario
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
  validateParams(
    reservaHabitacionIdSchema
  ),
  reservaHabitacionController.getReservaHabitacionById
);

/**
 * @openapi
 * /api/reservas-habitacion:
 *   post:
 *     tags:
 *       - Reservas de Habitación
 *     summary: Crear una reserva de habitación
 *     description: Los clientes reservan para sí mismos utilizando el usuario del JWT (omiten usuario_id). Los usuarios administrativos deben indicar usuario_id en el cuerpo.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservaHabitacionRequest'
 *     responses:
 *       201:
 *         description: Reserva de habitación creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservaHabitacionCreatedResponse'
 *       400:
 *         description: Datos inválidos o usuario_id faltante para administradores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado (AUTH_TOKEN_REQUIRED, INVALID_AUTH_FORMAT, INVALID_TOKEN, TOKEN_EXPIRED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario o habitación no encontrada (HABITACION_NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Habitación ocupada en esas fechas o en mantenimiento (HABITACION_EN_MANTENIMIENTO, HABITACION_OCUPADA_EN_FECHAS)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Fechas inválidas, fecha pasada o capacidad excedida (FECHAS_INVALIDAS, ROOM_RESERVATION_DATE_IN_PAST, CAPACIDAD_EXCEDIDA)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  authMiddleware,
  requireRole(
    ...rolesCreacionReservas
  ),
  validateBody(
    createReservaHabitacionSchema
  ),
  reservaHabitacionController.createReservaHabitacion
);

/**
 * @openapi
 * /api/reservas-habitacion/{id}:
 *   patch:
 *     tags:
 *       - Reservas de Habitación
 *     summary: Actualizar una reserva de habitación
 *     description: Operación administrativa. Un PATCH vacío es rechazado.
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
 *               usuario_id:
 *                 type: integer
 *                 minimum: 1
 *               habitacion_id:
 *                 type: integer
 *                 minimum: 1
 *               fecha_entrada:
 *                 type: string
 *                 format: date
 *               fecha_salida:
 *                 type: string
 *                 format: date
 *               numero_huespedes:
 *                 type: integer
 *                 minimum: 1
 *               estado:
 *                 type: string
 *                 enum:
 *                   - pendiente
 *                   - confirmada
 *                   - cancelada
 *                   - finalizada
 *                   - expirada
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
 *         description: Reserva, usuario o habitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Habitación ocupada en esas fechas o habitación en mantenimiento
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Fechas inválidas, fecha pasada o capacidad excedida
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
    reservaHabitacionIdSchema
  ),
  validateBody(
    updateReservaHabitacionSchema
  ),
  reservaHabitacionController.updateReservaHabitacion
);

/**
 * @openapi
 * /api/reservas-habitacion/{id}:
 *   delete:
 *     tags:
 *       - Reservas de Habitación
 *     summary: Cancelar una reserva de habitación
 *     description: Cancela lógicamente la reserva utilizando el estado cancelada y conserva su historial.
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
 *         description: Reserva cancelada correctamente
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
    reservaHabitacionIdSchema
  ),
  reservaHabitacionController.deleteReservaHabitacion
);

export default router;
