import {
  Router,
} from "express";

import * as controller
  from "../../controllers/eventos/reservaEventoServicio.controller";

import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";

import {
  authMiddleware,
} from "../../middlewares/auth.middleware";

import {
  createReservaEventoServicioSchema,
  reservaEventoParamSchema,
  reservaEventoServicioParamsSchema,
  updateReservaEventoServicioSchema,
} from "../../validators/eventos/reservaEventoServicio.validator";

const router = Router({
  mergeParams: true,
});

router.use(
  authMiddleware
);

/**
 * @openapi
 * /api/reservas-evento/{reservaId}/servicios:
 *   get:
 *     tags:
 *       - Servicios de Reservas de Evento
 *     summary: Listar servicios asociados a una reserva
 *     description: >
 *       Obtiene todos los servicios adicionales asociados a una reserva
 *       de evento. El propietario de la reserva y los administradores
 *       pueden acceder a esta información.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la reserva de evento
 *     responses:
 *       200:
 *         description: Servicios obtenidos correctamente
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
 *                   example: Servicios de la reserva obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReservaEventoServicio'
 *       400:
 *         description: ID de reserva inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: El usuario no tiene acceso a la reserva
 *       404:
 *         description: Reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  validateParams(
    reservaEventoParamSchema
  ),
  controller.getAll
);

/**
 * @openapi
 * /api/reservas-evento/{reservaId}/servicios/{id}:
 *   get:
 *     tags:
 *       - Servicios de Reservas de Evento
 *     summary: Obtener un servicio asociado a una reserva
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la reserva de evento
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la asociación del servicio
 *     responses:
 *       200:
 *         description: Servicio obtenido correctamente
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
 *                   example: Servicio de la reserva obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/ReservaEventoServicio'
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: El usuario no tiene acceso a la reserva
 *       404:
 *         description: Reserva o servicio asociado no encontrado
 */
router.get(
  "/:id",
  validateParams(
    reservaEventoServicioParamsSchema
  ),
  controller.getById
);

/**
 * @openapi
 * /api/reservas-evento/{reservaId}/servicios:
 *   post:
 *     tags:
 *       - Servicios de Reservas de Evento
 *     summary: Agregar un servicio a una reserva de evento
 *     description: >
 *       Agrega un servicio adicional a una reserva que se encuentre
 *       en estado de cotización. El subtotal, total de la reserva y
 *       anticipo son recalculados automáticamente por el backend.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la reserva de evento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - servicio_evento_id
 *               - cantidad
 *             properties:
 *               servicio_evento_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       201:
 *         description: Servicio agregado correctamente
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
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Servicio agregado a la reserva correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     item:
 *                       $ref: '#/components/schemas/ReservaEventoServicio'
 *                     reserva:
 *                       $ref: '#/components/schemas/ReservaEventoMontos'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: El usuario no tiene acceso a la reserva
 *       404:
 *         description: Reserva o servicio de evento no encontrado
 *       409:
 *         description: >
 *           La reserva no puede modificarse o el servicio ya se encuentra
 *           agregado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validateParams(
    reservaEventoParamSchema
  ),
  validateBody(
    createReservaEventoServicioSchema
  ),
  controller.create
);

/**
 * @openapi
 * /api/reservas-evento/{reservaId}/servicios/{id}:
 *   patch:
 *     tags:
 *       - Servicios de Reservas de Evento
 *     summary: Modificar la cantidad de un servicio
 *     description: >
 *       Modifica la cantidad del servicio asociado y recalcula
 *       automáticamente su subtotal, el total de la reserva y el anticipo.
 *       Solo puede realizarse mientras la reserva esté en cotización.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
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
 *             required:
 *               - cantidad
 *             properties:
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Servicio actualizado correctamente
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
 *                   example: Servicio de la reserva actualizado correctamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     item:
 *                       $ref: '#/components/schemas/ReservaEventoServicio'
 *                     reserva:
 *                       $ref: '#/components/schemas/ReservaEventoMontos'
 *       400:
 *         description: Datos o parámetros inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: El usuario no tiene acceso a la reserva
 *       404:
 *         description: Reserva o servicio asociado no encontrado
 *       409:
 *         description: La reserva ya no se encuentra en estado de cotización
 */
router.patch(
  "/:id",
  validateParams(
    reservaEventoServicioParamsSchema
  ),
  validateBody(
    updateReservaEventoServicioSchema
  ),
  controller.update
);

/**
 * @openapi
 * /api/reservas-evento/{reservaId}/servicios/{id}:
 *   delete:
 *     tags:
 *       - Servicios de Reservas de Evento
 *     summary: Quitar un servicio de una reserva de evento
 *     description: >
 *       Elimina la asociación del servicio y recalcula automáticamente
 *       el total y el anticipo de la reserva. Solo se permite durante
 *       el estado de cotización.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       204:
 *         description: Servicio eliminado correctamente
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: El usuario no tiene acceso a la reserva
 *       404:
 *         description: Reserva o servicio asociado no encontrado
 *       409:
 *         description: La reserva no puede modificarse
 */
router.delete(
  "/:id",
  validateParams(
    reservaEventoServicioParamsSchema
  ),
  controller.remove
);

export default router;