import { Router } from "express";

import * as reservaActividadController from "../../controllers/actividades/reservaActividad.controller";

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
  createReservaActividadSchema,
  updateReservaActividadSchema,
} from "../../validators/actividades/reservaActividad.validator";

import {
  idParamSchema,
} from "../../validators/common.validator";

const router = Router();

/**
 * Todas las operaciones del módulo requieren
 * que el usuario esté autenticado.
 */
router.use(authMiddleware);

/**
 * @openapi
 * /api/reservas-actividad:
 *   post:
 *     tags:
 *       - Reservas de Actividad
 *     summary: Crear una reserva de actividad
 *     description: >
 *       Permite a un cliente autenticado reservar un recurso para una actividad.
 *       El usuario se obtiene automáticamente del JWT.
 *       La duración debe ser de entre 30 y 120 minutos.
 *       El sistema evita traslapes tanto del recurso como del instructor
 *       y, si se selecciona un instructor, verifica que exista y esté activo.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservaActividadRequest'
 *     responses:
 *       201:
 *         description: Reserva creada correctamente
 *       400:
 *         description: Datos inválidos o rango horario incorrecto
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo los clientes pueden crear reservas de actividad
 *       404:
 *         description: Recurso o instructor no encontrado
 *       409:
 *         description: >
 *           El recurso o el instructor ya se encuentra ocupado
 *           en el horario solicitado.
 *       422:
 *         description: >
 *           La fecha u hora solicitada está en el pasado,
 *           la duración no se encuentra entre 30 y 120 minutos
 *           o el instructor seleccionado está inactivo.
 */
// Solo los clientes autenticados pueden crear una reserva para sí mismos.
router.post(
  "/",
  requireRole(
    ROLES.CLIENTE
  ),
  validateBody(
    createReservaActividadSchema
  ),
  reservaActividadController.create
);

/**
 * @openapi
 * /api/reservas-actividad:
 *   get:
 *     tags:
 *       - Reservas de Actividad
 *     summary: Listar todas las reservas de actividad
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
 *                     $ref: '#/components/schemas/ReservaActividad'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos administrativos
 */
// Solo el administrador puede consultar todas las reservas.
router.get(
  "/mis-reservas",
  requireRole(
    ROLES.CLIENTE
  ),
  reservaActividadController.getMine
);

router.get(
  "/mis-reservas/:id",
  requireRole(
    ROLES.CLIENTE
  ),
  validateParams(
    idParamSchema
  ),
  reservaActividadController.getMineById
);

router.get(
  "/",
  requireRole(
    ROLES.ADMIN
  ),
  reservaActividadController.getAll
);

/**
 * @openapi
 * /api/reservas-actividad/{id}:
 *   get:
 *     tags:
 *       - Reservas de Actividad
 *     summary: Obtener una reserva de actividad por ID
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
  reservaActividadController.getById
);

/**
 * @openapi
 * /api/reservas-actividad/{id}/estado:
 *   patch:
 *     tags:
 *       - Reservas de Actividad
 *     summary: Actualizar una reserva de actividad
 *     description: >
 *       Permite al administrador modificar el estado de la reserva
 *       y/o indicar si requiere equipo.
 *       Si una reserva cancelada o completada vuelve a estado confirmada,
 *       el backend verifica nuevamente fecha, horario, recurso,
 *       instructor y posibles traslapes.
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
 *             $ref: '#/components/schemas/UpdateReservaActividadRequest'
 *     responses:
 *       200:
 *         description: Reserva actualizada correctamente
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos administrativos
 *       404:
 *         description: Reserva, recurso o instructor no encontrado
 *       409:
 *         description: >
 *           No se puede reactivar la reserva porque el recurso
 *           o el instructor ya se encuentra ocupado en ese horario.
 *       422:
 *         description: >
 *           No se puede reactivar la reserva porque la fecha u hora
 *           ya pasó, la duración dejó de ser válida
 *           o el instructor se encuentra inactivo.
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
    updateReservaActividadSchema
  ),
  reservaActividadController.updateStatus
);

export default router;
