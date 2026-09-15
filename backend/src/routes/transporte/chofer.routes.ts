import { Router }
  from "express";

import * as choferController
  from "../../controllers/transporte/chofer.controller";

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
  createChoferSchema,
  updateChoferEstadoSchema,
  updateChoferSchema,
} from "../../validators/transporte/chofer.validator";

const router = Router();

router.use(
  authMiddleware,
  requireRole(ROLES.ADMIN)
);

/**
 * @openapi
 * /api/choferes:
 *   get:
 *     tags:
 *       - Choferes
 *     summary: Listar choferes
 *     description: Obtiene todos los choferes registrados. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Choferes obtenidos correctamente
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
 *                   example: Choferes obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Chofer'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 */
router.get(
  "/",
  choferController.getAll
);

/**
 * @openapi
 * /api/choferes/{id}:
 *   get:
 *     tags:
 *       - Choferes
 *     summary: Obtener un chofer por ID
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
 *         description: Chofer obtenido correctamente
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
 *                   example: Chofer obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Chofer'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Chofer no encontrado
 */
router.get(
  "/:id",
  validateParams(idParamSchema),
  choferController.getById
);

/**
 * @openapi
 * /api/choferes:
 *   post:
 *     tags:
 *       - Choferes
 *     summary: Registrar un chofer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Luis Pérez
 *               licencia:
 *                 type: string
 *                 nullable: true
 *                 example: A-123456
 *     responses:
 *       201:
 *         description: Chofer creado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 */
router.post(
  "/",
  validateBody(
    createChoferSchema
  ),
  choferController.create
);

/**
 * @openapi
 * /api/choferes/{id}:
 *   patch:
 *     tags:
 *       - Choferes
 *     summary: Actualizar datos de un chofer
 *     description: Permite modificar nombre y licencia.
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
 *               nombre:
 *                 type: string
 *                 example: Luis Alberto Pérez
 *               licencia:
 *                 type: string
 *                 nullable: true
 *                 example: A-654321
 *     responses:
 *       200:
 *         description: Chofer actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Chofer no encontrado
 */
router.patch(
  "/:id",
  validateParams(idParamSchema),
  validateBody(
    updateChoferSchema
  ),
  choferController.update
);

/**
 * @openapi
 * /api/choferes/{id}/estado:
 *   patch:
 *     tags:
 *       - Choferes
 *     summary: Activar o desactivar un chofer
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
 *             required:
 *               - activo
 *             properties:
 *               activo:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Estado del chofer actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Chofer no encontrado
 */
router.patch(
  "/:id/estado",
  validateParams(idParamSchema),
  validateBody(
    updateChoferEstadoSchema
  ),
  choferController.updateStatus
);

export default router;