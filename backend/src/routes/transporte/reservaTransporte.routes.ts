import { Router }
  from "express";

import * as controller
  from "../../controllers/transporte/reservaTransporte.controller";

import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";

import { authMiddleware }
  from "../../middlewares/auth.middleware";

import { requireRole }
  from "../../middlewares/role.middleware";

import { ROLES }
  from "../../constants/roles";

import { idParamSchema }
  from "../../validators/common.validator";

import {
  createReservaTransporteSchema,
  updateReservaTransporteSchema,
} from "../../validators/transporte/reservaTransporte.validator";

const router = Router();

router.use(
  authMiddleware
);

/**
 * @openapi
 * /api/reservas-transporte:
 *   get:
 *     tags:
 *       - Reservas de Transporte
 *     summary: Listar reservas de transporte
 *     description: >
 *       Los clientes obtienen únicamente sus propias reservas.
 *       Los administradores pueden consultar todas.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Reservas de transporte obtenidas correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReservaTransporte'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario inactivo
 */
router.get(
  "/",
  controller.getAll
);

/**
 * @openapi
 * /api/reservas-transporte/{id}:
 *   get:
 *     tags:
 *       - Reservas de Transporte
 *     summary: Obtener una reserva de transporte por ID
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ReservaTransporte'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: El usuario no tiene acceso a esta reserva
 *       404:
 *         description: Reserva no encontrada
 */
router.get(
  "/:id",
  validateParams(
    idParamSchema
  ),
  controller.getById
);

/**
 * @openapi
 * /api/reservas-transporte:
 *   post:
 *     tags:
 *       - Reservas de Transporte
 *     summary: Solicitar un traslado
 *     description: >
 *       Registra un traslado y asigna automáticamente un chofer activo
 *       y el vehículo de menor capacidad que pueda transportar a los
 *       pasajeros. Si no hay recursos disponibles, la reserva queda pendiente.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origen
 *               - destino
 *               - fecha_hora
 *               - numero_pasajeros
 *             properties:
 *               origen:
 *                 type: string
 *                 example: Aeropuerto La Aurora
 *               destino:
 *                 type: string
 *                 example: Hotel Central
 *               fecha_hora:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-10-20T08:00:00-06:00"
 *               numero_pasajeros:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       201:
 *         description: Reserva creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ReservaTransporte'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       422:
 *         description: >
 *           Fecha pasada, origen y destino iguales o ningún vehículo
 *           con capacidad suficiente.
 */
router.post(
  "/",
  validateBody(
    createReservaTransporteSchema
  ),
  controller.create
);

/**
 * @openapi
 * /api/reservas-transporte/{id}:
 *   patch:
 *     tags:
 *       - Reservas de Transporte
 *     summary: Modificar una reserva pendiente
 *     description: >
 *       Solo las reservas pendientes pueden modificarse. Después del cambio
 *       el sistema vuelve a intentar asignar chofer y vehículo automáticamente.
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
 *             properties:
 *               origen:
 *                 type: string
 *               destino:
 *                 type: string
 *               fecha_hora:
 *                 type: string
 *                 format: date-time
 *               numero_pasajeros:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Reserva actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Reserva perteneciente a otro usuario
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: La reserva ya no es editable
 *       422:
 *         description: Regla de negocio incumplida
 */
router.patch(
  "/:id",
  validateParams(
    idParamSchema
  ),
  validateBody(
    updateReservaTransporteSchema
  ),
  controller.update
);

/**
 * @openapi
 * /api/reservas-transporte/{id}/cancelar:
 *   patch:
 *     tags:
 *       - Reservas de Transporte
 *     summary: Cancelar una reserva de transporte
 *     description: >
 *       Cancela la reserva sin eliminar su historial y libera al chofer
 *       y vehículo para futuras asignaciones.
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
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Reserva perteneciente a otro usuario
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: La reserva ya se encuentra cancelada
 */
router.patch(
  "/:id/cancelar",
  validateParams(
    idParamSchema
  ),
  controller.cancel
);

/**
 * @openapi
 * /api/reservas-transporte/{id}/asignar:
 *   patch:
 *     tags:
 *       - Reservas de Transporte
 *     summary: Reintentar asignación de recursos
 *     description: >
 *       Permite al administrador reintentar la asignación automática
 *       de chofer y vehículo para una reserva pendiente.
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
 *         description: Recursos asignados correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: >
 *           La reserva no está pendiente o todavía no hay recursos disponibles.
 */
router.patch(
  "/:id/asignar",
  requireRole(
    ROLES.ADMIN
  ),
  validateParams(
    idParamSchema
  ),
  controller.retryAssignment
);

export default router;