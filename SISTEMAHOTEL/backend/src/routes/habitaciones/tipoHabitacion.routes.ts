import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";
import { ROLES } from "../../constants/roles";
import * as tipoHabitacionController
  from "../../controllers/habitaciones/tipoHabitacion.controller";
import {
  createTipoHabitacionSchema,
  updateTipoHabitacionSchema,
  tipoHabitacionIdSchema,
} from "../../validators/habitaciones/tipoHabitacion.validator";

const router = Router();

const rolesGestionHabitaciones = [
  ROLES.ADMIN,
  ROLES.RECEPCIONISTA,
  ROLES.GERENTE_HABITACIONES,
];

/**
 * @openapi
 * /api/tipos-habitacion:
 *   get:
 *     tags:
 *       - Tipos de Habitación
 *     summary: Listar tipos de habitación
 *     description: Obtiene todos los tipos de habitación registrados.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tipos de habitación obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer, example: 1 }
 *                       nombre: { type: string, example: Suite }
 *                       capacidad_maxima: { type: integer, example: 4 }
 *                       tarifa_noche: { type: number, example: 150.00 }
 *                       descripcion: { type: string, example: Suite con vista al mar }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", authMiddleware, tipoHabitacionController.getAllTipoHabitaciones);

/**
 * @openapi
 * /api/tipos-habitacion/{id}:
 *   get:
 *     tags:
 *       - Tipos de Habitación
 *     summary: Obtener un tipo de habitación por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *         description: ID del tipo de habitación
 *     responses:
 *       200:
 *         description: Tipo de habitación obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: integer, example: 1 }
 *                 nombre: { type: string, example: Suite }
 *                 capacidad_maxima: { type: integer, example: 4 }
 *                 tarifa_noche: { type: number, example: 150.00 }
 *                 descripcion: { type: string, example: Suite con vista al mar }
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Tipo de habitación no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get(
  "/:id",
  authMiddleware,
  validateParams(tipoHabitacionIdSchema),
  tipoHabitacionController.getTipoHabitacionById
);

/**
 * @openapi
 * /api/tipos-habitacion:
 *   post:
 *     tags:
 *       - Tipos de Habitación
 *     summary: Crear un tipo de habitación
 *     description: Crea un nuevo tipo de habitación. Requiere un rol autorizado.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, capacidad_maxima, tarifa_noche]
 *             properties:
 *               nombre: { type: string, maxLength: 50, example: Suite }
 *               capacidad_maxima: { type: integer, minimum: 1, example: 4 }
 *               tarifa_noche: { type: number, minimum: 0, example: 150.00 }
 *               descripcion: { type: string, example: Suite con vista al mar }
 *     responses:
 *       201:
 *         description: Tipo de habitación creado correctamente
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  "/",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateBody(createTipoHabitacionSchema),
  tipoHabitacionController.createTipoHabitacion
);

/**
 * @openapi
 * /api/tipos-habitacion/{id}:
 *   patch:
 *     tags:
 *       - Tipos de Habitación
 *     summary: Actualizar un tipo de habitación
 *     description: Actualiza parcialmente un tipo de habitación. Requiere un rol autorizado.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string, maxLength: 50 }
 *               capacidad_maxima: { type: integer, minimum: 1 }
 *               tarifa_noche: { type: number, minimum: 0 }
 *               descripcion: { type: string }
 *     responses:
 *       200:
 *         description: Tipo de habitación actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Tipo de habitación no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateParams(tipoHabitacionIdSchema),
  validateBody(updateTipoHabitacionSchema),
  tipoHabitacionController.updateTipoHabitacion
);

/**
 * @openapi
 * /api/tipos-habitacion/{id}:
 *   delete:
 *     tags:
 *       - Tipos de Habitación
 *     summary: Eliminar un tipo de habitación
 *     description: Elimina un tipo de habitación que no esté en uso.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Tipo de habitación eliminado correctamente
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Tipo de habitación no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: El tipo de habitación está en uso
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateParams(tipoHabitacionIdSchema),
  tipoHabitacionController.deleteTipoHabitacion
);

export default router;
