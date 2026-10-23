import { Router } from "express";
import * as controller from "../../controllers/pagos/pago.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { PAYMENT_ADMINISTRATIVE_ROLES } from "../../utils/paymentOwnership";
import {
  createPagoSchema,
  createReembolsoSchema,
  intentoActivoQuerySchema,
  pagoIdSchema,
  pagoQuerySchema,
  resumenPagoQuerySchema,
} from "../../validators/pagos/pago.validator";

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
 *           schema:
 *             $ref: '#/components/schemas/CreatePagoRequest'
 *     responses:
 *       201:
 *         description: Pago creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreatePagoResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Carrito o reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: El pago excede el saldo o conflicto de idempotencia
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
 *       200:
 *         description: Pagos obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PagosResponse'
 *       400:
 *         description: Filtros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *             schema:
 *               $ref: '#/components/schemas/ResumenPagoResponse'
 *       400:
 *         description: Parámetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 * /api/pagos/intento-activo:
 *   get:
 *     tags: [Pagos]
 *     summary: Recuperar intento de pago activo con tarjeta
 *     description: >
 *       Consulta de solo lectura que recupera el intento de pago con tarjeta en curso
 *       para un carrito o reserva de habitación, verificando su estado real en Stripe.
 *       Si no existe un intento activo o en trámite, retorna data: null.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: carrito_id, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: reserva_habitacion_id, schema: { type: integer, minimum: 1 } }
 *     responses:
 *       200:
 *         description: Intento de pago activo obtenido o verificado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IntentoActivoPagoResponse'
 *       400:
 *         description: Parámetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Carrito o reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: Error al consultar Stripe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/intento-activo", validateQuery(intentoActivoQuerySchema), controller.intentoActivo);

/**
 * @openapi
 * /api/pagos/{id}/aprobar-transferencia:
 *   post:
 *     tags: [Pagos]
 *     summary: Aprobar una transferencia pendiente
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     responses:
 *       200:
 *         description: Transferencia aprobada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PagoResponse'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: No autenticado
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
 *         description: Pago no encontrado
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
 *       200:
 *         description: Pago obtenido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PagoResponse'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Pago no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", validateParams(pagoIdSchema), controller.getById);

/**
 * @openapi
 * /api/pagos/{id}/reembolso:
 *   post:
 *     tags: [Pagos]
 *     summary: Reembolsar un pago
 *     description: Permite realizar el reembolso parcial o total de un pago aprobado.
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [monto, idempotency_key]
 *             properties:
 *               monto: { type: number, minimum: 0.01 }
 *               motivo: { type: string }
 *               idempotency_key: { type: string }
 *           example:
 *             monto: 500
 *             motivo: "Solicitud del cliente"
 *             idempotency_key: "refund-test-001"
 *     responses:
 *       200: { description: Reembolso procesado correctamente }
 *       400: { description: Datos inválidos }
 *       401: { description: No autenticado }
 *       403: { description: Permisos insuficientes (INSUFFICIENT_PERMISSIONS) }
 *       404: { description: Pago no encontrado }
 *       409: { description: Conflicto de negocio (monto excede el pagado) }
 *       422: { description: Regla de negocio no cumplida }
 */
router.post("/:id/reembolso", requireRole(...managementRoles), validateParams(pagoIdSchema), validateBody(createReembolsoSchema), controller.reembolso);

export default router;
