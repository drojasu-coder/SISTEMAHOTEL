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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservaAmenidadResponse'
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
 *     summary: Listar reservas de amenidad
 *     description: >
 *       Permite listar reservas de amenidad. Los administradores
 *       obtienen el listado global del hotel; los clientes obtienen
 *       exclusivamente sus propias reservas de amenidad.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservasAmenidadResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Rol no autorizado
 */
// Administradores obtienen todas las reservas; clientes únicamente las propias.
router.get(
  "/",
  requireRole(
    ROLES.ADMIN,
    ROLES.CLIENTE
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
 *       Permite consultar el detalle de una reserva de amenidad.
 *       Los administradores pueden consultar cualquier reserva;
 *       los clientes solo pueden consultar las que les pertenecen
 *       (403 si pertenece a otro usuario).
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservaAmenidadResponse'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: No tiene permisos para acceder a esta reserva
 *       404:
 *         description: Reserva no encontrada
 */
router.get(
  "/:id",
  requireRole(
    ROLES.ADMIN,
    ROLES.CLIENTE
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservaAmenidadResponse'
 *       400:
 *         description: Estado o ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo los administradores pueden cambiar el estado
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
