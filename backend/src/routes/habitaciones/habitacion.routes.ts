import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware";

import { ROLES } from "../../constants/roles";

import * as habitacionController from "../../controllers/habitaciones/habitacion.controller";

import {
  createHabitacionSchema,
  updateHabitacionSchema,
  habitacionIdSchema,
  disponibilidadHabitacionQuerySchema,
} from "../../validators/habitaciones/habitacion.validator";

const router = Router();

const rolesGestionHabitaciones = [
  ROLES.ADMIN,
  ROLES.RECEPCIONISTA,
  ROLES.GERENTE_HABITACIONES,
];

/**
 * @openapi
 * /api/habitaciones:
 *   get:
 *     tags:
 *       - Habitaciones
 *     summary: Listar habitaciones
 *     description: Obtiene todas las habitaciones registradas.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Habitaciones obtenidas correctamente
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
 *                   example: Habitaciones obtenidas correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       sucursal_id:
 *                         type: integer
 *                         example: 1
 *                       tipo_habitacion_id:
 *                         type: integer
 *                         example: 1
 *                       numero:
 *                         type: string
 *                         example: "101"
 *                       estado:
 *                         type: string
 *                         enum: [disponible, ocupada, mantenimiento, limpieza]
 *                         example: disponible
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
  habitacionController.getAllHabitaciones
);

/**
 * @openapi
 * /api/habitaciones/disponibles:
 *   get:
 *     tags:
 *       - Habitaciones
 *     summary: Consultar habitaciones disponibles
 *     description: Consulta las habitaciones disponibles para una sede, rango de fechas y número de huéspedes. Requiere autenticación.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la sucursal (entero positivo)
 *         example: 1
 *       - in: query
 *         name: fecha_entrada
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de entrada (AAAA-MM-DD)
 *         example: "2026-12-01"
 *       - in: query
 *         name: fecha_salida
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de salida posterior a la entrada (AAAA-MM-DD)
 *         example: "2026-12-05"
 *       - in: query
 *         name: numero_huespedes
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Número de huéspedes (entero positivo)
 *         example: 2
 *       - in: query
 *         name: tipo_habitacion_id
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filtro opcional por tipo de habitación
 *         example: 1
 *     responses:
 *       200:
 *         description: Habitaciones disponibles obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/DisponibilidadHabitacionesResponse"
 *       400:
 *         description: Parámetros inválidos o formato incorrecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ValidationErrorResponse"
 *       401:
 *         description: Usuario no autenticado (AUTH_TOKEN_REQUIRED, INVALID_AUTH_FORMAT, INVALID_TOKEN, TOKEN_EXPIRED)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Sucursal no encontrada (SUCURSAL_NOT_FOUND)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       422:
 *         description: Parámetros semánticamente inválidos (FECHAS_INVALIDAS, ROOM_RESERVATION_DATE_IN_PAST)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get(
  "/disponibles",
  authMiddleware,
  validateQuery(disponibilidadHabitacionQuerySchema),
  habitacionController.getHabitacionesDisponibles
);

/**
 * @openapi
 * /api/habitaciones/{id}:
 *   get:
 *     tags:
 *       - Habitaciones
 *     summary: Obtener una habitación por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la habitación
 *     responses:
 *       200:
 *         description: Habitación obtenida correctamente
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
 *                   type: object
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
 *       404:
 *         description: Habitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  authMiddleware,
  validateParams(habitacionIdSchema),
  habitacionController.getHabitacionById
);

/**
 * @openapi
 * /api/habitaciones:
 *   post:
 *     tags:
 *       - Habitaciones
 *     summary: Crear una habitación
 *     description: Crea una nueva habitación. Requiere un rol autorizado.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sucursal_id
 *               - tipo_habitacion_id
 *               - numero
 *             properties:
 *               sucursal_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               tipo_habitacion_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               numero:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10
 *                 example: "101"
 *               estado:
 *                 type: string
 *                 enum: [disponible, ocupada, mantenimiento, limpieza]
 *                 example: disponible
 *     responses:
 *       201:
 *         description: Habitación creada correctamente
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
 *                   type: object
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
 *       404:
 *         description: Sucursal o tipo de habitación no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Ya existe una habitación con ese número en la sucursal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateBody(createHabitacionSchema),
  habitacionController.createHabitacion
);

/**
 * @openapi
 * /api/habitaciones/{id}:
 *   patch:
 *     tags:
 *       - Habitaciones
 *     summary: Actualizar una habitación
 *     description: Actualiza parcialmente una habitación. Requiere un rol autorizado.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la habitación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sucursal_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               tipo_habitacion_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               numero:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10
 *                 example: "101"
 *               estado:
 *                 type: string
 *                 enum: [disponible, ocupada, mantenimiento, limpieza]
 *                 example: ocupada
 *     responses:
 *       200:
 *         description: Habitación actualizada correctamente
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
 *                   type: object
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
 *       404:
 *         description: Habitación, sucursal o tipo de habitación no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Ya existe una habitación con ese número en la sucursal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateParams(habitacionIdSchema),
  validateBody(updateHabitacionSchema),
  habitacionController.updateHabitacion
);

/**
 * @openapi
 * /api/habitaciones/{id}:
 *   delete:
 *     tags:
 *       - Habitaciones
 *     summary: Eliminar una habitación
 *     description: Elimina una habitación. Requiere un rol autorizado.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la habitación
 *     responses:
 *       200:
 *         description: Habitación eliminada correctamente
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
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Habitación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateParams(habitacionIdSchema),
  habitacionController.deleteHabitacion
);

export default router;