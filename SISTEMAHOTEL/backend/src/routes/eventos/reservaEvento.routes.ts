import { Router } from "express";

import * as reservaEventoController
  from "../../controllers/eventos/reservaEvento.controller";

import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";

import { authMiddleware }
  from "../../middlewares/auth.middleware";

import { idParamSchema }
  from "../../validators/common.validator";

import {
  createReservaEventoSchema,
  updateReservaEventoSchema,
} from "../../validators/eventos/reservaEvento.validator";

const router = Router();

router.use(
  authMiddleware
);

/**
 * @openapi
 * /api/reservas-evento:
 *   get:
 *     tags:
 *       - Reservas de Evento
 *     summary: Listar reservas de eventos
 *     description: >
 *       Obtiene las reservas de eventos. Los administradores pueden
 *       consultar todas las reservas y los demás usuarios únicamente
 *       sus propias reservas.
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
 *                   example: Reservas de eventos obtenidas correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReservaEvento'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario inactivo o sin autorización
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  reservaEventoController.getAll
);

/**
 * @openapi
 * /api/reservas-evento/{id}:
 *   get:
 *     tags:
 *       - Reservas de Evento
 *     summary: Obtener una reserva de evento por ID
 *     description: >
 *       El administrador puede consultar cualquier reserva.
 *       Un cliente únicamente puede consultar sus propias reservas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la reserva
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
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Reserva de evento obtenida correctamente
 *                 data:
 *                   $ref: '#/components/schemas/ReservaEvento'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: El usuario no tiene acceso a esta reserva
 *       404:
 *         description: Reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  validateParams(idParamSchema),
  reservaEventoController.getById
);

/**
 * @openapi
 * /api/reservas-evento:
 *   post:
 *     tags:
 *       - Reservas de Evento
 *     summary: Crear una cotización de evento
 *     description: >
 *       Crea una reserva en estado de cotización. El backend determina
 *       automáticamente el usuario, el total, el anticipo y el estado.
 *       También valida capacidad, disponibilidad y traslapes de horario.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salon_id
 *               - tipo_evento
 *               - fecha
 *               - hora_inicio
 *               - hora_fin
 *               - numero_invitados
 *             properties:
 *               salon_id:
 *                 type: integer
 *                 example: 1
 *               tipo_evento:
 *                 type: string
 *                 enum:
 *                   - boda
 *                   - cumpleanos
 *                   - ejecutivo
 *                   - convivio
 *                 example: boda
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-20"
 *               hora_inicio:
 *                 type: string
 *                 example: "10:00"
 *               hora_fin:
 *                 type: string
 *                 example: "14:00"
 *               numero_invitados:
 *                 type: integer
 *                 minimum: 1
 *                 example: 150
 *     responses:
 *       201:
 *         description: Cotización creada correctamente
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
 *                   example: Cotización de evento creada correctamente
 *                 data:
 *                   $ref: '#/components/schemas/ReservaEvento'
 *       400:
 *         description: Datos con formato inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *       404:
 *         description: Salón o sucursal no encontrados
 *       409:
 *         description: El salón no está disponible en el horario solicitado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: >
 *           Regla de negocio incumplida, por ejemplo capacidad excedida,
 *           fecha pasada, horario inválido o sucursal inactiva.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  validateBody(
    createReservaEventoSchema
  ),
  reservaEventoController.create
);

/**
 * @openapi
 * /api/reservas-evento/{id}:
 *   patch:
 *     tags:
 *       - Reservas de Evento
 *     summary: Actualizar una cotización de evento
 *     description: >
 *       Permite modificar una reserva únicamente mientras esté en estado
 *       de cotización. Vuelve a validar capacidad, horario y disponibilidad.
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
 *               salon_id:
 *                 type: integer
 *                 example: 1
 *               tipo_evento:
 *                 type: string
 *                 enum:
 *                   - boda
 *                   - cumpleanos
 *                   - ejecutivo
 *                   - convivio
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-21"
 *               hora_inicio:
 *                 type: string
 *                 example: "11:00"
 *               hora_fin:
 *                 type: string
 *                 example: "15:00"
 *               numero_invitados:
 *                 type: integer
 *                 minimum: 1
 *                 example: 180
 *     responses:
 *       200:
 *         description: Reserva actualizada correctamente
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
 *                 data:
 *                   $ref: '#/components/schemas/ReservaEvento'
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: El usuario no tiene acceso a esta reserva
 *       404:
 *         description: Reserva o salón no encontrados
 *       409:
 *         description: >
 *           Reserva no editable o existe un traslape con otra reserva.
 *       422:
 *         description: Regla de negocio incumplida
 */
router.patch(
  "/:id",
  validateParams(idParamSchema),
  validateBody(
    updateReservaEventoSchema
  ),
  reservaEventoController.update
);

/**
 * @openapi
 * /api/reservas-evento/{id}/cancelar:
 *   patch:
 *     tags:
 *       - Reservas de Evento
 *     summary: Cancelar una reserva de evento
 *     description: >
 *       Cambia el estado de la reserva a cancelada sin eliminar
 *       su información histórica.
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
 *                   example: Reserva de evento cancelada correctamente
 *                 data:
 *                   $ref: '#/components/schemas/ReservaEvento'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: El usuario no tiene acceso a esta reserva
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: La reserva ya está cancelada o expirada
 */
router.patch(
  "/:id/cancelar",
  validateParams(idParamSchema),
  reservaEventoController.cancel
);

export default router;