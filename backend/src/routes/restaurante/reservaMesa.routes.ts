import { Router } from "express";
import * as controller from "../../controllers/restaurante/reservaMesa.controller";
import { validateBody, validateParams } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";
import { createReservaMesaSchema, updateReservaMesaSchema } from "../../validators/restaurante/reservaMesa.validator";
import { idParamSchema } from "../../validators/common.validator";

const router = Router();

// Todas las reservas requieren inicio de sesión
router.use(authMiddleware);

/**
 * @openapi
 * /api/reservas-mesa:
 *   post:
 *     tags:
 *       - Reservas de Mesa
 *     summary: Crear una reserva de mesa
 *     description: >
 *       Permite a un cliente autenticado reservar una mesa.
 *       El usuario se obtiene automáticamente del JWT.
 *       La mesa debe existir, tener capacidad suficiente y no
 *       encontrarse reservada en la misma fecha y hora.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservaMesaRequest'
 *     responses:
 *       201:
 *         description: Reserva creada correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo los clientes pueden reservar
 *       404:
 *         description: Mesa no encontrada
 *       409:
 *         description: La mesa ya está reservada en esa fecha y hora
 *       422:
 *         description: Fecha pasada o capacidad de la mesa excedida
 */
// Cualquier usuario puede crear una reserva para sí mismo
router.post(
  "/",
  requireRole(
    ROLES.CLIENTE
  ),
  validateBody(
    createReservaMesaSchema
  ),
  controller.create
);

/**
 * @openapi
 * /api/reservas-mesa:
 *   get:
 *     tags:
 *       - Reservas de Mesa
 *     summary: Listar todas las reservas de mesa
 *     description: Solo disponible para administradores.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReservaMesa'
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Permisos insuficientes
 */
// Solo el Admin (o Gerente) puede ver TODAS las reservas del restaurante
router.get("/", requireRole(ROLES.ADMIN), controller.getAll);
/**
 * @openapi
 * /api/reservas-mesa/{id}:
 *   get:
 *     tags:
 *       - Reservas de Mesa
 *     summary: Obtener una reserva de mesa por ID
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
 *       200:
 *         description: Reserva encontrada
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Reserva no encontrada
 */
router.get("/:id", requireRole(ROLES.ADMIN), validateParams(idParamSchema), controller.getById);

/**
 * @openapi
 * /api/reservas-mesa/{id}/estado:
 *   patch:
 *     tags:
 *       - Reservas de Mesa
 *     summary: Cambiar el estado de una reserva de mesa
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
 *             $ref: '#/components/schemas/UpdateReservaMesaEstadoRequest'
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Usuario no autenticado
 *       403:
 *         description: Solo administradores
 *       404:
 *         description: Reserva no encontrada
 *       409:
 *         description: La reserva ya posee el estado solicitado
 */
router.patch("/:id/estado", requireRole(ROLES.ADMIN), validateParams(idParamSchema), validateBody(updateReservaMesaSchema), controller.updateStatus);

export default router;