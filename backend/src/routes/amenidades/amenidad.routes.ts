import { Router } from "express";
import * as amenidadController from "../../controllers/amenidades/amenidad.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createAmenidadSchema, updateAmenidadSchema } from "../../validators/amenidades/amenidad.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

/**
 * @openapi
 * /api/amenidades:
 *   get:
 *     tags:
 *       - Amenidades
 *     summary: Listar amenidades
 *     description: Endpoint público para consultar las amenidades disponibles.
 *     responses:
 *       200:
 *         description: Amenidades obtenidas correctamente
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
 *                     $ref: '#/components/schemas/Amenidad'
 */
router.get("/", amenidadController.getAll);
/**
 * @openapi
 * /api/amenidades/{id}:
 *   get:
 *     tags:
 *       - Amenidades
 *     summary: Obtener una amenidad por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Amenidad encontrada
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Amenidad no encontrada
 */
router.get("/:id", validateParams(idParamSchema), amenidadController.getById);

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

/**
 * @openapi
 * /api/amenidades:
 *   post:
 *     tags:
 *       - Amenidades
 *     summary: Crear una amenidad
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAmenidadRequest'
 *     responses:
 *       201:
 *         description: Amenidad creada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Sucursal no encontrada
 */
router.post("/", validateBody(createAmenidadSchema), amenidadController.create);
/**
 * @openapi
 * /api/amenidades/{id}:
 *   patch:
 *     tags:
 *       - Amenidades
 *     summary: Actualizar una amenidad
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
 *             $ref: '#/components/schemas/UpdateAmenidadRequest'
 *     responses:
 *       200:
 *         description: Amenidad actualizada correctamente
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Amenidad no encontrada
 */
router.patch("/:id", validateParams(idParamSchema), validateBody(updateAmenidadSchema), amenidadController.update);
/**
 * @openapi
 * /api/amenidades/{id}:
 *   delete:
 *     tags:
 *       - Amenidades
 *     summary: Eliminar una amenidad
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
 *         description: Amenidad eliminada correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Amenidad no encontrada
 *       409:
 *         description: La amenidad tiene reservas asociadas
 */
router.delete("/:id", validateParams(idParamSchema), amenidadController.remove);

export default router;