import { Router } from "express";
import * as controller from "../../controllers/bienestar/citaSpa.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createCitaSpaSchema, updateCitaSpaSchema } from "../../validators/bienestar/citaSpa.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/citas-spa:
 *   post:
 *     tags:
 *       - Citas de Bienestar
 *     summary: Crear una cita de bienestar
 *     description: >
 *       Permite a un cliente reservar un servicio con un terapeuta.
 *       La duración se obtiene automáticamente del servicio y hora_fin
 *       es calculada por el backend. El terapeuta debe existir y estar
 *       activo. El sistema evita traslapes y exige un buffer de 15
 *       minutos entre citas.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCitaBienestarRequest'
 *     responses:
 *       201:
 *         description: Cita creada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo clientes pueden reservar
 *       404:
 *         description: Terapeuta o servicio no encontrado
 *       409:
 *         description: Terapeuta ocupado o dentro de su tiempo de preparación
 *       422:
 *         description: El terapeuta seleccionado está inactivo
 */
router.post(
  "/",
  requireRole(
    ROLES.CLIENTE
  ),
  validateBody(
    createCitaSpaSchema
  ),
  controller.create
);

/**
 * @openapi
 * /api/citas-spa:
 *   get:
 *     tags:
 *       - Citas de Bienestar
 *     summary: Listar todas las citas de bienestar
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Citas obtenidas correctamente
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
 *                     $ref: '#/components/schemas/CitaBienestar'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 */
router.get("/", requireRole(ROLES.ADMIN), controller.getAll);
/**
 * @openapi
 * /api/citas-spa/{id}:
 *   get:
 *     tags:
 *       - Citas de Bienestar
 *     summary: Obtener una cita de bienestar por ID
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
 *         description: Cita encontrada
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Cita no encontrada
 */
router.get("/:id", requireRole(ROLES.ADMIN), validateParams(idParamSchema), controller.getById);
/**
 * @openapi
 * /api/citas-spa/{id}/estado:
 *   patch:
 *     tags:
 *       - Citas de Bienestar
 *     summary: Actualizar el estado de una cita de bienestar
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
 *             $ref: '#/components/schemas/UpdateCitaBienestarEstadoRequest'
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Estado o ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Cita no encontrada
 */
router.patch("/:id/estado", requireRole(ROLES.ADMIN), validateParams(idParamSchema), validateBody(updateCitaSpaSchema), controller.updateStatus);

export default router;