import { Router } from "express";

import {
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware";

import * as publicHabitacionController from "../../controllers/habitaciones/publicHabitacion.controller";

import {
  habitacionIdSchema,
  disponibilidadHabitacionQuerySchema,
} from "../../validators/habitaciones/habitacion.validator";

const router = Router();

/**
 * @openapi
 * /api/public/habitaciones:
 *   get:
 *     tags:
 *       - Habitaciones Públicas
 *     summary: Listar habitaciones públicas (sin autenticación)
 *     description: Obtiene el catálogo público de habitaciones con información sanitizada. No requiere token.
 *     security: []
 *     responses:
 *       200:
 *         description: Habitaciones públicas obtenidas correctamente
 */
router.get(
  "/habitaciones",
  publicHabitacionController.getPublicHabitaciones
);

/**
 * @openapi
 * /api/public/habitaciones/disponibles:
 *   get:
 *     tags:
 *       - Habitaciones Públicas
 *     summary: Consultar habitaciones disponibles públicas (sin autenticación)
 *     description: Consulta las habitaciones disponibles para una sede, rango de fechas y número de huéspedes. No requiere token.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: sucursal_id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: fecha_entrada
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: fecha_salida
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: numero_huespedes
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: tipo_habitacion_id
 *         required: false
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Habitaciones disponibles obtenidas correctamente
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Sucursal no encontrada
 *       422:
 *         description: Parámetros semánticamente inválidos
 */
router.get(
  "/habitaciones/disponibles",
  validateQuery(disponibilidadHabitacionQuerySchema),
  publicHabitacionController.getPublicHabitacionesDisponibles
);

/**
 * @openapi
 * /api/public/habitaciones/{id}:
 *   get:
 *     tags:
 *       - Habitaciones Públicas
 *     summary: Obtener una habitación pública por ID (sin autenticación)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Habitación obtenida correctamente
 *       404:
 *         description: Habitación no encontrada
 */
router.get(
  "/habitaciones/:id",
  validateParams(habitacionIdSchema),
  publicHabitacionController.getPublicHabitacionById
);

/**
 * @openapi
 * /api/public/tipos-habitacion:
 *   get:
 *     tags:
 *       - Habitaciones Públicas
 *     summary: Listar categorías comerciales públicas (sin autenticación)
 *     description: Solo tipos con sede e inventario. "nombre" es el nombre comercial; "sucursal_id" identifica la sede; "habitacion_referencia_id" sirve para enlazar el detalle.
 *     security: []
 *     parameters:
 *       - { in: query, name: sucursal_id, schema: { type: integer }, description: Filtra por sede }
 *     responses:
 *       200:
 *         description: Tipos de habitación obtenidos correctamente
 */
router.get(
  "/tipos-habitacion",
  publicHabitacionController.getPublicTipoHabitaciones
);

export default router;
