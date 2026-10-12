import { Router } from "express";

import * as mesaController from "../../controllers/restaurante/mesa.controller";

import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";

import {
  createMesaSchema,
  updateMesaSchema,
} from "../../validators/restaurante/mesa.validator";

import { idParamSchema } from "../../validators/common.validator";

const router = Router();


/**
 * @openapi
 * /api/mesas:
 *   get:
 *     tags:
 *       - Mesas
 *     summary: Listar mesas
 *     description: Obtiene todas las mesas disponibles en el restaurante.
 *     responses:
 *       200:
 *         description: Mesas obtenidas correctamente
 */
router.get(
  "/",
  mesaController.getAll
);

/**
 * @openapi
 * /api/mesas/{id}:
 *   get:
 *     tags:
 *       - Mesas
 *     summary: Obtener una mesa por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Mesa obtenida correctamente
 *       404:
 *         description: Mesa no encontrada
 */
router.get(
  "/:id",
  validateParams(idParamSchema),
  mesaController.getById
);

/**
 * @openapi
 * /api/mesas:
 *   post:
 *     tags:
 *       - Mesas
 *     summary: Crear una mesa
 *     description: Crea una nueva mesa. Requiere rol administrador o gerente de restaurante.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sucursal_id
 *               - zona
 *               - capacidad
 *             properties:
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               zona:
 *                 type: string
 *                 example: Terraza
 *               capacidad:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       201:
 *         description: Mesa creada correctamente
 */
router.post(
  "/",
  authMiddleware,
  requireRole(ROLES.ADMIN, 'gerente_restaurante'),
  validateBody(createMesaSchema),
  mesaController.create
);

/**
 * @openapi
 * /api/mesas/{id}:
 *   patch:
 *     tags:
 *       - Mesas
 *     summary: Actualizar una mesa
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
 *               zona:
 *                 type: string
 *               capacidad:
 *                 type: integer
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mesa actualizada correctamente
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN, 'gerente_restaurante'),
  validateParams(idParamSchema),
  validateBody(updateMesaSchema),
  mesaController.update
);

/**
 * @openapi
 * /api/mesas/{id}:
 *   delete:
 *     tags:
 *       - Mesas
 *     summary: Eliminar una mesa
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
 *         description: Mesa eliminada correctamente
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN, 'gerente_restaurante'),
  validateParams(idParamSchema),
  mesaController.remove
);

export default router;