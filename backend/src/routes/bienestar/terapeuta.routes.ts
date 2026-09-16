import { Router } from "express";
import * as controller from "../../controllers/bienestar/terapeuta.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createTerapeutaSchema, updateTerapeutaSchema } from "../../validators/bienestar/terapeuta.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

/**
 * @openapi
 * /api/terapeutas:
 *   get:
 *     tags:
 *       - Terapeutas
 *     summary: Listar terapeutas
 *     description: Endpoint público para consultar los terapeutas registrados.
 *     responses:
 *       200:
 *         description: Terapeutas obtenidos correctamente
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
 *                     $ref: '#/components/schemas/Terapeuta'
 */
router.get("/", controller.getAll);
/**
 * @openapi
 * /api/terapeutas/{id}:
 *   get:
 *     tags:
 *       - Terapeutas
 *     summary: Obtener un terapeuta por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Terapeuta encontrado
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Terapeuta no encontrado
 */
router.get("/:id", validateParams(idParamSchema), controller.getById);

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

/**
 * @openapi
 * /api/terapeutas:
 *   post:
 *     tags:
 *       - Terapeutas
 *     summary: Crear un terapeuta
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTerapeutaRequest'
 *     responses:
 *       201:
 *         description: Terapeuta creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 */
router.post("/", validateBody(createTerapeutaSchema), controller.create);
/**
 * @openapi
 * /api/terapeutas/{id}:
 *   patch:
 *     tags:
 *       - Terapeutas
 *     summary: Actualizar un terapeuta
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
 *             $ref: '#/components/schemas/UpdateTerapeutaRequest'
 *     responses:
 *       200:
 *         description: Terapeuta actualizado correctamente
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Terapeuta no encontrado
 */
router.patch("/:id", validateParams(idParamSchema), validateBody(updateTerapeutaSchema), controller.update);
/**
 * @openapi
 * /api/terapeutas/{id}:
 *   delete:
 *     tags:
 *       - Terapeutas
 *     summary: Eliminar un terapeuta
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
 *         description: Terapeuta eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Terapeuta no encontrado
 *       409:
 *         description: El terapeuta tiene citas asociadas
 */
router.delete("/:id", validateParams(idParamSchema), controller.remove);

export default router;