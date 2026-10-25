import { Router } from "express";

import * as controller from "../../controllers/restaurante/reservaMesa.controller";

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
  createReservaMesaSchema,
  updateReservaMesaSchema,
} from "../../validators/restaurante/reservaMesa.validator";

import {
  idParamSchema,
} from "../../validators/common.validator";

const router = Router();

/**
 * Todas las operaciones del módulo requieren
 * un usuario autenticado.
 */
router.use(authMiddleware);

/**
 * @openapi
 * /api/reservas-mesa:
 *   post:
 *     tags:
 *       - Reservas de Mesa
 *     summary: Crear una reserva de mesa
 *     description: >
 *       Permite a un cliente autenticado reservar una mesa para sí mismo.
 *       El usuario se obtiene automáticamente del JWT.
 *       La mesa debe existir, tener capacidad suficiente, no encontrarse
 *       en mantenimiento y estar disponible para la fecha y hora solicitadas.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservaMesaRequest'
 *     responses:
 *       201:
 *         description: Reserva creada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo los clientes pueden crear reservas de mesa
 *       404:
 *         description: Mesa no encontrada
 *       409:
 *         description: >
 *           La mesa ya está reservada en esa fecha y hora
 *           o se encuentra en mantenimiento.
 *       422:
 *         description: >
 *           La fecha u hora solicitada está en el pasado
 *           o se excede la capacidad de la mesa.
 */
// Solo los clientes autenticados pueden crear una reserva para sí mismos.
router.post(
  "/",
  requireRole(
    ROLES.CLIENTE
  ),
  validateBody(
    createReservaMesaSchema
  ),
  controller.create
);

/**
 * @openapi
 * /api/reservas-mesa/mis-reservas:
 *   get:
 *     tags:
 *       - Reservas de Mesa
 *     summary: Listar reservas de mesa del cliente autenticado
 *     description: Operación exclusiva para clientes autenticados para consultar sus reservas de mesa.
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
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReservaMesa'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Exclusivo para clientes
 */
router.get(
  "/mis-reservas",
  requireRole(
    ROLES.CLIENTE
  ),
  controller.getMyReservations
);

/**
 * @openapi
 * /api/reservas-mesa/mis-reservas/{id}:
 *   get:
 *     tags:
 *       - Reservas de Mesa
 *     summary: Obtener detalle de una reserva de mesa del cliente autenticado
 *     description: Permite al cliente autenticado consultar el detalle de una de sus reservas de mesa.
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
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ReservaMesa'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: No tiene permisos para consultar esta reserva
 *       404:
 *         description: Reserva no encontrada
 */
router.get(
  "/mis-reservas/:id",
  requireRole(
    ROLES.CLIENTE
  ),
  validateParams(
    idParamSchema
  ),
  controller.getMyReservationById
);

/**
 * @openapi
 * /api/reservas-mesa:
 *   get:
 *     tags:
 *       - Reservas de Mesa
 *     summary: Listar todas las reservas de mesa
 *     description: Operación administrativa disponible únicamente para administradores.
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
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReservaMesa'
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
  controller.getAll
);

/**
 * @openapi
 * /api/reservas-mesa/{id}:
 *   get:
 *     tags:
 *       - Reservas de Mesa
 *     summary: Obtener una reserva de mesa por ID
 *     description: Operación administrativa disponible únicamente para administradores.
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
  controller.getById
);

/**
 * @openapi
 * /api/reservas-mesa/{id}/estado:
 *   patch:
 *     tags:
 *       - Reservas de Mesa
 *     summary: Cambiar el estado de una reserva de mesa
 *     description: >
 *       Permite al administrador cambiar una reserva entre
 *       confirmada y cancelada. Si se intenta reactivar una
 *       reserva cancelada, el backend vuelve a comprobar
 *       disponibilidad, capacidad y estado de la mesa.
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
 *             $ref: '#/components/schemas/UpdateReservaMesaEstadoRequest'
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos administrativos
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: >
 *           La reserva ya posee el estado solicitado,
 *           la mesa ya está ocupada para esa fecha y hora
 *           o la mesa se encuentra en mantenimiento.
 *       422:
 *         description: >
 *           No se puede reactivar la reserva porque su fecha
 *           u hora ya pasó o porque excede la capacidad actual
 *           de la mesa.
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
    updateReservaMesaSchema
  ),
  controller.updateStatus
);

export default router;
