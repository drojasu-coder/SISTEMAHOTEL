import { Router } from "express";
import * as controller from "../../controllers/pagos/pago.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { PAYMENT_ADMINISTRATIVE_ROLES } from "../../utils/paymentOwnership";
import { createPagoSchema, pagoIdSchema, pagoQuerySchema, resumenPagoQuerySchema } from "../../validators/pagos/pago.validator";

const router = Router();
const managementRoles = PAYMENT_ADMINISTRATIVE_ROLES;
router.use(authMiddleware);

/**
 * @openapi
 * /api/pagos/stripe/webhook:
 *   post:
 *     tags: [Pagos]
 *     summary: Webhook de Stripe
 *     description: Endpoint externo firmado por Stripe; no requiere JWT.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json: {}
 *     responses:
 *       200: { description: Evento recibido }
 *       400: { description: Firma inválida }
 */

/**
 * @openapi
 * /api/pagos:
 *   post:
 *     tags: [Pagos]
 *     summary: Crear un pago
 *     description: >
 *       Registra un pago según el origen indicado. Los pagos con tarjeta crean
 *       un PaymentIntent en Stripe Test Mode y
 *       permanecen procesando hasta recibir confirmación por webhook.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             efectivo:
 *               summary: Pago en efectivo
 *               value:
 *                 carrito_id: 21
 *                 reserva_habitacion_id: null
 *                 monto: 1000
 *                 metodo: efectivo
 *                 tipo_pago: total
 *                 moneda: GTQ
 *                 idempotency_key: swagger-efectivo-001
 *             transferencia:
 *               summary: Transferencia pendiente de aprobación
 *               value:
 *                 carrito_id: 22
 *                 reserva_habitacion_id: null
 *                 monto: 5000
 *                 metodo: transferencia
 *                 tipo_pago: anticipo
 *                 moneda: GTQ
 *                 idempotency_key: swagger-transfer-001
 *             tarjeta:
 *               summary: Pago con tarjeta
 *               value:
 *                 carrito_id: 21
 *                 reserva_habitacion_id: null
 *                 monto: 1000
 *                 metodo: tarjeta
 *                 tipo_pago: saldo
 *                 moneda: GTQ
 *                 idempotency_key: swagger-card-001
 *     responses:
 *       201:
 *         description: Pago creado correctamente
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 pago_id: 42
 *                 payment_intent_id: pi_test_example
 *                 client_secret: pi_test_example_secret_example
 *                 estado: procesando
 *                 monto: 1000
 *                 moneda: GTQ
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Carrito o reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Datos de pago o método no válidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: El pago no puede aplicarse
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", validateBody(createPagoSchema), controller.create);

/**
 * @openapi
 * /api/pagos:
 *   get:
 *     tags: [Pagos]
 *     summary: Listar pagos con filtros
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, procesando, aprobado, rechazado, cancelado, reembolsado, reembolsado_parcial]
 *       - { in: query, name: metodo, schema: { type: string, enum: [tarjeta, efectivo, transferencia] } }
 *       - { in: query, name: tipo_pago, schema: { type: string, enum: [total, anticipo, saldo] } }
 *       - { in: query, name: carrito_id, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: reserva_habitacion_id, schema: { type: integer, minimum: 1 } }
 *     responses:
 *       200: { description: Pagos obtenidos correctamente }
 *       400:
 *         description: Filtros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.get("/", validateQuery(pagoQuerySchema), controller.getAll);

/**
 * @openapi
 * /api/pagos/resumen:
 *   get:
 *     tags: [Pagos]
 *     summary: Obtener resumen financiero
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: carrito_id, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: reserva_habitacion_id, schema: { type: integer, minimum: 1 } }
 *     responses:
 *       200:
 *         description: Resumen de pago obtenido correctamente
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: Resumen de pago obtenido correctamente
 *               data:
 *                 total: 10000
 *                 anticipo_requerido: 5000
 *                 aprobado: 5000
 *                 saldo: 5000
 *       404:
 *         description: Carrito o reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Debe indicarse exactamente un origen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/resumen", validateQuery(resumenPagoQuerySchema), controller.resumen);

/**
 * @openapi
 * /api/pagos/{id}/aprobar-transferencia:
 *   post:
 *     tags: [Pagos]
 *     summary: Aprobar una transferencia pendiente
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Transferencia aprobada correctamente }
 *       404:
 *         description: Pago, carrito o reserva no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: El pago no es una transferencia aprobable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403: { description: Usuario sin permisos, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.post("/:id/aprobar-transferencia", requireRole(...managementRoles), validateParams(pagoIdSchema), controller.aprobarTransferencia);

/**
 * @openapi
 * /api/pagos/{id}:
 *   get:
 *     tags: [Pagos]
 *     summary: Obtener un pago por ID
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200: { description: Pago obtenido correctamente }
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404: { description: Pago no encontrado, content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
 */
router.get("/:id", validateParams(pagoIdSchema), controller.getById);

export default router;
