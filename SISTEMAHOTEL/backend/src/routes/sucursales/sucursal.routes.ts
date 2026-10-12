import { Router } from "express";

import * as sucursalController from "../../controllers/sucursales/sucursal.controller";

import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";

import {
  createSucursalSchema,
  updateSucursalSchema,
} from "../../validators/sucursales/sucursal.validator";

import { idParamSchema } from "../../validators/common.validator";

const router = Router();

/*
 * CONSULTA PÚBLICA
 */

/**
 * @openapi
 * /api/sucursales:
 *   get:
 *     tags:
 *       - Sucursales
 *     summary: Listar sucursales
 *     description: Obtiene todas las sucursales disponibles.
 *     responses:
 *       200:
 *         description: Sucursales obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sucursal'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  sucursalController.getAll
);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   get:
 *     tags:
 *       - Sucursales
 *     summary: Obtener una sucursal por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Sucursal obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Sucursal'
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Sucursal no encontrada
 */
router.get(
  "/:id",
  validateParams(idParamSchema),
  sucursalController.getById
);

/*
 * ADMINISTRACIÓN
 */

/**
 * @openapi
 * /api/sucursales:
 *   post:
 *     tags:
 *       - Sucursales
 *     summary: Crear una sucursal
 *     description: Crea una nueva sucursal. Requiere rol administrador.
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
 *                 example: Sucursal Central
 *               direccion:
 *                 type: string
 *                 example: Zona 10, Ciudad
 *     responses:
 *       201:
 *         description: Sucursal creada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 */
router.post(
  "/",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateBody(createSucursalSchema),
  sucursalController.create
);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   patch:
 *     tags:
 *       - Sucursales
 *     summary: Actualizar una sucursal
 *     description: Actualiza parcialmente una sucursal. Requiere rol administrador.
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
 *               activa:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Sucursal actualizada correctamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Sucursal no encontrada
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  validateBody(updateSucursalSchema),
  sucursalController.update
);

/**
 * @openapi
 * /api/sucursales/{id}:
 *   delete:
 *     tags:
 *       - Sucursales
 *     summary: Eliminar una sucursal
 *     description: Elimina una sucursal si no está asociada a habitaciones existentes.
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
 *         description: Sucursal eliminada correctamente
 *       404:
 *         description: Sucursal no encontrada
 *       409:
 *         description: La sucursal está siendo utilizada
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  sucursalController.remove
);

export default router;