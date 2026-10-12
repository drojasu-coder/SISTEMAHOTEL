import { Router } from "express";
import * as reservaActividadController from "../../controllers/actividades/reservaActividad.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createReservaActividadSchema, updateReservaActividadSchema } from "../../validators/actividades/reservaActividad.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

// Todas las reservas exigen inicio de sesión
router.use(authMiddleware);

// Un cliente o admin puede crear una reserva
/**
 * @openapi
 * /api/reservas-actividad:
 *   post:
 *     tags:
 *       - Reservas de Actividad
 *     summary: Crear una reserva de actividad
 *     description: >
 *       Permite a un cliente reservar un recurso para una actividad.
 *       La duración debe ser entre 30 y 120 minutos. El sistema evita
 *       traslapes tanto del recurso como del instructor y verifica que,
 *       si se seleccionó instructor, se encuentre activo.
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
 *         description: Solo clientes pueden reservar
 *       404:
 *         description: Recurso o instructor no encontrado
 *       409:
 *         description: Recurso o instructor ocupado en ese horario
 *       422:
 *         description: >
 *           Fecha pasada, duración inválida o instructor inactivo
 */
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

// Solo administradores (o encargados) pueden ver todas las reservas globales
/**
 * @openapi
 * /api/reservas-actividad:
 *   get:
 *     tags:
 *       - Reservas de Actividad
 *     summary: Listar todas las reservas de actividad
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
 *         description: Solo administradores
 */
router.get(
  "/",
  requireRole(ROLES.ADMIN),
  reservaActividadController.getAll
);

/**
 * @openapi
 * /api/reservas-actividad/{id}:
 *   get:
 *     tags:
 *       - Reservas de Actividad
 *     summary: Obtener una reserva de actividad por ID
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
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  reservaActividadController.getById
);

// Actualizar estado (ej. cancelada)
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
 *         description: Solo administradores
 *       404:
 *         description: Reserva no encontrada
 */
router.patch(
  "/:id/estado",
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  validateBody(updateReservaActividadSchema),
  reservaActividadController.updateStatus
);

export default router;