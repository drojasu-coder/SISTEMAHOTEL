import { Router } from "express";

import * as sucursalController from "../../modules/sucursales/sucursal.controller";

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
} from "../../modules/sucursales/sucursal.validator";

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
 *               $ref: '#/components/schemas/SucursalesResponse'
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
 *               $ref: '#/components/schemas/SucursalResponse'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Sucursal no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *             $ref: '#/components/schemas/CreateSucursalRequest'
 *     responses:
 *       201:
 *         description: Sucursal creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SucursalResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflicto al crear la sucursal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *             $ref: '#/components/schemas/UpdateSucursalRequest'
 *     responses:
 *       200:
 *         description: Sucursal actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SucursalResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sucursal no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sucursal no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: La sucursal está siendo utilizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  sucursalController.remove
);

export default router;
