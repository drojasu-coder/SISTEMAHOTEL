import {
  Router,
} from "express";

import * as controller
  from "../../controllers/parque/boletoParque.controller";

import {
  validateBody,
  validateParams,
} from "../../middlewares/validate.middleware";

import {
  authMiddleware,
} from "../../middlewares/auth.middleware";

import {
  requireRole,
} from "../../middlewares/role.middleware";

import {
  ROLES,
} from "../../constants/roles";

import {
  createBoletoParqueSchema,
  updateBoletoParqueSchema,
} from "../../validators/parque/boletoParque.validator";

import {
  idParamSchema,
} from "../../validators/common.validator";

const router =
  Router();

router.use(
  authMiddleware
);


/**
 * @openapi
 * /api/boletos-parque:
 *   post:
 *     tags:
 *       - Boletos de Parque
 *     summary: Adquirir un boleto para el parque
 *     description: >
 *       Permite a un cliente autenticado adquirir un boleto para una
 *       fecha determinada. El usuario se obtiene automáticamente del JWT.
 *       El precio es calculado por el backend según el tipo de boleto,
 *       por lo que el cliente no puede modificarlo. También se genera
 *       automáticamente un código QR único y el boleto inicia en estado valido.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBoletoParqueRequest'
 *           example:
 *             tipo_boleto: adulto
 *             fecha_visita: "2026-10-25"
 *     responses:
 *       201:
 *         description: Boleto creado correctamente
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
 *                   example: Boleto de parque creado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/BoletoParque'
 *       400:
 *         description: Tipo de boleto, formato o datos inválidos
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
 *         description: Solo los usuarios con rol cliente pueden adquirir boletos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: La fecha de visita se encuentra en el pasado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  requireRole(
    ROLES.CLIENTE
  ),
  validateBody(
    createBoletoParqueSchema
  ),
  controller.create
);


/**
 * @openapi
 * /api/boletos-parque:
 *   get:
 *     tags:
 *       - Boletos de Parque
 *     summary: Listar todos los boletos del parque
 *     description: >
 *       Obtiene todos los boletos registrados junto con información
 *       básica del usuario propietario. Solo disponible para administradores.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Boletos obtenidos correctamente
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
 *                   example: Boletos de parque obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoletoParque'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Solo administradores
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  requireRole(
    ROLES.ADMIN
  ),
  controller.getAll
);

/**
 * @openapi
 * /api/boletos-parque/{id}:
 *   get:
 *     tags:
 *       - Boletos de Parque
 *     summary: Obtener un boleto por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del boleto
 *     responses:
 *       200:
 *         description: Boleto obtenido correctamente
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
 *                   example: Boleto de parque obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/BoletoParque'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Boleto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  requireRole(
    ROLES.ADMIN
  ),
  validateParams(
    idParamSchema
  ),
  controller.getById
);

/**
 * @openapi
 * /api/boletos-parque/{id}/estado:
 *   patch:
 *     tags:
 *       - Boletos de Parque
 *     summary: Actualizar el estado de un boleto
 *     description: >
 *       Permite al administrador actualizar el estado de un boleto.
 *       Un boleto usado o cancelado se considera en estado final y
 *       posteriormente ya no puede modificarse.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del boleto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBoletoParqueEstadoRequest'
 *           example:
 *             estado: usado
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
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
 *                   example: Estado del boleto actualizado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/BoletoParque'
 *       400:
 *         description: Estado o ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Boleto no encontrado
 *       409:
 *         description: >
 *           El boleto ya posee ese estado o se encuentra en un
 *           estado final y no puede modificarse
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id/estado",
  requireRole(
    ROLES.ADMIN
  ),
  validateParams(
    idParamSchema
  ),
  validateBody(
    updateBoletoParqueSchema
  ),
  controller.updateStatus
);

/**
 * @openapi
 * /api/boletos-parque/{id}:
 *   delete:
 *     tags:
 *       - Boletos de Parque
 *     summary: Eliminar un boleto del parque
 *     description: Solo los administradores pueden eliminar boletos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del boleto
 *     responses:
 *       204:
 *         description: Boleto eliminado correctamente
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Boleto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  requireRole(
    ROLES.ADMIN
  ),
  validateParams(
    idParamSchema
  ),
  controller.remove
);

export default router;