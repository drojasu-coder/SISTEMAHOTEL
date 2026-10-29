import { Router } from "express";

import * as mesaController from "../../controllers/restaurante/mesa.controller";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ROLES } from "../../constants/roles";

import {
  createMesaSchema,
  updateMesaSchema,
  disponibilidadMesaQuerySchema,
} from "../../validators/restaurante/mesa.validator";

import { idParamSchema } from "../../validators/common.validator";

const router = Router();

/**
 * @openapi
 * /api/mesas:
 *   get:
 *     tags:
 *       - Mesas
 *     summary: Listar mesas
 *     description: Obtiene todas las mesas disponibles en el restaurante junto con los datos de su sucursal.
 *     responses:
 *       200:
 *         description: Mesas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MesasResponse'
 */
router.get(
  "/",
  mesaController.getAll
);

/**
 * @openapi
 * /api/mesas/configuracion:
 *   get:
 *     tags:
 *       - Mesas
 *     summary: Obtener la configuración y horarios del restaurante
 *     responses:
 *       200:
 *         description: Configuración obtenida correctamente
 */
router.get(
  "/configuracion",
  mesaController.getConfiguracion
);

/**
 * @openapi
 * /api/mesas/{id}/disponibilidad:
 *   get:
 *     tags:
 *       - Mesas
 *     summary: Consultar disponibilidad de franjas horarias de una mesa
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Disponibilidad de franjas horarias obtenida correctamente
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Mesa no encontrada
 */
router.get(
  "/:id/disponibilidad",
  validateParams(idParamSchema),
  validateQuery(disponibilidadMesaQuerySchema),
  mesaController.getDisponibilidad
);

/**
 * @openapi
 * /api/mesas/{id}:
 *   get:
 *     tags:
 *       - Mesas
 *     summary: Obtener una mesa por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Mesa obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MesaResponse'
 *       400:
 *         description: Parámetro de ruta inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Mesa no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       */
router.get(
  "/:id",
  validateParams(idParamSchema),
  mesaController.getById
);


/**
 * @openapi
 * /api/mesas:
 *   post:
 *     tags:
 *       - Mesas
 *     summary: Crear una mesa
 *     description: Crea una nueva mesa. Requiere rol administrador o gerente de restaurante.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMesaRequest'
 *     responses:
 *       201:
 *         description: Mesa creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MesaResponse'
 *       400:
 *         description: Datos enviados inválidos o incompletos
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
 *         description: Permisos insuficientes (requiere admin o gerente_restaurante)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: La sucursal indicada no existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/",
  authMiddleware,
  requireRole(ROLES.ADMIN, 'gerente_restaurante'),
  validateBody(createMesaSchema),
  mesaController.create
);

/**
 * @openapi
 * /api/mesas/{id}:
 *   patch:
 *     tags:
 *       - Mesas
 *     summary: Actualizar una mesa
 *     description: Actualiza una mesa existente. Requiere rol administrador o gerente de restaurante. No admite sucursal_id y exige al menos un campo permitido.
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
 *             $ref: '#/components/schemas/UpdateMesaRequest'
 *     responses:
 *       200:
 *         description: Mesa actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MesaResponse'
 *       400:
 *         description: Datos enviados inválidos, cuerpo vacío o parámetros incorrectos
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
 *         description: Permisos insuficientes (requiere admin o gerente_restaurante)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Mesa no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN, 'gerente_restaurante'),
  validateParams(idParamSchema),
  validateBody(updateMesaSchema),
  mesaController.update
);

/**
 * @openapi
 * /api/mesas/{id}:
 *   delete:
 *     tags:
 *       - Mesas
 *     summary: Eliminar una mesa
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
 *         description: Mesa eliminada correctamente
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(ROLES.ADMIN, 'gerente_restaurante'),
  validateParams(idParamSchema),
  mesaController.remove
);

export default router;
