import {
  Router,
} from "express";

import * as carritoItemController
  from "../../controllers/carrito/carritoItem.controller";

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
  carritoParamSchema,
  carritoItemParamsSchema,
  createCarritoItemSchema,
} from "../../validators/carrito/carritoItem.validator";

const router = Router({
  mergeParams: true,
});

router.use(
  authMiddleware
);

/**
 * @openapi
 * /api/carritos/{carritoId}/items:
 *   get:
 *     tags:
 *       - Ítems de Carrito
 *     summary: Listar los ítems de un carrito
 *     description: >
 *       Obtiene todos los ítems asociados a un carrito y calcula
 *       automáticamente el total. Los clientes únicamente pueden
 *       consultar sus propios carritos. Los administradores pueden
 *       consultar cualquier carrito.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carritoId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del carrito
 *     responses:
 *       200:
 *         description: Ítems del carrito obtenidos correctamente
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
 *                   example: Ítems del carrito obtenidos correctamente
 *                 data:
 *                   $ref: '#/components/schemas/CarritoItemsData'
 *       400:
 *         description: ID del carrito inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: Token de autenticación requerido o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: El usuario no tiene permisos para consultar el carrito
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
  "/",
  validateParams(
    carritoParamSchema
  ),
  carritoItemController.getAll
);

/**
 * @openapi
 * /api/carritos/{carritoId}/items/{id}:
 *   get:
 *     tags:
 *       - Ítems de Carrito
 *     summary: Obtener un ítem del carrito por ID
 *     description: >
 *       Obtiene un ítem específico de un carrito. El cliente
 *       únicamente puede consultar ítems de sus propios carritos,
 *       mientras que un administrador puede consultar cualquier carrito.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carritoId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del carrito
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del ítem
 *     responses:
 *       200:
 *         description: Ítem del carrito obtenido correctamente
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
 *                   example: Ítem del carrito obtenido correctamente
 *                 data:
 *                   $ref: '#/components/schemas/CarritoItem'
 *       400:
 *         description: Alguno de los identificadores es inválido
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
 *         description: Carrito o ítem no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:id",
  validateParams(
    carritoItemParamsSchema
  ),
  carritoItemController.getById
);

/**
 * @openapi
 * /api/carritos/{carritoId}/items:
 *   post:
 *     tags:
 *       - Ítems de Carrito
 *     summary: Agregar un ítem al carrito
 *     description: >
 *       Agrega una reserva o servicio al carrito activo del cliente.
 *       El precio, descripción, cantidad, usuario y carrito son
 *       determinados y validados por el backend. El frontend únicamente
 *       envía el tipo de ítem y la referencia correspondiente.
 *
 *       Una misma referencia no puede agregarse dos veces al mismo carrito.
 *       La referencia debe existir, pertenecer al propietario del carrito
 *       y encontrarse disponible.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carritoId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del carrito activo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCarritoItemRequest'
 *           example:
 *             tipo_item: evento
 *             referencia_id: 6
 *     responses:
 *       201:
 *         description: Ítem agregado al carrito correctamente
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
 *                   example: Ítem agregado al carrito correctamente
 *                 data:
 *                   $ref: '#/components/schemas/CarritoItem'
 *       400:
 *         description: Datos o identificadores inválidos
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
 *         description: >
 *           El carrito o la referencia pertenecen a otro usuario,
 *           o el usuario no tiene permisos para modificar el carrito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Carrito o referencia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: >
 *           Carrito no activo, referencia no disponible
 *           o referencia ya agregada al carrito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: >
 *           No existe una tarifa configurada para la referencia
 *           o no fue posible determinar un precio válido
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
  validateParams(
    carritoParamSchema
  ),
  validateBody(
    createCarritoItemSchema
  ),
  carritoItemController.create
);

/**
 * @openapi
 * /api/carritos/{carritoId}/items/{id}:
 *   delete:
 *     tags:
 *       - Ítems de Carrito
 *     summary: Eliminar un ítem del carrito
 *     description: >
 *       Elimina un ítem de un carrito activo. Solo el cliente
 *       propietario del carrito puede realizar esta operación.
 *       Un carrito expirado o pagado ya no puede modificarse.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carritoId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del carrito
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del ítem a eliminar
 *     responses:
 *       204:
 *         description: Ítem eliminado correctamente
 *       400:
 *         description: Alguno de los identificadores es inválido
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
 *         description: El usuario no tiene permisos para modificar el carrito
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Carrito o ítem no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: El carrito ya no se encuentra activo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id",
  requireRole(
    ROLES.CLIENTE
  ),
  validateParams(
    carritoItemParamsSchema
  ),
  carritoItemController.remove
);

export default router;