import { Router }
  from "express";

import * as carritoController
  from "../../controllers/carrito/carrito.controller";

import {
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

const router = Router();

router.use(
  authMiddleware
);

/**
 * @openapi
 * /api/carritos:
 *   get:
 *     tags:
 *       - Carritos
 *     summary: Listar carritos
 *     description: >
 *       Los clientes obtienen únicamente sus propios carritos.
 *       Los administradores pueden consultar todos los carritos registrados,
 *       incluyendo activos, expirados y pagados.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carritos obtenidos correctamente
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
 *                   example: Carritos obtenidos correctamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Carrito'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario inactivo o sin autorización
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/",
  carritoController.getAll
);

/*
 * Debe ir ANTES de /:id,
 * o Express podría interpretar "actual" como ID.
 */

/**
 * @openapi
 * /api/carritos/actual:
 *   get:
 *     tags:
 *       - Carritos
 *     summary: Obtener el carrito activo del usuario
 *     description: >
 *       Obtiene el carrito activo del usuario autenticado. Antes de responder,
 *       el sistema verifica automáticamente si el carrito ya alcanzó su fecha
 *       de expiración. Si está vencido, cambia su estado a expirado.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito activo obtenido correctamente
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
 *                   example: Carrito activo obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Carrito'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Usuario inactivo
 *       404:
 *         description: El usuario no posee un carrito activo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/actual",
  carritoController.getCurrent
);

/**
 * @openapi
 * /api/carritos/{id}:
 *   get:
 *     tags:
 *       - Carritos
 *     summary: Obtener un carrito por ID
 *     description: >
 *       Un cliente únicamente puede consultar sus propios carritos.
 *       Los administradores pueden consultar cualquier carrito.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del carrito
 *     responses:
 *       200:
 *         description: Carrito obtenido correctamente
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
 *                   example: Carrito obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Carrito'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: El carrito pertenece a otro usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Carrito no encontrado
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
  carritoController.getById
);

/**
 * @openapi
 * /api/carritos:
 *   post:
 *     tags:
 *       - Carritos
 *     summary: Crear un carrito
 *     description: >
 *       Crea un carrito activo para el cliente autenticado. El usuario,
 *       estado y fecha de expiración son establecidos automáticamente
 *       por el backend. Un usuario no puede tener más de un carrito
 *       activo simultáneamente.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Carrito creado correctamente
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
 *                   example: Carrito creado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/Carrito'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Solo los usuarios con rol cliente pueden crear carritos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: El usuario ya posee un carrito activo
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
  carritoController.create
);

export default router;