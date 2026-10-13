import {
  Router,
} from "express";

import * as reservaAmenidadController
  from "../../controllers/amenidades/reservaAmenidad.controller";

import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";

import {
  authMiddleware,
} from "../../middlewares/auth.middleware";

import {
  requireRole,
} from "../../middlewares/role.middleware";

import {
  ROLES,
} from "../../constants/roles";

import {
  createReservaAmenidadSchema,
  updateReservaAmenidadSchema,
} from "../../validators/amenidades/reservaAmenidad.validator";

import {
  idParamSchema,
} from "../../validators/common.validator";

const router = Router();

/**
 * Todas las operaciones de reservas de amenidad
 * requieren autenticación.
 */
router.use(
  authMiddleware
);

/**
 * @openapi
 * /api/reservas-amenidad:
 *   post:
 *     tags:
 *       - Reservas de Amenidad
 *     summary: Crear una reserva de amenidad
 *     description: >
 *       Permite a un cliente autenticado reservar una amenidad
 *       para una fecha y franja horaria.
 *       El usuario se obtiene automáticamente del JWT.
 *       El backend controla el aforo concurrente de la amenidad,
 *       evita reservas superpuestas del mismo usuario y genera
 *       automáticamente un código QR único.
 *       Actualmente cada reserva representa el acceso de una persona.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservaAmenidadRequest'
 *     responses:
 *       201:
 *         description: Reserva creada correctamente
 *       400:
 *         description: Datos, fecha o franja horaria inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo los clientes pueden crear reservas de amenidad
 *       404:
 *         description: Amenidad no encontrada
 *       409:
 *         description: >
 *           El aforo máximo sería excedido durante la franja solicitada
 *           o el usuario ya posee una reserva superpuesta
 *           para esa amenidad.
 *       422:
 *         description: >
 *           La fecha está en el pasado o, para una reserva
 *           del día actual, la franja horaria ya comenzó.
 */
// Solo los clientes autenticados pueden reservar amenidades.
router.post(
  "/",
  requireRole(
    ROLES.CLIENTE
  ),
  validateBody(
    createReservaAmenidadSchema
  ),
  reservaAmenidadController.create
);

/**
 * @openapi
 * /api/reservas-amenidad:
 *   get:
 *     tags:
 *       - Reservas de Amenidad
 *     summary: Listar todas las reservas de amenidad
 *     description: >
 *       Operación administrativa disponible únicamente
 *       para administradores.
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
 *                   example: Reservas de amenidad obtenidas correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReservaAmenidad'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos administrativos
 */
// Solo el administrador puede consultar todas las reservas.
router.get(
  "/",
  requireRole(
    ROLES.ADMIN
  ),
  reservaAmenidadController.getAll
);

/**
 * @openapi
 * /api/reservas-amenidad/{id}:
 *   get:
 *     tags:
 *       - Reservas de Amenidad
 *     summary: Obtener una reserva de amenidad por ID
 *     description: >
 *       Operación administrativa disponible únicamente
 *       para administradores.
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
 *         description: Reserva encontrada
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos administrativos
 *       404:
 *         description: Reserva no encontrada
 */
router.get(
  "/:id",
  requireRole(
    ROLES.ADMIN
  ),
  validateParams(
    idParamSchema
  ),
  reservaAmenidadController.getById
);

/**
 * @openapi
 * /api/reservas-amenidad/{id}/estado:
 *   patch:
 *     tags:
 *       - Reservas de Amenidad
 *     summary: Cambiar el estado de una reserva de amenidad
 *     description: >
 *       Permite al administrador marcar una reserva confirmada
 *       como cancelada o usada.
 *       Los estados cancelada y usada son terminales,
 *       por lo que una reserva que alcance uno de ellos
 *       ya no puede modificarse nuevamente.
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
 *             $ref: '#/components/schemas/UpdateReservaAmenidadEstadoRequest'
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Estado o ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos administrativos
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: >
 *           La reserva ya posee el estado solicitado
 *           o se encuentra en un estado final
 *           y ya no puede modificarse.
 */
router.patch(
  "/:id/estado",
  requireRole(
    ROLES.ADMIN
  ),
  validateParams(
    idParamSchema
  ),
  validateBody(
    updateReservaAmenidadSchema
  ),
  reservaAmenidadController.updateStatus
);

export default router;