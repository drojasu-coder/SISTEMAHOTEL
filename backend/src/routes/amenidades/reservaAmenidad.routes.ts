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

const router =
  Router();

router.use(
  authMiddleware
);

/*
 * Solo los clientes realizan reservas.
 */
/**
 * @openapi
 * /api/reservas-amenidad:
 *   post:
 *     tags:
 *       - Reservas de Amenidad
 *     summary: Crear una reserva de amenidad
 *     description: >
 *       Permite a un cliente reservar una amenidad para una fecha
 *       y franja horaria. El backend controla el aforo máximo,
 *       evita reservas duplicadas del mismo usuario y genera
 *       automáticamente un código QR único.
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
 *         description: Datos o franja horaria inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo clientes pueden reservar
 *       404:
 *         description: Amenidad no encontrada
 *       409:
 *         description: >
 *           Aforo completo o reserva duplicada para el mismo usuario,
 *           fecha y franja
 *       422:
 *         description: Fecha de reserva en el pasado
 */
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

/*
 * Administración.
 */
/**
 * @openapi
 * /api/reservas-amenidad:
 *   get:
 *     tags:
 *       - Reservas de Amenidad
 *     summary: Listar todas las reservas de amenidad
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
 *         description: Solo administradores
 */
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
 *         description: Solo administradores
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
 *       Permite marcar una reserva confirmada como cancelada o usada.
 *       Las reservas canceladas o usadas son estados finales.
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
 *         description: Solo administradores
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: >
 *           La reserva ya posee ese estado o se encuentra
 *           en un estado final
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