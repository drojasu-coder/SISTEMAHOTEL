import { Router } from "express";
import * as recursoController from "../../controllers/actividades/recursoActividad.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createRecursoActividadSchema, updateRecursoActividadSchema } from "../../validators/actividades/recursoActividad.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

/**
 * @openapi
 * /api/recursos-actividad:
 *   get:
 *     tags:
 *       - Recursos de Actividad
 *     summary: Listar recursos de actividad
 *     description: Endpoint público para consultar los recursos disponibles.
 *     responses:
 *       200:
 *         description: Recursos obtenidos correctamente
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
 *                     $ref: '#/components/schemas/RecursoActividad'
 */
router.get("/", recursoController.getAll);
/**
 * @openapi
 * /api/recursos-actividad/{id}:
 *   get:
 *     tags:
 *       - Recursos de Actividad
 *     summary: Obtener un recurso de actividad
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Recurso encontrado
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Recurso no encontrado
 */
router.get("/:id", validateParams(idParamSchema), recursoController.getById);

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

/**
 * @openapi
 * /api/recursos-actividad:
 *   post:
 *     tags:
 *       - Recursos de Actividad
 *     summary: Crear un recurso de actividad
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecursoActividadRequest'
 *     responses:
 *       201:
 *         description: Recurso creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: La sucursal indicada no existe
 */
router.post("/", validateBody(createRecursoActividadSchema), recursoController.create);

/**
 * @openapi
 * /api/recursos-actividad/{id}:
 *   patch:
 *     tags:
 *       - Recursos de Actividad
 *     summary: Actualizar un recurso de actividad
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
 *             $ref: '#/components/schemas/UpdateRecursoActividadRequest'
 *     responses:
 *       200:
 *         description: Recurso actualizado correctamente
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Recurso no encontrado
 */
router.patch("/:id", validateParams(idParamSchema), validateBody(updateRecursoActividadSchema), recursoController.update);
/**
 * @openapi
 * /api/recursos-actividad/{id}:
 *   delete:
 *     tags:
 *       - Recursos de Actividad
 *     summary: Eliminar un recurso de actividad
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
 *         description: Recurso eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Recurso no encontrado
 *       409:
 *         description: El recurso tiene reservas asociadas
 */
router.delete("/:id", validateParams(idParamSchema), recursoController.remove);

export default router;