import { Router }
  from "express";

import * as carritoController
  from "../../controllers/carrito/carrito.controller";

import {
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware";
import { z } from "zod";

import { authMiddleware }
  from "../../middlewares/auth.middleware";

import { requireRole }
  from "../../middlewares/role.middleware";

import { ROLES }
  from "../../constants/roles";

import { idParamSchema }
  from "../../validators/common.validator";

const router = Router();

const estadoReferenciaQuerySchema = z
  .object({
    tipo_item: z.enum(["evento", "actividad", "bienestar"]),
    referencia_id: z.string().regex(/^\d+$/).transform(Number).refine((id) => Number.isSafeInteger(id) && id > 0),
  })
  .strict();

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
 *               $ref: '#/components/schemas/CarritosResponse'
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
 *               $ref: '#/components/schemas/CarritoResponse'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 * /api/carritos/estado-referencia:
 *   get:
 *     tags:
 *       - Carrito
 *     summary: Estado de carrito y pago de una reserva propia
 *     description: >
 *       Solo lectura y exclusivo del cliente titular. Indica si la reserva de evento, actividad o
 *       bienestar ya está pagada (o con pago parcial), tiene un pago en procesamiento o ya está en su
 *       carrito activo, con las mismas reglas que impiden agregarla a otro carrito. No crea ni modifica
 *       carritos ni pagos. Una reserva ajena o inexistente responde 404.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo_item
 *         required: true
 *         schema: { type: string, enum: [evento, actividad, bienestar] }
 *       - in: query
 *         name: referencia_id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Estado de la reserva
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   required: [estado, carrito_id]
 *                   properties:
 *                     estado: { type: string, enum: [pagada, anticipo_pagado, pago_parcial, procesando, en_carrito, pagable] }
 *                     carrito_id: { type: integer, nullable: true }
 *                     montos:
 *                       type: object
 *                       description: Solo eventos. Importes del servidor netos de reembolsos aprobados.
 *                       properties:
 *                         total: { type: number }
 *                         anticipo_requerido: { type: number }
 *                         aprobado: { type: number }
 *                         en_proceso: { type: number }
 *                         saldo: { type: number }
 *       404:
 *         description: Reserva inexistente o ajena
 */
router.get(
  "/estado-referencia",
  requireRole(
    ROLES.CLIENTE
  ),
  validateQuery(
    estadoReferenciaQuerySchema
  ),
  carritoController.getEstadoReferencia
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
 *               $ref: '#/components/schemas/CarritoResponse'
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
 *               $ref: '#/components/schemas/CarritoResponse'
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
