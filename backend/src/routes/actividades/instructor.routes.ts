import { Router } from "express";
import * as instructorController from "../../controllers/actividades/instructor.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createInstructorSchema, updateInstructorSchema } from "../../validators/actividades/instructor.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();
/**
 * @openapi
 * /api/instructores:
 *   get:
 *     tags:
 *       - Instructores
 *     summary: Listar instructores
 *     description: Endpoint público para consultar instructores.
 *     responses:
 *       200:
 *         description: Instructores obtenidos correctamente
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
 *                     $ref: '#/components/schemas/Instructor'
 */
router.get("/", instructorController.getAll);
/**
 * @openapi
 * /api/instructores/{id}:
 *   get:
 *     tags:
 *       - Instructores
 *     summary: Obtener un instructor por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Instructor encontrado
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Instructor no encontrado
 */
router.get("/:id", validateParams(idParamSchema), instructorController.getById);

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

/**
 * @openapi
 * /api/instructores:
 *   post:
 *     tags:
 *       - Instructores
 *     summary: Crear un instructor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInstructorRequest'
 *     responses:
 *       201:
 *         description: Instructor creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 */
router.post("/", validateBody(createInstructorSchema), instructorController.create);
/**
 * @openapi
 * /api/instructores/{id}:
 *   patch:
 *     tags:
 *       - Instructores
 *     summary: Actualizar un instructor
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
 *             $ref: '#/components/schemas/UpdateInstructorRequest'
 *     responses:
 *       200:
 *         description: Instructor actualizado correctamente
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Instructor no encontrado
 */
router.patch("/:id", validateParams(idParamSchema), validateBody(updateInstructorSchema), instructorController.update);
/**
 * @openapi
 * /api/instructores/{id}:
 *   delete:
 *     tags:
 *       - Instructores
 *     summary: Eliminar un instructor
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
 *         description: Instructor eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Instructor no encontrado
 *       409:
 *         description: El instructor tiene reservas asociadas
 */
router.delete("/:id", validateParams(idParamSchema), instructorController.remove);

export default router;