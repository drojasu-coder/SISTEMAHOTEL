import { Router }
  from "express";

import * as vehiculoController
  from "../../controllers/transporte/vehiculo.controller";

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
  createVehiculoSchema,
  updateVehiculoSchema,
} from "../../validators/transporte/vehiculo.validator";

const router = Router();

router.use(
  authMiddleware,
  requireRole(ROLES.ADMIN)
);

/**
 * @openapi
 * /api/vehiculos:
 *   get:
 *     tags:
 *       - Vehículos
 *     summary: Listar vehículos
 *     description: Obtiene todos los vehículos registrados. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehículos obtenidos correctamente
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
 *                   example: Vehículos obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehiculo'
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
 */
router.get(
  "/",
  vehiculoController.getAll
);

/**
 * @openapi
 * /api/vehiculos/{id}:
 *   get:
 *     tags:
 *       - Vehículos
 *     summary: Obtener un vehículo por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Vehículo obtenido correctamente
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
 *                   example: Vehículo obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Vehiculo'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Vehículo no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  validateParams(
    idParamSchema
  ),
  vehiculoController.getById
);

/**
 * @openapi
 * /api/vehiculos:
 *   post:
 *     tags:
 *       - Vehículos
 *     summary: Registrar un vehículo
 *     description: Registra un vehículo para el servicio de transporte. Requiere rol administrador.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *               - capacidad
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum:
 *                   - shuttle
 *                   - van
 *                   - sedan
 *                 example: van
 *               capacidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 12
 *               placa:
 *                 type: string
 *                 nullable: true
 *                 example: P-123ABC
 *     responses:
 *       201:
 *         description: Vehículo creado correctamente
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
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Vehículo creado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Vehiculo'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 */
router.post(
  "/",
  validateBody(
    createVehiculoSchema
  ),
  vehiculoController.create
);

/**
 * @openapi
 * /api/vehiculos/{id}:
 *   patch:
 *     tags:
 *       - Vehículos
 *     summary: Actualizar un vehículo
 *     description: Permite modificar tipo, capacidad o placa del vehículo.
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
 *               tipo:
 *                 type: string
 *                 enum:
 *                   - shuttle
 *                   - van
 *                   - sedan
 *                 example: shuttle
 *               capacidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 20
 *               placa:
 *                 type: string
 *                 nullable: true
 *                 example: C-999XYZ
 *     responses:
 *       200:
 *         description: Vehículo actualizado correctamente
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
 *                   example: Vehículo actualizado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Vehiculo'
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Vehículo no encontrado
 */
router.patch(
  "/:id",
  validateParams(
    idParamSchema
  ),
  validateBody(
    updateVehiculoSchema
  ),
  vehiculoController.update
);

/**
 * @openapi
 * /api/vehiculos/{id}:
 *   delete:
 *     tags:
 *       - Vehículos
 *     summary: Eliminar un vehículo
 *     description: >
 *       Elimina un vehículo únicamente cuando no tenga reservas de
 *       transporte asociadas.
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
 *         description: Vehículo eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Vehículo no encontrado
 *       409:
 *         description: El vehículo tiene reservas de transporte asociadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  validateParams(
    idParamSchema
  ),
  vehiculoController.remove
);

export default router;