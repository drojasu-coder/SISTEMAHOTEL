import { Router } from "express";

import * as salonController
  from "../../controllers/eventos/salon.controller";

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

import {
  createSalonSchema,
  updateSalonSchema,
} from "../../validators/eventos/salon.validators";

import { idParamSchema }
  from "../../validators/common.validator";

const router = Router();

/**
 * @openapi
 * /api/salones:
 *   get:
 *     tags:
 *       - Salones
 *     summary: Listar salones
 *     description: Obtiene todos los salones registrados junto con información básica de su sucursal.
 *     responses:
 *       200:
 *         description: Salones obtenidos correctamente
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
 *                   example: Salones obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Salon'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  salonController.getAll
);

/**
 * @openapi
 * /api/salones/{id}:
 *   get:
 *     tags:
 *       - Salones
 *     summary: Obtener un salón por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del salón
 *     responses:
 *       200:
 *         description: Salón obtenido correctamente
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
 *                   example: Salón obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Salon'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Salón no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  validateParams(idParamSchema),
  salonController.getById
);


/**
 * @openapi
 * /api/salones:
 *   post:
 *     tags:
 *       - Salones
 *     summary: Crear un salón
 *     description: Crea un nuevo salón. Requiere rol administrador.
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
 *               - nombre
 *               - capacidad_maxima
 *               - tarifa_base
 *             properties:
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Salón Imperial
 *               capacidad_maxima:
 *                 type: integer
 *                 example: 250
 *               tarifa_base:
 *                 type: number
 *                 example: 3500
 *               descripcion:
 *                 type: string
 *                 nullable: true
 *                 example: Salón principal para bodas y eventos ejecutivos
 *     responses:
 *       201:
 *         description: Salón creado correctamente
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
 *                   example: Salón creado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Salon'
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
 *       404:
 *         description: La sucursal indicada no existe
 *       422:
 *         description: La sucursal se encuentra inactiva
 */
router.post(
  "/",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateBody(createSalonSchema),
  salonController.create
);


/**
 * @openapi
 * /api/salones/{id}:
 *   patch:
 *     tags:
 *       - Salones
 *     summary: Actualizar un salón
 *     description: Actualiza parcialmente un salón. Requiere rol administrador.
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
 *               sucursal_id:
 *                 type: integer
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Salón Imperial Renovado
 *               capacidad_maxima:
 *                 type: integer
 *                 example: 300
 *               tarifa_base:
 *                 type: number
 *                 example: 4000
 *               descripcion:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Salón actualizado correctamente
 *       400:
 *         description: Datos o ID inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Salón o sucursal no encontrada
 *       422:
 *         description: La sucursal indicada está inactiva
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN),
  validateParams(idParamSchema),
  validateBody(updateSalonSchema),
  salonController.update
);

/**
 * @openapi
 * /api/salones/{id}:
 *   delete:
 *     tags:
 *       - Salones
 *     summary: Eliminar un salón
 *     description: Elimina el salón únicamente si no posee reservas de eventos asociadas.
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
 *         description: Salón eliminado correctamente
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario sin permisos
 *       404:
 *         description: Salón no encontrado
 *       409:
 *         description: El salón tiene reservas asociadas y no puede eliminarse
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
  salonController.remove
);

export default router;