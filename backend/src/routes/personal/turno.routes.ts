import { Router }
  from "express";

import * as turnoController
  from "../../controllers/personal/turno.controller";

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

import { idParamSchema }
  from "../../validators/common.validator";

import {
  createTurnoSchema,
  updateTurnoSchema,
} from "../../validators/personal/turno.validator";

const router = Router();

router.use(
  authMiddleware,
  requireRole(
    ROLES.ADMIN
  )
);

/**
 * @openapi
 * /api/turnos:
 *   get:
 *     tags:
 *       - Turnos
 *     summary: Listar turnos
 *     description: Obtiene todos los turnos registrados. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Turnos obtenidos correctamente
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
 *                   example: Turnos obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Turno'
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
router.get(
  "/",
  turnoController.getAll
);

/**
 * @openapi
 * /api/turnos/{id}:
 *   get:
 *     tags:
 *       - Turnos
 *     summary: Obtener un turno por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del turno
 *     responses:
 *       200:
 *         description: Turno obtenido correctamente
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
 *                   example: Turno obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Turno'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Turno no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  validateParams(
    idParamSchema
  ),
  turnoController.getById
);

/**
 * @openapi
 * /api/turnos:
 *   post:
 *     tags:
 *       - Turnos
 *     summary: Crear un turno
 *     description: >
 *       Asigna un turno a un empleado. El sistema impide traslapes
 *       de horarios para un mismo empleado y admite turnos nocturnos,
 *       por ejemplo 22:00 a 06:00.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empleado_id
 *               - fecha
 *               - hora_inicio
 *               - hora_fin
 *             properties:
 *               empleado_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-10"
 *               hora_inicio:
 *                 type: string
 *                 example: "08:00"
 *               hora_fin:
 *                 type: string
 *                 example: "16:00"
 *     responses:
 *       201:
 *         description: Turno creado correctamente
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
 *                   example: Turno creado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Turno'
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
 *         description: Empleado no encontrado
 *       409:
 *         description: El empleado ya posee un turno que se traslapa con el horario solicitado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: La hora de inicio y finalización son iguales
 */
router.post(
  "/",
  validateBody(
    createTurnoSchema
  ),
  turnoController.create
);

/**
 * @openapi
 * /api/turnos/{id}:
 *   patch:
 *     tags:
 *       - Turnos
 *     summary: Actualizar un turno
 *     description: >
 *       Permite modificar fecha y horario. El empleado asociado al turno
 *       no puede reasignarse. La disponibilidad vuelve a validarse para
 *       impedir traslapes.
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
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-10-11"
 *               hora_inicio:
 *                 type: string
 *                 example: "09:00"
 *               hora_fin:
 *                 type: string
 *                 example: "17:00"
 *     responses:
 *       200:
 *         description: Turno actualizado correctamente
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
 *                   example: Turno actualizado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Turno'
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Turno no encontrado
 *       409:
 *         description: El horario se traslapa con otro turno del empleado
 *       422:
 *         description: Rango horario inválido
 */
router.patch(
  "/:id",
  validateParams(
    idParamSchema
  ),
  validateBody(
    updateTurnoSchema
  ),
  turnoController.update
);

/**
 * @openapi
 * /api/turnos/{id}:
 *   delete:
 *     tags:
 *       - Turnos
 *     summary: Eliminar un turno
 *     description: Elimina definitivamente un turno registrado.
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
 *         description: Turno eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Turno no encontrado
 */
router.delete(
  "/:id",
  validateParams(
    idParamSchema
  ),
  turnoController.remove
);

export default router;