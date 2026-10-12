import { Router } from "express";
import * as controller from "../../controllers/bienestar/servicioSpa.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createServicioSpaSchema, updateServicioSpaSchema } from "../../validators/bienestar/servicioSpa.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

/**
 * @openapi
 * /api/servicios-spa:
 *   get:
 *     tags:
 *       - Servicios de Bienestar
 *     summary: Listar servicios de bienestar
 *     description: Endpoint público con duración y precio de cada servicio.
 *     responses:
 *       200:
 *         description: Servicios obtenidos correctamente
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
 *                     $ref: '#/components/schemas/ServicioBienestar'
 */
router.get("/", controller.getAll);
/**
 * @openapi
 * /api/servicios-spa/{id}:
 *   get:
 *     tags:
 *       - Servicios de Bienestar
 *     summary: Obtener un servicio de bienestar por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Servicio encontrado
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Servicio no encontrado
 */
router.get("/:id", validateParams(idParamSchema), controller.getById);

router.use(authMiddleware);
router.use(requireRole(ROLES.ADMIN));

/**
 * @openapi
 * /api/servicios-spa:
 *   post:
 *     tags:
 *       - Servicios de Bienestar
 *     summary: Crear un servicio de bienestar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateServicioBienestarRequest'
 *     responses:
 *       201:
 *         description: Servicio creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 */
router.post("/", validateBody(createServicioSpaSchema), controller.create);
/**
 * @openapi
 * /api/servicios-spa/{id}:
 *   patch:
 *     tags:
 *       - Servicios de Bienestar
 *     summary: Actualizar un servicio de bienestar
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
 *             $ref: '#/components/schemas/UpdateServicioBienestarRequest'
 *     responses:
 *       200:
 *         description: Servicio actualizado correctamente
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Servicio no encontrado
 */
router.patch("/:id", validateParams(idParamSchema), validateBody(updateServicioSpaSchema), controller.update);
/**
 * @openapi
 * /api/servicios-spa/{id}:
 *   delete:
 *     tags:
 *       - Servicios de Bienestar
 *     summary: Eliminar un servicio de bienestar
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
 *         description: Servicio eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Servicio no encontrado
 *       409:
 *         description: El servicio tiene citas asociadas
 */
router.delete("/:id", validateParams(idParamSchema), controller.remove);

export default router;