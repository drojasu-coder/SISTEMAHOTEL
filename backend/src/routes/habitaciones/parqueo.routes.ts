import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { ROLES } from "../../constants/roles";
import * as parqueoController from "../../controllers/habitaciones/parqueo.controller";
import {
  createParqueoSchema,
  updateParqueoSchema,
  parqueoIdSchema,
} from "../../validators/habitaciones/parqueo.validator";

const router = Router();
const rolesGestionHabitaciones = [
  ROLES.ADMIN,
  ROLES.RECEPCIONISTA,
  ROLES.GERENTE_HABITACIONES,
];

/**
 * @openapi
 * /api/parqueos:
 *   get:
 *     tags: [Parqueos]
 *     summary: Listar parqueos
 *     description: Obtiene todos los parqueos registrados.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Parqueos obtenidos correctamente
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get("/", authMiddleware, parqueoController.getAllParqueos);

/**
 * @openapi
 * /api/parqueos/{id}:
 *   get:
 *     tags: [Parqueos]
 *     summary: Obtener un parqueo por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *         description: ID del parqueo
 *     responses:
 *       200:
 *         description: Parqueo obtenido correctamente
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
 *         description: Parqueo no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get("/:id", authMiddleware, validateParams(parqueoIdSchema), parqueoController.getParqueoById);

/**
 * @openapi
 * /api/parqueos:
 *   post:
 *     tags: [Parqueos]
 *     summary: Crear un parqueo
 *     description: Crea un nuevo parqueo. Requiere un rol autorizado.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sucursal_id, numero]
 *             properties:
 *               sucursal_id: { type: integer, minimum: 1, example: 1 }
 *               numero: { type: string, minLength: 1, maxLength: 10, example: "A-01" }
 *               estado: { type: string, enum: [disponible, ocupado, mantenimiento], example: disponible }
 *     responses:
 *       201:
 *         description: Parqueo creado correctamente
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
 *         description: Sucursal no encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Ya existe un parqueo con ese número en la sucursal
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post(
  "/",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateBody(createParqueoSchema),
  parqueoController.createParqueo
);

/**
 * @openapi
 * /api/parqueos/{id}:
 *   patch:
 *     tags: [Parqueos]
 *     summary: Actualizar un parqueo
 *     description: Actualiza parcialmente un parqueo. Requiere un rol autorizado.
 *     security: [{ bearerAuth: [] }]
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
 *               sucursal_id: { type: integer, minimum: 1 }
 *               numero: { type: string, minLength: 1, maxLength: 10 }
 *               estado: { type: string, enum: [disponible, ocupado, mantenimiento] }
 *     responses:
 *       200:
 *         description: Parqueo actualizado correctamente
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
 *         description: Parqueo o sucursal no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Ya existe un parqueo con ese número en la sucursal
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateParams(parqueoIdSchema),
  validateBody(updateParqueoSchema),
  parqueoController.updateParqueo
);

/**
 * @openapi
 * /api/parqueos/{id}:
 *   delete:
 *     tags: [Parqueos]
 *     summary: Eliminar un parqueo
 *     description: Elimina un parqueo que no tenga reservas asociadas.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Parqueo eliminado correctamente
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
 *         description: Parqueo no encontrado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: El parqueo tiene reservas asociadas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(...rolesGestionHabitaciones),
  validateParams(parqueoIdSchema),
  parqueoController.deleteParqueo
);

export default router;
