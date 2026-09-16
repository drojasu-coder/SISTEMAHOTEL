import { Router } from "express";

import * as servicioEventoController
  from "../../controllers/eventos/servicioEvento.controller";

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

import {
  createServicioEventoSchema,
  updateServicioEventoSchema,
} from "../../validators/eventos/servicioEvento.validator";

import { idParamSchema }
  from "../../validators/common.validator";

const router = Router();

/**
 * @openapi
 * /api/servicios-evento:
 *   get:
 *     tags:
 *       - Servicios de Evento
 *     summary: Listar servicios de evento
 *     description: Obtiene todos los servicios disponibles para eventos.
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
 *                   example: Servicios de evento obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServicioEvento'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/*
 * CONSULTA PÚBLICA
 */

router.get(
  "/",
  servicioEventoController.getAll
);

/**
 * @openapi
 * /api/servicios-evento/{id}:
 *   get:
 *     tags:
 *       - Servicios de Evento
 *     summary: Obtener un servicio de evento por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del servicio de evento
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
 *                 data:
 *                   $ref: '#/components/schemas/ServicioEvento'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Servicio no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.get(
  "/:id",
  validateParams(idParamSchema),
  servicioEventoController.getById
);

/*
 * ADMINISTRACIÓN
 */

/**
 * @openapi
 * /api/servicios-evento:
 *   post:
 *     tags:
 *       - Servicios de Evento
 *     summary: Crear un servicio de evento
 *     description: Crea un nuevo servicio. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - precio
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Catering premium
 *               precio:
 *                 type: number
 *                 minimum: 0
 *                 example: 750.00
 *     responses:
 *       201:
 *         description: Servicio creado correctamente
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
 *                 data:
 *                   $ref: '#/components/schemas/ServicioEvento'
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
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateBody(createServicioEventoSchema),
  servicioEventoController.create
);

/**
 * @openapi
 * /api/servicios-evento/{id}:
 *   patch:
 *     tags:
 *       - Servicios de Evento
 *     summary: Actualizar un servicio de evento
 *     description: Actualiza parcialmente un servicio. Requiere rol administrador.
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
 *               nombre:
 *                 type: string
 *                 example: Catering ejecutivo
 *               precio:
 *                 type: number
 *                 example: 850.00
 *     responses:
 *       200:
 *         description: Servicio actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Servicio no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.patch(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  validateBody(updateServicioEventoSchema),
  servicioEventoController.update
);

/**
 * @openapi
 * /api/servicios-evento/{id}:
 *   delete:
 *     tags:
 *       - Servicios de Evento
 *     summary: Eliminar un servicio de evento
 *     description: Elimina un servicio si no está asociado a reservas existentes.
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
 *       204:
 *         description: Servicio eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Servicio no encontrado
 *       409:
 *         description: El servicio está siendo utilizado por una reserva
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.delete(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  servicioEventoController.remove
);

export default router;

